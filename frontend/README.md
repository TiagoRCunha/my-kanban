# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.31.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

Running all the unit tests

`npm run test:unit:all`

Running a singular unit test

`npm run test:unit --include=<unit_test_file>`

Running all the integration and integration tests

`npm run test:integration:all`

Running a singular integration test

`npm run test:integration --include=<integration_test_file>`

Running e2e tests

`npm run test:e2e`

Running all test at once

`npm run test`

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Quick tutorial: add a new use case

The frontend is organized in layers:

`ui -> domain use case -> domain port -> infrastructure adapter -> backend API`

Use the `users` module as the reference implementation.

### 1. Start with the domain port

Open `src/app/domain/users/ports/user-repository.port.ts` and add the repository method required by the new use case.

Example:

```ts
export interface UserRepository {
	findAll(): Promise<User[]>;
	findById(id: number): Promise<User>;
	create(input: CreateUserInput): Promise<User>;
	update(id: number, input: UpdateUserInput): Promise<User>;
	delete(id: number): Promise<void>;
	archive(id: number): Promise<User>;
}
```

If the use case can already be expressed with an existing repository method, do not add a new one.

### 2. Implement the port in infrastructure

Update the adapter in `src/app/infrastructure/users/adapters/http-user.repository.ts`.

Example:

```ts
public archive(id: number): Promise<User> {
	return firstValueFrom(
		this.httpClient
			.post<UserResponseDto>(`${this.apiBaseUrl}/users/${id}/archive`, {})
			.pipe(map((user) => UserMapper.toDomain(user))),
	);
}
```

If the backend contract changes, also update the DTO or mapper under `src/app/infrastructure/users`.

### 3. Create the use-case class in the domain

Add a new file in `src/app/domain/users/use-cases`.

Example:

```ts
import { User } from '../entities/user.entity';
import { UserRepository } from '../ports/user-repository.port';

export class ArchiveUserUseCase {
	public constructor(private readonly userRepository: UserRepository) {}

	public execute(id: number): Promise<User> {
		return this.userRepository.archive(id);
	}
}
```

Keep the use case thin. Validation and orchestration belong here; HTTP details do not.

### 4. Export it from the domain index

Update `src/app/domain/users/index.ts`.

Example:

```ts
export * from './use-cases/archive-user.use-case';
```

This keeps imports consistent across the app.

### 5. Instantiate and use it in the UI layer

This project keeps the use cases as plain classes, so create them where the UI or an application service needs them.

Example shape:

```ts
const useCase = new ArchiveUserUseCase(this.userRepository);
await useCase.execute(userId);
```

You can do this inside:

- a page component
- a facade service
- an application-level orchestrator

Prefer creating the use case close to the consumer until the project introduces a dedicated DI pattern for use cases.

### 6. Update the UI contract if necessary

If the new use case changes screen behavior:

1. Update the page or component state.
2. Add form fields if the use case needs input.
3. Handle loading and error states around `execute()`.

### 7. Validate

Run the frontend locally:

```bash
ng serve
```

Run unit tests if you changed domain or UI behavior:

```bash
ng test
```

### Checklist

- `domain/.../ports`: repository contract
- `infrastructure/.../adapters`: HTTP implementation
- `infrastructure/.../dto` or `mappers`: contract mapping when needed
- `domain/.../use-cases`: new use-case class
- `domain/.../index.ts`: export barrel update
- `ui/...`: consume the use case from the screen or facade
