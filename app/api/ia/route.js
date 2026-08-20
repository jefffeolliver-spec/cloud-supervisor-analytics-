export async function POST(req) {
  try {
    const { prompt, system } = await req.json();
    const key = process.env.GROQ_API_KEY;

    const r = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
