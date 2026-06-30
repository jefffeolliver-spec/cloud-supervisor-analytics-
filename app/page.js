"use client";
import { useState, useEffect } from "react";
import PlanosTab from "./components/PlanosTab";
import { LoginScreen, IAPanel, RankingTab, ConfigTab, HistoricoTab, FormularioManual, parseFile, calcScore, tier, initials, avg, C, NAV, SYSTEM_PROMPT, supabase, StrategyAdvisor } from "./components/Helpers";

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
          {tab==="strategy"&&<StrategyAdvisor data={data} datas={datas} supabase={supabase}/>}
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
              <div style={{fontSize:14,fontWeight:800,color:"#111"}}>Selecionar Datas</div>
              <div onClick={()=>setDateModal(false)} style={{cursor:"pointer",fontSize:18,color:"#aaa",lineHeight:1}}>×</div>
            </div>
            <div style={{padding:"8px 0",maxHeight:300,overflowY:"auto"}}>
              {datas.map(d=>{
                const sel=tempSel.includes(d);
                return(
                  <div key={d} onClick={()=>{
                    const next=sel?tempSel.filter(x=>x!==d):[...tempSel,d];
                    setTempSel(next);
                  }} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",cursor:"pointer",background:sel?"#EEF2FF":"#fff",borderBottom:"1px solid #F8F8F8"}}>
                    <div style={{width:18,height:18,borderRadius:4,border:"2px solid "+(sel?"#6366F1":"#D1D5DB"),background:sel?"#6366F1":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {sel&&<span style={{color:"#fff",fontSize:11,fontWeight:900}}>✓</span>}
                    </div>
                    <span style={{fontSize:13,fontWeight:sel?700:400,color:sel?"#6366F1":"#333"}}>📅 {d}</span>
                  </div>
                );
              })}
            </div>
            <div style={{padding:"12px 20px",borderTop:"1px solid #E2E8F0",display:"flex",gap:8}}>
              <button onClick={()=>{
                if(tempSel.length===datas.length) setTempSel([]);
                else setTempSel([...datas]);
              }} style={{flex:1,background:"#F1F5F9",border:"none",borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:600,color:"#475569",cursor:"pointer",fontFamily:"inherit"}}>
                {tempSel.length===datas.length?"Desmarcar todas":"Marcar todas"}
              </button>
              <button onClick={()=>{
                if(tempSel.length===0)return;
                setDatasSel(tempSel);
                loadData(tempSel);
                setDateModal(false);
              }} style={{flex:1,background:"#6366F1",border:"none",borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                Aplicar ({tempSel.length})
              </button>
            </div>
          </div>
        </>
      )}
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
