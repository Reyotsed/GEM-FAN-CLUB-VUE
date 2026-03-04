import instaloader
from instaloader.structures import Story
import os
import time
import schedule
import traceback
from datetime import datetime

# ================= Configuration =================
# Your IG dummy account credentials
MY_DUMMY_ACCOUNT = "zxiaoyao522"
MY_DUMMY_PASSWORD = "zxy027957"

# Target Instagram account (GEM's account)
TARGET = "gem0816"

# Script directory (for relative paths)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# =================================================


def download_stories():
    """Download stories for the target Instagram user."""
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始抓取快拍...")

    # 1. Initialize Instaloader
    download_dir = os.path.join(SCRIPT_DIR, "downloads", "{profile}")
    L = instaloader.Instaloader(
        dirname_pattern=download_dir,
        download_video_thumbnails=False,
        save_metadata=False,
        compress_json=False
    )

    # 2. Login (required for stories)
    try:
        L.load_session_from_file(MY_DUMMY_ACCOUNT)
        print("已加载本地登录状态。")
    except FileNotFoundError:
        print("未找到本地登录状态，正在尝试账号密码登录...")
        try:
            L.login(MY_DUMMY_ACCOUNT, MY_DUMMY_PASSWORD)
            L.save_session_to_file()
            print("登录成功并已保存状态！")
        except Exception as e:
            print(f"登录失败: {e}")
            return

    # 3. Get target user's Profile
    try:
        print(f"正在获取 {TARGET} 的信息...")
        profile = instaloader.Profile.from_username(L.context, TARGET)
    except Exception as e:
        print(f"获取目标用户失败: {e}")
        return

    # 4. Download stories via iPhone API (bypass broken GraphQL endpoint)
    try:
        print("正在通过 iPhone API 获取快拍...")
        data = L.context.get_iphone_json(
            path="api/v1/feed/reels_media/",
            params={"reel_ids": profile.userid}
        )

        download_count = 0
        skip_count = 0
        reels_media = data.get("reels_media", []) or data.get("reels", {})

        if isinstance(reels_media, dict):
            reels_media = list(reels_media.values())

        for reel in reels_media:
            story = Story(L.context, reel)
            for item in story.get_items():
                # Check if already downloaded (avoid duplicates)
                target_dir = os.path.join(SCRIPT_DIR, "downloads", TARGET)
                if os.path.isdir(target_dir):
                    existing = [f for f in os.listdir(target_dir) if str(item.mediaid) in f]
                    if existing:
                        skip_count += 1
                        continue

                L.download_storyitem(item, TARGET)
                download_count += 1

        if download_count == 0 and skip_count == 0:
            print(f"{TARGET} 当前没有发布快拍，或快拍已过期。")
        else:
            print(f"完成！新下载 {download_count} 个，跳过已存在 {skip_count} 个。")

    except Exception as e:
        print(f"抓取快拍时出错: {e}")
        traceback.print_exc()


def run_scheduler():
    print("启动 IG 快拍定时抓取任务...")
    print(f"当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"目标账号: {TARGET}")
    print("脚本将每天运行一次")
    print("=" * 40)

    # Run once immediately
    download_stories()

    # Schedule to run every 1 day
    schedule.every(1).days.do(download_stories)

    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == '__main__':
    run_scheduler()