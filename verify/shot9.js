const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:2200,height:1300}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#L0','5000');
 const cells=pg.locator('#egrid button'); console.log('cells',await cells.count());
 await pg.locator('input[name=emode][value=han]').check(); await cells.nth(1).click();
 await pg.locator('input[name=emode][value=vent]').check(); await cells.nth(1).click(); await cells.nth(7).click();
 await pg.waitForTimeout(400); await pg.click('#fit'); await pg.waitForTimeout(300);
 await pg.screenshot({path:'/home/claude/cad/verify/marks.png'});
 await pg.locator('.box:has(#egrid)').screenshot({path:'/home/claude/cad/verify/marks_grid.png'});
 console.log(errs); await b.close();})();
