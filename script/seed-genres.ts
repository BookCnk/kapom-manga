/**
 * Script สำหรับ seed ข้อมูล Genres (หมวดหมู่)
 *
 * วิธีรัน:
 * npx tsx script/seed-genres.ts
 */

import { prisma } from "../lib/prisma";

const mainGenres = [
  "รักโรแมนติก",
  "ดราม่า",
  "ตลก,คอมเมดี้",
  "แฟนตาซี",
  "เกมออนไลน์",
  "กำลังภายใน",
  "แอคชั่น",
  "ผจญภัย",
  "อดีต,อนาคต",
  "โบราณ,ย้อนยุค",
  "ไซไฟ,วิทยาศาสตร์",
  "ระทึกขวัญ",
  "สืบสวน",
  "สะท้อนชีวิต",
  "แฟนฟิค",
  "วาย",
  "ยูริ",
  "ฮาเร็ม",
  "ต่างโลก",
];

const subGenres = [
  "ชีวิตในโรงเรียน",
  "เกิดใหม่",
  "ระบบ",
  "พลังวิเศษ",
  "สัตว์เลี้ยง",
  "สัตว์ประหลาด",
  "นักสืบ",
  "อาชญากรรม",
  "กีฬา",
  "ดนตรี",
  "ศิลปะ",
  "การทำอาหาร",
  "การแพทย์",
  "ทหาร",
  "ตำรวจ",
  "นักบิน",
  "นักแสดง",
  "ไอดอล",
  "นักร้อง",
  "นักเขียน",
  "นักวาด",
  "นักแปล",
  "นักธุรกิจ",
  "นักการเมือง",
  "นักวิทยาศาสตร์",
  "นักประดิษฐ์",
  "นักเล่นเกม",
  "นักสตรีม",
  "นักกีฬา",
  "นักต่อสู้",
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("🌱 Starting genre seed...");

  // Create main genres
  console.log("📚 Creating main genres...");
  for (const name of mainGenres) {
    const slug = generateSlug(name);
    await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: {
        slug,
        name,
      },
    });
    console.log(`  ✅ ${name}`);
  }

  // Create sub genres
  console.log("\n📖 Creating sub genres...");
  for (const name of subGenres) {
    const slug = `sub-${generateSlug(name)}`;
    await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: {
        slug,
        name,
      },
    });
    console.log(`  ✅ ${name}`);
  }

  console.log("\n✅ Genre seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding genres:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
