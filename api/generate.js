// /api/generate.js — Vercel Serverless Function
export default async function handler(req, res) {
  // CORS (für CodePen & Co.)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { profile } = req.body || {};
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const system = `Du bist Social-Media-Strategin für Creatorinnen.
Antworte NUR mit JSON: { "idea": { "platform": "...", "hook": "...", "description": "...", "caption": "...", "hashtags": ["..."] } }.`;
    const user = `Profil: ${JSON.stringify(profile)}`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ error: "OpenAI error", detail: text });
    }

    const json = await resp.json();
    let content = json.choices?.[0]?.message?.content || "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Invalid AI response", content });
    const data = JSON.parse(match[0]);

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
