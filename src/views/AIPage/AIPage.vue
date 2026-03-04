<template>
    <div class="chat-container">
        <div class="chat-header">
            <div class="header-info">
                <div class="avatar">
                    <img src="/img/albumCover/8.jpg" alt="邓紫棋头像" class="avatar-img">
                    <div class="status-dot"></div>
                </div>
                <div class="user-info">
                    <h2>邓紫棋</h2>
                    <p class="status">在线</p>
                </div>
            </div>
            
            <!-- 清空对话按钮 -->
            <button @click="clearChatHistory" class="clear-chat-btn" title="清空对话历史">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="chat-body" ref="chatBodyRef">
            <div class="chat-welcome">
                <div class="welcome-avatar">
                    <img src="/img/albumCover/8.jpg" alt="邓紫棋头像" class="welcome-img">
                </div>
                <div class="welcome-text">
                    <h3>欢迎来到姐姐虚拟聊天室</h3>
                    <p>这里是AI模拟的邓紫棋，你可以和我聊聊天，我会用紫棋的语气和你互动~</p>
                    <p>（后端集成RAG技术，迭代中，需要大量数据，暂时达不到较好的效果，语音功能由于版权原因无法上线，想了解的可以私信站长）</p>
                    <p>（球球不要乱花token，维护这个网站已经让站长穷到吃吐了）</p>
                </div>
            </div>
            
            <div v-for="(message, index) in messages" :key="index" 
                :class="['message-wrapper', message.sender === 'user' ? 'user-message' : 'ai-message']">
                <div class="message-avatar" v-if="message.sender === 'ai'">
                    <img src="/img/albumCover/8.jpg" alt="邓紫棋头像" class="avatar-img-small">
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>{{ message.text }}</p>
                    </div>
                </div>
                <span class="message-time">{{ message.time }}</span>
                <div class="message-avatar user-avatar" v-if="message.sender === 'user'">
                    <div class="user-avatar-placeholder" v-if="!userStore.isLoggedIn">
                        <i class="fas fa-user"></i>
                    </div>
                    <img v-else :src="userStore.avatar" alt="用户头像" class="avatar-img-small">
                </div>
            </div>
            
            <div class="typing-indicator" v-if="isTyping">
                <div class="typing-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span>姐姐正在输入...</span>
            </div>
            
            <!-- 上下文截断警告 -->
            <div class="context-warning" v-if="contextWarning">
                <div class="warning-bubble">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>对话历史较长，已自动截断以保持上下文清晰</span>
                </div>
            </div>
        </div>
        
        <div class="chat-footer">
            <div class="input-container">
                <textarea 
                    ref="inputRef"
                    v-model="userInput" 
                    :placeholder="userStore.isLoggedIn ? `发送消息...` : `发送消息给邓紫棋...`" 
                    @keydown.enter.prevent="sendMessage" 
                    :disabled="isTyping"
                    rows="1"
                    class="chat-input"
                ></textarea>
                <button @click="sendMessage" class="send-btn" :disabled="isTyping || !userInput.trim()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
            <div class="chat-hints">
                <div class="hint-label">试着问问：</div>
                <div class="hint-buttons">
                    <button 
                        v-for="(hint, index) in hints" 
                        :key="index" 
                        @click="useHint(hint)"
                        class="hint-btn"
                    >
                        {{ hint }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import apiClient from '@/utils/api';
import { useUserStore } from '@/stores/user';

// 获取用户状态
const userStore = useUserStore();

// 状态变量
const userInput = ref('');
const messages = ref([]);
const isTyping = ref(false);
const chatBodyRef = ref(null);
const inputRef = ref(null);
// 保存完整的对话历史，用于API调用
const chatHistory = ref([
]);

// 上下文管理相关变量
const maxContextLength = ref(20); // 最大上下文长度（包括system message）
const contextWarning = ref(false); // 上下文长度警告

// 一些预设的提示问题
const hints = [
    '你最喜欢的歌是什么？',
    '平时有什么爱好？',
    '新专辑什么时候发行？',
    '你创作灵感来自哪里？',
    '最近有什么新计划？'
];

/*
 * 使用说明：
 * 1. 确保后端服务已启动，并提供 /ai/answer 接口
 * 2. 后端接口需要接收 question 和 history 参数
 * 3. 后端接口返回格式应为 { code: 200, message: "success", answer: "AI回复内容" }
 * 4. 前端会维护对话历史并管理上下文长度
 */

// Manage conversation context length
function manageContext() {
    if (chatHistory.value.length > maxContextLength.value) {
        // Keep the welcome message (first assistant message) and most recent messages
        const welcomeMessage = chatHistory.value[0];
        // Keep an even number of recent messages to preserve user-assistant pairs
        const keepCount = maxContextLength.value - 1;
        const recentMessages = chatHistory.value.slice(-keepCount);
        chatHistory.value = [welcomeMessage, ...recentMessages];
        
        // Show context truncation warning
        contextWarning.value = true;
        setTimeout(() => {
            contextWarning.value = false;
        }, 5000);
        
        console.log('Context truncated, keeping recent messages');
    }
}

// 当用户使用预设提示
function useHint(hint) {
    userInput.value = hint;
    nextTick(() => {
        inputRef.value.focus();
    });
}

// 发送消息逻辑
async function sendMessage() {
    if (!userInput.value.trim() || isTyping.value) return;
    
    const messageText = userInput.value;
    userInput.value = '';
    
    // 添加用户消息到界面显示
    messages.value.push({
        text: messageText,
        sender: 'user',
        time: formatTime(new Date())
    });
    
    // 添加用户消息到对话历史
    chatHistory.value.push({
        role: "user",
        content: messageText
    });
    
    // 管理上下文长度
    manageContext();
    
    // 自动滚动到底部
    await scrollToBottom();
    
    // 显示typing状态
    isTyping.value = true;
    
    try {
        // 调用后端AI接口
        const aiResponse = await callBackendAI(chatHistory.value);
        
        // 添加AI回复到对话历史
        chatHistory.value.push({
            role: "assistant",
            content: aiResponse
        });
        
        // 再次管理上下文长度
        manageContext();
        
        // Add AI response to display
        messages.value.push({
            text: aiResponse,
            sender: 'ai',
            time: formatTime(new Date())
        });
        
        isTyping.value = false;
        await scrollToBottom();
        
    } catch (error) {
        console.error('聊天出错:', error);
        isTyping.value = false;
        
        // 发生错误时添加错误消息
        messages.value.push({
            text: '啊，好像遇到了一些问题...可以稍后再试吗？😥',
            sender: 'ai',
            time: formatTime(new Date())
        });
        
        await scrollToBottom();
    }
}

// 格式化时间显示
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 滚动到底部
async function scrollToBottom() {
    await nextTick();
    if (chatBodyRef.value) {
        chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
    }
}

// 自动调整输入框高度
watch(userInput, () => {
    nextTick(() => {
        const textarea = inputRef.value;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    });
});

// 调用后端AI接口的函数
async function callBackendAI(messageHistory) {
    // 调用后端AI接口
    try {
        
        console.log('当前上下文长度:', messageHistory.length);
        
        // Convert message history to the format required by backend API
        // Skip welcome message (index 0) and current question (last message)
        // Send all intermediate user/assistant messages as history
        const history = [];
        for (let i = 1; i < messageHistory.length - 1; i++) {
            const msg = messageHistory[i];
            if (msg && msg.role && msg.content) {
                history.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }
        console.log('发送到后端AI接口的消息历史:', history);
        // 获取当前用户的问题（最后一条用户消息）
        const currentQuestion = messageHistory[messageHistory.length - 1].content;
        
        const payload = {
            question: currentQuestion,
            history: history // history本身就是JS对象数组，直接使用
        };
        
        const response = await apiClient.post('/ai/answer', payload);
        
        // 检查响应状态
        if (response.data.code === 200) {
            const aiResponse = response.data.data;
            console.log('后端AI接口响应:', response);
            return aiResponse;
        } else if (response.data.code === 429) {
            // Rate limited
            return response.data.message || '请求太频繁啦，请稍后再试～ 😅';
        } else {
            return response.data.message || '啊，好像遇到了一些问题...可以稍后再试吗？😥';
        }
        
    } catch (error) {
        console.error("后端AI接口调用错误:", error);
        
        // 根据错误类型提供不同的错误信息
        let errorMessage = '啊，好像遇到了一些问题...可以稍后再试吗？😥';
        
        if (error.response) {
            // 服务器响应了错误状态码
            if (error.response.status === 401) {
                errorMessage = '认证失败，请重新登录 😅';
            } else if (error.response.status === 429) {
                errorMessage = '请求太频繁了，请稍等一下再试 😅';
            } else if (error.response.status >= 500) {
                errorMessage = '服务器暂时不可用，请稍后再试 😅';
            } else if (error.response.data && error.response.data.message) {
                errorMessage = `请求失败: ${error.response.data.message} 😅`;
            }
        } else if (error.request) {
            // 请求发送了但没有收到响应
            errorMessage = '网络连接超时，请检查网络后重试 😅';
        } else if (error.message) {
            // 其他错误
            errorMessage = `请求出错: ${error.message} 😅`;
        }
        
        // 出错时返回随机回复作为后备
        return errorMessage;
    }
}

// 清空对话历史的函数
function clearChatHistory() {
    // 完全清空所有内容
    messages.value = [];
    chatHistory.value = [];
    contextWarning.value = false;
    
    // 可选：重新添加欢迎消息（如果你希望保留欢迎消息，取消下面的注释）
    /*
    setTimeout(async () => {
        let initialMessage = '';
        
        if (userStore.isLoggedIn) {
            initialMessage = `嗨！${userStore.nickName}～ 很高兴能和你聊天！有什么想和我分享的吗？😊`;
        } else {
            initialMessage = '嗨！我是邓紫棋～ 很高兴能和你聊天！有什么想和我分享的吗？😊';
        }
        
        messages.value.push({
            text: initialMessage,
            sender: 'ai',
            time: formatTime(new Date())
        });
        
        // 也添加到对话历史中
        chatHistory.value.push({
            role: "assistant",
            content: initialMessage
        });
        
        await scrollToBottom();
    }, 500);
    */
}

// 当组件挂载完成后
onMounted(() => {
    // 添加初始欢迎消息
    setTimeout(async () => {
        let initialMessage = '';
        
        if (userStore.isLoggedIn) {
            initialMessage = `嗨！${userStore.nickName}～ 很高兴能和你聊天！有什么想和我分享的吗？😊`;
        } else {
            initialMessage = '嗨！我是邓紫棋～ 很高兴能和你聊天！有什么想和我分享的吗？😊';
        }
        
        messages.value.push({
            text: initialMessage,
            sender: 'ai',
            time: formatTime(new Date())
        });
        
        // 也添加到对话历史中
        chatHistory.value.push({
            role: "assistant",
            content: initialMessage
        });
        
        await scrollToBottom();
    }, 1000);
    
    // 确保输入框自动获取焦点
    setTimeout(() => {
        inputRef.value?.focus();
    }, 1500);
});
</script>

<style scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--nav-height, 70px));
    height: calc(100vh - var(--nav-height, 70px));
    background: linear-gradient(135deg, #121232, #252550);
    position: fixed;
    top: var(--nav-height, 70px);
    left: 0;
    right: 0;
    bottom: 0;
    font-family: 'Arial', sans-serif;
    overflow: hidden;
    margin: 0;
    padding: 0;
    z-index: 10;
}

body {
    margin: 0;
    padding: 0;
    overflow: hidden;
}

.chat-header {
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-info {
    display: flex;
    align-items: center;
}

.avatar {
    position: relative;
    margin-right: 16px;
}

.avatar-img {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.avatar-img:hover {
    transform: scale(1.05);
    border-color: #f06292;
}

.status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 14px;
    height: 14px;
    background-color: #4CAF50;
    border-radius: 50%;
    border: 2px solid rgba(0, 0, 0, 0.5);
    box-shadow: 0 0 8px #4CAF50;
}

.user-info h2 {
    margin: 0;
    color: white;
    font-size: 20px;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.5px;
}

.status {
    margin: 5px 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
}

.clear-chat-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 18px;
    color: white;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-chat-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.clear-chat-btn:active {
    transform: translateY(0);
}

.clear-chat-btn i {
    font-size: 16px;
}

.chat-body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background-image: 
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.04) 1px, transparent 0),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.04) 1px, transparent 0);
    background-size: 30px 30px;
    background-position: 0 0;
}

.chat-welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    margin: 20px auto;
    background: rgba(255, 255, 255, 0.07);
    border-radius: 20px;
    max-width: 500px;
    text-align: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(0);
    animation: welcome-fade-in 0.8s ease;
}

@keyframes welcome-fade-in {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.welcome-avatar {
    margin-bottom: 20px;
}

.welcome-img {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 3px solid #f06292;
    box-shadow: 0 5px 15px rgba(240, 98, 146, 0.4);
    transition: all 0.3s ease;
}

.welcome-img:hover {
    transform: scale(1.05) rotate(5deg);
    box-shadow: 0 8px 20px rgba(240, 98, 146, 0.6);
}

.welcome-text h3 {
    margin-top: 0;
    color: white;
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 15px;
    background: linear-gradient(90deg, #f06292, #ba68c8);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.welcome-text p {
    color: rgba(255, 255, 255, 0.9);
    margin: 8px 0;
    font-size: 15px;
    line-height: 1.6;
}

.message-wrapper {
    display: flex;
    margin-bottom: 4px;
    align-items: flex-end;
    transition: all 0.3s ease;
    animation: message-fade-in 0.5s ease;
    position: relative;
}

@keyframes message-fade-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.user-message {
    justify-content: flex-end;
    width: 100%;
}

.ai-message {
    justify-content: flex-start;
    width: 100%;
}

.message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 10px;
    flex-shrink: 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.1);
}

.avatar-img-small {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
}

.user-avatar .avatar-img-small {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.message-content {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    position: relative;
}

.user-message .message-content {
    align-items: flex-end; /* 用户消息右对齐 */
}

.ai-message .message-content {
    align-items: flex-start; /* AI消息左对齐 */
}

.message-bubble {
    padding: 12px 16px;
    border-radius: 20px;
    position: relative;
    word-break: break-word;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    text-align: left;
}

.message-bubble:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.user-message .message-bubble {
    background: linear-gradient(135deg, #5c6bc0, #3949ab);
    color: white;
    border-bottom-right-radius: 4px;
}

.ai-message .message-bubble {
    background: linear-gradient(135deg, #f06292, #ec407a);
    color: white;
    border-bottom-left-radius: 4px;
}

.message-bubble p {
    margin: 0;
    line-height: 1.6;
    font-size: 15px;
    text-align: left;
}

.message-time {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 4px;
    align-self: flex-end;
    text-align: right;
}

.typing-indicator {
    display: flex;
    align-items: center;
    margin-left: 60px;
    margin-top: -5px;
}

.typing-bubble {
    background: rgba(240, 98, 146, 0.7);
    padding: 10px 16px;
    border-radius: 18px;
    border-bottom-left-radius: 4px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.typing-dot {
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    margin: 0 3px;
    animation: typingAnimation 1.4s infinite ease-in-out;
    opacity: 0.9;
}

.typing-dot:nth-child(1) {
    animation-delay: 0s;
}

.typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typingAnimation {
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.6;
    }
    30% {
        transform: translateY(-6px);
        opacity: 1;
    }
}

.typing-indicator span {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    margin-left: 5px;
}

.context-warning {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}

.warning-bubble {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 15px;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.warning-bubble i {
    font-size: 16px;
    color: #ff9800; /* 警告颜色 */
}

.chat-footer {
    padding: 20px;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
}

.input-container {
    display: flex;
    align-items: flex-end;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 10px 18px;
    margin-bottom: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}

.input-container:focus-within {
    background: rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.chat-input {
    flex: 1;
    background: transparent;
    border: none;
    color: white;
    font-size: 16px;
    resize: none;
    padding: 8px 0;
    max-height: 120px;
    line-height: 1.5;
    font-family: inherit;
}

.chat-input:focus {
    outline: none;
}

.chat-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

.send-btn {
    background: linear-gradient(135deg, #f06292, #ec407a);
    color: white;
    border: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    margin-left: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    box-shadow: 0 3px 8px rgba(236, 64, 122, 0.3);
}

.send-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #ec407a, #d81b60);
    transform: scale(1.05) rotate(5deg);
    box-shadow: 0 5px 15px rgba(236, 64, 122, 0.4);
}

.send-btn:disabled {
    background: linear-gradient(135deg, rgba(240, 98, 146, 0.5), rgba(236, 64, 122, 0.5));
    cursor: not-allowed;
    box-shadow: none;
}

.send-btn i {
    font-size: 18px;
}

.chat-hints {
    display: flex;
    align-items: center;
    overflow-x: auto;
    padding: 5px 0 10px;
}

.hint-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin-right: 14px;
    white-space: nowrap;
    font-weight: 500;
}

.hint-buttons {
    display: flex;
    gap: 10px;
}

.hint-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 18px;
    color: white;
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.hint-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.hint-btn:active {
    transform: translateY(0);
}

::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .chat-header {
        flex-direction: column;
        gap: 15px;
        padding: 12px 16px;
    }
    
    .header-info {
        justify-content: center;
    }
    
    .clear-chat-btn {
        padding: 6px 10px;
        font-size: 12px;
    }
    
    .chat-body {
        padding: 16px;
    }

    .message-content {
        max-width: 75%;
    }

    .chat-welcome {
        padding: 18px;
        margin: 10px auto;
    }

    .welcome-img {
        width: 70px;
        height: 70px;
    }

    .welcome-text h3 {
        font-size: 20px;
    }

    .chat-footer {
        padding: 15px;
    }

    .hint-buttons {
        gap: 8px;
    }

    .hint-btn {
        padding: 6px 12px;
        font-size: 12px;
    }

    .send-btn {
        width: 40px;
        height: 40px;
    }
    
    .warning-bubble {
        padding: 8px 16px;
        font-size: 12px;
        gap: 6px;
    }
    
    .warning-bubble i {
        font-size: 14px;
    }
}

@media (max-width: 480px) {
    .clear-chat-btn {
        padding: 5px 8px;
        font-size: 11px;
    }
    
    .hint-buttons {
        flex-wrap: wrap;
        gap: 6px;
    }
    
    .hint-btn {
        padding: 5px 10px;
        font-size: 11px;
    }
}
</style>