#!/usr/bin/env tsx

import { cfg } from './config.js';
import { context, page } from './playwright.js';
import type { BrowserContext, Page } from 'playwright-chromium';
import fs from 'node:fs';
import chalk from 'chalk';

type library = 'saved' | 'finished';
type book = {
  id: string,
  title: string,
  author: string,
  description: string,
  duration: number,
  rating: number,
  url: string,
  img: string,
};

fs.mkdirSync('books', { recursive: true });
// json database to save lists from https://www.blinkist.com/en/app/library
import { JSONFilePreset } from 'lowdb/node';
const defaultData : { guides: book[], saved: book[], finished: book[] } = { guides: [], saved: [], finished: [] };
const db = await JSONFilePreset('books/db.json', defaultData);

const cookieConsent = async (context: BrowserContext) => {
  return context.addCookies([
    { name: 'CookieConsent', value: JSON.stringify({stamp:'V2Zm11G30yff5ZZ8WLu8h+BPe03juzWMZGOyPF4bExMdyYwlFj+3Hw==',necessary:true,preferences:true,statistics:true,marketing:true,method:'explicit',ver:1,utc:1716329838000,region:'de'}), domain: 'www.blinkist.com', path: '/' }, // Accept cookies since consent banner overlays and blocks screen
  ]);
  // page.locator('button:has-text("Allow all cookies")').click().catch(() => {}); // solved by setting cookie above
};

const login = async (page: Page) => {
  await page.goto('https://www.blinkist.com/en/app/library/saved');
  // redirects if not logged in to https://www.blinkist.com/en/nc/login?last_page_before_login=/en/app/library/saved
  return Promise.any([page.waitForURL(/.*login.*/).then(() => {
    console.error('Not logged in! Will wait for 120s for you to log in...');
    return page.waitForTimeout(120*1000);
  }), page.locator('h3:has-text("Saved")').waitFor()]);
}

const updateLibrary = async (page: Page, list: library = 'saved') => {
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
    const books = await page.locator('a[data-test-id="book-card"]:not(.pointer-events-none)').all();
    for (const book of books) {
      const slug = await book.getAttribute('href');
      if (slug && slug.indexOf('/app/episodes')) continue;
      if (!slug) throw new Error('Book has no href attribute!');
      const id = slug.split('/').pop() ?? slug;
      const url = 'https://www.blinkist.com' + slug;
      const title = await book.getAttribute('aria-label');
      if (!title) throw new Error('Book has no title / aria-label attribute!');
      const img = await book.locator('img').getAttribute('src');
      if (!img) throw new Error('Book has no img src attribute!');
      const author = await book.locator('[data-test-id="subtitle"]').innerText();
      const description = await book.locator('[data-test-id="description"]').innerText();
      // const details = await book.locator('div:below([data-test-id="description"])').innerText();
      let meta = (await book.locator('div.text-mid-grey.text-caption.mt-2').last().innerText()).split('\n');
      const duration = parseFloat(meta[0].replace(' min', ''));
      const rating = parseFloat(meta[1]);
      const item: book = { id, title, author, description, duration, rating, url, img };
      if (dbList.find(i => i.id === id)) {
        if (!cfg.checkall) {
          console.log('Stopping at book already found in db.json:', item);
          break pages;
        } else {
          console.log('Book already in db.json:', item.id);
        }
      } else if (list === 'finished' && db.data.saved.find(i => i.id === id)) {
        // after downloading a book (even with reset to start), it will also appear in finished list
        // since we don't want to download it in finished as well, we skip it here
        // TODO to mark a book as finished, move it from saved to finished in books/db.json and books/
        console.log('Skipping book already in saved list:', item.id);
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

const downloadFile = (url: string, path: string) => fetch(url).then(res => res.arrayBuffer()).then(bytes => fs.writeFileSync(path, Buffer.from(bytes)));

const downloadBooks = async (page: Page, list: library = 'saved') => {
  const dbList = db.data[list]; // sorted by date added ascending
  console.log('Check/download new books:', list);
  console.log(list, 'books in db.json:', dbList.length);

  let i = 0;
  for (const book of dbList) {
    i++;
    const bookDir = `books/${list}/${book.id}/`;
    const bookJson = bookDir + 'book.json';
    const existsDir = fs.existsSync(bookDir);
    const existsJson = existsDir && fs.existsSync(bookJson);
    const existsAudio = existsDir && fs.existsSync(bookDir + 'Summary.m4a');
    console.log(`Book ${i}:`, book.id,
                existsDir ?
                  (existsJson ?
                    (existsAudio ? chalk.green('exists') : chalk.yellow('audio missing'))
                  : chalk.red('missing'))
                : chalk.yellow('download'));
    if (existsDir) continue;
    console.log(`Downloading book (${dbList.length - i} left):`, book.url);
    const gql = page.waitForResponse(r => r.request().method() == 'POST' && r.url() == 'https://gql-gateway.blinkist.com/graphql');
    await page.goto('https://www.blinkist.com/en/app/books/' + book.id);
    const contentState = (await (await gql).json()).data.user.contentStateByContentTypeAndId;
    const detailsBox = page.locator('div:has(h4)').last();
    try {
      await detailsBox.waitFor({ timeout: 15000 });
    } catch (error) {
      // e.g. https://www.blinkist.com/en/app/books/bulletproof-diet-en
      // redirected in JS to https://www.blinkist.com/en/app/for-you?missing-title=bulletproof-diet-en
      console.error(chalk.red('Missing book:'), book.id);
      console.error('Error:', error);
      console.log();
      fs.mkdirSync(bookDir, { recursive: true });
      continue;
    }
    const detailDivs = await detailsBox.locator('div').all();
    const categories = await detailDivs[1].locator('a').all().then(a => Promise.all(a.map(a => a.innerText())));
    const descriptionLong = await detailDivs[2].innerHTML();
    const authorDetails = await detailDivs[3].innerHTML();
    const ratings = await page.locator('span:has-text(" ratings)")').innerText({ timeout: 200 }).catch(() => undefined); // e.g. 3.9 (89 ratings); may not exist
    const durationDetail = await page.locator('span:has-text(" mins")').innerText(); // e.g. 15 mins
    const details = { ...book, ratings, durationDetail, categories, descriptionLong, authorDetails, contentState };
    console.log('Details:', details);

    const chapters = [];
    let orgChapter = undefined;
    const resp = await page.goto('https://www.blinkist.com/en/nc/reader/' + book.id);
    if (resp && resp.status() !== 404) {
      await page.locator('.reader-content__text').waitFor(); // wait for content to load
      // chapter number (Introduction, Key idea 1...), but last chapter (summary) has no name, so we time out and return Summary
      const chapterNumber = () => page.locator('[data-test-id="currentChapterNumber"]').innerText({ timeout: 200 }).catch(() => 'Summary');
      orgChapter = await chapterNumber();
      console.log('Original chapter:', orgChapter);
      const reset = async () => {
        const chapter = await chapterNumber();
        if (chapter === 'Introduction') return;
        await page.locator('[data-test-id="keyIdeas"]').click(); // open Key ideas chapter menu
        await page.locator('[data-test-id="chapterLink"]').first().click(); // go to first chapter (Introduction)
        while (chapter === await chapterNumber()) {
          // console.log('Waiting for 200ms...');
          await page.waitForTimeout(200);
        }
      }
      await reset();
      do {
        const name = await chapterNumber();
        const title = await page.locator('h2').first().innerText();
        console.log(name, title);
        const text = await page.locator('.reader-content__text').first().innerHTML();
        const audio = await page.locator('[data-test-id="readerAudio"]').getAttribute('audio-url');
        const chapter = { name, title, text, audio };
        chapters.push(chapter);
        const nextBtn = page.locator('[data-test-id="nextChapter"]');
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          while (title === await page.locator('h2').first().innerText()) {
            // console.log('Waiting for 200ms...');
            await page.waitForTimeout(200);
          }
        } else break;
      } while (true);
      await reset();
    } else {
      console.error('Book not found:', book.id);
    }

    // write data at the end
    fs.mkdirSync(bookDir, { recursive: true });
    fs.writeFileSync(bookJson, JSON.stringify({ ...details, downloadDate: new Date(), orgChapter, chapters }, null, 2));
    await downloadFile(book.img, bookDir + 'cover.png');
    if (cfg.audio) {
      console.log('Downloading audio files:', chapters.filter(c => c.audio).length);
      for (const { name, audio } of chapters) {
        if (audio) await downloadFile(audio, bookDir + name + '.m4a');
      }
    }
    console.log();
    // process.exit(0);
  }
  console.log();
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
