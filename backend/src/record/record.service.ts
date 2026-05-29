import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from './record.entity';
import { CreateRecordDto } from './dto/create-record.dto';

@Injectable()
export class RecordService {
  constructor(
    @InjectRepository(Record)
    private readonly recordRepo: Repository<Record>,
  ) {}

  async create(userId: string, dto: CreateRecordDto): Promise<Record> {
    const record = this.recordRepo.create({ ...dto, userId });
    return this.recordRepo.save(record);
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const [records, total] = await this.recordRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['healthScore'],
    });
    return { records, total, page, limit };
  }

  async findOne(userId: string, id: string): Promise<Record | null> {
    return this.recordRepo.findOne({
      where: { id, userId },
      relations: ['healthScore'],
    });
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const record = await this.recordRepo.findOne({ where: { id, userId } });
    if (!record) return false;
    await this.recordRepo.remove(record);
    return true;
  }

  async exportAll(userId: string): Promise<Record[]> {
    return this.recordRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['healthScore'],
    });
  }
}
