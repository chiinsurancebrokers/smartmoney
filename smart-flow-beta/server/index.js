import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
app.use(express.json({limit:'2mb'}));

function privateGate(req,res,next){
  const user=process.env.BETA_USER, pass=process.env.BETA_PASSWORD;
  if(!user || !pass) return next();
  const h=req.headers.authorization||'';
  if(h.startsWith('Basic ')){
    const [u,p]=Buffer.from(h.slice(6),'base64').toString().split(':');
    if(u===user && p===pass) return next();
  }
  res.set('WWW-Authenticate','Basic realm="Smart Flow Private Beta"');
  return res.status(401).send('Private beta');
}
app.use(privateGate);

app.get('/api/health',(_,res)=>res.json({ok:true,service:'smart-flow-beta'}));

app.get('/api/quote/:symbol', async (req,res)=>{
  const key=process.env.TWELVE_DATA_API_KEY;
  if(!key) return res.status(503).json({error:'TWELVE_DATA_API_KEY is not configured'});
  const symbol=String(req.params.symbol||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,'');
  try{
    const r=await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`);
    const d=await r.json();
    if(!r.ok || d.status==='error') return res.status(502).json({error:d.message||'Twelve Data error'});
    res.json({symbol:d.symbol||symbol,close:Number(d.close),previous_close:Number(d.previous_close),change:Number(d.change),percent_change:Number(d.percent_change),datetime:d.datetime||null});
  }catch(e){res.status(502).json({error:e.message});}
});

const bilingualSchema=`Return valid JSON only with this schema: {"bias":"BULLISH|BEARISH|MIXED|UNKNOWN","confidence":0,"beginner":{"en":"","el":""},"why":{"en":"","el":""},"risks":{"en":[""],"el":[""]},"advanced":{"en":"","el":""}}. Keep beginner language simple. Never present the output as certainty or a personalized instruction to buy/sell.`;

async function anthropic(prompt){
  const key=process.env.ANTHROPIC_API_KEY, model=process.env.ANTHROPIC_MODEL;
  if(!key||!model) throw new Error('Anthropic is not configured');
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model,max_tokens:1800,system:bilingualSchema,messages:[{role:'user',content:prompt}]})});
  const d=await r.json(); if(!r.ok) throw new Error(d?.error?.message||`Anthropic HTTP ${r.status}`);
  return (d.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');
}
async function openai(prompt){
  const key=process.env.OPENAI_API_KEY, model=process.env.OPENAI_MODEL;
  if(!key||!model) throw new Error('OpenAI is not configured');
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify({model,instructions:bilingualSchema,input:prompt,max_output_tokens:1800})});
  const d=await r.json(); if(!r.ok) throw new Error(d?.error?.message||`OpenAI HTTP ${r.status}`);
  if(d.output_text) return d.output_text;
  return (d.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n');
}
function parseJson(text){ const a=text.indexOf('{'), b=text.lastIndexOf('}'); if(a<0||b<a) throw new Error('AI did not return JSON'); return JSON.parse(text.slice(a,b+1)); }

app.post('/api/ai/analyze',async(req,res)=>{
  const packet=req.body?.packet; if(!packet) return res.status(400).json({error:'packet required'});
  const base=`Analyze this deterministic options-flow intelligence packet. Do not override deterministic facts. Focus on interpretation and caveats. DATA:\n${JSON.stringify(packet)}`;
  const p1=anthropic(base+'\nROLE: Primary institutional-flow analyst. Explain what matters.');
  const p2=openai(base+'\nROLE: Independent adversarial second opinion. Look for hedging, closing trades, multi-leg ambiguity, weak coverage, and reasons the signal may fail.');
  const [a,b]=await Promise.allSettled([p1,p2]);
  const result={primary:a.status==='fulfilled'?parseJson(a.value):null,second:b.status==='fulfilled'?parseJson(b.value):null,errors:[]};
  if(a.status==='rejected') result.errors.push(a.reason.message); if(b.status==='rejected') result.errors.push(b.reason.message);
  if(!result.primary&&!result.second) return res.status(503).json(result);
  const p=result.primary||result.second, s=result.second||result.primary;
  const fallback={
    bias: packet.bias,
    confidence: packet.confidence,
    beginner:{en:p?.beginner?.en||s?.beginner?.en||'',el:p?.beginner?.el||s?.beginner?.el||''},
    why:{en:p?.why?.en||'',el:p?.why?.el||''},
    risks:{en:[...(p?.risks?.en||[]),...(s?.risks?.en||[])].slice(0,4),el:[...(p?.risks?.el||[]),...(s?.risks?.el||[])].slice(0,4)},
    advanced:{en:p?.advanced?.en||'',el:p?.advanced?.el||''}
  };
  result.synthesis=fallback;
  if(result.primary&&result.second&&process.env.ANTHROPIC_API_KEY&&process.env.ANTHROPIC_MODEL){
    try{
      const synthesisPrompt=`You are the final arbiter. Reconcile the two independent opinions against the deterministic packet. The deterministic score/bias/coverage are facts; do not silently replace them. If an AI disagrees, explain the caveat rather than inventing new data. Keep both English and Greek beginner-friendly.\nDETERMINISTIC:\n${JSON.stringify(packet)}\nPRIMARY:\n${JSON.stringify(result.primary)}\nSECOND OPINION:\n${JSON.stringify(result.second)}`;
      result.synthesis=parseJson(await anthropic(synthesisPrompt));
      result.synthesis.bias=packet.bias;
      result.synthesis.confidence=packet.confidence;
    }catch(e){result.errors.push('Synthesis fallback used: '+e.message);}
  }
  res.json(result);
});

app.use(express.static(path.join(root,'dist')));
app.get(/.*/,(_,res)=>res.sendFile(path.join(root,'dist','index.html')));
app.listen(PORT,()=>console.log(`Smart Flow beta listening on ${PORT}`));
