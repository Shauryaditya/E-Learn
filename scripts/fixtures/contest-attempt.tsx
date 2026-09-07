import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ContestAttemptForm } from "../../src/app/(dashboard)/(routes)/contests/[contestId]/attempt/_components/contest-attempt-form";

const fixture = (window as typeof window & { contestFixture: { expiresAt: string } }).contestFixture;
const router = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, async prefetch() {} };

createRoot(document.getElementById("root")!).render(
  <AppRouterContext.Provider value={router}>
    <ContestAttemptForm attemptId="browser-test" contestId="browser-test" title="Class 12 Physics: Weekly Assessment"
      expiresAt={fixture.expiresAt}
      questions={[
        {
          id: "cq1", marks: 4,
          question: {
            id: "q1", questionText: "Which quantity is conserved in an isolated system?", questionType: "SINGLE_CHOICE",
            defaultMarks: 4, imageUrl: null,
            options: [{ id: "a", optionText: "Total energy", position: 1 }, { id: "b", optionText: "Temperature", position: 2 }],
          },
        },
        {
          id: "cq2", marks: 6,
          question: {
            id: "q2", questionText: "Explain your reasoning with an example.", questionType: "NUMERICAL",
            defaultMarks: 6, imageUrl: null, options: [],
          },
        },
      ]}
    />
  </AppRouterContext.Provider>,
);
