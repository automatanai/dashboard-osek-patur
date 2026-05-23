import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ComposedChart
} from "recharts";

const fmt  = n => new Intl.NumberFormat("he-IL",{style:"currency",currency:"ILS",maximumFractionDigits:0}).format(n);
const pct  = n => (n*100).toFixed(1)+"%";
const LIMIT = 120000;
const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

const seed = () => MONTHS.map((m,i)=>({
  month: m,
  income:    [8200,9500,7800,11200,10600,12100,0,0,0,0,0,0][i]||0,
  expenses:  [3100,3800,2900,4200,3900,4500,0,0,0,0,0,0][i]||0,
  taxPaid:   [2000,2200,1900,2500,2400,2800,0,0,0,0,0,0][i]||0,
  invoiced:  [8200,9500,7800,11200,10600,12100,0,0,0,0,0,0][i]||0,
  collected: [8200,7500,9800,9200,10600,8100,0,0,0,0,0,0][i]||0,
}));

const getStage = total => {
  if(total<30000)  return {label:"🌱 תחילת דרך",  color:"#10b981",level:1,next:"30,000 ₪"};
  if(total<70000)  return {label:"🚀 צמיחה",       color:"#3b82f6",level:2,next:"70,000 ₪"};
  if(total<100000) return {label:"⚡ בשלות",        color:"#f59e0b",level:3,next:"100,000 ₪"};
  return                  {label:"🏆 לקראת מעבר", color:"#ef4444",level:4,next:"—"};
};

const TIPS = {
  1:[
    {icon:"💡",title:"בנה קהל לקוחות בסיסי",text:"התמקד ב-3-5 לקוחות קבועים לפני שמתפשט. יציבות עדיפה על גיוון בתחילת הדרך.",tag:"צמיחה"},
    {icon:"🏦",title:"פתח קרן השתלמות עכשיו",text:"גם הפקדה של 300 ₪/חודש מתחילה את ספירת 6 השנים. כל יום שמחכה עולה לך כסף.",tag:"מס"},
    {icon:"📸",title:"תעד כל הוצאה מיד",text:"בשלב הזה כל הוצאה מוכרת = כסף אמיתי בחזרה. צלם קבלות ברגע – לא 'מחר'.",tag:"מס"},
    {icon:"📞",title:"הגדר תנאי תשלום ברורים",text:"כתוב בכל הצעת מחיר 'תשלום תוך 30 יום'. לקוחות חדשים – בקש 30% מקדמה.",tag:"גבייה"},
  ],
  2:[
    {icon:"📈",title:"העלה מחירים 10-15%",text:"אתה כבר לא בתחילת הדרך. לקוחות נאמנים יישארו – ולקוחות חדשים ישפטו לפי איכות.",tag:"צמיחה"},
    {icon:"💰",title:"הגדל הפרשת מס ל-28%",text:"ההכנסות עולות ואיתן מדרגות המס. עדיף לגלות שהפרשת יותר מדי, לא פחות מדי.",tag:"מס"},
    {icon:"🔄",title:"אוטומציה של גבייה",text:"שלח תזכורת תשלום אוטומטית יומיים לפני מועד הפירעון. מונע אי-נעימות ומשפר תזרים.",tag:"גבייה"},
    {icon:"📊",title:"חשב נקודת איזון חודשית",text:"כמה חייב להכניס כדי לכסות הוצאות + משכורת + מיסים? זה המספר שמנהל אותך.",tag:"צמיחה"},
  ],
  3:[
    {icon:"⚖️",title:"שקול עוסק מורשה",text:"מעל 80K ₪ שנתי, עוסק מורשה עשוי לפתוח דלתות מול לקוחות עסקיים. התייעץ עם רו\"ח.",tag:"מס"},
    {icon:"🤝",title:"שותפויות אסטרטגיות",text:"מצא ספקים משלימים. הפנות הדדיות בין עסקים קטנים הן ממנועי הצמיחה הטובים ביותר.",tag:"צמיחה"},
    {icon:"⏱️",title:"מדוד שעות מול הכנסה",text:"לאיזה לקוח אתה מרוויח הכי הרבה לשעה? ממקד שם את האנרגיה ושקול לוותר על השאר.",tag:"צמיחה"},
    {icon:"🏦",title:"הגדל הפקדה לקרן השתלמות",text:"אם הכנסה גדלה – הגדל את ההפקדה בהתאם. הטבת המס גדלה איתה.",tag:"מס"},
  ],
  4:[
    {icon:"🚨",title:"אתה קרוב לתקרה!",text:"עבר 100K ₪? התחל תהליך מעבר לעוסק מורשה. המעבר לא נעשה ביום אחד.",tag:"דחוף"},
    {icon:"📞",title:"פגישה דחופה עם רו\"ח",text:"לא המלצה – חובה. יש להכין דוחות שנתיים ולתכנן את שנת המס הבאה.",tag:"דחוף"},
    {icon:"🏗️",title:"בנה תהליכים מסודרים",text:"בשלב הזה, תהליכים ברורים > עבודה קשה. זה הבסיס לצמיחה בשלב הבא.",tag:"צמיחה"},
    {icon:"💵",title:"בחן מחדש תמחור",text:"לקראת מעבר לעוסק מורשה מחירים יעלו ב-17% (מע\"מ) – הכן את הלקוחות מראש.",tag:"גבייה"},
  ],
};

const TAG_COLORS = {
  "מס":"#f59e0b","צמיחה":"#3b82f6","גבייה":"#10b981","דחוף":"#ef4444"
};

const Tooltip_ = ({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"#1e293b",borderRadius:12,padding:"12px 16px",color:"#fff",fontSize:12,direction:"rtl",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",minWidth:160}}>
      <div style={{fontWeight:800,marginBottom:8,borderBottom:"1px solid rgba(255,255,255,0.1)",paddingBottom:6}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:16,marginBottom:3}}>
          <span style={{color:p.color}}>{p.name}</span>
          <span style={{fontWeight:700}}>{typeof p.value==="number"?fmt(p.value):p.value}</span>
        </div>
      ))}
    </div>
  );
};

const KPI = ({label,value,sub,color,icon,delta})=>(
  <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",borderTop:`4px solid ${color}`,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",direction:"rtl",display:"flex",flexDirection:"column",gap:3}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:24}}>{icon}</span>
      {delta!==undefined&&<span style={{fontSize:11,fontWeight:800,color:delta>=0?"#10b981":"#ef4444",background:delta>=0?"#d1fae5":"#fee2e2",padding:"2px 8px",borderRadius:99}}>{delta>=0?"▲":"▼"} {Math.abs(delta).toFixed(1)}%</span>}
    </div>
    <div style={{fontSize:24,fontWeight:900,color:"#0f172a",marginTop:4}}>{value}</div>
    <div style={{fontSize:12,fontWeight:700,color:"#64748b"}}>{label}</div>
    {sub&&<div style={{fontSize:11,color:"#94a3b8"}}>{sub}</div>}
  </div>
);

const Tag = ({label})=>(
  <span style={{fontSize:10,fontWeight:800,background:`${TAG_COLORS[label]}22`,color:TAG_COLORS[label],padding:"2px 8px",borderRadius:99,border:`1px solid ${TAG_COLORS[label]}44`}}>{label}</span>
);

const SectionTitle = ({children})=>(
  <div style={{fontSize:12,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:"8px 0 14px"}}>{children}</div>
);

export default function App() {
  const [data,setData] = useState(()=>{
    try { const s=localStorage.getItem('fp_data'); return s?JSON.parse(s):seed(); }
    catch { return seed(); }
  });
  const [month,setMonth] = useState(()=>{
    try { const s=localStorage.getItem('fp_month'); return s?parseInt(s):new Date().getMonth(); }
    catch { return new Date().getMonth(); }
  });
  const [tab,setTab]           = useState("dashboard");
  const [editOpen,setEditOpen] = useState(false);
  const [form,setForm]         = useState({});
  const [filterTag,setFilterTag]= useState("הכל");
  const [saved,setSaved]        = useState(false);

  // שמירה אוטומטית בכל שינוי נתונים
  useEffect(()=>{
    try {
      localStorage.setItem('fp_data', JSON.stringify(data));
      localStorage.setItem('fp_month', String(month));
      setSaved(true);
      const t = setTimeout(()=>setSaved(false), 2000);
      return ()=>clearTimeout(t);
    } catch {}
  },[data, month]);

  const filled  = data.filter(d=>d.income>0);
  const totalInc  = data.reduce((s,d)=>s+d.income,0);
  const totalExp  = data.reduce((s,d)=>s+d.expenses,0);
  const totalProf = totalInc-totalExp;
  const totalTaxDue  = totalProf*0.25;
  const totalTaxPaid = data.reduce((s,d)=>s+d.taxPaid,0);
  const taxGap    = totalTaxDue-totalTaxPaid;
  const avgInc    = filled.length?Math.round(totalInc/filled.length):0;
  const limitPct  = totalInc/LIMIT;
  const stage     = getStage(totalInc);

  const cur  = data[month];
  const prev = month>0?data[month-1]:null;
  const netCur  = cur.income-cur.expenses;
  const taxCur  = netCur*0.25;
  const krnCur  = Math.round(cur.income*0.045);
  const freeCur = Math.max(0,netCur-taxCur-krnCur);
  const incTrend= prev&&prev.income?((cur.income-prev.income)/prev.income)*100:undefined;

  // collection status per month
  const collData = filled.map(d=>({
    month: d.month,
    "חויב": d.invoiced,
    "נגבה": d.collected,
    "פתוח": Math.max(0,d.invoiced-d.collected),
  }));

  // profit vs expenses
  const profData = filled.map(d=>({
    month: d.month,
    "רווח נקי": d.income-d.expenses,
    "הוצאות": d.expenses,
    "הכנסות": d.income,
  }));

  // cumulative
  let cum=0;
  const cumData = data.map(d=>{ cum+=d.income; return{month:d.month,"מצטבר":cum,"תקרה":LIMIT}; });

  // alerts
  const alerts=[];
  if(limitPct>=0.9) alerts.push({type:"danger",msg:`הכנסות עברו 90% מהתקרה! (${fmt(totalInc)}) – פנה לרו"ח בהקדם 🚨`});
  else if(limitPct>=0.67) alerts.push({type:"warning",msg:`הגעת ל-${pct(limitPct)} מתקרת עוסק פטור – התחל לתכנן מעבר`});
  if(taxGap>3000)  alerts.push({type:"warning",msg:`פער מס של ${fmt(taxGap)} – ייתכן שלא הפרשת מספיק`});
  if(taxGap<-2000) alerts.push({type:"success",msg:`שילמת ${fmt(Math.abs(taxGap))} מעל הנדרש – ייתכן שמגיע לך החזר`});
  const pendingMonths = filled.filter(d=>d.collected<d.invoiced).length;
  if(pendingMonths>0) alerts.push({type:"info",msg:`יש ${pendingMonths} חודשים עם גבייה חלקית – בדוק חשבוניות פתוחות`});

  const openEdit=()=>{
    setForm({income:cur.income||"",expenses:cur.expenses||"",taxPaid:cur.taxPaid||"",collected:cur.collected||""});
    setEditOpen(true);
  };
  const saveEdit=()=>{
    const u=[...data];
    const inc=parseFloat(form.income)||0;
    u[month]={...u[month],income:inc,expenses:parseFloat(form.expenses)||0,taxPaid:parseFloat(form.taxPaid)||0,invoiced:inc,collected:parseFloat(form.collected)||inc};
    setData(u); setEditOpen(false);
  };

  const tips = TIPS[stage.level];
  const filteredTips = filterTag==="הכל"?tips:tips.filter(t=>t.tag===filterTag);

  const TAB_LABELS=[["dashboard","📊 דשבורד"],["charts","📈 גרפים"],["collection","💳 גבייה"],["tips","💡 טיפים"]];

  const pieData = cur.income>0?[
    {name:"הוצאות",    value:cur.expenses, color:"#ef4444"},
    {name:"מס",        value:taxCur,        color:"#f59e0b"},
    {name:"קרן השתלמות",value:krnCur,       color:"#8b5cf6"},
    {name:"נטו פנוי",  value:freeCur,       color:"#10b981"},
  ]:[];

  return(
    <div style={{minHeight:"100vh",background:"#f0f4ff",fontFamily:"'Heebo',sans-serif",direction:"rtl"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#f0f4ff}
        ::-webkit-scrollbar-thumb{background:#c7d2fe;border-radius:99px}
        input:focus{outline:2px solid #3b82f6!important}
        button:hover{opacity:.88}
      `}</style>

      {/* ── Header ── */}
      <div style={{background:"linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#2563eb 100%)",padding:"24px 28px 20px",color:"#fff",boxShadow:"0 4px 24px rgba(30,58,138,.4)"}}>
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:24,fontWeight:900,letterSpacing:-0.5}}>📊 דשבורד פיננסי</div>
              <div style={{fontSize:13,opacity:.7,marginTop:2,display:"flex",alignItems:"center",gap:8}}>
                עוסק פטור · ניהול חכם · {new Date().getFullYear()}
                {saved&&<span style={{background:"#10b981",color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:99}}>✓ נשמר</span>}
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,.12)",border:`2px solid ${stage.color}`,borderRadius:12,padding:"8px 18px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12,opacity:.8}}>שלב צמיחה:</span>
              <span style={{fontWeight:900,color:stage.color,fontSize:15}}>{stage.label}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{marginTop:18}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.75,marginBottom:5}}>
              <span>התקדמות לתקרת עוסק פטור (120,000 ₪)</span>
              <span>{fmt(totalInc)} · {pct(limitPct)}</span>
            </div>
            <div style={{background:"rgba(255,255,255,.2)",borderRadius:99,height:8,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:99,width:`${Math.min(limitPct*100,100)}%`,background:limitPct>.9?"#ef4444":limitPct>.67?"#f59e0b":"#10b981",transition:"width .6s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,opacity:.6,marginTop:4}}>
              <span>0 ₪</span><span>60K</span><span>80K ⚠️</span><span>100K</span><span>120K 🚫</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1080,margin:"0 auto",padding:"20px 16px 60px"}}>

        {/* Alerts */}
        {alerts.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
            {alerts.map((a,i)=>{
              const s={warning:{bg:"#fef3c7",border:"#f59e0b"},danger:{bg:"#fee2e2",border:"#ef4444"},success:{bg:"#d1fae5",border:"#10b981"},info:{bg:"#dbeafe",border:"#3b82f6"}}[a.type];
              return(<div key={i} style={{background:s.bg,borderRight:`4px solid ${s.border}`,borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:600,direction:"rtl"}}>{a.msg}</div>);
            })}
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
          {TAB_LABELS.map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 18px",borderRadius:99,border:"none",cursor:"pointer",fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:13,background:tab===t?"#1d4ed8":"#fff",color:tab===t?"#fff":"#475569",boxShadow:tab===t?"0 2px 12px rgba(29,78,216,.4)":"0 1px 4px rgba(0,0,0,.08)",transition:"all .2s"}}>{l}</button>
          ))}
        </div>

        {/* Month bar */}
        <div style={{background:"#fff",borderRadius:14,padding:"12px 18px",boxShadow:"0 2px 10px rgba(0,0,0,.06)",marginBottom:22,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontWeight:700,color:"#475569",fontSize:12}}>חודש:</span>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",flex:1}}>
            {MONTHS.map((m,i)=>(
              <button key={i} onClick={()=>setMonth(i)} style={{padding:"4px 10px",borderRadius:99,border:"none",cursor:"pointer",fontFamily:"'Heebo',sans-serif",fontSize:11,fontWeight:700,background:month===i?"#1d4ed8":data[i].income>0?"#dbeafe":"#f1f5f9",color:month===i?"#fff":data[i].income>0?"#1d4ed8":"#94a3b8",transition:"all .15s"}}>{m}</button>
            ))}
          </div>
          <button onClick={openEdit} style={{padding:"6px 14px",borderRadius:10,border:"2px solid #1d4ed8",background:"transparent",color:"#1d4ed8",fontFamily:"'Heebo',sans-serif",fontWeight:800,fontSize:12,cursor:"pointer"}}>✏️ עדכן</button>
          <button onClick={()=>{localStorage.clear();setData(seed());}} style={{padding:"6px 14px",borderRadius:10,border:"2px solid #ef4444",background:"transparent",color:"#ef4444",fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>🗑️ אפס</button>
        </div>

        {/* ════ DASHBOARD ════ */}
        {tab==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:22}}>
            <SectionTitle>📅 {MONTHS[month]} – נתוני החודש</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
              <KPI label="הכנסות"        value={fmt(cur.income)}  icon="💰" color="#3b82f6" delta={incTrend} sub={prev?`לעומת ${fmt(prev.income)}`:""}/>
              <KPI label="הוצאות"        value={fmt(cur.expenses)} icon="📤" color="#ef4444" sub={cur.income?`${pct(cur.expenses/(cur.income||1))} מההכנסות`:""}/>
              <KPI label="רווח נקי"      value={fmt(netCur)}       icon="📊" color="#10b981" sub={cur.income?`מרווח ${pct(netCur/(cur.income||1))}`:""}/>
              <KPI label="מס נדרש (25%)" value={fmt(taxCur)}       icon="🧾" color="#f59e0b" sub={`שולם: ${fmt(cur.taxPaid)}`}/>
              <KPI label="קרן השתלמות"   value={fmt(krnCur)}        icon="📈" color="#8b5cf6" sub="4.5% מההכנסה"/>
              <KPI label="נטו פנוי"      value={fmt(freeCur)}      icon="🏦" color="#0ea5e9" sub="אחרי מס וקרן"/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              {/* Pie */}
              <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:800,fontSize:14,marginBottom:14}}>🥧 פילוח הכנסה – {MONTHS[month]}</div>
                {cur.income>0?(
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value">
                        {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip formatter={v=>fmt(v)}/>
                      <Legend formatter={v=><span style={{fontFamily:"'Heebo',sans-serif",fontSize:11}}>{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                ):(
                  <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:13}}>אין נתונים לחודש זה</div>
                )}
              </div>

              {/* Tax summary */}
              <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:800,fontSize:14,marginBottom:14}}>🧮 מצב מס שנתי</div>
                {[
                  ["סה״כ הכנסות",fmt(totalInc),"#1d4ed8"],
                  ["סה״כ הוצאות",fmt(totalExp),"#ef4444"],
                  ["רווח חייב",  fmt(totalProf),"#0f172a"],
                  ["מס נדרש",    fmt(totalTaxDue),"#f59e0b"],
                  ["מס ששולם",   fmt(totalTaxPaid),"#10b981"],
                  [taxGap>0?"יתרה לתשלום":"עודף",fmt(Math.abs(taxGap)),taxGap>0?"#ef4444":"#10b981"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                    <span style={{color:"#64748b"}}>{l}</span>
                    <span style={{fontWeight:800,color:c}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <SectionTitle>📆 סיכום שנתי מצטבר</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
              <KPI label="סה״כ הכנסות"  value={fmt(totalInc)}   icon="💵" color="#1d4ed8" sub={`${filled.length} חודשים פעילים`}/>
              <KPI label="ממוצע חודשי"  value={fmt(avgInc)}      icon="📅" color="#0891b2"/>
              <KPI label="סה״כ הוצאות"  value={fmt(totalExp)}    icon="🧮" color="#dc2626" sub={pct(totalExp/(totalInc||1))}/>
              <KPI label="רווח שנתי"    value={fmt(totalProf)}   icon="🎯" color="#059669"/>
              <KPI label={taxGap>0?"חוב מס":"החזר מס"} value={fmt(Math.abs(taxGap))} icon={taxGap>0?"⚠️":"✅"} color={taxGap>0?"#f59e0b":"#10b981"} sub={taxGap>0?"לתשלום":"לזכות"}/>
              <KPI label="נותר לתקרה"   value={fmt(LIMIT-totalInc)} icon="📏" color={limitPct>.8?"#ef4444":"#64748b"} sub={pct(1-limitPct)}/>
            </div>
          </div>
        )}

        {/* ════ CHARTS ════ */}
        {tab==="charts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:22}}>

            {/* Profit vs Expenses bar+line */}
            <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>📊 רווח נקי מול הוצאות</div>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:18}}>עמודות = הוצאות | קו = רווח נקי</div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={profData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"'Heebo',sans-serif"}}/>
                  <YAxis tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                  <Tooltip content={<Tooltip_/>}/>
                  <Legend formatter={v=><span style={{fontFamily:"'Heebo',sans-serif",fontSize:12}}>{v}</span>}/>
                  <Bar dataKey="הוצאות"  fill="#fca5a5" radius={[6,6,0,0]}/>
                  <Bar dataKey="הכנסות"  fill="#bfdbfe" radius={[6,6,0,0]}/>
                  <Line type="monotone" dataKey="רווח נקי" stroke="#10b981" strokeWidth={3} dot={{fill:"#10b981",r:5}}/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Cumulative */}
            <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>📈 הכנסה מצטברת לאורך השנה</div>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:18}}>קו מקווקו אדום = תקרת עוסק פטור (120,000 ₪)</div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={cumData.slice(0,filled.length+1)}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"'Heebo',sans-serif"}}/>
                  <YAxis tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                  <Tooltip content={<Tooltip_/>}/>
                  <Legend formatter={v=><span style={{fontFamily:"'Heebo',sans-serif",fontSize:12}}>{v}</span>}/>
                  <Area type="monotone" dataKey="מצטבר" stroke="#3b82f6" strokeWidth={3} fill="url(#g1)" dot={{fill:"#3b82f6",r:5}}/>
                  <Line type="monotone" dataKey="תקרה"  stroke="#ef4444" strokeWidth={2} strokeDasharray="8 4" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Income trend line */}
            <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>📉 מגמת הכנסות חודשית</div>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:18}}>זיהוי מגמת עלייה / ירידה לאורך הזמן</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={profData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"'Heebo',sans-serif"}}/>
                  <YAxis tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                  <Tooltip content={<Tooltip_/>}/>
                  <Legend formatter={v=><span style={{fontFamily:"'Heebo',sans-serif",fontSize:12}}>{v}</span>}/>
                  <Line type="monotone" dataKey="הכנסות" stroke="#3b82f6" strokeWidth={3} dot={{fill:"#3b82f6",r:5}} activeDot={{r:8}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ════ COLLECTION ════ */}
        {tab==="collection"&&(
          <div style={{display:"flex",flexDirection:"column",gap:22}}>

            {/* Summary KPIs */}
            <SectionTitle>💳 מצב גבייה כולל</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
              {(()=>{
                const totalInv  = filled.reduce((s,d)=>s+d.invoiced,0);
                const totalColl = filled.reduce((s,d)=>s+d.collected,0);
                const totalOpen = totalInv-totalColl;
                const collRate  = totalInv?totalColl/totalInv:0;
                return(<>
                  <KPI label="סה״כ חויב"     value={fmt(totalInv)}   icon="📋" color="#3b82f6"/>
                  <KPI label="סה״כ נגבה"     value={fmt(totalColl)}  icon="✅" color="#10b981"/>
                  <KPI label="פתוח לגבייה"   value={fmt(totalOpen)}  icon="⏳" color={totalOpen>5000?"#ef4444":"#f59e0b"}/>
                  <KPI label="אחוז גבייה"    value={pct(collRate)}    icon="📊" color={collRate>.9?"#10b981":"#f59e0b"} sub={collRate>.9?"מצוין":"יש מקום לשיפור"}/>
                </>);
              })()}
            </div>

            {/* Collection bar chart */}
            <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>💰 חויב מול נגבה – לפי חודש</div>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:18}}>עמודה כחולה בהירה = חויב | כהה = נגבה בפועל | פער = פתוח</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={collData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"'Heebo',sans-serif"}}/>
                  <YAxis tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                  <Tooltip content={<Tooltip_/>}/>
                  <Legend formatter={v=><span style={{fontFamily:"'Heebo',sans-serif",fontSize:12}}>{v}</span>}/>
                  <Bar dataKey="חויב"  fill="#bfdbfe" radius={[6,6,0,0]}/>
                  <Bar dataKey="נגבה"  fill="#1d4ed8" radius={[6,6,0,0]}/>
                  <Bar dataKey="פתוח"  fill="#fca5a5" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Collection status table */}
            <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:16}}>📋 פירוט חודשי</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,direction:"rtl"}}>
                  <thead>
                    <tr style={{background:"#f8fafc"}}>
                      {["חודש","חויב","נגבה","פתוח","% גבייה","סטטוס"].map(h=>(
                        <th key={h} style={{padding:"10px 12px",textAlign:"center",fontWeight:800,color:"#475569",borderBottom:"2px solid #e2e8f0"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filled.map((d,i)=>{
                      const open=d.invoiced-d.collected;
                      const rate=d.invoiced?d.collected/d.invoiced:1;
                      const status=rate>=1?"✅ שולם במלואו":rate>=0.8?"⚠️ חלקי":"❌ פתוח";
                      const statusColor=rate>=1?"#10b981":rate>=0.8?"#f59e0b":"#ef4444";
                      return(
                        <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#f8fafc"}}>
                          <td style={{padding:"9px 12px",textAlign:"center",fontWeight:700}}>{d.month}</td>
                          <td style={{padding:"9px 12px",textAlign:"center"}}>{fmt(d.invoiced)}</td>
                          <td style={{padding:"9px 12px",textAlign:"center",color:"#10b981",fontWeight:700}}>{fmt(d.collected)}</td>
                          <td style={{padding:"9px 12px",textAlign:"center",color:open>0?"#ef4444":"#10b981",fontWeight:700}}>{open>0?fmt(open):"—"}</td>
                          <td style={{padding:"9px 12px",textAlign:"center"}}>
                            <div style={{background:"#f1f5f9",borderRadius:99,height:6,width:80,margin:"0 auto",overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${rate*100}%`,background:rate>=1?"#10b981":rate>=0.8?"#f59e0b":"#ef4444",borderRadius:99}}/>
                            </div>
                            <div style={{fontSize:11,marginTop:3,color:statusColor,fontWeight:700}}>{pct(rate)}</div>
                          </td>
                          <td style={{padding:"9px 12px",textAlign:"center",fontWeight:700,color:statusColor}}>{status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips for collection */}
            <div style={{background:"#ecfdf5",borderRight:"4px solid #10b981",borderRadius:12,padding:"14px 18px"}}>
              <div style={{fontWeight:800,fontSize:14,color:"#065f46",marginBottom:8}}>💡 איך לשפר גבייה?</div>
              <div style={{fontSize:13,color:"#047857",lineHeight:1.8}}>
                • שלח תזכורת 2 ימים לפני מועד הפירעון<br/>
                • לקוחות חדשים – תמיד 30% מקדמה<br/>
                • אחרי 7 ימי איחור – שיחת טלפון (לא רק מייל)<br/>
                • עבודות גדולות – פרוס לתשלומי ביניים לפי אבני דרך
              </div>
            </div>
          </div>
        )}

        {/* ════ TIPS ════ */}
        {tab==="tips"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>

            {/* Stage card */}
            <div style={{background:`linear-gradient(135deg,${stage.color}18,${stage.color}08)`,border:`2px solid ${stage.color}`,borderRadius:16,padding:"20px 24px"}}>
              <div style={{fontSize:22,fontWeight:900,color:stage.color}}>{stage.label}</div>
              <div style={{fontSize:13,color:"#475569",marginTop:6,lineHeight:1.7}}>
                הכנסות שנתיות מצטברות: <strong>{fmt(totalInc)}</strong><br/>
                הטיפים הבאים מותאמים אישית לשלב הצמיחה הנוכחי שלך.
                {stage.level<4&&<> הרף הבא: <strong>{stage.next}</strong>.</>}
              </div>
            </div>

            {/* Filter tags */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["הכל","מס","צמיחה","גבייה","דחוף"].map(t=>(
                <button key={t} onClick={()=>setFilterTag(t)} style={{
                  padding:"5px 14px",borderRadius:99,border:`2px solid ${filterTag===t?(TAG_COLORS[t]||"#1d4ed8"):"#e2e8f0"}`,
                  background:filterTag===t?(TAG_COLORS[t]||"#1d4ed8"):"#fff",
                  color:filterTag===t?"#fff":"#64748b",
                  fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"
                }}>{t}</button>
              ))}
            </div>

            <SectionTitle>💡 המלצות מותאמות לשלב שלך</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
              {filteredTips.map((tip,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:14,padding:"18px 20px",borderRight:`4px solid ${TAG_COLORS[tip.tag]||stage.color}`,boxShadow:"0 2px 10px rgba(0,0,0,.07)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{tip.icon} {tip.title}</div>
                    <Tag label={tip.tag}/>
                  </div>
                  <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>{tip.text}</div>
                </div>
              ))}
            </div>

            <SectionTitle>📌 כללי זהב – תמיד נכון</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
              {[
                {icon:"🏦",text:"הפרש 25% מכל הכנסה – ברגע שנכנס לחשבון"},
                {icon:"📸",text:"צלם כל קבלה מיד – לא 'מחר'"},
                {icon:"📞",text:"פגישת רו\"ח פעמיים בשנה – לא רק בתקופת הדוח"},
                {icon:"💳",text:"אפס תנועות אישיות בחשבון העסקי"},
                {icon:"📊",text:"עדכן את הדשבורד הזה פעם בחודש – 10 דקות שמשנות"},
                {icon:"🎯",text:"דע את נקודת האיזון שלך – מה המינימום להכנסה בחודש?"},
              ].map((t,i)=>(
                <div key={i} style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start",border:"1px solid #e2e8f0"}}>
                  <span style={{fontSize:20}}>{t.icon}</span>
                  <span style={{fontSize:13,color:"#334155",fontWeight:600,lineHeight:1.6}}>{t.text}</span>
                </div>
              ))}
            </div>

            {taxGap>1000&&(
              <div style={{background:"#fff7ed",border:"2px solid #f59e0b",borderRadius:14,padding:20}}>
                <div style={{fontWeight:800,fontSize:14,color:"#92400e",marginBottom:8}}>⚠️ תזכורת מס אישית</div>
                <div style={{fontSize:13,color:"#78350f",lineHeight:1.7}}>
                  יש פער מס של <strong>{fmt(taxGap)}</strong> בין הנדרש לבין שולם.
                  מומלץ להפריש סכום זה לחשבון נפרד ולהתייעץ עם רו"ח.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:20,padding:30,width:320,boxShadow:"0 24px 80px rgba(0,0,0,.3)",direction:"rtl"}}>
            <div style={{fontSize:18,fontWeight:900,marginBottom:20}}>✏️ עדכון {MONTHS[month]}</div>
            {[["הכנסות (₪)","income"],["הוצאות (₪)","expenses"],["מס ששולם (₪)","taxPaid"],["נגבה בפועל (₪)","collected"]].map(([label,key])=>(
              <div key={key} style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:4}}>{label}</div>
                <input type="number" value={form[key]||""} onChange={e=>setForm({...form,[key]:e.target.value})}
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"2px solid #e2e8f0",fontFamily:"'Heebo',sans-serif",fontSize:15,fontWeight:700,color:"#1d4ed8"}}/>
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={saveEdit} style={{flex:1,padding:11,borderRadius:10,border:"none",background:"#1d4ed8",color:"#fff",fontFamily:"'Heebo',sans-serif",fontWeight:800,fontSize:14,cursor:"pointer"}}>שמור</button>
              <button onClick={()=>setEditOpen(false)} style={{flex:1,padding:11,borderRadius:10,border:"2px solid #e2e8f0",background:"#fff",fontFamily:"'Heebo',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",color:"#475569"}}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
