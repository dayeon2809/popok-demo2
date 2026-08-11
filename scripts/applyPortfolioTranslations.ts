import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const option = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] || "" : ""; };
const JOB = option("--job") || args.find((argument) => !argument.startsWith("-")) || "portfolio-en-20260806T140416Z";
const scopedArtistIds = option("--artist-ids").split(",").map((id) => id.trim()).filter(Boolean);
const RULE_VERSION = "2026-08-06.1";
const root = process.cwd();
const jobDir = path.join(root, "artifacts", "portfolio-translation", JOB);
const resultsFile = path.join(jobDir, "translation-results.json");
const applyDir = path.join(jobDir, "apply");
const checkpointFile = path.join(applyDir, "apply-checkpoint.json");
type Item = Record<string, any>;

function loadEnv() {
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/); if (!match) continue;
    let value = match[2].trim(); if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}
const norm = (value: unknown) => typeof value === "string" ? value.trim() : "";
const normalizedSource = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
const sourceHash = (item: Item) => crypto.createHash("sha256").update(`${RULE_VERSION}\n${item.cache_group}\n${item.field_name}\n${normalizedSource(item.source_ko)}`).digest("hex");
const sha = (value: unknown) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const writeJson = (file: string, value: unknown) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
const parsePath = (value: string): Array<string | number> => [...value.matchAll(/([^.[]+)|\[(\d+)\]/g)].map((match) => match[1] ?? Number(match[2]));
const getAt = (value: any, parts: Array<string | number>) => parts.reduce((current, key) => current == null ? undefined : current[key], value);
function setAt(value: any, parts: Array<string | number>, next: unknown) {
  let current = value;
  parts.forEach((key, index) => {
    if (index === parts.length - 1) { current[key] = next; return; }
    const following = parts[index + 1];
    if (current[key] == null) current[key] = typeof following === "number" ? [] : {};
    current = current[key];
  });
}
const tableFor = (item: Item) => item.content_type.startsWith("artist") ? "artists" : "companies";
const parentId = (item: Item) => String(item.parent_record_id || item.record_id).split(":")[0];
function sourcePath(item: Item) {
  const destination = parsePath(item.json_path);
  if (destination.length === 1) return [item.field_name];
  if (String(destination[0]).endsWith("_en")) return [String(destination[0]).replace(/_en$/, ""), ...destination.slice(1)];
  return [...destination.slice(0, -1), item.field_name];
}
async function fetchRows(supabase: any, table: string, ids: string[]) {
  const { data, error } = await supabase.from(table).select("*").in("id", ids);
  if (error) throw new Error(`${table} backup read failed: ${error.message}`);
  return (data || []).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));
}
function csv(file: string, rows: any[]) {
  const fields = ["record_id", "content_type", "json_path", "source_hash", "status", "reason"];
  const escape = (v: unknown) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  fs.writeFileSync(file, [fields.join(","), ...rows.map((r) => fields.map((f) => escape(r[f])).join(","))].join("\r\n") + "\r\n", "utf8");
}

async function main() {
  loadEnv(); fs.mkdirSync(applyDir, { recursive: true });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server credentials are missing.");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const result = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
  const scope = scopedArtistIds.length
    ? result.items.filter((item: Item) => item.content_type.startsWith("artist") && scopedArtistIds.includes(parentId(item)))
    : result.items;
  const translated: Item[] = scope.filter((item: Item) => item.status === "translated" && norm(item.suggested_en));
  if (scopedArtistIds.length) {
    const foundIds = [...new Set(scope.map(parentId))].sort();
    const expectedIds = [...new Set(scopedArtistIds)].sort();
    if (JSON.stringify(foundIds) !== JSON.stringify(expectedIds)) throw new Error(`Safety gate: expected artist IDs ${expectedIds.join(",")}, found ${foundIds.join(",")}.`);
    if (scope.some((item: Item) => item.status === "pending" || item.status === "failed")) throw new Error("Safety gate: scoped artist translations are incomplete.");
    if (!translated.length) throw new Error("Safety gate: no scoped translations are ready to apply.");
  } else {
    if (translated.length !== 560) throw new Error(`Safety gate: expected 560 translated items, found ${translated.length}.`);
    if (result.items.filter((item: Item) => item.status === "existing").length !== 17) throw new Error("Safety gate: existing count is not 17.");
    if (result.items.filter((item: Item) => item.status === "skipped").length !== 51) throw new Error("Safety gate: skipped count is not 51.");
  }
  if (translated.some((item) => sourceHash(item) !== item.source_hash)) throw new Error("Safety gate: one or more stored source hashes are invalid.");
  const artistIds = [...new Set(translated.filter((item) => tableFor(item) === "artists").map(parentId))].sort();
  const companyIds = [...new Set(translated.filter((item) => tableFor(item) === "companies").map(parentId))].sort();
  if (scopedArtistIds.length) {
    if (artistIds.length !== scopedArtistIds.length || companyIds.length !== 0) throw new Error(`Safety gate: expected ${scopedArtistIds.length} scoped artists and no companies, found ${artistIds.length}/${companyIds.length}.`);
  } else if (artistIds.length !== 23 || companyIds.length !== 12) {
    throw new Error(`Safety gate: expected 23 artists/12 companies, found ${artistIds.length}/${companyIds.length}.`);
  }

  const [artists, companies] = await Promise.all([fetchRows(supabase, "artists", artistIds), fetchRows(supabase, "companies", companyIds)]);
  const backup = { job_id: JOB, created_at: new Date().toISOString(), artists, companies, performances_read: 0 };
  const backupFile = path.join(applyDir, "pre-apply-backup.json"); writeJson(backupFile, backup);
  const backupHash = sha(backup); const reread = JSON.parse(fs.readFileSync(backupFile, "utf8"));
  if (sha(reread) !== backupHash) throw new Error("Backup reread checksum verification failed.");
  writeJson(path.join(applyDir, "pre-apply-backup-checksum.json"), { sha256: backupHash, verified: true });

  const checkpoint = fs.existsSync(checkpointFile) ? JSON.parse(fs.readFileSync(checkpointFile, "utf8")) : { job_id: JOB, started_at: new Date().toISOString(), completed_records: [], item_logs: [] };
  const completed = new Set<string>(checkpoint.completed_records);
  const grouped = new Map<string, Item[]>(); for (const item of translated) { const key = `${tableFor(item)}:${parentId(item)}`; grouped.set(key, [...(grouped.get(key) || []), item]); }
  for (const [key, items] of grouped) {
    if (completed.has(key)) continue;
    const [table, id] = key.split(":");
    const { data: live, error: readError } = await supabase.from(table).select("*").eq("id", id).single();
    if (readError || !live) { items.forEach((item) => checkpoint.item_logs.push({ record_id: id, content_type: item.content_type, json_path: item.json_path, source_hash: item.source_hash, status: "failed", reason: readError?.message || "missing_record" })); continue; }
    const draft = structuredClone(live); const update: Record<string, any> = {}; let applicable = 0;
    for (const item of items) {
      const destination = parsePath(item.json_path); const source = sourcePath(item);
      if (norm(getAt(live, source)) !== norm(item.source_ko)) { checkpoint.item_logs.push({ record_id: id, content_type: item.content_type, json_path: item.json_path, source_hash: item.source_hash, status: "conflict", reason: "source_changed" }); continue; }
      if (norm(getAt(live, destination))) { checkpoint.item_logs.push({ record_id: id, content_type: item.content_type, json_path: item.json_path, source_hash: item.source_hash, status: "conflict", reason: "english_already_present" }); continue; }
      setAt(draft, destination, item.suggested_en.trim()); update[String(destination[0])] = draft[destination[0]]; applicable++;
      checkpoint.item_logs.push({ record_id: id, content_type: item.content_type, json_path: item.json_path, source_hash: item.source_hash, status: "success", reason: "" });
    }
    if (applicable) {
      const { error } = await supabase.from(table).update(update).eq("id", id);
      if (error) { checkpoint.item_logs.filter((log: any) => log.record_id === id && log.status === "success").forEach((log: any) => { log.status = "failed"; log.reason = error.message; }); writeJson(checkpointFile, checkpoint); continue; }
    }
    completed.add(key); checkpoint.completed_records = [...completed]; checkpoint.updated_at = new Date().toISOString(); writeJson(checkpointFile, checkpoint);
  }
  const logs = checkpoint.item_logs; csv(path.join(applyDir, "apply-log.csv"), logs); writeJson(path.join(applyDir, "apply-log.json"), logs);
  const counts = logs.reduce((out: any, row: any) => { out[row.status] = (out[row.status] || 0) + 1; return out; }, {});
  writeJson(path.join(applyDir, "apply-summary.json"), { job_id: JOB, completed_at: new Date().toISOString(), counts, changed_records: completed.size, backup_file: backupFile, backup_sha256: backupHash, performances_read: 0, performances_changed: 0 });
  console.log(JSON.stringify({ counts, changed_records: completed.size, backup_file: backupFile }, null, 2));
  if ((counts.failed || 0) || (counts.conflict || 0) || (counts.success || 0) !== translated.length) process.exitCode = 1;
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
