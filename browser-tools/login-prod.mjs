import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const page = (await browser.pages()).at(-1);

// Type into fields
await page.type('input[type="email"]', 'alexgarcia042@gmail.com', {delay: 50});
await page.type('input[type="password"]', 'big money', {delay: 50});

// Click submit
await page.click('button[type="submit"]');

// Wait for navigation
await new Promise(r => setTimeout(r, 5000));

console.log("Current URL:", page.url());
await page.screenshot({ path: '/tmp/pedi-calendar-live.png', fullPage: false });
console.log("Screenshot saved");

await browser.disconnect();
