const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:2200,height:1300},deviceScaleFactor:2});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#tTel','+82-43-000-0000'); await pg.fill('#tDwgNo','K-001'); await pg.fill('#tParts','PANEL 1000x1000\nBOLT M10\nSTAY');
 await pg.selectOption('#sheetKind','detail');
 await pg.waitForTimeout(500); await pg.click('#fit'); await pg.waitForTimeout(300);
 await pg.screenshot({path:'/home/claude/cad/verify/detail.png',clip:{x:790,y:100,width:1000,height:700}});
 console.log(errs); await b.close();})();
