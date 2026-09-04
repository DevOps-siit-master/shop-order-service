import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from 'src/orders/order-repository.adapter';

@Injectable()
export class PersistenceHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: OrderRepository,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.repo.ping();
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError(
        'Persistence unavailable',
        this.getStatus(key, false, { message: (e as Error).message }),
      );
    }
  }
}
