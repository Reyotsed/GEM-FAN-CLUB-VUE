<template>
  <div class="shop-page app-page">
    <div class="page-header app-page-header">
      <div class="header-content">
        <h1 class="app-title">G.E.M. 官方周边商店</h1>
        <p class="subtitle app-subtitle">支持姐姐，支持粉丝社区</p>
      </div>
    </div>

    <div class="shop-content app-container">
      <!-- 赞助选项 -->
      <section class="sponsor-section">
        <div class="sponsor-card app-glass">
          <div class="sponsor-image">
            <img src="/img/homepage/005.webp" alt="演唱会照片" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/img/homepage/005.jpg'">
            <div class="sponsor-overlay">
              <span class="sponsor-price">¥1</span>
            </div>
          </div>
          <div class="sponsor-info">
            <h3 class="sponsor-title">赞助站长看姐姐演唱会</h3>
            <p class="sponsor-desc">不赞助我也会去的，永远爱姐姐！</p>
            <button class="sponsor-button app-btn app-btn-primary" @click="showPaymentQR = true">
              赞助一元
            </button>
          </div>
        </div>
      </section>

      <!-- 棋士联盟商品 -->
      <section class="product-section">
        <h2 class="section-title app-section-title">官方正品</h2>
        <div class="product-grid">
          <div class="product-card app-card">
            <div class="product-image">
              <img src="/img/icon/icon.png" alt="棋士勋章" loading="lazy" decoding="async">
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
              <a href="https://www.iamgem.com/fan-club/" target="_blank" class="product-button app-btn app-btn-ghost">
                立即购买
              </a>
            </div>
          </div>

          <div class="product-card app-card">
            <div class="product-image">
              <img src="/img/shop/001.png" alt="官方周边" loading="lazy" decoding="async">
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
              <a href="https://cn.iamgem.com/product-category/shop/" target="_blank" class="product-button app-btn app-btn-ghost">
                立即购买
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 站长买过 -->
      <section class="product-section">
        <h2 class="section-title app-section-title">站长买过</h2>
        <div class="product-grid">
          <div class="product-card app-card">
            <div class="product-image">
              <img src="/img/shop/002.png" alt="站长买过" loading="lazy" decoding="async">
            </div>
            <div class="product-info">
              <h3 class="product-title">启示录专辑庆功版</h3>
              <p class="product-desc">站长有姐姐的启示录专辑庆功版，本来想挂个链接，结果现在要么售罄要么涨价到1k了(站长380入手的)，那就放一张照片好了，想买的宝子可以去咸鱼看看，站长要收藏的，不出！</p>
            </div>
          </div>
        </div>

        <div class="product-grid">
          <div class="product-card app-card">
            <div class="product-image">
              <img src="/img/shop/003.png" alt="站长买过" loading="lazy" decoding="async">
            </div>
            <div class="product-info">
              <h3 class="product-title">启示录、摩天动物园、童话三部曲专辑</h3>
              <a href="https://detail.tmall.com/item.htm?id=692695693942&pisk=g1Q-21YZ--2lbw_Ji_rmx2NndmVcvofzDT5s-pvoAtBAOT9kKQiWlxOBtQ9COpYdp9Bp9fCqS4gS_5y8e9LIP4MuJPrr9dWV2tbOCdtNSx55ZdkZewgIPmmG3ykR9x-1c4jcCJXNB9WRSHXZBLBNLt7MKOp_DM5d9NvhBRZR0gWAxgX6KiINHOQlqO9w4GWdHNAGKRBRp6BVSCjpUPJ3bO-JGR7PbnL9TuIRZdJcofWh7_NuQd6B__-R2Zew3p1NKe7BXoJc6-d8XupF_sNLC6SFRxPOiBvweUmVF1AAOdVPPDJggffsK1tT25yyGQ9Pgeq0UXRlE_5XXgCMUpyvaxxe-p1zs_wln4_6s_VE_7AtXaBiOvfaaTL558JPLTvgw2qPpIfAaxy8YwM46sAHQL14A7GWq4oIddnVSFxYD-WgReMTguSL2GHMdVWVDoexIRvISFxYD-WgIpgN4iEYHAV.&spm=a21xtw.29978518.0.0&sku_properties=134942334%3A3269586" target="_blank" class="product-button app-btn app-btn-ghost">
                立即购买
              </a>
            </div>
          </div>
        </div>

        <div class="product-grid">
          <div class="product-card app-card">
            <div class="product-image">
              <img src="/img/shop/004.png" alt="站长买过" loading="lazy" decoding="async">
            </div>
            <div class="product-info">
              <h3 class="product-title">摩天动物园马版专辑</h3>
              <a href="https://item.taobao.com/item.htm?id=826791204921&pisk=g9JSVrbg8z4SIs6LA_mVfgStkFBCdmkw9kspjHezvTBRJkTvv7ULwgKYkGjF9JllU66BkZJPz3WRJJTeYL8evpSpdTv2aJ7rr9tp79gZ7Akwq3fhpVuNOEUIZOIa9yUFvSQALMtO5tI2q3XhpozK_IKuAtocHuIdJm6AAMbdpgCLkmsFAJBdy6UYMGQAp9QRpZeAbgIdJ7e-coICbzERw6KADgSF29BpJnnfxZIRp9HFtrsENMKSqc6BbIzQ13_bpJpfD2b2V2wFcKSWrNtJFJeKtg15W3QjyVZEDsKhOpq3daKJsej9yz3NZHdXlg6I37B9cBL1mLHaPiAyDh7vfk2HqTO6CTdSoSXyPKBveCZLpn65r69PGzgfWLxvItCqBctvnU-khHrKpi8Nk3vRdAnGFTQRhivEo8QBMBpPZ94-7_xpGEs5BgPuQNOpVWZfsJsf7mibtWDKmDvVmB674_Ic2AojcrNhwijf7mibtWfRmgdZcmabt&spm=a21xtw.29978518.0.0" target="_blank" class="product-button app-btn app-btn-ghost">
                立即购买
              </a>
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
            <img src="/img/alipay.jpg" alt="收款码" class="payment-qr" loading="lazy" decoding="async">
          </div>
          <p class="thank-note">感谢您对G.E.M.粉丝站的支持！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 控制支付二维码弹窗
const showPaymentQR = ref(false);

onMounted(() => {
  // 确保页面滚动到顶部
  window.scrollTo(0, 0);
});
</script>

<style scoped>
.shop-page {
  width: 100%;
  min-height: 100vh;
  background: transparent;
  margin: 0;
  padding: var(--page-padding-y) 0 var(--page-padding-bottom);
  box-sizing: border-box;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

.page-header {
  background: transparent;
  position: relative;
}

.shop-content {
  width: 100%;
  box-sizing: border-box;
}

/* 赞助部分样式 */
.sponsor-section {
  margin-bottom: var(--section-gap);
  display: flex;
  justify-content: center;
}

.sponsor-card {
  display: flex;
  overflow: hidden;
  max-width: 900px;
  width: 100%;
}

.sponsor-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-primary);
  border-color: var(--surface-border-hover);
}

.sponsor-image {
  width: 40%;
  position: relative;
  overflow: hidden;
}

.sponsor-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.sponsor-card:hover .sponsor-image img {
  transform: scale(1.1);
}

.sponsor-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(10, 10, 18, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(200, 80, 232, 0.5);
  color: #D946EF;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: 0 0 20px rgba(200, 80, 232, 0.3);
  z-index: 2;
}

.sponsor-info {
  padding: var(--card-padding);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.sponsor-title {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-4);
  color: #fff;
  font-weight: 700;
}

.sponsor-desc {
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
  line-height: 1.6;
  font-size: 1.1rem;
}

.sponsor-button {
  border: none;
  padding: 0 var(--space-10);
  font-size: var(--text-lg);
  align-self: flex-start;
}

.sponsor-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(200, 80, 232, 0.5);
}

/* 商品部分样式 */
.product-section {
  margin-bottom: var(--section-gap);
}

.section-title {
  font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl));
  color: #fff;
  margin-bottom: var(--space-10);
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.section-title::before,
.section-title::after {
  content: '';
  height: 1px;
  width: 50px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3));
}

.section-title::after {
  background: linear-gradient(to left, transparent, rgba(255, 255, 255, 0.3));
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.product-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-primary);
  border-color: var(--surface-border-hover);
  background: var(--surface-bg-hover);
}

.product-image {
  width: 100%;
  height: 300px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  padding: 2rem;
  box-sizing: border-box;
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
}

.product-card:hover .product-image img {
  transform: scale(1.1) translateY(-10px);
}

.product-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(200, 80, 232, 0.2);
  border: 1px solid rgba(200, 80, 232, 0.4);
  color: #fff;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 50px;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 15px rgba(200, 80, 232, 0.2);
}

.product-info {
  padding: var(--card-padding);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-title {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-2);
  color: #fff;
  font-weight: 700;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 1.5rem;
  gap: 0.8rem;
}

.price {
  font-size: 1.8rem;
  font-weight: 800;
  color: #D946EF;
  text-shadow: 0 0 15px rgba(200, 80, 232, 0.4);
}

.original-price {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: line-through;
}

.product-desc {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-size: 0.95rem;
}

.product-features {
  margin-bottom: var(--space-8);
  background: rgba(0, 0, 0, 0.2);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

.feature {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.feature:last-child {
  margin-bottom: 0;
}

.feature-icon {
  color: #D946EF;
  font-weight: bold;
  margin-right: 0.8rem;
  font-size: 0.9rem;
}

.feature-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.product-button {
  padding: 0 var(--space-5);
  font-size: var(--text-base);
  text-decoration: none;
  text-align: center;
  margin-top: auto;
}

.product-button:hover {
  background: #D946EF;
  border-color: #D946EF;
  box-shadow: 0 0 20px rgba(200, 80, 232, 0.4);
  transform: translateY(-2px);
}

/* 支付弹窗样式 */
.payment-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: rgba(20, 20, 30, 0.95);
  padding: var(--space-12);
  border-radius: var(--card-radius);
  width: 90%;
  max-width: 400px;
  text-align: center;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: modalShow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalShow {
  from { transform: scale(0.9) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

.close-button:hover {
  background: rgba(255, 70, 70, 0.2);
  color: #ff4646;
  transform: rotate(90deg);
}

.modal-content h3 {
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 1rem;
}

.modal-content p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2rem;
}

.qr-container {
  margin: 2rem 0;
  padding: 1rem;
  background: #fff;
  border-radius: 12px;
  display: inline-block;
}

.payment-qr {
  width: 200px;
  height: 200px;
  object-fit: contain;
}

.thank-note {
  font-size: 0.9rem;
  color: #D946EF !important;
  margin-top: 1rem;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .sponsor-card {
    flex-direction: column;
  }
  
  .sponsor-image {
    width: 100%;
    height: 250px;
  }
  
  .sponsor-info {
    padding: 2rem;
  }
}

@media (max-width: 768px) {
  .shop-page {
    padding: var(--page-padding-y) 0 var(--page-padding-bottom);
  }

  .page-header { padding: var(--space-6) var(--space-4) var(--space-8); }

  .header-content h1 {
    font-size: var(--text-3xl);
  }

  .subtitle { font-size: var(--text-base); }
  
  .shop-content {
    padding: 0 var(--page-padding-x);
  }

  .sponsor-section, .product-section { margin-bottom: var(--section-gap); }
  .sponsor-info, .product-info { padding: var(--card-padding); }
  .sponsor-title, .section-title { font-size: var(--text-2xl); }
  .section-title { margin-bottom: var(--space-6); }
  
  .product-grid {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }
  
  .product-image {
    height: 220px;
    padding: var(--space-5);
  }

  .modal-content { padding: var(--space-8) var(--space-5); }
  .payment-qr { width: 180px; height: 180px; }
}
</style>