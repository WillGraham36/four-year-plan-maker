package com.willgraham.four_year_planner.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.willgraham.four_year_planner.security.ClerkJwtGrantedAuthoritiesConverter;
import com.willgraham.four_year_planner.security.GuestAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${clerk.jwks-url}")
    private String clerkJwksUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtDecoder jwtDecoder,
            Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter,
            GuestAuthenticationFilter guestAuthenticationFilter,
            ObjectMapper objectMapper
    ) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) ->
                                writeErrorResponse(response, objectMapper, HttpStatus.UNAUTHORIZED, "Unauthorized"))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeErrorResponse(response, objectMapper, HttpStatus.FORBIDDEN, "Forbidden"))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/guest").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/session").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter)
                        )
                )
                .addFilterAfter(guestAuthenticationFilter, BearerTokenAuthenticationFilter.class)
                .build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(clerkJwksUrl).build();
        OAuth2TokenValidator<Jwt> validator = JwtValidators.createDefaultWithIssuer(resolveIssuer(clerkJwksUrl));
        jwtDecoder.setJwtValidator(validator);
        return jwtDecoder;
    }

    @Bean
    public Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter(
            ClerkJwtGrantedAuthoritiesConverter grantedAuthoritiesConverter
    ) {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    private static void writeErrorResponse(
            HttpServletResponse response,
            ObjectMapper objectMapper,
            HttpStatus status,
            String message
    ) throws IOException {
        if (response.isCommitted()) {
            return;
        }

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        if (status == HttpStatus.UNAUTHORIZED) {
            response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        }

        objectMapper.writeValue(response.getWriter(), Map.of(
                "data", "error",
                "message", message,
                "code", status.value()
        ));
    }

    private static String resolveIssuer(String jwksUrl) {
        String normalized = jwksUrl.endsWith("/") ? jwksUrl.substring(0, jwksUrl.length() - 1) : jwksUrl;
        for (String suffix : List.of("/.well-known/jwks.json", "/.well-known/jwks")) {
            if (normalized.endsWith(suffix)) {
                return normalized.substring(0, normalized.length() - suffix.length());
            }
        }

        throw new IllegalArgumentException("clerk.jwks-url must point to Clerk's .well-known JWKS endpoint");
    }
}
