# AI 自動化 Facebook 發文系統 - 前端

這是 AI 自動化 Facebook 發文系統的前端部分，採用純 HTML、CSS 和 JavaScript 技術棧實現。

## 📁 項目結構

```
frontend/
├── index.html              # 主入口頁面
├── test.html               # 功能測試頁面
├── README.md               # 項目說明文件
└── assets/                 # 靜態資源目錄
    ├── css/                # 樣式文件
    │   ├── main.css        # 主樣式文件
    │   ├── components.css  # 組件樣式
    │   ├── themes.css      # 主題樣式（暗色/亮色主題）
    │   ├── responsive.css  # 響應式樣式
    │   └── dashboard.css   # 儀表板專用樣式
    └── js/                 # JavaScript 文件
        ├── app.js          # 主應用程式
        ├── api.js          # API 請求處理
        ├── auth.js         # 認證管理
        ├── router.js       # 前端路由
        ├── utils.js        # 工具函數
        └── components/     # 組件模組
            ├── modal.js    # 模態框組件
            ├── notification.js # 通知組件
            ├── form.js     # 表單處理組件
            └── chart.js    # 圖表組件
```

## 🚀 功能特色

### 核心功能

- **單頁應用架構（SPA）**: 基於 Hash 路由的前端導航
- **響應式設計**: 適配桌面、平板、手機等多種設備
- **主題切換**: 支援亮色/暗色主題切換
- **組件化設計**: 模組化的可重用組件
- **無障礙支援**: 符合 WCAG 無障礙標準

### 用戶介面

- **認證系統**: 登入/註冊頁面
- **儀表板**: 系統概覽和統計數據
- **貼文管理**: 建立、編輯、管理 Facebook 貼文
- **AI 內容生成**: 使用 AI 輔助創作內容
- **分析報告**: 數據視覺化和效果分析
- **設定頁面**: 系統偏好和帳號設定

### 技術組件

- **API 客戶端**: 統一的 HTTP 請求處理
- **認證管理**: JWT token 管理和會話控制
- **表單驗證**: 即時驗證和錯誤處理
- **通知系統**: 用戶操作反饋
- **模態框**: 對話框和確認框
- **圖表展示**: 基於 Chart.js 的數據視覺化

## 🛠️ 開發環境

### 需求

- 現代瀏覽器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- HTTP 伺服器（用於本地開發）

### 快速開始

1. **啟動開發伺服器**

   ```bash
   # 在 frontend 目錄下
   python3 -m http.server 8080
   ```

2. **訪問應用**

   - 主應用: http://localhost:8080
   - 測試頁面: http://localhost:8080/test.html

3. **瀏覽器控制台**
   - 開啟瀏覽器開發者工具查看日誌和錯誤

### 功能測試

訪問 `test.html` 頁面進行功能測試：

- CSS 樣式測試
- JavaScript 模組測試
- 通知系統測試
- 模態框測試
- 表單驗證測試

## 📋 API 接口

前端需要後端提供以下 API 接口：

### 認證相關

- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/logout` - 用戶登出
- `GET /api/auth/validate` - 驗證 token

### 數據相關

- `GET /api/dashboard/stats` - 儀表板統計數據
- `GET /api/posts` - 獲取貼文列表
- `POST /api/posts` - 建立新貼文
- `GET /api/analytics` - 獲取分析數據

## 🎨 設計系統

### CSS 變數系統

前端使用 CSS 自定義屬性實現設計系統：

```css
:root {
  /* 顏色系統 */
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;

  /* 間距系統 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* 字體系統 */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}
```

### 組件類別

- `.btn` - 按鈕組件
- `.form-group` - 表單群組
- `.card` - 卡片容器
- `.modal` - 模態框
- `.notification` - 通知訊息

## 🔧 自訂與擴展

### 添加新頁面

1. 在 `router.js` 中註冊新路由
2. 實現頁面渲染方法
3. 添加導航連結

### 添加新組件

1. 在 `assets/js/components/` 下建立新文件
2. 實現組件類別
3. 在主頁面引入組件腳本

### 自訂樣式

1. 修改 CSS 變數調整設計系統
2. 在對應的 CSS 文件中添加樣式
3. 使用工具類別快速應用樣式

## 📱 響應式設計

前端採用行動優先的響應式設計：

- **手機**: < 768px
- **平板**: 768px - 1024px
- **桌面**: > 1024px

主要響應式特性：

- 可摺疊側邊欄
- 響應式網格系統
- 觸控友好的按鈕大小
- 行動裝置底部導航

## 🔐 安全性

### 前端安全措施

- XSS 防護：HTML 字符轉義
- 輸入驗證：表單數據驗證
- CSRF 防護：API 請求 token 驗證
- 安全標頭：Content Security Policy

### 最佳實踐

- 敏感數據不在前端暴露
- API 請求使用 HTTPS
- 用戶會話安全管理
- 定期清理本地存儲

## 🚀 部署

### 生產環境部署

1. **靜態文件託管**

   - 將 frontend 目錄內容上傳到 Web 伺服器
   - 配置 Nginx 或 Apache 靜態文件服務

2. **CDN 加速**

   - 將靜態資源上傳到 CDN
   - 更新資源路径配置

3. **環境配置**
   - 設定 API 基礎 URL
   - 配置生產環境變數

### Docker 部署

```dockerfile
FROM nginx:alpine
COPY frontend/ /usr/share/nginx/html/
EXPOSE 80
```

## 📝 開發注意事項

1. **瀏覽器兼容性**: 確保在主流瀏覽器中測試
2. **性能優化**: 使用圖片懶加載和代碼分割
3. **無障礙性**: 提供鍵盤導航和螢幕閱讀器支援
4. **錯誤處理**: 優雅處理網路錯誤和 API 失敗
5. **用戶體驗**: 提供載入狀態和操作反饋

## 📚 文檔參考

- [HTML5 規範](https://html.spec.whatwg.org/)
- [CSS Grid 指南](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [JavaScript ES6+ 特性](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Chart.js 文檔](https://www.chartjs.org/docs/)
- [Web 無障礙指南](https://www.w3.org/WAI/WCAG21/quickref/)

## 👥 貢獻

歡迎提交 Issue 和 Pull Request 來改進專案！

## 📄 授權

本專案採用 MIT 授權條款。
