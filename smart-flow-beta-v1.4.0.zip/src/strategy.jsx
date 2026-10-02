import React,{useEffect,useMemo,useState}from'react';

async function api(url,opts){
  const r=await fetch(url,opts);
  const text=await r.text();let d={};try{d=text?JSON.parse(text):{};}catch{throw new Error('Invalid server response');}
  if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d;
}
const signed=n=>Number.isFinite(Number(n))?`${Number(n)>0?'+':''}${Number(n)}`:'—';
const pct=n=>Number.isFinite(Number(n))?`${Number(n)>0?'+':''}${Number(n).toFixed(1)}%`:'—';
const dt=x=>x?new Date(x).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'—';

function Sparkline({rows,keyName='smart_money_score',height=64}){
  const data=[...(rows||[])].reverse().slice(-24);if(data.length<2)return <div className="trendEmpty">Need more observations</div>;
  const vals=data.map(x=>Number(keyName==='price'?x.payload?.quote?.close:x[keyName])).filter(Number.isFinite);
  if(vals.length<2)return <div className="trendEmpty">No price history yet</div>;
  const min=Math.min(...vals),max=Math.max(...vals),range=max-min||1,w=340,p=8;
  const pts=vals.map((v,i)=>`${p+(i/(vals.length-1))*(w-p*2)},${p+(1-(v-min)/range)*(height-p*2)}`).join(' ');
  return <svg className="trendSpark" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>;
}

export function TrendPanel({symbol,quote,lang='en'}){
  const gr=lang==='el';const[data,setData]=useState(null),[err,setErr]=useState(''),[form,setForm]=useState(false),[saving,setSaving]=useState(false);
  const[thesis,setThesis]=useState({direction:'WATCH',horizon:'20D',thesis:'',trigger:'',invalidation:'',targetZone:'',notes:''});
  async function load(){if(!symbol)return;try{setData(await api('/api/strategy/symbol/'+encodeURIComponent(symbol)));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{load()},[symbol]);
  async function saveThesis(){
    if(!thesis.thesis.trim())return;setSaving(true);
    try{
      await api('/api/strategy/theses',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...thesis,symbol,entryPrice:quote?.close??null})});
      setForm(false);setThesis({direction:'WATCH',horizon:'20D',thesis:'',trigger:'',invalidation:'',targetZone:'',notes:''});await load();
    }catch(e){setErr(e.message)}finally{setSaving(false)}
  }
  async function setThesisStatus(id,status){
    try{await api('/api/strategy/theses/'+id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status})});await load();}
    catch(e){setErr(e.message)}
  }
  if(err)return <section className="strategyCard"><h3>Trend & Strategy Intelligence</h3><div className="warning">{err}</div></section>;
  if(!data)return <section className="strategyCard"><h3>Trend & Strategy Intelligence</h3><p>Loading history…</p></section>;
  const h=data.history||[],tr=data.trend||{},latest=h[0];
  return <section className="strategyCard">
    <div className="strategyHead"><div><span className="strategyEyebrow">v1.5 TREND MEMORY</span><h3>{symbol} · {tr.state||'NO HISTORY'} <small>{tr.strength||0}/100</small></h3><p>{gr?'Το trend score είναι ξεχωριστό από το Smart Money Score και μετρά επιμονή/συνέπεια στο χρόνο.':'Trend strength is separate from Smart Money Score and measures persistence/consistency over time.'}</p></div><button className="accent" onClick={()=>setForm(x=>!x)}>+ {gr?'Νέα Thesis':'Create Thesis'}</button></div>
    <div className="trendMetrics"><div><small>{gr?'Μεταβολή Score':'Score change'}</small><b>{signed(tr.change)}</b></div><div><small>{gr?'Συνεχόμενα':'Streak'}</small><b>{tr.streak||0}</b></div><div><small>{gr?'Price confirmation':'Price confirmation'}</small><b>{tr.priceConfirmed===true?'CONFIRMED':tr.priceConfirmed===false?'DIVERGING':'UNKNOWN'}</b></div><div><small>Sector</small><b>{tr.sectorConfirmation||'UNKNOWN'}</b></div></div>
    <div className="timelineGrid"><div><b>Smart Money Score</b><Sparkline rows={h}/><small>{[...h].reverse().slice(-6).map(x=>`${dt(x.signal_at)} ${signed(x.smart_money_score)}`).join('  →  ')||'—'}</small></div><div><b>{gr?'Τιμή μετά από refresh':'Price after refresh'}</b><Sparkline rows={h} keyName="price"/><small>{gr?'Η τιμή καταγράφεται όταν κάνεις Twelve Data refresh.':'Price is captured when you refresh Twelve Data.'}</small></div></div>
    {!!tr.events?.length&&<div className="changeEvents"><b>{gr?'Change detector':'Change detector'}</b>{tr.events.map((x,i)=><span key={i}>• {x}</span>)}</div>}
    <div className="historyStrip">{h.slice(0,10).map(x=><div key={x.id}><small>{dt(x.signal_at)}</small><b>{signed(x.smart_money_score)}</b><span>{x.confidence}% conf</span><span>{x.coverage}% cov</span></div>)}</div>
    {data.marketRegime&&<div className="regimeInline"><b>{gr?'Τρέχον market regime':'Current market regime'}:</b> {data.marketRegime.regime} · {signed(data.marketRegime.score)}</div>}
    <div className="thesisList"><div className="sectionHead"><div><h4>{gr?'Investment Thesis Journal':'Investment Thesis Journal'}</h4><span>{gr?'Καταγράφει τι πίστευες τη στιγμή της απόφασης, όχι εκ των υστέρων.':'Records what you believed at decision time, not in hindsight.'}</span></div></div>{!(data.theses||[]).length?<p className="muted">{gr?'Δεν υπάρχει thesis ακόμη.':'No thesis recorded yet.'}</p>:(data.theses||[]).map(x=><div className="thesisRow" key={x.id}><div><b>{x.direction} · {x.horizon||'—'}</b><span>{dt(x.created_at)} {x.entry_price!=null?`· ${Number(x.entry_price).toFixed(2)}`:''}</span></div><p>{x.thesis_text}</p><div className="thesisState"><em>{x.status}</em>{x.status==='ACTIVE'&&<><button onClick={()=>setThesisStatus(x.id,'CLOSED')}>Close</button><button onClick={()=>setThesisStatus(x.id,'INVALIDATED')}>Invalidate</button></>}</div></div>)}</div>
    {form&&<div className="thesisForm">
      <label>Direction<select value={thesis.direction} onChange={e=>setThesis({...thesis,direction:e.target.value})}><option>WATCH</option><option>BULLISH</option><option>BEARISH</option></select></label>
      <label>Horizon<select value={thesis.horizon} onChange={e=>setThesis({...thesis,horizon:e.target.value})}><option>1D</option><option>5D</option><option>20D</option><option>63D</option><option>LONGER</option></select></label>
      <label className="wide">{gr?'Thesis / σκεπτικό':'Thesis'}<textarea value={thesis.thesis} onChange={e=>setThesis({...thesis,thesis:e.target.value})}/></label>
      <label className="wide">{gr?'Τι την ενεργοποίησε':'Trigger'}<input value={thesis.trigger} onChange={e=>setThesis({...thesis,trigger:e.target.value})}/></label>
      <label className="wide">{gr?'Συνθήκη ακύρωσης':'Invalidation'}<input value={thesis.invalidation} onChange={e=>setThesis({...thesis,invalidation:e.target.value})}/></label>
      <label>{gr?'Target/zone (optional)':'Target/zone (optional)'}<input value={thesis.targetZone} onChange={e=>setThesis({...thesis,targetZone:e.target.value})}/></label>
      <label>{gr?'Σημειώσεις':'Notes'}<input value={thesis.notes} onChange={e=>setThesis({...thesis,notes:e.target.value})}/></label>
      <div className="wide formActions"><button onClick={()=>setForm(false)}>{gr?'Άκυρο':'Cancel'}</button><button className="accent" disabled={saving||!thesis.thesis.trim()} onClick={saveThesis}>{saving?'Saving…':(gr?'Αποθήκευση Thesis':'Save Thesis')}</button></div>
    </div>}
  </section>
}

function StatTable({title,rows}){
  return <div className="analyticsBlock"><h4>{title}</h4>{!rows?.length?<p className="muted">Not enough outcome data yet.</p>:<table><thead><tr><th>Group</th><th>N</th><th>Avg 20D</th><th>Positive</th></tr></thead><tbody>{rows.map(x=><tr key={x.key}><td>{x.key}</td><td>{x.n}</td><td>{pct(x.avg)}</td><td>{pct(x.positivePct)}</td></tr>)}</tbody></table>}</div>;
}

export function StrategyPage({lang='en'}){
  const gr=lang==='el';const[analytics,setAnalytics]=useState(null),[regime,setRegime]=useState(null),[coach,setCoach]=useState(null),[busy,setBusy]=useState(''),[err,setErr]=useState('');
  async function load(){try{const[a,r]=await Promise.all([api('/api/strategy/analytics'),api('/api/strategy/market-regime')]);setAnalytics(a);setRegime(r.regime||null);setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{load()},[]);
  async function refreshOutcomes(){setBusy('outcomes');try{await api('/api/strategy/outcomes/refresh',{method:'POST'});await load()}catch(e){setErr(e.message)}finally{setBusy('')}}
  async function refreshRegime(){setBusy('regime');try{const r=await api('/api/strategy/market-regime/refresh',{method:'POST'});setRegime(r.regime);await load()}catch(e){setErr(e.message)}finally{setBusy('')}}
  async function runCoach(){setBusy('coach');try{setCoach(await api('/api/ai/strategy-coach',{method:'POST'}))}catch(e){setErr(e.message)}finally{setBusy('')}}
  const h=analytics?.byHorizon||{};
  return <><div className="pageTitle"><div><h1>{gr?'Trend & Strategy Intelligence':'Trend & Strategy Intelligence'}</h1><p>{gr?'Μετρά τι συνέβη μετά τα signals και αν η διαδικασία σου βελτιώνεται. Δεν αλλάζει το deterministic Smart Money Score.':'Measures what happened after signals and whether your process is improving. It does not alter the deterministic Smart Money Score.'}</p></div><div className="filterActions"><button disabled={!!busy} onClick={refreshOutcomes}>{busy==='outcomes'?'…':(gr?'↻ Outcomes':'↻ Outcomes')}</button><button disabled={!!busy} onClick={refreshRegime}>{busy==='regime'?'…':(gr?'↻ Market regime':'↻ Market regime')}</button></div></div>
  {err&&<div className="warning">{err}</div>}
  <div className="summaryGrid"><div className="metric"><small>Snapshots</small><b>{analytics?.coverage?.snapshots??0}</b></div><div className="metric"><small>Symbols</small><b>{analytics?.coverage?.symbols??0}</b></div><div className="metric"><small>1D avg</small><b>{pct(h.d1?.avg)}</b></div><div className="metric"><small>5D avg</small><b>{pct(h.d5?.avg)}</b></div><div className="metric"><small>20D avg</small><b>{pct(h.d20?.avg)}</b></div><div className="metric"><small>63D avg</small><b>{pct(h.d63?.avg)}</b></div></div>
  <section className="strategyCard"><div className="strategyHead"><div><span className="strategyEyebrow">MARKET REGIME</span><h3>{regime?.regime||'NOT CAPTURED'} {regime&&<small>{signed(regime.score)}</small>}</h3><p>{gr?'SPY / QQQ / IWM / sector leadership / volatility proxy. Context μόνο — δεν ξαναβαθμολογεί το flow.':'SPY / QQQ / IWM / sector leadership / volatility proxy. Context only — it does not rescore flow.'}</p></div></div>{regime?.payload?.assets&&<div className="regimeAssets">{regime.payload.assets.map(x=><div key={x.symbol}><b>{x.symbol}</b><span>5D {pct(x.return5d)}</span><span>20D {pct(x.return20d)}</span><span>{x.trend}</span></div>)}</div>}</section>
  <section className="analyticsGrid"><StatTable title="Bias · 20D" rows={analytics?.byBias}/><StatTable title="Asset · 20D" rows={analytics?.byAsset}/><StatTable title="Confidence bands · 20D" rows={analytics?.byConfidence}/><StatTable title="Score bands · 20D" rows={analytics?.byScore}/><StatTable title="Sector confirmation · 20D" rows={analytics?.bySectorConfirmation}/></section>
  <section className="strategyCard"><div className="strategyHead"><div><span className="strategyEyebrow">AI STRATEGY COACH</span><h3>{gr?'Ανάλυση της διαδικασίας σου':'Analysis of your process'}</h3><p>{gr?'Το AI βλέπει μόνο συγκεντρωτικά historical outcomes και patterns. Δεν προβλέπει ποιο ticker θα ανέβει.':'AI receives aggregated historical outcomes and patterns. It does not predict which ticker will rise.'}</p></div><button className="accent" disabled={!!busy||!analytics?.sampleSize} onClick={runCoach}>{busy==='coach'?'AI…':(gr?'Run Strategy Coach':'Run Strategy Coach')}</button></div>{!analytics?.sampleSize&&<p className="muted">{gr?'Χρειάζονται πρώτα outcomes.':'Outcome history is needed first.'}</p>}{coach?.synthesis&&<div className="coachGrid"><div><h4>{gr?'Τι φαίνεται να λειτουργεί':'What appears to work'}</h4><ul>{(coach.synthesis.strengths?.[lang]||[]).map((x,i)=><li key={i}>{x}</li>)}</ul></div><div><h4>{gr?'Τι χρειάζεται προσοχή':'What needs attention'}</h4><ul>{(coach.synthesis.weaknesses?.[lang]||[]).map((x,i)=><li key={i}>{x}</li>)}</ul></div><div><h4>{gr?'Κανόνες για testing':'Rules to test'}</h4><ul>{(coach.synthesis.tests?.[lang]||[]).map((x,i)=><li key={i}>{x}</li>)}</ul></div></div>}</section>
  </>;
}

export function MonitoringBoard({symbols=[],lang='en',go,remove}){
  const gr=lang==='el';const[rows,setRows]=useState([]),[err,setErr]=useState('');
  useEffect(()=>{if(!symbols.length){setRows([]);return}api('/api/strategy/monitor?symbols='+encodeURIComponent(symbols.join(','))).then(d=>setRows(d.rows||[])).catch(e=>setErr(e.message))},[symbols.join(',')]);
  if(err)return <div className="warning">{err}</div>;
  if(!symbols.length)return <div className="noResults">{gr?'Δεν έχεις προσθέσει ticker στο watchlist.':'Your watchlist is empty.'}</div>;
  return <div className="monitorBoard"><div className="monitorHead"><span>Ticker</span><span>Flow</span><span>Trend</span><span>Change</span><span>Price confirmation</span><span>Thesis</span><span></span></div>{rows.map(x=><div className="monitorRow" key={x.symbol}><button className="tickerLink" onClick={()=>go('ticker',x.symbol)}>{x.symbol}</button><b>{signed(x.latest?.smart_money_score)}</b><span className={`trendState ${String(x.trend?.state||'').toLowerCase()}`}>{x.trend?.state||'NO HISTORY'} ↑</span><b>{signed(x.trend?.change)}</b><span>{x.trend?.priceConfirmed===true?'Confirmed':x.trend?.priceConfirmed===false?'Diverging':'Unknown'}</span><span>{x.thesis?'Active':'Watching'}</span><button onClick={()=>remove(x.symbol)}>×</button></div>)}</div>;
}
