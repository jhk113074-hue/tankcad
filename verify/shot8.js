const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:2200,height:1300}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#L0','5000');
 const cells=pg.locator('#egrid button'); console.log('cells',await cells.count());
 // top row (first 5 buttons) : delete cols 3,4 of top row and col 4 of second row -> indexes 3,4,8
 for (const k of [3,4,8]) await cells.nth(k).click();
 await pg.locator('input[name=emode][value=pil]').check();
 await cells.nth(4).click();
 await pg.waitForTimeout(400); await pg.click('#fit'); await pg.waitForTimeout(300);
 const box=await pg.locator('#c').boundingBox();
 await pg.locator('.box:has(#egrid)').screenshot({path:'/home/claude/cad/verify/l_grid.png'});
 console.log(errs); await b.close();})();
