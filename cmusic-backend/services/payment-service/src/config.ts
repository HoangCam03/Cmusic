import dotenv from 'dotenv';

dotenv.config();

export const ZALOPAY_CONFIG = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  query_endpoint: "https://sb-openapi.zalopay.vn/v2/query"
};

export const PAYMENT_CONFIG = {
  PORT: process.env.PORT || 3011,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://admin:admin123@mongodb:27017/cmusic?authSource=admin",
  CALLBACK_URL: process.env.CALLBACK_URL || "http://payment-service:3011/api/payment/callback"
};
