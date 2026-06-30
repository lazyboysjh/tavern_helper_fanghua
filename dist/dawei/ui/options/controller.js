(function(){
  var wrap = (document.currentScript && document.currentScript.closest('.mnx-opts-wrap'))
           || document.querySelector('.mnx-opts-wrap:not([data-mnx-controller-ready])');
  if (!wrap) return;
  if (wrap.getAttribute('data-mnx-controller-ready') === '1') return;
  wrap.setAttribute('data-mnx-controller-ready','1');
  wrap.setAttribute('data-mnx-inline','1');

  var LOG_PREFIX = '[大魏芳华:UI][options]';
  function log(level, message, detail) {
    var fn = console[level] || console.log;
    if (detail === undefined) fn.call(console, LOG_PREFIX, message);
    else fn.call(console, LOG_PREFIX, message, detail);
  }

  function getApi(name) {
    try { if (typeof window[name] === 'function') return window[name].bind(window); } catch(e) {}
    try { if (window.parent && typeof window.parent[name] === 'function') return window.parent[name].bind(window.parent); } catch(e) {}
    try { if (window.top && typeof window.top[name] === 'function') return window.top[name].bind(window.top); } catch(e) {}
    return null;
  }
  function cleanText(s) {
    return String(s || '').replace(/<\/?q>/gi, '').replace(/&lt;\/?q&gt;/gi, '').trim();
  }
  function getOptText(item) {
    var source = item.querySelector('.opt-send-source') || item.querySelector('.opt-display-source');
    var text = cleanText(source ? source.textContent : item.getAttribute('data-display') || item.textContent);
    return text.replace(/^\d+\.\s*/, '').replace(/^\[[^\]]+\]\s*/, '').trim();
  }

  function findMesNode(startNode, rootDoc) {
    var node = startNode;
    while (node && node !== rootDoc) {
      if (node.classList && node.classList.contains('mes')) return node;
      node = node.parentElement;
    }
    return null;
  }

  function getHostingMessageId() {
    try {
      var mes = findMesNode(wrap, document);
      if (mes) {
        var id = mes.getAttribute('mesid') || mes.getAttribute('data-mesid') || mes.dataset.mesid;
        if (id != null) return Number(id);
      }
      if (window.frameElement) {
        try {
          var parentDoc = window.parent && window.parent.document;
          if (parentDoc) {
            mes = findMesNode(window.frameElement, parentDoc);
            if (mes) {
              id = mes.getAttribute('mesid') || mes.getAttribute('data-mesid') || mes.dataset.mesid;
              if (id != null) return Number(id);
            }
          }
        } catch(e) {}
      }
      return null;
    } catch(e) { return null; }
  }

  function getLatestAssistantMessageId() {
    var getMessages = getApi('getChatMessages');
    if (getMessages) {
      try {
        var messages = getMessages('0-{{lastMessageId}}', { role:'assistant' }) || [];
        if (messages.length) return Number(messages[messages.length - 1].message_id);
      } catch(e) {
        log('warn', 'assistant message lookup failed', e);
      }
    }
    return null;
  }

  function setArchived(archived) {
    if (archived) {
      wrap.classList.add('mnx-opts-archived');
      wrap.style.display = 'none';
    } else {
      wrap.classList.remove('mnx-opts-archived');
      wrap.style.display = '';
    }
  }

  function mnxEnsureLatestOptions() {
    var host = getHostingMessageId();
    var latest = getLatestAssistantMessageId();
    if (host == null || latest == null) {
      setArchived(false);
      return true;
    }
    if (Number(host) !== Number(latest)) {
      setArchived(true);
      log('info', 'archive stale options', { host: host, latest: latest });
      return false;
    }
    setArchived(false);
    return true;
  }

  var modeBtn = wrap.querySelector('.mnx-mode-btn');
  var MODES = ['send','setinput','append'];
  var MODE_LABELS = { send:'发送', setinput:'填入', append:'追加' };
  var MODE_KEY = 'dawei-opts-mode-v4';
  var currentMode = 'send';
  try { var saved = localStorage.getItem(MODE_KEY); if (MODES.indexOf(saved) >= 0) currentMode = saved; } catch(e) {}

  function applyMode(mode) {
    if (MODES.indexOf(mode) === -1) mode = 'send';
    currentMode = mode;
    wrap.setAttribute('data-mode', mode);
    if (modeBtn) {
      modeBtn.textContent = MODE_LABELS[mode];
      modeBtn.setAttribute('title', '点击切换：发送 / 填入 / 追加');
      modeBtn.setAttribute('aria-label', '当前模式：' + MODE_LABELS[mode]);
    }
    try { localStorage.setItem(MODE_KEY, mode); } catch(e) {}
  }

  function getTrigger() {
    if (typeof triggerSlash === 'function') return triggerSlash;
    try { if (window.parent && typeof window.parent.triggerSlash === 'function') return window.parent.triggerSlash.bind(window.parent); } catch(e) {}
    try { if (window.top && typeof window.top.triggerSlash === 'function') return window.top.triggerSlash.bind(window.top); } catch(e) {}
    return null;
  }

  function getInput() {
    try { if (window.parent && window.parent.$) return window.parent.$('#send_textarea').val() || ''; } catch(e) {}
    try { if (window.top && window.top.$) return window.top.$('#send_textarea').val() || ''; } catch(e) {}
    return '';
  }

  async function dispatchOpt(item) {
    var text = getOptText(item);
    if (!text || item.getAttribute('data-mnx-sending') === '1') return;
    var trig = getTrigger();
    if (!trig) { log('error', 'triggerSlash unavailable'); return; }
    item.setAttribute('data-mnx-sending','1');
    text = text.replace(/\|/g, '｜');
    try {
      var command = '';
      if (currentMode === 'send') {
        command = '/send ' + text + '|/trigger';
      } else if (currentMode === 'setinput') {
        command = '/setinput ' + text;
      } else if (currentMode === 'append') {
        var cur = getInput();
        command = '/setinput ' + (cur ? cur + '\n' + text : text);
      }
      await trig(command);
      if (currentMode === 'send') {
        item.classList.add('mnx-sent');
        setTimeout(function(){ item.classList.remove('mnx-sent'); }, 900);
      }
    } catch (err) {
      log('error', 'dispatch failed', err);
    } finally {
      item.removeAttribute('data-mnx-sending');
    }
  }

  function enhanceOptAccessibility() {
    wrap.querySelectorAll('.opt').forEach(function(item) {
      if (item.getAttribute('data-mnx-a11y') === '1') return;
      item.setAttribute('data-mnx-a11y', '1');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      var label = getOptText(item);
      if (label) item.setAttribute('aria-label', '行动选项：' + label);
    });
  }

  applyMode(currentMode);
  enhanceOptAccessibility();

  if (modeBtn) {
    modeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      applyMode(MODES[(MODES.indexOf(currentMode) + 1) % MODES.length]);
    });
  }

  wrap.addEventListener('click', function(e) {
    if (e.target.closest('.mnx-mode-btn')) return;
    var item = e.target.closest('.opt');
    if (!item) return;
    e.preventDefault();
    e.stopPropagation();
    dispatchOpt(item);
  }, false);

  wrap.addEventListener('keydown', function(e) {
    var item = e.target.closest('.opt');
    if (!item) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dispatchOpt(item);
    }
  }, false);

  var eventOnApi = getApi('eventOn') || getApi('event_on');
  if (eventOnApi) {
    var events = null;
    try { events = window.tavern_events || (window.parent && window.parent.tavern_events) || (window.top && window.top.tavern_events); } catch(e) {}
    ['CHAT_CHANGED','MESSAGE_RECEIVED','MESSAGE_SWIPED','MESSAGE_DELETED','MESSAGE_EDITED'].forEach(function(k) {
      var eventName = events && events[k] ? events[k] : k.toLowerCase();
      try { eventOnApi(eventName, mnxEnsureLatestOptions); } catch(e) {}
    });
  }
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) mnxEnsureLatestOptions();
  });
  setTimeout(mnxEnsureLatestOptions, 0);
  setTimeout(mnxEnsureLatestOptions, 400);
})();
