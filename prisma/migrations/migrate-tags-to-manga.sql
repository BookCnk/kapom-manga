-- Migration script to move tags from Tag/MangaTag tables to Manga.tagSlugs array
-- Run this AFTER updating the schema and BEFORE running prisma migrate

-- Step 1: Add tagSlugs column to Manga table (if not exists)
ALTER TABLE "Manga" ADD COLUMN IF NOT EXISTS "tagSlugs" TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing tags to tagSlugs
-- For each manga, collect all tag slugs from MangaTag -> Tag relations
UPDATE "Manga" m
SET "tagSlugs" = COALESCE(
  (
    SELECT ARRAY_AGG(t.slug)
    FROM "MangaTag" mt
    INNER JOIN "Tag" t ON mt."tagId" = t.id
    WHERE mt."mangaId" = m.id
  ),
  '{}'::TEXT[]
);

-- Step 3: Verify migration (optional - can be run manually)
-- SELECT m.id, m.title, m."tagSlugs", 
--        (SELECT COUNT(*) FROM "MangaTag" WHERE "mangaId" = m.id) as old_tag_count
-- FROM "Manga" m
-- WHERE array_length(m."tagSlugs", 1) > 0 OR 
--       (SELECT COUNT(*) FROM "MangaTag" WHERE "mangaId" = m.id) > 0;

-- Step 4: After verifying, drop the old tables (run AFTER prisma migrate)
-- DROP TABLE IF EXISTS "MangaTag";
-- DROP TABLE IF EXISTS "Tag";
