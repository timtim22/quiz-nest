# Quiz Nest

Online examination platform for schools, colleges and academies. Teachers build question banks and exams; students join with an exam code and roll number. Exams keep working through internet outages: answers are saved on the student's device and synced when the connection returns.

## Tech stack

| Part            | Tools                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| Web app         | React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Lucide |
| API             | NestJS (Express), TypeScript, Zod                                              |
| Database        | PostgreSQL, Prisma ORM                                                         |
| Shared code     | `@quiz-nest/shared`: types, Zod schemas and constants used by both apps        |
| Quality         | Vitest, Testing Library, Supertest, oxlint, Prettier, GitHub Actions           |
| Repo management | npm workspaces (one `npm install` for everything)                              |

## Getting started

**You need:** Node.js 24 LTS (run `nvm use` to pick it up from `.nvmrc`; 22.22+ also works) and PostgreSQL 14+ (or Docker).

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start a database.** Either run `docker compose up -d` (starts Postgres on port 5432 with user `postgres` / password `postgres`), or use a Postgres you already have.

3. **Create your env files** from the examples. If you use your own Postgres, change `DATABASE_URL` in `apps/api/.env` to match it.

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

4. **Create the tables and starter data**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Run everything**

   ```bash
   npm run dev
   ```

   - Web app: http://localhost:5173
   - API: http://localhost:3000/api (try http://localhost:3000/api/health)

   The teacher dashboard at http://localhost:5173/teacher/dashboard shows whether the API and database are reachable.

## Scripts

Run these from the repo root.

| Command              | What it does                                                       |
| -------------------- | ------------------------------------------------------------------ |
| `npm run dev`        | Starts the shared package watcher, the API and the web app         |
| `npm run build`      | Production build of everything                                     |
| `npm run lint`       | Lints all code with oxlint                                         |
| `npm run format`     | Formats all code with Prettier (`format:check` only checks)        |
| `npm run typecheck`  | Type-checks every package                                          |
| `npm test`           | Runs unit tests in every package                                   |
| `npm run test:e2e`   | Runs API end-to-end tests (real HTTP requests, fake database)      |
| `npm run db:migrate` | Applies migrations, and creates one if `schema.prisma` has changed |
| `npm run db:seed`    | Loads starter data (safe to run repeatedly)                        |
| `npm run db:reset`   | Deletes all data and re-runs every migration                       |
| `npm run db:studio`  | Opens Prisma Studio to browse the database                         |

**Before opening a pull request**, run `npm run lint && npm run typecheck && npm test`. CI runs the same checks on every PR.

## Project structure

```
apps/
  api/                    NestJS API
    prisma/               schema.prisma, migrations, seed.ts
    src/
      main.ts             starts the server
      app.module.ts       registers every feature module
      app.setup.ts        /api prefix, security headers, CORS, body size limit
      config/env.ts       every environment variable, validated at startup
      common/             error class, error filter, response wrapper, validation pipe
      prisma/             PrismaService (the database client)
      modules/<feature>/  one folder per feature (health is the example)
    test/                 end-to-end tests
  web/                    React app
    src/
      app/                App.tsx (providers) and router.tsx (every route)
      components/ui/      reusable pieces: Button, Card, TextField, StatCard…
      components/layout/  TeacherLayout, StudentLayout, Sidebar
      features/<feature>/ api.ts (requests), hooks, feature-specific components
      lib/                api-client.ts (the only place that calls fetch), query client
      pages/              one component per route
packages/
  shared/                 types, Zod schemas and constants for both apps
```

## How things work

### API responses

Every response has the same shape, so the web app handles them all the same way.

```jsonc
// Success: controllers just return the data; ResponseInterceptor wraps it.
{ "success": true, "data": { ... } }

// Failure: HttpExceptionFilter builds this from any thrown error.
{ "success": false, "error": { "code": "EXAM_EXPIRED", "message": "This exam has ended." } }
```

For expected failures, throw `AppException` with a code from `ErrorCode` in `@quiz-nest/shared`:

```ts
throw new AppException(ErrorCode.EXAM_EXPIRED, 'This exam has ended.', HttpStatus.GONE);
```

Unexpected errors are logged and returned as `INTERNAL_ERROR` without internal details.

On the web side, `apiClient` returns `data` or throws an `ApiError` with that `code`. If the request never reached the server, the code is `CONNECTION_UNAVAILABLE`.

### Adding an API feature

1. Create `apps/api/src/modules/<feature>/` with `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts` and `<feature>.service.spec.ts`.
2. Keep controllers thin: they read the request and call the service. Business rules and database queries go in the service, which injects `PrismaService`.
3. Validate input with a Zod schema from `packages/shared` and `ZodValidationPipe`, so the API and the web form use the same rules:
   ```ts
   @Get()
   list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {}
   ```
4. Add the module to `imports` in `app.module.ts`.

The API is an ES module, so relative imports end in `.js` even though the files are `.ts` (e.g. `import { X } from './x.service.js'`).

### Changing the database

1. Edit `apps/api/prisma/schema.prisma`. Tables and columns are snake_case in Postgres (use `@@map` and `@map`), and IDs are `@default(uuid(7)) @db.Uuid`.
2. Create and apply a migration with a descriptive name:
   ```bash
   npm run db:migrate -w @quiz-nest/api -- --name add_subjects
   ```
3. Commit the new folder in `prisma/migrations` together with the schema change.

The Prisma client is generated into `apps/api/src/generated` (gitignored). `npm install` and `db:migrate` regenerate it.

### Adding a web page

1. Create the page in `src/pages/` and add its route in `src/app/router.tsx`.
2. Put API calls in `src/features/<feature>/api.ts` using `apiClient`, and wrap them in TanStack Query hooks (see `features/health`). Components never call `fetch` directly.
3. Keep business logic out of components; put it in the feature folder or in `packages/shared`.

### Styling

- Tailwind classes only. Colour tokens are in `apps/web/src/styles/index.css`: `brand-*` (dark green, primary) and `gold-*` (accent).
- Use start/end utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `border-e`) instead of left/right, so layouts flip correctly for Urdu (right-to-left).
- The student side must stay light and fast on cheap phones: no heavy effects or large images.

### Shared constants

`packages/shared` uses `as const` objects instead of TypeScript enums (see `ExamStatus`, `ErrorCode`). After changing it, `npm run dev` rebuilds it automatically. Outside `dev`, run `npm run build:shared`.

### Tests

| Where                     | File pattern         | Runs with          |
| ------------------------- | -------------------- | ------------------ |
| API unit tests            | `src/**/*.spec.ts`   | `npm test`         |
| API end-to-end tests      | `test/*.e2e-spec.ts` | `npm run test:e2e` |
| Web and shared unit tests | `*.test.ts(x)`       | `npm test`         |
