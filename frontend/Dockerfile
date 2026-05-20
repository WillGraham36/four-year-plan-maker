FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM deps AS build

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG API_BASE_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV API_BASE_URL=$API_BASE_URL

COPY . .
RUN npm run build

FROM node:20-alpine AS prod

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]
