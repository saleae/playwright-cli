/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-console */

import * as program from 'commander';
import * as playwright from 'playwright';
import { RecorderController } from './recorder/recorderController';

program
    .version('Version ' + require('../package.json').version)
    .option('-b, --browser <browserType>', 'browser to use, one of cr, chromium, ff, firefox, wk, webkit', 'chromium')
    .option('--color-scheme <scheme>', 'emulate preferred color scheme, "light" or "dark"')
    .option('--device <deviceName>', 'emulate device, for example  "iPhone 11"')
    .option('--geolocation <coordinates>', 'specify geolocation coordinates, for example "37.819722,-122.478611"')
    .option('--headless', 'run in headless mode', false)
    .option('--lang <language>', 'specify language / locale, for example "en-GB"')
    .option('--proxy-server <proxy>', 'specify proxy server, for example "http://myproxy:3128" or "socks5://myproxy:8080"')
    .option('--timezone <time zone>', 'time zone to emulate, for example "Europe/Rome"')
    .option('--user-agent <ua string>', 'specify user agent string')
    .option('--viewport-size <size>', 'specify browser viewport size in pixels, for example "1280, 720"');


const browsers = [
  { alias: 'cr', name: 'Chromium', type: 'chromium' },
  { alias: 'ff', name: 'Firefox', type: 'firefox' },
  { alias: 'wk', name: 'WebKit', type: 'webkit' },
];

program
    .command('open [url]')
    .description('open page in browser specified via -b, --browser')
    .action(function(url, command) {
      open(command.parent, url);
    }).on('--help', function() {
      console.log('');
      console.log('Examples:');
      console.log('');
      console.log('  $ open');
      console.log('  $ -b webkit open https://example.com');
    });

for (const {alias, name, type} of browsers) {
  program
      .command(`${alias} [url]`)
      .description(`open page in ${name}`)
      .action(function(url, command) {
        open({ ...command.parent, browser: type }, url);
      }).on('--help', function() {
        console.log('');
        console.log('Examples:');
        console.log('');
        console.log(`  $ ${alias} https://example.com`);
      });
}

program
    .command('codegen [url]')
    .description('open given page and generate code for user actions')
    .action(function(url, command) {
      record(command.parent, url);
    }).on('--help', function() {
      console.log('');
      console.log('Examples:');
      console.log('');
      console.log('  $ record');
      console.log('  $ -b webkit record https://example.com');
    });

program.parse(process.argv);

type Options = {
  browser: string,
  colorScheme: string | undefined,
  device: string | undefined,
  geolocation: string,
  headless: boolean,
  lang: string,
  proxyServer: string,
  timezone: string | undefined,
  viewportSize: string | undefined,
  userAgent: string | undefined
};

async function launchContext(options: Options) {
  const browserType = lookupBrowserType(options.browser);
  validateOptions(options);
  const launchOptions: playwright.LaunchOptions = {
    headless: options.headless,
    args: []
  };
  const contextOptions: playwright.BrowserContextOptions = options.device ? playwright.devices[options.device] : {};

  // Proxy

  if (options.proxyServer) {
    launchOptions.proxy = {
      server: options.proxyServer
    };
  }

  const browser = await browserType.launch(launchOptions);

  // Viewport size
  if (options.viewportSize) {
    try {
      const [ width, height ] = options.viewportSize.split(',').map(n => parseInt(n, 10));
      contextOptions.viewport = { width, height };
    } catch (e) {
      console.log('Invalid window size format: use "width, height", for example --window-size=800,600');
      process.exit(0);
    }
  }

  // Geolocation

  if (options.geolocation) {
    try {
      const [latitude, longitude] = options.geolocation.split(',').map(n => parseFloat(n.trim()));
      contextOptions.geolocation = {
        latitude,
        longitude
      };
    } catch (e) {
      console.log('Invalid geolocation format: user lat, long, for example --geolocation="37.819722,-122.478611"');
      process.exit(0);
    }
    contextOptions.permissions = ['geolocation'];
  }

  // User agent

  if (options.userAgent)
    contextOptions.userAgent = options.userAgent;

  // Lang

  if (options.lang)
    contextOptions.locale = options.lang;

  // Color scheme

  if (options.colorScheme)
    contextOptions.colorScheme = options.colorScheme as 'dark' | 'light';

  // Timezone

  if (options.timezone)
    contextOptions.timezoneId = options.timezone;

  // Close app when the last window closes.

  const context = await browser.newContext(contextOptions);
  context.on('page', page => {
    page.on('close', () => {
      if (!context.pages().length)
        browser.close();
    })
  });
  return context;
}

async function openPage(context: playwright.BrowserContext, url: string | undefined) {
  const page = await context.newPage();
  if (url) {
    if (!url.startsWith('http'))
      url = 'http://' + url;
    await page.goto(url);
  }
}

async function open(options: Options, url: string | undefined) {
  const context = await launchContext(options);
  await openPage(context, url);
}

async function record(options: Options, url: string | undefined) {
  const context = await launchContext(options);
  const browserType = lookupBrowserType(options.browser);
  new RecorderController(browserType.name(), context, process.stdout);
  await openPage(context, url);
}

function lookupBrowserType(name: string): playwright.BrowserType<playwright.WebKitBrowser | playwright.ChromiumBrowser | playwright.FirefoxBrowser> {
  switch (name) {
    case 'chromium': return playwright.chromium!;
    case 'webkit': return playwright.webkit!;
    case 'firefox': return playwright.firefox!;
    case 'cr': return playwright.chromium!;
    case 'wk': return playwright.webkit!;
    case 'ff': return playwright.firefox!;
  }
  program.help();
}

function validateOptions(options: Options) {
  if (options.device && !(options.device in playwright.devices)) {
    console.log(`Device descriptor not found: '${options.device}', available devices are:`);
    for (let name in playwright.devices)
      console.log(`  "${name}"`);
    process.exit(0);
  }
  if (options.colorScheme && !["light", "dark"].includes(options.colorScheme)) {
    console.log('Invalid color scheme, should be one of "light", "dark"');
    process.exit(0);
  }
}
