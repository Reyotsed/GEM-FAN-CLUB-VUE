"""
一次性脚本：将本地已下载的快拍文件导入到后端数据库。
用法：python import_local_stories.py

文件名格式：{YYYYMMDD}_{HHMMSS}_{igMediaId}.mp4/.jpg
"""

import requests
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).resolve().parent
DOWNLOAD_DIR = SCRIPT_DIR / "downloads" / "gem0816"
BACKEND_SYNC_URL = "http://localhost:7071/story/sync"

SUPPORTED_EXT = {".mp4": 2, ".jpg": 1, ".jpeg": 1, ".png": 1, ".webp": 1}


def parse_filename(name: str):
    """从文件名解析 takenAt 时间戳和 igMediaId。"""
    stem = Path(name).stem  # 去掉扩展名
    parts = stem.split("_")
    # 格式: YYYYMMDD_HHMMSS_igMediaId
    if len(parts) < 3:
        return None, None
    date_str = f"{parts[0]}_{parts[1]}"  # 20260320_072048
    ig_media_id = parts[2]
    try:
        dt = datetime.strptime(date_str, "%Y%m%d_%H%M%S")
        taken_at = int(dt.timestamp())
        return ig_media_id, taken_at
    except ValueError:
        return None, None


def main():
    if not DOWNLOAD_DIR.exists():
        print(f"❌ 目录不存在: {DOWNLOAD_DIR}")
        return

    files = sorted(DOWNLOAD_DIR.iterdir())
    media_files = [f for f in files if f.suffix.lower() in SUPPORTED_EXT]

    if not media_files:
        print("📭 没有找到可导入的媒体文件。")
        return

    print(f"找到 {len(media_files)} 个文件，开始导入...\n")

    success = 0
    for filepath in media_files:
        ext = filepath.suffix.lower()
        media_type = SUPPORTED_EXT[ext]
        ig_media_id, taken_at = parse_filename(filepath.name)

        if not ig_media_id:
            print(f"  ⚠️ 无法解析文件名，跳过: {filepath.name}")
            continue

        try:
            with open(filepath, "rb") as f:
                resp = requests.post(
                    BACKEND_SYNC_URL,
                    files={"file": (filepath.name, f)},
                    data={
                        "igMediaId": ig_media_id,
                        "mediaType": media_type,
                        "takenAt": taken_at,
                    },
                    timeout=60,
                )
                result = resp.json()
                msg = result.get("message", "")
                if result.get("code") == 200:
                    tag = "↔️ 已存在" if msg == "already_exists" else "✅ 导入成功"
                    print(f"  {tag}: {filepath.name}")
                    success += 1
                else:
                    print(f"  ❌ 失败: {filepath.name} → {result}")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ 后端未启动（localhost:7071），请先启动 Spring Boot。")
            return
        except Exception as e:
            print(f"  ❌ 异常: {filepath.name} → {e}")

    print(f"\n🎉 完成！成功 {success}/{len(media_files)} 个。")


if __name__ == "__main__":
    main()
