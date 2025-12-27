import puppeteer from 'puppeteer-core';

const browser = await puppeteer.connect({
  browserURL: 'http://localhost:9222',
  defaultViewport: null
});
const pages = await browser.pages();
const page = pages[0];
// Wait for page to settle
await new Promise(r => setTimeout(r, 10000));
await page.screenshot({ path: '/tmp/mew-check.png' });
const title = await page.$eval('[class*=NodeTitle], h1', el => el.textContent).catch(() => 'NOT FOUND');
const items = await page.$$eval('[class*=RelatedObject]', els => els.length);
console.log(JSON.stringify({ title, items, url: page.url() }));
await browser.disconnect();
