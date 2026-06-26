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
    const key = r.nome+"__"+r.equipe;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueColabs.push({ nome:r.nome, equipe:r.equipe, supervisor:r.supervisor||"", localizacao:r.localizacao||"" });
    }
  });
  const { data: cd, error: e1 } = await supabase.from("colaboradores").upsert(uniqueColabs, { onConflict:"nome,equipe" }).select("id,nome,equipe");
  if (e1) throw e1;
  const colabMap = {};
  (cd||[]).forEach(c => { colabMap[c.nome+"__"+c.equipe] = c.id; });
  const hoje = new Date().toISOString().split("T")[0];
  const perf = rows.map(r => {
    const id = colabMap[r.nome+"__"+r.equipe];
    if (!id) return null;
    return { colaborador_id:id, data:hoje, chamadas_recebidas:Number(r.chamadas_recebidas)||0, chamadas_realizadas:Number(r.chamadas_realizadas)||0, cpc:Number(r.cpc)||0, retidos:Number(r.retidos)||0, conversoes:Number(r.conversoes)||0, eficiencia:Number(r.eficiencia)||0, tempo_produtivo:Number(r.tempo_produtivo)||0, tempo_logado:Number(r.tempo_logado)||0 };
  }).filter(Boolean);
  const { error: e2 } = await supabase.from("performance_diaria").upsert(perf, { onConflict:"colaborador_id,data" });
  if (e2) throw e2;
  return perf.length;
}

export async function getPlanos() {
  const { data, error } = await supabase.from("planos_acao").select("*, colaboradores(nome,equipe)").order("created_at", { ascending:false });
  if (error) throw error;
  return data || [];
}

export async function getMetas() {
  const { data, error } = await supabase.from("metas").select("*, colaboradores(nome,equipe)").eq("status","ativo").order("created_at", { ascending:false });
  if (error) throw error;
  return data || [];
}

export async function getNotificacoes() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("notificacoes").select("*, colaboradores(nome,equipe)").eq("destinatario_id", user.id).order("created_at", { ascending:false }).limit(50);
  if (error) throw error;
  return data || [];
}

export async function marcarLida(id) {
  const { error } = await supabase.from("notificacoes").update({ lida:true }).eq("id", id);
  if (error) throw error;
}
