export async function POST(request) {
  try {
    const { prompt, system } = await request.json();

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: "Erro na API: " + err }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return Response.json({ content });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
