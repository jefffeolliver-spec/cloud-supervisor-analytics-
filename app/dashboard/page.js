"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getColaboradores, getPlanos, getMetas, getNotificacoes, importarCSV, marcarLida } from "@/lib/db";
import { calcScore, calcTier } from "@/lib/score";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const C = { bg:"#F8FAFC",bgAlt:"#F1F5F9",surface:"#FFFFFF",border:"#E2E8F0",borderLight:"#F1F5F9",indigo:"#6366F1",indigoLight:"#EEF2FF",indigoDark:"#4F46E5",green:"#10B981",greenLight:"#ECFDF5",red:"#F43F5E",redLight:"#FFF1F2",amber:"#F59E0B",amberLight:"#FFFBEB",sky:"#0EA5E9",skyLight:"#F0F9FF",txt:"#0F172A",txtSub:"#475569",txtMuted:"#94A3B8" };
const PC = { supervisor:{color:"#6366F1",bg:"#EEF2FF"}, coordenador:{color:"#0EA5E9",bg:"#F0F9FF"}, gerente:{color:"#F59E0B",bg:"#FFFBEB"}, diretor:{color:"#10B981",bg:"#ECFDF5"} };
const initials = n => (n||"U").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

const NAV = [
  {id:"overview", icon:"▦", label:"Overview"},
  {id:"ranking",  icon:"◈", label:"Ranking"},
  {id:"equipes",  icon:"◉", label:"Equipes"},
  {id:"planos",   icon:"◫", label:"Planos"},
  {id:"metas",    icon:"o", label:"Metas"},
  {id:"notifs",   icon:"🔔",label:"Notif."},
  {id:"import",   icon:"+", label:"Importar"},
];

export default function Dashboard({ user, onLogout }) {
  const [data,    setData]    = useState([]);
  const [planos,  setPlanos]  = useState([]);
  const [metas,   setMetas]   = useState([]);
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("overview");
  const [menuOpen,setMenuOpen]= useState(false);

  const pc = PC[user?.perfil] || PC.supervisor;
  const unread = notifs.filter(n=>!n.lida).length;

  useEffect(()=>{ loadAll(); },[]);

  async function loadAll() {
    setLoading(true);
    try {
      const [c,p,m,n] = await Promise.all([
        getColaboradores().catch(()=>[]),
        getPlanos().catch(()=>[]),
        getMetas().catch(()=>[]),
        getNotificacoes().catch(()=>[]),
      ]);
      setData(c); setPlanos(p); setMetas(m); setNotifs(n);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); onLogout(); }

  const avgSc  = data.length ? Math.round(data.map(r=>calcScore(r)).reduce((s,v)=>s+v,0)/data.length) : 0;
  const avgEf  = data.length ? Math.round(data.reduce((s,r)=>s+(Number(r.eficiencia)||0),0)/data.length) : 0;
  const totCv  = data.reduce((s,r)=>s+(Number(r.conversoes)||0),0);
  const atRisk = data.filter(r=>calcScore(r)<65).length;

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:12,background:`linear-gradient(135deg,${C.indigo},#818CF8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",margin:"0 auto 12px"}}>C</div>
        <div style={{color:C.txtMuted,fontSize:13}}>Carregando...</div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${C.indigo},#818CF8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff"}}>C</div>
          <span style={{fontSize:14,fontWeight:800,color:C.indigo}}>Cloud Supervisor Analytics</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {unread>0&&<span style={{background:C.red,color:"#fff",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{unread}</span>}
          <div style={{position:"relative"}}>
            <div onClick={()=>setMenuOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"4px 8px",borderRadius:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.indigo},#818CF8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user?.nome)}</div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:C.txt}}>{(user?.nome||"").split(" ")[0]}</div>
                <div style={{fontSize:9,color:pc.color,fontWeight:600,textTransform:"capitalize"}}>{user?.perfil}</div>
              </div>
            </div>
            {menuOpen&&(
              <>
                <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:90}}/>
                <div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",minWidth:180,zIndex:100,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.txt}}>{user?.nome}</div>
                    <div style={{fontSize:10,color:C.txtMuted}}>{user?.email}</div>
                  </div>
                  <div style={{padding:6}}>
                    <button onClick={handleLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:6,cursor:"pointer",fontSize:12,color:C.red,fontWeight:600,background:"transparent",border:"none",textAlign:"left"}}>Sair da conta</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{width:52,background:"#0F172A",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:12,gap:2,flexShrink:0}}>
          {NAV.map(n=>(
            <div key={n.id} title={n.label} onClick={()=>setTab(n.id)}
              style={{width:38,height:38,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:tab===n.id?C.indigo:"transparent",color:tab===n.id?"#fff":"#64748B",fontSize:14,transition:"all 0.15s",position:"relative"}}>
              {n.icon}
              {n.id==="notifs"&&unread>0&&<div style={{position:"absolute",top:4,right:4,width:8,height:8,borderRadius:"50%",background:C.red}}/>}
            </div>
          ))}
        </div>

        <div style={{flex:1,overflow:"auto",padding:20}}>

          {tab==="overview"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{fontSize:16,fontWeight:800,color:C.txt}}>Overview da Operacao</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                {[
                  {l:"Score Medio",  v:avgSc,     col:C.indigo},
                  {l:"Eficiencia",   v:avgEf+"%", col:C.green},
                  {l:"Conversoes",   v:totCv,     col:C.sky},
                  {l:"Em Atencao",   v:atRisk,    col:atRisk>0?C.red:C.green},
                ].map((k,i)=>(
                  <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 18px"}}>
                    <div style={{fontSize:10,color:C.txtMuted,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>{k.l}</div>
                    <div style={{fontSize:28,fontWeight:800,color:k.col}}>{k.v}</div>
                  </div>
                ))}
              </div>
              {data.length===0?(
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px 24px",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:12}}>📂</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.txtSub,marginBottom:8}}>Nenhum dado importado</div>
                  <button onClick={()=>setTab("import")} style={{background:C.indigo,color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Importar dados</button>
                </div>
              ):(
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.txt}}>Top Colaboradores</div>
                  {[...data].sort((a,b)=>calcScore(b)-calcScore(a)).slice(0,5).map((r,i)=>{
                    const sc=calcScore(r); const t=calcTier(sc);
                    return (
                      <div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 60px",gap:10,padding:"10px 16px",borderBottom:`1px solid ${C.borderLight}`,alignItems:"center"}}>
                        <span style={{fontSize:12,fontWeight:700,color:C.txtMuted}}>#{i+1}</span>
                        <div><div style={{fontSize:12,fontWeight:700,color:C.txt}}>{r.nome}</div><div style={{fontSize:10,color:C.txtMuted}}>{r.equipe}</div></div>
                        <span style={{fontSize:14,fontWeight:800,color:t.color}}>{sc}</span>
                        <span style={{fontSize:10,fontWeight:700,color:t.color,background:t.bg,borderRadius:10,padding:"2px 6px",textAlign:"center"}}>{t.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab==="ranking"&&(
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Ranking de Colaboradores</div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                {[...data].sort((a,b)=>calcScore(b)-calcScore(a)).map((r,i)=>{
                  const sc=calcScore(r); const t=calcTier(sc);
                  return (
                    <div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 50px 60px",gap:10,padding:"11px 16px",borderBottom:`1px solid ${C.borderLight}`,alignItems:"center",background:i%2===0?C.surface:C.bgAlt}}>
                      <span style={{fontSize:11,fontWeight:700,color:C.txtMuted}}>#{i+1}</span>
                      <div><div style={{fontSize:12,fontWeight:700,color:C.txt}}>{r.nome}</div><div style={{fontSize:10,color:C.txtMuted}}>{r.equipe}</div></div>
                      <span style={{fontSize:13,fontWeight:800,color:t.color}}>{sc}</span>
                      <span style={{fontSize:11,color:C.txtSub}}>{r.eficiencia}%</span>
                      <span style={{fontSize:10,fontWeight:700,color:t.color,background:t.bg,border:`1px solid ${t.dot}30`,borderRadius:10,padding:"2px 6px",textAlign:"center"}}>{t.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==="equipes"&&(
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Equipes</div>
              {[...new Set(data.map(r=>r.equipe))].map((eq,i)=>{
                const members=data.filter(r=>r.equipe===eq);
                const avgSc2=Math.round(members.map(r=>calcScore(r)).reduce((s,v)=>s+v,0)/members.length);
                const avgEf2=Math.round(members.reduce((s,r)=>s+(Number(r.eficiencia)||0),0)/members.length);
                return (
                  <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.indigo}`,borderRadius:10,padding:"16px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:800,color:C.txt}}>{eq}</div>
                        <div style={{fontSize:11,color:C.txtMuted}}>{members[0]?.supervisor} · {members.length} colaboradores</div>
                      </div>
                      <div style={{fontSize:24,fontWeight:800,color:C.indigo}}>{avgSc2}</div>
                    </div>
                    <div style={{display:"flex",gap:16}}>
                      <div><div style={{fontSize:9,color:C.txtMuted}}>EFICIENCIA</div><div style={{fontSize:16,fontWeight:800,color:C.green}}>{avgEf2}%</div></div>
                      <div><div style={{fontSize:9,color:C.txtMuted}}>CONVERSOES</div><div style={{fontSize:16,fontWeight:800,color:C.sky}}>{members.reduce((s,r)=>s+(Number(r.conversoes)||0),0)}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab==="planos"&&(
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Planos de Acao</div>
              {planos.length===0
                ? <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px",textAlign:"center",color:C.txtMuted}}>Nenhum plano criado.</div>
                : planos.map((p,i)=>{
                    const prCol={critica:C.red,alta:"#F97316",media:C.amber,baixa:C.green}[p.prioridade]||C.amber;
                    const stCol={pendente:C.txtMuted,andamento:C.indigo,concluido:C.green,cancelado:C.txtMuted}[p.status]||C.txtMuted;
                    return (
                      <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`3px solid ${prCol}`,borderRadius:10,padding:"14px 16px",marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <span style={{fontSize:13,fontWeight:700,color:C.txt}}>{p.titulo}</span>
                          <div style={{display:"flex",gap:6}}>
                            <span style={{fontSize:10,fontWeight:700,color:prCol,background:prCol+"15",borderRadius:10,padding:"2px 7px"}}>{p.prioridade}</span>
                            <span style={{fontSize:10,fontWeight:700,color:stCol,background:stCol+"15",borderRadius:10,padding:"2px 7px"}}>{p.status}</span>
                          </div>
                        </div>
                        <div style={{fontSize:11,color:C.txtMuted}}>{p.colaboradores?.nome&&<span>👤 {p.colaboradores.nome} · </span>}🎯 {p.objetivo}</div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {tab==="metas"&&(
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Metas</div>
              {metas.length===0
                ? <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px",textAlign:"center",color:C.txtMuted}}>Nenhuma meta cadastrada.</div>
                : metas.map((m,i)=>{
                    const pct=Math.min(Math.round(((m.valor_atual||0)/m.valor_meta)*100),100)||0;
                    const col=pct>=95?C.green:pct>=70?C.amber:C.red;
                    return (
                      <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:C.txt}}>{m.colaboradores?.nome||m.equipe}</div>
                            <div style={{fontSize:10,color:C.txtMuted,textTransform:"capitalize"}}>{m.indicador} · {m.periodo}</div>
                          </div>
                          <span style={{fontSize:14,fontWeight:800,color:col}}>{pct}%</span>
                        </div>
                        <div style={{height:6,background:C.bgAlt,borderRadius:3}}>
                          <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:3}}/>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {tab==="notifs"&&(
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Notificacoes {unread>0&&<span style={{fontSize:12,color:C.red}}>({unread} nao lidas)</span>}</div>
              {notifs.length===0
                ? <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"40px",textAlign:"center",color:C.txtMuted}}>Nenhuma notificacao.</div>
                : notifs.map((n,i)=>{
                    const tc={critico:C.red,alerta:C.amber,destaque:C.green,info:C.sky,sistema:C.indigo}[n.tipo]||C.indigo;
                    const ic={critico:"🔴",alerta:"🟡",destaque:"🏆",info:"ℹ",sistema:"⚙"}[n.tipo]||"●";
                    return (
                      <div key={i} onClick={async()=>{if(!n.lida){await marcarLida(n.id);setNotifs(prev=>prev.map(x=>x.id===n.id?{...x,lida:true}:x));}}}
                        style={{display:"flex",gap:12,padding:"13px 16px",borderBottom:`1px solid ${C.borderLight}`,background:n.lida?C.surface:tc+"08",cursor:"pointer",borderLeft:`3px solid ${n.lida?C.border:tc}`}}>
                        <span style={{fontSize:16}}>{ic}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:n.lida?600:800,color:C.txt,marginBottom:2}}>{n.titulo}</div>
                          <div style={{fontSize:11,color:C.txtSub}}>{n.mensagem}</div>
                        </div>
                        {!n.lida&&<div style={{width:7,height:7,borderRadius:"50%",background:tc,marginTop:4}}/>}
                      </div>
                    );
                  })
              }
            </div>
          )}

          {tab==="import"&&<ImportTab onImported={(count)=>{loadAll();alert(`${count} registros importados!`);setTab("overview");}}/>}
        </div>
      </div>
    </div>
  );
}

function ImportTab({ onImported }) {
  const [drag,    setDrag]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const ref = useRef();

  async function handleFile(file) {
    setLoading(true); setError("");
    try {
      let rows = [];
      if (file.name.endsWith(".csv")) {
        await new Promise((res,rej)=>{ Papa.parse(file,{header:true,skipEmptyLines:true,complete:r=>{rows=r.data;res();},error:rej}); });
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }
      const count = await importarCSV(rows);
      onImported(count);
    } catch(e) { setError(e.message||"Erro ao importar."); }
    setLoading(false);
  }

  return (
    <div style={{maxWidth:560}}>
      <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Importar Dados</div>
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
        onClick={()=>ref.current?.click()}
        style={{border:`2px dashed ${drag?C.indigo:C.border}`,borderRadius:12,padding:"48px 24px",textAlign:"center",cursor:"pointer",background:drag?C.indigoLight:"transparent"}}>
        <input ref={ref} type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        <div style={{fontSize:32,marginBottom:10}}>📂</div>
        <div style={{fontSize:14,fontWeight:700,color:C.txt,marginBottom:4}}>{loading?"Processando...":"Arraste ou clique para importar"}</div>
        <div style={{fontSize:12,color:C.txtMuted}}>CSV ou Excel</div>
      </div>
      {error&&<div style={{background:C.redLight,border:"1px solid #FECDD3",borderRadius:8,padding:"10px 14px",marginTop:12,fontSize:13,color:C.red}}>{error}</div>}
    </div>
  );
}
