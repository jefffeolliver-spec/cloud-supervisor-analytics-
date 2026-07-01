"use client";
import { useState, useEffect } from "react";

// ── PLANOS DE AÇÃO ────────────────────────────────────────────
function PlanosTab({supabase, user, data}){
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("lista"); // lista | novo | detalhe
  const [selPlano, setSelPlano] = useState(null);
  const [colaborSel, setColaborSel] = useState("");
  const [acoesSel, setAcoesSel] = useState([]);
  const [obsText, setObsText] = useState("");
  const [pct, setPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [iaTexto, setIaTexto] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const C2 = {surface:"#fff",border:"#E2E8F0",indigo:"#6366F1",indigoLight:"#EEF2FF",green:"#059669",greenLight:"#F0FDF4",red:"#DC2626",redLight:"#FEF2F2",amber:"#D97706",amberLight:"#FFFBEB",blue:"#2563EB",txt:"#111",txtSub:"#475569",txtMuted:"#94A3B8",bg:"#F8FAFC",bgAlt:"#F1F5F9"};
  const colaboradores = [...new Set(data.map(r=>r.nome))].filter(Boolean);
  const ACOES_SUGERIDAS = [
    "Trabalhar sondagem aberta — identificar o real motivo da portabilidade",
    "Praticar argumentação com 3 ângulos diferentes sem repetir",
    "Aplicar a regra dos 3 nãos — nunca desistir no primeiro não",
    "Identificar e explorar o momento de hesitação do cliente",
    "Treinar técnicas de fechamento consultivo",
    "Melhorar abordagem inicial para aumentar o CPC",
    "Personalizar argumentos conforme o perfil do cliente",
    "Reduzir tempo de ligação com sondagem mais assertiva",
    "Praticar ancoragem de valor dos benefícios da instituição",
    "Simulação de atendimento com feedback do supervisor",
  ];
  useEffect(()=>{ loadPlanos(); },[]);
  async function loadPlanos(){
    setLoading(true);
    try{
      const{data:d}=await supabase.from("planos_acao").select("*, colaboradores(nome,equipe)").order("created_at",{ascending:false});
      setPlanos(d||[]);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  async function gerarIA(){
    if(!colaborSel){ setMsg("Selecione um colaborador primeiro."); return; }
    setLoadingIA(true); setIaTexto("");
    try{
      const colab = data.find(r=>r.nome===colaborSel);
      const prompt = `Gere um PLANO DE AÇÃO para o colaborador ${colaborSel} de uma central de retenção de portabilidade bancária.
Dados: CPC ${colab?.cpc||0} (meta 20), Retidos ${colab?.retidos||0} (meta 10), Conversão ${Math.round((Number(colab?.conversoes)||0)*100)}% (meta 50%).
Liste 5 ações práticas numeradas, cada uma com: AÇÃO, OBJETIVO e PRAZO. Seja direto e específico para retenção bancária. Máximo 300 palavras.`;
      const res = await fetch("/api/ia",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,system:"Você é especialista em coaching de retenção de portabilidade bancária. Responda em português BR com ações práticas e diretas."})});
      const j = await res.json();
      setIaTexto(j.content||"");
    }catch(e){ setMsg("Erro ao conectar com a IA."); }
    setLoadingIA(false);
  }
  async function salvarPlano(){
    if(!colaborSel||acoesSel.length===0){ setMsg("Selecione colaborador e pelo menos 1 ação."); return; }
    setSaving(true); setMsg("");
    try{
      const{data:colab}=await supabase.from("colaboradores").select("id").eq("nome",colaborSel).single();
      const{data:{user:u}}=await supabase.auth.getUser();
      await supabase.from("planos_acao").insert({
        colaborador_id:colab?.id,
        supervisor_id:u?.id,
        data_criacao:new Date().toISOString().split("T")[0],
        diagnostico:iaTexto,
        acoes:acoesSel,
        observacao:obsText,
        percentual:pct,
        status:pct===100?"concluido":"em_andamento"
      });
      setMsg("Plano salvo com sucesso!");
      setView("lista");
      setColaborSel(""); setAcoesSel([]); setObsText(""); setPct(0); setIaTexto("");
      await loadPlanos();
    }catch(e){ setMsg("Erro ao salvar: "+e.message); }
    setSaving(false);
  }
  async function atualizarPlano(id, novoPct, novaObs){
    try{
      await supabase.from("planos_acao").update({
        percentual:novoPct,
        observacao:novaObs,
        status:novoPct===100?"concluido":"em_andamento",
        updated_at:new Date().toISOString()
      }).eq("id",id);
      await loadPlanos();
    }catch(e){ console.error(e); }
  }
  const statusInfo = (s,p) => {
    if(p===100) return {l:"Concluído",col:C2.green,bg:C2.greenLight};
    if(p>=50)   return {l:"Em andamento",col:C2.blue,bg:"#DBEAFE"};
    if(p>0)     return {l:"Iniciado",col:C2.amber,bg:C2.amberLight};
    return           {l:"Pendente",col:C2.txtMuted,bg:C2.bgAlt};
  };
  // ── DETALHE DO PLANO ──────────────────────────────────────────
  if(view==="detalhe"&&selPlano){
    const [localPct,setLocalPct] = useState(selPlano.percentual||0);
    const [localObs,setLocalObs] = useState(selPlano.observacao||"");
    const si = statusInfo(selPlano.status, localPct);
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>{setView("lista");setSelPlano(null);}} style={{background:C2.bgAlt,border:"none",borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:600,color:C2.txtSub,cursor:"pointer",fontFamily:"inherit"}}>← Voltar</button>
          <div style={{fontSize:16,fontWeight:800,color:C2.txt}}>Plano de Ação</div>
        </div>
        {/* Header */}
        <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C2.txt}}>{selPlano.colaboradores?.nome||"Colaborador"}</div>
              <div style={{fontSize:11,color:C2.txtMuted}}>{selPlano.colaboradores?.equipe} · {selPlano.data_criacao}</div>
            </div>
            <span style={{fontSize:10,fontWeight:700,color:si.col,background:si.bg,borderRadius:20,padding:"4px 10px"}}>{si.l}</span>
          </div>
          {/* Barra de progresso */}
          <div style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:11,color:C2.txtSub,fontWeight:600}}>Progresso</span>
              <span style={{fontSize:13,fontWeight:900,color:si.col}}>{localPct}%</span>
            </div>
            <div style={{height:10,background:C2.bgAlt,borderRadius:5}}>
              <div style={{width:`${localPct}%`,height:"100%",background:localPct===100?C2.green:localPct>=50?C2.blue:C2.amber,borderRadius:5,transition:"width 0.3s"}}/>
            </div>
          </div>
          <input type="range" min={0} max={100} step={5} value={localPct} onChange={e=>setLocalPct(Number(e.target.value))}
            style={{width:"100%",accentColor:C2.indigo,cursor:"pointer",marginTop:4}}/>
        </div>
        {/* Ações do plano */}
        <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C2.txt,marginBottom:12}}>📌 Ações Selecionadas</div>
          {(selPlano.acoes||[]).map((a,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid "+C2.bgAlt,alignItems:"flex-start"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:C2.indigoLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:C2.indigo,flexShrink:0}}>{i+1}</div>
              <div style={{fontSize:12,color:C2.txt,lineHeight:1.5}}>{a}</div>
            </div>
          ))}
        </div>
        {/* Diagnostico IA */}
        {selPlano.diagnostico&&(
          <div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:12,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:C2.indigo,marginBottom:8}}>🤖 Diagnóstico da IA</div>
            <div style={{fontSize:11,color:C2.txtSub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{selPlano.diagnostico.slice(0,500)}{selPlano.diagnostico.length>500?"...":""}</div>
          </div>
        )}
        {/* Observações */}
        <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C2.txt,marginBottom:8}}>📝 Observações do Supervisor</div>
          <textarea value={localObs} onChange={e=>setLocalObs(e.target.value)}
            placeholder="Descreva o que foi aplicado, como o colaborador reagiu, o que foi sanado..."
            style={{width:"100%",minHeight:100,border:"1px solid "+C2.border,borderRadius:8,padding:"10px 12px",fontSize:12,color:C2.txt,resize:"vertical",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          <div style={{fontSize:10,color:C2.txtMuted,marginTop:4}}>💡 Essas observações ficam salvas e alimentam a memória da IA para diagnósticos futuros.</div>
        </div>
        <button onClick={()=>atualizarPlano(selPlano.id,localPct,localObs).then(()=>{setView("lista");setSelPlano(null);})}
          style={{background:C2.indigo,color:"#fff",border:"none",borderRadius:10,padding:"13px 0",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          Salvar Atualização
        </button>
      </div>
    );
  }
  // ── NOVO PLANO ────────────────────────────────────────────────
  if(view==="novo"){
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setView("lista")} style={{background:C2.bgAlt,border:"none",borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:600,color:C2.txtSub,cursor:"pointer",fontFamily:"inherit"}}>← Voltar</button>
          <div style={{fontSize:16,fontWeight:800,color:C2.txt}}>Novo Plano de Ação</div>
        </div>
        {/* Seletor colaborador */}
        <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C2.txt,marginBottom:10}}>👤 Colaborador</div>
          <select value={colaborSel} onChange={e=>setColaborSel(e.target.value)}
            style={{width:"100%",background:C2.bg,border:"1.5px solid "+C2.indigo,borderRadius:8,padding:"10px 12px",fontSize:13,fontWeight:600,color:C2.indigo,outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
            <option value="">Selecione o colaborador...</option>
            {colaboradores.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          {colaborSel&&(()=>{
            const colab=data.find(r=>r.nome===colaborSel);
            if(!colab) return null;
            const sc=calcScore(colab);
            const t=tier(sc);
            return(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:10}}>
                {[{l:"Score",v:sc+"/100",col:t.color},{l:"CPC",v:colab.cpc,col:C2.indigo},{l:"Retidos",v:colab.retidos,col:C2.green}].map((k,i)=>(
                  <div key={i} style={{background:C2.bgAlt,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:C2.txtMuted,marginBottom:2}}>{k.l}</div>
                    <div style={{fontSize:16,fontWeight:900,color:k.col}}>{k.v}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        {/* Gerar com IA */}
        <div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C2.indigo,marginBottom:8}}>🤖 Diagnóstico da IA</div>
          <button onClick={gerarIA} disabled={!colaborSel||loadingIA}
            style={{width:"100%",background:colaborSel&&!loadingIA?C2.indigo:"#C4B5FD",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:colaborSel?"pointer":"not-allowed",fontFamily:"inherit",marginBottom:iaTexto?10:0}}>
            {loadingIA?"Gerando diagnóstico...":"✨ Gerar diagnóstico com IA"}
          </button>
          {iaTexto&&(
            <div style={{background:"#fff",borderRadius:8,padding:12,fontSize:11,color:C2.txtSub,lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto"}}>{iaTexto}</div>
          )}
        </div>
        {/* Selecionar ações */}
        <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C2.txt,marginBottom:4}}>📌 Selecionar Ações</div>
          <div style={{fontSize:11,color:C2.txtMuted,marginBottom:12}}>Escolha as ações que serão aplicadas com este colaborador</div>
          {ACOES_SUGERIDAS.map((a,i)=>{
            const sel=acoesSel.includes(a);
            return(
              <div key={i} onClick={()=>setAcoesSel(sel?acoesSel.filter(x=>x!==a):[...acoesSel,a])}
                style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:8,marginBottom:4,background:sel?C2.indigoLight:C2.bg,border:"1.5px solid "+(sel?C2.indigo:C2.border),cursor:"pointer"}}>
                <div style={{width:18,height:18,borderRadius:4,border:"2px solid "+(sel?C2.indigo:"#D1D5DB"),background:sel?C2.indigo:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                  {sel&&<span style={{color:"#fff",fontSize:10,fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:12,color:sel?C2.indigo:C2.txt,lineHeight:1.5}}>{a}</span>
              </div>
            );
          })}
        </div>
        {/* % inicial + observação */}
        <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C2.txt,marginBottom:12}}>📊 Progresso Inicial</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:C2.txtSub}}>% de conclusão</span>
            <span style={{fontSize:14,fontWeight:900,color:C2.indigo}}>{pct}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={pct} onChange={e=>setPct(Number(e.target.value))}
            style={{width:"100%",accentColor:C2.indigo,cursor:"pointer"}}/>
          <div style={{height:8,background:C2.bgAlt,borderRadius:4,marginTop:8}}>
            <div style={{width:`${pct}%`,height:"100%",background:pct===100?C2.green:pct>=50?C2.blue:C2.amber,borderRadius:4,transition:"width 0.3s"}}/>
          </div>
        </div>
        <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C2.txt,marginBottom:8}}>📝 Observação inicial</div>
          <textarea value={obsText} onChange={e=>setObsText(e.target.value)}
            placeholder="Descreva o contexto, o que motivou este plano, como a conversa com o colaborador foi..."
            style={{width:"100%",minHeight:90,border:"1px solid "+C2.border,borderRadius:8,padding:"10px 12px",fontSize:12,color:C2.txt,resize:"vertical",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        {msg&&<div style={{padding:"10px 14px",borderRadius:8,background:msg.includes("Erro")||msg.includes("Selecione")?C2.redLight:C2.greenLight,fontSize:12,color:msg.includes("Erro")||msg.includes("Selecione")?C2.red:C2.green,fontWeight:600}}>{msg}</div>}
        <button onClick={salvarPlano} disabled={saving||!colaborSel||acoesSel.length===0}
          style={{background:colaborSel&&acoesSel.length>0?C2.indigo:"#E2E8F0",color:colaborSel&&acoesSel.length>0?"#fff":"#94A3B8",border:"none",borderRadius:10,padding:"13px 0",fontSize:14,fontWeight:700,cursor:colaborSel&&acoesSel.length>0?"pointer":"not-allowed",fontFamily:"inherit"}}>
          {saving?"Salvando...":"Salvar Plano de Ação"}
        </button>
      </div>
    );
  }
  // ── LISTA DE PLANOS ───────────────────────────────────────────
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#111"}}>Planos de Ação</div>
        <button onClick={()=>{setView("novo");setMsg("");}}
          style={{background:C2.indigo,color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          + Novo Plano
        </button>
      </div>
      {/* Resumo */}
      {planos.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"#E5E5E5",borderRadius:10,overflow:"hidden"}}>
          {[
            {l:"Total",    v:planos.length,                            col:"#111"},
            {l:"Ativos",   v:planos.filter(p=>p.percentual<100).length, col:C2.amber},
            {l:"Concluídos",v:planos.filter(p=>p.percentual===100).length,col:C2.green},
          ].map((k,i)=>(
            <div key={i} style={{background:"#fff",padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:10,color:C2.txtMuted,marginBottom:3}}>{k.l}</div>
              <div style={{fontSize:22,fontWeight:900,color:k.col}}>{k.v}</div>
            </div>
          ))}
        </div>
      )}
      {loading?(
        <div style={{textAlign:"center",padding:40,color:C2.txtMuted}}>Carregando...</div>
      ):planos.length===0?(
        <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,padding:"40px 24px",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:12}}>📌</div>
          <div style={{fontSize:14,fontWeight:700,color:"#555",marginBottom:8}}>Nenhum plano criado ainda</div>
          <div style={{fontSize:12,color:C2.txtMuted,marginBottom:16}}>Crie um plano vinculado ao diagnóstico da IA</div>
          <button onClick={()=>setView("novo")} style={{background:C2.indigo,color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Criar primeiro plano</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {planos.map((p,i)=>{
            const si=statusInfo(p.status,p.percentual||0);
            return(
              <div key={i} onClick={()=>{setSelPlano(p);setView("detalhe");}}
                style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,padding:16,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{p.colaboradores?.nome||"Colaborador"}</div>
                    <div style={{fontSize:10,color:C2.txtMuted,marginTop:2}}>{p.colaboradores?.equipe} · {p.data_criacao}</div>
                  </div>
                  <span style={{fontSize:9,fontWeight:700,color:si.col,background:si.bg,borderRadius:20,padding:"3px 8px",flexShrink:0}}>{si.l}</span>
                </div>
                {/* Barra progresso */}
                <div style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:10,color:C2.txtMuted}}>{(p.acoes||[]).length} ações selecionadas</span>
                    <span style={{fontSize:11,fontWeight:800,color:si.col}}>{p.percentual||0}%</span>
                  </div>
                  <div style={{height:6,background:"#F1F5F9",borderRadius:3}}>
                    <div style={{width:`${p.percentual||0}%`,height:"100%",background:p.percentual===100?C2.green:p.percentual>=50?C2.blue:C2.amber,borderRadius:3}}/>
                  </div>
                </div>
                {p.observacao&&(
                  <div style={{fontSize:10,color:C2.txtMuted,marginTop:6,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    📝 {p.observacao}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PlanosTab;
