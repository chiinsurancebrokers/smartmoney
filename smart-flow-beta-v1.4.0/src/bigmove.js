export const BIG_MOVE_UNIVERSE=[
 {symbol:'SOXL',name:'Direxion Daily Semiconductor Bull 3X',theme:'Semiconductors / AI',peers:['SMH','SOXX'],macro:'Semiconductor earnings, capex and risk-on growth recovery'},
 {symbol:'TQQQ',name:'ProShares UltraPro QQQ',theme:'Nasdaq-100 / Growth',peers:['QQQ','XLK'],macro:'Falling yields, growth risk-on and broad Nasdaq breadth'},
 {symbol:'NAIL',name:'Direxion Daily Homebuilders & Supplies Bull 3X',theme:'US Housing',peers:['XHB','ITB'],macro:'Lower mortgage rates, housing demand and homebuilder margins'},
 {symbol:'LABU',name:'Direxion Daily S&P Biotech Bull 3X',theme:'Biotech',peers:['XBI','IBB'],macro:'Biotech risk appetite, funding conditions and clinical catalysts'},
 {symbol:'FAS',name:'Direxion Daily Financial Bull 3X',theme:'Financials',peers:['XLF','KRE'],macro:'Yield-curve normalization, credit quality and loan growth'},
 {symbol:'TNA',name:'Direxion Daily Small Cap Bull 3X',theme:'US Small Caps',peers:['IWM','VTWO'],macro:'Easier financial conditions and domestic growth recovery'},
 {symbol:'UPRO',name:'ProShares UltraPro S&P500',theme:'S&P 500',peers:['SPY','VOO'],macro:'Broad earnings growth, liquidity and market breadth'},
 {symbol:'TECL',name:'Direxion Daily Technology Bull 3X',theme:'Technology',peers:['XLK','QQQ'],macro:'Technology earnings, lower yields and capex recovery'},
 {symbol:'DRN',name:'Direxion Daily Real Estate Bull 3X',theme:'Real Estate / REITs',peers:['VNQ','XLRE'],macro:'Lower rates, refinancing conditions and real-estate stabilization'},
 {symbol:'CURE',name:'Direxion Daily Healthcare Bull 3X',theme:'Healthcare',peers:['XLV','IYH'],macro:'Healthcare relative strength and earnings resilience'},
 {symbol:'WANT',name:'Direxion Daily Consumer Discretionary Bull 3X',theme:'Consumer Discretionary',peers:['XLY'],macro:'Consumer resilience, lower rates and discretionary spending recovery'},
 {symbol:'MIDU',name:'Direxion Daily Mid Cap Bull 3X',theme:'US Mid Caps',peers:['MDY','IJH'],macro:'Broader economic expansion and easing financial conditions'},
 {symbol:'UDOW',name:'ProShares UltraPro Dow30',theme:'Dow / Cyclicals',peers:['DIA'],macro:'Cyclical breadth, industrial recovery and risk-on rotation'}
];

export const DEFAULT_BIG_MOVE_SYMBOLS=['SOXL','TQQQ','NAIL','LABU','FAS','TNA','UPRO','TECL'];

const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const round=v=>Math.round(Number(v)||0);
const metaBySymbol=Object.fromEntries(BIG_MOVE_UNIVERSE.map(x=>[x.symbol,x]));

function nearLowScore(distancePct){
 if(!Number.isFinite(distancePct))return 0;
 return clamp(100-distancePct/1.25);
}
function drawdownScore(drawdownPct){
 if(!Number.isFinite(drawdownPct))return 0;
 const dd=Math.abs(Math.min(0,drawdownPct));
 return clamp((dd-20)*1.35);
}
function reversalScore(m){
 let s=0;
 if(m.close>m.ma20)s+=22;
 if(m.close>m.ma50)s+=20;
 if(m.ma20>m.ma50)s+=14;
 if(m.return5d>0)s+=10;
 if(m.return20d>0)s+=14;
 if(m.return63d>0)s+=12;
 if(m.return126d>0)s+=8;
 return clamp(s);
}
function flowContext(symbol,analysis){
 const meta=metaBySymbol[symbol]||{};
 const all=analysis?.tickers||[];
 const direct=all.find(x=>x.symbol===symbol)||null;
 const peers=(meta.peers||[]).map(sym=>all.find(x=>x.symbol===sym)).filter(Boolean);
 const peerScore=peers.length?peers.reduce((a,p)=>a+p.score,0)/peers.length:null;
 const directWeight=direct?Math.min(1,(direct.confidence/100)*(direct.coverage/100)*1.8):0;
 const peerWeight=peers.length?Math.min(1,peers.reduce((a,p)=>a+(p.confidence/100)*(p.coverage/100),0)/peers.length):0;
 let directional=0,weight=0;
 if(direct){directional+=direct.score*directWeight;weight+=directWeight;}
 if(peerScore!=null){directional+=peerScore*.65*peerWeight;weight+=.65*peerWeight;}
 const combined=weight?directional/weight:0;
 const score=weight?clamp(50+combined*.5):50;
 return{
  score:round(score),hasData:!!(direct||peers.length),direct:direct?{symbol:direct.symbol,bias:direct.bias,score:direct.score,confidence:direct.confidence,coverage:direct.coverage}:null,
  peers:peers.map(p=>({symbol:p.symbol,bias:p.bias,score:p.score,confidence:p.confidence,coverage:p.coverage})),
  directional:round(combined),evidenceWeight:+weight.toFixed(2)
 };
}

export function buildBigMoveCandidates(marketRows,analysis,previousSnapshot){
 const prev=Object.fromEntries((previousSnapshot?.rows||[]).map(r=>[r.symbol,r]));
 return (marketRows||[]).map(m=>{
  const meta=metaBySymbol[m.symbol]||{symbol:m.symbol,name:m.symbol,theme:'Leveraged ETF',peers:[],macro:'Macro/sector reversal'};
  const low=nearLowScore(m.distanceHistoryLowPct),dd=drawdownScore(m.drawdownHistoryHighPct),location=round(.58*low+.42*dd);
  const reversal=round(reversalScore(m));
  const flow=flowContext(m.symbol,analysis);
  const setup=round(.50*location+.30*reversal+.20*flow.score);
  const historyQuality=clamp((m.historyBars||0)/12); // ~1200 bars reaches 100
  const setupQuality=round(.72*historyQuality+.28*(flow.hasData?Math.min(100,50+flow.evidenceWeight*35):35));
  const old=prev[m.symbol];
  const deltaScore=old?setup-(old.setupScore||0):null;
  const deltaPrice=old?.close?((m.close/old.close)-1)*100:null;
  const status=setup>=72&&reversal>=55?'EARLY REVERSAL':location>=72&&reversal<50?'DEEP DRAWDOWN':setup>=60?'WATCH':'NO SETUP';
  return{...m,...meta,locationScore:location,reversalScore:reversal,flow,setupScore:setup,setupQuality,status,deltaScore,deltaPrice:deltaPrice==null?null:+deltaPrice.toFixed(2),priorHighMultiple:m.close>0&&m.historyHigh>0?+(m.historyHigh/m.close).toFixed(1):null};
 }).sort((a,b)=>b.setupScore-a.setupScore||b.locationScore-a.locationScore);
}

export function bigMovePacket(candidates,naturalGas=null){
 const top=(candidates||[]).slice(0,6).map(c=>({
  symbol:c.symbol,theme:c.theme,macroReversalCondition:c.macro,setupScore:c.setupScore,setupQuality:c.setupQuality,status:c.status,
  close:c.close,asOf:c.asOf,historyBars:c.historyBars,historyStart:c.historyStart,fullHistoryLikely:c.fullHistoryLikely,
  distanceHistoryLowPct:c.distanceHistoryLowPct,drawdownHistoryHighPct:c.drawdownHistoryHighPct,priorHighMultiple:c.priorHighMultiple,
  return5d:c.return5d,return20d:c.return20d,return63d:c.return63d,return126d:c.return126d,ma20:c.ma20,ma50:c.ma50,ma200:c.ma200,annualizedVolPct:c.annualizedVolPct,
  locationScore:c.locationScore,reversalScore:c.reversalScore,flow:c.flow
 }));
 return{
  purpose:'Research shortlist for high-risk leveraged ETF macro-reversal setups. This is not a target-price or return prediction.',
  methodology:{setupScore:'50% price location + 30% early reversal evidence + 20% options-flow confirmation. Flow is neutral when absent.',historyLow:'True ATL is only claimed when the returned history appears complete; otherwise it is a history-window low.',priceAdjustment:'Daily Twelve Data history is expected to be split-adjusted; nominal historical price comparisons should not be treated as return calculations.',naturalGas:'Natural gas is context only in v1.3.0 and does not change deterministic Setup Scores.'},
  macroIndicators:naturalGas?{naturalGas:{label:naturalGas.label,symbol:naturalGas.symbol,sourceType:naturalGas.sourceType,proxy:!!naturalGas.proxy,asOf:naturalGas.asOf,close:naturalGas.close,return5d:naturalGas.return5d,return20d:naturalGas.return20d,return63d:naturalGas.return63d,ma20:naturalGas.ma20,ma50:naturalGas.ma50,ma200:naturalGas.ma200,regime:naturalGas.regime,warning:naturalGas.warning||null}}:null,
  candidates:top
 };
}
