/*
 * AI 自動化 Facebook 發文系統 - API 請求處理模組
 *
 * 功能：
 * - 統一的 HTTP 請求處理
 * - 自動認證令牌管理
 * - 錯誤處理和重試機制
 * - 請求/響應攔截器
 *
 * 作者：AI Auto Poster 團隊
 * 更新時間：2024-01-01
 */

class APIClient {
  constructor() {
    this.baseURL = "http://localhost:8000"; // 開發環境 API 基礎 URL
    this.timeout = 30000; // 30 秒超時
    this.retryCount = 3; // 重試次數
    this.retryDelay = 1000; // 重試延遲 (毫秒)

    // 請求隊列 (用於令牌刷新)
    this.requestQueue = [];
    this.isRefreshing = false;
  }

  /**
   * 發送 GET 請求
   */
  async get(endpoint, params = {}) {
    const url = this.buildURL(endpoint, params);
    return this.request("GET", url);
  }

  /**
   * 發送 POST 請求
   */
  async post(endpoint, data = {}) {
    const url = this.buildURL(endpoint);
    return this.request("POST", url, data);
  }

  /**
   * 發送 PUT 請求
   */
  async put(endpoint, data = {}) {
    const url = this.buildURL(endpoint);
    return this.request("PUT", url, data);
  }

  /**
   * 發送 DELETE 請求
   */
  async delete(endpoint) {
    const url = this.buildURL(endpoint);
    return this.request("DELETE", url);
  }

  /**
   * 建構完整的 URL
   */
  buildURL(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseURL);

    // 添加查詢參數
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  /**
   * 核心請求方法
   */
  async request(method, url, data = null, retryCount = 0) {
    try {
      const config = {
        method,
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.timeout),
      };

      // 添加請求體
      if (data && (method === "POST" || method === "PUT")) {
        if (data instanceof FormData) {
          config.body = data;
          // FormData 會自動設置正確的 Content-Type
          delete config.headers["Content-Type"];
        } else {
          config.body = JSON.stringify(data);
        }
      }

      // 發送請求
      const response = await fetch(url, config);

      // 處理響應
      return await this.handleResponse(response, method, url, data, retryCount);
    } catch (error) {
      return this.handleError(error, method, url, data, retryCount);
    }
  }

  /**
   * 獲取請求標頭
   */
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };

    // 添加認證令牌
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * 處理響應
   */
  async handleResponse(response, method, url, data, retryCount) {
    const responseData = await this.parseResponse(response);

    // 請求成功
    if (response.ok) {
      return responseData;
    }

    // 處理不同的錯誤狀態
    switch (response.status) {
      case 401:
        return this.handleUnauthorized(method, url, data, retryCount);

      case 429:
        return this.handleRateLimit(method, url, data, retryCount);

      case 500:
      case 502:
      case 503:
      case 504:
        return this.handleServerError(method, url, data, retryCount);

      default:
        throw new APIError(responseData.message || "請求失敗", response.status, responseData);
    }
  }

  /**
   * 解析響應內容
   */
  async parseResponse(response) {
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return { message: await response.text() };
  }

  /**
   * 處理 401 未授權錯誤
   */
  async handleUnauthorized(method, url, data, retryCount) {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      // 沒有刷新令牌，需要重新登入
      this.redirectToLogin();
      throw new APIError("認證已過期，請重新登入", 401);
    }

    // 避免同時多個請求都嘗試刷新令牌
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, method, url, data });
      });
    }

    try {
      this.isRefreshing = true;

      // 嘗試刷新令牌
      const refreshResponse = await fetch(this.buildURL("/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();

        // 更新令牌
        localStorage.setItem("access_token", refreshData.access_token);
        if (refreshData.refresh_token) {
          localStorage.setItem("refresh_token", refreshData.refresh_token);
        }

        // 處理隊列中的請求
        this.processRequestQueue();

        // 重新發送原始請求
        return this.request(method, url, data, retryCount + 1);
      } else {
        // 刷新失敗，清除令牌並重新登入
        this.clearTokensAndRedirect();
        throw new APIError("認證已過期，請重新登入", 401);
      }
    } catch (error) {
      this.clearTokensAndRedirect();
      throw new APIError("認證刷新失敗，請重新登入", 401);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 處理請求隊列
   */
  processRequestQueue() {
    this.requestQueue.forEach(({ resolve, reject, method, url, data }) => {
      this.request(method, url, data).then(resolve).catch(reject);
    });

    this.requestQueue = [];
  }

  /**
   * 處理 429 請求過於頻繁錯誤
   */
  async handleRateLimit(method, url, data, retryCount) {
    if (retryCount < this.retryCount) {
      const delay = this.retryDelay * Math.pow(2, retryCount); // 指數退避
      await this.sleep(delay);
      return this.request(method, url, data, retryCount + 1);
    }

    throw new APIError("請求過於頻繁，請稍後再試", 429);
  }

  /**
   * 處理服務器錯誤
   */
  async handleServerError(method, url, data, retryCount) {
    if (retryCount < this.retryCount) {
      const delay = this.retryDelay * (retryCount + 1);
      await this.sleep(delay);
      return this.request(method, url, data, retryCount + 1);
    }

    throw new APIError("服務器錯誤，請稍後再試", 500);
  }

  /**
   * 處理請求錯誤
   */
  async handleError(error, method, url, data, retryCount) {
    // 網路錯誤或超時
    if (error.name === "AbortError") {
      throw new APIError("請求超時，請檢查網路連接", 0);
    }

    if (error.name === "TypeError" && retryCount < this.retryCount) {
      // 網路錯誤，嘗試重試
      const delay = this.retryDelay * (retryCount + 1);
      await this.sleep(delay);
      return this.request(method, url, data, retryCount + 1);
    }

    throw new APIError("網路錯誤，請檢查連接", 0, error);
  }

  /**
   * 睡眠函數
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清除令牌並重定向到登入頁面
   */
  clearTokensAndRedirect() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    this.redirectToLogin();
  }

  /**
   * 重定向到登入頁面
   */
  redirectToLogin() {
    if (window.app) {
      window.app.showAuthPage();
    }
  }

  /**
   * 上傳檔案
   */
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append("file", file);

    // 添加額外數據
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.post(endpoint, formData);
  }

  /**
   * 下載檔案
   */
  async downloadFile(endpoint, filename) {
    try {
      const response = await fetch(this.buildURL(endpoint), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("下載失敗");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new APIError("檔案下載失敗", 0, error);
    }
  }

  /**
   * 設置基礎 URL
   */
  setBaseURL(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * 設置超時時間
   */
  setTimeout(timeout) {
    this.timeout = timeout;
  }

  /**
   * 獲取當前認證狀態
   */
  isAuthenticated() {
    return !!localStorage.getItem("access_token");
  }

  /**
   * 手動設置認證令牌
   */
  setAuthToken(accessToken, refreshToken = null) {
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  /**
   * 清除認證令牌
   */
  clearAuthTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

/**
 * API 錯誤類
 */
class APIError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }

  /**
   * 檢查是否為網路錯誤
   */
  isNetworkError() {
    return this.status === 0;
  }

  /**
   * 檢查是否為認證錯誤
   */
  isAuthError() {
    return this.status === 401;
  }

  /**
   * 檢查是否為權限錯誤
   */
  isForbiddenError() {
    return this.status === 403;
  }

  /**
   * 檢查是否為資源不存在錯誤
   */
  isNotFoundError() {
    return this.status === 404;
  }

  /**
   * 檢查是否為驗證錯誤
   */
  isValidationError() {
    return this.status === 422;
  }

  /**
   * 檢查是否為服務器錯誤
   */
  isServerError() {
    return this.status >= 500;
  }
}

// 創建全局 API 實例
const API = new APIClient();

// 導出 API 相關類別
window.API = API;
window.APIClient = APIClient;
window.APIError = APIError;

// 對於模組系統的導出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { API, APIClient, APIError };
}
