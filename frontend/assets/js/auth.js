/**
 * =============================================================================
 * 認證管理模組 (Authentication Manager Module)
 * =============================================================================
 *
 * 此模組提供完整的用戶認證功能，包含：
 * - 用戶登入/註冊/登出管理
 * - JWT Token 自動刷新機制
 * - 會話狀態管理和持久化
 * - 密碼強度驗證和重設功能
 * - 電子郵件驗證功能
 * - 認證事件系統
 *
 * 使用 jQuery 進行 DOM 操作和事件處理
 *
 * @fileoverview 用戶認證管理系統
 * @version 2.0.0
 * @author AI Assistant
 * @created 2024-01-20
 * @modified 2024-01-20
 *
 * @requires jQuery 3.7.1+
 * @requires API.js (API 請求模組)
 * @requires utils.js (工具函數模組)
 *
 * @example
 * // 使用認證管理器
 * const loginResult = await Auth.login({ email: 'user@example.com', password: 'password123' });
 * if (loginResult.success) {
 *   console.log('登入成功:', loginResult.user);
 * }
 *
 * // 監聽認證事件
 * Auth.on('login', (event) => {
 *   console.log('用戶已登入:', event.detail.user);
 * });
 * =============================================================================
 */

/**
 * 認證管理器類別
 * 處理用戶登入、註冊、登出和會話管理
 *
 * @class AuthManager
 */
class AuthManager {
  /**
   * 創建認證管理器實例
   *
   * @constructor
   */
  constructor() {
    /** @type {string} API 基礎路徑 */
    this.baseUrl = "/api/auth";

    /** @type {string|null} JWT 認證 token */
    this.token = null;

    /** @type {object|null} 當前用戶資訊 */
    this.user = null;

    /** @type {number|null} Token 刷新計時器 ID */
    this.refreshTimer = null;

    // 初始化時檢查是否有有效的會話
    this.init();
  }

  /**
   * 初始化認證管理器
   */
  init() {
    this.loadTokenFromStorage();
    if (this.token) {
      this.validateToken();
    }
  }

  /**
   * 從本地存儲載入 token
   */
  loadTokenFromStorage() {
    this.token = Utils.storage.get("auth_token");
    this.user = Utils.storage.get("user_info");
  }

  /**
   * 保存 token 到本地存儲
   * @param {string} token - JWT token
   * @param {object} user - 用戶資訊
   */
  saveTokenToStorage(token, user) {
    // Token 有效期設為 24 小時
    Utils.storage.set("auth_token", token, 24 * 60 * 60 * 1000);
    Utils.storage.set("user_info", user, 24 * 60 * 60 * 1000);
    this.token = token;
    this.user = user;
  }

  /**
   * 清除認證信息
   */
  clearAuthData() {
    Utils.storage.remove("auth_token");
    Utils.storage.remove("user_info");
    this.token = null;
    this.user = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 檢查是否已登入
   * @returns {boolean} 是否已登入
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  /**
   * 獲取當前用戶資訊
   * @returns {object|null} 用戶資訊
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * 獲取認證 token
   * @returns {string|null} JWT token
   */
  getToken() {
    return this.token;
  }

  /**
   * 用戶登入
   * @param {object} credentials - 登入憑證 { email, password }
   * @returns {Promise<object>} 登入結果
   */
  async login(credentials) {
    try {
      const response = await API.post(`${this.baseUrl}/login`, credentials);

      if (response.success) {
        const { token, user } = response.data;
        this.saveTokenToStorage(token, user);
        this.setupTokenRefresh(token);

        // 觸發登入成功事件
        this.dispatchAuthEvent("login", { user });

        return {
          success: true,
          user,
          message: "登入成功",
        };
      } else {
        return {
          success: false,
          message: response.message || "登入失敗",
        };
      }
    } catch (error) {
      console.error("登入錯誤:", error);
      return {
        success: false,
        message: "登入失敗，請檢查網路連接",
      };
    }
  }

  /**
   * 用戶註冊
   * @param {object} userData - 註冊資料 { username, email, password }
   * @returns {Promise<object>} 註冊結果
   */
  async register(userData) {
    try {
      // 驗證密碼強度
      const passwordValidation = Utils.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
        };
      }

      const response = await API.post(`${this.baseUrl}/register`, userData);

      if (response.success) {
        return {
          success: true,
          message: "註冊成功，請登入您的帳號",
        };
      } else {
        return {
          success: false,
          message: response.message || "註冊失敗",
        };
      }
    } catch (error) {
      console.error("註冊錯誤:", error);
      return {
        success: false,
        message: "註冊失敗，請檢查網路連接",
      };
    }
  }

  /**
   * 用戶登出
   * @returns {Promise<object>} 登出結果
   */
  async logout() {
    try {
      if (this.token) {
        // 通知伺服器登出
        await API.post(`${this.baseUrl}/logout`);
      }
    } catch (error) {
      console.error("登出錯誤:", error);
    } finally {
      // 清除本地認證資料
      this.clearAuthData();

      // 觸發登出事件
      this.dispatchAuthEvent("logout");

      return {
        success: true,
        message: "已成功登出",
      };
    }
  }

  /**
   * 驗證 token 有效性
   * @returns {Promise<boolean>} token 是否有效
   */
  async validateToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await API.get(`${this.baseUrl}/validate`);

      if (response.success) {
        // 更新用戶資訊
        if (response.data.user) {
          this.user = response.data.user;
          Utils.storage.set("user_info", this.user, 24 * 60 * 60 * 1000);
        }
        return true;
      } else {
        // Token 無效，清除認證資料
        this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error("Token 驗證錯誤:", error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * 刷新 token
   * @returns {Promise<boolean>} 是否刷新成功
   */
  async refreshToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await API.post(`${this.baseUrl}/refresh`);

      if (response.success) {
        const { token, user } = response.data;
        this.saveTokenToStorage(token, user);
        this.setupTokenRefresh(token);
        return true;
      } else {
        this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error("Token 刷新錯誤:", error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * 設置 token 自動刷新
   * @param {string} token - JWT token
   */
  setupTokenRefresh(token) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    try {
      // 解析 JWT token 獲取過期時間
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000; // 轉為毫秒
      const now = Date.now();

      // 在 token 過期前 5 分鐘刷新
      const refreshTime = exp - now - 5 * 60 * 1000;

      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, refreshTime);
      }
    } catch (error) {
      console.error("設置 token 刷新失敗:", error);
    }
  }

  /**
   * 更新用戶資料
   * @param {object} updateData - 要更新的資料
   * @returns {Promise<object>} 更新結果
   */
  async updateProfile(updateData) {
    try {
      const response = await API.put(`${this.baseUrl}/profile`, updateData);

      if (response.success) {
        this.user = { ...this.user, ...response.data.user };
        Utils.storage.set("user_info", this.user, 24 * 60 * 60 * 1000);

        // 觸發用戶資料更新事件
        this.dispatchAuthEvent("profileUpdate", { user: this.user });

        return {
          success: true,
          user: this.user,
          message: "個人資料更新成功",
        };
      } else {
        return {
          success: false,
          message: response.message || "更新失敗",
        };
      }
    } catch (error) {
      console.error("更新個人資料錯誤:", error);
      return {
        success: false,
        message: "更新失敗，請檢查網路連接",
      };
    }
  }

  /**
   * 修改密碼
   * @param {object} passwordData - 密碼資料 { currentPassword, newPassword }
   * @returns {Promise<object>} 修改結果
   */
  async changePassword(passwordData) {
    try {
      // 驗證新密碼強度
      const passwordValidation = Utils.validatePassword(passwordData.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
        };
      }

      const response = await API.put(`${this.baseUrl}/change-password`, passwordData);

      if (response.success) {
        return {
          success: true,
          message: "密碼修改成功",
        };
      } else {
        return {
          success: false,
          message: response.message || "密碼修改失敗",
        };
      }
    } catch (error) {
      console.error("密碼修改錯誤:", error);
      return {
        success: false,
        message: "密碼修改失敗，請檢查網路連接",
      };
    }
  }

  /**
   * 重設密碼
   * @param {string} email - 電子郵件地址
   * @returns {Promise<object>} 重設結果
   */
  async resetPassword(email) {
    try {
      const response = await API.post(`${this.baseUrl}/reset-password`, { email });

      if (response.success) {
        return {
          success: true,
          message: "重設密碼連結已發送到您的電子郵件",
        };
      } else {
        return {
          success: false,
          message: response.message || "重設密碼失敗",
        };
      }
    } catch (error) {
      console.error("重設密碼錯誤:", error);
      return {
        success: false,
        message: "重設密碼失敗，請檢查網路連接",
      };
    }
  }

  /**
   * 驗證電子郵件
   * @param {string} token - 驗證 token
   * @returns {Promise<object>} 驗證結果
   */
  async verifyEmail(token) {
    try {
      const response = await API.post(`${this.baseUrl}/verify-email`, { token });

      if (response.success) {
        // 更新用戶資訊
        if (this.user) {
          this.user.emailVerified = true;
          Utils.storage.set("user_info", this.user, 24 * 60 * 60 * 1000);
        }

        return {
          success: true,
          message: "電子郵件驗證成功",
        };
      } else {
        return {
          success: false,
          message: response.message || "電子郵件驗證失敗",
        };
      }
    } catch (error) {
      console.error("電子郵件驗證錯誤:", error);
      return {
        success: false,
        message: "電子郵件驗證失敗，請檢查網路連接",
      };
    }
  }

  /**
   * 觸發認證相關事件
   * @param {string} eventType - 事件類型
   * @param {object} data - 事件數據
   */
  dispatchAuthEvent(eventType, data = {}) {
    const event = new CustomEvent(`auth:${eventType}`, {
      detail: data,
    });
    $(document).trigger(event);
  }

  /**
   * 監聽認證事件
   * @param {string} eventType - 事件類型 (login, logout, profileUpdate)
   * @param {Function} callback - 回調函數
   */
  on(eventType, callback) {
    $(document).on(`auth:${eventType}`, callback);
  }

  /**
   * 移除認證事件監聽
   * @param {string} eventType - 事件類型
   * @param {Function} callback - 回調函數
   */
  off(eventType, callback) {
    $(document).off(`auth:${eventType}`, callback);
  }
}

// 創建全局認證管理器實例
window.Auth = new AuthManager();
