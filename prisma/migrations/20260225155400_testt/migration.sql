/*
  Warnings:

  - You are about to drop the `Genre` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MangaGenre` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MangaGenre" DROP CONSTRAINT "MangaGenre_genreId_fkey";

-- DropForeignKey
ALTER TABLE "MangaGenre" DROP CONSTRAINT "MangaGenre_mangaId_fkey";

-- AlterTable
ALTER TABLE "Manga" ADD COLUMN     "genreSlugs" JSONB DEFAULT '[]';

-- DropTable
DROP TABLE "Genre";

-- DropTable
DROP TABLE "MangaGenre";
