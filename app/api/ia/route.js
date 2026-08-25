// v9
export async function POST(req) {
  try {
    const { prompt, system } = await req.json();
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return Response.json({ content: "⚠️ GROQ_API_KEY não encontrada." });
    }

    const r = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + key,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          max_tokens: 1500,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const text = await r.text();

    if (!r.ok) {
      return Response.json({ content: "⚠️ Groq erro " + r.status + ": " + text });
    }

    const data = JSON.parse(text);
    return Response.json({
      content: data.choices?.[0]?.message?.content ?? "Sem resposta da IA.",
    });

  } catch (e) {
    return Response.json({ content: "⚠️ Erro interno: " + String(e) });
  }
}
