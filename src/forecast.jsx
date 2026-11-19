import React,{useMemo,useState}from'react';

// Fundamentals are NOT fetched automatically (Twelve Data Basic has no statements endpoint).
// ARBE values below come from public sources and must be re-checked against the latest 20-F / 6-K.
const PRESETS={
  ARBE:{
    note:'ARBE inputs: ~$42M cash and deposits and burn targeted below $7M/quarter (Q2 2026 results, Aug 6 2026); ~$9M/quarter observed earlier in 2026; ~122.6M shares (Aug 2026, companiesmarketcap.com). Verify against the latest filing before relying on them.',
    dilution:{enabled:true,sharesM:122.6,cashM:42,quarterlyBurnM:8,burnChangePctYr:-10,triggerMonths:6,targetMonths:18,discountPct:15,cashCredit:.5,failProb:.08}
  }
};
const GENERIC_DILUTION={enabled:false,sharesM:100,cashM:40,quarterlyBurnM:8,burnChangePctYr:-10,triggerMonths:6,targetMonths:18,discountPct:15,cashCredit:.5,failProb:.08};

async function api(url,opts){
  const r=await fetch(url,opts),text=await r.text();let d={};
  try{d=text?JSON.parse(text):{};}catch{throw new Error(/^\s*</.test(text)?`Server returned HTML (HTTP ${r.status}). Check the Railway deployment.`:`Invalid server response (HTTP ${r.status})`);}
  if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d;
}
const usd=v=>v==null||!Number.isFinite(v)?'—':v>=100?`$${v.toFixed(0)}`:v>=1?`$${v.toFixed(2)}`:`$${v.toFixed(3)}`;
const pc=v=>v==null?'—':`${(v*100).toFixed(v<.1&&v>0?1:0)}%`;

function Num({label,value,onChange,step='any',suffix,help}){
  return <label className="fcField"><span>{label}{suffix?<em> {suffix}</em>:null}</span>
    <input type="number" step={step} value={value} onChange={e=>onChange(e.target.value===''?'':Number(e.target.value))}/>
    {help&&<small>{help}</small>}</label>;
}

function FanChart({res}){
  const W=900,H=380,L=56,R=16,T=14,B=34;
  const hist=(res.history.weekly||[]).slice(-104);
  const months=res.months,bands=res.bands;
  const xMin=hist.length?-(hist.length-1)*12/52:0,xMax=months.at(-1);
  const yMax=Math.max(res.params.s0*1.6,Math.min(Math.max(...bands.map(b=>b.p95)),res.params.s0*4))*1.05;
  const x=m=>L+((m-xMin)/(xMax-xMin))*(W-L-R),y=v=>T+(1-Math.min(v,yMax)/yMax)*(H-T-B);
  const m0=[0,...months],mk=k=>[res.params.s0,...bands.map(b=>b[k])];
  const area=(hiK,loK)=>{const hi=mk(hiK),lo=mk(loK);return m0.map((m,i)=>`${i?'L':'M'}${x(m)},${y(hi[i])}`).join('')+m0.map((m,i)=>`L${x(m0[m0.length-1-i])},${y(lo[m0.length-1-i])}`).join('')+'Z';};
  const line=k=>mk(k).map((v,i)=>`${i?'L':'M'}${x(m0[i])},${y(v)}`).join('');
  const histPath=hist.map((p,i)=>`${i?'L':'M'}${x(-(hist.length-1-i)*12/52)},${y(p.close)}`).join('');
  const rawStep=yMax/4,mag=Math.pow(10,Math.floor(Math.log10(rawStep))),stepN=[1,2,2.5,5,10].find(k=>k*mag>=rawStep)*mag;
  const ticks=[];for(let t=0;t<=yMax+1e-9;t+=stepN)ticks.push(+t.toFixed(6));
  const yearTicks=[];for(let m=0;m<=xMax;m+=12)yearTicks.push(m);
  return <svg className="fcChart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Forecast fan chart">
    {ticks.map(t=><g key={t}><line x1={L} x2={W-R} y1={y(t)} y2={y(t)} className="fcGrid"/><text x={L-6} y={y(t)+3} textAnchor="end" className="fcAxis">{usd(t)}</text></g>)}
    {yearTicks.map(m=><g key={m}><line x1={x(m)} x2={x(m)} y1={T} y2={H-B} className="fcGrid"/><text x={x(m)} y={H-B+16} textAnchor="middle" className="fcAxis">{m===0?'now':`+${m/12}y`}</text></g>)}
    {res.params.minBid<yMax&&<g><line x1={L} x2={W-R} y1={y(res.params.minBid)} y2={y(res.params.minBid)} className="fcMinBid"/><text x={W-R-4} y={y(res.params.minBid)-4} textAnchor="end" className="fcAxis">Nasdaq min bid {usd(res.params.minBid)}</text></g>}
    <path d={area('p95','p5')} className="fcBand95"/><path d={area('p75','p25')} className="fcBand75"/>
    <path d={histPath} className="fcHist"/><path d={line('p50')} className="fcMedian"/>
    <line x1={x(0)} x2={x(0)} y1={T} y2={H-B} className="fcNow"/>
  </svg>;
}

export function ForecastPage({lang='en'}){
  const gr=lang==='el';
  const[symbol,setSymbol]=useState('ARBE');
  const[p,setP]=useState({years:4.1,annualVol:'',annualDrift:0,nSims:4000,seed:42,minBid:1});
  const[d,setD]=useState(PRESETS.ARBE.dilution);
  const[res,setRes]=useState(null),[loading,setLoading]=useState(false),[err,setErr]=useState('');
  const sym=symbol.trim().toUpperCase(),preset=PRESETS[sym];
  const setPar=k=>v=>setP(x=>({...x,[k]:v})),setDil=k=>v=>setD(x=>({...x,[k]:v}));
  function changeSymbol(v){const s=v.toUpperCase();setSymbol(s);setD(PRESETS[s]?.dilution||GENERIC_DILUTION);setRes(null);}
  async function run(){
    setLoading(true);setErr('');
    try{
      const body={symbol:sym,years:p.years,annualVol:p.annualVol===''?undefined:p.annualVol,annualDrift:p.annualDrift/100,nSims:p.nSims,seed:p.seed,minBid:p.minBid,dilution:{...d,discountPct:d.discountPct,failProb:d.failProb}};
      setRes(await api('/api/forecast/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
    }catch(e){setErr(e.message);setRes(null);}finally{setLoading(false);}
  }
  const s=res?.summary;
  const tiles=useMemo(()=>s?[
    [gr?'Διάμεσος στο τέλος':'Median at horizon',usd(s.medianEnd),`${usd(s.p5End)} – ${usd(s.p95End)} (5–95%)`],
    ...s.thresholds.filter(t=>[.15,.5,1].includes(t.price)).map(t=>[`P(< ${usd(t.price)})`,pc(t.prob),gr?'στο τέλος του ορίζοντα':'at end of horizon']),
    [gr?'Πιθανότητα αφερεγγυότητας':'P(insolvent)',pc(s.probInsolvent),gr?'αποτυχία χρηματοδότησης':'a needed raise fails'],
    [gr?'Τουλάχιστον 1 αύξηση κεφαλαίου':'P(≥1 equity raise)',pc(s.probAtLeastOneRaise),`${s.avgRaisesPerPath} ${gr?'κατά μ.ό.':'avg per path'} · ${s.avgCapitalRaisedM}M`],
    [gr?'Μετοχές στο τέλος (διάμεσος)':'Shares at end (median)',s.medianEndSharesM!=null?`${s.medianEndSharesM}M`:'—',`${gr?'τώρα':'now'} ${s.startSharesM}M`],
    ['Nasdaq deficiency',pc(s.probNasdaqDeficiency),gr?`≥ ${res.params.deficiencyWeeks||26} εβδ. κάτω από το min bid`:`≥ ${res.params.deficiencyWeeks||26} weeks below min bid`]
  ]:[],[s,gr,res]);
  return <>
    <div className="pageTitle"><div><h1>{gr?'Μακροπρόθεσμο Forecast':'Long-horizon Forecast'}</h1>
      <p>{gr?'Κατανομή πιθανών τιμών (Monte Carlo) με μοντέλο χρηματοδότησης και dilution. Δεν είναι πρόβλεψη τιμής.':'A distribution of possible prices (Monte Carlo) with a financing and dilution layer. It is not a price prediction.'}</p></div></div>
    <section className="logicCard">
      <div className="fcRow">
        <label className="fcField"><span>Ticker</span><input value={symbol} onChange={e=>changeSymbol(e.target.value)} maxLength={10}/></label>
        <Num label={gr?'Ορίζοντας':'Horizon'} suffix={gr?'έτη':'years'} value={p.years} onChange={setPar('years')} step="0.1"/>
        <Num label={gr?'Μεταβλητότητα':'Annual volatility'} suffix="%" value={p.annualVol===''?'':Math.round(p.annualVol*100)} onChange={v=>setPar('annualVol')(v===''?'':v/100)} help={gr?'Κενό = εκτιμάται από το ιστορικό':'Blank = estimated from history'}/>
        <Num label={gr?'Drift (προσδοκώμενη απόδοση)':'Expected annual return'} suffix="%" value={p.annualDrift} onChange={setPar('annualDrift')} help={gr?'0 = καμία άποψη':'0 = no view'}/>
        <Num label="Min bid" suffix="$" value={p.minBid} onChange={setPar('minBid')} step="0.01"/>
        <Num label={gr?'Προσομοιώσεις':'Simulations'} value={p.nSims} onChange={setPar('nSims')} step="500"/>
        <Num label="Seed" value={p.seed} onChange={setPar('seed')} step="1"/>
      </div>
      <h3 className="fcH">{gr?'Χρηματοδότηση & dilution':'Financing & dilution'}
        <label className="fcToggle"><input type="checkbox" checked={d.enabled} onChange={e=>setDil('enabled')(e.target.checked)}/> {gr?'ενεργό':'enabled'}</label></h3>
      {preset?<div className="warning">{preset.note}</div>:<div className="warning">{gr?'Δεν υπάρχουν αποθηκευμένα θεμελιώδη για αυτό το ticker. Συμπλήρωσε μετρητά, burn και μετοχές από το τελευταίο filing και ενεργοποίησε το dilution.':'No saved fundamentals for this ticker. Enter cash, burn and shares from the latest filing, then enable dilution.'}</div>}
      <div className={`fcRow ${d.enabled?'':'fcOff'}`}>
        <Num label={gr?'Μετοχές':'Shares outstanding'} suffix="M" value={d.sharesM} onChange={setDil('sharesM')}/>
        <Num label={gr?'Μετρητά':'Cash & deposits'} suffix="$M" value={d.cashM} onChange={setDil('cashM')}/>
        <Num label={gr?'Burn ανά τρίμηνο':'Burn per quarter'} suffix="$M" value={d.quarterlyBurnM} onChange={setDil('quarterlyBurnM')}/>
        <Num label={gr?'Αλλαγή burn / έτος':'Burn change / year'} suffix="%" value={d.burnChangePctYr} onChange={setDil('burnChangePctYr')} help={gr?'αρνητικό = βελτίωση':'negative = improving'}/>
        <Num label={gr?'Αύξηση όταν runway <':'Raise when runway <'} suffix={gr?'μήνες':'months'} value={d.triggerMonths} onChange={setDil('triggerMonths')}/>
        <Num label={gr?'Μέγεθος αύξησης':'Raise sized to'} suffix={gr?'μήνες runway':'months runway'} value={d.targetMonths} onChange={setDil('targetMonths')}/>
        <Num label={gr?'Έκπτωση έκδοσης':'Issue discount'} suffix="%" value={d.discountPct} onChange={setDil('discountPct')}/>
        <Num label={gr?'Αξία που πιστώνει η αγορά':'Cash credited as value'} value={d.cashCredit} onChange={setDil('cashCredit')} step="0.1" help={gr?'0 = καθαρό dilution · 1 = ουδέτερο':'0 = pure dilution · 1 = value-neutral'}/>
        <Num label={gr?'Πιθανότητα αποτυχίας αύξησης':'Raise failure probability'} value={d.failProb} onChange={setDil('failProb')} step="0.01"/>
      </div>
      <div className="fcActions"><button onClick={run} disabled={loading||!sym}>{loading?(gr?'Υπολογισμός…':'Simulating…'):(gr?'Εκτέλεση προσομοίωσης':'Run simulation')}</button>
        {err&&<span className="fcErr">{err}</span>}</div>
    </section>
    {res&&<>
      <section className="section">
        <div className="sectionHead"><div><h2>{res.symbol} · {gr?'Ευρύ φάσμα έως':'Fan chart to'} +{res.params.years}y</h2>
          <span>{gr?'Ιστορικό':'History'} {res.history.observations}d · vol {Math.round(res.params.annualVol*100)}% (recent 3m {Math.round(res.history.recentAnnualVol*100)}%) · {res.params.nSims} paths · seed {res.params.seed}{res.runId?` · #${res.runId}`:''}</span></div></div>
        <FanChart res={res}/>
        <div className="fcLegend"><span><i className="fcSwHist"/>{gr?'ιστορικό':'history'}</span><span><i className="fcSwMed"/>{gr?'διάμεσος':'median'}</span><span><i className="fcSw75"/>25–75%</span><span><i className="fcSw95"/>5–95%</span></div>
      </section>
      <div className="summaryGrid fcTiles">{tiles.map(([k,v,sub])=><div className="metric" key={k}><small>{k}</small><b>{v}</b><span className="fcSub">{sub}</span></div>)}</div>
      <section className="logicCard"><h3>{gr?'Πώς να το διαβάσεις':'How to read this'}</h3>
        <p className="fcNote">{gr?'Οι τιμές είναι σε όρους σημερινής μετοχής: τυχόν μελλοντικό reverse split αγνοείται, άρα τιμές κάτω από το min bid σημαίνουν περιοχή deficiency/reverse split, όχι απαραίτητα πραγματική τιμή. Η διάμεσος είναι χαμηλότερη από την αρχική ακόμη και με drift 0 λόγω volatility drag. Το αποτέλεσμα είναι συνάρτηση των παραδοχών σου και όχι πρόβλεψη· δεν είναι επενδυτική συμβουλή.':'Prices are in today\'s share terms: future reverse splits are ignored, so values below the minimum bid mean deficiency/reverse-split territory, not necessarily a literal quote. The median sits below the start price even with zero drift because of volatility drag. The output is a function of your assumptions, not a prediction, and not investment advice.'}</p></section>
    </>}
  </>;
}
