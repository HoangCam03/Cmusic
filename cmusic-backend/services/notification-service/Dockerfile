FROM node:20-alpine AS builder
WORKDIR /app
COPY libs /app/libs
COPY services/notification-service /app/services/notification-service

# Build libs
WORKDIR /app/libs
RUN npm install
RUN npm run build

# Build notification-service
WORKDIR /app/services/notification-service
RUN npm install
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Copy libs source and metadata
COPY libs /app/libs
# Copy project metadata
COPY services/notification-service/package.json /app/services/notification-service/

WORKDIR /app/services/notification-service
# Install production dependencies
RUN npm install --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/libs/dist /app/libs/dist
COPY --from=builder /app/services/notification-service/dist ./dist

EXPOSE 3010
CMD ["node", "dist/services/notification-service/src/server.js"]
