import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FamilyService } from './family.service';

@UseGuards(AuthGuard('jwt'))
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  list(@Req() req: any) {
    return this.familyService.listMyFamilies(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body('name') name: string) {
    return this.familyService.create(req.user.id, name);
  }

  @Post('join')
  join(@Req() req: any, @Body('inviteCode') inviteCode: string) {
    return this.familyService.join(req.user.id, inviteCode);
  }

  @Get(':id')
  detail(@Req() req: any, @Param('id') id: string) {
    return this.familyService.getDetail(req.user.id, id);
  }

  @Get(':id/feed')
  feed(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.familyService.getFeed(
      req.user.id,
      id,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Post(':id/regenerate-code')
  regenerate(@Req() req: any, @Param('id') id: string) {
    return this.familyService.regenerateCode(req.user.id, id);
  }

  @Delete(':id/leave')
  async leave(@Req() req: any, @Param('id') id: string) {
    await this.familyService.leave(req.user.id, id);
    return { success: true };
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Req() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    await this.familyService.removeMember(req.user.id, id, memberId);
    return { success: true };
  }

  @Get(':id/messages')
  messages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('since') since?: string,
    @Query('limit') limit?: string,
  ) {
    return this.familyService.listMessages(req.user.id, id, {
      since,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':id/messages')
  sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.familyService.sendMessage(req.user.id, id, content);
  }
}
