"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = { bg:"#F8FAFC",bgAlt:"#F1F5F9",surface:"#fff",border:"#E2E8F0",indigo:"#6366F1",indigoLight:"#EEF2FF",green:"#10B981",greenLight:"#ECFDF5",red:"#F43F5E",redLight:"#FFF1F2",amber:"#F59E0B",amberLight:"#FFFBEB",sky:"#0EA5E9",txt:"#0F172A",txtSub:"#475569",txtMuted:"#94A3B8" };

const SYSTEM_PROMPT = `Você é a inteligência principal do Cloud Supervisor Analytics com 5 skills integradas:
SKILL 1 - PERFORMANCE ANALYST: Analisa eficiência, CPC, conversão, retenção e produtividade.
SKILL 2 - ROOT CAUSE ANALYST: Investiga causas raiz, correlaciona indicadores.
SKILL 3 - CONTACT CENTER COACH: Cria planos de ação, PDI, coaching e desenvolvimento.
SKILL 4 - OPERATIONS MANAGER: Avalia impacto operacional, financeiro e na meta.
SKILL 5 - WORKFORCE SPECIALIST: Analisa produtividade, ocupação e eficiência operacional.
REGRAS: Compare sempre individual vs média da equipe vs top performers. Nunca entregue apenas números. Transforme dados em recomendações gerenciais. Responda em português BR.`;

function calcScore(r){if(r.score_spa)return r.score_spa;return Math.round((Math.min(Number(r.eficiencia)||0,100)*0.35)+(Math.min((Number(r.conversoes)||0)/50*100,100)*0.25)+(Math.min((Number(r.cpc)||0)/100*100,100)*0.20)+(Math.min((Number(r.tempo_produtivo)||0)/480*100,100)*0.20));}
function tier(s){if(s>=85)return{label:"Top",color:C.green,bg:C.greenLight};if(s>=68)return{label:"Regular",color:C.indigo,bg:C.indigoLight};return{label:"Atencao",color:C.red,bg:C.redLight};}
const initials=n=>(n||"U").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
const avg=(arr,f)=>arr.length?Math.round(arr.reduce((s,r)=>s+(Number(r[f])||0),0)/arr.length):0;

const PERFIS=[{id:"supervisor",label:"Supervisor",icon:"👤"},{id:"coordenador",label:"Coordenador",icon:"👥"},{id:"gerente",label:"Gerente",icon:"📊"},{id:"diretor",label:"Diretor",icon:"🎯"}];
const NAV=[{id:"overview",icon:"▦",label:"Overview"},{id:"ranking",icon:"◈",label:"Ranking"},{id:"ia",icon:"🤖",label:"IA"},{id:"import",icon:"+",label:"Importar"}];

function Input({label,type="text",value,onChange,placeholder}){
  return(<div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:12,fontWeight:600,color:C.txtSub}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{padding:"10px 14px",fontSize:14,color:C.txt,background:C.surface,fontFamily:"inherit",border:"1.5px solid #E2E8F0",borderRadius:8,outline:"none",width:"100%",boxSizing:"border-box"}}/></div>);
}

function LoginScreen({onLogin}){
  const [tab,setTab]=useState("login");
  const [email,setEmail]=useState("");
  const [senha,setSenha]=useState("");
  const [nome,setNome]=useState("");
  const [perfil,setPerfil]=useState("supervisor");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [ok,setOk]=useState("");

  async function login(){
    setLoading(true);setError("");
    try{const{data,error:err}=await supabase.auth.signInWithPassword({email,password:senha});if(err)throw err;const{data:p}=await supabase.from("profiles").select("*").eq("id",data.user.id).single();onLogin(p||{nome:email.split("@")[0],email,perfil:"supervisor"});}
    catch(e){setError(e.message==="Invalid login credentials"?"Email ou senha incorretos.":e.message);}
    setLoading(false);
  }

  async function cadastro(){
    setLoading(true);setError("");setOk("");
    if(!nome||!email||!senha){setError("Preencha todos os campos.");setLoading(false);return;}
    if(senha.length<6){setError("Senha: minimo 6 caracteres.");setLoading(false);return;}
    try{const{error:err}=await supabase.auth.signUp({email,password:senha,options:{data:{nome,perfil}}});if(err)throw err;setOk("Conta criada! Verifique seu email.");setTab("login");}
    catch(e){setError(e.message);}
    setLoading(false);
  }

  const btn={background:"linear-gradient(135deg,#6366F1,#4F46E5)",color:"#fff",border:"none",borderRadius:8,padding:"12px 0",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",marginTop:4};
  const btnD={...btn,background:"#E2E8F0",color:"#94A3B8",cursor:"not-allowed"};

  return(
    <div style={{minHeight:"100vh",padding:20,background:"linear-gradient(135deg,#0F172A,#1E293B)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:56,height:56,borderRadius:14,margin:"0 auto 12px",background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff"}}>C</div>
          <div style={{fontSize:20,fontWeight:800,color:"#F8FAFC"}}>Cloud Supervisor Analytics</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>Plataforma de Performance Operacional</div>
        </div>
        <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
          <div style={{display:"flex",borderBottom:"1px solid #E2E8F0"}}>
            {[["login","Entrar"],["cadastro","Criar conta"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>{setTab(id);setError("");setOk("");}} style={{flex:1,padding:"14px 0",fontSize:13,fontWeight:700,color:tab===id?"#6366F1":"#94A3B8",background:tab===id?"#EEF2FF":"transparent",border:"none",borderBottom:tab===id?"2px solid #6366F1":"2px solid transparent",cursor:"pointer",marginBottom:-1}}>{lbl}</button>
            ))}
          </div>
          <div style={{padding:24}}>
            {error&&<div style={{background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#F43F5E"}}>{error}</div>}
            {ok&&<div style={{background:"#ECFDF5",border:"1px solid #6EE7B7",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#10B981"}}>{ok}</div>}
            {tab==="login"&&(<div style={{display:"flex",flexDirection:"column",gap:14}}><Input label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com"/><Input label="Senha" type="password" value={senha} onChange={setSenha} placeholder="••••••••"/><button onClick={login} disabled={loading} style={loading?btnD:btn}>{loading?"Entrando...":"Entrar"}</button></div>)}
            {tab==="cadastro"&&(<div style={{display:"flex",flexDirection:"column",gap:14}}><Input label="Nome" value={nome} onChange={setNome} placeholder="Seu nome"/><Input label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com"/><Input label="Senha" type="password" value={senha} onChange={setSenha} placeholder="Minimo 6 caracteres"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{PERFIS.map(p=>(<div key={p.id} onClick={()=>setPerfil(p.id)} style={{padding:"10px",cursor:"pointer",borderRadius:8,border:"1.5px solid "+(perfil===p.id?"#6366F1":"#E2E8F0"),background:perfil===p.id?"#EEF2FF":"transparent"}}><div style={{fontSize:11,fontWeight:700,color:perfil===p.id?"#6366F1":"#0F172A"}}>{p.icon} {p.label}</div></div>))}</div><button onClick={cadastro} disabled={loading} style={loading?btnD:btn}>{loading?"Criando...":"Criar conta"}</button></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function IAPanel({data}){
  const [mode,setMode]=useState("coletivo");
  const [selIdx,setSelIdx]=useState(0);
  const [loading,setLoading]=useState(false);
  const [report,setReport]=useState("");
  const [error,setError]=useState("");

  const sel=data[selIdx]||data[0];
  const scored=data.map(r=>({...r,sc:calcScore(r)}));
  const avgSc=scored.length?Math.round(scored.reduce((s,r)=>s+r.sc,0)/scored.length):0;
  const top3=[...scored].sort((a,b)=>b.sc-a.sc).slice(0,3);
  const atRisk=scored.filter(r=>r.sc<65);

  async function generate(){
    setLoading(true);setReport("");setError("");
    let prompt="";
    if(mode==="coletivo"){
      prompt=`Realize um DIAGNOSTICO EXECUTIVO COLETIVO com os dados abaixo:
Total colaboradores: ${data.length} | Score medio: ${avgSc}/100 | Eficiencia media: ${avg(data,"eficiencia")}%
Top 3: ${top3.map(r=>r.nome+" (score "+r.sc+")").join(", ")}
Em risco (score<65): ${atRisk.length===0?"nenhum":atRisk.map(r=>r.nome+" (score "+r.sc+")").join(", ")}
Total conversoes: ${data.reduce((s,r)=>s+(Number(r.conversoes)||0),0)}
Equipes: ${[...new Set(data.map(r=>r.equipe))].join(", ")}`;
    } else {
      const teamM=data.filter(r=>r.equipe===sel.equipe);
      const avgEfT=avg(teamM,"eficiencia");
      const avgCvT=avg(teamM,"conversoes");
      const avgCpT=avg(teamM,"cpc");
      const avgScT=Math.round(teamM.map(r=>calcScore(r)).reduce((s,v)=>s+v,0)/teamM.length);
      const topTeam=[...teamM].sort((a,b)=>calcScore(b)-calcScore(a))[0];
      const rank=[...scored].sort((a,b)=>b.sc-a.sc).findIndex(r=>r.nome===sel.nome)+1;
      prompt=`Realize um DIAGNOSTICO INDIVIDUAL completo para:
COLABORADOR: ${sel.nome} | Equipe: ${sel.equipe} | Supervisor: ${sel.supervisor}
Score SPA: ${calcScore(sel)}/100 | Ranking geral: #${rank} de ${data.length}
Eficiencia: ${sel.eficiencia}% (media equipe: ${avgEfT}%) | CPC: ${sel.cpc} (media: ${avgCpT}) | Conversoes: ${sel.conversoes} (media: ${avgCvT}) | Produtividade: ${Math.round((Number(sel.tempo_produtivo)||0)/480*100)}%
Top da equipe: ${topTeam?.nome} (score ${calcScore(topTeam)})`;
    }

    prompt+=`\n\nUse o formato com todas as 8 secoes:
## DIAGNOSTICO EXECUTIVO
## ANALISE DE TENDENCIA (Em Evolucao/Estavel/Em Queda/Critico)
## CAUSA RAIZ
## IMPACTO OPERACIONAL
## PLANO DE ACAO RECOMENDADO (com Acao, Responsavel, Prazo, Objetivo para cada acao)
## NIVEL DE PRIORIDADE (Baixa/Media/Alta/Critica)
## BENCHMARK (comparar com media da equipe e top performers)
## RECOMENDACAO DA IA (se eu fosse o supervisor, qual seria minha principal acao nos proximos 7 dias?)
Seja especifico, use os dados. Maximo 600 palavras. Portugues BR.`;

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:SYSTEM_PROMPT,messages:[{role:"user",content:prompt}]})});
      const j=await res.json();
      setReport(j.content?.map(b=>b.text||"").join("")||"");
    }catch(e){setError("Erro ao conectar com a IA.");}
    setLoading(false);
  }

  function renderReport(text){
    return text.split("\n").map((line,i)=>{
      if(line.startsWith("## ")){
        return <div key={i} style={{fontSize:11,fontWeight:800,color:C.indigo,textTransform:"uppercase",letterSpacing:1,marginTop:i===0?0:20,marginBottom:8,paddingBottom:6,borderBottom:"2px solid "+C.indigoLight}}>{line.replace("## ","")}</div>;
      }
      if(line.trim()==="") return <div key={i} style={{height:4}}/>;
      if(line.startsWith("- ")||line.startsWith("* ")){
        return <div key={i} style={{display:"flex",gap:8,marginBottom:4}}><span style={{color:C.indigo,flexShrink:0}}>▸</span><span style={{fontSize:13,color:C.txtSub,lineHeight:1.7}}>{line.replace(/^[-*] /,"")}</span></div>;
      }
      return <div key={i} style={{fontSize:13,color:C.txtSub,lineHeight:1.75}}>{line}</div>;
    });
  }

  if(data.length===0) return(
    <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"40px 24px",textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:12}}>🤖</div>
      <div style={{fontSize:14,fontWeight:700,color:C.txtSub,marginBottom:4}}>Nenhum dado disponivel</div>
      <div style={{fontSize:12,color:C.txtMuted}}>Importe um CSV primeiro para usar o diagnostico de IA.</div>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#EEF2FF,#EDE9FE)",borderBottom:"1px solid #C7D2FE",padding:"16px 20px"}}>
          <div style={{fontSize:15,fontWeight:800,color:C.txt,marginBottom:4}}>Motor de IA — 5 Skills</div>
          <div style={{fontSize:11,color:C.txtSub,marginBottom:12}}>Diagnostico · Causa raiz · Plano de acao · Benchmark</div>
          <div style={{display:"flex",gap:4,marginBottom:12}}>
            {[["coletivo","Operacao completa"],["individual","Colaborador individual"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>{setMode(id);setReport("");}} style={{background:mode===id?C.indigo:"transparent",color:mode===id?"#fff":C.txtMuted,border:"1px solid "+(mode===id?C.indigo:C.border),borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{lbl}</button>
            ))}
          </div>
          {mode==="individual"&&(
            <select value={selIdx} onChange={e=>{setSelIdx(Number(e.target.value));setReport("");}} style={{width:"100%",background:"#fff",border:"1px solid "+C.border,borderRadius:6,padding:"8px 10px",fontSize:12,color:C.txt}}>
              {data.map((r,i)=><option key={i} value={i}>{r.nome} — {r.equipe} (score {calcScore(r)})</option>)}
            </select>
          )}
        </div>
        <div style={{padding:"16px 20px"}}>
          {!report&&!loading&&!error&&(
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>🤖</div>
              <div style={{fontSize:13,color:C.txtMuted,marginBottom:16}}>Clique para gerar diagnostico executivo completo com plano de acao e benchmark</div>
              <button onClick={generate} style={{background:C.indigo,color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px #6366F140"}}>Gerar Diagnostico</button>
            </div>
          )}
          {loading&&(
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:13,color:C.indigo,fontWeight:600,marginBottom:4}}>Analisando com 5 skills...</div>
              <div style={{fontSize:11,color:C.txtMuted}}>Performance · Causa raiz · Coach · Operacoes · Produtividade</div>
            </div>
          )}
          {error&&<div style={{color:C.red,fontSize:13,background:C.redLight,padding:"10px 14px",borderRadius:8}}>{error}</div>}
          {report&&(
            <div>
              <div>{renderReport(report)}</div>
              <button onClick={()=>setReport("")} style={{marginTop:16,background:"transparent",border:"1px solid "+C.border,borderRadius:8,padding:"8px 16px",fontSize:12,color:C.txtMuted,cursor:"pointer"}}>Nova Analise</button>
            </div>
          )}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[{l:"Colaboradores",v:data.length,col:C.indigo},{l:"Score medio",v:avgSc,col:C.green},{l:"Em risco",v:atRisk.length,col:atRisk.length>0?C.red:C.green},{l:"Destaques",v:scored.filter(r=>r.sc>=85).length,col:C.amber}].map((k,i)=>(
          <div key={i} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:9,color:C.txtMuted,textTransform:"uppercase",marginBottom:4}}>{k.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.col}}>{k.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({user,onLogout}){
  const [data,setData]=useState([]);
  const [tab,setTab]=useState("overview");
  const [loading,setLoading]=useState(true);
  const [menuOpen,setMenuOpen]=useState(false);

  useEffect(()=>{
    supabase.from("vw_performance_atual").select("*").order("score_spa",{ascending:false})
      .then(({data:d})=>{setData(d||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[]);

  async function handleLogout(){await supabase.auth.signOut();onLogout();}

  const avgSc=data.length?Math.round(data.map(r=>calcScore(r)).reduce((s,v)=>s+v,0)/data.length):0;
  const avgEf=avg(data,"eficiencia");
  const totCv=data.reduce((s,r)=>s+(Number(r.conversoes)||0),0);
  const atRisk=data.filter(r=>calcScore(r)<65).length;

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><div style={{textAlign:"center"}}><div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",margin:"0 auto 12px"}}>C</div><div style={{color:C.txtMuted,fontSize:13}}>Carregando...</div></div></div>);

  return(
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.surface,borderBottom:"1px solid "+C.border,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff"}}>C</div>
          <span style={{fontSize:14,fontWeight:800,color:C.indigo}}>Cloud Supervisor Analytics</span>
        </div>
        <div style={{position:"relative"}}>
          <div onClick={()=>setMenuOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"4px 8px",borderRadius:8}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user?.nome)}</div>
            <div><div style={{fontSize:11,fontWeight:700,color:C.txt}}>{(user?.nome||"").split(" ")[0]}</div><div style={{fontSize:9,color:C.indigo,fontWeight:600,textTransform:"capitalize"}}>{user?.perfil}</div></div>
          </div>
          {menuOpen&&(<><div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:90}}/><div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:C.surface,border:"1px solid "+C.border,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",minWidth:180,zIndex:100,overflow:"hidden"}}><div style={{padding:"10px 14px",borderBottom:"1px solid "+C.border}}><div style={{fontSize:12,fontWeight:700,color:C.txt}}>{user?.nome}</div><div style={{fontSize:10,color:C.txtMuted}}>{user?.email}</div></div><div style={{padding:6}}><button onClick={handleLogout} style={{width:"100%",padding:"8px 10px",borderRadius:6,cursor:"pointer",fontSize:12,color:C.red,fontWeight:600,background:"transparent",border:"none",textAlign:"left"}}>Sair da conta</button></div></div></>)}
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{width:52,background:"#0F172A",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:12,gap:2,flexShrink:0}}>
          {NAV.map(n=>(<div key={n.id} title={n.label} onClick={()=>setTab(n.id)} style={{width:38,height:38,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:tab===n.id?C.indigo:"transparent",color:tab===n.id?"#fff":"#64748B",fontSize:n.id==="ia"?16:14}}>{n.icon}</div>))}
        </div>
        <div style={{flex:1,overflow:"auto",padding:20}}>

          {tab==="overview"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{fontSize:16,fontWeight:800,color:C.txt}}>Overview da Operacao</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                {[{l:"Score Medio",v:avgSc,col:C.indigo},{l:"Eficiencia",v:avgEf+"%",col:C.green},{l:"Conversoes",v:totCv,col:C.sky},{l:"Em Atencao",v:atRisk,col:atRisk>0?C.red:C.green}].map((k,i)=>(
                  <div key={i} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"16px 18px"}}><div style={{fontSize:10,color:C.txtMuted,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>{k.l}</div><div style={{fontSize:28,fontWeight:800,color:k.col}}>{k.v}</div></div>
                ))}
              </div>
              {data.length===0?(
                <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"40px 24px",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:12}}>📂</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.txtSub,marginBottom:8}}>Nenhum dado importado</div>
                  <button onClick={()=>setTab("import")} style={{background:C.indigo,color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Importar dados</button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,fontSize:13,fontWeight:700,color:C.txt}}>Top Colaboradores</div>
                    {[...data].sort((a,b)=>calcScore(b)-calcScore(a)).slice(0,5).map((r,i)=>{const sc=calcScore(r);const t=tier(sc);return(<div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 60px",gap:10,padding:"10px 16px",borderBottom:"1px solid "+C.bgAlt,alignItems:"center"}}><span style={{fontSize:12,fontWeight:700,color:C.txtMuted}}>#{i+1}</span><div><div style={{fontSize:12,fontWeight:700,color:C.txt}}>{r.nome}</div><div style={{fontSize:10,color:C.txtMuted}}>{r.equipe}</div></div><span style={{fontSize:14,fontWeight:800,color:t.color}}>{sc}</span><span style={{fontSize:10,fontWeight:700,color:t.color,background:t.bg,borderRadius:10,padding:"2px 6px",textAlign:"center"}}>{t.label}</span></div>);})}
                  </div>
                  {atRisk>0&&(
                    <div style={{background:C.redLight,border:"1px solid #FECDD3",borderRadius:10,padding:16}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:8}}>Colaboradores em Atencao</div>
                      {data.filter(r=>calcScore(r)<65).map((r,i)=>(
                        <div key={i} style={{fontSize:12,color:C.red,marginBottom:4}}>▸ {r.nome} — Score {calcScore(r)} · Efic. {r.eficiencia}%</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab==="ranking"&&(
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Ranking de Colaboradores</div>
              <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,overflow:"hidden"}}>
                {[...data].sort((a,b)=>calcScore(b)-calcScore(a)).map((r,i)=>{const sc=calcScore(r);const t=tier(sc);return(<div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 50px 60px",gap:10,padding:"11px 16px",borderBottom:"1px solid "+C.bgAlt,alignItems:"center",background:i%2===0?C.surface:C.bgAlt}}><span style={{fontSize:11,fontWeight:700,color:C.txtMuted}}>#{i+1}</span><div><div style={{fontSize:12,fontWeight:700,color:C.txt}}>{r.nome}</div><div style={{fontSize:10,color:C.txtMuted}}>{r.equipe}</div></div><span style={{fontSize:13,fontWeight:800,color:t.color}}>{sc}</span><span style={{fontSize:11,color:C.txtSub}}>{r.eficiencia}%</span><span style={{fontSize:10,fontWeight:700,color:t.color,background:t.bg,borderRadius:10,padding:"2px 6px",textAlign:"center"}}>{t.label}</span></div>);})}
              </div>
            </div>
          )}

          {tab==="ia"&&<IAPanel data={data}/>}

          {tab==="import"&&(
            <div style={{maxWidth:500}}>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Importar Dados</div>
              <label style={{display:"block",border:"2px dashed #E2E8F0",borderRadius:12,padding:"48px 24px",textAlign:"center",cursor:"pointer"}}>
                <input type="file" accept=".csv" style={{display:"none"}} onChange={async e=>{
                  const file=e.target.files[0];if(!file)return;
                  try{
                    const text=await file.text();
                    const lines=text.split("\n");
                    const headers=lines[0].split(",").map(h=>h.trim().replace(/"/g,""));
                    const rows=lines.slice(1).filter(l=>l.trim()).map(l=>{const vals=l.split(",").map(v=>v.trim().replace(/"/g,""));const obj={};headers.forEach((h,i)=>obj[h]=vals[i]||"");return obj;});
                    const uniqueColabs=[];const seen=new Set();
                    rows.forEach(r=>{const key=r.nome+"__"+r.equipe;if(!seen.has(key)){seen.add(key);uniqueColabs.push({nome:r.nome,equipe:r.equipe,supervisor:r.supervisor||"",localizacao:r.localizacao||""});}});
                    const{data:cd}=await supabase.from("colaboradores").upsert(uniqueColabs,{onConflict:"nome,equipe"}).select("id,nome,equipe");
                    const colabMap={};(cd||[]).forEach(c=>{colabMap[c.nome+"__"+c.equipe]=c.id;});
                    const hoje=new Date().toISOString().split("T")[0];
                    const perf=rows.map(r=>{const id=colabMap[r.nome+"__"+r.equipe];if(!id)return null;return{colaborador_id:id,data:hoje,chamadas_recebidas:Number(r.chamadas_recebidas)||0,chamadas_realizadas:Number(r.chamadas_realizadas)||0,cpc:Number(r.cpc)||0,retidos:Number(r.retidos)||0,conversoes:Number(r.conversoes)||0,eficiencia:Number(r.eficiencia)||0,tempo_produtivo:Number(r.tempo_produtivo)||0,tempo_logado:Number(r.tempo_logado)||0};}).filter(Boolean);
                    await supabase.from("performance_diaria").upsert(perf,{onConflict:"colaborador_id,data"});
                    alert(perf.length+" registros importados!");
                    const{data:d}=await supabase.from("vw_performance_atual").select("*").order("score_spa",{ascending:false});
                    setData(d||[]);setTab("overview");
                  }catch(err){alert("Erro: "+err.message);}
                }}/>
                <div style={{fontSize:32,marginBottom:10}}>📂</div>
                <div style={{fontSize:14,fontWeight:700,color:C.txt,marginBottom:4}}>Toque para importar CSV</div>
                <div style={{fontSize:12,color:C.txtMuted}}>Formato CSV com cabecalho</div>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home(){
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session){supabase.from("profiles").select("*").eq("id",session.user.id).single().then(({data:p})=>{setUser(p||{nome:session.user.email,email:session.user.email,perfil:"supervisor"});setLoading(false);}).catch(()=>setLoading(false));}
      else setLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{if(!session)setUser(null);});
    return()=>subscription.unsubscribe();
  },[]);

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0F172A,#1E293B)"}}><div style={{textAlign:"center"}}><div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff",margin:"0 auto 12px"}}>C</div><div style={{color:"#64748B",fontSize:14}}>Carregando...</div></div></div>);

  return user?<Dashboard user={user} onLogout={()=>setUser(null)}/>:<LoginScreen onLogin={setUser}/>;
  }
