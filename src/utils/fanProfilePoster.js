import { pickRandomPosterBgAsync } from './posterBgList';

// 画布宽度固定，高度根据是否含底部"地理坐标"模块动态决定：
//  - 已报到：hero 820 + 票根 290 + 地理模块 110 = 1220
//  - 未报到：hero 880 + 票根 340 = 1220
const W = 750;
const HERO_H_MARKED = 820;
const HERO_H_UNMARKED = 880;
const STUB_H_MARKED = 290;
const STUB_H_UNMARKED = 340;
const MARK_H = 108;

const GOLD = '#d4af37';
const GOLD_SOFT = 'rgba(212, 175, 55, 0.55)';
const CREAM = '#f5e9d8';
const BG_DARK = '#0a040f';

function computeLayout(profile) {
  const hasMark = !!(profile?.mark && profile.mark.city);
  const heroH = hasMark ? HERO_H_MARKED : HERO_H_UNMARKED;
  const stubH = hasMark ? STUB_H_MARKED : STUB_H_UNMARKED;
  const totalH = heroH + stubH + (hasMark ? MARK_H : 0);
  return { hasMark, heroH, stubH, totalH };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const ch of text || '') {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 跨调用缓存同一 URL 的 HTMLImageElement，避免重复解码
const _imgCache = new Map();
function loadImage(src, timeout = 8000) {
  if (_imgCache.has(src)) return _imgCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      _imgCache.delete(src);
      reject(new Error('image load timeout: ' + src));
    }, timeout);
    img.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = (e) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      _imgCache.delete(src);
      reject(e);
    };
    img.src = src;
  });
  _imgCache.set(src, p);
  return p;
}

const FALLBACK_BG = '/img/posterBg/1.jpg';

function drawImageCover(ctx, img, x, y, w, h, yAnchor = 0.3) {
  const ratio = Math.max(w / img.width, h / img.height);
  const dw = img.width * ratio;
  const dh = img.height * ratio;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) * yAnchor;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function buildSerial(profile) {
  const seed = String(profile?.userId || profile?.nickName || 'gem');
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return String((h % 9000) + 1000).padStart(4, '0');
}

// 报到编号格式化：取 mark.id，自动补足 4 位
function formatMarkSerial(id) {
  const n = Number(id);
  if (!n || n <= 0) return '';
  return String(n).padStart(4, '0');
}

function calcFanLevel(year) {
  const y = Number(year);
  if (!y || y < 1990 || y > new Date().getFullYear()) return '棋士';
  const diff = new Date().getFullYear() - y;
  if (diff < 1) return '萌新棋士';
  if (diff < 3) return '初阶棋士';
  if (diff < 7) return '资深棋士';
  if (diff < 12) return '骨灰棋士';
  return '元老棋士';
}

function drawHero(ctx, img, profile, layout) {
  const heroH = layout.heroH;
  // 主图
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, heroH);
    ctx.clip();
    drawImageCover(ctx, img, 0, 0, W, heroH, 0.3);
    ctx.restore();
  } else {
    const g = ctx.createLinearGradient(0, 0, W, heroH);
    g.addColorStop(0, '#1a0820');
    g.addColorStop(1, '#0d0612');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, heroH);
  }

  // 上部加深
  const topG = ctx.createLinearGradient(0, 0, 0, 160);
  topG.addColorStop(0, 'rgba(13, 6, 18, 0.65)');
  topG.addColorStop(1, 'rgba(13, 6, 18, 0)');
  ctx.fillStyle = topG;
  ctx.fillRect(0, 0, W, 160);

  // 底部渐隐到主体
  const botG = ctx.createLinearGradient(0, heroH - 220, 0, heroH);
  botG.addColorStop(0, 'rgba(13, 6, 18, 0)');
  botG.addColorStop(1, 'rgba(13, 6, 18, 1)');
  ctx.fillStyle = botG;
  ctx.fillRect(0, heroH - 220, W, 220);

  // 左上角 gemfanclub
  ctx.save();
  const bx = 50;
  const by = 60;
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + 24, by);
  ctx.stroke();
  ctx.fillStyle = 'rgba(245, 233, 216, 0.92)';
  ctx.font = 'italic 500 24px Didot, "Bodoni 72", "Times New Roman", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6;
  ctx.fillText('gemfanclub', bx + 34, by + 1);
  ctx.shadowBlur = 0;
  ctx.restore();

  // 右上角编号
  const markSerial = formatMarkSerial(profile?.mark?.id);
  if (markSerial) {
    ctx.save();
    ctx.fillStyle = 'rgba(245, 233, 216, 0.75)';
    ctx.font = '500 20px Didot, Georgia, "Times New Roman", serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(`Nº ${markSerial}`, W - 50, 60);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.textBaseline = 'alphabetic';

  // 底部金色资历标签
  const tag = calcFanLevel(profile.fanSinceYear);
    ctx.font = '700 26px -apple-system, "PingFang SC", sans-serif';
    const tagWidth = ctx.measureText(tag).width + 56;
  const tagX = (W - tagWidth) / 2;
  const tagY = heroH - 60;
  const tagH = 40;
  const tagGrad = ctx.createLinearGradient(tagX, tagY, tagX + tagWidth, tagY + tagH);
  tagGrad.addColorStop(0, '#f5e1a4');
  tagGrad.addColorStop(0.5, '#d4af37');
  tagGrad.addColorStop(1, '#b8892b');
  ctx.fillStyle = tagGrad;
  roundRect(ctx, tagX, tagY, tagWidth, tagH, 20);
  ctx.fill();
  ctx.fillStyle = '#0d0612';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, W / 2, tagY + tagH / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawStub(ctx, profile, layout) {
  const stubY = layout.heroH;
  const stubH = layout.stubH;
  // 票根背景
  const stubG = ctx.createLinearGradient(0, stubY, 0, stubY + stubH);
  stubG.addColorStop(0, '#100719');
  stubG.addColorStop(1, '#0d0612');
  ctx.fillStyle = stubG;
  ctx.fillRect(0, stubY, W, stubH);

  // 票根锯齿
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(0, stubY, 26, 0, Math.PI * 2);
  ctx.arc(W, stubY, 26, 0, Math.PI * 2);
  ctx.fill();

  // 顶部金色分隔 + 菱形
  const dy = stubY + 30;
  const lineLen = 200;
  const gap = 22;
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - lineLen - gap, dy);
  ctx.lineTo(W / 2 - gap, dy);
  ctx.moveTo(W / 2 + gap, dy);
  ctx.lineTo(W / 2 + lineLen + gap, dy);
  ctx.stroke();
  ctx.save();
  ctx.translate(W / 2, dy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();

  const bioText = (profile.fanBio || '').trim();
  const hasBio = bioText.length > 0;

  // ===== 块 A：昵称 =====
  const nameY = dy + 50;
  ctx.fillStyle = '#fff';
  ctx.font = '700 36px -apple-system, "PingFang SC", "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(profile.nickName || '匿名棋士', W / 2, nameY);

  // ===== 块 B：入坑年份 / 本命金曲（左右双列）=====
  const metaY = nameY + 64;

  // 左：FAN SINCE
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.font = '600 16px "Helvetica Neue", Arial, sans-serif';
  drawSpacedText(ctx, '入  坑  年  份', W * 0.27, metaY, 2);
  ctx.fillStyle = CREAM;
  ctx.font = '300 36px Didot, "Bodoni 72", Georgia, serif';
  ctx.fillText(String(profile.fanSinceYear || '—'), W * 0.27, metaY + 40);

  // 中间金色分隔线
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, metaY - 16);
  ctx.lineTo(W * 0.5, metaY + 46);
  ctx.stroke();

  // 右：BELOVED SONG
  ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.font = '600 16px "Helvetica Neue", Arial, sans-serif';
  drawSpacedText(ctx, '本  命  金  曲', W * 0.73, metaY, 2);
  ctx.fillStyle = CREAM;
  ctx.font = 'italic 600 26px Didot, Georgia, "PingFang SC", serif';
  let song = profile.favoriteSong || '—';
  if (ctx.measureText(song).width > W * 0.42) {
    while (song.length > 1 && ctx.measureText(song + '…').width > W * 0.42) {
      song = song.slice(0, -1);
    }
    song += '…';
  }
  ctx.fillText(song, W * 0.73, metaY + 40);

  // ===== 块 C：bio =====
  if (hasBio) {
    const bioY = metaY + 86;
    // 引号字号与正文匹配（略大一档，仅作点缀）
    ctx.fillStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.font = 'italic 600 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('“', 110, bioY);
    ctx.fillText('”', W - 110, bioY);

    ctx.fillStyle = 'rgba(245, 233, 216, 0.78)';
    ctx.font = '400 22px Georgia, "PingFang SC", serif';
    const lines = wrapText(ctx, bioText, W - 240).slice(0, 2);
    lines.forEach((line, i) => ctx.fillText(line, W / 2, bioY + i * 30));
  }

}

// 带字距的文本（模拟 letter-spacing）
function drawSpacedText(ctx, text, cx, y, spacing = 2) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = 'center';
}

/**
 * 底部"地理坐标"模块（仅已报到时绘制）
 *  - 紧凑布局：📍 城市 · 省份 + 留言
 *  - 不显示"全站已有 X 位棋士点亮城市"
 *  - 不显示底部域名水印
 */
function drawMarkSection(ctx, profile, layout) {
  const mark = profile.mark;
  const y0 = layout.heroH + layout.stubH;

  // 模块底色（与票根同调，避免出现色差）
  const bgG = ctx.createLinearGradient(0, y0, 0, y0 + MARK_H);
  bgG.addColorStop(0, '#0d0612');
  bgG.addColorStop(1, '#06030a');
  ctx.fillStyle = bgG;
  ctx.fillRect(0, y0, W, MARK_H);

  // 顶部金色划线 + 菱形（与票根顶部一致的装饰语言）
  const dy = y0 + 14;
  const lineLen = 160;
  const gap = 22;
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - lineLen - gap, dy);
  ctx.lineTo(W / 2 - gap, dy);
  ctx.moveTo(W / 2 + gap, dy);
  ctx.lineTo(W / 2 + lineLen + gap, dy);
  ctx.stroke();
  ctx.save();
  ctx.translate(W / 2, dy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();

  // 标签：CHECKED IN · 报到坐标
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.55)';
  ctx.font = '500 16px "Helvetica Neue", Arial, sans-serif';
  drawSpacedText(ctx, '报  到  城  市', W / 2, dy + 22, 2);

  // 主行：金色菱形 + 城市·省份（与昵称/年份同一色系，不再使用紫粉渐变与 emoji）
  const cityLine = `${mark.city}${mark.province && mark.province !== mark.city ? ' · ' + mark.province : ''}`;
  const baseY = mark.message ? y0 + 70 : y0 + 76;

  ctx.font = '300 22px Didot, "Bodoni 72", Georgia, "PingFang SC", serif';
  const textW = ctx.measureText(cityLine).width;
  const markSize = 7;
  const markGap = 16;
  const totalW = textW + (markSize + markGap) * 2;
  const startX = (W - totalW) / 2;

  // 左菱形
  ctx.save();
  ctx.translate(startX + markSize / 2, baseY - 9);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(-markSize / 2, -markSize / 2, markSize, markSize);
  ctx.restore();

  // 城市名
  ctx.textAlign = 'left';
  ctx.font = '300 22px Didot, "Bodoni 72", Georgia, "PingFang SC", serif';
  ctx.fillStyle = CREAM;
  ctx.fillText(cityLine, startX + markSize + markGap, baseY);

  // 右菱形
  ctx.save();
  ctx.translate(startX + markSize + markGap + textW + markGap + markSize / 2, baseY - 9);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(-markSize / 2, -markSize / 2, markSize, markSize);
  ctx.restore();

  // 留言（如有）——调为与 bio 一致的依调样式
  if (mark.message) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(245, 233, 216, 0.78)';
    ctx.font = '400 22px Georgia, "PingFang SC", serif';
    let msg = `「${mark.message}」`;
    if (ctx.measureText(msg).width > W - 140) {
      while (msg.length > 4 && ctx.measureText(msg.slice(0, -2) + '…」').width > W - 140) {
        msg = msg.slice(0, -2);
      }
      msg = msg.slice(0, -1) + '…」';
    }
    ctx.fillText(msg, W / 2, y0 + 96);
  }
}

// 内部：渲染一张 canvas（不做 toBlob）
async function renderToCanvas(profile = {}) {
  const layout = computeLayout(profile);
  const H = layout.totalH;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let heroImg = null;
  let usedBgUrl = '';
  if (profile.posterBg) {
    try {
      heroImg = await loadImage(profile.posterBg);
      usedBgUrl = profile.posterBg;
    } catch (_) {}
  }
  const tried = new Set();
  for (let i = 0; i < 3 && !heroImg; i++) {
    let u = '';
    try {
      u = await pickRandomPosterBgAsync();
    } catch (_) {}
    if (!u || tried.has(u)) continue;
    tried.add(u);
    try {
      heroImg = await loadImage(u);
      usedBgUrl = u;
    } catch (_) {}
  }
  if (!heroImg) {
    try {
      heroImg = await loadImage(FALLBACK_BG, 4000);
      usedBgUrl = FALLBACK_BG;
    } catch (_) {
      heroImg = null;
    }
  }

  ctx.fillStyle = BG_DARK;
  ctx.fillRect(0, 0, W, H);

  drawHero(ctx, heroImg, profile, layout);
  drawStub(ctx, profile, layout);
  if (layout.hasMark) drawMarkSection(ctx, profile, layout);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.22)';
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 24);
  ctx.stroke();

  return { canvas, bgUrl: usedBgUrl };
}

/**
 * 快速预览：返回 canvas 本体，不做 PNG 编码（避免 toBlob 耗时）.
 * 页面可直接把 canvas 插入 DOM，或用 toDataURL。
 */
export async function renderFanProfileCanvas(profile = {}) {
  return await renderToCanvas(profile);
}

/**
 * 产出 PNG blob（用于下载）。
 * 用于需要上传 / 下载 / 分享的场景。
 */
export async function generateFanProfilePoster(profile = {}) {
  const { canvas, bgUrl } = await renderToCanvas(profile);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve({ blob, bgUrl });
        else reject(new Error('toBlob failed'));
      },
      'image/png',
      0.95,
    );
  });
}

export function downloadFanProfilePoster(blob, filename = 'gem-fan-profile.png') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
