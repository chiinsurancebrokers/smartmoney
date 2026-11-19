// Long-horizon price forecast engine: Monte Carlo price paths + a financing/dilution layer.
// Pure functions, no I/O: runs in Node (server, smoke test) and in the browser.
//
// What this is NOT: a prediction. It turns explicit assumptions (volatility, drift, cash, burn,
// raise terms) into a DISTRIBUTION of outcomes. Every number it returns is a function of the inputs.
// Prices are in "today's share terms": future reverse splits are ignored (they rescale price and share
// count together), so below-$1 results should be read as "Nasdaq deficiency / reverse-split territory".

export const FORECAST_VERSION='1.0.0';

// --- random numbers --------------------------------------------------------
export function mulberry32(seed){
  let a=seed>>>0;
  return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
function makeNormal(rng){
  let spare=null;
  return()=>{
    if(spare!==null){const s=spare;spare=null;return s;}
    let u=0,v=0;while(u<=1e-12)u=rng();v=rng();
    const m=Math.sqrt(-2*Math.log(u));spare=m*Math.sin(2*Math.PI*v);return m*Math.cos(2*Math.PI*v);
  };
}
// Student-t with integer degrees of freedom, scaled to unit variance (fat tails, same sigma).
function makeStudentT(normal,nu){
  const k=Math.max(3,Math.round(nu)),scale=Math.sqrt((k-2)/k);
  return()=>{let chi=0;for(let i=0;i<k;i++){const z=normal();chi+=z*z;}return normal()/Math.sqrt(chi/k)*scale;};
}

// --- estimation from history ----------------------------------------------
export function estimateFromCloses(closes,{lookbackDays=504}={}){
  const c=(closes||[]).filter(x=>x>0);
  if(c.length<60)return null;
  const rets=[];for(let i=1;i<c.length;i++)rets.push(Math.log(c[i]/c[i-1]));
  const window=rets.slice(-lookbackDays);
  const mean=window.reduce((s,x)=>s+x,0)/window.length;
  const sd=Math.sqrt(window.reduce((s,x)=>s+(x-mean)**2,0)/(window.length-1));
  const recent=rets.slice(-63),rm=recent.reduce((s,x)=>s+x,0)/recent.length;
  const rsd=Math.sqrt(recent.reduce((s,x)=>s+(x-rm)**2,0)/(recent.length-1));
  return{
    lastClose:c.at(-1),observations:window.length,
    annualVol:+(sd*Math.sqrt(252)).toFixed(4),
    recentAnnualVol:+(rsd*Math.sqrt(252)).toFixed(4),
    trailingAnnualLogReturn:+(mean*252).toFixed(4)
  };
}

// --- defaults --------------------------------------------------------------
export function defaultParams(over={}){
  const base={
    s0:1,years:4.1,nSims:4000,seed:42,tNu:4,
    annualVol:0.9,           // annualised, log-return std dev
    annualDrift:0,           // expected annual price return BEFORE dilution; 0 = no view
    dilution:{
      enabled:true,
      sharesM:100,           // shares outstanding, millions
      cashM:40,              // cash + deposits, USD millions
      quarterlyBurnM:8,      // net cash burn per quarter, USD millions
      burnChangePctYr:-10,   // yearly change in burn (negative = improving)
      triggerMonths:6,       // raise when runway falls below this (randomised x0.5-1.5 per raise)
      targetMonths:18,       // size the raise to restore this much runway
      discountPct:15,        // issue price discount to market
      cashCredit:0.5,        // share of raised cash the market credits as value (0 = pure dilution, 1 = value-neutral)
      failProb:0.08,         // chance a needed raise attempt fails outright (company becomes insolvent)
      maxRaiseToMcap:1,      // one raise cannot exceed this multiple of current market cap (partial raises allowed)
      cooldownWeeks:8        // weeks to wait after a raise attempt before trying again
    },
    minBid:1,                // Nasdaq minimum bid, USD
    deficiencyWeeks:26       // consecutive weeks below minBid that flag a deficiency
  };
  return{...base,...over,dilution:{...base.dilution,...(over.dilution||{})}};
}

// --- simulation ------------------------------------------------------------
const STEPS_PER_YEAR=52,RECORD_EVERY=4; // weekly steps, monthly-ish snapshots
const q=(sorted,p)=>{const i=(sorted.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo);};

export function simulate(input){
  const p=defaultParams(input),d=p.dilution;
  if(!(p.s0>0))throw new Error('Start price must be positive');
  if(!(p.annualVol>0&&p.annualVol<5))throw new Error('annualVol must be between 0 and 5 (decimal, e.g. 0.9 = 90%)');
  const nSims=Math.max(200,Math.min(20000,Math.round(p.nSims)));
  const steps=Math.max(4,Math.round(p.years*STEPS_PER_YEAR));
  const dt=1/STEPS_PER_YEAR,sigma=p.annualVol;
  const mu=Math.log(1+p.annualDrift)-0.5*sigma*sigma; // log drift so E[price return] = annualDrift
  const rng=mulberry32(p.seed),normal=makeNormal(rng),shock=makeStudentT(normal,p.tNu);
  const nRec=Math.floor(steps/RECORD_EVERY);
  const grid=new Float32Array(nSims*nRec);
  const endShares=new Float64Array(nSims);
  let insolvent=0,anyRaise=0,deficient=0,totalRaises=0,totalRaisedM=0,belowOneEnd=0;
  const burnStepFactor=Math.pow(1+d.burnChangePctYr/100,dt);

  for(let s=0;s<nSims;s++){
    let price=p.s0,shares=d.sharesM,cash=d.cashM,burnQ=d.quarterlyBurnM;
    let dead=false,raises=0,below=0,flagged=false,raisedM=0,cool=0;
    let trig=d.triggerMonths*(0.5+rng()); // management raises early or late: threshold is redrawn after every attempt
    for(let t=1;t<=steps;t++){
      if(!dead){
        price*=Math.exp(mu*dt+sigma*Math.sqrt(dt)*shock());
        if(d.enabled){
          const monthlyBurn=burnQ/3;
          cash-=monthlyBurn*12*dt;burnQ*=burnStepFactor;
          if(cool>0)cool--;
          if(cash<=0){dead=true;insolvent++;price=0;}
          else if(cash<monthlyBurn*trig&&cool===0){
            cool=d.cooldownWeeks;trig=d.triggerMonths*(0.5+rng());
            if(rng()<d.failProb){dead=true;insolvent++;price=0;}
            else{
              const want=Math.max(0,monthlyBurn*d.targetMonths-cash);
              const need=Math.min(want,d.maxRaiseToMcap*shares*price); // can't raise more than the market will bear
              if(need>0){
                const issue=price*(1-d.discountPct/100),newShares=need/issue;
                price=(shares*price+d.cashCredit*need)/(shares+newShares);
                shares+=newShares;cash+=need;raises++;raisedM+=need;
              }
            }
          }
        }
        if(!dead){
          if(price<p.minBid){below++;if(below>=p.deficiencyWeeks)flagged=true;}else below=0;
        }
      }
      if(t%RECORD_EVERY===0){const k=t/RECORD_EVERY-1;if(k<nRec)grid[s*nRec+k]=dead?0:price;}
    }
    endShares[s]=dead?NaN:shares;
    if(raises>0)anyRaise++;
    if(flagged)deficient++;
    totalRaises+=raises;totalRaisedM+=raisedM;
    if(dead||price<p.minBid)belowOneEnd++;
  }

  const months=[],bands=[],col=new Float64Array(nSims);
  for(let k=0;k<nRec;k++){
    for(let s=0;s<nSims;s++)col[s]=grid[s*nRec+k];
    const sorted=Array.from(col).sort((a,b)=>a-b);
    months.push(+((k+1)*RECORD_EVERY/STEPS_PER_YEAR*12).toFixed(1));
    bands.push({p5:q(sorted,.05),p25:q(sorted,.25),p50:q(sorted,.5),p75:q(sorted,.75),p95:q(sorted,.95),mean:sorted.reduce((a,b)=>a+b,0)/nSims});
  }
  const last=nRec-1,endPrices=Array.from({length:nSims},(_,s)=>grid[s*nRec+last]).sort((a,b)=>a-b);
  const probBelow=lvl=>endPrices.filter(x=>x<lvl).length/nSims;
  const alive=Array.from(endShares).filter(Number.isFinite).sort((a,b)=>a-b);
  const thresholds=[.15,.25,.5,1,2].map(v=>({price:v,prob:+probBelow(v).toFixed(4)}));
  return{
    version:FORECAST_VERSION,params:p,nSims,steps,months,bands,
    summary:{
      horizonYears:p.years,startPrice:p.s0,
      medianEnd:q(endPrices,.5),p5End:q(endPrices,.05),p95End:q(endPrices,.95),
      thresholds,
      probInsolvent:+(insolvent/nSims).toFixed(4),
      probAtLeastOneRaise:+(anyRaise/nSims).toFixed(4),
      avgRaisesPerPath:+(totalRaises/nSims).toFixed(2),
      avgCapitalRaisedM:+(totalRaisedM/nSims).toFixed(1),
      probNasdaqDeficiency:+(deficient/nSims).toFixed(4),
      probEndBelowMinBidOrDead:+(belowOneEnd/nSims).toFixed(4),
      medianEndSharesM:alive.length?+q(alive,.5).toFixed(1):null,
      p95EndSharesM:alive.length?+q(alive,.95).toFixed(1):null,
      startSharesM:d.sharesM
    }
  };
}
