// Generate public/*.png from icon/*.svg

const sourceSvg = ["icon.svg", "icon_pip.svg"];

const { readFile, stat } = require("fs").promises;
const puppeteer = require("puppeteer");
const path = require("path");
const destSvgs = sourceSvg
  .map((src) => path.basename(src, ".svg") + ".png")
  .map((dest) => path.resolve("public", dest));

// Check last modified date

const pageHtml = `<html>
<style>

</style>
<body>
  <img />
</body>
</html>`;

function* getTasks() {
  const tasks = sourceSvg
    .map((src) => ({
      src: path.resolve("icon", src),
      dest: path.resolve("public", path.basename(src, ".svg") + ".png"),
    }))
    .map((task) => {
      const srcLastModified = stat(task.src)
        .then((stat) => stat.mtimeMs);
      const destLastModified = stat(task.dest)
        .then((stat) => stat.mtimeMs)
        .catch((e) => {
          // dest not found should generate
          if (e.code === "ENOENT") {
            yield task;
          } else {
            throw e;
          }
        });
      Promise.all([srcLastModified, destLastModified]).then(
        ([srcLastModified, destLastModified]) => {
          if (srcLastModified > destLastModified) {
            yield task;
          }
        }
      );
    });

  // if all reject, exit. If any resolve, continue.
  return Promise.allSettled(tasks).then((results) =>
    results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
  );
}

const svg2png = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(pageHtml);

  const converter = async (task) => {
    const { src, dest } = task;
    const imgSrc = `data:image/svg+xml;base64,${await readFile(
      srcAbsolute
    ).then((buffer) => buffer.toString("base64"))}`;
    // set the img src attribute to the svg then take a screenshot
    await page.evaluate((imgSrc) => {
      const img = document.querySelector("img");
      img.src = imgSrc;
    }, imgSrc);

    const imgHandler = await page.$("img");
    await imgHandler.screenshot({ type: "png", path: destAbsolute });
  };

  for (const src of sourceSvg) {
  }

  await browser.close();
};

(async () => {})();
