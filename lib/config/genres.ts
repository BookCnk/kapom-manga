export type Genre = {
  slug: string;
  name: string;
  type: "main" | "sub";
};

export const mainGenres: Genre[] = [
  { slug: "romance", name: "รักโรแมนติก", type: "main" },
  { slug: "drama", name: "ดราม่า", type: "main" },
  { slug: "comedy", name: "ตลก,คอมเมดี้", type: "main" },
  { slug: "fantasy", name: "แฟนตาซี", type: "main" },
  { slug: "online-game", name: "เกมออนไลน์", type: "main" },
  { slug: "martial-arts", name: "กำลังภายใน", type: "main" },
  { slug: "action", name: "แอคชั่น", type: "main" },
  { slug: "adventure", name: "ผจญภัย", type: "main" },
  { slug: "past-future", name: "อดีต,อนาคต", type: "main" },
  { slug: "ancient-retro", name: "โบราณ,ย้อนยุค", type: "main" },
  { slug: "sci-fi", name: "ไซไฟ,วิทยาศาสตร์", type: "main" },
  { slug: "thriller", name: "ระทึกขวัญ", type: "main" },
  { slug: "investigation", name: "สืบสวน", type: "main" },
  { slug: "slice-of-life", name: "สะท้อนชีวิต", type: "main" },
  { slug: "fan-fiction", name: "แฟนฟิค", type: "main" },
  { slug: "yaoi", name: "วาย", type: "main" },
  { slug: "yuri", name: "ยูริ", type: "main" },
  { slug: "harem", name: "ฮาเร็ม", type: "main" },
  { slug: "another-world", name: "ต่างโลก", type: "main" },
];

export const subGenres: Genre[] = [
  { slug: "school-life", name: "ชีวิตในโรงเรียน", type: "sub" },
  { slug: "reincarnation", name: "เกิดใหม่", type: "sub" },
  { slug: "system", name: "ระบบ", type: "sub" },
  { slug: "superpower", name: "พลังวิเศษ", type: "sub" },
  { slug: "pet", name: "สัตว์เลี้ยง", type: "sub" },
  { slug: "monster", name: "สัตว์ประหลาด", type: "sub" },
  { slug: "detective", name: "นักสืบ", type: "sub" },
  { slug: "crime", name: "อาชญากรรม", type: "sub" },
  { slug: "sports", name: "กีฬา", type: "sub" },
  { slug: "music", name: "ดนตรี", type: "sub" },
  { slug: "art", name: "ศิลปะ", type: "sub" },
  { slug: "cooking", name: "การทำอาหาร", type: "sub" },
  { slug: "medical", name: "การแพทย์", type: "sub" },
  { slug: "military", name: "ทหาร", type: "sub" },
  { slug: "police", name: "ตำรวจ", type: "sub" },
  { slug: "pilot", name: "นักบิน", type: "sub" },
  { slug: "actor", name: "นักแสดง", type: "sub" },
  { slug: "idol", name: "ไอดอล", type: "sub" },
  { slug: "singer", name: "นักร้อง", type: "sub" },
  { slug: "writer", name: "นักเขียน", type: "sub" },
  { slug: "artist", name: "นักวาด", type: "sub" },
  { slug: "translator", name: "นักแปล", type: "sub" },
  { slug: "businessman", name: "นักธุรกิจ", type: "sub" },
  { slug: "politician", name: "นักการเมือง", type: "sub" },
  { slug: "scientist", name: "นักวิทยาศาสตร์", type: "sub" },
  { slug: "inventor", name: "นักประดิษฐ์", type: "sub" },
  { slug: "gamer", name: "นักเล่นเกม", type: "sub" },
  { slug: "streamer", name: "นักสตรีม", type: "sub" },
  { slug: "athlete", name: "นักกีฬา", type: "sub" },
  { slug: "fighter", name: "นักต่อสู้", type: "sub" },
];

export const allGenres: Genre[] = [...mainGenres, ...subGenres];

export function getGenreBySlug(slug: string): Genre | undefined {
  return allGenres.find((genre) => genre.slug === slug);
}
