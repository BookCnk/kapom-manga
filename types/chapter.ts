export type ChapterPreview = {
  number: number;
  title: string;
  folderName: string;
  pageCount: number;
  price: number;
  status: 'published' | 'draft';
  files: File[];
  thumbnail?: string;
  edited: boolean;
};
