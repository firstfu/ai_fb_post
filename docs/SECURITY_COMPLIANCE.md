# AI 自動化 Facebook 發文系統 - 安全與合規指南

## 1. 安全架構概覽

### 1.1 安全設計原則

- **最小權限原則**: 用戶和系統組件僅獲得執行其功能所需的最小權限
- **多層防護**: 實施多重安全措施，確保單點故障不會危及整個系統
- **數據加密**: 所有敏感數據在傳輸和存儲過程中都必須加密
- **審計追蹤**: 記錄所有重要操作和系統事件
- **定期更新**: 定期更新安全補丁和依賴包

### 1.2 威脅模型分析

```
外部威脅:
├── API 攻擊 (DDoS, 注入攻擊)
├── 認證攻擊 (暴力破解, 令牌竊取)
├── 數據泄露 (未授權訪問)
└── 社工攻擊 (釣魚, 身份偽造)

內部威脅:
├── 權限濫用
├── 數據洩露
└── 系統誤操作
```

## 2. 認證與授權安全

### 2.1 用戶認證安全

#### 2.1.1 密碼安全政策

```python
# 密碼強度要求
密碼最小長度: 8 位字符
必須包含: 大寫字母、小寫字母、數字、特殊字符
禁止: 常見密碼、用戶名相關密碼
過期策略: 90 天強制更換

# 實作示例
import bcrypt
import secrets

def hash_password(password: str) -> str:
    """使用 bcrypt 進行密碼雜湊"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """驗證密碼"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
```

#### 2.1.2 JWT 令牌安全

```python
# JWT 配置安全參數
{
    "algorithm": "HS256",
    "access_token_expire": 3600,  # 1 小時
    "refresh_token_expire": 604800,  # 7 天
    "issuer": "facebook-auto-poster",
    "audience": "facebook-auto-poster-users"
}

# 令牌撤銷機制
class TokenBlacklist:
    """令牌黑名單管理"""
    def __init__(self, redis_client):
        self.redis = redis_client

    def revoke_token(self, jti: str, exp: int):
        """撤銷令牌"""
        ttl = exp - int(time.time())
        if ttl > 0:
            self.redis.setex(f"blacklist:{jti}", ttl, "revoked")

    def is_revoked(self, jti: str) -> bool:
        """檢查令牌是否被撤銷"""
        return self.redis.exists(f"blacklist:{jti}")
```

#### 2.1.3 多重身份驗證 (MFA)

```python
# TOTP 實作
import pyotp

class MFAService:
    @staticmethod
    def generate_secret() -> str:
        """生成 TOTP 密鑰"""
        return pyotp.random_base32()

    @staticmethod
    def verify_totp(secret: str, token: str) -> bool:
        """驗證 TOTP 令牌"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
```

### 2.2 API 授權安全

#### 2.2.1 基於角色的權限控制 (RBAC)

```python
# 權限定義
class Permission(Enum):
    READ_POSTS = "posts:read"
    WRITE_POSTS = "posts:write"
    DELETE_POSTS = "posts:delete"
    MANAGE_USERS = "users:manage"
    VIEW_ANALYTICS = "analytics:view"

# 角色定義
ROLES = {
    "user": [
        Permission.READ_POSTS,
        Permission.WRITE_POSTS,
        Permission.VIEW_ANALYTICS
    ],
    "admin": [
        Permission.READ_POSTS,
        Permission.WRITE_POSTS,
        Permission.DELETE_POSTS,
        Permission.MANAGE_USERS,
        Permission.VIEW_ANALYTICS
    ]
}

# 權限檢查裝飾器
def require_permission(permission: Permission):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = get_current_user()
            if not has_permission(user, permission):
                raise HTTPException(403, "權限不足")
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

## 3. 數據安全

### 3.1 數據加密

#### 3.1.1 傳輸加密

```python
# HTTPS 強制配置
from fastapi import FastAPI, Request
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()
app.add_middleware(HTTPSRedirectMiddleware)

# TLS 配置
TLS_CONFIG = {
    "min_version": "TLSv1.2",
    "ciphers": [
        "ECDHE-RSA-AES256-GCM-SHA384",
        "ECDHE-RSA-AES128-GCM-SHA256",
        "ECDHE-RSA-AES256-SHA384"
    ]
}
```

#### 3.1.2 靜態數據加密

```python
# AES 加密實作
from cryptography.fernet import Fernet
import base64

class DataEncryption:
    def __init__(self, key: str):
        self.fernet = Fernet(key.encode())

    def encrypt(self, data: str) -> str:
        """加密數據"""
        encrypted = self.fernet.encrypt(data.encode())
        return base64.b64encode(encrypted).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """解密數據"""
        encrypted = base64.b64decode(encrypted_data.encode())
        return self.fernet.decrypt(encrypted).decode()

# Facebook Token 加密存儲
class FacebookTokenManager:
    def __init__(self, encryption_key: str):
        self.encryption = DataEncryption(encryption_key)

    def store_token(self, user_id: int, access_token: str):
        """加密存儲 Facebook 令牌"""
        encrypted_token = self.encryption.encrypt(access_token)
        # 存儲到資料庫

    def get_token(self, user_id: int) -> str:
        """解密獲取 Facebook 令牌"""
        encrypted_token = # 從資料庫獲取
        return self.encryption.decrypt(encrypted_token)
```

### 3.2 數據庫安全

#### 3.2.1 SQL 注入防護

```python
# 使用 SQLAlchemy ORM 避免 SQL 注入
from sqlalchemy.orm import Session
from sqlalchemy import text

# 正確的參數化查詢
def get_user_posts(db: Session, user_id: int, status: str):
    return db.query(Post).filter(
        Post.user_id == user_id,
        Post.status == status
    ).all()

# 動態查詢時使用參數綁定
def search_posts(db: Session, search_term: str):
    query = text("""
        SELECT * FROM posts
        WHERE content ILIKE :search_term
    """)
    return db.execute(query, {"search_term": f"%{search_term}%"}).fetchall()
```

#### 3.2.2 數據庫連接安全

```python
# 資料庫連接配置
DATABASE_CONFIG = {
    "url": "postgresql://user:password@localhost:5432/db",
    "pool_size": 10,
    "max_overflow": 20,
    "pool_pre_ping": True,
    "pool_recycle": 300,
    "connect_args": {
        "sslmode": "require",
        "sslcert": "/path/to/client.crt",
        "sslkey": "/path/to/client.key",
        "sslrootcert": "/path/to/ca.crt"
    }
}
```

## 4. API 安全

### 4.1 輸入驗證與清理

#### 4.1.1 數據驗證

```python
from pydantic import BaseModel, validator, Field
import re

class PostCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    scheduled_time: Optional[datetime] = None

    @validator('content')
    def validate_content(cls, v):
        # 清理 HTML 標籤
        clean_content = re.sub(r'<[^>]+>', '', v)
        # 檢查禁用字符
        if re.search(r'[<>"\']', clean_content):
            raise ValueError("內容包含非法字符")
        return clean_content.strip()

    @validator('scheduled_time')
    def validate_scheduled_time(cls, v):
        if v and v <= datetime.now():
            raise ValueError("排程時間必須在未來")
        return v
```

#### 4.1.2 XSS 防護

```python
import html
from markupsafe import escape

class ContentSanitizer:
    @staticmethod
    def sanitize_content(content: str) -> str:
        """清理用戶輸入內容"""
        # HTML 編碼
        sanitized = html.escape(content)
        # 移除危險字符
        sanitized = re.sub(r'[<>"\']', '', sanitized)
        return sanitized.strip()

    @staticmethod
    def sanitize_for_output(content: str) -> str:
        """為輸出準備內容"""
        return escape(content)
```

### 4.2 速率限制

#### 4.2.1 API 請求限制

```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

# 全局限制配置
@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost")
    await FastAPILimiter.init(redis)

# 端點限制
@app.post("/content/generate")
@Depends(RateLimiter(times=10, seconds=60))  # 每分鐘 10 次
async def generate_content():
    pass

@app.post("/posts")
@Depends(RateLimiter(times=50, seconds=3600))  # 每小時 50 次
async def create_post():
    pass
```

#### 4.2.2 用戶行為監控

```python
class SecurityMonitor:
    def __init__(self, redis_client):
        self.redis = redis_client

    async def track_failed_attempts(self, identifier: str):
        """追蹤失敗嘗試"""
        key = f"failed_attempts:{identifier}"
        count = await self.redis.incr(key)
        await self.redis.expire(key, 3600)  # 1 小時過期

        if count >= 5:
            await self.block_user(identifier, 3600)  # 封鎖 1 小時

    async def block_user(self, identifier: str, duration: int):
        """封鎖用戶"""
        key = f"blocked:{identifier}"
        await self.redis.setex(key, duration, "blocked")
```

## 5. Facebook API 安全整合

### 5.1 OAuth 安全實作

#### 5.1.1 安全的授權流程

```python
import secrets
from urllib.parse import urlencode

class FacebookOAuth:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret

    def generate_auth_url(self, redirect_uri: str) -> tuple[str, str]:
        """生成授權 URL"""
        state = secrets.token_urlsafe(32)
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": "pages_manage_posts,pages_read_engagement",
            "response_type": "code"
        }

        auth_url = f"https://www.facebook.com/v18.0/dialog/oauth?{urlencode(params)}"
        return auth_url, state

    async def exchange_code_for_token(self, code: str, redirect_uri: str):
        """交換授權碼為訪問令牌"""
        # 實作 PKCE 驗證
        # 驗證 state 參數
        # 安全的令牌交換
        pass
```

#### 5.1.2 令牌安全管理

```python
class FacebookTokenManager:
    def __init__(self, encryption_service):
        self.encryption = encryption_service

    async def store_access_token(self, user_id: int, token_data: dict):
        """安全存儲訪問令牌"""
        encrypted_token = self.encryption.encrypt(token_data['access_token'])

        # 存儲加密的令牌和過期時間
        await self.db.execute("""
            INSERT INTO facebook_tokens (user_id, encrypted_token, expires_at)
            VALUES (:user_id, :token, :expires_at)
            ON CONFLICT (user_id) DO UPDATE SET
                encrypted_token = :token,
                expires_at = :expires_at
        """, {
            "user_id": user_id,
            "token": encrypted_token,
            "expires_at": datetime.now() + timedelta(seconds=token_data['expires_in'])
        })

    async def refresh_token_if_needed(self, user_id: int):
        """自動刷新過期令牌"""
        # 檢查令牌是否即將過期
        # 自動刷新並更新存儲
        pass
```

## 6. 日誌與監控

### 6.1 安全日誌記錄

#### 6.1.1 日誌配置

```python
import logging
from pythonjsonlogger import jsonlogger

# 安全日誌配置
security_logger = logging.getLogger("security")
handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    "%(asctime)s %(name)s %(levelname)s %(message)s"
)
handler.setFormatter(formatter)
security_logger.addHandler(handler)
security_logger.setLevel(logging.INFO)

class SecurityLogger:
    @staticmethod
    def log_login_attempt(user_id: str, ip: str, success: bool):
        """記錄登入嘗試"""
        security_logger.info("Login attempt", extra={
            "event_type": "login_attempt",
            "user_id": user_id,
            "ip_address": ip,
            "success": success,
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    def log_permission_denied(user_id: str, resource: str, action: str):
        """記錄權限拒絕"""
        security_logger.warning("Permission denied", extra={
            "event_type": "permission_denied",
            "user_id": user_id,
            "resource": resource,
            "action": action,
            "timestamp": datetime.now().isoformat()
        })
```

#### 6.1.2 異常行為檢測

```python
class AnomalyDetector:
    def __init__(self, redis_client):
        self.redis = redis_client

    async def detect_unusual_activity(self, user_id: int, action: str):
        """檢測異常活動"""
        key = f"activity:{user_id}:{action}"

        # 統計過去 1 小時的活動
        current_hour = datetime.now().strftime("%Y%m%d%H")
        count = await self.redis.incr(f"{key}:{current_hour}")
        await self.redis.expire(f"{key}:{current_hour}", 3600)

        # 檢查是否超過正常閾值
        thresholds = {
            "post_creation": 20,
            "content_generation": 50,
            "login_attempts": 10
        }

        if count > thresholds.get(action, 100):
            await self.trigger_security_alert(user_id, action, count)

    async def trigger_security_alert(self, user_id: int, action: str, count: int):
        """觸發安全警報"""
        security_logger.critical("Unusual activity detected", extra={
            "event_type": "anomaly_detected",
            "user_id": user_id,
            "action": action,
            "count": count,
            "timestamp": datetime.now().isoformat()
        })
```

## 7. 合規性要求

### 7.1 GDPR 合規

#### 7.1.1 數據處理合規

```python
class GDPRCompliance:
    @staticmethod
    def log_data_processing(user_id: int, data_type: str, purpose: str):
        """記錄數據處理活動"""
        gdpr_logger.info("Data processing", extra={
            "user_id": user_id,
            "data_type": data_type,
            "purpose": purpose,
            "legal_basis": "legitimate_interest",
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    async def handle_data_deletion_request(user_id: int):
        """處理數據刪除請求"""
        # 刪除用戶所有數據
        # 記錄刪除操作
        # 通知相關系統
        pass

    @staticmethod
    async def export_user_data(user_id: int) -> dict:
        """導出用戶數據"""
        # 收集用戶所有數據
        # 格式化為可讀格式
        # 記錄導出操作
        pass
```

### 7.2 Facebook API 合規

#### 7.2.1 API 使用合規檢查

```python
class FacebookAPICompliance:
    @staticmethod
    def validate_post_content(content: str) -> bool:
        """驗證貼文內容合規性"""
        prohibited_patterns = [
            r'spam',
            r'fake.*news',
            r'click.*bait'
        ]

        for pattern in prohibited_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return False
        return True

    @staticmethod
    def check_rate_limits():
        """檢查 API 調用限制"""
        # 監控 API 調用頻率
        # 確保不超過 Facebook 限制
        pass
```

## 8. 安全檢查清單

### 8.1 部署前安全檢查

- [ ] 所有敏感配置使用環境變數
- [ ] 數據庫密碼複雜度符合要求
- [ ] HTTPS 證書正確配置
- [ ] API 端點權限檢查完整
- [ ] 輸入驗證和清理機制就位
- [ ] 錯誤處理不洩露敏感信息
- [ ] 日誌記錄配置正確
- [ ] 備份和恢復程序已測試

### 8.2 運行時安全監控

- [ ] 異常登入活動監控
- [ ] API 調用頻率監控
- [ ] 錯誤率異常監控
- [ ] 資料庫性能監控
- [ ] 系統資源使用監控

### 8.3 定期安全維護

- [ ] 依賴包安全更新
- [ ] 安全配置審查
- [ ] 權限分配審查
- [ ] 日誌分析和審計
- [ ] 滲透測試執行

## 9. 事件響應計畫

### 9.1 安全事件分類

```
P1 - 重大事件: 數據洩露、系統入侵
P2 - 高級事件: 服務中斷、權限濫用
P3 - 中級事件: 異常活動、配置錯誤
P4 - 低級事件: 日常安全警報
```

### 9.2 響應流程

1. **事件檢測與報告**
2. **事件評估與分類**
3. **初始響應與隔離**
4. **詳細調查與分析**
5. **修復與恢復**
6. **事後分析與改進**

這份安全與合規指南為系統提供了全面的安全保護框架，確保用戶數據安全和系統穩定運行。
