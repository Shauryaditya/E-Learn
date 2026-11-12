export type PracticeQuestion = {
  id: string;
  paperId?: string;
  chapterSlug?: string;
  year: number;
  school: string;
  exam: string;
  marks: number;
  type: "Numerical" | "Short answer" | "Long answer";
  question: string;
  formula?: string;
  answer: string;
  solution: string;
  attemptStatus?: "SOLVED" | "NEEDS_REVIEW";
};

export type PracticeChapter = {
  slug: string;
  title: string;
  description: string;
  questionCount: number;
  attempted: number;
  accuracy: number;
  topics: string[];
  resources: { label: string; kind: "Notes" | "Formula sheet" | "Assignment" | "Test"; detail: string }[];
  questions: PracticeQuestion[];
};

export type PracticeSubject = {
  slug: string;
  name: string;
  shortName: string;
  accent: string;
  description: string;
  questionCount: number;
  attempted: number;
  chapters: PracticeChapter[];
};

const currentElectricityQuestions: PracticeQuestion[] = [
  {
    id: "ce-1",
    year: 2025,
    school: "St. Xavier's Collegiate School",
    exam: "Pre-Board",
    marks: 2,
    type: "Numerical",
    question: "A wire of resistance 12 ohm is stretched to three times its original length. Assuming its volume remains constant, calculate its new resistance.",
    formula: "R = rho L / A",
    answer: "108 ohm",
    solution: "When length becomes 3L and volume remains constant, area becomes A/3. Therefore R' = rho(3L)/(A/3) = 9R = 108 ohm.",
  },
  {
    id: "ce-2",
    year: 2024,
    school: "The Heritage School",
    exam: "Selection Examination",
    marks: 3,
    type: "Short answer",
    question: "State Kirchhoff's junction rule. Explain the physical principle on which it is based and write the rule mathematically.",
    formula: "sum I(in) = sum I(out)",
    answer: "At any junction, the total current entering equals the total current leaving.",
    solution: "The rule follows from conservation of electric charge. Since charge cannot accumulate at an ideal junction, the algebraic sum of currents at that junction is zero.",
  },
  {
    id: "ce-3",
    year: 2023,
    school: "Don Bosco School, Park Circus",
    exam: "Annual Examination",
    marks: 3,
    type: "Numerical",
    question: "Two cells of emf 1.5 V and 2.0 V, having internal resistances 0.5 ohm and 1.0 ohm respectively, are connected in parallel with the same polarity. Find the equivalent emf.",
    formula: "E(eq) = (E1/r1 + E2/r2) / (1/r1 + 1/r2)",
    answer: "Approximately 1.67 V",
    solution: "Substituting the values gives (1.5/0.5 + 2/1) / (1/0.5 + 1/1) = 5/3 V, which is approximately 1.67 V.",
  },
  {
    id: "ce-4",
    year: 2022,
    school: "Modern High School for Girls",
    exam: "Pre-Board",
    marks: 5,
    type: "Long answer",
    question: "Using Kirchhoff's laws, obtain the condition for balance in a Wheatstone bridge. Why is a metre bridge most sensitive when the balance point is near the middle of the wire?",
    answer: "At balance, P/Q = R/S.",
    solution: "At balance no current flows through the galvanometer. Applying the loop rule to the two loops and eliminating the branch currents gives P/Q = R/S. A central balance point keeps the ratio arms comparable and reduces percentage error in measured length.",
  },
];

export const practiceSubjects: PracticeSubject[] = [
  {
    slug: "physics",
    name: "Physics",
    shortName: "PH",
    accent: "blue",
    description: "Concepts, derivations and numericals from school and board papers.",
    questionCount: 486,
    attempted: 74,
    chapters: [
      {
        slug: "current-electricity",
        title: "Current Electricity",
        description: "Electric current, resistance, cells, Kirchhoff's laws and measuring instruments.",
        questionCount: 103,
        attempted: 28,
        accuracy: 71,
        topics: ["Drift velocity", "Ohm's law", "Cells", "Kirchhoff's laws", "Wheatstone bridge"],
        resources: [
          { label: "Current Electricity — concise notes", kind: "Notes", detail: "18 min read" },
          { label: "Essential formula sheet", kind: "Formula sheet", detail: "2 pages" },
          { label: "Kirchhoff's laws assignment", kind: "Assignment", detail: "12 questions" },
          { label: "Chapter mastery test", kind: "Test", detail: "30 min · 25 marks" },
        ],
        questions: currentElectricityQuestions,
      },
      {
        slug: "electrostatics",
        title: "Electrostatics",
        description: "Charges, fields, potential, capacitance and dielectrics.",
        questionCount: 91,
        attempted: 22,
        accuracy: 68,
        topics: ["Coulomb's law", "Electric field", "Gauss's law", "Potential", "Capacitors"],
        resources: [],
        questions: [],
      },
      {
        slug: "magnetic-effects-of-current",
        title: "Magnetic Effects of Current",
        description: "Magnetic fields, force on charges and moving-coil galvanometer.",
        questionCount: 78,
        attempted: 12,
        accuracy: 75,
        topics: ["Biot-Savart law", "Ampere's law", "Lorentz force", "Galvanometer"],
        resources: [],
        questions: [],
      },
      {
        slug: "electromagnetic-induction",
        title: "Electromagnetic Induction",
        description: "Faraday's laws, Lenz's law, inductance and alternating current.",
        questionCount: 72,
        attempted: 8,
        accuracy: 63,
        topics: ["Magnetic flux", "Faraday's laws", "Lenz's law", "Inductance"],
        resources: [],
        questions: [],
      },
      {
        slug: "ray-optics",
        title: "Ray Optics",
        description: "Reflection, refraction, lenses and optical instruments.",
        questionCount: 86,
        attempted: 4,
        accuracy: 50,
        topics: ["Refraction", "Lenses", "Prism", "Microscope", "Telescope"],
        resources: [],
        questions: [],
      },
      {
        slug: "modern-physics",
        title: "Modern Physics",
        description: "Photoelectric effect, atoms, nuclei and semiconductors.",
        questionCount: 56,
        attempted: 0,
        accuracy: 0,
        topics: ["Photoelectric effect", "Bohr model", "Nuclei", "Semiconductors"],
        resources: [],
        questions: [],
      },
    ],
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    shortName: "MA",
    accent: "violet",
    description: "Chapter-wise problems with methods and step-by-step solutions.",
    questionCount: 612,
    attempted: 96,
    chapters: [
      { slug: "relations-functions", title: "Relations and Functions", description: "Types of relations, functions and inverse functions.", questionCount: 64, attempted: 18, accuracy: 78, topics: ["Relations", "Functions", "Inverse functions"], resources: [], questions: [] },
      { slug: "matrices-determinants", title: "Matrices and Determinants", description: "Matrix operations, determinants and linear equations.", questionCount: 82, attempted: 31, accuracy: 74, topics: ["Matrices", "Determinants", "Linear equations"], resources: [], questions: [] },
      { slug: "continuity-differentiability", title: "Continuity and Differentiability", description: "Limits, continuity and derivatives of composite functions.", questionCount: 108, attempted: 28, accuracy: 66, topics: ["Limits", "Continuity", "Differentiability"], resources: [], questions: [] },
      { slug: "integrals", title: "Integrals", description: "Indefinite and definite integration with applications.", questionCount: 124, attempted: 19, accuracy: 58, topics: ["Indefinite integrals", "Definite integrals", "Area"], resources: [], questions: [] },
    ],
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    shortName: "CH",
    accent: "emerald",
    description: "Physical, inorganic and organic chemistry arranged by chapter.",
    questionCount: 438,
    attempted: 51,
    chapters: [
      { slug: "solutions", title: "Solutions", description: "Concentration, colligative properties and abnormal molar mass.", questionCount: 72, attempted: 20, accuracy: 70, topics: ["Concentration", "Raoult's law", "Colligative properties"], resources: [], questions: [] },
      { slug: "electrochemistry", title: "Electrochemistry", description: "Cells, Nernst equation and conductance.", questionCount: 86, attempted: 17, accuracy: 65, topics: ["Electrochemical cells", "Nernst equation", "Conductance"], resources: [], questions: [] },
      { slug: "organic-compounds", title: "Organic Compounds", description: "Reaction mechanisms and named reactions.", questionCount: 118, attempted: 14, accuracy: 57, topics: ["Mechanisms", "Conversions", "Named reactions"], resources: [], questions: [] },
    ],
  },
];

export const findPracticeSubject = (slug: string) => practiceSubjects.find((subject) => subject.slug === slug);

export const findPracticeChapter = (subjectSlug: string, chapterSlug: string) => {
  const subject = findPracticeSubject(subjectSlug);
  const chapter = subject?.chapters.find((item) => item.slug === chapterSlug);
  return { subject, chapter };
};

export type PracticePaper = { id: string; title: string; year: number; exam: string; questionCount: number; url?: string };

export type PracticeCollection = {
  slug: string;
  board: string;
  grade: string;
  subject: string;
  school: string;
  source: "School papers" | "Board papers";
  paperCount: number;
  questionCount: number;
  chapterCount: number;
  attemptedCount?: number;
  solvedCount?: number;
  needsReviewCount?: number;
  papers: PracticePaper[];
  chapters: { slug: string; title: string; questionCount: number }[];
  questions: PracticeQuestion[];
};

const sampleQuestions = (school: string, subject: string): PracticeQuestion[] => [
  { id: `${school}-${subject}-1`, year: 2025, school, exam: "Pre-Board Examination", marks: 2, type: "Short answer", question: `A representative ${subject} question extracted from the 2025 school paper. Explain the key concept and show the required steps.`, answer: "The final answer is obtained by applying the relevant chapter concept.", solution: "Identify the chapter, write the governing principle, show the required working and state the result clearly." },
  { id: `${school}-${subject}-2`, year: 2024, school, exam: "Annual Examination", marks: 5, type: "Long answer", question: `A second ${subject} question from the annual examination, including the complete multi-step reasoning expected by the board.`, answer: "A complete answer includes the method, intermediate reasoning and final conclusion.", solution: "The marking scheme awards credit for the correct method, logically ordered working and a clearly stated final answer." },
];

export const practiceCollections: PracticeCollection[] = [
  {
    slug: "isc-12-physics-st-xaviers", board: "ISC", grade: "Class 12", subject: "Physics", school: "St. Xavier's Collegiate School", source: "School papers", paperCount: 8, questionCount: 247, chapterCount: 14,
    papers: [{ id: "sx-phy-2025", title: "Physics Pre-Board Examination", year: 2025, exam: "Pre-Board", questionCount: 31 }, { id: "sx-phy-2024", title: "Physics Selection Examination", year: 2024, exam: "Selection", questionCount: 29 }, { id: "sx-phy-2023", title: "Physics Annual Examination", year: 2023, exam: "Annual", questionCount: 32 }],
    chapters: [{ slug: "electrostatics", title: "Electrostatics", questionCount: 34 }, { slug: "current-electricity", title: "Current Electricity", questionCount: 41 }, { slug: "magnetic-effects", title: "Magnetic Effects of Current", questionCount: 29 }, { slug: "electromagnetic-induction", title: "Electromagnetic Induction", questionCount: 26 }, { slug: "ray-optics", title: "Ray Optics", questionCount: 31 }, { slug: "modern-physics", title: "Modern Physics", questionCount: 38 }], questions: currentElectricityQuestions,
  },
  {
    slug: "isc-12-physics-heritage", board: "ISC", grade: "Class 12", subject: "Physics", school: "The Heritage School", source: "School papers", paperCount: 6, questionCount: 186, chapterCount: 13,
    papers: [{ id: "heritage-phy-2025", title: "Physics Pre-Board Paper I", year: 2025, exam: "Pre-Board", questionCount: 30 }, { id: "heritage-phy-2024", title: "Physics Selection Examination", year: 2024, exam: "Selection", questionCount: 28 }],
    chapters: [{ slug: "electrostatics", title: "Electrostatics", questionCount: 26 }, { slug: "current-electricity", title: "Current Electricity", questionCount: 32 }, { slug: "ray-optics", title: "Ray Optics", questionCount: 24 }, { slug: "semiconductors", title: "Semiconductor Electronics", questionCount: 19 }], questions: sampleQuestions("The Heritage School", "Physics"),
  },
  {
    slug: "cbse-10-mathematics-dps", board: "CBSE", grade: "Class 10", subject: "Mathematics", school: "Delhi Public School, Ruby Park", source: "School papers", paperCount: 9, questionCount: 318, chapterCount: 15,
    papers: [{ id: "dps-math-2025", title: "Mathematics Standard Pre-Board", year: 2025, exam: "Pre-Board", questionCount: 38 }, { id: "dps-math-2024", title: "Mathematics Annual Examination", year: 2024, exam: "Annual", questionCount: 40 }],
    chapters: [{ slug: "real-numbers", title: "Real Numbers", questionCount: 18 }, { slug: "polynomials", title: "Polynomials", questionCount: 24 }, { slug: "linear-equations", title: "Pair of Linear Equations", questionCount: 31 }, { slug: "quadratic-equations", title: "Quadratic Equations", questionCount: 29 }, { slug: "trigonometry", title: "Introduction to Trigonometry", questionCount: 36 }], questions: sampleQuestions("Delhi Public School, Ruby Park", "Mathematics"),
  },
  {
    slug: "icse-10-chemistry-don-bosco", board: "ICSE", grade: "Class 10", subject: "Chemistry", school: "Don Bosco School, Park Circus", source: "School papers", paperCount: 7, questionCount: 224, chapterCount: 12,
    papers: [{ id: "db-chem-2025", title: "Chemistry Selection Examination", year: 2025, exam: "Selection", questionCount: 34 }, { id: "db-chem-2024", title: "Chemistry Annual Examination", year: 2024, exam: "Annual", questionCount: 32 }],
    chapters: [{ slug: "periodic-properties", title: "Periodic Properties", questionCount: 21 }, { slug: "chemical-bonding", title: "Chemical Bonding", questionCount: 28 }, { slug: "acids-bases-salts", title: "Acids, Bases and Salts", questionCount: 31 }, { slug: "organic-chemistry", title: "Organic Chemistry", questionCount: 37 }], questions: sampleQuestions("Don Bosco School, Park Circus", "Chemistry"),
  },
  {
    slug: "madhyamik-10-life-science-south-point", board: "Madhyamik", grade: "Class 10", subject: "Life Science", school: "South Point High School", source: "School papers", paperCount: 5, questionCount: 172, chapterCount: 8,
    papers: [{ id: "sp-life-2025", title: "Life Science Test Examination", year: 2025, exam: "Test", questionCount: 36 }, { id: "sp-life-2024", title: "Life Science Annual Examination", year: 2024, exam: "Annual", questionCount: 34 }],
    chapters: [{ slug: "control-coordination", title: "Control and Coordination", questionCount: 28 }, { slug: "continuity-of-life", title: "Continuity of Life", questionCount: 25 }, { slug: "heredity", title: "Heredity and Common Genetic Diseases", questionCount: 31 }, { slug: "environment", title: "Environment and Its Resources", questionCount: 24 }], questions: sampleQuestions("South Point High School", "Life Science"),
  },
  {
    slug: "cbse-12-physics-board", board: "CBSE", grade: "Class 12", subject: "Physics", school: "CBSE Board Papers", source: "Board papers", paperCount: 10, questionCount: 341, chapterCount: 14,
    papers: [{ id: "cbse-phy-2025", title: "CBSE Physics Board Examination", year: 2025, exam: "Board", questionCount: 33 }, { id: "cbse-phy-2024", title: "CBSE Physics Board Examination", year: 2024, exam: "Board", questionCount: 33 }],
    chapters: [{ slug: "electric-charges-fields", title: "Electric Charges and Fields", questionCount: 27 }, { slug: "current-electricity", title: "Current Electricity", questionCount: 35 }, { slug: "moving-charges", title: "Moving Charges and Magnetism", questionCount: 29 }, { slug: "optics", title: "Optics", questionCount: 42 }], questions: sampleQuestions("CBSE Board Papers", "Physics"),
  },
];

export const findPracticeCollection = (slug: string) => practiceCollections.find((collection) => collection.slug === slug);
