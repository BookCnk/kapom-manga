// src/lib/mock/homeData.ts
export type MangaGenre =
  | "แอคชั่น"
  | "แฟนตาซี"
  | "โรแมนติก"
  | "คอมเมดี้"
  | "ระทึกขวัญ"
  | "ดราม่า"
  | "โรงเรียน"
  | "ต่างโลก"
  | "ไซไฟ";

export type MangaCard = {
  id: string;
  slug: string; // ใช้ทำ path เช่น /manga/[slug]
  title: string;
  description: string;
  coverImage: string;

  // meta ที่การ์ดคุณโชว์
  views: number; // 13.6K -> 13600
  rating: number; // 4.7
  totalChapters: number;
  sales?: number; // ยอดขาย

  // latest update
  latestChapter?: number;
  latestUpdatedLabel?: string; // label แบบกำหนดเอง เช่น "15 นาทีที่แล้ว" (fallback)
  updatedAt?: string; // เวลาอัปเดตล่าสุด (ISO string จาก database)

  // badges
  isNew?: boolean; // โชว์ UP
  tags?: string[]; // เช่น ["Exclusive"]
  genre: MangaGenre; // genre หลัก (สำหรับ backward compatibility)
  genres?: string[]; // array ของ genre names (สูงสุด 2)
  author?: string; // ชื่อผู้เขียน
  translator?: string; // ชื่อคนแปล
  creatorUsername?: string; // username ของผู้สร้าง (ใช้สำหรับลิงก์ไปที่ profile)
};

export type HomePageData = {
  featured: MangaCard[];
  latestUpdates: MangaCard[];
  weeklyRanking: MangaCard[];
  bestSellers: MangaCard[]; // ขายดีประจำสัปดาห์
  mostLiked: MangaCard[]; // ผู้คนชื่นชอบประจำสัปดาห์
  genres: MangaGenre[];
};

export const homeData: HomePageData = {
  featured: [
    {
      id: "m-001",
      slug: "legend-dragon-sky",
      title: "ตำนานเทพยุทธ์มังกรฟ้า",
      description:
        "เมื่อโชคชะตาพลิกผัน เด็กหนุ่มธรรมดาต้องก้าวเข้าสู่เส้นทางแห่งการฝึกตน ฝ่าฟันอุปสรรคและเหล่าปีศาจร้าย เพื่อไขปริศนาชาติกำเนิดและปกป้องคนที่เขารัก",
      coverImage:
        "https://images.unsplash.com/photo-1618519764611-bd220fc59c5d?q=80&w=1200&auto=format&fit=crop",
      views: 13600,
      rating: 9.8,
      totalChapters: 210,
      latestChapter: 210,
      latestUpdatedLabel: "วันนี้",
      updatedAt: "2026-02-24T10:00:00+07:00",
      isNew: true,
      tags: [],
      genre: "แฟนตาซี",
      translator: "RTN Team",
    },
    {
      id: "m-002",
      slug: "shadow-assassin-academy",
      title: "โรงเรียนมือสังหารเงา",
      description:
        "ในโลกที่นักฆ่าคืออาชีพชั้นสูง เด็กหนุ่มผู้ไร้พรสวรรค์ต้องพิสูจน์ตัวเองในโรงเรียนสุดโหด ที่ความล้มเหลวหมายถึงความตายในโลกที่นักฆ่าคืออาชีพชั้นสูง เด็กหนุ่มผู้ไร้พรสวรรค์ต้องพิสูจน์ตัวเองในโรงเรียนสุดโหด ที่ความล้มเหลวหมายถึงความตายในโลกที่นักฆ่าคืออาชีพชั้นสูง เด็กหนุ่มผู้ไร้พรสวรรค์ต้องพิสูจน์ตัวเองในโรงเรียนสุดโหด ที่ความล้มเหลวหมายถึงความตาย",
      coverImage:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop",
      views: 22400,
      rating: 9.5,
      totalChapters: 148,
      latestChapter: 148,
      latestUpdatedLabel: "เมื่อวาน",
      updatedAt: "2026-02-23T18:30:00+07:00",
      isNew: false,
      tags: ["Hot"],
      genre: "แอคชั่น",
      translator: "Night Owl",
    },
    {
      id: "m-003",
      slug: "reborn-demon-king",
      title: "เกิดใหม่เป็นราชาปีศาจ",
      description:
        "ราชาปีศาจผู้ยิ่งใหญ่กลับมาเกิดใหม่ในร่างมนุษย์ เพื่อเริ่มต้นชีวิตใหม่ แต่พลังที่ซ่อนอยู่กำลังจะปลุกโลกให้สั่นสะเทือนอีกครั้ง",
      coverImage:
        "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop",
      views: 18900,
      rating: 9.7,
      totalChapters: 320,
      latestChapter: 320,
      latestUpdatedLabel: "3 วันที่แล้ว",
      updatedAt: "2026-02-21T09:15:00+07:00",
      isNew: false,
      tags: ["Trending"],
      genre: "ต่างโลก",
      translator: "RTN Studio",
    },
  ],

  latestUpdates: [
    {
      id: "m-002",
      slug: "dark-armor-warrior-special",
      title: "นักรบหุ้มเกราะทมิฬ ตอนพิเศษ",
      description:
        "บทพิเศษที่เปิดเผยความลับของเกราะต้องสาป และศัตรูที่แท้จริง...",
      coverImage:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop",
      views: 13600,
      rating: 4.7,
      totalChapters: 145,
      latestChapter: 145,
      latestUpdatedLabel: "15 นาทีที่แล้ว",
      updatedAt: "2026-02-24T14:45:00+07:00",
      isNew: true,
      genre: "แอคชั่น",
      tags: ["ย้อนเวลา", "เกิดใหม่", "ดราม่า", "ย้อนเวลา", "มืดมน"],
      translator: "Kaizoku",
    },
    {
      id: "m-003",
      slug: "reborn-villainess-otome",
      title: "เกิดใหม่เป็นนางร้ายในเกมจีบหนุ่ม",
      description: "ตื่นมาอีกที…ดันอยู่ในร่างนางร้ายที่กำลังจะโดนเกมลงโทษ!",
      coverImage:
        "https://images.unsplash.com/photo-1612480797665-c96d261ae098?q=80&w=400&auto=format&fit=crop",
      views: 10200,
      rating: 9.2,
      totalChapters: 42,
      latestChapter: 42,
      latestUpdatedLabel: "1 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T13:50:00+07:00",
      isNew: false,
      genre: "โรแมนติก",
      tags: ["นางร้าย", "เกมจีบหนุ่ม", "ต่างโลก"],
      translator: "Sweetheart",
    },
    {
      id: "m-004",
      slug: "slow-life-fallen-sage",
      title: "ชีวิตสโลว์ไลฟ์ของนักปราชญ์ตกอับ",
      description: "เมื่อปราชญ์ผู้ยิ่งใหญ่ตกอับ…จึงเริ่มชีวิตใหม่แบบสโลว์ไลฟ์",
      coverImage:
        "https://images.unsplash.com/photo-1541562232579-515a2134cb41?q=80&w=400&auto=format&fit=crop",
      views: 9800,
      rating: 9.5,
      totalChapters: 89,
      latestChapter: 89,
      latestUpdatedLabel: "2 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T12:30:00+07:00",
      isNew: true,
      genre: "คอมเมดี้",
      tags: ["สโลว์ไลฟ์", "แฟนตาซี", "ตลก"],
      translator: "FunnyGuy",
    },
    {
      id: "m-005",
      slug: "invincible-mage-dark-era",
      title: "จอมเวทย์ไร้พ่ายแห่งยุคมืด",
      description: "พลังต้องห้ามในยุคมืด…กับคำสัญญาที่แลกมาด้วยชีวิต",
      coverImage:
        "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=400&auto=format&fit=crop",
      views: 8700,
      rating: 9.0,
      totalChapters: 210,
      latestChapter: 210,
      latestUpdatedLabel: "3 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T11:20:00+07:00",
      isNew: false,
      genre: "แฟนตาซี",
      tags: ["เวทมนตร์", "มืดมน", "ต่อสู้"],
    },
    {
      id: "m-002",
      slug: "dark-armor-warrior-special",
      title: "นักรบหุ้มเกราะทมิฬ ตอนพิเศษ",
      description:
        "บทพิเศษที่เปิดเผยความลับของเกราะต้องสาป และศัตรูที่แท้จริง...",
      coverImage:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop",
      views: 13600,
      rating: 4.7,
      totalChapters: 145,
      latestChapter: 145,
      latestUpdatedLabel: "15 นาทีที่แล้ว",
      updatedAt: "2026-02-24T14:45:00+07:00",
      isNew: true,
      genre: "แอคชั่น",
      tags: ["ย้อนเวลา", "เกิดใหม่", "ดราม่า", "ย้อนเวลา", "มืดมน"],
      translator: "Kaizoku",
    },
    {
      id: "m-003",
      slug: "reborn-villainess-otome",
      title: "เกิดใหม่เป็นนางร้ายในเกมจีบหนุ่ม",
      description: "ตื่นมาอีกที…ดันอยู่ในร่างนางร้ายที่กำลังจะโดนเกมลงโทษ!",
      coverImage:
        "https://images.unsplash.com/photo-1612480797665-c96d261ae098?q=80&w=400&auto=format&fit=crop",
      views: 10200,
      rating: 9.2,
      totalChapters: 42,
      latestChapter: 42,
      latestUpdatedLabel: "1 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T13:50:00+07:00",
      isNew: false,
      genre: "โรแมนติก",
      tags: ["นางร้าย", "เกมจีบหนุ่ม", "ต่างโลก"],
      translator: "Sweetheart",
    },
    {
      id: "m-004",
      slug: "slow-life-fallen-sage",
      title: "ชีวิตสโลว์ไลฟ์ของนักปราชญ์ตกอับ",
      description: "เมื่อปราชญ์ผู้ยิ่งใหญ่ตกอับ…จึงเริ่มชีวิตใหม่แบบสโลว์ไลฟ์",
      coverImage:
        "https://images.unsplash.com/photo-1541562232579-515a2134cb41?q=80&w=400&auto=format&fit=crop",
      views: 9800,
      rating: 9.5,
      totalChapters: 89,
      latestChapter: 89,
      latestUpdatedLabel: "2 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T12:30:00+07:00",
      isNew: true,
      genre: "คอมเมดี้",
      tags: ["สโลว์ไลฟ์", "แฟนตาซี", "ตลก"],
      translator: "FunnyGuy",
    },
    {
      id: "m-005",
      slug: "invincible-mage-dark-era",
      title: "จอมเวทย์ไร้พ่ายแห่งยุคมืด",
      description: "พลังต้องห้ามในยุคมืด…กับคำสัญญาที่แลกมาด้วยชีวิต",
      coverImage:
        "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=400&auto=format&fit=crop",
      views: 8700,
      rating: 9.0,
      totalChapters: 210,
      latestChapter: 210,
      latestUpdatedLabel: "3 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T11:20:00+07:00",
      isNew: false,
      genre: "แฟนตาซี",
      tags: ["เวทมนตร์", "มืดมน", "ต่อสู้"],
    },
    {
      id: "m-002",
      slug: "dark-armor-warrior-special",
      title: "นักรบหุ้มเกราะทมิฬ ตอนพิเศษ",
      description:
        "บทพิเศษที่เปิดเผยความลับของเกราะต้องสาป และศัตรูที่แท้จริง...",
      coverImage:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop",
      views: 13600,
      rating: 4.7,
      totalChapters: 145,
      latestChapter: 145,
      latestUpdatedLabel: "15 นาทีที่แล้ว",
      updatedAt: "2026-02-24T14:45:00+07:00",
      isNew: true,
      genre: "แอคชั่น",
      tags: ["ย้อนเวลา", "เกิดใหม่", "ดราม่า", "ย้อนเวลา", "มืดมน"],
      translator: "Kaizoku",
    },
    {
      id: "m-003",
      slug: "reborn-villainess-otome",
      title: "เกิดใหม่เป็นนางร้ายในเกมจีบหนุ่ม",
      description: "ตื่นมาอีกที…ดันอยู่ในร่างนางร้ายที่กำลังจะโดนเกมลงโทษ!",
      coverImage:
        "https://images.unsplash.com/photo-1612480797665-c96d261ae098?q=80&w=400&auto=format&fit=crop",
      views: 10200,
      rating: 9.2,
      totalChapters: 42,
      latestChapter: 42,
      latestUpdatedLabel: "1 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T13:50:00+07:00",
      isNew: false,
      genre: "โรแมนติก",
      tags: ["นางร้าย", "เกมจีบหนุ่ม", "ต่างโลก"],
      translator: "Sweetheart",
    },
    {
      id: "m-004",
      slug: "slow-life-fallen-sage",
      title: "ชีวิตสโลว์ไลฟ์ของนักปราชญ์ตกอับ",
      description: "เมื่อปราชญ์ผู้ยิ่งใหญ่ตกอับ…จึงเริ่มชีวิตใหม่แบบสโลว์ไลฟ์",
      coverImage:
        "https://images.unsplash.com/photo-1541562232579-515a2134cb41?q=80&w=400&auto=format&fit=crop",
      views: 9800,
      rating: 9.5,
      totalChapters: 89,
      latestChapter: 89,
      latestUpdatedLabel: "2 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T12:30:00+07:00",
      isNew: true,
      genre: "คอมเมดี้",
      tags: ["สโลว์ไลฟ์", "แฟนตาซี", "ตลก"],
      translator: "FunnyGuy",
    },
    {
      id: "m-005",
      slug: "invincible-mage-dark-era",
      title: "จอมเวทย์ไร้พ่ายแห่งยุคมืด",
      description: "พลังต้องห้ามในยุคมืด…กับคำสัญญาที่แลกมาด้วยชีวิต",
      coverImage:
        "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=400&auto=format&fit=crop",
      views: 8700,
      rating: 9.0,
      totalChapters: 210,
      latestChapter: 210,
      latestUpdatedLabel: "3 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T11:20:00+07:00",
      isNew: false,
      genre: "แฟนตาซี",
      tags: ["เวทมนตร์", "มืดมน", "ต่อสู้"],
    },
    {
      id: "m-002",
      slug: "dark-armor-warrior-special",
      title: "นักรบหุ้มเกราะทมิฬ ตอนพิเศษ",
      description:
        "บทพิเศษที่เปิดเผยความลับของเกราะต้องสาป และศัตรูที่แท้จริง...",
      coverImage:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop",
      views: 13600,
      rating: 4.7,
      totalChapters: 145,
      latestChapter: 145,
      latestUpdatedLabel: "15 นาทีที่แล้ว",
      updatedAt: "2026-02-24T14:45:00+07:00",
      isNew: true,
      genre: "แอคชั่น",
      tags: ["ย้อนเวลา", "เกิดใหม่", "ดราม่า", "ย้อนเวลา", "มืดมน"],
      translator: "Kaizoku",
    },
    {
      id: "m-003",
      slug: "reborn-villainess-otome",
      title: "เกิดใหม่เป็นนางร้ายในเกมจีบหนุ่ม",
      description: "ตื่นมาอีกที…ดันอยู่ในร่างนางร้ายที่กำลังจะโดนเกมลงโทษ!",
      coverImage:
        "https://images.unsplash.com/photo-1612480797665-c96d261ae098?q=80&w=400&auto=format&fit=crop",
      views: 10200,
      rating: 9.2,
      totalChapters: 42,
      latestChapter: 42,
      latestUpdatedLabel: "1 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T13:50:00+07:00",
      isNew: false,
      genre: "โรแมนติก",
      tags: ["นางร้าย", "เกมจีบหนุ่ม", "ต่างโลก"],
      translator: "Sweetheart",
    },
    {
      id: "m-004",
      slug: "slow-life-fallen-sage",
      title: "ชีวิตสโลว์ไลฟ์ของนักปราชญ์ตกอับ",
      description: "เมื่อปราชญ์ผู้ยิ่งใหญ่ตกอับ…จึงเริ่มชีวิตใหม่แบบสโลว์ไลฟ์",
      coverImage:
        "https://images.unsplash.com/photo-1541562232579-515a2134cb41?q=80&w=400&auto=format&fit=crop",
      views: 9800,
      rating: 9.5,
      totalChapters: 89,
      latestChapter: 89,
      latestUpdatedLabel: "2 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T12:30:00+07:00",
      isNew: true,
      genre: "คอมเมดี้",
      tags: ["สโลว์ไลฟ์", "แฟนตาซี", "ตลก"],
      translator: "FunnyGuy",
    },
    {
      id: "m-005",
      slug: "invincible-mage-dark-era",
      title: "จอมเวทย์ไร้พ่ายแห่งยุคมืด",
      description: "พลังต้องห้ามในยุคมืด…กับคำสัญญาที่แลกมาด้วยชีวิต",
      coverImage:
        "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=400&auto=format&fit=crop",
      views: 8700,
      rating: 9.0,
      totalChapters: 210,
      latestChapter: 210,
      latestUpdatedLabel: "3 ชม.ที่แล้ว",
      updatedAt: "2026-02-24T11:20:00+07:00",
      isNew: false,
      genre: "แฟนตาซี",
      tags: ["เวทมนตร์", "มืดมน", "ต่อสู้"],
    },
  ],

  weeklyRanking: [
    {
      id: "m-001",
      slug: "legend-dragon-sky",
      title: "ตำนานเทพยุทธ์มังกรฟ้า",
      description: "มหากาพย์ยุทธ์ภพที่ทุกคนพูดถึง",
      coverImage:
        "https://images.unsplash.com/photo-1618519764611-bd220fc59c5d?q=80&w=200&auto=format&fit=crop",
      views: 99999,
      rating: 9.8,
      totalChapters: 210,
      genre: "แฟนตาซี",
      tags: ["กำลังภายใน", "มังกร", "ผจญภัย"],
    },
    {
      id: "m-004",
      slug: "slow-life-fallen-sage",
      title: "ชีวิตสโลว์ไลฟ์ของนักปราชญ์ตกอับ",
      description: "สโลว์ไลฟ์ที่ไม่ช้าอย่างที่คิด",
      coverImage:
        "https://images.unsplash.com/photo-1541562232579-515a2134cb41?q=80&w=200&auto=format&fit=crop",
      views: 65432,
      rating: 9.5,
      totalChapters: 89,
      genre: "คอมเมดี้",
      tags: ["สโลว์ไลฟ์", "เบาสมอง"],
    },
    {
      id: "m-003",
      slug: "reborn-villainess-otome",
      title: "เกิดใหม่เป็นนางร้ายในเกมจีบหนุ่ม",
      description: "นางร้ายที่ไม่อยากโดนลงโทษ",
      coverImage:
        "https://images.unsplash.com/photo-1612480797665-c96d261ae098?q=80&w=200&auto=format&fit=crop",
      views: 54321,
      rating: 9.2,
      totalChapters: 42,
      genre: "โรแมนติก",
      tags: ["นางร้าย", "ดราม่า"],
    },
    {
      id: "m-006",
      slug: "dungeon-99",
      title: "ดันเจี้ยนชั้นที่ 99",
      description: "ลงดันจนสุด…แล้วเจอความจริง",
      coverImage: "",
      views: 42000,
      rating: 8.9,
      totalChapters: 76,
      genre: "แอคชั่น",
      tags: ["ดันเจี้ยน", "ทีมสำรวจ"],
    },
    {
      id: "m-007",
      slug: "dark-armor-warrior",
      title: "นักรบหุ้มเกราะทมิฬ",
      description: "เกราะต้องสาปและสงครามจักรกล",
      coverImage: "",
      views: 39000,
      rating: 8.7,
      totalChapters: 145,
      genre: "แอคชั่น",
      tags: [
        "ย้อนเวลา",
        "เกิดใหม่",
        "ดราม่า",
        "ย้อนเวลา",
        "มืดมน",
        "ย้อนเวลา",
        "เกิดใหม่",
        "ดราม่า",
        "ย้อนเวลา",
        "มืดมน",
        "ย้อนเวลา",
        "เกิดใหม่",
        "ดราม่า",
        "ย้อนเวลา",
        "มืดมน",
      ],
    },
  ],

  // ขายดีประจำสัปดาห์
  bestSellers: [
    {
      id: "m-008",
      slug: "sword-saint-beginner",
      title: "เซนต์ดาบมือใหม่",
      description: "จากมือใหม่สู่เซนต์ดาบในตำนาน",
      coverImage:
        "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?q=80&w=400&auto=format&fit=crop",
      views: 45000,
      rating: 9.1,
      totalChapters: 156,
      latestChapter: 156,
      latestUpdatedLabel: "2 วันที่แล้ว",
      genre: "แอคชั่น",
      tags: ["ดาบ", "แฟนตาซี", "ต่อสู้"],
    },
    {
      id: "m-009",
      slug: "villain-duke-daughter",
      title: "ข้าคือธิดาของดยุกวายร้าย",
      description: "ธิดาดยุกที่ถูกทุกคนเกลียดชัง",
      coverImage:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
      views: 38000,
      rating: 8.8,
      totalChapters: 88,
      latestChapter: 88,
      latestUpdatedLabel: "1 วันที่แล้ว",
      genre: "ดราม่า",
      tags: ["ครอบครัว", "ชนชั้นสูง"],
    },
    {
      id: "m-010",
      slug: "academy-genius",
      title: "อัจฉริยะแห่งสถาบัน",
      description: "อัจฉริยะที่ซ่อนพลังแท้จริง",
      coverImage:
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&auto=format&fit=crop",
      views: 52000,
      rating: 9.3,
      totalChapters: 201,
      latestChapter: 201,
      latestUpdatedLabel: "วันนี้",
      isNew: true,
      genre: "โรงเรียน",
      tags: ["อัจฉริยะ", "โรงเรียนเวทมนตร์"],
    },
    {
      id: "m-011",
      slug: "healing-mage",
      title: "นักเวทย์ฮีลที่แข็งแกร่งที่สุด",
      description: "ฮีลที่แท้จริงคือการจัดการศัตรู",
      coverImage:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop",
      views: 41000,
      rating: 9.0,
      totalChapters: 134,
      latestChapter: 134,
      latestUpdatedLabel: "3 วันที่แล้ว",
      genre: "แฟนตาซี",
    },
    {
      id: "m-012",
      slug: "romance-fantasy",
      title: "โรแมนซ์แฟนตาซีของฉัน",
      description: "ชีวิตใหม่ในโลกแฟนตาซี",
      coverImage:
        "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=400&auto=format&fit=crop",
      views: 36000,
      rating: 8.7,
      totalChapters: 67,
      latestChapter: 67,
      latestUpdatedLabel: "2 วันที่แล้ว",
      genre: "โรแมนติก",
    },
    {
      id: "m-013",
      slug: "thriller-night",
      title: "คืนอันตราย",
      description: "คืนที่เต็มไปด้วยความน่ากลัว",
      coverImage:
        "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400&auto=format&fit=crop",
      views: 29000,
      rating: 8.5,
      totalChapters: 45,
      latestChapter: 45,
      latestUpdatedLabel: "5 วันที่แล้ว",
      genre: "ระทึกขวัญ",
    },
    {
      id: "m-014",
      slug: "comedy-guild",
      title: "กิลด์คอมเมดี้",
      description: "กิลด์ที่เต็มไปด้วยความฮา",
      coverImage:
        "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=400&auto=format&fit=crop",
      views: 33000,
      rating: 8.9,
      totalChapters: 112,
      latestChapter: 112,
      latestUpdatedLabel: "1 วันที่แล้ว",
      genre: "คอมเมดี้",
    },
    {
      id: "m-015",
      slug: "magic-school-life",
      title: "ชีวิตในโรงเรียนเวทมนตร์",
      description: "ชีวิตประจำวันของนักเรียนเวท",
      coverImage:
        "https://images.unsplash.com/photo-1554188248-986adbb73be4?q=80&w=400&auto=format&fit=crop",
      views: 47000,
      rating: 9.2,
      totalChapters: 178,
      latestChapter: 178,
      latestUpdatedLabel: "วันนี้",
      isNew: true,
      genre: "โรงเรียน",
    },
  ],

  // ผู้คนชื่นชอบประจำสัปดาห์
  mostLiked: [
    {
      id: "m-016",
      slug: "hero-return",
      title: "วีรบุรุษกลับมาแล้ว",
      description: "ฮีโร่ที่กลับมาจากต่างโลก",
      coverImage:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop",
      views: 55000,
      rating: 9.4,
      totalChapters: 189,
      latestChapter: 189,
      latestUpdatedLabel: "วันนี้",
      isNew: true,
      genre: "แอคชั่น",
    },
    {
      id: "m-017",
      slug: "princess-adventure",
      title: "เจ้าหญิงนักผจญภัย",
      description: "เจ้าหญิงที่ไม่อยากอยู่ในวัง",
      coverImage:
        "https://images.unsplash.com/photo-1612480797665-c96d261ae098?q=80&w=400&auto=format&fit=crop",
      views: 48000,
      rating: 9.2,
      totalChapters: 95,
      latestChapter: 95,
      latestUpdatedLabel: "1 วันที่แล้ว",
      genre: "แฟนตาซี",
    },
    {
      id: "m-018",
      slug: "love-potion",
      title: "ยานวดารัก",
      description: "ยานวดาที่ทำให้เกิดความรัก",
      coverImage:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
      views: 42000,
      rating: 8.9,
      totalChapters: 56,
      latestChapter: 56,
      latestUpdatedLabel: "2 วันที่แล้ว",
      genre: "โรแมนติก",
    },
    {
      id: "m-019",
      slug: "funny-party",
      title: "ปาร์ตี้สุดฮา",
      description: "การผจญภัยที่เต็มไปด้วยเสียงหัวเราะ",
      coverImage:
        "https://images.unsplash.com/photo-1541562232579-515a2134cb41?q=80&w=400&auto=format&fit=crop",
      views: 39000,
      rating: 9.0,
      totalChapters: 78,
      latestChapter: 78,
      latestUpdatedLabel: "3 วันที่แล้ว",
      genre: "คอมเมดี้",
    },
    {
      id: "m-020",
      slug: "horror-tale",
      title: "เรื่องเล่าสยอง",
      description: "เรื่องราวสยองขวัญที่คุณไม่ควรอ่านคนเดียว",
      coverImage:
        "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400&auto=format&fit=crop",
      views: 31000,
      rating: 8.6,
      totalChapters: 34,
      latestChapter: 34,
      latestUpdatedLabel: "4 วันที่แล้ว",
      genre: "ระทึกขวัญ",
    },
    {
      id: "m-021",
      slug: "emotional-story",
      title: "เรื่องราวแห่งอารมณ์",
      description: "เรื่องราวที่จะทำให้คุณร้องไห้",
      coverImage:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
      views: 35000,
      rating: 9.1,
      totalChapters: 67,
      latestChapter: 67,
      latestUpdatedLabel: "2 วันที่แล้ว",
      genre: "ดราม่า",
    },
    {
      id: "m-022",
      slug: "school-days",
      title: "วันวานวัยเรียน",
      description: "ชีวิตวัยรุ่นที่โรงเรียน",
      coverImage:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400&auto=format&fit=crop",
      views: 44000,
      rating: 8.8,
      totalChapters: 123,
      latestChapter: 123,
      latestUpdatedLabel: "วันนี้",
      isNew: true,
      genre: "โรงเรียน",
    },
    {
      id: "m-023",
      slug: "epic-fantasy",
      title: "มหากาพย์แฟนตาซี",
      description: "การผจญภัยในโลกแฟนตาซีอันยิ่งใหญ่",
      coverImage:
        "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=400&auto=format&fit=crop",
      views: 51000,
      rating: 9.3,
      totalChapters: 234,
      latestChapter: 234,
      latestUpdatedLabel: "วันนี้",
      isNew: true,
      genre: "แฟนตาซี",
    },
  ],

  genres: [
    "แอคชั่น",
    "แฟนตาซี",
    "โรแมนติก",
    "คอมเมดี้",
    "ระทึกขวัญ",
    "ดราม่า",
    "โรงเรียน",
  ],
};
