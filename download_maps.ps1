$provinces = @(
    @{name="山西省"; code="140000"},
    @{name="内蒙古自治区"; code="150000"},
    @{name="辽宁省"; code="210000"},
    @{name="吉林省"; code="220000"},
    @{name="黑龙江省"; code="230000"},
    @{name="上海市"; code="310000"},
    @{name="江苏省"; code="320000"},
    @{name="浙江省"; code="330000"},
    @{name="安徽省"; code="340000"},
    @{name="福建省"; code="350000"},
    @{name="江西省"; code="360000"},
    @{name="山东省"; code="370000"},
    @{name="河南省"; code="410000"},
    @{name="湖北省"; code="420000"},
    @{name="湖南省"; code="430000"},
    @{name="广东省"; code="440000"},
    @{name="广西壮族自治区"; code="450000"},
    @{name="海南省"; code="460000"},
    @{name="重庆市"; code="500000"},
    @{name="四川省"; code="510000"},
    @{name="贵州省"; code="520000"},
    @{name="云南省"; code="530000"},
    @{name="西藏自治区"; code="540000"},
    @{name="陕西省"; code="610000"},
    @{name="甘肃省"; code="620000"},
    @{name="青海省"; code="630000"},
    @{name="宁夏回族自治区"; code="640000"},
    @{name="新疆维吾尔自治区"; code="650000"},
    @{name="香港特别行政区"; code="810000"},
    @{name="澳门特别行政区"; code="820000"},
    @{name="台湾省"; code="710000"}
)

# 确保目录存在
$dir = "public\data\province"
if (!(Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir
}

# 下载每个省份的地图数据
foreach ($province in $provinces) {
    $name = $province.name
    $code = $province.code
    $url = "https://geo.datav.aliyun.com/areas_v3/bound/$($code)_full.json"
    $output = "$dir\$name.json"
    
    Write-Host "下载 $name 的地图数据..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        Write-Host "成功下载 $name 的地图数据" -ForegroundColor Green
    } catch {
        Write-Host "下载 $name 的地图数据失败: $_" -ForegroundColor Red
    }
    
    # 休息一下，避免过快请求
    Start-Sleep -Seconds 1
}

Write-Host "所有省份地图数据下载完成！" -ForegroundColor Green