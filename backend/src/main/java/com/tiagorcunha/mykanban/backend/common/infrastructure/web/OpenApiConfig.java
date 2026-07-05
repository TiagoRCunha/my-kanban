package com.tiagorcunha.mykanban.backend.common.infrastructure.web;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI myKanbanOpenApi() {
    return new OpenAPI()
        .info(new Info()
            .title("My Kanban Backend API")
            .description("Hexagonal architecture API for users, boards, columns, tasks, and comments")
            .version("v1")
            .contact(new Contact().name("My Kanban"))
            .license(new License().name("Internal/Portfolio use")));
  }
}