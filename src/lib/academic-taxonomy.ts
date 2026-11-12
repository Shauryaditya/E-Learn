const boardAliases: Record<string, string> = {
  cbse: "CBSE",
  icse: "ICSE",
  isc: "ISC",
  madhyamik: "Madhyamik",
  wbbse: "Madhyamik",
  "west bengal board": "Madhyamik",
};

const subjectAliases: Record<string, string> = {
  math: "Mathematics",
  maths: "Mathematics",
  mathematics: "Mathematics",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  "life science": "Life Science",
  "physical science": "Physical Science",
  english: "English",
  "english language": "English Language",
  "english literature": "English Literature",
  "computer science": "Computer Science",
  "computer applications": "Computer Applications",
};

export const normalizeBoard = (value: string) => boardAliases[value.trim().toLowerCase()] || value.trim();

export const normalizeGrade = (value: string) => {
  const match = value.trim().match(/(?:class\s*)?(8|9|10|11|12)(?:st|nd|rd|th)?/i);
  return match ? `Class ${match[1]}` : value.trim();
};

export const normalizeSubject = (value: string) => subjectAliases[value.trim().toLowerCase()] || value.trim().replace(/\s+/g, " ");

export const cleanChapterTitle = (value: string) => value
  .trim()
  .replace(/^(?:chapter|ch\.?|unit)\s*[-.:#]?\s*\d+[a-z]?\s*[-.:)]?\s*/i, "")
  .replace(/^\d+[.)-]\s*/, "")
  .replace(/\s+/g, " ")
  .trim() || "Unclassified";

export const chapterKey = (value: string) => cleanChapterTitle(value)
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "") || "unclassified";
