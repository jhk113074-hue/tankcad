const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:3400,height:1900},deviceScaleFactor:1});
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#tCustomer','TEST CUSTOMER');await pg.fill('#tAddress','Sample address, Country');await pg.fill('#tProject','Sample project');
 await pg.waitForTimeout(500);
 const box=await pg.locator('#c').boundingBox();
 await pg.screenshot({path:'/home/claude/cad/verify/shot_title.png',clip:{x:box.x+box.width*0.62,y:box.y,width:box.width*0.36,height:box.height}});
 await b.close();
})();
