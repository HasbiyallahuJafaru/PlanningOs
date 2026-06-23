import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { inArray } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  DRIZZLE_PRIVILEGED,
  type Database,
} from '../src/db/drizzle.provider';
import { tenants, users } from '../src/db/schema';
import { TenantDb } from '../src/db/tenant-db.service';

/**
 * Batch 1.2 acceptance test. Proves the two things the phase plan requires:
 *  - the full auth flow works (register → token → protected route → tenant data),
 *  - a second tenant CANNOT see the first tenant's data.
 *
 * The isolation assertion runs through the real RLS-enforced TenantDb path (the
 * non-superuser connection), so it proves the database backstop, not just app
 * filtering. Requires a local Postgres with the planningos_app role provisioned
 * (scripts/setup-app-role.sql) and APP_DATABASE_URL set.
 */
describe('Auth + tenancy (e2e)', () => {
  let app: INestApplication;
  let tenantDb: TenantDb;
  let privileged: Database;

  const suffix = Date.now();
  const slugA = `test-a-${suffix}`;
  const slugB = `test-b-${suffix}`;

  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;
  let tokenA: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    tenantDb = app.get(TenantDb);
    privileged = app.get<Database>(DRIZZLE_PRIVILEGED);
  });

  afterAll(async () => {
    // Cascade-deletes users + refresh tokens for both tenants.
    await privileged
      .delete(tenants)
      .where(inArray(tenants.slug, [slugA, slugB]));
    await app?.close();
  });

  it('registers two separate tenants', async () => {
    const ra = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        tenantName: 'Tenant A',
        tenantSlug: slugA,
        email: 'a@a.test',
        password: 'password-1234',
      })
      .expect(201);
    const rb = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        tenantName: 'Tenant B',
        tenantSlug: slugB,
        email: 'b@b.test',
        password: 'password-1234',
      })
      .expect(201);

    tenantAId = ra.body.user.tenantId;
    userAId = ra.body.user.id;
    tokenA = ra.body.tokens.accessToken;
    tenantBId = rb.body.user.tenantId;
    userBId = rb.body.user.id;

    expect(tenantAId).toBeTruthy();
    expect(tenantBId).toBeTruthy();
    expect(tenantAId).not.toEqual(tenantBId);
  });

  it('GET /auth/me returns the caller’s own tenant data', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(res.body.tenantId).toBe(tenantAId);
    expect(res.body.email).toBe('a@a.test');
  });

  it('rejects /auth/me without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('tenant B context cannot see tenant A rows (RLS backstop)', async () => {
    const seenByB = await tenantDb.run(tenantBId, (tx) =>
      tx.select({ id: users.id }).from(users),
    );
    const ids = seenByB.map((u) => u.id);
    expect(ids).toContain(userBId);
    expect(ids).not.toContain(userAId);
  });

  it('tenant A context sees only tenant A rows', async () => {
    const seenByA = await tenantDb.run(tenantAId, (tx) =>
      tx.select({ id: users.id }).from(users),
    );
    const ids = seenByA.map((u) => u.id);
    expect(ids).toContain(userAId);
    expect(ids).not.toContain(userBId);
  });
});
