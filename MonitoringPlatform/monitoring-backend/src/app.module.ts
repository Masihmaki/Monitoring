import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsModule } from './metrics/metrics.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin', // یا postgres در صورت نصب مستقیم
      password: 'secretpassword', // رمزی که موقع ساخت دیتابیس گذاشتی
      database: 'monitoring_db',
      autoLoadEntities: true,
      synchronize: true, // در محیط توسعه جدول‌ها را خودکار می‌سازد
    }),
    MetricsModule,
    AlertsModule,
  ],
})
export class AppModule {}