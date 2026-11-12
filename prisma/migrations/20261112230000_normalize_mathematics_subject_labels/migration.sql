UPDATE "Resource"
SET "subject" = 'Mathematics', "updatedAt" = CURRENT_TIMESTAMP
WHERE lower(trim("subject")) IN ('math', 'maths', 'mathematics');

UPDATE "StudentProfile"
SET "subjects" = ARRAY(
  SELECT DISTINCT CASE
    WHEN lower(trim(subject)) IN ('math', 'maths', 'mathematics') THEN 'Mathematics'
    ELSE trim(subject)
  END
  FROM unnest("subjects") AS subject
), "updatedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1 FROM unnest("subjects") AS subject
  WHERE lower(trim(subject)) IN ('math', 'maths', 'mathematics')
);
