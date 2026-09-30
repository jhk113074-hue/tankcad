const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:1600,height:1000}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/cad/web/index.html');await pg.waitForTimeout(500);
 await pg.setInputFiles('#chtFile','/root/.claude/uploads/4c8649fa-096c-5da7-bdc6-171d3a7756a3/5af04307-default.cht');
 await pg.waitForTimeout(500);
 console.log(await pg.inputValue('#tNotes').then(v=>v.split('\n').length+' notes; first: '+v.split('\n')[0]));
 console.log('REMARKS:',JSON.stringify(await pg.inputValue('#tRemarks')));
 console.log('PARTS:',JSON.stringify(await pg.inputValue('#tParts')), await pg.textContent('#chtMsg'));
 console.log(errs); await b.close();})();
