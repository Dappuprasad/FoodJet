import type { MenuItem as PrismaMenuItem } from '@prisma/client';
import type { MenuItem } from '@foodjet/shared';

export function toMenuItem(record: PrismaMenuItem): MenuItem {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    pricePaise: record.pricePaise,
    imageUrl: record.imageUrl,
    category: record.category,
    isVegetarian: record.isVegetarian,
    spiceLevel: record.spiceLevel,
    preparationMinutes: record.preparationMinutes,
    rating: record.rating,
    ratingCount: record.ratingCount,
    isAvailable: record.isAvailable,
  };
}

/** URL-safe slug used as the stable public identifier for a dish. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
