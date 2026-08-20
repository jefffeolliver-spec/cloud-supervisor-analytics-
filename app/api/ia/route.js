export async function POST(req) {
  const { prompt, system } = await req.json();
  
  const key = process.env.GROQ_API_KEY;
  
  if (!key) {
    return Response.json({ error: "GROQ_API_KEY vazia ou nao encontrada" }, { status: 500 });
  }

  if (key.length < 10) {
    return Response.json({ error: "GROQ_API_KEY invalida: " + key }, { status: 500 });
  }

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    const text = await r.text();

    if (!r.ok) {
      return Response.json({ error: "Groq " + r.status + ": " + text }, { status: 500 });
    }

    const json = JSON.parse(text);
    return Response.json({ content: json.choices?.[0]?.message?.content ?? "" });

  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
