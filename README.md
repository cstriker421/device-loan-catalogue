# Device Loan: Catalogue Service

The Catalogue Service of the Campus Device Loan Program (Cloud Native DevOps assignment).
It lists the kinds of device the campus can lend (brand, model, category). It is one of
several containers in the C4 Container diagram, and it is deployed as its own Azure Function App.

## At a Glance

| | |
|---|---|
| C4 container | Catalogue Service, with the Catalogue DB |
| Technology | Azure Functions v4, Node.js 22, TypeScript, Cosmos DB for NoSQL (serverless) |
| Endpoint | `GET /api/devices` (public) |
| Test deployment | https://deviceloan-test-gdm-func.azurewebsites.net/api/devices |
| Region | Italy North |
| Sibling repositories | [`device-loan-loans`](https://github.com/cstriker421/device-loan-loans) (Loan Service). Web app and notification repositories are planned |
| Status | Built and deployed to test. Automated tests and CI/CD are not yet added (see Status) |

## Test It

The test deployment needs no credentials:

```bash
curl -i https://deviceloan-test-gdm-func.azurewebsites.net/api/devices
```

Expect a `200` and JSON array of eight device models, sorted by brand and then model:

```json
[{"id":"dm-004","brand":"Apple","model":"iPad 10th Generation","category":"tablet"}, ...]
```

The first call after a quiet period can take a few seconds while the app starts.

## How the Code is Organised

The code follows ports and adapters. Dependencies point inwards:
`functions` -> `app` -> `domain` <- `infra`, and only `config` knows which adapter is used.

| Folder | Layer | What is in it |
|---|---|---|
| `src/domain` | Domain | `DeviceModel` and its validation (`device-model.ts`), and the `DeviceModelRepo` port. No I/O, no Azure imports |
| `src/app` | Application | `listDeviceModels` use case: asks the port for data and applies ordering |
| `src/infra` | Infrastructure | Cosmos DB adapter for the port, with a separate stored-document type |
| `src/config` | Composition root | `appServices.ts` builds the repository lazily from environment variables |
| `src/functions` | Entry point | `list-devices-http.ts`: HTTP trigger, JSON response, structured logging |
| `src/seed` | Tooling | Seed data (8 models) and `seed.ts`, safe to run more than once |

Design choices worth knowing:

- Functional style: factories validate input, and return frozen objects.
- The composition root has no default settings. A missing variable fails with an error naming it, never its value.
- The domain and use case contain no Azure code, so they can be unit tested with a fake repository.

## Configuration

All settings come from environment variables (see `local.settings.json` locally and the Function App
settings in Azure). Nothing secret is committed.

| Variable | Meaning |
|---|---|
| `COSMOS_ENDPOINT` | Cosmos account endpoint, for example `https://<account>.documents.azure.com:443/` |
| `COSMOS_DATABASE_ID` | Database name, `catalogue-db` |
| `COSMOS_CONTAINER_ID` | Container name, `device-models` (partition key `/id`) |
| `COSMOS_KEY` | Account key. Held in the shell locally and in Function App settings in Azure. Never in a file |

## Run it Locally

Requires Node.js 22, Azure Functions Core Tools v4, and a Cosmos DB account.

```bash
npm ci
# local.settings.json (git-ignored) must contain the three non-secret values above
export COSMOS_KEY="<account key>"
export COSMOS_ENDPOINT=... COSMOS_DATABASE_ID=catalogue-db COSMOS_CONTAINER_ID=device-models
npm run seed        # creates the 8 sample device models
npm start           # http://localhost:7071/api/devices
```

## Observability

Every request writes **one structured JSON log line**, so each stays a single row in Log Analytics:

| Event | Level | When |
|---|---|---|
| `repo.created` | info | Once per instance: which Cosmos host, database and container it uses (never the key) |
| `devices.list.ok` | info | Success, with `count` and `durationMs` |
| `devices.list.empty` | warning | Success but nothing stored (usually "not seeded") |
| `devices.list.failed` | error | Failure, with error name, message and top of the stack. The caller only gets a generic 500 |

The test environment sends logs and Application Insights telemetry to the Log Analytics workspace
`deviceloan-test-gdm-law`. Example query:

```kql
AppTraces
| where TimeGenerated > ago(1h) and Message startswith "{"
| extend e = parse_json(Message)
| project TimeGenerated, Event = tostring(e.event), Count = toint(e.count), DurationMs = toint(e.durationMs)
```

## Environments and deployment

| Environment | Where | Database |
|---|---|---|
| dev | Runs on the developer's machine | `deviceloan-dev-gdm-cosmos` / `catalogue-db` |
| test | Function App `deviceloan-test-gdm-func` in `deviceloan-test-gdm-rg` | `deviceloan-test-gdm-cosmos` / `catalogue-db` |

Deployment to test is currently manual: `npm run build` then `func azure functionapp publish deviceloan-test-gdm-func`.
A GitHub Actions pipeline (build, test, deploy to test on `main`, gated staging) is planned.

## Status

- Built: domain, port, Cosmos adapter, use case, `GET /api/devices`, seed script, structured logging, test deployment with monitoring.
- **Not yet done:** automated tests (the Loan Service has them; this service does not yet), CI/CD pipeline, JWT validation and availability counts (the Loan Service and Auth0 are missing), `/health` and `/ready` endpoints, enforcing HTTPS-only on the test app.
