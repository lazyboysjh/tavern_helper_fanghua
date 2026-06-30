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

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    var yueke = world['行程'];
    var events = (stat && stat['鼎革纪']) || {};
    var eventHtml = '';
    if (events && typeof events === 'object' && Object.keys(events).length) {
      eventHtml =
        '<div class="dwf-event-tags">' +
        Object.keys(events)
          .map(function (k) {
            var v = events[k];
            return '<span class="dwf-event-tag">' + esc(typeof v === 'string' ? v : k) + '</span>';
          })
          .join('') +
        '</div>';
    } else {
      eventHtml = '<div class="dwf-empty">暂无鼎革定局</div>';
    }
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
    var interact = world['当前互动角色'] || '—';
    var scene = world['当前场景角色'] || '—';
    return (
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
      '<div class="dwf-kv-row"><span class="dwf-kv-k">位置</span><span class="dwf-kv-v">' +
      esc(hero['当前位置'] || '—') +
      '</span></div>' +
      '<div class="dwf-kv-row"><span class="dwf-kv-k">状态</span><span class="dwf-kv-v">' +
      esc(hero['当前状态'] || '—') +
      '</span></div></div></div>' +
      '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid fa-key"></i>关键线索</span></div>' +
      clueHtml +
      '</div>' +
      '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid fa-bolt"></i>鼎革纪</span></div>' +
      eventHtml +
      '</div>'
    );
  }

  function renderFengxinPanel(stat) {
    var fx = (stat && stat['风闻录']) || {};
    var entries = listJiyiEntries(stat);
    var yueke = Number(_.get(stat, '世界与剧情.行程', 0)) || 0;
    var urgentHtml = '';
    if (entries.length) {
      urgentHtml = entries
        .map(function (row) {
          var key = row.key;
          var item = row.item || {};
          var level = Number(item['火急']) || 3;
          var deadline = Number(item['截止行程']) || 0;
          var remain = deadline ? Math.max(0, deadline - yueke) : null;
          return (
            '<div class="dwf-urgent-card" style="--urgent-accent:' +
            urgencyAccent(level) +
            '">' +
            '<div class="dwf-urgent-title">' +
            esc(key) +
            ' <span class="dwf-urgent-pill">' + esc(row.bucket) + '</span></div>' +
            '<div class="dwf-urgent-reason">' +
            esc(item['因由'] || '') +
            '</div>' +
            '<div class="dwf-urgent-foot">' +
            '<span class="dwf-urgent-pill hot">火急 ' +
            level +
            '</span>' +
            (item['相关人物']
              ? '<span class="dwf-urgent-pill"><i class="fa-solid fa-user"></i> ' + esc(item['相关人物']) + '</span>'
              : '') +
            (item['建议地点']
              ? '<span class="dwf-urgent-pill"><i class="fa-solid fa-map-pin"></i> ' + esc(item['建议地点']) + '</span>'
              : '') +
            (deadline
              ? '<span class="dwf-urgent-pill' +
                (remain !== null && remain <= 2 ? ' hot' : '') +
                '">截止行程 ' +
                deadline +
                (remain !== null ? ' · 余' + remain + '格' : '') +
                '</span>'
              : '') +
            '</div></div>'
          );
        })
        .join('');
    } else {
      urgentHtml = '<div class="dwf-empty">风平无事，暂无机宜</div>';
    }
    function rumorBlock(title, icon, data) {
      var keys = data && typeof data === 'object' ? Object.keys(data) : [];
      if (!keys.length) return '';
      return (
        '<div class="dwf-section"><div class="dwf-section-hd"><span><i class="fa-solid ' +
        icon +
        '"></i>' +
        title +
        '</span></div><div class="dwf-rumor-list">' +
        keys
          .map(function (k) {
            return (
              '<div class="dwf-rumor-item"><div class="dwf-rumor-key">' +
              esc(k) +
              '</div>' +
              esc(data[k]) +
              '</div>'
            );
          })
          .join('') +
        '</div></div>'
      );
    }
    return (
      urgentHtml +
      rumorBlock('邸报', 'fa-scroll', fx['邸报']) +
      rumorBlock('里巷', 'fa-comments', fx['里巷'])
    );
  }

  function renderLishiPanel(stat) {
    var log = (stat && stat['履历']) || {};
    var keys = Object.keys(log).sort(function (a, b) {
      var na = parseInt(a, 10);
      var nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
    if (!keys.length) return '<div class="dwf-empty">史册未书 · 大节演毕后将记入历事</div>';
    return (
      '<div class="dwf-timeline">' +
      keys
        .map(function (k) {
          return '<div class="dwf-timeline-item"><div class="dwf-timeline-text">' + esc(log[k]) + '</div></div>';
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
    var ranks = (stat && stat['房名次']) || {};
    var keys = Object.keys(ranks).sort(function (a, b) {
      var da = rankSortKey(a, ranks[a]);
      var db = rankSortKey(b, ranks[b]);
      if (da !== db) return da - db;
      return String(a).localeCompare(String(b), 'zh-CN');
    });
    if (!keys.length) {
      return '<div class="dwf-empty">后宅名分未立 · 收近侍、纳妾后将记入房名次</div>';
    }
    return (
      '<div class="dwf-rank-grid">' +
      keys
        .map(function (name) {
          var entry = ranks[name] || {};
          var rank = entry['位分'] || '—';
          var accent = RANK_COLORS[rank] || '#b89465';
          var mark = String(name).slice(0, 1);
          return (
            '<div class="dwf-rank-card" style="--rank-accent:' +
            accent +
            '">' +
            '<div class="dwf-rank-seal">' +
            esc(mark) +
            '</div>' +
            '<div><div class="dwf-rank-name">' +
            esc(name) +
            '</div><div class="dwf-rank-sub">大唐后宅礼法名分</div></div>' +
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
    var children = (stat && stat['子嗣']) || {};
    var keys = Object.keys(children).sort(function (a, b) {
      var ca = Number(children[a] && children[a]['春秋']) || 0;
      var cb = Number(children[b] && children[b]['春秋']) || 0;
      if (cb !== ca) return cb - ca;
      return String(a).localeCompare(String(b), 'zh-CN');
    });
    if (!keys.length) {
      return '<div class="dwf-empty">子嗣名册尚空 · 分娩或收养后将记入此册</div>';
    }
    return (
      '<div class="dwf-child-grid">' +
      keys
        .map(function (name) {
          var c = children[name] || {};
          var gender = c['男女'] === '女' ? 'female' : 'male';
          var genderLabel = c['男女'] === '女' ? '女' : '男';
          var accent = gender === 'female' ? '#e85d6a' : '#6a8caf';
          var rumu = Math.max(0, Math.min(100, Number(c['孺慕']) || 0));
          return (
            '<div class="dwf-child-card" style="--child-accent:' +
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
    $('#dwf-panel-tianji').html(wrapPanelBody(renderTianjiPanel(stat)));
    $('#dwf-panel-fengxin').html(wrapPanelBody(renderFengxinPanel(stat)));
    $('#dwf-panel-lishi').html(wrapPanelBody(renderLishiPanel(stat)));
    $('#dwf-panel-fangming').html(wrapPanelBody(renderFangmingPanel(stat)));
    $('#dwf-panel-zisi').html(wrapPanelBody(renderZisiPanel(stat)));
    var badge = countFengxinBadge(stat);
    var $b = $('#dwf-fengxin-badge');
    if (badge > 0) {
      if (!$b.length) {
        $('#dwf-main-nav .dwf-main-tab[data-dwf-panel="fengxin"]').append(
          '<span class="dwf-tab-badge" id="dwf-fengxin-badge">' + badge + '</span>',
        );
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
