// 阅读设置控制器
class AccessibilityController {
  constructor() {
    this.isInitialized = false;
    this.settings = {
      readingProgress: false,
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0,
      brownFilter: 0,
      fontFamily: 'sans'
    };

    this.fontMap = {
      sans:   '"Cascadia Code", Consolas, "Courier New", "PingFang SC", "Microsoft YaHei", monospace',
      serif:  '"FangSong", "STFangsong", "仿宋", Georgia, serif',
      mono:   '"KaiTi", "STKaiti", "楷体", Palatino, "Palatino Linotype", serif'
    };

    this.init();
  }

  init() {
    if (this.isInitialized) return;
    this.loadSettings();
    this.bindEvents();
    this.applySettings();
    this.isInitialized = true;
    window.accessibilityController = this;
  }

  bindEvents() {
    const toggleBtn = document.getElementById('accessibility-toggle');
    const menu = document.getElementById('accessibility-menu');
    const closeBtn = document.getElementById('close-accessibility');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        menu.style.display = 'none';
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#accessibility-menu') && !e.target.closest('#accessibility-toggle')) {
        if (menu) menu.style.display = 'none';
      }
    });

    // 阅读进度
    const progressCheckbox = document.getElementById('reading-progress');
    if (progressCheckbox) {
      progressCheckbox.addEventListener('change', (e) => {
        this.settings.readingProgress = e.target.checked;
        this.applyReadingProgress();
        this.saveSettings();
      });
    }

    // 字号
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    if (fontSizeSlider && fontSizeValue) {
      fontSizeSlider.addEventListener('input', (e) => {
        this.settings.fontSize = parseInt(e.target.value);
        fontSizeValue.textContent = e.target.value + 'px';
        this.applyFontSettings();
        this.saveSettings();
      });
    }

    // 行高
    const lineHeightSlider = document.getElementById('line-height');
    const lineHeightValue = document.getElementById('line-height-value');
    if (lineHeightSlider && lineHeightValue) {
      lineHeightSlider.addEventListener('input', (e) => {
        this.settings.lineHeight = parseFloat(e.target.value);
        lineHeightValue.textContent = e.target.value;
        this.applyFontSettings();
        this.saveSettings();
      });
    }

    // 字间距
    const letterSpacingSlider = document.getElementById('letter-spacing');
    const letterSpacingValue = document.getElementById('letter-spacing-value');
    if (letterSpacingSlider && letterSpacingValue) {
      letterSpacingSlider.addEventListener('input', (e) => {
        this.settings.letterSpacing = parseFloat(e.target.value);
        letterSpacingValue.textContent = e.target.value + 'px';
        this.applyFontSettings();
        this.saveSettings();
      });
    }

    // 棕色滤镜
    const brownFilterSlider = document.getElementById('brown-filter');
    const brownFilterValue = document.getElementById('brown-filter-value');
    if (brownFilterSlider && brownFilterValue) {
      brownFilterSlider.addEventListener('input', (e) => {
        this.settings.brownFilter = parseInt(e.target.value);
        brownFilterValue.textContent = e.target.value + '%';
        this.applyBrownFilter();
        this.saveSettings();
      });
    }

    // 恢复默认
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetToDefault();
      });
    }

    // 滚动进度
    window.addEventListener('scroll', () => {
      if (this.settings.readingProgress) {
        this.updateReadingProgress();
      }
    });
  }

  applySettings() {
    this.applyReadingProgress();
    this.applyFontSettings();
    this.applyBrownFilter();
    this.updateUI();
  }

  applyReadingProgress() {
    const progressBar = document.getElementById('reading-progress-bar');
    if (this.settings.readingProgress) {
      if (progressBar) progressBar.style.display = 'block';
      this.updateReadingProgress();
    } else {
      if (progressBar) progressBar.style.display = 'none';
    }
  }

  applyFontSettings() {
    const family = this.fontMap[this.settings.fontFamily] || this.fontMap.sans;
    const root = document.documentElement;
    root.style.setProperty('--custom-font-size', this.settings.fontSize + 'px');
    root.style.setProperty('--custom-line-height', this.settings.lineHeight);
    root.style.setProperty('--custom-letter-spacing', this.settings.letterSpacing + 'px');
    root.style.setProperty('--custom-font-family', family);

    const selectors = ['.markdown-body', '.post', 'article', '.post-content', '.content', '.entry-content', '.post-body'];
    const elems = document.querySelectorAll(selectors.join(','));
    elems.forEach(el => {
      el.style.setProperty('font-size', this.settings.fontSize + 'px', 'important');
      el.style.setProperty('line-height', this.settings.lineHeight, 'important');
      el.style.setProperty('letter-spacing', this.settings.letterSpacing + 'px', 'important');
      el.style.setProperty('font-family', family, 'important');
    });
  }

  applyBrownFilter() {
    let overlay = document.getElementById('brown-filter-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'brown-filter-overlay';
      overlay.className = 'brown-filter-overlay';
      document.body.appendChild(overlay);
    }
    overlay.style.background = `rgba(139, 69, 19, ${this.settings.brownFilter / 100})`;
  }

  resetToDefault() {
    this.settings = {
      readingProgress: false,
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0,
      brownFilter: 0,
      fontFamily: 'sans'
    };
    this.applySettings();
    this.saveSettings();

  }

  createDynamicStyle() {
    const style = document.createElement('style');
    style.id = 'dynamic-font-settings';
    document.head.appendChild(style);
    return style;
  }

  updateReadingProgress() {
    const progressFill = document.querySelector('.progress-fill');
    if (!progressFill) return;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    progressFill.style.width = ((scrollTop / scrollHeight) * 100) + '%';
  }

  updateUI() {
    const progressCheckbox = document.getElementById('reading-progress');
    if (progressCheckbox) progressCheckbox.checked = this.settings.readingProgress;

    const fontSizeSlider    = document.getElementById('font-size');
    const lineHeightSlider  = document.getElementById('line-height');
    const letterSpacingSlider = document.getElementById('letter-spacing');
    const brownFilterSlider = document.getElementById('brown-filter');
    const fontSizeValue     = document.getElementById('font-size-value');
    const lineHeightValue   = document.getElementById('line-height-value');
    const letterSpacingValue = document.getElementById('letter-spacing-value');
    const brownFilterValue  = document.getElementById('brown-filter-value');

    if (fontSizeSlider)      fontSizeSlider.value      = this.settings.fontSize;
    if (lineHeightSlider)    lineHeightSlider.value    = this.settings.lineHeight;
    if (letterSpacingSlider) letterSpacingSlider.value = this.settings.letterSpacing;
    if (brownFilterSlider)   brownFilterSlider.value   = this.settings.brownFilter;
    if (fontSizeValue)       fontSizeValue.textContent = this.settings.fontSize + 'px';
    if (lineHeightValue)     lineHeightValue.textContent = this.settings.lineHeight;
    if (letterSpacingValue)  letterSpacingValue.textContent = this.settings.letterSpacing + 'px';
    if (brownFilterValue)    brownFilterValue.textContent = this.settings.brownFilter + '%';

    // 更新字体按钮高亮
    ['sans', 'serif', 'mono'].forEach(key => {
      const btn = document.getElementById('font-' + key);
      if (btn) btn.classList.toggle('active', this.settings.fontFamily === key);
    });
  }

  saveSettings() {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('无法保存设置:', e);
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('无法加载设置:', e);
    }
  }
}

// 全局字体切换函数（供 HTML onclick 调用）
function setFont(type) {
  if (window.accessibilityController) {
    window.accessibilityController.settings.fontFamily = type;
    window.accessibilityController.applyFontSettings();
    window.accessibilityController.updateUI();
    window.accessibilityController.saveSettings();
  }
}

function initAccessibility() {
  new AccessibilityController();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccessibility);
} else {
  initAccessibility();
}

setTimeout(() => {
  if (!window.accessibilityController) initAccessibility();
}, 100);