import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../alerts/entities/alert.entity';
import { AppConfiguration } from '../config/configuration';
import { Metric } from '../metrics/entities/metric.entity';
import { Monitor } from '../monitors/entities/monitor.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateAlertThresholdsDto } from './dto/update-alert-thresholds.dto';
import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationRole } from './organization-role';
import {
  AlertThresholdSettings,
  AlertThresholdValues,
} from './alert-thresholds';

export type OrganizationSummary = {
  id: string;
  name: string;
  role: OrganizationRole;
  apiKey: string;
  createdAt: Date;
};

export type MemberSummary = {
  id: string;
  userId: string;
  email: string;
  role: OrganizationRole;
  createdAt: Date;
};

@Injectable()
export class OrganizationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.backfillPersonalOrganizations();
  }

  async createForUser(
    userId: string,
    name: string,
    apiKey?: string,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.save(
      this.organizationRepository.create({
        name,
        apiKey: apiKey ?? this.usersService.createApiKey(),
      }),
    );

    await this.memberRepository.save(
      this.memberRepository.create({
        organizationId: organization.id,
        userId,
        role: OrganizationRole.OWNER,
      }),
    );

    return organization;
  }

  async create(
    userId: string,
    dto: CreateOrganizationDto,
  ): Promise<OrganizationSummary> {
    const organization = await this.createForUser(userId, dto.name.trim());
    return {
      id: organization.id,
      name: organization.name,
      role: OrganizationRole.OWNER,
      apiKey: organization.apiKey,
      createdAt: organization.createdAt,
    };
  }

  async listForUser(userId: string): Promise<OrganizationSummary[]> {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: { organization: true },
      order: { createdAt: 'ASC' },
    });

    return memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      role: membership.role,
      apiKey: membership.organization.apiKey,
      createdAt: membership.organization.createdAt,
    }));
  }

  async getDefaultOrganizationId(userId: string): Promise<string | null> {
    const membership = await this.memberRepository.findOne({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return membership?.organizationId ?? null;
  }

  async assertMembership(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember> {
    const membership = await this.memberRepository.findOne({
      where: { userId, organizationId },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }
    return membership;
  }

  async findByApiKey(apiKey: string): Promise<Organization | null> {
    return await this.organizationRepository.findOne({ where: { apiKey } });
  }

  async listMembers(
    requesterId: string,
    organizationId: string,
  ): Promise<MemberSummary[]> {
    await this.assertMembership(requesterId, organizationId);
    const members = await this.memberRepository.find({
      where: { organizationId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      role: member.role,
      createdAt: member.createdAt,
    }));
  }

  async inviteMember(
    requesterId: string,
    organizationId: string,
    email: string,
  ): Promise<MemberSummary> {
    const membership = await this.assertMembership(requesterId, organizationId);
    if (membership.role !== OrganizationRole.OWNER) {
      throw new ForbiddenException('Only owners can invite members');
    }

    const invitee = await this.usersService.findByEmail(email);
    if (!invitee) {
      throw new NotFoundException(
        'No account with that email. Ask them to register first.',
      );
    }

    const existing = await this.memberRepository.findOne({
      where: { organizationId, userId: invitee.id },
    });
    if (existing) {
      throw new ConflictException('That user is already a member');
    }

    const created = await this.memberRepository.save(
      this.memberRepository.create({
        organizationId,
        userId: invitee.id,
        role: OrganizationRole.MEMBER,
      }),
    );

    return {
      id: created.id,
      userId: invitee.id,
      email: invitee.email,
      role: created.role,
      createdAt: created.createdAt,
    };
  }

  async removeMember(
    requesterId: string,
    organizationId: string,
    memberUserId: string,
  ): Promise<void> {
    const membership = await this.assertMembership(requesterId, organizationId);
    if (membership.role !== OrganizationRole.OWNER) {
      throw new ForbiddenException('Only owners can remove members');
    }

    const target = await this.memberRepository.findOne({
      where: { organizationId, userId: memberUserId },
    });
    if (!target) {
      throw new NotFoundException('Member not found');
    }
    if (target.role === OrganizationRole.OWNER) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    await this.memberRepository.remove(target);
  }

  async listMemberUserIds(organizationId: string): Promise<string[]> {
    const members = await this.memberRepository.find({
      where: { organizationId },
      select: { userId: true },
    });
    return members.map((member) => member.userId);
  }

  async getAlertThresholds(
    userId: string,
    organizationId: string,
  ): Promise<AlertThresholdSettings> {
    await this.assertMembership(userId, organizationId);
    const organization = await this.findOrganizationOrThrow(organizationId);
    return this.toAlertThresholdSettings(organization);
  }

  async updateAlertThresholds(
    userId: string,
    organizationId: string,
    dto: UpdateAlertThresholdsDto,
  ): Promise<AlertThresholdSettings> {
    const membership = await this.assertMembership(userId, organizationId);
    if (membership.role !== OrganizationRole.OWNER) {
      throw new ForbiddenException('Only owners can update alert thresholds');
    }

    const organization = await this.findOrganizationOrThrow(organizationId);
    organization.alertCpuThreshold = dto.cpuThreshold;
    organization.alertRamThreshold = dto.ramThreshold;
    organization.alertDiskThreshold = dto.diskThreshold;
    await this.organizationRepository.save(organization);

    return this.toAlertThresholdSettings(organization);
  }

  async getEffectiveAlertThresholds(
    organizationId: string,
  ): Promise<AlertThresholdValues> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      return this.defaultAlertThresholds();
    }
    return this.resolveAlertThresholds(organization);
  }

  private async findOrganizationOrThrow(
    organizationId: string,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  private defaultAlertThresholds(): AlertThresholdValues {
    const alerts =
      this.configService.getOrThrow<AppConfiguration['alerts']>('alerts');
    return {
      cpuThreshold: alerts.cpuThreshold,
      ramThreshold: alerts.ramThreshold,
      diskThreshold: alerts.diskThreshold,
    };
  }

  private resolveAlertThresholds(
    organization: Organization,
  ): AlertThresholdValues {
    const defaults = this.defaultAlertThresholds();
    return {
      cpuThreshold: organization.alertCpuThreshold ?? defaults.cpuThreshold,
      ramThreshold: organization.alertRamThreshold ?? defaults.ramThreshold,
      diskThreshold: organization.alertDiskThreshold ?? defaults.diskThreshold,
    };
  }

  private toAlertThresholdSettings(
    organization: Organization,
  ): AlertThresholdSettings {
    const values = this.resolveAlertThresholds(organization);
    return {
      ...values,
      customized:
        organization.alertCpuThreshold != null ||
        organization.alertRamThreshold != null ||
        organization.alertDiskThreshold != null,
    };
  }

  private async backfillPersonalOrganizations() {
    const users = await this.userRepository.find();
    for (const user of users) {
      const existing = await this.memberRepository.findOne({
        where: { userId: user.id },
      });
      if (existing) {
        continue;
      }

      const organization = await this.createForUser(
        user.id,
        `${user.email.split('@')[0]} workspace`,
        user.apiKey,
      );

      await this.metricRepository
        .createQueryBuilder()
        .update(Metric)
        .set({ organizationId: organization.id })
        .where('userId = :userId', { userId: user.id })
        .andWhere('organizationId IS NULL')
        .execute();
      await this.alertRepository
        .createQueryBuilder()
        .update(Alert)
        .set({ organizationId: organization.id })
        .where('userId = :userId', { userId: user.id })
        .andWhere('organizationId IS NULL')
        .execute();
      await this.monitorRepository
        .createQueryBuilder()
        .update(Monitor)
        .set({ organizationId: organization.id })
        .where('userId = :userId', { userId: user.id })
        .andWhere('organizationId IS NULL')
        .execute();
    }
  }
}
