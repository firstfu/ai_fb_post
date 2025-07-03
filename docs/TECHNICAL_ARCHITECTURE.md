# AI 自動化 Facebook 發文系統 - Streamlit 技術架構文件

## 1. 系統整體架構概覽

### 1.1 Streamlit MVP 架構

```
┌─────────────────────────────────────────────────────────────┐
│                   Streamlit Web 應用架構                     │
├─────────────────────────────────────────────────────────────┤
│  🌐 Web 瀏覽器 (Chrome/Firefox/Safari/Edge)                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                   Streamlit 框架層                           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ 📊 儀表板   │ │ 📝 貼文管理 │ │ ➕ 創建貼文 │            │
│ │   頁面      │ │    頁面     │ │    頁面     │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ 🔍 貼文詳情 │ │ ✏️ 編輯頁面 │ │ 🧭 導航系統 │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    核心業務邏輯層                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ PostManager │ │ 數據驗證    │ │ 狀態管理    │            │
│ │ 貼文管理器  │ │ (Pydantic)  │ │ (Session)   │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ 數據處理    │ │ 可視化引擎  │ │ 輔助函數    │            │
│ │ (Pandas)    │ │ (Plotly)    │ │ (Utils)     │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      數據存儲層                             │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              JSON 文件存儲系統                           │ │
│ │  📄 posts.json - 貼文數據 │ 🗂️ data/ - 數據目錄        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技術棧組成

```
應用層：Streamlit Framework (Web UI + 後端邏輯)
├── 前端組件：st.* (UI 組件、表單、圖表)
├── 狀態管理：st.session_state (會話狀態)
├── 頁面路由：自定義路由系統
└── 事件處理：按鈕、表單提交事件

數據層：Python 數據生態系統
├── 數據模型：Pydantic (數據驗證和序列化)
├── 數據處理：Pandas (數據操作和分析)
├── 數據可視化：Plotly (交互式圖表)
└── 數據存儲：JSON (輕量級文件存儲)

基礎層：Python 運行環境
├── Python 3.8+ (核心運行環境)
├── 依賴管理：requirements.txt
└── 啟動腳本：start_app.py
```

## 2. 核心模組設計

### 2.1 Streamlit 應用主程式 (streamlit_app.py)

#### 2.1.1 應用配置與初始化

```python
# 頁面配置
st.set_page_config(
    page_title="AI 自動化 Facebook 發文系統",
    page_icon="📱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 自定義 CSS 樣式
st.markdown("""<style>...</style>""", unsafe_allow_html=True)

# 數據目錄和文件路徑配置
DATA_DIR = Path("data")
POSTS_FILE = DATA_DIR / "posts.json"
```

#### 2.1.2 數據模型定義

```python
class Post(BaseModel):
    """貼文數據模型"""
    id: int
    title: str
    content: str
    status: str = "draft"
    scheduled_time: Optional[str] = None
    created_time: str
    updated_time: str
    facebook_post_id: Optional[str] = None
    engagement_stats: Dict = {}
```

#### 2.1.3 貼文管理器 (PostManager)

```python
class PostManager:
    """核心業務邏輯類"""

    @staticmethod
    def load_posts() -> List[Post]:
        """載入貼文數據"""

    @staticmethod
    def save_posts(posts: List[Post]):
        """保存貼文數據"""

    @staticmethod
    def create_post(title: str, content: str, status: str,
                   scheduled_time: Optional[str] = None) -> Post:
        """創建新貼文"""

    @staticmethod
    def update_post(post_id: int, **kwargs) -> bool:
        """更新貼文"""

    @staticmethod
    def delete_post(post_id: int) -> bool:
        """刪除貼文"""

    @staticmethod
    def publish_post(post_id: int) -> bool:
        """發布貼文（模擬）"""
```

### 2.2 頁面組件設計

#### 2.2.1 儀表板頁面 (show_dashboard)

```python
def show_dashboard():
    """儀表板頁面 - 數據統計和可視化"""

    # 頁面標題
    st.markdown('<h1 class="main-header">📊 系統儀表板</h1>')

    # 載入數據
    posts = PostManager.load_posts()

    # 統計指標卡片
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("總貼文數", len(posts))
    # ... 其他指標

    # 數據可視化圖表
    fig_pie = px.pie(...)  # 狀態分布圓餅圖
    st.plotly_chart(fig_pie, use_container_width=True)

    fig_bar = px.bar(...)  # 互動數據比較圖
    st.plotly_chart(fig_bar, use_container_width=True)
```

#### 2.2.2 貼文管理頁面 (show_posts_list)

```python
def show_posts_list():
    """貼文管理頁面 - 列表、搜索、篩選"""

    # 頁面標題和操作區
    st.markdown('<h1 class="main-header">📝 貼文管理</h1>')

    # 搜索和篩選組件
    col1, col2 = st.columns([3, 1])
    with col1:
        search_query = st.text_input("🔍 搜索貼文")
    with col2:
        status_filter = st.selectbox("篩選狀態", ["all", "draft", ...])

    # 貼文列表顯示
    for post in filtered_posts:
        with st.container():
            # 貼文信息展示
            # 操作按鈕（查看、編輯、發布）
```

#### 2.2.3 創建貼文頁面 (show_create_post)

```python
def show_create_post():
    """創建貼文頁面 - 表單和數據提交"""

    # 表單組件
    with st.form("create_post_form"):
        title = st.text_input("貼文標題")
        content = st.text_area("貼文內容", height=150)
        status = st.selectbox("發布狀態", ["draft", "scheduled"])

        # 條件顯示排程時間
        if status == "scheduled":
            scheduled_date = st.date_input("排程日期")
            scheduled_time = st.time_input("排程時間")

        # 提交處理
        submitted = st.form_submit_button("📝 創建貼文")
        if submitted:
            # 數據驗證和創建邏輯
```

### 2.3 導航和狀態管理

#### 2.3.1 側邊欄導航系統

```python
# 導航選單
st.sidebar.title("🎯 導航選單")

pages = {
    "dashboard": "📊 儀表板",
    "posts_list": "📝 貼文管理",
    "create_post": "➕ 創建貼文"
}

for page_key, page_name in pages.items():
    if st.sidebar.button(page_name, key=f"nav_{page_key}"):
        st.session_state.page = page_key
        st.rerun()
```

#### 2.3.2 Session State 管理

```python
# 初始化 session state
if "page" not in st.session_state:
    st.session_state.page = "dashboard"

if "selected_post_id" not in st.session_state:
    st.session_state.selected_post_id = None

# 頁面路由
if st.session_state.page == "dashboard":
    show_dashboard()
elif st.session_state.page == "posts_list":
    show_posts_list()
# ...
```

## 3. 數據架構設計

### 3.1 數據模型結構

#### 3.1.1 Post 數據模型

```python
class Post(BaseModel):
    id: int                                    # 唯一識別碼
    title: str                                 # 貼文標題
    content: str                               # 貼文內容
    status: str = "draft"                      # 狀態枚舉
    scheduled_time: Optional[str] = None       # ISO 格式時間字串
    created_time: str                          # 創建時間
    updated_time: str                          # 最後更新時間
    facebook_post_id: Optional[str] = None     # Facebook API 返回的 ID
    engagement_stats: Dict = {}                # 互動統計數據

    class Config:
        # 允許任意類型，便於擴展
        arbitrary_types_allowed = True
```

#### 3.1.2 狀態枚舉定義

```python
class PostStatus:
    DRAFT = "draft"           # 草稿
    SCHEDULED = "scheduled"   # 已排程
    PUBLISHED = "published"   # 已發布
    FAILED = "failed"         # 發布失敗

STATUS_COLORS = {
    "draft": "⚪",
    "scheduled": "🟡",
    "published": "🟢",
    "failed": "🔴"
}

STATUS_TEXT = {
    "draft": "草稿",
    "scheduled": "已排程",
    "published": "已發布",
    "failed": "發布失敗"
}
```

### 3.2 數據存儲架構

#### 3.2.1 JSON 文件結構

```json
{
  "posts": [
    {
      "id": 1,
      "title": "範例貼文標題",
      "content": "這是一篇範例貼文的內容...",
      "status": "published",
      "scheduled_time": null,
      "created_time": "2024-01-20T10:00:00",
      "updated_time": "2024-01-20T10:30:00",
      "facebook_post_id": "fb_123456789",
      "engagement_stats": {
        "likes": 25,
        "comments": 5,
        "shares": 3,
        "views": 120
      }
    }
  ]
}
```

#### 3.2.2 文件操作邏輯

```python
class DataManager:
    """數據文件操作管理"""

    @staticmethod
    def ensure_data_directory():
        """確保數據目錄存在"""
        DATA_DIR.mkdir(exist_ok=True)

    @staticmethod
    def load_json_data() -> List[Dict]:
        """載入 JSON 數據"""
        if not POSTS_FILE.exists():
            return []

        try:
            with open(POSTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            st.error("數據文件格式錯誤")
            return []

    @staticmethod
    def save_json_data(data: List[Dict]):
        """保存數據到 JSON 文件"""
        DataManager.ensure_data_directory()

        try:
            with open(POSTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            st.error(f"保存數據失敗: {e}")
```

## 4. UI/UX 架構設計

### 4.1 Streamlit 組件架構

#### 4.1.1 佈局組件

```python
# 多欄佈局
col1, col2, col3 = st.columns([2, 1, 1])
col1, col2 = st.columns([3, 1])

# 容器組件
with st.container():
    st.markdown("### 內容區塊")

# 展開/收縮組件
with st.expander("詳細設定"):
    st.selectbox("選項", ["A", "B"])

# 側邊欄
with st.sidebar:
    st.title("導航選單")
```

#### 4.1.2 數據展示組件

```python
# 指標卡片
st.metric(
    label="總貼文數",
    value=total_posts,
    delta=f"+{new_posts} 新增"
)

# 數據表格
st.dataframe(df, use_container_width=True)

# 交互式圖表
fig = px.pie(values=values, names=names)
st.plotly_chart(fig, use_container_width=True)
```

#### 4.1.3 輸入組件

```python
# 文本輸入
title = st.text_input("標題", placeholder="請輸入標題")
content = st.text_area("內容", height=150)

# 選擇組件
status = st.selectbox("狀態", options=["draft", "published"])
date = st.date_input("日期")
time = st.time_input("時間")

# 按鈕組件
if st.button("提交", type="primary"):
    # 處理邏輯
    pass
```

### 4.2 響應式設計

#### 4.2.1 自適應佈局

```python
# 根據設備寬度調整欄數
import streamlit as st

def get_columns_count():
    """根據螢幕寬度決定欄數"""
    # Streamlit 會自動適配，但可以通過 CSS 自定義
    return 4 if st.get_option("browser.gatherUsageStats") else 2

# 動態欄位配置
cols = st.columns(get_columns_count())
```

#### 4.2.2 CSS 自定義樣式

```css
<style>
/* 主標題樣式 */
.main-header {
    font-size: 2.5rem;
    font-weight: bold;
    color: #1f77b4;
    text-align: center;
    margin-bottom: 2rem;
}

/* 指標卡片樣式 */
.metric-card {
    background-color: #f0f2f6;
    padding: 1rem;
    border-radius: 0.5rem;
    border-left: 4px solid #1f77b4;
}

/* 狀態標籤樣式 */
.status-published { color: #28a745; font-weight: bold; }
.status-draft { color: #6c757d; font-weight: bold; }
.status-scheduled { color: #ffc107; font-weight: bold; }
.status-failed { color: #dc3545; font-weight: bold; }

/* 響應式設計 */
@media (max-width: 768px) {
    .main-header { font-size: 1.8rem; }
}
</style>
```

## 5. 性能優化架構

### 5.1 數據快取策略

#### 5.1.1 Streamlit 內建快取

```python
@st.cache_data(ttl=300)  # 5分鐘快取
def load_posts_cached() -> List[Post]:
    """快取的貼文載入函數"""
    return PostManager.load_posts()

@st.cache_data
def generate_dashboard_stats(posts: List[Post]) -> Dict:
    """快取的統計數據生成"""
    return {
        "total": len(posts),
        "published": len([p for p in posts if p.status == "published"]),
        # ...
    }
```

#### 5.1.2 會話級快取

```python
def get_posts_from_session() -> List[Post]:
    """從 session state 獲取貼文，避免重複載入"""
    if "posts_cache" not in st.session_state:
        st.session_state.posts_cache = PostManager.load_posts()
    return st.session_state.posts_cache

def invalidate_posts_cache():
    """清除貼文快取"""
    if "posts_cache" in st.session_state:
        del st.session_state.posts_cache
```

### 5.2 數據載入優化

#### 5.2.1 懶載入策略

```python
def show_posts_list_optimized():
    """優化的貼文列表顯示"""
    posts = get_posts_from_session()

    # 分頁顯示
    posts_per_page = 10
    total_pages = (len(posts) - 1) // posts_per_page + 1

    if "current_page" not in st.session_state:
        st.session_state.current_page = 1

    # 只顯示當前頁的貼文
    start_idx = (st.session_state.current_page - 1) * posts_per_page
    end_idx = start_idx + posts_per_page
    current_posts = posts[start_idx:end_idx]

    # 渲染當前頁貼文
    for post in current_posts:
        render_post_item(post)
```

#### 5.2.2 增量更新

```python
def update_post_optimized(post_id: int, **kwargs):
    """優化的貼文更新"""
    # 直接更新 session state 中的數據
    if "posts_cache" in st.session_state:
        posts = st.session_state.posts_cache
        for post in posts:
            if post.id == post_id:
                for key, value in kwargs.items():
                    setattr(post, key, value)
                post.updated_time = datetime.now().isoformat()
                break

    # 異步保存到文件
    PostManager.save_posts(st.session_state.posts_cache)
```

## 6. 錯誤處理架構

### 6.1 異常處理策略

#### 6.1.1 數據操作異常

```python
def safe_load_posts() -> List[Post]:
    """安全的貼文載入"""
    try:
        return PostManager.load_posts()
    except FileNotFoundError:
        st.warning("數據文件不存在，將創建新的數據文件")
        return []
    except json.JSONDecodeError:
        st.error("數據文件格式錯誤，請檢查文件內容")
        return []
    except Exception as e:
        st.error(f"載入數據時發生未知錯誤：{e}")
        return []

def safe_save_posts(posts: List[Post]) -> bool:
    """安全的貼文保存"""
    try:
        PostManager.save_posts(posts)
        return True
    except PermissionError:
        st.error("沒有權限寫入數據文件，請檢查文件權限")
        return False
    except Exception as e:
        st.error(f"保存數據時發生錯誤：{e}")
        return False
```

#### 6.1.2 用戶輸入驗證

```python
def validate_post_input(title: str, content: str) -> List[str]:
    """驗證貼文輸入"""
    errors = []

    if not title.strip():
        errors.append("標題不能為空")
    elif len(title) > 200:
        errors.append("標題長度不能超過 200 字符")

    if not content.strip():
        errors.append("內容不能為空")
    elif len(content) > 10000:
        errors.append("內容長度不能超過 10000 字符")

    return errors

def show_validation_errors(errors: List[str]):
    """顯示驗證錯誤"""
    if errors:
        for error in errors:
            st.error(f"❌ {error}")
        return True
    return False
```

### 6.2 用戶反饋機制

#### 6.2.1 操作狀態提示

```python
def show_operation_feedback(operation: str, success: bool, message: str = ""):
    """顯示操作反饋"""
    if success:
        st.success(f"✅ {operation}成功！{message}")
        st.balloons()  # 慶祝動畫
    else:
        st.error(f"❌ {operation}失敗：{message}")

# 使用示例
def create_post_with_feedback(title: str, content: str, status: str):
    """帶反饋的貼文創建"""
    try:
        post = PostManager.create_post(title, content, status)
        show_operation_feedback("創建貼文", True, f"貼文 ID: {post.id}")
        return post
    except Exception as e:
        show_operation_feedback("創建貼文", False, str(e))
        return None
```

#### 6.2.2 載入狀態指示

```python
def show_loading_spinner(operation: str):
    """顯示載入指示器"""
    return st.spinner(f"正在{operation}...")

# 使用示例
def load_posts_with_spinner():
    """帶載入指示的貼文載入"""
    with show_loading_spinner("載入貼文數據"):
        time.sleep(0.5)  # 模擬載入時間
        return PostManager.load_posts()
```

## 7. 安全架構考量

### 7.1 輸入安全

#### 7.1.1 XSS 防護

```python
import html
from markupsafe import escape

def sanitize_user_input(text: str) -> str:
    """清理用戶輸入"""
    # HTML 編碼
    sanitized = html.escape(text)
    # 移除潛在危險字符
    sanitized = re.sub(r'[<>"\']', '', sanitized)
    return sanitized.strip()

def safe_markdown_display(content: str):
    """安全的 Markdown 顯示"""
    # 使用 Streamlit 的安全 HTML 渲染
    safe_content = escape(content)
    st.markdown(safe_content, unsafe_allow_html=False)
```

### 7.2 數據安全

#### 7.2.1 文件權限控制

```python
import stat
import os

def secure_file_permissions():
    """設置安全的文件權限"""
    if POSTS_FILE.exists():
        # 設置文件權限為 600 (僅所有者可讀寫)
        os.chmod(POSTS_FILE, stat.S_IRUSR | stat.S_IWUSR)

def validate_file_integrity():
    """驗證文件完整性"""
    if not POSTS_FILE.exists():
        return True

    try:
        with open(POSTS_FILE, 'r', encoding='utf-8') as f:
            json.load(f)
        return True
    except json.JSONDecodeError:
        st.error("數據文件已損壞，請恢復備份或重新初始化")
        return False
```

## 8. 擴展架構設計

### 8.1 模組化設計

#### 8.1.1 功能模組分離

```python
# 未來可分離的模組結構
"""
src/
├── core/
│   ├── models.py          # 數據模型
│   ├── data_manager.py    # 數據管理
│   └── validators.py      # 數據驗證
├── ui/
│   ├── dashboard.py       # 儀表板頁面
│   ├── posts.py          # 貼文管理頁面
│   └── components.py      # 公共組件
├── services/
│   ├── facebook_api.py    # Facebook API 整合
│   ├── ai_generator.py    # AI 內容生成
│   └── scheduler.py       # 排程服務
└── utils/
    ├── helpers.py         # 輔助函數
    └── constants.py       # 常數定義
"""
```

#### 8.1.2 插件架構預留

```python
class PluginInterface:
    """插件接口定義"""

    def get_name(self) -> str:
        """獲取插件名稱"""
        raise NotImplementedError

    def initialize(self):
        """初始化插件"""
        pass

    def process_post(self, post: Post) -> Post:
        """處理貼文"""
        return post

class PluginManager:
    """插件管理器"""

    def __init__(self):
        self.plugins = []

    def register_plugin(self, plugin: PluginInterface):
        """註冊插件"""
        self.plugins.append(plugin)

    def apply_plugins(self, post: Post) -> Post:
        """應用所有插件"""
        for plugin in self.plugins:
            post = plugin.process_post(post)
        return post
```

### 8.2 API 整合預留

#### 8.2.1 外部服務接口

```python
from abc import ABC, abstractmethod

class ContentGeneratorInterface(ABC):
    """內容生成器接口"""

    @abstractmethod
    def generate_content(self, prompt: str, **kwargs) -> str:
        """生成內容"""
        pass

class FacebookAPIInterface(ABC):
    """Facebook API 接口"""

    @abstractmethod
    def publish_post(self, content: str, **kwargs) -> str:
        """發布貼文"""
        pass

    @abstractmethod
    def get_post_stats(self, post_id: str) -> Dict:
        """獲取貼文統計"""
        pass

# 未來實現示例
class OpenAIGenerator(ContentGeneratorInterface):
    def generate_content(self, prompt: str, **kwargs) -> str:
        # 整合 OpenAI API
        pass

class FacebookGraphAPI(FacebookAPIInterface):
    def publish_post(self, content: str, **kwargs) -> str:
        # 整合 Facebook Graph API
        pass
```

## 9. 部署架構

### 9.1 本地部署

#### 9.1.1 環境配置

```python
# 環境變數配置
import os
from pathlib import Path

class Config:
    """應用配置類"""

    # 基礎配置
    APP_NAME = "AI 自動化 Facebook 發文系統"
    VERSION = "1.0.0"

    # 路徑配置
    BASE_DIR = Path(__file__).parent
    DATA_DIR = BASE_DIR / "data"
    LOGS_DIR = BASE_DIR / "logs"

    # Streamlit 配置
    STREAMLIT_PORT = int(os.getenv("STREAMLIT_PORT", 8501))
    STREAMLIT_HOST = os.getenv("STREAMLIT_HOST", "localhost")

    # 功能開關
    ENABLE_ANALYTICS = os.getenv("ENABLE_ANALYTICS", "true").lower() == "true"
    ENABLE_FACEBOOK_API = os.getenv("ENABLE_FACEBOOK_API", "false").lower() == "true"
```

#### 9.1.2 啟動腳本優化

```python
# start_app.py 增強版
import subprocess
import sys
import webbrowser
from pathlib import Path

def check_python_version():
    """檢查 Python 版本"""
    if sys.version_info < (3, 8):
        print("❌ 需要 Python 3.8 或更高版本")
        return False
    return True

def install_dependencies():
    """安裝依賴"""
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        return True
    except subprocess.CalledProcessError:
        return False

def start_streamlit():
    """啟動 Streamlit 應用"""
    config = Config()

    cmd = [
        sys.executable, "-m", "streamlit", "run",
        "streamlit_app.py",
        "--server.port", str(config.STREAMLIT_PORT),
        "--server.headless", "false",
        "--browser.gatherUsageStats", "false"
    ]

    subprocess.run(cmd)

if __name__ == "__main__":
    if check_python_version() and install_dependencies():
        start_streamlit()
```

### 9.2 Docker 容器化 (未來擴展)

#### 9.2.1 Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health

CMD ["streamlit", "run", "streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

#### 9.2.2 docker-compose.yml

```yaml
version: "3.8"

services:
  streamlit-app:
    build: .
    ports:
      - "8501:8501"
    volumes:
      - ./data:/app/data
    environment:
      - STREAMLIT_PORT=8501
      - ENABLE_ANALYTICS=true
    restart: unless-stopped
```

## 10. 監控和日誌架構

### 10.1 應用監控

#### 10.1.1 性能監控

```python
import time
import functools

def monitor_performance(func):
    """性能監控裝飾器"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()

        execution_time = end_time - start_time
        if execution_time > 1.0:  # 超過1秒的操作記錄
            st.warning(f"操作 {func.__name__} 耗時 {execution_time:.2f} 秒")

        return result
    return wrapper

@monitor_performance
def load_posts():
    """被監控的載入函數"""
    return PostManager.load_posts()
```

#### 10.1.2 錯誤追蹤

```python
import logging
import traceback

def setup_logging():
    """設置日誌"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('logs/app.log'),
            logging.StreamHandler()
        ]
    )

def log_error(error: Exception, context: str = ""):
    """記錄錯誤"""
    logger = logging.getLogger(__name__)
    logger.error(f"錯誤發生在 {context}: {str(error)}")
    logger.error(f"詳細信息: {traceback.format_exc()}")
```

## 結論

這個 Streamlit 技術架構文件詳細描述了 AI 自動化 Facebook 發文系統的完整技術實現。通過採用 Streamlit 單體應用架構，系統在保持功能完整性的同時，大大簡化了開發和部署的複雜度，為未來的功能擴展和技術升級提供了堅實的基礎。

---

**版本**: 2.0.0 (Streamlit MVP)
**最後更新**: 2024-01-20
**文檔維護**: AI Assistant
