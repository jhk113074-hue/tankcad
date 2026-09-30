const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:1500,height:900}});
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.fill('#tProject','Sample project');await pg.waitForTimeout(400);
 const box=await pg.locator('#c').boundingBox();
 // zoom about the title block (top part) and the table (bottom part)
 for (const [fy,name] of [[0.32,'a'],[0.9,'b']]) {
   await pg.click('#fit'); await pg.waitForTimeout(150);
   await pg.evaluate(([x,y])=>{const c=document.getElementById('c');
     for(let i=0;i<2;i++) c.dispatchEvent(new WheelEvent('wheel',{deltaY:-700,clientX:x,clientY:y,bubbles:true,cancelable:true}));},[box.x+box.width*0.84,box.y+box.height*fy]);
   await pg.waitForTimeout(200);
   await pg.screenshot({path:`/home/claude/cad/verify/z_${name}.png`,clip:{x:box.x,y:box.y,width:box.width,height:box.height}});
 }
 await b.close();
})();
