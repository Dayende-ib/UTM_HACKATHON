"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wrench,
  Scissors,
  Hammer,
  Flame,
  Zap,
  Droplets,
  Smartphone,
  Snowflake,
  PaintBucket,
  Leaf,
  Construction,
  Camera,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { categorieService } from "@/services/categorie.service";
import type { Categorie } from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Scissors,
  Hammer,
  Flame,
  Zap,
  Droplets,
  Smartphone,
  Snowflake,
  PaintBucket,
  Leaf,
  Construction,
  Camera,
  UtensilsCrossed,
};

function getCategoryIcon(iconName: string) {
  return ICON_MAP[iconName] ?? Wrench;
}

interface CategoryFilterProps {
  value: string | null;
  onChange: (categorieId: string | null) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);

  useEffect(() => {
    categorieService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const handleSelect = (cat: Categorie) => {
    onChange(value === cat.id ? null : cat.id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-md bg-white p-1.5 border border-stone-300 hover:bg-stone-50 transition-colors"
        aria-label="Défiler à gauche"
      >
        <ChevronLeft className="h-4 w-4 text-stone-600" />
      </button>

      <div ref={scrollRef} className="no-scrollbar flex gap-2 overflow-x-auto px-8 py-1">
        <button
          onClick={() => onChange(null)}
          className={[
            "flex shrink-0 items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
            value === null
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:border-stone-900",
          ].join(" ")}
        >
          Tous
        </button>

        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icone);
          const isActive = value === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat)}
              className={[
                "flex shrink-0 items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-900",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {cat.nom}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-md bg-white p-1.5 border border-stone-300 hover:bg-stone-50 transition-colors"
        aria-label="Défiler à droite"
      >
        <ChevronRight className="h-4 w-4 text-stone-600" />
      </button>
    </div>
  );
}
