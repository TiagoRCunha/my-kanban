# Desktop version — step-by-step plan (my-kanban)

## Goal
Add a local (desktop/offline) veneer to my-kanban so the same Angular
front-end can run as a desktop binary (Electron/Tauri) without the Spring
backend: same domain, same feature flags, no HTTP.

## Proven foundation (committed, green)
- Phase 1+2: `LocalDatabase` + `LocalBackend` (49 session-aware methods,
  actor-first), pluggable storage drivers (InMemory, IndexedDb, Ipc + bridge)
  behind `createStorageDriver(detectStorageMode())`. 59 specs green.
- Commit: 4cce9f3 (persistence), branch desktop-version.

## Progress — Phase 3 (DI veneer) COMPLETE
All slices are spec-first (red then green) and committed individually:

| Slice | Specs | Commit |
| --- | --- | --- |
| users | 9 | 42902e8 |
| boards (+ leaveBoard) | 10 | 02265ed |
| columns | 7 | f5e2ff3 |
| tasks | 8 | 5c45e97 |
| comments | 5 | 3487e20 |
| board-members | 5 | 29458ac |
| user-config | 8 | 25606f9 |
| DI wiring + session | 15 | 970cb92 |

Full suite after wiring: **215 specs green**.

### The veneer pattern (one per domain aggregate)
Each local adapter mirrors the HTTP adapter's veneer contract but swaps the
HTTP client + JWT for `LocalBackend` + `LocalActorPort` (acting user id):

1. Port: `LocalActorPort { resolveActorId(): Promise<number> }` (shared/ports).
2. Actors: `StaticLocalActor(id)` (tests) and `SessionLocalActor`
   (desktop session, reads `LocalSessionStore`).
3. Mapper: local DTO -> domain aggregate (`local-<slice>.mapper.ts`).
4. Repository: `Local<Slice>Repository(backend, actor)` delegating to the
   backend with `const actorId = await this.actor.resolveActorId()`.
5. DI: `provideLocalVeneer(mode)` in `infrastructure/local/di/` exposes
   `LOCAL_*` tokens + factories (backend, driver, session store, actor and all
   seven repositories) sharing one `LocalBackend`; `createLocalVeneer` /
   `hydrateLocalVeneer` are the composable boot core. `LocalDatabase.hydrate`
   restores a persisted snapshot in place on boot.

## Progress — Phase 4 (feature flag + shell) COMPLETE

1. **Feature flag**: `di/repository-tokens.ts` exposes seven `InjectionToken`s
   (USER_REPOSITORY, BOARD_REPOSITORY, BOARD_MEMBER_REPOSITORY,
   USER_CONFIG_REPOSITORY, COLUMN_REPOSITORY, TASK_REPOSITORY,
   COMMENT_REPOSITORY). `di/repository-veneer.providers.ts::provideRepositoryVeneer`
   selects HTTP adapters (`useExisting`) or the local veneer verbs a storage
   mode; `app.config.ts` calls it with
   `detectStorageMode() === 'desktop' ? 'desktop' : 'http'`. All pages,
   components and ThemeService now inject the tokens; AuthService delegates to
   `LocalBackend` and the local session in desktop mode.
2. **Desktop shell**: `desktop/` Electron app (`package.json`, `main.cjs`,
   `preload.cjs` exposing `window.api`). `angular.json` gained a `desktop`
   build configuration (`baseHref: ./`, prod optimization) —
   `npm run build:desktop`; renderer is loaded from `dist/frontend/browser`.
   Persistence is a single JSON snapshot under `app.getPath('userData')`
   >> (divergence from the earlier SQLite idea — keeps the shell
   dependency-free, mirrors the IndexedDB single-record contract).
   `desktop-seed.ts::seedLocalSession` runs as an APP_INITIALIZER boot hook
   after hydration: seeds `local@mykanban.app` / `mykanban` (ADMIN, verified,
   darkMode false) and opens the session on first run.
3. **Acceptance**: full suite **227 specs green**; `ng build` (web prod) and
   `ng build --configuration desktop` both succeed; Electron smoke test boots
   the renderer offline and persists the seeded snapshot to userData.
   Pending (one-off, needs network/approval): `npm approve-scripts electron`
   then `start` inside `desktop/` after `npm ci`.
   Run/build scripts (added for convenience):
   - `npm run desktop:run` — launches Electron dev run using the existing build.
   - `npm run start:desktop` — `ng build --configuration desktop` + Electron dev run.
   - `npm run dist:win` — electron-builder Windows targets (portable + NSIS
     installer) into `frontend/release/`.
