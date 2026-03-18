(function () {
  /* ── Reactions ── */
  var REACTIONS = [
    { key: 'laugh',  emoji: '😂', label: '好笑'      },
    { key: 'think',  emoji: '🤔', label: '我想想'    },
    { key: 'sad',    emoji: '🥲', label: '咋这样？'    },
    { key: 'soft',   emoji: '🥹', label: 'heart软软' },
    { key: 'scared', emoji: '😨', label: '我求你了'  },
    { key: 'igiari', emoji: '🙅‍♀️', label: '異議!'    },
    { key: 'kudos',  emoji: '❤️',  label: 'kudos'    },
  ];

  var PAGE_KEY = 'reactions:' + location.pathname;

  function loadData() {
    try { return JSON.parse(localStorage.getItem(PAGE_KEY) || 'null') || {}; }
    catch (e) { return {}; }
  }

  function saveData(data) {
    try { localStorage.setItem(PAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function renderReactions() {
    var article = document.querySelector('article.markdown-body');
    if (!article) return;

    var data = loadData();

    var wrap = document.createElement('div');
    wrap.className = 'post-reactions';

    var labelEl = document.createElement('p');
    labelEl.className = 'post-reactions-label';
    labelEl.textContent = '我倒要听听你的！';
    wrap.appendChild(labelEl);

    // 異議提示（默认隐藏）
    var igiariNotice = document.createElement('p');
    igiariNotice.className = 'post-reactions-igiari-notice';
    igiariNotice.textContent = '发邮件或 issue 告诉我哪儿有异议，我真的想知道🤯';
    igiariNotice.style.cssText = 'display:none; width:100%; margin:4px 0 0; font-size:13px; color:var(--color-text-secondary,#57606a); transition: opacity 0.3s;';

    REACTIONS.forEach(function (r) {
      var d = data[r.key] || { count: 0, reacted: false };

      var btn = document.createElement('button');
      btn.className = 'reaction-btn' + (d.reacted ? ' reacted' : '');
      btn.setAttribute('aria-label', r.label);
      btn.innerHTML =
        '<span class="emoji">' + r.emoji + '</span>' +
        '<span class="reaction-label">' + r.label + '</span>' +
        '<span class="count">' + (d.count || '') + '</span>';

      btn.addEventListener('click', function () {
        var data2 = loadData();
        var d2 = data2[r.key] || { count: 0, reacted: false };
        if (d2.reacted) {
          d2.reacted = false;
          d2.count = Math.max(0, (d2.count || 1) - 1);
        } else {
          d2.reacted = true;
          d2.count = (d2.count || 0) + 1;
        }
        data2[r.key] = d2;
        saveData(data2);

        btn.classList.toggle('reacted', d2.reacted);
        btn.querySelector('.count').textContent = d2.count || '';

        // 異議按钮特殊处理
        if (r.key === 'igiari') {
          igiariNotice.style.display = d2.reacted ? 'block' : 'none';
        }

        btn.style.transform = 'scale(1.25)';
        setTimeout(function () { btn.style.transform = ''; }, 180);
      });

      wrap.appendChild(btn);
    });

    // 页面加载时恢复 igiari 状态
    var savedData = loadData();
    if (savedData.igiari && savedData.igiari.reacted) {
      igiariNotice.style.display = 'block';
    }

    wrap.appendChild(igiariNotice);
    article.parentNode.insertBefore(wrap, article.nextSibling);
  }

  /* ── Back to top ── */
  function renderBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', '回到顶部');
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16">' +
      '<path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 01.708 0l6 6a.5.5 0 01-.708.708L8 5.707l-5.646 5.647a.5.5 0 01-.708-.708l6-6z"/>' +
      '</svg>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderReactions();
      renderBackToTop();
    });
  } else {
    renderReactions();
    renderBackToTop();
  }
})();