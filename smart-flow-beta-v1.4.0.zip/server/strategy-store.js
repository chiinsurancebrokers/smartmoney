import pg from 'pg';
const {Pool}=pg;

const pool=process.env.DATABASE_URL?new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.DATABASE_URL.includes('railway.internal')?false:{rejectUnauthorized:false}
}):null;

export const strategyDbEnabled=()=>!!pool;
const cleanSymbol=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,'');

export async function ensureStrategySchema(){
  if(!pool)return false;
  await pool.query(`
    create table if not exists flow_uploads (
      id bigserial primary key,
      filename text not null,
      uploaded_at timestamptz not null default now(),
      raw_row_count integer not null default 0,
      engine_version text not null
    );
    create table if not exists signal_snapshots (
      id bigserial primary key,
      upload_id bigint references flow_uploads(id) on delete set null,
      symbol text not null,
      asset_type text not null default 'UNKNOWN',
      signal_at timestamptz not null default now(),
      bias text not null,
      smart_money_score integer not null,
      confidence integer not null,
      coverage integer not null,
      gamma_context text not null default 'UNKNOWN',
      payload jsonb not null default '{}'::jsonb
    );
    create index if not exists signal_snapshots_symbol_time_idx on signal_snapshots(symbol,signal_at desc);

    create table if not exists investment_theses (
      id bigserial primary key,
      symbol text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      status text not null default 'ACTIVE',
      direction text not null,
      horizon text,
      entry_price numeric,
      trigger_text text,
      thesis_text text not null,
      invalidation_text text,
      target_zone text,
      notes text,
      snapshot_id bigint references signal_snapshots(id) on delete set null,
      closed_at timestamptz,
      close_note text
    );
    create index if not exists investment_theses_symbol_status_idx on investment_theses(symbol,status,created_at desc);

    create table if not exists signal_outcomes (
      snapshot_id bigint primary key references signal_snapshots(id) on delete cascade,
      symbol text not null,
      signal_at timestamptz not null,
      entry_price numeric,
      horizons jsonb not null default '{}'::jsonb,
      refreshed_at timestamptz not null default now()
    );
    create index if not exists signal_outcomes_symbol_idx on signal_outcomes(symbol,signal_at desc);

    create table if not exists market_regime_snapshots (
      id bigserial primary key,
      captured_at timestamptz not null default now(),
      regime text not null,
      score integer not null default 0,
      payload jsonb not null default '{}'::jsonb
    );
    create index if not exists market_regime_time_idx on market_regime_snapshots(captured_at desc);
  `);
  return true;
}

export async function saveSignalBatch({filename='manual.csv',rawRowCount=0,engineVersion='unknown',snapshots=[]}){
  if(!pool)throw new Error('Strategy database is not configured');
  const client=await pool.connect();
  try{
    await client.query('begin');
    const up=await client.query('insert into flow_uploads(filename,raw_row_count,engine_version) values($1,$2,$3) returning id,uploaded_at',[filename,rawRowCount,engineVersion]);
    const uploadId=up.rows[0].id;
    const inserted=[];
    for(const x of snapshots.slice(0,1500)){
      const symbol=cleanSymbol(x.symbol);if(!symbol)continue;
      const r=await client.query(`insert into signal_snapshots(upload_id,symbol,asset_type,bias,smart_money_score,confidence,coverage,gamma_context,payload)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) returning id,symbol,signal_at`,
        [uploadId,symbol,x.assetType||'UNKNOWN',x.bias||'MIXED',Number(x.score)||0,Number(x.confidence)||0,Number(x.coverage)||0,x.gammaContext||'UNKNOWN',JSON.stringify(x.payload||{})]);
      inserted.push(r.rows[0]);
    }
    await client.query('commit');
    return{uploadId,uploadedAt:up.rows[0].uploaded_at,count:inserted.length};
  }catch(e){await client.query('rollback');throw e;}finally{client.release();}
}

function trendState(rows){
  if(!rows?.length)return{state:'NO HISTORY',strength:0,change:0,streak:0,events:[]};
  const a=[...rows].reverse(),latest=a.at(-1),prev=a.at(-2);
  const sign=n=>n>10?1:n<-10?-1:0;
  const latestSign=sign(latest.smart_money_score);
  let streak=0;
  for(let i=a.length-1;i>=0;i--){if(sign(a[i].smart_money_score)===latestSign&&latestSign!==0)streak++;else break;}
  const recent=a.slice(-Math.min(6,a.length));
  const same=latestSign?recent.filter(x=>sign(x.smart_money_score)===latestSign).length/recent.length:0;
  const first=recent[0];
  const scoreChange=prev?latest.smart_money_score-prev.smart_money_score:0;
  const confidenceChange=prev?latest.confidence-prev.confidence:0;
  const coverageChange=prev?latest.coverage-prev.coverage:0;
  const absAccel=Math.abs(latest.smart_money_score)-Math.abs(first.smart_money_score);
  const premium=recent.map(x=>Number(x.payload?.eligiblePremium||0)).filter(x=>x>0);
  const premiumPersistence=premium.length>1?(Math.min(...premium)/Math.max(...premium)):premium.length?1:0;
  const sector=String(latest.payload?.sectorConfirmation||'').toUpperCase();
  const quote=latest.payload?.quote||null;
  const priceConfirmed=quote?.percent_change!=null&&latestSign!==0
    ?(latestSign>0?Number(quote.percent_change)>0:Number(quote.percent_change)<0):null;
  let strength=Math.round(
    same*30+
    Math.min(streak,5)/5*20+
    Math.min(Math.abs(latest.smart_money_score),100)*.18+
    Math.min(latest.confidence,100)*.12+
    Math.min(latest.coverage,100)*.08+
    premiumPersistence*5+
    (sector==='CONFIRMED'?5:sector==='CONFLICTING'?-5:0)+
    (priceConfirmed===true?5:priceConfirmed===false?-3:0)
  );
  strength=Math.max(0,Math.min(100,strength));
  let state='EMERGING';
  const priorSign=prev?sign(prev.smart_money_score):0;
  if(prev&&latestSign&&priorSign&&latestSign!==priorSign&&Math.abs(latest.smart_money_score)>=20)state='REVERSAL';
  else if(prev&&(Math.abs(latest.smart_money_score)<=Math.abs(prev.smart_money_score)-10||confidenceChange<=-12))state='WEAKENING';
  else if(streak>=4&&same>=.8&&Math.abs(latest.smart_money_score)>=40)state='ESTABLISHED';
  else if(streak>=3&&absAccel>=10)state='BUILDING';
  else if(latestSign===0)state='MIXED';
  const events=[];
  if(prev){
    if(Math.abs(scoreChange)>=15)events.push(`Smart Money Score ${prev.smart_money_score>0?'+':''}${prev.smart_money_score} → ${latest.smart_money_score>0?'+':''}${latest.smart_money_score}`);
    if(Math.abs(confidenceChange)>=10)events.push(`Confidence ${prev.confidence}% → ${latest.confidence}%`);
    if(prev.bias!==latest.bias)events.push(`Bias ${prev.bias} → ${latest.bias}`);
    const ps=String(prev.payload?.sectorConfirmation||'').toUpperCase();
    if(ps!==sector&&sector)events.push(`Sector confirmation ${ps||'NONE'} → ${sector}`);
    const pq=prev.payload?.quote?.percent_change;
    if(priceConfirmed===false&&pq!=null)events.push('Flow direction remains strong but latest price context diverges');
  }
  if(streak>=3)events.push(`${streak} consecutive ${latestSign>0?'bullish':'bearish'} observations`);
  return{state,strength,change:scoreChange,confidenceChange,coverageChange,streak,priceConfirmed,sectorConfirmation:sector||'UNKNOWN',events};
}

export async function getSymbolHistory(symbol,limit=90){
  if(!pool)throw new Error('Strategy database is not configured');
  symbol=cleanSymbol(symbol);
  const [s,t,r]=await Promise.all([
    pool.query(`select id,symbol,asset_type,signal_at,bias,smart_money_score,confidence,coverage,gamma_context,payload
      from signal_snapshots where symbol=$1 order by signal_at desc limit $2`,[symbol,Math.max(2,Math.min(365,Number(limit)||90))]),
    pool.query(`select * from investment_theses where symbol=$1 order by created_at desc limit 30`,[symbol]),
    pool.query('select captured_at,regime,score,payload from market_regime_snapshots order by captured_at desc limit 1')
  ]);
  const rows=s.rows;
  return{symbol,history:rows,trend:trendState(rows),theses:t.rows,marketRegime:r.rows[0]||null};
}

export async function updateLatestPrice(symbol,quote){
  if(!pool)return false;
  symbol=cleanSymbol(symbol);
  const r=await pool.query(`update signal_snapshots set payload=payload || jsonb_build_object('quote',$2::jsonb)
    where id=(select id from signal_snapshots where symbol=$1 order by signal_at desc limit 1) returning id`,
    [symbol,JSON.stringify(quote||{})]);
  return !!r.rowCount;
}

export async function createThesis(x){
  if(!pool)throw new Error('Strategy database is not configured');
  const symbol=cleanSymbol(x.symbol);if(!symbol)throw new Error('symbol required');
  const snap=await pool.query('select id from signal_snapshots where symbol=$1 order by signal_at desc limit 1',[symbol]);
  const r=await pool.query(`insert into investment_theses(symbol,direction,horizon,entry_price,trigger_text,thesis_text,invalidation_text,target_zone,notes,snapshot_id)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [symbol,String(x.direction||'WATCH').toUpperCase(),x.horizon||null,x.entryPrice==null?null:Number(x.entryPrice),x.trigger||null,x.thesis||'',x.invalidation||null,x.targetZone||null,x.notes||null,snap.rows[0]?.id||null]);
  return r.rows[0];
}

export async function updateThesis(id,x){
  if(!pool)throw new Error('Strategy database is not configured');
  const status=String(x.status||'ACTIVE').toUpperCase();
  const r=await pool.query(`update investment_theses set status=$2,close_note=coalesce($3,close_note),
    closed_at=case when $2 in ('CLOSED','INVALIDATED') then coalesce(closed_at,now()) else closed_at end,updated_at=now()
    where id=$1 returning *`,[Number(id),status,x.closeNote||null]);
  return r.rows[0]||null;
}

export async function pendingOutcomeSnapshots(limit=120){
  if(!pool)return[];
  const r=await pool.query(`select s.id,s.symbol,s.signal_at,s.bias,s.smart_money_score,s.confidence,s.coverage,s.payload
    from signal_snapshots s left join signal_outcomes o on o.snapshot_id=s.id
    where s.signal_at <= now()-interval '1 day'
      and (o.snapshot_id is null or o.refreshed_at < now()-interval '12 hours')
    order by s.signal_at desc limit $1`,[Math.max(1,Math.min(500,Number(limit)||120))]);
  return r.rows;
}

export async function upsertOutcome(snapshotId,symbol,signalAt,entryPrice,horizons){
  if(!pool)return;
  await pool.query(`insert into signal_outcomes(snapshot_id,symbol,signal_at,entry_price,horizons,refreshed_at)
    values($1,$2,$3,$4,$5::jsonb,now())
    on conflict(snapshot_id) do update set entry_price=excluded.entry_price,horizons=excluded.horizons,refreshed_at=now()`,
    [snapshotId,cleanSymbol(symbol),signalAt,entryPrice,JSON.stringify(horizons||{})]);
}

export async function saveMarketRegime(regime,score,payload){
  if(!pool)throw new Error('Strategy database is not configured');
  const r=await pool.query('insert into market_regime_snapshots(regime,score,payload) values($1,$2,$3::jsonb) returning *',[regime,score,JSON.stringify(payload||{})]);
  return r.rows[0];
}

export async function latestMarketRegime(){
  if(!pool)return null;
  return (await pool.query('select * from market_regime_snapshots order by captured_at desc limit 1')).rows[0]||null;
}

export async function strategyAnalytics(){
  if(!pool)throw new Error('Strategy database is not configured');
  const [counts,outcomes,theses]=await Promise.all([
    pool.query(`select count(*)::int snapshots,count(distinct symbol)::int symbols,min(signal_at) first_signal,max(signal_at) last_signal from signal_snapshots`),
    pool.query(`select o.symbol,o.signal_at,o.horizons,s.bias,s.smart_money_score,s.confidence,s.coverage,s.asset_type,s.payload
      from signal_outcomes o join signal_snapshots s on s.id=o.snapshot_id order by o.signal_at desc limit 3000`),
    pool.query(`select status,direction,count(*)::int n from investment_theses group by status,direction order by status,direction`)
  ]);
  const rows=outcomes.rows;
  const horizons=['d1','d5','d20','d63'];
  const byHorizon={};
  for(const h of horizons){
    const vals=rows.map(x=>Number(x.horizons?.[h]?.returnPct)).filter(Number.isFinite);
    byHorizon[h]={n:vals.length,avg:vals.length?+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2):null,positivePct:vals.length?+((vals.filter(v=>v>0).length/vals.length)*100).toFixed(1):null};
  }
  function group(keyFn,h='d20'){
    const m={};
    for(const x of rows){const v=Number(x.horizons?.[h]?.returnPct);if(!Number.isFinite(v))continue;const k=keyFn(x);(m[k]??=[]).push(v);}
    return Object.entries(m).map(([key,v])=>({key,n:v.length,avg:+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2),positivePct:+(v.filter(x=>x>0).length/v.length*100).toFixed(1)})).sort((a,b)=>b.n-a.n);
  }
  return{
    coverage:counts.rows[0],
    byHorizon,
    byBias:group(x=>x.bias),
    byAsset:group(x=>x.asset_type),
    byConfidence:group(x=>x.confidence>=70?'70+':x.confidence>=55?'55-69':'<55'),
    byScore:group(x=>Math.abs(x.smart_money_score)>=60?'|60|+':Math.abs(x.smart_money_score)>=35?'|35-59|':'<35'),
    bySectorConfirmation:group(x=>String(x.payload?.sectorConfirmation||'UNKNOWN')),
    theses:theses.rows,
    sampleSize:rows.length
  };
}

export async function monitoringBoard(symbols=[]){
  if(!pool)return[];
  const clean=[...new Set(symbols.map(cleanSymbol).filter(Boolean))].slice(0,80);
  const out=[];
  for(const symbol of clean){
    const h=await getSymbolHistory(symbol,12);
    const latest=h.history[0]||null;
    const active=h.theses.find(x=>x.status==='ACTIVE')||null;
    out.push({symbol,latest,trend:h.trend,thesis:active,marketRegime:h.marketRegime});
  }
  return out;
}

export async function closeStrategyDb(){if(pool)await pool.end();}
