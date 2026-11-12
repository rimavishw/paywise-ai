// Gemini only rewrites the sentence. It never decides status, causes or steps.
async function rewrite(baseText, statusLabel) {
  if (!process.env.GEMINI_API_KEY) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text:
            `Rewrite this PayPal payment explanation in plain English at a 7th-grade reading level. ` +
            `Use at most 3 short sentences. Do not add any new facts, causes, numbers or advice. ` +
            `Status: ${statusLabel}. Text: "${baseText}". ` +
            `Return JSON only: {"explanation": "..."}` }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    const text = parsed.explanation;
    if (typeof text !== 'string' || text.length < 10 || text.length > 400) return null;
    return text.trim();
  } catch {
    return null; // timeout, bad JSON, anything: use the fallback
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { rewrite };