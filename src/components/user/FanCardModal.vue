<template>
  <Teleport to="body">
    <transition name="fc-fade">
      <div v-if="isVisible" class="fc-mask" @click.self="close">
        <div class="fc-modal" @click.stop>
          <button class="fc-close" @click="close" aria-label="关闭">×</button>

          <!-- 左：卡片预览（3D 镭射倾斜效果 + Canvas 直接渲染） -->
          <div class="fc-preview">
            <div class="fc-preview-glow"></div>
            <div 
              ref="previewBox3d"
              class="fc-preview-box fc-preview-3d"
              :class="{ 'is-active': isPreviewHovered }"
              :style="fc3dStyle"
              @pointermove="onFcPointerMove"
              @pointerenter="onFcPointerEnter"
              @pointerleave="onFcPointerLeave"
            >
              <div ref="previewBox" class="fc-preview-canvas-wrap"></div>
              <!-- 镭射高光反射层 -->
              <div class="holo-shine" :style="holoShineStyle"></div>
              <!-- 镭射彩红膜图层 -->
              <div class="holo-foil"></div>
              <transition name="fc-loading-fade">
                <div v-if="!previewReady" class="fc-preview-loading">
                  <div class="fc-loading-spinner"></div>
                  <span>生成预览中…</span>
                </div>
              </transition>
              <!-- 保存时"显影中"过渡层 -->
              <transition name="fc-develop-fade">
                <div v-if="isDeveloping" class="fc-develop-overlay">
                  <div class="fc-develop-grain"></div>
                  <div class="fc-develop-text">
                    <span class="fc-develop-sparkle">✨</span> 档案卡显影中…
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- 右：信息 + 操作 -->
          <div class="fc-panel">
            <div class="fc-header">
              <div class="fc-title">粉丝档案卡</div>
              <div class="fc-subtitle">挑一张你喜欢的背景，专属于你的应援身份</div>
            </div>

            <div class="fc-tip-list">
              <div class="fc-tip">
                <span class="dot"></span>
                <span>个人资料请到 <b>"编辑个人资料"</b> 中修改</span>
              </div>
              <div class="fc-tip">
                <span class="dot"></span>
<span>背景图从精选图库中随机抽取</span>
              </div>
              <div class="fc-tip" v-if="dirty">
                <span class="dot warn"></span>
                <span>当前背景未保存，记得点击保存</span>
              </div>
            </div>

            <div class="fc-actions">
              <button class="fc-btn ghost" :disabled="isShuffling" @click="shuffle">
                <span class="btn-icon">🎲</span>
                {{ isShuffling ? '换图中...' : '换一张背景' }}
              </button>
              <button class="fc-btn ghost" :disabled="isDownloading" @click="download">
                <span class="btn-icon">⬇️</span>
                {{ isDownloading ? '生成中...' : '下载档案卡' }}
              </button>
              <button class="fc-btn primary" :disabled="!dirty || isSaving" @click="save">
                <span class="btn-icon">✨</span>
                {{ isSaving ? '保存中...' : '保存背景' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount, nextTick } from 'vue';
import apiClient from '@/utils/api';
import { showToast } from '@/utils/toast';
import { pickRandomPosterBgAsync } from '@/utils/posterBgList';
import { renderFanProfileCanvas, generateFanProfilePoster, downloadFanProfilePoster } from '@/utils/fanProfilePoster';

interface MarkInfo {
  id?: number | null;
  city?: string | null;
  province?: string | null;
  message?: string | null;
  rank?: number | null;
  total?: number | null;
}

interface UserInfo {
  userId: string;
  nickName: string;
  fanSinceYear?: number | null;
  favoriteSong?: string | null;
  fanBio?: string | null;
  fanTag?: string | null;
  posterBg?: string | null;
  birthday?: string;
  personIntroduction?: string;
  // 报到信息（已合并入档案卡的地理坐标模块；未报到则不传或传 null）
  mark?: MarkInfo | null;
}

const props = defineProps<{
  isVisible: boolean;
  userInfo: UserInfo;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', bgUrl: string): void;
}>();

const currentBg = ref<string>('');
const initialBg = ref<string>('');
const isShuffling = ref(false);
const isSaving = ref(false);
const isDownloading = ref(false);
const isDeveloping = ref(false);

const previewBox = ref<HTMLDivElement | null>(null);
const previewBox3d = ref<HTMLDivElement | null>(null);
const previewReady = ref(false);
let currentCanvas: HTMLCanvasElement | null = null;
let previewSeq = 0;

// ===== 3D 镭射倾斜效果状态 =====
const isPreviewHovered = ref(false);
const tiltX = ref(0);
const tiltY = ref(0);
const shineX = ref(50);
const shineY = ref(50);

const fc3dStyle = computed(() => ({
  transform: `perspective(800px) rotateY(${tiltX.value}deg) rotateX(${tiltY.value}deg) scale(${isPreviewHovered.value ? 1.04 : 1})`,
  transition: isPreviewHovered.value
    ? 'transform 0.15s cubic-bezier(0.25, 0.8, 0.25, 1)'
    : 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.12)',
}));

const holoShineStyle = computed(() => ({
  background: `radial-gradient(circle at ${shineX.value}% ${shineY.value}%, rgba(255,255,255,0.14) 0%, rgba(200,80,232,0.12) 30%, rgba(0,204,223,0.12) 60%, transparent 90%)`,
}));

const onFcPointerMove = (e: PointerEvent) => {
  const card = previewBox3d.value;
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const px = (x / rect.width) - 0.5;
  const py = (y / rect.height) - 0.5;
  tiltX.value = px * 18;   // 最大偏转 ±9 度
  tiltY.value = -py * 18;
  shineX.value = (x / rect.width) * 100;
  shineY.value = (y / rect.height) * 100;
};

const onFcPointerEnter = () => {
  isPreviewHovered.value = true;
};

const onFcPointerLeave = () => {
  isPreviewHovered.value = false;
  tiltX.value = 0;
  tiltY.value = 0;
};

// 保存时触发显影动画
const triggerDeveloping = () => {
  isDeveloping.value = true;
  setTimeout(() => {
    isDeveloping.value = false;
  }, 900);
};

const dirty = computed(() => currentBg.value !== initialBg.value);

const regeneratePreview = async (bgUrl: string) => {
  const seq = ++previewSeq;
  previewReady.value = false;
  try {
    const u = props.userInfo || ({} as UserInfo);
    const { canvas } = await renderFanProfileCanvas({
      nickName: u.nickName,
      fanSinceYear: u.fanSinceYear || '—',
      favoriteSong: u.favoriteSong || '—',
      fanBio: u.fanBio || '',
      fanTag: u.fanTag || '',
      posterBg: bgUrl,
      mark: u.mark || null,
    });
    if (seq !== previewSeq) return;
    canvas.classList.add('fc-preview-canvas');
    // previewBox 是 v-if 内的 ref，可能尚未挂载，等一帧
    if (!previewBox.value) await nextTick();
    if (seq !== previewSeq) return;
    if (previewBox.value) {
      previewBox.value.innerHTML = '';
      previewBox.value.appendChild(canvas);
      currentCanvas = canvas;
      previewReady.value = true;
    }
  } catch (e) {
    console.error('预览生成失败', e);
    if (seq === previewSeq) {
      // 失败也要解除"生成预览中..."占位，避免一直卡住
      previewReady.value = true;
      showToast('预览生成失败，请重试', 'error');
    }
  }
};

watch(
  () => props.isVisible,
  (v) => {
    if (v) {
      const bg = props.userInfo?.posterBg || '';
      currentBg.value = bg;
      initialBg.value = bg;
      if (!bg) {
        // 没有已保存背景：先随机一张，再渲染
        pickRandomPosterBgAsync().then((url) => {
          if (!props.isVisible) return;
          if (url) {
            currentBg.value = url;
            regeneratePreview(url);
          } else {
            regeneratePreview('');
          }
        });
      } else {
        // 已有背景：直接渲染（避免同值赋值导致 watch(currentBg) 不触发）
        regeneratePreview(bg);
      }
    } else {
      previewReady.value = false;
      currentCanvas = null;
      if (previewBox.value) previewBox.value.innerHTML = '';
    }
  },
  { immediate: true },
);

watch(currentBg, (bg, oldBg) => {
  if (props.isVisible && bg !== oldBg) regeneratePreview(bg);
});

onBeforeUnmount(() => {
  currentCanvas = null;
});

const close = () => emit('close');

const shuffle = async () => {
  if (isShuffling.value) return;
  isShuffling.value = true;
  try {
    const url = await pickRandomPosterBgAsync();
    if (url) currentBg.value = url;
  } catch (e) {
    showToast('换图失败，请重试', 'error');
  } finally {
    isShuffling.value = false;
  }
};

const save = async () => {
  if (!dirty.value || isSaving.value) return;
  isSaving.value = true;
  triggerDeveloping();
  try {
    await apiClient.post('/user/updatePosterBg', null, {
      params: {
        userId: props.userInfo.userId,
        posterBg: currentBg.value || '',
      },
    });
    initialBg.value = currentBg.value;
    showToast('背景已保存', 'success');
    emit('updated', currentBg.value);
  } catch (e) {
    console.error(e);
    showToast('保存失败，请重试', 'error');
  } finally {
    isSaving.value = false;
  }
};

const download = async () => {
  if (isDownloading.value) return;
  isDownloading.value = true;
  triggerDeveloping();
  try {
    const u = props.userInfo;
    let blob: Blob | null = null;
    // 优先从当前预览 canvas 直接转 blob，避免重新渲染
    if (currentCanvas) {
      blob = await new Promise<Blob | null>((resolve) =>
        currentCanvas!.toBlob((b) => resolve(b), 'image/png', 0.95),
      );
    }
    if (!blob) {
      const result = await generateFanProfilePoster({
        nickName: u.nickName,
        fanSinceYear: u.fanSinceYear || '—',
        favoriteSong: u.favoriteSong || '—',
        fanBio: u.fanBio || '',
        fanTag: u.fanTag || '',
        posterBg: currentBg.value,
        mark: u.mark || null,
      });
      blob = result.blob;
    }
    const safeName = (u.nickName || 'fan').replace(/[^\w\u4e00-\u9fa5]/g, '_');
    downloadFanProfilePoster(blob!, `gem-fan-card-${safeName}.png`);
    showToast('档案卡已下载', 'success');
  } catch (e) {
    console.error(e);
    showToast('下载失败，请重试', 'error');
  } finally {
    isDownloading.value = false;
  }
};
</script>

<style scoped>
.fc-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(circle at 50% 50%, rgba(40, 8, 60, 0.85), rgba(0, 0, 0, 0.85));
  backdrop-filter: blur(14px);
}

.fc-modal {
  position: relative;
  display: flex;
  gap: 36px;
  align-items: center;
  padding: 36px 44px 36px 36px;
  background: linear-gradient(160deg, rgba(35, 18, 55, 0.92), rgba(20, 12, 38, 0.92));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  max-width: 760px;
  width: 100%;
  animation: fcSlideIn 0.3s ease;
}

@keyframes fcSlideIn {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.fc-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  z-index: 3;
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
  line-height: 1;
}
.fc-close:hover {
  background: rgba(200, 80, 232, 0.45);
  transform: rotate(90deg);
}

/* 左：卡片预览 */
.fc-preview {
  position: relative;
  flex-shrink: 0;
  width: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fc-preview-glow {
  position: absolute;
  inset: -10%;
  background: radial-gradient(circle at 50% 50%, rgba(200, 80, 232, 0.35), transparent 60%);
  filter: blur(30px);
  pointer-events: none;
  z-index: 0;
}
.fc-preview-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 280px;
  /* 75:122 == 750:1220 与画布比例对齐，避免 loading 时容器坍塌 */
  aspect-ratio: 75 / 122;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 28px rgba(200, 80, 232, 0.22);
  border: 1px solid rgba(250, 204, 21, 0.32);
  background: rgba(0, 0, 0, 0.4);
}
.fc-preview-canvas-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
}
.fc-preview-box :deep(.fc-preview-canvas) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.fc-preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  letter-spacing: 1px;
  background: rgba(13, 6, 18, 0.55);
  backdrop-filter: blur(6px);
  z-index: 2;
  pointer-events: none;
}
.fc-loading-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(200, 80, 232, 0.25);
  border-top-color: #D946EF;
  animation: fcSpin 0.8s linear infinite;
}
@keyframes fcSpin {
  to { transform: rotate(360deg); }
}
.fc-loading-fade-enter-active,
.fc-loading-fade-leave-active { transition: opacity 0.2s; }
.fc-loading-fade-enter-from,
.fc-loading-fade-leave-to { opacity: 0; }

/* 右：信息面板 */
.fc-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 6px 0;
}

.fc-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fc-title {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #fff, #ffd6fb);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.fc-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.fc-tip-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}
.fc-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.4;
}
.fc-tip b { color: #fff; font-weight: 600; }
.fc-tip .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #D946EF;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(200, 80, 232, 0.7);
}
.fc-tip .dot.warn { background: #FACC15; box-shadow: 0 0 6px rgba(250, 204, 21, 0.7); }

.fc-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  padding: 12px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}
.btn-icon { font-size: 15px; }

.fc-btn.ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.14);
}
.fc-btn.ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.fc-btn.primary {
  background: linear-gradient(135deg, #D946EF, #A21CAF);
  color: #fff;
  box-shadow: 0 8px 22px rgba(200, 80, 232, 0.4);
}
.fc-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(200, 80, 232, 0.6);
  filter: brightness(1.08);
}

.fc-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fc-fade-enter-active,
.fc-fade-leave-active { transition: opacity 0.25s; }
.fc-fade-enter-from,
.fc-fade-leave-to { opacity: 0; }

/* ===== 3D 镭射倾斜效果 (Holographic Foil Card) ===== */
.fc-preview-3d {
  transform-style: preserve-3d;
  will-change: transform;
}

.fc-preview-3d .fc-preview-canvas-wrap {
  transform: translateZ(20px); /* 3D 视差：内容悬浮在卡片表面上方 */
}

/* 镭射高光反射层 */
.holo-shine {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  mix-blend-mode: color-dodge;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.35s ease;
}
.fc-preview-3d.is-active .holo-shine {
  opacity: 1;
}

/* 镭射彩虹膜层 */
.holo-foil {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  border-radius: inherit;
  background-image: linear-gradient(
    115deg,
    transparent 20%,
    rgba(200, 80, 232, 0.08) 35%,
    rgba(0, 204, 223, 0.08) 45%,
    rgba(250, 204, 21, 0.08) 55%,
    transparent 70%
  );
  background-size: 200% 200%;
  background-position: 0% 0%;
  mix-blend-mode: color-dodge;
  opacity: 0.25;
  transition: background-position 0.45s ease, opacity 0.35s ease;
}
.fc-preview-3d.is-active .holo-foil {
  background-position: 80% 80%;
  opacity: 0.65;
}

/* ===== 保存/下载时"显影中"过渡层 ===== */
.fc-develop-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(15, 8, 25, 0.82);
  backdrop-filter: blur(10px);
  border-radius: inherit;
  pointer-events: none;
}
.fc-develop-grain {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
  background-size: 128px 128px;
  animation: developGrain 0.6s steps(4) infinite;
}
@keyframes developGrain {
  0%, 100% { opacity: 0.04; }
  50% { opacity: 0.1; }
}
.fc-develop-text {
  position: relative;
  z-index: 1;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.fc-develop-sparkle {
  animation: developSparkle 0.8s ease-in-out infinite;
}
@keyframes developSparkle {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.3); opacity: 1; }
}
.fc-develop-fade-enter-active { transition: opacity 0.15s ease; }
.fc-develop-fade-leave-active { transition: opacity 0.35s ease; }
.fc-develop-fade-enter-from,
.fc-develop-fade-leave-to { opacity: 0; }

/* 响应式：平板/窄桌面 */
@media (max-width: 900px) {
  .fc-modal {
    gap: 24px;
    padding: 28px 28px 28px 24px;
    max-width: 680px;
  }
  .fc-preview { width: 240px; }
  .fc-title { font-size: 20px; }
}

/* 响应式：手机竖屏 */
@media (max-width: 640px) {
  .fc-mask { padding: 12px; align-items: flex-start; padding-top: 4vh; }
  .fc-modal {
    flex-direction: column;
    gap: 18px;
    padding: 44px 18px 20px;
    max-width: 100%;
    width: 100%;
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 20px;
  }
  .fc-close { top: 10px; right: 10px; }
  .fc-preview {
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
  }
  .fc-preview-box {
    max-width: 240px;
  }
  .fc-panel {
    gap: 14px;
    width: 100%;
    padding: 0;
  }
  .fc-header { align-items: center; text-align: center; gap: 4px; }
  .fc-title { font-size: 19px; letter-spacing: 0.5px; }
  .fc-subtitle { font-size: 12px; }
  .fc-tip-list {
    padding: 12px 14px;
    gap: 8px;
  }
  .fc-tip { font-size: 12px; }
  .fc-actions {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fc-actions .fc-btn {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
    padding: 11px 8px;
    font-size: 13px;
    gap: 6px;
  }
  .fc-actions .fc-btn.primary {
    flex-basis: 100%;
  }
  .btn-icon { font-size: 14px; }
}

/* 极窄屏（小屏手机） */
@media (max-width: 360px) {
  .fc-modal { padding: 40px 14px 18px; }
  .fc-preview-box { max-width: 220px; }
  .fc-actions .fc-btn { font-size: 12px; padding: 10px 6px; }
}
</style>
