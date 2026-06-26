export function calcScore(row) {
  const e  = Math.min(Number(row.eficiencia)||0, 100) * 0.35;
  const c  = Math.min((Number(row.conversoes)||0)/50*100, 100) * 0.25;
  const cp = Math.min((Number(row.cpc)||0)/100*100, 100) * 0.20;
  const tp = Math.min((Number(row.tempo_produtivo)||0)/480*100, 100) * 0.20;
  return row.score_spa || Math.round(e+c+cp+tp);
}

export function calcTier(score) {
  if (score >= 85) return { label:"Top",     color:"#10B981", bg:"#ECFDF5", dot:"#10B981" };
  if (score >= 68) return { label:"Regular", color:"#6366F1", bg:"#EEF2FF", dot:"#6366F1" };
  return              { label:"Atencao",  color:"#F43F5E", bg:"#FFF1F2", dot:"#F43F5E" };
}
