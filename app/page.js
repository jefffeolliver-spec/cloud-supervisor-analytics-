"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = { bg:"#F8FAFC",bgAlt:"#F1F5F9",surface:"#fff",border:"#E2E8F0",indigo:"#6366F1",indigoLight:"#EEF2FF",green:"#10B981",greenLight:"#ECFDF5",red:"#F43F5E",redLight:"#FFF1F2",amber:"#F59E0B",sky:"#0EA5E9",txt:"#0F172A",txtSub:"#475569",txtMuted:"#94A3B8" };

function calcScore(r) {
  if(r.score_spa) return r.score_spa;
  return Math.round((Math.min(Number(r.eficiencia)||0,100)*0.35)+(Math.min((Number(r.conversoes)||0)/50*100,100)*0.25)+(Math.min((Number(r.cpc)||0)/100*100,100)*0.20)+(Math.min((Number(r.tempo_produtivo)||0)/480*100,100)*0.20));
}
function tier(s) {
  if(s>=85) return {label:"Top",color:C.green,bg:C.greenLight};
  if(s>=68) return {label:"Regular",color:C.indigo,bg:C.indigoLight};
  return {label:"Atencao",color:C.red,bg:C.redLight};
}
const initials = n => (n||"U").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

const PERFIS=[{id:"supervisor",label:"Supervisor",icon:"👤"},{id:"coordenador",label:"Coordenador",icon:"👥"},{id:"gerente",label:"Gerente",icon:"📊"},{id:"diretor",label:"Diretor",icon:"🎯"}];
const NAV=[{id:"overview",icon:"▦",label:"Overview"},{id:"ranking",icon:"◈",label:"Ranking"},{id:"equipes",icon:"◉",label:"Equipes"},{id:"import",icon:"+",label:"Importar"}];

function Input({label,type="text",value,onChange,placeholder}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:12,fontWeight:600,color:C.txtSub}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{padding:"10px 14px",fontSize:14,color:C.txt,background:C.surface,fontFamily:"inherit",border:"1.5px solid #E2E8F0",borderRadius:8,outline:"none",width:"100%",boxSizing:"border-box"}}/>
    </div>
  );
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
    try{
      const{data,error:err}=await supabase.auth.signInWithPassword({email,password:senha});
      if(err)throw err;
      const{data:p}=await supabase.from("profiles").select("*").eq("id",data.user.id).single();
      onLogin(p||{nome:email.split("@")[0],email,perfil:"supervisor"});
    }catch(e){setError(e.message==="Invalid login credentials"?"Email ou senha incorretos.":e.message);}
    setLoading(false);
  }

  async function cadastro(){
    setLoading(true);setError("");setOk("");
    if(!nome||!email||!senha){setError("Preencha todos os campos.");setLoading(false);return;}
    if(senha.length<6){setError("Senha: minimo 6 caracteres.");setLoading(false);return;}
    try{
      const{error:err}=await supabase.auth.signUp({email,password:senha,options:{data:{nome,perfil}}});
      if(err)throw err;
      setOk("Conta criada! Verifique seu email.");
      setTab("login");
    }catch(e){setError(e.message);}
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
            {tab==="login"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com"/>
                <Input label="Senha" type="password" value={senha} onChange={setSenha} placeholder="••••••••"/>
                <button onClick={login} disabled={loading} style={loading?btnD:btn}>{loading?"Entrando...":"Entrar"}</button>
              </div>
            )}
            {tab==="cadastro"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Input label="Nome" value={nome} onChange={setNome} placeholder="Seu nome"/>
                <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com"/>
                <Input label="Senha" type="password" value={senha} onChange={setSenha} placeholder="Minimo 6 caracteres"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {PERFIS.map(p=>(
                    <div key={p.id} onClick={()=>setPerfil(p.id)} style={{padding:"10px",cursor:"pointer",borderRadius:8,border:"1.5px solid "+(perfil===p.id?"#6366F1":"#E2E8F0"),background:perfil===p.id?"#EEF2FF":"transparent"}}>
                      <div style={{fontSize:11,fontWeight:700,color:perfil===p.id?"#6366F1":"#0F172A"}}>{p.icon} {p.label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={cadastro} disabled={loading} style={loading?btnD:btn}>{loading?"Criando...":"Criar conta"}</button>
              </div>
            )}
          </div>
        </div>
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
      .then(({data:d})=>{setData(d||[]);setLoading(false);})
      .catch(()=>setLoading(false));
  },[]);

  async function handleLogout(){await supabase.auth.signOut();onLogout();}

  const avgSc=data.length?Math.round(data.map(r=>calcScore(r)).reduce((s,v)=>s+v,0)/data.length):0;
  const avgEf=data.length?Math.round(data.reduce((s,r)=>s+(Number(r.eficiencia)||0),0)/data.length):0;
  const totCv=data.reduce((s,r)=>s+(Number(r.conversoes)||0),0);
  const atRisk=data.filter(r=>calcScore(r)<65).length;

  if(loading) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",margin:"0 auto 12px"}}>C</div>
        <div style={{color:C.txtMuted,fontSize:13}}>Carregando...</div>
      </div>
    </div>
  );

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
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.txt}}>{(user?.nome||"").split(" ")[0]}</div>
              <div style={{fontSize:9,color:C.indigo,fontWeight:600,textTransform:"capitalize"}}>{user?.perfil}</div>
            </div>
          </div>
          {menuOpen&&(
            <>
              <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:90}}/>
              <div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:C.surface,border:"1px solid "+C.border,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",minWidth:180,zIndex:100,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:"1px solid "+C.border}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.txt}}>{user?.nome}</div>
                  <div style={{fontSize:10,color:C.txtMuted}}>{user?.email}</div>
                </div>
                <div style={{padding:6}}>
                  <button onClick={handleLogout} style={{width:"100%",padding:"8px 10px",borderRadius:6,cursor:"pointer",fontSize:12,color:C.red,fontWeight:600,background:"transparent",border:"none",textAlign:"left"}}>Sair da conta</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{width:52,background:"#0F172A",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:12,gap:2,flexShrink:0}}>
          {NAV.map(n=>(
            <div key={n.id} title={n.label} onClick={()=>setTab(n.id)} style={{width:38,height:38,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:tab===n.id?C.indigo:"transparent",color:tab===n.id?"#fff":"#64748B",fontSize:14}}>
              {n.icon}
            </div>
          ))}
        </div>

        <div style={{flex:1,overflow:"auto",padding:20}}>
          {tab==="overview"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{fontSize:16,fontWeight:800,color:C.txt}}>Overview da Operacao</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                {[{l:"Score Medio",v:avgSc,col:C.indigo},{l:"Eficiencia",v:avgEf+"%",col:C.green},{l:"Conversoes",v:totCv,col:C.sky},{l:"Em Atencao",v:atRisk,col:atRisk>0?C.red:C.green}].map((k,i)=>(
                  <div key={i} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"16px 18px"}}>
                    <div style={{fontSize:10,color:C.txtMuted,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>{k.l}</div>
                    <div style={{fontSize:28,fontWeight:800,color:k.col}}>{k.v}</div>
                  </div>
                ))}
              </div>
              {data.length===0?(
                <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"40px 24px",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:12}}>📂</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.txtSub,marginBottom:8}}>Nenhum dado importado</div>
                  <button onClick={()=>setTab("import")} style={{background:C.indigo,color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Importar dados</button>
                </div>
              ):(
                <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,fontSize:13,fontWeight:700,color:C.txt}}>Top Colaboradores</div>
                  {[...data].sort((a,b)=>calcScore(b)-calcScore(a)).slice(0,5).map((r,i)=>{
                    const sc=calcScore(r);const t=tier(sc);
                    return(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 60px",gap:10,padding:"10px 16px",borderBottom:"1px solid "+C.bgAlt,alignItems:"center"}}>
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
              <div style={{fontSize:16,fontWeight:800,color:C.txt,marginBottom:16}}>Ranking</div>
              <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:10,overflow:"hidden"}}>
                {[...data].sort((a,b)=>calcScore(b)-calcScore(a)).map((r,i)=>{
                  const sc=calcScore(r);const t=tier(sc);
                  return(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 50px 60px",gap:10,padding:"11px 16px",borderBottom:"1px solid "+C.bgAlt,alignItems:"center",background:i%2===0?C.surface:C.bgAlt}}>
                      <span style={{fontSize:11,fontWeight:700,color:C.txtMuted}}>#{i+1}</span>
                      <div><div style={{fontSize:12,fontWeight:700,color:C.txt}}>{r.nome}</div><div style={{fontSize:10,color:C.txtMuted}}>{r.equipe}</div></div>
                      <span style={{fontSize:13,fontWeight:800,color:t.color}}>{sc}</span>
                      <span style={{fontSize:10,fontWeight:700,color:t.color,background:t.bg,borderRadius:10,padding:"2px 6px",textAlign:"center"}}>{t.label}</span>
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
                return(
                  <div key={i} style={{background:C.surface,border:"1px solid "+C.border,borderLeft:"3px solid "+C.indigo,borderRadius:10,padding:"16px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div><div style={{fontSize:14,fontWeight:800,color:C.txt}}>{eq}</div><div style={{fontSize:11,color:C.txtMuted}}>{members[0]?.supervisor} · {members.length} colaboradores</div></div>
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
                    const rows=lines.slice(1).filter(l=>l.trim()).map(l=>{
                      const vals=l.split(",").map(v=>v.trim().replace(/"/g,""));
                      const obj={};headers.forEach((h,i)=>obj[h]=vals[i]||"");return obj;
                    });
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
      if(session){
        supabase.from("profiles").select("*").eq("id",session.user.id).single()
          .then(({data:p})=>{setUser(p||{nome:session.user.email,email:session.user.email,perfil:"supervisor"});setLoading(false);})
          .catch(()=>setLoading(false));
      }else setLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{
      if(!session)setUser(null);
    });
    return()=>subscription.unsubscribe();
  },[]);

  if(loading) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0F172A,#1E293B)"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#6366F1,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff",margin:"0 auto 12px"}}>C</div>
        <div style={{color:"#64748B",fontSize:14}}>Carregando...</div>
      </div>
    </div>
  );

  return user?<Dashboard user={user} onLogout={()=>setUser(null)}/>:<LoginScreen onLogin={setUser}/>;
}
