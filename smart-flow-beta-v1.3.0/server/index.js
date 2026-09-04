import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app=express();
const PORT=process.env.PORT||3000;
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
app.use(express.json({limit:'2mb'}));

function privateGate(req,res,next){
  const user=process.env.BETA_USER,pass=process.env.BETA_PASSWORD;
  if(!user||!pass)return next();
  const h=req.headers.authorization||'';
  if(h.startsWith('Basic ')){
    const [u,p]=Buffer.from(h.slice(6),'base64').toString().split(':');
    if(u===user&&p===pass)return next();
  }
  res.set('WWW-Authenticate','Basic realm="Smart Flow Private Beta"');
  return res.status(401).send('Private beta');
}
app.use(privateGate);
app.get('/api/health',(_,res)=>res.json({ok:true,service:'smart-flow-beta',version:'1.3.0'}));

app.get('/api/quote/:symbol',async(req,res)=>{
  const key=process.env.TWELVE_DATA_API_KEY;
  if(!key)return res.status(503).json({error:'TWELVE_DATA_API_KEY is not configured'});
  const symbol=String(req.params.symbol||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,'');
  try{
    const r=await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`);
    const text=await r.text();let d={};try{d=text?JSON.parse(text):{};}catch{return res.status(502).json({error:`Twelve Data returned non-JSON HTTP ${r.status}`});}
    if(!r.ok||d.status==='error')return res.status(502).json({error:d.message||'Twelve Data error'});
    return res.json({symbol:d.symbol||symbol,close:Number(d.close),previous_close:Number(d.previous_close),change:Number(d.change),percent_change:Number(d.percent_change),datetime:d.datetime||null});
  }catch(e){return res.status(502).json({error:e.message});}
});


const bigMoveCache=new Map();
const BIG_MOVE_CACHE_MS=Math.max(60_000,Number(process.env.BIG_MOVE_CACHE_MINUTES||360)*60_000);
const BIG_MOVE_SCAN_LIMIT=Math.max(1,Math.min(8,Number(process.env.BIG_MOVE_SCAN_LIMIT||8)));
const BIG_MOVE_HISTORY_SIZE=Math.max(260,Math.min(5000,Number(process.env.BIG_MOVE_HISTORY_SIZE||5000)));
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const pct=(a,b)=>a!=null&&b?((a/b)-1)*100:null;
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const sma=(a,n)=>a.length>=n?avg(a.slice(-n)):null;
function std(a){if(a.length<2)return null;const m=avg(a),v=a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1);return Math.sqrt(v);}
function returnN(closes,n){return closes.length>n?pct(closes.at(-1),closes.at(-(n+1))):null;}
function summarizeHistory(symbol,d){
  const raw=Array.isArray(d?.values)?d.values:[];
  const bars=raw.map(x=>({datetime:x.datetime,open:num(x.open),high:num(x.high),low:num(x.low),close:num(x.close),volume:num(x.volume)})).filter(x=>x.close>0).reverse();
  if(!bars.length)throw new Error(d?.message||`No daily history returned for ${symbol}`);
  const closes=bars.map(x=>x.close),latest=bars.at(-1),last252=bars.slice(-252);
  const histLow=Math.min(...bars.map(x=>x.low||x.close).filter(x=>x>0)),histHigh=Math.max(...bars.map(x=>x.high||x.close).filter(x=>x>0));
  const low52=Math.min(...last252.map(x=>x.low||x.close).filter(x=>x>0)),high52=Math.max(...last252.map(x=>x.high||x.close).filter(x=>x>0));
  const rets=[];for(let i=1;i<closes.length;i++){if(closes[i-1]>0&&closes[i]>0)rets.push(Math.log(closes[i]/closes[i-1]));}
  const ann=std(rets.slice(-252));
  return{symbol,asOf:latest.datetime,close:latest.close,historyBars:bars.length,historyStart:bars[0]?.datetime||null,historyEnd:latest.datetime,fullHistoryLikely:bars.length<BIG_MOVE_HISTORY_SIZE,
    historyLow:+histLow.toFixed(4),historyHigh:+histHigh.toFixed(4),low52:+low52.toFixed(4),high52:+high52.toFixed(4),
    distanceHistoryLowPct:+pct(latest.close,histLow).toFixed(2),distance52LowPct:+pct(latest.close,low52).toFixed(2),drawdownHistoryHighPct:+pct(latest.close,histHigh).toFixed(2),drawdown52HighPct:+pct(latest.close,high52).toFixed(2),
    return5d:returnN(closes,5)==null?null:+returnN(closes,5).toFixed(2),return20d:returnN(closes,20)==null?null:+returnN(closes,20).toFixed(2),return63d:returnN(closes,63)==null?null:+returnN(closes,63).toFixed(2),return126d:returnN(closes,126)==null?null:+returnN(closes,126).toFixed(2),
    ma20:sma(closes,20)==null?null:+sma(closes,20).toFixed(4),ma50:sma(closes,50)==null?null:+sma(closes,50).toFixed(4),ma200:sma(closes,200)==null?null:+sma(closes,200).toFixed(4),annualizedVolPct:ann==null?null:+(ann*Math.sqrt(252)*100).toFixed(1)};
}
async function getBigMoveHistory(symbol,key){
  const cached=bigMoveCache.get(symbol);if(cached&&Date.now()-cached.at<BIG_MOVE_CACHE_MS)return{...cached.data,cached:true};
  const url=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${BIG_MOVE_HISTORY_SIZE}&apikey=${encodeURIComponent(key)}`;
  const r=await fetch(url);const text=await r.text();let d={};try{d=text?JSON.parse(text):{};}catch{throw new Error(`Twelve Data returned non-JSON for ${symbol} (HTTP ${r.status})`);}
  if(!r.ok||d.status==='error')throw new Error(d.message||`Twelve Data error for ${symbol}`);
  const data=summarizeHistory(symbol,d);bigMoveCache.set(symbol,{at:Date.now(),data});return{...data,cached:false};
}
app.post('/api/big-move/scan',async(req,res)=>{
  const key=process.env.TWELVE_DATA_API_KEY;if(!key)return res.status(503).json({error:'TWELVE_DATA_API_KEY is not configured'});
  const input=Array.isArray(req.body?.symbols)?req.body.symbols:[];
  const symbols=[...new Set(input.map(x=>String(x||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,'')).filter(Boolean))];
  if(!symbols.length)return res.status(400).json({error:'symbols required'});
  if(symbols.length>BIG_MOVE_SCAN_LIMIT)return res.status(400).json({error:`Free-plan protection: scan at most ${BIG_MOVE_SCAN_LIMIT} symbols per refresh.`});
  const rows=[],errors=[];
  // Twelve Data Basic provides 8 API credits/minute. Keep the beta at <=8 symbols per manual scan and cache history server-side.
  const settled=await Promise.allSettled(symbols.map(s=>getBigMoveHistory(s,key)));
  settled.forEach((x,i)=>x.status==='fulfilled'?rows.push(x.value):errors.push(`${symbols[i]}: ${x.reason?.message||'history error'}`));
  return res.status(rows.length?200:502).json({rows,errors,scanLimit:BIG_MOVE_SCAN_LIMIT,historySize:BIG_MOVE_HISTORY_SIZE,cacheMinutes:Math.round(BIG_MOVE_CACHE_MS/60000),generatedAt:new Date().toISOString()});
});

function naturalGasRegime(m){
  if(!m)return 'UNKNOWN';
  let score=0,seen=0;
  for(const [v,w] of [[m.return5d,1],[m.return20d,2],[m.return63d,2]]){if(v!=null){score+=v>0?w:v<0?-w:0;seen+=w;}}
  if(m.ma20!=null&&m.close!=null){score+=m.close>m.ma20?1:-1;seen+=1;}
  if(m.ma50!=null&&m.close!=null){score+=m.close>m.ma50?1:-1;seen+=1;}
  if(!seen)return 'UNKNOWN';
  const z=score/seen;return z>=.35?'RISING':z<=-.35?'FALLING':'MIXED';
}
app.get('/api/macro/natural-gas',async(req,res)=>{
  const key=process.env.TWELVE_DATA_API_KEY;if(!key)return res.status(503).json({error:'TWELVE_DATA_API_KEY is not configured'});
  // Twelve Data commodity market-data access may require a higher plan. On Basic/free we use UNG as a clearly-labelled US natural-gas futures ETF proxy.
  const configured=String(process.env.NATURAL_GAS_SYMBOL||'').trim();
  const directSymbol=configured||null;
  let directError=null;
  if(directSymbol){
    try{
      const m=await getBigMoveHistory(directSymbol,key);
      return res.json({...m,label:'Natural Gas',sourceType:'DIRECT_COMMODITY',proxy:false,regime:naturalGasRegime(m),warning:null,generatedAt:new Date().toISOString()});
    }catch(e){directError=e.message||'Direct natural-gas symbol failed';}
  }
  try{
    const m=await getBigMoveHistory('UNG',key);
    return res.json({...m,label:'Natural Gas proxy · UNG',sourceType:'ETF_PROXY',proxy:true,regime:naturalGasRegime(m),warning:directError?`Direct commodity unavailable (${directError}). Showing UNG ETF proxy.`:'Twelve Data Basic/free may not include direct commodity market data. Showing UNG ETF proxy; this is not the spot/futures price.',generatedAt:new Date().toISOString()});
  }catch(e){
    return res.status(502).json({error:e.message||'Natural-gas context unavailable',directError});
  }
});

const commonRules=`Use only the supplied deterministic packet. Never invent trades, prices, sectors, BTO/STO, opening/closing status, gamma exposure, or confirmation that is absent from the packet. The deterministic bias, Smart Money Score, Confidence and Coverage are fixed facts from the engine; you may challenge their interpretation but must not replace their numeric values. Confidence is evidence-quality, not probability of profit. Use plain language suitable for a beginner, while preserving a technically accurate advanced explanation. Do not give personalized buy/sell instructions.`;
const analystInstructions=`${commonRules}\nROLE: Primary options-flow analyst. Explain what the flow means, what is unusual, the plausible institutional interpretation, whether the signal is coherent, and the key caveats. Write bilingual English and Greek content in the required fields.`;
const skepticInstructions=`${commonRules}\nROLE: Adversarial skeptic. Assume the primary directional conclusion may be wrong and find the strongest alternative explanation. Explicitly inspect possible hedging, closing trades, spread/multi-leg distortion, mixed sector confirmation, low coverage, weak/missing price confirmation, concentration in one trade, and data-quality limitations. Do not manufacture a problem when the packet does not support it.`;
const synthesisInstructions=`${commonRules}\nROLE: Final editor/synthesizer. Reconcile deterministic facts, Analyst and Skeptic. Do not perform new scoring. Final bias/confidence must equal the deterministic packet. Explain why the signal matters, what supports it, what could go wrong, and provide a beginner explanation in English and Greek.`;

const bigMoveRules=`Use only the supplied leveraged-ETF research packet. Never invent current macro news, catalysts, prices, options trades, target prices or probabilities. Setup Score is a fixed deterministic ranking metric, not probability of profit. A prior historical high is context, not a price target. If macroIndicators.naturalGas exists, use it only as macro context and never change deterministic Setup Scores because of it. When naturalGas.proxy is true, explicitly treat it as an ETF proxy rather than a direct spot/futures natural-gas price. Leveraged ETFs have daily-reset path dependency, volatility drag and can suffer very large permanent losses. Do not give personalized buy/sell instructions.`;
const bigMoveAnalystInstructions=`${bigMoveRules}\nROLE: Primary macro-reversal analyst. Evaluate the ranked candidates without changing deterministic Setup Scores. Explain which setup is most interesting, what price-location/reversal/flow evidence supports it, and which macro/sector condition would need to improve. Use bilingual English/Greek fields.`;
const bigMoveSkepticInstructions=`${bigMoveRules}\nROLE: Adversarial skeptic. Assume the apparent rebound setup can fail. Inspect leveraged-ETF decay, absence of a real catalyst feed, weak reversal momentum, bearish/missing options flow, historical-price/split interpretation, concentration, and the possibility that a deep drawdown reflects structural deterioration rather than opportunity.`;
const bigMoveSynthesisInstructions=`${bigMoveRules}\nROLE: Final editor. Reconcile Analyst and Skeptic into a research watchlist. Preserve deterministic ranking and scores; do not invent targets or expected multiples. Use bilingual English/Greek fields.`;

const langTextSchema={type:'object',properties:{en:{type:'string'},el:{type:'string'}},required:['en','el'],additionalProperties:false};
const langListSchema={type:'object',properties:{en:{type:'array',items:{type:'string'}},el:{type:'array',items:{type:'string'}}},required:['en','el'],additionalProperties:false};
const analystJsonSchema={type:'object',properties:{
  institutionalInterpretation:langTextSchema,unusual:langListSchema,coherence:{type:'string',enum:['HIGH','MEDIUM','LOW']},supports:langListSchema,caveats:langListSchema,beginner:langTextSchema,why:langTextSchema,advanced:langTextSchema
},required:['institutionalInterpretation','unusual','coherence','supports','caveats','beginner','why','advanced'],additionalProperties:false};
const skepticJsonSchema={type:'object',properties:{
  alternativeExplanation:langTextSchema,risks:langListSchema,tests:langListSchema,verdict:{type:'string',enum:['ROBUST','CAUTION','WEAK']},advanced:langTextSchema
},required:['alternativeExplanation','risks','tests','verdict','advanced'],additionalProperties:false};
const synthesisJsonSchema={type:'object',properties:{
  bias:{type:'string',enum:['BULLISH','BEARISH','MIXED','UNKNOWN']},confidence:{type:'number'},beginner:langTextSchema,why:langTextSchema,supports:langListSchema,risks:langListSchema,advanced:langTextSchema
},required:['bias','confidence','beginner','why','supports','risks','advanced'],additionalProperties:false};
const bigMoveAnalystJsonSchema={type:'object',properties:{
  topCandidate:{type:'string'},thesis:langTextSchema,supports:langListSchema,conditions:langListSchema,beginner:langTextSchema
},required:['topCandidate','thesis','supports','conditions','beginner'],additionalProperties:false};
const bigMoveSkepticJsonSchema={type:'object',properties:{
  risks:langListSchema,alternative:langTextSchema,tests:langListSchema,verdict:{type:'string',enum:['ROBUST','CAUTION','WEAK']}
},required:['risks','alternative','tests','verdict'],additionalProperties:false};
const bigMoveSynthesisJsonSchema={type:'object',properties:{
  headline:langTextSchema,topCandidate:{type:'string'},why:langTextSchema,supports:langListSchema,risks:langListSchema,monitor:langListSchema,beginner:langTextSchema
},required:['headline','topCandidate','why','supports','risks','monitor','beginner'],additionalProperties:false};

async function readProviderJson(response,provider){
  const text=await response.text();let data;
  try{data=text?JSON.parse(text):{};}catch{const preview=text.replace(/\s+/g,' ').slice(0,220);throw new Error(`${provider} returned a non-JSON HTTP response (${response.status}). ${preview||'Empty response'}`);}
  if(!response.ok){const msg=data?.error?.message||data?.message||`${provider} HTTP ${response.status}`;throw new Error(msg);}
  return data;
}
function parseStrictJson(text,provider){
  const raw=String(text||'').trim();
  if(!raw)throw new Error(`${provider} returned no final JSON text`);
  try{return JSON.parse(raw);}catch(e){throw new Error(`${provider} returned malformed JSON despite structured-output mode: ${e.message}`);}
}
function anthropicSupportsEffort(model=''){return /claude-(?:sonnet-(?:4-6|5)|opus-|fable-|mythos-)/.test(model);}
function providerMeta(){
  const anthropicModel=process.env.ANTHROPIC_MODEL||'';
  return{
    anthropic:{configured:!!(process.env.ANTHROPIC_API_KEY&&anthropicModel),model:anthropicModel||null,effort:anthropicSupportsEffort(anthropicModel)?(process.env.ANTHROPIC_EFFORT||'low'):null},
    openai:{configured:!!(process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL),model:process.env.OPENAI_MODEL||null,reasoningEffort:process.env.OPENAI_REASONING_EFFORT||((process.env.OPENAI_MODEL||'').startsWith('gpt-5.6')?'none':null)}
  };
}
app.get('/api/ai/status',(_,res)=>res.json(providerMeta()));

async function anthropicJson(prompt,system,schema,maxTokens=4096){
  const key=process.env.ANTHROPIC_API_KEY,model=process.env.ANTHROPIC_MODEL;
  if(!key||!model)throw new Error('Anthropic is not configured');
  const effort=process.env.ANTHROPIC_EFFORT||'low';
  const output_config={format:{type:'json_schema',schema}};
  if(anthropicSupportsEffort(model))output_config.effort=effort;
  const body={model,max_tokens:maxTokens,system,messages:[{role:'user',content:prompt}],output_config};
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},body:JSON.stringify(body)});
  const d=await readProviderJson(r,'Anthropic');
  const text=(d.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n').trim();
  if(!text){
    const why=d.stop_reason==='max_tokens'?'max_tokens was reached before a final answer. The beta now uses low effort and a larger output budget; if this persists, increase ANTHROPIC_MAX_TOKENS.':d.stop_reason?`stop_reason=${d.stop_reason}`:'no text block was returned';
    throw new Error(`Claude ${model} returned no final text (${why})`);
  }
  return parseStrictJson(text,`Claude ${model}`);
}
async function openaiJson(prompt,instructions,schema,name,maxTokens=4096){
  const key=process.env.OPENAI_API_KEY,model=process.env.OPENAI_MODEL;
  if(!key||!model)throw new Error('OpenAI is not configured');
  const body={model,instructions,input:prompt,max_output_tokens:maxTokens,text:{format:{type:'json_schema',name,strict:true,schema}}};
  const configuredEffort=process.env.OPENAI_REASONING_EFFORT||'';
  const defaultEffort=model.startsWith('gpt-5.6')?'none':'';
  const effort=configuredEffort||defaultEffort;
  if(effort)body.reasoning={effort};
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(body)});
  const d=await readProviderJson(r,'OpenAI');
  if(d.status==='failed')throw new Error(`OpenAI ${model} response failed: ${d.error?.message||'unknown failure'}`);
  if(d.status==='incomplete'&&!d.output?.length)throw new Error(`OpenAI ${model} response incomplete: ${d.incomplete_details?.reason||'unknown reason'}`);
  let text=typeof d.output_text==='string'?d.output_text:'';
  if(!text)text=(d.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n');
  return parseStrictJson(text,`OpenAI ${model}`);
}
const langObj=v=>({en:String(v?.en||''),el:String(v?.el||'')});
const langArr=v=>({en:Array.isArray(v?.en)?v.en.filter(Boolean).map(String):[],el:Array.isArray(v?.el)?v.el.filter(Boolean).map(String):[]});
function normalizeSynthesis(v,packet){return{bias:packet.deterministic.bias,confidence:packet.deterministic.confidence,beginner:langObj(v?.beginner),why:langObj(v?.why),supports:langArr(v?.supports),risks:langArr(v?.risks),advanced:langObj(v?.advanced)};}

app.post('/api/ai/analyze',async(req,res)=>{
  try{
    const packet=req.body?.packet;if(!packet)return res.status(400).json({error:'packet required'});
    const payload=JSON.stringify(packet);
    const primaryPrompt=`Analyze this deterministic options-flow intelligence packet as the primary analyst. Treat UNKNOWN fields as unknown; never infer BTO/STO merely from bid/ask. PACKET:\n${payload}`;
    const skepticPrompt=`Audit this deterministic options-flow intelligence packet as an adversarial second opinion. Try to falsify the directional story using only supplied evidence. PACKET:\n${payload}`;
    const[a,b]=await Promise.allSettled([
      anthropicJson(primaryPrompt,analystInstructions,analystJsonSchema,4096),
      openaiJson(skepticPrompt,skepticInstructions,skepticJsonSchema,'options_flow_skeptic',4096)
    ]);
    const result={primary:a.status==='fulfilled'?a.value:null,second:b.status==='fulfilled'?b.value:null,errors:[],meta:providerMeta()};
    if(a.status==='rejected')result.errors.push('Claude Analyst: '+a.reason.message);
    if(b.status==='rejected')result.errors.push('OpenAI Skeptic: '+b.reason.message);
    if(!result.primary&&!result.second)return res.status(503).json({...result,error:'No AI opinion could be produced. Check the configured model IDs and Railway logs.'});

    const p=result.primary||{},s=result.second||{};
    result.synthesis=normalizeSynthesis({beginner:p.beginner||{},why:p.why||{},supports:p.supports||{},risks:s.risks||p.caveats||{},advanced:p.advanced||s.advanced||{}},packet);
    if(result.primary&&result.second&&process.env.ANTHROPIC_API_KEY&&process.env.ANTHROPIC_MODEL){
      try{
        const synthesisPrompt=`Create the final user-facing synthesis. Do not change deterministic score, bias, confidence or coverage. If Analyst and Skeptic disagree, explain the disagreement as uncertainty.\nDETERMINISTIC PACKET:\n${payload}\nANALYST:\n${JSON.stringify(result.primary)}\nSKEPTIC:\n${JSON.stringify(result.second)}`;
        const syn=await anthropicJson(synthesisPrompt,synthesisInstructions,synthesisJsonSchema,4096);
        result.synthesis=normalizeSynthesis(syn,packet);
      }catch(e){result.errors.push('Claude Synthesis fallback used: '+e.message);}
    }
    return res.json(result);
  }catch(e){console.error('AI analyze error:',e);return res.status(500).json({error:e?.message||'AI analysis failed',meta:providerMeta()});}
});

app.post('/api/ai/big-move',async(req,res)=>{
  try{
    const packet=req.body?.packet;if(!packet?.candidates?.length)return res.status(400).json({error:'candidate packet required'});
    const topScore=Number(packet.candidates[0]?.setupScore||0),force=!!req.body?.force;
    if(topScore<55&&!force)return res.json({skipped:true,reason:`Top deterministic Setup Score is ${topScore}; AI was not called automatically for a weak setup.`,meta:providerMeta()});
    const payload=JSON.stringify(packet);
    const a=await Promise.allSettled([
      anthropicJson(`Analyze this deterministic leveraged-ETF reversal shortlist. Do not rescore it. PACKET:\n${payload}`,bigMoveAnalystInstructions,bigMoveAnalystJsonSchema,4096),
      openaiJson(`Try to falsify this leveraged-ETF reversal shortlist using only the supplied packet. PACKET:\n${payload}`,bigMoveSkepticInstructions,bigMoveSkepticJsonSchema,'big_move_skeptic',4096)
    ]);
    const primary=a[0].status==='fulfilled'?a[0].value:null,second=a[1].status==='fulfilled'?a[1].value:null,errors=[];
    if(a[0].status==='rejected')errors.push('Claude Analyst: '+a[0].reason.message);
    if(a[1].status==='rejected')errors.push('OpenAI Skeptic: '+a[1].reason.message);
    if(!primary&&!second)return res.status(503).json({error:'No Big Move AI opinion could be produced.',errors,meta:providerMeta()});
    let synthesis={headline:langObj(primary?.thesis),topCandidate:primary?.topCandidate||packet.candidates[0].symbol,why:langObj(primary?.thesis),supports:langArr(primary?.supports),risks:langArr(second?.risks),monitor:langArr(second?.tests),beginner:langObj(primary?.beginner)};
    if(primary&&second&&process.env.ANTHROPIC_API_KEY&&process.env.ANTHROPIC_MODEL){
      try{
        const syn=await anthropicJson(`Create the final bilingual research synthesis. Preserve the deterministic ranking and do not create targets.\nPACKET:\n${payload}\nANALYST:\n${JSON.stringify(primary)}\nSKEPTIC:\n${JSON.stringify(second)}`,bigMoveSynthesisInstructions,bigMoveSynthesisJsonSchema,4096);
        synthesis={headline:langObj(syn.headline),topCandidate:String(syn.topCandidate||primary.topCandidate||packet.candidates[0].symbol),why:langObj(syn.why),supports:langArr(syn.supports),risks:langArr(syn.risks),monitor:langArr(syn.monitor),beginner:langObj(syn.beginner)};
      }catch(e){errors.push('Claude Big Move Synthesis fallback used: '+e.message);}
    }
    return res.json({primary,second,synthesis,errors,meta:providerMeta()});
  }catch(e){console.error('Big Move AI error:',e);return res.status(500).json({error:e?.message||'Big Move AI analysis failed',meta:providerMeta()});}
});

app.use('/api',(req,res)=>res.status(404).json({error:`API route not found: ${req.method} ${req.originalUrl}`}));
app.use((err,req,res,next)=>{if(req.originalUrl?.startsWith('/api/')){console.error('API error:',err);return res.status(err.status||500).json({error:err?.message||'Server error'});}return next(err);});
app.use(express.static(path.join(root,'dist')));
app.get(/.*/,(_,res)=>res.sendFile(path.join(root,'dist','index.html')));
app.listen(PORT,()=>console.log(`Smart Flow beta v1.3.0 listening on ${PORT}`));
