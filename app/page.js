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

function calcScore(r){
  // Metas: CPC=20, Retidos=10, Conversao=50%
  const cpc      = Math.min((Number(r.cpc)||0)     / 20  * 100, 100);
  const retidos  = Math.min((Number(r.retidos)||0)  / 10  * 100, 100);
  const conversao= Math.min((Number(r.conversoes)||0)/ 0.5 * 100, 100);
  return Math.round(cpc*0.25 + retidos*0.40 + conversao*0.35);
}
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
    }else{
      const teamM=data.filter(r=>r.equipe===sel.equipe);
      const avgEfT=avg(teamM,"eficiencia");
      const avgCvT=avg(teamM,"conversoes");
      const avgCpT=avg(teamM,"cpc");
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
## ANALISE DE TENDENCIA
## CAUSA RAIZ
## IMPACTO OPERACIONAL
## PLANO DE ACAO RECOMENDADO
## NIVEL DE PRIORIDADE
## BENCHMARK
## RECOMENDACAO DA IA
Seja especifico, use os dados. Maximo 600 palavras. Portugues BR.`;

    try{
      const res=await fetch("/api/ia",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,system:SYSTEM_PROMPT})});
      const j=await res.json();
      if(j.error)throw new Error(j.error);
      setReport(j.content||"");
    }catch(e){setError("Erro ao conectar com a IA.");}
    setLoading(false);
  }

  function renderReport(text){
    return text.split("\n").map((line,i)=>{
      if(line.startsWith("## "))return <div key={i} style={{fontSize:11,fontWeight:800,color:C.indigo,textTransform:"uppercase",letterSpacing:1,marginTop:i===0?0:20,marginBottom:8,paddingBottom:6,borderBottom:"2px solid "+C.indigoLight}}>{line.replace("## ","")}</div>;
      if(line.trim()==="")return <div key={i} style={{height:4}}/>;
      if(line.startsWith("- ")||line.startsWith("* "))return <div key={i} style={{display:"flex",gap:8,marginBottom:4}}><span style={{color:C.indigo,flexShrink:0}}>▸</span><span style={{fontSize:13,color:C.txtSub,lineHeight:1.7}}>{line.replace(/^[-*] /,"")}</span></div>;
      return <div key={i} style={{fontSize:13,color:C.txtSub,lineHeight:1.75}}>{line}</div>;
    });
  }

  if(data.length===0)return(<div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"40px 24px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:12}}>🤖</div><div style={{fontSize:14,fontWeight:700,color:C.txtSub}}>Importe dados primeiro para usar a IA.</div></div>);

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
          {!report&&!loading&&!error&&(<div style={{textAlign:"center",padding:"32px 0"}}><div style={{fontSize:32,marginBottom:8}}>🤖</div><div style={{fontSize:13,color:C.txtMuted,marginBottom:16}}>Gere diagnostico executivo completo com plano de acao e benchmark</div><button onClick={generate} style={{background:C.indigo,color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Gerar Diagnostico</button></div>)}
          {loading&&(<div style={{textAlign:"center",padding:"32px 0"}}><div style={{fontSize:13,color:C.indigo,fontWeight:600,marginBottom:4}}>Analisando com 5 skills...</div><div style={{fontSize:11,color:C.txtMuted}}>Performance · Causa raiz · Coach · Operacoes · Produtividade</div></div>)}
          {error&&<div style={{color:C.red,fontSize:13,background:C.redLight,padding:"10px 14px",borderRadius:8}}>{error}</div>}
          {report&&(<div><div>{renderReport(report)}</div><button onClick={()=>setReport("")} style={{marginTop:16,background:"transparent",border:"1px solid "+C.border,borderRadius:8,padding:"8px 16px",fontSize:12,color:C.txtMuted,cursor:"pointer"}}>Nova Analise</button></div>)}
        </div>
      </div>
    </div>
  );
}

// ── FORMULÁRIO MANUAL ─────────────────────────────────────────
function FormularioManual({onSuccess}){
  const hoje = new Date().toISOString().split("T")[0];
  const empty = {nome:"",equipe:"",supervisor:"",data:hoje,chamadas_recebidas:"",chamadas_realizadas:"",cpc:"",retidos:"",conversoes:"",eficiencia:"",tempo_produtivo:"",tempo_logado:"480",localizacao:""};
  const [form,setForm]=useState(empty);
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState("");

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  // Auto-calcular campos derivados
  function autoCalc(updated){
    const rec=Number(updated.chamadas_recebidas)||0;
    const real=Number(updated.chamadas_realizadas)||0;
    const cpc=Number(updated.cpc)||0;
    const ret=Number(updated.retidos)||0;
    const tlog=Number(updated.tempo_logado)||480;
    const newForm={...updated};
    if(cpc>0&&ret>0&&!updated._conv_manual) newForm.conversoes=String(Math.round(ret/cpc*100)/100);
    if(rec>0&&cpc>0&&!updated._efic_manual) newForm.eficiencia=String(Math.round(cpc/rec*100*100)/100);
    if(newForm.eficiencia&&tlog>0&&!updated._tp_manual) newForm.tempo_produtivo=String(Math.round(Number(newForm.eficiencia)/100*tlog));
    if(rec>0&&real>0&&cpc>0&&!updated._loc_manual) newForm.localizacao=String(Math.round(cpc/(rec+real)*10000)/10000);
    return newForm;
  }

  function handleChange(k,v){
    const manual_flags={conversoes:"_conv_manual",eficiencia:"_efic_manual",tempo_produtivo:"_tp_manual",localizacao:"_loc_manual"};
    let updated={...form,[k]:v};
    if(manual_flags[k]) updated[manual_flags[k]]=true;
    setForm(autoCalc(updated));
  }

  async function salvar(){
    if(!form.nome||!form.equipe||!form.supervisor){setMsg("Preencha nome, equipe e supervisor.");return;}
    setLoading(true);setMsg("");
    try{
      const{data:cd,error:e1}=await supabase.from("colaboradores").upsert([{nome:form.nome,equipe:form.equipe,supervisor:form.supervisor,localizacao:String(form.localizacao||"")}],{onConflict:"nome,equipe"}).select("id");
      if(e1)throw e1;
      const id=cd?.[0]?.id;
      if(!id)throw new Error("Colaborador nao encontrado apos upsert");
      const{error:e2}=await supabase.from("performance_diaria").upsert([{
        colaborador_id:id,data:form.data||hoje,
        chamadas_recebidas:Number(form.chamadas_recebidas)||0,
        chamadas_realizadas:Number(form.chamadas_realizadas)||0,
        cpc:Number(form.cpc)||0,retidos:Number(form.retidos)||0,
        conversoes:Number(form.conversoes)||0,eficiencia:Number(form.eficiencia)||0,
        tempo_produtivo:Number(form.tempo_produtivo)||0,tempo_logado:Number(form.tempo_logado)||480,
      }],{onConflict:"colaborador_id,data"});
      if(e2)throw e2;
      setMsg("Registro salvo com sucesso!");
      setForm({...empty,equipe:form.equipe,supervisor:form.supervisor});
      onSuccess();
    }catch(e){setMsg("Erro: "+e.message);}
    setLoading(false);
  }

  const FI=({label,k,type="number",placeholder=""})=>(
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:11,fontWeight:600,color:C.txtSub}}>{label}</label>
      <input type={type} value={form[k]} onChange={e=>handleChange(k,e.target.value)} placeholder={placeholder}
        style={{padding:"8px 10px",fontSize:13,color:C.txt,background:C.surface,fontFamily:"inherit",border:"1.5px solid #E2E8F0",borderRadius:7,outline:"none",width:"100%",boxSizing:"border-box"}}/>
    </div>
  );

  return(
    <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,overflow:"hidden",marginTop:16}}>
      <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.border,background:C.bgAlt,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:700,color:C.txt}}>Inserir Registro Manual</div>
        <span style={{fontSize:11,color:C.txtMuted}}>Campos calculados automaticamente</span>
      </div>
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FI label="Nome *" k="nome" type="text" placeholder="Nome completo"/>
          <FI label="Equipe *" k="equipe" type="text" placeholder="Ex: Talentos"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FI label="Supervisor *" k="supervisor" type="text" placeholder="Nome do supervisor"/>
          <FI label="Data *" k="data" type="date"/>
        </div>
        <div style={{fontSize:11,fontWeight:700,color:C.indigo,marginTop:4,marginBottom:-4}}>Indicadores de chamada</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <FI label="Chamadas Recebidas" k="chamadas_recebidas"/>
          <FI label="Chamadas Realizadas" k="chamadas_realizadas"/>
          <FI label="CPC" k="cpc"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FI label="Retidos" k="retidos"/>
          <FI label="Conversoes (auto)" k="conversoes"/>
        </div>
        <div style={{fontSize:11,fontWeight:700,color:C.indigo,marginTop:4,marginBottom:-4}}>Produtividade</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <FI label="Eficiencia % (auto)" k="eficiencia"/>
          <FI label="Tempo Produtivo (auto)" k="tempo_produtivo"/>
          <FI label="Tempo Logado (min)" k="tempo_logado"/>
        </div>
        {msg&&<div style={{padding:"10px 14px",borderRadius:8,background:msg.includes("Erro")?C.redLight:C.greenLight,border:"1px solid "+(msg.includes("Erro")?"#FECDD3":"#6EE7B7"),fontSize:13,color:msg.includes("Erro")?C.red:C.green,fontWeight:600}}>{msg}</div>}
        <button onClick={salvar} disabled={loading} style={{background:loading?"#E2E8F0":C.indigo,color:loading?C.txtMuted:"#fff",border:"none",borderRadius:8,padding:"11px 0",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"0 4px 12px #6366F140"}}>
          {loading?"Salvando...":"Salvar Registro"}
        </button>
      </div>
    </div>
  );
}

async function parseFile(file){
  if(file.name.match(/\.xlsx?$/i)){
    const XLSX=await import("xlsx");
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf);
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{raw:false,defval:""});
  }else{
    const text=await file.text();
    const lines=text.split("\n");
    const headers=lines[0].split(",").map(h=>h.trim().replace(/"/g,""));
    return lines.slice(1).filter(l=>l.trim()).map(l=>{
      const vals=l.split(",").map(v=>v.trim().replace(/"/g,""));
      const obj={};headers.forEach((h,i)=>obj[h]=vals[i]||"");return obj;
    });
  }
}

function Dashboard({user,onLogout}){
  const [data,setData]=useState([]);
  const [tab,setTab]=useState("overview");
  const [loading,setLoading]=useState(true);
  const [menuOpen,setMenuOpen]=useState(false);
  const [importTab,setImportTab]=useState("arquivo");
  const [importMsg,setImportMsg]=useState("");

  const loadData=()=>{
    supabase.from("vw_performance_atual").select("*").order("score_spa",{ascending:false})
      .then(({data:d})=>{setData(d||[]);setLoading(false);}).catch(()=>setLoading(false));
  };

  useEffect(()=>{loadData();},[]);
  async function handleLogout(){await supabase.auth.signOut();onLogout();}

  async function handleFile(file){
    setImportMsg("Processando...");
    try{
      const rows=await parseFile(file);
      const uniqueColabs=[];const seen=new Set();
      rows.forEach(r=>{
        const key=(r.nome||"")+"__"+(r.equipe||"");
        if(!seen.has(key)&&r.nome){seen.add(key);uniqueColabs.push({nome:r.nome,equipe:r.equipe||"",supervisor:r.supervisor||"",localizacao:String(r.localizacao||"")});}
      });
      if(!uniqueColabs.length){setImportMsg("Nenhum colaborador encontrado. Verifique o arquivo.");return;}
      const{data:cd,error:e1}=await supabase.from("colaboradores").upsert(uniqueColabs,{onConflict:"nome,equipe"}).select("id,nome,equipe");
      if(e1)throw e1;
      const colabMap={};(cd||[]).forEach(c=>{colabMap[c.nome+"__"+c.equipe]=c.id;});
      const hoje=new Date().toISOString().split("T")[0];
      const perf=rows.map(r=>{
        const id=colabMap[(r.nome||"")+"__"+(r.equipe||"")];
        if(!id)return null;
        return{colaborador_id:id,data:r.data||hoje,chamadas_recebidas:Number(r.chamadas_recebidas)||0,chamadas_realizadas:Number(r.chamadas_realizadas)||0,cpc:Number(r.cpc)||0,retidos:Number(r.retidos)||0,conversoes:Number(r.conversoes)||0,eficiencia:Number(r.eficiencia)||0,tempo_produtivo:Number(r.tempo_produtivo)||0,tempo_logado:Number(r.tempo_logado)||0};
      }).filter(Boolean);
      const{error:e2}=await supabase.from("performance_diaria").upsert(perf,{onConflict:"colaborador_id,data"});
      if(e2)throw e2;
      loadData();
      setImportMsg(perf.length+" registros importados com sucesso!");
    }catch(err){setImportMsg("Erro: "+err.message);}
  }

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
                  {atRisk>0&&(<div style={{background:C.redLight,border:"1px solid #FECDD3",borderRadius:10,padding:16}}><div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:8}}>Colaboradores em Atencao</div>{data.filter(r=>calcScore(r)<65).map((r,i)=>(<div key={i} style={{fontSize:12,color:C.red,marginBottom:4}}>▸ {r.nome} — Score {calcScore(r)} · Efic. {r.eficiencia}%</div>))}</div>)}
                </div>
              )}
            </div>
          )}

          {tab==="ranking"&&(
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Ranking de Colaboradores</div>
              <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,overflow:"hidden"}}>
                {data.length===0?<div style={{padding:40,textAlign:"center",color:C.txtMuted}}>Nenhum dado. Importe primeiro.</div>:
                [...data].sort((a,b)=>calcScore(b)-calcScore(a)).map((r,i)=>{const sc=calcScore(r);const t=tier(sc);return(<div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 50px 60px",gap:10,padding:"11px 16px",borderBottom:"1px solid "+C.bgAlt,alignItems:"center",background:i%2===0?C.surface:C.bgAlt}}><span style={{fontSize:11,fontWeight:700,color:C.txtMuted}}>#{i+1}</span><div><div style={{fontSize:12,fontWeight:700,color:C.txt}}>{r.nome}</div><div style={{fontSize:10,color:C.txtMuted}}>{r.equipe}</div></div><span style={{fontSize:13,fontWeight:800,color:t.color}}>{sc}</span><span style={{fontSize:11,color:C.txtSub}}>{r.eficiencia}%</span><span style={{fontSize:10,fontWeight:700,color:t.color,background:t.bg,borderRadius:10,padding:"2px 6px",textAlign:"center"}}>{t.label}</span></div>);})}
              </div>
            </div>
          )}

          {tab==="ia"&&<IAPanel data={data}/>}

          {tab==="import"&&(
            <div style={{maxWidth:560}}>
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Inserir Dados</div>

              {/* Tab selector */}
              <div style={{display:"flex",gap:4,background:C.bgAlt,borderRadius:8,padding:4,marginBottom:16,width:"fit-content"}}>
                {[["arquivo","📂 Upload de Arquivo"],["manual","✏️ Inserir Manualmente"]].map(([id,lbl])=>(
                  <button key={id} onClick={()=>{setImportTab(id);setImportMsg("");}} style={{background:importTab===id?C.surface:"transparent",color:importTab===id?C.txt:C.txtMuted,border:importTab===id?"1px solid "+C.border:"1px solid transparent",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{lbl}</button>
                ))}
              </div>

              {importTab==="arquivo"&&(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <label style={{display:"block",border:"2px dashed #E2E8F0",borderRadius:12,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:C.surface}}>
                    <input type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)handleFile(f);}}/>
                    <div style={{fontSize:32,marginBottom:10}}>📂</div>
                    <div style={{fontSize:14,fontWeight:700,color:C.txt,marginBottom:4}}>Toque para selecionar arquivo</div>
                    <div style={{fontSize:12,color:C.txtMuted}}>Aceita CSV e Excel (.xlsx .xls)</div>
                  </label>
                  {importMsg&&(<div style={{padding:"12px 16px",borderRadius:8,background:importMsg.includes("Erro")?C.redLight:importMsg==="Processando..."?C.indigoLight:C.greenLight,border:"1px solid "+(importMsg.includes("Erro")?"#FECDD3":importMsg==="Processando..."?"#C7D2FE":"#6EE7B7"),fontSize:13,color:importMsg.includes("Erro")?C.red:importMsg==="Processando..."?C.indigo:C.green,fontWeight:600}}>{importMsg}</div>)}
                  <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.txt,marginBottom:8}}>Colunas esperadas:</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {["nome","equipe","supervisor","data","chamadas_recebidas","chamadas_realizadas","cpc","retidos","conversoes","eficiencia","tempo_produtivo","tempo_logado","localizacao"].map(c=>(
                        <span key={c} style={{background:C.bgAlt,border:"1px solid "+C.border,borderRadius:4,padding:"2px 8px",fontSize:10,color:C.txtSub,fontFamily:"monospace"}}>{c}</span>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:C.txtMuted,marginTop:8}}>Data no formato YYYY-MM-DD. Se omitida usa hoje.</div>
                  </div>
                </div>
              )}

              {importTab==="manual"&&(
                <FormularioManual onSuccess={()=>{loadData();}}/>
              )}
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
