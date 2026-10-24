/**
 * PathSync AI - Reusable Component Behaviors & Interactive Utilities
 * Implements modern accessible patterns for dialogs, dropdowns, tabs, and alerts.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. MODAL DIALOG CONTROLLER (with modern light-dismiss & fallback)
  // ==========================================================================
  function setupModals() {
    // Open buttons: [data-ps-modal-target="#modalId"]
    document.querySelectorAll('[data-ps-modal-target]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const targetId = trigger.getAttribute('data-ps-modal-target');
        const dialog = document.querySelector(targetId);
        if (dialog && typeof dialog.showModal === 'function') {
          dialog.showModal();
        }
      });
    });

    // Close buttons: [data-ps-modal-close]
    document.querySelectorAll('[data-ps-modal-close]').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        const dialog = closeBtn.closest('dialog');
        if (dialog && typeof dialog.close === 'function') {
          dialog.close();
        }
      });
    });

    // Fallback for browsers without native <dialog closedby="any"> support
    document.querySelectorAll('dialog.ps-modal-dialog').forEach(dialog => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.addEventListener('click', (event) => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const isDialogContent = (
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
          );
          if (!isDialogContent) {
            dialog.close();
          }
        });
      }
    });
  }

  // ==========================================================================
  // 2. DROPDOWN CONTROLLER
  // ==========================================================================
  function setupDropdowns() {
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-ps-dropdown-toggle]');
      const activeDropdowns = document.querySelectorAll('.ps-dropdown--open');

      if (toggle) {
        event.stopPropagation();
        const dropdown = toggle.closest('.ps-dropdown');
        const isOpen = dropdown.classList.contains('ps-dropdown--open');

        // Close other dropdowns
        activeDropdowns.forEach(d => {
          if (d !== dropdown) d.classList.remove('ps-dropdown--open');
        });

        if (isOpen) {
          dropdown.classList.remove('ps-dropdown--open');
        } else {
          dropdown.classList.add('ps-dropdown--open');
        }
        return;
      }

      // Click outside closes any open dropdown
      if (!event.target.closest('.ps-dropdown-menu')) {
        activeDropdowns.forEach(d => d.classList.remove('ps-dropdown--open'));
      }
    });
  }

  // ==========================================================================
  // 3. TAB CONTROLLER
  // ==========================================================================
  function setupTabs() {
    document.addEventListener('click', (event) => {
      const tabBtn = event.target.closest('[data-ps-tab]');
      if (!tabBtn) return;

      const tabGroup = tabBtn.closest('[data-ps-tabs]');
      const targetId = tabBtn.getAttribute('data-ps-tab');
      if (!tabGroup) return;

      // Update button states
      tabGroup.querySelectorAll('[data-ps-tab]').forEach(btn => {
        btn.classList.remove('is-active', 'ps-btn--primary');
        btn.classList.add('ps-btn--ghost');
      });
      tabBtn.classList.remove('ps-btn--ghost');
      tabBtn.classList.add('is-active', 'ps-btn--primary');

      // Update target panels
      const container = tabGroup.closest('[data-ps-tab-container]') || document;
      container.querySelectorAll('[data-ps-tab-panel]').forEach(panel => {
        if (panel.getAttribute('data-ps-tab-panel') === targetId) {
          panel.removeAttribute('hidden');
          panel.style.display = 'block';
        } else {
          panel.setAttribute('hidden', '');
          panel.style.display = 'none';
        }
      });
    });
  }

  // ==========================================================================
  // 4. SIDEBAR COLLAPSE TOGGLE
  // ==========================================================================
  function setupSidebar() {
    const sidebarToggle = document.querySelector('[data-ps-sidebar-toggle]');
    const sidebar = document.querySelector('.ps-sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('ps-sidebar--collapsed');
      });
    }
  }

  // ==========================================================================
  // 5. TOAST NOTIFICATIONS (Lightweight System)
  // ==========================================================================
  window.PathSyncToast = {
    show: function (message, type = 'brand', duration = 3000) {
      let toastContainer = document.getElementById('ps-toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'ps-toast-container';
        toastContainer.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
      }

      const toast = document.createElement('div');
      toast.className = `ps-card ps-toast ps-toast--${type}`;
      toast.style.cssText = `
        padding: 12px 18px;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: var(--font-size-sm);
        font-weight: 500;
        pointer-events: auto;
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border-default);
      `;

      if (type === 'brand') {
        toast.style.borderColor = 'var(--color-border-brand)';
        toast.style.color = 'var(--color-brand-primary)';
      } else if (type === 'success') {
        toast.style.borderColor = 'var(--color-success-border)';
        toast.style.color = 'var(--color-success)';
      }

      toast.innerHTML = `<span>${message}</span>`;
      toastContainer.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      });

      setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }
  };

  // Initialize all interactive components
  document.addEventListener('DOMContentLoaded', () => {
    setupModals();
    setupDropdowns();
    setupTabs();
    setupSidebar();
  });

})();
