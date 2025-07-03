/**
 * =============================================================================
 * 貼文管理主模組 (Posts Manager Main Module)
 * =============================================================================
 *
 * 此模組整合所有貼文相關的功能模組：
 * - PostsAPI: API調用處理
 * - PostsRenderer: UI渲染
 * - PostsModal: 模態框操作
 * - PostsManager: 主要管理器
 *
 * @fileoverview 貼文管理系統主模組
 * @version 2.0.0
 * @author AI Assistant
 * @created 2024-01-20
 * @modified 2024-01-20
 * =============================================================================
 */

/**
 * 貼文管理器類別
 * 整合所有貼文相關的操作和介面
 *
 * @class PostsManager
 */
class PostsManager {
  /**
   * 創建貼文管理器實例
   *
   * @constructor
   */
  constructor() {
    /** @type {number} 當前頁碼 */
    this.currentPage = 1;

    /** @type {number} 每頁顯示數量 */
    this.perPage = 10;

    /** @type {object|null} 分頁資訊 */
    this.paginationInfo = null;

    /** @type {Array} 當前貼文列表 */
    this.currentPosts = [];

    /** @type {object} 統計數據 */
    this.stats = {};

    /** @type {boolean} 是否已初始化 */
    this.initialized = false;
  }

  /**
   * 初始化貼文管理器
   * 此方法應該在DOM載入完成後調用
   */
  init() {
    if (this.initialized) {
      return;
    }

    console.log("PostsManager 初始化中...");
    this.bindEvents();
    this.initialized = true;
  }

  /**
   * 載入貼文數據
   * @param {object} params - 查詢參數
   */
  async loadData(params = {}) {
    try {
      // 獲取篩選條件
      const statusFilter = params.status || $("#statusFilter").val() || "";
      const searchTerm = params.search || $("#searchInput").val() || "";
      const page = params.page || this.currentPage;

      // 載入統計數據
      await this.loadStats();

      // 載入貼文列表
      const postsData = await PostsAPI.getPosts({
        page: page,
        limit: this.perPage,
        status: statusFilter,
        search: searchTerm,
      });

      if (postsData.success) {
        this.currentPosts = postsData.data.posts;
        this.paginationInfo = postsData.data.pagination;
        this.currentPage = page;

        PostsRenderer.renderTable(this.currentPosts);
        PostsRenderer.updatePagination(this.paginationInfo);
      } else {
        throw new Error(postsData.message);
      }
    } catch (error) {
      console.error("載入貼文數據失敗:", error);
      Notification.show("載入貼文數據失敗: " + error.message, "error");
      PostsRenderer.renderEmptyState();
    }
  }

  /**
   * 載入統計數據
   */
  async loadStats() {
    try {
      const statsData = await PostsAPI.getStats();
      if (statsData.success) {
        this.stats = statsData.data;
        PostsRenderer.updateStatsDisplay(this.stats);
      }
    } catch (error) {
      console.error("載入統計數據失敗:", error);
    }
  }

  /**
   * 綁定事件監聽器
   */
  bindEvents() {
    console.log("綁定貼文管理事件...");

    // 新增貼文按鈕
    $(document).off("click", "#createPostBtn, #createFirstPostBtn");
    $(document).on("click", "#createPostBtn, #createFirstPostBtn", e => {
      console.log("點擊新增貼文按鈕");
      e.preventDefault();
      this.showCreateModal();
    });

    // 重新載入按鈕
    $(document).off("click", "#refreshPostsBtn");
    $(document).on("click", "#refreshPostsBtn", () => {
      this.loadData();
    });

    // 篩選器變化
    $(document).off("change", "#statusFilter");
    $(document).on("change", "#statusFilter", () => {
      this.currentPage = 1;
      this.loadData();
    });

    // 搜尋輸入
    let searchTimeout;
    $(document).off("input", "#searchInput");
    $(document).on("input", "#searchInput", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.currentPage = 1;
        this.loadData();
      }, 500);
    });

    // 分頁按鈕
    $(document).off("click", "#prevPageBtn");
    $(document).on("click", "#prevPageBtn", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadData();
      }
    });

    $(document).off("click", "#nextPageBtn");
    $(document).on("click", "#nextPageBtn", () => {
      if (this.paginationInfo && this.currentPage < this.paginationInfo.pages) {
        this.currentPage++;
        this.loadData();
      }
    });
  }

  /**
   * 顯示創建貼文模態框
   */
  showCreateModal() {
    console.log("顯示創建貼文模態框");
    PostsModal.showCreateModal(formData => this.handleCreatePost(formData));
  }

  /**
   * 處理創建貼文
   * @param {object} formData - 表單數據
   */
  async handleCreatePost(formData) {
    try {
      const result = await PostsAPI.createPost(formData);

      if (result.success) {
        Notification.show("貼文創建成功", "success");
        Modal.hide();
        this.loadData();
      } else {
        throw new Error(result.message || "創建貼文失敗");
      }
    } catch (error) {
      console.error("創建貼文失敗:", error);
      Notification.show("創建貼文失敗: " + error.message, "error");
    }
  }

  /**
   * 查看貼文詳情
   * @param {number} postId - 貼文ID
   */
  async viewPost(postId) {
    try {
      const result = await PostsAPI.getPost(postId);

      if (result.success) {
        const post = result.data;
        PostsModal.showViewModal(post, id => this.editPost(id));
      } else {
        throw new Error(result.message || "載入貼文詳情失敗");
      }
    } catch (error) {
      console.error("載入貼文詳情失敗:", error);
      Notification.show("載入貼文詳情失敗: " + error.message, "error");
    }
  }

  /**
   * 編輯貼文
   * @param {number} postId - 貼文ID
   */
  async editPost(postId) {
    try {
      const result = await PostsAPI.getPost(postId);

      if (result.success) {
        const post = result.data;
        PostsModal.showEditModal(post, (id, formData) => this.handleUpdatePost(id, formData));
      } else {
        throw new Error(result.message || "載入貼文資料失敗");
      }
    } catch (error) {
      console.error("載入貼文資料失敗:", error);
      Notification.show("載入貼文資料失敗: " + error.message, "error");
    }
  }

  /**
   * 處理更新貼文
   * @param {number} postId - 貼文ID
   * @param {object} formData - 表單數據
   */
  async handleUpdatePost(postId, formData) {
    try {
      const result = await PostsAPI.updatePost(postId, formData);

      if (result.success) {
        Notification.show("貼文更新成功", "success");
        Modal.hide();
        this.loadData();
      } else {
        throw new Error(result.message || "更新貼文失敗");
      }
    } catch (error) {
      console.error("更新貼文失敗:", error);
      Notification.show("更新貼文失敗: " + error.message, "error");
    }
  }

  /**
   * 發布貼文
   * @param {number} postId - 貼文ID
   */
  async publishPost(postId) {
    try {
      const result = await PostsAPI.publishPost(postId);

      if (result.success) {
        Notification.show("貼文發布成功", "success");
        this.loadData();
      } else {
        throw new Error(result.message || "發布貼文失敗");
      }
    } catch (error) {
      console.error("發布貼文失敗:", error);
      Notification.show("發布貼文失敗: " + error.message, "error");
    }
  }

  /**
   * 刪除貼文
   * @param {number} postId - 貼文ID
   */
  async deletePost(postId) {
    const confirmed = await Modal.confirm({
      title: "確認刪除",
      message: "您確定要刪除這篇貼文嗎？此操作無法復原。",
      confirmText: "刪除",
      cancelText: "取消",
      type: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await PostsAPI.deletePost(postId);

      if (result.success) {
        Notification.show("貼文刪除成功", "success");
        this.loadData();
      } else {
        throw new Error(result.message || "刪除貼文失敗");
      }
    } catch (error) {
      console.error("刪除貼文失敗:", error);
      Notification.show("刪除貼文失敗: " + error.message, "error");
    }
  }

  /**
   * 重置管理器狀態
   */
  reset() {
    this.currentPage = 1;
    this.paginationInfo = null;
    this.currentPosts = [];
    this.stats = {};
  }

  /**
   * 銷毀管理器
   */
  destroy() {
    // 移除所有事件監聽器
    $(document).off("click", "#createPostBtn, #createFirstPostBtn");
    $(document).off("click", "#refreshPostsBtn");
    $(document).off("change", "#statusFilter");
    $(document).off("input", "#searchInput");
    $(document).off("click", "#prevPageBtn, #nextPageBtn");

    this.reset();
    this.initialized = false;
  }
}

// 導出PostsManager
window.PostsManager = PostsManager;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PostsManager };
}
