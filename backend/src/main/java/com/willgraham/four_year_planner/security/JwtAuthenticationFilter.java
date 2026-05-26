package com.willgraham.four_year_planner.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import com.nimbusds.jwt.JWTClaimsSet;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(JwtService jwtService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                JWTClaimsSet claimsSet = jwtService.validateTokenAndGetClaims(token);
                if (claimsSet == null) {
                    throw new JwtAuthenticationException("Authentication failed");
                }

                String userId = claimsSet.getSubject();

                if (userId != null) {
                    List<SimpleGrantedAuthority> authorities = jwtService.isAdmin(claimsSet)
                            ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            : Collections.emptyList();
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (JwtAuthenticationException e) {
            logger.error("Authentication error: " + e.getMessage());
            SecurityContextHolder.clearContext();
            handleAuthenticationException(response, e.getMessage());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void handleAuthenticationException(HttpServletResponse response, String message) throws IOException {
        if(response.isCommitted()) {
            return; // Response already set, so we cant change it
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");

        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("data", "error");
        errorDetails.put("message", message);
        errorDetails.put("code", HttpServletResponse.SC_UNAUTHORIZED);

        response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
//        String jsonResponse = objectMapper.writeValueAsString(errorDetails);
//        response.getOutputStream().write(jsonResponse.getBytes());
//        response.getOutputStream().flush();
    }
}
