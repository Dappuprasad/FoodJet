import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { MenuItem, MenuResponse } from '@foodjet/shared';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import { MenuService } from './menu.service';

@ApiTags('menu')
@Controller({ path: 'menu', version: '1' })
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse the menu with optional filters' })
  list(@Query() query: MenuQueryDto): Promise<MenuResponse> {
    return this.menu.list(query);
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Fetch a single dish by id or slug' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  findOne(@Param('idOrSlug') idOrSlug: string): Promise<MenuItem> {
    return this.menu.findOne(idOrSlug);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@UseGuards(RolesGuard)
@Controller({ path: 'admin/menu', version: '1' })
export class AdminMenuController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'List every dish, including delisted ones' })
  list(@Query() query: MenuQueryDto): Promise<MenuResponse> {
    return this.menu.list(query, true);
  }

  @Post()
  @ApiOperation({ summary: 'Add a dish to the menu' })
  create(@Body() dto: CreateMenuItemDto): Promise<MenuItem> {
    return this.menu.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dish' })
  update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto): Promise<MenuItem> {
    return this.menu.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delist a dish',
    description:
      'Marks the dish unavailable rather than deleting it, so historic orders keep their line items.',
  })
  delist(@Param('id') id: string): Promise<MenuItem> {
    return this.menu.delist(id);
  }
}
