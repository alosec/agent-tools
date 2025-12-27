import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const page = (await browser.pages()).at(-1);
await page.goto("http://localhost:3000/auth/signin");
await page.waitForSelector('input[type="email"]');

// Type credentials
await page.type('input[type="email"]', 'alexgarcia042@gmail.com', {delay: 30});
await page.type('input[type="password"]', 'bigmoney', {delay: 30});

// Click submit
await page.click('button[type="submit"]');

// Wait for navigation
await new Promise(r => setTimeout(r, 5000));

console.log("Current URL:", page.url());
await page.screenshot({ path: '/tmp/pedi-loggedin.png', fullPage: false });
console.log("Screenshot saved to /tmp/pedi-loggedin.png");

await browser.disconnect();
