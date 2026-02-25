export const UserRole = {
  USER: "USER",
  TRANSLATOR: "TRANSLATOR",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MangaStatus = {
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  HIATUS: "HIATUS",
} as const;

export type MangaStatus = (typeof MangaStatus)[keyof typeof MangaStatus];

export const Visibility = {
  PUBLIC: "PUBLIC",
  UNLISTED: "UNLISTED",
  PRIVATE: "PRIVATE",
} as const;

export type Visibility = (typeof Visibility)[keyof typeof Visibility];

