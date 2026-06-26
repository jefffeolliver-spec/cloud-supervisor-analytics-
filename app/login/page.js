"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const C = { indigo:"#6366F1", indigoDark:"#4F46E5", indigoLight:"#EEF2FF", green:"#10B981", greenLight:"#ECFDF5", red:"#F43F5E", redLight:"#FFF1F2", border:"#E2E8F0", txt:"#0F172A", txtSub:"#475569", txtMuted:"#94A3B8", surface:"#FFFFFF" };

const PERFIS = [
  { id:"supervisor",  label:"Supervisor",  desc:"Gerencia uma equipe",   icon:"👤" },
  { id:"coordenador", label:"Coordenador", desc:"Supervisiona equipes",  icon:"👥" },
  { id:"gerente",     label:"Gerente",     desc:"Gestao operacional",    icon:"📊" },
  { id:"diretor",     label:"Diretor",     desc:"Visao executiva total", icon:"🎯" },
];

function Input({ label, type="text", value, onChange, placeholder, autoComplete }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:12,fontWeight:600,color:C.txtSub}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{padding:"10px 14px",fontSize:14,color:C.txt,background:C.surface,fontFamily:"inherit",border:`1.5px solid ${focus?C.indigo:C.border}`,borderRadius:8,outline:"none"}}/>
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const [tab,    setTab]    = useState("login");
  const [email,  setEmail]  = useState("");
  const [senha,  setSenha]  = useState("");
  const [nome,   setNome]   = useState("");
  const [perfil, setPerfil] = useState("supervisor");
  const [equipe, setEquipe] = useState("");
  const [loading,setLoading]= useState(false);
  const [error,  setError]  = useState("");
  const [ok,     setOk]     = useState("");

  async function login() {
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (err) throw err;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      onLogin(profile || { nome: email.split("@")[0], email, perfil:"supervisor" });
    } catch(e) {
      setError(e.message === "Invalid login credentials" ? "Email ou senha incorretos." : e.message);
    }
    setLoading(false);
  }

  async function cadastro() {
    setLoading(true); setError(""); setOk("");
    if (!nome||!email||!senha) { setError("Preencha todos os campos."); setLoading(false); return; }
    if (senha.length<6) { setError("Senha: minimo 6 caracteres."); setLoading(false); return; }
    try {
      const { error: err } = await supabase.auth.signUp({ email, password: senha, options:{ data:{ nome, perfil, equipe } } });
      if (err) throw err;
      setOk("Conta criada! Verifique seu email para confirmar.");
      setTab("login");
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  const btn = (disabled) => ({
    background: disabled?"#E2E8F0":`linear-gradient(135deg,${C.indigo},${C.indigoDark})`,
    color: disabled?C.txtMuted:"#fff", border:"none", borderRadius:8,
    padding:"12px 0", fontSize:14, fontWeight:700,
    cursor: disabled?"not-allowed":"pointer", width:"100%", marginTop:4,
  });

  return (
    <div style={{minHeight:"100vh",padding:20,background:"linear-gradient(135deg,#0F172A,#1E293B)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:60,height:60,borderRadius:16,margin:"0 auto 14px",background:`linear-gradient(135deg,${C.indigo},#818CF8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900,color:"#fff"}}>C</div>
          <div style={{fontSize:22,fontWeight:800,color:"#F8FAFC"}}>Cloud Supervisor Analytics</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>Plataforma de Performance Operacional</div>
        </div>
        <div style={{background:C.surface,borderRadius:16,overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.4)"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
            {[["login","Entrar"],["cadastro","Criar conta"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>{setTab(id);setError("");setOk("");}} style={{flex:1,padding:"15px 0",fontSize:13,fontWeight:700,color:tab===id?C.indigo:C.txtMuted,background:tab===id?C.indigoLight:"transparent",border:"none",borderBottom:tab===id?`2px solid ${C.indigo}`:"2px solid transparent",cursor:"pointer",marginBottom:-1}}>{lbl}</button>
            ))}
          </div>
          <div style={{padding:28}}>
            {error&&<div style={{background:C.redLight,border:"1px solid #FECDD3",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:C.red}}>{error}</div>}
            {ok&&<div style={{background:C.greenLight,border:"1px solid #6EE7B7",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:C.green}}>{ok}</div>}
            {tab==="login"&&(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" autoComplete="email"/>
                <Input label="Senha" type="password" value={senha} onChange={setSenha} placeholder="••••••••" autoComplete="current-password"/>
                <button onClick={login} disabled={loading} style={btn(loading)}>{loading?"Entrando...":"Entrar"}</button>
              </div>
            )}
            {tab==="cadastro"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Input label="Nome completo" value={nome} onChange={setNome} placeholder="Seu nome" autoComplete="name"/>
                <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" autoComplete="email"/>
                <Input label="Senha" type="password" value={senha} onChange={setSenha} placeholder="Minimo 6 caracteres" autoComplete="new-password"/>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:C.txtSub,marginBottom:8}}>Perfil de acesso</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {PERFIS.map(p=>(
                      <div key={p.id} onClick={()=>setPerfil(p.id)} style={{padding:"10px 12px",cursor:"pointer",borderRadius:8,border:`1.5px solid ${perfil===p.id?C.indigo:C.border}`,background:perfil===p.id?C.indigoLight:"transparent"}}>
                        <div style={{fontSize:11,fontWeight:700,color:perfil===p.id?C.indigo:C.txt}}>{p.icon} {p.label}</div>
                        <div style={{fontSize:10,color:C.txtMuted,marginTop:1}}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {perfil==="supervisor"&&<Input label="Equipe" value={equipe} onChange={setEquipe} placeholder="Ex: Retencao A"/>}
                <button onClick={cadastro} disabled={loading} style={btn(loading)}>{loading?"Criando...":"Criar conta"}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
               }
