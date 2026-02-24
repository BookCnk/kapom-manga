import Link from "next/link";

export default function GenreChips({ genres }: { genres: string[] }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="text-lg tracking-tight font-medium text-foreground mb-4 flex items-center gap-2">
        หมวดหมู่
      </h3>

      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Link
            key={genre}
            href={`/genre/${encodeURIComponent(genre)}`}
            className="px-3 py-1.5 bg-muted border border-border text-muted-foreground text-xs rounded-md hover:border-orange-500 hover:text-orange-600 transition-colors">
            {genre}
          </Link>
        ))}
      </div>
    </div>
  );
}
