"""
AI 貼文生成器 - 使用 LangGraph 生成高轉化率的 Facebook 貼文和配圖

此模組提供完整的 AI 驅動貼文生成系統：
- 🤖 使用 LangGraph 工作流程生成高轉化率貼文內容
- 🖼️ AI 生成配圖功能
- 📊 貼文效果優化建議
- 🎯 多種貼文類型支援
- 🔧 可自定義生成參數

主要功能：
- 智能貼文內容生成
- 配圖生成和優化
- 貼文效果預測
- 多語言支援
- 品牌風格適配

技術架構：
- LangGraph 工作流程引擎
- LangChain AI 框架
- OpenAI GPT 模型
- DALL-E 3 圖像生成
- Pydantic 數據驗證

@fileoverview AI 貼文生成系統核心模組
@version 1.0.0
@author AI Assistant
@created 2024-01-20

@requires langchain>=0.2.0
@requires langgraph>=0.2.0
@requires openai>=1.0.0
@requires pillow>=10.0.0
"""

import os
import json
import base64
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
from io import BytesIO

import streamlit as st
from PIL import Image
import requests
from pydantic import BaseModel, Field

# LangChain 和 LangGraph 相關導入
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.schema import BaseMessage, AIMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing import TypedDict

# 配置文件路徑
AI_CONFIG_FILE = Path("data/ai_config.json")
GENERATED_IMAGES_DIR = Path("data/generated_images")

# 確保目錄存在
GENERATED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

class PostGenerationRequest(BaseModel):
    """貼文生成請求模型"""
    topic: str = Field(..., description="貼文主題")
    target_audience: str = Field(default="一般大眾", description="目標受眾")
    post_type: str = Field(default="推廣", description="貼文類型")
    tone: str = Field(default="友善親切", description="語調風格")
    include_hashtags: bool = Field(default=True, description="是否包含標籤")
    include_emoji: bool = Field(default=True, description="是否包含表情符號")
    max_length: int = Field(default=300, description="最大字數")
    generate_image: bool = Field(default=False, description="是否生成配圖")
    image_style: str = Field(default="現代簡約", description="配圖風格")

class GeneratedPost(BaseModel):
    """生成的貼文模型"""
    title: str
    content: str
    hashtags: List[str] = []
    predicted_engagement: Dict[str, float] = {}
    optimization_tips: List[str] = []
    image_url: Optional[str] = None
    image_description: Optional[str] = None
    generation_metadata: Dict[str, Any] = {}

class AIPostState(TypedDict):
    """AI 貼文生成狀態"""
    request: PostGenerationRequest
    generated_content: str
    generated_title: str
    hashtags: List[str]
    optimization_tips: List[str]
    engagement_prediction: Dict[str, float]
    image_prompt: Optional[str]
    image_url: Optional[str]
    image_description: Optional[str]
    errors: List[str]

class AIConfigManager:
    """AI 配置管理器"""

    @staticmethod
    def load_config() -> Dict[str, Any]:
        """載入 AI 配置"""
        default_config = {
            "openai_api_key": "",
            "anthropic_api_key": "",
            "default_model": "gpt-4o-mini",
            "image_model": "dall-e-3",
            "max_tokens": 1000,
            "temperature": 0.7,
            "enable_image_generation": True
        }

        if not AI_CONFIG_FILE.exists():
            AIConfigManager.save_config(default_config)
            return default_config

        try:
            with open(AI_CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                # 合併預設配置以確保所有必要的鍵都存在
                return {**default_config, **config}
        except Exception:
            return default_config

    @staticmethod
    def save_config(config: Dict[str, Any]):
        """保存 AI 配置"""
        try:
            with open(AI_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            st.error(f"保存 AI 配置失敗: {e}")

class PostContentGenerator:
    """貼文內容生成器"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.llm = self._init_llm()

    def _init_llm(self):
        """初始化語言模型"""
        model_name = self.config.get("default_model", "gpt-4o-mini")

        if model_name.startswith("gpt-"):
            if not self.config.get("openai_api_key"):
                raise ValueError("需要設置 OpenAI API Key")
            return ChatOpenAI(
                model=model_name,
                api_key=self.config["openai_api_key"],
                temperature=self.config.get("temperature", 0.7),
                max_tokens=self.config.get("max_tokens", 1000)
            )
        elif model_name.startswith("claude-"):
            if not self.config.get("anthropic_api_key"):
                raise ValueError("需要設置 Anthropic API Key")
            return ChatAnthropic(
                model=model_name,
                api_key=self.config["anthropic_api_key"],
                temperature=self.config.get("temperature", 0.7),
                max_tokens=self.config.get("max_tokens", 1000)
            )
        else:
            raise ValueError(f"不支援的模型: {model_name}")

    def generate_title(self, state: AIPostState) -> AIPostState:
        """生成貼文標題"""
        try:
            request = state["request"]

            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(
                    "你是一位專業的社群媒體內容創作專家，專門創作高轉化率的 Facebook 貼文標題。"
                    "請根據以下要求生成吸引人的標題。"
                ),
                HumanMessagePromptTemplate.from_template(
                    "請為以下主題創作一個吸引人的 Facebook 貼文標題：\n\n"
                    "主題：{topic}\n"
                    "目標受眾：{target_audience}\n"
                    "貼文類型：{post_type}\n"
                    "語調風格：{tone}\n"
                    "是否使用表情符號：{include_emoji}\n\n"
                    "要求：\n"
                    "1. 標題要簡潔有力，能夠吸引點擊\n"
                    "2. 符合目標受眾的興趣和需求\n"
                    "3. 體現指定的語調風格\n"
                    "4. 字數控制在 50 字以內\n"
                    "5. 使用繁體中文\n\n"
                    "只回傳標題內容，不需要其他說明。"
                )
            ])

            formatted_prompt = prompt.format_messages(
                topic=request.topic,
                target_audience=request.target_audience,
                post_type=request.post_type,
                tone=request.tone,
                include_emoji="是" if request.include_emoji else "否"
            )

            response = self.llm.invoke(formatted_prompt)
            state["generated_title"] = response.content.strip()

        except Exception as e:
            state["errors"].append(f"標題生成失敗: {str(e)}")
            state["generated_title"] = f"關於{state['request'].topic}的精彩內容"

        return state

    def generate_content(self, state: AIPostState) -> AIPostState:
        """生成貼文內容"""
        try:
            request = state["request"]

            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(
                    "你是一位專業的社群媒體內容創作專家，專門創作高轉化率的 Facebook 貼文。"
                    "你了解如何運用心理學原理、storytelling 技巧和社群媒體最佳實踐來創作吸引人的內容。"
                ),
                HumanMessagePromptTemplate.from_template(
                    "請為以下主題創作一篇高轉化率的 Facebook 貼文內容：\n\n"
                    "主題：{topic}\n"
                    "目標受眾：{target_audience}\n"
                    "貼文類型：{post_type}\n"
                    "語調風格：{tone}\n"
                    "最大字數：{max_length}\n"
                    "是否使用表情符號：{include_emoji}\n\n"
                    "請遵循以下原則：\n"
                    "1. 開頭要有吸引力，能夠立即抓住讀者注意力\n"
                    "2. 內容要有價值，對目標受眾有實際幫助\n"
                    "3. 使用適當的情感觸發點\n"
                    "4. 包含明確的行動呼籲 (CTA)\n"
                    "5. 結構清晰，易於閱讀\n"
                    "6. 符合指定的語調風格\n"
                    "7. 使用繁體中文\n"
                    "8. 如果適合，可以加入相關的故事或案例\n\n"
                    "只回傳貼文內容，不需要其他說明。"
                )
            ])

            formatted_prompt = prompt.format_messages(
                topic=request.topic,
                target_audience=request.target_audience,
                post_type=request.post_type,
                tone=request.tone,
                max_length=request.max_length,
                include_emoji="是" if request.include_emoji else "否"
            )

            response = self.llm.invoke(formatted_prompt)
            state["generated_content"] = response.content.strip()

        except Exception as e:
            state["errors"].append(f"內容生成失敗: {str(e)}")
            state["generated_content"] = f"分享關於{state['request'].topic}的精彩內容..."

        return state

    def generate_hashtags(self, state: AIPostState) -> AIPostState:
        """生成相關標籤"""
        try:
            if not state["request"].include_hashtags:
                state["hashtags"] = []
                return state

            request = state["request"]

            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(
                    "你是一位社群媒體標籤專家，專門為 Facebook 貼文生成有效的標籤。"
                ),
                HumanMessagePromptTemplate.from_template(
                    "請為以下主題生成 5-10 個相關的 Facebook 標籤：\n\n"
                    "主題：{topic}\n"
                    "目標受眾：{target_audience}\n"
                    "貼文類型：{post_type}\n\n"
                    "要求：\n"
                    "1. 標籤要與主題高度相關\n"
                    "2. 考慮目標受眾的搜尋習慣\n"
                    "3. 混合熱門和利基標籤\n"
                    "4. 使用繁體中文和英文\n"
                    "5. 每個標籤前加上 # 符號\n\n"
                    "請以逗號分隔的格式回傳標籤，例如：#標籤1, #標籤2, #標籤3"
                )
            ])

            formatted_prompt = prompt.format_messages(
                topic=request.topic,
                target_audience=request.target_audience,
                post_type=request.post_type
            )

            response = self.llm.invoke(formatted_prompt)
            hashtags_text = response.content.strip()

            # 解析標籤
            hashtags = [tag.strip() for tag in hashtags_text.split(',')]
            # 確保每個標籤都有 # 符號
            hashtags = [tag if tag.startswith('#') else f'#{tag}' for tag in hashtags]
            state["hashtags"] = hashtags

        except Exception as e:
            state["errors"].append(f"標籤生成失敗: {str(e)}")
            state["hashtags"] = [f"#{state['request'].topic}"]

        return state

class ImageGenerator:
    """AI 圖像生成器"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.openai_client = None
        if config.get("openai_api_key"):
            import openai
            self.openai_client = openai.OpenAI(api_key=config["openai_api_key"])

    def generate_image_prompt(self, state: AIPostState) -> AIPostState:
        """生成圖像提示詞"""
        try:
            if not state["request"].generate_image:
                return state

            request = state["request"]

            # 使用 LLM 生成圖像提示詞
            llm = PostContentGenerator(self.config).llm

            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(
                    "你是一位專業的 AI 圖像生成提示詞專家，專門為社群媒體貼文創作高質量的圖像生成提示詞。"
                ),
                HumanMessagePromptTemplate.from_template(
                    "請為以下 Facebook 貼文創作一個詳細的圖像生成提示詞：\n\n"
                    "貼文主題：{topic}\n"
                    "貼文內容：{content}\n"
                    "目標受眾：{target_audience}\n"
                    "圖像風格：{image_style}\n\n"
                    "要求：\n"
                    "1. 提示詞要詳細且具體\n"
                    "2. 包含視覺風格、色彩、構圖等元素\n"
                    "3. 確保圖像與貼文內容高度相關\n"
                    "4. 考慮目標受眾的喜好\n"
                    "5. 使用英文撰寫提示詞\n"
                    "6. 避免包含文字內容\n\n"
                    "只回傳提示詞內容，不需要其他說明。"
                )
            ])

            formatted_prompt = prompt.format_messages(
                topic=request.topic,
                content=state.get("generated_content", ""),
                target_audience=request.target_audience,
                image_style=request.image_style
            )

            response = llm.invoke(formatted_prompt)
            state["image_prompt"] = response.content.strip()

        except Exception as e:
            state["errors"].append(f"圖像提示詞生成失敗: {str(e)}")
            state["image_prompt"] = f"Beautiful {state['request'].topic} illustration"

        return state

    def generate_image(self, state: AIPostState) -> AIPostState:
        """生成圖像"""
        try:
            if not state["request"].generate_image or not state.get("image_prompt"):
                return state

            if not self.openai_client:
                state["errors"].append("圖像生成需要 OpenAI API Key")
                return state

            # 使用 DALL-E 3 生成圖像
            response = self.openai_client.images.generate(
                model=self.config.get("image_model", "dall-e-3"),
                prompt=state["image_prompt"],
                size="1024x1024",
                quality="standard",
                n=1,
            )

            image_url = response.data[0].url

            # 下載並保存圖像
            image_response = requests.get(image_url)
            if image_response.status_code == 200:
                # 生成唯一的檔案名稱
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"generated_{timestamp}.png"
                filepath = GENERATED_IMAGES_DIR / filename

                with open(filepath, 'wb') as f:
                    f.write(image_response.content)

                state["image_url"] = str(filepath)
                state["image_description"] = state["image_prompt"]
            else:
                state["errors"].append("圖像下載失敗")

        except Exception as e:
            state["errors"].append(f"圖像生成失敗: {str(e)}")

        return state

class EngagementPredictor:
    """互動預測器"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.llm = PostContentGenerator(config).llm

    def predict_engagement(self, state: AIPostState) -> AIPostState:
        """預測貼文互動效果"""
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(
                    "你是一位社群媒體數據分析專家，專門預測 Facebook 貼文的互動效果。"
                ),
                HumanMessagePromptTemplate.from_template(
                    "請分析以下 Facebook 貼文的預期互動效果：\n\n"
                    "標題：{title}\n"
                    "內容：{content}\n"
                    "標籤：{hashtags}\n"
                    "目標受眾：{target_audience}\n"
                    "貼文類型：{post_type}\n\n"
                    "請預測以下指標的得分（1-10分）：\n"
                    "1. 按讚率\n"
                    "2. 留言率\n"
                    "3. 分享率\n"
                    "4. 點擊率\n"
                    "5. 整體互動率\n\n"
                    "請以 JSON 格式回傳結果，例如：\n"
                    "{{\n"
                    "  \"likes\": 7.5,\n"
                    "  \"comments\": 6.0,\n"
                    "  \"shares\": 5.5,\n"
                    "  \"clicks\": 8.0,\n"
                    "  \"overall\": 7.0\n"
                    "}}"
                )
            ])

            formatted_prompt = prompt.format_messages(
                title=state.get("generated_title", ""),
                content=state.get("generated_content", ""),
                hashtags=", ".join(state.get("hashtags", [])),
                target_audience=state["request"].target_audience,
                post_type=state["request"].post_type
            )

            response = self.llm.invoke(formatted_prompt)

            # 解析 JSON 回應
            try:
                engagement_data = json.loads(response.content.strip())
                state["engagement_prediction"] = engagement_data
            except json.JSONDecodeError:
                # 如果無法解析 JSON，使用預設值
                state["engagement_prediction"] = {
                    "likes": 6.0,
                    "comments": 5.0,
                    "shares": 4.5,
                    "clicks": 6.5,
                    "overall": 5.5
                }

        except Exception as e:
            state["errors"].append(f"互動預測失敗: {str(e)}")
            state["engagement_prediction"] = {
                "likes": 5.0,
                "comments": 5.0,
                "shares": 5.0,
                "clicks": 5.0,
                "overall": 5.0
            }

        return state

    def generate_optimization_tips(self, state: AIPostState) -> AIPostState:
        """生成優化建議"""
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(
                    "你是一位社群媒體優化專家，專門提供提高 Facebook 貼文效果的建議。"
                ),
                HumanMessagePromptTemplate.from_template(
                    "請分析以下 Facebook 貼文並提供 3-5 個具體的優化建議：\n\n"
                    "標題：{title}\n"
                    "內容：{content}\n"
                    "標籤：{hashtags}\n"
                    "預測互動分數：{engagement_scores}\n\n"
                    "請提供具體、可行的優化建議，每個建議用一行表示，使用繁體中文。\n"
                    "建議應該涵蓋內容、時機、互動等方面。"
                )
            ])

            formatted_prompt = prompt.format_messages(
                title=state.get("generated_title", ""),
                content=state.get("generated_content", ""),
                hashtags=", ".join(state.get("hashtags", [])),
                engagement_scores=str(state.get("engagement_prediction", {}))
            )

            response = self.llm.invoke(formatted_prompt)

            # 將回應分割為建議列表
            tips = [tip.strip() for tip in response.content.strip().split('\n') if tip.strip()]
            # 移除編號
            tips = [tip.replace(f"{i+1}.", "").replace(f"{i+1}、", "").strip()
                   for i, tip in enumerate(tips)]

            state["optimization_tips"] = tips[:5]  # 最多 5 個建議

        except Exception as e:
            state["errors"].append(f"優化建議生成失敗: {str(e)}")
            state["optimization_tips"] = [
                "考慮在貼文中加入更多互動元素",
                "嘗試在最佳時間發布貼文",
                "使用更吸引人的視覺內容"
            ]

        return state

class AIPostWorkflow:
    """AI 貼文生成工作流程"""

    def __init__(self):
        self.config = AIConfigManager.load_config()
        self.content_generator = PostContentGenerator(self.config)
        self.image_generator = ImageGenerator(self.config)
        self.engagement_predictor = EngagementPredictor(self.config)
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """構建 LangGraph 工作流程"""
        workflow = StateGraph(AIPostState)

        # 添加節點
        workflow.add_node("generate_title", self.content_generator.generate_title)
        workflow.add_node("generate_content", self.content_generator.generate_content)
        workflow.add_node("generate_hashtags", self.content_generator.generate_hashtags)
        workflow.add_node("generate_image_prompt", self.image_generator.generate_image_prompt)
        workflow.add_node("generate_image", self.image_generator.generate_image)
        workflow.add_node("predict_engagement", self.engagement_predictor.predict_engagement)
        workflow.add_node("generate_tips", self.engagement_predictor.generate_optimization_tips)

        # 設置工作流程
        workflow.set_entry_point("generate_title")
        workflow.add_edge("generate_title", "generate_content")
        workflow.add_edge("generate_content", "generate_hashtags")
        workflow.add_edge("generate_hashtags", "generate_image_prompt")
        workflow.add_edge("generate_image_prompt", "generate_image")
        workflow.add_edge("generate_image", "predict_engagement")
        workflow.add_edge("predict_engagement", "generate_tips")
        workflow.add_edge("generate_tips", END)

        return workflow.compile()

    def generate_post(self, request: PostGenerationRequest) -> GeneratedPost:
        """生成完整的貼文"""
        # 初始化狀態
        initial_state: AIPostState = {
            "request": request,
            "generated_content": "",
            "generated_title": "",
            "hashtags": [],
            "optimization_tips": [],
            "engagement_prediction": {},
            "image_prompt": None,
            "image_url": None,
            "image_description": None,
            "errors": []
        }

        # 執行工作流程
        try:
            final_state = self.workflow.invoke(initial_state)

            # 構建回傳結果
            result = GeneratedPost(
                title=final_state.get("generated_title", ""),
                content=final_state.get("generated_content", ""),
                hashtags=final_state.get("hashtags", []),
                predicted_engagement=final_state.get("engagement_prediction", {}),
                optimization_tips=final_state.get("optimization_tips", []),
                image_url=final_state.get("image_url"),
                image_description=final_state.get("image_description"),
                generation_metadata={
                    "errors": final_state.get("errors", []),
                    "generation_time": datetime.now().isoformat(),
                    "model_used": self.config.get("default_model", "unknown"),
                    "image_generated": final_state.get("image_url") is not None
                }
            )

            return result

        except Exception as e:
            # 如果工作流程失敗，返回基本結果
            return GeneratedPost(
                title=f"關於{request.topic}的分享",
                content=f"想要分享一些關於{request.topic}的精彩內容...",
                hashtags=[f"#{request.topic}"],
                predicted_engagement={"overall": 5.0},
                optimization_tips=["請檢查 AI 配置設定"],
                generation_metadata={
                    "errors": [f"生成過程發生錯誤: {str(e)}"],
                    "generation_time": datetime.now().isoformat()
                }
            )

def show_ai_config():
    """顯示 AI 配置頁面"""
    st.subheader("🤖 AI 配置設定")

    config = AIConfigManager.load_config()

    with st.form("ai_config_form"):
        st.markdown("### API 金鑰設定")

        openai_key = st.text_input(
            "OpenAI API Key",
            value=config.get("openai_api_key", ""),
            type="password",
            help="用於 GPT 模型和 DALL-E 圖像生成"
        )

        anthropic_key = st.text_input(
            "Anthropic API Key",
            value=config.get("anthropic_api_key", ""),
            type="password",
            help="用於 Claude 模型 (可選)"
        )

        st.markdown("### 模型設定")

        col1, col2 = st.columns(2)
        with col1:
            default_model = st.selectbox(
                "預設語言模型",
                ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "claude-3-sonnet-20240229"],
                index=0 if config.get("default_model") == "gpt-4o-mini" else 0
            )

        with col2:
            image_model = st.selectbox(
                "圖像生成模型",
                ["dall-e-3", "dall-e-2"],
                index=0 if config.get("image_model") == "dall-e-3" else 0
            )

        st.markdown("### 生成參數")

        col1, col2, col3 = st.columns(3)
        with col1:
            temperature = st.slider(
                "創意度 (Temperature)",
                min_value=0.0,
                max_value=1.0,
                value=config.get("temperature", 0.7),
                step=0.1,
                help="數值越高越有創意，越低越穩定"
            )

        with col2:
            max_tokens = st.number_input(
                "最大生成長度",
                min_value=100,
                max_value=4000,
                value=config.get("max_tokens", 1000),
                step=100
            )

        with col3:
            enable_image = st.checkbox(
                "啟用圖像生成",
                value=config.get("enable_image_generation", True)
            )

        if st.form_submit_button("💾 保存配置", type="primary"):
            new_config = {
                "openai_api_key": openai_key,
                "anthropic_api_key": anthropic_key,
                "default_model": default_model,
                "image_model": image_model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "enable_image_generation": enable_image
            }

            AIConfigManager.save_config(new_config)
            st.success("✅ 配置已保存")
            st.rerun()

# 導出主要類別和函數
__all__ = [
    "PostGenerationRequest",
    "GeneratedPost",
    "AIPostWorkflow",
    "AIConfigManager",
    "show_ai_config"
]