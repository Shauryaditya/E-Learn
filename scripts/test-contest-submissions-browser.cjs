const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const webpack = require("webpack");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const { chromium, expect } = require("@playwright/test");

async function main() {
  const root = path.resolve(__dirname, "..");
  const output = path.join(root, "coverage/contest-submissions");
  await fs.mkdir(output, { recursive: true });
  const compiler = webpack({
    mode: "development", devtool: false,
    plugins: [new webpack.ProvidePlugin({ process: require.resolve("next/dist/build/polyfills/process") })],
    entry: path.join(__dirname, "fixtures/contest-submissions.tsx"),
    output: { path: output, filename: "fixture.js" },
    resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@": path.join(root, "src") } },
    module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.join(__dirname, "fixtures/contest-loader.cjs") }] },
  });
  await new Promise((resolve, reject) => compiler.run((error, stats) => {
    compiler.close(() => {});
    if (error || stats.hasErrors()) reject(error || new Error(stats.toString({ all: false, errors: true })));
    else resolve();
  }));
  const source = await fs.readFile(path.join(root, "src/app/globals.css"), "utf8");
  const css = await postcss([tailwind(path.join(root, "tailwind.config.ts"))]).process(source.replace(/@import[^\n]+/g, ""),
    { from: path.join(root, "src/app/globals.css") });
  const script = await fs.readFile(path.join(output, "fixture.js"));
  const cover = await fs.readFile(path.join(root, "public/assets/TestSeries.png"));
  const logo = await fs.readFile(path.join(root, "src/app/icon.png"));
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") { res.setHeader("Content-Type", "text/javascript"); res.end(script); }
    else if (req.url === "/style.css") { res.setHeader("Content-Type", "text/css"); res.end(css.css); }
    else if (req.url === "/cover.png") { res.setHeader("Content-Type", "image/png"); res.end(cover); }
    else if (req.url === "/logo.png") { res.setHeader("Content-Type", "image/png"); res.end(logo); }
    else {
      res.setHeader("Content-Type", "text/html");
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}/teacher/contests/demo/submissions`;
    await page.goto(base);
    await expect(page.getByRole("navigation", { name: "Contest workspace" }).getByRole("link", { name: "Submissions" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("1-20 of 41 students", { exact: true })).toBeVisible();
    assert.equal(await page.locator("tbody tr").count(), 20);
    await page.getByRole("link", { name: "Next page", exact: true }).click();
    await expect(page.getByText("21-40 of 41 students", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Student 21", exact: true })).toBeVisible();
    console.log("PASS paginated list and active workspace navigation");

    await page.getByRole("link", { name: "Review Student 21", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Student 21", exact: true })).toBeVisible();
    await expect(page.getByText("Provisional score", { exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Question 1" }).getByText("Total energy", { exact: true })).toHaveCount(2);
    await expect(page.getByText("Manual grading required", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to submissions", exact: true })).toHaveAttribute("href", /page=2/);
    for (const [width, theme] of [[1280, "light"], [390, "light"], [390, "dark"]]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(theme => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.screenshot({ path: path.join(output, `review-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "review page overflow");
    }
    console.log("PASS individual answers, provisional grading, mobile and dark mode");

    await page.getByRole("link", { name: "Back to submissions", exact: true }).click();
    await expect(page.getByText("21-40 of 41 students", { exact: true })).toBeVisible();
    await page.getByLabel("Student email or ID").fill("student3@example.com");
    await page.getByLabel("Status", { exact: true }).selectOption("submitted");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await expect(page.getByRole("link", { name: "Student 3", exact: true })).toBeVisible();
    await expect(page.getByText("1-1 of 1 students", { exact: true })).toBeVisible();
    assert(!new URL(page.url()).searchParams.has("page"), "filter should reset page");
    await page.getByRole("link", { name: "Review Student 3", exact: true }).click();
    await expect(page.getByRole("link", { name: "Back to submissions", exact: true })).toHaveAttribute("href", /status=submitted.*q=student3%40example.com/);
    await page.getByRole("link", { name: "Back to submissions", exact: true }).click();
    await expect(page.getByLabel("Student email or ID")).toHaveValue("student3@example.com");
    console.log("PASS filters reset pagination and survive detail navigation");

    await page.getByRole("link", { name: "Reset filters", exact: true }).click();
    await expect(page.getByLabel("Student email or ID")).toHaveValue("");
    await expect(page.getByText("1-20 of 41 students", { exact: true })).toBeVisible();
    for (const [width, theme] of [[1280, "light"], [390, "dark"]]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(theme => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.screenshot({ path: path.join(output, `list-${width}-${theme}.png`), animations: "disabled" });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "list page overflow");
    }
    await page.getByLabel("Student email or ID").fill("missing@example.com");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await expect(page.getByText("No students match these filters.", { exact: true })).toBeVisible();
    console.log("PASS reset filters, empty state and responsive list");
    const dashboardUrl = `http://127.0.0.1:${server.address().port}/teacher/dashboard`;
    await page.goto(dashboardUrl);
    await expect(page.getByRole("heading", { name: "Teaching workspace" })).toBeVisible();
    await expect(page.getByText("Mechanics and Motion", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Mechanics and Motion/ })).toHaveAttribute("href", /submissions\?status=needs_grading/);
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "New contest" })).toHaveAttribute("href", "/teacher/create-contest");
    await expect(page.getByRole("menuitem", { name: "New course" })).toHaveAttribute("href", "/teacher/create");
    await expect(page.getByRole("menuitem", { name: "New test series" })).toHaveAttribute("href", "/teacher/create-testseries");
    await page.keyboard.press("Escape");
    for (const [width, theme] of [[1440, "light"], [390, "light"], [390, "dark"]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(theme => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.screenshot({ path: path.join(output, `dashboard-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "dashboard page overflow");
    }
    await expect(page.getByRole("navigation", { name: "Teacher navigation" }).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Teacher navigation" }).getByRole("link", { name: "Contests" })).toHaveAttribute("href", "/teacher/contests");
    assert(await page.locator('img[src="/cover.png"]').evaluate(image => image.naturalWidth > 0), "course thumbnail must render");
    console.log("PASS teacher dashboard, creation menu, mobile navigation and thumbnails");
    await page.goto(`${dashboardUrl}?empty=1`);
    await expect(page.getByText("No upcoming published contests.", { exact: true })).toBeVisible();
    await expect(page.getByText("Nothing waiting for review.", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Schedule contest" })).toBeVisible();
    console.log("PASS new-teacher dashboard empty states");
    const analyticsUrl = `http://127.0.0.1:${server.address().port}/teacher/analytics`;
    for (const [view, heading] of [["courses", "Courses overview"], ["test-series", "Test series overview"], ["contests", "Contests overview"]]) {
      await page.goto(`${analyticsUrl}?view=${view}`);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Analytics area" }).getByRole("link", {
        name: view === "test-series" ? "Test series" : view[0].toUpperCase() + view.slice(1),
      })).toHaveAttribute("aria-current", "page");
      assert(await page.locator("tbody tr").count() > 0, `${view} should have an analytics row`);
    }
    for (const [width, theme] of [[1440, "light"], [390, "light"], [390, "dark"]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(theme => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.goto(`${analyticsUrl}?view=contests`);
      await page.screenshot({ path: path.join(output, `analytics-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
      const overflow = await page.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("*")]
          .filter(element => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 8)
          .map(element => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right })),
      }));
      assert(overflow.document <= overflow.viewport, `analytics page overflow: ${JSON.stringify(overflow)}`);
    }
    console.log("PASS separated analytics tabs, responsive table and dark mode");
    assert.deepEqual(errors, [], "browser runtime errors");
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
