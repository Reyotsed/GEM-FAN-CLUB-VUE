<template>
  <div class="shop-page">
    <div class="page-header">
      <div class="header-content">
        <h1>G.E.M. 官方周边商店</h1>
        <p class="subtitle">支持姐姐，支持粉丝社区</p>
      </div>
    </div>

    <div class="shop-content">
      <!-- 赞助选项 -->
      <section class="sponsor-section">
        <div class="sponsor-card">
          <div class="sponsor-image">
            <img src="/img/homepage/005.jpg" alt="演唱会照片">
            <div class="sponsor-overlay">
              <span class="sponsor-price">¥1</span>
            </div>
          </div>
          <div class="sponsor-info">
            <h3 class="sponsor-title">赞助站长看姐姐演唱会</h3>
            <p class="sponsor-desc">不赞助我也会去的，永远爱姐姐！</p>
            <button class="sponsor-button" @click="showPaymentQR = true">
              赞助一元
            </button>
          </div>
        </div>
      </section>

      <!-- 支付弹窗 -->
      <div class="payment-modal" v-if="showPaymentQR">
        <div class="modal-content">
          <button class="close-button" @click="showPaymentQR = false">×</button>
          <h3>感谢您的赞助！</h3>
          <p>请使用支付宝扫描二维码完成赞助</p>
          <div class="qr-container">
            <!-- 替换为你的收款码图片 -->
            <img src="/img/alipay.jpg" alt="收款码" class="payment-qr">
          </div>
          <p class="thank-note">感谢您对G.E.M.粉丝站的支持！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 控制支付二维码弹窗
const showPaymentQR = ref(false);
</script>

<style scoped>
.shop-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-header {
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
  padding: 3rem 0;
  text-align: center;
  position: relative;
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

.shop-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 赞助部分样式 */
.sponsor-section {
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
}

.sponsor-card {
  display: flex;
  background: linear-gradient(to right, #fff1fd, #f9f0ff);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(235, 7, 238, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  max-width: 800px;
  width: 100%;
}

.sponsor-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(235, 7, 238, 0.15);
}

.sponsor-image {
  width: 30%;
  position: relative;
  overflow: hidden;
}

.sponsor-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.sponsor-card:hover .sponsor-image img {
  transform: scale(1.05);
}

.sponsor-overlay {
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: rgba(235, 7, 238, 0.9);
  color: white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.sponsor-info {
  padding: 2rem;
  flex: 1;
}

.sponsor-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.sponsor-desc {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.sponsor-button {
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-weight: 500;
}

.sponsor-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(235, 7, 238, 0.3);
}

/* 支付弹窗样式 */
.payment-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.qr-container {
  margin: 1.5rem 0;
}

.payment-qr {
  width: 80%;
  max-width: 250px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.thank-note {
  font-size: 0.9rem;
  color: #666;
  margin-top: 1rem;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .sponsor-card {
    flex-direction: column;
  }
  
  .sponsor-image {
    width: 100%;
    height: 200px;
  }
}

@media (max-width: 768px) {
  .shop-content {
    padding: 1.5rem;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .sponsor-title {
    font-size: 1.3rem;
  }
}

@media (max-width: 576px) {
  .sponsor-info {
    padding: 1.5rem;
  }
}
</style>