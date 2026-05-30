package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.CatalogProgramDto;
import com.willgraham.four_year_planner.model.CurriculumProgramType;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class UmdCatalogClient {
    public static final String CATALOG_INDEX_URL = "https://academiccatalog.umd.edu/undergraduate/colleges-schools/";

    private static final URI CATALOG_INDEX_URI = URI.create(CATALOG_INDEX_URL);
    private static final Pattern CATALOG_YEAR_PATTERN = Pattern.compile("(20\\d{2}-20\\d{2})\\s+Catalog");

    private final RestTemplate restTemplate = new RestTemplate();

    public String fetchPage(String url) {
        try {
            String html = restTemplate.getForObject(url, String.class);
            if (html == null || html.isBlank()) {
                throw new IllegalStateException("Catalog page returned no content");
            }
            return html;
        } catch (RestClientException e) {
            throw new IllegalStateException("Failed to fetch catalog page: " + e.getMessage(), e);
        }
    }

    public List<CatalogProgramDto> fetchUndergraduatePrograms() {
        String html = fetchPage(CATALOG_INDEX_URL);
        Document document = Jsoup.parse(html, CATALOG_INDEX_URL);
        String catalogYear = catalogYear(document).orElse(null);
        Map<String, CatalogProgramDto> uniquePrograms = new LinkedHashMap<>();

        for (Element link : document.select("a[href]")) {
            String title = normalize(link.text());
            String href = link.attr("href");
            String sourceUrl = absoluteUrl(href);
            if (!isCatalogProgramLink(title, sourceUrl)) {
                continue;
            }

            uniquePrograms.putIfAbsent(sourceUrl, new CatalogProgramDto(
                    programName(title),
                    title,
                    programType(title),
                    sourceUrl,
                    catalogYear
            ));
        }

        return new ArrayList<>(uniquePrograms.values());
    }

    private boolean isCatalogProgramLink(String title, String sourceUrl) {
        if (title.isBlank() || sourceUrl == null || sourceUrl.isBlank()) {
            return false;
        }
        if (!sourceUrl.contains("/undergraduate/colleges-schools/")) {
            return false;
        }
        if (sourceUrl.contains("#") || sourceUrl.contains("?")) {
            return false;
        }

        String lowerTitle = title.toLowerCase(Locale.ROOT);
        return lowerTitle.contains(" major")
                || lowerTitle.endsWith("minor")
                || lowerTitle.contains(" minor")
                || lowerTitle.endsWith("certificate")
                || lowerTitle.contains(" certificate")
                || lowerTitle.endsWith("program")
                || lowerTitle.contains(" program");
    }

    private CurriculumProgramType programType(String title) {
        String lowerTitle = title.toLowerCase(Locale.ROOT);
        if (lowerTitle.contains("minor")) {
            return CurriculumProgramType.MINOR;
        }
        if (lowerTitle.contains("certificate")) {
            return CurriculumProgramType.CERTIFICATE;
        }
        if (lowerTitle.contains("major")) {
            return CurriculumProgramType.MAJOR;
        }
        return CurriculumProgramType.PROGRAM;
    }

    private String programName(String title) {
        return normalize(title
                .replace(" Major", "")
                .replace(" Minor", "")
                .replace(" Certificate", "")
                .replace(" Program", ""));
    }

    private String absoluteUrl(String href) {
        if (href.startsWith("http://") || href.startsWith("https://")) {
            return href;
        }
        return CATALOG_INDEX_URI.resolve(href).toString();
    }

    private Optional<String> catalogYear(Document document) {
        Matcher matcher = CATALOG_YEAR_PATTERN.matcher(document.text());
        return matcher.find() ? Optional.of(matcher.group(1)) : Optional.empty();
    }

    private String normalize(String value) {
        return value == null
                ? ""
                : value.replace('\u00a0', ' ')
                .replaceAll("\\s+", " ")
                .trim();
    }
}
