"use client";
import React, { useState, useEffect, useCallback } from "react";
import { TextFlippingBoard } from "@/components/ui/text-flipping-board";

const MESSAGES: string[] = [
  "STAY HUNGRY \nSTAY FOOLISH \n- STEVE JOBS",
  "DISCIPLINE \nBEATS MOTIVATION \nEVERY TIME.",
  "CONSISTENCY \nBUILDS \nMASTERY.",
  "SMALL STEPS \nEVERY DAY \nBIG RESULTS.",
  "FOCUS ON \nPROGRESS \nNOT PERFECTION.",
  "YOU DON’T NEED \nMORE TIME \nYOU NEED FOCUS.",
  "DO IT \nEVEN WHEN \nYOU DON’T FEEL LIKE IT.",
  "SUCCESS IS \nREPEATED EFFORT \nDAY AFTER DAY.",
  "HARD WORK \nOUTWEIGHS \nTALENT.",
  "START NOW \nFIGURE IT OUT \nALONG THE WAY.",
  "YOUR FUTURE SELF \nIS WATCHING \nDON’T DISAPPOINT.",
  "NO EXCUSES \nJUST EXECUTION.",
  "BUILD HABITS \nNOT EXCUSES.",
  "PRESSURE \nCREATES \nDIAMONDS.",
  "YOU EITHER \nLEVEL UP \nOR STAY STUCK.",
  "STOP WAITING \nSTART BUILDING.",
  "LADIES AND GENTLEMEN \nWELCOME TO AACCENT",
];

export function TextFlippingBoardDemo() {
  const [msgIdx, setMsgIdx] = useState(0);
  const next = useCallback(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), []);

  useEffect(() => {
    const id = setInterval(next, 15000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-neutral-950 px-4 py-6 shadow-sm dark:border-white/10 md:min-h-[220px] md:py-8">
      <TextFlippingBoard text={MESSAGES[msgIdx]} />
    </div>
  );
}
