<template>
  <div class="map-container">
    <h2 class="section-title">
      <span class="icon">🗺️</span>
      演唱会巡演地图
    </h2>
    <div class="map-content">
      <div class="map-instructions">
        <p>
          <span class="instruction-icon">🔍</span> 
          <span class="instruction-text">提示：鼠标滚轮可以缩放地图，按住左键可以拖动地图</span>
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

const chartDom = ref(null);
let chartInstance = null;
const concertData = ref([]);
const isLoading = ref(true);

// 从后端获取演唱会数据
const fetchConcertData = async () => {
  try {
    isLoading.value = true;
    
    if (props.concerts && props.concerts.length > 0) {
      // 如果已经传入了concerts数据，则直接使用
      concertData.value = props.concerts;
      console.log('使用传入的演唱会数据:', concertData.value.length, '条记录');
      isLoading.value = false;
      return;
    }
    
    // 否则从API获取
    const response = await apiClient.get('/concert/list');
    if (response.data.code === 200) {
      concertData.value = response.data.data || [];
      console.log('成功获取演唱会数据:', concertData.value.length, '条记录');
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
  if (!concertData.value || concertData.value.length === 0) {
    console.warn('没有演唱会数据可处理');
    return [];
  }
  
  console.log('开始处理省份数据，总演唱会数量:', concertData.value.length);
  
  // 获取当前日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('当前日期:', today.toISOString().split('T')[0]);
  
  // 统计符合条件的演唱会数量
  let validConcertCount = 0;
  
  // 汇总到省份，只统计已经开过的演唱会
  concertData.value.forEach((concert, index) => {
    // 检查是否有省份字段 - 使用新数据结构中的字段
    if (!concert.country && !concert.province) {
      console.warn(`[${index}] 演唱会数据缺少国家/省份信息:`, concert);
      return;
    }
    
    // 调试输出演唱会信息
    if (index < 5) {
      console.log(`[${index}] 处理演唱会:`, {
        city: concert.city,
        date: concert.concert_date,
        country: concert.country,
        province: concert.province,
        sequence: concert.sequence_range
      });
    }
    
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
        console.log(`[${index}] 跳过未确定具体日期:`, dateStr);
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
          console.log(`[${index}] 解析范围日期:`, dateStr, '→', concertDate.toISOString().split('T')[0]);
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
          console.log(`[${index}] 解析单个日期:`, dateStr, '→', concertDate.toISOString().split('T')[0]);
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
        console.log(`[${index}] 跳过未来演唱会:`, dateStr, '>', today.toISOString().split('T')[0]);
        return;
      }
      
      console.log(`[${index}] 有效的过去演唱会:`, dateStr);
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
      console.log(`[${index}] 使用数据中的province:`, province);
    } 
    // 2. 如果是国外演出，则使用country
    else if (concert.country && concert.country !== '中国大陆') {
      province = concert.country;
      console.log(`[${index}] 使用country作为province:`, province);
    } 
    // 3. 使用映射表查找省份
    else if (cityToProvinceMap[city]) {
      province = cityToProvinceMap[city];
      console.log(`[${index}] 从映射表找到province:`, city, '→', province);
    } 
    // 4. 默认情况下，归类为"未知"
    else {
      province = '未知地区';
      console.warn(`[${index}] 未能确定城市所属省份:`, city);
    }
    
    // 获取规范化的省份名称，用于地图匹配
    const mapProvinceName = province;
    
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
        console.log(`[${index}] 计算场次范围:`, concert.sequence_range, `(${min}-${max})`, '→', concertCount, '场');
      } else {
        console.warn(`[${index}] 无效的场次范围:`, concert.sequence_range);
      }
    }
    
    // 增加该省份的场次数
    provinceData[mapProvinceName].value += concertCount;
    console.log(`[${index}] 增加省份场次:`, mapProvinceName, '+', concertCount, '=', provinceData[mapProvinceName].value);
    
    // 检查这个城市是否已存在
    const existingCity = provinceData[mapProvinceName].cities.find(c => c.name === city);
    if (existingCity) {
      existingCity.value += concertCount;
      console.log(`[${index}] 增加城市场次:`, city, '+', concertCount, '=', existingCity.value);
    } else {
      provinceData[mapProvinceName].cities.push({
        name: city,
        value: concertCount
      });
      console.log(`[${index}] 添加城市:`, city, concertCount, '场');
    }
  });
  
  console.log('符合条件的演唱会数量:', validConcertCount);
  
  // 将结果转为数组并检查
  const result = Object.values(provinceData);
  console.log('省份数据处理完成，共', result.length, '个省份:');
  result.forEach(province => {
    console.log(`- ${province.name}: ${province.value.toFixed(1)}场, ${province.cities.length}个城市`);
  });
  
  return result;
};

// 获取中国地图JSON数据
const fetchChinaMap = async () => {
  try {
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
    const data = await response.json();
    console.log('地图数据加载成功，地图包含的地区:', data.features.map(f => f.properties.name));
    return data;
  } catch (error) {
    console.error('获取中国地图数据失败:', error);
    return null;
  }
};

// 初始化地图
const initChart = async () => {
  if (!chartDom.value) return;
  
  try {
    // 创建ECharts实例
    chartInstance = echarts.init(chartDom.value);
    
    // 显示加载中状态
    chartInstance.showLoading({
      text: '地图数据加载中...',
      color: '#eb07ee',
      textColor: '#333',
      maskColor: 'rgba(255, 255, 255, 0.8)',
    });
    
    // 加载中国地图数据
    const chinaGeoJson = await fetchChinaMap();
    if (chinaGeoJson) {
      echarts.registerMap('china', chinaGeoJson);
      console.log('注册地图成功');
    } else {
      console.error('无法加载中国地图数据');
      chartInstance.hideLoading();
      return;
    }
    
    // 如果没有传入concerts数据，则从API获取
    if (!props.concerts || props.concerts.length === 0) {
      await fetchConcertData();
    }
    
    // 获取处理后的省份数据
    const provinceData = processProvinceData();
    
    // 使用provinceDada作为地图数据，不需要额外的格式化
    const mapData = provinceData;
    
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
    console.log('地图数据:', mapData);
    const areaNames = chinaGeoJson.features.map(f => f.properties.name);
    console.log('地图包含的地区名称:', areaNames);
    
    // 检查数据是否与地图匹配
    const unmatchedProvinces = mapData.filter(item => !areaNames.includes(item.name));
    if (unmatchedProvinces.length > 0) {
      console.warn('以下省份无法在地图上找到匹配:', unmatchedProvinces.map(p => p.name));
    }
    
    // 过滤掉不在地图上的地区（如国外地区）
    const validMapData = mapData.filter(item => areaNames.includes(item.name));
    console.log('有效的地图数据:', validMapData.length, '个地区');
    
    // 计算巡演统计信息
    const totalCities = [...new Set(mapData.flatMap(p => (p.cities || []).map(c => c.name)))].length;
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
    console.log('最大值:', maxValue);
    
    // 关闭加载中状态
    chartInstance.hideLoading();
    
    // 配置项
    const option = {
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
      // 添加缩放组件
      dataZoom: [
        {
          type: 'inside',
          filterMode: 'none',
          disabled: false
        }
      ],
      // 添加缩放和平移组件
      roam: true,
      series: [
        {
          name: '演唱会场次',
          type: 'map',
          map: 'china',
          emphasis: {
            label: {
              show: true
            }
          },
          data: validMapData,
          // 修改缩放级别，确保地图完全显示
          zoom: 1.0,
          // 确保地图居中显示
          center: [104, 36],
          scaleLimit: {
            min: 1,
            max: 10
          },
          // 鼠标悬停效果
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
          }
        }
      ]
    };
    
    // 应用配置项
    chartInstance.setOption(option);
    console.log('地图配置已应用');
    
    // 添加窗口调整大小的监听
    window.addEventListener('resize', handleResize);
    
    // 确保地图初始化后立即调整大小以适应容器
    setTimeout(() => {
      handleResize();
    }, 200);
  } catch (error) {
    if (chartInstance) {
      chartInstance.hideLoading();
    }
    console.error('初始化地图失败:', error);
  }
};

// 处理窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
    console.log('地图尺寸已调整');
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
  }
  window.removeEventListener('resize', handleResize);
});

// 监听concerts属性变化
watch(
  () => props.concerts,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      concertData.value = newValue;
      console.log('监听到concerts变化，更新数据:', concertData.value.length, '条记录');
      
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
    }
    
    // 过滤掉不在地图上的地区（如国外地区）
    const validMapData = mapData.filter(item => areaNames.includes(item.name));
    
    // 计算巡演统计信息
    const totalCities = [...new Set(mapData.flatMap(p => (p.cities || []).map(c => c.name)))].length;
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
    console.error('更新地图数据失败:', error);
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

.map-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 0% 100%, rgba(235,7,238,0.05) 0%, transparent 50%);
  pointer-events: none;
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
  }
}
</style>
