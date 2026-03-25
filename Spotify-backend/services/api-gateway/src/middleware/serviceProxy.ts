import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";

interface GatewayProxyOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

class ServiceProxy {
  private instances: Map<string, AxiosInstance> = new Map();

  private getServiceUrl(serviceName: string): string {
    const urls: Record<string, string> = {
      auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
      user: process.env.USER_SERVICE_URL || "http://localhost:3002",
      catalog: process.env.CATALOG_SERVICE_URL || "http://localhost:3003",
      playlist: process.env.PLAYLIST_SERVICE_URL || "http://localhost:3004",
      likes: process.env.LIKES_SERVICE_URL || "http://localhost:3005",
      history: process.env.HISTORY_SERVICE_URL || "http://localhost:3006",
      search: process.env.SEARCH_SERVICE_URL || "http://localhost:3007",
      admin: process.env.ADMIN_SERVICE_URL || "http://localhost:3008",
    };

    return urls[serviceName] || "";
  }

  private getInstance(serviceName: string): AxiosInstance {
    if (!this.instances.has(serviceName)) {
      this.instances.set(
        serviceName,
        axios.create({
          baseURL: this.getServiceUrl(serviceName),
          timeout: 5000,
          validateStatus: () => true, // Không throw error dựa trên status code
        })
      );
    }

    return this.instances.get(serviceName)!;
  }

  async gọi(
    serviceName: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    options?: GatewayProxyOptions,
    data?: any
  ): Promise<{ status: number; data: any; headers: any }> {
    try {
      const instance = this.getInstance(serviceName);
      const headers = options?.headers || {};

      const config = {
        headers,
        timeout: options?.timeout || 5000,
      };

      let response: AxiosResponse;

      switch (method) {
        case "GET":
          response = await instance.get(path, config);
          break;
        case "POST":
          response = await instance.post(path, data, config);
          break;
        case "PUT":
          response = await instance.put(path, data, config);
          break;
        case "DELETE":
          response = await instance.delete(path, config);
          break;
        case "PATCH":
          response = await instance.patch(path, data, config);
          break;
        default:
          throw new Error(`Phương thức HTTP không hỗ trợ: ${method}`);
      }

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (err) {
      console.error(
        `❌ Lỗi khi gọi ${serviceName} ${method} ${path}:`,
        err instanceof Error ? err.message : err
      );

      if (axios.isAxiosError(err)) {
        return {
          status: err.response?.status || 500,
          data: err.response?.data || { erro: "Lỗi từ service" },
          headers: err.response?.headers || {},
        };
      }

      return {
        status: 500,
        data: { erro: "Lỗi máy chủ nội bộ" },
        headers: {},
      };
    }
  }
}

export const serviceProxy = new ServiceProxy();
