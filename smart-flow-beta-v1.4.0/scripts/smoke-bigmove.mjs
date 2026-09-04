import { buildBigMoveCandidates, bigMovePacket } from '../src/bigmove.js';

const market=[
 {symbol:'SOXL',close:10,historyBars:2000,historyLow:6,historyHigh:80,distanceHistoryLowPct:66.7,drawdownHistoryHighPct:-87.5,return5d:4,return20d:12,return63d:8,return126d:-20,ma20:9,ma50:11,ma200:25,annualizedVolPct:90},
 {symbol:'TQQQ',close:30,historyBars:2200,historyLow:20,historyHigh:100,distanceHistoryLowPct:50,drawdownHistoryHighPct:-70,return5d:-2,return20d:3,return63d:-5,return126d:-10,ma20:29,ma50:31,ma200:45,annualizedVolPct:70}
];
const analysis={tickers:[
 {symbol:'SOXL',score:55,bias:'BULLISH',confidence:70,coverage:80},
 {symbol:'SMH',score:40,bias:'BULLISH',confidence:65,coverage:75},
 {symbol:'QQQ',score:-20,bias:'BEARISH',confidence:60,coverage:60}
]};
const rows=buildBigMoveCandidates(market,analysis,null);
if(rows[0]?.symbol!=='SOXL')throw new Error('Expected SOXL to rank first in smoke fixture');
if(!(rows[0].setupScore>rows[1].setupScore))throw new Error('Expected stronger setup to rank higher');
if(bigMovePacket(rows).candidates.length!==2)throw new Error('Packet candidate count mismatch');
console.log('Big Move smoke test OK',rows.map(x=>`${x.symbol}:${x.setupScore}`).join(' · '));
