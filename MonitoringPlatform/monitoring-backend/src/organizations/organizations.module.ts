import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../alerts/entities/alert.entity';
import { AuthModule } from '../auth/auth.module';
import { Metric } from '../metrics/entities/metric.entity';
import { Monitor } from '../monitors/entities/monitor.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      OrganizationMember,
      User,
      Metric,
      Alert,
      Monitor,
    ]),
    forwardRef(() => AuthModule),
    UsersModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
