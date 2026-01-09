import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface QuickAccessCard {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  color: string; // Tailwind gradient classes like "from-pink-500 to-rose-600"
  badge?: string | number;
  onClick: () => void;
}

interface QuickAccessCardsProps {
  cards: QuickAccessCard[];
  variant?: 'grid' | 'horizontal' | 'list';
  columns?: 2 | 3 | 4;
}

export default function QuickAccessCards({
  cards,
  variant = 'grid',
  columns = 2,
}: QuickAccessCardsProps) {
  if (variant === 'horizontal') {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md active:scale-95 transition min-w-[140px]"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-3`}>
              <card.icon size={20} />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 text-left">
              {card.title}
            </h3>
            {card.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left line-clamp-2">
                {card.description}
              </p>
            )}
            {card.badge && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-full">
                {card.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md active:scale-[0.98] transition"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white flex-shrink-0`}>
              <card.icon size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {card.title}
              </h3>
              {card.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                  {card.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {card.badge && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-full">
                  {card.badge}
                </span>
              )}
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Default grid variant
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={card.onClick}
          className="relative bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md active:scale-95 transition text-left"
        >
          {card.badge && (
            <span className="absolute top-3 right-3 px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs font-bold rounded-full">
              {card.badge}
            </span>
          )}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-3`}>
            <card.icon size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100">
            {card.title}
          </h3>
          {card.description && (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {card.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

// Featured card with full-width image background
interface FeaturedCardProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
  badge?: string;
  onClick: () => void;
}

export function FeaturedCard({
  title,
  subtitle,
  imageUrl,
  badge,
  onClick,
}: FeaturedCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-full h-40 md:h-48 rounded-xl overflow-hidden shadow-md hover:shadow-lg active:scale-[0.98] transition"
    >
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
        {badge && (
          <span className="inline-block px-2 py-0.5 bg-oaxaca-yellow text-gray-900 text-xs font-bold rounded-full mb-2">
            {badge}
          </span>
        )}
        <h3 className="font-bold text-xl text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-white/80 mt-1">{subtitle}</p>
        )}
      </div>
    </button>
  );
}

// Compact pill-shaped cards for categories
interface PillCardProps {
  items: Array<{
    id: string;
    label: string;
    icon?: LucideIcon;
    active?: boolean;
    onClick: () => void;
  }>;
}

export function PillCards({ items }: PillCardProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${
            item.active
              ? 'bg-oaxaca-pink text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {item.icon && <item.icon size={16} />}
          <span className="text-sm font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
