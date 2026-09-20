# my-kanban veneer — HANDOFF (Saturday session)

Write via reliable node channel (all echo channels proved corrupt this session).

## Committed & green (Phase 1+2)
- commit 4cce9f3 feat(local): add local persistence layer with pluggable storage drivers
- 59 specs green: LocalDatabase+LocalBackend+storage drivers+factory, on ChromeHeadless

## Phase 3 in progress — users veneer slice (DI-veneer: LocalActorPort)
CLEAN on disk (byte-verified once via node):
- src/app/infrastructure/local/adapters/users/local-user.repository.ts (LocalUserRepository)
- src/app/infrastructure/local/adapters/users/local-user.mapper.ts (LocalSessionDrivenUserMapper)
- src/app/infrastructure/local/adapters/users/static-local-actor.ts (StaticLocalActor implements LocalActorPort)
- src/app/domain/shared/ports/local-actor.port.ts (LocalActorPort)

CORRUPT on disk (ONLY the spec):
- src/app/infrastructure/local/adapters/users/local-user.repository.spec.ts
  contains garbage/refuses; the ONLY file to delete+rewrite next session.

## Next session (do this first)
1. node read the 3 clean adapters + port (paths above) — do NOT regenerate.
2. Rewrite ONLY local-user.repository.spec.ts: it will be run green 3rd try.
3. ng test --include=users/** → green → commit veneer slice.
4. Repeat the exact veneer pattern for tasks, comments, members, boards slice   (LocalTaskRepository etc. over LocalBackend + LocalActorPort).
5. DI factory: detectStorageMode() wiring replaces the committed gated searchNeighborHit in local-persistence.veneer.

## Rules learned (hard)
- tool echo/channel TO growth corrupted middle/big payloads; node single-command reads and writes of small payloads are byte-reliable. Never batch multi-file writes.
- Always run: node node_modules/@angular/cli/bin/ng.js test --watch=false --browsers=ChromeHeadless --include=<slice>  from frontend dir.
- Karma+esbuild TS compiles everything under src/app/**/*.spec.ts;
- Angular spec imports MUST be type-only import type { ... } for ports/entities referenced only as types to satisfy strict.
