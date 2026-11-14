export type PlannerSubject = {
  name: string;
  weeklyMinutes: number;
  chapters: string[];
};

export type PlannerTask = {
  id: string;
  subject: string;
  chapter: string;
  title: string;
  durationMinutes: number;
  day: string;
  isCompleted: boolean;
  note: string;
  isPersonal?: boolean;
  resources?: PlannerResource[];
};

export type PlannerResource = {
  id: string;
  kind: "LEARNING_MATERIAL" | "PRACTICE_SET" | "PAPER_PRACTICE";
  title: string;
  context: string;
  href: string;
  hasAccess: boolean;
};

export type PlannerResourceCandidate = PlannerResource & {
  searchText: string;
};

export type PlannerWeek = {
  weekNumber: number;
  startDate: string;
  endDate: string;
  label: string;
  tasks: PlannerTask[];
};

export type PlannerRoadmap = {
  version?: number;
  generatedAt: string;
  weeks: PlannerWeek[];
};

export type PlannerInput = {
  grade: string;
  examName: string;
  examDate: string;
  subjects: PlannerSubject[];
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const generateRoadmap = (input: PlannerInput): PlannerRoadmap => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(`${input.examDate}T23:59:59`);
  const availableDays = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / 86_400_000));
  const weekCount = Math.max(1, Math.min(52, Math.ceil(availableDays / 7)));
  const weeks: PlannerWeek[] = Array.from({ length: weekCount }, (_, index) => ({
    weekNumber: index + 1,
    startDate: isoDate(addDays(today, index * 7)),
    endDate: isoDate(addDays(today, Math.min(availableDays - 1, index * 7 + 6))),
    label: index === weekCount - 1 ? "Final revision" : `Week ${index + 1}`,
    tasks: [],
  }));

  input.subjects.forEach((subject, subjectIndex) => {
    const chapters = subject.chapters.length ? subject.chapters : ["Core concepts"];
    const sessionsPerWeek = Math.max(1, Math.min(5, Math.round(subject.weeklyMinutes / 60)));
    const sessionDuration = Math.max(30, Math.round(subject.weeklyMinutes / sessionsPerWeek / 15) * 15);
    const chapterOccurrences = new Map<string, number>();
    const learningStages = [
      (chapter: string) => `Learn the key ideas in ${chapter}`,
      (chapter: string) => `Work through examples from ${chapter}`,
      (chapter: string) => `Make a one-page recall sheet for ${chapter}`,
      (chapter: string) => `Practise previous-year questions from ${chapter}`,
      (chapter: string) => `Complete a timed chapter drill on ${chapter}`,
      (chapter: string) => `Review mistakes and strengthen ${chapter}`,
    ];

    weeks.forEach((week, weekIndex) => {
      for (let sessionIndex = 0; sessionIndex < sessionsPerWeek; sessionIndex += 1) {
        const sessionNumber = weekIndex * sessionsPerWeek + sessionIndex;
        const chapter = chapters[sessionNumber % chapters.length];
        const isFinalWeek = weekIndex === weekCount - 1;
        const occurrence = chapterOccurrences.get(chapter) || 0;
        chapterOccurrences.set(chapter, occurrence + 1);
        const finalWeekStages = [
          `Revise key ideas from ${chapter}`,
          `Complete a timed practice for ${chapter}`,
          `Review errors and weak areas in ${chapter}`,
        ];
        const title = isFinalWeek
          ? finalWeekStages[sessionIndex % finalWeekStages.length]
          : learningStages[occurrence % learningStages.length](chapter);

        week.tasks.push({
          id: `${subjectIndex}-${weekIndex}-${sessionIndex}-${Date.now()}`,
          subject: subject.name,
          chapter,
          title,
          durationMinutes: sessionDuration,
          day: DAY_NAMES[(subjectIndex * 2 + sessionIndex * 2 + weekIndex) % DAY_NAMES.length],
          isCompleted: false,
          note: "",
        });
      }
    });
  });

  weeks.forEach((week) => {
    week.tasks.sort((a, b) => DAY_NAMES.indexOf(a.day) - DAY_NAMES.indexOf(b.day));
  });

  return { version: 2, generatedAt: new Date().toISOString(), weeks };
};

export const carryRoadmapProgress = (
  previous: PlannerRoadmap | null | undefined,
  next: PlannerRoadmap
): PlannerRoadmap => {
  if (!previous) return next;

  const previousByTopic = new Map<string, PlannerTask[]>();
  previous.weeks.flatMap((week) => week.tasks).filter((task) => !task.isPersonal).forEach((task) => {
    const key = `${task.subject.toLowerCase()}::${task.chapter.toLowerCase()}`;
    previousByTopic.set(key, [...(previousByTopic.get(key) || []), task]);
  });

  const weeks = next.weeks.map((week, weekIndex) => {
    const tasks = week.tasks.map((task) => {
      const key = `${task.subject.toLowerCase()}::${task.chapter.toLowerCase()}`;
      const previousTask = previousByTopic.get(key)?.shift();
      return previousTask
        ? { ...task, isCompleted: previousTask.isCompleted, note: previousTask.note }
        : task;
    });
    const personalTasks = previous.weeks[weekIndex]?.tasks.filter((task) => task.isPersonal) || [];
    return { ...week, tasks: [...tasks, ...personalTasks] };
  });

  return { ...next, weeks };
};

export const getRoadmapProgress = (roadmap: PlannerRoadmap) => {
  const tasks = roadmap.weeks.flatMap((week) => week.tasks);
  const completed = tasks.filter((task) => task.isCompleted).length;
  return {
    completed,
    total: tasks.length,
    percentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
};

const SEARCH_STOP_WORDS = new Set(["the", "and", "for", "with", "class", "chapter", "notes", "assignment", "test", "series"]);

const searchTokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 1 && !SEARCH_STOP_WORDS.has(token));

const resourceScore = (task: PlannerTask, candidate: PlannerResourceCandidate, learnerContext: string) => {
  const requestedGrade = learnerContext.match(/(?:class\s*)?(6|7|8|9|10|11|12)\b/i)?.[1];
  const candidateGrade = candidate.searchText.match(/class\s*(6|7|8|9|10|11|12)\b/i)?.[1];
  if (requestedGrade && candidateGrade && requestedGrade !== candidateGrade) return -100;

  const haystack = new Set(searchTokens(candidate.searchText));
  const subjectTokens = searchTokens(task.subject);
  const chapterTokens = searchTokens(task.chapter);
  const gradeBonus = requestedGrade && candidateGrade === requestedGrade ? 6 : 0;
  return gradeBonus + subjectTokens.reduce((score, token) => score + (haystack.has(token) ? 4 : 0), 0)
    + chapterTokens.reduce((score, token) => score + (haystack.has(token) ? 2 : 0), 0);
};

export const attachLmsResources = (
  roadmap: PlannerRoadmap,
  candidates: PlannerResourceCandidate[],
  learnerContext: string
): PlannerRoadmap => ({
  ...roadmap,
  weeks: roadmap.weeks.map((week) => ({
    ...week,
    tasks: week.tasks.map((task) => {
      const ranked = candidates
        .map((candidate) => ({ candidate, score: resourceScore(task, candidate, learnerContext) }))
        .filter(({ score }) => score >= 4)
        .sort((a, b) => b.score - a.score);

      const learningMaterial = ranked.find(({ candidate }) => candidate.kind === "LEARNING_MATERIAL")?.candidate;
      const practiceSet = ranked.find(({ candidate }) => candidate.kind === "PRACTICE_SET")?.candidate;
      const paperPractice = ranked.find(({ candidate }) => candidate.kind === "PAPER_PRACTICE")?.candidate;
      const resources = [learningMaterial, practiceSet, paperPractice]
        .filter((candidate): candidate is PlannerResourceCandidate => Boolean(candidate))
        .map(({ searchText: _searchText, ...resource }) => resource);

      return { ...task, resources };
    }),
  })),
});
