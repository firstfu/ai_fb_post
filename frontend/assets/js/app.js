/*
 * AI 自動化 Facebook 發文系統 - 主應用程式
 *
 * 功能：
 * - 應用程式初始化
 * - 頁面路由管理
 * - 狀態管理
 * - 事件處理
 *
 * 作者：AI Auto Poster 團隊
 * 更新時間：2024-01-01
 * 使用技術：jQuery + Tailwind CSS
 */

class FacebookAutoPoser {
  constructor() {
    this.currentUser = null;
    this.currentPage = "auth";
    this.isAuthenticated = false;
    this.theme = localStorage.getItem("theme") || "light";

    // 確保 DOM 載入完成後初始化
    $(document).ready(() => {
      this.init();
    });
  }

  /**
   * 應用程式初始化
   */
  async init() {
    console.log("🚀 正在初始化 AI 自動化 Facebook 發文系統...");

    try {
      // 設置主題
      this.setTheme(this.theme);

      // 檢查認證狀態
      await this.checkAuthStatus();

      // 初始化事件監聽器
      this.initEventListeners();

      // 初始化路由
      this.initRouter();

      // 隱藏載入畫面
      this.hideLoadingScreen();

      console.log("✅ 應用程式初始化完成");
    } catch (error) {
      console.error("❌ 應用程式初始化失敗:", error);
      this.showNotification("應用程式初始化失敗", "error");
      this.hideLoadingScreen();
    }
  }

  /**
   * 檢查認證狀態
   */
  async checkAuthStatus() {
    const token = localStorage.getItem("access_token");

    if (token) {
      try {
        // 驗證令牌是否有效
        const response = await API.get("/users/profile");

        if (response.success) {
          this.currentUser = response.data;
          this.isAuthenticated = true;
          this.currentPage = "dashboard";
          return true;
        }
      } catch (error) {
        console.log("令牌驗證失敗，清除本地存儲");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }

    this.isAuthenticated = false;
    this.currentPage = "auth";
    return false;
  }

  /**
   * 初始化事件監聽器
   */
  initEventListeners() {
    // 認證表單切換
    $("#showRegister").on("click", e => {
      e.preventDefault();
      this.switchAuthForm("register");
    });

    $("#showLogin").on("click", e => {
      e.preventDefault();
      this.switchAuthForm("login");
    });

    // 登入表單提交
    $("#loginForm").on("submit", e => {
      e.preventDefault();
      this.handleLogin(e);
    });

    // 註冊表單提交
    $("#registerForm").on("submit", e => {
      e.preventDefault();
      this.handleRegister(e);
    });

    // 導航連結點擊
    $(document).on("click", ".nav-link", e => {
      e.preventDefault();
      const route = $(e.currentTarget).data("route");
      if (route && window.Router) {
        window.Router.navigate(route);
      }
    });

    // 主題切換
    $("#themeToggle").on("click", () => {
      this.toggleTheme();
    });

    // 用戶選單
    $("#userMenuBtn").on("click", e => {
      e.stopPropagation();
      $("#userDropdown").toggleClass("hidden");
    });

    // 點擊外部關閉選單
    $(document).on("click", () => {
      $("#userDropdown").addClass("hidden");
    });

    $("#userDropdown").on("click", e => {
      e.stopPropagation();
    });

    // 登出
    $("#logout").on("click", e => {
      e.preventDefault();
      this.handleLogout();
    });

    // ESC 鍵關閉模態框
    $(document).on("keydown", e => {
      if (e.key === "Escape") {
        Modal.closeAll();
      }
    });
  }

  /**
   * 初始化路由
   */
  initRouter() {
    // 路由系統現在由 Router 類別處理
    // 這裡只需要設置認證狀態相關的顯示
    if (this.isAuthenticated) {
      this.showMainApp();
    } else {
      this.showAuthPage();
    }
  }

  /**
   * 切換認證表單
   */
  switchAuthForm(type) {
    if (type === "register") {
      $("#login-form").addClass("hidden");
      $("#register-form").removeClass("hidden");
    } else {
      $("#register-form").addClass("hidden");
      $("#login-form").removeClass("hidden");
    }
  }

  /**
   * 處理用戶登入
   */
  async handleLogin(event) {
    const $form = $(event.target);
    const formData = new FormData(event.target);
    const loginData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    // 基本驗證
    if (!loginData.email || !loginData.password) {
      this.showNotification("請填寫所有必填欄位", "warning");
      return;
    }

    try {
      // 顯示載入狀態
      const $submitBtn = $form.find('button[type="submit"]');
      const originalText = $submitBtn.text();
      $submitBtn.text("登入中...").prop("disabled", true);

      // 發送登入請求
      const response = await API.post("/auth/login", loginData);

      if (response.success) {
        // 保存令牌
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);

        // 更新用戶狀態
        this.currentUser = response.data.user;
        this.isAuthenticated = true;

        this.showNotification("登入成功！", "success");

        // 跳轉到主應用
        setTimeout(() => {
          this.showMainApp();
          if (window.Router) {
            window.Router.navigate("dashboard");
          }
        }, 1000);
      } else {
        this.showNotification(response.message || "登入失敗", "error");
      }
    } catch (error) {
      console.error("登入錯誤:", error);
      this.showNotification("登入失敗，請稍後再試", "error");
    } finally {
      // 恢復按鈕狀態
      const $submitBtn = $form.find('button[type="submit"]');
      $submitBtn.text($submitBtn.data("original-text") || "登入").prop("disabled", false);
    }
  }

  /**
   * 處理用戶註冊
   */
  async handleRegister(event) {
    const $form = $(event.target);
    const formData = new FormData(event.target);
    const registerData = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    // 基本驗證
    if (!registerData.username || !registerData.email || !registerData.password) {
      this.showNotification("請填寫所有必填欄位", "warning");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      this.showNotification("密碼確認不一致", "warning");
      return;
    }

    if (registerData.password.length < 8) {
      this.showNotification("密碼長度至少需要 8 個字符", "warning");
      return;
    }

    try {
      // 顯示載入狀態
      const $submitBtn = $form.find('button[type="submit"]');
      const originalText = $submitBtn.text();
      $submitBtn.text("註冊中...").prop("disabled", true);

      // 發送註冊請求
      const response = await API.post("/auth/register", {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        confirm_password: registerData.confirmPassword,
      });

      if (response.success) {
        this.showNotification("註冊成功！請登入您的帳號", "success");

        // 切換到登入表單
        setTimeout(() => {
          this.switchAuthForm("login");
        }, 1500);
      } else {
        this.showNotification(response.message || "註冊失敗", "error");
      }
    } catch (error) {
      console.error("註冊錯誤:", error);
      this.showNotification("註冊失敗，請稍後再試", "error");
    } finally {
      // 恢復按鈕狀態
      const $submitBtn = $form.find('button[type="submit"]');
      $submitBtn.text($submitBtn.data("original-text") || "註冊").prop("disabled", false);
    }
  }

  /**
   * 處理用戶登出
   */
  async handleLogout() {
    try {
      // 發送登出請求
      await API.delete("/auth/logout");
    } catch (error) {
      console.error("登出請求失敗:", error);
    } finally {
      // 清除本地狀態
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      this.currentUser = null;
      this.isAuthenticated = false;

      this.showNotification("已成功登出", "info");

      // 跳轉到認證頁面
      this.showAuthPage();
    }
  }

  /**
   * 頁面導航
   */
  navigateTo(page) {
    if (!this.isAuthenticated && page !== "auth") {
      this.showAuthPage();
      return;
    }

    this.currentPage = page;
    this.updateNavigation();
    this.loadPageContent(page);
  }

  /**
   * 更新導航狀態
   */
  updateNavigation() {
    // 更新側邊欄導航
    $(".nav-link").removeClass("bg-primary-50 text-primary-700 dark:bg-dark-700 dark:text-primary-400");
    $(`.nav-link[data-page="${this.currentPage}"]`).addClass("bg-primary-50 text-primary-700 dark:bg-dark-700 dark:text-primary-400");
  }

  /**
   * 載入頁面內容
   */
  async loadPageContent(page) {
    const $pageContent = $("#page-content");

    if (!$pageContent.length) {
      console.error("未找到頁面內容容器");
      return;
    }

    try {
      // 顯示載入狀態
      $pageContent.html(`
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin-slow mb-4 mx-auto"></div>
            <p class="text-gray-600 dark:text-dark-300">載入中...</p>
          </div>
        </div>
      `);

      let content = "";

      switch (page) {
        case "dashboard":
          content = await this.loadDashboard();
          break;
        case "posts":
          content = await this.loadPosts();
          break;
        case "content":
          content = await this.loadContentGeneration();
          break;
        case "analytics":
          content = await this.loadAnalytics();
          break;
        case "templates":
          content = await this.loadTemplates();
          break;
        case "facebook":
          content = await this.loadFacebookAccounts();
          break;
        case "settings":
          content = await this.loadSettings();
          break;
        default:
          content = this.renderNotFoundPage();
      }

      $pageContent.html(content);

      // 初始化頁面特定的功能
      this.initPageFeatures(page);
    } catch (error) {
      console.error(`載入頁面 ${page} 失敗:`, error);
      $pageContent.html(this.renderErrorPage());
    }
  }

  /**
   * 載入儀表板
   */
  async loadDashboard() {
    return `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">儀表板</h1>
        <p class="text-gray-600 dark:text-dark-300">歡迎回來，${this.currentUser?.username || "用戶"}！</p>
      </div>

      <!-- 統計卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="text-3xl">🎯</div>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide">本月發文</h3>
              <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">24</p>
              <p class="text-xs text-green-600">比上月增加 12%</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="text-3xl">👥</div>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide">總互動數</h3>
              <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">1,247</p>
              <p class="text-xs text-gray-500 dark:text-dark-400">按讚、留言、分享</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="text-3xl">📈</div>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide">互動率</h3>
              <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">5.2%</p>
              <p class="text-xs text-gray-500 dark:text-dark-400">平均互動率</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="text-3xl">⏰</div>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide">待發布</h3>
              <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">7</p>
              <p class="text-xs text-gray-500 dark:text-dark-400">排程中的貼文</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 主要內容區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 最近發文 -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">最近發文</h3>
            <div class="text-center py-12">
              <div class="text-6xl mb-4">📝</div>
              <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">暫無發文記錄</h4>
              <p class="text-gray-600 dark:text-dark-300 mb-6">開始創建您的第一篇 AI 生成貼文吧！</p>
              <button
                class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                onclick="Router.navigate('content')"
              >
                開始創建
              </button>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div>
          <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">快速操作</h3>
            <div class="space-y-3">
              <button
                class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                onclick="Router.navigate('content')"
              >
                <span class="mr-2">🤖</span>
                AI 生成內容
              </button>
              <button
                class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                onclick="Router.navigate('posts')"
              >
                <span class="mr-2">📝</span>
                管理貼文
              </button>
              <button
                class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                onclick="Router.navigate('facebook')"
              >
                <span class="mr-2">👥</span>
                連接 Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 載入貼文管理頁面
   */
  async loadPosts() {
    return `
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">貼文管理</h1>
          <p class="text-gray-600 dark:text-dark-300">管理您的所有 Facebook 貼文</p>
        </div>
        <button class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
          新增貼文
        </button>
      </div>

      <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-8">
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📝</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">尚無貼文</h3>
          <p class="text-gray-600 dark:text-dark-300">您還沒有創建任何貼文。點擊上方按鈕開始創建您的第一篇貼文。</p>
        </div>
      </div>
    `;
  }

  /**
   * 載入 AI 內容生成頁面
   */
  async loadContentGeneration() {
    return `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI 內容生成</h1>
        <p class="text-gray-600 dark:text-dark-300">使用 AI 技術自動生成高質量的 Facebook 貼文內容</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 內容設定 -->
        <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">內容設定</h3>
          <form id="contentGenerationForm" class="space-y-6">
            <div>
              <label for="topic" class="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">主題</label>
              <input
                type="text"
                id="topic"
                name="topic"
                class="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100"
                placeholder="例：健康飲食、科技趨勢、旅遊心得"
              />
            </div>

            <div>
              <label for="style" class="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">寫作風格</label>
              <select
                id="style"
                name="style"
                class="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100"
              >
                <option value="friendly">友善親切</option>
                <option value="professional">專業正式</option>
                <option value="humorous">幽默風趣</option>
                <option value="inspirational">激勵正向</option>
              </select>
            </div>

            <div>
              <label for="keywords" class="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">關鍵詞</label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                class="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100"
                placeholder="多個關鍵詞請用逗號分隔"
              />
            </div>

            <div>
              <label for="length" class="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">內容長度</label>
              <select
                id="length"
                name="length"
                class="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100"
              >
                <option value="short">簡短 (50-100字)</option>
                <option value="medium" selected>中等 (100-200字)</option>
                <option value="long">詳細 (200-300字)</option>
              </select>
            </div>

            <div class="flex space-x-6">
              <label class="flex items-center">
                <input type="checkbox" id="includeHashtags" name="includeHashtags" checked class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                <span class="ml-2 text-sm text-gray-700 dark:text-dark-300">包含 Hashtags</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="includeCTA" name="includeCTA" checked class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                <span class="ml-2 text-sm text-gray-700 dark:text-dark-300">包含行動呼籲</span>
              </label>
            </div>

            <button
              type="submit"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              <span class="mr-2">🤖</span>
              生成內容
            </button>
          </form>
        </div>

        <!-- 生成結果 -->
        <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">生成結果</h3>
          <div id="generatedContent" class="text-center py-12">
            <div class="text-6xl mb-4">🤖</div>
            <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">等待生成</h4>
            <p class="text-gray-600 dark:text-dark-300">填寫左側表單並點擊生成按鈕以創建 AI 內容</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 載入其他頁面的占位內容
   */
  async loadAnalytics() {
    return this.renderPlaceholderPage("分析報告", "此功能正在開發中...", "📊");
  }

  async loadTemplates() {
    return this.renderPlaceholderPage("模板管理", "此功能正在開發中...", "📄");
  }

  async loadFacebookAccounts() {
    return this.renderPlaceholderPage("Facebook 帳號", "此功能正在開發中...", "👥");
  }

  async loadSettings() {
    return this.renderPlaceholderPage("系統設定", "此功能正在開發中...", "⚙️");
  }

  /**
   * 渲染占位頁面
   */
  renderPlaceholderPage(title, description, icon) {
    return `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">${title}</h1>
      </div>
      <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-8">
        <div class="text-center py-12">
          <div class="text-6xl mb-4">${icon}</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
          <p class="text-gray-600 dark:text-dark-300">${description}</p>
        </div>
      </div>
    `;
  }

  /**
   * 渲染 404 頁面
   */
  renderNotFoundPage() {
    return `
      <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-8">
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">頁面未找到</h3>
          <p class="text-gray-600 dark:text-dark-300">請求的頁面不存在</p>
        </div>
      </div>
    `;
  }

  /**
   * 渲染錯誤頁面
   */
  renderErrorPage() {
    return `
      <div class="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-8">
        <div class="text-center py-12">
          <div class="text-6xl mb-4">❌</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">載入失敗</h3>
          <p class="text-gray-600 dark:text-dark-300">無法載入頁面內容，請稍後再試</p>
        </div>
      </div>
    `;
  }

  /**
   * 初始化頁面特定功能
   */
  initPageFeatures(page) {
    switch (page) {
      case "content":
        this.initContentGeneration();
        break;
      // 其他頁面的初始化...
    }
  }

  /**
   * 初始化內容生成功能
   */
  initContentGeneration() {
    $("#contentGenerationForm").on("submit", e => {
      e.preventDefault();
      this.handleContentGeneration(e);
    });
  }

  /**
   * 處理內容生成
   */
  async handleContentGeneration(event) {
    const $form = $(event.target);
    const formData = new FormData(event.target);
    const contentData = {
      topic: formData.get("topic"),
      style: formData.get("style"),
      keywords: formData
        .get("keywords")
        ?.split(",")
        .map(k => k.trim())
        .filter(k => k),
      length: formData.get("length"),
      include_hashtags: formData.get("includeHashtags") === "on",
      include_call_to_action: formData.get("includeCTA") === "on",
    };

    if (!contentData.topic) {
      this.showNotification("請輸入主題", "warning");
      return;
    }

    const $submitBtn = $form.find('button[type="submit"]');
    const originalText = $submitBtn.html();
    const $generatedContent = $("#generatedContent");

    try {
      // 顯示載入狀態
      $submitBtn.html('<span class="mr-2">🤖</span>生成中...').prop("disabled", true);

      $generatedContent.html(`
        <div class="text-center py-12">
          <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin-slow mb-4 mx-auto"></div>
          <p class="text-gray-600 dark:text-dark-300">AI 正在生成內容，請稍候...</p>
        </div>
      `);

      // 模擬 API 調用 (實際應該調用後端 API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模擬生成的內容
      const mockContent = `🌟 ${contentData.topic}小貼士分享！

今天想和大家聊聊關於${contentData.topic}的一些心得。在這個快節奏的時代，我們經常忽略了${contentData.topic}的重要性。

${contentData.keywords?.length ? `特別是在${contentData.keywords.join("、")}方面，` : ""}我們可以透過一些簡單的方法來改善生活品質。

你們對${contentData.topic}有什麼看法呢？歡迎在下方留言分享你的經驗！

${contentData.include_hashtags ? "#" + contentData.topic.replace(/\s+/g, "") + " #生活分享 #每日一課" : ""}`;

      $generatedContent.html(`
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">生成的內容：</h4>
            <div class="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 text-sm text-gray-900 dark:text-dark-100 whitespace-pre-line">
              ${mockContent}
            </div>
          </div>
          <div class="flex space-x-2">
            <button class="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded transition duration-200">儲存為草稿</button>
            <button class="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded transition duration-200">重新生成</button>
            <button class="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition duration-200">立即發布</button>
          </div>
          <div class="text-xs text-gray-500 dark:text-dark-400 text-center">
            字數：${mockContent.length} | 生成時間：2.3秒 | 風格：${contentData.style}
          </div>
        </div>
      `);

      this.showNotification("內容生成成功！", "success");
    } catch (error) {
      console.error("內容生成失敗:", error);
      $generatedContent.html(`
        <div class="text-center py-12">
          <div class="text-6xl mb-4">❌</div>
          <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">生成失敗</h4>
          <p class="text-gray-600 dark:text-dark-300">無法生成內容，請稍後再試</p>
        </div>
      `);
      this.showNotification("內容生成失敗", "error");
    } finally {
      $submitBtn.html(originalText).prop("disabled", false);
    }
  }

  /**
   * 顯示主應用
   */
  showMainApp() {
    $("#auth-page").addClass("hidden");
    $("#main-app").removeClass("hidden").addClass("grid");

    // 更新用戶資訊顯示
    if (this.currentUser) {
      $("#username").text(this.currentUser.username);
    }
  }

  /**
   * 顯示認證頁面
   */
  showAuthPage() {
    $("#main-app").addClass("hidden").removeClass("grid");
    $("#auth-page").removeClass("hidden");
  }

  /**
   * 隱藏載入畫面
   */
  hideLoadingScreen() {
    const $loadingScreen = $("#loading-screen");
    $loadingScreen.fadeOut(300);
  }

  /**
   * 切換主題
   */
  toggleTheme() {
    const newTheme = this.theme === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  /**
   * 設置主題
   */
  setTheme(theme) {
    this.theme = theme;

    if (theme === "dark") {
      $("html").addClass("dark");
    } else {
      $("html").removeClass("dark");
    }

    localStorage.setItem("theme", theme);

    // 更新主題切換按鈕圖標
    $(".theme-icon").text(theme === "light" ? "🌙" : "☀️");

    // 添加切換動畫效果
    $("#themeToggle")
      .addClass("scale-110")
      .delay(300)
      .queue(function () {
        $(this).removeClass("scale-110").dequeue();
      });
  }

  /**
   * 顯示通知
   */
  showNotification(message, type = "info") {
    Notification.show(message, type);
  }
}

// 當 DOM 載入完成後初始化應用
$(document).ready(() => {
  window.app = new FacebookAutoPoser();
});

// 導出應用實例供其他模組使用
window.FacebookAutoPoser = FacebookAutoPoser;
