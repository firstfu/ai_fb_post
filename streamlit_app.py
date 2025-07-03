"""
AI 自動化 Facebook 發文系統 - Streamlit MVP

此 Streamlit 應用提供完整的 Facebook 發文管理系統：
- 📝 貼文內容管理 (創建、編輯、刪除)
- 📅 排程發文功能
- 📊 數據統計和可視化
- 🔍 貼文搜索和篩選
- 📈 互動數據分析
- 🤖 AI 驅動的貼文生成
- 🖼️ AI 配圖生成

@fileoverview Facebook 發文系統 Streamlit 主程式
@version 2.0.0
@author AI Assistant
@created 2024-01-20
@updated 2024-01-20

@requires streamlit>=1.29.0
@requires pydantic>=2.0.0
@requires langchain>=0.2.0
@requires langgraph>=0.2.0
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

# AI 相關導入
try:
    from ai_post_generator import (
        PostGenerationRequest,
        GeneratedPost,
        AIPostWorkflow,
        AIConfigManager,
        show_ai_config
    )
    AI_AVAILABLE = True
except ImportError as e:
    AI_AVAILABLE = False
    print(f"AI 功能不可用: {e}")

# 頁面配置
st.set_page_config(
    page_title="AI 自動化 Facebook 發文系統",
    page_icon="📱",
    layout="wide",
    initial_sidebar_state="expanded"
)

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
    # AI 生成相關欄位
    hashtags: List[str] = []
    predicted_engagement: Dict[str, float] = {}
    optimization_tips: List[str] = []
    image_url: Optional[str] = None
    image_description: Optional[str] = None
    ai_generated: bool = False
    generation_metadata: Dict = {}

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
    def create_post(title: str, content: str, status: str = "draft", scheduled_time: Optional[str] = None,
                   hashtags: Optional[List[str]] = None, predicted_engagement: Optional[Dict[str, float]] = None,
                   optimization_tips: Optional[List[str]] = None, image_url: Optional[str] = None,
                   image_description: Optional[str] = None, ai_generated: bool = False,
                   generation_metadata: Optional[Dict] = None) -> Post:
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
            updated_time=now,
            hashtags=hashtags or [],
            predicted_engagement=predicted_engagement or {},
            optimization_tips=optimization_tips or [],
            image_url=image_url,
            image_description=image_description,
            ai_generated=ai_generated,
            generation_metadata=generation_metadata or {}
        )

        posts.append(post)
        PostManager.save_posts(posts)
        return post

def show_create_post():
    """顯示創建貼文頁面"""
    st.markdown('<h1 style="text-align: center; color: #1f77b4;">📝 創建新貼文</h1>', unsafe_allow_html=True)

    # 創建標籤頁
    tab1, tab2, tab3 = st.tabs(["🤖 AI 智能生成", "✍️ 手動創建", "⚙️ AI 設定"])

    with tab1:
        show_ai_generation_tab()

    with tab2:
        show_manual_creation_tab()

    with tab3:
        if AI_AVAILABLE:
            show_ai_config()
        else:
            st.error("AI 功能不可用，請檢查依賴套件是否正確安裝")

def show_ai_generation_tab():
    """顯示 AI 生成標籤頁"""
    st.markdown("### 🤖 使用 AI 生成高轉化率貼文")

    if not AI_AVAILABLE:
        st.warning("AI 功能不可用，請檢查相關依賴套件")
        return

    # 檢查 AI 配置
    config = AIConfigManager.load_config()
    if not config.get("openai_api_key") and not config.get("anthropic_api_key"):
        st.warning("請先在「AI 設定」標籤頁配置 API 金鑰")
        return

    with st.form("ai_generation_form"):
        st.markdown("#### 📋 貼文參數設定")

        col1, col2 = st.columns(2)

        with col1:
            topic = st.text_input(
                "貼文主題 *",
                placeholder="例如：新產品發布、節日促銷、知識分享...",
                help="請描述您想要推廣的主題或內容"
            )

            target_audience = st.selectbox(
                "目標受眾",
                ["一般大眾", "年輕族群 (18-30歲)", "中年族群 (30-50歲)", "企業主管", "學生族群", "家庭主婦", "專業人士"],
                help="選擇主要的目標受眾群體"
            )

            post_type = st.selectbox(
                "貼文類型",
                ["推廣", "教育", "娛樂", "新聞", "問答", "故事分享", "產品介紹", "活動宣傳"],
                help="選擇貼文的主要目的"
            )

        with col2:
            tone = st.selectbox(
                "語調風格",
                ["友善親切", "專業權威", "幽默風趣", "激勵鼓舞", "溫馨感人", "簡潔直白", "創意有趣"],
                help="選擇適合的語調風格"
            )

            include_hashtags = st.checkbox(
                "包含標籤 (#hashtags)",
                value=True,
                help="自動生成相關的標籤"
            )

            generate_image = st.checkbox(
                "生成配圖",
                value=False,
                help="使用 AI 生成與貼文相關的配圖"
            )

        # 生成按鈕
        generate_btn = st.form_submit_button(
            "🚀 AI 生成貼文",
            type="primary",
            use_container_width=True
        )

        # 處理表單提交
        if generate_btn:
            if not topic:
                st.error("請填寫貼文主題")
            else:
                with st.spinner("AI 正在生成貼文內容..."):
                    try:
                        # 創建生成請求
                        request = PostGenerationRequest(
                            topic=topic,
                            target_audience=target_audience,
                            post_type=post_type,
                            tone=tone,
                            include_hashtags=include_hashtags,
                            include_emoji=True,
                            max_length=300,
                            generate_image=generate_image,
                            image_style="現代簡約"
                        )

                        # 執行 AI 生成
                        workflow = AIPostWorkflow()
                        generated_post = workflow.generate_post(request)

                        # 顯示生成結果
                        show_generated_post_preview(generated_post)

                    except Exception as e:
                        st.error(f"AI 生成失敗: {str(e)}")
                        st.info("請檢查 AI 配置設定或網路連線")

def show_generated_post_preview(generated_post):
    """顯示生成的貼文預覽"""
    st.markdown("---")
    st.markdown("### 🎯 AI 生成結果")

    # 檢查是否有錯誤
    errors = generated_post.generation_metadata.get("errors", [])
    if errors:
        st.warning("生成過程中遇到一些問題：")
        for error in errors:
            st.warning(f"• {error}")

    # 顯示生成的內容
    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown("#### 📄 貼文內容")

        # 標題
        st.markdown(f"**標題：** {generated_post.title}")

        # 內容
        st.markdown("**內容：**")
        st.markdown(generated_post.content)

        # 標籤
        if generated_post.hashtags:
            st.markdown("**標籤：**")
            hashtags_text = " ".join(generated_post.hashtags)
            st.markdown(hashtags_text)

        # 配圖
        if generated_post.image_url:
            st.markdown("**配圖：**")
            try:
                from PIL import Image
                image = Image.open(generated_post.image_url)
                st.image(image, caption=generated_post.image_description, use_column_width=True)
            except Exception as e:
                st.error(f"無法顯示配圖: {e}")

    with col2:
        st.markdown("#### 📊 效果預測")

        # 互動預測
        if generated_post.predicted_engagement:
            for metric, score in generated_post.predicted_engagement.items():
                if metric == "overall":
                    st.metric("整體評分", f"{score:.1f}/10")
                else:
                    st.metric(metric.title(), f"{score:.1f}/10")

        # 優化建議
        if generated_post.optimization_tips:
            st.markdown("#### 💡 優化建議")
            for tip in generated_post.optimization_tips:
                st.info(f"• {tip}")

    # 操作按鈕
    col1, col2 = st.columns(2)

    with col1:
        if st.button("✅ 保存貼文", type="primary", key="save_ai_post"):
            try:
                post = PostManager.create_post(
                    title=generated_post.title,
                    content=generated_post.content,
                    status="draft",
                    hashtags=generated_post.hashtags,
                    predicted_engagement=generated_post.predicted_engagement,
                    optimization_tips=generated_post.optimization_tips,
                    image_url=generated_post.image_url,
                    image_description=generated_post.image_description,
                    ai_generated=True,
                    generation_metadata=generated_post.generation_metadata
                )
                st.success(f"✅ 成功保存 AI 生成的貼文：{post.title}")
                st.balloons()
                st.rerun()
            except Exception as e:
                st.error(f"保存失敗：{e}")

    with col2:
        if st.button("🔄 重新生成", key="regenerate_post"):
            st.rerun()

def show_manual_creation_tab():
    """顯示手動創建標籤頁"""
    st.markdown("### ✍️ 手動創建貼文")

    with st.form("manual_create_form"):
        title = st.text_input(
            "貼文標題",
            placeholder="請輸入吸引人的標題..."
        )

        content = st.text_area(
            "貼文內容",
            height=150,
            placeholder="請輸入貼文內容..."
        )

        # 可選的手動配圖上傳
        st.markdown("#### 🖼️ 配圖上傳 (可選)")
        uploaded_file = st.file_uploader(
            "上傳圖片",
            type=["png", "jpg", "jpeg", "gif"],
            help="支援 PNG、JPG、JPEG、GIF 格式"
        )

        status = st.selectbox(
            "發布狀態",
            ["draft", "scheduled"],
            format_func=lambda x: {"draft": "草稿", "scheduled": "排程發布"}[x]
        )

        submitted = st.form_submit_button("📝 創建貼文", type="primary")

        if submitted:
            if not title or not content:
                st.error("請填寫標題和內容")
            else:
                try:
                    # 處理上傳的圖片
                    image_url = None
                    if uploaded_file is not None:
                        # 保存上傳的圖片
                        upload_dir = Path("data/uploaded_images")
                        upload_dir.mkdir(parents=True, exist_ok=True)

                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"upload_{timestamp}_{uploaded_file.name}"
                        image_path = upload_dir / filename

                        with open(image_path, "wb") as f:
                            f.write(uploaded_file.getbuffer())

                        image_url = str(image_path)

                    post = PostManager.create_post(
                        title=title,
                        content=content,
                        status=status,
                        image_url=image_url,
                        ai_generated=False
                    )

                    st.success(f"✅ 成功創建貼文：{post.title}")
                    st.balloons()
                    st.rerun()

                except Exception as e:
                    st.error(f"創建貼文失敗：{e}")

def show_posts_list():
    """顯示貼文列表頁面"""
    st.markdown('<h1 style="text-align: center; color: #1f77b4;">📝 貼文管理</h1>', unsafe_allow_html=True)

    posts = PostManager.load_posts()

    if not posts:
        st.info("目前沒有任何貼文，請先創建一些貼文。")
        return

    # 搜尋和篩選
    col1, col2, col3 = st.columns([2, 1, 1])

    with col1:
        search_term = st.text_input("🔍 搜尋貼文", placeholder="輸入標題或內容關鍵字...")

    with col2:
        status_filter = st.selectbox("篩選狀態", ["全部", "已發布", "草稿", "已排程", "失敗"])

    with col3:
        ai_filter = st.selectbox("篩選類型", ["全部", "AI 生成", "手動創建"])

    # 應用篩選
    filtered_posts = posts

    if search_term:
        filtered_posts = [p for p in filtered_posts
                         if search_term.lower() in p.title.lower() or search_term.lower() in p.content.lower()]

    if status_filter != "全部":
        status_map = {"已發布": "published", "草稿": "draft", "已排程": "scheduled", "失敗": "failed"}
        filtered_posts = [p for p in filtered_posts if p.status == status_map[status_filter]]

    if ai_filter != "全部":
        is_ai = ai_filter == "AI 生成"
        filtered_posts = [p for p in filtered_posts if p.ai_generated == is_ai]

    # 顯示貼文列表
    for post in filtered_posts:
        with st.container():
            col1, col2, col3, col4 = st.columns([3, 1, 1, 1])

            with col1:
                ai_badge = "🤖" if post.ai_generated else "✍️"
                st.markdown(f"### {ai_badge} {post.title}")
                content_preview = post.content[:100] + "..." if len(post.content) > 100 else post.content
                st.markdown(content_preview)

                if post.hashtags:
                    hashtags_preview = " ".join(post.hashtags[:3])  # 顯示前3個標籤
                    st.markdown(f"🏷️ {hashtags_preview}")

            with col2:
                status_colors = {
                    "published": "🟢",
                    "draft": "⚪",
                    "scheduled": "🟡",
                    "failed": "🔴"
                }
                status_texts = {
                    "published": "已發布",
                    "draft": "草稿",
                    "scheduled": "已排程",
                    "failed": "發布失敗"
                }
                status_color = status_colors.get(post.status, "❓")
                status_text = status_texts.get(post.status, post.status)
                st.markdown(f"{status_color} {status_text}")

                created_time = datetime.fromisoformat(post.created_time)
                st.markdown(f"📅 {created_time.strftime('%m/%d %H:%M')}")

            with col3:
                if post.predicted_engagement and post.predicted_engagement.get("overall"):
                    score = post.predicted_engagement["overall"]
                    st.metric("預測評分", f"{score:.1f}/10")
                else:
                    st.markdown("—")

            with col4:
                if st.button("👁️ 查看", key=f"view_{post.id}"):
                    st.session_state.selected_post_id = post.id
                    st.session_state.page = "post_detail"
                    st.rerun()

        st.divider()

def show_dashboard():
    """顯示儀表板頁面"""
    st.markdown('<h1 style="text-align: center; color: #1f77b4;">📊 系統儀表板</h1>', unsafe_allow_html=True)

    posts = PostManager.load_posts()

    if not posts:
        st.info("目前沒有任何貼文，請先創建一些貼文。")
        return

    # 統計數據
    total_posts = len(posts)
    published_posts = [p for p in posts if p.status == "published"]
    draft_posts = [p for p in posts if p.status == "draft"]
    ai_posts = [p for p in posts if p.ai_generated]

    # 顯示統計卡片
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("總貼文數", total_posts)
    with col2:
        st.metric("已發布", len(published_posts))
    with col3:
        st.metric("草稿", len(draft_posts))
    with col4:
        st.metric("AI 生成", len(ai_posts))

    # 狀態分布圓餅圖
    if posts:
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("📈 貼文狀態分布")
            status_counts = {}
            status_texts = {
                "published": "已發布",
                "draft": "草稿",
                "scheduled": "已排程",
                "failed": "發布失敗"
            }

            for post in posts:
                status_text = status_texts.get(post.status, post.status)
                status_counts[status_text] = status_counts.get(status_text, 0) + 1

            fig_pie = px.pie(
                values=list(status_counts.values()),
                names=list(status_counts.keys()),
                title="貼文狀態分布"
            )
            st.plotly_chart(fig_pie, use_container_width=True)

        with col2:
            st.subheader("🤖 創建方式分布")
            creation_counts = {"AI 生成": len(ai_posts), "手動創建": total_posts - len(ai_posts)}

            fig_creation = px.pie(
                values=list(creation_counts.values()),
                names=list(creation_counts.keys()),
                title="創建方式分布"
            )
            st.plotly_chart(fig_creation, use_container_width=True)

def main():
    """主程式入口"""
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

    if AI_AVAILABLE:
        st.sidebar.success("🤖 AI 功能已啟用")
    else:
        st.sidebar.warning("⚠️ AI 功能未啟用")

    # 根據選擇的頁面顯示內容
    if st.session_state.page == "dashboard":
        show_dashboard()
    elif st.session_state.page == "posts_list":
        show_posts_list()
    elif st.session_state.page == "create_post":
        show_create_post()

if __name__ == "__main__":
    main()
