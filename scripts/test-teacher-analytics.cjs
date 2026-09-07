const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../src/lib/teacher-analytics.ts");
const analyticsModule = new Module(filename, module);
analyticsModule.filename = filename;
analyticsModule.paths = Module._nodeModulePaths(path.dirname(filename));
analyticsModule._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const {
  loadContestAnalytics,
  loadCourseAnalytics,
  loadTestSeriesAnalytics,
  parseAnalyticsView,
} = analyticsModule.exports;

test("analytics view accepts only known scalar values", () => {
  assert.equal(parseAnalyticsView("courses"), "courses");
  assert.equal(parseAnalyticsView("test-series"), "test-series");
  assert.equal(parseAnalyticsView("contests"), "contests");
  for (const value of [["contests"], "toString", "revenue", "", undefined]) {
    assert.equal(parseAnalyticsView(value), "courses");
  }
});

test("course analytics stays teacher scoped and aggregates enrollments", async () => {
  const calls = [];
  const db = {
    course: { async findMany(args) {
      calls.push(args);
      return [
        { id: "a", title: "Physics", price: 500, isPublished: true, _count: { chapters: 8, purchases: 3 } },
        { id: "b", title: "Maths", price: null, isPublished: false, _count: { chapters: 2, purchases: 1 } },
      ];
    } },
    chapterSubmission: { async count(args) {
      calls.push(args);
      return args.where.status === "SUBMITTED" ? 2 : 7;
    } },
  };
  const result = await loadCourseAnalytics(db, "teacher");
  assert.deepEqual(calls.map(call => call.where.chapter?.course?.userId || call.where.userId), ["teacher", "teacher", "teacher"]);
  assert.deepEqual(result.metrics.map(metric => metric.value), [1, 4, 7, 1500]);
  assert.equal(result.rows[0].name, "Physics");
  assert.equal(result.rows[0].value, 1500);
});

test("test-series analytics computes completion and score per series", async () => {
  const db = {
    testSeries: { async findMany(args) {
      assert.equal(args.where.userId, "teacher");
      return [{ id: "s", title: "Boards", price: 100, isPublished: true, _count: { testSeriesPurchase: 2, testChapters: 3 } }];
    } },
    test: { async findMany(args) {
      assert.equal(args.where.testChapter.testSeries.userId, "teacher");
      return [{ id: "t", testChapter: { testSeriesId: "s" }, testAttempts: [
        { isCompleted: true, percentage: 80 },
        { isCompleted: false, percentage: null },
      ] }];
    } },
    testSubmission: { async count(args) {
      assert.equal(args.where.testChapter.testSeries.userId, "teacher");
      return args.where.status ? 1 : 4;
    } },
  };
  const result = await loadTestSeriesAnalytics(db, "teacher");
  assert.deepEqual(result.metrics.map(metric => metric.value), [1, 2, 50, 80]);
  assert.equal(result.rows[0].secondary, 50);
  assert.equal(result.rows[0].value, 80);
});

test("contest analytics separates registration, participation, and completed scores", async () => {
  const now = new Date("2026-09-07T10:00:00Z");
  const db = {
    contest: { async findMany(args) {
      assert.equal(args.where.userId, "teacher");
      return [{ id: "c", title: "Weekly", isPublished: true, startsAt: now, durationMinutes: 60,
        _count: { registrations: 4, questions: 10 } }];
    } },
    contestAttempt: { async findMany(args) {
      assert.equal(args.where.contest.userId, "teacher");
      return [
        { contestId: "c", status: "SUBMITTED", percentage: 75, expiresAt: now, answers: [{ id: "pending" }] },
        { contestId: "c", status: "IN_PROGRESS", percentage: null, expiresAt: new Date("2026-09-07T11:00:00Z"), answers: [] },
      ];
    } },
  };
  const result = await loadContestAnalytics(db, "teacher", now);
  assert.deepEqual(result.metrics.map(metric => metric.value), [4, 2, 50, 75]);
  assert.equal(result.rows[0].secondary, 50);
  assert.equal(result.rows[0].value, 75);
});
