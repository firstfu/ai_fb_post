#!/usr/bin/env python3
"""
AI 功能測試腳本

此腳本用於測試 AI 貼文生成系統的各項功能：
- 驗證依賴套件安裝
- 測試 AI 模組導入
- 檢查配置文件
- 進行基本功能測試

@fileoverview AI 功能測試腳本
@version 1.0.0
@author AI Assistant
@created 2024-01-20
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any

def test_imports():
    """測試必要的套件導入"""
    print("🔍 測試套件導入...")

    required_packages = [
        ("streamlit", "Streamlit 前端框架"),
        ("pydantic", "數據驗證"),
        ("pandas", "數據處理"),
        ("plotly", "圖表繪製"),
        ("langchain", "LangChain AI 框架"),
        ("langgraph", "LangGraph 工作流程"),
        ("openai", "OpenAI API"),
        ("requests", "HTTP 請求"),
        ("PIL", "圖像處理")
    ]

    missing_packages = []

    for package, description in required_packages:
        try:
            __import__(package)
            print(f"  ✅ {package} - {description}")
        except ImportError:
            print(f"  ❌ {package} - {description} (未安裝)")
            missing_packages.append(package)

    if missing_packages:
        print(f"\n⚠️ 缺少以下套件：{', '.join(missing_packages)}")
        print("請執行：pip install -r requirements.txt")
        return False
    else:
        print("✅ 所有必要套件已安裝")
        return True

def test_ai_module():
    """測試 AI 模組導入"""
    print("\n🤖 測試 AI 模組...")

    try:
        from ai_post_generator import (
            PostGenerationRequest,
            GeneratedPost,
            AIPostWorkflow,
            AIConfigManager
        )
        print("  ✅ AI 模組導入成功")

        # 測試配置管理器
        config = AIConfigManager.load_config()
        print(f"  ✅ 配置文件載入成功：{len(config)} 個設定項目")

        # 測試請求模型
        test_request = PostGenerationRequest(
            topic="測試主題",
            target_audience="一般大眾",
            post_type="推廣",
            tone="友善親切"
        )
        print("  ✅ 請求模型創建成功")

        return True

    except ImportError as e:
        print(f"  ❌ AI 模組導入失敗：{e}")
        return False
    except Exception as e:
        print(f"  ❌ AI 模組測試失敗：{e}")
        return False

def test_directories():
    """測試目錄結構"""
    print("\n📁 檢查目錄結構...")

    required_dirs = [
        ("data", "數據存儲目錄"),
        ("data/generated_images", "AI 生成圖片目錄"),
        ("data/uploaded_images", "用戶上傳圖片目錄")
    ]

    for dir_path, description in required_dirs:
        path = Path(dir_path)
        if path.exists():
            print(f"  ✅ {dir_path} - {description}")
        else:
            print(f"  ⚠️ {dir_path} - {description} (不存在，將自動創建)")
            path.mkdir(parents=True, exist_ok=True)
            print(f"     ✅ 已創建 {dir_path}")

    return True

def test_configuration():
    """測試配置文件"""
    print("\n⚙️ 檢查 AI 配置...")

    try:
        from ai_post_generator import AIConfigManager

        config = AIConfigManager.load_config()

        # 檢查 API 金鑰配置
        has_openai = bool(config.get("openai_api_key"))
        has_anthropic = bool(config.get("anthropic_api_key"))

        print(f"  📍 OpenAI API Key: {'✅ 已設定' if has_openai else '❌ 未設定'}")
        print(f"  📍 Anthropic API Key: {'✅ 已設定' if has_anthropic else '❌ 未設定'}")

        if not has_openai and not has_anthropic:
            print("  ⚠️ 需要至少設定一個 API Key 才能使用 AI 功能")
            print("     請在 Streamlit 應用程式的「AI 設定」標籤頁配置")

        # 檢查模型設定
        model = config.get("default_model", "未設定")
        temperature = config.get("temperature", 0.7)
        max_tokens = config.get("max_tokens", 1000)

        print(f"  🧠 預設模型: {model}")
        print(f"  🎨 創意度: {temperature}")
        print(f"  📏 最大長度: {max_tokens}")

        return has_openai or has_anthropic

    except Exception as e:
        print(f"  ❌ 配置檢查失敗：{e}")
        return False

def test_basic_workflow():
    """測試基本工作流程（不需要 API Key）"""
    print("\n🔄 測試基本工作流程...")

    try:
        from ai_post_generator import PostGenerationRequest, AIPostWorkflow

        # 創建測試請求
        test_request = PostGenerationRequest(
            topic="測試 AI 貼文生成",
            target_audience="開發者",
            post_type="教育",
            tone="專業權威",
            include_hashtags=True,
            include_emoji=True,
            max_length=200,
            generate_image=False  # 不生成圖片避免消耗 API 額度
        )
        print("  ✅ 測試請求創建成功")

        # 初始化工作流程（不執行，只檢查結構）
        try:
            workflow = AIPostWorkflow()
            print("  ✅ 工作流程初始化成功")
        except ValueError as e:
            if "API Key" in str(e):
                print("  ⚠️ 工作流程需要 API Key，但結構正常")
            else:
                print(f"  ❌ 工作流程初始化失敗：{e}")
                return False
        except Exception as e:
            print(f"  ❌ 工作流程測試失敗：{e}")
            return False

        return True

    except Exception as e:
        print(f"  ❌ 基本工作流程測試失敗：{e}")
        return False

def main():
    """主測試函數"""
    print("🚀 AI 自動化 Facebook 發文系統 - 功能測試")
    print("=" * 50)

    tests = [
        ("套件導入", test_imports),
        ("AI 模組", test_ai_module),
        ("目錄結構", test_directories),
        ("配置文件", test_configuration),
        ("基本工作流程", test_basic_workflow)
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"  ❌ {test_name} 測試過程發生錯誤：{e}")
            results.append((test_name, False))

    # 總結測試結果
    print("\n" + "=" * 50)
    print("📊 測試結果總結")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"  {test_name}: {status}")

    print(f"\n🎯 總體結果：{passed}/{total} 項測試通過")

    if passed == total:
        print("🎉 所有測試通過！系統已準備就緒。")
        print("\n📝 下一步：")
        print("1. 執行 'streamlit run streamlit_app.py' 啟動應用程式")
        print("2. 在「AI 設定」標籤頁配置 API Key")
        print("3. 開始使用 AI 生成貼文功能")
    else:
        print("⚠️ 部分測試未通過，請檢查上述錯誤訊息。")
        print("\n🔧 常見解決方案：")
        print("1. 安裝缺少的套件：pip install -r requirements.txt")
        print("2. 檢查 Python 版本（建議 3.8 以上）")
        print("3. 確認網路連線正常")

    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)