#!/usr/bin/env python3
"""
AI 自動化 Facebook 發文系統 - 啟動腳本

快速啟動 Streamlit 應用的便捷腳本

使用方法：
python start_app.py

@fileoverview 應用啟動腳本
@version 1.0.0
@author AI Assistant
@created 2024-01-20
"""

import subprocess
import sys
import os
from pathlib import Path

def check_dependencies():
    """檢查必要的依賴是否已安裝"""
    try:
        import streamlit
        import pandas
        import plotly
        import pydantic
        print("✅ 所有依賴項目已安裝")
        return True
    except ImportError as e:
        print(f"❌ 缺少依賴項目: {e}")
        print("請運行: pip install -r requirements.txt")
        return False

def main():
    """主啟動函數"""
    print("🚀 AI 自動化 Facebook 發文系統 - Streamlit MVP")
    print("=" * 50)

    # 檢查當前目錄
    current_dir = Path.cwd()
    streamlit_app = current_dir / "streamlit_app.py"

    if not streamlit_app.exists():
        print("❌ 找不到 streamlit_app.py 文件")
        print("請確保在正確的項目目錄中運行此腳本")
        sys.exit(1)

    # 檢查依賴
    if not check_dependencies():
        sys.exit(1)

    # 啟動 Streamlit 應用
    print("🌐 正在啟動 Streamlit 應用...")
    print("📝 應用將在瀏覽器中自動打開")
    print("🔗 如果沒有自動打開，請訪問: http://localhost:8501")
    print("-" * 50)

    try:
        # 啟動 Streamlit
        subprocess.run([
            sys.executable, "-m", "streamlit", "run",
            "streamlit_app.py",
            "--server.headless", "false",
            "--browser.gatherUsageStats", "false"
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 應用已停止")
    except subprocess.CalledProcessError as e:
        print(f"❌ 啟動失敗: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()