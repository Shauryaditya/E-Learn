export const RESOURCE_CATEGORIES = [
  { label: "School papers", value: "SCHOOL" },
  { label: "Board exams", value: "BOARD" },
  { label: "JEE Main", value: "JEE_MAINS" },
  { label: "JEE Advanced", value: "JEE_ADVANCED" },
  { label: "NEET", value: "NEET" },
  { label: "Other", value: "OTHER" },
] as const;

export const RESOURCE_TYPES = [
  { label: "Previous-year paper", value: "PAST_PAPER" },
  { label: "Sample paper", value: "SAMPLE_PAPER" },
  { label: "Notes", value: "NOTES" },
] as const;

export const SCHOOL_CLASSES = Array.from({ length: 5 }, (_, index) => `Class ${index + 8}`);

export const SCHOOL_BOARDS = [
  "CBSE",
  "ICSE",
  "ISC",
  { label: "Madhyamik (WBBSE)", value: "Madhyamik" },
];

export const EXAM_TYPES = [
  "Unit Test",
  "Half-Yearly",
  "Annual",
  "Pre-Board",
  "Selection Test",
  "Entrance Test",
  "Other",
];

export const resourceCategoryLabel = (value: string) =>
  RESOURCE_CATEGORIES.find(item => item.value === value)?.label || value.replaceAll("_", " ");

export const resourceTypeLabel = (value: string) =>
  RESOURCE_TYPES.find(item => item.value === value)?.label || value.replaceAll("_", " ");
