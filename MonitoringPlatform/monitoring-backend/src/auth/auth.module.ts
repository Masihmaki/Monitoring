import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { AppConfiguration } from '../config/configuration';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => OrganizationsModule),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.getOrThrow<AppConfiguration['jwt']>('jwt');
        return {
          secret: jwt.secret,
          signOptions: {
            expiresIn: jwt.expiresIn as `${number}d`,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, ApiKeyGuard],
  exports: [JwtAuthGuard, ApiKeyGuard, UsersModule, OrganizationsModule],
})
export class AuthModule {}
