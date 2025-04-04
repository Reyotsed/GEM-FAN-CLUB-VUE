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

      <!-- 棋士联盟商品 -->
      <section class="product-section">
        <h2 class="section-title">官方正品</h2>
        <div class="product-grid">
          <div class="product-card">
            <div class="product-image">
              <img src="/img/icon/icon.png" alt="棋士勋章">
              <div class="product-badge">官方正品</div>
            </div>
            <div class="product-info">
              <h3 class="product-title">棋士勋章</h3>
              <div class="product-price">
                <span class="price">¥220</span>
                <span class="original-price">¥250</span>
              </div>
              <p class="product-desc">「棋士勋章」象征棋士身份，拥有一枚即代表加入「棋士联盟」</p>
              <div class="product-features">
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">棋士勋章一枚</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">每月行程公告</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">不定期活动独家照片</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">永久会籍终身有效</span>
                </div>
              </div>
              <a href="https://www.iamgem.com/fan-club/" target="_blank" class="product-button">
                立即购买
              </a>
            </div>
          </div>

          <div class="product-card">
            <div class="product-image">
              <img src="/img/shop/001.png" alt="官方周边">
              <div class="product-badge">官方正品</div>
            </div>
            <div class="product-info">
              <h3 class="product-title">官方周边系列</h3>
              <div class="product-price">
                <span class="price">¥...</span>
              </div>
              <p class="product-desc">G.E.M. 邓紫棋官方授权周边商品，「启示录」系列T恤、棋士风衣等多款产品（常年售罄）</p>
              <div class="product-features">
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">【启示录】系列T恤</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">棋士风衣（多款式）</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">限量版纪念商品</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">官方正品保证</span>
                </div>
              </div>
              <a href="https://cn.iamgem.com/product-category/shop/" target="_blank" class="product-button">
                立即购买
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 站长买过 -->
      <section class="product-section">
        <h2 class="section-title">站长买过</h2>
        <div class="product-grid">
          <div class="product-card">
            <div class="product-image">
              <img src="/img/shop/002.png" alt="站长买过">
            </div>
            <div class="product-info">
              <h3 class="product-title">站长买过</h3>
              <p class="product-desc">站长买过姐姐的启示录专辑庆功版，本来想挂个链接，结果现在要么售罄要么涨价到1k了(站长380入手的)，那就放一张照片好了</p>
            </div>
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

/* 商品部分样式 */
.product-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  padding-bottom: 0.8rem;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(to right, #eb07ee, #a505de);
  border-radius: 2px;
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
}

.product-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(235, 7, 238, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  width: 100%;
  max-width: 800px;
  display: flex;
  backdrop-filter: blur(10px);
  position: relative;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 0% 100%, rgba(235,7,238,0.05) 0%, transparent 50%);
  pointer-events: none;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(235, 7, 238, 0.2);
}

.product-image {
  width: 30%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
}

.product-image img {
  width: 80%;
  height: auto;
  object-fit: contain;
  transition: transform 0.5s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-badge {
  position: absolute;
  top: 15px;
  right: 0;
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 4px 0 0 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.product-info {
  padding: 2rem;
  flex: 1;
}

.product-title {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.product-price {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #eb07ee;
  margin-right: 0.8rem;
}

.original-price {
  font-size: 1rem;
  color: #999;
  text-decoration: line-through;
}

.product-desc {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.product-features {
  margin-bottom: 1.5rem;
}

.feature {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.feature-icon {
  color: #eb07ee;
  font-weight: bold;
  margin-right: 0.5rem;
}

.feature-text {
  color: #444;
}

.product-button {
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.product-button:hover {
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

  .product-card {
    flex-direction: column;
  }
  
  .product-image {
    width: 100%;
    height: 250px;
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