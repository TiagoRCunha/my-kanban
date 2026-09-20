# Desktop version — step-by-step (my-kanban)

Ground truth: desktop-version branch, frontend is the git root
(git -C frontend). Phase 1+2 committed & green (4cce9f3): LocalDatabase,
LocalBackend (49 session-aware methods), pluggable storage drivers
(in-memory / indexed-db / ipc + bridge + factory), 59 specs green.
Phase 3 (DI veneer) in progress: 4 of 5 users files byte-verified clean;
only local-user.repository.spec.ts needs a clean rewrite.

## Step 0 — repair the users slice (do this first next session)
1. Rewrite ONLY src/app/infrastructure/local/adapters/users/local-user.repository.spec.ts
   using the byte-verified construction pattern from this session:
   const database = LocalDatabase.createEmpty();
   const backend = new LocalBackend(database, { storage: new InMemoryStorageDriver() });
   const actor = new StaticLocalActor(1);
   const repository = new LocalUserRepository(backend, actor);
2. Run the users slice only:
   node node_modules/@angular/cli/bin/ng.js test --watch=false --browsers=ChromeHeadless
   --include=src/app/infrastructure/local/adapters/**
3. GREEN -> commit (feat(local-veneers): users slice).

## Step 1 — repeat the veneer for each remaining aggregate (one slice per commit)
Same 4-file pattern per slice: adapter (XRepository over LocalBackend + actor),
spec (red first), mapper, static actor. Slices in commit order:
  users (done via Step 0) -> tasks -> boards -> columns -> board-members ->
  comments -> user-config. 7 repository veneers total behind the domain ports.

## Step 2 — wire the DI token + factory
Extend the existing storage factory to ALSO select the repository veneer set
by detectStorageMode(): HTTP adapters vs local (LocalDatabase + LocalBackend +
StaticLocalActor) behind a LocalActorPort token. Add one DI integration spec
asserting: mode=desktop -> local veneer injected; mode=http -> HTTP veneer.

## Step 3 — desktop shell bridge (Electron/Tauri)
The storage layer already has an IPC driver + DesktopStorageBridge on the
frontend side. Next: a tiny native shell that registers a window.api handler
(load/save snapshot) so IndexedDb mode transparently becomes the desktop
persistence for the built binary.

## Step 4 — acceptance
- Full suite green: ng test --watch=false (all 59 committed + new veneer specs).
- ng build --configuration desktop; run the produced binary; create a board,
  drag tasks, close, reopen -> state persists (storage driver round-trip proves it).

## Rules (hard-won this session)
- Tool echo of big payloads corrupts; ALWAYS byte-verify after every write.
- Only reliable channel: small single-file node writes + clean node reads.
- Run tests via: node node_modules/@angular/cli/bin/ng.js test --watch=false
  --browsers=ChromeHeadless (single command line, no && chains).

## DECISION (user-confirmed today): desktop = Electron/Tauri DESKTOP BINARY. Target wiring: IpcStorageDriver + DesktopStorageBridge in main process; desktop SPA = built Angular bundle + main-process IPC persistence.
