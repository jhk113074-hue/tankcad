const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:1500,height:900}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(700);
 await pg.screenshot({path:'/home/claude/cad/verify/shot_sheet.png'});
 await pg.check('#sheetOn',{force:true}).catch(()=>{});
 await pg.uncheck('#sheetOn');await pg.waitForTimeout(500);
 await pg.screenshot({path:'/home/claude/cad/verify/shot_plan.png'});
 console.log('errors',errs);await b.close();
})();
