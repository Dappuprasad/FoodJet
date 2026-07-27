import { Injectable, NotFoundException } from '@nestjs/common';
import type { MenuItem as PrismaMenuItem, Prisma } from '@prisma/client';
import type { MenuItem, MenuResponse } from '@foodjet/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import type { MenuQueryDto } from './dto/menu-query.dto';
import { slugify, toMenuItem } from './menu.mapper';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the filtered dishes plus the full category list. Categories are read
   * unfiltered on purpose — deriving them from the filtered rows would make the
   * category pills disappear as soon as a search narrowed the results.
   */
  async list(query: MenuQueryDto, includeUnavailable = false): Promise<MenuResponse> {
    const where: Prisma.MenuItemWhereInput = {
      ...(includeUnavailable ? {} : { isAvailable: true }),
      ...(query.category ? { category: query.category } : {}),
      ...(query.vegetarianOnly ? { isVegetarian: true } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, categoryRows] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.menuItem.findMany({
        where: includeUnavailable ? {} : { isAvailable: true },
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
    ]);

    return {
      items: items.map(toMenuItem),
      categories: categoryRows.map((row) => row.category),
    };
  }

  async findOne(idOrSlug: string): Promise<MenuItem> {
    return toMenuItem(await this.findRecordOrFail(idOrSlug));
  }

  async create(dto: CreateMenuItemDto): Promise<MenuItem> {
    const slug = await this.uniqueSlug(slugify(dto.name));

    const created = await this.prisma.menuItem.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        pricePaise: dto.pricePaise,
        imageUrl: dto.imageUrl,
        category: dto.category,
        isVegetarian: dto.isVegetarian,
        spiceLevel: dto.spiceLevel,
        preparationMinutes: dto.preparationMinutes,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    return toMenuItem(created);
  }

  async update(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    await this.findRecordOrFail(id);

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.pricePaise !== undefined ? { pricePaise: dto.pricePaise } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.isVegetarian !== undefined ? { isVegetarian: dto.isVegetarian } : {}),
        ...(dto.spiceLevel !== undefined ? { spiceLevel: dto.spiceLevel } : {}),
        ...(dto.preparationMinutes !== undefined
          ? { preparationMinutes: dto.preparationMinutes }
          : {}),
        ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
      },
    });

    return toMenuItem(updated);
  }

  /**
   * Delisting rather than deleting. Historic order lines reference the dish, and
   * a hard delete would leave past receipts pointing at nothing.
   */
  async delist(id: string): Promise<MenuItem> {
    await this.findRecordOrFail(id);

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });

    return toMenuItem(updated);
  }

  /** Loads the priced rows for a set of ids, keyed for O(1) lookup at checkout. */
  async findAvailableByIds(ids: string[]): Promise<Map<string, PrismaMenuItem>> {
    const records = await this.prisma.menuItem.findMany({
      where: { id: { in: ids }, isAvailable: true },
    });

    return new Map(records.map((record) => [record.id, record]));
  }

  /**
   * Accepts either a UUID or a slug. The id branch is only added when the input
   * actually looks like a UUID — an `{ id: undefined }` clause inside a Prisma
   * `OR` collapses to "match anything" and would return an arbitrary dish.
   */
  private async findRecordOrFail(idOrSlug: string): Promise<PrismaMenuItem> {
    const or: Prisma.MenuItemWhereInput[] = [{ slug: idOrSlug }];
    if (isUuid(idOrSlug)) or.push({ id: idOrSlug });

    const record = await this.prisma.menuItem.findFirst({ where: { OR: or } });

    if (!record) throw new NotFoundException('Menu item not found');
    return record;
  }

  private async uniqueSlug(base: string): Promise<string> {
    const seed = base || 'dish';
    let candidate = seed;
    let suffix = 2;

    while (await this.prisma.menuItem.findUnique({ where: { slug: candidate } })) {
      candidate = `${seed}-${suffix++}`;
    }

    return candidate;
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
