import puppeteer from "puppeteer-core";

const filePath = process.argv[2];
if (!filePath) {
  console.log("Usage: node upload-image.js /path/to/image.png");
  process.exit(1);
}

const b = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const p = (await b.pages()).at(-1);
const input = await p.$('input[type="file"]');
await input.uploadFile(filePath);

// Wait for upload button to appear and click it
await p.waitForSelector('button:not([disabled])');
await new Promise(r => setTimeout(r, 500));

const buttons = await p.$$('button');
for (const btn of buttons) {
  const text = await btn.evaluate(el => el.textContent);
  if (text.includes('Upload')) {
    await btn.click();
    break;
  }
}

// Wait for result
await new Promise(r => setTimeout(r, 2000));

// Get the resulting URL
const result = await p.evaluate(() => {
  const codeEl = document.querySelector('code');
  return codeEl ? codeEl.textContent : null;
});

console.log(result);
await b.disconnect();
