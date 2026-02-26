import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="w-full"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div></div>}>
      <SearchPageClient />
    </Suspense>
  );
}

