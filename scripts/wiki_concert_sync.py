"""
Wikipedia Concert Sync — sync G.E.M. I AM GLORIA tour data to Spring Boot.

Data source:
  https://zh.wikipedia.org/wiki/G.E.M._I_AM_GLORIA_世界巡迴演唱會
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import date, datetime
from html.parser import HTMLParser
from html import unescape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

WIKI_PAGE_TITLE = "G.E.M._I_AM_GLORIA_世界巡迴演唱會"
STATE_FILE = Path(__file__).parent / "wiki_concert_state.json"
# 国内服务器可设置 WIKI_HOST=zh.wikipedia.fr.to (镜像) 或其他可访问域名
WIKI_HOST = os.environ.get("WIKI_HOST", "zh.wikipedia.org").strip()
WIKI_API_URL = f"https://{WIKI_HOST}/w/api.php"
WIKI_PAGE_URL = f"https://{WIKI_HOST}/wiki/G.E.M._I_AM_GLORIA_%E4%B8%96%E7%95%8C%E5%B7%A1%E8%BF%B4%E6%BC%94%E5%94%B1%E6%9C%83"
BACKEND_SYNC_URL = os.environ.get("CONCERT_SYNC_URL", "http://gemfanclub.com/api/concert/sync")
SYNC_API_KEY = os.environ.get("CONCERT_SYNC_API_KEY", "donkizhang_GEMFANCLUB_9527")
USER_AGENT = os.environ.get("WIKI_USER_AGENT", "GEMFANCLUB/1.0 (https://gemfanclub.com)")
ZHIPUAI_API_KEY = os.environ.get("ZHIPUAI_API_KEY", "").strip()
ZHIPUAI_MODEL = os.environ.get("ZHIPUAI_MODEL", "glm-4.5-air")
ZHIPUAI_TIMEOUT = float(os.environ.get("ZHIPUAI_TIMEOUT", "60"))
ZHIPUAI_MAX_RETRIES = int(os.environ.get("ZHIPUAI_MAX_RETRIES", "3"))
ZHIPUAI_RETRY_BACKOFF = float(os.environ.get("ZHIPUAI_RETRY_BACKOFF", "2"))
DATE_PARSE_CACHE = {}


class WikiTableParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.tables = []
        self.current_heading = ""
        self._heading_tag = None
        self._heading_parts = []
        self._in_table = False
        self._table_class = ""
        self._table_rows = []
        self._row = None
        self._cell = None
        self._cell_tag = None
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        attr_map = dict(attrs)
        if tag in ("h2", "h3", "h4"):
            self._heading_tag = tag
            self._heading_parts = []
            return

        if tag == "table":
            self._in_table = True
            self._table_class = attr_map.get("class", "")
            self._table_rows = []
            return

        if self._in_table and tag == "tr":
            self._row = []
            return

        if self._in_table and self._row is not None and tag in ("th", "td"):
            self._cell_tag = tag
            self._cell = {
                "tag": tag,
                "text": [],
                "rowspan": int(attr_map.get("rowspan", "1") or 1),
                "colspan": int(attr_map.get("colspan", "1") or 1),
            }
            return

        if tag in ("sup", "style", "script"):
            self._skip_depth += 1

        if self._cell is not None and tag in ("br", "p", "div", "li"):
            self._cell["text"].append(" ")

    def handle_endtag(self, tag):
        if tag in ("sup", "style", "script") and self._skip_depth > 0:
            self._skip_depth -= 1
            return

        if self._heading_tag == tag:
            text = clean_text("".join(self._heading_parts))
            if text:
                self.current_heading = text
            self._heading_tag = None
            self._heading_parts = []
            return

        if self._in_table and tag in ("th", "td") and self._cell is not None:
            self._cell["value"] = clean_text("".join(self._cell["text"]))
            self._row.append(self._cell)
            self._cell = None
            self._cell_tag = None
            return

        if self._in_table and tag == "tr" and self._row is not None:
            if self._row:
                self._table_rows.append(self._row)
            self._row = None
            return

        if self._in_table and tag == "table":
            if "wikitable" in self._table_class and self._table_rows:
                self.tables.append({"heading": self.current_heading, "rows": expand_table(self._table_rows)})
            self._in_table = False
            self._table_class = ""
            self._table_rows = []

    def handle_data(self, data):
        if self._skip_depth > 0:
            return
        if self._cell is not None:
            self._cell["text"].append(data)
        elif self._heading_tag:
            self._heading_parts.append(data)

    def handle_entityref(self, name):
        self.handle_data(unescape(f"&{name};"))

    def handle_charref(self, name):
        self.handle_data(unescape(f"&#{name};"))


def expand_table(raw_rows):
    rows = []
    rowspans = {}

    for raw_row in raw_rows:
        row = []
        col = 0

        for cell in raw_row:
            while col in rowspans:
                value, left = rowspans[col]
                row.append(value)
                if left <= 1:
                    del rowspans[col]
                else:
                    rowspans[col] = (value, left - 1)
                col += 1

            value = cell.get("value", "")
            colspan = max(cell.get("colspan", 1), 1)
            rowspan = max(cell.get("rowspan", 1), 1)

            for _ in range(colspan):
                row.append(value)
                if rowspan > 1:
                    rowspans[col] = (value, rowspan - 1)
                col += 1

        while col in rowspans:
            value, left = rowspans[col]
            row.append(value)
            if left <= 1:
                del rowspans[col]
            else:
                rowspans[col] = (value, left - 1)
            col += 1

        rows.append(row)

    return rows


def clean_text(value):
    value = unescape(value or "")
    value = re.sub(r"\[.*?\]", "", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def normalize_header(value):
    value = clean_text(value).lower()
    value = value.replace("／", "/").replace(" ", "")
    return value


def find_column(headers, keywords):
    normalized = [normalize_header(header) for header in headers]
    for keyword in keywords:
        for idx, header in enumerate(normalized):
            if keyword in header:
                return idx
    return None


def fetch_wiki_html():
    """Return (revid:int, html:str). revid=0 when fallback used."""
    cached_file = os.environ.get("WIKI_HTML_FILE", "").strip()
    if cached_file:
        with open(cached_file, "r", encoding="utf-8") as file:
            return 0, file.read()

    params = urlencode({
        "action": "parse",
        "page": WIKI_PAGE_TITLE,
        "prop": "text|revid",
        "format": "json",
        "formatversion": "2",
    })
    try:
        payload = http_get_json(f"{WIKI_API_URL}?{params}")
        parse = payload.get("parse", {})
        html = parse.get("text", "")
        revid = int(parse.get("revid", 0) or 0)
        if html:
            return revid, html
    except Exception as exc:
        print(f"⚠️ MediaWiki API fetch failed: {exc}", flush=True)

    return 0, http_get_text(WIKI_PAGE_URL)


def http_get_text(url):
    request = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    })
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def http_get_json(url):
    request = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    })
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8", "ignore"))


def parse_concerts(html):
    parser = WikiTableParser()
    parser.feed(html)

    concerts = []
    for table in parser.tables:
        rows = [row for row in table["rows"] if any(clean_text(cell) for cell in row)]
        if len(rows) < 2:
            continue

        headers = rows[0]
        date_idx = find_column(headers, ["日期", "演出日期", "時間", "时间"])
        city_idx = find_column(headers, ["城市", "地點", "地点"])
        venue_idx = find_column(headers, ["場館", "场馆", "場地", "场地"])
        sequence_idx = find_column(headers, ["場次", "场次", "序號", "序号"])
        country_idx = find_column(headers, ["國家", "国家", "地區", "地区"])
        note_idx = find_column(headers, ["備註", "备注", "附註", "附注"])
        audience_idx = find_column(headers, ["人數", "人数", "觀眾", "观众", "票房"])

        if date_idx is None or city_idx is None or venue_idx is None:
            continue

        current_phase = ""
        for row in rows[1:]:
            raw_sequence = clean_text(get_cell(row, sequence_idx))
            raw_date = clean_text(get_cell(row, date_idx))
            raw_city = clean_text(get_cell(row, city_idx))
            venue = normalize_cn_text(clean_text(get_cell(row, venue_idx)))

            phase = extract_tour_phase(raw_sequence) or extract_tour_phase(raw_date)
            if phase and is_phase_row(row):
                current_phase = phase
                continue

            concert_date = normalize_date(raw_date)
            if not is_iso_date(concert_date):
                continue
            if not raw_city or not venue:
                continue

            country, city = split_country_city(raw_city, clean_text(get_cell(row, country_idx)))
            display_date = format_concert_date(raw_date)
            performance_dates = resolve_performance_dates(display_date, raw_sequence)
            start_date, end_date = extract_date_bounds(display_date, performance_dates)
            item = {
                "tour_phase": current_phase or guess_tour_phase(table.get("heading", "")),
                "sequence_range": raw_sequence,
                "concert_date": display_date,
                "start_date": start_date,
                "end_date": end_date,
                "performance_dates": json.dumps(performance_dates, ensure_ascii=False),
                "show_count": calculate_show_count(raw_sequence, display_date, performance_dates),
                "country": country,
                "city": city,
                "province": infer_province(country, city),
                "venue": venue,
                "notes": normalize_cn_text(clean_text(get_cell(row, note_idx))),
                "status": "已确定",
            }
            audience = clean_text(get_cell(row, audience_idx))
            if audience:
                item["estimated_audience"] = audience

            concerts.extend(split_merged_concert(item))

    return dedupe_concerts(concerts)


def get_cell(row, idx):
    if idx is None or idx >= len(row):
        return ""
    return row[idx]


def normalize_date(value):
    value = clean_text(value)
    match = re.search(r"(20\d{2})\D{0,3}(\d{1,2})\D{0,3}(\d{1,2})", value)
    if not match:
        return ""
    year, month, day = map(int, match.groups())
    return f"{year:04d}-{month:02d}-{day:02d}"


def extract_date_bounds(value, dates=None):
    dates = dates if dates is not None else expand_concert_dates(value)
    if not dates:
        start_date = normalize_date(value)
        return start_date, start_date
    return dates[0], dates[-1]


def resolve_performance_dates(date_value, sequence_range=""):
    dates = expand_concert_dates(date_value)
    if dates:
        return dates

    expected_count = calculate_show_count_from_sequence(sequence_range)
    llm_dates = parse_dates_with_zhipu(date_value, expected_count)
    return llm_dates or dates


def parse_dates_with_zhipu(date_value, expected_count=0):
    if not ZHIPUAI_API_KEY:
        return []

    cache_key = f"{date_value}|{expected_count}"
    if cache_key in DATE_PARSE_CACHE:
        return DATE_PARSE_CACHE[cache_key]

    prompt = (
        "Extract all exact performance dates from this Chinese concert date text. "
        "Return JSON only, no markdown, in this schema: {\"dates\":[\"YYYY-MM-DD\"]}. "
        "Preserve non-consecutive dates and expand date ranges. "
        f"Expected count: {expected_count or 'unknown'}. Text: {date_value}"
    )
    body = json.dumps({
        "model": ZHIPUAI_MODEL,
        "temperature": 0.0,
        "messages": [{"role": "user", "content": prompt}],
    }, ensure_ascii=False).encode("utf-8")
    request = Request(
        "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {ZHIPUAI_API_KEY}",
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    try:
        last_exc = None
        for attempt in range(1, ZHIPUAI_MAX_RETRIES + 1):
            try:
                with urlopen(request, timeout=ZHIPUAI_TIMEOUT) as response:
                    payload = json.loads(response.read().decode("utf-8", "ignore"))
                break
            except Exception as exc:
                last_exc = exc
                if attempt < ZHIPUAI_MAX_RETRIES:
                    delay = ZHIPUAI_RETRY_BACKOFF ** attempt
                    print(f"⏳ Zhipu retry {attempt}/{ZHIPUAI_MAX_RETRIES} after {delay:.1f}s ({exc})", flush=True)
                    time.sleep(delay)
                else:
                    raise last_exc
        content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
        parsed = json.loads(content)
        dates = [item for item in parsed.get("dates", []) if is_iso_date(item)]
        DATE_PARSE_CACHE[cache_key] = dates
        return dates
    except Exception as exc:
        print(f"⚠️ Zhipu date parse fallback failed for {date_value}: {exc}", flush=True)
        return []


def expand_concert_dates(value):
    value = clean_text(value)
    year_match = re.search(r"(20\d{2})年", value)
    if not year_match:
        return []

    current_year = int(year_match.group(1))
    current_month = None
    dates = []
    for segment in re.split(r"[，,、]", value):
        segment = segment.strip()
        if not segment:
            continue

        year_match = re.search(r"(20\d{2})年", segment)
        if year_match:
            current_year = int(year_match.group(1))

        month_match = re.search(r"(\d{1,2})月", segment)
        if month_match:
            current_month = int(month_match.group(1))

        if not current_month:
            continue

        range_match = re.search(r"(\d{1,2})\s*[-－~～至]\s*(\d{1,2})日?", segment)
        if range_match:
            start_day = int(range_match.group(1))
            end_day = int(range_match.group(2))
            for day in range(start_day, end_day + 1):
                dates.append(f"{current_year:04d}-{current_month:02d}-{day:02d}")
            continue

        day_match = re.search(r"(?:月)?(\d{1,2})日", segment)
        if day_match:
            day = int(day_match.group(1))
            dates.append(f"{current_year:04d}-{current_month:02d}-{day:02d}")

    return dates


def calculate_show_count(sequence_range, date_value, dates=None):
    dates = dates if dates is not None else expand_concert_dates(date_value)
    if dates:
        return len(dates)
    return calculate_show_count_from_sequence(sequence_range) or 1


def calculate_show_count_from_sequence(sequence_range):
    sequence = clean_text(sequence_range)
    if not sequence or sequence == "未官宣":
        return 0

    match = re.search(r"(\d+)(?:-(\d+))?", sequence)
    if not match:
        return 0
    start = int(match.group(1))
    end = int(match.group(2) or start)
    return abs(end - start) + 1


def format_concert_date(value):
    value = clean_text(value)
    match = re.search(r"(20\d{2})\D{0,3}(\d{1,2})\D{0,3}(\d{1,2})", value)
    if not match:
        return value

    year, month, start_day = map(int, match.groups())
    if "、" in value or "," in value or "，" in value:
        return normalize_cn_text(value)

    date_tokens = re.findall(r"(\d{1,2})月(\d{1,2})日", value)
    if len(date_tokens) >= 2:
        start_month, start_day = map(int, date_tokens[0])
        end_month, end_day = map(int, date_tokens[-1])
        if start_month == end_month:
            return f"{year}年{start_month}月{start_day}-{end_day}日"
        return f"{year}年{start_month}月{start_day}日-{end_month}月{end_day}日"

    month_range = re.search(r"(\d{1,2})月(\d{1,2})\s*[-－~～至]\s*(\d{1,2})日", value)
    if month_range:
        start_month, start_day, end_day = map(int, month_range.groups())
        return f"{year}年{start_month}月{start_day}-{end_day}日"

    compact_days = re.findall(r"(?<!\d)(\d{1,2})(?=日|[、,，/／-])", value)
    if len(compact_days) >= 2:
        return f"{year}年{month}月{start_day}-{int(compact_days[-1])}日"

    return f"{year}年{month}月{start_day}日"


def extract_tour_phase(value):
    value = clean_text(value)
    match = re.search(r"(第[一二三四五六七八九十]+[轮輪]\s*Part\s*\d+)(?:\s*[（(](.*?版本)[）)])?", value, re.IGNORECASE)
    if match:
        phase = re.sub(r"\s+", " ", match.group(1)).strip()
        phase = normalize_cn_text(phase)
        version = normalize_cn_text(match.group(2) or "")
        return f"{phase} {version}".strip()
    return ""


def is_phase_row(row):
    values = [clean_text(cell) for cell in row if clean_text(cell)]
    return bool(values) and all(value == values[0] for value in values) and bool(extract_tour_phase(values[0]))


def split_merged_concert(item):
    sequence = item.get("sequence_range", "")
    date_value = item.get("concert_date", "")
    city = item.get("city", "")

    if sequence == "140-149" and city == "广州":
        first = dict(item)
        first["sequence_range"] = "140-143"
        first["concert_date"] = "2025年12月26-28日，12月31日"
        refresh_normalized_fields(first)

        second = dict(item)
        second["sequence_range"] = "144-149"
        second["concert_date"] = "2026年1月3-4日，1月9-11日，13日"
        refresh_normalized_fields(second)
        return [first, second]

    if sequence == "154-156" and city == "厦门" and date_value == "2026年5月1-3日":
        updated = dict(item)
        updated["sequence_range"] = "154-156"
        refresh_normalized_fields(updated)
        return [updated]

    return [item]


def refresh_normalized_fields(item):
    performance_dates = resolve_performance_dates(item.get("concert_date", ""), item.get("sequence_range", ""))
    start_date, end_date = extract_date_bounds(item.get("concert_date", ""), performance_dates)
    item["start_date"] = start_date
    item["end_date"] = end_date
    item["performance_dates"] = json.dumps(performance_dates, ensure_ascii=False)
    item["sequence_range"] = reconcile_sequence_range(item.get("sequence_range", ""), performance_dates)
    item["show_count"] = calculate_show_count(item.get("sequence_range", ""), item.get("concert_date", ""), performance_dates)
    item["province"] = infer_province(item.get("country", ""), item.get("city", ""))


def reconcile_sequence_range(sequence_range, performance_dates):
    sequence = clean_text(sequence_range)
    actual_count = len(performance_dates or [])
    if not sequence or sequence == "未官宣" or actual_count == 0:
        return sequence

    match = re.search(r"(\d+)(?:\s*[-－~～]\s*(\d+))?", sequence)
    if not match:
        return sequence

    start = int(match.group(1))
    end_raw = match.group(2)
    expected_end = start + actual_count - 1
    if end_raw is not None and int(end_raw) == expected_end:
        return sequence
    return f"{start}-{expected_end}" if actual_count > 1 else f"{start}"


def is_iso_date(value):
    return bool(re.fullmatch(r"20\d{2}-\d{2}-\d{2}", value or ""))


def split_country_city(raw_city, fallback_country):
    city = clean_text(raw_city)
    country = clean_text(fallback_country)
    prefixes = [
        "中国大陆", "中國大陸", "中國香港", "中国香港", "香港", "澳門", "澳门",
        "臺灣", "台灣", "台湾", "馬來西亞", "马来西亚", "新加坡", "美國", "美国",
        "加拿大", "澳洲", "澳大利亞", "新西蘭", "新西兰", "英國", "英国",
        "法國", "法国", "西班牙", "德國", "德国", "日本", "韓國", "韩国",
    ]
    for prefix in prefixes:
        if city.startswith(prefix) and len(city) > len(prefix):
            return normalize_country(prefix), normalize_cn_text(city[len(prefix):].strip())
    inferred_country = infer_country_from_city(city)
    return normalize_country(country or inferred_country), normalize_cn_text(city)


def infer_country_from_city(city):
    mapping = {
        "澳门": "中国澳门",
        "香港": "中国香港",
        "台湾台北": "中国台湾",
        "台北": "中国台湾",
        "新加坡": "新加坡",
        "伦敦": "英国",
        "巴黎": "法国",
        "纽约": "美国",
        "洛杉矶": "美国",
        "旧金山": "美国",
        "多伦多": "加拿大",
        "温哥华": "加拿大",
        "悉尼": "澳大利亚",
        "墨尔本": "澳大利亚",
    }
    normalized_city = normalize_cn_text(city)
    for keyword, country in mapping.items():
        if normalized_city.startswith(keyword):
            return country
    return ""


def infer_province(country, city):
    normalized_country = normalize_country(normalize_cn_text(country or ""))
    normalized_city = normalize_cn_text(city or "")
    if normalized_country == "中国香港" or normalized_city == "香港":
        return "香港特别行政区"
    if normalized_country == "中国澳门" or normalized_city == "澳门":
        return "澳门特别行政区"
    if normalized_country and normalized_country != "中国大陆":
        return normalized_country

    city_map = {
        "北京": "北京市", "上海": "上海市", "天津": "天津市", "重庆": "重庆市",
        "广州": "广东省", "深圳": "广东省", "佛山": "广东省", "东莞": "广东省", "惠州": "广东省", "清远": "广东省", "湛江": "广东省", "肇庆": "广东省",
        "杭州": "浙江省", "宁波": "浙江省", "温州": "浙江省", "台州": "浙江省", "衢州": "浙江省",
        "南京": "江苏省", "苏州": "江苏省", "无锡": "江苏省", "徐州": "江苏省",
        "武汉": "湖北省", "襄阳": "湖北省", "长沙": "湖南省", "衡阳": "湖南省", "成都": "四川省", "西安": "陕西省",
        "郑州": "河南省", "洛阳": "河南省", "济南": "山东省", "青岛": "山东省", "烟台": "山东省", "沈阳": "辽宁省",
        "大连": "辽宁省", "哈尔滨": "黑龙江省", "长春": "吉林省", "南昌": "江西省", "赣州": "江西省",
        "福州": "福建省", "厦门": "福建省", "泉州": "福建省", "合肥": "安徽省", "南宁": "广西壮族自治区",
        "昆明": "云南省", "贵阳": "贵州省", "海口": "海南省", "三亚": "海南省", "太原": "山西省",
        "石家庄": "河北省", "呼和浩特": "内蒙古自治区", "乌鲁木齐": "新疆维吾尔自治区",
        "兰州": "甘肃省", "银川": "宁夏回族自治区", "西宁": "青海省", "拉萨": "西藏自治区",
    }
    return city_map.get(normalized_city, "未知地区")


def normalize_cn_text(value):
    mapping = {
        "廣": "广", "寧": "宁", "奧": "奥", "體": "体", "場": "场", "館": "馆",
        "臺": "台", "灣": "湾", "門": "门", "會": "会", "樂": "乐", "區": "区",
        "國": "国", "華": "华", "爾": "尔", "蘭": "兰", "紐": "纽", "倫": "伦",
        "舊": "旧", "漢": "汉", "亞": "亚", "鷺": "鹭", "東": "东", "峽": "峡",
        "慶": "庆", "廈": "厦", "啟": "启", "開": "开", "綜": "综", "藝": "艺",
        "維": "维", "約": "约", "萊": "莱", "頂": "顶", "溫": "温", "別": "别",
        "銀": "银", "園": "园", "連": "连", "於": "于", "農": "农", "曆": "历",
        "個": "个", "舉": "举", "辦": "办", "輪": "轮", "長": "长", "島": "岛",
        "鄭": "郑", "陽": "阳", "瀋": "沈", "煙": "烟", "濱": "滨", "際": "际", "贛": "赣",
        "賀": "贺", "龍": "龙", "紀": "纪", "蓮": "莲", "勞": "劳", "動": "动",
        "週": "周", "親": "亲", "單": "单", "總": "总", "確": "确", "場": "场",
        "灣": "湾", "返場": "返场", "加場": "加场",
    }
    for source, target in mapping.items():
        value = value.replace(source, target)
    return value


def normalize_country(value):
    mapping = {
        "中國大陸": "中国大陆",
        "中國香港": "中国香港",
        "香港": "中国香港",
        "澳門": "中国澳门",
        "澳门": "中国澳门",
        "臺灣": "中国台湾",
        "台灣": "中国台湾",
        "台湾": "中国台湾",
        "馬來西亞": "马来西亚",
        "美國": "美国",
        "澳大利雅": "澳大利亚",
        "英國": "英国",
        "法國": "法国",
        "德國": "德国",
        "韓國": "韩国",
    }
    return mapping.get(value, value)


def guess_status(value):
    try:
        concert_day = datetime.strptime(value[:10], "%Y-%m-%d").date()
        return "completed" if concert_day < date.today() else "scheduled"
    except ValueError:
        return "scheduled"


def guess_tour_phase(heading):
    heading = clean_text(heading)
    if not heading:
        return ""
    heading = re.sub(r"\[.*?\]", "", heading)
    return heading[:20]


def dedupe_concerts(concerts):
    result = []
    seen = set()
    for item in concerts:
        key = (
            item.get("sequence_range", ""),
            normalize_date(item.get("concert_date", "")),
            item.get("city", ""),
            item.get("venue", ""),
        )
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def sync_to_backend(concerts):
    body = json.dumps(concerts, ensure_ascii=False).encode("utf-8")
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": USER_AGENT,
    }
    if SYNC_API_KEY:
        headers["X-Sync-Key"] = SYNC_API_KEY

    request = Request(BACKEND_SYNC_URL, data=body, headers=headers, method="POST")
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8", "ignore"))


def load_state():
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def run_once(dry_run=False, output="", force=False):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] sync start", flush=True)
    try:
        revid, html = fetch_wiki_html()
    except (HTTPError, URLError) as exc:
        print(f"❌ Wikipedia fetch failed: {exc}", flush=True)
        return 1

    state = load_state()
    last_revid = int(state.get("revid", 0) or 0)
    if not force and revid and revid == last_revid:
        print(f"✅ no change since revid={last_revid}, skip", flush=True)
        return 0

    concerts = parse_concerts(html)
    if not concerts:
        print("❌ No concert rows parsed from Wikipedia.", flush=True)
        return 1
    print(f"parsed {len(concerts)} concerts, wiki revid={revid}", flush=True)

    if output:
        with open(output, "w", encoding="utf-8") as file:
            json.dump(concerts, file, ensure_ascii=False, indent=2)

    if dry_run:
        print(json.dumps({"count": len(concerts), "items": concerts[:5]}, ensure_ascii=False, indent=2), flush=True)
        return 0

    result = sync_to_backend(concerts)
    print(json.dumps(result, ensure_ascii=False, indent=2), flush=True)
    if result.get("code") != 200:
        return 1

    state.update({
        "revid": revid,
        "last_synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "last_count": len(concerts),
        "last_result": result.get("data"),
    })
    save_state(state)
    return 0


def main():
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument("--dry-run", action="store_true")
    arg_parser.add_argument("--output", default="")
    arg_parser.add_argument("--force", action="store_true", help="ignore revid cache")
    arg_parser.add_argument("--schedule", action="store_true", help="run forever, sync once a day")
    args = arg_parser.parse_args()

    if not args.schedule:
        return run_once(dry_run=args.dry_run, output=args.output, force=args.force)

    import schedule
    print("启动定时任务，每天同步一次", flush=True)
    run_once(force=args.force)
    schedule.every(1).days.do(run_once)
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    sys.exit(main() or 0)
