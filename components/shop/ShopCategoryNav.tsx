'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  Baby,
  BookOpen,
  Car,
  Dumbbell,
  Heart,
  HeartPulse,
  Home,
  Laptop,
  LayoutGrid,
  Leaf,
  Monitor,
  Package,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkles,
  type LucideProps,
} from 'lucide-react';

type IconCmp = ComponentType<LucideProps>;

const CATEGORY_ICONS: Array<{ match: RegExp; Icon: IconCmp }> = [
  { match: /^for\s*you$/i, Icon: ShoppingBag },
  { match: /apparel|fashion|clothing|wear|shirt/i, Icon: Shirt },
  { match: /mobile|phone/i, Icon: Smartphone },
  { match: /electronic/i, Icon: Laptop },
  { match: /personal\s*care|beauty|cosmetic/i, Icon: Sparkles },
  { match: /appliance|tv|television/i, Icon: Monitor },
  { match: /toy|baby|kids/i, Icon: Baby },
  { match: /food|grocery|kitchen/i, Icon: Package },
  { match: /auto|vehicle|helmet/i, Icon: Car },
  { match: /sport|fitness/i, Icon: Dumbbell },
  { match: /furniture|sofa/i, Icon: Sofa },
  { match: /book/i, Icon: BookOpen },
  { match: /health|medical|pharma/i, Icon: HeartPulse },
  { match: /wellness/i, Icon: Leaf },
  { match: /home/i, Icon: Home },
];

function iconForCategory(name: string): IconCmp {
  if (name === 'All') return LayoutGrid;
  for (const { match, Icon } of CATEGORY_ICONS) {
    if (match.test(name)) return Icon;
  }
  return Heart;
}

type ShopCategoryNavProps = {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
  /** Distance from viewport top where the bar sticks (shop header height). */
  stickyTop?: number;
};

/**
 * Horizontal category strip: icons + labels at rest; collapses to labels-only
 * and stays fixed under the shop header while scrolling.
 */
export function ShopCategoryNav({
  categories,
  activeCategory,
  onSelect,
  stickyTop = 0,
}: ShopCategoryNavProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCompact(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: `-${Math.max(0, stickyTop)}px 0px 0px 0px`,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [stickyTop]);

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />

      <nav
        className={`shop-cat-nav sticky z-30 border-b border-[var(--color-shop-border)] bg-[var(--color-shop-card)] ${
          compact ? 'shop-cat-nav--compact' : ''
        }`}
        style={{ top: stickyTop }}
        aria-label="Product categories"
      >
        <div className="shop-cat-nav__track">
          <div className="shop-cat-nav__row">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              const Icon = iconForCategory(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelect(cat)}
                  className={`shop-cat-nav__item group relative ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'true' : undefined}
                >
                  <span className="shop-cat-nav__icon-wrap" aria-hidden>
                    <span
                      className={`shop-cat-nav__icon-bg inline-flex items-center justify-center rounded-xl ${
                        active ? 'text-[#5B5CE2]' : 'text-[var(--color-shop-text)]'
                      }`}
                    >
                      <Icon className="shop-cat-nav__icon-svg" strokeWidth={1.6} />
                    </span>
                  </span>
                  <span
                    className={`shop-cat-nav__label max-w-full truncate text-center text-[11px] leading-tight sm:text-xs ${
                      active
                        ? 'font-bold text-[var(--color-shop-text)]'
                        : 'font-medium text-[var(--color-shop-muted-text)]'
                    }`}
                  >
                    {cat}
                  </span>
                  <span
                    className={`shop-cat-nav__underline absolute bottom-0 left-1/2 h-[3px] w-[calc(100%-8px)] -translate-x-1/2 rounded-t-sm bg-[#5B5CE2] transition-opacity duration-200 ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
