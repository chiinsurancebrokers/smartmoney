export const ENGINE_VERSION='smart-v1.0-beta';
const ETF_META={
 SPY:{type:'ETF',underlying:'SPX',multiplier:1,sector:'US Market'},QQQ:{type:'ETF',underlying:'NDX',multiplier:1,sector:'Nasdaq 100'},
 TQQQ:{type:'ETF',underlying:'QQQ',multiplier:3,sector:'Nasdaq 100'},SQQQ:{type:'ETF',underlying:'QQQ',multiplier:-3,sector:'Nasdaq 100'},
 IWM:{type:'ETF',underlying:'RUT',multiplier:1,sector:'Small Caps'},DIA:{type:'ETF',underlying:'DJI',multiplier:1,sector:'Dow'},
 SMH:{type:'ETF',underlying:'Semiconductors',multiplier:1,sector:'Semiconductors'},SOXX:{type:'ETF',underlying:'Semiconductors',multiplier:1,sector:'Semiconductors'},
 SOXL:{type:'ETF',underlying:'Semiconductors',multiplier:3,sector:'Semiconductors'},SOXS:{type:'ETF',underlying:'Semiconductors',multiplier:-3,sector:'Semiconductors'},
 XLK:{type:'ETF',underlying:'Technology',multiplier:1,sector:'Technology'},XLF:{type:'ETF',underlying:'Financials',multiplier:1,sector:'Financials'},XLE:{type:'ETF',underlying:'Energy',multiplier:1,sector:'Energy'},XBI:{type:'ETF',underlying:'Biotech',multiplier:1,sector:'Biotech'},
 NAIL:{type:'ETF',underlying:'Homebuilders',multiplier:3,sector:'Homebuilders'}
};
const CONFIRM={NVDA:['SMH','SOXX','QQQ'],AMD:['SMH','SOXX','QQQ'],AVGO:['SMH','SOXX','QQQ'],AAPL:['XLK','QQQ'],MSFT:['XLK','QQQ'],META:['QQQ'],AMZN:['QQQ'],TSLA:['QQQ'],JPM:['XLF','SPY'],XOM:['XLE','SPY']};
const n=v=>{const x=Number(String(v??'').replace(/[$,%\s]/g,'').replace(/,/g,''));return Number.isFinite(x)?x:0};
const text=(r,...keys)=>{for(const k of keys){if(r[k]!=null&&String(r[k]).trim()!=='')return String(r[k]).trim()}return ''};
export function parseCSV(csv){
 const lines=csv.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim()&&!x.includes('Downloaded from Barchart'));
 if(lines.length<2) throw new Error('The CSV has no data rows.');
 const split=line=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(c===','&&!q){out.push(cur);cur=''}else cur+=c}out.push(cur);return out.map(x=>x.trim())};
 const headers=split(lines[0]);
 return lines.slice(1).map((line,i)=>{const vals=split(line),r={_row:i+2};headers.forEach((h,j)=>r[h]=vals[j]??'');return r}).filter(r=>text(r,'Symbol','symbol','Underlying'));
}
function tx(code){const x=String(code||'').toUpperCase().replace(/[^A-Z]/g,'');if(x.includes('BTO')||x.includes('BUYTOOPEN'))return'BTO';if(x.includes('STO')||x.includes('SELLTOOPEN'))return'STO';if(x.includes('BTC')||x.includes('BUYTOCLOSE'))return'BTC';if(x.includes('STC')||x.includes('SELLTOCLOSE'))return'STC';return'UNKNOWN'}
function side(v){const x=String(v||'').toUpperCase();return x.includes('ASK')?'ASK':x.includes('BID')?'BID':x.includes('MID')?'MID':'UNKNOWN'}
function direction(t){
 if(t.tx!=='UNKNOWN'){
   if(t.tx==='BTO') return t.type==='CALL'?'BULLISH':'BEARISH';
   if(t.tx==='STO') return t.type==='CALL'?'BEARISH':'BULLISH';
   if(t.tx==='BTC') return t.type==='CALL'?'BULLISH':'BEARISH';
   if(t.tx==='STC') return t.type==='CALL'?'BEARISH':'BULLISH';
 }
 if(t.side==='ASK') return t.type==='CALL'?'BULLISH':'BEARISH';
 if(t.side==='BID') return t.type==='CALL'?'BEARISH':'BULLISH';
 return'UNKNOWN';
}
function positionEffect(t){return ['BTO','STO'].includes(t.tx)?'OPENING':['BTC','STC'].includes(t.tx)?'CLOSING':'UNKNOWN'}
function canonical(r){
 const symbol=text(r,'Symbol','symbol','Underlying').toUpperCase().replace(/\s/g,'');
 const type=text(r,'Type','Put/Call','Option Type','put_call').toUpperCase().startsWith('P')?'PUT':'CALL';
 const tradeSide=side(text(r,'Side','Execution Side','execution_side'));
 const code=text(r,'Code','Transaction Code','Action','Opening Action');
 const t={row:r._row,symbol,type,side:tradeSide,tx:tx(code),strike:n(text(r,'Strike','strike')),expiry:text(r,'Expires','Expiration','Expiry','expiry_date').slice(0,10),dte:n(text(r,'DTE','dte')),premium:n(text(r,'Premium','total_premium')),oi:n(text(r,'Open Int','Open Interest','open_interest')),volume:n(text(r,'Volume','volume')),size:n(text(r,'Size','size')),delta:Math.abs(n(text(r,'Delta','delta'))),iv:n(text(r,'IV','iv')),price:n(text(r,'Trade','Price','trade_price')),time:text(r,'Time','Timestamp','Date/Time','Trade Time','time'),code};
 t.direction=direction(t);t.positionEffect=positionEffect(t);return t;
}
const fp=t=>[t.symbol,t.type,t.strike,t.expiry,t.side,t.tx,t.size,t.premium,t.price,t.time].join('|');
function annotateDuplicates(trades){const seen=new Map();return trades.map(t=>{const k=fp(t);const duplicate=seen.has(k);if(!duplicate)seen.set(k,t.row);return{...t,duplicate,duplicateOf:duplicate?seen.get(k):null}})}
function timeBucket(t){if(!t.time)return'';return t.time.replace(/:\d{2}(?:\.\d+)?$/,'');}
function annotateMultiLeg(trades){
 const groups=new Map();for(const t of trades){if(t.duplicate)continue;const tb=timeBucket(t);if(!tb)continue;const key=[t.symbol,tb,t.size||'x'].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t)}
 const legInfo=new Map();let gid=1;
 for(const arr of groups.values()){
   const unique=new Set(arr.map(t=>`${t.type}|${t.strike}|${t.expiry}`));if(arr.length<2||unique.size<2||arr.length>8)continue;
   let strategy='COMPLEX';const types=new Set(arr.map(t=>t.type)),exps=new Set(arr.map(t=>t.expiry)),strikes=new Set(arr.map(t=>t.strike));
   if(types.size===1&&exps.size===1)strategy='VERTICAL';else if(types.size===2&&exps.size===1&&strikes.size===1)strategy='STRADDLE';else if(types.size===2&&exps.size===1)strategy='STRANGLE';else if(types.size===1&&strikes.size===1&&exps.size>1)strategy='CALENDAR/ROLL';
   for(const t of arr)legInfo.set(t.row,{group:`ML-${gid}`,strategy,legs:arr.length});gid++;
 }
 return trades.map(t=>({...t,...(legInfo.get(t.row)||{group:null,strategy:'SINGLE',legs:1})}));
}
function conviction(t){
 if(t.direction==='UNKNOWN'||t.duplicate)return 0;
 let c=0.46;
 if(t.side==='ASK'||t.side==='BID')c+=0.13;
 if(t.positionEffect==='OPENING')c+=0.23; else if(t.positionEffect==='CLOSING')c-=0.16;
 const voi=t.oi>0?t.volume/t.oi:0;if(voi>=2)c+=0.10;else if(voi>=1)c+=0.06;
 if(t.premium>=1_000_000)c+=0.05;if(t.group)c-=0.11;
 return Math.max(.10,Math.min(.98,c));
}
function gammaProxy(t){const atm=Math.max(0,1-Math.abs((t.delta||.5)-.5)*2),dteW=1/(1+Math.max(0,t.dte)/30),impact=(t.size||1)*100*(t.delta||.5)*atm*dteW;const regime=t.side==='ASK'?'AMPLIFYING':t.side==='BID'?'SUPPRESSING':'UNKNOWN';return{atm,dteW,impact,regime}}
function legacyFor(list){let bull=0,bear=0;for(const t of list){if(t.duplicate)continue;if(t.side==='ASK'&&t.type==='CALL'||t.side==='BID'&&t.type==='PUT')bull+=t.premium;if(t.side==='ASK'&&t.type==='PUT'||t.side==='BID'&&t.type==='CALL')bear+=t.premium}const d=bull+bear;const score=d?Math.round(100*(bull-bear)/d):0;return{score,bias:score>12?'BULLISH':score<-12?'BEARISH':'MIXED'}}
export function analyzeRows(rows){
 let trades=rows.map(canonical).filter(t=>t.symbol&&['CALL','PUT'].includes(t.type)&&t.dte>=0); // includes 0DTE
 trades=annotateMultiLeg(annotateDuplicates(trades)).map(t=>{const g=gammaProxy(t);const conv=conviction(t);return{...t,conviction:conv,weightedPremium:t.premium*conv,...g}});
 const map=new Map();for(const t of trades){if(!map.has(t.symbol))map.set(t.symbol,[]);map.get(t.symbol).push(t)}
 const interim=[];
 for(const [symbol,list] of map){
   const clean=list.filter(t=>!t.duplicate),eligiblePrem=clean.reduce((s,t)=>s+t.premium,0),classified=clean.filter(t=>t.direction!=='UNKNOWN');
   const directionalPrem=classified.reduce((s,t)=>s+t.premium,0),bull=classified.filter(t=>t.direction==='BULLISH').reduce((s,t)=>s+t.weightedPremium,0),bear=classified.filter(t=>t.direction==='BEARISH').reduce((s,t)=>s+t.weightedPremium,0),den=bull+bear;
   const raw=den?(bull-bear)/den:0;const core=Math.round(raw*100);
   const openingPrem=clean.filter(t=>t.positionEffect==='OPENING').reduce((s,t)=>s+t.premium,0),openCoverage=eligiblePrem?openingPrem/eligiblePrem:0;
   const executionCoverage=eligiblePrem?clean.filter(t=>['ASK','BID'].includes(t.side)).reduce((s,t)=>s+t.premium,0)/eligiblePrem:0;
   const coverage=eligiblePrem?directionalPrem/eligiblePrem:0;
   const avgConv=directionalPrem?classified.reduce((s,t)=>s+t.conviction*t.premium,0)/directionalPrem:0;
   const ambiguousShare=1-coverage, multiShare=eligiblePrem?clean.filter(t=>t.group).reduce((s,t)=>s+t.premium,0)/eligiblePrem:0;
   let confidence=Math.round(100*(.38*coverage+.27*avgConv+.20*executionCoverage+.15*openCoverage)-100*(.10*multiShare+.08*ambiguousShare));confidence=Math.max(5,Math.min(95,confidence));
   const gA=clean.filter(t=>t.regime==='AMPLIFYING').reduce((s,t)=>s+t.impact*t.conviction,0),gS=clean.filter(t=>t.regime==='SUPPRESSING').reduce((s,t)=>s+t.impact*t.conviction,0),gD=gA+gS,gBal=gD?(gA-gS)/gD:0,gammaContext=!gD?'UNKNOWN':gBal>.15?'AMPLIFYING':gBal<-.15?'SUPPRESSING':'MIXED';
   const legacy=legacyFor(list),asset=ETF_META[symbol]||{type:'STOCK',underlying:symbol,multiplier:1,sector:'Unknown'};
   interim.push({symbol,asset,bias:core>15?'BULLISH':core<-15?'BEARISH':'MIXED',coreScore:core,score:core,confidence,coverage:Math.round(coverage*100),openingCoverage:Math.round(openCoverage*100),executionCoverage:Math.round(executionCoverage*100),gammaContext,gammaBalance:gBal,eligiblePremium:eligiblePrem,bullishWeighted:bull,bearishWeighted:bear,duplicates:list.filter(t=>t.duplicate).length,multiLegTrades:clean.filter(t=>t.group).length,zeroDTE:clean.filter(t=>t.dte===0).length,legacy,trades:clean.sort((a,b)=>b.weightedPremium-a.weightedPremium)});
 }
 // Cross confirmation only from symbols present in same upload; inverse ETF multipliers normalize market direction.
 const bySym=Object.fromEntries(interim.map(x=>[x.symbol,x]));
 for(const s of interim){
   const peers=(CONFIRM[s.symbol]||[]).map(x=>bySym[x]).filter(Boolean);let sector=0;
   if(peers.length){const targetSign=Math.sign(s.coreScore)*(s.asset.multiplier<0?-1:1);const vals=peers.map(p=>Math.sign(p.coreScore)*(p.asset.multiplier<0?-1:1));sector=vals.reduce((a,v)=>a+(v===targetSign?1:v===-targetSign?-1:0),0)/vals.length;}
   const unusual=s.trades.length?Math.min(1,s.trades.filter(t=>t.oi>0&&t.volume/t.oi>=1).reduce((a,t)=>a+t.premium,0)/(s.eligiblePremium||1)):0;
   const opening=s.openingCoverage/100, execution=s.executionCoverage/100, gamma=Math.min(1,Math.abs(s.gammaBalance));
   // score magnitude blends quality/context while preserving directional sign.
   const sign=Math.sign(s.coreScore),mag=Math.abs(s.coreScore);const quality=.35*(mag/100)+.15*opening+.15*execution+.10*unusual+.10*gamma+.10*Math.max(0,sector)+.05*.5;
   s.score=Math.round(sign*Math.min(100,quality*100));s.bias=s.score>18?'BULLISH':s.score<-18?'BEARISH':'MIXED';s.sectorConfirmation=peers.length?{value:sector,peers:peers.map(p=>p.symbol),label:sector>.2?'CONFIRMED':sector<-.2?'CONFLICTING':'MIXED'}:{value:0,peers:[],label:'NO DATA'};
   s.confidence=Math.max(5,Math.min(95,Math.round(s.confidence+(sector>.2?6:sector<-.2?-8:0))));
 }
 return{engineVersion:ENGINE_VERSION,rawRows:rows.length,trades,duplicates:trades.filter(t=>t.duplicate).length,multiLegGroups:new Set(trades.filter(t=>t.group).map(t=>t.group)).size,tickers:interim.sort((a,b)=>b.eligiblePremium-a.eligiblePremium)};
}
export function packetFor(s,quote){return{engineVersion:ENGINE_VERSION,symbol:s.symbol,asset:s.asset,bias:s.bias,smartMoneyScore:s.score,confidence:s.confidence,coverage:s.coverage,openingCoverage:s.openingCoverage,executionCoverage:s.executionCoverage,gammaContext:s.gammaContext,sectorConfirmation:s.sectorConfirmation,legacy:s.legacy,quote:quote||null,evidence:s.trades.slice(0,12).map(t=>({type:t.type,strike:t.strike,expiry:t.expiry,dte:t.dte,side:t.side,transaction:t.tx,positionEffect:t.positionEffect,direction:t.direction,premium:t.premium,conviction:Math.round(t.conviction*100),multiLeg:t.strategy,volOi:t.oi?+(t.volume/t.oi).toFixed(2):null}))};}
