const T=require('../web/tank.js');let o=[];
for(let n=500;n<=20000;n+=100){ if(T.checkSegment(n)!==null) continue;
 for(let base=0;base<=1;base++){const b=base?1000:0;
  o.push(`F3 ${n} ${base} ${T.frontSplit(n,b).join(' ')}`.trim());
  o.push(`S3 ${n} ${base} ${T.sideSplit(n,b).join(' ')}`.trim());
 }}
console.log(o.join('\n'));
