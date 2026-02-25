// lib/mock/writerStats.ts
export type MangaStats = {
  stories: number;
  episodes: number;
  views: number;
  likes: number;
  bookmarks: number;
  comments: number;
  totalSales: number;
};

export type NovelStats = {
  stories: number;
  episodes: number;
  views: number;
  likes: number;
  bookmarks: number;
  comments: number;
  totalSales: number;
};

export type RevenueData = {
  dailySales: Record<number, number>;
  totalSalesThisMonth: number;
  totalSalesAllTime: number;
};

// Mock data for testing
export const mockMangaStats: MangaStats = {
  stories: 12,
  episodes: 152,
  views: 186400,
  likes: 1200,
  bookmarks: 2000,
  comments: 281,
  totalSales: 132000,
};

export const mockNovelStats: NovelStats = {
  stories: 0,
  episodes: 0,
  views: 0,
  likes: 0,
  bookmarks: 0,
  comments: 0,
  totalSales: 0,
};

// Generate mock daily sales data with realistic patterns
export const generateMockDailySales = (month: number, year: number): Record<number, number> => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const sales: Record<number, number> = {};

  // Mock data based on the image description for February
  const februaryMockData = [
    850, 1519.7, 650, 450, 0, 200, 200, 250, 150, 1100, 500, 200, 200, 300, 700, 1000, 500, 300,
    300, 200, 300, 1250, 1150, 300, 0, 0, 0, 0,
  ];

  // Base sales pattern for other months
  const baseSales = 200;
  const weekendMultiplier = 1.5; // Weekends have higher sales

  for (let day = 1; day <= daysInMonth; day++) {
    if (month === 2 && day <= februaryMockData.length) {
      // Use specific February data
      sales[day] = februaryMockData[day - 1] || 0;
    } else {
      // Generate realistic sales for other months
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Base sales with some randomness
      let dailySales = baseSales + Math.random() * 800;
      
      // Weekend boost
      if (isWeekend) {
        dailySales *= weekendMultiplier;
      }
      
      // Some days have spikes (like new chapter releases)
      if (day % 7 === 0 || day % 10 === 0) {
        dailySales *= 1.5 + Math.random() * 0.5;
      }
      
      // Some days have low sales
      if (day % 15 === 0) {
        dailySales *= 0.3;
      }
      
      sales[day] = Math.round(dailySales * 100) / 100; // Round to 2 decimals
    }
  }

  return sales;
};

export const getMockRevenueData = (
  month: number,
  year: number,
): RevenueData => {
  const dailySales = generateMockDailySales(month, year);
  const totalSalesThisMonth = Object.values(dailySales).reduce(
    (sum, val) => sum + val,
    0,
  );

  return {
    dailySales,
    totalSalesThisMonth: 13267.30,
    totalSalesAllTime: 132043.20,
  };
};
