export function safeObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function getCurrentTaskMap(stat) {
  var current = safeObj(safeObj(stat && stat['任务录'])['当前']);
  if (current.id) {
    var single = JSON.parse(JSON.stringify(current));
    return { [single.id]: single };
  }
  return current;
}

export function getCurrentTasks(stat) {
  var map = getCurrentTaskMap(stat);
  return Object.keys(map)
    .map(function (id) {
      var task = safeObj(map[id]);
      if (!task.id) task.id = id;
      return task;
    })
    .filter(function (task) {
      return !!task.id;
    });
}

export function getCurrentTask(stat, id) {
  var tasks = getCurrentTasks(stat);
  if (id) {
    for (var i = 0; i < tasks.length; i += 1) {
      if (tasks[i].id === id) return tasks[i];
    }
    return {};
  }
  return tasks[0] || {};
}

export function normalizeCurrentToMap(stat) {
  stat = safeObj(stat);
  stat['任务录'] = safeObj(stat['任务录']);
  var current = stat['任务录']['当前'];
  if (!current || typeof current !== 'object' || Array.isArray(current)) {
    stat['任务录']['当前'] = {};
    return stat;
  }
  if (current.id) {
    var id = String(current.id);
    var copy = JSON.parse(JSON.stringify(current));
    stat['任务录']['当前'] = { [id]: copy };
  }
  return stat;
}

export function removeCurrentTask(stat, id) {
  stat = normalizeCurrentToMap(stat);
  var current = safeObj(stat['任务录']['当前']);
  if (id) {
    delete current[id];
    stat['任务录']['当前'] = current;
    return stat;
  }
  stat['任务录']['当前'] = {};
  return stat;
}

export function getAbandonedIds(stat) {
  return Object.keys(safeObj(safeObj(stat && stat['任务录'])['已放弃']));
}

export function isTaskAbandoned(stat, id) {
  if (!id) return false;
  return !!safeObj(safeObj(stat && stat['任务录'])['已放弃'])[id];
}

export function hasCurrentTask(stat, id) {
  if (id) return !!getCurrentTask(stat, id).id;
  return getCurrentTasks(stat).length > 0;
}

export function taskAcceptBlockReason(stat, bucket, limits) {
  limits = limits || { total: 3, 津渡: 1, 支汊: 2 };
  var counts = { total: 0, 津渡: 0, 支汊: 0 };
  getCurrentTasks(stat).forEach(function (task) {
    counts.total += 1;
    if (task['类型'] === '津渡') counts['津渡'] += 1;
    if (task['类型'] === '支汊') counts['支汊'] += 1;
  });
  if (counts.total >= limits.total) return '已接满 ' + limits.total + ' 件';
  if ((counts[bucket] || 0) >= (limits[bucket] || limits.total)) {
    return bucket === '津渡' ? '已有主线进行中' : '支线已满';
  }
  return '';
}

export function normalizeTaskGoals(rawGoals, rawOpts) {
  var goals = {};
  var opts = safeObj(rawOpts);
  Object.keys(safeObj(rawGoals)).forEach(function (key) {
    goals[key] = {
      内容: String(rawGoals[key] == null ? '' : rawGoals[key]),
      选项: String(opts[key] == null ? '' : opts[key]),
      完成: false,
    };
  });
  return goals;
}

export function canCompleteTask(stat, id) {
  var task = getCurrentTask(stat, id);
  var goals = safeObj(task['目标']);
  var keys = Object.keys(goals);
  if (!task.id || !keys.length || task['状态'] === '已失败') return false;
  return keys.every(function (key) {
    return goals[key] && goals[key]['完成'] === true;
  });
}

export function taskIsExpired(stat, id) {
  var task = getCurrentTask(stat, id);
  if (!task.id || task['状态'] === '已失败' || canCompleteTask(stat, id)) return false;
  var trip = Number(safeObj(stat && stat['世界与剧情'])['行程']) || 1;
  var deadline = Number(task['截止行程']) || 288;
  return trip > deadline;
}

function nextHistoryKey(history) {
  var max = 0;
  Object.keys(safeObj(history)).forEach(function (key) {
    var n = parseInt(key, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return String(max + 1).padStart(3, '0');
}

function displayTime(stat) {
  var world = safeObj(stat && stat['世界与剧情']);
  var tianshi = safeObj(world['天时']);
  return String(tianshi['显示'] || '当前');
}

function displayLocation(stat) {
  var world = safeObj(stat && stat['世界与剧情']);
  var hero = safeObj(stat && stat['主角']);
  return String(world['当前地点'] || hero['当前位置'] || '当前地点');
}

function pushUnique(target, values) {
  if (!Array.isArray(target) || !Array.isArray(values)) return target;
  values.forEach(function (value) {
    if (target.indexOf(value) < 0) target.push(value);
  });
  return target;
}

export function applyDoneWrites(stat, writes) {
  writes = safeObj(writes);
  stat['命途'] = safeObj(stat['命途']);
  stat['命途']['标签'] = pushUnique(Array.isArray(stat['命途']['标签']) ? stat['命途']['标签'] : [], writes['命途标签']);
  stat['命途']['已锁'] = pushUnique(Array.isArray(stat['命途']['已锁']) ? stat['命途']['已锁'] : [], writes['命途已锁']);
  if (writes['主导'] != null) stat['命途']['主导'] = writes['主导'];
  if (writes['鼎革'] && typeof writes['鼎革'] === 'object') {
    stat['鼎革纪'] = Object.assign(safeObj(stat['鼎革纪']), writes['鼎革']);
  }
  if (writes['命途印记'] && typeof writes['命途印记'] === 'object') {
    stat['命途印记'] = Object.assign(safeObj(stat['命途印记']), writes['命途印记']);
  }
  return stat;
}

export function acceptTask(stat, bucket, id) {
  stat = JSON.parse(JSON.stringify(safeObj(stat)));
  if (!id || isTaskAbandoned(stat, id) || hasCurrentTask(stat, id)) return stat;
  if (taskAcceptBlockReason(stat, bucket)) return stat;
  var fx = safeObj(stat['风闻录']);
  var jiyi = safeObj(fx['机宜']);
  var pool = safeObj(jiyi[bucket]);
  var item = safeObj(pool[id]);
  if (!item['因由']) return stat;

  stat = normalizeCurrentToMap(stat);
  stat['任务录']['当前'][id] = {
    id: id,
    类型: bucket,
    状态: '进行中',
    开始行程: Number(safeObj(stat['世界与剧情'])['行程']) || 1,
    截止行程: Number(item['截止行程']) || 288,
    因由: item['因由'] || '',
    火急: item['火急'] || 2,
    相关人物: item['相关人物'] || '',
    建议地点: item['建议地点'] || '',
    目标: normalizeTaskGoals(item['目标']),
    演完写入: safeObj(item['演完写入']),
    错过策略: item['错过策略'] || '',
    错过写入: safeObj(item['错过写入']),
  };
  delete pool[id];
  jiyi[bucket] = pool;
  fx['机宜'] = jiyi;
  stat['风闻录'] = fx;
  return stat;
}

export function completeTask(stat, id) {
  stat = JSON.parse(JSON.stringify(safeObj(stat)));
  var task = getCurrentTask(stat, id);
  if (!canCompleteTask(stat, id)) return stat;
  stat['履历'] = safeObj(stat['履历']);
  stat['履历'][nextHistoryKey(stat['履历'])] = displayTime(stat) + '·' + displayLocation(stat) + '·' + task.id;
  applyDoneWrites(stat, task['演完写入']);
  return removeCurrentTask(stat, task.id);
}

export function markExpiredTasks(stat) {
  stat = normalizeCurrentToMap(JSON.parse(JSON.stringify(safeObj(stat))));
  stat['世界与剧情'] = safeObj(stat['世界与剧情']);
  getCurrentTasks(stat).forEach(function (task) {
    if (!task.id || task['状态'] === '已失败' || !taskIsExpired(stat, task.id)) return;
    var entry = safeObj(stat['任务录']['当前'][task.id]);
    entry['状态'] = '已失败';
    entry['失败原因'] = '行程已逾截止';
    if (entry['错过策略'] === 'hard' && entry['错过写入'] && Object.keys(safeObj(entry['错过写入'])).length) {
      applyDoneWrites(stat, entry['错过写入']);
    }
    if (entry['类型'] === '津渡' && (Number(entry['火急']) || 0) >= 5) {
      stat['世界与剧情']['津渡连续错失'] =
        (Number(stat['世界与剧情']['津渡连续错失']) || 0) + 1;
    }
    stat['任务录']['当前'][task.id] = entry;
  });
  return stat;
}

/** @deprecated 使用 markExpiredTasks */
export function markExpiredTask(stat) {
  return markExpiredTasks(stat);
}

export function clearFailedTask(stat, id) {
  stat = JSON.parse(JSON.stringify(safeObj(stat)));
  var task = getCurrentTask(stat, id);
  if (!task.id || (task['状态'] !== '已失败' && !taskIsExpired(stat, id))) return stat;
  return removeCurrentTask(stat, task.id);
}

export function abandonCurrentTask(stat, id) {
  stat = JSON.parse(JSON.stringify(safeObj(stat)));
  var task = getCurrentTask(stat, id);
  if (!task.id || task['状态'] === '已失败' || taskIsExpired(stat, id)) return stat;
  stat = normalizeCurrentToMap(stat);
  stat['任务录']['已放弃'] = safeObj(stat['任务录']['已放弃']);
  stat['任务录']['已放弃'][task.id] = {
    行程: Number(safeObj(stat['世界与剧情'])['行程']) || 1,
    因由: task['因由'] || task.id,
  };
  return removeCurrentTask(stat, task.id);
}
