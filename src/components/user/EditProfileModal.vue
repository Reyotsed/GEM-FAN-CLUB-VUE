<template>
  <div class="edit-profile-modal" v-if="isVisible">
    <div class="modal-backdrop" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>修改个人信息</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <!-- 头像上传部分 -->
        <div class="avatar-section">
          <div class="current-avatar-container">
            <img :src="previewAvatar || userInfo.avatar" alt="当前头像" class="current-avatar">
          </div>
          <button class="avatar-upload-btn" @click="triggerFileInput">
            选择新头像
          </button>
          <input 
            type="file" 
            ref="fileInput"
            id="avatar-upload" 
            accept="image/*" 
            @change="handleAvatarChange"
            style="display: none"
          >
        </div>
        
        <!-- 表单部分 -->
        <div class="form-section">
          <!-- 昵称输入行 -->
          <div class="form-row">
            <label for="nickname">昵称</label>
            <div class="input-wrapper">
              <input 
                type="text" 
                id="nickname" 
                v-model="formData.nickName" 
                placeholder="输入新昵称"
              >
            </div>
          </div>
          
          <!-- 生日输入行 -->
          <div class="form-row">
            <label for="birthday">生日</label>
            <div class="input-wrapper">
              <input 
                type="date" 
                id="birthday" 
                v-model="formData.birthday"
              >
            </div>
          </div>
          
          <!-- 个人简介输入行 -->
          <div class="form-row">
            <label for="bio">个人简介</label>
            <div class="input-wrapper">
              <textarea 
                id="bio" 
                v-model="formData.personIntroduction" 
                placeholder="介绍一下自己吧~"
                rows="4"
              ></textarea>
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
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import apiClient from '@/utils/api';
import { useUserStore } from '@/stores/user';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'updated']);
const userStore = useUserStore();
const fileInput = ref(null);

// 表单数据
const formData = reactive({
  nickName: '',
  birthday: '',
  personIntroduction: '',
});

// 头像相关
const avatarFile = ref(null);
const previewAvatar = ref(null);
const isSaving = ref(false);

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click();
};

// 监听模态框显示状态
watch(() => props.isVisible, (newValue) => {
  if (newValue && props.userInfo) {
    initFormData();
  }
}, { immediate: true });

// 初始化表单数据
const initFormData = () => {
  formData.nickName = props.userInfo.nickName || '';
  formData.birthday = props.userInfo.birthday || '';
  formData.personIntroduction = props.userInfo.personIntroduction || '';
  // 清除之前选择的头像
  avatarFile.value = null;
  previewAvatar.value = null;
};

// 处理头像选择
const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    avatarFile.value = file;
    previewAvatar.value = URL.createObjectURL(file);
  }
};

// 关闭模态框
const closeModal = () => {
  emit('close');
};

// 保存修改
const saveChanges = async () => {
  try {
    isSaving.value = true;
    
    // 使用 URL 参数发送用户信息更新请求
    const response = await apiClient.post('/user/updateUserInfo', null, {
      params: {
        userId: props.userInfo.userId,
        nickName: formData.nickName,
        birthday: formData.birthday,
        personIntroduction: formData.personIntroduction // 使用后端字段名
      }
    });
    
    // 如果有新头像，上传头像
    if (avatarFile.value) {
      // 文件上传仍然需要使用 FormData
      const formDataAvatar = new FormData();
      formDataAvatar.append('file', avatarFile.value);
      
      // 但是不要将 userId 放在 FormData 中，而是作为 URL 参数传递
      const avatarResponse = await apiClient.post('/user/uploadAvatar', formDataAvatar, {
        params: {
          userId: props.userInfo.userId
        },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // 更新全局头像
      if (avatarResponse.data.code === 200) {
        // 获取新头像路径
        const avatarPath = avatarResponse.data.data;
        
        // 获取新头像
        const avatarBlob = await apiClient.get("/image/getImageByPath", {
          params: { path: avatarPath },
          responseType: 'blob'
        });
        
        // 更新全局用户信息
        userStore.setAvatar(URL.createObjectURL(avatarBlob.data));
      }
    }
    
    // 如果昵称发生变化，更新全局用户信息
    if (formData.nickName !== props.userInfo.nickName) {
      userStore.setNickName(formData.nickName);
    }
    
    // 通知父组件更新成功
    emit('updated');
    
    // 关闭模态框
    closeModal();
  } catch (error) {
    console.error('保存个人信息失败', error);
    alert('保存失败，请重试');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.edit-profile-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 1101;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.6rem;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.close-button:hover {
  transform: scale(1.1);
}

.modal-body {
  padding: 1.5rem;
}

/* 头像部分样式 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.current-avatar-container {
  margin-bottom: 0.8rem;
}

.current-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.avatar-upload-btn {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-upload-btn:hover {
  background-color: #e8e8e8;
}

/* 表单部分样式 */
.form-section {
  width: 100%;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 1.2rem;
  padding: 0 1.5rem;
}

.form-row label {
  flex: 0 0 20%;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
  margin-right: 1rem;
}

.input-wrapper {
  flex: 1;
  margin-right: 1.5rem;
}

.input-wrapper input, 
.input-wrapper textarea {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: #f9f9f9;
  transition: all 0.2s;
}

.input-wrapper input:focus, 
.input-wrapper textarea:focus {
  border-color: #eb07ee;
  outline: none;
  box-shadow: 0 0 0 2px rgba(235, 7, 238, 0.1);
  background-color: #fff;
}

.input-wrapper textarea {
  resize: vertical;
  min-height: 80px;
}

/* 底部按钮样式 */
.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
}

.cancel-button {
  padding: 0.6rem 2rem;
  background-color: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.cancel-button:hover {
  background-color: #e8e8e8;
}

.save-button {
  padding: 0.6rem 2rem;
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #d007d3, #9405c7);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 响应式调整 */
@media (max-width: 576px) {
  .form-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 0 1rem;
  }
  
  .form-row label {
    flex: none;
    width: 100%;
    margin-bottom: 0.5rem;
  }
  
  .input-wrapper {
    width: 100%;
    margin-right: 0;
  }
}
</style> 