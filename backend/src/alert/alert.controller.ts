import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AlertService } from './alert.service';

@UseGuards(AuthGuard('jwt'))
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  list(
    @Req() req: any,
    @Query('unread') unread?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.alertService.listAlerts(req.user.id, {
      unread: unread === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    const count = await this.alertService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get('family/:familyId/danger')
  familyDanger(@Req() req: any, @Param('familyId') familyId: string) {
    return this.alertService.getFamilyDangerAlerts(req.user.id, familyId);
  }

  @Post(':id/read')
  async markRead(@Req() req: any, @Param('id') id: string) {
    const ok = await this.alertService.markRead(req.user.id, id);
    if (!ok) throw new NotFoundException('告警不存在');
    return { success: true };
  }

  @Post('read-all')
  async markAllRead(@Req() req: any) {
    const count = await this.alertService.markAllRead(req.user.id);
    return { success: true, count };
  }
}
