import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Text - Large brush stroke style */}
        <h1 
          className="text-[140px] md:text-[200px] lg:text-[240px] font-bold text-orange-500 mb-8 leading-none"
          style={{
            fontFamily: "'Brush Script MT', 'Brush Script', 'Comic Sans MS', cursive, sans-serif",
            textShadow: "0 0 30px rgba(249, 115, 22, 0.4), 0 0 60px rgba(249, 115, 22, 0.2)",
            letterSpacing: "-0.02em",
          }}>
          404
        </h1>

        {/* Error Messages */}
        <div className="space-y-3 mb-10">
          <p className="text-orange-500 text-xl md:text-2xl font-medium">
            ไม่พบหน้าที่ต้องการ
          </p>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
            เกิดข้อผิดพลาดบางอย่าง ขออภัยในความไม่สะดวก
          </p>
        </div>

        {/* Home Button */}
        <Link
          href="/"
          className="inline-block px-8 py-3.5 bg-orange-500 text-white rounded-lg font-semibold text-base hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
