const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const path = require("node:path");

const filename = path.resolve(__dirname, "../src/lib/contest-submissions.ts");
const serviceModule = new Module(filename, module);
serviceModule.filename = filename;
serviceModule.paths = Module._nodeModulePaths(path.dirname(filename));
serviceModule._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { loadContestSubmissions, loadContestSubmission, parseSubmissionParams, submissionWhere, submissionStatus, submissionsHref } = serviceModule.exports;
const now = new Date("2026-09-07T10:00:00Z");

test("malformed pagination and filter parameters get bounded defaults", () => {
  for (const page of ["-1", "0", "1.5", "Infinity", "not-a-number", ["2"]]) {
    assert.equal(parseSubmissionParams({ page }).page, 1);
  }
  assert.equal(parseSubmissionParams({ page: "9000000" }).page, 1000000);
  assert.equal(parseSubmissionParams({ status: "toString" }).status, "all");
  assert.equal(parseSubmissionParams({ q: "x".repeat(1000) }).q.length, 254);
});

test("all filters retain teacher and contest ownership constraints", () => {
  for (const status of ["all", "not_started", "in_progress", "expired", "submitted", "needs_grading", "evaluated", "cancelled", "disqualified"]) {
    const where = submissionWhere("contest", "owner", status, now);
    assert.equal(where.contestId, "contest");
    assert.deepEqual(where.contest, { userId: "owner" });
  }
});

test("live and expired filters divide attempts at the exact deadline", () => {
  assert.deepEqual(submissionWhere("c", "t", "in_progress", now).attempt.is.expiresAt, { gt: now });
  assert.deepEqual(submissionWhere("c", "t", "expired", now).attempt.is.expiresAt, { lte: now });
  assert.equal(submissionStatus({ status: "IN_PROGRESS", expiresAt: now }, now), "Time expired");
  assert.equal(submissionStatus({ status: "AUTO_SUBMITTED", expiresAt: now }, now), "Auto-submitted");
  assert.equal(submissionStatus(null, now), "Not started");
});

test("awaiting grading excludes students still writing the exam", () => {
  const where = submissionWhere("c", "t", "needs_grading", now);
  assert.deepEqual(where.attempt.is.status, { not: "IN_PROGRESS" });
  assert.deepEqual(where.attempt.is.answers, { some: { marksAwarded: null } });
});

test("pagination preserves encoded search and filter values", () => {
  const href = submissionsHref("contest", { page: 2, status: "submitted", q: "student+one@example.com" });
  const url = new URL(href, "https://example.test");
  assert.equal(url.pathname, "/teacher/contests/contest/submissions");
  assert.equal(url.searchParams.get("q"), "student+one@example.com");
  assert.equal(url.searchParams.get("status"), "submitted");
  assert.equal(url.searchParams.get("page"), "2");
});

function database(owned = true, total = 41) {
  const calls = [];
  return { calls,
    contest: { async findFirst(args) {
      calls.push(["owner", args]);
      return owned && args.where.userId === "teacher" ? { id: "contest" } : null;
    } },
    contestRegistration: {
      async count(args) { calls.push(["count", args]); return total; },
      async findMany(args) { calls.push(["list", args]); return []; },
      async findFirst(args) {
        calls.push(["detail", args]);
        return args.where.contest.userId === "teacher" && args.where.contestId === "contest" && args.where.id === "registration" ? { id: "registration" } : null;
      },
    },
  };
}

test("denied access stops before identity lookups or submission reads", async () => {
  const db = database(false);
  let identityLookups = 0;
  assert.equal(await loadContestSubmissions(db, "intruder", "contest", { q: "student@example.com" },
    async () => { identityLookups++; return ["student"]; }), null);
  assert.equal(identityLookups, 0);
  assert.deepEqual(db.calls.map(call => call[0]), ["owner"]);
});

test("lists read only one page and no answer contents", async () => {
  const db = database();
  const result = await loadContestSubmissions(db, "teacher", "contest", { page: "2" }, async () => []);
  assert.equal(result.pageCount, 3);
  const query = db.calls.find(call => call[0] === "list")[1];
  assert.equal(query.take, 20);
  assert.equal(query.skip, 20);
  assert.deepEqual(query.orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
  assert.deepEqual(query.select.attempt.select.answers, { where: { marksAwarded: null }, select: { id: true }, take: 1 });
  assert(!JSON.stringify(query.select).includes("selectedAnswer"));
  assert(!JSON.stringify(query.select).includes("questionText"));
});

test("out-of-range pages clamp to the final page", async () => {
  const db = database();
  const result = await loadContestSubmissions(db, "teacher", "contest", { page: "999" }, async () => []);
  assert.equal(result.params.page, 3);
  assert.equal(db.calls.find(call => call[0] === "list")[1].skip, 40);
});

test("email search stays scoped to this teacher's contest", async () => {
  const db = database();
  await loadContestSubmissions(db, "teacher", "contest", { q: "student@example.com" }, async email => {
    assert.equal(email, "student@example.com");
    return ["student-id"];
  });
  const where = db.calls.find(call => call[0] === "list")[1].where;
  assert.deepEqual(where.userId, { in: ["student-id"] });
  assert.deepEqual(where.contest, { userId: "teacher" });
  assert.equal(where.contestId, "contest");
});

test("failed identity search propagates instead of showing a false empty result", async () => {
  const db = database();
  await assert.rejects(loadContestSubmissions(db, "teacher", "contest", { q: "a@example.com" },
    async () => { throw new Error("Identity service unavailable"); }));
  assert.equal(db.calls.length, 1);
});

test("detail access requires matching owner, contest and registration", async () => {
  const db = database();
  assert.equal(await loadContestSubmission(db, "intruder", "contest", "registration"), null);
  assert.equal(await loadContestSubmission(db, "teacher", "other-contest", "registration"), null);
  assert.equal(await loadContestSubmission(db, "teacher", "contest", "other-registration"), null);
  assert.deepEqual(await loadContestSubmission(db, "teacher", "contest", "registration"), { id: "registration" });
});

const dashboardFilename = path.resolve(__dirname, "../src/lib/teacher-dashboard.ts");
const dashboardModule = new Module(dashboardFilename, module);
dashboardModule.filename = dashboardFilename;
dashboardModule.paths = Module._nodeModulePaths(path.dirname(dashboardFilename));
dashboardModule._compile(ts.transpileModule(fs.readFileSync(dashboardFilename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, dashboardFilename);

test("dashboard queries remain teacher-scoped and previews are bounded", async () => {
  const calls = [];
  const model = name => ({
    async count(query) { calls.push({ name, method: "count", query }); return 0; },
    async findMany(query) { calls.push({ name, method: "list", query }); return []; },
  });
  const data = await dashboardModule.exports.loadTeacherDashboard({
    course: model("course"), testSeries: model("testSeries"), contest: model("contest"), contestAttempt: model("attempt"),
  }, "teacher", now);
  assert.equal(calls.length, 8);
  for (const { name, method, query } of calls) {
    assert.equal(name === "attempt" ? query.where.contest.userId : query.where.userId, "teacher");
    if (method === "list") assert.equal(query.take, 4);
    assert(!JSON.stringify(query).includes("selectedAnswer"));
  }
  assert.deepEqual(data.recentContent, []);
  assert.equal(data.pendingReviews, 0);
});

test("dashboard query failures are not presented as zero activity", async () => {
  const model = { count: async () => { throw new Error("Unavailable"); }, findMany: async () => [] };
  await assert.rejects(dashboardModule.exports.loadTeacherDashboard({
    course: model, testSeries: model, contest: model, contestAttempt: model,
  }, "teacher", now), /Unavailable/);
});
