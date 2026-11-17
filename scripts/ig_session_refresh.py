"""
IG Session Refresher — 使用 Playwright 自动登录 Instagram 提取 sessionid

使用方式：
  1. 本地运行：python ig_session_refresh.py
     → 自动登录并更新 ig_sessionid.txt
  2. GitHub Actions：配合 workflow 自动更新 GitHub Secret

前置条件：
  pip install playwright
  playwright install chromium

环境变量：
  IG_USERNAME — Instagram 用户名
  IG_PASSWORD — Instagram 密码
"""

import os
import sys
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SESSION_ID_FILE = SCRIPT_DIR / "ig_sessionid.txt"


def refresh_session() -> str:
    """使用 Playwright 无头浏览器登录 Instagram，返回 sessionid。"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("❌ 请先安装 playwright: pip install playwright && playwright install chromium")
        sys.exit(1)

    username = os.environ.get("IG_USERNAME", "").strip()
    password = os.environ.get("IG_PASSWORD", "").strip()

    if not username or not password:
        print("❌ 请设置环境变量 IG_USERNAME 和 IG_PASSWORD")
        sys.exit(1)

    print(f"🔐 正在登录 Instagram ({username})...", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()

        # 访问登录页
        page.goto("https://www.instagram.com/accounts/login/", wait_until="networkidle")
        page.wait_for_timeout(3000)

        # 处理 Cookie 弹窗（如果有）
        try:
            cookie_btn = page.locator("button:has-text('Allow'), button:has-text('Accept')")
            if cookie_btn.count() > 0:
                cookie_btn.first.click()
                page.wait_for_timeout(1000)
        except Exception:
            pass

        # 输入用户名和密码
        page.fill('input[name="username"]', username)
        page.fill('input[name="password"]', password)
        page.click('button[type="submit"]')

        # 等待登录完成
        page.wait_for_timeout(8000)

        # 处理"保存登录信息"弹窗
        try:
            save_btn = page.locator("button:has-text('Not Now'), button:has-text('稍后再说')")
            if save_btn.count() > 0:
                save_btn.first.click()
                page.wait_for_timeout(2000)
        except Exception:
            pass

        # 处理"开启通知"弹窗
        try:
            notif_btn = page.locator("button:has-text('Not Now'), button:has-text('以后再说')")
            if notif_btn.count() > 0:
                notif_btn.first.click()
                page.wait_for_timeout(1000)
        except Exception:
            pass

        # 提取 sessionid
        cookies = context.cookies("https://www.instagram.com")
        session_id = None
        for cookie in cookies:
            if cookie["name"] == "sessionid":
                session_id = cookie["value"]
                break

        browser.close()

    if not session_id:
        print("❌ 登录失败，未能获取 sessionid（可能触发了二次验证）", flush=True)
        print("💡 如果账号开启了 2FA，请手动获取 sessionid 并设置到 GitHub Secret", flush=True)
        sys.exit(1)

    print(f"✅ 成功获取 sessionid: {session_id[:10]}...", flush=True)
    return session_id


def update_github_secret(session_id: str):
    """
    通过 GitHub CLI 更新 repository secret。
    仅在 CI 环境中使用（需要 gh CLI 和 GITHUB_TOKEN）。
    """
    import subprocess
    result = subprocess.run(
        ["gh", "secret", "set", "IG_SESSION_ID", "--body", session_id],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print("✅ 已更新 GitHub Secret: IG_SESSION_ID", flush=True)
    else:
        print(f"❌ 更新 GitHub Secret 失败: {result.stderr}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    sid = refresh_session()

    if os.environ.get("CI"):
        # CI 环境：更新 GitHub Secret
        update_github_secret(sid)
    else:
        # 本地环境：写入文件
        SESSION_ID_FILE.write_text(sid)
        print(f"✅ 已保存到 {SESSION_ID_FILE}", flush=True)
