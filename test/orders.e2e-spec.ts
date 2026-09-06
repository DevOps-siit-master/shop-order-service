import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import request from 'supertest';
import { OrdersModule } from '../src/orders/orders.module';
import { PersistenceModule } from '../src/orders/persistence/persistence.module';

describe('Orders (integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

    process.env.DATABASE_KIND = 'postgres';
    process.env.DATABASE_HOST = container.getHost();
    process.env.DATABASE_PORT = String(container.getPort());
    process.env.DATABASE_USER = container.getUsername();
    process.env.DATABASE_PASSWORD = container.getPassword();
    process.env.DATABASE_NAME = container.getDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [PersistenceModule.register(), OrdersModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app?.close();
    await container?.stop();
    delete process.env.DATABASE_KIND;
    delete process.env.DATABASE_HOST;
    delete process.env.DATABASE_PORT;
    delete process.env.DATABASE_USER;
    delete process.env.DATABASE_PASSWORD;
    delete process.env.DATABASE_NAME;
  });

  it('creates an order and computes total on the server', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        items: [
          { productId: 'p1', name: 'T-shirt', price: '12.50', quantity: 2 },
        ],
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('PENDING');
    expect(res.body.total).toBe('25.000000');
  });

  it('lists created orders', async () => {
    const res = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('rejects an invalid order (empty items)', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [] })
      .expect(400);
  });

  it('marks an order as paid and records the transaction hash', async () => {
    const created = await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [{ productId: 'p1', name: 'T-shirt', price: '12.50', quantity: 1 }] })
      .expect(201);


    const res = await request(app.getHttpServer())
      .patch(`/orders/${created.body.id}/status`)
      .send({ status: 'PAID', txHash: '0xaaa' })
      .expect(200);


    expect(res.body.status).toBe('PAID');
    expect(res.body.txHash).toBe('0xaaa');
  });
});
