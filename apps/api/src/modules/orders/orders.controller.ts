import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Order, Paginated } from '@foodjet/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Place an order',
    description:
      'Accepts menu item ids and quantities only. All prices and totals are ' +
      'recomputed server-side from the current menu — client totals are ignored.',
  })
  @ApiResponse({ status: 201, description: 'Order placed' })
  @ApiResponse({ status: 422, description: 'A dish in the cart is unavailable' })
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.create(dto, user);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Order history for the signed-in customer' })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrderQueryDto,
  ): Promise<Paginated<Order>> {
    return this.orders.findForUser(user.id, query);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('reference/:reference')
  @ApiOperation({ summary: 'Look up an order by its printed reference' })
  findByReference(
    @Param('reference') reference: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.findByReference(reference, user);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Fetch an order',
    description:
      'Guest orders are readable by anyone holding the id, which is what makes a ' +
      'tracking link work without an account. Orders attached to an account are ' +
      'restricted to their owner and to admins.',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.findById(id, user);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an order that has not left the kitchen' })
  @ApiResponse({ status: 409, description: 'Order is too far along to cancel' })
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Order> {
    return this.orders.cancel(id, user);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@UseGuards(RolesGuard)
@Controller({ path: 'admin/orders', version: '1' })
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List every order, newest first' })
  findAll(@Query() query: OrderQueryDto): Promise<Paginated<Order>> {
    return this.orders.findAll(query);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Move an order to a new status',
    description:
      'Rejects transitions the state machine disallows, so an order cannot skip ' +
      'stages or come back out of a terminal state.',
  })
  @ApiResponse({ status: 409, description: 'Illegal status transition' })
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.orders.updateStatus(id, dto.status, { note: dto.note });
  }
}
