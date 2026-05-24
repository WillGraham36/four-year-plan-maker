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
import java.util.Map;
import java.util.Objects;

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
            return validateTokenAndGetClaims(token).getSubject();

        } catch (Exception e) {
            return null;
        }
    }

    public JWTClaimsSet validateTokenAndGetClaims(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();

            // Verify the signature using the JWKS
            JWSHeader header = signedJWT.getHeader();
            JWSVerificationKeySelector<SecurityContext> keySelector =
                    new JWSVerificationKeySelector<>(header.getAlgorithm(), jwkSource);

            // If we get here without exceptions, token is valid
            return claimsSet;
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isAdmin(JWTClaimsSet claimsSet) {
        if (claimsSet == null) {
            return false;
        }

        return isAdminValue(claimsSet.getClaim("role"))
                || isAdminValue(claimsSet.getClaim("status"))
                || metadataHasAdminValue(claimsSet.getClaim("public_metadata"))
                || metadataHasAdminValue(claimsSet.getClaim("private_metadata"))
                || metadataHasAdminValue(claimsSet.getClaim("unsafe_metadata"));
    }

    private boolean metadataHasAdminValue(Object metadata) {
        if (!(metadata instanceof Map<?, ?> map)) {
            return false;
        }

        return isAdminValue(map.get("role"))
                || isAdminValue(map.get("status"))
                || isAdminValue(map.get("isAdmin"));
    }

    private boolean isAdminValue(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }

        if (value == null) {
            return false;
        }

        return Objects.equals(value.toString().trim().toUpperCase(), "ADMIN");
    }


}
