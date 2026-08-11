import fs from "node:fs";
import path from "node:path";

const JOB = "portfolio-en-20260811T024204Z";
const ARTIST_IDS = [
  "a94ceaca-4631-4072-8c3f-415a0d26aae3",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618",
] as const;
const root = process.cwd();
const dir = path.join(root, "artifacts", "portfolio-translation", JOB);
const scan = JSON.parse(fs.readFileSync(path.join(dir, "scan.json"), "utf8"));

const translations: Record<string, string> = {
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[0].title_en": "Before We Vanish",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[0].description_en": "The 81st regular production by the Theatre Arts Research Society AL\nTomohiro Maekawa's Before We Vanish\n—\nOn the boundary between humanity and what makes us human.\nWhat makes a human truly human?",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[0].role_en": "Planning / MD Design",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[0].credits[0].role_en": "Presented by",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[1].title_en": "Myochaek (卯策)",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[1].description_en": "2025 Korea National University of Arts Open Campus Project @karts.myochaek\n—\nAn interdisciplinary reinterpretation of The Tale of the Rabbit, organically combining pansori, dance, gayageum, musical theatre, visual art, and video through a single narrative.",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[1].role_en": "Planning / Lighting Operation",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[1].credits[1].role_en": "Hosted and presented by",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[2].title_en": "Stepford",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[2].description_en": "A 45-minute final reading for the 2025 second-semester Collaborative Program in Music Theatre Creation at Korea National University of Arts\nMusical Stepford",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[2].role_en": "Art Director",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[2].credits[0].role_en": "Team Art Director",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[3].title_en": "Sopro",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[3].description_en": "2026 first-semester studio production, School of Drama, Korea National University of Arts\n—\nhttps://www.instagram.com/karts.sopro?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[3].credits[0].role_en": "Credits",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[4].title_en": "Youth Theatre: Too Heavy for Me",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[4].description_en": "2026 first-semester graduation production in Theatre for Young Audiences, School of Drama, Korea National University of Arts\n—\nhttps://www.instagram.com/p/DYjRR9azpNn/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[4].credits[0].role_en": "Credits",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[5].title_en": "Waiting: attendez",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[5].description_en": "Waiting: attendez, a theatre production by Theatre Company Seoneon combining traditional music and movement\n—\nPresented and produced by Theatre Company Seoneon\n—\nhttps://www.instagram.com/team.seoneon?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[5].credits[0].role_en": "Credits",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[6].title_en": "Molang Hotel",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[6].description_en": "Open rehearsal of MOLANG HOTEL\nA newly devised one-act comedy inspired by Dario Fo's The Virtuous Burglar\n—\n2026 Arts University Emerging Artist Field Partnership Support Program, Arts Council Korea\n—\nhttps://www.instagram.com/devisingworkshop_molanghotel?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[6].credits[0].role_en": "Credits",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[7].title_en": "Musical Run On",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[7].description_en": "2026 second-semester regular production by the Collaborative Program in Music Theatre Creation at Korea National University of Arts",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:works[7].credits[0].role_en": "Credits",
  "a94ceaca-4631-4072-8c3f-415a0d26aae3:education_en[0]": "Currently studying Arts Management in the Department of Theatre Studies, School of Drama, Korea National University of Arts",

  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:works[0].title_en": "Neverland Carnival",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:works[0].credits[0].role_en": "Choreography / Role",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:works[1].title_en": "Myochaek",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:works[1].credits[0].role_en": "Choreography / Role",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[0].organization_en": "Creatives in Motion (Korea National University of Arts × Korean Cultural Center New York)",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[0].title_en": "Intern Producer",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[1].organization_en": "Seoul International Dance Competition",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[1].title_en": "Korean/English Announcer",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[2].organization_en": "KB-YMCA Polaris+",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[2].title_en": "Economics and Financial Education Volunteer Corps",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[3].organization_en": "Korean Red Cross University Broadcasting Station",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[3].title_en": "Announcer",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[4].organization_en": "Ministry of Patriots and Veterans Affairs / Future Generation Exchange Camp for UN Korean War Participating Nations",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[5].organization_en": "ARKO Some Festa Supporters",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[5].title_en": "A-Somes",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[6].organization_en": "Sleep No More Seoul",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[6].title_en": "Steward",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[7].organization_en": "Korea Heritage Service",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:affiliations[7].title_en": "English-language Guide at Gyeongbokgung Palace",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:current_activity_en[0]": "Intern Producer, Creatives in Motion (Korea National University of Arts × Korean Cultural Center New York)",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:current_activity_en[1]": "Announcer, Korean Red Cross University Broadcasting Station",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:current_activity_en[2]": "Member of the KB-YMCA Polaris+ Economics and Financial Education Volunteer Corps",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:current_activity_en[3]": "ARKO Some Festa Supporter",
  "0b33dea9-2ca5-4295-a9a3-26ad9b179618:education_en[0]": "Currently studying Arts Management at Korea National University of Arts",
};

const scopedItems = scan.items.filter((item: any) => ARTIST_IDS.includes(String(item.parent_record_id || item.record_id).split(":")[0] as any));
for (const item of scopedItems) {
  if (item.status !== "pending") continue;
  const artistId = String(item.parent_record_id || item.record_id).split(":")[0];
  const translated = translations[`${artistId}:${item.json_path}`];
  if (!translated) throw new Error(`Missing local translation for ${artistId}:${item.json_path}`);
  item.suggested_en = translated;
  item.status = "translated";
  item.needs_review = true;
  item.review_reason = [item.review_reason, "local_human_review"].filter(Boolean).join(";");
}

const unused = Object.keys(translations).filter((key) => !scopedItems.some((item: any) => `${String(item.parent_record_id || item.record_id).split(":")[0]}:${item.json_path}` === key));
if (unused.length) throw new Error(`Unused local translations: ${unused.join(", ")}`);
if (scopedItems.some((item: any) => item.status === "pending" || item.status === "failed")) throw new Error("Scoped translations are incomplete.");

const counts = scan.items.reduce((out: Record<string, number>, item: any) => {
  out[item.status] = (out[item.status] || 0) + 1;
  return out;
}, {});
const report = {
  job_id: JOB,
  generated_at: new Date().toISOString(),
  model: "local-human-reviewed",
  rule_version: scan.report.rule_version,
  database_writes: 0,
  scoped_artist_ids: ARTIST_IDS,
  scoped_items: scopedItems.length,
  scoped_translated: scopedItems.filter((item: any) => item.status === "translated").length,
  counts,
  source_snapshot_sha256: scan.report.source_snapshot_sha256,
};
fs.writeFileSync(path.join(dir, "translation-results.json"), JSON.stringify({ report, items: scan.items }, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(dir, "local-translation-summary.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
