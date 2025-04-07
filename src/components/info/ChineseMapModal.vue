<template>
  <div class="map-container">
    <h2 class="section-title">
      <span class="icon">🗺️</span>
      演唱会巡演地图
      <span v-if="selectedProvince" class="selected-province">
        - {{ selectedProvince }}
      </span>
    </h2>
    <div class="map-content">
      <div class="map-instructions">
        <p>
          <span class="instruction-icon">🔍</span> 
          <span class="instruction-text">提示：鼠标滚轮可以缩放地图，按住左键可以拖动地图，点击省份可以查看详细分布</span>
        </p>
      </div>
      <div ref="chartDom" class="echarts-container"></div>
      <div class="map-footer">
        <p class="data-note">注：地图仅展示已举办场次，场次数可能根据演出规模进行加权计算</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, watch } from 'vue';
import * as echarts from 'echarts';
import apiClient from '@/utils/api';

// 定义组件属性
const props = defineProps({
  concerts: {
    type: Array,
    default: () => []
  }
});

// 定义中国城市到省份的映射
const cityToProvinceMap = {
  // 华北地区
  '北京': '北京市',
  '天津': '天津市',
  '石家庄': '河北省',
  '唐山': '河北省',
  '保定': '河北省',
  '张家口': '河北省',
  '承德': '河北省',
  '秦皇岛': '河北省',
  '沧州': '河北省',
  '廊坊': '河北省',
  '衡水': '河北省',
  '邯郸': '河北省',
  '邢台': '河北省',
  '太原': '山西省',
  '大同': '山西省',
  '长治': '山西省',
  '晋城': '山西省',
  '朔州': '山西省',
  '晋中': '山西省',
  '运城': '山西省',
  '忻州': '山西省',
  '临汾': '山西省',
  '吕梁': '山西省',
  '呼和浩特': '内蒙古自治区',
  '包头': '内蒙古自治区',
  '赤峰': '内蒙古自治区',
  '通辽': '内蒙古自治区',
  '呼伦贝尔': '内蒙古自治区',
  '鄂尔多斯': '内蒙古自治区',
  
  // 东北地区
  '沈阳': '辽宁省',
  '大连': '辽宁省',
  '鞍山': '辽宁省',
  '抚顺': '辽宁省',
  '本溪': '辽宁省',
  '丹东': '辽宁省',
  '锦州': '辽宁省',
  '长春': '吉林省',
  '吉林': '吉林省',
  '四平': '吉林省',
  '通化': '吉林省',
  '白山': '吉林省',
  '松原': '吉林省',
  '哈尔滨': '黑龙江省',
  '齐齐哈尔': '黑龙江省',
  '牡丹江': '黑龙江省',
  '佳木斯': '黑龙江省',
  '大庆': '黑龙江省',
  
  // 华东地区
  '上海': '上海市',
  '南京': '江苏省',
  '无锡': '江苏省',
  '徐州': '江苏省',
  '常州': '江苏省',
  '苏州': '江苏省',
  '南通': '江苏省',
  '淮安': '江苏省',
  '盐城': '江苏省',
  '扬州': '江苏省',
  '镇江': '江苏省',
  '泰州': '江苏省',
  '杭州': '浙江省',
  '宁波': '浙江省',
  '温州': '浙江省',
  '嘉兴': '浙江省',
  '湖州': '浙江省',
  '绍兴': '浙江省',
  '金华': '浙江省',
  '台州': '浙江省',
  '衢州': '浙江省',
  '合肥': '安徽省',
  '芜湖': '安徽省',
  '蚌埠': '安徽省',
  '安庆': '安徽省',
  '黄山': '安徽省',
  '阜阳': '安徽省',
  '福州': '福建省',
  '厦门': '福建省',
  '泉州': '福建省',
  '漳州': '福建省',
  '南平': '福建省',
  '南昌': '江西省',
  '九江': '江西省',
  '赣州': '江西省',
  '上饶': '江西省',
  '吉安': '江西省',
  '济南': '山东省',
  '青岛': '山东省',
  '淄博': '山东省',
  '枣庄': '山东省',
  '烟台': '山东省',
  '潍坊': '山东省',
  '济宁': '山东省',
  '泰安': '山东省',
  '威海': '山东省',
  '日照': '山东省',
  '临沂': '山东省',
  
  // 华中地区
  '郑州': '河南省',
  '开封': '河南省',
  '洛阳': '河南省',
  '安阳': '河南省',
  '新乡': '河南省',
  '许昌': '河南省',
  '南阳': '河南省',
  '商丘': '河南省',
  '信阳': '河南省',
  '武汉': '湖北省',
  '黄石': '湖北省',
  '十堰': '湖北省',
  '宜昌': '湖北省',
  '襄阳': '湖北省',
  '荆门': '湖北省',
  '孝感': '湖北省',
  '荆州': '湖北省',
  '黄冈': '湖北省',
  '咸宁': '湖北省',
  '长沙': '湖南省',
  '株洲': '湖南省',
  '湘潭': '湖南省',
  '衡阳': '湖南省',
  '邵阳': '湖南省',
  '岳阳': '湖南省',
  '常德': '湖南省',
  '益阳': '湖南省',
  '郴州': '湖南省',
  
  // 华南地区
  '广州': '广东省',
  '深圳': '广东省',
  '珠海': '广东省',
  '汕头': '广东省',
  '佛山': '广东省',
  '韶关': '广东省',
  '湛江': '广东省',
  '肇庆': '广东省',
  '江门': '广东省',
  '茂名': '广东省',
  '惠州': '广东省',
  '梅州': '广东省',
  '东莞': '广东省',
  '中山': '广东省',
  '揭阳': '广东省',
  '清远': '广东省',
  '南宁': '广西壮族自治区',
  '柳州': '广西壮族自治区',
  '桂林': '广西壮族自治区',
  '北海': '广西壮族自治区',
  '海口': '海南省',
  '三亚': '海南省',
  
  // 西南地区
  '重庆': '重庆市',
  '成都': '四川省',
  '绵阳': '四川省',
  '乐山': '四川省',
  '南充': '四川省',
  '宜宾': '四川省',
  '达州': '四川省',
  '贵阳': '贵州省',
  '遵义': '贵州省',
  '安顺': '贵州省',
  '昆明': '云南省',
  '大理': '云南省',
  '丽江': '云南省',
  '拉萨': '西藏自治区',
  
  // 西北地区
  '西安': '陕西省',
  '宝鸡': '陕西省',
  '延安': '陕西省',
  '汉中': '陕西省',
  '榆林': '陕西省',
  '兰州': '甘肃省',
  '天水': '甘肃省',
  '酒泉': '甘肃省',
  '西宁': '青海省',
  '银川': '宁夏回族自治区',
  '石嘴山': '宁夏回族自治区',
  '乌鲁木齐': '新疆维吾尔自治区',
  '喀什': '新疆维吾尔自治区',
  '伊犁': '新疆维吾尔自治区',
  
  // 港澳台地区
  '香港': '香港特别行政区',
  '澳门': '澳门特别行政区',
  '台北': '台湾省',
  '高雄': '台湾省',
  '台中': '台湾省',
  '台南': '台湾省',
  
  // 海外地区
  '新加坡': '新加坡',
  '曼谷': '泰国',
  '东京': '日本',
  '大阪': '日本',
  '首尔': '韩国',
  '伦敦': '英国',
  '纽约': '美国',
  '洛杉矶': '美国',
  '悉尼': '澳大利亚',
  '多伦多': '加拿大',
  '温哥华': '加拿大',
  '巴黎': '法国',
  '柏林': '德国',
  '马德里': '西班牙',
  '吉隆坡': '马来西亚',
  '雅加达': '印度尼西亚'
};

// 组件内变量
const chartDom = ref(null);
let chartInstance = null;
const selectedProvince = ref(null);
const localConcerts = ref([]);
const isLoading = ref(false); // 添加加载状态变量

// 保存全局数据，避免重复请求
let chinaGeoJson = null; // 中国地图数据
let mapData = []; // 省份原始数据
let validMapData = []; // 有效的地图数据（已过滤）
let domesticProvinces = []; // 国内省份列表
let totalCities = 0; // 总城市数
let domesticShows = 0; // 总演出场次
let maxValue = 0; // 最大演出数量

// 初始化所有省份数据，确保所有省份都有数据条目
const allProvinces = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', 
  '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省', 
  '浙江省', '安徽省', '福建省', '江西省', '山东省', 
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', 
  '海南省', '重庆市', '四川省', '贵州省', '云南省', 
  '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', 
  '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区', '台湾省'
];

// 从后端获取演唱会数据
const fetchConcertData = async () => {
  try {
    isLoading.value = true;
    
    if (props.concerts && props.concerts.length > 0) {
      // 如果已经传入了concerts数据，则直接使用
      localConcerts.value = props.concerts;
      console.log('使用传入的演唱会数据:', localConcerts.value.length, '条记录');
      isLoading.value = false;
      return;
    }
    
    // 否则从API获取
    const response = await apiClient.get('/concert/list');
    if (response.data.code === 200) {
      localConcerts.value = response.data.data || [];
      console.log('成功获取演唱会数据:', localConcerts.value.length, '条记录');
    } else {
      console.error('获取演唱会数据失败:', response.data.message);
    }
  } catch (error) {
    console.error('请求演唱会数据出错:', error);
  } finally {
    isLoading.value = false;
  }
};

// 处理数据并转换为省份统计
const processProvinceData = () => {
  const provinceData = {};
  
  // 确保数据已加载
  if (!localConcerts.value || localConcerts.value.length === 0) {
    console.warn('没有演唱会数据可处理');
    return [];
  }
  
  // console.log('开始处理省份数据，总演唱会数量:', localConcerts.value.length);
  
  // 获取当前日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // console.log('当前日期:', today.toISOString().split('T')[0]);
  
  // 统计符合条件的演唱会数量
  let validConcertCount = 0;
  
  // 初始化所有省份数据，确保所有省份都有数据条目
  allProvinces.forEach(province => {
    provinceData[province] = { name: province, value: 0, cities: [] };
  });
  
  // 汇总到省份，只统计已经开过的演唱会
  localConcerts.value.forEach((concert, index) => {
    // 检查是否有省份字段 - 使用新数据结构中的字段
    if (!concert.country && !concert.province) {
      console.warn(`[${index}] 演唱会数据缺少国家/省份信息:`, concert);
      return;
    }
    
    // 调试输出演唱会信息
    // if (index < 5) {
      // console.log(`[${index}] 处理演唱会:`, {
      //   city: concert.city,
      //   date: concert.concert_date,
      //   country: concert.country,
      //   province: concert.province,
      //   sequence: concert.sequence_range
      // });
    // }
    
    // 检查是否已经开过的演唱会
    try {
      // 处理新的日期格式 - 可能是范围格式如"2023年12月7-9日"
      const dateStr = concert.concert_date;
      if (!dateStr) {
        console.warn(`[${index}] 演唱会缺少日期信息:`, concert);
        return;
      }
      
      // 提取第一个日期，例如从"2023年12月7-9日"提取"2023-12-07"
      let concertDate = null;
      
      if (dateStr.includes('月') && !dateStr.includes('日')) {
        // 对于"2024-12月"这样的格式，表示还未确定具体日期，视为未来日期
        // console.log(`[${index}] 跳过未确定具体日期:`, dateStr);
        return;
      }
      
      if (dateStr.includes('-')) {
        // 处理日期范围，取第一个日期
        const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})/);
        if (match) {
          const year = match[1];
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          concertDate = new Date(`${year}-${month}-${day}`);
          // console.log(`[${index}] 解析范围日期:`, dateStr, '→', concertDate.toISOString().split('T')[0]);
        } else {
          console.warn(`[${index}] 无法解析日期范围:`, dateStr);
          return;
        }
      } else {
        // 处理单个日期
        const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (match) {
          const year = match[1];
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          concertDate = new Date(`${year}-${month}-${day}`);
          // console.log(`[${index}] 解析单个日期:`, dateStr, '→', concertDate.toISOString().split('T')[0]);
        } else {
          console.warn(`[${index}] 无法解析单个日期:`, dateStr);
          return;
        }
      }
      
      // 如果演唱会日期大于今天或无法解析日期，跳过不计入统计
      if (!concertDate || isNaN(concertDate.getTime())) {
        console.warn(`[${index}] 日期无效:`, dateStr);
        return;
      }
      
      if (concertDate >= today) {
        // console.log(`[${index}] 跳过未来演唱会:`, dateStr, '>', today.toISOString().split('T')[0]);
        return;
      }
      
      // console.log(`[${index}] 有效的过去演唱会:`, dateStr);
      validConcertCount++;
      
    } catch (e) {
      console.error(`[${index}] 日期处理错误:`, e);
      return;
    }
    
    // 根据城市确定省份
    let province = '';
    const city = concert.city || '未知';
    
    // 1. 检查concert是否直接有province字段
    if (concert.province) {
      province = concert.province;
      // console.log(`[${index}] 使用数据中的province:`, province);
    } 
    // 2. 特殊处理香港和澳门
    else if (city === '香港' || city === '澳门') {
      province = city === '香港' ? '香港特别行政区' : '澳门特别行政区';
      // console.log(`[${index}] 特殊处理香港/澳门:`, city, '→', province);
    }
    // 3. 如果是国外演出，则使用country
    else if (concert.country && concert.country !== '中国大陆') {
      province = concert.country;
      // console.log(`[${index}] 使用country作为province:`, province);
    } 
    // 4. 使用映射表查找省份
    else if (cityToProvinceMap[city]) {
      province = cityToProvinceMap[city];
      // console.log(`[${index}] 从映射表找到province:`, city, '→', province);
    } 
    // 5. 默认情况下，归类为"未知"
    else {
      province = '未知地区';
      console.warn(`[${index}] 未能确定城市所属省份:`, city);
    }
    
    // 获取规范化的省份名称，用于地图匹配
    const mapProvinceName = normalizeRegionName(province);
    
    if (!provinceData[mapProvinceName]) {
      provinceData[mapProvinceName] = { name: mapProvinceName, value: 0, cities: [] };
    }
    
    // 从sequence_range解析场次数量
    let concertCount = 1;
    if (concert.sequence_range && concert.sequence_range.includes('-')) {
      const [start, end] = concert.sequence_range.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        // 计算场次数量：较大值减去较小值再加1
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        concertCount = max - min + 1;
        // console.log(`[${index}] 计算场次范围:`, concert.sequence_range, `(${min}-${max})`, '→', concertCount, '场');
      } else {
        console.warn(`[${index}] 无效的场次范围:`, concert.sequence_range);
      }
    }
    
    // 增加该省份的场次数
    provinceData[mapProvinceName].value += concertCount;
    // console.log(`[${index}] 增加省份场次:`, mapProvinceName, '+', concertCount, '=', provinceData[mapProvinceName].value);
    
    // 检查这个城市是否已存在
    const existingCity = provinceData[mapProvinceName].cities.find(c => c.name === city);
    if (existingCity) {
      existingCity.value += concertCount;
      // console.log(`[${index}] 增加城市场次:`, city, '+', concertCount, '=', existingCity.value);
    } else {
      provinceData[mapProvinceName].cities.push({
        name: city,
        value: concertCount
      });
      // console.log(`[${index}] 添加城市:`, city, concertCount, '场');
    }
  });
  
  // console.log('符合条件的演唱会数量:', validConcertCount);
  
  // 将结果转为数组并检查
  const result = Object.values(provinceData);
  // console.log('省份数据处理完成，共', result.length, '个省份:');
  // result.forEach(province => {
  //   console.log(`- ${province.name}: ${province.value.toFixed(1)}场, ${province.cities.length}个城市`);
  // });
  
  return result;
};

// 获取中国地图JSON数据
const fetchChinaMap = async () => {
  try {
    // 使用本地地图数据而不是从阿里云API加载
    const response = await fetch('/data/china_map.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // console.log('地图数据加载成功，地图包含的地区:', data.features.map(f => f.properties.name));
    return data;
  } catch (error) {
    console.error('获取中国地图数据失败:', error);
    
    // 如果本地文件不存在，尝试使用备用数据
    try {
      console.log('尝试加载备用中国地图数据...');
      // 创建一个简化的中国地图数据，包含主要省份
      const backupData = {
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: { name: "北京市" }, geometry: {} },
          { type: "Feature", properties: { name: "上海市" }, geometry: {} },
          { type: "Feature", properties: { name: "广东省" }, geometry: {} },
          { type: "Feature", properties: { name: "浙江省" }, geometry: {} },
          { type: "Feature", properties: { name: "江苏省" }, geometry: {} },
          { type: "Feature", properties: { name: "四川省" }, geometry: {} },
          { type: "Feature", properties: { name: "湖北省" }, geometry: {} },
          { type: "Feature", properties: { name: "湖南省" }, geometry: {} },
          { type: "Feature", properties: { name: "河南省" }, geometry: {} },
          { type: "Feature", properties: { name: "河北省" }, geometry: {} },
          { type: "Feature", properties: { name: "山东省" }, geometry: {} },
          { type: "Feature", properties: { name: "山西省" }, geometry: {} },
          { type: "Feature", properties: { name: "陕西省" }, geometry: {} },
          { type: "Feature", properties: { name: "福建省" }, geometry: {} },
          { type: "Feature", properties: { name: "台湾省" }, geometry: {} },
          { type: "Feature", properties: { name: "云南省" }, geometry: {} },
          { type: "Feature", properties: { name: "贵州省" }, geometry: {} },
          { type: "Feature", properties: { name: "重庆市" }, geometry: {} },
          { type: "Feature", properties: { name: "天津市" }, geometry: {} },
          { type: "Feature", properties: { name: "江西省" }, geometry: {} },
          { type: "Feature", properties: { name: "安徽省" }, geometry: {} },
          { type: "Feature", properties: { name: "黑龙江省" }, geometry: {} },
          { type: "Feature", properties: { name: "吉林省" }, geometry: {} },
          { type: "Feature", properties: { name: "辽宁省" }, geometry: {} },
          { type: "Feature", properties: { name: "内蒙古自治区" }, geometry: {} },
          { type: "Feature", properties: { name: "宁夏回族自治区" }, geometry: {} },
          { type: "Feature", properties: { name: "新疆维吾尔自治区" }, geometry: {} },
          { type: "Feature", properties: { name: "西藏自治区" }, geometry: {} },
          { type: "Feature", properties: { name: "广西壮族自治区" }, geometry: {} },
          { type: "Feature", properties: { name: "海南省" }, geometry: {} },
          { type: "Feature", properties: { name: "青海省" }, geometry: {} },
          { type: "Feature", properties: { name: "甘肃省" }, geometry: {} },
          { type: "Feature", properties: { name: "香港特别行政区" }, geometry: {} },
          { type: "Feature", properties: { name: "澳门特别行政区" }, geometry: {} }
        ]
      };
      console.log('备用地图数据已加载，省份数量:', backupData.features.length);
      return backupData;
    } catch (backupError) {
      console.error('备用地图数据加载也失败:', backupError);
      return null;
    }
  }
};

// 特殊处理香港和澳门
// 重要：这个函数用于在不同的地图数据中处理香港和澳门的不同名称格式
const normalizeRegionName = (name) => {
  if (name === '香港' || name === '香港特别行政区') {
    return '香港特别行政区';
  } else if (name === '澳门' || name === '澳门特别行政区') {
    return '澳门特别行政区';
  }
  return name;
};

// 初始化地图
const initChart = async () => {
  if (!chartDom.value) return;
  
  try {
    // 创建ECharts实例
    chartInstance = echarts.init(chartDom.value);
    
    // 修复移动设备上的触摸问题
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // 在移动设备上，确保地图容器能够正确接收触摸事件
      const container = chartDom.value;
      
      // 防止默认行为干扰地图交互
      container.addEventListener('touchstart', (e) => {
        // 允许事件继续传播，但防止可能的默认行为
        e.stopPropagation();
      }, { passive: true });
      
      // 确保地图容器的z-index足够高
      container.style.zIndex = '10';
    }
    
    // 显示加载中状态
    chartInstance.showLoading({
      text: '地图数据加载中...',
      color: '#eb07ee',
      textColor: '#333',
      maskColor: 'rgba(255, 255, 255, 0.8)',
    });
    
    // 只有在第一次加载或数据不存在时才请求数据
    if (!chinaGeoJson) {
      // 加载中国地图数据
      chinaGeoJson = await fetchChinaMap();
      if (!chinaGeoJson) {
        console.error('无法加载中国地图数据');
        chartInstance.hideLoading();
        // 显示一条提示信息
        if (chartDom.value) {
          chartDom.value.innerHTML = '<div style="text-align:center; padding: 20px; color:#666;">无法加载地图数据，请确保地图数据文件存在</div>';
        }
        return;
      }
    }
    
    // 注册地图数据
    echarts.registerMap('china', chinaGeoJson);
    
    // 只有在第一次加载或数据不存在时才处理数据
    if (validMapData.length === 0) {
      // 如果没有传入concerts数据，则从API获取
      if (!props.concerts || props.concerts.length === 0) {
        await fetchConcertData();
      }
      
      // 获取处理后的省份数据
      mapData = processProvinceData();
      
      if (mapData.length === 0) {
        console.warn('省份数据为空，地图将显示空白');
        // 显示一个空白地图
        chartInstance.setOption({
          title: {
            text: 'G.E.M.邓紫棋 I AM GLORIA 巡演地区分布',
            subtext: '暂无演出数据',
            left: 'center',
            textStyle: {
              color: '#333'
            }
          },
          series: [{
            type: 'map',
            map: 'china',
            roam: true,
            itemStyle: {
              areaColor: '#f8f0ff',
              borderColor: '#999',
              borderWidth: 0.5
            }
          }]
        });
        chartInstance.hideLoading();
        return;
      }
      
      // 输出地图数据和地图区域名称进行比对
      const areaNames = chinaGeoJson.features.map(f => f.properties.name);
      
      // 检查数据是否与地图匹配
      const unmatchedProvinces = mapData.filter(item => !areaNames.includes(item.name));
      if (unmatchedProvinces.length > 0) {
        console.warn('以下省份无法在地图上找到匹配:', unmatchedProvinces.map(p => p.name));
        
        // 尝试修复香港和澳门的映射问题
        for (const item of unmatchedProvinces) {
          // 检查是否为香港或澳门
          if (item.name === '香港特别行政区' || item.name === '澳门特别行政区') {
            // 找到地图中的实际名称
            const mapName = areaNames.find(name => 
              (item.name === '香港特别行政区' && (name === '香港' || name === '香港特别行政区')) || 
              (item.name === '澳门特别行政区' && (name === '澳门' || name === '澳门特别行政区'))
            );
            
            if (mapName) {
              console.log(`修复映射: ${item.name} → ${mapName}`);
              // 更新该项的名称以匹配地图数据
              item.name = mapName;
            }
          }
        }
      }
      
      // 过滤掉不在地图上的地区（如国外地区）
      validMapData = mapData.filter(item => areaNames.includes(item.name));
      
      // 输出调试信息，检查香港和澳门的数据
      // console.log('地图区域名称:', areaNames);
      // console.log('处理后的原始数据:', mapData.map(item => `${item.name}: ${item.value}场, ${item.cities?.length || 0}个城市`));
      // console.log('有效的地图数据:', validMapData.map(item => `${item.name}: ${item.value}场, ${item.cities?.length || 0}个城市`));
      // console.log('香港澳门数据:', mapData.filter(item => item.name.includes('香港') || item.name.includes('澳门')));
      
      // 计算巡演统计信息
      totalCities = [...new Set(mapData.flatMap(p => (p.cities || []).map(c => c.name)))].length;
      
      // 只计算中国国内巡演的场次
      domesticProvinces = mapData.filter(p => 
        // 过滤出中国省份（包括直辖市、特别行政区和自治区）
        p.name.includes('省') || 
        p.name.includes('市') || 
        p.name.includes('自治区') || 
        p.name.includes('特别行政区')
      );
      domesticShows = domesticProvinces.reduce((sum, p) => sum + p.value, 0);
      
      // 找出最大值用于设置颜色范围
      maxValue = Math.max(...mapData.map(item => item.value), 1);
    }
    
    // 关闭加载中状态
    chartInstance.hideLoading();
    
    // 设置地图配置
    chartInstance.setOption({
      title: {
        text: 'G.E.M.邓紫棋 I AM GLORIA 巡演地区分布（中国）',
        subtext: `数据来源：官方演出信息（已覆盖${domesticProvinces.length}个省份/地区，${totalCities}个城市，共计${domesticShows.toFixed(0)}场国内演出）`,
        left: 'center',
        textStyle: {
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const data = params.data || {};
          if (!data.cities) return `${params.name}: ${params.value || 0}场演出`;
          
          let html = `<div style="font-weight:bold;margin-bottom:5px;">${params.name}: ${params.value ? params.value.toFixed(1) : 0}场演出</div>`;
          html += '<div style="font-size:12px;">';
          if (data.cities && data.cities.length > 0) {
            data.cities.forEach(city => {
              html += `${city.name}: ${city.value.toFixed(1)}场<br>`;
            });
          } else {
            html += '暂无详细城市数据';
          }
          html += '</div>';
          return html;
        }
      },
      visualMap: {
        min: 0,
        max: maxValue > 0 ? maxValue : 10,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: ['#f8f0ff', '#f373f9', '#eb07ee', '#a505de']
        },
        outOfRange: {
          color: ['#f8f0ff']
        },
        formatter: (value) => value.toFixed(1)
      },
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
          restore: {
            show: true,
            title: '刷新'
          },
          saveAsImage: {
            show: true,
            title: '保存'
          }
        }
      },
      // 禁用动画，避免闪烁
      animation: false,
      dataZoom: [{
        type: 'inside',
        filterMode: 'none',
        disabled: false
      }],
      roam: true,
      series: [{
        name: '演唱会场次',
        type: 'map',
        map: 'china',
        emphasis: { label: { show: true } },
        data: validMapData,
        zoom: 1.0,
        center: [104, 36],
        scaleLimit: { min: 0.8, max: 10 },
        animationDurationUpdate: 0,
        itemStyle: {
          areaColor: '#f8f0ff',
          borderColor: '#999',
          borderWidth: 0.5
        },
        emphasis: {
          label: { show: true, color: '#fff', fontSize: 12 },
          itemStyle: { areaColor: '#a505de' }
        }
      }]
    });
    
    // 添加地图点击事件
    chartInstance.on('click', 'series', function(params) {
      if (params.name) {
        // 先检查是否已经在查看该省份
        if (selectedProvince.value === params.name) {
          console.log('已经在查看该省份地图，不需重复加载');
          return;
        }
        
        // 阻止事件冒泡，避免多次触发
        params.event.event.stopPropagation();
        
        // 加载省份地图
        loadProvinceMap(params.name);
      }
    });
    
    // 监听窗口大小变化，确保地图完全显示
    window.addEventListener('resize', handleResize);
    
    setTimeout(() => {
      if (chartInstance) {
        chartInstance.resize();
      }
    }, 300);
    
  } catch (error) {
    console.error('初始化地图失败:', error);
    if (chartDom.value) {
      chartDom.value.innerHTML = '<div style="text-align:center; padding: 20px; color:#666;">初始化地图失败，请刷新页面重试</div>';
    }
  }
};

// 返回全国地图
const backToChina = () => {
  // 只改变显示状态，不重新请求数据
  selectedProvince.value = null;
  
  // 如果chartInstance被处理过，需要重新创建
  if (!chartInstance) {
    // 重新创建ECharts实例
    chartInstance = echarts.init(chartDom.value);
  }
  
  // 确保地图已注册
  if (!echarts.getMap('china') && chinaGeoJson) {
    echarts.registerMap('china', chinaGeoJson);
  }
  
  // 使用已有数据恢复全国地图，不重新请求和处理数据
  chartInstance.setOption({
    title: {
      text: 'G.E.M.邓紫棋 I AM GLORIA 巡演地区分布（中国）',
      subtext: `数据来源：官方演出信息（已覆盖${domesticProvinces.length}个省份/地区，${totalCities}个城市，共计${domesticShows.toFixed(0)}场国内演出）`,
      left: 'center',
      textStyle: {
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const data = params.data || {};
        if (!data.cities) return `${params.name}: ${params.value || 0}场演出`;
        
        let html = `<div style="font-weight:bold;margin-bottom:5px;">${params.name}: ${params.value ? params.value.toFixed(1) : 0}场演出</div>`;
        html += '<div style="font-size:12px;">';
        if (data.cities && data.cities.length > 0) {
          data.cities.forEach(city => {
            html += `${city.name}: ${city.value.toFixed(1)}场<br>`;
          });
        } else {
          html += '暂无详细城市数据';
        }
        html += '</div>';
        return html;
      }
    },
    visualMap: {
      min: 0,
      max: maxValue > 0 ? maxValue : 10,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#f8f0ff', '#f373f9', '#eb07ee', '#a505de']
      },
      outOfRange: {
        color: ['#f8f0ff']
      },
      formatter: (value) => value.toFixed(1)
    },
    toolbox: {
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      feature: {
        restore: {
          show: true,
          title: '刷新'
        },
        saveAsImage: {
          show: true,
          title: '保存'
        },
        myBack: {
          show: true,
          title: '返回全国',
          icon: 'path://M44.1,6c-19.8,0-36,16.2-36,36c0,19.8,16.2,36,36,36c19.8,0,36-16.2,36-36C80.1,22.2,64,6,44.1,6z M44.1,71.1c-16.1,0-29.1-13-29.1-29.1c0-16.1,13-29.1,29.1-29.1c16.1,0,29.1,13,29.1,29.1C73.2,58.1,60.2,71.1,44.1,71.1z M59.5,47.8c0,0.9-0.9,1.7-2,1.7H30.7c-1.1,0-2-0.8-2-1.7v-9.6c0-0.9,0.9-1.7,2-1.7h26.8c1.1,0,2,0.8,2,1.7V47.8z',
          onclick: function() {
            backToChina();
          }
        }
      }
    },
    // 添加禁用动画设置
    animation: false,
    dataZoom: [{
      type: 'inside',
      filterMode: 'none',
      disabled: false
    }],
    roam: true,
    series: [
      {
        name: '演唱会场次',
        type: 'map',
        map: 'china',
        data: validMapData,
        zoom: 1.0,
        center: [104, 36],
        // 禁用动画效果
        animationDurationUpdate: 0,
        // 设置边界和样式
        roam: true,
        scaleLimit: {
          min: 0.8,
          max: 5
        },
        itemStyle: {
          areaColor: '#f8f0ff',
          borderColor: '#999',
          borderWidth: 0.5
        },
        emphasis: {
          label: {
            show: true,
            color: '#fff'
          },
          itemStyle: {
            areaColor: '#a505de'
          }
        }
      }
    ]
  }, true); // 使用true参数表示完全替换配置，而不是合并
  
  // 重新添加点击事件监听
  chartInstance.on('click', 'series', function(params) {
    if (params.name) {
      // 先检查是否已经在查看该省份
      if (selectedProvince.value === params.name) {
        console.log('已经在查看该省份地图，不需重复加载');
        return;
      }
      
      // 阻止事件冒泡，避免多次触发
      params.event.event.stopPropagation();
      
      // 加载省份地图
      loadProvinceMap(params.name);
    }
  });
  
  // 监听窗口大小变化，确保地图完全显示
  window.addEventListener('resize', handleResize);
  
  // 确保地图视图稳定
  setTimeout(() => {
    if (chartInstance) {
      chartInstance.resize();
    }
  }, 300);
};

// 创建公共的城市表格显示函数
const showCityTableFallback = (provinceName, currentProvince) => {
  if (!chartDom.value) return;
  
  if (currentProvince && currentProvince.cities && currentProvince.cities.length > 0) {
    // 使用表格显示城市数据作为备用方案
    let cityList = '<div style="max-height: 500px; overflow-y: auto; padding: 20px;">';
    cityList += `<h3 style="text-align:center;">${provinceName}巡演城市列表</h3>`;
    cityList += `<p style="text-align:center;">共计${currentProvince.value.toFixed(0)}场演出，覆盖${currentProvince.cities.length}个城市</p>`;
    cityList += '<table style="width:100%; border-collapse: collapse; margin-top: 15px;">';
    cityList += '<tr style="background-color: #f8f0ff;"><th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">城市</th><th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">演出场次</th></tr>';
    
    // 按场次数量排序
    const sortedCities = [...currentProvince.cities].sort((a, b) => b.value - a.value);
    
    sortedCities.forEach((city, index) => {
      const bgColor = index % 2 === 0 ? '#fff' : '#f8f0ff';
      cityList += `<tr style="background-color: ${bgColor};"><td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${city.name}</td><td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${city.value.toFixed(0)}场</td></tr>`;
    });
    
    cityList += '</table>';
    cityList += '<div style="text-align: center; margin-top: 20px;"><button id="back-to-china-btn" style="padding: 8px 15px; background-color: #eb07ee; color: white; border: none; border-radius: 4px; cursor: pointer;">返回全国地图</button></div>';
    cityList += '</div>';
    
    // 显示城市列表
    if (chartDom.value) {
      chartInstance.dispose();
      chartInstance = null;
      chartDom.value.innerHTML = cityList;
      
      // 添加返回全国地图的事件监听
      setTimeout(() => {
        const backBtn = document.getElementById('back-to-china-btn');
        if (backBtn) {
          backBtn.addEventListener('click', () => {
            // 清空内容
            chartDom.value.innerHTML = '';
            // 重新初始化地图，但不重新加载数据
            chartInstance = echarts.init(chartDom.value);
            selectedProvince.value = null;
            
            // 直接调用backToChina函数，不重新请求数据
            backToChina();
          });
        }
      }, 100);
    }
  } else {
    // 显示错误消息
    if (chartDom.value) {
      chartInstance.dispose();
      chartInstance = null;
      chartDom.value.innerHTML = `<div style="text-align:center; padding: 20px; color:#666;">
        <p>无法加载${provinceName}的地图数据</p>
        <button id="back-to-china-btn" style="padding: 8px 15px; background-color: #eb07ee; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px;">返回全国地图</button>
      </div>`;
      
      // 添加返回全国地图的事件监听
      setTimeout(() => {
        const backBtn = document.getElementById('back-to-china-btn');
        if (backBtn) {
          backBtn.addEventListener('click', () => {
            // 清空内容
            chartDom.value.innerHTML = '';
            // 重新初始化地图，但不重新请求数据
            chartInstance = echarts.init(chartDom.value);
            selectedProvince.value = null;
            
            // 直接调用backToChina函数，不重新请求数据
            backToChina();
          });
        }
      }, 100);
    }
  }
};

// 加载省份地图
const loadProvinceMap = async (provinceName) => {
  if (!chartInstance) return;
  
  // 规范化省份名称
  const normalizedProvinceName = normalizeRegionName(provinceName);
  
  // 设置当前选中的省份
  selectedProvince.value = normalizedProvinceName;
  
  // 显示加载状态
  chartInstance.showLoading({
    text: `${normalizedProvinceName}地图数据加载中...`,
    color: '#eb07ee',
    textColor: '#333',
    maskColor: 'rgba(255, 255, 255, 0.8)',
  });
  
  // 从mapData中找到当前省份的数据，考虑不同的名称形式
  let currentProvince = validMapData.find(item => normalizeRegionName(item.name) === normalizedProvinceName);

  // 如果没找到，尝试使用原始名称查找
  if (!currentProvince) {
    currentProvince = validMapData.find(item => item.name === provinceName);
  }

  // 若仍然找不到，则查找替代名称
  if (!currentProvince && (normalizedProvinceName === '香港特别行政区' || normalizedProvinceName === '澳门特别行政区')) {
    const simpleName = normalizedProvinceName === '香港特别行政区' ? '香港' : '澳门';
    currentProvince = validMapData.find(item => item.name === simpleName);
  }
  
  if (currentProvince) {
    // 检查地图是否已经被注册过
    const mapExists = echarts.getMap(normalizedProvinceName);
    if (!mapExists) {
      // 加载省份地图数据
      try {
        const response = await fetch(`/data/province/${normalizedProvinceName}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const provinceMapData = await response.json();
        
        // 注册省份地图
        echarts.registerMap(normalizedProvinceName, provinceMapData);
        console.log(`成功注册${normalizedProvinceName}地图`);
      } catch (error) {
        console.error(`加载${normalizedProvinceName}地图数据失败:`, error);
        chartInstance.hideLoading();
        
        // 获取当前省份数据以显示城市列表
        showCityTableFallback(normalizedProvinceName, currentProvince);
        return;
      }
    } else {
      console.log(`使用已注册的${normalizedProvinceName}地图`);
    }
    
    // 配置省份地图
    chartInstance.hideLoading();

    // 计算合适的初始缩放级别 - 复杂的省份地图需要较小的缩放值
    let initialZoom = 1.0;
    if (['新疆维吾尔自治区', '内蒙古自治区', '西藏自治区'].includes(normalizedProvinceName)) {
      initialZoom = 0.8; // 大省份用较小的缩放值
    } else if (['四川省', '云南省', '黑龙江省', '广东省'].includes(normalizedProvinceName)) {
      initialZoom = 0.9; // 中等大小省份
    } else {
      initialZoom = 1.0; // 其他省份
    }

    // 从城市数据中创建地图数据数组，并处理城市名称为地图所需格式
    const cityMapData = [];
    if (currentProvince.cities && currentProvince.cities.length > 0) {
      for (const city of currentProvince.cities) {
        // 获取城市名称并确保格式正确
        let cityName = city.name;
        
        // 如果城市名不包含"市"、"区"、"县"，并且不是特殊地名，则添加"市"后缀
        if (!cityName.endsWith('市') && !cityName.endsWith('区') && !cityName.endsWith('县') &&
            !cityName.includes('自治') && !cityName.includes('盟') && !cityName.includes('旗')) {
          cityName = `${cityName}市`;
        }
        
        cityMapData.push({
          name: cityName,
          value: city.value,
          // 保留原始城市数据以便在tooltip中显示
          originalName: city.name
        });
      }
    }
    
    // 找出省内城市最大演出场次，用于设置颜色范围
    const maxCityValue = cityMapData.length > 0 ? 
      Math.max(...cityMapData.map(city => city.value), 1) : 1;

    chartInstance.setOption({
      title: {
        text: `${normalizedProvinceName}巡演分布`,
        subtext: `${currentProvince.name}共计${currentProvince.value.toFixed(0)}场演出，覆盖${currentProvince.cities.length}个城市`,
        left: 'center',
        textStyle: {
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (!params.data || !params.data.value) return `${params.name}: 0场演出`;
          
          // 使用原始城市名称（不带"市"）来显示
          const displayName = params.data.originalName || params.name;
          
          // 构建与中国地图相同风格的提示框
          let html = `<div style="font-weight:bold;margin-bottom:5px;">${displayName}: ${params.data.value.toFixed(1)}场演出</div>`;
          
          return html;
        }
      },
      visualMap: {
        min: 0,
        max: maxCityValue,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: ['#f8f0ff', '#f373f9', '#eb07ee', '#a505de']
        },
        outOfRange: {
          color: ['#f8f0ff']
        },
        formatter: (value) => value.toFixed(1)
      },
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
          restore: {
            show: true,
            title: '刷新'
          },
          saveAsImage: {
            show: true,
            title: '保存'
          },
          myBack: {
            show: true,
            title: '返回全国',
            icon: 'path://M44.1,6c-19.8,0-36,16.2-36,36c0,19.8,16.2,36,36,36c19.8,0,36-16.2,36-36C80.1,22.2,64,6,44.1,6z M44.1,71.1c-16.1,0-29.1-13-29.1-29.1c0-16.1,13-29.1,29.1-29.1c16.1,0,29.1,13,29.1,29.1C73.2,58.1,60.2,71.1,44.1,71.1z M59.5,47.8c0,0.9-0.9,1.7-2,1.7H30.7c-1.1,0-2-0.8-2-1.7v-9.6c0-0.9,0.9-1.7,2-1.7h26.8c1.1,0,2,0.8,2,1.7V47.8z',
            onclick: function() {
              backToChina();
            }
          }
        }
      },
      // 禁用默认动画以避免视图偏移
      animation: false,
      series: [
        {
          name: '演唱会场次',
          type: 'map',
          map: normalizedProvinceName,
          roam: true,
          data: cityMapData,
          zoom: initialZoom,
          itemStyle: {
            areaColor: '#f8f0ff',
            borderColor: '#999',
            borderWidth: 0.5
          },
          emphasis: {
            label: {
              show: true,
              color: '#fff',
              fontSize: 12
            },
            itemStyle: {
              areaColor: '#a505de'
            }
          },
          // 添加标签显示
          label: {
            show: false
          }
        }
      ]
    }, true); // 使用第二个参数true，表示不合并，完全替换配置

    // 在短时间后确保视图已经稳定并且地图完全可见
    setTimeout(() => {
      try {
        if (chartInstance) {
          // 获取地图实例并调整视图
          const mapInstance = chartInstance.getModel().getComponent('series', 0);
          if (mapInstance) {
            // 重置视图，确保地图完全在视图内
            chartInstance.dispatchAction({
              type: 'restore'
            });
            // 再次调整大小
            chartInstance.resize();
          }
        }
      } catch (e) {
        console.error('调整地图视图失败:', e);
      }
    }, 200);

    // 移除原有的点击事件（如果有）
    chartInstance.off('click');
    
    // 只添加返回全国地图的工具栏点击事件
    chartInstance.on('click', 'toolbox', function(params) {
      if (params.name === 'myBack') {
        backToChina();
      }
    });
  } else {
    console.error(`无法找到${normalizedProvinceName}的数据`);
    chartInstance.hideLoading();
  }
};

// 处理窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
    // console.log('地图尺寸已调整');
  }
};

// 组件挂载后初始化
onMounted(() => {
  initChart();
});

// 组件卸载前清理
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  
  // 移除所有添加的事件监听器
  window.removeEventListener('resize', handleResize);
  
  // 清理可能存在的DOM节点事件监听
  const backBtn = document.getElementById('back-to-china-btn');
  if (backBtn) {
    backBtn.removeEventListener('click', () => {});
  }
  
  console.log('地图组件已卸载，资源已释放');
});

// 监听concerts属性变化
watch(
  () => props.concerts,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      localConcerts.value = newValue;
      // console.log('监听到concerts变化，更新数据:', localConcerts.value.length, '条记录');
      
      // 如果地图已经初始化，则更新数据
      if (chartInstance) {
        updateMapData();
      }
    }
  },
  { deep: true }
);

// 更新地图数据
const updateMapData = () => {
  if (!chartInstance) return;
  
  try {
    // 获取处理后的省份数据
    const provinceData = processProvinceData();
    
    // 使用provinceDada作为地图数据，不需要额外的格式化
    const mapData = provinceData;
    
    // 获取地图区域名称
    const option = chartInstance.getOption();
    const areaNames = option.series[0].map.features?.map(f => f.properties.name) || [];
    
    // 检查数据是否与地图匹配
    const unmatchedProvinces = mapData.filter(item => !areaNames.includes(item.name));
    if (unmatchedProvinces.length > 0) {
      console.warn('以下省份无法在地图上找到匹配:', unmatchedProvinces.map(p => p.name));
      
      // 尝试修复香港和澳门的映射问题
      for (const item of unmatchedProvinces) {
        // 检查是否为香港或澳门
        if (item.name === '香港特别行政区' || item.name === '澳门特别行政区') {
          // 找到地图中的实际名称
          const mapName = areaNames.find(name => 
            (item.name === '香港特别行政区' && (name === '香港' || name === '香港特别行政区')) || 
            (item.name === '澳门特别行政区' && (name === '澳门' || name === '澳门特别行政区'))
          );
          
          if (mapName) {
            console.log(`修复映射: ${item.name} → ${mapName}`);
            // 更新该项的名称以匹配地图数据
            item.name = mapName;
          }
        }
      }
    }
    
    // 过滤掉不在地图上的地区（如国外地区）
    validMapData = mapData.filter(item => areaNames.includes(item.name));
    
    // 输出调试信息，检查香港和澳门的数据
    console.log('地图区域名称:', areaNames);
    console.log('处理后的原始数据:', mapData.map(item => `${item.name}: ${item.value}场, ${item.cities?.length || 0}个城市`));
    console.log('有效的地图数据:', validMapData.map(item => `${item.name}: ${item.value}场, ${item.cities?.length || 0}个城市`));
    console.log('香港澳门数据:', mapData.filter(item => item.name.includes('香港') || item.name.includes('澳门')));
    
    // 计算巡演统计信息
    totalCities = [...new Set(mapData.flatMap(p => (p.cities || []).map(c => c.name)))].length;
    const totalProvinces = mapData.length;
    const totalShows = mapData.reduce((sum, p) => sum + p.value, 0);

    // 只计算中国国内巡演的场次
    const domesticProvinces = mapData.filter(p => 
      // 过滤出中国省份（包括直辖市、特别行政区和自治区）
      p.name.includes('省') || 
      p.name.includes('市') || 
      p.name.includes('自治区') || 
      p.name.includes('特别行政区')
    );
    const domesticShows = domesticProvinces.reduce((sum, p) => sum + p.value, 0);

    // 找出最大值用于设置颜色范围
    const maxValue = Math.max(...mapData.map(item => item.value), 1);
    
    // 更新配置项
    chartInstance.setOption({
      title: {
        subtext: `数据来源：官方演出信息（已覆盖${domesticProvinces.length}个省份/地区，${totalCities}个城市，共计${domesticShows.toFixed(0)}场国内演出）`,
      },
      visualMap: {
        max: maxValue || 10,
      },
      series: [
        {
          data: validMapData,
          // 确保地图缩放级别和中心点保持一致
          zoom: 1.0,
          center: [104, 36]
        }
      ]
    });
    
    console.log('地图数据已更新');
    
    // 确保数据更新后调整地图大小
    setTimeout(() => {
      handleResize();
    }, 100);
  } catch (error) {
    // console.error('更新地图数据失败:', error);
  }
};
</script>

<style scoped>
.map-container {
  margin-bottom: 3rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(235, 7, 238, 0.15);
  overflow: hidden;
  backdrop-filter: blur(10px);
  position: relative;
}

/* 修改伪元素，确保不会阻碍触摸事件 */
.map-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 0% 100%, rgba(235,7,238,0.05) 0%, transparent 50%);
  pointer-events: none !important; /* 强制不拦截任何事件 */
  z-index: 0; /* 确保在最底层 */
}

.section-title {
  padding: 1.5rem;
  margin: 0;
  border-bottom: 1px solid rgba(240, 240, 240, 0.5);
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  color: #333;
  background: linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.8));
  position: relative;
  z-index: 1;
}

.icon {
  margin-right: 0.5rem;
  font-size: 1.4rem;
}

.map-content {
  padding: 1rem;
  position: relative; /* 确保内容区域有正确的定位上下文 */
  z-index: 1; /* 确保内容在伪元素之上 */
}

.map-instructions {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  color: #555;
  font-size: 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.map-instructions p {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.instruction-icon {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.instruction-text {
  font-weight: 500;
}

.echarts-container {
  width: 100%;
  height: 600px;
  margin: 0 auto;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background-color: white;
  padding: 0;
  position: relative;
  z-index: 2; /* 确保地图有最高的层级，能够接收所有交互 */
}

.map-footer {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.data-note {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
}

@media (max-width: 768px) {
  .map-instructions {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .instruction-icon {
    font-size: 1rem;
  }
  
  .echarts-container {
    height: 400px;
    padding: 0;
    /* 移动设备触摸优化 */
    touch-action: manipulation; /* 更好的触摸事件处理 */
    isolation: isolate; /* 创建新的堆叠上下文，避免其他元素干扰 */
  }
  
  /* 确保移动设备上所有装饰元素不会干扰交互 */
  .map-container::before,
  .map-container::after,
  .map-content::before,
  .map-content::after {
    pointer-events: none !important;
  }
  
  /* 提高移动设备上地图容器的z-index，确保在所有背景元素之上 */
  .map-container {
    z-index: 1;
  }
  
  .map-content {
    z-index: 2;
  }
  
  .echarts-container {
    z-index: 3;
  }
}

.selected-province {
  font-size: 1.2rem;
  margin-left: 0.5rem;
  color: #eb07ee;
  font-weight: normal;
}
</style>
