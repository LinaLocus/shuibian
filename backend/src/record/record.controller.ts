import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { RecordService } from './record.service';
import { HealthService } from '../health/health.service';
import { CreateRecordDto } from './dto/create-record.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('records')
export class RecordController {
  constructor(
    private readonly recordService: RecordService,
    private readonly healthService: HealthService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateRecordDto) {
    const record = await this.recordService.create(req.user.id, dto);
    const healthScore = await this.healthService.calculateAndSave(record);
    return { record, healthScore };
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recordService.findAll(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('export')
  async exportAll(@Req() req: any, @Res() res: Response) {
    const records = await this.recordService.exportAll(req.user.id);
    const filename = `shuibian-export-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(records, null, 2));
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const record = await this.recordService.findOne(req.user.id, id);
    if (!record) {
      throw new NotFoundException('记录不存在');
    }
    return record;
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const deleted = await this.recordService.delete(req.user.id, id);
    if (!deleted) {
      throw new NotFoundException('记录不存在');
    }
    return { success: true };
  }
}
