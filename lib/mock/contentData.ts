// lib/mock/contentData.ts
export type Episode = {
  id: string;
  number: number;
  title: string;
  thumbnail: string;
  date: string;
  price: number | "Free";
  isLocked: boolean;
};

export type ContentDetail = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  type: string;
  genre: string;
  updateSchedule: string;
  author: string;
  description: string;
  tags: string[];
  episodes: Episode[];
  bulkDiscount?: {
    percent: number;
    minEpisodes: number;
  };
};

export const contentData: Record<string, ContentDetail> = {
  "lying-puppies": {
    id: "c-001",
    slug: "lying-puppies",
    title: "Lying Puppies Get Eaten",
    coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
    type: "Comic",
    genre: "BL",
    updateSchedule: "Every Tue",
    author: "Px",
    description:
      "Rio is a transfer student at a high school full of carnivores. Knowing how dangerous carnivores can be, Rio's older brother advises him to lie about being a wolf when he's actually a small dog. Even though Rio knows it's dangerous, he can't help but be drawn to his classmate, the gentle and kind herbivore Eungi...",
    tags: [
      "Modern",
      "Animal hybrid",
      "Omegaverse",
      "School",
      "Student",
      "Hidden Identity",
      "Friends to lovers",
    ],
    bulkDiscount: {
      percent: 10,
      minEpisodes: 20,
    },
    episodes: [
      {
        id: "ep-001",
        number: 1,
        title: "Episode 1",
        thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop",
        date: "Jul 15, 2025",
        price: "Free",
        isLocked: false,
      },
      {
        id: "ep-002",
        number: 2,
        title: "Episode 2",
        thumbnail: "https://images.unsplash.com/photo-1612480797665-c96d261ae098?q=80&w=200&auto=format&fit=crop",
        date: "Jul 15, 2025",
        price: 300,
        isLocked: true,
      },
      {
        id: "ep-003",
        number: 3,
        title: "Episode 3",
        thumbnail: "https://images.unsplash.com/photo-1541562232579-515a2134cb41?q=80&w=200&auto=format&fit=crop",
        date: "Jul 15, 2025",
        price: 300,
        isLocked: true,
      },
      {
        id: "ep-004",
        number: 4,
        title: "Episode 4",
        thumbnail: "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=200&auto=format&fit=crop",
        date: "Jul 15, 2025",
        price: 300,
        isLocked: true,
      },
      {
        id: "ep-005",
        number: 5,
        title: "Episode 5",
        thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop",
        date: "Jul 15, 2025",
        price: 300,
        isLocked: true,
      },
      {
        id: "ep-006",
        number: 6,
        title: "Episode 6",
        thumbnail: "https://images.unsplash.com/photo-1618519764611-bd220fc59c5d?q=80&w=200&auto=format&fit=crop",
        date: "Jul 15, 2025",
        price: 300,
        isLocked: true,
      },
      {
        id: "ep-007",
        number: 7,
        title: "Episode 7",
        thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=200&auto=format&fit=crop",
        date: "Jul 15, 2025",
        price: 300,
        isLocked: true,
      },
    ],
  },
};
