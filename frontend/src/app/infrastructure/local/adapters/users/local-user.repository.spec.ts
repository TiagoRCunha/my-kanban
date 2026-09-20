import { LocalDatabase } from '../../local-database';
import { InMemoryStorageDriver } from '../../storage/in-memory.storage-driver';
import { LocalBackend } from '../../local-backend';
import { LocalUserRepository } from './local-user.repository';
import { StaticLocalActor } from './static-local-actor';

describe('LocalUserRepository (DI veneer)', () => {
  let repository: LocalUserRepository;

  beforeEach(() => {
    const database = LocalDatabase.createEmpty();
    const backend = new LocalBackend(database, {
      storage: new InMemoryStorageDriver(),
    });
    const actor = new StaticLocalActor(1);
    repository = new LocalUserRepository(backend, actor);
  });

  it('finds all users through the acting local actor', async () => {
    const users = await repository.findAll();
    expect(users).toBeDefined();
  });
});
