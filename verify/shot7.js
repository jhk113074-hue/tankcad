const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:2200,height:1300},deviceScaleFactor:2});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#tCustomer','KORVAN IND LTD');await pg.fill('#tProject','Sample project');await pg.fill('#tAddress','Gimpo, Korea  TEL +82-31-997-6285');await pg.waitForTimeout(400);
 await pg.click('#fit'); await pg.waitForTimeout(300);
 const box=await pg.locator('#c').boundingBox();
 await pg.screenshot({path:'/home/claude/cad/verify/t_block.png',clip:{x:box.x+box.width*0.62,y:box.y,width:box.width*0.38,height:box.height}});
 console.log(errs); await b.close();})();
