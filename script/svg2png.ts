// Generate public/*.png from icon/*.svg

const sourceSvg = ["icon.svg", "icon_pip.svg"];

import { promises as fs } from "fs";
const { readFile, stat } = fs;
import puppeteer, { Browser } from "puppeteer";
import path from "path";

// Check last modified date

const screenshotHtml = `<html>
<body>
  <img />
</body>
</html>`;
type Task = { src: string; dest: string };

const fatalErrorHandler = (e: any) => {
  console.error("Unable to continue because of an error", e);
  return process.exit(1);
};

const getTasks = () => {
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
  async convert(task: Task) {
    const { src, dest } = task;
    console.log(src, dest);
    const imgSrcPromise = readFile(src)
      .then((buffer) => buffer.toString("base64"))
      .then((base64) => `data:image/svg+xml;base64,${base64}`);

    const browser = await this._browserPromise;
    const pagePromise = browser.newPage().then(async (page) => {
      await page.setContent(screenshotHtml);
      return page;
    });

    const [imgSrc, page] = await Promise.all([imgSrcPromise, pagePromise]);

    console.log("page:", page);
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
    console.log("imgHandler:", imgHandler);

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
    console.log(`generated ${dest}`);
  }

  async close() {
    const browser = await this._browserPromise;
    console.log("before browser closed");
    await browser.close();
    console.log("browser closed");
  }
}

const doTasks = async (converter: Converter) => {
  const tasks = getTasks().map(async (task) => {
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
    await Promise.all([srcTimePromise, destTimePromise])
      .then(async ([srcTime, destTime]) => {
        if (srcTime > destTime) {
          return await converter.convert(task);
        } else {
          throw "skip";
        }
      })
      .catch(() => {});
  });

  await Promise.all(tasks);
};

const svg2png = async () => {
  const converter = new Converter();
  await doTasks(converter);
  await converter.close();
};

svg2png();
