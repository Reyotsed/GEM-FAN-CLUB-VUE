<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="upc-mask" @click.self="close">
        <div class="upc-wrapper">
          <button class="upc-close" @click="close" aria-label="关闭">×</button>

          <div v-if="loading" class="upc-loading">加载中...</div>
          <template v-else-if="profile">
            <div class="upc-card-box">
              <div ref="previewBox" class="upc-card-canvas-wrap"></div>
              <transition name="fade">
                <div v-if="!previewReady" class="upc-card-loading">
                  <div class="upc-spinner"></div>
                </div>
              </transition>
            </div>
            <button class="upc-go" @click="goUserPage">
              进入个人主页 <span class="arrow">→</span>
            </button>
          </template>
          <div v-else class="upc-loading">用户信息加载失败</div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/utils/api';
import { renderFanProfileCanvas } from '@/utils/fanProfilePoster';
import { pickRandomPosterBgAsync } from '@/utils/posterBgList';
import { userCardStore } from '@/utils/userCardStore';

const router = useRouter();
const visible = ref(false);
const loading = ref(false);
const profile = ref(null);
const targetUserId = ref('');
const previewBox = ref(null);
const previewReady = ref(false);
let previewSeq = 0;

const close = () => {
  visible.value = false;
  profile.value = null;
  targetUserId.value = '';
  previewReady.value = false;
  if (previewBox.value) previewBox.value.innerHTML = '';
};

const goUserPage = () => {
  const uid = targetUserId.value;
  close();
  if (uid) router.push({ path: '/user', query: { id: uid } });
};

const renderCard = async (u) => {
  const seq = ++previewSeq;
  previewReady.value = false;
  try {
    const { canvas } = await renderFanProfileCanvas({
      nickName: u.nickName,
      fanSinceYear: u.fanSinceYear || '—',
      favoriteSong: u.favoriteSong || '—',
      fanBio: u.fanBio || '',
      fanTag: u.fanTag || '',
      posterBg: u._bgUrl,
      mark: u.mark || null,
    });
    if (seq !== previewSeq) return;
    canvas.classList.add('upc-card-canvas');
    if (!previewBox.value) await nextTick();
    if (seq !== previewSeq) return;
    if (previewBox.value) {
      previewBox.value.innerHTML = '';
      previewBox.value.appendChild(canvas);
      previewReady.value = true;
    }
  } catch (e) {
    if (seq === previewSeq) previewReady.value = true;
  }
};

const open = async (userId) => {
  if (!userId) return;
  targetUserId.value = String(userId);
  visible.value = true;
  loading.value = true;
  profile.value = null;
  previewReady.value = false;
  try {
    const res = await apiClient.get('/user/getUserInfo', { params: { userId } });
    if (res.data && res.data.code === 200 && res.data.data) {
      const u = res.data.data;
      const bgUrl = u.posterBg || (await pickRandomPosterBgAsync());
      profile.value = { ...u, _bgUrl: bgUrl };
      await nextTick();
      renderCard(profile.value);
    } else {
      profile.value = null;
    }
  } catch (e) {
    profile.value = null;
  } finally {
    loading.value = false;
  }
};

watch(
  () => userCardStore.openSeq,
  () => {
    if (userCardStore.userId) open(userCardStore.userId);
  },
);
</script>

<style scoped>
.upc-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.upc-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.upc-close {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  z-index: 2;
  transition: background 0.2s;
}
.upc-close:hover {
  background: rgba(200, 80, 232, 0.5);
}
.upc-loading {
  width: 280px;
  height: 455px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 18px;
}

/* 卡片容器：与 FanCardModal 预览一致 280 宽，75:122 比例 */
.upc-card-box {
  position: relative;
  width: 280px;
  aspect-ratio: 75 / 122;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 28px rgba(200, 80, 232, 0.22);
  border: 1px solid rgba(250, 204, 21, 0.32);
  background: rgba(0, 0, 0, 0.4);
}
.upc-card-canvas-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
}
.upc-card-box :deep(.upc-card-canvas) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.upc-card-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 6, 18, 0.55);
  backdrop-filter: blur(6px);
  z-index: 2;
}
.upc-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(200, 80, 232, 0.25);
  border-top-color: #D946EF;
  animation: upcSpin 0.8s linear infinite;
}
@keyframes upcSpin {
  to { transform: rotate(360deg); }
}

.upc-go {
  background: linear-gradient(135deg, #D946EF, #A21CAF);
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(200, 80, 232, 0.45);
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.upc-go:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(200, 80, 232, 0.65);
}
.upc-go .arrow {
  transition: transform 0.25s;
}
.upc-go:hover .arrow {
  transform: translateX(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .upc-card-box { width: 260px; }
  .upc-loading { width: 260px; height: 423px; }
}
</style>
