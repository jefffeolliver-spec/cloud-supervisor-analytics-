// v8-debug
export async function POST(req) {
  try {
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return Response.json({ content: "⚠️ GROQ_API_KEY não encontrada." });
    }

    // Listar modelos disponíveis
    const r = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
      },
    });

    const data = await r.json();
    const modelos = (data.data||[]).map(m => m.id).join(", ");
    return Response.json({ content: "Modelos disponíveis: " + modelos });

  } catch (e) {
    return Response.json({ content: "⚠️ Erro: " + String(e) });
  }
}
