import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // loads env vars from file - will not set vars that are already set, i.e., can overwrite values from file by prefixing, e.g., VAR=VAL node ...

// Options - also see table in README.md
export const cfg = {
  debug: process.env.PWDEBUG == '1', // runs non-headless and opens https://playwright.dev/docs/inspector
  record: process.env.RECORD == '1', // `recordHar` (network) + `recordVideo`
  dryrun: process.env.DRYRUN == '1', // don't save anything
  show: process.env.SHOW != '0', // run non-headless by default to avoid captcha, TODO make headless work
  get headless() { return !this.debug && !this.show },
  width: Number(process.env.WIDTH) || 1280, // width of the opened browser
  height: Number(process.env.HEIGHT) || 1280, // height of the opened browser
  timeout: (Number(process.env.TIMEOUT) || 30) * 1000, // default timeout for playwright is 30s
  browserDir: process.env.BROWSER_DIR || 'browser', // for multiple accounts or testing
  update: process.env.UPDATE != '0', // set to 0 to disable updating library
  checkall: process.env.CHECKALL == '1', // set to 1 to check all books in the library list instead of stopping at the first book already found in db.json
  download: process.env.DOWNLOAD != '0', // set to 0 to disable downloading books
  audio: process.env.AUDIO != '0', // set to 0 to disable downloading audio
};
