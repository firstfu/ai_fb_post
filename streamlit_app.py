"""
AI 自動化 Facebook 發文系統 - Streamlit MVP

此 Streamlit 應用提供完整的 Facebook 發文管理系統：
- 📝 貼文內容管理 (創建、編輯、刪除)
- 📅 排程發文功能
- 📊 數據統計和可視化
- 🔍 貼文搜索和篩選
- 📈 互動數據分析

主要功能：
- 用戶友好的 Web 界面
- 即時數據更新
- 響應式設計
- 多狀態貼文管理
- 統計圖表展示

技術架構：
- Streamlit 前端框架
- Pydantic 數據驗證
- Plotly 數據可視化
- JSON 文件數據存儲

@fileoverview Facebook 發文系統 Streamlit 主程式
@version 1.0.0
@author AI Assistant
@created 2024-01-20

@requires streamlit>=1.29.0
@requires pydantic>=2.0.0
@requires pandas>=2.0.0
@requires plotly>=5.17.0
"""

import json
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel

# 頁面配置
st.set_page_config(
    page_title="AI 自動化 Facebook 發文系統",
    page_icon="📱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 自定義 CSS 樣式
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .status-published {
        color: #28a745;
        font-weight: bold;
    }
    .status-draft {
        color: #6c757d;
        font-weight: bold;
    }
    .status-scheduled {
        color: #ffc107;
        font-weight: bold;
    }
    .status-failed {
        color: #dc3545;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# 數據存儲設定
DATA_DIR = Path("data")
POSTS_FILE = DATA_DIR / "posts.json"
SETTINGS_FILE = DATA_DIR / "settings.json"

# 確保數據目錄存在
DATA_DIR.mkdir(exist_ok=True)

class Post(BaseModel):
    """貼文資料模型"""
    id: int
    title: str
    content: str
    status: str = "draft"  # draft, scheduled, published, failed
    scheduled_time: Optional[str] = None
    created_time: str
    updated_time: str
    facebook_post_id: Optional[str] = None
    engagement_stats: Dict = {}

class PostManager:
    """貼文管理器"""

    @staticmethod
    def load_posts() -> List[Post]:
        """載入貼文數據"""
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
    def save_posts(posts: List[Post]):
        """保存貼文數據"""
        try:
            with open(POSTS_FILE, 'w', encoding='utf-8') as f:
                json.dump([post.model_dump() for post in posts], f, ensure_ascii=False, indent=2)
        except Exception as e:
            st.error(f"保存貼文數據失敗: {e}")

    @staticmethod
    def get_next_id(posts: List[Post]) -> int:
        """獲取下一個可用的 ID"""
        if not posts:
            return 1
        return max([p.id for p in posts]) + 1

    @staticmethod
    def create_post(title: str, content: str, status: str = "draft", scheduled_time: Optional[str] = None) -> Post:
        """創建新貼文"""
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
        PostManager.save_posts(posts)
        return post

    @staticmethod
    def update_post(post_id: int, **updates) -> bool:
        """更新貼文"""
        posts = PostManager.load_posts()

        for post in posts:
            if post.id == post_id:
                for key, value in updates.items():
                    if hasattr(post, key) and value is not None:
                        setattr(post, key, value)
                post.updated_time = datetime.now().isoformat()
                PostManager.save_posts(posts)
                return True
        return False

    @staticmethod
    def delete_post(post_id: int) -> bool:
        """刪除貼文"""
        posts = PostManager.load_posts()
        original_length = len(posts)
        posts = [p for p in posts if p.id != post_id]

        if len(posts) < original_length:
            PostManager.save_posts(posts)
            return True
        return False

    @staticmethod
    def publish_post(post_id: int) -> bool:
        """發布貼文到 Facebook (模擬)"""
        posts = PostManager.load_posts()

        for post in posts:
            if post.id == post_id:
                post.status = "published"
                post.facebook_post_id = f"fb_{post_id}_{int(datetime.now().timestamp())}"
                post.updated_time = datetime.now().isoformat()

                # 模擬一些互動數據
                import random
                post.engagement_stats = {
                    "likes": random.randint(10, 500),
                    "comments": random.randint(5, 100),
                    "shares": random.randint(1, 50),
                    "views": random.randint(100, 2000)
                }

                PostManager.save_posts(posts)
                return True
        return False

def init_sample_data():
    """初始化示例數據"""
    posts = PostManager.load_posts()
    if not posts:
        # 創建一些示例貼文
        sample_posts = [
            {
                "title": "AI 生成的精彩內容",
                "content": "這是一篇由 AI 自動生成的 Facebook 貼文內容，包含豐富的行銷元素和吸引人的文案。🚀 #AI #SocialMedia",
                "status": "published"
            },
            {
                "title": "自動化發文測試",
                "content": "測試自動化發文系統的功能，包含排程發布和即時監控。📅 #Automation #Testing",
                "status": "scheduled"
            },
            {
                "title": "Facebook 行銷策略",
                "content": "分享最新的 Facebook 行銷策略和技巧，幫助提升粉絲互動率。📊 #Marketing #Strategy",
                "status": "draft"
            }
        ]

        for sample in sample_posts:
            PostManager.create_post(**sample)

        # 為已發布的貼文添加一些互動數據
        posts = PostManager.load_posts()
        for post in posts:
            if post.status == "published":
                PostManager.publish_post(post.id)

def get_status_color(status: str) -> str:
    """獲取狀態對應的顏色"""
    colors = {
        "published": "🟢",
        "draft": "⚪",
        "scheduled": "🟡",
        "failed": "🔴"
    }
    return colors.get(status, "❓")

def get_status_text(status: str) -> str:
    """獲取狀態對應的中文文本"""
    texts = {
        "published": "已發布",
        "draft": "草稿",
        "scheduled": "已排程",
        "failed": "發布失敗"
    }
    return texts.get(status, status)

def show_dashboard():
    """顯示儀表板頁面"""
    st.markdown('<h1 class="main-header">📊 系統儀表板</h1>', unsafe_allow_html=True)

    posts = PostManager.load_posts()

    if not posts:
        st.info("目前沒有任何貼文，請先創建一些貼文。")
        return

    # 統計數據
    total_posts = len(posts)
    published_posts = [p for p in posts if p.status == "published"]
    draft_posts = [p for p in posts if p.status == "draft"]
    scheduled_posts = [p for p in posts if p.status == "scheduled"]
    failed_posts = [p for p in posts if p.status == "failed"]

    # 顯示統計卡片
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("總貼文數", total_posts)
    with col2:
        st.metric("已發布", len(published_posts))
    with col3:
        st.metric("草稿", len(draft_posts))
    with col4:
        st.metric("已排程", len(scheduled_posts))

    # 狀態分布圓餅圖
    if posts:
        st.subheader("📈 貼文狀態分布")

        status_counts = {}
        for post in posts:
            status_text = get_status_text(post.status)
            status_counts[status_text] = status_counts.get(status_text, 0) + 1

        fig_pie = px.pie(
            values=list(status_counts.values()),
            names=list(status_counts.keys()),
            title="貼文狀態分布"
        )
        st.plotly_chart(fig_pie, use_container_width=True)

    # 互動數據統計
    if published_posts:
        st.subheader("💝 互動數據統計")

        total_likes = sum(p.engagement_stats.get("likes", 0) for p in published_posts)
        total_comments = sum(p.engagement_stats.get("comments", 0) for p in published_posts)
        total_shares = sum(p.engagement_stats.get("shares", 0) for p in published_posts)
        total_views = sum(p.engagement_stats.get("views", 0) for p in published_posts)

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("總按讚數", total_likes)
        with col2:
            st.metric("總留言數", total_comments)
        with col3:
            st.metric("總分享數", total_shares)
        with col4:
            st.metric("總瀏覽數", total_views)

        # 互動數據圖表
        engagement_data = []
        for post in published_posts:
            engagement_data.append({
                "貼文": post.title[:20] + "..." if len(post.title) > 20 else post.title,
                "按讚": post.engagement_stats.get("likes", 0),
                "留言": post.engagement_stats.get("comments", 0),
                "分享": post.engagement_stats.get("shares", 0),
                "瀏覽": post.engagement_stats.get("views", 0)
            })

        if engagement_data:
            df = pd.DataFrame(engagement_data)
            fig_bar = px.bar(
                df,
                x="貼文",
                y=["按讚", "留言", "分享"],
                title="各貼文互動數據比較",
                barmode="group"
            )
            st.plotly_chart(fig_bar, use_container_width=True)

def show_posts_list():
    """顯示貼文列表頁面"""
    st.markdown('<h1 class="main-header">📝 貼文管理</h1>', unsafe_allow_html=True)

    posts = PostManager.load_posts()

    # 篩選選項
    col1, col2, col3 = st.columns([2, 2, 1])

    with col1:
        status_filter = st.selectbox(
            "篩選狀態",
            ["全部", "已發布", "草稿", "已排程", "發布失敗"],
            key="status_filter"
        )

    with col2:
        search_term = st.text_input("搜索貼文", placeholder="輸入標題或內容關鍵字...", key="search_term")

    with col3:
        st.write("")  # 空間佔位
        if st.button("🔄 重新載入", key="refresh_posts"):
            st.rerun()

    # 篩選貼文
    filtered_posts = posts

    if status_filter != "全部":
        status_map = {
            "已發布": "published",
            "草稿": "draft",
            "已排程": "scheduled",
            "發布失敗": "failed"
        }
        filtered_posts = [p for p in filtered_posts if p.status == status_map[status_filter]]

    if search_term:
        filtered_posts = [
            p for p in filtered_posts
            if search_term.lower() in p.title.lower() or search_term.lower() in p.content.lower()
        ]

    # 按創建時間倒序排列
    filtered_posts.sort(key=lambda x: x.created_time, reverse=True)

    if not filtered_posts:
        st.info("沒有找到符合條件的貼文。")
        return

    # 顯示貼文列表
    st.subheader(f"找到 {len(filtered_posts)} 篇貼文")

    for post in filtered_posts:
        with st.container():
            col1, col2, col3, col4 = st.columns([3, 1, 1, 2])

            with col1:
                st.markdown(f"**{post.title}**")
                st.markdown(f"{post.content[:100]}{'...' if len(post.content) > 100 else ''}")

            with col2:
                status_color = get_status_color(post.status)
                status_text = get_status_text(post.status)
                st.markdown(f"{status_color} {status_text}")

            with col3:
                created_time = datetime.fromisoformat(post.created_time)
                st.markdown(f"📅 {created_time.strftime('%m-%d %H:%M')}")

            with col4:
                col4_1, col4_2, col4_3 = st.columns(3)

                with col4_1:
                    if st.button("👁️", help="查看", key=f"view_{post.id}"):
                        st.session_state.selected_post_id = post.id
                        st.session_state.page = "post_detail"
                        st.rerun()

                with col4_2:
                    if st.button("✏️", help="編輯", key=f"edit_{post.id}"):
                        st.session_state.selected_post_id = post.id
                        st.session_state.page = "edit_post"
                        st.rerun()

                with col4_3:
                    if post.status != "published":
                        if st.button("🚀", help="發布", key=f"publish_{post.id}"):
                            if PostManager.publish_post(post.id):
                                st.success(f"成功發布貼文：{post.title}")
                                st.rerun()
                            else:
                                st.error("發布失敗")

            st.divider()

def show_create_post():
    """顯示創建貼文頁面"""
    st.markdown('<h1 class="main-header">📝 創建新貼文</h1>', unsafe_allow_html=True)

    with st.form("create_post_form"):
        title = st.text_input("貼文標題", placeholder="請輸入吸引人的標題...")
        content = st.text_area("貼文內容", height=150, placeholder="請輸入貼文內容...")

        col1, col2 = st.columns(2)

        with col1:
            status = st.selectbox("發布狀態", ["draft", "scheduled"],
                                format_func=lambda x: {"draft": "草稿", "scheduled": "排程發布"}[x])

        with col2:
            scheduled_time = None
            if status == "scheduled":
                scheduled_date = st.date_input("排程日期")
                scheduled_time_input = st.time_input("排程時間")
                if scheduled_date and scheduled_time_input:
                    scheduled_datetime = datetime.combine(scheduled_date, scheduled_time_input)
                    scheduled_time = scheduled_datetime.strftime("%Y-%m-%d %H:%M")

        submitted = st.form_submit_button("📝 創建貼文", type="primary")

        if submitted:
            if not title or not content:
                st.error("請填寫標題和內容")
            else:
                try:
                    post = PostManager.create_post(
                        title=title,
                        content=content,
                        status=status,
                        scheduled_time=scheduled_time
                    )
                    st.success(f"✅ 成功創建貼文：{post.title}")
                    st.balloons()

                    # 清空表單 (重新載入頁面)
                    st.rerun()

                except Exception as e:
                    st.error(f"創建貼文失敗：{e}")

def show_post_detail():
    """顯示貼文詳情頁面"""
    if "selected_post_id" not in st.session_state:
        st.error("未選擇貼文")
        return

    posts = PostManager.load_posts()
    post = next((p for p in posts if p.id == st.session_state.selected_post_id), None)

    if not post:
        st.error("找不到指定的貼文")
        return

    st.markdown('<h1 class="main-header">👁️ 貼文詳情</h1>', unsafe_allow_html=True)

    # 操作按鈕
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        if st.button("🔙 返回列表"):
            st.session_state.page = "posts_list"
            st.rerun()

    with col2:
        if st.button("✏️ 編輯貼文"):
            st.session_state.page = "edit_post"
            st.rerun()

    with col3:
        if post.status != "published":
            if st.button("🚀 發布貼文"):
                if PostManager.publish_post(post.id):
                    st.success("發布成功！")
                    st.rerun()
                else:
                    st.error("發布失敗")

    with col4:
        if st.button("🗑️ 刪除貼文", type="secondary"):
            if st.button("確認刪除", key="confirm_delete"):
                if PostManager.delete_post(post.id):
                    st.success("刪除成功！")
                    st.session_state.page = "posts_list"
                    st.rerun()
                else:
                    st.error("刪除失敗")

    # 貼文信息
    st.subheader(f"📄 {post.title}")

    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown("**內容：**")
        st.markdown(post.content)

    with col2:
        status_color = get_status_color(post.status)
        status_text = get_status_text(post.status)
        st.markdown(f"**狀態：** {status_color} {status_text}")

        created_time = datetime.fromisoformat(post.created_time)
        st.markdown(f"**創建時間：** {created_time.strftime('%Y-%m-%d %H:%M:%S')}")

        updated_time = datetime.fromisoformat(post.updated_time)
        st.markdown(f"**更新時間：** {updated_time.strftime('%Y-%m-%d %H:%M:%S')}")

        if post.scheduled_time:
            st.markdown(f"**排程時間：** {post.scheduled_time}")

        if post.facebook_post_id:
            st.markdown(f"**Facebook ID：** {post.facebook_post_id}")

    # 互動數據
    if post.engagement_stats:
        st.subheader("📊 互動數據")

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("👍 按讚", post.engagement_stats.get("likes", 0))
        with col2:
            st.metric("💬 留言", post.engagement_stats.get("comments", 0))
        with col3:
            st.metric("🔗 分享", post.engagement_stats.get("shares", 0))
        with col4:
            st.metric("👁️ 瀏覽", post.engagement_stats.get("views", 0))

def show_edit_post():
    """顯示編輯貼文頁面"""
    if "selected_post_id" not in st.session_state:
        st.error("未選擇貼文")
        return

    posts = PostManager.load_posts()
    post = next((p for p in posts if p.id == st.session_state.selected_post_id), None)

    if not post:
        st.error("找不到指定的貼文")
        return

    st.markdown('<h1 class="main-header">✏️ 編輯貼文</h1>', unsafe_allow_html=True)

    with st.form("edit_post_form"):
        title = st.text_input("貼文標題", value=post.title)
        content = st.text_area("貼文內容", value=post.content, height=150)

        col1, col2 = st.columns([1, 1])

        with col1:
            if st.form_submit_button("💾 保存修改", type="primary"):
                if not title or not content:
                    st.error("請填寫標題和內容")
                else:
                    if PostManager.update_post(post.id, title=title, content=content):
                        st.success("✅ 修改已保存")
                        st.rerun()
                    else:
                        st.error("保存失敗")

        with col2:
            if st.form_submit_button("🔙 取消編輯"):
                st.session_state.page = "post_detail"
                st.rerun()

def main():
    """主程式入口"""
    # 初始化示例數據
    init_sample_data()

    # 初始化 session state
    if "page" not in st.session_state:
        st.session_state.page = "dashboard"

    # 側邊欄導航
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

    st.sidebar.divider()

    # 系統信息
    posts = PostManager.load_posts()
    st.sidebar.metric("📊 總貼文數", len(posts))
    st.sidebar.metric("✅ 已發布", len([p for p in posts if p.status == "published"]))
    st.sidebar.metric("📝 草稿", len([p for p in posts if p.status == "draft"]))

    # 根據當前頁面顯示內容
    if st.session_state.page == "dashboard":
        show_dashboard()
    elif st.session_state.page == "posts_list":
        show_posts_list()
    elif st.session_state.page == "create_post":
        show_create_post()
    elif st.session_state.page == "post_detail":
        show_post_detail()
    elif st.session_state.page == "edit_post":
        show_edit_post()

if __name__ == "__main__":
    main()