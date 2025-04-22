import requests
import json
import os
import time
import schedule
from datetime import datetime
from pathlib import Path

def fetch_hot_songs():
    # 获取脚本所在目录
    script_dir = Path(__file__).parent
    # 获取项目根目录
    root_dir = script_dir.parent
    # 数据文件路径
    data_dir = root_dir / 'public' / 'data'
    data_file = data_dir / 'gem_hot_songs.json'

    # 网易云音乐API
    url = "https://music.163.com/api/artist/top/song"
    params = {
        "id": "7763",  # G.E.M.邓紫棋的ID
        "limit": 50
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://music.163.com/',
        'Origin': 'https://music.163.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    }
    
    try:
        response = requests.post(url, params=params, headers=headers)
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            songs = []
            
            for song in data['songs'][:50]:  # 只取前50首
                songs.append({
                    'songId': str(song['id']),
                    'title': song['name'],
                    'coverUrl': song['al']['picUrl'],
                    'artist': 'G.E.M.邓紫棋',
                    'playCount': song.get('playCount', 0)
                })
                print(f"成功解析歌曲: {song['name']}")
            
            # 保存到文件
            result = {
                'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'songs': songs
            }
            
            # 确保数据目录存在
            data_dir.mkdir(parents=True, exist_ok=True)
            
            # 保存文件
            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
                
            print(f"成功抓取 {len(songs)} 首歌曲数据")
            print(f"数据已保存到: {data_file}")
        else:
            print(f"API请求失败: {response.status_code}")
            
    except Exception as e:
        print(f"抓取失败: {str(e)}")

def run_scheduler():
    print("启动定时任务...")
    print(f"当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("脚本将每三天运行一次")
    
    # 立即运行一次
    fetch_hot_songs()
    
    # 设置每一天运行一次
    schedule.every(1).days.do(fetch_hot_songs)
    
    # 保持程序运行
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == '__main__':
    run_scheduler() 