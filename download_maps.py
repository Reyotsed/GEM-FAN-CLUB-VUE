import os
import time
import json
import requests
from pathlib import Path

# 中国各省份及其对应的行政区划代码
provinces = [
    {"name": "北京市", "code": "110000"},
    {"name": "天津市", "code": "120000"},
    {"name": "河北省", "code": "130000"},
    {"name": "山西省", "code": "140000"},
    {"name": "内蒙古自治区", "code": "150000"},
    {"name": "辽宁省", "code": "210000"},
    {"name": "吉林省", "code": "220000"},
    {"name": "黑龙江省", "code": "230000"},
    {"name": "上海市", "code": "310000"},
    {"name": "江苏省", "code": "320000"},
    {"name": "浙江省", "code": "330000"},
    {"name": "安徽省", "code": "340000"},
    {"name": "福建省", "code": "350000"},
    {"name": "江西省", "code": "360000"},
    {"name": "山东省", "code": "370000"},
    {"name": "河南省", "code": "410000"},
    {"name": "湖北省", "code": "420000"},
    {"name": "湖南省", "code": "430000"},
    {"name": "广东省", "code": "440000"},
    {"name": "广西壮族自治区", "code": "450000"},
    {"name": "海南省", "code": "460000"},
    {"name": "重庆市", "code": "500000"},
    {"name": "四川省", "code": "510000"},
    {"name": "贵州省", "code": "520000"},
    {"name": "云南省", "code": "530000"},
    {"name": "西藏自治区", "code": "540000"},
    {"name": "陕西省", "code": "610000"},
    {"name": "甘肃省", "code": "620000"},
    {"name": "青海省", "code": "630000"},
    {"name": "宁夏回族自治区", "code": "640000"},
    {"name": "新疆维吾尔自治区", "code": "650000"},
    {"name": "台湾省", "code": "710000"},
    {"name": "香港特别行政区", "code": "810000"},
    {"name": "澳门特别行政区", "code": "820000"}
]

# 确保目录存在
output_dir = Path("public/data/province")
output_dir.mkdir(parents=True, exist_ok=True)

# 下载中国整体地图数据
china_url = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
china_output = Path("public/data/china_map.json")

print(f"正在下载中国整体地图数据...")
try:
    response = requests.get(china_url)
    if response.status_code == 200:
        with open(china_output, 'w', encoding='utf-8') as f:
            f.write(response.text)
        print(f"成功下载中国整体地图数据 -> {china_output}")
    else:
        print(f"下载中国整体地图数据失败，状态码: {response.status_code}")
except Exception as e:
    print(f"下载中国整体地图数据时出错: {e}")

# 下载各省份地图数据
success_count = 0
fail_count = 0
failed_provinces = []

for province in provinces:
    name = province["name"]
    code = province["code"]
    url = f"https://geo.datav.aliyun.com/areas_v3/bound/{code}_full.json"
    output_file = output_dir / f"{name}.json"
    
    print(f"正在下载 {name} 的地图数据...")
    try:
        # 使用requests库下载
        response = requests.get(url)
        if response.status_code == 200:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(response.text)
            print(f"成功下载 {name} 的地图数据 -> {output_file}")
            success_count += 1
        else:
            print(f"下载 {name} 的地图数据失败，状态码: {response.status_code}")
            failed_provinces.append(name)
            fail_count += 1
    except Exception as e:
        print(f"下载 {name} 的地图数据时出错: {e}")
        failed_provinces.append(name)
        fail_count += 1
    
    # 休息一下，避免过快请求导致被封IP
    time.sleep(1)

# 为失败的省份创建一个简单的占位JSON
for name in failed_provinces:
    placeholder_file = output_dir / f"{name}.json"
    placeholder_data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": name},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
                }
            }
        ]
    }
    
    with open(placeholder_file, 'w', encoding='utf-8') as f:
        json.dump(placeholder_data, f, ensure_ascii=False, indent=2)
    print(f"为 {name} 创建了占位地图数据")

# 打印下载摘要
print("\n下载摘要:")
print(f"成功下载: {success_count} 个省份")
print(f"下载失败: {fail_count} 个省份")
if failed_provinces:
    print(f"失败的省份: {', '.join(failed_provinces)}")
print("\n所有省份的地图数据处理完成！") 