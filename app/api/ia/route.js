export async function POST(req) {
  const { prompt, system } = await req.json();
  
  try {
    const r = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
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
      return Response.json(
        { error: `Groq ${r.status}: ${text}` },
        { status: 500 }
      );
    }

    const json = JSON.parse(text);
    return Response.json({
      content: json.choices?.[0]?.message?.content ?? "",
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
