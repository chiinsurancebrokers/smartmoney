const RELATIONS={
 SOXL:{sector:['SMH','SOXX'],inverse:['SOXS'],market:['QQQ','SPY']},SOXS:{sector:['SMH','SOXX'],inverse:['SOXL'],market:['QQQ','SPY']},
 TQQQ:{sector:['QQQ'],inverse:['SQQQ'],market:['SPY']},SQQQ:{sector:['QQQ'],inverse:['TQQQ'],market:['SPY']},
 NAIL:{sector:['XHB','ITB'],inverse:[],market:['SPY']},LABU:{sector:['XBI','IBB'],inverse:[],market:['SPY']},
 TNA:{sector:['IWM'],inverse:['TZA'],market:['SPY']},TZA:{sector:['IWM'],inverse:['TNA'],market:['SPY']},
 UPRO:{sector:['SPY'],inverse:['SPXU'],market:['QQQ']},SPXU:{sector:['SPY'],inverse:['UPRO'],market:['QQQ']},
 SMH:{sector:['SOXX'],inverse:['SOXS'],market:['QQQ','SPY']},SOXX:{sector:['SMH'],inverse:['SOXS'],market:['QQQ','SPY']},
 QQQ:{sector:[],inverse:['SQQQ'],market:['SPY']},SPY:{sector:[],inverse:['SPXU'],market:['QQQ','IWM','DIA']}
};
const signBias=b=>b==='BULLISH'?1:b==='BEARISH'?-1:0;
const inverseNormalized=(s)=>signBias(s?.bias)*(s?.asset?.multiplier<0?-1:1);
const pct=(x)=>Math.max(0,Math.min(100,Math.round(Number(x)||0)));
function peerEvidence(s,by){
 const rel=RELATIONS[s.symbol]||{sector:[],inverse:[],market:[]},target=inverseNormalized(s),rows=[];
 for(const kind of ['sector','inverse','market'])for(const sym of rel[kind]||[]){const p=by[sym];if(!p)continue;const pdir=inverseNormalized(p);let relation='MIXED';if(target&&pdir)relation=pdir===target?'CONFIRMS':'CONFLICTS';rows.push({symbol:sym,kind,relation,bias:p.bias,score:p.score,confidence:p.confidence,assetMultiplier:p.asset.multiplier});}
 return rows;
}
function priceState(s,q){
 if(!q||!Number.isFinite(Number(q.percent_change)))return{status:'PENDING',percentChange:null,divergence:'PENDING',severity:0};
 const ch=Number(q.percent_change),flow=signBias(s.bias);let divergence='NEUTRAL';
 if(flow&&Math.sign(ch)===-flow)divergence='DIVERGENCE';else if(flow&&Math.sign(ch)===flow)divergence='CONFIRMED';
 const severity=divergence==='DIVERGENCE'?Math.round(Math.min(100,.55*Math.abs(s.score)+.25*s.confidence+.20*Math.min(100,Math.abs(ch)*18))):0;
 return{status:'READY',percentChange:+ch.toFixed(2),close:Number(q.close)||null,divergence,severity};
}
function blockRow(t){return{symbol:t.symbol,type:t.type,strike:t.strike,expiry:t.expiry,side:t.side,transaction:t.tx,positionEffect:t.positionEffect,direction:t.direction,premium:t.premium,volume:t.volume,openInterest:t.oi,volOi:t.oi?+(t.volume/t.oi).toFixed(2):null,group:t.group||null,strategy:t.strategy||'SINGLE',time:t.time||null};}
export function buildIntradayReport(analysis,quotes={}){
 if(!analysis)return null;const by=Object.fromEntries(analysis.tickers.map(s=>[s.symbol,s]));
 const signals=analysis.tickers.map(s=>{
   const peers=peerEvidence(s,by),confirms=peers.filter(x=>x.relation==='CONFIRMS'),conflicts=peers.filter(x=>x.relation==='CONFLICTS'),ps=priceState(s,quotes[s.symbol]);
   const putShare=pct(s.breakdown?.type?.PUT?.share),callShare=pct(s.breakdown?.type?.CALL?.share),bearEligible=pct(s.breakdown?.direction?.BEARISH?.share),bullEligible=pct(s.breakdown?.direction?.BULLISH?.share);
   const confluence=Math.max(0,Math.min(100,Math.round(.52*s.signalQuality+.16*Math.min(100,confirms.length*30)+.12*(100-Math.min(100,conflicts.length*35))+.20*(ps.divergence==='CONFIRMED'?80:ps.divergence==='DIVERGENCE'?70:45))));
   return{symbol:s.symbol,assetType:s.asset.type,sector:s.asset.sector,bias:s.bias,score:s.score,confidence:s.confidence,coverage:s.coverage,signalQuality:s.signalQuality,confluence,putPremiumShare:putShare,callPremiumShare:callShare,bearishPremiumShareEligible:bearEligible,bullishPremiumShareEligible:bullEligible,openingCoverage:s.openingCoverage,executionCoverage:s.executionCoverage,gammaContext:s.gammaContext,eligiblePremium:s.eligiblePremium,unusualShare:s.unusualShare,concentration:s.concentration,price:ps,peers,confirms:confirms.map(x=>x.symbol),conflicts:conflicts.map(x=>x.symbol),multiLegGroups:s.multiLegGroups};
 }).sort((a,b)=>b.confluence-a.confluence||b.signalQuality-a.signalQuality);
 const topSignal=signals.find(x=>x.bias!=='MIXED'&&x.confidence>=40&&x.coverage>=30)||signals[0]||null;
 const divergences=signals.filter(x=>x.price.divergence==='DIVERGENCE').sort((a,b)=>b.price.severity-a.price.severity).slice(0,10);
 const aligned=signals.filter(x=>x.price.divergence==='CONFIRMED').sort((a,b)=>b.confluence-a.confluence).slice(0,10);
 const blocks=analysis.tickers.flatMap(s=>s.trades.map(blockRow)).filter(x=>x.premium>0).sort((a,b)=>b.premium-a.premium).slice(0,15);
 const clusters=[];for(const s of analysis.tickers){for(const typ of ['PUT','CALL']){const rows=s.trades.filter(t=>t.type===typ&&!t.duplicate);const prem=rows.reduce((z,t)=>z+t.premium,0);if(!prem)continue;clusters.push({symbol:s.symbol,type:typ,premium:prem,rows:rows.length,share:pct(prem/s.eligiblePremium*100),directionalBias:s.bias});}}
 clusters.sort((a,b)=>b.premium-a.premium);
 const market=['SPY','QQQ','IWM','DIA'].map(x=>signals.find(s=>s.symbol===x)).filter(Boolean);
 return{engineVersion:analysis.engineVersion,generatedAt:new Date().toISOString(),topSignal,signals:signals.slice(0,20),divergences,aligned,topBlocks:blocks,largestTypeClusters:clusters.slice(0,12),marketContext:market,dataQuality:{rows:analysis.rawRows,tickers:analysis.tickers.length,duplicates:analysis.duplicates,multiLegGroups:analysis.multiLegGroups,assetClassification:analysis.dataAudit?.assetClassification,premiumFieldCoverage:analysis.dataAudit?.premiumFieldCoverage,warnings:analysis.dataAudit?.warnings||[]},priceCoverage:{ready:signals.filter(x=>x.price.status==='READY').length,total:signals.length}};
}
export function reportPacket(report){
 if(!report)return null;return{engineVersion:report.engineVersion,generatedAt:report.generatedAt,topSignal:report.topSignal,rankedSignals:report.signals.slice(0,16),divergences:report.divergences,priceAligned:report.aligned,topPremiumBlocks:report.topBlocks.slice(0,12),largestTypeClusters:report.largestTypeClusters,dataQuality:report.dataQuality,priceCoverage:report.priceCoverage,guardrails:[
  'Put premium share is not the same as bearish directional share.',
  'ASK/BID identifies likely aggressor side, not opening/closing by itself.',
  'MID execution does not prove institutional intent or rule out hedging.',
  'Sector ETFs are confirmation proxies, not interchangeable notionals.',
  'Do not turn option strikes into price targets without separate technical evidence.'
 ]};
}
