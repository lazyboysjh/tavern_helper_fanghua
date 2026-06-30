/* 大魏芳华 MVU 数据桥接 + 主栏目渲染 */
(function (global) {
  var DWF_MAIN_PANEL_KEY = 'dwf-main-panel-v1';
  var DWF_PANEL_TITLES = {
    tianji: '天机',
    fengxin: '风闻',
    lishi: '历事',
    fende: '群芳录',
    fangming: '房名次',
    zisi: '子嗣',
  };
  var RANK_ORDER = { 妾室: 4, 近侍: 3, 婢妾: 2, 外室: 1 };
  var RANK_COLORS = { 妾室: '#daa520', 近侍: '#e85d6a', 婢妾: '#8b9aab', 外室: '#6a8caf' };
  var CAMP_COLORS = {
    无: '#8b9aab',
    曹爽: '#c6764a',
    王凌: '#6a8caf',
    司马氏: '#9b7bb8',
    勤王系: '#e85d6a',
    自立: '#daa520',
  };
  var ROUTE_COLORS = {
    潜龙: '#e85d6a',
    魏祚: '#b89465',
    旁观: '#8b9aab',
    山林: '#6a9a6a',
    异数: '#9b7bb8',
  };
  var JIYI_SOFT_CAP = 10;
  var TAB_META = {
    tianji: { icon: 'fa-sun', title: '天机', sub: '行程 · 朝局 · 命途', accent: '#c9a227' },
    fengxin: { icon: 'fa-wind', title: '风闻', sub: '机宜 · 邸报 · 里巷', accent: '#6a8caf' },
    lishi: { icon: 'fa-book-open', title: '历事', sub: '津渡支汊已演之纪', accent: '#b89465' },
    fangming: { icon: 'fa-house-chimney', title: '房名次', sub: '后宅礼法名分', accent: '#daa520' },
    zisi: { icon: 'fa-baby', title: '子嗣', sub: '名册 · 孺慕', accent: '#e85d6a' },
  };

  function isEnded(stat) {
    var w = (stat && stat['世界与剧情']) || {};
    var v = w['已终局'];
    return v === true || v === 'true' || v === 1 || v === '1';
  }

  function getEnding(stat) {
    var w = (stat && stat['世界与剧情']) || {};
    return (w['终局'] && typeof w['终局'] === 'object' ? w['终局'] : null) || null;
  }

  function getRoutePreview(stat) {
    var w = (stat && stat['世界与剧情']) || {};
    return (w['路线预判'] && typeof w['路线预判'] === 'object' ? w['路线预判'] : {}) || {};
  }

  function renderRouteBanner(stat) {
    if (isEnded(stat)) {
      var end = getEnding(stat) || {};
      var rc = ROUTE_COLORS[(stat['命途'] || {})['主导']] || '#b89465';
      return (
        '<div class="dwf-route-banner dwf-route-ended" style="--route-accent:' +
        rc +
        '">' +
        '<div class="dwf-route-banner-k"><i class="fa-solid fa-scroll"></i> 故事已收束</div>' +
        '<div class="dwf-route-banner-v">' +
        esc(end['名'] || '终局') +
        '</div>' +
        (end['叙述'] ? '<div class="dwf-route-banner-sub">' + renderParas(splitParas(end['叙述']), 'dwf-route-banner-paras') + '</div>' : '') +
        '</div>'
      );
    }
    var mingtu = (stat && stat['命途']) || {};
    var lead = mingtu['主导'];
    var prev = getRoutePreview(stat);
    var hint = prev['倾向'] || '';
    var rc = ROUTE_COLORS[lead] || '#8b9aab';
    if (!lead && !hint) return '';
    return (
      '<div class="dwf-route-banner" style="--route-accent:' +
      rc +
      '">' +
      '<div class="dwf-route-banner-k"><i class="fa-solid fa-compass"></i> 当前路线</div>' +
      '<div class="dwf-route-banner-row">' +
      (lead
        ? '<span class="dwf-route-pill"><i class="fa-solid fa-flag"></i> ' + esc(lead) + '</span>'
        : '') +
      (hint ? '<span class="dwf-route-pill soft">收束倾向 · ' + esc(hint) + '</span>' : '') +
      '</div></div>'
    );
  }

  function renderEndingCard(stat) {
    var end = getEnding(stat) || {};
    var w = (stat && stat['世界与剧情']) || {};
    var trip = w['行程'];
    var lead = ((stat && stat['命途']) || {})['主导'];
    var rc = ROUTE_COLORS[lead] || '#b89465';
    return (
      '<div class="dwf-ending-card" style="--ending-accent:' +
      rc +
      '">' +
      '<div class="dwf-ending-glow" aria-hidden="true"></div>' +
      '<div class="dwf-ending-seal"><i class="fa-solid fa-yin-yang"></i></div>' +
      '<div class="dwf-ending-title">' +
      esc(end['名'] || '乱世收束') +
      '</div>' +
      '<div class="dwf-ending-lead">' +
      (lead ? '命途 · ' + esc(lead) : '命途未定') +
      '</div>' +
      '<div class="dwf-ending-body">' +
      renderParas(splitParas(end['叙述'] || '大势已定，余韵尽在历事与群芳录中。'), 'dwf-ending-paras') +
      '</div>' +
      '<div class="dwf-ending-foot">' +
      (trip != null ? '<span>收束于行程 ' + esc(String(trip)) + '</span>' : '') +
      '<span>机宜已尘封</span></div></div>'
    );
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function safeStr(v, fallback) {
    if (v == null || v === '') return fallback == null ? '—' : fallback;
    if (typeof v === 'object') return fallback == null ? '—' : fallback;
    return String(v);
  }

  function safeObj(v) {
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  }

  function formatSceneRoles(v) {
    if (v == null || v === '') return '—';
    if (Array.isArray(v)) {
      var arr = v.map(function (x) {
        return String(x || '').trim();
      }).filter(Boolean);
      return arr.length ? arr.join('、') : '—';
    }
    return String(v);
  }

  function splitParas(text) {
    var s = String(text || '').trim();
    if (!s) return [];
    return s
      .split(/\n+|[；;]+/)
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
  }

  function parseJiyiReason(raw) {
    var s = String(raw || '').trim();
    if (!s) return { lead: '', paras: [] };
    var idx = s.indexOf('：');
    if (idx < 0) idx = s.indexOf(':');
    var lead = idx >= 0 ? s.slice(0, idx).trim() : '';
    var body = idx >= 0 ? s.slice(idx + 1).trim() : s;
    var paras = splitParas(body);
    if (!paras.length && body) paras = [body];
    return { lead: lead, paras: paras };
  }

  function renderParas(paras, className) {
    if (!paras || !paras.length) return '';
    return (
      '<div class="' +
      className +
      '">' +
      paras
        .map(function (p) {
          return '<p>' + esc(p) + '</p>';
        })
        .join('') +
      '</div>'
    );
  }

  function urgencyLabel(level) {
    var n = Number(level) || 0;
    if (n >= 5) return '燃眉';
    if (n >= 4) return '紧急';
    if (n >= 3) return '要紧';
    return '寻常';
  }

  function getPinkBook(stat) {
    stat = stat || (global.getStatData ? global.getStatData() : {});
    var book = stat['群芳录'];
    return book && typeof book === 'object' ? book : {};
  }

  function getCharEntry(stat, name) {
    return getPinkBook(stat)[name] || {};
  }

  function isPresent(v) {
    return v === true || v === 'true' || v === 1 || v === '1';
  }

  function urgencyAccent(level) {
    var n = Number(level) || 0;
    if (n >= 5) return '#e85d6a';
    if (n >= 4) return '#d97a56';
    if (n >= 3) return '#c9a227';
    return '#8b9aab';
  }


  function formatDisplayTime(stat) {
    var world = (stat && stat['世界与剧情']) || {};
    var tianshi = world['天时'] || {};
    if (tianshi['显示']) return String(tianshi['显示']);
    var chaos = (stat && stat['朝局']) || {};
    var jinian = chaos['纪年'] || {};
    var parts = [];
    if (jinian['年号']) {
      parts.push(String(jinian['年号']) + (jinian['年数'] != null && jinian['年数'] !== '' ? String(jinian['年数']) + '年' : ''));
    }
    if (tianshi['月']) parts.push(String(tianshi['月']) + '月');
    if (tianshi['旬']) parts.push(String(tianshi['旬']));
    if (tianshi['时辰']) parts.push('·' + String(tianshi['时辰']));
    return parts.length ? parts.join('') : '景初三年五月上旬·暮';
  }

  function listJiyiEntries(stat) {
    var fx = (stat && stat['风闻录']) || {};
    var jiyi = fx['机宜'] || {};
    var jindu = jiyi['津渡'] && typeof jiyi['津渡'] === 'object' ? jiyi['津渡'] : {};
    var zhicha = jiyi['支汊'] && typeof jiyi['支汊'] === 'object' ? jiyi['支汊'] : {};
    var rows = [];
    Object.keys(jindu).forEach(function (k) {
      rows.push({ key: k, item: jindu[k] || {}, bucket: '津渡' });
    });
    Object.keys(zhicha).forEach(function (k) {
      rows.push({ key: k, item: zhicha[k] || {}, bucket: '支汊' });
    });
    rows.sort(function (a, b) {
      var fa = Number(a.item['火急']) || 0;
      var fb = Number(b.item['火急']) || 0;
      if (fb !== fa) return fb - fa;
      if (a.bucket !== b.bucket) return a.bucket === '津渡' ? -1 : 1;
      return String(a.key).localeCompare(String(b.key), 'zh-CN');
    });
    return rows;
  }
  function renderMoonRing(yueke) {
    var max = 288;
    var cur = Math.max(0, Math.min(max, Number(yueke) || 0));
    var pct = cur / max;
    var r = 36;
    var c = 2 * Math.PI * r;
    var off = c * (1 - pct);
    return (
      '<div class="dwf-moon-ring" aria-label="行程 ' +
      cur +
      '">' +
      '<svg viewBox="0 0 88 88" aria-hidden="true">' +
      '<defs><linearGradient id="dwfMoonGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
      '<stop offset="0%" stop-color="#b89465"/><stop offset="100%" stop-color="#e85d6a"/>' +
      '</linearGradient></defs>' +
      '<circle class="dwf-moon-track" cx="44" cy="44" r="' +
      r +
      '"/>' +
      '<circle class="dwf-moon-fill" cx="44" cy="44" r="' +
      r +
      '" stroke-dasharray="' +
      c +
      '" stroke-dashoffset="' +
      off +
      '"/>' +
      '</svg>' +
      '<div class="dwf-moon-core"><span class="dwf-moon-num">' +
      cur +
      '</span><span class="dwf-moon-lab">行程</span></div></div>'
    );
  }

  function renderTianjiPanel(stat) {
    var world = (stat && stat['世界与剧情']) || {};
    var hero = (stat && stat['主角']) || {};
    var faction = (stat && stat['主角势力']) || {};
    var chaos = (stat && stat['朝局']) || {};
    var jinian = chaos['纪年'] || {};
    var mingtu = (stat && stat['命途']) || {};
    var yinji = (stat && stat['命途印记']) || {};
    var yueke = world['行程'];
    var events = (stat && stat['鼎革纪']) || {};
    var eventHtml = '';
    if (events && typeof events === 'object' && Object.keys(events).length) {
      eventHtml =
        '<div class="dwf-event-tags">' +
        Object.keys(events)
          .map(function (k) {
            var v = events[k];
            var label = typeof v === 'string' && v ? k + ' · ' + v : k;
            return '<span class="dwf-event-tag" title="' + esc(k) + '">' + esc(label) + '</span>';
          })
          .join('') +
        '</div>';
    } else {
      eventHtml = '<div class="dwf-empty">暂无鼎革定局</div>';
    }
    var routeHtml = '';
    var tags = mingtu['标签'] || [];
    var locks = mingtu['已锁'] || [];
    var lead = mingtu['主导'];
    if (lead || tags.length || locks.length || Object.keys(yinji).length) {
      routeHtml =
        '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid fa-route"></i>命途</span></div><div class="dwf-chip-row dwf-chip-row-loose">';
      if (lead) {
        var rc = ROUTE_COLORS[lead] || '#b89465';
        routeHtml +=
          '<span class="dwf-chip accent" style="--chip-accent:' +
          rc +
          '"><i class="fa-solid fa-compass"></i> 主导 ' +
          esc(lead) +
          '</span>';
      }
      tags.forEach(function (t) {
        routeHtml += '<span class="dwf-chip">' + esc(t) + '</span>';
      });
      locks.forEach(function (t) {
        routeHtml += '<span class="dwf-chip dwf-chip-lock"><i class="fa-solid fa-lock"></i> ' + esc(t) + '</span>';
      });
      Object.keys(yinji).forEach(function (k) {
        routeHtml +=
          '<span class="dwf-chip" title="命途印记"><span class="dwf-chip-dim">' +
          esc(k) +
          '</span> ' +
          esc(yinji[k]) +
          '</span>';
      });
      routeHtml += '</div></div>';
    }
    var chaosHtml =
      '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid fa-landmark"></i>朝局</span></div><div class="dwf-kv">' +
      '<div class="dwf-kv-row"><span class="dwf-kv-k">皇帝</span><span class="dwf-kv-v">' +
      esc(chaos['皇帝'] || '—') +
      '</span></div>' +
      '<div class="dwf-kv-row"><span class="dwf-kv-k">权柄</span><span class="dwf-kv-v">' +
      esc(chaos['权柄'] || '—') +
      '</span></div>' +
      '<div class="dwf-kv-row"><span class="dwf-kv-k">法统</span><span class="dwf-kv-v">' +
      esc(chaos['法统'] || '—') +
      '</span></div>' +
      '<div class="dwf-kv-row"><span class="dwf-kv-k">纪年</span><span class="dwf-kv-v">' +
      esc(
        (jinian['年号'] || '') +
          (jinian['年数'] != null && jinian['年数'] !== '' ? String(jinian['年数']) : ''),
      ) +
      '</span></div></div></div>';
    var clues = hero['关键线索与物品'];
    var clueHtml = '';
    if (clues && typeof clues === 'object' && Object.keys(clues).length) {
      clueHtml = Object.keys(clues)
        .map(function (k) {
          return (
            '<div class="dwf-kv-row"><span class="dwf-kv-k">' +
            esc(k) +
            '</span><span class="dwf-kv-v">' +
            esc(clues[k]) +
            '</span></div>'
          );
        })
        .join('');
    } else {
      clueHtml = '<div class="dwf-empty" style="padding:14px">暂无关键线索</div>';
    }
    var interact = safeStr(world['当前互动角色'], '—');
    var scene = formatSceneRoles(world['当前场景角色']);
    var rank = faction['官爵'] || '';
    var camp = faction['阵营'] || '无';
    var campColor = CAMP_COLORS[camp] || '#8b9aab';
    var troops = faction['部曲'] != null && faction['部曲'] !== '' ? String(faction['部曲']) : '0';
    var base = faction['根基'] || '—';
    return (
      renderPanelIntro('tianji', stat, '<i class="fa-solid fa-compass-drafting"></i> 行程 ' + esc(String(yueke != null ? yueke : '—'))) +
      renderRouteBanner(stat) +
      '<div class="dwf-tianji-hero">' +
      renderMoonRing(yueke) +
      '<div class="dwf-tianji-meta">' +
      '<div class="dwf-tianji-time">' +
      esc(formatDisplayTime(stat)) +
      '</div>' +
      '<div class="dwf-tianji-loc"><i class="fa-solid fa-location-dot"></i>' +
      esc(world['当前地点'] || '平原郡·秦家庄') +
      '</div>' +
      '<div class="dwf-chip-row">' +
      '<span class="dwf-chip"><i class="fa-solid fa-user"></i> 互动 ' +
      esc(interact) +
      '</span>' +
      '<span class="dwf-chip"><i class="fa-solid fa-users"></i> 场景 ' +
      esc(scene) +
      '</span>' +
      '</div></div></div>' +
      '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid fa-crown"></i>主角</span></div>' +
      '<div class="dwf-kv">' +
      '<div class="dwf-kv-row"><span class="dwf-kv-k">位置</span><span class="dwf-kv-v dwf-clamp-3">' +
      esc(hero['当前位置'] || '—') +
      '</span></div>' +
      '<div class="dwf-kv-row"><span class="dwf-kv-k">状态</span><span class="dwf-kv-v dwf-clamp-3">' +
      esc(hero['当前状态'] || '—') +
      '</span></div></div></div>' +
      '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid fa-flag"></i>主角势力</span></div>' +
      '<div class="dwf-faction-card" style="--faction-accent:' +
      campColor +
      '">' +
      '<div class="dwf-faction-top">' +
      '<span class="dwf-faction-rank">' +
      esc(rank || '白身') +
      '</span>' +
      '<span class="dwf-faction-camp">' +
      esc(camp) +
      '</span></div>' +
      '<div class="dwf-faction-grid">' +
      '<div class="dwf-faction-stat"><span class="dwf-faction-stat-k">部曲</span><span class="dwf-faction-stat-v">' +
      esc(troops) +
      '</span></div>' +
      '<div class="dwf-faction-stat dwf-faction-stat-wide"><span class="dwf-faction-stat-k">根基</span><span class="dwf-faction-stat-v">' +
      esc(base) +
      '</span></div></div></div></div>' +
      chaosHtml +
      routeHtml +
      '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid fa-key"></i>关键线索</span></div>' +
      clueHtml +
      '</div>' +
      '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid fa-bolt"></i>鼎革纪</span></div>' +
      eventHtml +
      '</div>'
    );
  }

  function renderPanelIntro(panelId, stat, statText) {
    var meta = TAB_META[panelId] || { icon: 'fa-circle', title: panelId, sub: '', accent: '#b89465' };
    return (
      '<div class="dwf-panel-intro" style="--panel-accent:' +
      meta.accent +
      '">' +
      '<div class="dwf-panel-intro-icon"><i class="fa-solid ' +
      meta.icon +
      '"></i></div>' +
      '<div class="dwf-panel-intro-text">' +
      '<div class="dwf-panel-intro-title">' +
      esc(meta.title) +
      '</div>' +
      '<div class="dwf-panel-intro-sub">' +
      esc(meta.sub) +
      '</div></div>' +
      (statText ? '<div class="dwf-panel-intro-stat">' + statText + '</div>' : '') +
      '</div>'
    );
  }

  function countdownState(remain) {
    if (remain == null) return 'open';
    if (remain <= 1) return 'critical';
    if (remain <= 4) return 'warning';
    return 'safe';
  }

  function renderCountdownTop(item, yueke, accent, level) {
    var deadline = Number(item['截止行程']) || 0;
    var openTrip = Number(item['开启行程']) || Math.max(1, yueke);
    if (!deadline) return '';
    var remain = Math.max(0, deadline - yueke);
    var windowTotal = Math.max(1, deadline - openTrip + 1);
    var pct = Math.max(0.06, Math.min(1, remain / windowTotal));
    var state = countdownState(remain);
    var r = 24;
    var c = 2 * Math.PI * r;
    var off = c * (1 - pct);
    return (
      '<div class="dwf-jiyi-countdown dwf-jiyi-countdown--' +
      state +
      '" style="--jiyi-accent:' +
      accent +
      '">' +
      '<div class="dwf-jiyi-countdown-ring" aria-label="剩余 ' +
      remain +
      ' 格">' +
      '<svg viewBox="0 0 56 56" aria-hidden="true">' +
      '<circle class="dwf-cd-track" cx="28" cy="28" r="' +
      r +
      '"/>' +
      '<circle class="dwf-cd-fill" cx="28" cy="28" r="' +
      r +
      '" stroke-dasharray="' +
      c +
      '" stroke-dashoffset="' +
      off +
      '"/></svg>' +
      '<div class="dwf-cd-core"><span class="dwf-cd-num">' +
      remain +
      '</span><span class="dwf-cd-unit">格</span></div></div>' +
      '<div class="dwf-jiyi-countdown-info">' +
      '<div class="dwf-jiyi-countdown-label"><i class="fa-regular fa-hourglass-half"></i> 行程倒计时</div>' +
      '<div class="dwf-jiyi-countdown-sub">第 <b>' +
      deadline +
      '</b> 格截止 · 窗宽 ' +
      windowTotal +
      ' 格</div>' +
      '<div class="dwf-jiyi-countdown-track"><span style="width:' +
      Math.round(pct * 100) +
      '%"></span></div></div>' +
      '<div class="dwf-jiyi-countdown-fire" title="火急 ' +
      level +
      '"><span>' +
      esc(urgencyLabel(level)) +
      '</span><em>' +
      level +
      '</em></div></div>'
    );
  }

  function parseRelatedNames(raw) {
    return String(raw || '')
      .split(/[、,，]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function collectJiyiTags(stat, item) {
    var tags = [];
    var seen = {};
    function push(kind, label) {
      var k = kind + ':' + label;
      if (seen[k]) return;
      seen[k] = true;
      tags.push({ kind: kind, label: label });
    }
    (item['卡片标签'] || []).forEach(function (t) {
      if (t && t.label) push(t.kind || 'fate', t.label);
    });
    var book = getPinkBook(stat);
    parseRelatedNames(item['相关人物']).forEach(function (name) {
      if (!book[name]) return;
      if (!isPresent(book[name]['是否登场'])) {
        push('meet', '新逢·' + name);
      }
    });
    var prev = getRoutePreview(stat);
    var lead = ((stat && stat['命途']) || {})['主导'];
    if (lead && prev['倾向']) {
      var hint = String(prev['倾向']);
      tags.forEach(function (t) {
        if (t.kind !== 'ending') return;
        var tail = String(t.label).replace(/^收束·/, '');
        if (tail.indexOf(hint) >= 0 || hint.indexOf(tail) >= 0) t.hot = true;
      });
    }
    return tags;
  }

  function renderJiyiTagRow(stat, item) {
    var tags = collectJiyiTags(stat, item);
    if (!tags.length) return '';
    return (
      '<div class="dwf-jiyi-tags">' +
      tags
        .map(function (t) {
          var cls = 'dwf-jiyi-tag dwf-jiyi-tag--' + esc(t.kind || 'fate');
          if (t.hot) cls += ' is-hot';
          if (t.kind === 'route' && ROUTE_COLORS[t.label]) {
            return (
              '<span class="' +
              cls +
              '" style="--tag-accent:' +
              ROUTE_COLORS[t.label] +
              '">' +
              esc(t.label) +
              '</span>'
            );
          }
          return '<span class="' + cls + '">' + esc(t.label) + '</span>';
        })
        .join('') +
      '</div>'
    );
  }

  function renderJiyiCard(row, yueke, stat) {
    var key = row.key;
    var item = row.item || {};
    var level = Math.max(1, Math.min(5, Number(item['火急']) || 3));
    var accent = urgencyAccent(level);
    var parsed = parseJiyiReason(item['因由'] || '');
    var bucketCls = row.bucket === '津渡' ? 'is-jindu' : 'is-zhicha';
    var countdownHtml = renderCountdownTop(item, yueke, accent, level);
    var meta = [];
    if (item['相关人物']) {
      meta.push('<span class="dwf-jiyi-meta-chip"><i class="fa-solid fa-user"></i>' + esc(item['相关人物']) + '</span>');
    }
    if (item['建议地点']) {
      meta.push('<span class="dwf-jiyi-meta-chip"><i class="fa-solid fa-map-pin"></i>' + esc(item['建议地点']) + '</span>');
    }
    var tagsHtml = renderJiyiTagRow(stat, item);
    return (
      '<article class="dwf-jiyi-card ' +
      bucketCls +
      '" style="--jiyi-accent:' +
      accent +
      '">' +
      countdownHtml +
      (tagsHtml ? tagsHtml : '') +
      '<div class="dwf-jiyi-glow" aria-hidden="true"></div>' +
      '<div class="dwf-jiyi-main">' +
      '<header class="dwf-jiyi-head">' +
      '<div class="dwf-jiyi-head-left">' +
      '<span class="dwf-jiyi-bucket">' +
      esc(row.bucket) +
      '</span>' +
      '<h4 class="dwf-jiyi-name">' +
      esc(key) +
      '</h4></div></header>' +
      (parsed.lead ? '<div class="dwf-jiyi-lead">' + esc(parsed.lead) + '</div>' : '') +
      renderParas(parsed.paras, 'dwf-jiyi-body') +
      (meta.length ? '<footer class="dwf-jiyi-foot">' + meta.join('') + '</footer>' : '') +
      '</div></article>'
    );
  }

  function renderFengxinPanel(stat) {
    var fx = safeObj(stat && stat['风闻录']);
    var banner = renderRouteBanner(stat);
    if (isEnded(stat)) {
      function rumorBlock(title, icon, data) {
        var keys = data && typeof data === 'object' ? Object.keys(data) : [];
        if (!keys.length) return '';
        return (
          '<div class="dwf-section dwf-section-rumor"><div class="dwf-section-hd"><span><i class="fa-solid ' +
          icon +
          '"></i>' +
          title +
          '</span></div><div class="dwf-rumor-list">' +
          keys
            .map(function (k) {
              var paras = splitParas(data[k]);
              return (
                '<div class="dwf-rumor-item"><div class="dwf-rumor-key">' +
                esc(k) +
                '</div>' +
                renderParas(paras.length ? paras : [String(data[k] || '')], 'dwf-rumor-body') +
                '</div>'
              );
            })
            .join('') +
          '</div></div>'
        );
      }
      return (
        renderPanelIntro('fengxin', stat, '<i class="fa-solid fa-scroll"></i> 已收束') +
        banner +
        '<div class="dwf-fengxin-ended">' +
        renderEndingCard(stat) +
        '</div>' +
        rumorBlock('邸报', 'fa-scroll', fx['邸报']) +
        rumorBlock('里巷', 'fa-comments', fx['里巷'])
      );
    }
    var entries = listJiyiEntries(stat);
    var yueke = Number(_.get(stat, '世界与剧情.行程', 0)) || 0;
    var urgentHtml = '';
    if (entries.length) {
      var shown = entries.slice(0, JIYI_SOFT_CAP);
      urgentHtml =
        '<div class="dwf-jiyi-stack">' +
        shown
          .map(function (row) {
            return renderJiyiCard(row, yueke, stat);
          })
          .join('') +
        '</div>';
      if (entries.length > JIYI_SOFT_CAP) {
        urgentHtml +=
          '<div class="dwf-jiyi-more"><i class="fa-solid fa-layer-group"></i> 另有 ' +
          (entries.length - JIYI_SOFT_CAP) +
          ' 条机宜未展，演毕前置者后将陆续显现</div>';
      }
    } else {
      urgentHtml = '<div class="dwf-empty dwf-empty-fengxin"><i class="fa-solid fa-wind"></i><span>风平无事，暂无机宜</span></div>';
    }
    function rumorBlock(title, icon, data) {
      var keys = data && typeof data === 'object' ? Object.keys(data) : [];
      if (!keys.length) return '';
      return (
        '<div class="dwf-section dwf-section-rumor"><div class="dwf-section-hd"><span><i class="fa-solid ' +
        icon +
        '"></i>' +
        title +
        '</span></div><div class="dwf-rumor-list">' +
        keys
          .map(function (k) {
            var paras = splitParas(data[k]);
            return (
              '<div class="dwf-rumor-item"><div class="dwf-rumor-key">' +
              esc(k) +
              '</div>' +
              renderParas(paras.length ? paras : [String(data[k] || '')], 'dwf-rumor-body') +
              '</div>'
            );
          })
          .join('') +
        '</div></div>'
      );
    }
    var introStat =
      entries.length > 0
        ? '<i class="fa-solid fa-bolt"></i> ' + entries.length + ' 条机宜'
        : '<i class="fa-solid fa-leaf"></i> 无事';
    return (
      renderPanelIntro('fengxin', stat, introStat) +
      banner +
      urgentHtml +
      rumorBlock('邸报', 'fa-scroll', fx['邸报']) +
      rumorBlock('里巷', 'fa-comments', fx['里巷'])
    );
  }

  function renderLishiPanel(stat) {
    var log = safeObj(stat && stat['履历']);
    var keys = Object.keys(log).sort(function (a, b) {
      var na = parseInt(a, 10);
      var nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b), 'zh-CN');
    });
    if (!keys.length) {
      return (
        renderPanelIntro('lishi', stat, '') +
        '<div class="dwf-empty dwf-empty-lishi"><i class="fa-solid fa-book-open"></i><span>史册未书 · 大节演毕后将记入历事</span></div>'
      );
    }
    return (
      renderPanelIntro('lishi', stat, '<i class="fa-solid fa-pen-nib"></i> ' + keys.length + ' 则') +
      '<div class="dwf-timeline">' +
      keys
        .map(function (k, i) {
          var paras = splitParas(log[k]);
          return (
            '<div class="dwf-timeline-item dwf-glass-card">' +
            '<div class="dwf-timeline-idx">第 ' +
            esc(String(k)) +
            ' 则</div>' +
            renderParas(paras.length ? paras : [safeStr(log[k], '')], 'dwf-timeline-text') +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function rankSortKey(name, entry) {
    var rank = (entry && entry['位分']) || '';
    return -(RANK_ORDER[rank] || 0);
  }

  function renderFangmingPanel(stat) {
    var ranks = safeObj(stat && stat['房名次']);
    var keys = Object.keys(ranks).filter(function (name) {
      return ranks[name] && typeof ranks[name] === 'object';
    }).sort(function (a, b) {
      var da = rankSortKey(a, ranks[a]);
      var db = rankSortKey(b, ranks[b]);
      if (da !== db) return da - db;
      return String(a).localeCompare(String(b), 'zh-CN');
    });
    if (!keys.length) {
      return (
        renderPanelIntro('fangming', stat, '') +
        '<div class="dwf-empty dwf-empty-fangming"><i class="fa-solid fa-house-chimney"></i><span>后宅名分未立 · 收近侍、纳妾后将记入房名次</span></div>'
      );
    }
    return (
      renderPanelIntro('fangming', stat, '<i class="fa-solid fa-crown"></i> ' + keys.length + ' 人') +
      '<div class="dwf-rank-grid">' +
      keys
        .map(function (name) {
          var entry = ranks[name] || {};
          var rank = entry['位分'] || '—';
          var accent = RANK_COLORS[rank] || '#b89465';
          var mark = String(name).slice(0, 1);
          return (
            '<div class="dwf-rank-card dwf-glass-card" style="--rank-accent:' +
            accent +
            '">' +
            '<div class="dwf-rank-seal">' +
            esc(mark) +
            '</div>' +
            '<div><div class="dwf-rank-name">' +
            esc(name) +
            '</div><div class="dwf-rank-sub">后宅礼法名分</div></div>' +
            '<span class="dwf-rank-badge">' +
            esc(rank) +
            '</span></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function renderZisiPanel(stat) {
    var children = safeObj(stat && stat['子嗣']);
    var keys = Object.keys(children).filter(function (name) {
      return children[name] && typeof children[name] === 'object';
    }).sort(function (a, b) {
      var ca = Number(children[a] && children[a]['春秋']) || 0;
      var cb = Number(children[b] && children[b]['春秋']) || 0;
      if (cb !== ca) return cb - ca;
      return String(a).localeCompare(String(b), 'zh-CN');
    });
    if (!keys.length) {
      return (
        renderPanelIntro('zisi', stat, '') +
        '<div class="dwf-empty dwf-empty-zisi"><i class="fa-solid fa-baby"></i><span>子嗣名册尚空 · 分娩或收养后将记入此册</span></div>'
      );
    }
    return (
      renderPanelIntro('zisi', stat, '<i class="fa-solid fa-heart"></i> ' + keys.length + ' 名') +
      '<div class="dwf-child-grid">' +
      keys
        .map(function (name) {
          var c = children[name] || {};
          var gender = c['男女'] === '女' ? 'female' : 'male';
          var genderLabel = c['男女'] === '女' ? '女' : '男';
          var accent = gender === 'female' ? '#e85d6a' : '#6a8caf';
          var rumu = Math.max(0, Math.min(100, Number(c['孺慕']) || 0));
          return (
            '<div class="dwf-child-card dwf-glass-card" style="--child-accent:' +
            accent +
            '">' +
            '<div class="dwf-child-head"><span class="dwf-child-name">' +
            esc(name) +
            '</span><span class="dwf-child-gender ' +
            gender +
            '">' +
            esc(genderLabel) +
            '</span></div>' +
            '<div class="dwf-child-meta">' +
            '<span class="dwf-child-pill">春秋 ' +
            esc(String(c['春秋'] != null ? c['春秋'] : 0)) +
            ' 岁</span>' +
            '<span class="dwf-child-pill">生母 ' +
            esc(c['生母'] || '—') +
            '</span></div>' +
            '<div class="dwf-rumu-row"><div class="dwf-rumu-label"><span>孺慕</span><span>' +
            rumu +
            ' / 100</span></div>' +
            '<div class="dwf-rumu-track"><span class="dwf-rumu-fill" style="width:' +
            rumu +
            '%"></span></div></div></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function countFengxinBadge(stat) {
    if (isEnded(stat)) return 0;
    return listJiyiEntries(stat).length;
  }

  function switchMainPanel(id, stat) {
    id = id || 'fende';
    if (!DWF_PANEL_TITLES[id]) id = 'fende';
    try {
      localStorage.setItem(DWF_MAIN_PANEL_KEY, id);
    } catch (e) {}
    $('#dwf-main-nav .dwf-main-tab')
      .removeClass('on')
      .attr('aria-selected', 'false')
      .each(function () {
        var pid = $(this).attr('data-dwf-panel');
        var ac = (TAB_META[pid] || {}).accent;
        if (ac) $(this).css('--tab-accent', ac);
      })
      .filter('[data-dwf-panel="' + id + '"]')
      .addClass('on')
      .attr('aria-selected', 'true');
    $('.dwf-panel').removeClass('on').attr('hidden', true);
    var $panel = $('#dwf-panel-' + id);
    $panel.addClass('on').removeAttr('hidden');
    $('#tit-main').text(DWF_PANEL_TITLES[id]);
    $('#lk').toggle(id === 'fende');
    if (stat) renderDwfSubPanels(stat);
  }

  function wrapPanelBody(html) {
    return '<div class="dwf-panel-body">' + html + '</div>';
  }

  function renderDwfSubPanels(stat) {
    stat = stat || (global.getStatData ? global.getStatData() : {});
    var ended = isEnded(stat);
    $('#dwf-panel-tianji').html(wrapPanelBody(renderTianjiPanel(stat)));
    $('#dwf-panel-fengxin').html(wrapPanelBody(renderFengxinPanel(stat)));
    $('#dwf-panel-lishi').html(wrapPanelBody(renderLishiPanel(stat)));
    $('#dwf-panel-fangming').html(wrapPanelBody(renderFangmingPanel(stat)));
    $('#dwf-panel-zisi').html(wrapPanelBody(renderZisiPanel(stat)));
    var $fengTab = $('#dwf-main-nav .dwf-main-tab[data-dwf-panel="fengxin"]');
    $fengTab.toggleClass('dwf-tab-ended', ended);
    var badge = countFengxinBadge(stat);
    var $b = $('#dwf-fengxin-badge');
    var $endMark = $('#dwf-fengxin-ended-mark');
    $endMark.remove();
    if (ended) {
      $b.remove();
      if (!$fengTab.find('#dwf-fengxin-ended-mark').length) {
        $fengTab.append('<span class="dwf-tab-ended-mark" id="dwf-fengxin-ended-mark">终</span>');
      }
    } else if (badge > 0) {
      if (!$b.length) {
        $fengTab.append('<span class="dwf-tab-badge" id="dwf-fengxin-badge">' + badge + '</span>');
      } else {
        $b.text(badge);
      }
    } else {
      $b.remove();
    }
  }

  function initDwfMainNav() {
    var saved = 'fende';
    try {
      saved = localStorage.getItem(DWF_MAIN_PANEL_KEY) || 'fende';
    } catch (e) {}
    $('#dwf-main-nav .dwf-main-tab').each(function () {
      var pid = $(this).attr('data-dwf-panel');
      var ac = (TAB_META[pid] || {}).accent;
      if (ac) $(this).css('--tab-accent', ac);
    });
    $('#dwf-main-nav').on('click', '.dwf-main-tab', function () {
      var id = $(this).attr('data-dwf-panel');
      switchMainPanel(id);
    });
    switchMainPanel(saved);
  }

  function patchCharCardBack($back, item) {
    if (!$back || !$back.length) return;
    $back.find('.dwf-char-tags').remove();
  }

  global.DwfMvu = {
    getPinkBook: getPinkBook,
    getCharEntry: getCharEntry,
    isPresent: isPresent,
    initDwfMainNav: initDwfMainNav,
    renderDwfSubPanels: renderDwfSubPanels,
    switchMainPanel: switchMainPanel,
    patchCharCardBack: patchCharCardBack,
    DWF_MAIN_PANEL_KEY: DWF_MAIN_PANEL_KEY,
  };
})(window);
