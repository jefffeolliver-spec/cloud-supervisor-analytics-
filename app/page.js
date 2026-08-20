// ── EXPORT TAB ─────────────────────────────────────────────────
function ExportTab({datas=[], supabase, config, data=[], datasSel=[]}){
  const [datasSel2, setDatasSel2] = useState(datas[0]?[datas[0]]:[]);
  const [gerando, setGerando] = useState(false);
  const [msg, setMsg] = useState("");
  const [dadosExport, setDadosExport] = useState([]);
  const [loadingDados, setLoadingDados] = useState(false);

  const C2 = {bg:"#F8FAFC",surface:"#fff",border:"#E2E8F0",indigo:"#6366F1",indigoLight:"#EEF2FF",green:"#059669",red:"#DC2626",txt:"#111",txtSub:"#475569",txtMuted:"#94A3B8"};

  function toggleData(d){
    setDatasSel2(datasSel2.includes(d)?datasSel2.filter(x=>x!==d):[...datasSel2,d]);
  }

  function calcSc(r){
    const nd=r._numDias||1;
    const cpc=Math.min((Number(r.cpc)||0)/(20*nd)*100,100);
    const ret=Math.min((Number(r.retidos)||0)/(10*nd)*100,100);
    const conv=Math.min((Number(r.conversoes)||0)/0.5*100,100);
    return Math.round(cpc*0.25+ret*0.40+conv*0.35);
  }

  function getNivel(sc){
    if(sc>=80) return{label:"Top",hex:"059669"};
    if(sc>=60) return{label:"Regular",hex:"2563EB"};
    if(sc>=40) return{label:"Atencao",hex:"D97706"};
    return{label:"Critico",hex:"DC2626"};
  }

  async function carregarDados(){
    setLoadingDados(true);
    try{
      let q=supabase.from("performance_diaria").select("*, colaboradores(nome,equipe,supervisor)");
      if(datasSel2.length>0) q=q.in("data",datasSel2);
      const{data:d}=await q;
      const map={};
      (d||[]).forEach(r=>{
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
      const mapped=Object.values(map).map(r=>({
        ...r,
        conversoes:r.cpc>0?Math.round(r.retidos/r.cpc*100)/100:0,
        _numDias:r._count
      }));
      setDadosExport(mapped);
    }catch(e){console.error(e);}
    setLoadingDados(false);
  }

  async function gerarPPT(){
    if(datasSel2.length===0){setMsg("Selecione pelo menos uma data.");return;}
    setGerando(true);setMsg("");
    try{
      await carregarDados();
      const pptxgen = (await import("pptxgenjs")).default;
      const prs = new pptxgen();
      prs.layout = "LAYOUT_WIDE";

      const sorted=[...dadosExport].sort((a,b)=>calcSc(b)-calcSc(a));
      const totCPC=dadosExport.reduce((s,r)=>s+(Number(r.cpc)||0),0);
      const totRet=dadosExport.reduce((s,r)=>s+(Number(r.retidos)||0),0);
      const avgSc=sorted.length?Math.round(sorted.reduce((s,r)=>s+calcSc(r),0)/sorted.length):0;
      const avgConv=totCPC>0?Math.round(totRet/totCPC*100):0;
      const periodo=datasSel2.join(" | ");

      // ── SLIDE 1 — CAPA ──
      const s1=prs.addSlide();
      s1.background={color:"0F172A"};
      s1.addShape(prs.ShapeType.rect,{x:0,y:0,w:"100%",h:0.08,fill:{color:"6366F1"}});
      s1.addText("☁ Cloud Supervisor Analytics",{x:0.5,y:1.2,w:12,fontSize:36,bold:true,color:"F8FAFC",fontFace:"Arial"});
      s1.addText("Relatório Executivo de Performance Operacional",{x:0.5,y:2.1,w:12,fontSize:18,color:"94A3B8",fontFace:"Arial"});
      s1.addText("Período: "+periodo,{x:0.5,y:2.8,w:12,fontSize:14,color:"6366F1",fontFace:"Arial"});
      s1.addText("Equipe Talentos  |  "+dadosExport.length+" Colaboradores",{x:0.5,y:3.3,w:12,fontSize:13,color:"64748B",fontFace:"Arial"});
      s1.addShape(prs.ShapeType.rect,{x:0,y:6.9,w:"100%",h:0.08,fill:{color:"6366F1"}});

      // ── SLIDE 2 — KPIs ──
      const s2=prs.addSlide();
      s2.background={color:"F8FAFC"};
      s2.addText("📊 Resumo Executivo",{x:0.4,y:0.3,w:12,fontS
