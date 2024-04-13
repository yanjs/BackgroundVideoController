// Generate public/*.png from icon/*.svg

const sourceSvg = ["icon.svg", "icon_pip.svg"];

import { promises as fs } from "fs";
const { readFile, stat } = fs;
import puppeteer, { Browser } from "puppeteer";
import path from "path";

const screenshotHtml = `<html>
<body>
  <img />
</body>
</html>`;

type SvgPngConversionTask = { src: string; dest: string };

const fatalErrorHandler = (e: any) => {
  console.error("Unable to continue because of an error", e);
  return process.exit(1);
};

const getSrcDests = () => {
  return sourceSvg.map((src) => ({
    src: path.resolve("icon", src),
    dest: path.resolve("public", path.basename(src, ".svg") + ".png"),
  }));
};

class Converter {
  private readonly _browserPromise: Promise<Browser>;

  constructor() {
    this._browserPromise = puppeteer.launch();
  }
  async convert(task: SvgPngConversionTask) {
    const { src, dest } = task;
    const imgSrcPromise = readFile(src)
      .then((buffer) => buffer.toString("base64"))
      .then((base64) => `data:image/svg+xml;base64,${base64}`);

    const browser = await this._browserPromise;
    const pagePromise = browser.newPage().then(async (page) => {
      await page.setContent(screenshotHtml);
      return page;
    });

    const [imgSrc, page] = await Promise.all([imgSrcPromise, pagePromise]);

    await page
      .$eval(
        "img",
        (img, imgSrc) => {
          img.setAttribute("src", imgSrc);
        },
        imgSrc
      )
      .catch(fatalErrorHandler);

    const imgHandler = await page
      .$("img")
      .then((img) => {
        if (!img) {
          throw new Error("img not found");
        }
        return img;
      })
      .catch(fatalErrorHandler);

    const boundingBox = await imgHandler.boundingBox();
    if (!boundingBox) {
      fatalErrorHandler(new Error("boundingBox not found"));
      return;
    }

    await page.screenshot({
      type: "png",
      path: dest,
      omitBackground: true,
      clip: boundingBox,
    });
  }

  async close() {
    const browser = await this._browserPromise;
    await browser.close();
  }
}

const getTasks = async () => {
  const tasks = getSrcDests().map(async (task) => {
    const srcTimePromise = stat(task.src).then((stat) => stat.mtimeMs);
    const destTimePromise = stat(task.dest)
      .then((stat) => stat.mtimeMs)
      .catch((e) => {
        if (e.code === "ENOENT") {
          return 0;
        } else {
          throw e;
        }
      });
    return await Promise.all([srcTimePromise, destTimePromise])
      .then(([srcTime, destTime]) => {
        if (srcTime > destTime) {
          return task;
        } else {
          throw "skip";
        }
      })
      .catch(() => {});
  });

  const allResults = await Promise.allSettled(tasks);
  return allResults
    .filter((r): r is PromiseFulfilledResult<SvgPngConversionTask> => r.status === "fulfilled")
    .map((r) => r.value);
};

const svg2png = async () => {
  const tasks = await getTasks();
  if (tasks.length === 0) {
    return;
  }
  const converter = new Converter();
  tasks.map(async (task) => {
    await converter.convert(task);
  })
  await converter.close();
};

(async () => {
  await svg2png();
})