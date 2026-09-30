const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(async()=>chromium.launch());
 const pg=await b.newPage({viewport:{width:1280,height:800}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(600);
 await pg.screenshot({path:'/home/claude/cad/verify/shot.png'});
 console.log('errors',errs);await b.close();
})();
