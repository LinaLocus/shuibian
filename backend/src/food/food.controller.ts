import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FoodService } from './food.service';
import { UpsertFoodDto } from './dto/upsert-food.dto';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

@UseGuards(AuthGuard('jwt'))
@Controller('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get('today')
  getToday(@Req() req: any) {
    return this.foodService.getOne(req.user.id, todayKey());
  }

  @Get('insights')
  getInsights(@Req() req: any, @Query('days') days?: string) {
    const n = Math.min(180, Math.max(7, parseInt(days || '60', 10) || 60));
    return this.foodService.getInsights(req.user.id, n);
  }

  @Get()
  getRange(
    @Req() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.foodService.getRange(req.user.id, from, to);
  }

  @Put(':date')
  upsert(
    @Req() req: any,
    @Param('date') date: string,
    @Body() dto: UpsertFoodDto,
  ) {
    return this.foodService.upsert(req.user.id, date, dto);
  }
}
