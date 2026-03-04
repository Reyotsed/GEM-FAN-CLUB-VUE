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
                  <div class="performance-date">
                    <div class="date-segments">
                      <span v-for="(segment, idx) in item.formattedDates.split('，')" 
                            :key="idx" 
                            class="date-segment">
                        {{ segment }}
                      </span>
                    </div>
                  </div>
                  <div class="performance-info">
                    <div class="venue-info">
                      <span class="city">{{ item.city }}站</span>
                      <span v-if="item.consecutiveShows > 1" 
                            class="consecutive-shows">
                        {{ item.consecutiveShows }}连开
                      </span>
                    </div>
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

        <!-- 演唱会地图 -->
        <ChineseMapModal :concerts="concerts" />
        
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
                      <td>{{ concert.sequence_range }}</td>
                      <td>{{ concert.concert_date }}</td>
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
      console.log(response.data.data);
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
      sequence_range: concert.sequence_range,
      concert_date: concert.concert_date,
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
    const year = dateRange.match(/(\d{4})年/)?.[1];
    
    // 分割多个日期段
    const segments = dateRange.split(/[,，]/);
    
    segments.forEach(segment => {
      // 提取月份
      const month = segment.match(/(\d{1,2})月/)?.[1];
      if (!month) return;
      
      // 提取日期范围
      const dayRanges = segment.match(/(\d{1,2})-(\d{1,2})日?/);
      if (dayRanges) {
        const startDay = parseInt(dayRanges[1]);
        const endDay = parseInt(dayRanges[2]);
        
        for (let day = startDay; day <= endDay; day++) {
          dates.push(`${month}/${day}`);
        }
      } else {
        // 处理单个日期
        const singleDay = segment.match(/月(\d{1,2})日?/)?.[1];
        if (singleDay) {
          dates.push(`${month}/${singleDay}`);
        }
      }
    });
    
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
    .filter(concert => concert.status !== '未官宣')
    .forEach(concert => {
      const key = `${concert.city}-${concert.venue}`;
      if (!merged[key]) {
        merged[key] = {
          city: concert.city,
          venue: concert.venue,
          dates: [],
          id: concert.sequence_range
        };
      }
      
      const extractedDates = extractDatesFromRange(concert.concert_date);
      if (extractedDates.length > 0) {
        merged[key].dates.push(...extractedDates);
      }
    });
  
  return Object.values(merged).map(item => {
    item.dates = [...new Set(item.dates)];
    
    // 计算连场场次
    let consecutiveShows = 1;
    if (item.id && item.id.includes('-')) {
      const [start, end] = item.id.split('-').map(Number);
      consecutiveShows = end - start + 1;
    }
    
    // 按月份和日期排序
    item.dates.sort((a, b) => {
      const [aMonth, aDay] = a.split('/').map(Number);
      const [bMonth, bDay] = b.split('/').map(Number);
      
      if (aMonth === bMonth) {
        return aDay - bDay;
      }
      return aMonth - bMonth;
    });
    
    // 合并连续日期
    const ranges = [];
    let currentRange = [item.dates[0]];
    
    for (let i = 1; i < item.dates.length; i++) {
      const [prevMonth, prevDay] = item.dates[i-1].split('/').map(Number);
      const [currMonth, currDay] = item.dates[i].split('/').map(Number);
      
      // 检查是否连续（同月连续或跨月连续）
      const isConsecutive = (
        (prevMonth === currMonth && currDay - prevDay === 1) ||
        (currMonth - prevMonth === 1 && prevDay === getDaysInMonth(prevMonth) && currDay === 1)
      );
      
      if (isConsecutive) {
        currentRange.push(item.dates[i]);
      } else {
        ranges.push([...currentRange]);
        currentRange = [item.dates[i]];
      }
    }
    ranges.push(currentRange);
    
    // 格式化日期范围
    const formattedRanges = ranges.map(range => {
      if (range.length === 1) {
        const [month, day] = range[0].split('/');
        return `${month}月${day}日`;
      } else {
        const [startMonth, startDay] = range[0].split('/');
        const [endMonth, endDay] = range[range.length - 1].split('/');
        
        if (startMonth === endMonth) {
          return `${startMonth}月${startDay}-${endDay}日`;
        } else {
          return `${startMonth}月${startDay}日-${endMonth}月${endDay}日`;
        }
      }
    });
    
    return {
      ...item,
      formattedDates: formattedRanges.join('，'),
      consecutiveShows
    };
  });
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
  // 确保页面滚动到顶部
  window.scrollTo(0, 0);
  
  // 调用fetchConcerts获取数据
  fetchConcerts();
});
</script>
  
<style scoped>
.info-page {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-dark);
  background-image: 
      radial-gradient(circle at 10% 20%, rgba(235, 7, 238, 0.1), transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(0, 242, 255, 0.1), transparent 40%);
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  color: #fff;
  padding-top: var(--nav-height, 70px);
}

.page-header {
  background: transparent;
  padding: 4rem 2rem 2rem;
  text-align: center;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.header-content h1 {
  font-size: 3rem;
  font-weight: 900;
  margin: 0 0 1rem 0;
  background: linear-gradient(to right, #fff, #f3caff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(235, 7, 238, 0.3);
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

.info-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
  width: 100%;
}

.info-section {
  margin-bottom: 3rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.info-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

.section-title {
  padding: 1.5rem 2rem;
  font-size: 1.4rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  font-weight: 700;
}

.icon {
  margin-right: 1rem;
  font-size: 1.6rem;
  filter: drop-shadow(0 0 10px rgba(235, 7, 238, 0.5));
}

.section-content {
  padding: 2rem;
}

/* 演出活动样式 */
.tour-title-box {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.tour-title-box h3 {
  font-size: 1.8rem;
  color: #fff;
  margin: 0;
  padding: 1rem 0;
  position: relative;
  display: inline-block;
  text-shadow: 0 0 20px rgba(235, 7, 238, 0.4);
}

.tour-title-box h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(to right, #eb07ee, #a505de);
  border-radius: 2px;
  box-shadow: 0 0 10px #eb07ee;
}

.performance-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.performance-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  padding-left: 1rem;
  border-left: 4px solid #eb07ee;
}

.performance-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

.performance-item {
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.performance-item:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(235, 7, 238, 0.3);
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.1);
}

.performance-date {
  margin-bottom: 1.2rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.date-segments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.date-segment {
  background: rgba(235, 7, 238, 0.1);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #f3caff;
  font-weight: 500;
  border: 1px solid rgba(235, 7, 238, 0.2);
}

.performance-info {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.venue-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.city {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
}

.consecutive-shows {
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(235, 7, 238, 0.4);
}

.venue {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
}

/* 待定场次样式 */
.pending-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.pending-cities {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pending-row {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.pending-city {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.8rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.pending-city:hover {
  transform: translateY(-2px);
  background: rgba(235, 7, 238, 0.1);
  border-color: rgba(235, 7, 238, 0.3);
  color: #fff;
  box-shadow: 0 0 15px rgba(235, 7, 238, 0.2);
}

/* 表格样式优化 */
.table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
}

.concerts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
}

.concerts-table th {
  background: rgba(235, 7, 238, 0.15);
  color: #fff;
  padding: 1.2rem 1rem;
  text-align: center;
  white-space: nowrap;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.concerts-table td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.concerts-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.station-cell {
  background-color: rgba(235, 7, 238, 0.05);
  font-weight: 600;
  color: #f3caff;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.concerts-table tfoot td {
  background-color: rgba(235, 7, 238, 0.1);
  font-weight: 600;
  color: #fff;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.2rem;
}

.summary-value {
  font-size: 1.2rem;
  color: #eb07ee;
  text-shadow: 0 0 10px rgba(235, 7, 238, 0.5);
}

.notes-cell {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.table-explanation {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* 加载动画 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: rgba(255, 255, 255, 0.6);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(235, 7, 238, 0.1);
  border-radius: 50%;
  border-top-color: #eb07ee;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 15px rgba(235, 7, 238, 0.2);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    padding: 2rem 1rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .info-content {
    padding: 1rem;
  }

  .section-title {
    padding: 1rem;
    font-size: 1.2rem;
  }

  .performance-list {
    grid-template-columns: 1fr;
  }

  .concerts-table {
    font-size: 0.8rem;
  }
  
  .concerts-table th,
  .concerts-table td {
    padding: 0.8rem 0.5rem;
  }
}
</style>