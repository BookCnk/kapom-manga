import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";
import {
  UserRole,
  MangaStatus,
  Visibility,
  CoinTransactionType,
  CoinTransactionStatus,
} from "@prisma/client";

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

function generateGenreSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("🌱 Starting seed...");

  // Seed genres
  // เดิมใช้ตาราง Tag ผ่าน prisma.tag แต่ตอนนี้เราเก็บ genre และ tag ไว้ที่
  // config (`lib/config/genres.ts`) และเก็บแท็กของมังงะใน `Manga.tagSlugs` โดยตรง
  // เลยไม่ต้องเขียนข้อมูลลงตาราง Tag อีกต่อไป
  console.log("📚 Seeding genres... (ข้ามการสร้าง Tag แล้วใช้ config แทน)");

  // Create or get translator user
  let translator = await prisma.user.findUnique({
    where: { email: "writer@test.com" },
  });

  if (!translator) {
    translator = await prisma.user.create({
      data: {
        email: "writer@test.com",
        name: "นักเขียนทดสอบ",
        passwordHash: hashPassword("testtest"),
        role: UserRole.TRANSLATOR,
      },
    });
    console.log("✅ Created translator user:", translator.email);
  } else {
    console.log("ℹ️  Translator user already exists:", translator.email);
  }

  // Create wallet for translator
  let wallet = await prisma.wallet.findUnique({
    where: { userId: translator.id },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: translator.id,
        balance: 0,
        totalTopup: 0,
        totalSpent: 0,
      },
    });
    console.log("✅ Created wallet for translator");
  } else {
    console.log("ℹ️  Wallet already exists");
  }

  // Create sample mangas
  const mangaTitles = [
    "เมื่อฉันกลายเป็นวายร้ายที่ฮีโร่หลงใหล",
    "การ์ตูนทดสอบ 1",
    "การ์ตูนทดสอบ 2",
    "การ์ตูนทดสอบ 3",
  ];

  const mangas = [];
  for (const title of mangaTitles) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    let manga = await prisma.manga.findUnique({
      where: { slug },
    });

    if (!manga) {
      manga = await prisma.manga.create({
        data: {
          slug,
          title,
          description: `รายละเอียดของ ${title}`,
          status: MangaStatus.ONGOING,
          visibility: Visibility.PUBLIC,
          isMature: false,
          creatorId: translator.id,
          views: Math.floor(Math.random() * 100000),
          likesCount: Math.floor(Math.random() * 1000),
        },
      });
      console.log(`✅ Created manga: ${title}`);
    } else {
      console.log(`ℹ️  Manga already exists: ${title}`);
    }
    mangas.push(manga);
  }

  // Create chapters for mangas
  const chapters = [];
  for (const manga of mangas) {
    const existingChapters = await prisma.chapter.count({
      where: { mangaId: manga.id },
    });

    if (existingChapters === 0) {
      // Create 10 chapters for each manga
      for (let i = 1; i <= 10; i++) {
        const chapter = await prisma.chapter.create({
          data: {
            mangaId: manga.id,
            title: `ตอนที่ ${i}`,
            number: i,
            slug: `chapter-${i}`,
            isLocked: i > 3, // First 3 chapters are free
            priceCoins: i > 3 ? 10 : 0,
            views: Math.floor(Math.random() * 5000),
          },
        });
        chapters.push(chapter);
      }
      console.log(`✅ Created 10 chapters for manga: ${manga.title}`);
    } else {
      const mangaChapters = await prisma.chapter.findMany({
        where: { mangaId: manga.id },
      });
      chapters.push(...mangaChapters);
      console.log(
        `ℹ️  Manga already has ${existingChapters} chapters: ${manga.title}`,
      );
    }
  }

  // Create sample coin transactions (purchases) for revenue data
  // Generate transactions for the past 3 months
  const now = new Date();
  const firstYearBE = 2567; // First year when coins were received
  const firstYearAD = firstYearBE - 543; // 2024
  const startDate = new Date(firstYearAD, 0, 1); // January 1, 2024

  // Get existing transactions count
  const existingTransactions = await prisma.coinTransaction.count({
    where: {
      walletId: wallet.id,
      type: CoinTransactionType.PURCHASE,
      status: CoinTransactionStatus.SUCCESS,
    },
  });

  if (existingTransactions === 0) {
    console.log("📊 Creating sample coin transactions...");

    // Generate transactions for each month from start date to now
    let currentDate = new Date(startDate);
    const transactions = [];

    while (currentDate <= now) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Generate transactions for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const transactionDate = new Date(year, month, day);
        if (transactionDate > now) break;

        // Random number of purchases per day (0-5)
        const purchasesPerDay = Math.floor(Math.random() * 6);

        for (let i = 0; i < purchasesPerDay; i++) {
          // Random chapter from our created chapters
          const randomChapter =
            chapters[Math.floor(Math.random() * chapters.length)];
          if (!randomChapter) continue;

          // Random amount between 5-50 coins
          const amount = Math.floor(Math.random() * 46) + 5;

          // Random time during the day
          const hour = Math.floor(Math.random() * 24);
          const minute = Math.floor(Math.random() * 60);
          const createdAt = new Date(year, month, day, hour, minute);

          transactions.push({
            walletId: wallet.id,
            userId: translator.id,
            type: CoinTransactionType.PURCHASE,
            status: CoinTransactionStatus.SUCCESS,
            amount,
            balanceBefore: 0,
            balanceAfter: 0,
            metadata: {
              chapterId: randomChapter.id,
              mangaId: randomChapter.mangaId,
            },
            createdAt,
          });
        }
      }

      // Move to next month
      currentDate = new Date(year, month + 1, 1);
    }

    // Insert transactions in batches
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await prisma.coinTransaction.createMany({
        data: batch,
      });
    }

    console.log(`✅ Created ${transactions.length} coin transactions`);
  } else {
    console.log(`ℹ️  Already have ${existingTransactions} transactions`);
  }

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
