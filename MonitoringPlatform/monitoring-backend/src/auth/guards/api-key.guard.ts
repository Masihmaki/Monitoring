import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { OrganizationsService } from '../../organizations/organizations.service';
import { UsersService } from '../../users/users.service';
import { AuthUser } from '../auth-user';

type AuthedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
};

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const raw = request.headers['x-api-key'];
    const apiKey = Array.isArray(raw) ? raw[0] : raw;

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-Api-Key header');
    }

    const organization = await this.organizationsService.findByApiKey(apiKey);
    if (organization) {
      request.user = {
        id: 'agent',
        email: 'agent@organization',
        organizationId: organization.id,
      };
      return true;
    }

    // Backward compatible: old per-user keys still accepted during migration.
    const user = await this.usersService.findByApiKey(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    const organizationId =
      await this.organizationsService.getDefaultOrganizationId(user.id);
    if (!organizationId) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = {
      id: user.id,
      email: user.email,
      organizationId,
    };
    return true;
  }
}
