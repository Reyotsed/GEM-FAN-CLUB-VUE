/**
 * Toast notification utility
 * Replaces native alert() and confirm() with styled notifications
 */

let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Duration in ms (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = getToastContainer();

    const toast = document.createElement('div');

    const colors = {
        success: { bg: 'rgba(76, 175, 80, 0.9)', border: '#4CAF50', icon: '✅' },
        error: { bg: 'rgba(244, 67, 54, 0.9)', border: '#f44336', icon: '❌' },
        warning: { bg: 'rgba(255, 152, 0, 0.9)', border: '#ff9800', icon: '⚠️' },
        info: { bg: 'rgba(33, 150, 243, 0.9)', border: '#2196F3', icon: 'ℹ️' },
    };

    const color = colors[type] || colors.info;

    toast.style.cssText = `
    background: ${color.bg};
    color: #fff;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid ${color.border};
    pointer-events: auto;
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
    max-width: 360px;
    word-break: break-word;
  `;

    toast.innerHTML = `<span style="font-size: 16px;">${color.icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Auto dismiss
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, duration);
}

/**
 * Show a confirm dialog (returns a Promise)
 * @param {string} message - The confirmation message
 * @param {string} title - Dialog title (default: '确认')
 * @returns {Promise<boolean>} - true if confirmed, false if cancelled
 */
export function showConfirm(message, title = '确认') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: confirmFadeIn 0.3s ease;
    `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
      background: rgba(30, 30, 40, 0.95);
      border-radius: 20px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(223, 13, 238, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      animation: confirmSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      text-align: center;
    `;

        dialog.innerHTML = `
      <style>
        @keyframes confirmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes confirmSlideIn { from { opacity: 0; transform: translateY(-30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      </style>
      <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">${title}</h3>
      <p style="color: rgba(255,255,255,0.8); margin: 0 0 25px 0; font-size: 15px; line-height: 1.6;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="confirm-cancel" style="
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
        ">取消</button>
        <button id="confirm-ok" style="
          background: linear-gradient(135deg, #df0dee, #a505de);
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(223, 13, 238, 0.3);
          flex: 1;
        ">确定</button>
      </div>
    `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const cleanup = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        dialog.querySelector('#confirm-ok').addEventListener('click', () => {
            cleanup();
            resolve(true);
        });

        dialog.querySelector('#confirm-cancel').addEventListener('click', () => {
            cleanup();
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(false);
            }
        });
    });
}
