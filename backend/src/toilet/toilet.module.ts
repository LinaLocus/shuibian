import { Module } from '@nestjs/common';
import { ToiletController } from './toilet.controller';

@Module({
  controllers: [ToiletController],
})
export class ToiletModule {}
