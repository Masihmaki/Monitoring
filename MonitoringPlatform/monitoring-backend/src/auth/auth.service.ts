import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { OrganizationSummary } from '../organizations/organizations.service';

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    apiKey: string;
  };
  organizations: OrganizationSummary[];
  activeOrganizationId: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsService: OrganizationsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create(dto.email, passwordHash);
    await this.organizationsService.createForUser(
      user.id,
      `${user.email.split('@')[0]} workspace`,
      user.apiKey,
    );
    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.toAuthResponse(user);
  }

  async toAuthResponse(user: User): Promise<AuthResponse> {
    const organizations = await this.organizationsService.listForUser(user.id);
    const active = organizations[0];
    if (!active) {
      throw new UnauthorizedException('No organization available for this user');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        apiKey: active.apiKey,
      },
      organizations,
      activeOrganizationId: active.id,
    };
  }
}
