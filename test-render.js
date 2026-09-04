import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  
  await page.goto('http://127.0.0.1:3000/app/quests', { waitUntil: 'networkidle2', timeout: 10000 }).catch(e => console.log(e));
  
  const body = await page.evaluate(() => document.body.innerHTML);
  console.log("BODY LENGTH:", body.length);
  
  await browser.close();
})();
