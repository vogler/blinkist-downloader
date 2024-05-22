#!/usr/bin/env node

import { chromium } from 'playwright-chromium';
import { cfg } from './config.js';

// json database
import { JSONFilePreset } from 'lowdb/node';
const db = await JSONFilePreset('data/db.json', {});

// using puppeteer-extra-plugin-stealth only led to error "Couldn't sign you in - This browser or app may not be secure" on google login
// using https://github.com/apify/fingerprint-suite worked, but has no launchPersistentContext...
// from https://github.com/apify/fingerprint-suite/issues/162
import { FingerprintInjector } from 'fingerprint-injector';
import { FingerprintGenerator } from 'fingerprint-generator';

const { fingerprint, headers } = new FingerprintGenerator().getFingerprint({
    // devices: ["mobile"],
    // operatingSystems: ["android"],
});

const context = await chromium.launchPersistentContext(cfg.dir.browser, {
    headless: cfg.headless,
    userAgent: fingerprint.navigator.userAgent,
    viewport: {
        width: fingerprint.screen.width,
        height: fingerprint.screen.height,
    },
    extraHTTPHeaders: {
        'accept-language': headers['accept-language'],
    },
    args: [ // https://peter.sh/experiments/chromium-command-line-switches
      '--hide-crash-restore-bubble',
    ],
});

await new FingerprintInjector().attachFingerprintToPlaywright(context, { fingerprint, headers });


if (!cfg.debug) context.setDefaultTimeout(cfg.timeout);

try {
  await context.addCookies([
    { name: 'CookieConsent', value: JSON.stringify({stamp:'V2Zm11G30yff5ZZ8WLu8h+BPe03juzWMZGOyPF4bExMdyYwlFj+3Hw==',necessary:true,preferences:true,statistics:true,marketing:true,method:'explicit',ver:1,utc:1716329838000,region:'de'}), domain: 'www.blinkist.com', path: '/' }, // Accept cookies since consent banner overlays and blocks screen
  ]);

  const page = context.pages().length ? context.pages()[0] : await context.newPage(); // should always exist
  await page.goto('https://www.blinkist.com/en/app/library/saved');

  // https://www.blinkist.com/en/nc/login?last_page_before_login=/en/app/library/saved

  await Promise.any([page.waitForURL(/.*login.*/).then(async () => {
    console.error('Not logged in! Will wait for 120s for you to log in...');
    await page.waitForTimeout(120*1000);
  }), page.locator('h3:has-text("Saved")').waitFor()]);
  
  page.locator('h2:has-text("Verify you are human by completing the action below.")').waitFor().then(() => {;
    console.error('Verify you are human by completing the action below.');
    process.exitCode ||= 2;
  });

  // page.locator('button:has-text("Allow all cookies")').click().catch(() => {}); // solved by setting cookie above

  const nextBtn = page.locator('button:has-text("Next"):not([disabled])');
  do {
    const items = await page.locator('div:has-text("Saved") p').innerText();
    console.log('Saved:', items);
    const books = await page.locator('a[data-test-id="book-card"]').all();
    for (const book of books) {
      const url = 'https://www.blinkist.com' + await book.getAttribute('href');
      const title = await book.getAttribute('aria-label');
      const img = await book.locator('img').getAttribute('src');
      const author = await book.locator('[data-test-id="subtitle"]').innerText();
      const description = await book.locator('[data-test-id="description"]').innerText();
      // const details = await book.locator('div:below([data-test-id="description"])').innerText();
      let [duration, rating] = (await book.locator('div.text-mid-grey.text-caption.mt-2').last().innerText()).split('\n');
      duration = parseFloat(duration.replace(' min', ''));
      rating = parseFloat(rating);
      console.log({ title, author, description, duration, rating, url, img });
    }
    await page.pause();
    await nextBtn.click();
    while (items === await page.locator('div:has-text("Saved") p').innerText()) {
      console.log('Waiting for 500ms...');
      await page.waitForTimeout(500);
    }
  } while (await nextBtn.count());
} catch (error) {
  console.error(error); // .toString()?
  process.exitCode ||= 1;
} finally {
  await db.write(); // write out json db
  await context.close();
}
