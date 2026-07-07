# Backend

## How to run

For this project I used Maven 3.9.9 and Java 21. You can run it with the Maven Wrapper:

```bash
./mvnw spring-boot:run
```

If you already have Maven installed, this also works:

```bash
mvn spring-boot:run
```

## Quick tutorial: add a new use case

The backend follows this flow:

`controller -> application port in -> use case handler -> application port out -> repository adapter`

Use the existing `user` module as the reference implementation.

### 1. Create or update the input command

If the new use case receives a payload, add a command in `application/command`.

Example:

```java
public record ArchiveUserCommand(Long id) {
}
```

If an existing command already matches the input, reuse it.

### 2. Add the incoming port

Create a new interface in `src/main/java/.../<module>/application/port/in`.

Example:

```java
public interface ArchiveUserUseCase {

	UserResponse archive(ArchiveUserCommand command);
}
```

Keep this interface small. It should only describe the business action.

### 3. Implement the use case in the handler

Most modules centralize the logic in one handler class such as `UserUseCaseHandler`.

Steps:

1. Add the new interface to the `implements` list.
2. Inject any extra outbound ports you need.
3. Implement the method with the business rules.

Example shape:

```java
@Service
public class UserUseCaseHandler implements ArchiveUserUseCase {

	@Override
	@Transactional
	public UserResponse archive(ArchiveUserCommand command) {
		User user = getExistingUser(command.id());
		user.setUpdatedAt(LocalDateTime.now());
		return UserResponseMapper.toResponse(userRepository.save(user));
	}
}
```

### 4. Extend the outbound port when persistence changes

If the use case needs a new query or persistence operation, add it to `application/port/out` first.

Example:

```java
public interface UserRepositoryPort {
	Optional<User> findById(Long id);
	User save(User user);
	boolean existsById(Long id);
	boolean existsByEmail(String email);
	Optional<User> findByEmail(String email);
	void deleteById(Long id);
	List<User> findAll();
}
```

Only add a new method when the current port does not already support the use case.

### 5. Implement the repository adapter

Mirror every new outbound port method inside the adapter in `infrastructure/persistence`.

Typical flow:

1. Add the method to `SpringData...Repository` if needed.
2. Implement the mapping in `...RepositoryAdapter`.

### 6. Expose it in the controller if it is an HTTP feature

If the use case must be called by the frontend:

1. Inject the new `...UseCase` interface in the controller constructor.
2. Add the endpoint in `infrastructure/web`.
3. Reuse or add a request DTO if the endpoint accepts a body.

Example shape:

```java
@PostMapping("/{id}/archive")
public UserResponse archive(@PathVariable Long id) {
	return archiveUserUseCase.archive(new ArchiveUserCommand(id));
}
```

### 7. Validate

Run the backend after the change:

```bash
./mvnw spring-boot:run
```

If you have tests for that module, run them too:

```bash
./mvnw test
```

### Checklist

- `application/port/in`: new use-case interface
- `application/usecase`: business implementation in the handler
- `application/command`: input object when needed
- `application/port/out`: new persistence contract when needed
- `infrastructure/persistence`: adapter implementation
- `infrastructure/web`: controller endpoint when the use case is public