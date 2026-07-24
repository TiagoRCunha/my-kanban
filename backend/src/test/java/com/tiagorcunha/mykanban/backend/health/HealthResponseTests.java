package com.tiagorcunha.mykanban.backend.health;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.web.client.TestRestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class HealthResponseTests {
    
    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTestTemplate;

    @Test
    void testHealthEndpoint() {
        var response = restTestTemplate.getForEntity("http://localhost:" + port + "/health", String.class);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).contains("\"status\":\"UP\"");
        assertThat(response.getBody()).contains("\"version\":\"1.0.4\"");
    }

}
