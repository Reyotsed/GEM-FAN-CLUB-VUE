/**
 * Offline city -> (province, country, lng, lat) lookup for the fan map.
 *
 * Covers:
 *  - All 34 China province-level regions, with a curated list of prefecture-level cities
 *  - 80+ overseas metros where Chinese diaspora is concentrated, grouped by country/region
 *
 * This avoids any paid third-party geo API. If a user-entered city is unknown,
 * frontend falls back to the country-level centroid.
 */

export const CHINA_CITIES = [
    // 直辖市
    { city: '北京', province: '北京市', lng: 116.4074, lat: 39.9042 },
    { city: '上海', province: '上海市', lng: 121.4737, lat: 31.2304 },
    { city: '天津', province: '天津市', lng: 117.2010, lat: 39.0842 },
    { city: '重庆', province: '重庆市', lng: 106.5516, lat: 29.5630 },
    // 广东
    { city: '广州', province: '广东省', lng: 113.2644, lat: 23.1291 },
    { city: '深圳', province: '广东省', lng: 114.0579, lat: 22.5431 },
    { city: '东莞', province: '广东省', lng: 113.7518, lat: 23.0207 },
    { city: '佛山', province: '广东省', lng: 113.1220, lat: 23.0288 },
    { city: '珠海', province: '广东省', lng: 113.5767, lat: 22.2707 },
    { city: '中山', province: '广东省', lng: 113.3926, lat: 22.5178 },
    { city: '惠州', province: '广东省', lng: 114.4125, lat: 23.0793 },
    { city: '汕头', province: '广东省', lng: 116.6820, lat: 23.3535 },
    { city: '湛江', province: '广东省', lng: 110.3594, lat: 21.2707 },
    { city: '江门', province: '广东省', lng: 113.0945, lat: 22.5900 },
    { city: '肇庆', province: '广东省', lng: 112.4720, lat: 23.0515 },
    { city: '梅州', province: '广东省', lng: 116.1226, lat: 24.2886 },
    { city: '揭阳', province: '广东省', lng: 116.3728, lat: 23.5498 },
    { city: '清远', province: '广东省', lng: 113.0509, lat: 23.6820 },
    { city: '茂名', province: '广东省', lng: 110.9192, lat: 21.6630 },
    { city: '阳江', province: '广东省', lng: 111.9821, lat: 21.8579 },
    { city: '韶关', province: '广东省', lng: 113.5917, lat: 24.8014 },
    { city: '河源', province: '广东省', lng: 114.6978, lat: 23.7464 },
    { city: '汕尾', province: '广东省', lng: 115.3754, lat: 22.7858 },
    { city: '潮州', province: '广东省', lng: 116.6230, lat: 23.6618 },
    { city: '云浮', province: '广东省', lng: 112.0445, lat: 22.9293 },
    // 港澳台
    { city: '香港', province: '香港特别行政区', lng: 114.1694, lat: 22.3193 },
    { city: '澳门', province: '澳门特别行政区', lng: 113.5439, lat: 22.1987 },
    { city: '台北', province: '台湾省', lng: 121.5654, lat: 25.0330 },
    { city: '高雄', province: '台湾省', lng: 120.3014, lat: 22.6273 },
    { city: '台中', province: '台湾省', lng: 120.6738, lat: 24.1477 },
    { city: '台南', province: '台湾省', lng: 120.2270, lat: 23.0001 },
    { city: '桃园', province: '台湾省', lng: 121.3010, lat: 24.9937 },
    { city: '新竹', province: '台湾省', lng: 120.9647, lat: 24.8138 },
    // 江苏
    { city: '南京', province: '江苏省', lng: 118.7969, lat: 32.0603 },
    { city: '苏州', province: '江苏省', lng: 120.5853, lat: 31.2989 },
    { city: '无锡', province: '江苏省', lng: 120.3119, lat: 31.4912 },
    { city: '常州', province: '江苏省', lng: 119.9740, lat: 31.8112 },
    { city: '南通', province: '江苏省', lng: 120.8651, lat: 32.0160 },
    { city: '徐州', province: '江苏省', lng: 117.1849, lat: 34.2618 },
    { city: '扬州', province: '江苏省', lng: 119.4215, lat: 32.3932 },
    { city: '镇江', province: '江苏省', lng: 119.4524, lat: 32.2044 },
    { city: '盐城', province: '江苏省', lng: 120.1400, lat: 33.3775 },
    { city: '连云港', province: '江苏省', lng: 119.1788, lat: 34.6001 },
    { city: '淮安', province: '江苏省', lng: 119.0213, lat: 33.5976 },
    { city: '泰州', province: '江苏省', lng: 119.9155, lat: 32.4848 },
    { city: '宿迁', province: '江苏省', lng: 118.2750, lat: 33.9627 },
    // 浙江
    { city: '杭州', province: '浙江省', lng: 120.1551, lat: 30.2741 },
    { city: '宁波', province: '浙江省', lng: 121.5498, lat: 29.8683 },
    { city: '温州', province: '浙江省', lng: 120.6720, lat: 28.0005 },
    { city: '嘉兴', province: '浙江省', lng: 120.7506, lat: 30.7522 },
    { city: '绍兴', province: '浙江省', lng: 120.5820, lat: 29.9972 },
    { city: '金华', province: '浙江省', lng: 119.6498, lat: 29.0895 },
    { city: '台州', province: '浙江省', lng: 121.4208, lat: 28.6561 },
    { city: '湖州', province: '浙江省', lng: 120.1020, lat: 30.8672 },
    { city: '丽水', province: '浙江省', lng: 119.9229, lat: 28.4519 },
    { city: '衢州', province: '浙江省', lng: 118.8718, lat: 28.9418 },
    { city: '舟山', province: '浙江省', lng: 122.2077, lat: 29.9853 },
    // 四川
    { city: '成都', province: '四川省', lng: 104.0668, lat: 30.5728 },
    { city: '绵阳', province: '四川省', lng: 104.6792, lat: 31.4678 },
    { city: '德阳', province: '四川省', lng: 104.3983, lat: 31.1272 },
    { city: '宜宾', province: '四川省', lng: 104.6422, lat: 28.7513 },
    { city: '泸州', province: '四川省', lng: 105.4432, lat: 28.8891 },
    { city: '乐山', province: '四川省', lng: 103.7612, lat: 29.5823 },
    { city: '南充', province: '四川省', lng: 106.1105, lat: 30.8374 },
    { city: '攀枝花', province: '四川省', lng: 101.7160, lat: 26.5803 },
    { city: '自贡', province: '四川省', lng: 104.7734, lat: 29.3527 },
    { city: '达州', province: '四川省', lng: 107.5022, lat: 31.2092 },
    { city: '内江', province: '四川省', lng: 105.0661, lat: 29.5871 },
    { city: '遂宁', province: '四川省', lng: 105.5711, lat: 30.5133 },
    { city: '广元', province: '四川省', lng: 105.8295, lat: 32.4337 },
    { city: '广安', province: '四川省', lng: 106.6333, lat: 30.4564 },
    { city: '眉山', province: '四川省', lng: 103.8488, lat: 30.0777 },
    { city: '雅安', province: '四川省', lng: 103.0010, lat: 29.9877 },
    { city: '资阳', province: '四川省', lng: 104.6418, lat: 30.1222 },
    // 山东
    { city: '济南', province: '山东省', lng: 117.1201, lat: 36.6512 },
    { city: '青岛', province: '山东省', lng: 120.3826, lat: 36.0672 },
    { city: '烟台', province: '山东省', lng: 121.4479, lat: 37.4638 },
    { city: '潍坊', province: '山东省', lng: 119.1070, lat: 36.7093 },
    { city: '临沂', province: '山东省', lng: 118.3564, lat: 35.1045 },
    { city: '威海', province: '山东省', lng: 122.1164, lat: 37.5093 },
    { city: '淄博', province: '山东省', lng: 118.0571, lat: 36.8146 },
    { city: '济宁', province: '山东省', lng: 116.5872, lat: 35.4153 },
    { city: '泰安', province: '山东省', lng: 117.1290, lat: 36.1947 },
    { city: '日照', province: '山东省', lng: 119.5268, lat: 35.4164 },
    { city: '东营', province: '山东省', lng: 118.6647, lat: 37.4346 },
    { city: '德州', province: '山东省', lng: 116.3074, lat: 37.4536 },
    { city: '聊城', province: '山东省', lng: 115.9805, lat: 36.4565 },
    { city: '滨州', province: '山东省', lng: 118.0167, lat: 37.3835 },
    { city: '菏泽', province: '山东省', lng: 115.4694, lat: 35.2462 },
    { city: '枣庄', province: '山东省', lng: 117.3236, lat: 34.8104 },
    // 湖北
    { city: '武汉', province: '湖北省', lng: 114.3054, lat: 30.5931 },
    { city: '宜昌', province: '湖北省', lng: 111.2905, lat: 30.7025 },
    { city: '襄阳', province: '湖北省', lng: 112.1446, lat: 32.0424 },
    { city: '荆州', province: '湖北省', lng: 112.2382, lat: 30.3269 },
    { city: '十堰', province: '湖北省', lng: 110.7878, lat: 32.6469 },
    { city: '黄石', province: '湖北省', lng: 115.0772, lat: 30.2200 },
    { city: '孝感', province: '湖北省', lng: 113.9268, lat: 30.9264 },
    { city: '黄冈', province: '湖北省', lng: 114.8794, lat: 30.4477 },
    { city: '咸宁', province: '湖北省', lng: 114.3287, lat: 29.8328 },
    { city: '随州', province: '湖北省', lng: 113.3739, lat: 31.7174 },
    { city: '荆门', province: '湖北省', lng: 112.2046, lat: 31.0354 },
    { city: '鄂州', province: '湖北省', lng: 114.8907, lat: 30.3965 },
    { city: '恩施', province: '湖北省', lng: 109.4860, lat: 30.2725 },
    // 湖南
    { city: '长沙', province: '湖南省', lng: 112.9388, lat: 28.2282 },
    { city: '株洲', province: '湖南省', lng: 113.1515, lat: 27.8356 },
    { city: '湘潭', province: '湖南省', lng: 112.9448, lat: 27.8299 },
    { city: '衡阳', province: '湖南省', lng: 112.6072, lat: 26.9000 },
    { city: '岳阳', province: '湖南省', lng: 113.1293, lat: 29.3570 },
    { city: '常德', province: '湖南省', lng: 111.6916, lat: 29.0402 },
    { city: '邵阳', province: '湖南省', lng: 111.4677, lat: 27.2389 },
    { city: '益阳', province: '湖南省', lng: 112.3553, lat: 28.5538 },
    { city: '郴州', province: '湖南省', lng: 113.0148, lat: 25.7705 },
    { city: '永州', province: '湖南省', lng: 111.6132, lat: 26.4202 },
    { city: '怀化', province: '湖南省', lng: 109.9785, lat: 27.5500 },
    { city: '娄底', province: '湖南省', lng: 112.0083, lat: 27.7281 },
    { city: '张家界', province: '湖南省', lng: 110.4796, lat: 29.1175 },
    { city: '湘西', province: '湖南省', lng: 109.7393, lat: 28.3145 },
    // 河南
    { city: '郑州', province: '河南省', lng: 113.6254, lat: 34.7466 },
    { city: '洛阳', province: '河南省', lng: 112.4540, lat: 34.6197 },
    { city: '开封', province: '河南省', lng: 114.3077, lat: 34.7971 },
    { city: '南阳', province: '河南省', lng: 112.5280, lat: 33.0059 },
    { city: '新乡', province: '河南省', lng: 113.9268, lat: 35.3030 },
    { city: '安阳', province: '河南省', lng: 114.3525, lat: 36.1034 },
    { city: '焦作', province: '河南省', lng: 113.2418, lat: 35.2159 },
    { city: '平顶山', province: '河南省', lng: 113.3076, lat: 33.7355 },
    { city: '许昌', province: '河南省', lng: 113.8261, lat: 34.0228 },
    { city: '信阳', province: '河南省', lng: 114.0759, lat: 32.1228 },
    { city: '周口', province: '河南省', lng: 114.6967, lat: 33.6262 },
    { city: '商丘', province: '河南省', lng: 115.6505, lat: 34.4373 },
    { city: '驻马店', province: '河南省', lng: 114.0241, lat: 32.9802 },
    { city: '濮阳', province: '河南省', lng: 115.0414, lat: 35.7682 },
    { city: '漯河', province: '河南省', lng: 114.0264, lat: 33.5759 },
    { city: '三门峡', province: '河南省', lng: 111.1942, lat: 34.7773 },
    { city: '鹤壁', province: '河南省', lng: 114.2974, lat: 35.7480 },
    { city: '济源', province: '河南省', lng: 112.5902, lat: 35.0903 },
    // 河北
    { city: '石家庄', province: '河北省', lng: 114.5149, lat: 38.0428 },
    { city: '唐山', province: '河北省', lng: 118.1756, lat: 39.6350 },
    { city: '保定', province: '河北省', lng: 115.4827, lat: 38.8671 },
    { city: '廊坊', province: '河北省', lng: 116.7132, lat: 39.5291 },
    { city: '邯郸', province: '河北省', lng: 114.5391, lat: 36.6256 },
    { city: '秦皇岛', province: '河北省', lng: 119.5865, lat: 39.9425 },
    { city: '张家口', province: '河北省', lng: 114.8794, lat: 40.8118 },
    { city: '承德', province: '河北省', lng: 117.9622, lat: 40.9522 },
    { city: '沧州', province: '河北省', lng: 116.8388, lat: 38.3043 },
    { city: '邢台', province: '河北省', lng: 114.5085, lat: 37.0682 },
    { city: '衡水', province: '河北省', lng: 115.6655, lat: 37.7351 },
    // 山西
    { city: '太原', province: '山西省', lng: 112.5495, lat: 37.8572 },
    { city: '大同', province: '山西省', lng: 113.3000, lat: 40.0768 },
    { city: '运城', province: '山西省', lng: 111.0077, lat: 35.0269 },
    { city: '临汾', province: '山西省', lng: 111.5187, lat: 36.0828 },
    { city: '晋中', province: '山西省', lng: 112.7368, lat: 37.6962 },
    { city: '长治', province: '山西省', lng: 113.1163, lat: 36.1957 },
    { city: '晋城', province: '山西省', lng: 112.8516, lat: 35.4970 },
    { city: '阳泉', province: '山西省', lng: 113.5832, lat: 37.8615 },
    { city: '朔州', province: '山西省', lng: 112.4329, lat: 39.3315 },
    { city: '忻州', province: '山西省', lng: 112.7341, lat: 38.4170 },
    { city: '吕梁', province: '山西省', lng: 111.1450, lat: 37.5197 },
    // 陕西
    { city: '西安', province: '陕西省', lng: 108.9398, lat: 34.3416 },
    { city: '咸阳', province: '陕西省', lng: 108.7051, lat: 34.3330 },
    { city: '宝鸡', province: '陕西省', lng: 107.1447, lat: 34.3694 },
    { city: '榆林', province: '陕西省', lng: 109.7411, lat: 38.2905 },
    { city: '渭南', province: '陕西省', lng: 109.5028, lat: 34.4990 },
    { city: '汉中', province: '陕西省', lng: 107.0288, lat: 33.0772 },
    { city: '延安', province: '陕西省', lng: 109.4894, lat: 36.5853 },
    { city: '安康', province: '陕西省', lng: 109.0292, lat: 32.6849 },
    { city: '商洛', province: '陕西省', lng: 109.9398, lat: 33.8683 },
    { city: '铜川', province: '陕西省', lng: 108.9450, lat: 34.8973 },
    // 甘肃
    { city: '兰州', province: '甘肃省', lng: 103.8343, lat: 36.0611 },
    { city: '天水', province: '甘肃省', lng: 105.7249, lat: 34.5806 },
    { city: '酒泉', province: '甘肃省', lng: 98.4944, lat: 39.7325 },
    { city: '嘉峪关', province: '甘肃省', lng: 98.2773, lat: 39.7866 },
    { city: '张掖', province: '甘肃省', lng: 100.4495, lat: 38.9329 },
    { city: '武威', province: '甘肃省', lng: 102.6347, lat: 37.9303 },
    { city: '金昌', province: '甘肃省', lng: 102.1879, lat: 38.5141 },
    { city: '白银', province: '甘肃省', lng: 104.1737, lat: 36.5466 },
    { city: '平凉', province: '甘肃省', lng: 106.6650, lat: 35.5430 },
    { city: '庆阳', province: '甘肃省', lng: 107.6440, lat: 35.7090 },
    { city: '定西', province: '甘肃省', lng: 104.6260, lat: 35.5790 },
    { city: '陇南', province: '甘肃省', lng: 104.9219, lat: 33.4007 },
    // 青海
    { city: '西宁', province: '青海省', lng: 101.7789, lat: 36.6233 },
    { city: '海东', province: '青海省', lng: 102.1042, lat: 36.5026 },
    { city: '格尔木', province: '青海省', lng: 94.9056, lat: 36.4067 },
    // 宁夏
    { city: '银川', province: '宁夏回族自治区', lng: 106.2309, lat: 38.4872 },
    { city: '石嘴山', province: '宁夏回族自治区', lng: 106.3845, lat: 39.0252 },
    { city: '吴忠', province: '宁夏回族自治区', lng: 106.1995, lat: 37.9863 },
    { city: '中卫', province: '宁夏回族自治区', lng: 105.1896, lat: 37.5149 },
    { city: '固原', province: '宁夏回族自治区', lng: 106.2424, lat: 36.0158 },
    // 新疆
    { city: '乌鲁木齐', province: '新疆维吾尔自治区', lng: 87.6168, lat: 43.8256 },
    { city: '喀什', province: '新疆维吾尔自治区', lng: 75.9898, lat: 39.4677 },
    { city: '伊犁', province: '新疆维吾尔自治区', lng: 81.3179, lat: 43.9219 },
    { city: '克拉玛依', province: '新疆维吾尔自治区', lng: 84.8739, lat: 45.5959 },
    { city: '阿克苏', province: '新疆维吾尔自治区', lng: 80.2606, lat: 41.1683 },
    { city: '吐鲁番', province: '新疆维吾尔自治区', lng: 89.1841, lat: 42.9476 },
    { city: '哈密', province: '新疆维吾尔自治区', lng: 93.5151, lat: 42.8189 },
    { city: '昌吉', province: '新疆维吾尔自治区', lng: 87.3041, lat: 44.0143 },
    { city: '石河子', province: '新疆维吾尔自治区', lng: 86.0411, lat: 44.3057 },
    // 西藏
    { city: '拉萨', province: '西藏自治区', lng: 91.1409, lat: 29.6456 },
    { city: '日喀则', province: '西藏自治区', lng: 88.8851, lat: 29.2670 },
    { city: '林芝', province: '西藏自治区', lng: 94.3624, lat: 29.6547 },
    { city: '昌都', province: '西藏自治区', lng: 97.1785, lat: 31.1369 },
    { city: '山南', province: '西藏自治区', lng: 91.7665, lat: 29.2360 },
    { city: '那曲', province: '西藏自治区', lng: 92.0533, lat: 31.4760 },
    { city: '阿里', province: '西藏自治区', lng: 80.1057, lat: 32.5034 },
    // 内蒙古
    { city: '呼和浩特', province: '内蒙古自治区', lng: 111.7519, lat: 40.8415 },
    { city: '包头', province: '内蒙古自治区', lng: 109.8405, lat: 40.6580 },
    { city: '赤峰', province: '内蒙古自治区', lng: 118.9566, lat: 42.2758 },
    { city: '鄂尔多斯', province: '内蒙古自治区', lng: 109.7813, lat: 39.6088 },
    { city: '通辽', province: '内蒙古自治区', lng: 122.2630, lat: 43.6173 },
    { city: '呼伦贝尔', province: '内蒙古自治区', lng: 119.7665, lat: 49.2153 },
    { city: '乌兰察布', province: '内蒙古自治区', lng: 113.1143, lat: 41.0344 },
    { city: '巴彦淖尔', province: '内蒙古自治区', lng: 107.4173, lat: 40.7575 },
    { city: '锡林郭勒', province: '内蒙古自治区', lng: 116.0902, lat: 43.9444 },
    // 辽宁
    { city: '沈阳', province: '辽宁省', lng: 123.4291, lat: 41.7968 },
    { city: '大连', province: '辽宁省', lng: 121.6147, lat: 38.9140 },
    { city: '鞍山', province: '辽宁省', lng: 122.9947, lat: 41.1094 },
    { city: '抚顺', province: '辽宁省', lng: 123.9211, lat: 41.8757 },
    { city: '本溪', province: '辽宁省', lng: 123.7660, lat: 41.2944 },
    { city: '丹东', province: '辽宁省', lng: 124.3835, lat: 40.1244 },
    { city: '锦州', province: '辽宁省', lng: 121.1265, lat: 41.0951 },
    { city: '营口', province: '辽宁省', lng: 122.2289, lat: 40.6651 },
    { city: '盘锦', province: '辽宁省', lng: 122.0696, lat: 41.1248 },
    { city: '葫芦岛', province: '辽宁省', lng: 120.8369, lat: 40.7110 },
    { city: '辽阳', province: '辽宁省', lng: 123.1815, lat: 41.2693 },
    { city: '铁岭', province: '辽宁省', lng: 123.8443, lat: 42.2906 },
    { city: '阜新', province: '辽宁省', lng: 121.6700, lat: 42.0218 },
    { city: '朝阳', province: '辽宁省', lng: 120.4519, lat: 41.5764 },
    // 吉林
    { city: '长春', province: '吉林省', lng: 125.3245, lat: 43.8171 },
    { city: '吉林', province: '吉林省', lng: 126.5530, lat: 43.8436 },
    { city: '延边', province: '吉林省', lng: 129.5149, lat: 42.9046 },
    { city: '四平', province: '吉林省', lng: 124.3506, lat: 43.1666 },
    { city: '通化', province: '吉林省', lng: 125.9365, lat: 41.7212 },
    { city: '白山', province: '吉林省', lng: 126.4275, lat: 41.9425 },
    { city: '松原', province: '吉林省', lng: 124.8254, lat: 45.1413 },
    { city: '白城', province: '吉林省', lng: 122.8413, lat: 45.6196 },
    { city: '辽源', province: '吉林省', lng: 125.1453, lat: 42.9026 },
    // 黑龙江
    { city: '哈尔滨', province: '黑龙江省', lng: 126.5340, lat: 45.8038 },
    { city: '大庆', province: '黑龙江省', lng: 125.1137, lat: 46.5907 },
    { city: '齐齐哈尔', province: '黑龙江省', lng: 123.9180, lat: 47.3543 },
    { city: '牡丹江', province: '黑龙江省', lng: 129.6332, lat: 44.5516 },
    { city: '佳木斯', province: '黑龙江省', lng: 130.3186, lat: 46.7997 },
    { city: '鸡西', province: '黑龙江省', lng: 130.9750, lat: 45.3001 },
    { city: '伊春', province: '黑龙江省', lng: 128.8993, lat: 47.7244 },
    { city: '黑河', province: '黑龙江省', lng: 127.5285, lat: 50.2453 },
    { city: '绥化', province: '黑龙江省', lng: 126.9686, lat: 46.6373 },
    // 福建
    { city: '福州', province: '福建省', lng: 119.2965, lat: 26.0745 },
    { city: '厦门', province: '福建省', lng: 118.1102, lat: 24.4892 },
    { city: '泉州', province: '福建省', lng: 118.6753, lat: 24.8743 },
    { city: '莆田', province: '福建省', lng: 119.0077, lat: 25.4540 },
    { city: '漳州', province: '福建省', lng: 117.6471, lat: 24.5130 },
    { city: '宁德', province: '福建省', lng: 119.5277, lat: 26.6593 },
    { city: '三明', province: '福建省', lng: 117.6357, lat: 26.2654 },
    { city: '南平', province: '福建省', lng: 118.1779, lat: 26.6418 },
    { city: '龙岩', province: '福建省', lng: 117.0297, lat: 25.0911 },
    // 江西
    { city: '南昌', province: '江西省', lng: 115.8921, lat: 28.6765 },
    { city: '赣州', province: '江西省', lng: 114.9404, lat: 25.8452 },
    { city: '九江', province: '江西省', lng: 115.9923, lat: 29.7120 },
    { city: '上饶', province: '江西省', lng: 117.9714, lat: 28.4444 },
    { city: '吉安', province: '江西省', lng: 114.9866, lat: 27.1117 },
    { city: '宜春', province: '江西省', lng: 114.4163, lat: 27.8157 },
    { city: '抚州', province: '江西省', lng: 116.3580, lat: 27.9835 },
    { city: '景德镇', province: '江西省', lng: 117.2145, lat: 29.2925 },
    { city: '萍乡', province: '江西省', lng: 113.8521, lat: 27.6228 },
    { city: '新余', province: '江西省', lng: 114.9305, lat: 27.8108 },
    { city: '鹰潭', province: '江西省', lng: 117.0688, lat: 28.2603 },
    // 安徽
    { city: '合肥', province: '安徽省', lng: 117.2830, lat: 31.8612 },
    { city: '芜湖', province: '安徽省', lng: 118.3763, lat: 31.3260 },
    { city: '蚌埠', province: '安徽省', lng: 117.3889, lat: 32.9164 },
    { city: '马鞍山', province: '安徽省', lng: 118.5079, lat: 31.6894 },
    { city: '安庆', province: '安徽省', lng: 117.0537, lat: 30.5247 },
    { city: '阜阳', province: '安徽省', lng: 115.8195, lat: 32.8966 },
    { city: '宿州', province: '安徽省', lng: 116.9639, lat: 33.6469 },
    { city: '滁州', province: '安徽省', lng: 118.3169, lat: 32.3036 },
    { city: '六安', province: '安徽省', lng: 116.5078, lat: 31.7526 },
    { city: '宣城', province: '安徽省', lng: 118.7575, lat: 30.9457 },
    { city: '黄山', province: '安徽省', lng: 118.3171, lat: 29.7092 },
    { city: '亳州', province: '安徽省', lng: 115.7782, lat: 33.8447 },
    { city: '池州', province: '安徽省', lng: 117.4895, lat: 30.6562 },
    { city: '淮南', province: '安徽省', lng: 117.0186, lat: 32.6479 },
    { city: '淮北', province: '安徽省', lng: 116.7945, lat: 33.9710 },
    { city: '铜陵', province: '安徽省', lng: 117.8160, lat: 30.9296 },
    // 广西
    { city: '南宁', province: '广西壮族自治区', lng: 108.3200, lat: 22.8244 },
    { city: '桂林', province: '广西壮族自治区', lng: 110.2900, lat: 25.2740 },
    { city: '柳州', province: '广西壮族自治区', lng: 109.4118, lat: 24.3146 },
    { city: '梧州', province: '广西壮族自治区', lng: 111.2972, lat: 23.4774 },
    { city: '北海', province: '广西壮族自治区', lng: 109.1199, lat: 21.4733 },
    { city: '玉林', province: '广西壮族自治区', lng: 110.1819, lat: 22.6342 },
    { city: '防城港', province: '广西壮族自治区', lng: 108.3450, lat: 21.6147 },
    { city: '钦州', province: '广西壮族自治区', lng: 108.6543, lat: 21.9799 },
    { city: '贵港', province: '广西壮族自治区', lng: 109.5986, lat: 23.1117 },
    { city: '百色', province: '广西壮族自治区', lng: 106.6166, lat: 23.8973 },
    { city: '贺州', province: '广西壮族自治区', lng: 111.5523, lat: 24.4141 },
    { city: '河池', province: '广西壮族自治区', lng: 108.0850, lat: 24.6929 },
    { city: '来宾', province: '广西壮族自治区', lng: 109.2210, lat: 23.7501 },
    { city: '崇左', province: '广西壮族自治区', lng: 107.3537, lat: 22.4040 },
    // 贵州
    { city: '贵阳', province: '贵州省', lng: 106.6302, lat: 26.6477 },
    { city: '遵义', province: '贵州省', lng: 106.9373, lat: 27.7069 },
    { city: '六盘水', province: '贵州省', lng: 104.8466, lat: 26.5848 },
    { city: '安顺', province: '贵州省', lng: 105.9320, lat: 26.2455 },
    { city: '毕节', province: '贵州省', lng: 105.2926, lat: 27.2839 },
    { city: '铜仁', province: '贵州省', lng: 109.1894, lat: 27.7187 },
    { city: '黔东南', province: '贵州省', lng: 107.9777, lat: 26.5836 },
    { city: '黔南', province: '贵州省', lng: 107.5172, lat: 26.2580 },
    { city: '黔西南', province: '贵州省', lng: 104.8979, lat: 25.0879 },
    // 云南
    { city: '昆明', province: '云南省', lng: 102.7139, lat: 25.0406 },
    { city: '大理', province: '云南省', lng: 100.2399, lat: 25.5960 },
    { city: '丽江', province: '云南省', lng: 100.2332, lat: 26.8721 },
    { city: '曲靖', province: '云南省', lng: 103.7969, lat: 25.4904 },
    { city: '玉溪', province: '云南省', lng: 102.5430, lat: 24.3503 },
    { city: '保山', province: '云南省', lng: 99.1671, lat: 25.1118 },
    { city: '昭通', province: '云南省', lng: 103.7172, lat: 27.3380 },
    { city: '普洱', province: '云南省', lng: 100.9722, lat: 22.7777 },
    { city: '临沧', province: '云南省', lng: 100.0893, lat: 23.8866 },
    { city: '楚雄', province: '云南省', lng: 101.5460, lat: 25.0418 },
    { city: '红河', province: '云南省', lng: 103.3742, lat: 23.3631 },
    { city: '文山', province: '云南省', lng: 104.2440, lat: 23.3697 },
    { city: '西双版纳', province: '云南省', lng: 100.7975, lat: 22.0017 },
    { city: '德宏', province: '云南省', lng: 98.5784, lat: 24.4337 },
    { city: '怒江', province: '云南省', lng: 98.8543, lat: 25.8509 },
    { city: '迪庆', province: '云南省', lng: 99.7060, lat: 27.8269 },
    // 海南
    { city: '海口', province: '海南省', lng: 110.1990, lat: 20.0443 },
    { city: '三亚', province: '海南省', lng: 109.5085, lat: 18.2528 },
    { city: '三沙', province: '海南省', lng: 112.3486, lat: 16.8311 },
    { city: '儋州', province: '海南省', lng: 109.5807, lat: 19.5217 }
];

// ISO2 country codes kept for ECharts i18n matching with world map.
export const OVERSEAS_CITIES = [
    // 东亚
    { city: '东京', country: '日本', countryCode: 'JP', lng: 139.6917, lat: 35.6895 },
    { city: '大阪', country: '日本', countryCode: 'JP', lng: 135.5023, lat: 34.6937 },
    { city: '京都', country: '日本', countryCode: 'JP', lng: 135.7681, lat: 35.0116 },
    { city: '名古屋', country: '日本', countryCode: 'JP', lng: 136.9066, lat: 35.1815 },
    { city: '横滨', country: '日本', countryCode: 'JP', lng: 139.6380, lat: 35.4437 },
    { city: '札幌', country: '日本', countryCode: 'JP', lng: 141.3545, lat: 43.0621 },
    { city: '福冈', country: '日本', countryCode: 'JP', lng: 130.4017, lat: 33.5904 },
    { city: '首尔', country: '韩国', countryCode: 'KR', lng: 126.9780, lat: 37.5665 },
    { city: '釜山', country: '韩国', countryCode: 'KR', lng: 129.0756, lat: 35.1796 },
    { city: '仁川', country: '韩国', countryCode: 'KR', lng: 126.7052, lat: 37.4563 },
    // 东南亚
    { city: '新加坡', country: '新加坡', countryCode: 'SG', lng: 103.8198, lat: 1.3521 },
    { city: '吉隆坡', country: '马来西亚', countryCode: 'MY', lng: 101.6869, lat: 3.1390 },
    { city: '槟城', country: '马来西亚', countryCode: 'MY', lng: 100.3327, lat: 5.4141 },
    { city: '新山', country: '马来西亚', countryCode: 'MY', lng: 103.7414, lat: 1.4927 },
    { city: '曼谷', country: '泰国', countryCode: 'TH', lng: 100.5018, lat: 13.7563 },
    { city: '清迈', country: '泰国', countryCode: 'TH', lng: 98.9853, lat: 18.7883 },
    { city: '普吉', country: '泰国', countryCode: 'TH', lng: 98.3923, lat: 7.8804 },
    { city: '雅加达', country: '印度尼西亚', countryCode: 'ID', lng: 106.8456, lat: -6.2088 },
    { city: '巴厘岛', country: '印度尼西亚', countryCode: 'ID', lng: 115.1889, lat: -8.4095 },
    { city: '马尼拉', country: '菲律宾', countryCode: 'PH', lng: 120.9842, lat: 14.5995 },
    { city: '宿务', country: '菲律宾', countryCode: 'PH', lng: 123.8854, lat: 10.3157 },
    { city: '河内', country: '越南', countryCode: 'VN', lng: 105.8542, lat: 21.0285 },
    { city: '胡志明市', country: '越南', countryCode: 'VN', lng: 106.6297, lat: 10.8231 },
    { city: '岘港', country: '越南', countryCode: 'VN', lng: 108.2208, lat: 16.0544 },
    { city: '金边', country: '柬埔寨', countryCode: 'KH', lng: 104.9160, lat: 11.5564 },
    { city: '万象', country: '老挝', countryCode: 'LA', lng: 102.6331, lat: 17.9757 },
    { city: '仰光', country: '缅甸', countryCode: 'MM', lng: 96.1951, lat: 16.8661 },
    // 南亚
    { city: '新德里', country: '印度', countryCode: 'IN', lng: 77.2090, lat: 28.6139 },
    { city: '孟买', country: '印度', countryCode: 'IN', lng: 72.8777, lat: 19.0760 },
    { city: '班加罗尔', country: '印度', countryCode: 'IN', lng: 77.5946, lat: 12.9716 },
    { city: '科伦坡', country: '斯里兰卡', countryCode: 'LK', lng: 79.8612, lat: 6.9271 },
    // 北美 - 美国
    { city: '纽约', country: '美国', countryCode: 'US', lng: -74.0060, lat: 40.7128 },
    { city: '洛杉矶', country: '美国', countryCode: 'US', lng: -118.2437, lat: 34.0522 },
    { city: '旧金山', country: '美国', countryCode: 'US', lng: -122.4194, lat: 37.7749 },
    { city: '西雅图', country: '美国', countryCode: 'US', lng: -122.3321, lat: 47.6062 },
    { city: '芝加哥', country: '美国', countryCode: 'US', lng: -87.6298, lat: 41.8781 },
    { city: '波士顿', country: '美国', countryCode: 'US', lng: -71.0589, lat: 42.3601 },
    { city: '休斯顿', country: '美国', countryCode: 'US', lng: -95.3698, lat: 29.7604 },
    { city: '华盛顿', country: '美国', countryCode: 'US', lng: -77.0369, lat: 38.9072 },
    { city: '圣地亚哥', country: '美国', countryCode: 'US', lng: -117.1611, lat: 32.7157 },
    { city: '达拉斯', country: '美国', countryCode: 'US', lng: -96.7970, lat: 32.7767 },
    { city: '亚特兰大', country: '美国', countryCode: 'US', lng: -84.3880, lat: 33.7490 },
    { city: '迈阿密', country: '美国', countryCode: 'US', lng: -80.1918, lat: 25.7617 },
    { city: '费城', country: '美国', countryCode: 'US', lng: -75.1652, lat: 39.9526 },
    { city: '凤凰城', country: '美国', countryCode: 'US', lng: -112.0740, lat: 33.4484 },
    { city: '夏威夷', country: '美国', countryCode: 'US', lng: -157.8583, lat: 21.3069 },
    // 北美 - 加拿大
    { city: '温哥华', country: '加拿大', countryCode: 'CA', lng: -123.1207, lat: 49.2827 },
    { city: '多伦多', country: '加拿大', countryCode: 'CA', lng: -79.3832, lat: 43.6532 },
    { city: '蒙特利尔', country: '加拿大', countryCode: 'CA', lng: -73.5673, lat: 45.5017 },
    { city: '卡尔加里', country: '加拿大', countryCode: 'CA', lng: -114.0719, lat: 51.0447 },
    { city: '渥太华', country: '加拿大', countryCode: 'CA', lng: -75.6972, lat: 45.4215 },
    { city: '埃德蒙顿', country: '加拿大', countryCode: 'CA', lng: -113.4938, lat: 53.5461 },
    // 欧洲
    { city: '伦敦', country: '英国', countryCode: 'GB', lng: -0.1276, lat: 51.5074 },
    { city: '曼彻斯特', country: '英国', countryCode: 'GB', lng: -2.2426, lat: 53.4808 },
    { city: '爱丁堡', country: '英国', countryCode: 'GB', lng: -3.1883, lat: 55.9533 },
    { city: '伯明翰', country: '英国', countryCode: 'GB', lng: -1.8904, lat: 52.4862 },
    { city: '巴黎', country: '法国', countryCode: 'FR', lng: 2.3522, lat: 48.8566 },
    { city: '里昂', country: '法国', countryCode: 'FR', lng: 4.8357, lat: 45.7640 },
    { city: '马赛', country: '法国', countryCode: 'FR', lng: 5.3698, lat: 43.2965 },
    { city: '柏林', country: '德国', countryCode: 'DE', lng: 13.4050, lat: 52.5200 },
    { city: '慕尼黑', country: '德国', countryCode: 'DE', lng: 11.5820, lat: 48.1351 },
    { city: '法兰克福', country: '德国', countryCode: 'DE', lng: 8.6821, lat: 50.1109 },
    { city: '汉堡', country: '德国', countryCode: 'DE', lng: 9.9937, lat: 53.5511 },
    { city: '阿姆斯特丹', country: '荷兰', countryCode: 'NL', lng: 4.9041, lat: 52.3676 },
    { city: '鹿特丹', country: '荷兰', countryCode: 'NL', lng: 4.4777, lat: 51.9244 },
    { city: '布鲁塞尔', country: '比利时', countryCode: 'BE', lng: 4.3517, lat: 50.8503 },
    { city: '罗马', country: '意大利', countryCode: 'IT', lng: 12.4964, lat: 41.9028 },
    { city: '米兰', country: '意大利', countryCode: 'IT', lng: 9.1900, lat: 45.4642 },
    { city: '威尼斯', country: '意大利', countryCode: 'IT', lng: 12.3155, lat: 45.4408 },
    { city: '马德里', country: '西班牙', countryCode: 'ES', lng: -3.7038, lat: 40.4168 },
    { city: '巴塞罗那', country: '西班牙', countryCode: 'ES', lng: 2.1734, lat: 41.3851 },
    { city: '里斯本', country: '葡萄牙', countryCode: 'PT', lng: -9.1393, lat: 38.7223 },
    { city: '苏黎世', country: '瑞士', countryCode: 'CH', lng: 8.5417, lat: 47.3769 },
    { city: '日内瓦', country: '瑞士', countryCode: 'CH', lng: 6.1432, lat: 46.2044 },
    { city: '维也纳', country: '奥地利', countryCode: 'AT', lng: 16.3738, lat: 48.2082 },
    { city: '布拉格', country: '捷克', countryCode: 'CZ', lng: 14.4378, lat: 50.0755 },
    { city: '华沙', country: '波兰', countryCode: 'PL', lng: 21.0122, lat: 52.2297 },
    { city: '布达佩斯', country: '匈牙利', countryCode: 'HU', lng: 19.0402, lat: 47.4979 },
    { city: '斯德哥尔摩', country: '瑞典', countryCode: 'SE', lng: 18.0686, lat: 59.3293 },
    { city: '哥本哈根', country: '丹麦', countryCode: 'DK', lng: 12.5683, lat: 55.6761 },
    { city: '奥斯陆', country: '挪威', countryCode: 'NO', lng: 10.7522, lat: 59.9139 },
    { city: '赫尔辛基', country: '芬兰', countryCode: 'FI', lng: 24.9384, lat: 60.1699 },
    { city: '都柏林', country: '爱尔兰', countryCode: 'IE', lng: -6.2603, lat: 53.3498 },
    { city: '雅典', country: '希腊', countryCode: 'GR', lng: 23.7275, lat: 37.9838 },
    { city: '莫斯科', country: '俄罗斯', countryCode: 'RU', lng: 37.6173, lat: 55.7558 },
    { city: '圣彼得堡', country: '俄罗斯', countryCode: 'RU', lng: 30.3351, lat: 59.9343 },
    // 大洋洲
    { city: '悉尼', country: '澳大利亚', countryCode: 'AU', lng: 151.2093, lat: -33.8688 },
    { city: '墨尔本', country: '澳大利亚', countryCode: 'AU', lng: 144.9631, lat: -37.8136 },
    { city: '布里斯班', country: '澳大利亚', countryCode: 'AU', lng: 153.0251, lat: -27.4698 },
    { city: '珀斯', country: '澳大利亚', countryCode: 'AU', lng: 115.8605, lat: -31.9505 },
    { city: '阿德莱德', country: '澳大利亚', countryCode: 'AU', lng: 138.6007, lat: -34.9285 },
    { city: '堪培拉', country: '澳大利亚', countryCode: 'AU', lng: 149.1300, lat: -35.2809 },
    { city: '黄金海岸', country: '澳大利亚', countryCode: 'AU', lng: 153.4000, lat: -28.0167 },
    { city: '奥克兰', country: '新西兰', countryCode: 'NZ', lng: 174.7633, lat: -36.8485 },
    { city: '惠灵顿', country: '新西兰', countryCode: 'NZ', lng: 174.7762, lat: -41.2865 },
    { city: '基督城', country: '新西兰', countryCode: 'NZ', lng: 172.6362, lat: -43.5320 },
    // 中东
    { city: '迪拜', country: '阿联酋', countryCode: 'AE', lng: 55.2708, lat: 25.2048 },
    { city: '阿布扎比', country: '阿联酋', countryCode: 'AE', lng: 54.3773, lat: 24.4539 },
    { city: '多哈', country: '卡塔尔', countryCode: 'QA', lng: 51.5310, lat: 25.2854 },
    { city: '利雅得', country: '沙特阿拉伯', countryCode: 'SA', lng: 46.6753, lat: 24.7136 },
    { city: '伊斯坦布尔', country: '土耳其', countryCode: 'TR', lng: 28.9784, lat: 41.0082 },
    { city: '特拉维夫', country: '以色列', countryCode: 'IL', lng: 34.7818, lat: 32.0853 },
    // 南美 / 非洲
    { city: '圣保罗', country: '巴西', countryCode: 'BR', lng: -46.6333, lat: -23.5505 },
    { city: '里约热内卢', country: '巴西', countryCode: 'BR', lng: -43.1729, lat: -22.9068 },
    { city: '布宜诺斯艾利斯', country: '阿根廷', countryCode: 'AR', lng: -58.3816, lat: -34.6037 },
    { city: '圣地亚哥(智利)', country: '智利', countryCode: 'CL', lng: -70.6693, lat: -33.4489 },
    { city: '墨西哥城', country: '墨西哥', countryCode: 'MX', lng: -99.1332, lat: 19.4326 },
    { city: '开普敦', country: '南非', countryCode: 'ZA', lng: 18.4241, lat: -33.9249 },
    { city: '约翰内斯堡', country: '南非', countryCode: 'ZA', lng: 28.0473, lat: -26.2041 },
    { city: '开罗', country: '埃及', countryCode: 'EG', lng: 31.2357, lat: 30.0444 }
];

// Build a quick lookup: city name -> record
const _map = new Map();
CHINA_CITIES.forEach(c => _map.set(c.city, { ...c, country: '中国' }));
OVERSEAS_CITIES.forEach(c => _map.set(c.city, c));

export function lookupCity(name) {
    if (!name) return null;
    const trimmed = name.trim();
    return _map.get(trimmed) || null;
}

export function allCityNames() {
    return [...CHINA_CITIES.map(c => c.city), ...OVERSEAS_CITIES.map(c => c.city)];
}

// ========== Cascading select helpers ==========

// 国家列表：中国置顶，其余按字母/常见度排序
const _overseaCountriesOrdered = (() => {
    const order = [
        '中国香港', '中国澳门', '中国台湾', // 这三个特殊地区不在 OVERSEAS_CITIES，作为占位
    ];
    const seen = new Set();
    const list = [];
    OVERSEAS_CITIES.forEach(c => {
        if (!seen.has(c.country)) {
            seen.add(c.country);
            list.push(c.country);
        }
    });
    return list;
})();

export function getCountries() {
    return ['中国', ..._overseaCountriesOrdered];
}

// 中国省份（按 CHINA_CITIES 中的出现顺序去重）
const _chinaProvinces = (() => {
    const seen = new Set();
    const list = [];
    CHINA_CITIES.forEach(c => {
        if (!seen.has(c.province)) {
            seen.add(c.province);
            list.push(c.province);
        }
    });
    return list;
})();

/**
 * 获取国家下的"省/州"列表
 * 中国 -> 真实省份；海外 -> 返回空数组（直接进城市选择）
 */
export function getProvincesOfCountry(country) {
    if (country === '中国') return _chinaProvinces.slice();
    return [];
}

/**
 * 获取城市列表
 *  - country='中国' && province  -> 该省下的城市
 *  - country!='中国'             -> 该国全部城市（province 忽略）
 */
export function getCitiesOfProvince(country, province) {
    if (country === '中国') {
        return CHINA_CITIES
            .filter(c => c.province === province)
            .map(c => c.city);
    }
    return OVERSEAS_CITIES
        .filter(c => c.country === country)
        .map(c => c.city);
}
