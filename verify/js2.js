const T=require('../web/tank.js');
function safe(f){ // guard: emulate infinite loop as ERR
  try{ return f().join(' ');}catch(e){return 'ERR';}
}
let bad={F3:[],S3:[],F4:[],S4:[]};
for(let n=500;n<=20000;n+=100){ if(T.checkSegment(n)!==null) continue;
 for(let base=0;base<=1;base++){const b=base?1000:0;
  if(safe(()=>T.frontSplit(n,b))==='ERR')bad.F3.push([n,base]);
  if(safe(()=>T.sideSplit(n,b))==='ERR')bad.S3.push([n,base]);
  for(let h=0;h<=4;h++) if(safe(()=>T.splitHalf(n,b,h))==='ERR')bad.F4.push([n,base,h]);
 }}
for(const k in bad)console.log(k,bad[k].length,JSON.stringify(bad[k].slice(0,8)));
