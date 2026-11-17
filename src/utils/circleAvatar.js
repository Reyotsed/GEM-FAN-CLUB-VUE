// src/utils/circleAvatar.js
// Convert any avatar URL into a circular dataURL with optional ring + "+N" badge.
// Also supports "letter avatar" fallback when no URL is given.

const cache = new Map();
const MAX_CACHE = 300;

// 品牌色板：粉/紫/金/青，按昵称哈希挑选，保证同昵称色稳定
const PALETTE = [
    ['#E8A0F5', '#A21CAF'],
    ['#ffcf00', '#ff8a00'],
    ['#22d3ee', '#3b82f6'],
    ['#34d399', '#0ea5e9'],
    ['#f472b6', '#7c3aed'],
    ['#fb7185', '#f59e0b'],
];

function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
}

function pickPalette(seed) {
    return PALETTE[hashStr(seed || '_') % PALETTE.length];
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function drawRing(ctx, cx, cy, r, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.shadowColor = color;
    ctx.shadowBlur = width * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawBadge(ctx, size, count) {
    if (!count || count <= 1) return;
    const txt = count > 99 ? '99+' : `+${count - 1}`;
    const r = Math.max(12, size * 0.22);
    const cx = size - r;
    const cy = size - r;
    // 背景
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, '#ffcf00');
    g.addColorStop(1, '#E8A0F5');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // 描边
    ctx.strokeStyle = '#0a0e27';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 文字
    ctx.fillStyle = '#0a0e27';
    ctx.font = `bold ${Math.floor(r * 1.05)}px -apple-system, "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, cx, cy + 1);
}

/**
 * @param {string|null} url   avatar URL；为空则走 letter avatar
 * @param {Object} opt
 * @param {number} [opt.size=64]
 * @param {number} [opt.ring=3]
 * @param {string} [opt.ringColor='#E8A0F5']
 * @param {number} [opt.count=1]      簇内人数；>1 会画 +N 角标
 * @param {string} [opt.label]        letter avatar 时的昵称（取首字符）
 * @returns {Promise<string|null>}
 */
export async function toCircularAvatarDataURL(url, opt = {}) {
    const {
        size = 64, ring = 3, ringColor = '#E8A0F5',
        count = 1, label = '',
    } = opt;
    const cacheKey = `${url || 'letter:' + label}|${size}|${ring}|${ringColor}|${count}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const r = size / 2;

    try {
        if (url) {
            const img = await loadImage(url);
            ctx.save();
            ctx.beginPath();
            ctx.arc(r, r, r - ring, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            const ratio = Math.max(size / img.width, size / img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            ctx.restore();
        } else {
            // letter avatar
            const [c1, c2] = pickPalette(label);
            const g = ctx.createLinearGradient(0, 0, size, size);
            g.addColorStop(0, c1);
            g.addColorStop(1, c2);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(r, r, r - ring, 0, Math.PI * 2);
            ctx.fill();
            // 字符
            const ch = (label || '?').trim().charAt(0).toUpperCase() || '?';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.floor(size * 0.5)}px -apple-system, "PingFang SC", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ch, r, r + 1);
        }

        if (ring > 0) drawRing(ctx, r, r, r - ring / 2, ringColor, ring);
        drawBadge(ctx, size, count);

        const dataUrl = c.toDataURL('image/png');
        if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
        cache.set(cacheKey, dataUrl);
        return dataUrl;
    } catch (_) {
        return null;
    }
}
