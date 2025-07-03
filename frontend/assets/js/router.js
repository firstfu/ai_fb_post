/**
 * =============================================================================
 * 前端路由管理模組 (Frontend Router Module)
 * =============================================================================
 *
 * 此模組提供完整的單頁應用路由功能，包含：
 * - 基於 Hash 的客戶端路由系統
 * - 瀏覽器歷史記錄管理
 * - 認證路由保護機制
 * - 頁面懶載入和狀態管理
 * - 路由事件系統和生命週期
 * - 動態頁面渲染
 *
 * 使用 jQuery 進行 DOM 操作和事件處理
 *
 * @fileoverview 前端路由管理系統
 * @version 2.0.0
 * @author AI Assistant
 * @created 2024-01-20
 * @modified 2024-01-20
 *
 * @requires jQuery 3.7.1+
 * @requires auth.js (認證管理模組)
 * @requires utils.js (工具函數模組)
 *
 * @example
 * // 基本路由導航
 * Router.navigate('dashboard');
 * Router.navigate('posts', { filter: 'published' });
 *
 * // 監聽路由變化
 * $(document).on('route:after', (event) => {
 *   console.log('路由已變更:', event.detail);
 * });
 *
 * // 註冊自定義路由
 * Router.register('custom', {
 *   title: '自定義頁面',
 *   requireAuth: true,
 *   render: () => Router.renderCustomPage()
 * });
 * =============================================================================
 */

/**
 * 路由管理器類別
 * 處理頁面導航和瀏覽器歷史記錄
 *
 * @class Router
 */
class Router {
  /**
   * 創建路由管理器實例
   *
   * @constructor
   */
  constructor() {
    /** @type {Map<string, object>} 註冊的路由映射 */
    this.routes = new Map();

    /** @type {string|null} 當前活動路由 */
    this.currentRoute = null;

    /** @type {string} 預設路由 */
    this.defaultRoute = "dashboard";

    /** @type {Set<string>} 需要認證的路由集合 */
    this.authRequiredRoutes = new Set(["dashboard", "posts", "content", "analytics", "templates", "facebook", "settings"]);

    // 初始化路由
    this.init();
  }

  /**
   * 初始化路由器
   */
  init() {
    // 註冊默認路由
    this.registerDefaultRoutes();

    // 監聽瀏覽器歷史變化
    $(window).on("popstate", event => {
      this.handlePopState(event.originalEvent);
    });

    // 監聽認證狀態變化
    Auth.on("login", () => {
      this.navigate(this.defaultRoute);
    });

    Auth.on("logout", () => {
      this.navigate("auth");
    });

    // 初始化當前路由
    this.initCurrentRoute();
  }

  /**
   * 註冊預設路由
   */
  registerDefaultRoutes() {
    // 主要頁面路由
    this.register("auth", {
      template: "auth",
      title: "登入 - AI 自動化 Facebook 發文系統",
      requireAuth: false,
      render: () => this.renderAuthPage(),
    });

    this.register("dashboard", {
      template: "dashboard",
      title: "儀表板 - AI 自動化 Facebook 發文系統",
      requireAuth: true,
      render: () => this.renderDashboardPage(),
    });

    this.register("posts", {
      template: "posts",
      title: "貼文管理 - AI 自動化 Facebook 發文系統",
      requireAuth: true,
      render: () => this.renderPostsPage(),
    });

    this.register("content", {
      template: "content",
      title: "AI 內容生成 - AI 自動化 Facebook 發文系統",
      requireAuth: true,
      render: () => this.renderContentPage(),
    });

    this.register("analytics", {
      template: "analytics",
      title: "分析報告 - AI 自動化 Facebook 發文系統",
      requireAuth: true,
      render: () => this.renderAnalyticsPage(),
    });

    this.register("templates", {
      template: "templates",
      title: "模板管理 - AI 自動化 Facebook 發文系統",
      requireAuth: true,
      render: () => this.renderTemplatesPage(),
    });

    this.register("facebook", {
      template: "facebook",
      title: "Facebook 帳號 - AI 自動化 Facebook 發文系統",
      requireAuth: true,
      render: () => this.renderFacebookPage(),
    });

    this.register("settings", {
      template: "settings",
      title: "系統設定 - AI 自動化 Facebook 發文系統",
      requireAuth: true,
      render: () => this.renderSettingsPage(),
    });
  }

  /**
   * 註冊路由
   * @param {string} path - 路由路徑
   * @param {object} route - 路由配置
   */
  register(path, route) {
    this.routes.set(path, {
      path,
      ...route,
    });
  }

  /**
   * 導航到指定路由
   * @param {string} path - 路由路徑
   * @param {object} params - 路由參數
   * @param {boolean} replace - 是否替換當前歷史記錄
   */
  navigate(path, params = {}, replace = false) {
    const route = this.routes.get(path);

    if (!route) {
      console.error(`路由 "${path}" 不存在`);
      return;
    }

    // 檢查認證要求
    if (route.requireAuth && !Auth.isAuthenticated()) {
      this.navigate("auth", {}, true);
      return;
    }

    // 如果已經在目標路由，直接返回
    if (this.currentRoute === path) {
      return;
    }

    // 觸發路由變化前事件
    const beforeEvent = new CustomEvent("route:before", {
      detail: { from: this.currentRoute, to: path, params },
    });
    $(document).trigger(beforeEvent);

    // 更新瀏覽器歷史
    const url = this.buildUrl(path, params);
    if (replace) {
      history.replaceState({ path, params }, route.title, url);
    } else {
      history.pushState({ path, params }, route.title, url);
    }

    // 更新頁面標題
    document.title = route.title;

    // 渲染路由
    this.renderRoute(route, params);

    // 更新當前路由
    const previousRoute = this.currentRoute;
    this.currentRoute = path;

    // 觸發路由變化後事件
    const afterEvent = new CustomEvent("route:after", {
      detail: { from: previousRoute, to: path, params },
    });
    $(document).trigger(afterEvent);
  }

  /**
   * 構建 URL
   * @param {string} path - 路由路徑
   * @param {object} params - 參數
   * @returns {string} 完整 URL
   */
  buildUrl(path, params = {}) {
    const url = new URL(window.location);
    url.hash = path;

    // 添加查詢參數
    Object.keys(params).forEach(key => {
      url.searchParams.set(key, params[key]);
    });

    return url.toString();
  }

  /**
   * 初始化當前路由
   */
  initCurrentRoute() {
    const hash = window.location.hash.slice(1) || this.defaultRoute;
    const params = this.getQueryParams();

    // 檢查認證狀態
    if (this.authRequiredRoutes.has(hash) && !Auth.isAuthenticated()) {
      this.navigate("auth", {}, true);
    } else if (hash === "auth" && Auth.isAuthenticated()) {
      this.navigate(this.defaultRoute, {}, true);
    } else {
      this.navigate(hash, params, true);
    }
  }

  /**
   * 處理瀏覽器歷史變化
   * @param {PopStateEvent} event - 歷史事件
   */
  handlePopState(event) {
    if (event.state) {
      const { path, params } = event.state;
      this.renderRoute(this.routes.get(path), params);
      this.currentRoute = path;
    } else {
      this.initCurrentRoute();
    }
  }

  /**
   * 渲染路由
   * @param {object} route - 路由配置
   * @param {object} params - 路由參數
   */
  renderRoute(route, params = {}) {
    try {
      // 顯示載入狀態
      this.showLoading();

      // 渲染頁面內容
      if (route.render) {
        route.render(params);
      }

      // 更新導航狀態
      this.updateNavigation(route.path);

      // 隱藏載入狀態
      this.hideLoading();
    } catch (error) {
      console.error("路由渲染錯誤:", error);
      this.showError("頁面載入失敗");
    }
  }

  /**
   * 更新導航狀態
   * @param {string} currentPath - 當前路由路徑
   */
  updateNavigation(currentPath) {
    // 更新導航連結的活動狀態
    const $navLinks = $(".nav-link");
    $navLinks.removeClass("active");
    $navLinks.filter(`[data-route="${currentPath}"]`).addClass("active");
  }

  /**
   * 顯示載入狀態
   */
  showLoading() {
    const $pageContent = $("#page-content");
    $pageContent.html(`
      <div class="flex items-center justify-center min-h-96">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    `);
  }

  /**
   * 隱藏載入狀態
   */
  hideLoading() {
    const $pageContent = $("#page-content");
    if ($pageContent.find(".animate-spin").length > 0) {
      $pageContent.empty();
    }
  }

  /**
   * 顯示錯誤訊息
   * @param {string} message - 錯誤訊息
   */
  showError(message) {
    const $pageContent = $("#page-content");
    $pageContent.html(`
      <div class="flex items-center justify-center min-h-96">
        <div class="text-center p-8">
          <div class="text-6xl mb-4">❌</div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">發生錯誤</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">${Utils.escapeHtml(message)}</p>
          <button
            class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            onclick="location.reload()"
          >
            重新載入
          </button>
        </div>
      </div>
    `);
  }

  /**
   * 獲取查詢參數
   * @returns {object} 查詢參數對象
   */
  getQueryParams() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);

    for (const [key, value] of urlParams) {
      params[key] = value;
    }

    return params;
  }

  /**
   * 返回上一頁
   */
  goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      this.navigate(this.defaultRoute);
    }
  }

  /**
   * 前進到下一頁
   */
  goForward() {
    history.forward();
  }

  /**
   * 重新載入當前頁面
   */
  reload() {
    if (this.currentRoute) {
      const route = this.routes.get(this.currentRoute);
      if (route) {
        this.renderRoute(route, this.getQueryParams());
      }
    }
  }

  /**
   * 渲染認證頁面
   */
  renderAuthPage() {
    const $authPage = $("#auth-page");
    const $mainApp = $("#main-app");

    if ($authPage.length && $mainApp.length) {
      $authPage.show();
      $mainApp.hide();
    } else {
      console.warn("認證頁面元素未找到");
    }
  }

  /**
   * 渲染儀表板頁面
   */
  renderDashboardPage() {
    this.showMainApp();
    const $pageContent = $("#page-content");

    if ($pageContent.length === 0) {
      console.error("頁面內容容器未找到");
      return;
    }

    this.showLoading();

    setTimeout(() => {
      $pageContent.html(`
        <!-- 儀表板統計 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">總貼文數</p>
                <p id="totalPosts" class="text-3xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
              <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">今日發布</p>
                <p id="todayPosts" class="text-3xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
              <div class="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">總觀看數</p>
                <p id="totalViews" class="text-3xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
              <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">總互動數</p>
                <p id="totalEngagement" class="text-3xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
              <div class="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近貼文 -->
        <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
          <div class="p-6 border-b border-gray-200 dark:border-dark-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">最近貼文</h2>
          </div>
          <div id="recentPostsList" class="p-6">
            <div class="animate-pulse space-y-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      `);

      // 載入儀表板數據
      this.loadDashboardData();
      this.updateNavigation("dashboard");
    }, 300);
  }

  /**
   * 渲染貼文管理頁面
   */
  async renderPostsPage() {
    this.showMainApp();
    this.showLoading();

    setTimeout(async () => {
      const $pageContent = $("#page-content");

      if ($pageContent.length) {
        $pageContent.html(`
          <div class="space-y-6">
            <!-- 頁面標題和操作 -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">貼文管理</h1>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">管理和創建 Facebook 貼文</p>
              </div>
              <div class="mt-4 sm:mt-0">
                <button
                  id="createPostBtn"
                  class="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  新增貼文
                </button>
              </div>
            </div>

            <!-- 統計卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">總貼文</p>
                    <p id="statsTotalPosts" class="text-2xl font-semibold text-gray-900 dark:text-white">-</p>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">已發布</p>
                    <p id="statsPublishedPosts" class="text-2xl font-semibold text-gray-900 dark:text-white">-</p>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">已排程</p>
                    <p id="statsScheduledPosts" class="text-2xl font-semibold text-gray-900 dark:text-white">-</p>
                  </div>
                </div>
              </div>

              <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">草稿</p>
                    <p id="statsDraftPosts" class="text-2xl font-semibold text-gray-900 dark:text-white">-</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 篩選和搜尋 -->
            <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div class="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div class="relative">
                    <select
                      id="statusFilter"
                      class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="">所有狀態</option>
                      <option value="published">已發布</option>
                      <option value="scheduled">已排程</option>
                      <option value="draft">草稿</option>
                      <option value="failed">發布失敗</option>
                    </select>
                  </div>

                  <div class="relative">
                    <input
                      type="text"
                      id="searchInput"
                      placeholder="搜尋貼文標題或內容..."
                      class="block w-full pl-10 pr-3 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  id="refreshPostsBtn"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  重新載入
                </button>
              </div>
            </div>

            <!-- 貼文列表 -->
            <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-200 dark:border-dark-700">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">貼文列表</h2>
              </div>
              <div id="postsTableContainer">
                <div class="animate-pulse p-6">
                  <div class="space-y-4">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分頁 -->
            <div id="paginationContainer" class="hidden">
              <nav class="bg-white dark:bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-dark-700 sm:px-6 rounded-lg shadow-md">
                <div class="hidden sm:block">
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    顯示
                    <span id="paginationStart" class="font-medium">1</span>
                    到
                    <span id="paginationEnd" class="font-medium">10</span>
                    共
                    <span id="paginationTotal" class="font-medium">0</span>
                    筆結果
                  </p>
                </div>
                <div class="flex-1 flex justify-between sm:justify-end">
                  <button
                    id="prevPageBtn"
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    上一頁
                  </button>
                  <button
                    id="nextPageBtn"
                    class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    下一頁
                  </button>
                </div>
              </nav>
            </div>
          </div>
        `);

        // 綁定貼文頁面事件
        this.bindPostsEvents();

        // 載入貼文數據
        await this.loadPostsData();
      }

      this.hideLoading();
      this.updateNavigation("posts");
    }, 300);
  }

  renderContentPage() {
    this.showMainApp();
    this.renderPlaceholderPage("AI 內容生成", "使用 AI 輔助創作貼文內容", "🤖");
  }

  renderAnalyticsPage() {
    this.showMainApp();
    this.renderPlaceholderPage("分析報告", "查看貼文效果和數據分析", "📈");
  }

  renderTemplatesPage() {
    this.showMainApp();
    this.renderPlaceholderPage("模板管理", "管理貼文模板和格式", "📄");
  }

  renderFacebookPage() {
    this.showMainApp();
    this.renderPlaceholderPage("Facebook 帳號", "管理 Facebook 帳號連接", "👥");
  }

  renderSettingsPage() {
    this.showMainApp();
    this.renderPlaceholderPage("系統設定", "調整系統偏好和帳號設定", "⚙️");
  }

  /**
   * 渲染佔位頁面
   * @param {string} title - 頁面標題
   * @param {string} description - 頁面描述
   * @param {string} icon - 頁面圖標
   */
  renderPlaceholderPage(title, description, icon) {
    const $pageContent = $("#page-content");

    if ($pageContent.length) {
      $pageContent.html(`
        <div class="text-center p-8">
          <div class="text-6xl mb-6">${icon}</div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">${Utils.escapeHtml(title)}</h1>
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">${Utils.escapeHtml(description)}</p>

          <div class="bg-white dark:bg-dark-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-dark-700 max-w-md mx-auto">
            <div class="text-4xl mb-4">🚧</div>
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">功能開發中</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">此功能正在開發中，敬請期待！</p>
            <button
              class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
              onclick="Router.navigate('dashboard')"
            >
              返回儀表板
            </button>
          </div>
        </div>
      `);
    }
  }

  /**
   * 顯示主應用程式介面
   */
  showMainApp() {
    const $authPage = $("#auth-page");
    const $mainApp = $("#main-app");

    if ($authPage.length && $mainApp.length) {
      $authPage.hide();
      $mainApp.show();
    } else {
      console.warn("主應用程式元素未找到");
    }
  }

  /**
   * 載入儀表板數據
   */
  async loadDashboardData() {
    try {
      // 模擬載入統計數據
      $("#totalPosts").text("156");
      $("#todayPosts").text("8");
      $("#totalViews").text("12.5K");
      $("#totalEngagement").text("3.2K");

      // 載入最近貼文列表
      const $recentPostsList = $("#recentPostsList");

      // 模擬最近貼文數據
      const recentPosts = [
        { id: 1, title: "AI 生成的精彩內容", status: "published", time: "2 小時前" },
        { id: 2, title: "自動化發文測試", status: "scheduled", time: "4 小時前" },
        { id: 3, title: "Facebook 行銷策略", status: "draft", time: "1 天前" },
      ];

      let postsHtml = '<div class="space-y-4">';
      recentPosts.forEach(post => {
        const statusClass = {
          published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        }[post.status];

        const statusText = {
          published: "已發布",
          scheduled: "已排程",
          draft: "草稿",
        }[post.status];

        postsHtml += `
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <div class="flex-1">
              <h3 class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(post.title)}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">${post.time}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-medium ${statusClass}">
              ${statusText}
            </span>
          </div>
        `;
      });
      postsHtml += "</div>";

      $recentPostsList.html(postsHtml);
    } catch (error) {
      console.error("載入儀表板數據失敗:", error);
      const $recentPostsList = $("#recentPostsList");
      $recentPostsList.html('<p class="text-center text-gray-500 dark:text-gray-400">載入數據時發生錯誤</p>');
    }
  }

  /**
   * 載入貼文數據
   */
  async loadPostsData() {
    try {
      // 獲取篩選條件
      const statusFilter = $("#statusFilter").val() || "";
      const searchTerm = $("#searchInput").val() || "";
      const currentPage = this.currentPostsPage || 1;

      // 載入統計數據
      const statsResponse = await fetch("/posts/stats/summary");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          const stats = statsData.data;
          $("#statsTotalPosts").text(stats.total_posts);
          $("#statsPublishedPosts").text(stats.published_posts);
          $("#statsScheduledPosts").text(stats.scheduled_posts);
          $("#statsDraftPosts").text(stats.draft_posts);
        }
      }

      // 構建查詢參數
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      // 載入貼文列表
      const response = await fetch(`/posts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.renderPostsTable(data.data.posts);
          this.updatePagination(data.data.pagination);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error("載入貼文列表失敗");
      }
    } catch (error) {
      console.error("載入貼文數據失敗:", error);
      Notification.show("載入貼文數據失敗: " + error.message, "error");
      this.renderPostsTable([]);
    }
  }

  /**
   * 渲染貼文表格
   */
  renderPostsTable(posts) {
    const $container = $("#postsTableContainer");

    if (!posts || posts.length === 0) {
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

      tableHtml += `
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
              <button
                class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                onclick="Router.viewPost(${post.id})"
                title="查看詳情"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
              <button
                class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                onclick="Router.editPost(${post.id})"
                title="編輯"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              ${
                post.status === "draft" || post.status === "failed"
                  ? `
                <button
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  onclick="Router.publishPost(${post.id})"
                  title="發布"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              `
                  : ""
              }
              <button
                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                onclick="Router.deletePost(${post.id})"
                title="刪除"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </div>
    `;

    $container.html(tableHtml);
  }

  /**
   * 更新分頁資訊
   */
  updatePagination(pagination) {
    const $container = $("#paginationContainer");
    const $start = $("#paginationStart");
    const $end = $("#paginationEnd");
    const $total = $("#paginationTotal");
    const $prevBtn = $("#prevPageBtn");
    const $nextBtn = $("#nextPageBtn");

    if (pagination.total === 0) {
      $container.addClass("hidden");
      return;
    }

    $container.removeClass("hidden");

    // 更新顯示資訊
    const start = (pagination.current_page - 1) * pagination.per_page + 1;
    const end = Math.min(pagination.current_page * pagination.per_page, pagination.total);

    $start.text(start);
    $end.text(end);
    $total.text(pagination.total);

    // 更新按鈕狀態
    $prevBtn.prop("disabled", pagination.current_page <= 1);
    $nextBtn.prop("disabled", pagination.current_page >= pagination.pages);

    // 儲存當前頁面
    this.currentPostsPage = pagination.current_page;
    this.postsPageInfo = pagination;
  }

  /**
   * 綁定貼文頁面事件
   */
  bindPostsEvents() {
    // 新增貼文按鈕
    $(document).off("click", "#createPostBtn, #createFirstPostBtn");
    $(document).on("click", "#createPostBtn, #createFirstPostBtn", () => {
      this.showCreatePostModal();
    });

    // 重新載入按鈕
    $(document).off("click", "#refreshPostsBtn");
    $(document).on("click", "#refreshPostsBtn", () => {
      this.loadPostsData();
    });

    // 篩選器變化
    $(document).off("change", "#statusFilter");
    $(document).on("change", "#statusFilter", () => {
      this.currentPostsPage = 1;
      this.loadPostsData();
    });

    // 搜尋輸入
    let searchTimeout;
    $(document).off("input", "#searchInput");
    $(document).on("input", "#searchInput", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.currentPostsPage = 1;
        this.loadPostsData();
      }, 500);
    });

    // 分頁按鈕
    $(document).off("click", "#prevPageBtn");
    $(document).on("click", "#prevPageBtn", () => {
      if (this.currentPostsPage > 1) {
        this.currentPostsPage--;
        this.loadPostsData();
      }
    });

    $(document).off("click", "#nextPageBtn");
    $(document).on("click", "#nextPageBtn", () => {
      if (this.postsPageInfo && this.currentPostsPage < this.postsPageInfo.pages) {
        this.currentPostsPage++;
        this.loadPostsData();
      }
    });
  }

  /**
   * 顯示創建貼文模態框
   */
  showCreatePostModal() {
    const modalHtml = `
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

    Modal.show({
      title: "新增貼文",
      content: modalHtml,
      size: "lg",
      buttons: [
        {
          text: "取消",
          variant: "secondary",
          onClick: () => Modal.hide(),
        },
        {
          text: "儲存",
          variant: "primary",
          onClick: () => this.handleCreatePost(),
        },
      ],
    });

    // 綁定狀態變化事件
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
   * 處理創建貼文
   */
  async handleCreatePost() {
    try {
      const title = $("#postTitle").val().trim();
      const content = $("#postContent").val().trim();
      const status = $("#postStatus").val();
      const scheduledTime = $("#scheduledTime").val();

      if (!title || !content) {
        Notification.show("請填寫完整的貼文資訊", "error");
        return;
      }

      if (status === "scheduled" && !scheduledTime) {
        Notification.show("請選擇排程時間", "error");
        return;
      }

      const postData = {
        title,
        content,
        status,
      };

      if (status === "scheduled" && scheduledTime) {
        postData.scheduled_time = new Date(scheduledTime).toISOString();
      }

      const response = await fetch("/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Notification.show("貼文創建成功", "success");
        Modal.hide();
        this.loadPostsData();
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
   */
  async viewPost(postId) {
    try {
      const response = await fetch(`/posts/${postId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        const post = result.data;
        const createdDate = new Date(post.created_time).toLocaleString("zh-TW");
        const updatedDate = new Date(post.updated_time).toLocaleString("zh-TW");

        const modalHtml = `
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
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  ${this.getStatusBadge(post.status)}
                </span>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">建立時間</h3>
                <p class="text-sm text-gray-900 dark:text-white">${createdDate}</p>
              </div>
            </div>

            ${
              post.engagement_stats && Object.keys(post.engagement_stats).length > 0
                ? `
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">互動數據</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
                    <p class="text-sm text-blue-600 dark:text-blue-400">按讚數</p>
                    <p class="text-xl font-semibold text-blue-900 dark:text-blue-100">${post.engagement_stats.likes || 0}</p>
                  </div>
                  <div class="bg-green-50 dark:bg-green-900 rounded-lg p-3">
                    <p class="text-sm text-green-600 dark:text-green-400">留言數</p>
                    <p class="text-xl font-semibold text-green-900 dark:text-green-100">${post.engagement_stats.comments || 0}</p>
                  </div>
                  <div class="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-3">
                    <p class="text-sm text-yellow-600 dark:text-yellow-400">分享數</p>
                    <p class="text-xl font-semibold text-yellow-900 dark:text-yellow-100">${post.engagement_stats.shares || 0}</p>
                  </div>
                  <div class="bg-purple-50 dark:bg-purple-900 rounded-lg p-3">
                    <p class="text-sm text-purple-600 dark:text-purple-400">觀看數</p>
                    <p class="text-xl font-semibold text-purple-900 dark:text-purple-100">${post.engagement_stats.views || 0}</p>
                  </div>
                </div>
              </div>
            `
                : ""
            }
          </div>
        `;

        Modal.show({
          title: "貼文詳情",
          content: modalHtml,
          size: "lg",
          buttons: [
            {
              text: "關閉",
              variant: "secondary",
              onClick: () => Modal.hide(),
            },
            {
              text: "編輯",
              variant: "primary",
              onClick: () => {
                Modal.hide();
                this.editPost(postId);
              },
            },
          ],
        });
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
   */
  async editPost(postId) {
    try {
      const response = await fetch(`/posts/${postId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        const post = result.data;

        const modalHtml = `
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

        Modal.show({
          title: "編輯貼文",
          content: modalHtml,
          size: "lg",
          buttons: [
            {
              text: "取消",
              variant: "secondary",
              onClick: () => Modal.hide(),
            },
            {
              text: "儲存",
              variant: "primary",
              onClick: () => this.handleUpdatePost(postId),
            },
          ],
        });

        // 綁定狀態變化事件
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
   */
  async handleUpdatePost(postId) {
    try {
      const title = $("#editPostTitle").val().trim();
      const content = $("#editPostContent").val().trim();
      const status = $("#editPostStatus").val();
      const scheduledTime = $("#editScheduledTime").val();

      if (!title || !content) {
        Notification.show("請填寫完整的貼文資訊", "error");
        return;
      }

      if (status === "scheduled" && !scheduledTime) {
        Notification.show("請選擇排程時間", "error");
        return;
      }

      const postData = {
        title,
        content,
        status,
      };

      if (status === "scheduled" && scheduledTime) {
        postData.scheduled_time = new Date(scheduledTime).toISOString();
      }

      const response = await fetch(`/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Notification.show("貼文更新成功", "success");
        Modal.hide();
        this.loadPostsData();
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
   */
  async publishPost(postId) {
    try {
      const response = await fetch(`/posts/${postId}/publish`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Notification.show("貼文發布成功", "success");
        this.loadPostsData();
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
      const response = await fetch(`/posts/${postId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Notification.show("貼文刪除成功", "success");
        this.loadPostsData();
      } else {
        throw new Error(result.message || "刪除貼文失敗");
      }
    } catch (error) {
      console.error("刪除貼文失敗:", error);
      Notification.show("刪除貼文失敗: " + error.message, "error");
    }
  }

  /**
   * 獲取狀態徽章
   */
  getStatusBadge(status) {
    const badges = {
      published: '<span class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">已發布</span>',
      scheduled: '<span class="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">已排程</span>',
      draft: '<span class="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">草稿</span>',
      failed: '<span class="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium">發布失敗</span>',
    };
    return badges[status] || badges.draft;
  }
}

// 創建全局路由器實例
window.Router = new Router();

// 對於模組系統的導出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Router };
}
