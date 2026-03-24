"""
IG Story Scraper — 基于 Instagram Web API (requests)

迁移历程：
  1. instaloader → stories GraphQL 端点被 Instagram 废弃（2025-08 起）
  2. instagrapi  → Private API (手机端模拟) 与浏览器 sessionid 不兼容，
                    触发 Challenge / 空响应
  3. Web API     → 直接使用浏览器 sessionid + Instagram Web API，
                    兼容性最好，不会触发安全验证 ✅

Web API 端点：
  - /api/v1/users/web_profile_info/ — 获取用户信息 + user_id
  - /api/v1/feed/reels_media/       — 获取指定用户的 stories
"""

import requests
from typing import Optional, List, Dict, Any
from pathlib import Path
from urllib.parse import unquote
import json
import os
import time
import schedule
import traceback
from datetime import datetime

# ================= Configuration =================
# Target Instagram account (GEM's account)
TARGET = "gem0816"

# Script directory (for relative paths)
SCRIPT_DIR = Path(__file__).resolve().parent

# Session ID file — 存放从浏览器导出的 sessionid
SESSION_ID_FILE = SCRIPT_DIR / "ig_sessionid.txt"

# Download directory
DOWNLOAD_DIR = SCRIPT_DIR / "downloads" / TARGET

# Cached user_id file — 避免每次都查询
USER_ID_CACHE = SCRIPT_DIR / "ig_user_cache.json"

# Spring Boot 后端同步 API
BACKEND_SYNC_URL = "http://localhost:7071/story/sync"
# =================================================

MAX_RETRIES = 3       # 最大重试次数
RETRY_DELAY = 60      # 重试间隔（秒）
REQUEST_DELAY = 2     # 每次下载间隔（秒），模拟正常用户行为

# Instagram Web API 请求头
WEB_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "X-IG-App-ID": "936619743392459",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://www.instagram.com/",
    "Origin": "https://www.instagram.com",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}


def _read_sessionid() -> Optional[str]:
    """从文件读取 sessionid 并进行 URL 解码。"""
    if not SESSION_ID_FILE.exists():
        return None
    raw = SESSION_ID_FILE.read_text().strip()
    if not raw:
        return None
    # 浏览器复制的 sessionid 可能是 URL 编码的（%3A → :）
    decoded = unquote(raw)
    if decoded != raw:
        print("  → 已对 sessionid 进行 URL 解码", flush=True)
    return decoded


def _get_cookies() -> Optional[Dict[str, str]]:
    """获取用于 Web API 的 cookies。"""
    session_id = _read_sessionid()
    if not session_id:
        _print_sessionid_guide()
        return None
    return {"sessionid": session_id}


def _web_api_get(endpoint: str, params: Optional[Dict] = None,
                 cookies: Optional[Dict] = None) -> Optional[Dict]:
    """
    调用 Instagram Web API 并返回 JSON 数据。
    如果请求失败或响应非 JSON，返回 None。
    """
    url = f"https://www.instagram.com{endpoint}"
    try:
        resp = requests.get(
            url,
            params=params,
            headers=WEB_HEADERS,
            cookies=cookies,
            timeout=15,
        )
        if resp.status_code == 401:
            print("⚠️ sessionid 已过期（401 Unauthorized），请重新获取。", flush=True)
            _print_sessionid_guide()
            return None
        if resp.status_code == 429:
            print("⚠️ 请求过于频繁（429），请稍后再试。", flush=True)
            return None
        if resp.status_code != 200:
            print(f"⚠️ API 返回 HTTP {resp.status_code}: {resp.text[:200]}", flush=True)
            return None
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        print(f"⚠️ API 返回非 JSON 响应: {resp.text[:200]}", flush=True)
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ 网络请求失败: {e}", flush=True)
        return None


def _get_user_id(username: str, cookies: Dict[str, str]) -> Optional[str]:
    """通过 Web API 获取用户的 user_id，支持本地缓存。"""
    # 先查本地缓存
    if USER_ID_CACHE.exists():
        try:
            cache = json.loads(USER_ID_CACHE.read_text())
            if username in cache:
                user_id = cache[username]
                print(f"  → 使用缓存的 user_id: {user_id}", flush=True)
                return user_id
        except Exception:
            pass

    # 调用 API
    data = _web_api_get(
        "/api/v1/users/web_profile_info/",
        params={"username": username},
        cookies=cookies,
    )
    if not data:
        return None

    user = data.get("data", {}).get("user", {})
    user_id = user.get("id")
    if not user_id:
        print(f"⚠️ 无法从 API 响应中提取 user_id: {list(data.keys())}", flush=True)
        return None

    # 保存到缓存
    cache = {}
    if USER_ID_CACHE.exists():
        try:
            cache = json.loads(USER_ID_CACHE.read_text())
        except Exception:
            pass
    cache[username] = user_id
    USER_ID_CACHE.write_text(json.dumps(cache, indent=2))
    print(f"  → user_id: {user_id} (已缓存)", flush=True)
    return user_id


def _get_stories(user_id: str, cookies: Dict[str, str]) -> List[Dict[str, Any]]:
    """通过 Web API 获取指定用户的 stories。"""
    data = _web_api_get(
        "/api/v1/feed/reels_media/",
        params={"reel_ids": user_id},
        cookies=cookies,
    )
    if not data:
        return []

    reels = data.get("reels", {})
    reel = reels.get(str(user_id), {})
    items = reel.get("items", [])
    return items


def _download_file(url: str, filepath: Path) -> bool:
    """下载文件到指定路径。"""
    try:
        resp = requests.get(url, stream=True, timeout=30)
        resp.raise_for_status()
        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"  ❌ 下载失败: {e}", flush=True)
        return False


def _get_story_media_url(item: Dict) -> Optional[str]:
    """从 story item 中提取最佳质量的媒体 URL。"""
    media_type = item.get("media_type")  # 1=photo, 2=video

    if media_type == 2:  # video
        versions = item.get("video_versions", [])
        if versions:
            # 选择第一个（通常是最高质量）
            return versions[0].get("url")
    else:  # photo (media_type == 1)
        candidates = item.get("image_versions2", {}).get("candidates", [])
        if candidates:
            # 按宽度排序，选最大的
            candidates.sort(key=lambda c: c.get("width", 0), reverse=True)
            return candidates[0].get("url")
    return None


def _sync_to_backend(filepath: Path, ig_media_id: str, media_type: int,
                     taken_at: int, width: int = None, height: int = None) -> bool:
    """将下载好的快拍同步到 Spring Boot 后端。"""
    try:
        with open(filepath, "rb") as f:
            files = {"file": (filepath.name, f)}
            data = {
                "igMediaId": ig_media_id,
                "mediaType": media_type,
                "takenAt": taken_at,
            }
            if width:
                data["width"] = width
            if height:
                data["height"] = height

            resp = requests.post(BACKEND_SYNC_URL, files=files, data=data, timeout=60)
            result = resp.json()
            if result.get("code") == 200:
                msg = result.get("message", "")
                if msg == "already_exists":
                    print(f"  ↔️  后端已存在，跳过同步: {filepath.name}", flush=True)
                else:
                    print(f"  📤 已同步到后端: {filepath.name}", flush=True)
                return True
            else:
                print(f"  ⚠️ 后端同步失败: {result}", flush=True)
                return False
    except requests.exceptions.ConnectionError:
        print(f"  ⚠️ 后端未启动，跳过同步: {filepath.name}", flush=True)
        return False
    except Exception as e:
        print(f"  ⚠️ 同步异常: {e}", flush=True)
        return False


def download_stories(retry_count=0):
    """Download stories for the target Instagram user."""
    print(
        f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
        f"开始抓取快拍...(第 {retry_count + 1} 次尝试)",
        flush=True,
    )

    # 获取 sessionid
    cookies = _get_cookies()
    if not cookies:
        print("⚠️ 未找到 sessionid，本次抓取跳过。", flush=True)
        return

    # 1. 获取目标用户 ID
    print(f"正在获取 {TARGET} 的用户信息...", flush=True)
    user_id = _get_user_id(TARGET, cookies)
    if not user_id:
        print("❌ 无法获取用户 ID，本次抓取跳过。", flush=True)
        if retry_count < MAX_RETRIES:
            print(f"⏳ {RETRY_DELAY}s 后进行第 {retry_count + 2} 次重试...", flush=True)
            time.sleep(RETRY_DELAY)
            return download_stories(retry_count + 1)
        return

    # 2. 获取用户的当前 stories
    print("正在获取快拍列表...", flush=True)
    stories = _get_stories(user_id, cookies)

    if not stories:
        print(f"📭 {TARGET} 当前没有发布快拍，或快拍已过期。", flush=True)
        return

    print(f"发现 {len(stories)} 个快拍，开始处理...", flush=True)

    # 3. 确保下载目录存在
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    download_count = 0
    skip_count = 0

    for item in stories:
        pk = str(item.get("pk", ""))
        media_type = item.get("media_type", 1)
        type_label = "视频" if media_type == 2 else "图片"
        ext = ".mp4" if media_type == 2 else ".jpg"
        taken_at = item.get("taken_at", 0)
        ts_str = datetime.fromtimestamp(taken_at).strftime("%Y%m%d_%H%M%S") if taken_at else "unknown"

        # 去重：检查本地是否已存在该 story（基于 pk）
        existing = [f for f in DOWNLOAD_DIR.iterdir() if pk in f.name]
        if existing:
            skip_count += 1
            continue

        # 获取媒体 URL
        media_url = _get_story_media_url(item)
        if not media_url:
            print(f"  ⚠️ 无法提取媒体 URL: pk={pk}", flush=True)
            continue

        # 构建文件名：时间戳_pk_类型.ext
        filename = f"{ts_str}_{pk}{ext}"
        filepath = DOWNLOAD_DIR / filename

        # 提取媒体宽高
        item_width = None
        item_height = None
        if media_type == 2:
            versions = item.get("video_versions", [])
            if versions:
                item_width = versions[0].get("width")
                item_height = versions[0].get("height")
        else:
            candidates = item.get("image_versions2", {}).get("candidates", [])
            if candidates:
                item_width = candidates[0].get("width")
                item_height = candidates[0].get("height")

        # 下载
        print(f"  ⬇️  正在下载 {type_label}: {filename}...", flush=True)
        if _download_file(media_url, filepath):
            download_count += 1
            size_kb = filepath.stat().st_size / 1024
            print(f"  ✅ 已下载: {filename} ({size_kb:.1f} KB)", flush=True)

            # 同步到后端
            _sync_to_backend(filepath, pk, media_type, taken_at, item_width, item_height)
        else:
            print(f"  ❌ 下载失败: pk={pk}", flush=True)

        # 下载间隔，避免触发限流
        time.sleep(REQUEST_DELAY)

    print(
        f"🎉 完成！新下载 {download_count} 个，跳过已存在 {skip_count} 个。",
        flush=True,
    )


def _print_sessionid_guide():
    """打印从浏览器获取 sessionid 的操作指南。"""
    guide = """
╔══════════════════════════════════════════════════════════════╗
║          📋 如何获取 Instagram sessionid                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. 在浏览器中登录 Instagram                                 ║
║  2. 按 F12 打开开发者工具                                    ║
║  3. 切换到「Application」→「Cookies」→ instagram.com        ║
║  4. 找到名为 "sessionid" 的 Cookie，复制其 Value             ║
║  5. 将 Value 粘贴保存到以下文件中（仅一行纯文本）：          ║
║                                                              ║
║     {path}                                                   ║
║                                                              ║
║  6. 重新运行脚本即可                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
""".format(path=SESSION_ID_FILE)
    print(guide, flush=True)


def run_scheduler():
    print("=" * 50, flush=True)
    print("🚀 启动 IG 快拍定时抓取任务 (Web API)", flush=True)
    print(f"⏰ 当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
    print(f"🎯 目标账号: {TARGET}", flush=True)
    print(f"📁 下载目录: {DOWNLOAD_DIR}", flush=True)
    print("📅 脚本将每天运行一次", flush=True)
    print("=" * 50, flush=True)

    # Run once immediately
    download_stories()

    # Schedule to run every 1 day
    schedule.every(1).days.do(download_stories)

    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    run_scheduler()
