require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

(async () => {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  console.log("Key set:", !!key, "| Model:", model);
  if (!key) return console.log("GEMINI_API_KEY is missing from the root .env");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with JSON: {"ok": true}' }] }] }),
    }
  );
  console.log("Status:", res.status);
  console.log((await res.text()).slice(0, 400));
})();