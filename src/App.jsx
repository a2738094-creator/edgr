import { useState, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie, Area, AreaChart } from "recharts";

/* ══════════════════════════════════════════════════════════
   DATA & CONSTANTS
══════════════════════════════════════════════════════════ */
const SYMBOL_META = {
  TXF:{label:"台指期",pointValue:200,commission:100,currency:"TWD",group:"TW"},
  MXF:{label:"小台指",pointValue:50,commission:60,currency:"TWD",group:"TW"},
  TE:{label:"電子期",pointValue:4000,commission:100,currency:"TWD",group:"TW"},
  MTX:{label:"微型台指",pointValue:10,commission:40,currency:"TWD",group:"TW"},
  NQ:{label:"那斯達克",pointValue:20,commission:8,currency:"USD",group:"US"},
  ES:{label:"S&P 500",pointValue:50,commission:8,currency:"USD",group:"US"},
  YM:{label:"道瓊",pointValue:5,commission:8,currency:"USD",group:"US"},
  RTY:{label:"羅素2000",pointValue:50,commission:8,currency:"USD",group:"US"},
  GC:{label:"黃金",pointValue:100,commission:8,currency:"USD",group:"US"},
  SI:{label:"白銀",pointValue:50,commission:8,currency:"USD",group:"US"},
  CL:{label:"原油",pointValue:1000,commission:8,currency:"USD",group:"US"},
  MNQ:{label:"微那斯達克",pointValue:2,commission:3.5,currency:"USD",group:"MICRO"},
  MES:{label:"微S&P 500",pointValue:5,commission:3.5,currency:"USD",group:"MICRO"},
  MYM:{label:"微道瓊",pointValue:0.5,commission:3.5,currency:"USD",group:"MICRO"},
  M2K:{label:"微羅素",pointValue:5,commission:3.5,currency:"USD",group:"MICRO"},
  MGC:{label:"微黃金",pointValue:10,commission:3.5,currency:"USD",group:"MICRO"},
  SIL:{label:"微白銀",pointValue:25,commission:3.5,currency:"USD",group:"MICRO"},
  MCL:{label:"微原油",pointValue:100,commission:3.5,currency:"USD",group:"MICRO"},
  其他:{label:"其他",pointValue:1,commission:0,currency:"USD",group:"OTHER"},
};
const SYMS = Object.keys(SYMBOL_META);
const SYM_GROUPS = {TW:"台灣期貨",US:"美國標準",MICRO:"美國微型",OTHER:"其他"};
const EMOTIONS = ["冷靜","專注","貪婪","恐懼","急躁","興奮","沮喪","自信"];
const TAGS_PRE = ["順勢","逆勢","突破","回測","停損","停利","區間","量價配合","均線","型態"];
const DEF_CAP  = {initialCapital:100000,currency:"TWD",label:"主帳戶"};

/* ══════════════════════════════════════════════════════════
   DAILY QUOTES  (每日自動輪換 — 以當日日期為種子)
══════════════════════════════════════════════════════════ */
const QUOTES = [
  { text:"市場永遠是對的，你的意見永遠可以是錯的。",        author:"Jesse Livermore" },
  { text:"計畫你的交易，交易你的計畫。",                    author:"交易人格言" },
  { text:"截斷虧損，讓利潤奔跑。",                          author:"Ed Seykota" },
  { text:"最危險的四個字是：這次不一樣。",                  author:"Sir John Templeton" },
  { text:"不要試圖預測市場，要學會回應市場。",              author:"交易人格言" },
  { text:"資金管理是交易生存的根本，策略只是工具。",        author:"交易人格言" },
  { text:"在別人恐懼時貪婪，在別人貪婪時恐懼。",           author:"Warren Buffett" },
  { text:"每一筆虧損都是學費，問題是你學到了什麼。",        author:"交易人格言" },
  { text:"紀律是把策略從紙上帶進市場的唯一橋樑。",         author:"Mark Douglas" },
  { text:"你不需要每天交易，你只需要在對的時候交易。",      author:"交易人格言" },
  { text:"控制風險是你唯一能控制的事。",                    author:"交易人格言" },
  { text:"趨勢是你的朋友，直到它結束為止。",               author:"Martin Zweig" },
  { text:"小虧損是交易的成本，不是失敗的標誌。",           author:"交易人格言" },
  { text:"市場不欠你錢，它只給予準備好的人。",             author:"交易人格言" },
  { text:"成功的交易者不預測未來，他們管理當下。",          author:"交易人格言" },
  { text:"交易最難的部分不是分析，而是執行。",             author:"Mark Douglas" },
  { text:"你的倉位大小決定你能否在市場長期存活。",          author:"交易人格言" },
  { text:"每次進場前問自己：如果我錯了，損失是多少？",      author:"交易人格言" },
  { text:"耐心是交易者最被低估的技能。",                   author:"Jack Schwager" },
  { text:"情緒是交易帳戶最大的殺手。",                     author:"交易人格言" },
  { text:"只在你有優勢的情況下下注，其他時間袖手旁觀。",   author:"交易人格言" },
  { text:"一致性比偶爾的大獲全勝更有價值。",               author:"交易人格言" },
  { text:"停損不是失敗，是對計畫的尊重。",                 author:"交易人格言" },
  { text:"市場會獎勵耐心，懲罰衝動。",                     author:"交易人格言" },
  { text:"你無法控制市場，但你能控制自己的反應。",          author:"Van Tharp" },
  { text:"最好的交易機會是你不需要勉強自己的那一筆。",      author:"交易人格言" },
  { text:"過去的盈利不代表未來，但過去的壞習慣會。",        author:"交易人格言" },
  { text:"保護本金是第一優先，獲利是第二優先。",            author:"Paul Tudor Jones" },
  { text:"當你不確定時，最好的部位是空倉。",               author:"交易人格言" },
  { text:"每一天開盤都是一張新的白紙，昨天不重要。",        author:"交易人格言" },
];
function getDailyQuote() {
  const today = new Date();
  const seed = today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate();
  return QUOTES[seed % QUOTES.length];
}

const SEED = [
  {id:1,date:"2026-03-03",symbol:"MNQ",direction:"long", entryPrice:19800,exitPrice:19950,contracts:2,pointValue:2,  commission:3.5, stopLoss:19740,takeProfit:20000,mindset:8,emotion:"冷靜",tags:["順勢","突破"],       note:"開盤強勢突破，MNQ做多，紀律停利。",   screenshots:[],status:"closed"},
  {id:2,date:"2026-03-07",symbol:"MES",direction:"short",entryPrice:5300, exitPrice:5330, contracts:3,pointValue:5,  commission:3.5, stopLoss:5320, takeProfit:5250, mindset:4,emotion:"恐懼",tags:["逆勢","停損"],       note:"心態急躁，未等確認就進場。",          screenshots:[],status:"closed"},
  {id:3,date:"2026-03-10",symbol:"TXF",direction:"long", entryPrice:22450,exitPrice:22610,contracts:2,pointValue:200,commission:100,  stopLoss:22380,takeProfit:22650,mindset:9,emotion:"冷靜",tags:["區間突破","量價配合"],note:"縮量整理後放量突破，耐心等最佳進場。", screenshots:[],status:"closed"},
  {id:4,date:"2026-03-14",symbol:"MGC",direction:"long", entryPrice:2050, exitPrice:2078, contracts:1,pointValue:10, commission:3.5, stopLoss:2038, takeProfit:2090, mindset:7,emotion:"專注",tags:["順勢"],              note:"黃金突破前高，微型黃金做多。",        screenshots:[],status:"closed"},
  {id:5,date:"2026-03-17",symbol:"MXF",direction:"short",entryPrice:22700,exitPrice:22620,contracts:4,pointValue:50, commission:60,   stopLoss:22760,takeProfit:22580,mindset:8,emotion:"冷靜",tags:["均線","型態"],        note:"空頭排列，逢高放空。",                screenshots:[],status:"closed"},
  {id:6,date:"2026-03-20",symbol:"NQ", direction:"long", entryPrice:19500,exitPrice:19580,contracts:1,pointValue:20, commission:8,    stopLoss:19440,takeProfit:19650,mindset:6,emotion:"興奮",tags:["突破"],              note:"那指突破整理區，標準合約做多。",      screenshots:[],status:"closed"},
  {id:7,date:"2026-03-22",symbol:"TXF",direction:"short",entryPrice:22650,exitPrice:null, contracts:2,pointValue:200,commission:100,  stopLoss:22720,takeProfit:22450,mindset:7,emotion:"專注",tags:["空頭排列"],           note:"均線空頭排列，持倉中。",              screenshots:[],status:"open"},
];

/* ══════════════════════════════════════════════════════════
   PURE HELPERS
══════════════════════════════════════════════════════════ */
const gPnl  = r => r.status==="open"||r.exitPrice==null ? null : (r.direction==="long"?1:-1)*(r.exitPrice-r.entryPrice)*r.contracts*r.pointValue;
const fee   = r => (r.commission??0)*r.contracts;
const nPnl  = r => { const g=gPnl(r); return g==null?null:g-fee(r); };
const fAmt  = n => n==null?"—":(n>=0?"+":"-")+Math.abs(Math.round(n)).toLocaleString("zh-TW");
const fPct  = n => n==null||!isFinite(n)?"—":(n>=0?"+":"")+n.toFixed(2)+"%";
const readFileB64 = f => new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsDataURL(f);});

/* CSV export */
function exportCSV(records, capital) {
  const headers = ["日期","標的","標的名稱","方向","口數","進場價","出場價","停損","停利","每點","手續費/口","毛損益","手續費合計","淨損益","ROI%","心態","情緒","標籤","狀態","備註"];
  const ic = capital.initialCapital;
  const rows = records.map(r=>{
    const g=gPnl(r); const n=nPnl(r); const f2=fee(r);
    const roi = n!=null&&ic ? (n/ic*100).toFixed(2) : "";
    const m = SYMBOL_META[r.symbol]||{};
    return [
      r.date, r.symbol, m.label||"",
      r.direction==="long"?"多":"空",
      r.contracts, r.entryPrice,
      r.exitPrice??"", r.stopLoss??"", r.takeProfit??"",
      r.pointValue, r.commission,
      g!=null?Math.round(g):"",
      f2, n!=null?Math.round(n):"",
      roi, r.mindset, r.emotion,
      (r.tags||[]).join("/"),
      r.status==="closed"?"已結單":"持倉中",
      `"${(r.note||"").replace(/"/g,'""')}"`
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const bom  = "\uFEFF";
  const blob = new Blob([bom+csv], {type:"text/csv;charset=utf-8;"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=`trading-log-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* JSON export */
function exportJSON(records) {
  const clean = records.map(r=>({...r, screenshots:(r.screenshots||[]).map(s=>({name:s.name}))}));
  const blob = new Blob([JSON.stringify(clean,null,2)], {type:"application/json"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=`trading-log-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS  (luxury editorial dark — amber + slate)
══════════════════════════════════════════════════════════ */
const C = {
  bg0:"#06080f", bg1:"#0b0f1a", bg2:"#111827", bg3:"#1a2236",
  border:"#1e2d45", borderGlow:"#2a4060",
  gold:"#d4a847", goldDim:"#8a6820", goldGlow:"rgba(212,168,71,.15)",
  green:"#22c55e", greenDim:"rgba(34,197,94,.12)", greenGlow:"rgba(34,197,94,.2)",
  red:"#f43f5e",   redDim:"rgba(244,63,94,.12)",   redGlow:"rgba(244,63,94,.2)",
  amber:"#f59e0b", blue:"#38bdf8", slate:"#475569", dim:"#334155",
  text:"#e2e8f0", textMid:"#94a3b8", textDim:"#475569",
};

/* ══════════════════════════════════════════════════════════
   CHART COMPONENTS
══════════════════════════════════════════════════════════ */
function EquityArea({ records }) {
  const data = useMemo(()=>{
    const closed=records.filter(r=>r.status==="closed"&&nPnl(r)!=null).sort((a,b)=>new Date(a.date)-new Date(b.date));
    let cum=0; return [{date:"start",pnl:0},...closed.map(r=>{cum+=nPnl(r);return{date:r.date.slice(5),pnl:Math.round(cum)};})];
  },[records]);
  if(data.length<3) return <p style={{color:C.dim,fontSize:12,textAlign:"center",padding:"28px 0"}}>至少需要2筆已結單記錄</p>;
  const last=(data[data.length-1]?.pnl??0); const lc=last>=0?C.green:C.red;
  const gradId=`eq${last>=0?"g":"r"}`;
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{top:10,right:4,left:-28,bottom:0}}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lc} stopOpacity={0.25}/>
            <stop offset="100%" stopColor={lc} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{fill:C.dim,fontSize:9,fontFamily:"monospace"}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
        <YAxis tick={{fill:C.dim,fontSize:9,fontFamily:"monospace"}} axisLine={false} tickLine={false}/>
        <ReferenceLine y={0} stroke={C.border} strokeDasharray="4 4"/>
        <Tooltip contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,fontFamily:"monospace"}}
          labelStyle={{color:C.textDim}} formatter={v=>[fAmt(v),"淨損益"]}/>
        <Area type="monotone" dataKey="pnl" stroke={lc} strokeWidth={2} fill={`url(#${gradId})`} dot={false} activeDot={{r:4,fill:lc,strokeWidth:0}}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RoiArea({ records, capital }) {
  const data = useMemo(()=>{
    const ic=capital.initialCapital; if(!ic) return [];
    const closed=records.filter(r=>r.status==="closed"&&nPnl(r)!=null).sort((a,b)=>new Date(a.date)-new Date(b.date));
    let cum=0; return [{date:"start",roi:0},...closed.map(r=>{cum+=nPnl(r);return{date:r.date.slice(5),roi:+((cum/ic)*100).toFixed(2)};})];
  },[records,capital]);
  if(data.length<3) return <p style={{color:C.dim,fontSize:12,textAlign:"center",padding:"28px 0"}}>至少需要2筆已結單記錄</p>;
  const last=data[data.length-1]?.roi??0; const lc=last>=0?C.green:C.red;
  const gradId=`roi${last>=0?"g":"r"}`;
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{top:10,right:4,left:-16,bottom:0}}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lc} stopOpacity={0.25}/>
            <stop offset="100%" stopColor={lc} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{fill:C.dim,fontSize:9,fontFamily:"monospace"}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
        <YAxis tick={{fill:C.dim,fontSize:9,fontFamily:"monospace"}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
        <ReferenceLine y={0} stroke={C.border} strokeDasharray="4 4"/>
        <Tooltip contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,fontFamily:"monospace"}}
          labelStyle={{color:C.textDim}} formatter={v=>[fPct(v),"報酬率"]}/>
        <Area type="monotone" dataKey="roi" stroke={lc} strokeWidth={2} fill={`url(#${gradId})`} dot={false} activeDot={{r:4,fill:lc,strokeWidth:0}}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DailyBars({ records }) {
  const data = useMemo(()=>{
    const map={};
    records.filter(r=>r.status==="closed"&&nPnl(r)!=null).forEach(r=>{const d=r.date.slice(5);map[d]=(map[d]||0)+nPnl(r);});
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).slice(-12).map(([date,pnl])=>({date,pnl:Math.round(pnl)}));
  },[records]);
  if(!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} margin={{top:4,right:4,left:-28,bottom:0}}>
        <XAxis dataKey="date" tick={{fill:C.dim,fontSize:9,fontFamily:"monospace"}} axisLine={false} tickLine={false}/>
        <YAxis tick={{fill:C.dim,fontSize:9}} axisLine={false} tickLine={false}/>
        <ReferenceLine y={0} stroke={C.border}/>
        <Tooltip contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,fontFamily:"monospace"}} formatter={v=>[fAmt(v),"日損益"]}/>
        <Bar dataKey="pnl" radius={[2,2,0,0]}>
          {data.map((d,i)=><Cell key={i} fill={d.pnl>=0?C.green:C.red} fillOpacity={0.75}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function WinDonut({ wins, losses }) {
  if(!wins&&!losses) return <div style={{width:72,height:72}}/>;
  return (
    <PieChart width={72} height={72}>
      <Pie data={[{value:wins},{value:losses}]} cx={32} cy={32} innerRadius={20} outerRadius={34}
        dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
        <Cell fill={C.green}/><Cell fill={C.red}/>
      </Pie>
    </PieChart>
  );
}

function MindBar({ value }) {
  const color=value>=7?C.green:value>=5?C.amber:C.red;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:3,background:C.bg3,borderRadius:99,overflow:"hidden"}}>
        <div style={{width:`${value*10}%`,height:"100%",background:color,borderRadius:99,transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/>
      </div>
      <span style={{fontSize:11,color,fontWeight:700,minWidth:12,fontFamily:"monospace"}}>{value}</span>
    </div>
  );
}

function Chip({ label, color="#38bdf8" }) {
  return <span style={{fontSize:10,background:`rgba(${color==="green"?"34,197,94":color==="red"?"244,63,94":"56,189,248"},.1)`,color:color==="green"?C.green:color==="red"?C.red:C.blue,padding:"2px 7px",borderRadius:4,border:`1px solid rgba(${color==="green"?"34,197,94":color==="red"?"244,63,94":"56,189,248"},.25)`,letterSpacing:.5,fontFamily:"monospace"}}>{label}</span>;
}

/* ══════════════════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════════════════ */
function SheetModal({ title, onClose, children }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:"20px 20px 0 0",padding:"28px 22px 36px",width:"100%",maxWidth:460,maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <p style={{fontSize:14,fontWeight:700,color:C.text,letterSpacing:2,textTransform:"uppercase",fontFamily:"monospace"}}>{title}</p>
          <button style={{background:"none",border:"none",color:C.textMid,fontSize:20,cursor:"pointer",lineHeight:1}} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CapitalModal({ capital, onSave, onClose }) {
  const [val,setVal]=useState(String(capital.initialCapital));
  const [cur,setCur]=useState(capital.currency);
  const [lbl,setLbl]=useState(capital.label);
  function save(){ const n=parseFloat(val.replace(/,/g,"")); if(isNaN(n)||n<=0)return; onSave({initialCapital:n,currency:cur,label:lbl}); onClose(); }
  return (
    <SheetModal title="⚙ 倉位資金設定" onClose={onClose}>
      <Label>帳戶標籤</Label>
      <Input style={{marginTop:6,marginBottom:16}} value={lbl} onChange={e=>setLbl(e.target.value)} placeholder="主帳戶、模擬倉…"/>
      <Label>初始倉位金額 <span style={{color:C.red}}>*</span></Label>
      <div style={{display:"flex",gap:8,marginTop:6,marginBottom:8}}>
        <Input style={{flex:1}} type="number" value={val} onChange={e=>setVal(e.target.value)} placeholder="100000"/>
        <select style={{...inputSt,width:84}} value={cur} onChange={e=>setCur(e.target.value)}>
          <option value="TWD">TWD</option><option value="USD">USD</option>
        </select>
      </div>
      <p style={{fontSize:11,color:C.textDim,marginBottom:20,lineHeight:1.6}}>設定後儀表板顯示 ROI 及最大風險佔比</p>
      <Label>快速填入</Label>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8,marginBottom:22}}>
        {[50000,100000,200000,500000,1000000].map(n=>(
          <Pill key={n} active={val===String(n)} onClick={()=>setVal(String(n))}>{n>=10000?`${n/10000}萬`:n.toLocaleString()}</Pill>
        ))}
      </div>
      <BtnPrimary onClick={save}>確認儲存</BtnPrimary>
      <BtnGhost onClick={onClose}>取消</BtnGhost>
    </SheetModal>
  );
}

function ExportModal({ records, capital, onClose }) {
  const [fmt, setFmt] = useState("csv");
  const [range, setRange] = useState("all");

  function getFiltered() {
    const now = new Date();
    if(range==="month") {
      const m=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
      return records.filter(r=>r.date.startsWith(m));
    }
    if(range==="closed") return records.filter(r=>r.status==="closed");
    return records;
  }

  function doExport() {
    const data = getFiltered();
    if(fmt==="csv") exportCSV(data, capital);
    else exportJSON(data);
    onClose();
  }

  const count = getFiltered().length;

  return (
    <SheetModal title="↑ 匯出交易紀錄" onClose={onClose}>
      <Label>匯出格式</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8,marginBottom:18}}>
        {[["csv","CSV 試算表","可用 Excel / Numbers 開啟"],["json","JSON 原始資料","含所有欄位完整備份"]].map(([v,t,d])=>(
          <div key={v} style={{background:fmt===v?C.bg3:C.bg2,border:`1px solid ${fmt===v?C.gold:C.border}`,borderRadius:10,padding:"12px",cursor:"pointer",transition:"all .2s"}} onClick={()=>setFmt(v)}>
            <p style={{fontSize:13,fontWeight:700,color:fmt===v?C.gold:C.text,marginBottom:4,fontFamily:"monospace"}}>{t}</p>
            <p style={{fontSize:11,color:C.textDim}}>{d}</p>
          </div>
        ))}
      </div>

      <Label>匯出範圍</Label>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8,marginBottom:22}}>
        {[["all","全部紀錄"],["closed","僅已結單"],["month","本月紀錄"]].map(([v,t])=>(
          <div key={v} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:range===v?C.bg3:C.bg2,border:`1px solid ${range===v?C.borderGlow:C.border}`,borderRadius:8,cursor:"pointer",transition:"all .2s"}} onClick={()=>setRange(v)}>
            <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${range===v?C.gold:C.dim}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {range===v&&<div style={{width:6,height:6,borderRadius:"50%",background:C.gold}}/>}
            </div>
            <span style={{fontSize:13,color:range===v?C.text:C.textMid}}>{t}</span>
            <span style={{marginLeft:"auto",fontSize:11,color:C.textDim,fontFamily:"monospace"}}>{range===v?`${count} 筆`:""}</span>
          </div>
        ))}
      </div>

      <div style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",marginBottom:20,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:C.textDim}}>預計匯出</span>
        <span style={{fontSize:13,fontWeight:700,color:C.gold,fontFamily:"monospace"}}>{count} 筆交易</span>
      </div>

      <BtnPrimary onClick={doExport}>立即匯出</BtnPrimary>
      <BtnGhost onClick={onClose}>取消</BtnGhost>
    </SheetModal>
  );
}

/* ══════════════════════════════════════════════════════════
   SMALL REUSABLE UI ATOMS
══════════════════════════════════════════════════════════ */
const inputSt = {background:C.bg2,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:8,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"monospace"};
function Input({style,...p}){return <input style={{...inputSt,...style}} {...p}/>;}
function Label({children}){return <p style={{fontSize:10,letterSpacing:2,color:C.textDim,textTransform:"uppercase",fontFamily:"monospace"}}>{children}</p>;}
function Pill({active,onClick,children}){return <button style={{padding:"5px 12px",background:active?C.bg3:C.bg2,border:`1px solid ${active?C.gold:C.border}`,color:active?C.gold:C.textMid,borderRadius:6,cursor:"pointer",fontSize:11,transition:"all .2s",fontFamily:"monospace"}} onClick={onClick}>{children}</button>;}
function BtnPrimary({onClick,children}){return <button style={{width:"100%",padding:"13px 0",background:`linear-gradient(135deg,${C.gold},#b8860b)`,border:"none",borderRadius:10,color:"#06080f",fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:10,letterSpacing:1,fontFamily:"monospace"}} onClick={onClick}>{children}</button>;}
function BtnGhost({onClick,children}){return <button style={{width:"100%",padding:"11px 0",background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.textDim,fontSize:12,cursor:"pointer",fontFamily:"monospace"}} onClick={onClick}>{children}</button>;}

/* ══════════════════════════════════════════════════════════
   SCREENSHOT UPLOADER
══════════════════════════════════════════════════════════ */
function ScreenshotUploader({ screenshots, onChange }) {
  const fileRef=useRef();
  async function handleFiles(files){
    const res=[];
    for(const f of Array.from(files)){
      if(!f.type.startsWith("image/")||f.size>5*1024*1024) continue;
      res.push({id:Date.now()+Math.random(),dataUrl:await readFileB64(f),name:f.name});
    }
    onChange([...screenshots,...res]);
  }
  return (
    <div style={{marginBottom:20}} onPaste={e=>{const files=Array.from(e.clipboardData?.items||[]).filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);handleFiles(files);}}>
      <Label>交易截圖 <span style={{color:C.textDim,fontWeight:400,textTransform:"none"}}>（點擊·拖曳·Ctrl+V，≤5MB）</span></Label>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:"22px",background:C.bg0,border:`2px dashed ${C.border}`,borderRadius:12,cursor:"pointer",marginTop:8,marginBottom:10,transition:"border-color .2s"}}
        onClick={()=>fileRef.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files);}}>
        <span style={{fontSize:26,filter:"grayscale(.3)"}}>📷</span>
        <span style={{fontSize:11,color:C.textDim,fontFamily:"monospace"}}>點擊上傳 · 拖曳 · Ctrl+V 貼上</span>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
      </div>
      {screenshots.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {screenshots.map(sh=>(
            <div key={sh.id} style={{position:"relative",width:78,height:58}}>
              <img src={sh.dataUrl} style={{width:78,height:58,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`,display:"block"}}/>
              <button style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",background:C.red,border:"none",color:"#fff",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                onClick={()=>onChange(screenshots.filter(s=>s.id!==sh.id))}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════ */
function Lightbox({ shots, startIndex, onClose }) {
  const [idx,setIdx]=useState(startIndex);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{position:"relative",maxWidth:"95vw",maxHeight:"92vh",display:"flex",flexDirection:"column",alignItems:"center",gap:14}} onClick={e=>e.stopPropagation()}>
        <button style={{position:"absolute",top:-38,right:0,background:"none",border:"none",color:C.textMid,fontSize:22,cursor:"pointer"}} onClick={onClose}>✕</button>
        <img src={shots[idx].dataUrl} style={{maxWidth:"92vw",maxHeight:"78vh",objectFit:"contain",borderRadius:10,boxShadow:"0 0 60px rgba(0,0,0,.8)"}}/>
        {shots.length>1&&(
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <button style={{background:"rgba(255,255,255,.06)",border:`1px solid ${C.border}`,color:C.text,width:38,height:38,borderRadius:"50%",cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center"}}
              onClick={()=>setIdx(i=>(i-1+shots.length)%shots.length)}>‹</button>
            <span style={{color:C.textDim,fontSize:12,fontFamily:"monospace"}}>{idx+1} / {shots.length}</span>
            <button style={{background:"rgba(255,255,255,.06)",border:`1px solid ${C.border}`,color:C.text,width:38,height:38,borderRadius:"50%",cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center"}}
              onClick={()=>setIdx(i=>(i+1)%shots.length)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORM DEFAULT
══════════════════════════════════════════════════════════ */
const makeForm=()=>({date:new Date().toISOString().slice(0,10),symbol:"MNQ",direction:"long",entryPrice:"",exitPrice:"",contracts:1,pointValue:SYMBOL_META["MNQ"].pointValue,commission:SYMBOL_META["MNQ"].commission,stopLoss:"",takeProfit:"",mindset:7,emotion:"冷靜",tags:[],note:"",screenshots:[],status:"closed"});

/* ══════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [records,   setRecords]   = useState(SEED);
  const [view,      setView]      = useState("dash");
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState(makeForm());
  const [editId,    setEditId]    = useState(null);
  const [toast,     setToast]     = useState("");
  const [fDir,      setFDir]      = useState("all");
  const [fSym,      setFSym]      = useState("all");
  const [lightbox,  setLightbox]  = useState(null);
  const [capital,   setCapital]   = useState(DEF_CAP);
  const [showCap,   setShowCap]   = useState(false);
  const [showExp,   setShowExp]   = useState(false);
  const [chartTab,  setChartTab]  = useState("equity");

  /* stats */
  const closed=records.filter(r=>r.status==="closed");
  const wins=closed.filter(r=>(nPnl(r)??0)>0);
  const losses=closed.filter(r=>(nPnl(r)??0)<=0);
  const totalNet=closed.reduce((s,r)=>s+(nPnl(r)??0),0);
  const totalGross=closed.reduce((s,r)=>s+(gPnl(r)??0),0);
  const totalFees=closed.reduce((s,r)=>s+fee(r),0);
  const winRate=closed.length?((wins.length/closed.length)*100).toFixed(0):0;
  const avgMindset=records.length?(records.reduce((s,r)=>s+r.mindset,0)/records.length).toFixed(1):0;
  const avgWin=wins.length?wins.reduce((s,r)=>s+(nPnl(r)??0),0)/wins.length:0;
  const avgLoss=losses.length?losses.reduce((s,r)=>s+(nPnl(r)??0),0)/losses.length:0;
  const rr=avgLoss!==0?Math.abs(avgWin/avgLoss).toFixed(2):"—";
  const ic=capital.initialCapital;
  const currentCap=ic+totalNet;
  const totalRoi=ic?(totalNet/ic)*100:null;
  const maxLoss=losses.length?Math.min(...losses.map(r=>nPnl(r)??0)):0;
  const maxRisk=ic?(Math.abs(maxLoss)/ic)*100:null;

  const filtered=useMemo(()=>records.filter(r=>fDir==="all"||r.direction===fDir).filter(r=>fSym==="all"||r.symbol===fSym).sort((a,b)=>new Date(b.date)-new Date(a.date)),[records,fDir,fSym]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),2200);};
  const applySymbol=(sym,f)=>{const m=SYMBOL_META[sym]||{};return{...f,symbol:sym,pointValue:m.pointValue??f.pointValue,commission:m.commission??f.commission};};

  function submit(){
    if(!form.entryPrice){showToast("請填入進場價格");return;}
    const p={...form,entryPrice:+form.entryPrice,exitPrice:form.exitPrice?+form.exitPrice:null,contracts:+form.contracts,pointValue:+form.pointValue,commission:+form.commission,stopLoss:form.stopLoss?+form.stopLoss:null,takeProfit:form.takeProfit?+form.takeProfit:null};
    if(editId){setRecords(x=>x.map(r=>r.id===editId?{...p,id:editId}:r));setSelected(prev=>prev?.id===editId?{...p,id:editId}:prev);showToast("✅ 已更新");}
    else{setRecords(x=>[{...p,id:Date.now()},...x]);showToast("✅ 新增成功");}
    setForm(makeForm());setEditId(null);setView("journal");
  }
  function openEdit(r){setForm({...r,entryPrice:String(r.entryPrice),exitPrice:r.exitPrice!=null?String(r.exitPrice):"",stopLoss:r.stopLoss!=null?String(r.stopLoss):"",takeProfit:r.takeProfit!=null?String(r.takeProfit):"",contracts:String(r.contracts),pointValue:String(r.pointValue),commission:String(r.commission),screenshots:r.screenshots||[]});setEditId(r.id);setView("add");}
  const del=id=>{setRecords(x=>x.filter(r=>r.id!==id));setView("journal");showToast("🗑 已刪除");};
  const togTag=t=>setForm(f=>({...f,tags:f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t]}));

  const selNet=selected?nPnl(selected):null;
  const selGross=selected?gPnl(selected):null;
  const selFee=selected?fee(selected):0;
  const selMeta=selected?(SYMBOL_META[selected.symbol]||{}):{};
  const selRoi=selNet!=null&&ic?selNet/ic*100:null;
  const prevGross=form.entryPrice&&form.exitPrice?(form.direction==="long"?1:-1)*(+form.exitPrice-+form.entryPrice)*+form.contracts*+form.pointValue:null;
  const prevFee=prevGross!=null?+form.commission*+form.contracts:null;
  const prevNet=prevGross!=null?prevGross-prevFee:null;
  const prevRoi=prevNet!=null&&ic?prevNet/ic*100:null;

  /* ── RENDER ─────────────────────────────────────────────── */
  return (
    <div style={{maxWidth:460,margin:"0 auto",minHeight:"100vh",background:C.bg0,color:C.text,fontFamily:"'Noto Sans TC',sans-serif",paddingBottom:"calc(100px + env(safe-area-inset-bottom, 0px))"}}>
      <style>{globalCss}</style>
      {toast&&<div style={{position:"fixed",top:"calc(58px + env(safe-area-inset-top, 0px))",left:"50%",transform:"translateX(-50%)",background:C.bg2,color:C.text,padding:"9px 20px",borderRadius:20,fontSize:12,zIndex:999,border:`1px solid ${C.border}`,boxShadow:`0 4px 24px rgba(0,0,0,.6)`,whiteSpace:"nowrap",fontFamily:"monospace",letterSpacing:.5}}>{toast}</div>}
      {lightbox&&<Lightbox shots={lightbox.shots} startIndex={lightbox.idx} onClose={()=>setLightbox(null)}/>}
      {showCap&&<CapitalModal capital={capital} onSave={setCapital} onClose={()=>setShowCap(false)}/>}
      {showExp&&<ExportModal records={records} capital={capital} onClose={()=>setShowExp(false)}/>}

      {/* ── HEADER ── */}
      <header style={{background:C.bg0,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:20,padding:"0 16px",paddingTop:"env(safe-area-inset-top, 0px)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>

          {/* ── EDGR LOGO MARK ── */}
          <svg width="96" height="32" viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
            {/* vertical spine */}
            <line x1="4" y1="4" x2="4" y2="28" stroke={C.gold} strokeWidth="1.8"/>
            {/* three horizontal bars — E letterform */}
            <line x1="4" y1="4"  x2="16" y2="4"  stroke={C.gold} strokeWidth="1.8"/>
            <line x1="4" y1="16" x2="13" y2="16" stroke={C.gold} strokeWidth="1.8"/>
            <line x1="4" y1="28" x2="16" y2="28" stroke={C.gold} strokeWidth="1.8"/>
            {/* breakout trend line from mid-bar */}
            <polyline points="13,16 18,10 23,13 28,5"
              stroke="#e2c270" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
            {/* arrowhead */}
            <polyline points="24,3 28,5 26,9"
              stroke="#e2c270" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
            {/* live dot */}
            <circle cx="28" cy="5" r="2.2" fill="#e2c270"/>
            {/* pulse ring */}
            <circle cx="28" cy="5" r="4.5" stroke="#e2c270" strokeWidth="0.8" className="logo-pulse"/>
            {/* wordmark */}
            <text x="36" y="20"
              fontFamily="'IBM Plex Mono',monospace"
              fontSize="16" fontWeight="700"
              letterSpacing="3"
              fill={C.text}>EDGR</text>
          </svg>

          <div style={{display:"flex",gap:6}}>
            <button style={hdrBtn} onClick={()=>setShowExp(true)}>↑ 匯出</button>
            <button style={hdrBtn} onClick={()=>setShowCap(true)}>⚙ 倉位</button>
          </div>
        </div>

        {/* tab bar */}
        <div style={{display:"flex",borderTop:`1px solid ${C.border}`}}>
          {[["dash","儀表板"],["journal","日誌"]].map(([v,lb])=>(
            <button key={v} style={{flex:1,padding:"10px 0",background:"none",border:"none",color:view===v?C.gold:C.textDim,fontSize:12,cursor:"pointer",borderBottom:`2px solid ${view===v?C.gold:"transparent"}`,transition:"all .2s",fontFamily:"monospace",letterSpacing:1}}
              onClick={()=>setView(v)}>{lb}</button>
          ))}
        </div>
      </header>

      <div style={{padding:"18px 16px 0"}}>

        {/* ════ DASHBOARD ════ */}
        {view==="dash"&&(
          <div className="fi">
            {/* hero capital card */}
            <div style={{background:`linear-gradient(145deg,${C.bg1} 0%,#0c1520 100%)`,border:`1px solid ${C.border}`,borderRadius:18,padding:"20px 18px 16px",marginBottom:14,position:"relative",overflow:"hidden"}}>
              {/* decorative grid lines */}
              <div style={{position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(212,168,71,.03) 30px,rgba(212,168,71,.03) 31px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(212,168,71,.03) 40px,rgba(212,168,71,.03) 41px)`,pointerEvents:"none"}}/>
              <div style={{position:"relative"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <p style={{fontSize:10,letterSpacing:3,color:C.textDim,marginBottom:6,fontFamily:"monospace"}}>{capital.label.toUpperCase()}</p>
                    <p style={{fontSize:11,color:C.textDim,fontFamily:"monospace"}}>
                      初始 <span style={{color:C.textMid}}>{ic.toLocaleString("zh-TW")}</span> {capital.currency}
                    </p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontSize:10,letterSpacing:2,color:C.textDim,marginBottom:4,fontFamily:"monospace"}}>目前資金</p>
                    <p style={{fontSize:20,fontWeight:800,color:currentCap>=ic?C.green:C.red,fontFamily:"monospace"}}>
                      {Math.round(currentCap).toLocaleString("zh-TW")}
                    </p>
                  </div>
                </div>
                {/* progress bar */}
                <div style={{height:4,background:C.bg3,borderRadius:99,marginBottom:12,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:99,width:`${Math.min(Math.max((currentCap/ic)*100,0),150)}%`,maxWidth:"100%",background:currentCap>=ic?`linear-gradient(90deg,${C.green},#4ade80)`:`linear-gradient(90deg,${C.red},#f87171)`,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:10,color:C.textDim,letterSpacing:1,fontFamily:"monospace"}}>淨損益</p>
                    <p style={{fontSize:16,fontWeight:700,color:totalNet>=0?C.green:C.red,fontFamily:"monospace"}}>{fAmt(Math.round(totalNet))}</p>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:10,color:C.textDim,letterSpacing:1,fontFamily:"monospace"}}>ROI</p>
                    <p style={{fontSize:16,fontWeight:700,color:totalRoi==null?C.textDim:totalRoi>=0?C.green:C.red,fontFamily:"monospace"}}>{fPct(totalRoi)}</p>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:10,color:C.textDim,letterSpacing:1,fontFamily:"monospace"}}>手續費</p>
                    <p style={{fontSize:16,fontWeight:700,color:C.amber,fontFamily:"monospace"}}>-{Math.round(totalFees).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* stats 2x2 */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              {[
                {lb:"勝率",val:`${winRate}%`,c:+winRate>=50?C.green:C.red},
                {lb:"盈虧比",val:rr,c:C.amber},
                {lb:"最大單筆風險",val:fPct(maxRisk),c:maxRisk==null?C.textDim:maxRisk>5?C.red:maxRisk>2?C.amber:C.green},
                {lb:"平均心態",val:avgMindset,c:+avgMindset>=7?C.green:+avgMindset>=5?C.amber:C.red},
              ].map(({lb,val,c})=>(
                <div key={lb} style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 14px 12px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",bottom:-8,right:-4,fontSize:32,opacity:.04,fontFamily:"monospace"}}>#</div>
                  <p style={{fontSize:20,fontWeight:800,color:c,fontFamily:"monospace",lineHeight:1,marginBottom:4}}>{val}</p>
                  <p style={{fontSize:10,color:C.textDim,letterSpacing:1,fontFamily:"monospace"}}>{lb}</p>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[
                {lb:"總ROI",val:fPct(totalRoi),c:totalRoi==null?C.textDim:totalRoi>=0?C.green:C.red},
                {lb:"已結單",val:closed.length,c:C.textMid},
                {lb:"持倉中",val:records.filter(r=>r.status==="open").length,c:C.amber},
              ].map(({lb,val,c})=>(
                <div key={lb} style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 10px"}}>
                  <p style={{fontSize:17,fontWeight:700,color:c,fontFamily:"monospace",lineHeight:1,marginBottom:4}}>{val}</p>
                  <p style={{fontSize:10,color:C.textDim,letterSpacing:1,fontFamily:"monospace"}}>{lb}</p>
                </div>
              ))}
            </div>

            {/* chart card with tabs */}
            <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{display:"flex",gap:6}}>
                  {[["equity","EQUITY"],["roi","ROI %"]].map(([t,lb])=>(
                    <button key={t} style={{padding:"4px 10px",background:chartTab===t?C.bg3:"none",border:`1px solid ${chartTab===t?C.gold:C.border}`,color:chartTab===t?C.gold:C.textDim,borderRadius:5,cursor:"pointer",fontSize:10,fontFamily:"monospace",letterSpacing:1,transition:"all .2s"}} onClick={()=>setChartTab(t)}>{lb}</button>
                  ))}
                </div>
                <span style={{fontSize:10,color:C.dim,fontFamily:"monospace"}}>NET P&L</span>
              </div>
              {chartTab==="equity"?<EquityArea records={records}/>:<RoiArea records={records} capital={capital}/>}
            </div>

            {/* donut + daily */}
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,marginBottom:14}}>
              <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:104}}>
                <WinDonut wins={wins.length} losses={losses.length}/>
                <p style={{fontSize:10,color:C.textDim,marginTop:6,fontFamily:"monospace",letterSpacing:1}}>W / L</p>
                <p style={{fontSize:12,marginTop:2,fontFamily:"monospace"}}>
                  <span style={{color:C.green}}>{wins.length}</span>
                  <span style={{color:C.dim}}> / </span>
                  <span style={{color:C.red}}>{losses.length}</span>
                </p>
              </div>
              <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 10px"}}>
                <p style={{fontSize:10,color:C.textDim,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>DAILY P&L</p>
                <DailyBars records={records}/>
              </div>
            </div>

            {/* daily quote */}
            {(()=>{const q=getDailyQuote();return(
              <div style={{position:"relative",background:C.bg0,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 18px 14px",marginBottom:16,overflow:"hidden"}}>
                {/* left gold bar */}
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg,${C.gold},${C.goldDim})`,borderRadius:"14px 0 0 14px"}}/>
                {/* faint quote mark */}
                <div style={{position:"absolute",right:12,top:4,fontSize:64,color:C.gold,opacity:.05,lineHeight:1,fontFamily:"Georgia,serif",pointerEvents:"none"}}>"</div>
                <p style={{fontSize:10,letterSpacing:3,color:C.goldDim,marginBottom:10,fontFamily:"monospace",paddingLeft:10}}>TODAY'S MINDSET</p>
                <p style={{fontSize:13,color:C.textMid,lineHeight:1.75,fontStyle:"italic",paddingLeft:10,paddingRight:24,marginBottom:10}}>
                  「{q.text}」
                </p>
                <p style={{fontSize:10,color:C.textDim,paddingLeft:10,fontFamily:"monospace",letterSpacing:1}}>— {q.author}</p>
              </div>
            );})()}

            {/* recent trades */}
            <p style={{fontSize:10,letterSpacing:3,color:C.textDim,marginBottom:10,fontFamily:"monospace"}}>RECENT TRADES</p>
            {records.slice(0,5).map(r=>{
              const p=nPnl(r); const m=SYMBOL_META[r.symbol]||{};
              const roi2=ic&&p!=null?p/ic*100:null;
              return (
                <div key={r.id} className="trow" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.bg1,borderRadius:12,marginBottom:6,border:`1px solid ${C.border}`,cursor:"pointer",transition:"all .2s"}}
                  onClick={()=>{setSelected(r);setView("detail");}}>
                  <div style={{width:32,height:32,borderRadius:8,background:r.direction==="long"?C.greenDim:C.redDim,border:`1px solid ${r.direction==="long"?C.green:C.red}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:12,color:r.direction==="long"?C.green:C.red,fontWeight:700}}>{r.direction==="long"?"▲":"▼"}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"monospace",letterSpacing:1}}>{r.symbol}</span>
                      <span style={{fontSize:10,color:C.textDim}}>{m.label}</span>
                      {r.status==="open"&&<Chip label="持倉中" color="amber"/>}
                      {(r.screenshots||[]).length>0&&<Chip label={`📷${r.screenshots.length}`}/>}
                    </div>
                    <p style={{fontSize:10,color:C.textDim,marginTop:2,fontFamily:"monospace"}}>{r.date} · {r.contracts}口</p>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:p==null?C.textDim:p>=0?C.green:C.red,fontFamily:"monospace"}}>{p==null?"—":fAmt(Math.round(p))}</p>
                    {roi2!=null&&<p style={{fontSize:10,color:roi2>=0?C.green:C.red,fontFamily:"monospace",marginTop:1}}>{fPct(roi2)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ JOURNAL ════ */}
        {view==="journal"&&(
          <div className="fi">
            <p style={{fontSize:10,letterSpacing:3,color:C.textDim,marginBottom:14,fontFamily:"monospace"}}>TRADE JOURNAL</p>
            {/* filters */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8}}>
              <div style={{display:"flex",gap:5}}>
                {["all","long","short"].map(d=>(
                  <Pill key={d} active={fDir===d} onClick={()=>setFDir(d)}>{d==="all"?"ALL":d==="long"?"LONG":"SHORT"}</Pill>
                ))}
              </div>
              <select style={{...inputSt,width:"auto",padding:"5px 10px",fontSize:11}} value={fSym} onChange={e=>setFSym(e.target.value)}>
                <option value="all">全部標的</option>
                {Object.entries(SYM_GROUPS).map(([gk,gl])=>(
                  <optgroup key={gk} label={gl}>
                    {SYMS.filter(sym=>SYMBOL_META[sym].group===gk).map(sym=>(
                      <option key={sym} value={sym}>{sym}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {filtered.length===0&&<p style={{textAlign:"center",color:C.dim,padding:"40px 0",fontSize:13,fontFamily:"monospace"}}>NO RECORDS</p>}
            {filtered.map(r=>{
              const p=nPnl(r); const m=SYMBOL_META[r.symbol]||{}; const shots=r.screenshots||[];
              const roi2=ic&&p!=null?p/ic*100:null;
              return (
                <div key={r.id} className="trow" style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px",marginBottom:10,cursor:"pointer",transition:"all .2s"}}
                  onClick={()=>{setSelected(r);setView("detail");}}>
                  {/* top row */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <div style={{padding:"3px 8px",borderRadius:5,background:r.direction==="long"?C.greenDim:C.redDim,border:`1px solid ${r.direction==="long"?C.green:C.red}33`,fontSize:10,fontWeight:700,color:r.direction==="long"?C.green:C.red,fontFamily:"monospace",letterSpacing:1}}>
                        {r.direction==="long"?"LONG":"SHORT"}
                      </div>
                      <span style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:"monospace",letterSpacing:1}}>{r.symbol}</span>
                      <span style={{fontSize:10,color:C.textDim}}>{m.label}</span>
                      {r.status==="open"&&<Chip label="持倉中" color="amber"/>}
                      {shots.length>0&&<Chip label={`📷${shots.length}`}/>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontSize:14,fontWeight:700,color:p==null?C.textDim:p>=0?C.green:C.red,fontFamily:"monospace"}}>{p==null?"—":fAmt(Math.round(p))}</p>
                      {roi2!=null&&<p style={{fontSize:10,color:roi2>=0?C.green:C.red,fontFamily:"monospace"}}>{fPct(roi2)}</p>}
                    </div>
                  </div>
                  {/* thumb strip */}
                  {shots.length>0&&(
                    <div style={{display:"flex",gap:5,marginBottom:10}} onClick={e=>e.stopPropagation()}>
                      {shots.slice(0,3).map((sh,i)=>(
                        <img key={sh.id} src={sh.dataUrl} style={{width:58,height:42,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`,cursor:"zoom-in"}}
                          onClick={e=>{e.stopPropagation();setLightbox({shots,idx:i});}}/>
                      ))}
                      {shots.length>3&&<div style={{width:58,height:42,borderRadius:6,background:C.bg0,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.textDim,fontFamily:"monospace"}}>+{shots.length-3}</div>}
                    </div>
                  )}
                  {/* price row */}
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:C.textDim,fontFamily:"monospace"}}>進 <b style={{color:C.text}}>{r.entryPrice}</b></span>
                    <span style={{color:C.dim,fontSize:10}}>→</span>
                    <span style={{fontSize:11,color:C.textDim,fontFamily:"monospace"}}>出 <b style={{color:r.exitPrice?C.text:C.dim}}>{r.exitPrice??"—"}</b></span>
                    <span style={{flex:1}}/>
                    <span style={{fontSize:10,color:C.amber,fontFamily:"monospace"}}>費 -{fee(r).toLocaleString()}</span>
                    <span style={{fontSize:10,background:C.bg3,color:C.textMid,padding:"2px 7px",borderRadius:4}}>{r.emotion}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <p style={{fontSize:10,color:C.textDim,fontFamily:"monospace"}}>{r.date} · {r.contracts}口</p>
                    <div style={{width:100}}><MindBar value={r.mindset}/></div>
                  </div>
                  {r.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>{r.tags.map(t=><Chip key={t} label={t}/>)}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ ADD / EDIT ════ */}
        {view==="add"&&(
          <div className="fi">
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
              <button style={{background:"none",border:`1px solid ${C.border}`,color:C.textMid,padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"monospace"}}
                onClick={()=>{setForm(makeForm());setEditId(null);setView("journal");}}>←</button>
              <p style={{fontSize:12,fontWeight:700,color:C.text,letterSpacing:3,fontFamily:"monospace",textTransform:"uppercase"}}>{editId?"EDIT TRADE":"NEW TRADE"}</p>
            </div>

            {/* long/short seg */}
            <div style={{display:"flex",background:C.bg1,borderRadius:10,padding:4,marginBottom:18,border:`1px solid ${C.border}`}}>
              {["long","short"].map(d=>(
                <button key={d} style={{flex:1,padding:"10px 0",background:form.direction===d?(d==="long"?C.greenDim:C.redDim):"none",border:"none",color:form.direction===d?(d==="long"?C.green:C.red):C.textDim,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .2s",fontFamily:"monospace",letterSpacing:1}}
                  onClick={()=>setForm(f=>({...f,direction:d}))}>
                  {d==="long"?"▲  LONG":"▼  SHORT"}
                </button>
              ))}
            </div>

            {/* symbol */}
            <div style={{marginBottom:14}}>
              <Label>標的</Label>
              <select style={{...inputSt,marginTop:6}} value={form.symbol} onChange={e=>setForm(f=>applySymbol(e.target.value,f))}>
                {Object.entries(SYM_GROUPS).map(([gk,gl])=>(
                  <optgroup key={gk} label={gl}>
                    {SYMS.filter(sym=>SYMBOL_META[sym].group===gk).map(sym=>(
                      <option key={sym} value={sym}>{sym} — {SYMBOL_META[sym].label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {SYMBOL_META[form.symbol]&&(
                <p style={{fontSize:10,color:C.textDim,marginTop:5,fontFamily:"monospace"}}>
                  每點 <b style={{color:C.blue}}>{SYMBOL_META[form.symbol].pointValue}</b>　
                  手續費 <b style={{color:C.amber}}>{SYMBOL_META[form.symbol].commission}</b>/口　
                  {SYMBOL_META[form.symbol].currency}
                </p>
              )}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div><Label>日期</Label><Input style={{marginTop:6}} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
              <div><Label>口數</Label><Input style={{marginTop:6}} type="number" min="1" value={form.contracts} onChange={e=>setForm(f=>({...f,contracts:e.target.value}))}/></div>
              <div><Label>進場價格 <span style={{color:C.red}}>*</span></Label><Input style={{marginTop:6}} type="number" placeholder="e.g. 19800" value={form.entryPrice} onChange={e=>setForm(f=>({...f,entryPrice:e.target.value}))}/></div>
              <div><Label>出場價格</Label><Input style={{marginTop:6}} type="number" placeholder="未出場留空" value={form.exitPrice} onChange={e=>setForm(f=>({...f,exitPrice:e.target.value}))}/></div>
              <div><Label>停損點</Label><Input style={{marginTop:6}} type="number" value={form.stopLoss} onChange={e=>setForm(f=>({...f,stopLoss:e.target.value}))}/></div>
              <div><Label>停利點</Label><Input style={{marginTop:6}} type="number" value={form.takeProfit} onChange={e=>setForm(f=>({...f,takeProfit:e.target.value}))}/></div>
              <div><Label>每點金額</Label><Input style={{marginTop:6}} type="number" value={form.pointValue} onChange={e=>setForm(f=>({...f,pointValue:e.target.value}))}/></div>
              <div><Label>手續費/口</Label><Input style={{marginTop:6}} type="number" value={form.commission} onChange={e=>setForm(f=>({...f,commission:e.target.value}))}/></div>
            </div>

            {/* preview pnl */}
            {prevNet!=null&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,background:C.bg0,border:`1px solid ${C.borderGlow}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                {[["毛損益",fAmt(Math.round(prevGross)),prevGross>=0?C.green:C.red],["手續費",`-${prevFee.toLocaleString()}`,C.amber],["淨損益",fAmt(Math.round(prevNet)),prevNet>=0?C.green:C.red],["ROI",prevRoi!=null?fPct(prevRoi):"—",prevRoi==null?C.textDim:prevRoi>=0?C.green:C.red]].map(([lb,val,c])=>(
                  <div key={lb} style={{textAlign:"center"}}>
                    <p style={{fontSize:9,color:C.textDim,letterSpacing:1,fontFamily:"monospace",marginBottom:3}}>{lb}</p>
                    <p style={{fontSize:12,fontWeight:700,color:c,fontFamily:"monospace"}}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* status */}
            <div style={{marginBottom:14}}>
              <Label>交易狀態</Label>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                {["closed","open"].map(st=>(
                  <Pill key={st} active={form.status===st} onClick={()=>setForm(f=>({...f,status:st}))}>{st==="closed"?"已結單":"持倉中"}</Pill>
                ))}
              </div>
            </div>

            {/* mindset */}
            <div style={{marginBottom:14}}>
              <Label>心態評分 <span style={{color:+form.mindset>=7?C.green:+form.mindset>=5?C.amber:C.red,fontWeight:700,fontSize:11}}>{form.mindset}/10</span></Label>
              <input type="range" min="1" max="10" value={form.mindset} onChange={e=>setForm(f=>({...f,mindset:+e.target.value}))} style={{width:"100%",marginTop:10,accentColor:C.gold}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.dim,marginTop:2,fontFamily:"monospace"}}>
                <span>PANIC</span><span>ZEN</span>
              </div>
            </div>

            {/* emotion */}
            <div style={{marginBottom:14}}>
              <Label>當下情緒</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                {EMOTIONS.map(e=>(<Pill key={e} active={form.emotion===e} onClick={()=>setForm(f=>({...f,emotion:e}))}>{e}</Pill>))}
              </div>
            </div>

            {/* tags */}
            <div style={{marginBottom:14}}>
              <Label>標籤</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                {TAGS_PRE.map(t=>(<Pill key={t} active={form.tags.includes(t)} onClick={()=>togTag(t)}>{t}</Pill>))}
              </div>
            </div>

            {/* note */}
            <div style={{marginBottom:16}}>
              <Label>交易筆記</Label>
              <textarea placeholder="進場理由、盤中心態、事後檢討…" style={{...inputSt,minHeight:82,resize:"vertical",lineHeight:1.65,marginTop:6}}
                value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
            </div>

            <ScreenshotUploader screenshots={form.screenshots||[]} onChange={shots=>setForm(f=>({...f,screenshots:shots}))}/>

            <BtnPrimary onClick={submit}>{editId?"SAVE CHANGES":"ADD TRADE"}</BtnPrimary>
            <BtnGhost onClick={()=>{setForm(makeForm());setEditId(null);setView("journal");}}>取消</BtnGhost>
          </div>
        )}

        {/* ════ DETAIL ════ */}
        {view==="detail"&&selected&&(
          <div className="fi">
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <button style={{background:"none",border:`1px solid ${C.border}`,color:C.textMid,padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"monospace"}}
                onClick={()=>setView("journal")}>←</button>
              <p style={{fontSize:12,fontWeight:700,color:C.text,letterSpacing:3,fontFamily:"monospace",flex:1}}>DETAIL</p>
              <button style={{background:"rgba(56,189,248,.08)",border:`1px solid rgba(56,189,248,.25)`,color:C.blue,padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"monospace"}} onClick={()=>openEdit(selected)}>EDIT</button>
              <button style={{background:"rgba(244,63,94,.08)",border:`1px solid rgba(244,63,94,.25)`,color:C.red,padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"monospace"}} onClick={()=>del(selected.id)}>DEL</button>
            </div>

            {/* hero */}
            <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 18px",marginBottom:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,right:0,width:80,height:80,borderRadius:"0 16px 0 80px",background:selected.direction==="long"?C.greenDim:C.redDim,opacity:.6}}/>
              <div style={{position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,fontWeight:700,color:selected.direction==="long"?C.green:C.red,fontFamily:"monospace",letterSpacing:2,background:selected.direction==="long"?C.greenDim:C.redDim,padding:"4px 10px",borderRadius:5}}>
                    {selected.direction==="long"?"▲ LONG":"▼ SHORT"}
                  </span>
                  <span style={{fontSize:22,fontWeight:900,letterSpacing:2,fontFamily:"monospace"}}>{selected.symbol}</span>
                  <span style={{fontSize:12,color:C.textDim}}>{selMeta.label}</span>
                  {selected.status==="open"&&<Chip label="持倉中" color="amber"/>}
                </div>
                <p style={{fontSize:36,fontWeight:900,color:selNet==null?C.textDim:selNet>=0?C.green:C.red,fontFamily:"monospace",lineHeight:1,marginBottom:8}}>
                  {selNet==null?"持倉中":fAmt(Math.round(selNet))}
                </p>
                {selNet!=null&&(
                  <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:8}}>
                    <span style={{fontSize:11,color:C.textDim,fontFamily:"monospace"}}>毛損益 <b style={{color:selGross>=0?C.textMid:C.red}}>{fAmt(Math.round(selGross))}</b></span>
                    <span style={{fontSize:11,color:C.amber,fontFamily:"monospace"}}>費 -{selFee.toLocaleString()}</span>
                    {selRoi!=null&&<span style={{fontSize:12,fontWeight:700,color:selRoi>=0?C.green:C.red,fontFamily:"monospace"}}>ROI {fPct(selRoi)}</span>}
                  </div>
                )}
                <p style={{fontSize:11,color:C.textDim,fontFamily:"monospace"}}>{selected.date} · {selected.contracts}口 · ×{selected.pointValue} {selMeta.currency}</p>
              </div>
            </div>

            {/* price grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:12}}>
              {[["進場",selected.entryPrice,C.amber],["出場",selected.exitPrice??"—",selected.exitPrice?(selNet>=0?C.green:C.red):C.dim],["停損",selected.stopLoss??"—",C.red],["停利",selected.takeProfit??"—",C.green]].map(([lb,val,c])=>(
                <div key={lb} style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                  <p style={{fontSize:10,color:C.textDim,marginBottom:4,fontFamily:"monospace",letterSpacing:1}}>{lb}</p>
                  <p style={{color:c,fontWeight:700,fontSize:13,fontFamily:"monospace"}}>{val}</p>
                </div>
              ))}
            </div>

            {/* mindset card */}
            <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <Label>心態評分</Label>
                <span style={{color:selected.mindset>=7?C.green:selected.mindset>=5?C.amber:C.red,fontWeight:800,fontSize:22,fontFamily:"monospace"}}>{selected.mindset}<span style={{fontSize:12,color:C.textDim}}>/10</span></span>
              </div>
              <MindBar value={selected.mindset}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
                <Label>情緒狀態</Label>
                <span style={{fontSize:12,background:C.bg3,color:C.textMid,padding:"3px 10px",borderRadius:6,fontFamily:"monospace"}}>{selected.emotion}</span>
              </div>
            </div>

            {selected.tags.length>0&&(
              <div style={{marginBottom:10}}>
                <Label>標籤</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>{selected.tags.map(t=><Chip key={t} label={t}/>)}</div>
              </div>
            )}

            {selected.note&&(
              <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                <Label>交易筆記</Label>
                <p style={{color:C.textMid,fontSize:13,lineHeight:1.75,marginTop:8}}>{selected.note}</p>
              </div>
            )}

            {(selected.screenshots||[]).length>0&&(
              <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <Label>交易截圖</Label>
                  <span style={{fontSize:10,color:C.textDim,fontFamily:"monospace"}}>{selected.screenshots.length} 張</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {selected.screenshots.map((sh,i)=>(
                    <div key={sh.id} className="shotw" style={{position:"relative",borderRadius:10,overflow:"hidden",cursor:"zoom-in",aspectRatio:"16/9"}}
                      onClick={()=>setLightbox({shots:selected.screenshots,idx:i})}>
                      <img src={sh.dataUrl} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                      <div className="shoto" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"all .2s"}}>
                        <span style={{fontSize:20}}>🔍</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      {view!=="add"&&(
        <button className="fab" style={{position:"fixed",bottom:"calc(24px + env(safe-area-inset-bottom, 0px))",left:"50%",transform:"translateX(-50%)",width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},#b8860b)`,color:C.bg0,fontSize:26,border:"none",cursor:"pointer",boxShadow:`0 4px 28px rgba(212,168,71,.45)`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,fontWeight:700,lineHeight:1}}
          onClick={()=>{setForm(makeForm());setEditId(null);setView("add");}}>+</button>
      )}
    </div>
  );
}

const hdrBtn = {fontSize:11,background:"none",border:`1px solid ${C.border}`,color:C.textDim,padding:"5px 11px",borderRadius:6,cursor:"pointer",fontFamily:"monospace",letterSpacing:.5,transition:"all .2s"};

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&family=Noto+Sans+TC:wght@400;500;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#06080f; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
  input[type=date]::-webkit-calendar-picker-indicator { filter:invert(.35); }
  input[type=range] { height:3px; }
  select option, select optgroup { background:#111827; color:#e2e8f0; }
  textarea { font-family:'Noto Sans TC',sans-serif; }
  .fi { animation: fadeIn .22s ease; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
  .trow:hover { border-color:#2a4060 !important; background:#0e1624 !important; }
  .fab:hover { transform:translateX(-50%) scale(1.08) !important; }
  .shotw:hover .shoto { opacity:1 !important; background:rgba(0,0,0,.45) !important; }
  div[style*="dashed"]:hover { border-color:#d4a847 !important; }
  @keyframes logoPulse { 0%,100%{opacity:.22} 50%{opacity:.5} }
  .logo-pulse { animation: logoPulse 2.6s ease-in-out infinite; }

  /* ── iPhone Safe Area (避開瀏海、狀態列、Home Bar) ── */
  .safe-top    { padding-top: env(safe-area-inset-top, 0px); }
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
  #root { 
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
`;
