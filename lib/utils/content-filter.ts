// Utility for checking inappropriate / 18+ / SEO-unsafe words in text
// This is used to STRICTLY block certain words in titles, descriptions, etc.

export type ContentCheckResult = {
  isInappropriate: boolean;
  matchedWords: string[];
};

// คำต้องห้าม (ไทย + อังกฤษ) ที่เกี่ยวกับ porn / 18+ / ผิดกฏ SEO
// หมายเหตุ: ไม่ครบทุกคำบนโลก แต่ครอบคลุมคำหลักที่ Search Engine ใช้ตรวจเว็บลามก
const seoProhibitedWords: string[] = [
  // English core porn terms
  "xxx",
  "porn",
  "porno",
  "pornhub",
  "xvideos",
  "xnxx",
  "xhamster",
  "redtube",
  "sex",
  "hardcore",
  "hentai",
  "ecchi",
  "jav",
  "fetish",
  "bdsm",
  "erotic",
  "adult video",
  "adult dvd",
  "onlyfans",
  "camgirl",
  "cam boy",
  "nude",
  "nudes",
  "strip club",

  // English explicit actions
  "blowjob",
  "handjob",
  "boobjob",
  "rimjob",
  "gangbang",
  "creampie",
  "cumshot",
  "facial",
  "anal",
  "deepthroat",
  "fuck",
  "fucked",
  "fucking",
  "suck dick",
  "sucking dick",
  "hand job",
  "blow job",
  "doggy style",
  "doggystyle",

  // English explicit body / fetish
  "big boobs",
  "big tits",
  "tits",
  "boobs",
  "milf",
  "teen porn",
  "loli",
  "lolicon",

  // Thai porn keywords
  "หนังโป๊",
  "การ์ตูนโป๊",
  "มังงะโป๊",
  "โดจินโป๊",
  "โป๊",
  "โป้",
  "av ญี่ปุ่น",
  "avญี่ปุ่น",
  "av ไทย",
  "avไทย",
  "คลิปโป๊",
  "คลิปหลุด",
  "คลิปลับ",
  "เสียว",
  "รูปโป๊",
  "รูปหลุด",
  "เว็บโป๊",
  "เว็บโป้",
  "ดูหนังโป๊",
  "ดูคลิปโป๊",

  // Thai explicit actions
  "เย็ด",
  "เอากัน",
  "ข่มขืน",
  "เซ็กส์จัด",
  "เซ็กจัด",
  "สวิงกิ้ง",
  "รุมโทรม",
  "อมควย",
  "เลียหี",
  "แตกใน",
  "โชว์นม",
  "โชว์หี",

  // Thai explicit body / fetish
  "นมใหญ่",
  "นมโต",
  "หีกระปู๋", // รวมคำหยาบแบบติดกัน
  "หี",
  "ควย",
  "จิ๋ม",
  "ตูด",
  "ก้นเด้ง",
  "กกนเปียก",
  "กางเกงในเปียก",
];

function normalize(text: string): string {
  return text.toLowerCase();
}

// ตรวจสอบข้อความว่ามีคำต้องห้ามหรือไม่
export function checkInappropriateContent(text: string | null | undefined): ContentCheckResult {
  if (!text) {
    return { isInappropriate: false, matchedWords: [] };
  }

  const normalized = normalize(text);
  const matched = new Set<string>();

  for (const word of seoProhibitedWords) {
    const w = word.toLowerCase();

    // แยกเงื่อนไขไทย / อังกฤษ แบบง่าย ๆ
    const isEnglish = /[a-z]/i.test(w);

    if (isEnglish) {
      // ใช้ word boundary สำหรับภาษาอังกฤษ เพื่อลด false positive
      // เช่น "sex" ไม่ไป match "sexample"
      const pattern = new RegExp(`\\b${escapeRegex(w)}\\b`, "i");
      if (pattern.test(text)) {
        matched.add(word);
      }
    } else {
      // ภาษาไทยใช้การค้นหาแบบ contains ตรง ๆ
      if (normalized.includes(w)) {
        matched.add(word);
      }
    }
  }

  return {
    isInappropriate: matched.size > 0,
    matchedWords: Array.from(matched),
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

