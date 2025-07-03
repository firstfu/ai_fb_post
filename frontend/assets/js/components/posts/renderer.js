/**
 * =============================================================================
 * 貼文渲染模組 (Posts Renderer Module)
 * =============================================================================
 *
 * 此模組負責處理所有與貼文相關的UI渲染：
 * - 貼文列表渲染
 * - 統計數據顯示
 * - 分頁組件
 * - 空狀態顯示
 *
 * @fileoverview 貼文UI渲染模組
 * @version 2.0.0
 * @author AI Assistant
 * @created 2024-01-20
 * @modified 2024-01-20
 * =============================================================================
 */

class PostsRenderer {
  /**
   * 渲染貼文表格
   * @param {Array} posts - 貼文數據陣列
   * @param {string} containerId - 容器元素ID
   */
  static renderTable(posts, containerId = "postsTableContainer") {
    const $container = $(`#${containerId}`);

    if (!posts || posts.length === 0) {
      this.renderEmptyState(containerId);
      return;
    }

    let tableHtml = `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-dark-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                貼文標題
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                狀態
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                建立時間
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                互動數據
              </th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
    `;

    posts.forEach(post => {
      tableHtml += this.renderPostRow(post);
    });

    tableHtml += `
          </tbody>
        </table>
      </div>
    `;

    $container.html(tableHtml);
  }

  /**
   * 渲染單個貼文行
   * @param {object} post - 貼文數據
   * @returns {string} HTML字符串
   */
  static renderPostRow(post) {
    const statusConfig = {
      published: {
        class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        text: "已發布",
      },
      scheduled: {
        class: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        text: "已排程",
      },
      draft: {
        class: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        text: "草稿",
      },
      failed: {
        class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        text: "發布失敗",
      },
    };

    const status = statusConfig[post.status] || statusConfig.draft;
    const createdDate = new Date(post.created_time).toLocaleString("zh-TW");

    // 計算互動數據
    const engagement = post.engagement_stats;
    const totalEngagement = engagement ? (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0) : 0;

    return `
      <tr class="hover:bg-gray-50 dark:hover:bg-dark-700">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                ${Utils.escapeHtml(post.title)}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                ${Utils.escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? "..." : ""}
              </div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}">
            ${status.text}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          ${createdDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          ${post.status === "published" ? `${totalEngagement} 互動` : "-"}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex items-center space-x-2">
            ${this.renderActionButtons(post)}
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * 渲染操作按鈕
   * @param {object} post - 貼文數據
   * @returns {string} HTML字符串
   */
  static renderActionButtons(post) {
    let buttons = `
      <button
        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
        onclick="window.postsManager.viewPost(${post.id})"
        title="查看詳情"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
      </button>
      <button
        class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
        onclick="window.postsManager.editPost(${post.id})"
        title="編輯"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </button>
    `;

    if (post.status === "draft" || post.status === "failed") {
      buttons += `
        <button
          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          onclick="window.postsManager.publishPost(${post.id})"
          title="發布"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      `;
    }

    buttons += `
      <button
        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
        onclick="window.postsManager.deletePost(${post.id})"
        title="刪除"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    `;

    return buttons;
  }

  /**
   * 渲染空狀態
   * @param {string} containerId - 容器元素ID
   */
  static renderEmptyState(containerId = "postsTableContainer") {
    const $container = $(`#${containerId}`);

    $container.html(`
      <div class="text-center p-8">
        <div class="text-4xl mb-4">📝</div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">暫無貼文記錄</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">開始創建您的第一篇貼文吧！</p>
        <button
          id="createFirstPostBtn"
          class="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          新增貼文
        </button>
      </div>
    `);
  }

  /**
   * 更新統計數據顯示
   * @param {object} stats - 統計數據
   */
  static updateStatsDisplay(stats) {
    $("#statsTotalPosts").text(stats.total_posts || 0);
    $("#statsPublishedPosts").text(stats.published_posts || 0);
    $("#statsScheduledPosts").text(stats.scheduled_posts || 0);
    $("#statsDraftPosts").text(stats.draft_posts || 0);
  }

  /**
   * 更新分頁資訊
   * @param {object} paginationInfo - 分頁數據
   */
  static updatePagination(paginationInfo) {
    const $container = $("#paginationContainer");
    const $start = $("#paginationStart");
    const $end = $("#paginationEnd");
    const $total = $("#paginationTotal");
    const $prevBtn = $("#prevPageBtn");
    const $nextBtn = $("#nextPageBtn");

    if (!paginationInfo || paginationInfo.total === 0) {
      $container.addClass("hidden");
      return;
    }

    $container.removeClass("hidden");

    // 更新顯示資訊
    const start = (paginationInfo.current_page - 1) * paginationInfo.per_page + 1;
    const end = Math.min(paginationInfo.current_page * paginationInfo.per_page, paginationInfo.total);

    $start.text(start);
    $end.text(end);
    $total.text(paginationInfo.total);

    // 更新按鈕狀態
    $prevBtn.prop("disabled", paginationInfo.current_page <= 1);
    $nextBtn.prop("disabled", paginationInfo.current_page >= paginationInfo.pages);
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

// 導出PostsRenderer
window.PostsRenderer = PostsRenderer;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PostsRenderer };
}
