import { simulate, defaultParams, estimateFromCloses } from '../src/forecast.js';

const fail=m=>{throw new Error('Forecast smoke: '+m);};
const near=(a,b,tol,label)=>{if(Math.abs(a-b)>tol)fail(`${label}: got ${a}, expected ${b} ±${tol}`);};
const off={dilution:{enabled:false}};

// 1) Deterministic: same seed -> identical output
const a=simulate({s0:1,years:2,nSims:1500,annualVol:.6,seed:7,...off});
const b=simulate({s0:1,years:2,nSims:1500,annualVol:.6,seed:7,...off});
if(JSON.stringify(a.summary)!==JSON.stringify(b.summary))fail('not deterministic for a fixed seed');

// 2) Martingale check with no dilution and zero drift: mean price ~ start, median below start (vol drag)
const m=simulate({s0:1,years:2,nSims:12000,annualVol:.6,seed:11,...off});
const meanEnd=m.bands.at(-1).mean;
near(meanEnd,1,0.06,'mean end price with zero drift');
if(!(m.summary.medianEnd<1))fail('median should sit below start (volatility drag)');
near(m.summary.medianEnd,Math.exp(-0.5*.6*.6*2),0.05,'median vs exp(-s^2 T/2)');

// 3) No burn, lots of cash -> no raises, shares unchanged
const calm=simulate({s0:1,years:3,nSims:800,annualVol:.5,seed:3,dilution:{enabled:true,cashM:500,quarterlyBurnM:1,sharesM:100,failProb:0}});
if(calm.summary.avgRaisesPerPath!==0)fail('expected no raises when cash is ample');
near(calm.summary.medianEndSharesM,100,.01,'shares stay flat without raises');

// 4) Heavy burn -> raises, shares grow, price worse than the no-dilution run
const burn=simulate({s0:1,years:4,nSims:3000,annualVol:.8,seed:5,dilution:{enabled:true,cashM:20,quarterlyBurnM:10,sharesM:100,failProb:0,cashCredit:0}});
const noDil=simulate({s0:1,years:4,nSims:3000,annualVol:.8,seed:5,...off});
if(!(burn.summary.avgRaisesPerPath>0))fail('expected raises under heavy burn');
if(!(burn.summary.medianEndSharesM>100))fail('share count should grow');
if(!(burn.summary.medianEnd<noDil.summary.medianEnd))fail('dilution should lower the median outcome');

// 5) failProb=1 -> every path that needs a raise goes insolvent
const doom=simulate({s0:1,years:4,nSims:600,annualVol:.5,seed:9,dilution:{enabled:true,cashM:5,quarterlyBurnM:10,sharesM:100,failProb:1}});
near(doom.summary.probInsolvent,1,0.0001,'probInsolvent with failProb=1');
if(doom.bands.at(-1).p95!==0)fail('dead paths must be priced at 0');

// 5b) Tiny market cap + heavy burn: raise size is capped, so cash runs out even with failProb=0
const squeeze=simulate({s0:.1,years:3,nSims:800,annualVol:.5,seed:13,dilution:{enabled:true,sharesM:10,cashM:2,quarterlyBurnM:10,failProb:0,maxRaiseToMcap:1}});
if(!(squeeze.summary.probInsolvent>.5))fail('capped raises should leave a cash-starved micro-cap insolvent: '+squeeze.summary.probInsolvent);

// 6) Percentile ordering and input validation
for(const band of m.bands)if(!(band.p5<=band.p25&&band.p25<=band.p50&&band.p50<=band.p75&&band.p75<=band.p95))fail('percentiles out of order');
let threw=false;try{simulate({s0:-1});}catch{threw=true;}
if(!threw)fail('negative start price must throw');

// 7) Estimation
const fake=[1];for(let i=1;i<400;i++)fake.push(fake[i-1]*(1+(i%2?0.02:-0.02)));
const est=estimateFromCloses(fake);
if(!est||!(est.annualVol>0.3&&est.annualVol<0.5))fail('vol estimate out of range: '+est?.annualVol);
if(estimateFromCloses([1,2,3])!==null)fail('too little history should return null');

console.log(`Forecast smoke test OK · mean end ${meanEnd.toFixed(3)} · median ${m.summary.medianEnd.toFixed(3)} · heavy-burn raises/path ${burn.summary.avgRaisesPerPath}`);
