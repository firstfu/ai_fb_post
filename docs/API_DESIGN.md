# AI 自動化 Facebook 發文系統 - API 設計文件

## 1. API 概覽

### 1.1 基本資訊

- **基礎 URL**: `https://api.facebook-auto-poster.com/v1`
- **認證方式**: JWT Bearer Token
- **數據格式**: JSON
- **字符編碼**: UTF-8

### 1.2 通用響應格式

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "uuid-here"
}
```

### 1.3 錯誤響應格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "uuid-here"
}
```

## 2. 認證 API

### 2.1 用戶註冊

```http
POST /auth/register
Content-Type: application/json

{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "confirm_password": "SecurePassword123!"
}
```

**響應**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 2.2 用戶登入

```http
POST /auth/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "SecurePassword123!"
}
```

**響應**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": 123,
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

### 2.3 Facebook 授權

```http
POST /auth/facebook
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "facebook_code": "authorization_code_from_facebook",
    "redirect_uri": "https://your-app.com/callback"
}
```

**響應**:

```json
{
  "success": true,
  "message": "Facebook account connected successfully",
  "data": {
    "account_id": 456,
    "page_id": "facebook_page_id",
    "page_name": "My Facebook Page",
    "account_type": "page",
    "permissions": ["pages_manage_posts", "pages_read_engagement"]
  }
}
```

### 2.4 刷新令牌

```http
POST /auth/refresh
Content-Type: application/json

{
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

### 2.5 用戶登出

```http
DELETE /auth/logout
Authorization: Bearer {access_token}
```

## 3. 用戶管理 API

### 3.1 獲取用戶資料

```http
GET /users/profile
Authorization: Bearer {access_token}
```

**響應**:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T12:00:00Z",
    "facebook_accounts": [
      {
        "id": 456,
        "page_name": "My Facebook Page",
        "account_type": "page",
        "is_active": true
      }
    ]
  }
}
```

### 3.2 更新用戶資料

```http
PUT /users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "username": "new_username",
    "email": "new_email@example.com"
}
```

## 4. 內容生成 API

### 4.1 生成貼文內容

```http
POST /content/generate
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "topic": "健康飲食",
    "style": "friendly",
    "language": "zh-TW",
    "keywords": ["蔬菜", "營養", "健康"],
    "length": "medium",
    "include_hashtags": true,
    "include_call_to_action": true
}
```

**響應**:

```json
{
  "success": true,
  "data": {
    "content": "🥗 健康飲食小貼士！\n\n多吃新鮮蔬菜不僅能補充豐富的營養素，還能讓身體更健康！今天你吃了幾種顏色的蔬菜呢？\n\n💡 小建議：每餐至少包含3種不同顏色的蔬菜，讓營養更均衡！\n\n你最喜歡哪種蔬菜？留言告訴我們吧！👇\n\n#健康飲食 #蔬菜 #營養 #健康生活 #均衡飲食",
    "word_count": 78,
    "hashtags": ["健康飲食", "蔬菜", "營養", "健康生活", "均衡飲食"],
    "generation_time": 2.3
  }
}
```

### 4.2 獲取模板列表

```http
GET /content/templates?category=health&page=1&limit=10
Authorization: Bearer {access_token}
```

**響應**:

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 1,
        "title": "健康飲食模板",
        "category": "health",
        "template_content": "今天來分享關於 {topic} 的小知識！{content} 你覺得怎麼樣？ #健康 #{topic}",
        "variables": ["topic", "content"],
        "created_at": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

### 4.3 創建模板

```http
POST /content/templates
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "title": "產品推廣模板",
    "category": "marketing",
    "template_content": "🎉 {product_name} 新品上市！\n\n{description}\n\n限時優惠價：{price}\n\n立即購買：{link}\n\n#{product_name} #新品上市 #限時優惠",
    "variables": ["product_name", "description", "price", "link"]
}
```

### 4.4 更新模板

```http
PUT /content/templates/{template_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "title": "更新後的模板標題",
    "template_content": "更新後的模板內容..."
}
```

### 4.5 刪除模板

```http
DELETE /content/templates/{template_id}
Authorization: Bearer {access_token}
```

## 5. 發文管理 API

### 5.1 獲取貼文列表

```http
GET /posts?status=draft&page=1&limit=20&sort=created_at&order=desc
Authorization: Bearer {access_token}
```

**響應**:

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 789,
        "content": "這是一則測試貼文內容...",
        "status": "draft",
        "scheduled_time": "2024-01-02T10:00:00Z",
        "facebook_account": {
          "id": 456,
          "page_name": "My Facebook Page"
        },
        "template": {
          "id": 1,
          "title": "健康飲食模板"
        },
        "media_urls": ["https://example.com/image1.jpg"],
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

### 5.2 創建貼文

```http
POST /posts
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "content": "這是一則新的貼文內容...",
    "facebook_account_id": 456,
    "template_id": 1,
    "media_urls": ["https://example.com/image1.jpg"],
    "scheduled_time": "2024-01-02T10:00:00Z",
    "auto_publish": false
}
```

**響應**:

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": 789,
    "content": "這是一則新的貼文內容...",
    "status": "draft",
    "scheduled_time": "2024-01-02T10:00:00Z",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 5.3 更新貼文

```http
PUT /posts/{post_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "content": "更新後的貼文內容...",
    "scheduled_time": "2024-01-02T14:00:00Z"
}
```

### 5.4 刪除貼文

```http
DELETE /posts/{post_id}
Authorization: Bearer {access_token}
```

### 5.5 立即發布貼文

```http
POST /posts/{post_id}/publish
Authorization: Bearer {access_token}
```

**響應**:

```json
{
  "success": true,
  "message": "Post published successfully",
  "data": {
    "id": 789,
    "status": "published",
    "facebook_post_id": "123456789_987654321",
    "published_time": "2024-01-01T12:00:00Z"
  }
}
```

### 5.6 排程發布貼文

```http
POST /posts/{post_id}/schedule
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "scheduled_time": "2024-01-02T10:00:00Z"
}
```

### 5.7 取消排程

```http
DELETE /posts/{post_id}/schedule
Authorization: Bearer {access_token}
```

## 6. Facebook 帳號管理 API

### 6.1 獲取 Facebook 帳號列表

```http
GET /facebook-accounts
Authorization: Bearer {access_token}
```

**響應**:

```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": 456,
        "page_id": "facebook_page_id",
        "page_name": "My Facebook Page",
        "account_type": "page",
        "is_active": true,
        "permissions": ["pages_manage_posts", "pages_read_engagement"],
        "created_at": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

### 6.2 更新 Facebook 帳號設定

```http
PUT /facebook-accounts/{account_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "is_active": true,
    "auto_refresh_token": true
}
```

### 6.3 刪除 Facebook 帳號

```http
DELETE /facebook-accounts/{account_id}
Authorization: Bearer {access_token}
```

## 7. 分析 API

### 7.1 獲取貼文分析數據

```http
GET /analytics/posts/{post_id}
Authorization: Bearer {access_token}
```

**響應**:

```json
{
  "success": true,
  "data": {
    "post_id": 789,
    "facebook_post_id": "123456789_987654321",
    "metrics": {
      "likes": 45,
      "comments": 12,
      "shares": 8,
      "reach": 1250,
      "engagement_rate": 5.2
    },
    "last_updated": "2024-01-01T18:00:00Z"
  }
}
```

### 7.2 獲取總體分析報告

```http
GET /analytics/overview?period=last_30_days&facebook_account_id=456
Authorization: Bearer {access_token}
```

**響應**:

```json
{
  "success": true,
  "data": {
    "period": "last_30_days",
    "summary": {
      "total_posts": 25,
      "total_likes": 1250,
      "total_comments": 380,
      "total_shares": 95,
      "average_engagement_rate": 4.8,
      "best_performing_post": {
        "id": 789,
        "content": "最佳表現的貼文內容...",
        "engagement_rate": 12.5
      }
    },
    "trends": {
      "engagement_by_day": [
        { "date": "2024-01-01", "engagement": 45 },
        { "date": "2024-01-02", "engagement": 52 }
      ],
      "best_posting_times": [
        { "hour": 10, "average_engagement": 6.2 },
        { "hour": 19, "average_engagement": 5.8 }
      ]
    }
  }
}
```

### 7.3 獲取內容效果分析

```http
GET /analytics/content-performance?period=last_7_days
Authorization: Bearer {access_token}
```

## 8. 系統設定 API

### 8.1 獲取用戶設定

```http
GET /settings
Authorization: Bearer {access_token}
```

**響應**:

```json
{
  "success": true,
  "data": {
    "notifications": {
      "email_on_publish": true,
      "email_on_error": true
    },
    "posting": {
      "auto_hashtags": true,
      "default_language": "zh-TW",
      "timezone": "Asia/Taipei"
    },
    "ai": {
      "preferred_style": "friendly",
      "content_length": "medium"
    }
  }
}
```

### 8.2 更新用戶設定

```http
PUT /settings
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "notifications": {
        "email_on_publish": false,
        "email_on_error": true
    },
    "ai": {
        "preferred_style": "professional"
    }
}
```

## 9. 媒體管理 API

### 9.1 上傳媒體檔案

```http
POST /media/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: [binary_file_data]
alt_text: "圖片說明文字"
```

**響應**:

```json
{
  "success": true,
  "data": {
    "id": "media_123",
    "url": "https://cdn.example.com/media/image_123.jpg",
    "thumbnail_url": "https://cdn.example.com/media/thumb_123.jpg",
    "file_type": "image/jpeg",
    "file_size": 245760,
    "alt_text": "圖片說明文字",
    "uploaded_at": "2024-01-01T12:00:00Z"
  }
}
```

### 9.2 獲取媒體檔案列表

```http
GET /media?type=image&page=1&limit=20
Authorization: Bearer {access_token}
```

### 9.3 刪除媒體檔案

```http
DELETE /media/{media_id}
Authorization: Bearer {access_token}
```

## 10. 狀態碼說明

| 狀態碼 | 說明           |
| ------ | -------------- |
| 200    | 請求成功       |
| 201    | 資源創建成功   |
| 400    | 請求參數錯誤   |
| 401    | 未授權         |
| 403    | 權限不足       |
| 404    | 資源不存在     |
| 409    | 資源衝突       |
| 422    | 驗證錯誤       |
| 429    | 請求過於頻繁   |
| 500    | 服務器內部錯誤 |

## 11. 錯誤代碼說明

| 錯誤代碼              | 說明              |
| --------------------- | ----------------- |
| VALIDATION_ERROR      | 輸入驗證錯誤      |
| AUTHENTICATION_FAILED | 認證失敗          |
| AUTHORIZATION_DENIED  | 權限不足          |
| RESOURCE_NOT_FOUND    | 資源不存在        |
| RATE_LIMIT_EXCEEDED   | 請求限制超出      |
| FACEBOOK_API_ERROR    | Facebook API 錯誤 |
| AI_SERVICE_ERROR      | AI 服務錯誤       |
| DATABASE_ERROR        | 資料庫錯誤        |
| INTERNAL_SERVER_ERROR | 服務器內部錯誤    |

這份 API 設計文件為開發團隊提供了完整的 API 規範，確保前後端開發的一致性和效率。
