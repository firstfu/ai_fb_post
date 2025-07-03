/**
 * =============================================================================
 * 貼文API模組 (Posts API Module)
 * =============================================================================
 *
 * 此模組負責處理所有與貼文相關的API調用：
 * - 貼文CRUD操作
 * - 統計數據獲取
 * - 發布操作
 *
 * @fileoverview 貼文API調用模組
 * @version 2.0.0
 * @author AI Assistant
 * @created 2024-01-20
 * @modified 2024-01-20
 * =============================================================================
 */

class PostsAPI {
  /**
   * 獲取貼文列表
   * @param {object} params - 查詢參數
   * @returns {Promise<object>} API響應
   */
  static async getPosts(params = {}) {
    const queryParams = new URLSearchParams();

    // 設置默認參數
    queryParams.append("page", params.page || 1);
    queryParams.append("limit", params.limit || 10);

    // 添加可選參數
    if (params.status) {
      queryParams.append("status", params.status);
    }

    if (params.search) {
      queryParams.append("search", params.search);
    }

    const response = await fetch(`/posts?${queryParams.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.createError(response, errorData);
    }

    return await response.json();
  }

  /**
   * 獲取單個貼文詳情
   * @param {number|string} postId - 貼文ID
   * @returns {Promise<object>} API響應
   */
  static async getPost(postId) {
    const response = await fetch(`/posts/${postId}`);
    return await response.json();
  }

  /**
   * 創建新貼文
   * @param {object} postData - 貼文數據
   * @returns {Promise<object>} API響應
   */
  static async createPost(postData) {
    const response = await fetch("/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    return await response.json();
  }

  /**
   * 更新貼文
   * @param {number|string} postId - 貼文ID
   * @param {object} postData - 更新數據
   * @returns {Promise<object>} API響應
   */
  static async updatePost(postId, postData) {
    const response = await fetch(`/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    return await response.json();
  }

  /**
   * 刪除貼文
   * @param {number|string} postId - 貼文ID
   * @returns {Promise<object>} API響應
   */
  static async deletePost(postId) {
    const response = await fetch(`/posts/${postId}`, {
      method: "DELETE",
    });
    return await response.json();
  }

  /**
   * 發布貼文
   * @param {number|string} postId - 貼文ID
   * @returns {Promise<object>} API響應
   */
  static async publishPost(postId) {
    const response = await fetch(`/posts/${postId}/publish`, {
      method: "POST",
    });
    return await response.json();
  }

  /**
   * 獲取統計數據
   * @returns {Promise<object>} API響應
   */
  static async getStats() {
    const response = await fetch("/posts/stats/summary");
    return await response.json();
  }

  /**
   * 處理API錯誤
   * @param {Response} response - Fetch響應對象
   * @param {object} result - 響應數據
   * @returns {Error} 標準化錯誤對象
   */
  static createError(response, result) {
    const message = result?.message || `API調用失敗 (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.response = result;
    return error;
  }

  /**
   * 安全API調用包裝器
   * @param {Function} apiCall - API調用函數
   * @returns {Promise<object>} 處理後的響應
   */
  static async safeCall(apiCall) {
    try {
      const response = await apiCall();

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw this.createError(response, result);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "API調用失敗");
      }

      return result;
    } catch (error) {
      console.error("API調用錯誤:", error);
      throw error;
    }
  }
}

// 導出PostsAPI
window.PostsAPI = PostsAPI;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PostsAPI };
}
