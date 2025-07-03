/**
 * =============================================================================
 * 貼文模態框模組 (Posts Modal Module)
 * =============================================================================
 *
 * 此模組負責處理所有與貼文相關的模態框操作：
 * - 新增貼文模態框
 * - 編輯貼文模態框
 * - 查看貼文詳情模態框
 * - 表單驗證和提交
 *
 * @fileoverview 貼文模態框處理模組
 * @version 2.0.0
 * @author AI Assistant
 * @created 2024-01-20
 * @modified 2024-01-20
 * =============================================================================
 */

class PostsModal {
  /**
   * 顯示創建貼文模態框
   * @param {Function} onSubmit - 提交回調函數
   */
  static showCreateModal(onSubmit) {
    const modalHtml = this.getCreateModalContent();

    Modal.show({
      title: "新增貼文",
      content: modalHtml,
      size: "lg",
      buttons: [
        {
          text: "取消",
          class: "bg-gray-600 hover:bg-gray-700 text-white",
          onclick: () => Modal.hide(),
        },
        {
          text: "儲存",
          class: "bg-primary-600 hover:bg-primary-700 text-white",
          onclick: () => this.handleCreateSubmit(onSubmit),
        },
      ],
    });

    // 綁定狀態變化事件
    this.bindStatusChangeEvent();
  }

  /**
   * 顯示編輯貼文模態框
   * @param {object} post - 貼文數據
   * @param {Function} onSubmit - 提交回調函數
   */
  static showEditModal(post, onSubmit) {
    const modalHtml = this.getEditModalContent(post);

    Modal.show({
      title: "編輯貼文",
      content: modalHtml,
      size: "lg",
      buttons: [
        {
          text: "取消",
          class: "bg-gray-600 hover:bg-gray-700 text-white",
          onclick: () => Modal.hide(),
        },
        {
          text: "儲存",
          class: "bg-primary-600 hover:bg-primary-700 text-white",
          onclick: () => this.handleEditSubmit(post.id, onSubmit),
        },
      ],
    });

    // 綁定狀態變化事件
    this.bindEditStatusChangeEvent();
  }

  /**
   * 顯示貼文詳情模態框
   * @param {object} post - 貼文數據
   * @param {Function} onEdit - 編輯回調函數
   */
  static showViewModal(post, onEdit) {
    const modalHtml = this.getViewModalContent(post);

    Modal.show({
      title: "貼文詳情",
      content: modalHtml,
      size: "lg",
      buttons: [
        {
          text: "關閉",
          class: "bg-gray-600 hover:bg-gray-700 text-white",
          onclick: () => Modal.hide(),
        },
        {
          text: "編輯",
          class: "bg-primary-600 hover:bg-primary-700 text-white",
          onclick: () => {
            Modal.hide();
            if (onEdit) onEdit(post.id);
          },
        },
      ],
    });
  }

  /**
   * 獲取創建貼文模態框內容
   * @returns {string} HTML內容
   */
  static getCreateModalContent() {
    return `
      <div class="space-y-6">
        <div>
          <label for="postTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            貼文標題
          </label>
          <input
            type="text"
            id="postTitle"
            name="title"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            placeholder="請輸入貼文標題"
          >
        </div>

        <div>
          <label for="postContent" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            貼文內容
          </label>
          <textarea
            id="postContent"
            name="content"
            rows="6"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            placeholder="請輸入貼文內容"
          ></textarea>
        </div>

        <div>
          <label for="postStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            發布狀態
          </label>
          <select
            id="postStatus"
            name="status"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            <option value="draft">儲存為草稿</option>
            <option value="published">立即發布</option>
            <option value="scheduled">排程發布</option>
          </select>
        </div>

        <div id="scheduledTimeContainer" class="hidden">
          <label for="scheduledTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            排程時間
          </label>
          <input
            type="datetime-local"
            id="scheduledTime"
            name="scheduled_time"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
        </div>
      </div>
    `;
  }

  /**
   * 獲取編輯貼文模態框內容
   * @param {object} post - 貼文數據
   * @returns {string} HTML內容
   */
  static getEditModalContent(post) {
    return `
      <div class="space-y-6">
        <div>
          <label for="editPostTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            貼文標題
          </label>
          <input
            type="text"
            id="editPostTitle"
            name="title"
            value="${Utils.escapeHtml(post.title)}"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
        </div>

        <div>
          <label for="editPostContent" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            貼文內容
          </label>
          <textarea
            id="editPostContent"
            name="content"
            rows="6"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >${Utils.escapeHtml(post.content)}</textarea>
        </div>

        <div>
          <label for="editPostStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            發布狀態
          </label>
          <select
            id="editPostStatus"
            name="status"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            <option value="draft" ${post.status === "draft" ? "selected" : ""}>儲存為草稿</option>
            <option value="published" ${post.status === "published" ? "selected" : ""}>立即發布</option>
            <option value="scheduled" ${post.status === "scheduled" ? "selected" : ""}>排程發布</option>
          </select>
        </div>

        <div id="editScheduledTimeContainer" class="${post.status === "scheduled" ? "" : "hidden"}">
          <label for="editScheduledTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            排程時間
          </label>
          <input
            type="datetime-local"
            id="editScheduledTime"
            name="scheduled_time"
            value="${post.scheduled_time ? new Date(post.scheduled_time).toISOString().slice(0, 16) : ""}"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
        </div>
      </div>
    `;
  }

  /**
   * 獲取查看貼文模態框內容
   * @param {object} post - 貼文數據
   * @returns {string} HTML內容
   */
  static getViewModalContent(post) {
    const createdDate = new Date(post.created_time).toLocaleString("zh-TW");

    return `
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">貼文標題</h3>
          <p class="text-gray-700 dark:text-gray-300">${Utils.escapeHtml(post.title)}</p>
        </div>

        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">貼文內容</h3>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${Utils.escapeHtml(post.content)}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">狀態</h3>
            ${this.getStatusBadge(post.status)}
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">建立時間</h3>
            <p class="text-sm text-gray-900 dark:text-white">${createdDate}</p>
          </div>
        </div>

        ${this.getEngagementStatsHTML(post.engagement_stats)}
      </div>
    `;
  }

  /**
   * 獲取互動數據HTML
   * @param {object} engagementStats - 互動統計數據
   * @returns {string} HTML內容
   */
  static getEngagementStatsHTML(engagementStats) {
    if (!engagementStats || Object.keys(engagementStats).length === 0) {
      return "";
    }

    return `
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">互動數據</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
            <p class="text-sm text-blue-600 dark:text-blue-400">按讚數</p>
            <p class="text-xl font-semibold text-blue-900 dark:text-blue-100">${engagementStats.likes || 0}</p>
          </div>
          <div class="bg-green-50 dark:bg-green-900 rounded-lg p-3">
            <p class="text-sm text-green-600 dark:text-green-400">留言數</p>
            <p class="text-xl font-semibold text-green-900 dark:text-green-100">${engagementStats.comments || 0}</p>
          </div>
          <div class="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-3">
            <p class="text-sm text-yellow-600 dark:text-yellow-400">分享數</p>
            <p class="text-xl font-semibold text-yellow-900 dark:text-yellow-100">${engagementStats.shares || 0}</p>
          </div>
          <div class="bg-purple-50 dark:bg-purple-900 rounded-lg p-3">
            <p class="text-sm text-purple-600 dark:text-purple-400">觀看數</p>
            <p class="text-xl font-semibold text-purple-900 dark:text-purple-100">${engagementStats.views || 0}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 綁定狀態變化事件（創建模態框）
   */
  static bindStatusChangeEvent() {
    $("#postStatus").on("change", function () {
      const $container = $("#scheduledTimeContainer");
      if ($(this).val() === "scheduled") {
        $container.removeClass("hidden");
        $("#scheduledTime").prop("required", true);
      } else {
        $container.addClass("hidden");
        $("#scheduledTime").prop("required", false);
      }
    });
  }

  /**
   * 綁定狀態變化事件（編輯模態框）
   */
  static bindEditStatusChangeEvent() {
    $("#editPostStatus").on("change", function () {
      const $container = $("#editScheduledTimeContainer");
      if ($(this).val() === "scheduled") {
        $container.removeClass("hidden");
        $("#editScheduledTime").prop("required", true);
      } else {
        $container.addClass("hidden");
        $("#editScheduledTime").prop("required", false);
      }
    });
  }

  /**
   * 處理創建貼文提交
   * @param {Function} onSubmit - 提交回調函數
   */
  static handleCreateSubmit(onSubmit) {
    const formData = this.getCreateFormData();

    if (!this.validateFormData(formData)) {
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
  }

  /**
   * 處理編輯貼文提交
   * @param {number|string} postId - 貼文ID
   * @param {Function} onSubmit - 提交回調函數
   */
  static handleEditSubmit(postId, onSubmit) {
    const formData = this.getEditFormData();

    if (!this.validateFormData(formData)) {
      return;
    }

    if (onSubmit) {
      onSubmit(postId, formData);
    }
  }

  /**
   * 獲取創建表單數據
   * @returns {object} 表單數據
   */
  static getCreateFormData() {
    const title = $("#postTitle").val().trim();
    const content = $("#postContent").val().trim();
    const status = $("#postStatus").val();
    const scheduledTime = $("#scheduledTime").val();

    const formData = { title, content, status };

    if (status === "scheduled" && scheduledTime) {
      formData.scheduled_time = new Date(scheduledTime).toISOString();
    }

    return formData;
  }

  /**
   * 獲取編輯表單數據
   * @returns {object} 表單數據
   */
  static getEditFormData() {
    const title = $("#editPostTitle").val().trim();
    const content = $("#editPostContent").val().trim();
    const status = $("#editPostStatus").val();
    const scheduledTime = $("#editScheduledTime").val();

    const formData = { title, content, status };

    if (status === "scheduled" && scheduledTime) {
      formData.scheduled_time = new Date(scheduledTime).toISOString();
    }

    return formData;
  }

  /**
   * 驗證表單數據
   * @param {object} formData - 表單數據
   * @returns {boolean} 是否驗證通過
   */
  static validateFormData(formData) {
    if (!formData.title || !formData.content) {
      Notification.show("請填寫完整的貼文資訊", "error");
      return false;
    }

    if (formData.status === "scheduled" && !formData.scheduled_time) {
      Notification.show("請選擇排程時間", "error");
      return false;
    }

    return true;
  }

  /**
   * 獲取狀態徽章HTML
   * @param {string} status - 貼文狀態
   * @returns {string} HTML字符串
   */
  static getStatusBadge(status) {
    const badges = {
      published:
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">已發布</span>',
      scheduled:
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">已排程</span>',
      draft:
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">草稿</span>',
      failed:
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">發布失敗</span>',
    };
    return badges[status] || badges.draft;
  }
}

// 導出PostsModal
window.PostsModal = PostsModal;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PostsModal };
}
