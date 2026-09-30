const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:2200,height:1300},deviceScaleFactor:3});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#L0','5000'); await pg.fill('#W0','3000');
 
 await pg.waitForTimeout(500); await pg.click('#fit'); await pg.waitForTimeout(300);
 await pg.screenshot({path:'/home/claude/cad/verify/hatch.png',clip:{x:790,y:100,width:1000,height:700}});
 await pg.screenshot({path:'/home/claude/cad/verify/hatch_f.png',clip:{x:860,y:640,width:520,height:160}});
 console.log(errs); await b.close();})();
