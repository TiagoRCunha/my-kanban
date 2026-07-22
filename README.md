# my-kanban

<style>
    .imgs {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 30px;
        margin: 0 0 30px 0;
    }
</style>
<span class="imgs">
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/sass.png"/>
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/swagger.png"/>
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/angular.png"/>
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/spring.png"/>
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/maven.png"/>
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/postgresql.png"/>
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/docker.png"/>
</span>

This portfolio project was designed to replicate the structure and standards of a real-world enterprise application, built from the ground up to practice and demonstrate the most respected software design patterns. It uses a task management system inspired by the Kanban methodology as its core domain, providing a practical and familiar business scenario that is complex enough to showcase advanced architectural decisions without becoming overly simplistic. The system supports multiple user roles with distinct permissions—regular users can create and manage their own boards, columns, and tasks, while administrators have access to broader management functions—ensuring that authentication and authorization are treated as first-class concerns throughout the entire stack.

On the backend, the application is developed with Spring Boot and persists data in PostgreSQL. The server code rigorously follows Hexagonal Architecture (Ports and Adapters), keeping the domain model completely isolated from infrastructure details such as the database, REST controllers, and JWT token handling. Domain-Driven Design was applied during the modeling phase to identify Bounded Contexts, Aggregates, Value Objects, and Domain Events, resulting in a rich and expressive business layer that faithfully captures the rules of a collaborative Kanban board. Every feature was written using Test-Driven Development, with a comprehensive test suite that validates domain logic, application services, and adapters independently, allowing for rapid and safe refactoring. The API exposes full OpenAPI documentation generated automatically from code, enabling interactive exploration and testing of endpoints. Security is implemented using JWT-based authentication, with tokens carrying non-sequential identifiers and being validated on every request to protect resources according to the user’s role.

The frontend is built with Angular and styled using the SCSS preprocessor, organizing styles according to the 7-1 CSS pattern to maintain a scalable and modular design system. The user interface communicates with the backend through the documented API and dynamically adapts to the authenticated user’s permissions—hiding administrative views from regular users, for instance, and presenting a clean, responsive Kanban board where columns and tasks can be reordered via drag-and-drop. Every component is covered by unit and integration tests written before or alongside the implementation, extending the TDD discipline to the client side.

By combining a realistic business domain with a modern technology stack and a strict adherence to industry best practices, this project demonstrates how to build a maintainable, secure, and fully tested microservice-ready application. It serves as a practical reference for anyone looking to understand how Hexagonal Architecture, DDD, TDD, thoughtful CSS architecture, API documentation, and role-based access control can be seamlessly integrated into a single, cohesive system.

## Project structure

- `backend/` - Spring Boot backend (Maven, Java 21). How to run read the [intern Readme](./backend/README.md)
- `frontend/` - Angular frontend (Angular 20). How to run read the [intern Readme](./frontend/README.md)
- `docs` - Some documents with general details

## Milestones

- [x] Build a ecosystem with springboot and angular
- [x] Learn how to use the newest feature in both framewoks
- [x] Scaffold both backend and frontend for future projects
- [x] Implements the Hexagonal pattern
- [x] Integrate the backend and frontend with Restful API pattern
- [x] Creates an OpenAPI docs
- [x] Implements Css 7-1 and BEM pattern
- [x] Creates drag and drop feature on frontend
- [x] Add test to the project and starts to use TDD
- [x] Uses Postgres with migration/seeders pattern
- [ ] Uses token JWT for authentication and authorization
- [ ] Send email of create account
- [ ] Manage more than one role type users
- [ ] Have a full operation project
- [ ] Uses CI/CD