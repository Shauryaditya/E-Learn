const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const webpack = require("webpack");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const { chromium, expect } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "coverage", "contest-browser");
async function main() {
  await fs.mkdir(output, { recursive: true });
  const compiler = webpack({
    mode: "development", devtool: false,
    plugins: [new webpack.ProvidePlugin({ process: require.resolve("next/dist/build/polyfills/process") })],
    entry: path.join(__dirname, "fixtures/contest-attempt.tsx"),
    output: { path: output, filename: "fixture.js" },
    resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@": path.join(root, "src") } },
    module: { rules: [{
      test: /\.tsx?$/, exclude: /node_modules/,
      use: path.join(__dirname, "fixtures/contest-loader.cjs"),
    }] },
  });
  await new Promise((resolve, reject) => compiler.run((error, stats) => {
    compiler.close(() => {});
    if (error || stats.hasErrors()) reject(error || new Error(stats.toString({ all: false, errors: true })));
    else resolve();
  }));
  const inputCss = await fs.readFile(path.join(root, "src/app/globals.css"), "utf8");
  const css = await postcss([tailwind(path.join(root, "tailwind.config.ts"))]).process(
    inputCss.replace(/@import[^\n]+/g, ""), { from: path.join(root, "src/app/globals.css") },
  );
  const script = await fs.readFile(path.join(output, "fixture.js"));
  let expiresAt = new Date(Date.now() + 3600000).toISOString();
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") { res.setHeader("Content-Type", "text/javascript"); res.end(script); }
    else if (req.url === "/style.css") { res.setHeader("Content-Type", "text/css"); res.end(css.css); }
    else {
      res.setHeader("Content-Type", "text/html");
      res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script>window.contestFixture=${JSON.stringify({ expiresAt })}</script><script src="/fixture.js"></script></body></html>`);
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => { errors.push(error.message); console.error("Browser error:", error.message); });
    page.on("dialog", dialog => dialog.accept());
    let version = new Date().toISOString();
    let answers = { q1: "b", q2: "" };
    let status = "IN_PROGRESS";
    let offline = false;
    let loseSaveResponse = false;
    let loseSubmitResponse = false;
    let submissions = 0;
    const remoteAnswers = () => Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }));
    await context.route("**/api/contests/browser-test/**", async route => {
      if (offline) return route.abort("internetdisconnected");
      const request = route.request();
      if (request.method() === "GET") return route.fulfill({ json: {
        version, status, expiresAt, answers: remoteAnswers(), serverTime: new Date().toISOString(),
      } });
      const data = request.postDataJSON();
      if (status !== "IN_PROGRESS") return route.fulfill({ json: { version, status } });
      if (data.version !== version) return route.fulfill({ status: 409, json: {
        code: "ATTEMPT_CONFLICT", message: "This attempt changed in another session. Reload to recover saved answers.",
      } });
      answers = { ...answers, ...Object.fromEntries(data.answers.map(answer => [answer.questionId, answer.selectedAnswer])) };
      version = new Date(new Date(version).getTime() + 1).toISOString();
      if (request.url().endsWith("/submit")) {
        status = "SUBMITTED"; submissions++;
        if (loseSubmitResponse) { loseSubmitResponse = false; return route.abort("connectionfailed"); }
      } else if (loseSaveResponse) {
        loseSaveResponse = false; return route.abort("connectionfailed");
      }
      return route.fulfill({ json: { version, status, serverTime: new Date().toISOString() } });
    });
    const url = `http://127.0.0.1:${server.address().port}`;
    await page.goto(url);
    await expect(page.getByRole("radio").nth(1)).toBeChecked();
    await page.getByRole("radio").first().check();
    await expect(page.getByRole("status").first()).toHaveText("All answers saved", { timeout: 12000 });
    assert.equal(answers.q1, "a");
    await page.reload();
    await expect(page.getByRole("radio").first()).toBeChecked();
    assert.equal(await page.evaluate(() => Number(sessionStorage.getItem("contest-warnings:browser-test") || 0)), 0);
    console.log("PASS server autosave and refresh recovery");

    loseSaveResponse = true;
    await page.getByRole("textbox").fill("Energy changes form.");
    await expect(page.getByRole("status").first()).toHaveText("Not yet saved to server", { timeout: 12000 });
    await expect(page.getByRole("status").first()).toHaveText("All answers saved", { timeout: 15000 });
    assert.equal(answers.q2, "Energy changes form.");
    console.log("PASS lost save response reconciles without overwriting answers");

    offline = true;
    await page.getByRole("textbox").fill("An isolated system conserves total energy.");
    await expect(page.getByRole("status").first()).toHaveText("Not yet saved to server", { timeout: 12000 });
    offline = false;
    await page.reload();
    await expect(page.getByRole("textbox")).toHaveValue("An isolated system conserves total energy.");
    await expect(page.getByRole("status").first()).toHaveText("All answers saved", { timeout: 12000 });
    assert.equal(answers.q2, "An isolated system conserves total energy.");
    console.log("PASS unsynced local draft recovery after reload");

    await page.getByText("Review later", { exact: true }).first().click();
    await expect(page.getByRole("link", { name: /Question 1, answered, marked for review/ })).toBeVisible();
    for (const [width, height, theme] of [[1440, 1000, "light"], [390, 844, "light"], [390, 844, "dark"]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(theme => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.screenshot({ path: path.join(output, `attempt-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "horizontal overflow");
    }
    console.log("PASS desktop/mobile layout and both themes");

    version = new Date(new Date(version).getTime() + 1).toISOString();
    answers.q2 = "A newer answer from another session.";
    await page.getByRole("textbox").fill("This stale answer must not replace the newer answer.");
    await expect(page.getByRole("button", { name: "Recover saved answers" })).toBeVisible({ timeout: 12000 });
    assert.equal(answers.q2, "A newer answer from another session.");
    await page.getByRole("button", { name: "Recover saved answers" }).click();
    await expect(page.getByRole("textbox")).toHaveValue("A newer answer from another session.");
    console.log("PASS stale session conflict and recovery");

    loseSubmitResponse = true;
    await page.getByRole("button", { name: "Submit contest", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Submit attempt", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Submission received" })).toBeVisible({ timeout: 20000 });
    assert.equal(submissions, 1);
    console.log("PASS submission receipt after a lost response");

    status = "IN_PROGRESS";
    expiresAt = new Date(Date.now() + 2500).toISOString();
    await page.clock.setFixedTime(new Date("2035-01-01T00:00:00Z"));
    await page.reload();
    await expect(page.getByRole("heading", { name: "Submission received" })).toBeVisible({ timeout: 12000 });
    assert.equal(submissions, 2);
    console.log("PASS server-based deadline despite incorrect device date");
    assert.deepEqual(errors, [], "browser runtime errors");
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
