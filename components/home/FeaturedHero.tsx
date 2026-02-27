"use client";

import Link from "next/link";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
  Star,
  CameraOff,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

export default function FeaturedHero({
  featured,
}: {
  featured: MangaCardType[];
}) {
  const slides = useMemo(() => (featured ?? []).filter(Boolean), [featured]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // drag/swipe
  const trackRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const deltaXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const clampIndex = (i: number) => {
    if (!slides.length) return 0;
    return (i + slides.length) % slides.length;
  };

  const goNext = () => setActiveIndex((c) => clampIndex(c + 1));
  const goPrev = () => setActiveIndex((c) => clampIndex(c - 1));

  // autoplay (ไม่ใส่ activeIndex เพื่อไม่รีเซ็ต interval ทุกครั้ง)
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((c) => clampIndex(c + 1));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]); // ✅

  // keep index valid if slides change
  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  // keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (slides.length <= 1) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slides.length]);

  if (!slides.length) return null;

  const active = slides[activeIndex];

  const viewsText =
    typeof active.views === "number"
      ? `${(active.views / 1000).toFixed(1)}K`
      : "—";
  const ratingText =
    typeof active.rating === "number" ? active.rating.toFixed(1) : "—";

  const setTrackTransformPx = (px: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translateX(calc(-${activeIndex * 100}% + ${px}px))`;
  };

  const setTrackTransition = (enabled: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = enabled ? "transform 700ms ease-out" : "none";
  };

  const endDrag = (commit: boolean) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;

    const dx = deltaXRef.current;
    const threshold = 60;

    // เปิด transition กลับ
    setTrackTransition(true);

    if (commit) {
      if (dx > threshold) goPrev();
      else if (dx < -threshold) goNext();
      // ถ้าไม่ถึง threshold ปล่อยให้มัน snap ด้วย state เดิม
    }

    // ล้างค่า
    pointerIdRef.current = null;
    deltaXRef.current = 0;

    // resume autoplay
    window.setTimeout(() => setPaused(false), 600);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (slides.length <= 1) return;
    if (e.button !== 0) return;

    // ✅ ถ้าคลิกบนปุ่ม/ลิงก์/องค์ประกอบที่กดได้ -> ไม่เริ่ม drag
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(
      "button, a, input, textarea, select, [role='button']",
    );
    if (isInteractive) return;

    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    deltaXRef.current = 0;
    isDraggingRef.current = true;

    setPaused(true);
    containerRef.current?.setPointerCapture(e.pointerId);
    setTrackTransition(false);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    if (pointerIdRef.current !== e.pointerId) return;

    const dx = e.clientX - startXRef.current;
    deltaXRef.current = dx;

    // ลากตามนิ้ว
    setTrackTransformPx(dx);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    endDrag(true);
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    endDrag(false);
  };

  const onPointerLeave = () => {
    // เผื่อเมาส์หลุดออกนอกกรอบ
    endDrag(true);
  };

  return (
    <section>
      <div
        ref={containerRef}
        className="relative w-full h-[380px] sm:h-[480px] rounded-3xl overflow-hidden group shadow-lg border border-border bg-card select-none"
        style={{ touchAction: "pan-y" }} // ✅ สำคัญสุด: ให้ลากแนวนอนได้
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}>
        {/* Track */}
        <div
          ref={trackRef}
          className="absolute inset-0 flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {slides.map((slide, index) => {
            const hasError = imageErrors.has(index) || !slide.coverImage || (typeof slide.coverImage === 'string' && slide.coverImage.trim() === '');
            return (
              <div
                key={slide.id}
                className="relative min-w-full h-full bg-muted"
                draggable={false}
                onDragStart={(ev) => ev.preventDefault()}>
                {hasError ? (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-muted/80 text-muted-foreground select-none">
                    <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center mb-2 relative">
                      <CameraOff className="w-8 h-8" />
                      <div className="absolute inset-0 rounded-full border border-border/70 border-dashed" />
                    </div>
                    <span className="text-sm tracking-tight">No Image</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.coverImage}
                    alt={slide.title}
                    className="h-full w-full object-cover scale-[1.02] group-hover:scale-[1.07] transition-transform duration-700 ease-out"
                    draggable={false}
                    onError={() => setImageErrors((prev) => new Set(prev).add(index))}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/45 to-black/10" />
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full lg:w-4/5 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 mb-4 pointer-events-auto">
            {active.tags?.[0] ? (
              <span className="bg-orange-500 text-white text-xs px-2.5 py-1 rounded-md font-medium shadow-sm shadow-orange-500/40">
                {active.tags[0]}
              </span>
            ) : null}

            {active.genre ? (
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md font-medium">
                {active.genre}
              </span>
            ) : null}

            <span className="bg-white/10 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {viewsText}
            </span>

            <span className="bg-white/10 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              {ratingText}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-5xl text-white font-semibold tracking-tight mb-3 text-balance pointer-events-auto">
            {active.title}
          </h1>

          <p className="text-neutral-200 text-sm sm:text-base line-clamp-2 mb-6 max-w-2xl font-light pointer-events-auto">
            {active.description}
          </p>

          <div className="flex items-center gap-3 pointer-events-auto">
            <Link
              href={`/comic/${active.slug}`}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 shadow-md shadow-orange-500/30">
              <Play className="w-[18px] h-[18px]" strokeWidth={1.5} />
              อ่านตอนแรก
            </Link>

            <button
              type="button"
              aria-label="Bookmark"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm p-2.5 rounded-full transition-colors">
              <Bookmark className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Controls */}
        {slides.length > 1 ? (
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeIndex
                      ? "w-6 bg-orange-500"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
