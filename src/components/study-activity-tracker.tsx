"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

const heartbeatMs = 30000;

type StudyActivityResponse = {
  date: string;
  currentStreak: number;
};

const sendStudyActivity = (secondsStudied: number) => {
  const payload = JSON.stringify({ secondsStudied });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/study-activity", blob);
    return;
  }

  fetch("/api/study-activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
};

const postStudyActivity = async (secondsStudied: number) => {
  const response = await fetch("/api/study-activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ secondsStudied }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<StudyActivityResponse>;
};

export const StudyActivityTracker = () => {
  const { isLoaded, userId } = useAuth();
  const lastActiveAt = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) {
      return;
    }

    postStudyActivity(0)
      .then((activity) => {
        if (!activity) {
          return;
        }

        const toastKey = `study-streak-toast:${userId}`;
        const lastToastDate = window.localStorage.getItem(toastKey);

        if (lastToastDate === activity.date) {
          return;
        }

        window.localStorage.setItem(toastKey, activity.date);

        if (activity.currentStreak <= 1) {
          toast.success("Welcome back! Your study streak starts today.");
          return;
        }

        toast.success(`Welcome back! You are on a ${activity.currentStreak}-day study streak.`);
      })
      .catch(() => undefined);

    lastActiveAt.current = Date.now();

    const flush = (force = false) => {
      if ((!force && document.hidden) || lastActiveAt.current === null) {
        lastActiveAt.current = Date.now();
        return;
      }

      const now = Date.now();
      const secondsStudied = Math.floor((now - lastActiveAt.current) / 1000);

      if (secondsStudied > 0) {
        sendStudyActivity(secondsStudied);
      }

      lastActiveAt.current = now;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        flush(true);
        return;
      }

      lastActiveAt.current = Date.now();
    };

    const interval = window.setInterval(flush, heartbeatMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const onBeforeUnload = () => flush(true);

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      flush(true);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isLoaded, userId]);

  return null;
};
