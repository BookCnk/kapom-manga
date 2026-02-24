// lib/mock/reviewData.ts
export type Review = {
  id: string;
  contentKey: string; // key ของเรื่อง เช่น "lying-puppies"
  userName: string;
  avatarUrl: string;
  createdAt: string;
  text: string;
  likes: number;
};

// mock data สำหรับตัวอย่าง
export const reviewData: Review[] = [
  {
    id: "r-001",
    contentKey: "lying-puppies",
    userName: "Yuuki Kun",
    avatarUrl:
      "https://images.unsplash.com/photo-1525130413817-d45c1d127c42?w=80&h=80&auto=format&fit=crop",
    createdAt: "2025-02-20T14:30:00.000Z",
    text: "รอติดตามตอนต่อไป เรื่องสนุกมากครับ เป็นกำลังใจในการแปลนะครับ!",
    likes: 20,
  },
  {
    id: "r-002",
    contentKey: "lying-puppies",
    userName: "แพนด้า",
    avatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&auto=format&fit=crop",
    createdAt: "2025-02-18T10:15:00.000Z",
    text: "สนุกมากกกกกกกกก",
    likes: 10,
  },
  {
    id: "r-003",
    contentKey: "lying-puppies",
    userName: "Reader 3",
    avatarUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=80&h=80&auto=format&fit=crop",
    createdAt: "2026-02-01T09:00:00.000Z",
    text: "วาดสวย เนื้อเรื่องน่าติดตาม",
    likes: 7,
  },
  {
    id: "r-004",
    contentKey: "lying-puppies",
    userName: "Reader 4",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&auto=format&fit=crop",
    createdAt: "2025-02-05T08:00:00.000Z",
    text: "ภาษาลื่นดี อ่านแล้วเพลิน",
    likes: 3,
  },{
    id: "r-005",
    contentKey: "lying-puppies",
    userName: "Reader 5",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&auto=format&fit=crop",
    createdAt: "2026-02-05T08:00:00.000Z",
    text: "ภาษาลื่นดี อ่านแล้วเพลิน",
    likes: 322,
  },
];

// ดึงรีวิวตามเรื่อง (ยังไม่จัดเรียง ปล่อยให้ UI เป็นคนจัด)
export function getReviewsByContent(contentKey: string): Review[] {
  return reviewData.filter((r) => r.contentKey === contentKey);
}

