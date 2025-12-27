import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const page = (await browser.pages()).at(-1);
await page.goto("http://localhost:3000/auth/signin");
await page.waitForSelector('input[type="email"]');

// Type into fields
await page.type('input[type="email"]', 'alexgarcia042@gmail.com');
await page.type('input[type="password"]', 'big money');

// Click submit
await page.click('button[type="submit"]');

// Wait for navigation
await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});

console.log("Current URL:", page.url());
await page.screenshot({ path: '/tmp/pedi-loggedin.png' });
console.log("Screenshot saved");
