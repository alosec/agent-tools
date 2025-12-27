import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const page = (await browser.pages()).at(-1);

// Clear any existing values first
await page.evaluate(() => {
  document.querySelector('input[type="email"]').value = '';
  document.querySelector('input[type="password"]').value = '';
});

// Type into fields with correct password
await page.type('input[type="email"]', 'alexgarcia042@gmail.com', {delay: 30});
await page.type('input[type="password"]', 'big oney', {delay: 30});

// Click submit
await page.click('button[type="submit"]');

// Wait for navigation
await new Promise(r => setTimeout(r, 5000));

console.log("Current URL:", page.url());
await page.screenshot({ path: '/tmp/pedi-after-login.png', fullPage: false });
console.log("Screenshot saved");

await browser.disconnect();
