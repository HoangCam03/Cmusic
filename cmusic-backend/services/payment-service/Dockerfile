FROM node:20-alpine AS builder
WORKDIR /app
COPY libs /app/libs
COPY services/payment-service /app/services/payment-service

# Build libs
WORKDIR /app/libs
RUN npm install
RUN npm run build

# Build payment-service
WORKDIR /app/services/payment-service
RUN npm install
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Copy libs source and metadata
COPY libs /app/libs
# Copy project metadata
COPY services/payment-service/package.json /app/services/payment-service/

WORKDIR /app/services/payment-service
# Install production dependencies
RUN npm install --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/libs/dist /app/libs/dist
COPY --from=builder /app/services/payment-service/dist ./dist

EXPOSE 3011
CMD ["node", "dist/services/payment-service/src/server.js"]
