const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const path = require("node:path");

const filename = path.resolve(__dirname, "../src/lib/contest-attempts.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const serviceModule = new Module(filename, module);
serviceModule.filename = filename;
serviceModule.paths = Module._nodeModulePaths(path.dirname(filename));
serviceModule._compile(compiled, filename);
const { writeContestAttempt, gradeAnswer, validateAnswers, attemptInputSchema } = serviceModule.exports;

const initialVersion = "2026-09-07T10:00:00.000Z";
const beforeDeadline = () => new Date("2026-09-07T10:30:00.000Z");
const deadline = () => new Date("2026-09-07T11:00:00.000Z");
const question = {
  id: "q1", questionType: "SINGLE_CHOICE", defaultMarks: 4, negativeMarks: 1,
  options: [{ id: "a", isCorrect: true }, { id: "b", isCorrect: false }],
};
const input = (value = "a", version = initialVersion) => ({
  version, answers: [{ questionId: "q1", selectedAnswer: value }],
});

// This transactional double checks rollback and call interleavings without a live database.
function database({ saved = "", failInsert = false, registration = "REGISTERED" } = {}) {
  let state = {
    id: "attempt", userId: "student", contestId: "contest", status: "IN_PROGRESS",
    updatedAt: new Date(initialVersion), expiresAt: deadline(),
    registration: { status: registration },
    answers: [{ attemptId: "attempt", questionId: "q1", selectedAnswer: saved }],
    contest: { questions: [{ questionId: "q1", marks: null, question }] },
  };
  let queue = Promise.resolve();
  const counts = { insert: 0, delete: 0, update: 0, locks: 0 };
  return {
    get state() { return state; },
    counts,
    async $transaction(fn) {
      const previous = queue;
      let release;
      queue = new Promise(resolve => { release = resolve; });
      await previous;
      const backup = structuredClone(state);
      let locked = false;
      try {
        return await fn({
          $queryRaw: async query => {
            assert.match(query.sql, /FOR UPDATE/);
            assert.deepEqual(query.values, ["student", "contest"]);
            locked = true; counts.locks++;
          },
          contestAttempt: {
            findUnique: async ({ where }) => {
              assert(locked, "must lock before reading");
              return where.userId_contestId.userId === state.userId &&
                where.userId_contestId.contestId === state.contestId ? structuredClone(state) : null;
            },
            update: async ({ data }) => { counts.update++; Object.assign(state, data); return structuredClone(state); },
          },
          contestAnswer: {
            deleteMany: async ({ where }) => {
              counts.delete++;
              state.answers = where.questionId ? state.answers.filter(answer => !where.questionId.in.includes(answer.questionId)) : [];
            },
            createMany: async ({ data }) => {
              counts.insert++;
              if (failInsert) throw new Error("Database unavailable");
              state.answers.push(...structuredClone(data));
            },
          },
        });
      } catch (error) { state = backup; throw error; }
      finally { release(); }
    },
  };
}

test("saves answers without grading, using bulk writes", async () => {
  const db = database();
  const result = await writeContestAttempt(db, "student", "contest", input(), "save", beforeDeadline);
  assert.equal(result.status, "IN_PROGRESS");
  assert.equal(db.state.answers[0].selectedAnswer, "a");
  assert.equal(db.state.answers[0].marksAwarded, null);
  assert.equal(db.counts.insert, 1);
  assert.notEqual(result.version, initialVersion);
});

test("accepts clearing an answer", async () => {
  const db = database({ saved: "a" });
  await writeContestAttempt(db, "student", "contest", input(""), "save", beforeDeadline);
  assert.equal(db.state.answers[0].selectedAnswer, "");
});

test("autosave updates only changed questions and preserves free-text spacing", async () => {
  const db = database({ saved: "a" });
  db.state.contest.questions.push({ questionId: "q2", marks: 4,
    question: { ...question, id: "q2", questionType: "NUMERICAL", options: [] } });
  await writeContestAttempt(db, "student", "contest", {
    version: initialVersion, answers: [{ questionId: "q2", selectedAnswer: "  explanation\n" }],
  }, "save", beforeDeadline);
  assert.equal(db.state.answers.find(answer => answer.questionId === "q1").selectedAnswer, "a");
  assert.equal(db.state.answers.find(answer => answer.questionId === "q2").selectedAnswer, "  explanation\n");
});

test("submission retry returns the receipt without changing completed answers", async () => {
  const db = database();
  await writeContestAttempt(db, "student", "contest", input(), "submit", beforeDeadline);
  const result = await writeContestAttempt(db, "student", "contest", input("b"), "submit", beforeDeadline);
  assert.equal(result.status, "SUBMITTED");
  assert.equal(db.state.score, 4);
  assert.equal(db.counts.update, 1);
});

test("concurrent duplicate submissions produce one completed attempt", async () => {
  const db = database();
  const results = await Promise.all([
    writeContestAttempt(db, "student", "contest", input("a"), "submit", beforeDeadline),
    writeContestAttempt(db, "student", "contest", input("b"), "submit", beforeDeadline),
  ]);
  assert(results.every(result => result.status === "SUBMITTED"));
  assert.equal(db.state.answers[0].selectedAnswer, "a");
  assert.equal(db.counts.update, 1);
});

test("a stale autosave cannot overwrite a newer session", async () => {
  const db = database();
  await writeContestAttempt(db, "student", "contest", input("a"), "save", beforeDeadline);
  await assert.rejects(writeContestAttempt(db, "student", "contest", input("b"), "save", beforeDeadline),
    { code: "ATTEMPT_CONFLICT" });
  assert.equal(db.state.answers[0].selectedAnswer, "a");
});

test("save racing submit cannot overwrite a completed attempt", async () => {
  const db = database();
  await Promise.all([
    writeContestAttempt(db, "student", "contest", input("a"), "submit", beforeDeadline),
    writeContestAttempt(db, "student", "contest", input("b"), "save", beforeDeadline),
  ]);
  assert.equal(db.state.answers[0].selectedAnswer, "a");
  assert.equal(db.counts.update, 1);
});

test("at the exact deadline, new answers are rejected and saved answers are graded", async () => {
  const db = database({ saved: "b" });
  await assert.rejects(writeContestAttempt(db, "student", "contest", input("a"), "save", deadline),
    { code: "DEADLINE_PASSED" });
  const result = await writeContestAttempt(db, "student", "contest", input("a"), "submit", deadline);
  assert.equal(result.status, "AUTO_SUBMITTED");
  assert.equal(result.ignoredLateAnswers, true);
  assert.equal(db.state.score, -1);
  assert.equal(db.state.answers[0].selectedAnswer, "b");
});

test("failed bulk insertion rolls back deletion and leaves the attempt open", async () => {
  const db = database({ saved: "b", failInsert: true });
  await assert.rejects(writeContestAttempt(db, "student", "contest", input(), "submit", beforeDeadline));
  assert.equal(db.state.answers[0].selectedAnswer, "b");
  assert.equal(db.state.status, "IN_PROGRESS");
  assert.equal(db.state.updatedAt.toISOString(), initialVersion);
});

test("cancelled registrations cannot save or submit", async () => {
  const db = database({ registration: "CANCELLED" });
  await assert.rejects(writeContestAttempt(db, "student", "contest", input(), "submit", beforeDeadline),
    { status: 403 });
  assert.equal(db.counts.update, 0);
});

test("same-millisecond writes still receive distinct versions", async () => {
  const db = database();
  const fixedClock = () => new Date(initialVersion);
  const result = await writeContestAttempt(db, "student", "contest", input(), "save", fixedClock);
  assert.equal(result.version, "2026-09-07T10:00:00.001Z");
});

test("rejects foreign options, duplicate questions and multiple single-choice selections", () => {
  for (const values of [
    [{ questionId: "q1", selectedAnswer: "foreign" }],
    [{ questionId: "q1", selectedAnswer: "a,b" }],
    [{ questionId: "foreign", selectedAnswer: "a" }],
    [...input().answers, ...input().answers],
  ]) assert.throws(() => validateAnswers(values, [question]), { code: "INVALID_ANSWER" });
});

test("validates payload types and limits before writes", () => {
  assert.equal(attemptInputSchema.safeParse({ ...input(), version: "invalid" }).success, false);
  assert.equal(attemptInputSchema.safeParse({ ...input(), answers: [{ questionId: "q1", selectedAnswer: 12 }] }).success, false);
  assert.equal(attemptInputSchema.safeParse(input("x".repeat(10001))).success, false);
});

test("missing keys and free text remain ungraded without penalties", () => {
  assert.deepEqual(gradeAnswer({ ...question, options: [{ id: "a", isCorrect: false }] }, 4, "a"),
    { isCorrect: null, marksAwarded: null });
  assert.deepEqual(gradeAnswer({ ...question, questionType: "NUMERICAL" }, 4, "42"),
    { isCorrect: null, marksAwarded: null });
});

test("multiple-choice grading requires the exact set, irrespective of order", () => {
  const multiple = { ...question, questionType: "MULTIPLE_CHOICE", options: question.options.map(option => ({ ...option, isCorrect: true })) };
  assert.equal(gradeAnswer(multiple, 4, "b,a").marksAwarded, 4);
  assert.equal(gradeAnswer(multiple, 4, "a").marksAwarded, -1);
  assert.equal(gradeAnswer(multiple, 4, "").marksAwarded, 0);
});
