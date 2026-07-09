import fs from "fs";
import path from "path";

const performancesPath = path.join(process.cwd(), "data/performances.json");
const perfs = JSON.parse(fs.readFileSync(performancesPath, "utf8"));

const keywords = ["이해니", "페미니즘", "강요찬", "박민지", "우지영"];

console.log("Local JSON Search Results:");
perfs.forEach((p: any) => {
  const matchedKeyword = keywords.find(k => p.title.includes(k) || p.id.includes(k));
  if (matchedKeyword) {
    console.log(`- ID/Slug: "${p.id}"`);
    console.log(`  Title: "${p.title}"`);
    console.log(`  Venue: "${p.venue}"`);
    console.log(`  StartDate: "${p.startDate}"`);
    console.log(`  EndDate: "${p.endDate}"`);
    console.log(`  recordId: "${p.recordId}"`);
  }
});
