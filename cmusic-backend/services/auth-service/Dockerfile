FROM node:20-alpine AS builder
WORKDIR /app
COPY libs /app/libs
COPY services/auth-service /app/services/auth-service

# Build libs
WORKDIR /app/libs
RUN npm install
RUN npm run build

# Build auth-service
WORKDIR /app/services/auth-service
RUN npm install
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Copy libs source
COPY libs /app/libs

# Install libs own dependencies (includes mongoose)
WORKDIR /app/libs
RUN npm install --omit=dev

# Install service dependencies (also has mongoose)
COPY services/auth-service/package.json /app/services/auth-service/
WORKDIR /app/services/auth-service
RUN npm install --omit=dev

# KEY FIX: Force libs to use auth-service's mongoose instance (shared singleton)
# This prevents the dual-instance buffer timeout issue
RUN rm -rf /app/libs/node_modules/mongoose && \
    ln -sf /app/services/auth-service/node_modules/mongoose /app/libs/node_modules/mongoose

# Copy compiled output from builder
COPY --from=builder /app/libs/dist /app/libs/dist
COPY --from=builder /app/services/auth-service/dist ./dist

EXPOSE 3001
CMD ["node", "dist/services/auth-service/src/server.js"]
