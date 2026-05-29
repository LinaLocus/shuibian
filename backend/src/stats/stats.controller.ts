import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';

@UseGuards(AuthGuard('jwt'))
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('trends')
  getTrends(@Req() req: any, @Query('period') period?: string) {
    return this.statsService.getTrends(req.user.id, period || 'week');
  }
}
