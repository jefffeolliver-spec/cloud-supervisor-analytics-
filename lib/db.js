import { supabase } from "./supabase";

export async function getColaboradores() {
  const { data, error } = await supabase
    .from("vw_performance_atual")
    .select("*")
    .order("score_spa", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function importarCSV(rows) {
  const uniqueColabs = [];
  const seen = new Set();
  rows.forEach(r => {
    const key = `${r.nome}__${r.equipe}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueColabs.push({ nome:r.nome, equipe:r.equipe, supervisor:r.supervisor||"", localizacao:r.localizacao||"" });
    }
  });
  const { data: colabsData, error: colabErr } = await supabase
    .from("colaboradores")
    .upsert(uniqueColabs, { onConflict:"nome,equipe" })
    .select("id,nome,equipe");
  if (colabErr) throw colabErr;
  const colabMap = {};
  (colabsData||[]).forEach(c => { colabMap[`${c.nome}__${c.equipe}`] = c.id; });
  const hoje = new Date().toISOString
