FROM node:20-alpine AS builder
WORKDIR /app
COPY libs /app/libs
COPY services/permission-service /app/services/permission-service

# Build libs
WORKDIR /app/libs
RUN npm install
RUN npm run build

# Build permission-service
WORKDIR /app/services/permission-service
RUN npm install
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Copy libs source and metadata
COPY libs /app/libs
COPY services/permission-service/package.json /app/services/permission-service/

WORKDIR /app/services/permission-service
RUN npm install --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/libs/dist /app/libs/dist
COPY --from=builder /app/services/permission-service/dist ./dist

EXPOSE 3009
CMD ["node", "dist/services/permission-service/src/server.js"]
