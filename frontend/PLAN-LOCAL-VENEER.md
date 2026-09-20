# Desktop version — step-by-step plan (my-kanban)

## Goal
Add a local (desktop/offline) veneer to my-kanban so the same Angular
front-end can run as a desktop binary (Electron/Tauri) without the Spring
backend: same domain, same feature flags, no HTTP.

## Proven foundation (committed, green, byte-verified)
- Phase 1+2: `LocalDatabase` + `LocalBackend` (49 session-aware methods,
  actor-first), pluggable storage drivers (InMemory, IndexedDb, Ipc + bridge)
  behind `createStorageDriver(detectStorageMode())`. 59 specs green.
- Commit: 4cce9f3 (persistence), branch desktop-version, git root = frontend.

## The veneer pattern (one per domain aggregate)
Each local adapter mirrors the HTTP adapter's veneer contract but swaps the
HTTP client + JWT for `LocalBackend` + `LocalActorPort` (acting user id):

1. Port: `LocalActorPort { resolveActorId(): Promise<number> }` — done (shared/ports).
2. Static actor: `StaticLocalActor(id)` — done (adapters/users/static-local-actor).
3. Mapper: local DTO -> domain User — done (adapters/users/local-user.mapper).
4. Repository: `LocalUserRepository(backend, actor)` delegating to backend
   with `const actorId = await this.actor.resolveActorId()` — done
   (adapters/users/local-user.repository).
5. DI: `LocalActorPort` token + `StaticLocalActor` factory wired in the DI
   module, selected by `detectStorageMode()`; owner user from LocalDatabase.

## Step-by-step (next session, DO IN ORDER)
1. Rewrite ONLY `local-user.repository.spec.ts` (the one corrupted file) —
   mirror the HTTP users veneer spec's construction bytes:
   `StaticLocalActor(1)` + `new LocalBackend(database, { storage: new InMemoryStorageDriver() })`.
2. Run users slice only: `ng test --watch=false --browsers=ChromeHeadless
   --include="src/app/infrastructure/local/adapters/users/**"` — expect green.
3. Commit users veneer slice (feat(local-veneer): users repository).
4. Repeat the exact same veneer for: boards, columns, tasks, comments,
   board-members, board-membership, user-config (7 repositories), each with
   its spec-first red then green, one commit per slice.
5. DI wiring: register all local repositories behind `LocalActorPort` + DI
   tokens as provider factories selected by `detectStorageMode()`;
   add a session store resolving the owner id (desktop session).
6. Feature flag: Angular page/route guards pick the local adapter by mode;
   desktop build uses desktop storage driver (IPC bridge → main process →
   IndexedDB) so data survives restart.
7. Acceptance: run the 59 base specs + all new veneer specs green; build a
   desktop shell that boots the DI factories and shows the board offline.
