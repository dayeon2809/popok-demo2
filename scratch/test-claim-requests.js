const http = require("http");

http.get("http://localhost:3000/api/admin/company-claim-requests", (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => {
    console.log("HTTP Status:", res.statusCode);
    try {
      console.log("Response Body:", JSON.parse(data));
    } catch (e) {
      console.log("Raw Response:", data);
    }
  });
}).on("error", (err) => {
  console.error("HTTP Error:", err.message);
});
