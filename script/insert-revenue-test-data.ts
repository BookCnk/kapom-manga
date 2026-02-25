/**
 * Script สำหรับ insert ข้อมูลทดสอบ Revenue (CoinTransaction)
 * 
 * กราฟดึงข้อมูลจาก:
 * - Table: CoinTransaction
 * - Filter: type = PURCHASE, status = SUCCESS
 * - Metadata: { chapterId: number, mangaId?: number }
 * 
 * วิธีรัน:
 * npx tsx script/insert-revenue-test-data.ts
 */

import { prisma } from "../lib/prisma";
import { CoinTransactionType, CoinTransactionStatus } from "@prisma/client";

async function insertRevenueTestData() {
  try {
    console.log("🌱 Starting revenue test data insertion...");

    // 1. หา user ที่เป็น TRANSLATOR
    const translator = await prisma.user.findFirst({
      where: {
        role: "TRANSLATOR",
      },
    });

    if (!translator) {
      console.error("❌ No translator user found. Please run seed script first.");
      return;
    }

    console.log(`✅ Found translator: ${translator.email} (ID: ${translator.id})`);

    // 2. หา wallet ของ translator
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

    // 3. หา chapters ของ translator
    const chapters = await prisma.chapter.findMany({
      where: {
        manga: {
          creatorId: translator.id,
        },
      },
      select: {
        id: true,
        mangaId: true,
      },
    });

    if (chapters.length === 0) {
      console.error("❌ No chapters found. Please create manga and chapters first.");
      return;
    }

    console.log(`✅ Found ${chapters.length} chapters`);

    // 4. สร้างข้อมูลทดสอบสำหรับเดือนปัจจุบันและเดือนก่อนหน้า
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // สร้างข้อมูลสำหรับเดือนปัจจุบันและ 2 เดือนก่อนหน้า
    const monthsToGenerate = [
      { year: currentYear, month: currentMonth }, // เดือนปัจจุบัน
      { year: currentYear, month: currentMonth - 1 }, // เดือนที่แล้ว
      { year: currentYear, month: currentMonth - 2 }, // 2 เดือนที่แล้ว
    ];

    // ข้อมูล mock สำหรับเดือนกุมภาพันธ์ (ตามภาพ)
    const februaryMockData = [
      850, 1519.7, 650, 450, 0, 200, 200, 250, 150, 1100, 500, 200, 200, 300, 700, 1000, 500, 300,
      300, 200, 300, 1250, 1150, 300, 0, 0, 0, 0,
    ];

    const transactions = [];

    for (const { year, month } of monthsToGenerate) {
      if (month < 0) {
        // Handle year rollover
        const adjustedYear = year - 1;
        const adjustedMonth = month + 12;
        await generateTransactionsForMonth(
          adjustedYear,
          adjustedMonth,
          chapters,
          wallet.id,
          translator.id,
          transactions,
          adjustedMonth === 1 ? februaryMockData : undefined, // February = month 1 (0-indexed)
        );
      } else {
        await generateTransactionsForMonth(
          year,
          month,
          chapters,
          wallet.id,
          translator.id,
          transactions,
          month === 1 ? februaryMockData : undefined, // February = month 1 (0-indexed)
        );
      }
    }

    // 5. ลบ transactions เก่าที่มีอยู่แล้ว (optional - comment out if you want to keep old data)
    const existingCount = await prisma.coinTransaction.count({
      where: {
        walletId: wallet.id,
        type: CoinTransactionType.PURCHASE,
        status: CoinTransactionStatus.SUCCESS,
      },
    });

    if (existingCount > 0) {
      console.log(`ℹ️  Found ${existingCount} existing transactions. Deleting...`);
      await prisma.coinTransaction.deleteMany({
        where: {
          walletId: wallet.id,
          type: CoinTransactionType.PURCHASE,
          status: CoinTransactionStatus.SUCCESS,
        },
      });
      console.log("✅ Deleted existing transactions");
    }

    // 6. Insert transactions ใน batches
    console.log(`📊 Inserting ${transactions.length} transactions...`);
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await prisma.coinTransaction.createMany({
        data: batch,
      });
      console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transactions.length / batchSize)}`);
    }

    console.log("✅ Successfully inserted all transactions!");
    console.log(`\n📈 Summary:`);
    console.log(`   - Total transactions: ${transactions.length}`);
    console.log(`   - Translator: ${translator.email}`);
    console.log(`   - Chapters: ${chapters.length}`);

    // 7. แสดงสรุปยอดขาย
    const totalSales = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    console.log(`   - Total sales: ${totalSales.toFixed(2)} ReadCoin`);
  } catch (error) {
    console.error("❌ Error inserting revenue test data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function generateTransactionsForMonth(
  year: number,
  month: number,
  chapters: Array<{ id: number; mangaId: number }>,
  walletId: number,
  userId: number,
  transactions: any[],
  mockData?: number[],
) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const transactionDate = new Date(year, month, day);
    if (transactionDate > new Date()) break; // Don't create future dates

    let dailyTotal = 0;

    if (mockData && day <= mockData.length) {
      // ใช้ข้อมูล mock สำหรับเดือนกุมภาพันธ์
      dailyTotal = mockData[day - 1] || 0;
    } else {
      // สร้างข้อมูลแบบสุ่ม
      const baseSales = 200;
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      dailyTotal = baseSales + Math.random() * 800;
      if (isWeekend) {
        dailyTotal *= 1.5;
      }
      if (day % 7 === 0 || day % 10 === 0) {
        dailyTotal *= 1.5 + Math.random() * 0.5;
      }
      if (day % 15 === 0) {
        dailyTotal *= 0.3;
      }
    }

    // แบ่ง dailyTotal เป็นหลาย transactions
    if (dailyTotal > 0) {
      const numTransactions = Math.floor(Math.random() * 5) + 1; // 1-5 transactions per day
      const amountPerTransaction = Math.floor((dailyTotal / numTransactions) * 100) / 100;

      for (let i = 0; i < numTransactions; i++) {
        const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const createdAt = new Date(year, month, day, hour, minute);

        transactions.push({
          walletId,
          userId,
          type: CoinTransactionType.PURCHASE,
          status: CoinTransactionStatus.SUCCESS,
          amount: Math.round(amountPerTransaction), // Amount is in coins (integer)
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
  }
}

// Run the script
insertRevenueTestData()
  .catch((e) => {
    console.error("❌ Script failed:", e);
    process.exit(1);
  });
