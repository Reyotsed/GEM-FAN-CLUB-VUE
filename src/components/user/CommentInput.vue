<template>
    <div class="comment-input">
        <textarea 
            v-model="comment" 
            placeholder="写下你的评论..."
            rows="3"
        ></textarea>
        <div class="comment-tools">
            <div class="emoji-picker">
                <button type="button" class="emoji-button" @click="toggleEmojiPicker">
                    😊
                </button>
                <div v-if="showEmojiPicker" class="emoji-dropdown">
                    <div class="emoji-scroll-container">
                        <div class="emoji-grid">
                            <button 
                                v-for="(emoji, index) in emojis" 
                                :key="index" 
                                class="emoji-item" 
                                @click="addEmoji(emoji)"
                            >
                                {{ emoji }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <button @click="submitComment" class="submit-comment">发表评论</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    isLoggedIn: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['submit']);

const comment = ref('');
const showEmojiPicker = ref(false);

const emojis = [
    '🌺', '🌸', '🌼', '🌻', '🍀', '🌿', '🌱', '🌳',
    '🍕', '🍔', '🍟', '🌭', '🍿', '🧃', '🥤', '🍺',
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏸', '🏓', '🎯',
    '🎮', '🎲', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼',
    '🚗', '🚕', '🚌', '🚅', '✈️', '🚀', '🚢', '🚲',
    '😊', '😂', '🥰', '😍', '😒', '😢', '😭', '😡', 
    '👍', '👎', '❤️', '🔥', '✨', '🎉', '🤔', '🙄',
    '😴', '🤗', '🤫', '🤐', '😷', '🤒', '👨‍💻', '👩‍💻',
    '😎', '🤓', '😇', '🤠', '😈', '👻', '👽', '🤖',
    '🐶', '🐱', '🐼', '🦁', '🐯', '🦊', '🐸', '🐙'
];

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
};

const addEmoji = (emoji) => {
    comment.value += emoji;
    showEmojiPicker.value = false;
};

const submitComment = () => {
    if (!comment.value.trim()) return;
    
    emit('submit', comment.value);
    comment.value = '';
};

// 点击页面其他地方关闭表情选择器
const closeEmojiPicker = (event) => {
    if (showEmojiPicker.value && !event.target.closest('.emoji-picker')) {
        showEmojiPicker.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', closeEmojiPicker);
});

onUnmounted(() => {
    document.removeEventListener('click', closeEmojiPicker);
});
</script>

<style scoped>
.comment-input {
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

textarea {
    width: 100%;
    padding: 12px;
    border: none;
    border-bottom: 1px solid #eee;
    resize: none;
    font-size: 14px;
    outline: none;
}

.comment-tools {
    display: flex;
    padding: 8px;
    align-items: center;
    background-color: #f9f9f9;
}

.emoji-picker {
    position: relative;
    margin-right: auto;
}

.emoji-button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.emoji-button:hover {
    background-color: #eee;
}

/* 表情选择器样式 */
.emoji-dropdown {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 8px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: fadeIn 0.2s;
    width: 320px;
    height: 280px;
    overflow: hidden; /* 隐藏外部容器的滚动条 */
}

.emoji-scroll-container {
    width: 100%;
    height: 100%;
    overflow-y: auto; /* 内部容器可滚动 */
    padding: 12px;
}

.emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
    padding-bottom: 20px;
}

.emoji-item {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.emoji-item:hover {
    background-color: #f0f0f0;
    transform: scale(1.1);
}

/* 自定义滚动条 */
.emoji-scroll-container::-webkit-scrollbar {
    width: 8px;
}

.emoji-scroll-container::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 4px;
}

.emoji-scroll-container::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 4px;
}

.emoji-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #ccc;
}

.submit-comment {
    background: #ff2442;
    color: white;
    border: none;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 4px;
}

.submit-comment:hover {
    background: #e6213c;
}
</style> 