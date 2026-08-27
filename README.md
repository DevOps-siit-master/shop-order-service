# Shop Order Service

Order microservice for a **Shop** site deployed by [ShopHub](https://github.com/DevOps-siit-master).
It owns the order lifecycle: the storefront creates an order from the cart, the payment service marks
it paid once the on-chain transfer is verified, and the admin page lists them.
Built with NestJS in its own repository.

## Tech stack

- NestJS 11 + TypeScript
- PostgreSQL + TypeORM (provisioned per shop by CloudNativePG, through the shop-operator)
- `prom-client` for metrics, OpenTelemetry for tracing, Terminus for health checks
- Jest (unit) + Testcontainers (integration)
- Docker

## Local development

Requirements: Node.js 22+, Docker.

```bash
# 1. Install dependencies
npm ci

# 2. Create your local env file
cp .env.example .env

# 3. Start PostgreSQL
docker compose up -d postgres

# 4. Run the service in watch mode
npm run start:dev
```

- API: http://localhost:3000
- Health: http://localhost:3000/health
- Metrics: http://localhost:3000/metrics

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Run in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint check |
| `npm test` | Unit tests |
| `npm run test:e2e` | Integration tests (Testcontainers PostgreSQL) |

## API

| Method & path | Body | Result |
| --- | --- | --- |
| `POST /orders` | `{ items: [{ productId, name, price, quantity }] }` | `201` + the created order. The total is computed server-side, never trusted from the client |
| `GET /orders` | - | `200` + every order, newest first (admin overview, spec 2.2) |
| `GET /orders/:id` | - | `200` + one order (`404` if unknown) |
| `PATCH /orders/:id/status` | `{ status, txHash? }` | `200` + the updated order. Called by shop-payment-service after it verifies the transfer |
| `GET /health` | - | `200` + a database ping result |
| `GET /metrics` | - | `200` + Prometheus exposition format |

### Order lifecycle

```
PENDING ──(payment verified on chain)──> PAID
   └──────────────────────────────────> CANCELED
```

An order is created as `PENDING` with the total the server computed. `shop-payment-service` checks the
buyer's transaction on chain and, only if the transfer matches the order total and the shop's wallet,
patches the status to `PAID` together with the transaction hash.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_HOST` | `localhost` | PostgreSQL host. In the cluster these five come from the CloudNativePG secret, injected by the shop-operator |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USER` | `orders` | Database user |
| `DATABASE_PASSWORD` | `orders` | Database password |
| `DATABASE_NAME` | `orders` | Database name |
| `PORT` | `3000` | HTTP port |
| `CORS_ORIGIN` | `*` | Allowed origin for storefront requests |
| `OTEL_SERVICE_NAME` | `shop-order-service` | Service name reported in traces |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318/v1/traces` | OTLP collector endpoint |

`docker-compose.yml` feeds the PostgreSQL container from the same `DATABASE_*` values, so credentials
are defined once.

## Observability

`/metrics` exposes, alongside the Node.js defaults:

| Metric | Meaning |
| --- | --- |
| `http_requests_total` | Requests by method, route and status - covers the 24h totals, the 2xx/3xx successes and the 4xx/5xx failures |
| `http_request_duration_seconds` | Request latency histogram |
| `http_response_size_bytes_total` | Bytes served, for the total traffic volume |
| `unique_visitors_total` | Distinct visitors (client IP + browser) per 24h window |

Traces are exported over OTLP; every request the storefront makes flows through this service and on to
the payment service in a single trace.

A local Prometheus + Grafana stack with the "web traffic" dashboard lives in `observability/`:

```bash
docker compose -f observability/docker-compose.yml up -d
```

## Testing

- **Unit** - `npm test`
- **Integration** - `npm run test:e2e` starts a real PostgreSQL container with Testcontainers and
  exercises the API through HTTP: creating an order computes the total server-side, listing returns it,
  and an empty cart is rejected. Both run on every pull request (spec 5.2).

## CI/CD

- **Pull requests** - conventional PR title check, TruffleHog secret scan, Trivy config scan, build,
  unit and integration tests, container image build and a Dockle image scan. A red pipeline blocks the merge.
- **`main`** - the release workflow derives the next version from the conventional commits
  ([SemVer](https://semver.org/)) and publishes the image to Docker Hub.

## Contributing (Trunk Based Development)

- `main` is the single trunk; work happens on short-lived branches (`feat/...`, `fix/...`, `chore/...`).
- Every change goes through a Pull Request; direct pushes to `main` are blocked.
- Each PR must pass CI and be approved by at least one teammate.
- Squash merge only, so `main` keeps a linear history.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

## Project structure

```
src/
├── orders/     # order domain: controller, service, entities, DTOs
├── health/     # database-backed health check
├── metrics/    # Prometheus registry, HTTP middleware, visitor tracking
└── tracing.ts  # OpenTelemetry SDK, imported first in main.ts
```


