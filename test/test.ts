import puppeteer, { Browser, ElementHandle, KeyInput, Page } from 'puppeteer';
import path from 'path';

const asyncSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pressKey = async (page: Page, key: KeyInput, modifiers: KeyInput[]) => {
  const kb = page.keyboard;
  for (const mod of modifiers) {
    await kb.down(mod);
  }
  await kb.press(key);
  for (const mod of modifiers) {
    await kb.up(mod);
  }
};

const setShortcuts = async (browser: Browser) => {
  const page = await browser.newPage();
  await page.goto("chrome://extensions/shortcuts");
  await page.waitForSelector("body > extensions-manager");
  const getButtonJsPath = (n: number) => `document.querySelector("body > extensions-manager").shadowRoot
.querySelector("#viewManager > extensions-keyboard-shortcuts").shadowRoot
.querySelector("#container > div > div.card-controls > div:nth-child(${n}) > extensions-shortcut-input").shadowRoot
.querySelector("#edit")`
  const jsPathActivate = getButtonJsPath(1);
  const jsPathPause = getButtonJsPath(2);
  const jsPathSkipBack = getButtonJsPath(3);
  const jsPathSkipForward = getButtonJsPath(4);
  const getHandle = async (jspath: string) => (await page.evaluateHandle(jspath)).asElement() as ElementHandle;

  const buttonActivate = await getHandle(jsPathActivate);
  const buttonPause = await getHandle(jsPathPause);
  const buttonSkipBack = await getHandle(jsPathSkipBack);
  const buttonSkipForward = await getHandle(jsPathSkipForward);

  await buttonActivate.click();
  await pressKey(page, 'q', ['Alt']);
  await buttonPause.click();
  await pressKey(page, 'a', ['Alt']);
  await buttonSkipBack.click();
  await pressKey(page, 's', ['Alt']);
  await buttonSkipForward.click();
  await pressKey(page, 'd', ['Alt']);


  await page.close();
}


(async () => {
  const pathToExtension = path.join(process.cwd(), 'dist');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });
  await setShortcuts(browser).catch((e) => { console.error(e); });
  
  const page = await browser.newPage();
  await page.goto("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
  await page.$eval("video", async (el) => await el.play());
  
  await page.screenshot({ path: 'test1.png' });
  browser.keyboard;
  await pressKey(page, 'q', ['Alt']);
  await pressKey(page, 'q', ['Alt']);
  await pressKey(page, 'q', ['Alt']);
  await pressKey(page, 'q', ['Alt']);
  await pressKey(page, 'q', ['Alt']);
  await pressKey(page, 'q', ['Alt']);
  await asyncSleep(10000000);
  await page.screenshot({ path: 'test2.png' });

  // Test the background page as you would any other page.
  await browser.close();
})();