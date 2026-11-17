<template>
  <Teleport to="body">
    <transition name="ep-fade">
      <div class="edit-profile-modal" v-if="isVisible" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="header-left">
              <div class="header-title">编辑个人资料</div>
              <div class="header-sub">让你的主页更有辨识度 ✨</div>
            </div>
            <button class="close-button" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <!-- 头像 -->
            <div class="avatar-section">
              <div class="avatar-wrap" @click="triggerFileInput">
                <img
                  :src="previewAvatar || userInfo.avatar"
                  alt="当前头像"
                  class="current-avatar"
                  loading="lazy"
                />
                <div class="avatar-mask">
                  <span>更换头像</span>
                </div>
              </div>
              <input
                type="file"
                ref="fileInput"
                id="avatar-upload"
                accept="image/*"
                @change="handleAvatarChange"
                style="display: none"
              />
            </div>

            <!-- 基础信息 -->
            <div class="form-card">
              <div class="card-title">基础信息</div>
              <div class="form-grid">
                <div class="field">
                  <label>昵称</label>
                  <input type="text" v-model="formData.nickName" placeholder="输入新昵称" maxlength="20" />
                </div>
                <div class="field">
                  <label>生日</label>
                  <input type="date" v-model="formData.birthday" />
                </div>
                <div class="field full">
                  <label>个人简介</label>
                  <textarea
                    v-model="formData.personIntroduction"
                    placeholder="介绍一下自己吧~"
                    rows="3"
                    maxlength="200"
                  ></textarea>
                  <div class="counter">{{ (formData.personIntroduction || '').length }}/200</div>
                </div>
              </div>
            </div>

            <!-- 粉丝身份 -->
            <div class="form-card">
              <div class="card-title">
                粉丝身份
                <span class="card-tip">这些信息会显示在你的粉丝档案卡上</span>
              </div>
              <div class="form-grid">
                <div class="field">
                  <label>入坑年份</label>
                  <input
                    type="number"
                    v-model.number="formData.fanSinceYear"
                    placeholder="例如 2014"
                    :min="1990"
                    :max="currentYear"
                  />
                </div>
                <div class="field">
                  <label>本命金曲</label>
                  <input type="text" v-model="formData.favoriteSong" placeholder="如：泡沫" maxlength="30" />
                </div>
                <div class="field full">
                  <label>专属宣言</label>
                  <input
                    type="text"
                    v-model="formData.fanBio"
                    placeholder="一句话表达你对她的爱"
                    maxlength="40"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="cancel-button" @click="closeModal">取消</button>
            <button class="save-button" @click="saveChanges" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import apiClient from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { showToast } from '@/utils/toast';

interface UserInfo {
  userId: string;
  nickName: string;
  avatar: string;
  birthday: string;
  personIntroduction: string;
  fanSinceYear?: number | null;
  favoriteSong?: string | null;
  fanBio?: string | null;
  fanTag?: string | null;
  posterBg?: string | null;
}

const props = defineProps<{
  isVisible: boolean;
  userInfo: UserInfo;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const userStore = useUserStore();
const fileInput = ref<HTMLInputElement | null>(null);
const currentYear = new Date().getFullYear();

const formData = reactive<{
  nickName: string;
  birthday: string;
  personIntroduction: string;
  fanSinceYear: number | null;
  favoriteSong: string;
  fanBio: string;
}>({
  nickName: '',
  birthday: '',
  personIntroduction: '',
  fanSinceYear: null,
  favoriteSong: '',
  fanBio: '',
});

const avatarFile = ref<File | null>(null);
const previewAvatar = ref<string | null>(null);
const isSaving = ref(false);

const initFormData = () => {
  formData.nickName = props.userInfo.nickName || '';
  formData.birthday = props.userInfo.birthday || '';
  formData.personIntroduction = props.userInfo.personIntroduction || '';
  formData.fanSinceYear = (props.userInfo.fanSinceYear as number | null) ?? null;
  formData.favoriteSong = props.userInfo.favoriteSong || '';
  formData.fanBio = props.userInfo.fanBio || '';
  avatarFile.value = null;
  previewAvatar.value = null;
};

watch(
  () => props.isVisible,
  (v) => {
    if (v && props.userInfo) initFormData();
  },
  { immediate: true },
);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleAvatarChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    compressAvatar(target.files[0]).then((compressedFile) => {
      avatarFile.value = compressedFile;
      previewAvatar.value = URL.createObjectURL(compressedFile);
    });
  }
};

const compressAvatar = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const SIZE = 200;
        canvas.width = SIZE;
        canvas.height = SIZE;
        if (ctx) {
          ctx.beginPath();
          ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 0, 0, SIZE, SIZE);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '.webp'),
                  { type: 'image/webp', lastModified: Date.now() },
                );
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.8,
          );
        } else {
          resolve(file);
        }
      };
    };
  });
};

const closeModal = () => emit('close');

const saveChanges = async () => {
  try {
    isSaving.value = true;

    const params: Record<string, any> = {
      userId: props.userInfo.userId,
      nickName: formData.nickName,
      birthday: formData.birthday,
      personIntroduction: formData.personIntroduction,
      favoriteSong: formData.favoriteSong || '',
      fanBio: formData.fanBio || '',
    };
    if (formData.fanSinceYear != null && !Number.isNaN(formData.fanSinceYear)) {
      params.fanSinceYear = formData.fanSinceYear;
    }

    await apiClient.post('/user/updateUserInfo', null, { params });

    if (avatarFile.value) {
      const formDataAvatar = new FormData();
      formDataAvatar.append('image', avatarFile.value);
      const avatarResponse = await apiClient.post('/user/updateAvatar', formDataAvatar, {
        params: { userId: props.userInfo.userId },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (avatarResponse.data.code === 200) {
        const avatarPath = avatarResponse.data.data;
        const avatarUrl = await apiClient.getImageUrl(avatarPath);
        userStore.setAvatar(avatarUrl);
      }
    }

    if (formData.nickName !== props.userInfo.nickName) {
      userStore.setNickName(formData.nickName);
    }

    showToast('保存成功', 'success');
    emit('updated');
    closeModal();
  } catch (error) {
    console.error('保存个人信息失败', error);
    showToast('保存失败，请重试', 'error');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.edit-profile-modal {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(10px);
  padding: 20px;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, rgba(35, 18, 55, 0.96), rgba(20, 12, 38, 0.96));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateY(-16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.1rem 1.5rem;
  background: linear-gradient(135deg, rgba(200, 80, 232, 0.45), rgba(120, 5, 222, 0.45));
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.header-title { font-size: 1.15rem; font-weight: 700; letter-spacing: 0.5px; }
.header-sub { font-size: 0.78rem; color: rgba(255, 255, 255, 0.7); margin-top: 2px; }

.close-button {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #fff;
  width: 32px; height: 32px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
  line-height: 1;
}
.close-button:hover { background: rgba(255, 255, 255, 0.18); transform: rotate(90deg); }

.modal-body {
  padding: 1.4rem 1.5rem;
  overflow-y: auto;
  scrollbar-width: thin;
}
.modal-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }

/* 头像 */
.avatar-section {
  display: flex; justify-content: center;
  margin-bottom: 1.4rem;
}
.avatar-wrap {
  position: relative;
  width: 96px; height: 96px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  border: 3px solid rgba(200, 80, 232, 0.4);
  box-shadow: 0 6px 22px rgba(200, 80, 232, 0.25);
  transition: transform 0.25s;
}
.avatar-wrap:hover { transform: scale(1.04); }
.current-avatar { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-mask {
  position: absolute; inset: 0;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; letter-spacing: 1px;
  opacity: 0;
  transition: opacity 0.2s;
}
.avatar-wrap:hover .avatar-mask { opacity: 1; }

/* 表单卡片 */
.form-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 1rem 1.1rem 1.1rem;
  margin-bottom: 1rem;
}
.card-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 0.85rem;
  display: flex; align-items: center; gap: 8px;
}
.card-tip {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 400;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem 0.9rem;
}
.field { display: flex; flex-direction: column; position: relative; }
.field.full { grid-column: 1 / -1; }
.field label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 0.35rem;
  letter-spacing: 0.3px;
}
.field input,
.field textarea {
  width: 100%;
  padding: 0.62rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.9rem;
  font-family: inherit;
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.field input::placeholder,
.field textarea::placeholder { color: rgba(255, 255, 255, 0.28); }
.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: rgba(200, 80, 232, 0.6);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(200, 80, 232, 0.15);
}
.field textarea { resize: vertical; min-height: 76px; }
.field input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }

.counter {
  position: absolute;
  right: 6px;
  bottom: 6px;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.35);
  pointer-events: none;
}

/* 底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.9rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.18);
}
.cancel-button {
  padding: 0.55rem 1.4rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.7);
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.cancel-button:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }

.save-button {
  padding: 0.55rem 1.6rem;
  background: linear-gradient(135deg, #D946EF, #A21CAF);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}
.save-button:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(200, 80, 232, 0.4);
}
.save-button:disabled { opacity: 0.5; cursor: not-allowed; }

.ep-fade-enter-active,
.ep-fade-leave-active { transition: opacity 0.22s; }
.ep-fade-enter-from,
.ep-fade-leave-to { opacity: 0; }

@media (max-width: 576px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>