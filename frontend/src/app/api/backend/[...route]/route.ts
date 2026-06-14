import { getApiBaseUrl } from "@/lib/api/getApiBaseUrl";
import { GUEST_COOKIE_NAME } from "@/lib/api/auth/guest-session";
import { NextRequest, NextResponse } from "next/server";

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  path?: string;
  maxAge?: number;
  expires?: Date;
};

type ProxyContext = {
  params: Promise<{
    route: string[];
  }>;
};

export async function GET(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

async function proxyRequest(request: NextRequest, context: ProxyContext) {
  const { route } = await context.params;
  const targetUrl = buildTargetUrl(route, request.nextUrl.search);
  const headers = buildForwardHeaders(request);
  const guestCookie = request.cookies.get(GUEST_COOKIE_NAME)?.value;

  if (guestCookie) {
    headers.set("Cookie", `${GUEST_COOKIE_NAME}=${guestCookie}`);
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: BODYLESS_METHODS.has(request.method)
        ? undefined
        : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });

    const body =
      upstreamResponse.status === 204 || request.method === "HEAD"
        ? null
        : await upstreamResponse.arrayBuffer();
    const response = new NextResponse(body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: buildResponseHeaders(upstreamResponse.headers),
    });

    mirrorGuestCookie(upstreamResponse.headers, response);
    return response;
  } catch (error) {
    console.error("Backend proxy request failed", error);
    return NextResponse.json(
      { data: null, message: "Unable to reach the API" },
      { status: 502 },
    );
  }
}

function buildTargetUrl(route: string[], search: string) {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  const path = route.map((segment) => encodeURIComponent(segment)).join("/");
  return `${baseUrl}/${path}${search}`;
}

function buildForwardHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.delete("accept-encoding");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("cookie");
  headers.delete("host");

  return headers;
}

function buildResponseHeaders(headers: Headers) {
  const responseHeaders = new Headers();

  for (const header of ["cache-control", "content-type"]) {
    const value = headers.get(header);
    if (value) {
      responseHeaders.set(header, value);
    }
  }

  return responseHeaders;
}

function mirrorGuestCookie(headers: Headers, response: NextResponse) {
  for (const setCookie of getSetCookieHeaders(headers)) {
    const parsedCookie = parseSetCookie(setCookie);
    if (!parsedCookie || parsedCookie.name !== GUEST_COOKIE_NAME) {
      continue;
    }

    response.cookies.set(
      parsedCookie.name,
      parsedCookie.value,
      parsedCookie.options,
    );
  }
}

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;

  if (getSetCookie) {
    return getSetCookie.call(headers);
  }

  const setCookie = headers.get("set-cookie");
  return setCookie ? [setCookie] : [];
}

function parseSetCookie(setCookie: string) {
  const [nameValue, ...attributes] = setCookie.split(";");
  const separatorIndex = nameValue.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex).trim();
  const value = nameValue.slice(separatorIndex + 1).trim();
  const options: CookieOptions = { path: "/" };

  for (const attribute of attributes) {
    const [rawName, ...rawValueParts] = attribute.trim().split("=");
    const attributeName = rawName.toLowerCase();
    const attributeValue = rawValueParts.join("=");

    if (attributeName === "httponly") {
      options.httpOnly = true;
    } else if (attributeName === "secure") {
      options.secure = true;
    } else if (attributeName === "path" && attributeValue) {
      options.path = attributeValue;
    } else if (attributeName === "max-age") {
      const maxAge = Number(attributeValue);
      if (Number.isFinite(maxAge)) {
        options.maxAge = maxAge;
      }
    } else if (attributeName === "expires" && attributeValue) {
      const expires = new Date(attributeValue);
      if (!Number.isNaN(expires.getTime())) {
        options.expires = expires;
      }
    } else if (attributeName === "samesite") {
      const sameSite = attributeValue.toLowerCase();
      if (
        sameSite === "strict" ||
        sameSite === "lax" ||
        sameSite === "none"
      ) {
        options.sameSite = sameSite;
      }
    }
  }

  return {
    name,
    value,
    options,
  };
}
