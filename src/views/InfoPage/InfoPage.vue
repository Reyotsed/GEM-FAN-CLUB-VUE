<template>
    <div class="info-page">
      <div class="page-header">
        <div class="header-content">
          <h1>G.E.M. 邓紫棋资讯中心</h1>
          <p class="subtitle">了解姐姐的最新动态和精彩作品</p>
        </div>
      </div>
      
      <!-- 主要内容区域 -->
      <div class="info-content">
        <!-- 演出活动 -->
        <section class="info-section performances">
          <h2 class="section-title">
            <span class="icon">🎤</span>
            演出速递
          </h2>
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>加载中，请稍候...</p>
          </div>
          <div v-else class="section-content">
            <!-- 2025巡演标题 -->
            <div class="tour-title-box">
              <h3>邓紫棋I AM GLORIA 演唱会巡演城市</h3>
            </div>

            <!-- 已确定场次 -->
            <div class="performance-section">
              <h3 class="performance-subtitle">【演出时间地点】</h3>
              <div class="performance-list">
                <div 
                  v-for="(item, index) in mergeConcertDates" 
                  :key="index"
                  class="performance-item"
                >
                  <div class="performance-date">{{ item.formattedDates }}</div>
                  <div class="performance-info">
                    <span class="city">{{ item.city }}站</span>
                    <span class="venue">{{ item.venue }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 待定场次 -->
            <div class="performance-section pending-section">
              <h3 class="performance-subtitle">【待定场次】</h3>
              <div class="pending-cities">
                <div class="pending-row">
                  <span class="pending-city" v-for="city in pendingCities" :key="city">{{ city }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- 演唱会统计信息 -->
        <section class="info-section concert-statistics">
          <h2 class="section-title">
            <span class="icon">🏟️</span>
            I AM GLORIA 世界巡回演唱会
          </h2>
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>加载中，请稍候...</p>
          </div>
          <div v-else class="section-content">
            <div class="tour-title-box">
              <h3>G.E.M. 邓紫棋 I AM GLORIA 世界巡回演唱会</h3>
              <p class="tour-summary">自2023年12月开始，覆盖{{ groupedConcerts.length }}个轮次</p>
            </div>
            <div class="table-container">
              <table class="concerts-table">
                <thead>
                  <tr>
                    <th>轮次</th>
                    <th>场次编号</th>
                    <th>演出日期</th>
                    <th>演出地区</th>
                    <th>城市</th>
                    <th>场馆</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(group, index) in groupedConcerts" :key="index">
                    <tr v-for="(concert, concertIndex) in group.concerts" :key="concert.id" 
                        :class="{ 
                          'highlight-row': concert.notes && concert.notes.includes('个人售票'),
                          'round-divider': concertIndex === group.concerts.length - 1 && index < groupedConcerts.length - 1
                        }">
                      <td v-if="concertIndex === 0" :rowspan="group.concerts.length" class="station-cell">第{{ 
                        group.stationNumber === 1 ? '一' : 
                        group.stationNumber === 2 ? '二' : 
                        group.stationNumber === 3 ? '三' :
                        group.stationNumber === 4 ? '四' : ''
                      }}轮</td>
                      <td>{{ concert.sequenceRange }}</td>
                      <td>{{ concert.concertDate }}</td>
                      <td>{{ concert.country || '中国大陆' }}</td>
                      <td>{{ concert.city || '未知' }}</td>
                      <td>{{ concert.venue || '未知' }}</td>
                      <td class="notes-cell">{{ concert.notes || '-' }}</td>
                    </tr>
                  </template>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="6" class="summary-label">总计演出场次</td>
                    <td class="summary-value">{{ totalConcertCount }}场</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div class="table-explanation">
              <p>* 表格仅显示已举办的演唱会场次，按轮次和场次排序</p>
              <p>* 数据来源于维基百科，最后更新时间：{{ new Date().toLocaleDateString('zh-CN') }}</p>
            </div>
          </div>
        </section>

        <!-- 演唱会地图 -->
        <ChineseMapModal :concerts="concerts" />
      </div>
    </div>
</template>
  
<script setup>
import ChineseMapModal from '@/components/info/ChineseMapModal.vue';
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/utils/api';

// 数据定义
const concerts = ref([]);
const isLoading = ref(true);

// 获取演唱会数据
const fetchConcerts = async () => {
  try {
    isLoading.value = true;
    const response = await apiClient.get('/concert/list');
    if (response.data.code === 200) {
      concerts.value = response.data.data || [];
      console.log('成功获取演唱会数据:', concerts.value.length, '条记录');
    } else {
      console.error('获取演唱会数据失败:', response.data.message);
    }
  } catch (error) {
    console.error('请求演唱会数据出错:', error);
  } finally {
    isLoading.value = false;
  }
};

// 解析中文日期字符串为Date对象
const parseConcertDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // 处理待定日期格式（如"2024-12月"）
    if (dateStr.includes('月') && !dateStr.includes('日')) {
      return null;
    }
    
    // 处理日期范围，取第一个日期
    if (dateStr.includes('-')) {
      const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JS月份从0开始
        const day = parseInt(match[3]);
        return new Date(year, month, day);
      }
    }
    
    // 处理单个日期
    const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; // JS月份从0开始
      const day = parseInt(match[3]);
      return new Date(year, month, day);
    }
    
    return null;
  } catch (e) {
    console.error('日期解析错误:', e, dateStr);
    return null;
  }
};

// 从sequence_range提取整数序号
const extractSequenceNumber = (sequenceRange) => {
  if (!sequenceRange) return 0;
  
  try {
    // 如果包含'-'则取第一个数字
    if (sequenceRange.includes('-')) {
      return parseInt(sequenceRange.split('-')[0]);
    }
    // 否则直接解析
    return parseInt(sequenceRange);
  } catch (e) {
    console.error('序号解析错误:', e);
    return 0;
  }
};

// 从sequence_range计算演出场次
const calculateConcertCount = (sequenceRange) => {
  if (!sequenceRange) return 1;
  
  try {
    // 如果是"未官宣"或类似格式，返回0
    if (sequenceRange === '未官宣') return 0;
    
    // 如果包含'-'则计算范围
    if (sequenceRange.includes('-')) {
      const [start, end] = sequenceRange.split('-').map(Number);
      return end - start + 1;
    }
    
    // 否则为单场
    return 1;
  } catch (e) {
    console.error('演出场次计算错误:', e);
    return 1;
  }
};

// 从tour_phase提取站数
const extractStationNumber = (tourPhase) => {
  if (!tourPhase) return 0;
  
  try {
    // 例如"第一轮 Part 1"提取出1
    const match = tourPhase.match(/第([一二三四五六七八九十]+)轮/);
    if (match) {
      const chineseNum = match[1];
      const numMap = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
      };
      // 限制轮次最大值为4
      const roundNumber = numMap[chineseNum] || 0;
      return roundNumber > 4 ? 4 : roundNumber;
    }
    return 0;
  } catch (e) {
    console.error('站数解析错误:', e);
    return 0;
  }
};

// 获取未来的演唱会
const futureConcerts = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return concerts.value
    .filter(concert => {
      // 检查状态字段
      if (concert.status === '未官宣') return true;
      
      // 解析日期
      const concertDate = parseConcertDate(concert.concert_date);
      
      // 如果日期为null（可能是待定）或日期大于今天，则是未来演唱会
      return !concertDate || concertDate >= today;
    })
    .sort((a, b) => {
      // 首先处理未官宣的情况
      if (a.status === '未官宣' && b.status === '未官宣') {
        return extractSequenceNumber(a.sequence_range) - extractSequenceNumber(b.sequence_range);
      }
      if (a.status === '未官宣') return 1;
      if (b.status === '未官宣') return -1;
      
      // 然后处理有日期的情况
      const dateA = parseConcertDate(a.concert_date);
      const dateB = parseConcertDate(b.concert_date);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateA - dateB;
    });
});

// 获取已举办的演唱会
const pastConcerts = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return concerts.value
    .filter(concert => {
      // 未官宣的肯定不是过去的演唱会
      if (concert.status === '未官宣') return false;
      
      // 检查日期
      const concertDate = parseConcertDate(concert.concert_date);
      
      // 只有有效日期且小于今天的是过去的演唱会
      return concertDate && concertDate < today;
    })
    .sort((a, b) => {
      const dateA = parseConcertDate(a.concert_date);
      const dateB = parseConcertDate(b.concert_date);
      
      if (!dateA || !dateB) return 0;
      return dateA - dateB; // 升序排列，最早的在前面
    });
});

// 按站点分组数据 - 只显示已举办的演唱会
const groupedConcerts = computed(() => {
  const groups = {};
  
  pastConcerts.value.forEach(concert => {
    // 提取站数
    const stationNumber = extractStationNumber(concert.tour_phase);
    // 确保站数值在1-4之间，超过4的会被设为4
    const stationKey = stationNumber || 1;
    
    if (!groups[stationKey]) {
      groups[stationKey] = {
        stationNumber: stationKey,
        concerts: []
      };
    }
    
    // 创建简化的演唱会对象
    const simplifiedConcert = {
      id: concert.id,
      sequenceRange: concert.sequence_range,
      concertDate: concert.concert_date,
      country: concert.country,
      city: concert.city,
      venue: concert.venue,
      notes: concert.notes
    };
    
    groups[stationKey].concerts.push(simplifiedConcert);
  });
  
  // 对每个组内的演唱会按日期升序排序，如果日期相同则按场次编号
  Object.values(groups).forEach(group => {
    group.concerts.sort((a, b) => {
      const dateA = parseConcertDate(a.concertDate);
      const dateB = parseConcertDate(b.concertDate);
      
      if (!dateA || !dateB) return 0;
      
      // 如果日期相同，则按场次编号排序
      if (dateA.getTime() === dateB.getTime()) {
        const startNumA = extractSequenceNumber(a.sequenceRange);
        const startNumB = extractSequenceNumber(b.sequenceRange);
        return startNumA - startNumB;
      }
      
      return dateA - dateB; // 升序排列，最早的在前面
    });
  });
  
  // 转换为数组并按站点排序
  return Object.values(groups).sort((a, b) => a.stationNumber - b.stationNumber);
});

// 格式化完整日期 (YYYY年MM月DD日)
const formatFullDate = (dateString) => {
  // 如果已经是格式化好的日期，直接返回
  if (dateString && (dateString.includes('年') || dateString.includes('月'))) {
    return dateString;
  }
  
  try {
    if (!dateString) return '未知日期';
    
    const date = parseConcertDate(dateString);
    
    // 检查日期是否有效
    if (!date || isNaN(date.getTime())) {
      console.error('无效的日期字符串:', dateString);
      return dateString || '日期格式错误';
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString || '日期错误';
  }
};

// 格式化日期 (MM/DD)
const formatDate = (dateString) => {
  try {
    if (!dateString) return '未知';
    
    const date = parseConcertDate(dateString);
    
    // 检查日期是否有效
    if (!date || isNaN(date.getTime())) {
      console.error('无效的日期字符串:', dateString);
      return dateString || '日期错误';
    }
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString || '日期错误';
  }
};

// 获取指定月份的天数
function getDaysInMonth(month) {
  // 2024是闰年
  const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month];
}

// 从日期字符串提取月/日
const extractMonthDay = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // 处理月日格式（如"6月29日"）
    const matchMD = dateStr.match(/(\d{1,2})月(\d{1,2})日?/);
    if (matchMD) {
      return {
        month: parseInt(matchMD[1]),
        day: parseInt(matchMD[2])
      };
    }
    
    // 处理年月日格式（如"2024年6月29日"）
    const matchYMD = dateStr.match(/\d{4}年(\d{1,2})月(\d{1,2})日?/);
    if (matchYMD) {
      return {
        month: parseInt(matchYMD[1]),
        day: parseInt(matchYMD[2])
      };
    }
    
    return null;
  } catch (e) {
    console.error('月日提取错误:', e);
    return null;
  }
};

// 提取日期范围中的日期
const extractDatesFromRange = (dateRange) => {
  if (!dateRange) return [];
  
  try {
    const dates = [];
    
    // 处理日期范围格式：2023年12月7-9日
    if (dateRange.includes('-') && dateRange.includes('年') && dateRange.includes('月')) {
      const yearMatch = dateRange.match(/(\d{4})年/);
      const monthMatch = dateRange.match(/(\d{1,2})月/);
      
      if (yearMatch && monthMatch) {
        const year = parseInt(yearMatch[1]);
        const month = parseInt(monthMatch[1]);
        
        // 提取日期范围
        const dayRangeMatch = dateRange.match(/(\d{1,2})-(\d{1,2})日/);
        if (dayRangeMatch) {
          const startDay = parseInt(dayRangeMatch[1]);
          const endDay = parseInt(dayRangeMatch[2]);
          
          for (let day = startDay; day <= endDay; day++) {
            dates.push(`${month}/${day}`);
          }
          return dates;
        }
      }
    }
    
    // 处理跨月格式：2024年5月31、6月1日
    if (dateRange.includes('、') && dateRange.includes('月')) {
      const parts = dateRange.split('、');
      parts.forEach(part => {
        const mdInfo = extractMonthDay(part);
        if (mdInfo) {
          dates.push(`${mdInfo.month}/${mdInfo.day}`);
        }
      });
      return dates;
    }
    
    // 处理单日期
    const mdInfo = extractMonthDay(dateRange);
    if (mdInfo) {
      dates.push(`${mdInfo.month}/${mdInfo.day}`);
    }
    
    return dates;
  } catch (e) {
    console.error('日期范围解析错误:', e);
    return [];
  }
};

// 合并相同地址的演唱会时间
const mergeConcertDates = computed(() => {
  const merged = {};
  
  futureConcerts.value
    .filter(concert => concert.status !== '未官宣') // 排除未官宣场次
    .forEach(concert => {
      const key = `${concert.city}-${concert.venue}`;
      if (!merged[key]) {
        merged[key] = {
          city: concert.city,
          venue: concert.venue,
          dates: []
        };
      }
      
      // 提取所有日期并添加到数组中
      const extractedDates = extractDatesFromRange(concert.concert_date);
      if (extractedDates.length > 0) {
        merged[key].dates.push(...extractedDates);
      }
    });
  
  // 转为数组
  return Object.values(merged).map(item => {
    // 去重
    item.dates = [...new Set(item.dates)];
    
    // 排序日期
    item.dates.sort((a, b) => {
      const [aMonth, aDay] = a.split('/').map(Number);
      const [bMonth, bDay] = b.split('/').map(Number);
      
      if (aMonth === bMonth) {
        return aDay - bDay;
      }
      return aMonth - bMonth;
    });
    
    // 合并连续日期
    let formattedDates = '';
    
    if (item.dates.length <= 1) {
      formattedDates = item.dates[0] || '';
    } else {
      // 检查是否有连续日期可以合并
      const ranges = [];
      let currentRange = [item.dates[0]];
      
      for (let i = 1; i < item.dates.length; i++) {
        const prevDate = item.dates[i-1].split('/').map(Number);
        const currDate = item.dates[i].split('/').map(Number);
        
        // 简单检查是否连续（月份相同且日期相差1，或月份相差1但是月底和月初）
        const isConsecutive = (
          (prevDate[0] === currDate[0] && currDate[1] - prevDate[1] === 1) ||
          (currDate[0] - prevDate[0] === 1 && prevDate[1] === getDaysInMonth(prevDate[0]) && currDate[1] === 1)
        );
        
        if (isConsecutive) {
          currentRange.push(item.dates[i]);
        } else {
          ranges.push([...currentRange]);
          currentRange = [item.dates[i]];
        }
      }
      
      ranges.push(currentRange);
      
      // 格式化范围
      formattedDates = ranges.map(range => {
        if (range.length === 1) {
          return range[0];
        } else {
          return `${range[0]}-${range[range.length - 1]}`;
        }
      }).join('、');
    }
    
    return {
      ...item,
      formattedDates
    };
  }).slice(0, 10); // 只取前10个
});

// 提取待定城市
const pendingCities = computed(() => {
  // 从status为"未官宣"的concert中提取城市
  const cities = futureConcerts.value
    .filter(concert => concert.status === '未官宣' && concert.city)
    .map(concert => concert.city)
    .filter(city => city && city !== '未知');
  
  return [...new Set(cities)]; // 去重
});

// 计算总计演出场次
const totalConcertCount = computed(() => {
  let totalCount = 0;
  
  // 遍历所有演唱会
  pastConcerts.value.forEach(concert => {
    if (concert.sequence_range) {
      // 如果包含'-'，计算范围内的场次数
      if (concert.sequence_range.includes('-')) {
        const [start, end] = concert.sequence_range.split('-').map(Number);
        // 检查数字是否有效
        if (!isNaN(start) && !isNaN(end)) {
          // 计算场次数量：较大值减去较小值再加1
          const min = Math.min(start, end);
          const max = Math.max(start, end);
          totalCount += (max - min + 1);
        } else {
          totalCount += 1; // 默认加1
        }
      } else {
        // 单场演出
        totalCount += 1;
      }
    } else {
      // 如果没有场次信息，默认加1
      totalCount += 1;
    }
  });
  
  return totalCount;
});

onMounted(() => {
  fetchConcerts();
});
</script>
  
<style scoped>
.info-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #fff6fe 0%, #f8f0ff 100%);
  position: relative;
  overflow: hidden;
}

/* 添加装饰性背景元素 */
.info-page::before {
  content: '';
  position: fixed;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(235,7,238,0.05) 0%, rgba(165,5,222,0.02) 60%);
  transform: rotate(30deg);
  z-index: 0;
  animation: floatBg 15s ease-in-out infinite;
}

.info-page::after {
  content: '';
  position: fixed;
  bottom: -50%;
  left: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(235,7,238,0.03) 0%, rgba(165,5,222,0.05) 100%);
  transform: rotate(-30deg);
  z-index: 0;
  animation: floatBg 20s ease-in-out infinite reverse;
}

@keyframes floatBg {
  0% { transform: rotate(30deg) translate(0, 0); }
  50% { transform: rotate(30deg) translate(2%, 2%); }
  100% { transform: rotate(30deg) translate(0, 0); }
}

.page-header {
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
  padding: 3rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
  z-index: 1;
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-content h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.info-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.info-section {
  margin-bottom: 3rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(235, 7, 238, 0.15);
  overflow: hidden;
  backdrop-filter: blur(10px);
  position: relative;
}

.info-section::before {
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

.section-content {
  padding: 1.5rem;
}

/* 演出活动样式 */
.tour-title-box {
  text-align: center;
  margin-bottom: 2.5rem;
  position: relative;
}

.tour-title-box h3 {
  font-size: 1.8rem;
  color: #333;
  margin: 0;
  padding: 1rem 0;
  position: relative;
  display: inline-block;
}

.tour-title-box h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(to right, #eb07ee, #a505de);
  border-radius: 2px;
}

.performance-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.performance-subtitle {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 2rem;
  padding-left: 1rem;
  border-left: 4px solid #eb07ee;
}

.performance-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.performance-item {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  border-radius: 10px;
  background: rgba(248, 249, 250, 0.8);
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.performance-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(235, 7, 238, 0.15);
  background: linear-gradient(to right, rgba(255,241,253,0.9), rgba(249,240,255,0.9));
}

.performance-date {
  font-size: 1.1rem;
  font-weight: 600;
  color: #eb07ee;
  min-width: 90px;
  text-align: center;
  padding-right: 1rem;
  border-right: 1px solid #eee;
}

.performance-info {
  padding-left: 1rem;
  flex: 1;
}

.performance-info .city {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
}

.performance-info .venue {
  display: block;
  font-size: 0.9rem;
  color: #666;
}

/* 待定场次样式 */
.pending-section {
  background: linear-gradient(to right, #fff1fd, #f9f0ff);
}

.pending-cities {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pending-row {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.pending-city {
  font-size: 1.1rem;
  color: #333;
  padding: 0.8rem 1.5rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.pending-city:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(235, 7, 238, 0.15);
  color: #eb07ee;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .tour-title-box h3 {
    font-size: 1.5rem;
  }
  
  .performance-section {
    padding: 1.5rem;
  }
  
  .performance-list {
    grid-template-columns: 1fr;
  }
  
  .performance-item {
    padding: 1rem;
  }
  
  .pending-row {
    gap: 1rem;
  }
  
  .pending-city {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
  }
}

/* 演唱会统计信息样式 */
.statistics-intro {
  margin-bottom: 2rem;
  color: #555;
  line-height: 1.6;
}

.tour-summary {
  text-align: center;
  color: #666;
  margin-top: 10px;
  font-size: 0.95rem;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
  border-radius: 8px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
}

.concerts-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.concerts-table th {
  background: linear-gradient(135deg, #f373f9, #eb07ee);
  color: white;
  padding: 1rem 0.8rem;
  text-align: center;
  white-space: nowrap;
  font-weight: 600;
  border: 1px solid #f2b0f3;
}

.concerts-table td {
  padding: 0.8rem 0.6rem;
  text-align: center;
  border: 1px solid #eee;
  vertical-align: middle;
}

.concerts-table tbody tr:hover {
  background-color: #fff8fe;
}

.concerts-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.station-cell {
  background-color: #fef0ff;
  font-weight: 600;
  color: #eb07ee;
  border-right: 2px solid #f2b0f3 !important;
}

/* 添加轮次之间的分割线 */
.concerts-table tbody tr:first-child td.station-cell {
  border-top: 2px solid #f2b0f3 !important;
}

/* 在每个轮次的最后一行添加底部分割线 */
.concerts-table tbody tr:last-child td {
  border-bottom: 2px solid #f2b0f3;
}

/* 每个轮次组的最后一行添加明显的分割线 */
.round-divider td {
  border-bottom: 3px solid #eb07ee !important;
  position: relative;
}

.round-divider td::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -3px;
  height: 3px;
  background: linear-gradient(to right, #eb07ee, #a505de);
  z-index: 1;
}

.concerts-table tfoot td {
  background-color: #fef0ff;
  font-weight: 600;
  color: #333;
  border-top: 2px solid #f2b0f3;
}

.concerts-table .highlight-row {
  background-color: #fcf4ff;
}

.summary-label {
  text-align: right;
  padding-right: 1rem;
}

.summary-value {
  font-weight: 700;
  color: #eb07ee;
}

.notes-cell {
  max-width: 180px;
  white-space: normal;
  word-break: break-word;
  font-size: 0.85rem;
  color: #666;
}

.table-explanation {
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #777;
}

.table-explanation p {
  margin: 0.3rem 0;
}

@media (max-width: 768px) {
  .concerts-table {
    font-size: 0.8rem;
  }
  
  .concerts-table th,
  .concerts-table td {
    padding: 0.5rem 0.3rem;
  }
  
  .notes-cell {
    max-width: 80px;
  }
}

/* 演唱会里程碑样式 */
.concerts-highlights {
  margin-top: 2rem;
}

.highlights-title {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  position: relative;
  padding-left: 1rem;
  color: #333;
}

.highlights-title:before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.2rem;
  bottom: 0.2rem;
  width: 4px;
  background: linear-gradient(to bottom, #eb07ee, #a505de);
  border-radius: 2px;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.highlight-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.highlight-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

.highlight-icon {
  font-size: 2rem;
  color: #eb07ee;
  flex-shrink: 0;
}

.highlight-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.highlight-info p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.tour-info {
  margin-top: 3rem;
  background: linear-gradient(to right, #fff1fd, #f9f0ff);
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 3px 15px rgba(235, 7, 238, 0.08);
}

.tour-title {
  font-size: 1.4rem;
  color: #333;
  margin-bottom: 1rem;
  position: relative;
  padding-left: 1rem;
}

.tour-title:before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.2rem;
  bottom: 0.2rem;
  width: 4px;
  background: linear-gradient(to bottom, #eb07ee, #a505de);
  border-radius: 2px;
}

.tour-desc {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.tour-action {
  text-align: right;
}

.tour-link {
  color: #eb07ee;
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  transition: opacity 0.2s;
}

.tour-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* 响应式样式调整 */
@media (max-width: 768px) {
  .tour-info {
    padding: 1.5rem;
  }
  
  .tour-title {
    font-size: 1.2rem;
  }
  
  .tour-action {
    text-align: center;
  }
  
  .concerts-table {
    font-size: 0.75rem;
  }
  
  .concerts-table th,
  .concerts-table td {
    padding: 0.5rem 0.3rem;
  }
  
  .highlights-grid {
    grid-template-columns: 1fr;
  }
  
  .highlight-card {
    padding: 1.2rem;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(235, 7, 238, 0.2);
  border-radius: 50%;
  border-top-color: #eb07ee;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>