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

## Remaining (Phase 4 — feature flag + shell)
1. **Feature flag**: route/page guards and UI injection must pick the local
   adapters by storage mode. Today every page injects the `Http*` concrete
   classes directly, so this is the switch-over step.
2. **Desktop shell**: Electron/Tauri draft that calls
   `provideLocalVeneer('desktop')` (IPC storage bridge → main process →
   SQLite/IndexedDB) and shows the board offline, surviving restart.
3. **Acceptance**: full suite green (done) plus a manual offline smoke test of
   the shell.
