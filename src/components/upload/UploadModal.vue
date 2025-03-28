<template>
    <div class="upload-modal">
        <!-- 投稿类型选择 -->
        <div class="upload-type-selector">
            <button 
                :class="['type-btn', { active: uploadType === 'quote' }]" 
                @click="uploadType = 'quote'"
            >
                <i class="fas fa-quote-right"></i>
                语录投稿
            </button>
            <button 
                :class="['type-btn', { active: uploadType === 'video' }]" 
                @click="uploadType = 'video'"
            >
                <i class="fas fa-video"></i>
                视频投稿
            </button>
        </div>

        <!-- 语录投稿表单 -->
        <div v-if="uploadType === 'quote'" class="upload-form">
            <div class="form-card">
                <div class="input-group">
                    <i class="fas fa-heading icon"></i>
                    <input 
                        v-model="quoteForm.title" 
                        type="text" 
                        placeholder="输入语录标题..."
                    >
                </div>
                
                <div class="upload-section">
                    <div class="images-container">
                        <!-- 已上传的图片预览 -->
                        <div v-for="(image, index) in quoteForm.images" :key="index" class="image-item">
                            <img :src="image.preview" alt="预览图">
                            <div class="image-overlay">
                                <button class="remove-btn" @click="removeImage(index)">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- 添加图片按钮 -->
                        <div 
                            v-if="quoteForm.images.length < 5" 
                            class="upload-area" 
                            @click="triggerImageUpload"
                        >
                            <input 
                                type="file" 
                                accept="image/*" 
                                @change="handleImageUpload"
                                ref="imageInput"
                                class="hidden-input"
                            >
                            <div class="upload-placeholder">
                                <i class="fas fa-plus"></i>
                                <p>添加图片</p>
                                <span>{{ quoteForm.images.length }}/5</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="submit-btn" @click="submitQuote">
                    <i class="fas fa-paper-plane"></i>
                    发布语录
                </button>
            </div>
        </div>

        <!-- 视频投稿表单 -->
        <div v-if="uploadType === 'video'" class="upload-form">
            <div class="form-card">
                <div class="input-group">
                    <i class="fas fa-heading icon"></i>
                    <input 
                        v-model="videoForm.title" 
                        type="text" 
                        placeholder="输入视频标题..."
                    >
                </div>

                <div class="input-group">
                    <i class="fas fa-pen icon"></i>
                    <textarea 
                        v-model="videoForm.description" 
                        placeholder="添加视频简介..."
                    ></textarea>
                </div>

                <div class="upload-section">
                    <div class="upload-area" @click="triggerVideoUpload">
                        <input 
                            type="file" 
                            accept="video/*" 
                            @change="handleVideoUpload"
                            ref="videoInput"
                            class="hidden-input"
                        >
                        <div v-if="!videoForm.videoPreview" class="upload-placeholder">
                            <i class="fas fa-film"></i>
                            <p>点击上传视频</p>
                            <span>支持 mp4、mov 格式</span>
                        </div>
                        <div v-else class="preview-container">
                            <video :src="videoForm.videoPreview" controls></video>
                            <div class="preview-overlay">
                                <button class="change-btn" @click.stop="triggerVideoUpload">
                                    更换视频
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tags-section">
                    <div class="input-group">
                        <i class="fas fa-tags icon"></i>
                        <input 
                            v-model="newTag"
                            @keyup.enter="addTag"
                            type="text" 
                            placeholder="输入标签后按回车添加..."
                            class="tag-input"
                        >
                    </div>
                    <div class="tags-list">
                        <span 
                            v-for="tag in videoForm.tags" 
                            :key="tag"
                            class="tag"
                        >
                            <span class="tag-text">{{ tag }}</span>
                            <span class="remove-tag" @click="removeTag(tag)">×</span>
                        </span>
                    </div>
                </div>

                <button class="submit-btn" @click="submitVideo">
                    <i class="fas fa-paper-plane"></i>
                    发布视频
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import apiClient from '@/utils/api'; // 替换成我们的API客户端
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const uploadType = ref('quote');
const newTag = ref('');

// 语录表单数据
interface ImageItem {
    file: File;
    preview: string;
}

const quoteForm = reactive({
    title: '',
    images: [] as ImageItem[]
});

// 视频表单数据
const videoForm = reactive({
    title: '',
    description: '',
    video: null as File | null,
    videoPreview: '',
    tags: [] as string[]
});

// 处理图片上传
const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        if (quoteForm.images.length >= 5) {
            alert('最多只能上传5张图片');
            return;
        }
        
        const file = input.files[0];
        const preview = URL.createObjectURL(file);
        quoteForm.images.push({
            file,
            preview
        });
        
        // 清空input，以便可以重复选择同一文件
        input.value = '';
    }
};

// 处理视频上传
const handleVideoUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        videoForm.video = input.files[0];
        videoForm.videoPreview = URL.createObjectURL(input.files[0]);
    }
};

// 添加标签
const addTag = () => {
    if (newTag.value && !videoForm.tags.includes(newTag.value)) {
        videoForm.tags.push(newTag.value);
        newTag.value = '';
    }
};

// 移除标签
const removeTag = (tagToRemove: string) => {
    videoForm.tags = videoForm.tags.filter(tag => tag !== tagToRemove);
};

// 移除图片
const removeImage = (index: number) => {
    URL.revokeObjectURL(quoteForm.images[index].preview); // 释放URL对象
    quoteForm.images.splice(index, 1);
};

// 提交语录
const submitQuote = async () => {
    if (!quoteForm.title || quoteForm.images.length === 0) {
        alert('请填写标题并至少上传一张图片');
        return;
    }

    const formData = new FormData();
    formData.append('title', quoteForm.title);
    formData.append('userId', userStore.userId);
    quoteForm.images.forEach(image => {
        formData.append('images', image.file);
    });

    try {
        await apiClient.post('/quote/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        alert('语录发布成功！');
        // 重置表单
        quoteForm.title = '';
        quoteForm.images.forEach(image => URL.revokeObjectURL(image.preview));
        quoteForm.images = [];
    } catch (error) {
        alert('发布失败，请重试');
    }
};

// 提交视频
const submitVideo = async () => {
    if (!videoForm.title || !videoForm.video) {
        alert('请填写完整信息');
        return;
    }

    const formData = new FormData();
    formData.append('title', videoForm.title);
    formData.append('description', videoForm.description);
    formData.append('video', videoForm.video);
    formData.append('tags', JSON.stringify(videoForm.tags));

    try {
        await apiClient.post('/video/upload', formData);
        alert('视频发布成功！');
        // 重置表单
        videoForm.title = '';
        videoForm.description = '';
        videoForm.video = null;
        videoForm.videoPreview = '';
        videoForm.tags = [];
    } catch (error) {
        alert('发布失败，请重试');
    }
};

const triggerImageUpload = () => {
    document.querySelector('input[accept="image/*"]').click();
};

const triggerVideoUpload = () => {
    document.querySelector('input[accept="video/*"]').click();
};
</script>

<style scoped>
.upload-modal {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.upload-type-selector {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
}

.type-btn {
    flex: 1;
    padding: 15px;
    border: none;
    border-radius: 12px;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.type-btn i {
    font-size: 18px;
}

.type-btn.active {
    background: linear-gradient(135deg, #eb07ee, #a505de);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(235, 7, 238, 0.3);
}

.form-card {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
}

.input-group {
    position: relative;
    margin-bottom: 20px;
}

.input-group .icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 18px;
}

.input-group input,
.input-group textarea {
    width: 100%;
    padding: 15px 15px 15px 45px;
    border: 1px solid #eee;
    border-radius: 12px;
    font-size: 15px;
    transition: all 0.3s;
    background: #f8f8f8;
}

.input-group textarea {
    min-height: 120px;
    resize: vertical;
}

.input-group input:focus,
.input-group textarea:focus {
    outline: none;
    border-color: #eb07ee;
    background: white;
    box-shadow: 0 0 0 3px rgba(235, 7, 238, 0.1);
}

.upload-section {
    margin: 30px 0;
}

.images-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.image-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s;
}

.image-item:hover .image-overlay {
    opacity: 1;
}

.remove-btn {
    background: #ff4444;
    color: white;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
}

.remove-btn:hover {
    transform: scale(1.1);
    background: #ff2020;
}

.upload-area {
    aspect-ratio: 1;
    border: 2px dashed #ddd;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
}

.upload-area:hover {
    border-color: #eb07ee;
    background: rgba(235, 7, 238, 0.02);
}

.upload-placeholder {
    text-align: center;
    color: #666;
}

.upload-placeholder i {
    font-size: 24px;
    margin-bottom: 8px;
    color: #eb07ee;
}

.upload-placeholder p {
    margin: 5px 0;
    font-size: 14px;
}

.upload-placeholder span {
    font-size: 12px;
    color: #999;
}

.hidden-input {
    display: none;
}

.preview-container {
    position: relative;
}

.preview-container img,
.preview-container video {
    max-width: 100%;
    border-radius: 12px;
}

.preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s;
    border-radius: 12px;
}

.preview-container:hover .preview-overlay {
    opacity: 1;
}

.change-btn {
    background: white;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
}

.change-btn:hover {
    transform: scale(1.05);
}

.tags-section {
    margin-bottom: 30px;
}

.tags-section .input-group input {
    padding-right: 15px;
}

.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 15px;
    padding: 5px;
}

.tag {
    background: linear-gradient(135deg, #eb07ee20, #a505de20);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
    border: 1px solid #eb07ee40;
}

.tag:hover {
    background: linear-gradient(135deg, #eb07ee30, #a505de30);
    transform: translateY(-1px);
}

.tag-text {
    color: #333;
}

.remove-tag {
    cursor: pointer;
    color: #666;
    font-size: 16px;
    font-weight: bold;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
}

.remove-tag:hover {
    background: #ff4444;
    color: white;
}

.tag-input {
    width: 100%;
    padding: 15px 15px 15px 45px;
    border: 1px solid #eee;
    border-radius: 12px;
    font-size: 15px;
    transition: all 0.3s;
    background: #f8f8f8;
}

.tag-input:focus {
    outline: none;
    border-color: #eb07ee;
    background: white;
    box-shadow: 0 0 0 3px rgba(235, 7, 238, 0.1);
}

.submit-btn {
    width: 100%;
    background: linear-gradient(135deg, #eb07ee, #a505de);
    color: white;
    border: none;
    padding: 15px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(235, 7, 238, 0.3);
}

@media (max-width: 768px) {
    .upload-modal {
        padding: 10px;
    }
    
    .form-card {
        padding: 20px;
    }
}
</style>
