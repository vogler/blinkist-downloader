import { cfg } from './config.js';

// Try to avoid bot detection by Cloudflare.
// Getting 'Verify you are human by completing the action below.' when running with SHOW=0
// Could also use puppeteer-extra-plugin-stealth like for free-games-claimer.
// Using https://github.com/apify/fingerprint-suite worked, but has no launchPersistentContext...
// From https://github.com/apify/fingerprint-suite/issues/162:
import { FingerprintInjector } from 'fingerprint-injector';
import { FingerprintGenerator } from 'fingerprint-generator';

const { fingerprint, headers } = new FingerprintGenerator().getFingerprint({
    // devices: ["mobile"],
    // operatingSystems: ["android"],
});
// console.log('Fingerprint:', fingerprint);

import { chromium } from 'playwright-chromium';

export const context = await chromium.launchPersistentContext(cfg.browserDir, {
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

export const page = context.pages().length ? context.pages()[0] : await context.newPage(); // should always exist
