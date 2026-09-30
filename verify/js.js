const T=require('../web/tank.js');let o=[];
for(let n=500;n<=20000;n+=100)if(T.checkSegment(n)===null)for(let base=0;base<=1;base++){
 const b=base?1000:0;
 o.push(`F3 ${n} ${base} ${T.frontSplit(n,b).join(' ')}`.trim());
 o.push(`S3 ${n} ${base} ${T.sideSplit(n,b).join(' ')}`.trim());
 for(let h=0;h<=4;h++){o.push(`F4 ${n} ${base} ${h} ${T.splitHalf(n,b,h).join(' ')}`.trim());o.push(`S4 ${n} ${base} ${h} ${T.splitHalf(n,b,h).join(' ')}`.trim());}
}
console.log(o.join('\n'));
