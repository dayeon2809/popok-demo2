import fs from "fs";
import path from "path";

const performancesPath = path.join(process.cwd(), "data/performances.json");
const perfs = JSON.parse(fs.readFileSync(performancesPath, "utf8"));

const targetRecordId = "267083";
const targetTitle = "2026 The Night In Seoul BALLET GALA";

const matchedById = perfs.find((p: any) => p.recordId === targetRecordId);
const matchedByTitle = perfs.find((p: any) => p.title.includes(targetTitle));

console.log("Matched by ID:", matchedById ? matchedById.title : "None");
console.log("Matched by Title:", matchedByTitle ? matchedByTitle.title : "None");
console.log("All recordIds in local JSON:");
perfs.forEach((p: any) => {
  console.log(`- Title: "${p.title}" | recordId: "${p.recordId}"`);
});
