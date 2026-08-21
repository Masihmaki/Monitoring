import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * Real Postgres e2e. Opt-in so default `npm test` stays offline-friendly:
 *   $env:RUN_E2E="1"; npm run test:e2e
 */
const maybeDescribe = process.env.RUN_E2E === '1' ? describe : describe.skip;

maybeDescribe('Auth and organization APIs (e2e)', () => {
  let app: INestApplication<App>;
  const email = `e2e_${Date.now()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('registers a user, lists orgs, and reads scoped metrics', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(register.body.accessToken).toBeTruthy();
    expect(register.body.activeOrganizationId).toBeTruthy();
    expect(register.body.organizations?.length).toBeGreaterThan(0);

    const token = register.body.accessToken as string;
    const organizationId = register.body.activeOrganizationId as string;

    const orgs = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', organizationId)
      .expect(200);

    expect(Array.isArray(orgs.body)).toBe(true);
    expect(orgs.body[0].id).toBe(organizationId);

    const metrics = await request(app.getHttpServer())
      .get('/metrics')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', organizationId)
      .expect(200);

    expect(Array.isArray(metrics.body)).toBe(true);

    await request(app.getHttpServer())
      .get('/metrics')
      .expect(401);
  });
});
