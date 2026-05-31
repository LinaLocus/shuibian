import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RecordModule } from './record/record.module';
import { HealthModule } from './health/health.module';
import { FamilyModule } from './family/family.module';
import { StatsModule } from './stats/stats.module';
import { FoodModule } from './food/food.module';
import { AlertModule } from './alert/alert.module';

const useDatabaseUrl = !!process.env.DATABASE_URL;

@Module({
  imports: [
    TypeOrmModule.forRoot(
      useDatabaseUrl
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: true,
          }
        : {
            type: 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            username: process.env.POSTGRES_USER || 'shuibian',
            password: process.env.POSTGRES_PASSWORD || 'shuibian_dev',
            database: process.env.POSTGRES_DB || 'shuibian',
            autoLoadEntities: true,
            synchronize: true,
          },
    ),
    AuthModule,
    RecordModule,
    HealthModule,
    FamilyModule,
    StatsModule,
    FoodModule,
    AlertModule,
  ],
})
export class AppModule {}
