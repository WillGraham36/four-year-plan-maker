package com.willgraham.four_year_planner.security;

import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;

@Service
public class JwtService {
    @Value("${clerk.jwks-url}")
    private String jwksUrl;

    private JWKSource<SecurityContext> jwkSource;

    @PostConstruct
    public void init() throws Exception {
        // Load JWK from Clerk
        jwkSource = JWKSourceBuilder.create(new URL(jwksUrl)).build();
    }

    public String validateTokenAndGetUserId(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();

            // Verify the signature using the JWKS
            JWSHeader header = signedJWT.getHeader();
            JWSVerificationKeySelector<SecurityContext> keySelector =
                    new JWSVerificationKeySelector<>(header.getAlgorithm(), jwkSource);

            // If we get here without exceptions, token is valid
            // Extract and return the user ID from the claims
            return claimsSet.getSubject();

        } catch (Exception e) {
            return null;
        }
    }


}
