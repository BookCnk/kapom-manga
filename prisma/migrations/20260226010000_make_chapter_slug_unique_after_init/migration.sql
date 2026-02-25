-- Ensure chapter slug is globally unique after init migrations.
-- 1) Fix duplicates if any
DO $$
DECLARE
  chapter_record RECORD;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  FOR chapter_record IN
    SELECT "id", "slug", "mangaId"
    FROM "Chapter"
    WHERE "slug" IN (
      SELECT "slug"
      FROM "Chapter"
      GROUP BY "slug"
      HAVING COUNT(*) > 1
    )
    ORDER BY "id"
  LOOP
    counter := 0;
    LOOP
      new_slug := chapter_record."slug" || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
      IF NOT EXISTS (SELECT 1 FROM "Chapter" WHERE "slug" = new_slug) THEN
        UPDATE "Chapter" SET "slug" = new_slug WHERE "id" = chapter_record."id";
        EXIT;
      END IF;
      counter := counter + 1;
      IF counter > 10 THEN
        new_slug := chapter_record."slug" || '_' || chapter_record."id";
        UPDATE "Chapter" SET "slug" = new_slug WHERE "id" = chapter_record."id";
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 2) Replace composite unique with global slug unique
DROP INDEX IF EXISTS "Chapter_mangaId_slug_key";
ALTER TABLE "Chapter" DROP CONSTRAINT IF EXISTS "Chapter_mangaId_slug_key";
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_slug_key" UNIQUE ("slug");

