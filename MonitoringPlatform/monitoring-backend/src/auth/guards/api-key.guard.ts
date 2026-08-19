import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { AuthUser } from '../auth-user';

type AuthedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
};

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const raw = request.headers['x-api-key'];
    const apiKey = Array.isArray(raw) ? raw[0] : raw;

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-Api-Key header');
    }

    const user = await this.usersService.findByApiKey(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = { id: user.id, email: user.email };
    return true;
  }
}
