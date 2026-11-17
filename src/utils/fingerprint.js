/**
 * Device fingerprint utility — persistent per-browser ID used for map mark dedup.
 *
 * Strategy:
 *  1. Reuse stored fingerprint in localStorage if any.
 *  2. Otherwise compose a stable-ish hash from screen / timezone / UA / language / canvas,
 *     then persist it. This is NOT cryptographic, only good enough to block casual refresh spam.
 */

const STORAGE_KEY = 'gem_fan_fp';
import { storage } from './storage';

function simpleHash(str) {
    // 32-bit FNV-1a hash, output as hex
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
}

function canvasSignature() {
    try {
        const c = document.createElement('canvas');
        c.width = 200; c.height = 50;
        const ctx = c.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 100, 25);
        ctx.fillStyle = '#069';
        ctx.fillText('GEM-FanMap-🌟', 2, 2);
        ctx.fillStyle = 'rgba(102,204,0,0.7)';
        ctx.fillText('G.E.M.', 4, 17);
        return c.toDataURL().slice(-64);
    } catch (_) {
        return 'nocanvas';
    }
}

export function getFingerprint() {
    const cached = storage.getFingerprint();
    if (cached && cached.length >= 16) return cached;

    const nav = window.navigator || {};
    const scr = window.screen || {};
    const parts = [
        nav.userAgent || '',
        nav.language || '',
        (nav.languages || []).join(','),
        String(nav.hardwareConcurrency || ''),
        String(nav.deviceMemory || ''),
        String(scr.width || '') + 'x' + String(scr.height || ''),
        String(scr.colorDepth || ''),
        (new Date()).getTimezoneOffset(),
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        canvasSignature()
    ].join('|');

    // Combine a short random nonce so two same-device browsers keep distinct IDs
    const nonce = Math.random().toString(36).slice(2, 10);
    const fp = simpleHash(parts) + simpleHash(parts.split('').reverse().join('')) + nonce;
    storage.setFingerprint(fp);
    return fp;
}

export function hasMarkedLocally() {
    return storage.isFanMarked();
}

export function setMarkedLocally() {
    storage.setFanMarked();
}
