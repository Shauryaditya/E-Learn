"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

type Answers = Record<string, string>;
type SavedAnswer = { questionId: string; selectedAnswer: string | null };
type Snapshot = {
  status: string;
  version: string;
  serverTime: string;
  expiresAt: string;
  answers: SavedAnswer[];
};
type Draft = { version: string; answers: Answers; pending: Answers | null };
const toAnswers = (rows: SavedAnswer[]): Answers =>
  Object.fromEntries(rows.map(row => [row.questionId, row.selectedAnswer || ""]));
const equalAnswers = (a: Answers, b: Answers) =>
  Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).every(key => (a[key] || "") === (b[key] || ""));

export function useContestAttempt(attemptId: string, contestId: string, expiresAt: string) {
  const storageKey = `contest-attempt:${attemptId}`;
  const [answers, setAnswers] = useState<Answers>({});
  const [ready, setReady] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [saveState, setSaveState] = useState("Recovering saved answers...");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState("");
  const [finishing, setFinishing] = useState(false);
  const current = useRef<Answers>({});
  const saved = useRef<Answers>({});
  const pending = useRef<Answers | null>(null);
  const version = useRef("");
  const busy = useRef(false);
  const initialized = useRef(false);
  const stopped = useRef(false);
  const finished = useRef(false);
  const finishRequested = useRef(false);
  const autoFinishRequested = useRef(false);
  const uncertain = useRef(false);
  const serverClock = useRef({ time: 0, measuredAt: 0 });
  const deadline = useRef(new Date(expiresAt).getTime());
  const lastEditAt = useRef(0);
  const lastSaveAt = useRef(0);
  const lastAttemptAt = useRef(0);

  const persist = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        version: version.current, answers: current.current, pending: pending.current,
      } satisfies Draft));
    } catch {
      // Server saving remains available when browser storage is disabled.
    }
  }, [storageKey]);

  const complete = useCallback(() => {
    finished.current = true;
    setSubmitted(true);
    setError("");
    setSaveState("Submission received");
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  const synchronize = useCallback(async (restore: boolean) => {
    const { data } = await axios.get<Snapshot>(`/api/contests/${contestId}/answers`, {
      timeout: 15000, headers: { "Cache-Control": "no-cache" },
    });
    serverClock.current = { time: new Date(data.serverTime).getTime(), measuredAt: performance.now() };
    deadline.current = new Date(data.expiresAt).getTime();
    if (data.status !== "IN_PROGRESS") { complete(); return; }
    const remote = toAnswers(data.answers);
    if (restore) {
      let draft: Draft | null = null;
      try {
        const value = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (value && typeof value.version === "string" && value.answers &&
          Object.values(value.answers).every(answer => typeof answer === "string")) draft = value;
      } catch {}
      const recoverable = draft && (draft.version === data.version ||
        (draft.pending && equalAnswers(remote, draft.pending)));
      current.current = recoverable ? draft!.answers : remote;
      setAnswers(current.current);
      if (draft && !recoverable) setError("A newer server copy was recovered. Unsynced changes from the older session were not applied.");
    } else if (data.version !== version.current &&
      (!pending.current || !equalAnswers(remote, pending.current))) {
      stopped.current = true;
      setConflict(true);
      throw new Error("This attempt changed in another session. Reload to recover the latest saved answers.");
    }
    version.current = data.version;
    saved.current = remote;
    pending.current = null;
    uncertain.current = false;
    initialized.current = true;
    setReady(true);
    setSaveState(equalAnswers(current.current, remote) ? "All answers saved" : "Unsaved changes");
    persist();
  }, [complete, contestId, persist, storageKey]);

  const write = useCallback(async (submit = false, autoSubmitted = false) => {
    if (busy.current || finished.current || !initialized.current) return;
    const serverNow = serverClock.current.time + performance.now() - serverClock.current.measuredAt;
    const expired = serverNow >= deadline.current;
    if (stopped.current && !expired) return;
    if (!submit && (finishRequested.current || expired || equalAnswers(current.current, saved.current))) return;
    busy.current = true;
    lastAttemptAt.current = performance.now();
    if (submit) {
      finishRequested.current = true;
      setFinishing(true);
      setIsSubmitting(true);
      setError("");
    }
    try {
      if (uncertain.current && !expired) await synchronize(false);
      if (finished.current) return;
      const snapshot = { ...current.current };
      pending.current = snapshot;
      persist();
      setSaveState(submit ? "Submitting..." : "Saving...");
      const payload = {
        version: version.current,
        answers: Object.entries(snapshot)
          .filter(([questionId, selectedAnswer]) => submit || selectedAnswer !== (saved.current[questionId] || ""))
          .map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
        autoSubmitted: autoSubmitted || autoFinishRequested.current,
      };
      const { data } = submit
        ? await axios.post(`/api/contests/${contestId}/submit`, payload, { timeout: 15000 })
        : await axios.put(`/api/contests/${contestId}/answers`, payload, { timeout: 15000 });
      if (data.status !== "IN_PROGRESS") {
        if (data.ignoredLateAnswers && !equalAnswers(current.current, saved.current)) {
          setSubmissionNotice("Time expired before your latest changes reached the server. Only your previously saved answers were submitted.");
        }
        complete();
        return;
      }
      version.current = data.version;
      saved.current = snapshot;
      pending.current = null;
      lastSaveAt.current = performance.now();
      setSaveState(equalAnswers(current.current, snapshot) ? "All answers saved" : "Unsaved changes");
      setError("");
      persist();
    } catch (caught) {
      const code = axios.isAxiosError(caught) ? caught.response?.data?.code : undefined;
      if (code === "ATTEMPT_CONFLICT") {
        stopped.current = true;
        setConflict(true);
      } else if (code !== "DEADLINE_PASSED") {
        uncertain.current = true;
      }
      const message = axios.isAxiosError(caught)
        ? caught.response?.data?.message || "Connection interrupted. Keep this page open; retrying automatically."
        : caught instanceof Error ? caught.message : "Could not save answers.";
      setError(message);
      setSaveState(submit ? "Submission not confirmed" : "Not yet saved to server");
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  }, [complete, contestId, persist, synchronize]);

  useEffect(() => {
    let active = true;
    let recovering = false;
    const recover = async () => {
      if (!active || initialized.current || recovering || finished.current) return;
      recovering = true;
      try { await synchronize(true); }
      catch { if (active) setError("Could not recover saved answers. Reconnecting..."); }
      finally { recovering = false; }
    };
    void recover();
    const interval = window.setInterval(() => {
      if (!initialized.current) { void recover(); return; }
      if (finished.current) return;
      const now = performance.now();
      const remaining = deadline.current - (serverClock.current.time + now - serverClock.current.measuredAt);
      setRemainingMs(Math.max(0, remaining));
      if (now - lastAttemptAt.current < (remaining <= 10000 ? 500 : 3000)) return;
      if (remaining <= 0 || finishRequested.current) { void write(true, remaining <= 0); return; }
      if (remaining <= 10000 || now - lastEditAt.current >= 1200 || now - lastSaveAt.current >= 5000) void write();
    }, 500);
    const onOnline = () => { if (initialized.current) void write(finishRequested.current); else void recover(); };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!finished.current && (busy.current || !equalAnswers(current.current, saved.current))) {
        persist();
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [persist, synchronize, write]);

  const changeAnswer = (questionId: string, value: string) => {
    if (!initialized.current || stopped.current || finished.current || finishRequested.current ||
      serverClock.current.time + performance.now() - serverClock.current.measuredAt >= deadline.current) return;
    current.current = { ...current.current, [questionId]: value };
    lastEditAt.current = performance.now();
    setAnswers(current.current);
    setSaveState("Unsaved changes");
    persist();
  };
  const submit = (autoSubmitted = false) => {
    autoFinishRequested.current = autoFinishRequested.current || autoSubmitted;
    finishRequested.current = true;
    setFinishing(true);
    void write(true, autoSubmitted);
  };

  return {
    answers, changeAnswer, ready, remainingMs, saveState, error, conflict,
    isSubmitting, submitted, submissionNotice, finishing, submit,
  };
}
