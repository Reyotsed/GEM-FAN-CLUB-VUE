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
        
        <!-- 演唱会观看指南按钮 -->
        <div class="guide-btn-container">
          <button class="guide-btn" @click="$refs.concertGuideModal.openModal()">
            <i class="fas fa-book-open"></i>
            演唱会观看指南
          </button>
        </div>
        <ConcertGuideModal ref="concertGuideModal" />

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
              <p>* 数据来源于维基百科，最后更新时间：{{ lastUpdatedAt || '同步后自动更新' }}</p>
            </div>
          </div>
        </section>

        
      </div>
    </div>
</template>
  
<script setup>
import ChineseMapModal from '@/components/info/ChineseMapModal.vue';
import ConcertGuideModal from '@/components/info/ConcertGuideModal.vue';
import { ref, onMounted } from 'vue';
import apiClient from '@/utils/api';

// 数据定义
const concerts = ref([]);
const groupedConcerts = ref([]);
const mergeConcertDates = ref([]);
const pendingCities = ref([]);
const totalConcertCount = ref(0);
const lastUpdatedAt = ref('');
const isLoading = ref(true);

// 获取演唱会页面统一数据
const fetchConcerts = async () => {
  try {
    isLoading.value = true;
    const response = await apiClient.get('/concert/overview');
    if (response.data.code === 200) {
      const data = response.data.data || {};
      concerts.value = data.concerts || [];
      groupedConcerts.value = data.groupedConcerts || [];
      mergeConcertDates.value = data.upcomingPerformances || [];
      pendingCities.value = data.pendingCities || [];
      totalConcertCount.value = data.totalConcertCount || 0;
      lastUpdatedAt.value = data.lastUpdatedAt || '';
    } else {
      console.error('获取演唱会数据失败:', response.data.message);
    }
  } catch (error) {
    console.error('请求演唱会数据出错:', error);
  } finally {
    isLoading.value = false;
  }
};

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
  background: transparent;
  margin: 0;
  padding: var(--page-padding-y) 0 var(--page-padding-bottom);
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  color: var(--text-primary);
}

.page-header {
  background: transparent;
  padding: var(--space-8) var(--space-4) var(--space-12);
  text-align: center;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.header-content h1 {
  font-size: clamp(var(--text-3xl), 6vw, var(--text-5xl));
  font-weight: 900;
  margin: 0 0 var(--space-4) 0;
  background: var(--color-title-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(200, 80, 232, 0.3);
}

.subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  letter-spacing: 1px;
}

.info-content {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--page-padding-x);
  box-sizing: border-box;
  width: 100%;
}

.info-section {
  margin-bottom: var(--section-gap);
  background: var(--surface-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--card-radius);
  border: 1px solid var(--surface-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out), border-color 0.3s var(--ease-out);
}

.info-section:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-primary);
  border-color: var(--surface-border-hover);
}

.section-title {
  padding: var(--space-6) var(--space-8);
  font-size: var(--text-2xl);
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
  filter: drop-shadow(0 0 10px rgba(200, 80, 232, 0.5));
}

.section-content {
  padding: var(--card-padding);
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
  text-shadow: 0 0 20px rgba(200, 80, 232, 0.4);
}

.tour-title-box h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(to right, #D946EF, #A21CAF);
  border-radius: 2px;
  box-shadow: 0 0 10px #D946EF;
}

.performance-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  padding: var(--card-padding);
  margin-bottom: var(--space-8);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.performance-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  padding-left: 1rem;
  border-left: 4px solid #D946EF;
}

.performance-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

.performance-item {
  padding: var(--space-6);
  border-radius: var(--radius-md);
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);
  transition: all 0.3s var(--ease-out);
}

.performance-item:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(200, 80, 232, 0.3);
  box-shadow: 0 10px 30px rgba(200, 80, 232, 0.1);
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
  background: rgba(200, 80, 232, 0.1);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #f3caff;
  font-weight: 500;
  border: 1px solid rgba(200, 80, 232, 0.2);
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
  background: linear-gradient(135deg, #D946EF, #A21CAF);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(200, 80, 232, 0.4);
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
  background: rgba(200, 80, 232, 0.1);
  border-color: rgba(200, 80, 232, 0.3);
  color: #fff;
  box-shadow: 0 0 15px rgba(200, 80, 232, 0.2);
}

/* 表格样式优化 */
.table-container {
  overflow-x: auto;
  margin-bottom: var(--space-8);
  border-radius: var(--radius-md);
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
  background: rgba(200, 80, 232, 0.15);
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
  background-color: rgba(200, 80, 232, 0.05);
  font-weight: 600;
  color: #f3caff;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.concerts-table tfoot td {
  background-color: rgba(200, 80, 232, 0.1);
  font-weight: 600;
  color: #fff;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.2rem;
}

.summary-value {
  font-size: 1.2rem;
  color: #D946EF;
  text-shadow: 0 0 10px rgba(200, 80, 232, 0.5);
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
  border: 3px solid rgba(200, 80, 232, 0.1);
  border-radius: 50%;
  border-top-color: #D946EF;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 15px rgba(200, 80, 232, 0.2);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 观看指南按钮 */
.guide-btn-container {
  display: flex;
  justify-content: center;
  margin-bottom: var(--section-gap);
}

.guide-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--button-height);
  padding: 0 var(--space-10);
  font-size: var(--text-lg);
  font-weight: 700;
  color: #fff;
  background: var(--color-brand-gradient);
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.25s var(--ease-out);
  box-shadow: var(--shadow-primary);
  letter-spacing: 1px;
}

.guide-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(200, 80, 232, 0.5);
  filter: brightness(1.1);
}

.guide-btn:active {
  transform: translateY(-1px);
}

.guide-btn i {
  font-size: 1.2rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .info-page {
    padding: var(--page-padding-y) 0 var(--page-padding-bottom);
  }

  .page-header {
    padding: var(--space-6) var(--space-4) var(--space-5);
  }

  .header-content h1 {
    font-size: var(--text-3xl);
  }

  .subtitle { font-size: var(--text-base); }

  .info-content {
    padding: 0 var(--page-padding-x);
  }

  .info-section { border-radius: var(--card-radius); margin-bottom: var(--section-gap); }
  .section-content { padding: var(--card-padding); }

  .section-title {
    padding: var(--space-4);
    font-size: var(--text-xl);
  }

  .tour-title-box { margin-bottom: 1.5rem; }
  .tour-title-box h3 { font-size: 1.35rem; }
  .performance-section { padding: var(--space-4); }
  .performance-list {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .performance-item { padding: var(--space-4); }
  .pending-row { gap: 0.7rem; }
  .pending-city { padding: 0.65rem 1rem; font-size: 0.95rem; }

  .table-container { border-radius: var(--radius-md); -webkit-overflow-scrolling: touch; }
  .concerts-table {
    min-width: 760px;
    font-size: 0.8rem;
  }
  
  .concerts-table th,
  .concerts-table td {
    padding: 0.75rem 0.5rem;
  }

  .guide-btn { width: 100%; justify-content: center; padding: 0 var(--space-5); }
}
</style>