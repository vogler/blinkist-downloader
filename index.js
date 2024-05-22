#!/usr/bin/env node

import { cfg } from './config.js';
import { context, page } from './playwright.js';
import { existsSync } from 'node:fs';
import chalk from 'chalk';

// json database to save lists from https://www.blinkist.com/en/app/library
import { JSONFilePreset } from 'lowdb/node';
const db = await JSONFilePreset('data/db.json', { guides: [], saved: [], finished: [] });

const cookieConsent = async context => {
  return context.addCookies([
    { name: 'CookieConsent', value: JSON.stringify({stamp:'V2Zm11G30yff5ZZ8WLu8h+BPe03juzWMZGOyPF4bExMdyYwlFj+3Hw==',necessary:true,preferences:true,statistics:true,marketing:true,method:'explicit',ver:1,utc:1716329838000,region:'de'}), domain: 'www.blinkist.com', path: '/' }, // Accept cookies since consent banner overlays and blocks screen
  ]);
  // page.locator('button:has-text("Allow all cookies")').click().catch(() => {}); // solved by setting cookie above
};

const login = async page => {
  await page.goto('https://www.blinkist.com/en/app/library/saved');
  // redirects if not logged in to https://www.blinkist.com/en/nc/login?last_page_before_login=/en/app/library/saved
  return Promise.any([page.waitForURL(/.*login.*/).then(() => {
    console.error('Not logged in! Will wait for 120s for you to log in...');
    return page.waitForTimeout(120*1000);
  }), page.locator('h3:has-text("Saved")').waitFor()]);
}

const updateLibrary = async (page, list = 'saved') => { // list = 'saved' | 'finished'
  const dbList = db.data[list]; // sorted by date added ascending
  // sorted by date added descending
  const url = 'https://www.blinkist.com/en/app/library/' + list;
  await page.goto(url);
  const newBooks = [];

  console.log('Updating library:', url);
  console.log(list, 'books in db.json:', dbList.length);

  const listItems = page.locator(`div:has-text("${list}") p`);
  const nextBtn = page.locator('button:has-text("Next"):not([disabled])');
  pages: do { // go through pages
    const items = await listItems.innerText();
    console.log('Current page:', items);
    const books = await page.locator('a[data-test-id="book-card"]').all();
    for (const book of books) {
      const slug = await book.getAttribute('href');
      const id = slug.split('/').pop();
      const url = 'https://www.blinkist.com' + slug;
      const title = await book.getAttribute('aria-label');
      const img = await book.locator('img').getAttribute('src');
      const author = await book.locator('[data-test-id="subtitle"]').innerText();
      const description = await book.locator('[data-test-id="description"]').innerText();
      // const details = await book.locator('div:below([data-test-id="description"])').innerText();
      let [duration, rating] = (await book.locator('div.text-mid-grey.text-caption.mt-2').last().innerText()).split('\n');
      duration = parseFloat(duration.replace(' min', ''));
      rating = parseFloat(rating);
      const item = { id, title, author, description, duration, rating, url, img };
      if (dbList.find(i => i.id === id)) {
        if (!cfg.checkall) {
          console.log('Stopping at book already found in db.json:', item);
          break pages;
        } else {
          console.log('Book already in db.json:', item.id);
        }
      } else {
        console.log('New book:', item);
        newBooks.push(item);
      }
    }
    // await page.pause();
    if (await nextBtn.count()) { // while next button is not disabled; can't check this in do-while condition since it would already be false after click()
      await nextBtn.click(); // click next page button
      // wait until items on page have been updated
      while (items === await listItems.innerText()) {
        // console.log('Waiting for 500ms...');
        await page.waitForTimeout(500);
      }
    } else break;
  } while (true);
  // add new books to db.json in reverse order
  dbList.push(...newBooks.toReversed());
  await db.write(); // write out json db
  console.log('New books:', newBooks.length);
  console.log();
};

const downloadBooks = async (page, list = 'saved') => { // list = 'saved' | 'finished'
  const dbList = db.data[list]; // sorted by date added ascending
  const newBooks = [];
  console.log('Check/download new books:', list);
  console.log(list, 'books in db.json:', dbList.length);

  for (const book of dbList) {
    const exists = existsSync(`data/books/${book.id}`);
    console.log('Book:', book.id, exists ? chalk.green('exists') : chalk.red('missing'));
    if (exists) continue;
    console.log('Downloading book:', book.url);
    await page.goto(book.url);
    const details = await page.locator('div:has(h4)').last().locator('div').all();
    const categories = await Promise.all(details[1].locator('a').all().then(a => a.map(a => a.innerText())));
    const description = await details[2].innerText();
    const authorDetails = await details[3].innerText();
    console.log('Details:', { categories, description, authorDetails });
    process.exit(0); // TODO remove
  }
};

try {
  await cookieConsent(context);
  await login(page);
  
  page.locator('h2:has-text("Verify you are human by completing the action below.")').waitFor().then(() => {;
    console.error('Verify you are human by completing the action below.');
    if (cfg.headless) {
      console.error('Can not solve captcha in headless mode. Exiting...');
      process.exit(1);
    } else {
      return page.waitForTimeout(30*1000); // TODO wait until captcha is solved
    }
  }).catch(() => {});

  if (cfg.update) {
    await updateLibrary(page, 'saved');
    await updateLibrary(page, 'finished');
  }
  if (cfg.download) {
    await downloadBooks(page, 'saved');
    await downloadBooks(page, 'finished');
  }
} catch (error) {
  console.error(error); // .toString()?
  process.exitCode ||= 1;
} finally { // not reached on ctrl-c
  await db.write(); // write out json db
  await context.close();
}
