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
  background: linear-gradient(135deg, #fff6fe 0%, #f8f0ff 100%);
  position: relative;
  overflow: hidden;
}

.shop-page::before {
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

.shop-page::after {
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

.shop-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

/* 赞助部分样式 */
.sponsor-section {
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
  position: relative;
}

.sponsor-card {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(235, 7, 238, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  max-width: 800px;
  width: 100%;
  position: relative;
  backdrop-filter: blur(10px);
}

.sponsor-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 0% 100%, rgba(235,7,238,0.05) 0%, transparent 50%);
  pointer-events: none;
}

.sponsor-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(235, 7, 238, 0.2);
}

.sponsor-image {
  width: 30%;
  position: relative;
  overflow: hidden;
}

.sponsor-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(235,7,238,0.1), transparent);
  z-index: 1;
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
  background: linear-gradient(135deg, rgba(235,7,238,0.95), rgba(165,5,222,0.95));
  color: white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  z-index: 2;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
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
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: modalShow 0.3s ease-out;
}

@keyframes modalShow {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
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