<template>
    <div class="chat-container">
        <!-- 背景装饰粒子 -->
        <div class="bg-particles">
            <span class="particle" v-for="(style, n) in particleStyles" :key="n" :style="style"></span>
        </div>

        <div class="chat-header">
            <div class="header-info">
                <div class="avatar">
                    <div class="avatar-ring"></div>
                    <img src="/img/albumCover/8.jpg" alt="邓紫棋头像" class="avatar-img">
                    <div class="status-dot"></div>
                </div>
                <div class="user-info">
                    <h2>邓紫棋 <span class="ai-badge">AI</span></h2>
                    <p class="status"><span class="status-pulse"></span> 在线</p>
                </div>
            </div>
            
            <button @click="clearChatHistory" class="clear-chat-btn" title="清空对话历史">
                <i class="fas fa-trash"></i>
                <span class="btn-text">清空</span>
            </button>
        </div>
        
        <!-- 登录弹窗 -->
        <LoginModal ref="loginModalRef" />
        
        <div class="chat-body" ref="chatBodyRef">
            <div class="chat-welcome" v-if="showWelcome" :class="{ 'welcome-collapsed': welcomeCollapsed }">
                <button class="welcome-close" @click="showWelcome = false" title="关闭欢迎卡">
                    <i class="fas fa-times"></i>
                </button>
                <button class="welcome-toggle" @click="welcomeCollapsed = !welcomeCollapsed" :title="welcomeCollapsed ? '展开' : '收起'">
                    <i :class="welcomeCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i>
                </button>
                <div class="welcome-glow"></div>
                <div class="welcome-avatar">
                    <img src="/img/albumCover/8.jpg" alt="邓紫棋头像" class="welcome-img">
                    <div class="welcome-ring"></div>
                </div>
                <div class="welcome-text">
                    <h3>欢迎来到姐姐虚拟聊天室</h3>
                    <p class="welcome-main" v-show="!welcomeCollapsed">这里是AI模拟的邓紫棋，你可以和我聊聊天，我会用邓紫棋的语气和你互动~ <strong>NEW：</strong>现在还能让我发照片啦，试试说"来一张你的美照"📸</p>
                    <div class="welcome-notice" v-show="!welcomeCollapsed">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <p><strong>声明：</strong>本聊天室由 AI 大模型模仿邓紫棋语气生成回复，<strong>非本人言论</strong>，仅供粉丝娱乐，不代表邓紫棋本人观点。</p>
                            <p>持续迭代中，数据越多效果越好，欢迎粉丝们投喂语料～ 语音功能因版权原因暂未上线，感兴趣可以私信站长。每次对话都在烧token，站长已经穷到吃土了，请温柔对待本聊天室的余额 :)</p>
                        </div>
                    </div>
                </div>
                <div class="welcome-music-notes" v-show="!welcomeCollapsed">
                    <span v-for="n in 5" :key="n" class="music-note" :style="{ animationDelay: `${n * 0.6}s` }">&#9835;</span>
                </div>
            </div>
            
            <div v-for="(message, index) in messages" :key="index" 
                :class="['message-wrapper', message.sender === 'user' ? 'user-message' : 'ai-message']">
                <div class="message-avatar" v-if="message.sender === 'ai'">
                    <img src="/img/albumCover/8.jpg" alt="邓紫棋头像" class="avatar-img-small">
                </div>
                <div class="message-content">
                    <!-- 图片：独立卡片网格，不再嵌入彩色气泡 -->
                    <div
                        v-if="message.photos && message.photos.length"
                        class="photo-grid"
                        :class="{ 'photo-grid-single': message.photos.length === 1 }"
                    >
                        <button
                            v-for="(photo, photoIndex) in message.photos"
                            :key="photo.url || photoIndex"
                            class="photo-card"
                            type="button"
                            @click="openLightbox(photo.url)"
                        >
                            <img :src="photo.url" alt="G.E.M. photo" loading="lazy" @error="onPhotoError">
                        </button>
                    </div>
                    <!-- 文字气泡：有文字或正在流式输出时才显示 -->
                    <div class="message-bubble" v-if="message.text || message.streaming">
                        <p>{{ message.text }}<span v-if="message.streaming" class="stream-cursor"></span></p>
                    </div>
                    <span class="message-time">{{ message.time }}</span>
                </div>
                <div class="message-avatar user-avatar" v-if="message.sender === 'user'">
                    <div class="user-avatar-placeholder" v-if="!userStore.isLoggedIn">
                        <i class="fas fa-user"></i>
                    </div>
                    <img v-else :src="userStore.avatar" alt="用户头像" class="avatar-img-small">
                </div>
            </div>
            
            <div class="typing-indicator" v-if="isTyping">
                <div class="typing-avatar">
                    <img src="/img/albumCover/8.jpg" alt="邓紫棋头像" class="avatar-img-small">
                </div>
                <div class="typing-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span>{{ streamStatus || '姐姐正在输入...' }}</span>
            </div>
            
            <div class="context-warning" v-if="contextWarning">
                <div class="warning-bubble">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>对话历史较长，已自动截断以保持上下文清晰</span>
                </div>
            </div>
        </div>
        
        <div class="chat-footer">
            <div class="input-container" :class="{ 'input-focused': inputFocused }">
                <div class="input-glow"></div>
                <textarea 
                    ref="inputRef"
                    v-model="userInput" 
                    :placeholder="inputPlaceholder"
                    @keydown.enter.exact.prevent="sendMessage" 
                    @focus="inputFocused = true"
                    @blur="inputFocused = false"
                    :disabled="isResponding"
                    rows="1"
                    class="chat-input"
                ></textarea>
                <button @click="sendMessage" class="send-btn" :disabled="isResponding || !userInput.trim()">
                    <i :class="isResponding ? 'fas fa-circle-notch fa-spin' : 'fas fa-paper-plane'"></i>
                </button>
            </div>
            <div class="chat-hints" v-if="showHints">
                <div class="hint-label"><i class="fas fa-lightbulb"></i> 试着问问：</div>
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

        <!-- 图片灯箱预览 -->
        <transition name="lightbox-fade">
            <div v-if="lightboxUrl" class="lightbox-overlay" @click="closeLightbox">
                <img :src="lightboxUrl" class="lightbox-img" alt="图片预览" @click.stop>
                <button class="lightbox-close" @click="closeLightbox" title="关闭">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { trackEvent, EVENTS } from '@/utils/stats';
import { storage } from '@/utils/storage';
import { getFingerprint } from '@/utils/fingerprint';
import LoginModal from '@/components/Login/LoginModal.vue';

// 获取用户状态
const userStore = useUserStore();

// 登录弹窗引用
const loginModalRef = ref(null);

// 状态变量
const userInput = ref('');
const messages = ref([]);
const isTyping = ref(false);
const isResponding = ref(false);  // 整个请求期间为 true，用于锁定输入框，避免回复未完就再次提问
const chatBodyRef = ref(null);
const inputRef = ref(null);
const inputFocused = ref(false);
const streamStatus = ref('');  // 流式状态提示文字
const showWelcome = ref(true);
const welcomeCollapsed = ref(false);
// Hints visible only before any user message is sent
const showHints = computed(() => !messages.value.some(m => m.sender === 'user'));

// 输入框 placeholder：根据登录态与回复状态动态变化
const inputPlaceholder = computed(() => {
    if (!userStore.isLoggedIn) return '登录后即可和解解聊天～';
    if (isResponding.value) return '姐姐还在回复中，请稍候…';
    return '和解解说点什么吧...';
});

// 图片灯箱预览
const lightboxUrl = ref('');
function openLightbox(url) {
    if (!url) return;
    lightboxUrl.value = url;
}
function closeLightbox() {
    lightboxUrl.value = '';
}
function onPhotoError(e) {
    // 图片加载失败：隐藏破图，避免出现裂图占位
    const card = e?.target?.closest?.('.photo-card');
    if (card) card.style.display = 'none';
}
function onEscKey(e) {
    if (e.key === 'Escape' && lightboxUrl.value) closeLightbox();
}

// 背景粒子样式生成
function particleStyle(n) {
    const size = 2 + Math.random() * 4;
    return {
        width: `${size}px`,
        height: `${size}px`,
        left: `${(n / 12) * 100 + (Math.random() - 0.5) * 15}%`,
        top: `${Math.random() * 100}%`,
        animationDuration: `${6 + Math.random() * 8}s`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: 0.3 + Math.random() * 0.5,
    };
}
// 仅在组件初始化时计算一次粒子样式，避免流式输出（messages 变化触发重渲染）时随机值被重算导致粒子闪烁/瞬移
const particleStyles = ref(Array.from({ length: 12 }, (_, i) => particleStyle(i + 1)));
// 保存完整的对话历史，用于API调用
const chatHistory = ref([
]);

// 上下文管理相关变量
const maxContextLength = ref(20); // 最大上下文长度（包括system message）
const contextWarning = ref(false); // 上下文长度警告

// 一些预设的提示问题
const hints = [
    '来一张你的美照',
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
        
    }
}

// 当用户使用预设提示
function useHint(hint) {
    if (!userStore.isLoggedIn) {
        loginModalRef.value?.openModal();
        return;
    }
    userInput.value = hint;
    nextTick(() => {
        inputRef.value.focus();
    });
}

// 发送消息逻辑（流式响应版）
async function sendMessage() {
    if (!userInput.value.trim() || isResponding.value) return;
    
    // 未登录时弹出登录弹窗
    if (!userStore.isLoggedIn) {
        loginModalRef.value?.openModal();
        return;
    }
    
    trackEvent(EVENTS.AI_CHAT);
    
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
    
    // 用户主动发消息：强制滚到底
    await scrollToBottom(true);
    
    // 进入回复中状态：锁定输入框直到本次流式输出完全结束
    isResponding.value = true;
    isTyping.value = true;
    streamStatus.value = '姐姐正在输入...';
    
    try {
        // 不再提前创建空AI消息占位
        // AI消息会在收到第一个token时由 callBackendAIStream 内部创建
        
        // 调用流式AI接口
        const finalText = await callBackendAIStream(chatHistory.value);
        
        // 添加AI回复到对话历史
        chatHistory.value.push({
            role: "assistant",
            content: finalText
        });
        
        // 再次管理上下文长度
        manageContext();
        
        await scrollToBottom();
        
    } catch (error) {
        console.error('聊天出错:', error);
        
        // 发生错误时添加错误消息
        messages.value.push({
            text: '啊，好像遇到了一些问题...可以稍后再试吗？😥',
            sender: 'ai',
            time: formatTime(new Date())
        });
        
        await scrollToBottom();
    } finally {
        // 无论成功失败，流式结束后才解锁输入框
        isTyping.value = false;
        isResponding.value = false;
        streamStatus.value = '';
        // 回复结束后自动聚焦，方便用户继续提问
        nextTick(() => inputRef.value?.focus());
    }
}

// 格式化时间显示
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 滚动到底部
// 增强：如果用户主动向上滚（距底部 > 120px），就不再强制拉回底部，避免和用户阅读冲突
async function scrollToBottom(force = false) {
    await nextTick();
    if (!chatBodyRef.value) return;
    const el = chatBodyRef.value;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (force || distanceFromBottom < 120) {
        el.scrollTop = el.scrollHeight;
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

// 流式调用后端AI接口
async function callBackendAIStream(messageHistory) {
    // 历史 = 除最后一条（即本次问题）外的所有消息
    const history = [];
    const prior = messageHistory.slice(0, -1);
    for (const msg of prior) {
        if (msg && msg.role && msg.content) {
            history.push({ role: msg.role, content: msg.content });
        }
    }
    // 丢弃开头的欢迎语（assistant），保证历史从 user 开始；不会误删真实用户消息
    while (history.length && history[0].role === 'assistant') {
        history.shift();
    }
    
    const currentQuestion = messageHistory[messageHistory.length - 1].content;
    const _uid = storage.getUserId() || `fp_${getFingerprint()}`;
    const payload = { question: currentQuestion, history: history, user_id: _uid };
    
    // Build the full URL for the stream endpoint
    const baseUrl = import.meta.env.VITE_API_BASEURL + import.meta.env.VITE_API_PREFIX;
    const streamUrl = `${baseUrl}/ai/stream`;
    
    const token = storage.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(streamUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';       // SSE line buffer
    let fullText = '';     // Accumulated AI response text
    let scrollCounter = 0; // Throttle scrolling
    let aiMessageIndex = -1; // Will be set when first token arrives
    let hasPhotos = false;

    const handleSsePart = async (part) => {
        if (!part.trim()) return;

        let eventType = 'message';
        let eventData = '';

        for (const line of part.split('\n')) {
            if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
                eventData += line.slice(5).trim();
            }
        }

        if (!eventData) return;

        try {
            const data = JSON.parse(eventData);

            switch (eventType) {
                case 'status':
                    streamStatus.value = data.message || '处理中...';
                    break;

                case 'token':
                    if (data.content) {
                        if (aiMessageIndex === -1) {
                            aiMessageIndex = messages.value.length;
                            messages.value.push({
                                text: '',
                                sender: 'ai',
                                time: formatTime(new Date()),
                                streaming: true
                            });
                        } else if (!messages.value[aiMessageIndex].streaming) {
                            messages.value[aiMessageIndex].streaming = true;
                        }
                        // 文字开始输出：隐藏"正在输入"气泡（但仍保持 isResponding 锁定输入框）
                        isTyping.value = false;
                        streamStatus.value = '';

                        fullText += data.content;
                        messages.value[aiMessageIndex].text = fullText;

                        scrollCounter++;
                        if (scrollCounter % 3 === 0) {
                            await scrollToBottom();
                        }
                    }
                    break;

                case 'photos': {
                    const photos = Array.isArray(data.items) ? data.items : [];
                    if (!photos.length) break;
                    hasPhotos = true;
                    if (aiMessageIndex === -1) {
                        aiMessageIndex = messages.value.length;
                        messages.value.push({
                            text: '',
                            sender: 'ai',
                            time: formatTime(new Date()),
                            photos: []
                        });
                    }
                    messages.value[aiMessageIndex].photos = photos;
                    // 图片已下发但文字尚未开始：保持"正在输入"气泡并给出提示，告知用户文字马上来
                    if (!fullText) {
                        isTyping.value = true;
                        streamStatus.value = '照片先到啦，文字马上就来～';
                    }
                    await scrollToBottom();
                    break;
                }

                case 'done':
                    // 流式结束：去掉光标
                    if (aiMessageIndex !== -1 && messages.value[aiMessageIndex]) {
                        messages.value[aiMessageIndex].streaming = false;
                    }
                    await scrollToBottom();
                    break;

                case 'error':
                    throw new Error('__AI_STREAM_ERROR__:' + (data.message || 'AI服务连接失败'));
            }
        } catch (parseErr) {
            if (parseErr && parseErr.message && parseErr.message.startsWith('__AI_STREAM_ERROR__:')) {
                throw new Error(parseErr.message.slice('__AI_STREAM_ERROR__:'.length));
            }
        }
    };
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete SSE events (separated by double newlines)
            const parts = buffer.split('\n\n');
            buffer = parts.pop(); // Keep the incomplete last part in the buffer
        
        for (const part of parts) {
            await handleSsePart(part);
        }
    }
        if (buffer.trim()) {
            await handleSsePart(buffer);
            buffer = '';
        }
    } catch (streamErr) {
        // Remove the placeholder AI bubble (if created) so outer catch shows a single error message
        if (aiMessageIndex !== -1 && messages.value[aiMessageIndex]) {
            messages.value.splice(aiMessageIndex, 1);
        }
        isTyping.value = false;
        streamStatus.value = '';
        throw streamErr;
    }
    
    // Final scroll
    await scrollToBottom();

    // 兜底：流自然结束但未收到 done 事件时，也清掉光标
    if (aiMessageIndex !== -1 && messages.value[aiMessageIndex]?.streaming) {
        messages.value[aiMessageIndex].streaming = false;
    }
    
    // If no text was received at all, create a fallback message
    if (!fullText && !hasPhotos) {
        messages.value.push({
            text: '抱歉，AI好像没有给我回应耶...😥',
            sender: 'ai',
            time: formatTime(new Date())
        });
        fullText = '抱歉，AI好像没有给我回应耶...😥';
    }
    
    return fullText;
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

    // ESC 关闭灯箱
    window.addEventListener('keydown', onEscKey);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onEscKey);
});
</script>

<style scoped>
/* ========== 聊天容器 ========== */
.chat-container {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--nav-height, 70px) - var(--tab-bar-height, 0px));
    height: calc(100vh - var(--nav-height, 70px) - var(--tab-bar-height, 0px));
    background:
        radial-gradient(ellipse 40% 30% at 20% 15%, rgba(200, 80, 232, 0.08), transparent 50%),
        radial-gradient(ellipse 35% 25% at 80% 80%, rgba(0, 204, 223, 0.05), transparent 50%),
        linear-gradient(155deg, #0a0a16 0%, #0f0d20 40%, #120d28 70%, #0a0a16 100%);
    position: fixed;
    top: var(--nav-height, 70px);
    left: 0;
    right: 0;
    bottom: var(--tab-bar-height, 0px);
    font-family: inherit;
    overflow: hidden;
    margin: 0;
    padding: 0;
    z-index: 10;
}

/* ========== 背景粒子 ========== */
.bg-particles {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
}

.particle {
    position: absolute;
    border-radius: 50%;
    background: var(--accent-pink);
    animation: floatParticle linear infinite;
    filter: blur(1px);
}

@keyframes floatParticle {
    0% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0;
    }
    10% {
        opacity: 0.6;
    }
    50% {
        transform: translateY(-40vh) translateX(20px) scale(1.2);
        opacity: 0.3;
    }
    100% {
        transform: translateY(-80vh) translateX(-10px) scale(0.5);
        opacity: 0;
    }
}

/* ========== Header ========== */
.chat-header {
    padding: var(--space-3) var(--space-8);
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 2;
}

.header-info {
    display: flex;
    align-items: center;
}

.avatar {
    position: relative;
    margin-right: 16px;
}

.avatar-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: conic-gradient(var(--primary), var(--accent-pink), var(--accent-cyan), var(--primary));
    animation: ringRotate 4s linear infinite;
    opacity: 0.7;
}

@keyframes ringRotate {
    to { transform: rotate(360deg); }
}

.avatar-img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 1;
    transition: transform 0.3s var(--ease-bounce);
}

.avatar-img:hover {
    transform: scale(1.08);
}

.status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 13px;
    height: 13px;
    background-color: #4ade80;
    border-radius: 50%;
    border: 2.5px solid var(--bg-dark);
    box-shadow: 0 0 10px rgba(74, 222, 128, 0.6);
    z-index: 2;
}

.user-info h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.ai-badge {
    font-size: 10px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary), var(--accent-pink));
    color: white;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    letter-spacing: 1px;
    text-transform: uppercase;
}

.status {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
}

.status-pulse {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
    50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
}

.clear-chat-btn {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-pill);
    color: var(--text-secondary);
    min-height: var(--button-height);
    padding: 0 var(--space-4);
    font-size: 13px;
    cursor: pointer;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: var(--ease-out);
    display: flex;
    align-items: center;
    gap: 6px;
}

.clear-chat-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f87171;
    border-color: rgba(248, 113, 113, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(248, 113, 113, 0.15);
}

.clear-chat-btn:active {
    transform: translateY(0);
}

.clear-chat-btn i {
    font-size: 14px;
}

.btn-text {
    font-size: 13px;
}

/* ========== Chat Body ========== */
.chat-body {
    flex: 1;
    min-height: 0; /* 关键：让 flex 子项能在空间不足时正确收缩并出现滚动条 */
    padding: var(--space-6);
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
    z-index: 1;
}

/* ========== 欢迎卡片 ========== */
.chat-welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: clamp(16px, 3vh, 32px) clamp(16px, 3vw, 28px);
    margin: clamp(8px, 1.5vh, 16px) auto;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-lg);
    max-width: 520px;
    width: min(100%, 520px);
    text-align: center;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(200, 80, 232, 0.06);
    animation: welcome-fade-in 0.8s var(--ease-out);
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
}

.welcome-close,
.welcome-toggle {
    position: absolute;
    top: 8px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 3;
    font-size: 12px;
    transition-property: transform, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}

.welcome-close { right: 8px; }
.welcome-toggle { right: 42px; }

.welcome-close:hover,
.welcome-toggle:hover {
    background: rgba(240, 98, 146, 0.15);
    color: var(--text-primary);
}

.welcome-collapsed {
    flex-direction: row;
    align-items: center;
    text-align: left;
    gap: 12px;
    padding: 10px 50px 10px 14px;
}

.welcome-collapsed .welcome-avatar {
    margin-bottom: 0;
    flex-shrink: 0;
}

.welcome-collapsed .welcome-img {
    width: 40px;
    height: 40px;
}

.welcome-collapsed .welcome-ring {
    inset: -4px;
}

.welcome-collapsed .welcome-text h3 {
    font-size: 14px;
    margin: 0;
}

.welcome-glow {
    position: absolute;
    top: -50%;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(240, 98, 146, 0.12), rgba(200, 80, 232, 0.06), transparent 65%);
    pointer-events: none;
    animation: welcomeGlowPulse 4s ease-in-out infinite;
}
@keyframes welcomeGlowPulse {
    0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.08); }
}

@keyframes welcome-fade-in {
    from {
        opacity: 0;
        transform: translateY(30px) scale(0.97);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.welcome-avatar {
    margin-bottom: clamp(10px, 2vh, 20px);
    position: relative;
}

.welcome-img {
    width: clamp(56px, 10vw, 88px);
    height: clamp(56px, 10vw, 88px);
    border-radius: 50%;
    border: 3px solid transparent;
    background-image: linear-gradient(var(--bg-dark-mid), var(--bg-dark-mid)),
                      linear-gradient(135deg, var(--accent-pink), var(--primary), var(--accent-cyan));
    background-origin: border-box;
    background-clip: padding-box, border-box;
    box-shadow: 0 8px 30px rgba(240, 98, 146, 0.35), 0 0 40px rgba(200, 80, 232, 0.15);
    transition: all 0.4s var(--ease-bounce);
    position: relative;
    z-index: 1;
}

.welcome-img:hover {
    transform: scale(1.08) rotate(3deg);
    box-shadow: 0 12px 40px rgba(240, 98, 146, 0.5), 0 0 60px rgba(200, 80, 232, 0.25);
}

.welcome-ring {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 2px dashed rgba(240, 98, 146, 0.3);
    animation: ringRotate 8s linear infinite;
}

.welcome-text h3 {
    margin-top: 0;
    font-size: clamp(17px, 2.5vw, 22px);
    font-weight: 700;
    margin-bottom: clamp(8px, 1.5vh, 12px);
    background: linear-gradient(135deg, var(--accent-pink) 0%, var(--primary-light) 50%, var(--primary) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    position: relative;
    z-index: 1;
}

.welcome-main {
    color: var(--text-primary);
    margin: 0 0 clamp(8px, 1.5vh, 16px);
    font-size: clamp(13px, 1.6vw, 15px);
    line-height: 1.7;
    position: relative;
    z-index: 1;
}

.welcome-main strong {
    color: var(--accent-pink);
    font-weight: 700;
    margin-right: 2px;
}

.welcome-notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    text-align: left;
    background: rgba(255, 255, 255, 0.04);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    z-index: 1;
}

.welcome-notice i {
    color: var(--accent-pink);
    font-size: 16px;
    margin-top: 2px;
    flex-shrink: 0;
}

.welcome-notice p {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.6;
    margin: 0 0 4px;
}

.welcome-notice p:last-child {
    margin-bottom: 0;
}

/* 音符装饰 */
.welcome-music-notes {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.music-note {
    position: absolute;
    font-size: 18px;
    color: var(--accent-pink);
    opacity: 0;
    animation: floatNote 4s ease-in-out infinite;
}

.music-note:nth-child(1) { left: 10%; bottom: 20%; }
.music-note:nth-child(2) { left: 80%; bottom: 30%; }
.music-note:nth-child(3) { left: 25%; bottom: 10%; }
.music-note:nth-child(4) { left: 70%; bottom: 15%; }
.music-note:nth-child(5) { left: 50%; bottom: 25%; }

@keyframes floatNote {
    0% { opacity: 0; transform: translateY(0) rotate(0deg); }
    20% { opacity: 0.5; }
    80% { opacity: 0.3; }
    100% { opacity: 0; transform: translateY(-60px) rotate(15deg); }
}

/* ========== 消息 ========== */
.message-wrapper {
    display: flex;
    margin-bottom: 2px;
    align-items: flex-end;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: var(--ease-out);
    animation: message-slide-in 0.4s var(--ease-out);
    position: relative;
}

.ai-message {
    animation-name: message-slide-left;
}

.user-message {
    animation-name: message-slide-right;
}

@keyframes message-slide-left {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
}

@keyframes message-slide-right {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
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
    width: 38px;
    height: 38px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 10px;
    flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.08);
    transition: transform 0.2s var(--ease-out);
}

.message-avatar:hover {
    transform: scale(1.1);
}

.avatar-img-small {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), #A21CAF);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
}

.user-avatar .avatar-img-small {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
}

.message-content {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    position: relative;
}

.user-message .message-content {
    align-items: flex-end;
}

.ai-message .message-content {
    align-items: flex-start;
}

.message-bubble {
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-lg);
    position: relative;
    word-break: break-word;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.25s;
  transition-timing-function: var(--ease-out);
    display: flex;
    flex-direction: column;
    text-align: left;
}

.message-bubble:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

.user-message .message-bubble {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    border-bottom-right-radius: 6px;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
}

.ai-message .message-bubble {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
    color: var(--text-primary);
    border-bottom-left-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(10px);
    position: relative;
    box-shadow: inset 2px 0 0 0 var(--accent-pink), 0 4px 16px rgba(0, 0, 0, 0.2);
}

.ai-message .message-bubble::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(240, 98, 146, 0.04), transparent 50%);
    pointer-events: none;
}

/* 流式光标 */
.stream-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    margin-left: 2px;
    background: var(--accent-pink);
    vertical-align: -2px;
    animation: streamBlink 1s steps(1) infinite;
}

@keyframes streamBlink {
    0%, 50% { opacity: 1; }
    50.01%, 100% { opacity: 0; }
}

.message-bubble p {
    margin: 0;
    line-height: 1.7;
    font-size: 15px;
    text-align: left;
    position: relative;
    z-index: 1;
}

.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 160px));
    gap: 10px;
    margin-bottom: 8px;
    max-width: 520px;
    position: relative;
    z-index: 1;
}

/* 单张图：放大展示，独立卡片 */
.photo-grid-single {
    grid-template-columns: minmax(200px, 260px);
}

.photo-card {
    display: block;
    overflow: hidden;
    border-radius: 14px;
    color: inherit;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: zoom-in;
    transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
    padding: 0;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    position: relative;
}

.photo-card:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 10px 28px rgba(240, 98, 146, 0.25);
}

.photo-card img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    /* 加载未完成时的占位色，避免视觉跳动 */
    background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
}

.message-time {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    margin-top: 5px;
    padding: 0 4px;
}

/* ========== Typing ========== */
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-left: 10px;
    animation: message-slide-left 0.3s var(--ease-out);
}

.typing-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid rgba(255, 255, 255, 0.08);
}

.typing-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.typing-bubble {
    background: linear-gradient(135deg, rgba(240, 98, 146, 0.6), rgba(233, 30, 99, 0.5));
    padding: 12px 18px;
    border-radius: 20px;
    border-bottom-left-radius: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 15px rgba(240, 98, 146, 0.15);
}

.typing-dot {
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: typingAnimation 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingAnimation {
    0%, 60%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0.5;
    }
    30% {
        transform: translateY(-8px) scale(1.1);
        opacity: 1;
    }
}

.typing-indicator span {
    font-size: 13px;
    color: var(--text-secondary);
    font-style: italic;
}

/* ========== Warning ========== */
.context-warning {
    display: flex;
    justify-content: center;
    margin-top: 8px;
    animation: message-slide-left 0.3s var(--ease-out);
}

.warning-bubble {
    background: rgba(255, 152, 0, 0.08);
    border: 1px solid rgba(255, 152, 0, 0.2);
    border-radius: var(--radius-pill);
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
}

.warning-bubble i {
    font-size: 15px;
    color: #ffb74d;
}

/* ========== Footer ========== */
.chat-footer {
    padding: var(--space-4) var(--space-6) var(--space-5);
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    z-index: 2;
}

.input-container {
    display: flex;
    align-items: flex-end;
    background: var(--glass-bg);
    border-radius: var(--radius-lg);
    padding: var(--space-2) var(--space-4);
    margin-bottom: 12px;
    border: 1px solid var(--glass-border);
    transition-property: border-color, box-shadow; transition-duration: 0.35s; transition-timing-function: var(--ease-out);
    position: relative;
    overflow: hidden;
}

.input-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(240, 98, 146, 0), rgba(200, 80, 232, 0));
    transition-property: border-color, box-shadow; transition-duration: 0.35s; transition-timing-function: var(--ease-out);
    pointer-events: none;
    border-radius: inherit;
}

.input-focused .input-glow {
    background: linear-gradient(135deg, rgba(240, 98, 146, 0.05), rgba(200, 80, 232, 0.05));
}

.input-focused {
    border-color: rgba(240, 98, 146, 0.3);
    box-shadow: 0 0 0 3px rgba(240, 98, 146, 0.08), 0 4px 20px rgba(0, 0, 0, 0.15);
}

.chat-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 15px;
    resize: none;
    padding: 8px 4px;
    max-height: 120px;
    line-height: 1.5;
    font-family: inherit;
    position: relative;
    z-index: 1;
}

.chat-input:focus {
    outline: none;
}

.chat-input::placeholder {
    color: rgba(255, 255, 255, 0.35);
}

.send-btn {
    background: linear-gradient(135deg, var(--accent-pink), var(--primary));
    color: white;
    border: none;
    width: var(--touch-target);
    height: var(--touch-target);
    border-radius: 50%;
    margin-left: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition-property: transform, box-shadow, opacity; transition-duration: 0.3s; transition-timing-function: var(--ease-bounce);
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(240, 98, 146, 0.3);
    position: relative;
    z-index: 1;
}

.send-btn:hover:not(:disabled) {
    transform: scale(1.08) rotate(5deg);
    box-shadow: 0 6px 20px rgba(240, 98, 146, 0.4);
}

.send-btn:active:not(:disabled) {
    transform: scale(0.95);
}

.send-btn:disabled {
    background: rgba(255, 255, 255, 0.06);
    cursor: not-allowed;
    box-shadow: none;
    color: rgba(255, 255, 255, 0.3);
}

.send-btn i {
    font-size: 17px;
}

/* ========== Hints ========== */
.chat-hints {
    display: flex;
    align-items: center;
    overflow-x: auto;
    padding: 4px 0 6px;
    gap: 4px;
}

.hint-label {
    color: var(--text-secondary);
    font-size: 13px;
    margin-right: 10px;
    white-space: nowrap;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.hint-label i {
    color: #fbbf24;
    font-size: 14px;
}

.hint-buttons {
    display: flex;
    gap: 8px;
}

.hint-btn {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-pill);
    color: var(--text-secondary);
    min-height: var(--button-height);
    padding: 0 var(--space-4);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: var(--ease-out);
}

.hint-btn:hover {
    background: rgba(240, 98, 146, 0.1);
    border-color: rgba(240, 98, 146, 0.3);
    color: var(--text-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(240, 98, 146, 0.1);
}

.hint-btn:active {
    transform: translateY(0);
}

/* ========== Lightbox ========== */
.lightbox-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.82);
    backdrop-filter: blur(10px);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    cursor: zoom-out;
}

.lightbox-img {
    max-width: min(92vw, 1080px);
    max-height: 90vh;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
    cursor: default;
    animation: lightboxZoom 0.25s var(--ease-out);
}

@keyframes lightboxZoom {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
}

.lightbox-close {
    position: absolute;
    top: 20px;
    right: 24px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition-property: transform, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}

.lightbox-close:hover {
    background: rgba(248, 113, 113, 0.25);
    border-color: rgba(248, 113, 113, 0.5);
    transform: rotate(90deg);
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
    transition: opacity 0.2s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
    opacity: 0;
}

/* ========== Scrollbar ========== */
::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-pill);
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(240, 98, 146, 0.3);
}

/* ========== 响应式 ========== */

/* 大屏桌面 (1440px+) */
@media (min-width: 1440px) {
    .chat-welcome {
        max-width: 580px;
    }

    .message-content {
        max-width: 60%;
    }

    .chat-body {
        padding: 28px 48px;
    }
}

/* 中等桌面 (1024-1439px) - 默认样式即可 */

/* 小屏桌面 / 平板横屏 (769-1024px) */
@media (max-width: 1024px) {
    .chat-body {
        padding: 20px;
    }

    .chat-welcome {
        max-width: 480px;
    }

    .message-content {
        max-width: 75%;
    }
}

/* 平板竖屏 / 大手机横屏 (max-width: 768px) */
@media (max-width: 768px) {
    .chat-container {
        height: 100dvh;
        top: 0;
        bottom: 0;
        padding-top: calc(var(--nav-height, 70px) + var(--safe-area-top, 0px));
        padding-bottom: var(--page-padding-bottom);
    }

    .chat-header {
        padding: 6px var(--space-3);
        height: 48px;
        flex-shrink: 0;
    }

    .avatar { margin-right: 10px; }
    .avatar-ring { inset: -2px; }

    .avatar-img {
        width: 34px;
        height: 34px;
        border-width: 2px;
    }

    .status-dot {
        width: 10px;
        height: 10px;
        border-width: 2px;
    }

    .user-info h2 { font-size: 15px; gap: 6px; }
    .ai-badge { font-size: 9px; padding: 1px 5px; }
    .status { font-size: 11px; margin-top: 2px; }

    .clear-chat-btn {
        padding: 0;
        width: 36px;
        height: 36px;
        min-height: 36px;
        border-radius: 50%;
        justify-content: center;
    }

    .btn-text { display: none; }

    .chat-body {
        padding: 10px var(--space-3);
        gap: 10px;
    }

    .message-content { max-width: 82%; }

    .message-bubble {
        padding: 8px 12px;
    }

    .message-bubble p { font-size: 14px; line-height: 1.5; }

    .photo-grid {
        grid-template-columns: repeat(auto-fit, minmax(100px, 130px));
        max-width: 100%;
        gap: 6px;
    }

    .message-time { font-size: 10px; margin-top: 3px; }

    .chat-welcome {
        width: 100%;
        max-width: none;
        padding: 12px 14px;
        margin: 0 auto 4px;
        border-radius: var(--radius-md);
    }

    .welcome-avatar { margin-bottom: 8px; }

    .welcome-img {
        width: 52px;
        height: 52px;
    }

    .welcome-text h3 {
        font-size: 15px;
        margin-bottom: 6px;
    }

    .welcome-main {
        font-size: 12px;
        margin-bottom: 8px;
        line-height: 1.5;
    }

    .welcome-notice {
        padding: 8px 10px;
        gap: 8px;
    }

    .welcome-notice i { font-size: 13px; }
    .welcome-notice p { font-size: 11px; line-height: 1.5; }

    .music-note { font-size: 12px; }

    .chat-footer {
        padding: 6px var(--space-3) 8px;
    }

    .input-container {
        padding: 4px 10px;
        margin-bottom: 6px;
        border-radius: var(--radius-md);
    }

    .chat-input {
        font-size: 14px;
        padding: 6px 2px;
        max-height: 96px;
    }

    .chat-hints {
        flex-direction: row;
        align-items: center;
        gap: 6px;
        padding: 0 0 2px;
    }

    .hint-label {
        font-size: 11px;
        margin-right: 4px;
        flex-shrink: 0;
    }

    .hint-label i { font-size: 12px; }

    .hint-buttons {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        flex: 1;
        gap: 6px;
        padding-bottom: 2px;
        -webkit-overflow-scrolling: touch;
    }

    .hint-buttons::-webkit-scrollbar { display: none; }

    .hint-btn {
        padding: 0 10px;
        font-size: 11px;
        min-height: 28px;
        flex-shrink: 0;
    }

    .send-btn {
        width: 36px;
        height: 36px;
        margin-left: 6px;
    }

    .send-btn i { font-size: 14px; }

    .warning-bubble {
        padding: 5px 10px;
        font-size: 11px;
        gap: 5px;
    }

    .warning-bubble i { font-size: 12px; }

    .typing-avatar {
        width: 30px;
        height: 30px;
    }

    .typing-bubble {
        padding: 8px 12px;
    }

    .typing-dot { width: 6px; height: 6px; }

    .typing-indicator span { font-size: 11px; }

    .welcome-close,
    .welcome-toggle {
        width: 24px;
        height: 24px;
        font-size: 11px;
    }

    .welcome-toggle { right: 38px; }
}

/* 小手机 (max-width: 480px) */
@media (max-width: 480px) {
    .chat-body { padding: 10px; }

    .message-bubble {
        padding: 10px 14px;
    }

    .message-bubble p {
        font-size: 14px;
    }

    .message-avatar {
        width: 32px;
        height: 32px;
        margin: 0 6px;
    }

    .user-avatar .avatar-img-small {
        width: 32px;
        height: 32px;
    }

    .chat-welcome {
        width: 96%;
        border-radius: var(--radius-md);
    }

    .welcome-notice i {
        font-size: 14px;
    }

    .welcome-notice p {
        font-size: 11px;
    }

    .welcome-ring {
        inset: -5px;
    }
}

/* ===== 矮屏幕适配 (视口高度不足) ===== */

/* 中等高度屏幕 */
@media (max-height: 750px) {
    .chat-welcome {
        padding: 16px 18px;
        margin: 8px auto;
    }

    .welcome-avatar {
        margin-bottom: 10px;
    }

    .welcome-notice {
        padding: 10px 12px;
    }

    .welcome-notice p {
        font-size: 12px;
        line-height: 1.5;
    }

    .chat-footer {
        padding: 10px 20px 12px;
    }

    .input-container {
        margin-bottom: 8px;
    }

    .chat-hints {
        padding: 2px 0 4px;
    }
}

/* 较矮屏幕 - 常见笔记本 */
@media (max-height: 650px) {
    .chat-header {
        padding: 8px 20px;
    }

    .avatar-img {
        width: 40px;
        height: 40px;
    }

    .avatar-ring { inset: -3px; }

    .chat-welcome {
        padding: 12px 16px;
        margin: 6px auto;
    }

    .welcome-avatar {
        margin-bottom: 8px;
    }

    .welcome-notice {
        padding: 8px 10px;
    }

    .chat-footer {
        padding: 8px 16px 10px;
    }

    .hint-btn {
        padding: 5px 12px;
    }
}

/* 非常矮的屏幕 - 分屏/小窗口 */
@media (max-height: 500px) {
    .chat-welcome {
        padding: 10px 14px;
        margin: 4px auto;
        flex-direction: row;
        align-items: center;
        text-align: left;
        gap: 14px;
    }

    .welcome-avatar {
        margin-bottom: 0;
        flex-shrink: 0;
    }

    .welcome-glow {
        display: none;
    }

    .welcome-music-notes {
        display: none;
    }

    .welcome-text h3 {
        margin-bottom: 4px;
    }

    .welcome-main {
        margin-bottom: 6px;
        font-size: 13px;
    }

    .welcome-notice {
        padding: 6px 8px;
    }

    .welcome-notice p {
        font-size: 11px;
        line-height: 1.4;
    }

    .welcome-ring {
        display: none;
    }

    .chat-header {
        padding: 6px 16px;
    }

    .chat-footer {
        padding: 6px 12px 8px;
    }

    .chat-hints {
        display: none; /* 极矮屏幕隐藏提示以节省空间 */
    }
}

/* ===== 同时窄且矮（手机横屏） ===== */
@media (max-width: 768px) and (max-height: 450px) {
    .chat-container {
        padding-top: 0;
    }

    .chat-header {
        height: auto;
        padding: 6px 12px;
    }

    .avatar-img {
        width: 30px;
        height: 30px;
    }

    .user-info h2 { font-size: 14px; }
    .status { display: none; }

    .chat-welcome {
        flex-direction: row;
        padding: 8px 12px;
        margin: 4px auto;
    }

    .welcome-avatar {
        margin-bottom: 0;
    }

    .welcome-notice {
        display: none; /* 横屏手机隐藏通知以节省空间 */
    }

    .chat-body {
        padding: 8px;
        gap: 8px;
    }

    .chat-footer {
        padding: 4px 10px 6px;
    }

    .chat-hints { display: none; }

    .input-container {
        margin-bottom: 0;
        padding: 6px 10px;
    }
}
</style>