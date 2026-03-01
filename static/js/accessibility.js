// 无障碍功能控制器
class AccessibilityController {
  constructor() {
    this.isInitialized = false;
    this.settings = {
      readingProgress: false,
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0,
      brownFilter: 0
    };
    
    this.init();
  }
  
  init() {
    if (this.isInitialized) return;
    
    console.log('AccessibilityController initializing...');
    this.loadSettings();
    this.bindEvents();
    this.applySettings();
    this.isInitialized = true;
    window.accessibilityController = this;
    console.log('AccessibilityController initialized successfully');
  }
  
  bindEvents() {
    // 切换面板
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
    
    // 点击外部关闭面板
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#accessibility-menu') && !e.target.closest('#accessibility-toggle')) {
        menu.style.display = 'none';
      }
    });
    
    // 阅读进度切换
    const progressCheckbox = document.getElementById('reading-progress');
    if (progressCheckbox) {
      progressCheckbox.addEventListener('change', (e) => {
        this.settings.readingProgress = e.target.checked;
        this.applyReadingProgress();
        this.saveSettings();
      });
    }
    
    // 字体大小调整
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
    
    // 行高调整
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
    
    // 字间距调整
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
    
    // 棕色滤镜调整
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
    
    // 恢复默认按钮
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetToDefault();
      });
    }
    
    // 滚动监听（阅读进度）
    window.addEventListener('scroll', () => {
      if (this.settings.readingProgress) {
        this.updateReadingProgress();
      }
    });
  }
  
  applySettings() {
    // 应用所有设置
    this.applyReadingProgress();
    this.applyFontSettings();
    this.applyBrownFilter();
    
    // 更新UI状态
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
    // Write variables directly to :root so styles apply immediately across pages
    try {
      const root = document.documentElement;
      root.style.setProperty('--custom-font-size', this.settings.fontSize + 'px');
      root.style.setProperty('--custom-line-height', this.settings.lineHeight);
      root.style.setProperty('--custom-letter-spacing', this.settings.letterSpacing + 'px');
      // Debugging: log the values we just set
      console.log('applyFontSettings: set CSS variables', {
        fontSize: this.settings.fontSize + 'px',
        lineHeight: this.settings.lineHeight,
        letterSpacing: this.settings.letterSpacing + 'px'
      });
    } catch (e) {
      // Fallback to injecting a style element
      const style = document.getElementById('dynamic-font-settings') || this.createDynamicStyle();
      const css = `:root { --custom-font-size: ${this.settings.fontSize}px; --custom-line-height: ${this.settings.lineHeight}; --custom-letter-spacing: ${this.settings.letterSpacing}px; }`;
      style.textContent = css;
    }
    // Inline-style fallback: apply styles directly to content elements so they take precedence
    try {
      const selectors = ['.markdown-body', '.post', 'article', '.post-content', '.content', '.entry-content', '.post-body'];
      const elems = document.querySelectorAll(selectors.join(','));
      elems.forEach(el => {
        // Use setProperty with 'important' to out-prioritize stylesheet rules that use !important
        if (this.settings.fontSize !== undefined) el.style.setProperty('font-size', this.settings.fontSize + 'px', 'important');
        if (this.settings.lineHeight !== undefined) el.style.setProperty('line-height', this.settings.lineHeight, 'important');
        if (this.settings.letterSpacing !== undefined) el.style.setProperty('letter-spacing', this.settings.letterSpacing + 'px', 'important');
      });
      if (elems.length) {
        console.log('applyFontSettings: applied inline styles to', elems.length, 'elements');
        // Detailed per-element diagnostics
        elems.forEach((el, idx) => {
          try {
            const cs = getComputedStyle(el);
            console.log(`accessibility: element[${idx}]`, el.tagName, el.className, 'inline:', el.style.cssText, 'computed:', {
              fontSize: cs.fontSize,
              lineHeight: cs.lineHeight,
              letterSpacing: cs.letterSpacing
            });
          } catch (e) {
            console.warn('accessibility: cannot compute styles for element', el, e);
          }
        });
      } else {
        console.log('applyFontSettings: no content elements found for inline styling');
      }
    } catch (err) {
      console.warn('applyFontSettings: inline-style fallback failed', err);
    }
  }
  
  applyBrownFilter() {
    let overlay = document.getElementById('brown-filter-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'brown-filter-overlay';
      overlay.className = 'brown-filter-overlay';
      document.body.appendChild(overlay);
    }
    
    const opacity = this.settings.brownFilter / 100;
    overlay.style.background = `rgba(139, 69, 19, ${opacity})`;
  }
  
  resetToDefault() {
    this.settings = {
      readingProgress: false,
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0,
      brownFilter: 0
    };
    
    this.applySettings();
    this.updateUI();
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
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    
    progressFill.style.width = scrollPercent + '%';
  }
  
  updateUI() {
    // 更新复选框状态
    const progressCheckbox = document.getElementById('reading-progress');
    if (progressCheckbox) progressCheckbox.checked = this.settings.readingProgress;
    
    // 更新滑块值
    const fontSizeSlider = document.getElementById('font-size');
    const lineHeightSlider = document.getElementById('line-height');
    const letterSpacingSlider = document.getElementById('letter-spacing');
    const brownFilterSlider = document.getElementById('brown-filter');
    
    const fontSizeValue = document.getElementById('font-size-value');
    const lineHeightValue = document.getElementById('line-height-value');
    const letterSpacingValue = document.getElementById('letter-spacing-value');
    const brownFilterValue = document.getElementById('brown-filter-value');
    
    if (fontSizeSlider) fontSizeSlider.value = this.settings.fontSize;
    if (lineHeightSlider) lineHeightSlider.value = this.settings.lineHeight;
    if (letterSpacingSlider) letterSpacingSlider.value = this.settings.letterSpacing;
    if (brownFilterSlider) brownFilterSlider.value = this.settings.brownFilter;
    
    if (fontSizeValue) fontSizeValue.textContent = this.settings.fontSize + 'px';
    if (lineHeightValue) lineHeightValue.textContent = this.settings.lineHeight;
    if (letterSpacingValue) letterSpacingValue.textContent = this.settings.letterSpacing + 'px';
    if (brownFilterValue) brownFilterValue.textContent = this.settings.brownFilter + '%';
  }
  
  saveSettings() {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('无法保存无障碍设置:', e);
    }
  }
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('无法加载无障碍设置:', e);
    }
  }
}

// 确保DOM加载完成后初始化
function initAccessibility() {
  console.log('Initializing accessibility controller...');
  new AccessibilityController();
}

// 多种方式确保初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccessibility);
} else {
  // DOM已经加载完成
  initAccessibility();
}

// 备用初始化（延迟一点确保所有元素都已渲染）
setTimeout(() => {
  if (!window.accessibilityController) {
    console.log('Fallback initialization...');
    initAccessibility();
  }
}, 100);
