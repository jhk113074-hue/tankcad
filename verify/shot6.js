const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:2200,height:1300}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(600);
 await pg.click('#fit'); await pg.waitForTimeout(300);
 const box=await pg.locator('#c').boundingBox();
 await pg.screenshot({path:'/home/claude/cad/verify/e_all.png',clip:box});
 // zoom on front elevation (bottom-left)
 await pg.evaluate(([x,y])=>{const c=document.getElementById('c');
   for(let i=0;i<2;i++) c.dispatchEvent(new WheelEvent('wheel',{deltaY:-700,clientX:x,clientY:y,bubbles:true,cancelable:true}));},[box.x+box.width*0.25,box.y+box.height*0.72]);
 await pg.waitForTimeout(300);
 await pg.screenshot({path:'/home/claude/cad/verify/e_front.png',clip:box});
 console.log('errors',errs);
 await b.close();
})();
