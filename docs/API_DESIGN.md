# AI 自動化 Facebook 發文系統 - Streamlit 組件與數據模型設計

## 1. 文檔概述

本文檔詳細描述 AI 自動化 Facebook 發文系統 Streamlit MVP 版本的組件設計、數據模型和 API 接口。由於採用 Streamlit 單體應用架構，本文檔重點關注 Streamlit 組件的使用、數據模型的定義以及內部 API 的設計。

## 2. 數據模型設計

### 2.1 核心數據模型

#### 2.1.1 Post 貼文模型

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, List
from datetime import datetime

class Post(BaseModel):
    """貼文數據模型

    用於定義和驗證貼文的所有屬性，確保數據的一致性和完整性。
    """

    id: int = Field(..., description="貼文唯一識別碼")
    title: str = Field(..., min_length=1, max_length=200, description="貼文標題")
    content: str = Field(..., min_length=1, max_length=10000, description="貼文內容")
    status: str = Field(default="draft", description="貼文狀態")
    scheduled_time: Optional[str] = Field(None, description="排程發布時間 (ISO格式)")
    created_time: str = Field(..., description="創建時間 (ISO格式)")
    updated_time: str = Field(..., description="最後更新時間 (ISO格式)")
    facebook_post_id: Optional[str] = Field(None, description="Facebook 貼文 ID")
    engagement_stats: Dict = Field(default_factory=dict, description="互動統計數據")

    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['draft', 'scheduled', 'published', 'failed']
        if v not in allowed_statuses:
            raise ValueError(f'狀態必須是: {", ".join(allowed_statuses)}')
        return v

    @validator('scheduled_time')
    def validate_scheduled_time(cls, v, values):
        if values.get('status') == 'scheduled' and not v:
            raise ValueError('排程狀態必須設定排程時間')
        return v

    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "title": "AI 發文系統介紹",
                "content": "這是一個功能強大的 AI 自動化發文系統...",
                "status": "published",
                "scheduled_time": None,
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
        }
```

#### 2.1.2 狀態和常數定義

```python
from enum import Enum

class PostStatus(str, Enum):
    """貼文狀態枚舉"""
    DRAFT = "draft"          # 草稿
    SCHEDULED = "scheduled"   # 已排程
    PUBLISHED = "published"   # 已發布
    FAILED = "failed"         # 發布失敗

class PostConstants:
    """貼文相關常數"""

    # 狀態對應的顏色和文字
    STATUS_COLORS = {
        PostStatus.DRAFT: "⚪",
        PostStatus.SCHEDULED: "🟡",
        PostStatus.PUBLISHED: "🟢",
        PostStatus.FAILED: "🔴"
    }

    STATUS_TEXT = {
        PostStatus.DRAFT: "草稿",
        PostStatus.SCHEDULED: "已排程",
        PostStatus.PUBLISHED: "已發布",
        PostStatus.FAILED: "發布失敗"
    }

    # 貼文限制
    MAX_TITLE_LENGTH = 200
    MAX_CONTENT_LENGTH = 10000
    MIN_CONTENT_LENGTH = 1

    # 分頁設定
    POSTS_PER_PAGE = 10
    MAX_POSTS_PER_PAGE = 50
```

#### 2.1.3 數據傳輸對象 (DTO)

```python
class CreatePostRequest(BaseModel):
    """創建貼文請求模型"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)
    status: PostStatus = Field(default=PostStatus.DRAFT)
    scheduled_time: Optional[str] = None

class UpdatePostRequest(BaseModel):
    """更新貼文請求模型"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    status: Optional[PostStatus] = None
    scheduled_time: Optional[str] = None

class PostFilterRequest(BaseModel):
    """貼文篩選請求模型"""
    status: Optional[PostStatus] = None
    search_query: Optional[str] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=10, ge=1, le=50)

class PostStatsResponse(BaseModel):
    """貼文統計響應模型"""
    total_posts: int
    draft_count: int
    scheduled_count: int
    published_count: int
    failed_count: int
    engagement_summary: Dict[str, int]
```

## 3. Streamlit 組件設計

### 3.1 頁面組件架構

#### 3.1.1 主應用組件 (main)

```python
def main():
    """主應用入口

    負責初始化應用狀態、設置導航和路由到相應頁面。
    """

    # 初始化示例數據
    init_sample_data()

    # 初始化 session state
    if "page" not in st.session_state:
        st.session_state.page = "dashboard"

    # 設置側邊欄導航
    setup_sidebar_navigation()

    # 路由到對應頁面
    route_to_page()

def setup_sidebar_navigation():
    """設置側邊欄導航"""
    st.sidebar.title("🎯 導航選單")

    pages = {
        "dashboard": "📊 儀表板",
        "posts_list": "📝 貼文管理",
        "create_post": "➕ 創建貼文"
    }

    for page_key, page_name in pages.items():
        if st.sidebar.button(page_name, key=f"nav_{page_key}"):
            st.session_state.page = page_key
            if 'selected_post_id' in st.session_state:
                del st.session_state.selected_post_id
            st.rerun()

def route_to_page():
    """頁面路由"""
    page = st.session_state.get("page", "dashboard")

    if page == "dashboard":
        show_dashboard()
    elif page == "posts_list":
        show_posts_list()
    elif page == "create_post":
        show_create_post()
    elif page == "post_detail":
        show_post_detail()
    elif page == "edit_post":
        show_edit_post()
    else:
        st.error("未知頁面")
```

#### 3.1.2 儀表板組件

```python
def show_dashboard():
    """儀表板頁面組件

    顯示系統統計、圖表和關鍵指標。
    """

    st.markdown('<h1 class="main-header">📊 系統儀表板</h1>',
                unsafe_allow_html=True)

    posts = PostManager.load_posts()

    if not posts:
        show_empty_state("目前沒有任何貼文，請先創建一些貼文。")
        return

    # 顯示統計指標
    render_metrics_cards(posts)

    # 顯示圖表
    render_dashboard_charts(posts)

def render_metrics_cards(posts: List[Post]):
    """渲染指標卡片"""
    stats = calculate_post_stats(posts)

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("總貼文數", stats['total'])
    with col2:
        st.metric("已發布", stats['published'],
                 delta=f"+{stats['published_delta']}")
    with col3:
        st.metric("草稿", stats['draft'])
    with col4:
        st.metric("已排程", stats['scheduled'])

def render_dashboard_charts(posts: List[Post]):
    """渲染儀表板圖表"""

    # 狀態分布圓餅圖
    st.subheader("📈 貼文狀態分布")
    fig_pie = create_status_pie_chart(posts)
    st.plotly_chart(fig_pie, use_container_width=True)

    # 互動數據比較圖
    st.subheader("📊 貼文互動數據")
    fig_bar = create_engagement_bar_chart(posts)
    st.plotly_chart(fig_bar, use_container_width=True)
```

#### 3.1.3 貼文管理組件

```python
def show_posts_list():
    """貼文管理頁面組件

    顯示貼文列表，支持搜索、篩選和批量操作。
    """

    st.markdown('<h1 class="main-header">📝 貼文管理</h1>',
                unsafe_allow_html=True)

    # 渲染篩選控件
    filter_params = render_filter_controls()

    # 載入和篩選貼文
    posts = PostManager.load_posts()
    filtered_posts = apply_filters(posts, filter_params)

    if not filtered_posts:
        show_empty_state("沒有符合條件的貼文")
        return

    # 渲染貼文列表
    render_posts_list(filtered_posts)

def render_filter_controls() -> Dict:
    """渲染篩選控件"""
    col1, col2 = st.columns([3, 1])

    with col1:
        search_query = st.text_input("🔍 搜索貼文",
                                   placeholder="輸入標題或內容關鍵字")

    with col2:
        status_filter = st.selectbox(
            "篩選狀態",
            ["all"] + [status.value for status in PostStatus],
            format_func=lambda x: "全部" if x == "all" else PostConstants.STATUS_TEXT.get(x, x)
        )

    return {
        "search_query": search_query,
        "status_filter": status_filter if status_filter != "all" else None
    }

def render_posts_list(posts: List[Post]):
    """渲染貼文列表"""
    for post in posts:
        render_post_item(post)

def render_post_item(post: Post):
    """渲染單個貼文項目"""
    with st.container():
        col1, col2, col3, col4 = st.columns([3, 1, 1, 2])

        with col1:
            st.markdown(f"**{post.title}**")
            content_preview = (post.content[:100] + '...'
                             if len(post.content) > 100
                             else post.content)
            st.markdown(content_preview)

        with col2:
            status_color = PostConstants.STATUS_COLORS[post.status]
            status_text = PostConstants.STATUS_TEXT[post.status]
            st.markdown(f"{status_color} {status_text}")

        with col3:
            created_time = datetime.fromisoformat(post.created_time)
            st.markdown(f"📅 {created_time.strftime('%m-%d %H:%M')}")

        with col4:
            render_post_actions(post)

        st.divider()

def render_post_actions(post: Post):
    """渲染貼文操作按鈕"""
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("👁️", help="查看", key=f"view_{post.id}"):
            navigate_to_post_detail(post.id)

    with col2:
        if st.button("✏️", help="編輯", key=f"edit_{post.id}"):
            navigate_to_edit_post(post.id)

    with col3:
        if post.status != PostStatus.PUBLISHED:
            if st.button("🚀", help="發布", key=f"publish_{post.id}"):
                publish_post_with_feedback(post.id)
```

#### 3.1.4 表單組件

```python
def show_create_post():
    """創建貼文頁面組件"""

    st.markdown('<h1 class="main-header">📝 創建新貼文</h1>',
                unsafe_allow_html=True)

    render_post_form()

def render_post_form(post: Optional[Post] = None, is_edit: bool = False):
    """渲染貼文表單"""

    # 設定表單標識
    form_key = "edit_post_form" if is_edit else "create_post_form"
    submit_label = "更新貼文" if is_edit else "創建貼文"

    with st.form(form_key):
        # 標題輸入
        title = st.text_input(
            "貼文標題",
            value=post.title if post else "",
            max_chars=PostConstants.MAX_TITLE_LENGTH,
            placeholder="請輸入吸引人的標題..."
        )

        # 內容輸入
        content = st.text_area(
            "貼文內容",
            value=post.content if post else "",
            height=150,
            max_chars=PostConstants.MAX_CONTENT_LENGTH,
            placeholder="請輸入貼文內容..."
        )

        # 狀態和排程設定
        col1, col2 = st.columns(2)

        with col1:
            status = st.selectbox(
                "發布狀態",
                [PostStatus.DRAFT, PostStatus.SCHEDULED],
                index=0 if not post else list(PostStatus).index(post.status),
                format_func=lambda x: PostConstants.STATUS_TEXT[x]
            )

        with col2:
            scheduled_time = None
            if status == PostStatus.SCHEDULED:
                scheduled_date = st.date_input("排程日期")
                scheduled_time_input = st.time_input("排程時間")

                if scheduled_date and scheduled_time_input:
                    scheduled_datetime = datetime.combine(
                        scheduled_date, scheduled_time_input)
                    scheduled_time = scheduled_datetime.strftime("%Y-%m-%d %H:%M")

        # 提交按鈕
        submitted = st.form_submit_button(submit_label, type="primary")

        if submitted:
            handle_form_submission(
                title, content, status, scheduled_time, post, is_edit)
```

### 3.2 工具組件設計

#### 3.2.1 數據可視化組件

```python
def create_status_pie_chart(posts: List[Post]) -> go.Figure:
    """創建狀態分布圓餅圖"""

    status_counts = {}
    for post in posts:
        status_text = PostConstants.STATUS_TEXT[post.status]
        status_counts[status_text] = status_counts.get(status_text, 0) + 1

    fig = px.pie(
        values=list(status_counts.values()),
        names=list(status_counts.keys()),
        title="貼文狀態分布",
        color_discrete_map={
            "草稿": "#6c757d",
            "已排程": "#ffc107",
            "已發布": "#28a745",
            "發布失敗": "#dc3545"
        }
    )

    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(showlegend=True, height=400)

    return fig

def create_engagement_bar_chart(posts: List[Post]) -> go.Figure:
    """創建互動數據比較圖"""

    published_posts = [p for p in posts if p.status == PostStatus.PUBLISHED]

    if not published_posts:
        # 返回空圖表
        fig = go.Figure()
        fig.add_annotation(
            text="暫無已發布貼文的互動數據",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False
        )
        return fig

    # 準備數據
    titles = [p.title[:20] + '...' if len(p.title) > 20 else p.title
              for p in published_posts]
    likes = [p.engagement_stats.get('likes', 0) for p in published_posts]
    comments = [p.engagement_stats.get('comments', 0) for p in published_posts]
    shares = [p.engagement_stats.get('shares', 0) for p in published_posts]

    # 創建圖表
    fig = go.Figure()

    fig.add_trace(go.Bar(name='按讚', x=titles, y=likes, marker_color='#1f77b4'))
    fig.add_trace(go.Bar(name='留言', x=titles, y=comments, marker_color='#ff7f0e'))
    fig.add_trace(go.Bar(name='分享', x=titles, y=shares, marker_color='#2ca02c'))

    fig.update_layout(
        title="貼文互動數據比較",
        xaxis_title="貼文",
        yaxis_title="互動數量",
        barmode='group',
        height=400
    )

    return fig
```

#### 3.2.2 UI 輔助組件

```python
def show_empty_state(message: str, icon: str = "📝"):
    """顯示空狀態"""
    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        st.markdown(f"""
        <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">{icon}</div>
            <div style="font-size: 1.2rem; color: #666;">{message}</div>
        </div>
        """, unsafe_allow_html=True)

def show_loading_indicator(message: str = "載入中..."):
    """顯示載入指示器"""
    return st.spinner(message)

def show_success_message(message: str):
    """顯示成功消息"""
    st.success(f"✅ {message}")
    st.balloons()

def show_error_message(message: str):
    """顯示錯誤消息"""
    st.error(f"❌ {message}")

def show_warning_message(message: str):
    """顯示警告消息"""
    st.warning(f"⚠️ {message}")

def show_info_message(message: str):
    """顯示信息消息"""
    st.info(f"ℹ️ {message}")
```

## 4. 業務邏輯 API 設計

### 4.1 PostManager 核心 API

```python
class PostManager:
    """貼文管理器 - 核心業務邏輯"""

    @staticmethod
    def load_posts() -> List[Post]:
        """載入所有貼文

        Returns:
            List[Post]: 貼文列表

        Raises:
            FileNotFoundError: 數據文件不存在
            json.JSONDecodeError: 數據格式錯誤
        """
        if not POSTS_FILE.exists():
            return []

        try:
            with open(POSTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [Post(**post_data) for post_data in data]
        except Exception as e:
            st.error(f"載入貼文數據失敗: {e}")
            return []

    @staticmethod
    def save_posts(posts: List[Post]) -> bool:
        """保存貼文列表

        Args:
            posts: 要保存的貼文列表

        Returns:
            bool: 保存是否成功
        """
        try:
            DATA_DIR.mkdir(exist_ok=True)

            with open(POSTS_FILE, 'w', encoding='utf-8') as f:
                json.dump([post.model_dump() for post in posts],
                         f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            st.error(f"保存貼文數據失敗: {e}")
            return False

    @staticmethod
    def create_post(title: str, content: str, status: str = "draft",
                   scheduled_time: Optional[str] = None) -> Optional[Post]:
        """創建新貼文

        Args:
            title: 貼文標題
            content: 貼文內容
            status: 貼文狀態
            scheduled_time: 排程時間

        Returns:
            Optional[Post]: 創建成功返回貼文對象，失敗返回 None
        """
        try:
            posts = PostManager.load_posts()
            next_id = PostManager.get_next_id(posts)

            now = datetime.now().isoformat()
            post = Post(
                id=next_id,
                title=title,
                content=content,
                status=status,
                scheduled_time=scheduled_time,
                created_time=now,
                updated_time=now
            )

            posts.append(post)

            if PostManager.save_posts(posts):
                return post
            return None

        except Exception as e:
            st.error(f"創建貼文失敗: {e}")
            return None

    @staticmethod
    def update_post(post_id: int, **kwargs) -> bool:
        """更新貼文

        Args:
            post_id: 貼文 ID
            **kwargs: 要更新的欄位

        Returns:
            bool: 更新是否成功
        """
        try:
            posts = PostManager.load_posts()

            for post in posts:
                if post.id == post_id:
                    # 更新指定欄位
                    for key, value in kwargs.items():
                        if hasattr(post, key):
                            setattr(post, key, value)

                    # 更新時間
                    post.updated_time = datetime.now().isoformat()

                    return PostManager.save_posts(posts)

            st.error(f"找不到 ID 為 {post_id} 的貼文")
            return False

        except Exception as e:
            st.error(f"更新貼文失敗: {e}")
            return False
```

### 4.2 輔助 API 函數

```python
def get_status_color(status: str) -> str:
    """獲取狀態對應的顏色圖標"""
    return PostConstants.STATUS_COLORS.get(status, "❓")

def get_status_text(status: str) -> str:
    """獲取狀態對應的中文文本"""
    return PostConstants.STATUS_TEXT.get(status, "未知狀態")

def calculate_post_stats(posts: List[Post]) -> Dict[str, int]:
    """計算貼文統計數據"""
    stats = {
        "total": len(posts),
        "draft": 0,
        "scheduled": 0,
        "published": 0,
        "failed": 0,
        "published_delta": 0  # 可以添加與上期對比的邏輯
    }

    for post in posts:
        if post.status in stats:
            stats[post.status] += 1

    return stats

def apply_filters(posts: List[Post], filters: Dict) -> List[Post]:
    """應用篩選條件"""
    filtered = posts

    # 狀態篩選
    if filters.get("status_filter"):
        filtered = [p for p in filtered if p.status == filters["status_filter"]]

    # 搜索篩選
    if filters.get("search_query"):
        query = filters["search_query"].lower()
        filtered = [p for p in filtered
                   if query in p.title.lower() or query in p.content.lower()]

    return filtered

def validate_post_data(title: str, content: str, status: str) -> List[str]:
    """驗證貼文數據"""
    errors = []

    if not title.strip():
        errors.append("標題不能為空")
    elif len(title) > PostConstants.MAX_TITLE_LENGTH:
        errors.append(f"標題長度不能超過 {PostConstants.MAX_TITLE_LENGTH} 字符")

    if not content.strip():
        errors.append("內容不能為空")
    elif len(content) > PostConstants.MAX_CONTENT_LENGTH:
        errors.append(f"內容長度不能超過 {PostConstants.MAX_CONTENT_LENGTH} 字符")

    if status not in [s.value for s in PostStatus]:
        errors.append("無效的貼文狀態")

    return errors
```

## 5. Session State 管理

### 5.1 狀態結構設計

```python
class SessionStateManager:
    """Session State 管理器"""

    @staticmethod
    def initialize_session_state():
        """初始化 session state"""

        # 頁面導航狀態
        if "page" not in st.session_state:
            st.session_state.page = "dashboard"

        # 選中的貼文 ID
        if "selected_post_id" not in st.session_state:
            st.session_state.selected_post_id = None

        # 表單狀態
        if "form_data" not in st.session_state:
            st.session_state.form_data = {}

        # 篩選狀態
        if "filter_settings" not in st.session_state:
            st.session_state.filter_settings = {
                "search_query": "",
                "status_filter": "all"
            }

        # 分頁狀態
        if "pagination" not in st.session_state:
            st.session_state.pagination = {
                "current_page": 1,
                "per_page": 10
            }

    @staticmethod
    def clear_form_data():
        """清除表單數據"""
        st.session_state.form_data = {}

    @staticmethod
    def navigate_to_page(page: str, **kwargs):
        """導航到指定頁面"""
        st.session_state.page = page

        # 設置額外參數
        for key, value in kwargs.items():
            setattr(st.session_state, key, value)

        st.rerun()
```

## 6. 錯誤處理和驗證

### 6.1 輸入驗證策略

```python
class ValidationError(Exception):
    """驗證錯誤異常"""
    pass

def validate_and_create_post(title: str, content: str, status: str,
                           scheduled_time: Optional[str] = None) -> Post:
    """驗證並創建貼文"""

    # 輸入驗證
    errors = validate_post_data(title, content, status)
    if errors:
        raise ValidationError("; ".join(errors))

    # 排程時間驗證
    if status == PostStatus.SCHEDULED:
        if not scheduled_time:
            raise ValidationError("排程狀態必須設定排程時間")

        try:
            scheduled_dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
            if scheduled_dt <= datetime.now():
                raise ValidationError("排程時間必須在未來")
        except ValueError:
            raise ValidationError("排程時間格式錯誤")

    # 創建貼文
    post = PostManager.create_post(title, content, status, scheduled_time)
    if not post:
        raise ValidationError("創建貼文失敗")

    return post
```

## 7. 未來擴展接口

### 7.1 插件系統接口

```python
from abc import ABC, abstractmethod

class StreamlitComponentPlugin(ABC):
    """Streamlit 組件插件接口"""

    @abstractmethod
    def get_name(self) -> str:
        """獲取插件名稱"""
        pass

    @abstractmethod
    def render_component(self, **kwargs):
        """渲染組件"""
        pass

    @abstractmethod
    def handle_events(self, event_data: Dict):
        """處理事件"""
        pass

class PostProcessorPlugin(ABC):
    """貼文處理插件接口"""

    @abstractmethod
    def process_before_save(self, post: Post) -> Post:
        """保存前處理"""
        pass

    @abstractmethod
    def process_before_publish(self, post: Post) -> Post:
        """發布前處理"""
        pass
```

---

**版本**: 2.0.0 (Streamlit MVP)
**最後更新**: 2024-01-20
**文檔維護**: AI Assistant
