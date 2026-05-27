"use client";

import { useEffect, useMemo, useState } from "react";
import { Compass, HelpCircle, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TourStep = {
  title: string;
  body: string;
  selector?: string;
};

const storageKey = "aaccent-quick-tour-seen";

export const ApplicationTour = () => {
  const steps = useMemo<TourStep[]>(
    () => [
      {
        title: "Welcome to Aaccent E-Learn",
        body: "Use this space to continue lessons, find courses, attempt test series, join contests, and manage your profile.",
      },
      {
        title: "Move Around",
        body: "The sidebar is your main desktop navigation. Browse, Dashboard, Test Series, Contests, Resources, and Profile are always close.",
        selector: "[data-tour='sidebar']",
      },
      {
        title: "Search Fast",
        body: "On Browse, search by course name and combine it with subject filters to narrow the catalog quickly.",
        selector: "[data-tour='search']",
      },
      {
        title: "Pick a Subject",
        body: "Subject filters let you scan the catalog without digging through every course.",
        selector: "[data-tour='categories']",
      },
      {
        title: "Browse in a Grid",
        body: "Courses are laid out as a desktop grid for easier comparison, while mobile keeps the swipeable row.",
        selector: "[data-tour='courses']",
      },
      {
        title: "Ready",
        body: "You can replay this guide anytime from the Quick tour button.",
      },
    ],
    []
  );

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    const hasSeenTour = window.localStorage.getItem(storageKey);

    if (!hasSeenTour) {
      const timeout = window.setTimeout(() => setIsOpen(true), 700);
      return () => window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !currentStep?.selector) {
      setTargetRect(null);
      return;
    }

    const updateTarget = () => {
      const element = document.querySelector(currentStep.selector!);

      if (!element) {
        setTargetRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    };

    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [currentStep, isOpen]);

  const closeTour = () => {
    window.localStorage.setItem(storageKey, "true");
    setIsOpen(false);
    setStepIndex(0);
  };

  const startTour = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  const goNext = () => {
    if (isLastStep) {
      closeTour();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const spotlightStyle = targetRect && typeof window !== "undefined"
    ? {
        top: Math.max(targetRect.top - 8, 8),
        left: Math.max(targetRect.left - 8, 8),
        width: Math.min(targetRect.width + 16, window.innerWidth - 16),
        height: Math.min(targetRect.height + 16, window.innerHeight - 16),
      }
    : undefined;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={startTour}
        className="fixed bottom-24 right-4 z-40 gap-2 rounded-full border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-950 md:bottom-6"
      >
        <HelpCircle className="h-4 w-4" />
        Quick tour
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" />

          {targetRect && (
            <div
              className="pointer-events-none absolute rounded-2xl border-2 border-sky-300 shadow-[0_0_0_9999px_rgba(15,23,42,0.45),0_18px_60px_rgba(14,165,233,0.3)]"
              style={spotlightStyle}
            />
          )}

          <div
            className={cn(
              "absolute left-4 right-4 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950",
              targetRect && "md:left-auto md:right-6 md:top-auto md:bottom-6 md:translate-y-0"
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                  {stepIndex === 0 ? (
                    <Sparkles className="h-5 w-5" />
                  ) : stepIndex === 2 ? (
                    <Search className="h-5 w-5" />
                  ) : (
                    <Compass className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Step {stepIndex + 1} of {steps.length}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                    {currentStep.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTour}
                className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close tour"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {currentStep.body}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {steps.map((step) => (
                  <span
                    key={step.title}
                    className={cn(
                      "h-1.5 w-5 rounded-full bg-slate-200 dark:bg-white/10",
                      step.title === currentStep.title && "bg-sky-500 dark:bg-sky-300"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStepIndex((current) => current - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button type="button" size="sm" onClick={goNext}>
                  {isLastStep ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
