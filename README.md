# AI 自動化 Facebook 發文系統 - Streamlit MVP

## 📋 專案概述

**AI 自動化 Facebook 發文系統** 是一個基於 Streamlit 開發的現代化社群媒體管理平台。此系統提供完整的 Facebook 貼文生命週期管理，從內容創建、智能編輯、定時發布到深度數據分析，為社交媒體營運人員打造一站式解決方案。

![Python](https://img.shields.io/badge/python-v3.8+-blue.svg)
![Streamlit](https://img.shields.io/badge/streamlit-v1.29+-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 主要功能

### 📊 智能儀表板

- 📈 **實時統計概覽**: 貼文數量、發布狀態、互動數據一目了然
- 🥧 **視覺化圖表**: 狀態分布圓餅圖、互動數據比較圖
- 📅 **趨勢分析**: 發文效果追蹤，優化內容策略
- 🔄 **即時更新**: 數據自動同步，無需手動刷新

### 📝 貼文管理系統

- ✏️ **創建貼文**: 直觀的編輯界面，支持富文本內容
- 📋 **批量管理**: 批量操作，提升工作效率
- 🔍 **智能搜索**: 關鍵字搜索，快速定位目標貼文
- 🏷️ **狀態篩選**: 按發布狀態分類管理
- 👁️ **詳情預覽**: 完整的貼文詳情展示

### 📅 排程發布功能

- ⏰ **靈活排程**: 自由設定發布時間
- 📆 **批量排程**: 一次設定多篇貼文的發布時間
- 🔔 **狀態提醒**: 即時顯示排程狀態
- 🚀 **一鍵發布**: 模擬 Facebook 發布流程

### 📊 數據分析與洞察

- 💝 **互動統計**: 按讚、留言、分享、瀏覽數據統計
- 📈 **效果分析**: 多維度數據比較和趨勢分析
- 🎯 **性能監控**: 貼文表現實時監控
- 📋 **報告生成**: 詳細的數據分析報告

## 🚀 快速開始

### 系統需求

- Python 3.8 或更高版本
- 現代瀏覽器 (Chrome, Firefox, Safari, Edge)

### 安裝步驟

1. **克隆專案**

   ```bash
   git clone <repository-url>
   cd ai_fb_post
   ```

2. **安裝依賴**

   ```bash
   pip install -r requirements.txt
   ```

3. **配置 AI 設定 (可選)**

   如果您的應用使用 AI 功能，請設定配置檔案：

   ```bash
   # 複製範例配置檔案
   cp data/ai_config.json.example data/ai_config.json

   # 編輯配置檔案，填入您的 API 金鑰
   nano data/ai_config.json
   ```

   ⚠️ **重要提醒**: `ai_config.json` 包含敏感的 API 金鑰，此檔案已被 `.gitignore` 忽略，絕不會被提交到版本控制。

4. **啟動應用**

   **方式一：使用啟動腳本 (推薦)**

   ```bash
   python start_app.py
   ```

   **方式二：直接啟動 Streamlit**

   ```bash
   streamlit run streamlit_app.py
   ```

   **方式三：自定義端口**

   ```bash
   streamlit run streamlit_app.py --server.port 8502
   ```

5. **訪問應用**
   - 默認地址：http://localhost:8501
   - 應用會自動在瀏覽器中打開

## 📁 專案結構

```
ai_fb_post/
├── streamlit_app.py          # 主應用程式
├── start_app.py              # 啟動腳本
├── requirements.txt          # Python 依賴
├── README.md                 # 專案說明 (本文件)
├── README_STREAMLIT.md       # 詳細使用說明
├── data/                     # 數據存儲目錄
│   ├── posts.json           # 貼文數據文件
│   ├── ai_config.json       # AI 配置檔案 (需自行創建，含 API 金鑰)
│   └── ai_config.json.example # AI 配置範例檔案
├── docs/                     # 文檔目錄
└── .gitignore               # Git 忽略文件
```

## 🎯 使用指南

### 基本操作流程

1. **首次使用**

   - 啟動應用後會自動創建示例數據
   - 可以立即開始體驗各項功能

2. **創建貼文**

   - 點擊側邊欄「➕ 創建貼文」
   - 填寫標題和內容
   - 選擇發布狀態（草稿或排程）
   - 點擊「創建貼文」按鈕

3. **管理貼文**

   - 在「📝 貼文管理」頁面查看所有貼文
   - 使用篩選器按狀態分類
   - 使用搜索框快速查找
   - 點擊操作按鈕進行編輯、查看或發布

4. **查看統計**
   - 在「📊 儀表板」查看整體數據
   - 分析貼文表現和互動趨勢
   - 制定內容優化策略

### 進階功能

#### 貼文狀態說明

- 📝 **草稿**: 尚未發布的貼文，可以繼續編輯
- ⏰ **已排程**: 設定了發布時間的貼文，等待自動發布
- ✅ **已發布**: 已成功發布到 Facebook 的貼文
- ❌ **發布失敗**: 發布過程中出現錯誤的貼文

#### 數據分析功能

- **互動統計**: 追蹤每篇貼文的按讚、留言、分享和瀏覽數
- **趨勢分析**: 比較不同貼文的表現，找出最佳內容類型
- **效果評估**: 根據數據調整內容策略

## 🛠️ 技術架構

### 核心技術棧

- **前端框架**: Streamlit - 快速構建數據應用
- **數據處理**: Pandas - 高效數據操作和分析
- **數據可視化**: Plotly - 交互式圖表和視覺化
- **數據驗證**: Pydantic - 數據模型和驗證
- **數據存儲**: JSON - 輕量級數據持久化

### 架構特點

- 🔧 **單文件架構**: 所有功能集中在一個主文件中
- 💾 **檔案存儲**: 使用 JSON 格式存儲數據，易於備份和遷移
- 🔄 **即時更新**: 操作後立即反映變化
- 📱 **響應式設計**: 適配桌面和移動設備
- 🎨 **現代 UI**: 清晰直觀的用戶界面

## 📊 功能特色

### 用戶體驗

- 🎯 **直觀操作**: 簡潔明瞭的操作流程
- ⚡ **快速響應**: 即時數據更新和操作反饋
- 🌈 **視覺豐富**: 豐富的圖標和色彩設計
- 📱 **跨平台**: 支援各種設備和瀏覽器

### 數據管理

- 💾 **自動保存**: 操作自動保存，防止數據丟失
- 🔒 **數據安全**: 本地存儲，保護隱私安全
- 📈 **數據分析**: 深度數據洞察和趋势分析
- 🔄 **數據同步**: 實時數據更新機制

### 開發友好

- 🐍 **純 Python**: 基於 Python 生態系統
- 🔧 **易於擴展**: 模組化設計，便於功能擴展
- 📝 **完整文檔**: 詳細的代碼註釋和使用說明
- 🧪 **快速開發**: Streamlit 框架支持快速原型開發

## 🔧 自定義配置

### AI 配置設定

如果您的應用使用 AI 功能，需要設定 `data/ai_config.json`：

```json
{
  "openai_api_key": "your_openai_api_key_here",
  "anthropic_api_key": "your_anthropic_api_key_here",
  "default_model": "gpt-4o-mini",
  "image_model": "dall-e-3",
  "temperature": 0.7,
  "max_tokens": 1000,
  "enable_image_generation": true
}
```

🔒 **安全提醒**:

- `ai_config.json` 檔案包含敏感的 API 金鑰
- 此檔案已被 `.gitignore` 保護，不會被提交到版本控制
- 請妥善保管您的 API 金鑰，避免洩露
- 可以使用 `ai_config.json.example` 作為範本

### 數據存儲位置

默認數據存儲在 `data/posts.json`，您可以：

- 備份此文件以保存所有貼文數據
- 清空此文件以重置應用數據
- 修改 `streamlit_app.py` 中的路徑配置

### 應用設定

在 `streamlit_app.py` 中可以調整：

- 頁面標題和圖標
- 主題色彩配置
- 默認數據設定
- 功能模組開關

## 🚧 開發計劃

### 近期功能 (v1.1)

- [ ] **AI 內容生成**: 整合 AI 生成貼文內容
- [ ] **模板系統**: 貼文模板管理功能
- [ ] **標籤系統**: 貼文分類和標籤功能
- [ ] **導出功能**: 數據導出和備份功能

### 中期功能 (v1.5)

- [ ] **真實 API 整合**: 實際 Facebook API 連接
- [ ] **用戶系統**: 多用戶支持和權限管理
- [ ] **自動化排程**: 智能發布時間建議
- [ ] **高級分析**: 更深入的數據分析功能

### 長期規劃 (v2.0)

- [ ] **多平台支持**: 支持 Instagram、Twitter 等平台
- [ ] **企業版功能**: 團隊協作和企業級功能
- [ ] **移動應用**: 專用移動應用開發
- [ ] **AI 智能助手**: 全面的 AI 輔助功能

## 🐛 故障排除

### 常見問題

**1. 應用無法啟動**

```bash
# 檢查 Python 版本
python --version  # 需要 3.8+

# 重新安裝依賴
pip install -r requirements.txt --force-reinstall
```

**2. 端口被占用**

```bash
# 使用不同端口
streamlit run streamlit_app.py --server.port 8502
```

**3. 數據無法保存**

```bash
# 檢查目錄權限
ls -la data/
# 重新創建數據目錄
rm -rf data/ && mkdir data
```

**4. 瀏覽器無法打開**

- 手動訪問 http://localhost:8501
- 檢查防火牆設定
- 嘗試不同的瀏覽器

### 重置應用

```bash
# 完全重置數據
rm -rf data/
# 重新啟動應用
python start_app.py
```

### 日誌查看

Streamlit 會在終端顯示詳細的運行日誌，如遇問題請查看相關錯誤信息。

## 📄 授權條款

本專案採用 MIT 授權條款，詳情請查看 [LICENSE](LICENSE) 文件。

## 🤝 貢獻指南

歡迎提交 Issues 和 Pull Requests！

### 開發環境設置

1. Fork 本專案
2. 創建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代碼規範

- 遵循 PEP 8 Python 代碼規範
- 添加適當的註釋和文檔字串
- 確保所有功能都有適當的錯誤處理

## 📞 聯絡資訊

- **專案維護者**: AI Assistant
- **電子郵件**: [聯絡郵箱]
- **專案網址**: [GitHub/GitLab 連結]

## 🙏 致謝

感謝以下開源專案的支持：

- [Streamlit](https://streamlit.io/) - 優秀的數據應用框架
- [Plotly](https://plotly.com/) - 強大的數據可視化庫
- [Pandas](https://pandas.pydata.org/) - 數據處理的瑞士軍刀
- [Pydantic](https://pydantic-docs.helpmanual.io/) - 數據驗證和設定管理

---

**版本**: 1.0.0
**最後更新**: 2024-01-20
**授權**: MIT License

🚀 **立即開始使用，體驗智能化的 Facebook 發文管理！**
