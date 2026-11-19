export const ENGINE_VERSION='smart-v1.4.0-beta';

const ETF_META={
 SPY:{type:'ETF',underlying:'SPX',multiplier:1,sector:'US Market'},QQQ:{type:'ETF',underlying:'NDX',multiplier:1,sector:'Nasdaq 100'},IWM:{type:'ETF',underlying:'RUT',multiplier:1,sector:'Small Caps'},DIA:{type:'ETF',underlying:'DJI',multiplier:1,sector:'Dow'},
 VOO:{type:'ETF',underlying:'SPX',multiplier:1,sector:'US Market'},IVV:{type:'ETF',underlying:'SPX',multiplier:1,sector:'US Market'},VTI:{type:'ETF',underlying:'US Equities',multiplier:1,sector:'US Market'},
 TQQQ:{type:'ETF',underlying:'QQQ',multiplier:3,sector:'Nasdaq 100'},SQQQ:{type:'ETF',underlying:'QQQ',multiplier:-3,sector:'Nasdaq 100'},QLD:{type:'ETF',underlying:'QQQ',multiplier:2,sector:'Nasdaq 100'},QID:{type:'ETF',underlying:'QQQ',multiplier:-2,sector:'Nasdaq 100'},UPRO:{type:'ETF',underlying:'SPY',multiplier:3,sector:'US Market'},SPXU:{type:'ETF',underlying:'SPY',multiplier:-3,sector:'US Market'},TNA:{type:'ETF',underlying:'IWM',multiplier:3,sector:'Small Caps'},TZA:{type:'ETF',underlying:'IWM',multiplier:-3,sector:'Small Caps'},
 SMH:{type:'ETF',underlying:'Semiconductors',multiplier:1,sector:'Semiconductors'},SOXX:{type:'ETF',underlying:'Semiconductors',multiplier:1,sector:'Semiconductors'},SOXL:{type:'ETF',underlying:'Semiconductors',multiplier:3,sector:'Semiconductors'},SOXS:{type:'ETF',underlying:'Semiconductors',multiplier:-3,sector:'Semiconductors'},
 XLK:{type:'ETF',underlying:'Technology',multiplier:1,sector:'Technology'},XLF:{type:'ETF',underlying:'Financials',multiplier:1,sector:'Financials'},XLE:{type:'ETF',underlying:'Energy',multiplier:1,sector:'Energy'},XLV:{type:'ETF',underlying:'Health Care',multiplier:1,sector:'Health Care'},XLY:{type:'ETF',underlying:'Consumer Discretionary',multiplier:1,sector:'Consumer Discretionary'},XLP:{type:'ETF',underlying:'Consumer Staples',multiplier:1,sector:'Consumer Staples'},XLI:{type:'ETF',underlying:'Industrials',multiplier:1,sector:'Industrials'},XLB:{type:'ETF',underlying:'Materials',multiplier:1,sector:'Materials'},XLU:{type:'ETF',underlying:'Utilities',multiplier:1,sector:'Utilities'},XLRE:{type:'ETF',underlying:'Real Estate',multiplier:1,sector:'Real Estate'},XLC:{type:'ETF',underlying:'Communication Services',multiplier:1,sector:'Communication Services'},
 XBI:{type:'ETF',underlying:'Biotech',multiplier:1,sector:'Biotech'},IBB:{type:'ETF',underlying:'Biotech',multiplier:1,sector:'Biotech'},XRT:{type:'ETF',underlying:'Retail',multiplier:1,sector:'Retail'},XHB:{type:'ETF',underlying:'Homebuilders',multiplier:1,sector:'Homebuilders'},ITB:{type:'ETF',underlying:'Homebuilders',multiplier:1,sector:'Homebuilders'},NAIL:{type:'ETF',underlying:'Homebuilders',multiplier:3,sector:'Homebuilders'},XOP:{type:'ETF',underlying:'Oil & Gas E&P',multiplier:1,sector:'Energy'},OIH:{type:'ETF',underlying:'Oil Services',multiplier:1,sector:'Energy'},XME:{type:'ETF',underlying:'Metals & Mining',multiplier:1,sector:'Materials'},
 KWEB:{type:'ETF',underlying:'China Internet',multiplier:1,sector:'China Internet'},FXI:{type:'ETF',underlying:'China Large Cap',multiplier:1,sector:'China'},MCHI:{type:'ETF',underlying:'China',multiplier:1,sector:'China'},EEM:{type:'ETF',underlying:'Emerging Markets',multiplier:1,sector:'International'},EFA:{type:'ETF',underlying:'Developed ex-US',multiplier:1,sector:'International'},EWY:{type:'ETF',underlying:'South Korea',multiplier:1,sector:'International'},EWZ:{type:'ETF',underlying:'Brazil',multiplier:1,sector:'International'},EWJ:{type:'ETF',underlying:'Japan',multiplier:1,sector:'International'},INDA:{type:'ETF',underlying:'India',multiplier:1,sector:'International'},
 GLD:{type:'ETF',underlying:'Gold',multiplier:1,sector:'Commodities'},SLV:{type:'ETF',underlying:'Silver',multiplier:1,sector:'Commodities'},GDX:{type:'ETF',underlying:'Gold Miners',multiplier:1,sector:'Materials'},GDXJ:{type:'ETF',underlying:'Junior Gold Miners',multiplier:1,sector:'Materials'},USO:{type:'ETF',underlying:'Crude Oil',multiplier:1,sector:'Commodities'},UNG:{type:'ETF',underlying:'Natural Gas',multiplier:1,sector:'Commodities'},
 TLT:{type:'ETF',underlying:'Long Treasuries',multiplier:1,sector:'Rates'},IEF:{type:'ETF',underlying:'Treasuries',multiplier:1,sector:'Rates'},SHY:{type:'ETF',underlying:'Short Treasuries',multiplier:1,sector:'Rates'},HYG:{type:'ETF',underlying:'High Yield Credit',multiplier:1,sector:'Credit'},LQD:{type:'ETF',underlying:'Investment Grade Credit',multiplier:1,sector:'Credit'},
 ARKK:{type:'ETF',underlying:'Disruptive Innovation',multiplier:1,sector:'Growth'},ARKG:{type:'ETF',underlying:'Genomics',multiplier:1,sector:'Biotech'},ARKW:{type:'ETF',underlying:'Next Gen Internet',multiplier:1,sector:'Technology'},ARKF:{type:'ETF',underlying:'Fintech',multiplier:1,sector:'Financials'},ARKQ:{type:'ETF',underlying:'Autonomous Tech',multiplier:1,sector:'Technology'},
 IBIT:{type:'ETF',underlying:'Bitcoin',multiplier:1,sector:'Crypto'},FBTC:{type:'ETF',underlying:'Bitcoin',multiplier:1,sector:'Crypto'},BITO:{type:'ETF',underlying:'Bitcoin Futures',multiplier:1,sector:'Crypto'},ETHA:{type:'ETF',underlying:'Ethereum',multiplier:1,sector:'Crypto'},BSOL:{type:'ETF',underlying:'Solana',multiplier:1,sector:'Crypto'},
 IGV:{type:'ETF',underlying:'Software',multiplier:1,sector:'Technology'},CIBR:{type:'ETF',underlying:'Cybersecurity',multiplier:1,sector:'Technology'},HACK:{type:'ETF',underlying:'Cybersecurity',multiplier:1,sector:'Technology'},SKYY:{type:'ETF',underlying:'Cloud Computing',multiplier:1,sector:'Technology'},CLOU:{type:'ETF',underlying:'Cloud Computing',multiplier:1,sector:'Technology'},BOTZ:{type:'ETF',underlying:'Robotics & AI',multiplier:1,sector:'Technology'},AIQ:{type:'ETF',underlying:'AI & Technology',multiplier:1,sector:'Technology'},
 KRE:{type:'ETF',underlying:'Regional Banks',multiplier:1,sector:'Financials'},KBE:{type:'ETF',underlying:'Banks',multiplier:1,sector:'Financials'},VNQ:{type:'ETF',underlying:'Real Estate',multiplier:1,sector:'Real Estate'},JETS:{type:'ETF',underlying:'Airlines',multiplier:1,sector:'Industrials'},TAN:{type:'ETF',underlying:'Solar',multiplier:1,sector:'Energy'},ICLN:{type:'ETF',underlying:'Clean Energy',multiplier:1,sector:'Energy'},RSP:{type:'ETF',underlying:'S&P 500 Equal Weight',multiplier:1,sector:'US Market'},SCHD:{type:'ETF',underlying:'US Dividend Equities',multiplier:1,sector:'US Market'},JEPI:{type:'ETF',underlying:'US Equity Income',multiplier:1,sector:'US Market'},JEPQ:{type:'ETF',underlying:'Nasdaq Equity Income',multiplier:1,sector:'Nasdaq 100'}
};

const CONFIRM={
 NVDA:['SMH','SOXX','QQQ'],AMD:['SMH','SOXX','QQQ'],AVGO:['SMH','SOXX','QQQ'],MU:['SMH','SOXX','QQQ'],INTC:['SMH','SOXX','QQQ'],
 AAPL:['XLK','QQQ'],MSFT:['XLK','QQQ'],META:['XLC','QQQ'],GOOGL:['XLC','QQQ'],GOOG:['XLC','QQQ'],AMZN:['XLY','QQQ'],TSLA:['XLY','QQQ'],
 JPM:['XLF','SPY'],BAC:['XLF','SPY'],GS:['XLF','SPY'],XOM:['XLE','SPY'],CVX:['XLE','SPY'],LLY:['XLV','SPY'],UNH:['XLV','SPY']
};

const FIELD_ALIASES={
 symbol:['Symbol','Underlying','Underlying Symbol','Ticker','Ticker Symbol'],
 type:['Type','Put/Call','Option Type','Call/Put','put_call'],
 side:['Side','Execution Side','Trade Side','Bid/Ask','At Bid/Ask','execution_side'],
 strike:['Strike','Strike Price','strike_price','strike'],
 expiry:['Expires','Expiration','Expiration Date','Exp Date','Expiry','expiry_date'],
 dte:['DTE','Days to Expiration','Days To Expiration','dte'],
 premium:['Premium','Total Premium','total_premium','Notional','Trade Premium'],
 oi:['Open Int','Open Interest','OI','open_interest'],
 volume:['Volume','Vol','volume'],
 size:['Size','Trade Size','Contracts','Qty','Quantity','size'],
 delta:['Delta','delta'],
 iv:['IV','Implied Volatility','Volatility','iv'],
 price:['Trade','Trade Price','Price','Fill Price','trade_price'],
 bid:['Bid','Bid Price','bid'],
 ask:['Ask','Ask Price','ask'],
 time:['Time','Timestamp','Date/Time','Trade Time','Trade Date/Time','Datetime','time'],
 code:['Transaction Code','Opening Action','Position Effect','Open/Close','Action','Code','transaction_code'],
 tradeId:['Trade ID','TradeId','ID','Sequence','Sequence ID','Option Trade ID'],
 assetType:['Asset Type','Security Type','Underlying Type','Instrument Type'],
 condition:['Condition','Trade Condition','Exchange','Venue']
};

const normKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const maybeNumber=v=>{
 if(v==null||String(v).trim()==='') return null;
 let s=String(v).trim().replace(/[$,%\s]/g,'').replace(/,/g,'');
 if(/^\(.*\)$/.test(s)) s='-'+s.slice(1,-1);
 const x=Number(s);return Number.isFinite(x)?x:null;
};
const num=v=>maybeNumber(v)??0;
function pick(r,...aliases){
 for(const k of aliases){if(r[k]!=null&&String(r[k]).trim()!=='')return String(r[k]).trim();}
 const ci=r._ci||{};
 for(const k of aliases){const v=ci[normKey(k)];if(v!=null&&String(v).trim()!=='')return String(v).trim();}
 return'';
}
function field(r,key){return pick(r,...(FIELD_ALIASES[key]||[key]));}

export function parseCSV(csv){
 const raw=String(csv||'').replace(/^\uFEFF/,'');
 const lines=raw.split(/\r?\n/).filter(x=>x.trim()&&!/Downloaded from Barchart/i.test(x));
 if(lines.length<2) throw new Error('The CSV has no data rows.');
 const split=line=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out.map(x=>x.trim());};
 const headers=split(lines[0]).map(h=>h.replace(/^"|"$/g,'').trim());
 const rows=lines.slice(1).map((line,i)=>{
   const vals=split(line),r={_row:i+2,_ci:{}};
   headers.forEach((h,j)=>{const v=vals[j]??'';r[h]=v;r._ci[normKey(h)]=v;});
   return r;
 }).filter(r=>field(r,'symbol'));
 rows._meta={headers,source:'Barchart CSV',inputLines:lines.length-1};
 return rows;
}

function parseType(v){const x=String(v||'').trim().toUpperCase();if(x==='P'||x.startsWith('PUT'))return'PUT';if(x==='C'||x.startsWith('CALL'))return'CALL';return'UNKNOWN';}
function tx(code){const x=String(code||'').toUpperCase().replace(/[^A-Z]/g,'');if(x.includes('BTO')||x.includes('BUYTOOPEN'))return'BTO';if(x.includes('STO')||x.includes('SELLTOOPEN'))return'STO';if(x.includes('BTC')||x.includes('BUYTOCLOSE'))return'BTC';if(x.includes('STC')||x.includes('SELLTOCLOSE'))return'STC';return'UNKNOWN';}
function side(v){const x=String(v||'').trim().toUpperCase();if(x.includes('ASK')||x==='A')return'ASK';if(x.includes('BID')||x==='B')return'BID';if(x.includes('MID')||x.includes('MIDPOINT')||x==='M')return'MID';return'UNKNOWN';}
function direction(t){
 if(t.tx==='BTO') return t.type==='CALL'?'BULLISH':'BEARISH';
 if(t.tx==='STO') return t.type==='CALL'?'BEARISH':'BULLISH';
 if(t.tx==='BTC') return t.type==='CALL'?'BULLISH':'BEARISH'; // reduction of an existing short position, not new opening risk
 if(t.tx==='STC') return t.type==='CALL'?'BEARISH':'BULLISH'; // reduction of an existing long position, not new opening risk
 if(t.side==='ASK') return t.type==='CALL'?'BULLISH':'BEARISH';
 if(t.side==='BID') return t.type==='CALL'?'BEARISH':'BULLISH';
 return'UNKNOWN';
}
function intent(t){
 if(t.tx==='BTO') return t.type==='CALL'?'NEW_BULLISH':'NEW_BEARISH';
 if(t.tx==='STO') return t.type==='CALL'?'NEW_BEARISH':'NEW_BULLISH';
 if(t.tx==='BTC') return t.type==='CALL'?'REDUCES_BEARISH':'REDUCES_BULLISH';
 if(t.tx==='STC') return t.type==='CALL'?'REDUCES_BULLISH':'REDUCES_BEARISH';
 if(t.side==='ASK') return t.type==='CALL'?'INFERRED_BULLISH':'INFERRED_BEARISH';
 if(t.side==='BID') return t.type==='CALL'?'INFERRED_BEARISH':'INFERRED_BULLISH';
 return'AMBIGUOUS';
}
function positionEffect(t){return ['BTO','STO'].includes(t.tx)?'OPENING':['BTC','STC'].includes(t.tx)?'CLOSING':'UNKNOWN';}

function canonical(r){
 const symbol=field(r,'symbol').toUpperCase().replace(/\s/g,'');
 const type=parseType(field(r,'type'));
 const tradeSide=side(field(r,'side'));
 const code=field(r,'code');
 const tradePrice=maybeNumber(field(r,'price'));
 const size=maybeNumber(field(r,'size'));
 const premiumRaw=maybeNumber(field(r,'premium'));
 const computedPremium=premiumRaw==null&&tradePrice!=null&&size!=null?tradePrice*size*100:null;
 const dte=maybeNumber(field(r,'dte'));
 const forcedAsset=String(r._forcedAssetType||'').toUpperCase();
 const csvAsset=field(r,'assetType');
 const t={
   id:r._rowId||`${r._batchKind||'auto'}:${r._row}`,row:r._row,batchKind:r._batchKind||'auto',batchFile:r._batchFile||'',symbol,type,side:tradeSide,tx:tx(code),strike:num(field(r,'strike')),expiry:field(r,'expiry').slice(0,10),dte,
   premium:premiumRaw??computedPremium??0,premiumSource:premiumRaw!=null?'CSV':computedPremium!=null?'COMPUTED':'MISSING',
   oi:num(field(r,'oi')),volume:num(field(r,'volume')),size:size??0,delta:Math.abs(num(field(r,'delta'))),iv:maybeNumber(field(r,'iv')),
   price:tradePrice??0,bid:num(field(r,'bid')),ask:num(field(r,'ask')),time:field(r,'time'),code,tradeId:field(r,'tradeId'),assetTypeHint:forcedAsset||csvAsset,assetTypeSource:forcedAsset?'UPLOAD':csvAsset?'CSV':'NONE',condition:field(r,'condition')
 };
 t.direction=direction(t);t.intent=intent(t);t.positionEffect=positionEffect(t);t.positionEffectSource=t.tx==='UNKNOWN'?'UNKNOWN':'EXPLICIT';
 return t;
}

function fingerprint(t){
 if(t.tradeId) return `ID|${t.symbol}|${t.tradeId}`;
 if(!t.time) return null; // conservative: do not discard identical-looking rows when the export lacks timestamps/IDs
 return [t.symbol,t.type,t.strike,t.expiry,t.side,t.tx,t.size,t.premium,t.price,t.time].join('|');
}
function annotateDuplicates(trades){const seen=new Map();return trades.map(t=>{const k=fingerprint(t);if(!k)return{...t,duplicate:false,duplicateOf:null};const duplicate=seen.has(k);if(!duplicate)seen.set(k,t.id);return{...t,duplicate,duplicateOf:duplicate?seen.get(k):null};});}
function normalizedTime(t){return String(t.time||'').trim().replace(/\.\d+$/,'');}
function annotateMultiLeg(trades){
 const groups=new Map();
 for(const t of trades){
   if(t.duplicate||!t.time||!t.size)continue;
   const tm=normalizedTime(t);const key=[t.symbol,tm,t.size].join('|');
   if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);
 }
 const legInfo=new Map();let gid=1;
 for(const arr of groups.values()){
   const unique=new Set(arr.map(t=>`${t.type}|${t.strike}|${t.expiry}`));if(arr.length<2||unique.size<2||arr.length>8)continue;
   let strategy='COMPLEX';const types=new Set(arr.map(t=>t.type)),exps=new Set(arr.map(t=>t.expiry)),strikes=new Set(arr.map(t=>t.strike));
   if(types.size===1&&exps.size===1&&strikes.size>1)strategy='VERTICAL';
   else if(types.size===2&&exps.size===1&&strikes.size===1)strategy='STRADDLE';
   else if(types.size===2&&exps.size===1&&strikes.size>1)strategy='STRANGLE/COMBO';
   else if(types.size===1&&strikes.size===1&&exps.size>1)strategy='CALENDAR/ROLL';
   const dirSet=new Set(arr.map(t=>t.direction).filter(x=>x!=='UNKNOWN'));
   const ambiguity=dirSet.size>1?'HIGH':'MEDIUM';
   for(const t of arr)legInfo.set(t.id,{group:`ML-${gid}`,strategy,legs:arr.length,groupAmbiguity:ambiguity});gid++;
 }
 return trades.map(t=>({...t,...(legInfo.get(t.id)||{group:null,strategy:'SINGLE',legs:1,groupAmbiguity:'NONE'})}));
}
function effectWeight(t){if(t.positionEffect==='OPENING')return 1;if(t.positionEffect==='CLOSING')return .38;return .72;}
function conviction(t){
 if(t.direction==='UNKNOWN'||t.duplicate)return 0;
 let c=.40;
 if(t.side==='ASK'||t.side==='BID')c+=.15;
 if(t.tx!=='UNKNOWN')c+=.07;
 if(t.positionEffect==='OPENING')c+=.20; else if(t.positionEffect==='CLOSING')c-=.14;
 const voi=t.oi>0?t.volume/t.oi:0;if(voi>=2)c+=.10;else if(voi>=1)c+=.06;
 if(t.premium>=1_000_000)c+=.05;
 if(t.group)c-=t.groupAmbiguity==='HIGH'?.14:.09;
 if(t.premiumSource==='COMPUTED')c-=.03;
 return Math.max(.08,Math.min(.98,c));
}
function gammaProxy(t){
 if(t.dte==null||!t.delta)return{atm:null,dteW:null,impact:0,regime:'UNKNOWN'};
 const atm=Math.max(0,1-Math.abs(t.delta-.5)*2),dteW=1/(1+Math.max(0,t.dte)/30),impact=(t.size||1)*100*t.delta*atm*dteW;
 const regime=t.side==='ASK'?'AMPLIFYING':t.side==='BID'?'SUPPRESSING':'UNKNOWN';return{atm,dteW,impact,regime};
}
function legacyFor(list){let bull=0,bear=0;for(const t of list){if(t.duplicate)continue;if((t.side==='ASK'&&t.type==='CALL')||(t.side==='BID'&&t.type==='PUT'))bull+=t.premium;if((t.side==='ASK'&&t.type==='PUT')||(t.side==='BID'&&t.type==='CALL'))bear+=t.premium;}const d=bull+bear;const score=d?Math.round(100*(bull-bear)/d):0;return{score,bias:score>12?'BULLISH':score<-12?'BEARISH':'MIXED'};}
const sumPremium=(arr,pred)=>arr.filter(pred).reduce((s,t)=>s+t.premium,0);
const pct=(a,b)=>b?Math.round(100*a/b):0;
function dteBucket(t){if(t.dte==null)return'UNKNOWN';if(t.dte===0)return'0DTE';if(t.dte<=7)return'1-7D';if(t.dte<=30)return'8-30D';if(t.dte<=90)return'31-90D';return'90D+';}
function breakdown(list,eligiblePrem){
 const by=(key,values)=>Object.fromEntries(values.map(v=>[v,{premium:sumPremium(list,t=>t[key]===v),share:pct(sumPremium(list,t=>t[key]===v),eligiblePrem)}]));
 const buckets=['0DTE','1-7D','8-30D','31-90D','90D+','UNKNOWN'];
 const dte=Object.fromEntries(buckets.map(v=>{const p=sumPremium(list,t=>dteBucket(t)===v);return[v,{premium:p,share:pct(p,eligiblePrem),rows:list.filter(t=>dteBucket(t)===v).length}];}));
 return{
   execution:by('side',['ASK','BID','MID','UNKNOWN']),position:by('positionEffect',['OPENING','CLOSING','UNKNOWN']),type:by('type',['CALL','PUT']),direction:by('direction',['BULLISH','BEARISH','UNKNOWN']),dte
 };
}
function normalizeAssetHint(v){const x=String(v||'').toUpperCase();if(x.includes('ETF')||x.includes('FUND'))return'ETF';if(x.includes('STOCK')||x.includes('EQUITY')||x.includes('COMMON'))return'STOCK';return null;}
function resolveAsset(symbol,list){
 const uploadHints=new Set(list.filter(t=>t.assetTypeSource==='UPLOAD').map(t=>normalizeAssetHint(t.assetTypeHint)).filter(Boolean));
 if(uploadHints.size>1)return{type:'UNKNOWN',underlying:symbol,multiplier:1,sector:'Unknown',classificationSource:'UPLOAD_CONFLICT',classificationConfidence:'LOW'};
 if(uploadHints.size===1){const type=[...uploadHints][0],known=ETF_META[symbol];return type==='ETF'?{...(known||{underlying:symbol,multiplier:1,sector:'Unknown'}),type:'ETF',classificationSource:'UPLOAD',classificationConfidence:'HIGH'}:{type:'STOCK',underlying:symbol,multiplier:1,sector:'Unknown',classificationSource:'UPLOAD',classificationConfidence:'HIGH'};}
 const csvHints=new Set(list.filter(t=>t.assetTypeSource==='CSV').map(t=>normalizeAssetHint(t.assetTypeHint)).filter(Boolean));
 if(csvHints.size>1)return{type:'UNKNOWN',underlying:symbol,multiplier:1,sector:'Unknown',classificationSource:'CSV_CONFLICT',classificationConfidence:'LOW'};
 if(csvHints.size===1){const type=[...csvHints][0],known=ETF_META[symbol];return type==='ETF'?{...(known||{underlying:symbol,multiplier:1,sector:'Unknown'}),type:'ETF',classificationSource:'CSV',classificationConfidence:'HIGH'}:{type:'STOCK',underlying:symbol,multiplier:1,sector:'Unknown',classificationSource:'CSV',classificationConfidence:'HIGH'};}
 if(ETF_META[symbol])return{...ETF_META[symbol],classificationSource:'REGISTRY',classificationConfidence:'HIGH'};
 return{type:'UNKNOWN',underlying:symbol,multiplier:1,sector:'Unknown',classificationSource:'UNVERIFIED',classificationConfidence:'LOW'};
}
function tickerDataQuality(list){
 const prem=list.reduce((s,t)=>s+t.premium,0)||1;
 const share=pred=>Math.round(100*list.filter(pred).reduce((s,t)=>s+t.premium,0)/prem);
 return{
   sideCoverage:share(t=>t.side!=='UNKNOWN'),timestampCoverage:share(t=>!!t.time),dteCoverage:share(t=>t.dte!=null),deltaCoverage:share(t=>!!t.delta),oiCoverage:share(t=>t.oi>0),volumeCoverage:share(t=>t.volume>0),explicitPositionCoverage:share(t=>t.tx!=='UNKNOWN'),premiumCoverage:share(t=>t.premium>0)
 };
}
function globalAudit(rows,trades,rejected){
 const headers=rows._meta?.headers||[];
 const detected={};
 for(const [key,aliases] of Object.entries(FIELD_ALIASES)){
   const aliasNorm=new Set(aliases.map(normKey));detected[key]=headers.find(h=>aliasNorm.has(normKey(h)))||null;
 }
 const valid=trades.filter(t=>!t.duplicate);const totalPrem=valid.reduce((s,t)=>s+t.premium,0)||1;
 const premShare=pred=>Math.round(100*valid.filter(pred).reduce((s,t)=>s+t.premium,0)/totalPrem);
 const warnings=[];
 if(!detected.side)warnings.push('Execution-side column was not detected; bid/ask classification will be weak.');
 if(!detected.time)warnings.push('Timestamp column was not detected; conservative dedupe and multi-leg reconstruction are limited.');
 if(!detected.code)warnings.push('No explicit BTO/STO/BTC/STC-compatible column detected; opening/closing remains unknown unless the export contains such values elsewhere.');
 if(!detected.premium)warnings.push('Premium column was not detected; premium is computed only when trade price and size are available.');
 if(premShare(t=>t.tx!=='UNKNOWN')<20)warnings.push('Explicit opening/closing coverage is low. The engine will not pretend inferred BTO/STO is known.');
 return{headers,detected,inputRows:rows.length,canonicalTrades:trades.length,rejected,duplicateRows:trades.filter(t=>t.duplicate).length,premiumFieldCoverage:{side:premShare(t=>t.side!=='UNKNOWN'),time:premShare(t=>!!t.time),dte:premShare(t=>t.dte!=null),delta:premShare(t=>!!t.delta),openInterest:premShare(t=>t.oi>0),volume:premShare(t=>t.volume>0),explicitPosition:premShare(t=>t.tx!=='UNKNOWN'),premium:premShare(t=>t.premium>0)},warnings};
}
function groupSummaries(list){
 const m=new Map();for(const t of list.filter(t=>t.group)){if(!m.has(t.group))m.set(t.group,[]);m.get(t.group).push(t);}
 return [...m.entries()].map(([group,legs])=>({group,strategy:legs[0].strategy,ambiguity:legs[0].groupAmbiguity,legs:legs.length,premium:legs.reduce((s,t)=>s+t.premium,0),contracts:legs.map(t=>`${t.expiry} ${t.strike}${t.type[0]} ${t.side} ${t.tx}`)})).sort((a,b)=>b.premium-a.premium);
}

export function analyzeRows(rows){
 const all=rows.map(canonical);const rejected={missingSymbol:all.filter(t=>!t.symbol).length,unknownType:all.filter(t=>t.type==='UNKNOWN').length,negativeDte:all.filter(t=>t.dte!=null&&t.dte<0).length};
 let trades=all.filter(t=>t.symbol&&['CALL','PUT'].includes(t.type)&&(t.dte==null||t.dte>=0)); // includes true 0DTE, keeps unknown DTE instead of mislabeling it as zero
 trades=annotateMultiLeg(annotateDuplicates(trades)).map(t=>{const g=gammaProxy(t),conv=conviction(t),eW=effectWeight(t);return{...t,conviction:conv,effectWeight:eW,weightedPremium:t.premium*conv*eW,...g};});
 const map=new Map();for(const t of trades){if(!map.has(t.symbol))map.set(t.symbol,[]);map.get(t.symbol).push(t);}
 const interim=[];
 for(const [symbol,list] of map){
   const clean=list.filter(t=>!t.duplicate),eligiblePrem=clean.reduce((s,t)=>s+t.premium,0),classified=clean.filter(t=>t.direction!=='UNKNOWN'&&t.premium>0);
   const directionalPrem=classified.reduce((s,t)=>s+t.premium,0),bull=classified.filter(t=>t.direction==='BULLISH').reduce((s,t)=>s+t.weightedPremium,0),bear=classified.filter(t=>t.direction==='BEARISH').reduce((s,t)=>s+t.weightedPremium,0),den=bull+bear;
   const raw=den?(bull-bear)/den:0,core=Math.round(raw*100);
   const openingPrem=sumPremium(clean,t=>t.positionEffect==='OPENING'),closingPrem=sumPremium(clean,t=>t.positionEffect==='CLOSING');
   const openCoverage=eligiblePrem?openingPrem/eligiblePrem:0,executionCoverage=eligiblePrem?sumPremium(clean,t=>['ASK','BID'].includes(t.side))/eligiblePrem:0,coverage=eligiblePrem?directionalPrem/eligiblePrem:0;
   const avgConv=directionalPrem?classified.reduce((s,t)=>s+t.conviction*t.premium,0)/directionalPrem:0;
   const multiShare=eligiblePrem?sumPremium(clean,t=>!!t.group)/eligiblePrem:0;
   const sortedByPrem=[...clean].sort((a,b)=>b.premium-a.premium),top1=eligiblePrem?(sortedByPrem[0]?.premium||0)/eligiblePrem:0,top3=eligiblePrem?sortedByPrem.slice(0,3).reduce((s,t)=>s+t.premium,0)/eligiblePrem:0;
   let confidence=Math.round(100*(.32*coverage+.24*avgConv+.18*executionCoverage+.16*openCoverage+.10*(1-Math.min(1,multiShare))));
   if(top1>.55)confidence-=8;else if(top1>.35)confidence-=4;
   confidence=Math.max(5,Math.min(95,confidence));
   const gA=clean.filter(t=>t.regime==='AMPLIFYING').reduce((s,t)=>s+t.impact*t.conviction,0),gS=clean.filter(t=>t.regime==='SUPPRESSING').reduce((s,t)=>s+t.impact*t.conviction,0),gD=gA+gS,gBal=gD?(gA-gS)/gD:0,gammaContext=!gD?'UNKNOWN':gBal>.15?'AMPLIFYING':gBal<-.15?'SUPPRESSING':'MIXED';
   const legacy=legacyFor(list),asset=resolveAsset(symbol,list),bdown=breakdown(clean,eligiblePrem),quality=tickerDataQuality(clean),groups=groupSummaries(clean);
   const unusualPremium=sumPremium(clean,t=>t.oi>0&&t.volume/t.oi>=1),unusualShare=eligiblePrem?unusualPremium/eligiblePrem:0;
   interim.push({symbol,asset,bias:core>15?'BULLISH':core<-15?'BEARISH':'MIXED',coreScore:core,score:core,confidence,coverage:Math.round(coverage*100),openingCoverage:Math.round(openCoverage*100),closingCoverage:Math.round(eligiblePrem?closingPrem/eligiblePrem*100:0),executionCoverage:Math.round(executionCoverage*100),gammaContext,gammaBalance:gBal,eligiblePremium:eligiblePrem,bullishWeighted:bull,bearishWeighted:bear,duplicates:list.filter(t=>t.duplicate).length,multiLegTrades:clean.filter(t=>t.group).length,multiLegGroups:groups.length,zeroDTE:clean.filter(t=>t.dte===0).length,unknownDTE:clean.filter(t=>t.dte==null).length,legacy,trades:[...clean].sort((a,b)=>b.weightedPremium-a.weightedPremium),breakdown:bdown,dataQuality:quality,groupSummaries:groups,concentration:{top1:Math.round(top1*100),top3:Math.round(top3*100)},unusualShare:Math.round(unusualShare*100)});
 }
 const bySym=Object.fromEntries(interim.map(x=>[x.symbol,x]));
 for(const s of interim){
   const peers=(CONFIRM[s.symbol]||[]).map(x=>bySym[x]).filter(Boolean);let sector=0;
   if(peers.length&&s.coreScore!==0){const targetSign=Math.sign(s.coreScore)*(s.asset.multiplier<0?-1:1);const vals=peers.map(p=>Math.sign(p.coreScore)*(p.asset.multiplier<0?-1:1));sector=vals.reduce((a,v)=>a+(v===targetSign?1:v===-targetSign?-1:0),0)/vals.length;}
   const opening=s.openingCoverage/100,execution=s.executionCoverage/100,gamma=Math.min(1,Math.abs(s.gammaBalance)),unusual=s.unusualShare/100;
   const sign=Math.sign(s.coreScore),mag=Math.abs(s.coreScore),quality=.38*(mag/100)+.15*opening+.15*execution+.10*unusual+.08*gamma+.09*Math.max(0,sector)+.05*(s.coverage/100);
   s.score=Math.round(sign*Math.min(100,quality*100));s.bias=s.score>18?'BULLISH':s.score<-18?'BEARISH':'MIXED';
   s.sectorConfirmation=peers.length?{value:sector,peers:peers.map(p=>p.symbol),label:sector>.2?'CONFIRMED':sector<-.2?'CONFLICTING':'MIXED'}:{value:0,peers:[],label:'NO DATA'};
   s.confidence=Math.max(5,Math.min(95,Math.round(s.confidence+(sector>.2?6:sector<-.2?-8:0))));
   s.signalQuality=Math.round(.40*s.confidence+.30*s.coverage+.30*Math.abs(s.score));
   s.aiRecommended=s.confidence>=40&&s.coverage>=30&&Math.abs(s.score)>=20&&s.bias!=='MIXED';
 }
 const dataAudit=globalAudit(rows,trades,rejected);
 const assetCounts={ETF:interim.filter(x=>x.asset.type==='ETF').length,STOCK:interim.filter(x=>x.asset.type==='STOCK').length,UNKNOWN:interim.filter(x=>x.asset.type==='UNKNOWN').length};
 const sourceCounts={};for(const x of interim)sourceCounts[x.asset.classificationSource||'UNKNOWN']=(sourceCounts[x.asset.classificationSource||'UNKNOWN']||0)+1;
 dataAudit.assetClassification={...assetCounts,sources:sourceCounts,unknownTickers:interim.filter(x=>x.asset.type==='UNKNOWN').map(x=>x.symbol),batches:rows._meta?.batches||[]};
 if(assetCounts.UNKNOWN)dataAudit.warnings.push(`${assetCounts.UNKNOWN} ticker(s) have unverified asset type and are kept OUT of both Stocks and ETFs until classified by a dedicated upload, CSV field, or registry.`);
 return{engineVersion:ENGINE_VERSION,rawRows:rows.length,trades,duplicates:trades.filter(t=>t.duplicate).length,multiLegGroups:new Set(trades.filter(t=>t.group).map(t=>t.group)).size,dataAudit,tickers:interim.sort((a,b)=>b.signalQuality-a.signalQuality||b.eligiblePremium-a.eligiblePremium)};
}

function evidenceRow(t){return{id:t.id,row:t.row,batch:t.batchKind,batchFile:t.batchFile,type:t.type,strike:t.strike,expiry:t.expiry,dte:t.dte,side:t.side,transaction:t.tx,positionEffect:t.positionEffect,positionEffectSource:t.positionEffectSource,intent:t.intent,direction:t.direction,premium:t.premium,premiumSource:t.premiumSource,size:t.size,tradePrice:t.price,bid:t.bid||null,ask:t.ask||null,openInterest:t.oi,volume:t.volume,volOi:t.oi?+(t.volume/t.oi).toFixed(2):null,delta:t.delta||null,iv:t.iv,conviction:Math.round(t.conviction*100),effectWeight:t.effectWeight,multiLegGroup:t.group,strategy:t.strategy,groupAmbiguity:t.groupAmbiguity,time:t.time||null,condition:t.condition||null};}
export function packetFor(s,quote){
 const top=[...s.trades].sort((a,b)=>b.weightedPremium-a.weightedPremium).slice(0,24);
 const unusual=[...s.trades].filter(t=>t.oi>0&&t.volume/t.oi>=1).sort((a,b)=>(b.volume/(b.oi||1))-(a.volume/(a.oi||1))).slice(0,12);
 const limitations=[];
 if(s.dataQuality.explicitPositionCoverage<40)limitations.push(`Explicit opening/closing coverage is ${s.dataQuality.explicitPositionCoverage}%; do not claim BTO/STO where it is unknown.`);
 if(s.dataQuality.timestampCoverage<50)limitations.push(`Timestamp coverage is ${s.dataQuality.timestampCoverage}%; multi-leg reconstruction and dedupe are incomplete.`);
 if(s.concentration.top1>40)limitations.push(`The largest row represents ${s.concentration.top1}% of ticker premium, so the signal is concentrated.`);
 if(s.sectorConfirmation.label==='NO DATA')limitations.push('No related sector/index peer was present in this upload for cross-confirmation.');
 return{
   engineVersion:ENGINE_VERSION,symbol:s.symbol,asset:s.asset,
   deterministic:{bias:s.bias,smartMoneyScore:s.score,coreDirectionalScore:s.coreScore,confidence:s.confidence,coverage:s.coverage,signalQuality:s.signalQuality,aiRecommended:s.aiRecommended,gammaContext:s.gammaContext,gammaBalance:+s.gammaBalance.toFixed(3),sectorConfirmation:s.sectorConfirmation,legacy:s.legacy},
   flowTotals:{eligiblePremium:s.eligiblePremium,bullishWeighted:s.bullishWeighted,bearishWeighted:s.bearishWeighted,openingCoverage:s.openingCoverage,closingCoverage:s.closingCoverage,executionCoverage:s.executionCoverage,unusualPremiumShare:s.unusualShare,zeroDTERows:s.zeroDTE,unknownDTERows:s.unknownDTE,multiLegRows:s.multiLegTrades,multiLegGroups:s.multiLegGroups,duplicatesRemoved:s.duplicates,concentration:s.concentration},
   flowBreakdown:s.breakdown,dataQuality:s.dataQuality,limitations,quote:quote||null,
   topEvidence:top.map(evidenceRow),unusualEvidence:unusual.map(evidenceRow),multiLegGroups:s.groupSummaries.slice(0,10)
 };
}
