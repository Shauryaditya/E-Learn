-- Support either a legacy/single PDF or multiple answer-sheet images.
ALTER TABLE "TestSubmission"
    ALTER COLUMN "pdfUrl" DROP NOT NULL,
    ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "annotatedImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
