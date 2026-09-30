const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:2200,height:1300}});
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.locator('input[name=rf][value="2"]').check();await pg.waitForTimeout(500);
 console.log(await pg.evaluate(()=>[...document.querySelectorAll('input[name=rf]')].map(r=>[r.value,r.checked,r.disabled])));
 await b.close();})();
