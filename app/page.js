"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const C = { bg:"#F8FAFC",bgAlt:"#F1F5F9",surface:"#fff",border:"#E2E8F0",indigo:"#6366F1",indigoLight:"#EEF2FF",green:"#10B981",greenLight:"#ECFDF5",red:"#F43F5E",redLight:"#FFF1F2",amber:"#F59E0B",amberLight:"#FFFBEB",sky:"#0EA5E9",txt:"#0F172A",txtSub:"#475569",txtMuted:"#94A3B8" };
const SYSTEM_PROMPT = `Você é o especialista em inteligência operacional do Cloud Supervisor Analytics, com domínio profundo em CENTRAL DE RETENÇÃO DE PORTABILIDADE BANCÁRIA. Possui 5 skills integradas:
CONTEXTO DA OPERAÇÃO:
A central atende clientes de uma instituição bancária que solicitaram portabilidade para outra instituição. O objetivo é RETER o cliente antes que ele efetive a portabilidade. O processo correto é:
1. SONDAGEM: Identificar o real motivo da solicitação de portabilidade (taxa, atendimento, produto, concorrente, vida financeira)
2. ARGUMENTAÇÃO: Apresentar benefícios assertivos e personalizados com base na sondagem. Mínimo 3 argumentos diferentes sem ser redundante. Não aceitar o primeiro "não" — persistir com novos ângulos de valor.
3. FECHAMENTO: Aproveitar qualquer momento de hesitação, dúvida ou silêncio do cliente para conduzir ao fechamento consultivo da retenção.
INDICADORES-CHAVE:
- CPC (Contato Produtivo com Cliente): conseguiu falar com o cliente decisor
- RETIDOS: clientes que cancelaram a portabilidade e permaneceram
- CONVERSÃO: retidos/CPC — mede eficiência do processo de retenção
SKILL 1 - ANALISTA DE RETENÇÃO BANCÁRIA:
Identifica o perfil do colaborador:
- LOCALIZADOR: CPC alto, retenção baixa → consegue falar mas não retém → problema na sondagem e argumentação
- CONVERSOR: CPC baixo, retenção alta → dificuldade de localizar o cliente decisor → problema de abordagem inicial
- EQUILIBRADO: CPC e retenção proporcionais → performance consistente
- CRÍTICO: ambos baixos → necessidade urgente de intervenção
SKILL 2 - CAUSA RAIZ EM PORTABILIDADE BANCÁRIA:
Diagnostica em qual etapa o colaborador está perdendo o cliente:
- SONDAGEM SUPERFICIAL: ligação curta, não identificou o real motivo da portabilidade
- ARGUMENTAÇÃO FRACA: usou argumentos genéricos sem personalização
- REDUNDÂNCIA: repetiu o mesmo argumento sem variar abordagem
- FECHAMENTO PERDIDO: cliente hesitou mas o colaborador não aproveitou para fechar
- DESISTÊNCIA PREMATURA: abandonou após primeiro ou segundo "não"
SKILL 3 - COACH DE RETENÇÃO BANCÁRIA:
Cria planos de ação com:
- Scripts de sondagem aberta e assertiva
- Argumentos personalizados por motivo de portabilidade
- Técnicas de reversão dos 3 "nãos" com ângulos diferentes
- Gatilhos de fechamento (hesitação, silêncio, "vou pensar")
- Ancoragem de valor dos benefícios da instituição
SKILL 4 - GESTOR DE OPERAÇÃO:
Avalia impacto de cada portabilidade perdida, compara supervisores, identifica padrões de horário e perfil de cliente.
SKILL 5 - ESPECIALISTA EM PERFORMANCE:
Correlaciona CPC x Retidos x Conversão para identificar gargalos individuais e coletivos.
REGRAS OBRIGATÓRIAS:
- Sempre classifique o perfil do colaborador (LOCALIZADOR/CONVERSOR/EQUILIBRADO/CRÍTICO)
- Sempre identifique em qual etapa do processo está o gargalo
- Nunca entregue apenas números — transforme em diagnóstico acionável
- Plano de ação sempre com ações práticas de retenção bancária
- Foco em O QUE FAZER AMANHÃ na operação
- Responda em português BR`;
function calcScore(r){
  // Metas diarias fixas — score e sempre media dos dias
  const nd = r._numDias||1;
  const cpc      = Math.min((Number(r.cpc)||0)      / (20*nd) * 100, 100);
  const retidos  = Math.min((Number(r.retidos)||0)   / (10*nd) * 100, 100);
  const conversao= Math.min((Number(r.conversoes)||0) / 0.5    * 100, 100);
  return Math.round(cpc*0.25 + retidos*0.40 + conversao*0.35);
}
function tier(s){if(s>=85)return{label:"Top",color:C.green,bg:C.greenLight};if(s>=68)return{label:"Regular",color:C.indigo,bg:C.indigoLight};return{label:"Atencao",color:C.red,bg:C.redLight};}
const initials=n=>(n||"U").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
const avg=(arr,f)=>arr.length?Math.round(arr.reduce((s,r)=>s+(Number(r[f])||0),0)/arr.length):0;
const PERFIS=[{id:"supervisor",label:"Supervisor",icon:"👤"},{id:"coordenador",label:"Coordenador",icon:"👥"},{id:"gerente",label:"Gerente",icon:"📊"},{id:"diretor",label:"Diretor",icon:"🎯"}];
const NAV=[{id:"overview",icon:"▦",label:"Overview"},{id:"ranking",icon:"◈",label:"Ranking"},{id:"historico",icon:"📋",label:"Historico"},{id:"ia",icon:"🤖",label:"IA"},{id:"planos",icon:"📌",label:"Planos"},{id:"export",icon:"📊",label:"Exportar"},{id:"import",icon:"+",label:"Importar"},{id:"config",icon:"⚙",label:"Config"}];
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
function IAPanel({data, datasSel=[]}){
  const [mode,setMode]=useState("coletivo");
  const [selIdx,setSelIdx]=useState(0);
  const [loading,setLoading]=useState(false);
  const [report,setReport]=useState("");
  const [error,setError]=useState("");
  const sel=data[selIdx]||data[0];
  const scored=data.map(r=>({...r,sc:calcScore(r)}));
  const avgSc=scored.length?Math.round(scored.reduce((s,r)=>s+r.sc,0)/scored.length):0;
  const top3=[...scored].sort((a,b)=>b.sc-a.sc).slice(0,3);
  const atRisk=scored.filter(r=>r.sc<60);
  async function generate(){
    setLoading(true);setReport("");setError("");
    let prompt="";
    const periodoLabel=(datasSel&&datasSel.length>0)?[...datasSel].join(" + "):"periodo atual";
    if(mode==="coletivo"){
      prompt=`Realize um DIAGNOSTICO EXECUTIVO COLETIVO com os dados abaixo:
Periodo analisado: ${periodoLabel}
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
Periodo: ${periodoLabel}
Score SPA: ${calcScore(sel)}/100 | Ranking geral: #${rank} de ${data.length}
Eficiencia: ${sel.eficiencia}% (media equipe: ${avgEfT}%) | CPC: ${sel.cpc} (media: ${avgCpT}) | Conversoes: ${sel.conversoes} (media: ${avgCvT}) | Produtividade: ${Math.round((Number(sel.tempo_produtivo)||0)/480*100)}%
Top da equipe: ${topTeam?.nome} (score ${calcScore(topTeam)})`;
    }
    prompt+=`\n\nUse obrigatoriamente este formato com todas as 8 secoes:
## DIAGNOSTICO EXECUTIVO
Resumo objetivo do desempenho no periodo.
## PERFIL DO COLABORADOR
Classifique: LOCALIZADOR (CPC alto, retencao baixa) ou CONVERSOR (CPC baixo, retencao alta) ou EQUILIBRADO. Explique o que isso significa para a operacao de portabilidade.
## CAUSA RAIZ
Identifique onde esta perdendo o cliente: Localizacao, Argumentacao, Negociacao, Fechamento ou Comprometimento. Use os dados para justificar.
## BENCHMARK
Compare com a media da equipe e o top performer. Destaque o gap principal.
## IMPACTO OPERACIONAL
Quantos clientes foram perdidos para portabilidade que poderiam ter sido retidos. Impacto na meta da equipe.
## PLANO DE ACAO RECOMENDADO
Minimo 3 acoes praticas e especificas para retenção de portabilidade. Inclua: Acao, Responsavel, Prazo, Objetivo mensuravel.
## NIVEL DE PRIORIDADE
Classifique: CRITICA / ALTA / MEDIA / BAIXA com justificativa.
## RECOMENDACAO DA IA
Uma unica acao prioritaria para amanha na operacao. Seja direto e especifico.
Seja especifico, use os dados. Maximo 700 palavras. Portugues BR.`;
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
// ── RANKING TAB ───────────────────────────────────────────────
function RankingTab({datas=[], datasSel=[], setDatasSel, supabase, loadData, setDateModal, setTempSel}){
  const [rankData, setRankData] = useState([]);
  const [loading, setLoading] = useState(false);
  const C2 = { bg:"#F8FAFC",bgAlt:"#F1F5F9",surface:"#fff",border:"#E2E8F0",indigo:"#7C3AED",green:"#059669",greenLight:"#F0FDF4",red:"#E11D48",redLight:"#FEF2F2",amber:"#D97706",amberLight:"#FFFBEB",txt:"#111",txtSub:"#475569",txtMuted:"#94A3B8" };
  useEffect(()=>{
    if(datasSel&&datasSel.length>0) loadRanking(datasSel);
  },[JSON.stringify(datasSel)]);
  useEffect(()=>{
    if(datas&&datas.length>0&&(!datasSel||datasSel.length===0)&&setDatasSel){ setDatasSel([datas[0]]); }
  },[datas]);
  async function loadRanking(filtros){
    setLoading(true);
    try{
      let q=supabase.from("performance_diaria").select("*, colaboradores(nome,equipe,supervisor)");
      if(filtros&&filtros.length>0) q=q.in("data",filtros);
      const{data}=await q;
      const map={};
      (data||[]).forEach(r=>{
        const key=r.colaborador_id;
        if(!map[key]){
          map[key]={...r,nome:r.colaboradores?.nome||"",equipe:r.colaboradores?.equipe||"",supervisor:r.colaboradores?.supervisor||"",_count:1};
        }else{
          map[key].cpc+=Number(r.cpc)||0;
          map[key].retidos+=Number(r.retidos)||0;
          map[key].conversoes+=Number(r.conversoes)||0;
          map[key]._count+=1;
        }
      });
      setRankData(Object.values(map).map(r=>({...r,conversoes:r.cpc>0?Math.round(r.retidos/r.cpc*100)/100:0,_numDias:r._count})));
    }catch(e){console.error(e);}
    setLoading(false);
  }
  function calcSc(r){
    const nd=r._numDias||1;
    const cpc=Math.min((Number(r.cpc)||0)/(20*nd)*100,100);
    const ret=Math.min((Number(r.retidos)||0)/(10*nd)*100,100);
    const conv=Math.min((Number(r.conversoes)||0)/0.5*100,100);
    return Math.round(cpc*0.25+ret*0.40+conv*0.35);
  }
  const sorted=[...(rankData||[])].sort((a,b)=>calcSc(b)-calcSc(a));
  const numDias=(datasSel&&datasSel.length)||1;
  const metaCPC=rankData.length*20*numDias;
  const metaRet=rankData.length*10*numDias;
  const totCPC=rankData.reduce((s,r)=>s+(Number(r.cpc)||0),0);
  const totRet=rankData.reduce((s,r)=>s+(Number(r.retidos)||0),0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header do ranking */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:C2.txt}}>Ranking de Colaboradores</div>
          <div style={{fontSize:11,color:C2.txtMuted,marginTop:2}}>{sorted.length} colaboradores · {datasSel.join(", ")}</div>
        </div>
        <div onClick={()=>{setTempSel&&setTempSel([...datasSel]);setDateModal&&setDateModal(true);}} style={{display:"flex",alignItems:"center",gap:6,background:C2.bgAlt,border:"1.5px solid #6366F1",borderRadius:20,padding:"5px 12px",cursor:"pointer"}}>
          <span style={{fontSize:11}}>📅</span>
          <span style={{fontSize:11,fontWeight:700,color:"#6366F1"}}>{datasSel.length===1?datasSel[0]:datasSel.length+" datas"}</span>
          <span style={{fontSize:10,color:"#6366F1"}}>▾</span>
        </div>
      </div>
      {/* Resumo da data */}
      {rankData.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"#E5E5E5",borderRadius:10,overflow:"hidden"}}>
          {[
            {l:"CPC Total",  v:totCPC+"/"+metaCPC, pct:Math.min(Math.round(totCPC/metaCPC*100),100), col:C2.indigo},
            {l:"Retidos",    v:totRet+"/"+metaRet,  pct:Math.min(Math.round(totRet/metaRet*100),100),  col:C2.green},
            {l:"Score Médio",v:Math.round(sorted.reduce((s,r)=>s+calcSc(r),0)/sorted.length)+"/100", pct:null, col:C2.txt},
          ].map((k,i)=>(
            <div key={i} style={{background:"#fff",padding:"12px 14px"}}>
              <div style={{fontSize:10,color:C2.txtMuted,marginBottom:4}}>{k.l}</div>
              <div style={{fontSize:18,fontWeight:900,color:k.col}}>{k.v}</div>
              {k.pct!==null&&<div style={{fontSize:10,color:k.pct>=100?C2.green:C2.amber,marginTop:2}}>{k.pct}% da meta</div>}
            </div>
          ))}
        </div>
      )}
      {/* Tabela */}
      {loading?(
        <div style={{background:"#fff",border:"1px solid "+C2.border,borderRadius:10,padding:"40px",textAlign:"center",color:C2.txtMuted}}>Carregando...</div>
      ):sorted.length===0?(
        <div style={{background:"#fff",border:"1px solid "+C2.border,borderRadius:10,padding:"40px",textAlign:"center",color:C2.txtMuted}}>Nenhum dado para esta data.</div>
      ):(
        <div style={{background:"#fff",border:"1px solid "+C2.border,borderRadius:10,overflow:"hidden"}}>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><div style={{minWidth:580}}>
          {/* Header da tabela */}
          <div style={{display:"grid",gridTemplateColumns:"36px 150px 60px 60px 60px 60px 64px",gap:0,padding:"10px 14px",background:C2.bgAlt,borderBottom:"1px solid "+C2.border}}>
            {["#","Colaborador","CPC","Retidos","Conv.","Score","Status"].map((h,i)=>(
              <div key={i} style={{fontSize:9,fontWeight:700,color:C2.txtMuted,textTransform:"uppercase",letterSpacing:0.8,textAlign:i>1?"center":"left"}}>{h}</div>
            ))}
          </div>
          {/* Linhas */}
          {sorted.map((r,i)=>{
            const sc=calcSc(r);
            const col=sc>=80?C2.green:sc>=60?"#2563EB":sc>=40?C2.amber:C2.red;
            const colBg=sc>=80?C2.greenLight:sc>=60?"#DBEAFE":sc>=40?C2.amberLight:C2.redLight;
            const conv=Number(r.conversoes)||0;
            const convPct=Math.round(conv*100);
            const convCol=conv>=0.5?C2.green:conv>=0.3?C2.amber:C2.red;
            const cpcCol=(Number(r.cpc)||0)>=20?C2.green:(Number(r.cpc)||0)>=12?C2.amber:C2.red;
            const retCol=(Number(r.retidos)||0)>=10?C2.green:(Number(r.retidos)||0)>=6?C2.amber:C2.red;
            const medalha=i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
            return(
              <div key={i} style={{display:"grid",gridTemplateColumns:"36px 150px 60px 60px 60px 60px 64px",gap:0,padding:"11px 14px",borderBottom:"1px solid "+C2.bgAlt,alignItems:"center",background:i%2===0?"#fff":C2.bg}}>
                <span style={{fontSize:11,fontWeight:800,color:i<3?col:C2.txtMuted}}>{medalha||"#"+(i+1)}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:C2.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.nome}</div>
                  <div style={{fontSize:10,color:C2.txtMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.equipe}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:13,fontWeight:800,color:cpcCol}}>{r.cpc}</span>
                  <div style={{fontSize:8,color:C2.txtMuted}}>/{20}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:13,fontWeight:800,color:retCol}}>{r.retidos}</span>
                  <div style={{fontSize:8,color:C2.txtMuted}}>/{10}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:13,fontWeight:800,color:convCol}}>{convPct}%</span>
                  <div style={{fontSize:8,color:C2.txtMuted}}>/50%</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:14,fontWeight:900,color:col}}>{sc}</span>
                  <div style={{height:3,background:"#F0F0F0",borderRadius:2,marginTop:3}}>
                    <div style={{width:`${sc}%`,height:"100%",background:col,borderRadius:2}}/>
                  </div>
                </div>
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:9,fontWeight:700,color:col,background:colBg,border:"1px solid "+col+"30",borderRadius:10,padding:"3px 6px"}}>{sc>=80?"Top":sc>=60?"Regular":sc>=40?"Atencao":"Critico"}</span>
                </div>
              </div>
            );
          })}
          </div></div>
          <div style={{padding:"7px 14px",borderTop:"1px solid #F1F5F9",fontSize:10,color:"#94A3B8",textAlign:"center"}}>← Deslize para ver mais →</div>
        </div>
      )}
    </div>
  );
}
// ── CONFIG TAB ────────────────────────────────────────────────
function ConfigTab({config, setConfig, supabase, user}){
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [local, setLocal] = useState({...config});
  const C2 = {bg:"#F8FAFC",surface:"#fff",border:"#E2E8F0",indigo:"#6366F1",indigoLight:"#EEF2FF",txt:"#111",txtSub:"#475569",txtMuted:"#94A3B8",green:"#059669",red:"#DC2626"};
  function upd(k,v){ setLocal(p=>({...p,[k]:Number(v)})); }
  async function salvar(){
    setSaving(true); setMsg("");
    try{
      const{data:{user:u}}=await supabase.auth.getUser();
      const{error}=await supabase.from("configuracoes").upsert({
        user_id:u.id,
        meta_cpc:local.metaCPC, meta_ret:local.metaRet, meta_conv:local.metaConv,
        peso_cpc:local.pesoCPC, peso_ret:local.pesoRet, peso_conv:local.pesoConv,
        th_top:local.thTop, th_reg:local.thReg, th_atc:local.thAtc,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
      if(error)throw error;
      setConfig({...local});
      setMsg("Configuracoes salvas!");
    }catch(e){ setMsg("Erro: "+e.message); }
    setSaving(false);
  }
  const Slider=({label,k,min,max,step=1,suffix=""})=>(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:12,fontWeight:600,color:C2.txtSub}}>{label}</span>
        <span style={{fontSize:13,fontWeight:800,color:C2.indigo}}>{local[k]}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={local[k]} onChange={e=>upd(k,e.target.value)}
        style={{width:"100%",accentColor:C2.indigo,cursor:"pointer"}}/>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C2.txtMuted,marginTop:2}}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );
  const total=local.pesoCPC+local.pesoRet+local.pesoConv;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontSize:16,fontWeight:800,color:"#111"}}>Configuracoes</div>
      <div style={{fontSize:11,color:"#888"}}>Configuracoes salvas por perfil de usuario. Cada supervisor tem as suas.</div>
      {/* Metas */}
      <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:18}}>
        <div style={{fontSize:13,fontWeight:700,color:C2.txt,marginBottom:16,paddingBottom:8,borderBottom:"1px solid "+C2.border}}>🎯 Metas Diarias</div>
        <Slider label="Meta CPC (por dia)" k="metaCPC" min={5} max={50}/>
        <Slider label="Meta Retidos (por dia)" k="metaRet" min={1} max={30}/>
        <Slider label="Meta Conversao (%)" k="metaConv" min={10} max={100} suffix="%"/>
      </div>
      {/* Pesos */}
      <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,paddingBottom:8,borderBottom:"1px solid "+C2.border}}>
          <div style={{fontSize:13,fontWeight:700,color:C2.txt}}>⚖️ Pesos do Score</div>
          <div style={{fontSize:11,fontWeight:700,color:total===100?C2.green:C2.red}}>Total: {total}%{total!==100?" ⚠":"  ✓"}</div>
        </div>
        <Slider label="Peso CPC" k="pesoCPC" min={0} max={100} suffix="%"/>
        <Slider label="Peso Retidos" k="pesoRet" min={0} max={100} suffix="%"/>
        <Slider label="Peso Conversao" k="pesoConv" min={0} max={100} suffix="%"/>
        {total!==100&&<div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#92400E",marginTop:8}}>⚠ Os pesos devem somar 100%. Atual: {total}%</div>}
        {/* Barra visual dos pesos */}
        <div style={{display:"flex",height:12,borderRadius:6,overflow:"hidden",marginTop:12,gap:1}}>
          <div style={{flex:local.pesoCPC,background:"#6366F1"}}/>
          <div style={{flex:local.pesoRet,background:"#059669"}}/>
          <div style={{flex:local.pesoConv,background:"#F59E0B"}}/>
        </div>
        <div style={{display:"flex",gap:12,marginTop:6}}>
          {[{l:"CPC",c:"#6366F1",k:"pesoCPC"},{l:"Retidos",c:"#059669",k:"pesoRet"},{l:"Conversao",c:"#F59E0B",k:"pesoConv"}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c}}/><span style={{fontSize:10,color:C2.txtMuted}}>{x.l}: {local[x.k]}%</span></div>
          ))}
        </div>
      </div>
      {/* Thresholds */}
      <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:18}}>
        <div style={{fontSize:13,fontWeight:700,color:C2.txt,marginBottom:16,paddingBottom:8,borderBottom:"1px solid "+C2.border}}>📊 Niveis de Classificacao</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[
            {l:"🟢 Top — minimo",        k:"thTop", col:"#059669"},
            {l:"🔵 Regular — minimo",    k:"thReg", col:"#2563EB"},
            {l:"🟡 Atencao — minimo",    k:"thAtc", col:"#D97706"},
          ].map((t,i)=>(
            <div key={i} style={{background:t.col+"10",border:"1px solid "+t.col+"30",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:t.col,fontWeight:700,marginBottom:6}}>{t.l}</div>
              <input type="number" value={local[t.k]} onChange={e=>upd(t.k,e.target.value)} min={0} max={100}
                style={{width:"100%",background:"transparent",border:"none",fontSize:20,fontWeight:900,color:t.col,outline:"none",fontFamily:"inherit"}}/>
              <div style={{fontSize:9,color:C2.txtMuted}}>pontos</div>
            </div>
          ))}
        </div>
        {/* Preview dos niveis */}
        <div style={{background:C2.bg,borderRadius:8,padding:10}}>
          <div style={{fontSize:10,color:C2.txtMuted,marginBottom:6}}>Preview:</div>
          {[
            {l:"🟢 Top",     r:`${local.thTop} – 100`},
            {l:"🔵 Regular", r:`${local.thReg} – ${local.thTop-1}`},
            {l:"🟡 Atencao", r:`${local.thAtc} – ${local.thReg-1}`},
            {l:"🔴 Critico", r:`0 – ${local.thAtc-1}`},
          ].map((n,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}><span>{n.l}</span><span style={{fontWeight:700}}>{n.r} pts</span></div>))}
        </div>
      </div>
      {msg&&<div style={{padding:"10px 14px",borderRadius:8,background:msg.includes("Erro")?"#FEF2F2":"#F0FDF4",border:"1px solid "+(msg.includes("Erro")?"#FECDD3":"#BBF7D0"),fontSize:13,color:msg.includes("Erro")?C2.red:C2.green,fontWeight:600}}>{msg}</div>}
      <button onClick={salvar} disabled={saving||total!==100} style={{background:total===100?"#6366F1":"#E2E8F0",color:total===100?"#fff":"#94A3B8",border:"none",borderRadius:10,padding:"13px 0",fontSize:14,fontWeight:700,cursor:total===100?"pointer":"not-allowed",fontFamily:"inherit"}}>
        {saving?"Salvando...":"Salvar Configuracoes"}
      </button>
    </div>
  );
}
// ── HISTORICO TAB ─────────────────────────────────────────────
function HistoricoTab({colaboradores, supabase, config}){
  const [nomeSel, setNomeSel] = useState(colaboradores[0]||"");
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState(30);
  const C2 = {bg:"#F8FAFC",surface:"#fff",border:"#E2E8F0",indigo:"#6366F1",indigoLight:"#EEF2FF",green:"#059669",greenLight:"#F0FDF4",red:"#DC2626",redLight:"#FEF2F2",amber:"#D97706",blue:"#2563EB",txt:"#111",txtSub:"#475569",txtMuted:"#94A3B8",bgAlt:"#F1F5F9"};
  function calcSc(r){
    const mc=config?.metaCPC||20, mr=config?.metaRet||10;
    const pc=(config?.pesoCPC||25)/100, pr=(config?.pesoRet||40)/100, pv=(config?.pesoConv||35)/100;
    const cpc=Math.min((Number(r.cpc)||0)/mc*100,100);
    const ret=Math.min((Number(r.retidos)||0)/mr*100,100);
    const conv=Math.min((Number(r.conversoes)||0)/0.5*100,100);
    return Math.round(cpc*pc+ret*pr+conv*pv);
  }
  function tierCol(s){
    const th=config||{thTop:80,thReg:60,thAtc:40};
    if(s>=th.thTop) return{col:C2.green,bg:C2.greenLight,label:"Top"};
    if(s>=th.thReg) return{col:C2.blue,bg:"#DBEAFE",label:"Regular"};
    if(s>=th.thAtc) return{col:C2.amber,bg:"#FEF3C7",label:"Atencao"};
    return{col:C2.red,bg:C2.redLight,label:"Critico"};
  }
  useEffect(()=>{ if(nomeSel) loadHistorico(nomeSel); },[nomeSel, periodo]);
  useEffect(()=>{ if(colaboradores.length>0&&!nomeSel) setNomeSel(colaboradores[0]); },[colaboradores]);
  async function loadHistorico(nome){
    setLoading(true);
    try{
      const from=new Date(); from.setDate(from.getDate()-periodo);
      const fromStr=from.toISOString().split("T")[0];
      const{data:colab}=await supabase.from("colaboradores").select("id").eq("nome",nome).single();
      if(!colab){setHistorico([]);setLoading(false);return;}
      const{data}=await supabase.from("performance_diaria")
        .select("*").eq("colaborador_id",colab.id)
        .gte("data",fromStr).order("data",{ascending:true});
      setHistorico(data||[]);
    }catch(e){console.error(e);}
    setLoading(false);
  }
  const scores=historico.map(r=>calcSc(r));
  const avgSc=scores.length?Math.round(scores.reduce((s,v)=>s+v,0)/scores.length):0;
  const maxSc=scores.length?Math.max(...scores):0;
  const minSc=scores.length?Math.min(...scores):0;
  const totCPC=historico.reduce((s,r)=>s+(Number(r.cpc)||0),0);
  const totRet=historico.reduce((s,r)=>s+(Number(r.retidos)||0),0);
  const trend=scores.length>=2?scores[scores.length-1]-scores[0]:0;
  const t=tierCol(avgSc);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header */}
      <div style={{fontSize:16,fontWeight:800,color:C2.txt}}>Historico do Colaborador</div>
      {/* Seletor colaborador + periodo */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <select value={nomeSel} onChange={e=>{setNomeSel(e.target.value);}}
          style={{width:"100%",background:C2.surface,border:"1.5px solid #6366F1",borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:600,color:"#6366F1",outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
          {colaboradores.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <div style={{display:"flex",gap:6}}>
          {[7,15,30,60,90].map(d=>(
            <div key={d} onClick={()=>setPeriodo(d)} style={{flex:1,textAlign:"center",padding:"7px 0",borderRadius:8,border:"1.5px solid "+(periodo===d?"#6366F1":"#E2E8F0"),background:periodo===d?"#6366F1":"#fff",color:periodo===d?"#fff":"#475569",fontSize:11,fontWeight:700,cursor:"pointer"}}>
              {d}d
            </div>
          ))}
        </div>
      </div>
      {loading?(
        <div style={{textAlign:"center",padding:40,color:C2.txtMuted}}>Carregando historico...</div>
      ):historico.length===0?(
        <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:40,textAlign:"center",color:C2.txtMuted}}>Nenhum dado encontrado para este colaborador no periodo.</div>
      ):(
        <>
          {/* KPIs estilo Excel — cards coloridos */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {l:"Score Medio", v:avgSc, suffix:"/100", bg:t.col, sub:trend>0?"↑ Em evolucao":trend<0?"↓ Em queda":"→ Estavel"},
              {l:"CPC Total",   v:totCPC, suffix:"", bg:"#F59E0B", sub:"Meta: "+((config?.metaCPC||20)*historico.length)},
              {l:"Retidos",     v:totRet, suffix:"", bg:"#059669", sub:"Meta: "+((config?.metaRet||10)*historico.length)},
              {l:"Conversao",   v:totCPC>0?Math.round(totRet/totCPC*100)+"%":"0%", suffix:"", bg:totCPC>0&&totRet/totCPC>=0.5?"#2563EB":"#DC2626", sub:"Meta: 50%"},
              {l:"Dias",        v:historico.length, suffix:" dias", bg:"#475569", sub:"Periodo analisado"},
              {l:"Tendencia",   v:trend>0?"+"+trend:String(trend), suffix:" pts", bg:trend>0?"#059669":trend<0?"#DC2626":"#D97706", sub:trend>0?"Melhorou":"Piorou"},
            ].map((k,i)=>(
              <div key={i} style={{background:k.bg,borderRadius:10,padding:"14px 12px"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{k.l}</div>
                <div style={{fontSize:24,fontWeight:900,color:"#fff",letterSpacing:-1,lineHeight:1}}>{k.v}<span style={{fontSize:12,fontWeight:400,opacity:0.8}}>{k.suffix}</span></div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.7)",marginTop:5}}>{k.sub}</div>
              </div>
            ))}
          </div>
          {/* Grafico evolucao score — estilo Excel */}
          <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:700,color:C2.txt}}>Evolucao do Score</div>
              <div style={{display:"flex",gap:6}}>
                {[{l:"Top",c:C2.green},{l:"Regular",c:C2.blue},{l:"Atencao",c:C2.amber},{l:"Critico",c:C2.red}].map((x,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,borderRadius:2,background:x.c}}/><span style={{fontSize:8,color:C2.txtMuted}}>{x.l}</span></div>
                ))}
              </div>
            </div>
            <div style={{padding:"16px 14px 8px"}}>
              <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:160,minWidth:Math.max(historico.length*52,280),borderBottom:"2px solid #E2E8F0",borderLeft:"2px solid #E2E8F0",padding:"0 4px 0 8px",position:"relative"}}>
                  {/* Linha de meta */}
                  <div style={{position:"absolute",bottom:"70%",left:0,right:0,borderTop:"1.5px dashed #94A3B8",zIndex:1}}>
                    <span style={{position:"absolute",right:4,top:-10,fontSize:8,color:"#94A3B8",background:"#fff",padding:"0 3px"}}>meta 80</span>
                  </div>
                  {historico.map((r,i)=>{
                    const sc=calcSc(r);
                    const tc=tierCol(sc);
                    const h=Math.max(Math.round(sc/100*140),6);
                    return(
                      <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,flex:1,minWidth:44,zIndex:2}}>
                        <div style={{fontSize:10,fontWeight:800,color:tc.col,marginBottom:3}}>{sc}</div>
                        <div style={{width:"80%",maxWidth:36,height:h,background:tc.col,borderRadius:"4px 4px 0 0",boxShadow:"0 2px 4px "+tc.col+"40"}}/>
                      </div>
                    );
                  })}
                </div>
                {/* Labels das datas */}
                <div style={{display:"flex",gap:4,minWidth:Math.max(historico.length*52,280),padding:"6px 8px 0"}}>
                  {historico.map((r,i)=>(
                    <div key={i} style={{flex:1,minWidth:44,textAlign:"center",fontSize:9,color:C2.txtMuted}}>{r.data?.slice(5)}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Rosca + CPC/Retidos lado a lado */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {/* Rosca distribuicao */}
            <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:14}}>
              <div style={{fontSize:12,fontWeight:700,color:C2.txt,marginBottom:12}}>Distribuicao</div>
              {(()=>{
                const levels=[
                  {l:"Top",    v:scores.filter(s=>s>=80).length,   col:C2.green},
                  {l:"Regular",v:scores.filter(s=>s>=60&&s<80).length, col:C2.blue},
                  {l:"Atencao",v:scores.filter(s=>s>=40&&s<60).length, col:C2.amber},
                  {l:"Critico",v:scores.filter(s=>s<40).length,    col:C2.red},
                ].filter(x=>x.v>0);
                const tot=scores.length||1;
                // SVG donut
                const r=40, cx=60, cy=60, stroke=18;
                const circ=2*Math.PI*r;
                let offset=0;
                return(
                  <div>
                    <svg width="120" height="120" style={{display:"block",margin:"0 auto"}}>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke}/>
                      {levels.map((lv,i)=>{
                        const pct=lv.v/tot;
                        const dash=circ*pct;
                        const gap=circ-dash;
                        const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={lv.col} strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} style={{transform:"rotate(-90deg)",transformOrigin:"60px 60px"}}/>;
                        offset+=dash;
                        return el;
                      })}
                      <text x={cx} y={cy-6} textAnchor="middle" fontSize="14" fontWeight="900" fill={t.col}>{avgSc}</text>
                      <text x={cx} y={cy+10} textAnchor="middle" fontSize="9" fill="#94A3B8">avg</text>
                    </svg>
                    <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:8}}>
                      {levels.map((lv,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:lv.col}}/><span style={{fontSize:10,color:C2.txtSub}}>{lv.l}</span></div>
                          <span style={{fontSize:10,fontWeight:700,color:lv.col}}>{lv.v}d · {Math.round(lv.v/tot*100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Mini CPC vs Retidos */}
            <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,padding:14}}>
              <div style={{fontSize:12,fontWeight:700,color:C2.txt,marginBottom:12}}>CPC vs Retidos</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:4,height:100,borderBottom:"1px solid #E2E8F0",borderLeft:"1px solid #E2E8F0",overflowX:"auto"}}>
                {historico.map((r,i)=>{
                  const maxCPC=Math.max(...historico.map(x=>Number(x.cpc)||0),1);
                  const maxRet=Math.max(...historico.map(x=>Number(x.retidos)||0),1);
                  const hCPC=Math.max(Math.round((Number(r.cpc)||0)/maxCPC*88),3);
                  const hRet=Math.max(Math.round((Number(r.retidos)||0)/maxRet*88),3);
                  return(
                    <div key={i} style={{display:"flex",alignItems:"flex-end",gap:2,flex:1,minWidth:28}}>
                      <div style={{flex:1,height:hCPC,background:C2.indigo,borderRadius:"2px 2px 0 0"}}/>
                      <div style={{flex:1,height:hRet,background:C2.green,borderRadius:"2px 2px 0 0"}}/>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <div style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,background:C2.indigo,borderRadius:2}}/><span style={{fontSize:9,color:C2.txtMuted}}>CPC</span></div>
                <div style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,background:C2.green,borderRadius:2}}/><span style={{fontSize:9,color:C2.txtMuted}}>Retidos</span></div>
              </div>
              <div style={{marginTop:10}}>
                <div style={{fontSize:9,color:C2.txtMuted,marginBottom:4}}>Media diaria</div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1,background:C2.indigoLight,borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:900,color:C2.indigo}}>{historico.length?Math.round(totCPC/historico.length):0}</div>
                    <div style={{fontSize:9,color:C2.txtMuted}}>CPC/dia</div>
                  </div>
                  <div style={{flex:1,background:C2.greenLight,borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:900,color:C2.green}}>{historico.length?Math.round(totRet/historico.length):0}</div>
                    <div style={{fontSize:9,color:C2.txtMuted}}>Ret/dia</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Tabela historica */}
          <div style={{background:C2.surface,border:"1px solid "+C2.border,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #F0F0F0"}}>
              <div style={{fontSize:13,fontWeight:700,color:C2.txt}}>Registro Diario</div>
            </div>
            <div style={{overflowX:"auto"}}><div style={{minWidth:420}}>
              <div style={{display:"grid",gridTemplateColumns:"80px 50px 55px 55px 55px 55px",gap:0,padding:"8px 14px",background:C2.bgAlt,borderBottom:"1px solid #F0F0F0"}}>
                {["Data","CPC","Retidos","Conv.","Score","Status"].map((h,i)=>(
                  <div key={i} style={{fontSize:9,fontWeight:700,color:C2.txtMuted,textTransform:"uppercase",letterSpacing:0.8,textAlign:i>0?"center":"left"}}>{h}</div>
                ))}
              </div>
              {[...historico].reverse().map((r,i)=>{
                const sc=calcSc(r);
                const tc=tierCol(sc);
                const conv=Math.round((Number(r.conversoes)||0)*100);
                return(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"80px 50px 55px 55px 55px 55px",gap:0,padding:"10px 14px",borderBottom:"1px solid #F8F8F8",alignItems:"center",background:i%2===0?C2.surface:C2.bg}}>
                    <div style={{fontSize:11,fontWeight:600,color:C2.txt}}>{r.data}</div>
                    <div style={{textAlign:"center",fontSize:12,fontWeight:700,color:C2.indigo}}>{r.cpc}</div>
                    <div style={{textAlign:"center",fontSize:12,fontWeight:700,color:C2.green}}>{r.retidos}</div>
                    <div style={{textAlign:"center",fontSize:12,fontWeight:700,color:conv>=50?C2.green:conv>=30?C2.amber:C2.red}}>{conv}%</div>
                    <div style={{textAlign:"center",fontSize:13,fontWeight:900,color:tc.col}}>{sc}</div>
                    <div style={{textAlign:"center"}}><span style={{fontSize:9,fontWeight:700,color:tc.col,background:tc.bg,borderRadius:8,padding:"2px 6px"}}>{tc.label}</span></div>
                  </div>
                );
              })}
            </div></div>
          </div>
        </>
      )}
    </div>
  );
}
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
function Dashboard({user,onLogout}){
  const [data,setData]=useState([]);
  const [datas,setDatas]=useState([]);
  const [datasSel,setDatasSel]=useState([]);
  const [dateModal,setDateModal]=useState(false);
  const [tempSel,setTempSel]=useState([]);
  const [tab,setTab]=useState("overview");
  const [loading,setLoading]=useState(true);
  const [menuOpen,setMenuOpen]=useState(false);
  const [importTab,setImportTab]=useState("arquivo");
  const [importMsg,setImportMsg]=useState("");
  const [config,setConfig]=useState({metaCPC:20,metaRet:10,metaConv:50,pesoCPC:25,pesoRet:40,pesoConv:35,thTop:80,thReg:60,thAtc:40});
  const loadDatas=async()=>{
    const{data:d}=await supabase.from("performance_diaria").select("data").order("data",{ascending:false});
    const unique=[...new Set((d||[]).map(r=>r.data))];
    setDatas(unique);
    return unique;
  };
  const loadData=async(filtros)=>{
    setLoading(true);
    try{
      let q=supabase.from("performance_diaria").select("*, colaboradores(nome,equipe,supervisor,localizacao)");
      if(filtros&&filtros.length>0) q=q.in("data",filtros);
      const{data:d}=await q;
      // Aggregate by colaborador — average if multiple dates
      const map={};
      (d||[]).forEach(r=>{
        const key=r.colaborador_id;
        if(!map[key]){
          map[key]={...r,nome:r.colaboradores?.nome||"",equipe:r.colaboradores?.equipe||"",supervisor:r.colaboradores?.supervisor||"",localizacao:r.colaboradores?.localizacao||"",_count:1,_datas:[r.data]};
        }else{
          map[key].cpc+=Number(r.cpc)||0;
          map[key].retidos+=Number(r.retidos)||0;
          map[key].conversoes+=Number(r.conversoes)||0;
          map[key].eficiencia+=Number(r.eficiencia)||0;
          map[key].chamadas_recebidas+=Number(r.chamadas_recebidas)||0;
          map[key].chamadas_realizadas+=Number(r.chamadas_realizadas)||0;
          map[key]._count+=1;
          map[key]._datas.push(r.data);
        }
      });
      const mapped=Object.values(map).map(r=>({
        ...r,
        conversoes: r.cpc>0 ? Math.round(r.retidos/r.cpc*100)/100 : 0,
        eficiencia: Math.round(r.eficiencia/r._count*100)/100,
        _numDias: r._count,
      }));
      setData(mapped);
    }catch(e){console.error(e);}
    setLoading(false);
  };
  useEffect(()=>{
    loadDatas().then(all=>{
      const sel=all.slice(0,1);
      setDatasSel(sel);
      loadData(sel);
    });
  },[]);
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
      const novaData=perf[0]?.data||"";
      const allDatas=await loadDatas();
      const sel=novaData?[novaData]:allDatas.slice(0,1);
      setDatasSel(sel);
      await loadData(sel);
      setImportMsg(perf.length+" registros importados com sucesso!");
    }catch(err){setImportMsg("Erro: "+err.message);}
  }
  const avgSc=data.length?Math.round(data.map(r=>calcScore(r)).reduce((s,v)=>s+v,0)/data.length):0;
  const avgEf=avg(data,"eficiencia");
  const totCv=data.reduce((s,r)=>s+(Number(r.conversoes)||0),0);
  const totCpc=data.reduce((s,r)=>s+(Number(r.cpc)||0),0);
  const totRet=data.reduce((s,r)=>s+(Number(r.retidos)||0),0);
  const avgConv=data.length?Math.round(data.reduce((s,r)=>s+(Number(r.conversoes)||0)*100,0)/data.length):0;
  const atRisk=data.filter(r=>calcScore(r)<60).length;
  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><div style={{textAlign:"center"}}><div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",margin:"0 auto 12px"}}>C</div><div style={{color:C.txtMuted,fontSize:13}}>Carregando...</div></div></div>);
  return(
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.surface,borderBottom:"1px solid "+C.border,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff"}}>C</div>
          <span style={{fontSize:14,fontWeight:800,color:C.indigo,display:"none"}}>CSA</span>
        </div>
        {datas.length>0&&(
          <div onClick={()=>{setTempSel([...datasSel]);setDateModal(true);}} style={{display:"flex",alignItems:"center",gap:6,background:C.indigoLight,border:"1.5px solid "+C.indigo,borderRadius:20,padding:"5px 12px",cursor:"pointer",userSelect:"none"}}>
            <span style={{fontSize:12}}>📅</span>
            <span style={{fontSize:11,fontWeight:700,color:C.indigo}}>{datasSel.length===1?datasSel[0]:datasSel.length+" datas"}</span>
            <span style={{fontSize:10,color:C.indigo}}>▾</span>
          </div>
        )}
        <div style={{position:"relative"}}>
          <div onClick={()=>setMenuOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"4px 8px",borderRadius:8}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user?.nome)}</div>
            <div><div style={{fontSize:11,fontWeight:700,color:C.txt}}>{(user?.nome&&!user.nome.includes("@"))?user.nome.split(" ")[0]:user?.email?.split("@")[0]||""}</div><div style={{fontSize:9,color:C.indigo,fontWeight:600,textTransform:"capitalize"}}>{user?.perfil}</div></div>
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
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Saudacao */}
              {(()=>{
                const h=new Date().getHours();
                const saud=h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
                const nomeExib=(user?.nome&&!user.nome.includes("@"))?user.nome.split(" ")[0]:user?.email?.split("@")[0]||"";
                const equipes=[...new Set(data.map(r=>r.equipe))].join(", ")||"Sem dados";
                return(
                  <div style={{marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:"#059669"}}/>
                      <span style={{fontSize:11,color:"#888",letterSpacing:0.5}}>Operacao ao vivo · {equipes}</span>
                    </div>
                    <div style={{fontSize:20,fontWeight:800,letterSpacing:-0.5,color:"#111"}}>{saud}, {nomeExib}.</div>
                  </div>
                );
              })()}
              {/* KPI Cards coloridos */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  {l:"Score Medio", v:avgSc, suffix:"/100", bg:"#1E3A5F", col:"#fff", sub:avgSc>=80?"Acima da meta":avgSc>=60?"Na media":avgSc>=40?"Atencao":"Critico", subCol:avgSc>=80?"#6EE7B7":avgSc>=60?"#93C5FD":avgSc>=40?"#FDE68A":"#FCA5A5"},
                  {l:"CPC Total",   v:totCpc, suffix:"", bg:"#F59E0B", col:"#fff", sub:"Meta: "+(data.length*20*(datasSel.length||1)), subCol:"#FEF3C7"},
                  {l:"Retidos",     v:totRet, suffix:"", bg:"#059669", col:"#fff", sub:"Meta: "+(data.length*10*(datasSel.length||1)), subCol:"#D1FAE5"},
                  {l:"Conversao",   v:avgConv+"%", suffix:"", bg:avgConv>=50?"#7C3AED":"#DC2626", col:"#fff", sub:"Meta: 50%", subCol:avgConv>=50?"#EDE9FE":"#FEE2E2"},
                ].map((k,i)=>(
                  <div key={i} style={{background:k.bg,borderRadius:12,padding:"16px 14px"}}>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>{k.l}</div>
                    <div style={{fontSize:28,fontWeight:900,color:k.col,letterSpacing:-1,lineHeight:1}}>{k.v}<span style={{fontSize:13,fontWeight:400,opacity:0.8}}>{k.suffix}</span></div>
                    <div style={{fontSize:10,color:k.subCol,marginTop:6,fontWeight:600}}>{k.sub}</div>
                  </div>
                ))}
              </div>
              {data.length===0?(
                <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,padding:"40px 24px",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:12}}>📂</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#555",marginBottom:8}}>Nenhum dado importado</div>
                  <button onClick={()=>setTab("import")} style={{background:"#6366F1",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Importar dados</button>
                </div>
              ):(
                <>
                  {/* Grafico 1 — Evolucao do Score por colaborador */}
                  <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#111"}}>Score por Colaborador</div>
                      <div style={{fontSize:10,color:"#aaa"}}>meta: 80</div>
                    </div>
                    <div style={{padding:"16px 14px"}}>
                      {[...data].sort((a,b)=>calcScore(b)-calcScore(a)).map((r,i)=>{
                        const sc=calcScore(r);
                        const col=sc>=80?"#059669":sc>=60?"#2563EB":sc>=40?"#D97706":"#DC2626";
                        const pct=Math.min(sc,100);
                        return(
                          <div key={i} style={{marginBottom:10}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:11,fontWeight:600,color:"#333"}}>{r.nome.split(" ")[0]} {r.nome.split(" ").slice(-1)[0]}</span>
                              <span style={{fontSize:11,fontWeight:800,color:col}}>{sc}/100</span>
                            </div>
                            <div style={{height:8,background:"#F1F5F9",borderRadius:4,position:"relative"}}>
                              <div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:4,transition:"width 0.5s"}}/>
                              <div style={{position:"absolute",top:0,left:"80%",width:2,height:"100%",background:"#94A3B8",borderRadius:1}}/>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
                        <div style={{width:2,height:12,background:"#94A3B8",borderRadius:1}}/>
                        <span style={{fontSize:10,color:"#94A3B8"}}>Linha de meta (80)</span>
                      </div>
                    </div>
                  </div>
                  {/* Grafico 2 — Distribuicao Status */}
                  <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:"1px solid #F0F0F0"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#111"}}>Distribuicao por Status</div>
                    </div>
                    <div style={{padding:"16px 14px"}}>
                      {(()=>{
                        const top=data.filter(r=>calcScore(r)>=80).length;
                        const reg=data.filter(r=>calcScore(r)>=60&&calcScore(r)<80).length;
                        const atc=data.filter(r=>calcScore(r)>=40&&calcScore(r)<60).length;
                        const cri=data.filter(r=>calcScore(r)<40).length;
                        const total=data.length||1;
                        const items=[
                          {l:"Top",     v:top, col:"#059669", bg:"#D1FAE5", pct:Math.round(top/total*100)},
                          {l:"Regular", v:reg, col:"#2563EB", bg:"#DBEAFE", pct:Math.round(reg/total*100)},
                          {l:"Atencao", v:atc, col:"#D97706", bg:"#FEF3C7", pct:Math.round(atc/total*100)},
                          {l:"Critico", v:cri, col:"#DC2626", bg:"#FEE2E2", pct:Math.round(cri/total*100)},
                        ];
                        return(
                          <div>
                            {/* Barra de distribuicao */}
                            <div style={{display:"flex",height:20,borderRadius:10,overflow:"hidden",marginBottom:16,gap:2}}>
                              {items.filter(x=>x.pct>0).map((x,i)=>(
                                <div key={i} style={{flex:x.pct,background:x.col,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{x.pct>10?x.pct+"%":""}</span>
                                </div>
                              ))}
                            </div>
                            {/* Legenda */}
                            <div style={{display:"flex",gap:8}}>
                              {items.map((x,i)=>(
                                <div key={i} style={{flex:1,background:x.bg,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                                  <div style={{fontSize:22,fontWeight:900,color:x.col}}>{x.v}</div>
                                  <div style={{fontSize:10,color:x.col,fontWeight:700,marginTop:2}}>{x.l}</div>
                                  <div style={{fontSize:10,color:"#888"}}>{x.pct}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Grafico 3 — CPC vs Meta */}
                  <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#111"}}>CPC vs Meta</div>
                      <div style={{fontSize:10,color:"#aaa"}}>meta diaria: {20*(datasSel.length||1)}</div>
                    </div>
                    <div style={{padding:"16px 14px"}}>
                      {[...data].sort((a,b)=>calcScore(b)-calcScore(a)).map((r,i)=>{
                        const meta=20*(datasSel.length||1);
                        const pct=Math.min(Math.round((Number(r.cpc)||0)/meta*100),120);
                        const col=pct>=100?"#059669":pct>=60?"#F59E0B":"#DC2626";
                        const barW=Math.min(pct,100);
                        return(
                          <div key={i} style={{marginBottom:10}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:11,fontWeight:600,color:"#333"}}>{r.nome.split(" ")[0]} {r.nome.split(" ").slice(-1)[0]}</span>
                              <span style={{fontSize:11,fontWeight:800,color:col}}>{r.cpc}/{meta} <span style={{fontSize:9,color:"#aaa"}}>({pct}%)</span></span>
                            </div>
                            <div style={{height:8,background:"#F1F5F9",borderRadius:4}}>
                              <div style={{width:`${barW}%`,height:"100%",background:col,borderRadius:4,transition:"width 0.5s"}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {tab==="ranking"&&<RankingTab datas={datas} datasSel={datasSel} setDatasSel={setDatasSel} supabase={supabase} loadData={loadData} setDateModal={setDateModal} setTempSel={setTempSel}/>}
          {tab==="ia"&&<IAPanel data={data} datasSel={datasSel}/>}
          {tab==="historico"&&<HistoricoTab colaboradores={[...new Set(data.map(r=>r.nome))]} supabase={supabase} config={config}/>}
          {tab==="config"&&<ConfigTab config={config} setConfig={setConfig} supabase={supabase} user={user}/>}
          {tab==="export"&&<ExportTab datas={datas} supabase={supabase} config={config}/>}
          {tab==="planos"&&<PlanosTab supabase={supabase} user={user} data={data}/>}
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
      {/* Modal de datas */}
      {dateModal&&(
        <>
          <div onClick={()=>setDateModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",borderRadius:16,padding:0,zIndex:201,width:"min(340px,90vw)",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",overflow:"hidden",fontFamily:"'Inter',system-ui,sans-serif"}}>
            <div style={{padding:"16px 20px",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14
