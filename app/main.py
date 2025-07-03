"""
AI 自動化 Facebook 發文系統 - 後端 API 服務

此模組提供完整的 Facebook 發文管理系統後端服務，包含：
- 用戶認證和授權系統
- 貼文內容管理 (CRUD)
- AI 內容生成整合
- Facebook API 連接
- 系統設定管理
- 數據分析和報告

技術架構：
- FastAPI 框架提供高效能 API 服務
- Pydantic 模型進行數據驗證
- SQLAlchemy ORM 進行資料庫操作（未來擴展）
- JWT Token 實現用戶認證
- 靜態文件服務支援前端界面

@fileoverview Facebook 發文系統後端主程式
@version 2.0.0
@author AI Assistant
@created 2024-01-20
@modified 2024-01-20

@requires fastapi>=0.104.0
@requires pydantic>=2.0.0
@requires uvicorn>=0.24.0
"""

import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="AI 自動化 Facebook 發文系統")

# 掛載靜態文件
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# 測試用戶數據（實際應用中應該使用資料庫）
test_users = {
    "admin@example.com": {
        "username": "admin",
        "email": "admin@example.com",
        "password": "admin123",  # 實際應用中應該雜湊處理
        "id": 1
    },
    "test@example.com": {
        "username": "test",
        "email": "test@example.com",
        "password": "test123",
        "id": 2
    }
}

# 貼文相關資料模型
class Post(BaseModel):
    """貼文資料模型"""
    id: Optional[int] = None
    title: str
    content: str
    status: str = "draft"  # draft, scheduled, published, failed
    scheduled_time: Optional[datetime] = None
    created_time: datetime = datetime.now()
    updated_time: datetime = datetime.now()
    author_id: int
    facebook_post_id: Optional[str] = None
    engagement_stats: Optional[dict] = {}

class PostCreateRequest(BaseModel):
    """創建貼文請求模型"""
    title: str
    content: str
    status: str = "draft"
    scheduled_time: Optional[datetime] = None

class PostUpdateRequest(BaseModel):
    """更新貼文請求模型"""
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    scheduled_time: Optional[datetime] = None

class PostListResponse(BaseModel):
    """貼文列表回應模型"""
    success: bool
    message: str
    data: dict = {}

# 測試用貼文資料（實際應用中應該使用資料庫）
test_posts = {
    1: {
        "id": 1,
        "title": "AI 生成的精彩內容",
        "content": "這是一篇由 AI 自動生成的 Facebook 貼文內容，包含豐富的行銷元素和吸引人的文案。",
        "status": "published",
        "scheduled_time": None,
        "created_time": datetime.now() - timedelta(hours=2),
        "updated_time": datetime.now() - timedelta(hours=2),
        "author_id": 1,
        "facebook_post_id": "fb_123456789",
        "engagement_stats": {
            "likes": 156,
            "comments": 23,
            "shares": 12,
            "views": 1250
        }
    },
    2: {
        "id": 2,
        "title": "自動化發文測試",
        "content": "測試自動化發文系統的功能，包含排程發布和即時監控。",
        "status": "scheduled",
        "scheduled_time": datetime.now() + timedelta(hours=2),
        "created_time": datetime.now() - timedelta(hours=4),
        "updated_time": datetime.now() - timedelta(hours=4),
        "author_id": 1,
        "facebook_post_id": None,
        "engagement_stats": {}
    },
    3: {
        "id": 3,
        "title": "Facebook 行銷策略",
        "content": "分享最新的 Facebook 行銷策略和技巧，幫助提升粉絲互動率。",
        "status": "draft",
        "scheduled_time": None,
        "created_time": datetime.now() - timedelta(days=1),
        "updated_time": datetime.now() - timedelta(days=1),
        "author_id": 1,
        "facebook_post_id": None,
        "engagement_stats": {}
    },
    4: {
        "id": 4,
        "title": "產品發布公告",
        "content": "我們很興奮地宣布新產品的正式發布！感謝所有支持我們的用戶。",
        "status": "published",
        "scheduled_time": None,
        "created_time": datetime.now() - timedelta(days=2),
        "updated_time": datetime.now() - timedelta(days=2),
        "author_id": 1,
        "facebook_post_id": "fb_987654321",
        "engagement_stats": {
            "likes": 89,
            "comments": 15,
            "shares": 8,
            "views": 892
        }
    },
    5: {
        "id": 5,
        "title": "週末活動預告",
        "content": "本週末將舉辦精彩的線上活動，歡迎大家參與！",
        "status": "failed",
        "scheduled_time": datetime.now() - timedelta(hours=6),
        "created_time": datetime.now() - timedelta(days=3),
        "updated_time": datetime.now() - timedelta(hours=6),
        "author_id": 1,
        "facebook_post_id": None,
        "engagement_stats": {}
    }
}

class Item(BaseModel):
    name: str
    price: float

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    confirm_password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    data: dict = {}

@app.get("/")
async def root():
    """提供前端主頁面"""
    frontend_path = "frontend/index.html"
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path, media_type="text/html")
    return {"message": "AI 自動化 Facebook 發文系統 API", "frontend": "前端頁面未找到"}

@app.post("/items")
async def create_item(item: Item):
    if item.price < 0:
        raise HTTPException(status_code=400, detail="Price must be ≥ 0")
    return {"status": "ok", "item": item}


@app.get("/items")
async def get_items():

    NODE_ENV = os.getenv("NODE_ENV")
    print(f"NODE_ENV: {NODE_ENV}")
    return {"NODE_ENV": NODE_ENV}

# 認證相關 API 端點
@app.post("/auth/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """用戶登入"""
    email = login_request.email
    password = login_request.password

    # 檢查用戶是否存在
    if email not in test_users:
        return LoginResponse(
            success=False,
            message="用戶不存在"
        )

    user = test_users[email]

    # 檢查密碼
    if user["password"] != password:
        return LoginResponse(
            success=False,
            message="密碼錯誤"
        )

    # 模擬 JWT token 生成
    fake_token = f"fake_jwt_token_for_{user['id']}"

    return LoginResponse(
        success=True,
        message="登入成功",
        data={
            "access_token": fake_token,
            "refresh_token": f"refresh_{fake_token}",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }
    )

@app.post("/auth/register", response_model=LoginResponse)
async def register(register_request: RegisterRequest):
    """用戶註冊"""
    email = register_request.email
    username = register_request.username
    password = register_request.password
    confirm_password = register_request.confirm_password

    # 檢查密碼確認
    if password != confirm_password:
        return LoginResponse(
            success=False,
            message="密碼確認不一致"
        )

    # 檢查用戶是否已存在
    if email in test_users:
        return LoginResponse(
            success=False,
            message="用戶已存在"
        )

    # 創建新用戶
    new_user_id = len(test_users) + 1
    test_users[email] = {
        "username": username,
        "email": email,
        "password": password,
        "id": new_user_id
    }

    return LoginResponse(
        success=True,
        message="註冊成功"
    )

@app.delete("/auth/logout")
async def logout():
    """用戶登出"""
    return {"success": True, "message": "登出成功"}

@app.get("/users/profile")
async def get_profile():
    """獲取用戶資料（需要認證）"""
    # 簡化版本，實際應用中需要驗證 JWT token
    return {
        "success": True,
        "data": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com"
        }
    }

@app.get("/dashboard/stats")
async def get_dashboard_stats():
    """獲取儀表板統計數據"""
    return {
        "success": True,
        "data": {
            "total_posts": 156,
            "today_posts": 8,
            "total_views": 12500,
            "total_engagement": 3200
        }
    }

# 貼文管理 API 端點
@app.get("/posts", response_model=PostListResponse)
async def get_posts(
    page: int = 1,
    limit: int = 10,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """獲取貼文列表"""
    try:
        # 過濾貼文
        filtered_posts = list(test_posts.values())

        # 按狀態篩選
        if status:
            filtered_posts = [post for post in filtered_posts if post["status"] == status]

        # 按標題搜尋
        if search:
            filtered_posts = [
                post for post in filtered_posts
                if search.lower() in post["title"].lower() or search.lower() in post["content"].lower()
            ]

        # 排序（最新的在前）
        filtered_posts.sort(key=lambda x: x["created_time"], reverse=True)

        # 分頁
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_posts = filtered_posts[start_index:end_index]

        # 格式化日期為字串（創建副本避免修改原始數據）
        formatted_posts = []
        for post in paginated_posts:
            formatted_post = post.copy()
            if isinstance(formatted_post["created_time"], datetime):
                formatted_post["created_time"] = formatted_post["created_time"].isoformat()
            if isinstance(formatted_post["updated_time"], datetime):
                formatted_post["updated_time"] = formatted_post["updated_time"].isoformat()
            if formatted_post["scheduled_time"] and isinstance(formatted_post["scheduled_time"], datetime):
                formatted_post["scheduled_time"] = formatted_post["scheduled_time"].isoformat()
            formatted_posts.append(formatted_post)

        return PostListResponse(
            success=True,
            message="貼文列表獲取成功",
            data={
                "posts": formatted_posts,
                "pagination": {
                    "current_page": page,
                    "per_page": limit,
                    "total": len(filtered_posts),
                    "pages": (len(filtered_posts) + limit - 1) // limit
                }
            }
        )
    except Exception as e:
        return PostListResponse(
            success=False,
            message=f"獲取貼文列表失敗: {str(e)}"
        )

@app.get("/posts/{post_id}")
async def get_post(post_id: int):
    """獲取單一貼文詳情"""
    if post_id not in test_posts:
        raise HTTPException(status_code=404, detail="貼文不存在")

    post = test_posts[post_id].copy()

    # 格式化日期為字串
    if isinstance(post["created_time"], datetime):
        post["created_time"] = post["created_time"].isoformat()
    if isinstance(post["updated_time"], datetime):
        post["updated_time"] = post["updated_time"].isoformat()
    if post["scheduled_time"] and isinstance(post["scheduled_time"], datetime):
        post["scheduled_time"] = post["scheduled_time"].isoformat()

    return {
        "success": True,
        "message": "貼文詳情獲取成功",
        "data": post
    }

@app.post("/posts")
async def create_post(post_request: PostCreateRequest):
    """創建新貼文"""
    try:
        # 生成新的貼文 ID
        new_id = max(test_posts.keys()) + 1 if test_posts else 1

        # 創建新貼文
        new_post = {
            "id": new_id,
            "title": post_request.title,
            "content": post_request.content,
            "status": post_request.status,
            "scheduled_time": post_request.scheduled_time,
            "created_time": datetime.now(),
            "updated_time": datetime.now(),
            "author_id": 1,  # 簡化版本，使用固定用戶ID
            "facebook_post_id": None,
            "engagement_stats": {}
        }

        test_posts[new_id] = new_post

        # 格式化回應數據
        response_post = new_post.copy()
        if isinstance(response_post["created_time"], datetime):
            response_post["created_time"] = response_post["created_time"].isoformat()
        if isinstance(response_post["updated_time"], datetime):
            response_post["updated_time"] = response_post["updated_time"].isoformat()
        if response_post["scheduled_time"] and isinstance(response_post["scheduled_time"], datetime):
            response_post["scheduled_time"] = response_post["scheduled_time"].isoformat()

        return {
            "success": True,
            "message": "貼文創建成功",
            "data": response_post
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"創建貼文失敗: {str(e)}")

@app.put("/posts/{post_id}")
async def update_post(post_id: int, post_request: PostUpdateRequest):
    """更新貼文"""
    if post_id not in test_posts:
        raise HTTPException(status_code=404, detail="貼文不存在")

    try:
        post = test_posts[post_id]

        # 更新欄位
        if post_request.title is not None:
            post["title"] = post_request.title
        if post_request.content is not None:
            post["content"] = post_request.content
        if post_request.status is not None:
            post["status"] = post_request.status
        if post_request.scheduled_time is not None:
            post["scheduled_time"] = post_request.scheduled_time

        post["updated_time"] = datetime.now()

        # 格式化回應數據
        response_post = post.copy()
        if isinstance(response_post["created_time"], datetime):
            response_post["created_time"] = response_post["created_time"].isoformat()
        if isinstance(response_post["updated_time"], datetime):
            response_post["updated_time"] = response_post["updated_time"].isoformat()
        if response_post["scheduled_time"] and isinstance(response_post["scheduled_time"], datetime):
            response_post["scheduled_time"] = response_post["scheduled_time"].isoformat()

        return {
            "success": True,
            "message": "貼文更新成功",
            "data": response_post
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"更新貼文失敗: {str(e)}")

@app.delete("/posts/{post_id}")
async def delete_post(post_id: int):
    """刪除貼文"""
    if post_id not in test_posts:
        raise HTTPException(status_code=404, detail="貼文不存在")

    try:
        deleted_post = test_posts.pop(post_id)

        return {
            "success": True,
            "message": "貼文刪除成功",
            "data": {"deleted_id": post_id}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"刪除貼文失敗: {str(e)}")

@app.post("/posts/{post_id}/publish")
async def publish_post(post_id: int):
    """發布貼文到 Facebook"""
    if post_id not in test_posts:
        raise HTTPException(status_code=404, detail="貼文不存在")

    try:
        post = test_posts[post_id]

        # 模擬發布到 Facebook
        if post["status"] == "published":
            return {
                "success": False,
                "message": "貼文已經發布"
            }

        # 更新貼文狀態
        post["status"] = "published"
        post["facebook_post_id"] = f"fb_{post_id}_{int(datetime.now().timestamp())}"
        post["updated_time"] = datetime.now()

        return {
            "success": True,
            "message": "貼文發布成功",
            "data": {
                "post_id": post_id,
                "facebook_post_id": post["facebook_post_id"],
                "status": post["status"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"發布貼文失敗: {str(e)}")

@app.get("/posts/stats/summary")
async def get_posts_stats():
    """獲取貼文統計摘要"""
    try:
        total_posts = len(test_posts)
        published_posts = len([p for p in test_posts.values() if p["status"] == "published"])
        draft_posts = len([p for p in test_posts.values() if p["status"] == "draft"])
        scheduled_posts = len([p for p in test_posts.values() if p["status"] == "scheduled"])
        failed_posts = len([p for p in test_posts.values() if p["status"] == "failed"])

        # 計算今日發布的貼文
        today = datetime.now().date()
        today_posts = len([
            p for p in test_posts.values()
            if p["status"] == "published" and p["created_time"].date() == today
        ])

        # 計算總互動數
        total_engagement = sum([
            sum(p.get("engagement_stats", {}).values())
            for p in test_posts.values()
        ])

        return {
            "success": True,
            "message": "統計數據獲取成功",
            "data": {
                "total_posts": total_posts,
                "published_posts": published_posts,
                "draft_posts": draft_posts,
                "scheduled_posts": scheduled_posts,
                "failed_posts": failed_posts,
                "today_posts": today_posts,
                "total_engagement": total_engagement
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"獲取統計數據失敗: {str(e)}")