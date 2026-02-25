# ข้อมูล Revenue สำหรับกราฟ Writer Overview

## กราฟดึงข้อมูลจากไหน?

กราฟในหน้า `/writer/overview` ดึงข้อมูลจาก:

### Database Table: `CoinTransaction`

**เงื่อนไข:**
- `type` = `PURCHASE` (การซื้อ)
- `status` = `SUCCESS` (สำเร็จ)
- `metadata.chapterId` ต้องตรงกับ chapters ของ writer ที่ login อยู่

**โครงสร้างข้อมูล:**
```typescript
{
  walletId: number,
  userId: number,
  type: "PURCHASE",
  status: "SUCCESS",
  amount: number, // จำนวน ReadCoin (integer)
  metadata: {
    chapterId: number, // ID ของ chapter ที่ซื้อ
    mangaId?: number   // ID ของ manga (optional)
  },
  createdAt: Date // วันที่ทำรายการ
}
```

## วิธี Insert ข้อมูลทดสอบ

### วิธีที่ 1: ใช้ Seed Script (แนะนำ)
```bash
npm run seed
```
Script นี้จะสร้าง:
- User (TRANSLATOR)
- Wallet
- Manga และ Chapters
- CoinTransactions ตั้งแต่ปี 2567 (2024) จนถึงปัจจุบัน

### วิธีที่ 2: ใช้ Revenue Test Data Script
```bash
npx tsx script/insert-revenue-test-data.ts
```
Script นี้จะ:
- หา TRANSLATOR user ที่มีอยู่
- สร้าง CoinTransactions สำหรับเดือนปัจจุบันและ 2 เดือนก่อนหน้า
- ใช้ข้อมูล mock สำหรับเดือนกุมภาพันธ์ (ตามภาพตัวอย่าง)
- ลบ transactions เก่าที่มีอยู่แล้ว (ถ้ามี)

### วิธีที่ 3: Insert ด้วย SQL โดยตรง

```sql
-- 1. หา user_id และ wallet_id ของ writer
SELECT u.id as user_id, w.id as wallet_id 
FROM "User" u 
LEFT JOIN "Wallet" w ON w."userId" = u.id 
WHERE u.role = 'TRANSLATOR' 
LIMIT 1;

-- 2. หา chapter_id ของ writer
SELECT c.id as chapter_id, c."mangaId"
FROM "Chapter" c
JOIN "Manga" m ON m.id = c."mangaId"
WHERE m."creatorId" = <user_id>;

-- 3. Insert CoinTransaction
INSERT INTO "CoinTransaction" (
  "walletId",
  "userId",
  type,
  status,
  amount,
  "balanceBefore",
  "balanceAfter",
  metadata,
  "createdAt"
) VALUES (
  <wallet_id>,
  <user_id>,
  'PURCHASE',
  'SUCCESS',
  10, -- จำนวน ReadCoin
  0,
  0,
  '{"chapterId": <chapter_id>, "mangaId": <manga_id>}'::jsonb,
  '2024-02-25 10:30:00'::timestamp
);
```

## ตัวอย่างข้อมูล Mock สำหรับเดือนกุมภาพันธ์

```typescript
const februaryMockData = [
  850, 1519.7, 650, 450, 0, 200, 200, 250, 150, 1100, 
  500, 200, 200, 300, 700, 1000, 500, 300, 300, 200, 
  300, 1250, 1150, 300, 0, 0, 0, 0
];
// ตัวเลขเหล่านี้คือยอดขายรายวัน (ReadCoin)
```

## หมายเหตุ

1. **amount** ต้องเป็น **integer** (จำนวน ReadCoin)
2. **metadata.chapterId** ต้องตรงกับ chapters ของ writer
3. **createdAt** ใช้สำหรับคำนวณยอดขายรายวัน
4. กราฟจะแสดงเฉพาะ transactions ที่:
   - type = PURCHASE
   - status = SUCCESS
   - chapterId ใน metadata ตรงกับ chapters ของ writer

## การทดสอบ

1. Login ด้วย account ที่มี role = TRANSLATOR
2. รัน seed script หรือ revenue test data script
3. ไปที่ `/writer/overview`
4. เลือกเดือนและปีที่ต้องการดู
5. กราฟจะแสดงข้อมูลจาก CoinTransaction table
