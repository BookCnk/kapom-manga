export type ContentTypeOption = {
  value: string;
  label: string;
  // path ไปยังรูปธงชาติของเรา (เก็บไฟล์เอง เช่น ใน S3 หรือ /public)
  iconUrl: string;
};

// ประเภทเนื้อหา + ประเทศ สำหรับแสดงในฟอร์ม และเก็บเป็น string ลง DB
// หมายเหตุ: ปัจจุบัน DB เก็บแค่ value (เช่น "jp-manga")
// ส่วน iconUrl เป็น mapping ฝั่งโค้ด ใช้เวลาแสดงผล
export const contentTypeOptions: ContentTypeOption[] = [
  {
    value: "jp-manga",
    label: "ญี่ปุ่น - มังงะ",
    iconUrl: "/flags/jp.svg",
  },
  {
    value: "kr-manhwa",
    label: "เกาหลี - มังฮวา",
    iconUrl: "/flags/kr.svg",
  },
  {
    value: "cn-manhua",
    label: "จีน - มังฮัว",
    iconUrl: "/flags/cn.svg",
  },
  {
    value: "th-comic",
    label: "ภาษาไทย",
    iconUrl: "/flags/th.svg",
  },
  {
    value: "en-comic",
    label: "อังกฤษ - คอมมิค",
    iconUrl: "/flags/gb.svg",
  },
] as const;

export type ContentTypeValue = (typeof contentTypeOptions)[number]["value"];

export const contentTypeValues: ContentTypeValue[] = contentTypeOptions.map(
  (opt) => opt.value,
) as ContentTypeValue[];

