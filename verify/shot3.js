const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:1500,height:900}});
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#tCustomer','TEST CUSTOMER');await pg.fill('#tAddress','Sample address, Country');await pg.fill('#tProject','Sample project');
 await pg.waitForTimeout(400);
 const box=await pg.locator('#c').boundingBox();
 // zoom on title block (right side) and plan view
 await pg.mouse.move(box.x+box.width*0.86, box.y+box.height*0.5);
 for(let i=0;i<4;i++){await pg.mouse.wheel(0,-300);await pg.waitForTimeout(40);}
 await pg.waitForTimeout(300);
 await pg.screenshot({path:'/home/claude/cad/verify/shot_title.png',clip:{x:box.x,y:box.y,width:box.width,height:box.height}});
 await b.close();
})();
