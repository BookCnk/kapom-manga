export type Genre = {
  slug: string;
  name: string;
  type: "main" | "sub";
};

// ใช้รายการกลางตัวเดียวกันสำหรับทั้ง main และ sub
const baseGenres: Array<Omit<Genre, "type">> = [
  // main เดิม
  { slug: "romance", name: "รักโรแมนติก" },
  { slug: "drama", name: "ดราม่า" },
  { slug: "comedy", name: "ตลก,คอมเมดี้" },
  { slug: "fantasy", name: "แฟนตาซี" },
  { slug: "online-game", name: "เกมออนไลน์" },
  { slug: "martial-arts", name: "กำลังภายใน" },
  { slug: "action", name: "แอคชั่น" },
  { slug: "adventure", name: "ผจญภัย" },
  { slug: "past-future", name: "อดีต,อนาคต" },
  { slug: "ancient-retro", name: "โบราณ,ย้อนยุค" },
  { slug: "sci-fi", name: "ไซไฟ,วิทยาศาสตร์" },
  { slug: "thriller", name: "ระทึกขวัญ" },
  { slug: "investigation", name: "สืบสวน" },
  { slug: "slice-of-life", name: "สะท้อนชีวิต" },
  { slug: "fan-fiction", name: "แฟนฟิค" },
  { slug: "yaoi", name: "วาย" },
  { slug: "yuri", name: "ยูริ" },
  { slug: "harem", name: "ฮาเร็ม" },
  { slug: "another-world", name: "ต่างโลก" },

  // sub เดิม
  { slug: "school-life", name: "ชีวิตในโรงเรียน" },
  { slug: "reincarnation", name: "เกิดใหม่" },
  { slug: "system", name: "ระบบ" },
  { slug: "superpower", name: "พลังวิเศษ" },
  { slug: "pet", name: "สัตว์เลี้ยง" },
  { slug: "monster", name: "สัตว์ประหลาด" },
  { slug: "detective", name: "นักสืบ" },
  { slug: "crime", name: "อาชญากรรม" },
  { slug: "sports", name: "กีฬา" },
  { slug: "music", name: "ดนตรี" },
  { slug: "art", name: "ศิลปะ" },
  { slug: "cooking", name: "การทำอาหาร" },
  { slug: "medical", name: "การแพทย์" },
  { slug: "military", name: "ทหาร" },
  { slug: "police", name: "ตำรวจ" },
  { slug: "pilot", name: "นักบิน" },
  { slug: "actor", name: "นักแสดง" },
  { slug: "idol", name: "ไอดอล" },
  { slug: "singer", name: "นักร้อง" },
  { slug: "writer", name: "นักเขียน" },
  { slug: "artist", name: "นักวาด" },
  { slug: "translator", name: "นักแปล" },
  { slug: "businessman", name: "นักธุรกิจ" },
  { slug: "politician", name: "นักการเมือง" },
  { slug: "scientist", name: "นักวิทยาศาสตร์" },
  { slug: "inventor", name: "นักประดิษฐ์" },
  { slug: "gamer", name: "นักเล่นเกม" },
  { slug: "streamer", name: "นักสตรีม" },
  { slug: "athlete", name: "นักกีฬา" },
  { slug: "fighter", name: "นักต่อสู้" },

  // หมวด 18+ / แท็กยอดฮิต
  { slug: "adult-18", name: "18+" },
  { slug: "adult", name: "Adult ผู้ใหญ่" },
  { slug: "ecchi", name: "Ecchi ลามก" },
  { slug: "smut", name: "Smut แฟนฟิค" },
  { slug: "doujin", name: "Doujin โดจิน" },
  { slug: "ntr", name: "NTR" },
];

export const mainGenres: Genre[] = baseGenres.map((g) => ({
  ...g,
  type: "main",
}));

export const subGenres: Genre[] = baseGenres.map((g) => ({
  ...g,
  type: "sub",
}));

export const allGenres: Genre[] = [...mainGenres, ...subGenres];

export function getGenreBySlug(slug: string): Genre | undefined {
  return allGenres.find((genre) => genre.slug === slug);
}
