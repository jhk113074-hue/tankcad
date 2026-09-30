const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:2200,height:1300},deviceScaleFactor:2});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#L0','5000'); await pg.fill('#W0','3000'); await pg.fill('#W1','2000');
 const cells=pg.locator('#egrid button'); console.log(await cells.count());
 await cells.nth(4).click(); await cells.nth(9).click();
 await pg.selectOption('#sheetKind','frame');
 await pg.waitForTimeout(500); await pg.click('#fit'); await pg.waitForTimeout(300);
 await pg.screenshot({path:'/home/claude/cad/verify/frame.png',clip:{x:790,y:100,width:1000,height:700}});
 console.log(errs); await b.close();})();
