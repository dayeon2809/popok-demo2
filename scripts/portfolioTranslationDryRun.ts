import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const RULE_VERSION = "2026-08-06.1";
const MODEL = "gpt-4.1-mini";
const OUTPUT_ROOT = path.join(process.cwd(), "artifacts", "portfolio-translation");
const GLOSSARY_PATH = path.join(process.cwd(), "config", "portfolio-translation-glossary.json");
const STORAGE_MAP_PATH = path.join(process.cwd(), "config", "portfolio-translation-storage-map.json");
const MAX_COST_USD = 1;
const INPUT_USD_PER_M = 0.4;
const OUTPUT_USD_PER_M = 1.6;
const BATCH_SIZE = 20;
const MAX_RETRIES = 2;

type Status = "pending" | "existing" | "translated" | "skipped" | "failed";
type Item = {
  job_id: string; record_id: string; parent_record_id: string; content_type: string;
  json_path: string; field_name: string; source_ko: string; existing_en: string;
  suggested_en: string; status: Status; needs_review: boolean; review_reason: string;
  source_hash: string; approved: false; cache_group: string; retry_count: number;
};
type Checkpoint = {
  job_id: string; created_at: string; updated_at: string; model: string; rule_version: string;
  stage: "scanned" | "translating" | "translated" | "validated"; scan_file: string;
  translations: Record<string, { suggested_en: string; needs_review: boolean; review_reason: string; input_tokens: number; output_tokens: number; retries: number }>;
  failures: Record<string, string>; usage: { input_tokens: number; output_tokens: number };
};

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const isEnglishOnly = (value: string) => /[A-Za-z]/.test(value) && !/[가-힣]/.test(value);
const isDateOrNumber = (value: string) => /^[\d\s.,:/~+\-–—년월일()]+$/.test(value);
const normalizeSource = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
const hashFor = (source: string, cacheGroup: string, fieldName: string) => crypto.createHash("sha256").update(`${RULE_VERSION}\n${cacheGroup}\n${fieldName}\n${normalizeSource(source)}`).digest("hex");
const sha = (value: unknown) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const now = () => new Date().toISOString();
const jobId = () => `portfolio-en-${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`;
const jobDir = (id: string) => path.join(OUTPUT_ROOT, id);
const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file: string, data: unknown) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");

function latestJob(): string {
  if (!fs.existsSync(OUTPUT_ROOT)) throw new Error("No translation job exists. Run scan first.");
  const dirs = fs.readdirSync(OUTPUT_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (!dirs.length) throw new Error("No translation job exists. Run scan first.");
  return dirs.at(-1)!;
}

function parseArgs() {
  const [command = "", ...rest] = process.argv.slice(2);
  const value = (name: string) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : ""; };
  const artistIds = value("--artist-ids").split(",").map((id) => id.trim()).filter(Boolean);
  return { command, job: value("--job") || rest.find((argument) => !argument.startsWith("-")) || "", artistIds };
}

function addItem(items: Item[], input: Omit<Item, "job_id" | "suggested_en" | "status" | "needs_review" | "review_reason" | "source_hash" | "approved" | "retry_count"> & { job_id: string }) {
  const source = clean(input.source_ko);
  if (!source) return;
  const existing = clean(input.existing_en);
  let status: Status = "pending";
  let reason = "";
  if (existing) status = "existing";
  else if (isEnglishOnly(source)) { status = "skipped"; reason = "already_english_only"; }
  else if (isDateOrNumber(source)) { status = "skipped"; reason = "date_or_number_only"; }
  const sourceHash = hashFor(source, input.cache_group, input.field_name);
  const inherentlyRisky = /name|title|institution|organization|venue|festival|credit/i.test(input.field_name) || /work/.test(input.content_type);
  const mixedLanguage = /[가-힣]/.test(source) && /[A-Za-z]/.test(source);
  items.push({ ...input, source_ko: source, existing_en: existing, suggested_en: existing, status,
    needs_review: status === "pending" && (inherentlyRisky || mixedLanguage || source.length >= 500),
    review_reason: status === "pending" ? [inherentlyRisky && "proper_name_or_title", mixedLanguage && "mixed_language", source.length >= 500 && "long_text"].filter(Boolean).join(";") : reason,
    source_hash: sourceHash, approved: false, retry_count: 0 });
}

function addScalar(items: Item[], job: string, parent: string, type: string, pathName: string, field: string, source: unknown, existing: unknown, cacheGroup = type) {
  addItem(items, { job_id: job, record_id: parent, parent_record_id: parent, content_type: type, json_path: pathName, field_name: field, source_ko: clean(source), existing_en: clean(existing), cache_group: cacheGroup });
}

function addObjectField(items: Item[], job: string, parent: string, type: string, base: string, object: any, ko: string, en: string, cacheGroup: string, recordId: string) {
  addItem(items, { job_id: job, record_id: recordId, parent_record_id: parent, content_type: type, json_path: `${base}.${en}`, field_name: ko, source_ko: clean(object?.[ko]), existing_en: clean(object?.[en]), cache_group: cacheGroup });
}

async function fetchAll(supabase: any, table: "artists" | "companies", select: string) {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + 999);
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

function extractArtist(items: Item[], job: string, artist: any) {
  const id = String(artist.id);
  addScalar(items, job, id, "artist", "name_en", "name", artist.name, artist.name_en, "artist_name");
  addScalar(items, job, id, "artist", "introduction_en", "bio_short", artist.bio_short, artist.introduction_en, "profile_short");
  addScalar(items, job, id, "artist", "bio_en", "bio", artist.bio, artist.bio_en, "profile_long");
  for (const [index, work] of (Array.isArray(artist.works) ? artist.works : []).entries()) {
    const base = `works[${index}]`; const rid = `${id}:works:${index}`;
    const hasTranslatableWorkText = !!(clean(work?.title) || clean(work?.description) || clean(work?.role));
    if (work?.kind === "popok_registration_media" || !hasTranslatableWorkText) {
      const reason = work?.kind === "popok_registration_media" ? "excluded_profile_media_item" : "excluded_empty_legacy_work_item";
      items.push({ job_id: job, record_id: rid, parent_record_id: id, content_type: "artist_work_media", json_path: base, field_name: "special_media_item", source_ko: "[excluded profile media item]", existing_en: "", suggested_en: "", status: "skipped", needs_review: false, review_reason: reason, source_hash: hashFor(rid, "excluded", "media"), approved: false, cache_group: "excluded", retry_count: 0 }); continue;
    }
    addObjectField(items, job, id, "artist_work", base, work, "title", "title_en", "work_title", rid);
    addObjectField(items, job, id, "artist_work", base, work, "description", "description_en", "work_description", rid);
    addObjectField(items, job, id, "artist_work", base, work, "role", "role_en", "role", rid);
    for (const [creditIndex, credit] of (Array.isArray(work?.credits) ? work.credits : []).entries()) addObjectField(items, job, id, "artist_work_credit", `${base}.credits[${creditIndex}]`, credit, "role", "role_en", "credit_role", `${rid}:credits:${creditIndex}`);
  }
  const objectColumns = [
    ["affiliations", [["name", "organization_en", "institution"], ["position", "title_en", "role"], ["description", "description_en", "career_description"], ["role", "role_en", "role"]]],
    ["awards", [["title", "title_en", "award_title"], ["organization", "organization_en", "institution"], ["description", "description_en", "award_description"], ["result", "result_en", "award_result"]]],
    ["competitions", [["title", "title_en", "competition_title"], ["organization", "organization_en", "institution"], ["description", "description_en", "competition_description"], ["result", "result_en", "competition_result"]]],
  ] as const;
  for (const [column, fields] of objectColumns) for (const [index, value] of (Array.isArray(artist[column]) ? artist[column] : []).entries()) for (const [ko, en, group] of fields) addObjectField(items, job, id, `artist_${column}`, `${column}[${index}]`, value, ko, en, group, `${id}:${column}:${index}`);
  for (const column of ["current_activity", "education"] as const) for (const [index, value] of (Array.isArray(artist[column]) ? artist[column] : []).entries()) {
    if (typeof value === "string") addScalar(items, job, `${id}:${column}:${index}`, `artist_${column}`, `${column}_en[${index}]`, column, value, artist[`${column}_en`]?.[index], column);
    else for (const [ko, en, group] of [["title", "title_en", `${column}_title`], ["organization", "organization_en", "institution"], ["description", "description_en", `${column}_description`], ["role", "role_en", "role"]]) addObjectField(items, job, id, `artist_${column}`, `${column}[${index}]`, value, ko, en, group, `${id}:${column}:${index}`);
  }
}

function extractCompany(items: Item[], job: string, company: any) {
  const id = String(company.id);
  addScalar(items, job, id, "company", "name_en", "name", company.name, company.name_en, "company_name");
  addScalar(items, job, id, "company", "introduction_en", "bio_short", company.bio_short, company.introduction_en, "profile_short");
  addScalar(items, job, id, "company", "bio_en", "bio", company.bio, company.bio_en, "profile_long");
  addScalar(items, job, id, "company", "mission_en", "mission", company.mission, company.mission_en, "mission");
  addScalar(items, job, id, "company", "vision_en", "vision", company.vision, company.vision_en, "vision");
  for (const [index, value] of (Array.isArray(company.core_values) ? company.core_values : []).entries()) addScalar(items, job, `${id}:core_values:${index}`, "company_core_value", `core_values_en[${index}]`, "core_value", typeof value === "string" ? value : value?.title, company.core_values_en?.[index], "core_value");
  for (const [index, work] of (Array.isArray(company.works) ? company.works : []).entries()) {
    const base = `works[${index}]`; const rid = `${id}:works:${index}`;
    addObjectField(items, job, id, "company_work", base, work, "title", "title_en", "work_title", rid);
    addObjectField(items, job, id, "company_work", base, work, "description", "description_en", "work_description", rid);
    addObjectField(items, job, id, "company_work", base, work, "role", "role_en", "role", rid);
    for (const [creditIndex, credit] of (Array.isArray(work?.credits) ? work.credits : []).entries()) addObjectField(items, job, id, "company_work_credit", `${base}.credits[${creditIndex}]`, credit, "role", "role_en", "credit_role", `${rid}:credits:${creditIndex}`);
  }
  for (const [column, fields] of [
    ["history", [["title", "title_en", "history_title"], ["organization", "organization_en", "institution"], ["event", "description_en", "history_description"], ["role", "role_en", "role"]]],
    ["awards", [["title", "title_en", "award_title"], ["organization", "organization_en", "institution"], ["description", "description_en", "award_description"], ["result", "result_en", "award_result"]]],
  ] as const) for (const [index, value] of (Array.isArray(company[column]) ? company[column] : []).entries()) for (const [ko, en, group] of fields) addObjectField(items, job, id, `company_${column}`, `${column}[${index}]`, value, ko, en, group, `${id}:${column}:${index}`);
  for (const [index, value] of (Array.isArray(company.current_activity) ? company.current_activity : []).entries()) {
    if (typeof value === "string") addScalar(items, job, `${id}:current_activity:${index}`, "company_current_activity", `current_activity_en[${index}]`, "current_activity", value, company.current_activity_en?.[index], "current_activity");
    else for (const [ko, en, group] of [["title", "title_en", "current_activity_title"], ["organization", "organization_en", "institution"], ["description", "description_en", "current_activity_description"], ["role", "role_en", "role"]]) addObjectField(items, job, id, "company_current_activity", `current_activity[${index}]`, value, ko, en, group, `${id}:current_activity:${index}`);
  }
}

function glossaryLookup(glossary: any, item: Item): string {
  const source = normalizeSource(item.source_ko);
  const category = item.cache_group === "artist_name" ? "artist_names"
    : item.cache_group === "company_name" ? "company_names"
    : item.cache_group === "work_title" ? "work_titles"
    : item.cache_group === "institution" ? "institutions"
    : item.cache_group === "role" || item.cache_group === "credit_role" ? "roles"
    : "common_terms";
  return clean(glossary?.[category]?.[source]);
}

function estimate(items: Item[], glossary: any) {
  const pending = items.filter((item) => item.status === "pending");
  const unique = new Map<string, Item>();
  for (const item of pending) if (!glossaryLookup(glossary, item)) unique.set(item.source_hash, item);
  const sourceChars = [...unique.values()].reduce((sum, item) => sum + item.source_ko.length, 0);
  const batches = Math.ceil(unique.size / BATCH_SIZE);
  const estimatedInputTokens = Math.ceil(sourceChars * 1.15 + batches * 900);
  const estimatedOutputTokens = Math.ceil(sourceChars * 0.8 + unique.size * 28);
  const estimatedCostUsd = estimatedInputTokens / 1_000_000 * INPUT_USD_PER_M + estimatedOutputTokens / 1_000_000 * OUTPUT_USD_PER_M;
  const glossaryReused = items.filter((item) => item.status === "translated" && item.review_reason.includes("glossary_reused")).length;
  return { pending_items: pending.length, unique_api_phrases: unique.size, duplicate_cache_reused: pending.length - unique.size, glossary_reused: glossaryReused, source_chars: sourceChars, estimated_input_tokens: estimatedInputTokens, estimated_output_tokens: estimatedOutputTokens, estimated_cost_usd: Number(estimatedCostUsd.toFixed(6)), estimated_batches: batches };
}

function statusCounts(items: Item[]) {
  return items.reduce<Record<string, number>>((counts, item) => { counts[item.status] = (counts[item.status] || 0) + 1; return counts; }, {});
}

async function scan() {
  loadEnv();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const [artists, companies] = await Promise.all([
    fetchAll(supabase, "artists", "id,name,name_en,bio,bio_short,bio_en,introduction_en,works,affiliations,current_activity,current_activity_en,education,education_en,awards,competitions"),
    fetchAll(supabase, "companies", "id,name,name_en,bio,bio_short,bio_en,introduction_en,works,history,current_activity,current_activity_en,awards,mission,mission_en,vision,vision_en,core_values,core_values_en"),
  ]);
  const id = jobId(); const dir = jobDir(id); fs.mkdirSync(dir, { recursive: true });
  const items: Item[] = [];
  artists.forEach((artist) => extractArtist(items, id, artist));
  companies.forEach((company) => extractCompany(items, id, company));
  const glossary = readJson<any>(GLOSSARY_PATH);
  for (const item of items) {
    if (item.status !== "pending") continue;
    const match = glossaryLookup(glossary, item);
    if (match) { item.suggested_en = match; item.status = "translated"; item.review_reason = [item.review_reason, "glossary_reused"].filter(Boolean).join(";"); }
  }
  const inputSnapshot = { artists, companies };
  const report = { job_id: id, created_at: now(), model: MODEL, rule_version: RULE_VERSION, database_mode: "SELECT_ONLY", excluded_tables: ["performances"], source_snapshot_sha256: sha(inputSnapshot), source_rows: { artists: artists.length, companies: companies.length, performances_read: 0 }, items: items.length, statuses: statusCounts(items), unique_before: items.filter((item) => item.status === "pending" || item.status === "translated").length, unique_after: new Set(items.filter((item) => item.status === "pending").map((item) => item.source_hash)).size, estimate: estimate(items, glossary), storage_map: readJson(STORAGE_MAP_PATH) };
  const scanFile = path.join(dir, "scan.json");
  writeJson(scanFile, { report, items, source_snapshot: inputSnapshot });
  writeJson(path.join(dir, "scan-summary.json"), report);
  const checkpoint: Checkpoint = { job_id: id, created_at: now(), updated_at: now(), model: MODEL, rule_version: RULE_VERSION, stage: "scanned", scan_file: scanFile, translations: {}, failures: {}, usage: { input_tokens: 0, output_tokens: 0 } };
  writeJson(path.join(dir, "checkpoint.json"), checkpoint);
  console.log(JSON.stringify(report, null, 2));
  return id;
}

const translationSchema = {
  name: "portfolio_translations", strict: true,
  schema: { type: "object", additionalProperties: false, required: ["translations"], properties: {
    translations: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["source_hash", "suggested_en", "needs_review", "review_reason"], properties: {
        source_hash: { type: "string" }, suggested_en: { type: "string" }, needs_review: { type: "boolean" }, review_reason: { type: "string" }
      } }
  } } }
};

function translationPrompt(batch: Item[], glossary: any) {
  const compactGlossary = Object.fromEntries(Object.entries(glossary).filter(([key]) => key !== "version"));
  return `Translate Korean performing-arts portfolio content into natural professional English for international arts institutions, presenters, producers, and programmers.
Preserve meaning, tense, person, scope, punctuation, brackets, symbols, and years. Never add facts, achievements, interpretation, or promotional exaggeration. Preserve personal names when no official English form is supplied and mark them for review. Use official forms from the glossary exactly. Work titles without an official English form must be translated conservatively and marked for review. Return only the requested structured data. No Markdown, quotation wrappers, notes, or explanations in suggested_en.
Glossary: ${JSON.stringify(compactGlossary)}
Items: ${JSON.stringify(batch.map((item) => ({ source_hash: item.source_hash, content_type: item.content_type, field_name: item.field_name, source_ko: item.source_ko, preflagged_review: item.needs_review, preflag_reason: item.review_reason })))}`;
}

function abnormalLength(source: string, translated: string) {
  if (!translated.trim()) return "empty_translation";
  const ratio = translated.length / Math.max(source.length, 1);
  return ratio < 0.25 || ratio > 4 ? "abnormal_length_ratio" : "";
}

async function translateBatch(client: OpenAI, batch: Item[], glossary: any) {
  let lastError = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await client.chat.completions.create({ model: MODEL, temperature: 0.2,
        messages: [{ role: "system", content: "You are a precise Korean-to-English performing arts portfolio translator." }, { role: "user", content: translationPrompt(batch, glossary) }],
        response_format: { type: "json_schema", json_schema: translationSchema }
      }, { signal: controller.signal });
      const content = response.choices[0]?.message?.content || "";
      const parsed = JSON.parse(content) as { translations: Array<{ source_hash: string; suggested_en: string; needs_review: boolean; review_reason: string }> };
      const byHash = new Map(parsed.translations.map((value) => [value.source_hash, value]));
      if (batch.some((item) => !byHash.has(item.source_hash))) throw new Error("Structured response omitted one or more source hashes.");
      return { values: byHash, inputTokens: response.usage?.prompt_tokens || 0, outputTokens: response.usage?.completion_tokens || 0, retries: attempt };
    } catch (error) { lastError = error instanceof Error ? error.message : String(error); }
    finally { clearTimeout(timeout); }
  }
  throw new Error(lastError || "Translation failed after retries.");
}

function csvEscape(value: unknown) { const text = String(value ?? ""); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function writeCsv(file: string, items: Item[]) {
  const fields: Array<keyof Item> = ["job_id", "record_id", "parent_record_id", "content_type", "json_path", "field_name", "source_ko", "existing_en", "suggested_en", "status", "needs_review", "review_reason", "source_hash", "approved"];
  fs.writeFileSync(file, [fields.join(","), ...items.map((item) => fields.map((field) => csvEscape(item[field])).join(","))].join("\r\n") + "\r\n", "utf8");
}

function materialize(dir: string, scanData: any, checkpoint: Checkpoint) {
  const items: Item[] = scanData.items.map((original: Item) => {
    const item = { ...original };
    const cached = checkpoint.translations[item.source_hash];
    if (cached && item.status === "pending") {
      const lengthReason = abnormalLength(item.source_ko, cached.suggested_en);
      item.suggested_en = cached.suggested_en.trim(); item.status = "translated"; item.retry_count = cached.retries;
      item.needs_review = item.needs_review || cached.needs_review || !!lengthReason || cached.retries > 0;
      item.review_reason = [...new Set([item.review_reason, cached.review_reason, lengthReason, cached.retries > 0 ? "model_retry" : ""].filter(Boolean).join(";").split(";").filter(Boolean))].join(";");
    } else if (checkpoint.failures[item.source_hash] && item.status === "pending") { item.status = "failed"; item.review_reason = "translation_failed"; item.needs_review = true; }
    return item;
  });
  const cost = checkpoint.usage.input_tokens / 1_000_000 * INPUT_USD_PER_M + checkpoint.usage.output_tokens / 1_000_000 * OUTPUT_USD_PER_M;
  const report = { job_id: checkpoint.job_id, generated_at: now(), model: MODEL, rule_version: RULE_VERSION, database_writes: 0, performances_read: 0, performances_translated: 0,
    counts: statusCounts(items), review_required: items.filter((item) => item.needs_review).length,
    unique_api_translations: Object.keys(checkpoint.translations).length, failures: Object.keys(checkpoint.failures).length,
    actual_input_tokens: checkpoint.usage.input_tokens, actual_output_tokens: checkpoint.usage.output_tokens, actual_cost_usd: Number(cost.toFixed(6)), source_snapshot_sha256: scanData.report.source_snapshot_sha256 };
  writeJson(path.join(dir, "translation-results.json"), { report, items });
  writeCsv(path.join(dir, "translation-results.csv"), items);
  writeCsv(path.join(dir, "needs-review.csv"), items.filter((item) => item.needs_review));
  writeCsv(path.join(dir, "failed-and-skipped.csv"), items.filter((item) => item.status === "failed" || item.status === "skipped"));
  writeJson(path.join(dir, "run-summary.json"), report);
  fs.copyFileSync(GLOSSARY_PATH, path.join(dir, "glossary.json"));
  fs.copyFileSync(STORAGE_MAP_PATH, path.join(dir, "storage-map.json"));
  fs.writeFileSync(path.join(dir, "run-summary.md"), `# POPOK Portfolio Translation Dry Run\n\n- Job: ${report.job_id}\n- Model: ${report.model}\n- Database writes: 0\n- Performances read/translated: 0 / 0\n- Existing: ${report.counts.existing || 0}\n- Translated: ${report.counts.translated || 0}\n- Skipped: ${report.counts.skipped || 0}\n- Failed: ${report.counts.failed || 0}\n- Needs review: ${report.review_required}\n- Input tokens: ${report.actual_input_tokens}\n- Output tokens: ${report.actual_output_tokens}\n- Cost (USD): ${report.actual_cost_usd}\n`, "utf8");
  return { items, report };
}

async function translate(job: string, failedOnly = false, artistIds: string[] = []) {
  loadEnv();
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required.");
  const id = job || latestJob(); const dir = jobDir(id);
  const checkpointFile = path.join(dir, "checkpoint.json"); const checkpoint = readJson<Checkpoint>(checkpointFile); const scanData = readJson<any>(checkpoint.scan_file);
  const artistIdSet = new Set(artistIds);
  const selectedItems = artistIdSet.size
    ? (scanData.items as Item[]).filter((item) => item.content_type.startsWith("artist") && artistIdSet.has(String(item.parent_record_id || item.record_id).split(":")[0]))
    : scanData.items as Item[];
  if (artistIdSet.size) {
    const selectedIds = new Set(selectedItems.map((item) => String(item.parent_record_id || item.record_id).split(":")[0]));
    const missingIds = artistIds.filter((id) => !selectedIds.has(id));
    if (missingIds.length) throw new Error(`Artist IDs not found in scan: ${missingIds.join(", ")}`);
  }
  const glossary = readJson<any>(GLOSSARY_PATH); const estimateData = estimate(selectedItems, glossary);
  if (estimateData.estimated_cost_usd > MAX_COST_USD) throw new Error(`Estimated cost $${estimateData.estimated_cost_usd} exceeds the $${MAX_COST_USD} safety limit.`);
  checkpoint.stage = "translating"; checkpoint.updated_at = now(); writeJson(checkpointFile, checkpoint);
  const unique = new Map<string, Item>();
  for (const item of selectedItems) if (item.status === "pending" && !checkpoint.translations[item.source_hash]) unique.set(item.source_hash, item);
  const pending = [...unique.values()]; const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 65_000, maxRetries: 0 });
  const activeBatchSize = failedOnly ? 5 : BATCH_SIZE;
  for (let offset = 0; offset < pending.length; offset += activeBatchSize) {
    const batch = pending.slice(offset, offset + activeBatchSize);
    try {
      const result = await translateBatch(client, batch, glossary);
      for (const item of batch) {
        const value = result.values.get(item.source_hash)!;
        checkpoint.translations[item.source_hash] = { suggested_en: value.suggested_en.trim(), needs_review: value.needs_review, review_reason: value.review_reason, input_tokens: 0, output_tokens: 0, retries: result.retries };
        delete checkpoint.failures[item.source_hash];
      }
      checkpoint.usage.input_tokens += result.inputTokens; checkpoint.usage.output_tokens += result.outputTokens;
    } catch (error) { for (const item of batch) checkpoint.failures[item.source_hash] = error instanceof Error ? error.message.slice(0, 300) : "Unknown error"; }
    checkpoint.updated_at = now(); writeJson(checkpointFile, checkpoint);
    console.log(JSON.stringify({ job_id: id, completed_unique: Math.min(offset + batch.length, pending.length), total_unique: pending.length, failures: Object.keys(checkpoint.failures).length }));
  }
  checkpoint.stage = "translated"; checkpoint.updated_at = now(); writeJson(checkpointFile, checkpoint);
  const result = materialize(dir, scanData, checkpoint); console.log(JSON.stringify(result.report, null, 2));
}

function hasForbiddenOutput(value: string) {
  return /```|^\s*(translation|english|translated text)\s*:/im.test(value);
}

async function validate(job: string) {
  loadEnv(); const id = job || latestJob(); const dir = jobDir(id);
  const checkpointFile = path.join(dir, "checkpoint.json"); const checkpoint = readJson<Checkpoint>(checkpointFile); const scanData = readJson<any>(checkpoint.scan_file);
  const resultFile = path.join(dir, "translation-results.json"); if (!fs.existsSync(resultFile)) throw new Error("Translation results do not exist.");
  const results = readJson<{ report: any; items: Item[] }>(resultFile);
  const errors: string[] = [];
  if (results.items.length !== scanData.items.length) errors.push("result_count_mismatch");
  if (results.items.some((item) => item.approved !== false)) errors.push("approved_must_default_false");
  if (results.items.some((item) => item.existing_en && item.suggested_en !== item.existing_en)) errors.push("existing_english_changed");
  if (results.items.some((item) => item.status === "translated" && (!item.suggested_en.trim() || hasForbiddenOutput(item.suggested_en)))) errors.push("invalid_translation_output");
  if (results.items.filter((item) => item.content_type === "artist_work_media" && item.status === "skipped").length !== 2) errors.push("artist_media_exclusion_count_not_two");
  if (results.items.some((item) => item.content_type.includes("performance") || item.json_path.includes("performances"))) errors.push("performance_data_present");
  if (results.items.some((item) => !item.source_ko.trim())) errors.push("blank_source_present");
  if (results.items.some((item) => /https?:\/\//i.test(item.source_ko))) errors.push("url_source_present");
  const translatedByHash = new Map<string, string>();
  for (const item of results.items.filter((value) => value.status === "translated")) {
    const previous = translatedByHash.get(item.source_hash); if (previous && previous !== item.suggested_en) errors.push(`cache_mismatch:${item.source_hash}`); else translatedByHash.set(item.source_hash, item.suggested_en);
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) errors.push("supabase_env_missing");
  else {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const [artists, companies] = await Promise.all([
      fetchAll(supabase, "artists", "id,name,name_en,bio,bio_short,bio_en,introduction_en,works,affiliations,current_activity,current_activity_en,education,education_en,awards,competitions"),
      fetchAll(supabase, "companies", "id,name,name_en,bio,bio_short,bio_en,introduction_en,works,history,current_activity,current_activity_en,awards,mission,mission_en,vision,vision_en,core_values,core_values_en"),
    ]);
    if (sha({ artists, companies }) !== scanData.report.source_snapshot_sha256) errors.push("production_source_changed_since_scan");
  }
  const validation = { job_id: id, validated_at: now(), passed: errors.length === 0, errors, assertions: { database_operation: "SELECT_ONLY", database_writes: 0, performances_read: 0, performances_translated: 0, source_snapshot_unchanged: !errors.includes("production_source_changed_since_scan"), existing_english_preserved: !errors.includes("existing_english_changed"), result_count_matches_scan: !errors.includes("result_count_mismatch") } };
  writeJson(path.join(dir, "validation-report.json"), validation);
  checkpoint.stage = errors.length ? checkpoint.stage : "validated"; checkpoint.updated_at = now(); writeJson(checkpointFile, checkpoint);
  console.log(JSON.stringify(validation, null, 2)); if (errors.length) process.exitCode = 1;
}

async function main() {
  const args = parseArgs();
  if (args.command === "scan") await scan();
  else if (args.command === "translate") await translate(args.job, false, args.artistIds);
  else if (args.command === "resume") await translate(args.job, true, args.artistIds);
  else if (args.command === "validate") await validate(args.job);
  else if (args.command === "apply") throw new Error("Apply is intentionally disabled in this dry-run release.");
  else throw new Error("Usage: portfolioTranslationDryRun.ts <scan|translate|resume|validate> [--job JOB_ID] [--artist-ids ID,ID]");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
