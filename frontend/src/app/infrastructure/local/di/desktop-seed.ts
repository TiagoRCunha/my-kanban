import type { LocalDatabase } from '../local-database';
import type { StorageDriverPort } from '../storage/storage-driver.port';
import { LocalSessionStore } from './session.store';

/**
 * Default local (desktop) account. The desktop app is a fully offline tool,
 * so on first launch it seeds a trusted admin account and signs that account
 * in automatically. The plain "hash" is valid because `LocalBackend` uses the
 * plain `PlainPasswordHasher` by default; the account can still be used to
 * sign in on the login page with these credentials.
 */
export const DEFAULT_LOCAL_USER_EMAIL = 'local@mykanban.app';
export const DEFAULT_LOCAL_USER_PASSWORD = 'mykanban';
export const DEFAULT_LOCAL_USER_FULL_NAME = 'Local User';

/**
 * Boot hook for `provideLocalVeneer('desktop')`: seeds the default account
 * when the database is empty, persists it immediately so it survives
 * restarts, and signs the seeded account in when no session exists yet.
 *
 * It runs AFTER the APP_INITIALIZER hydration (via the veneer's boot hook), so
 * the seeded user never races with the snapshot restore.
 */
export async function seedLocalSession(
  database: LocalDatabase,
  session: LocalSessionStore,
  driver: StorageDriverPort,
): Promise<void> {
  let user = database.users.find((u) => u.email === DEFAULT_LOCAL_USER_EMAIL);

  if (!user) {
    const now = new Date().toISOString();
    user = {
      id: database.nextId('users'),
      fullName: DEFAULT_LOCAL_USER_FULL_NAME,
      email: DEFAULT_LOCAL_USER_EMAIL,
      passwordHash: DEFAULT_LOCAL_USER_PASSWORD,
      avatarUrl: null,
      role: 'ADMIN',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    };
    database.users.push(user);
    database.userConfigs.push({
      id: database.nextId('userConfigs'),
      userId: user.id,
      darkMode: false,
      defaultTaskLimit: 10,
      createdAt: now,
      updatedAt: now,
    });
    await driver.save(database.serialize());
  }

  if (session.getUserId() == null) {
    session.setUserId(user.id);
  }
}