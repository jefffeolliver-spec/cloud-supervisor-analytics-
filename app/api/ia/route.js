export async function POST(req) {
  const { prompt, system } = await req.json();
  
  const key = process.env.GROQ_API_KEY;
  
  // Retorna o status da chave sem expor o valor
  return Response.json({ 
    error: "DEBUG - key existe: " + !!key + " | tamanho: " + (key?.length || 0)
  }, { status: 500 });
}
