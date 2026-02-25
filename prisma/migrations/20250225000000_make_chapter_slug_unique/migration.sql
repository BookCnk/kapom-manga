-- First, ensure all existing chapter slugs are unique
-- Update any duplicate slugs by appending a random suffix
DO $$
DECLARE
  chapter_record RECORD;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- Find and fix duplicate slugs
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
    -- Generate a new unique slug
    counter := 0;
    LOOP
      new_slug := chapter_record."slug" || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
      
      -- Check if new slug already exists
      IF NOT EXISTS (SELECT 1 FROM "Chapter" WHERE "slug" = new_slug) THEN
        UPDATE "Chapter" SET "slug" = new_slug WHERE "id" = chapter_record."id";
        EXIT;
      END IF;
      
      counter := counter + 1;
      IF counter > 10 THEN
        -- Fallback: use id
        new_slug := chapter_record."slug" || '_' || chapter_record."id";
        UPDATE "Chapter" SET "slug" = new_slug WHERE "id" = chapter_record."id";
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Drop the existing composite unique constraint if it exists
ALTER TABLE "Chapter" DROP CONSTRAINT IF EXISTS "Chapter_mangaId_slug_key";

-- Add a unique constraint on slug globally
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_slug_key" UNIQUE ("slug");
