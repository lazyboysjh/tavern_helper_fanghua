export function safeObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function getCurrentTask(stat) {
  return safeObj(safeObj(stat && stat['任务录'])['当前']);
}

export function hasCurrentTask(stat) {
  return Boolean(getCurrentTask(stat).id);
}

export function normalizeTaskGoals(rawGoals) {
  var goals = {};
  Object.keys(safeObj(rawGoals)).forEach(function (key) {
    goals[key] = {
      内容: String(rawGoals[key] == null ? '' : rawGoals[key]),
      完成: false,
    };
  });
  return goals;
}

export function canCompleteTask(stat) {
  var task = getCurrentTask(stat);
  var goals = safeObj(task['目标']);
  var keys = Object.keys(goals);
  if (!task.id || !keys.length || task['状态'] === '已失败') return false;
  return keys.every(function (key) {
    return goals[key] && goals[key]['完成'] === true;
  });
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
  stat = safeObj(stat);
  var fx = safeObj(stat['风闻录']);
  var jiyi = safeObj(fx['机宜']);
  var pool = safeObj(jiyi[bucket]);
  var item = safeObj(pool[id]);
  if (!id || !item['因由']) return stat;
  if (hasCurrentTask(stat)) return stat;

  stat['任务录'] = safeObj(stat['任务录']);
  stat['任务录']['当前'] = {
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

export function completeTask(stat) {
  stat = safeObj(stat);
  var task = getCurrentTask(stat);
  if (!canCompleteTask(stat)) return stat;
  stat['履历'] = safeObj(stat['履历']);
  stat['履历'][nextHistoryKey(stat['履历'])] = displayTime(stat) + '·' + displayLocation(stat) + '·' + task.id;
  applyDoneWrites(stat, task['演完写入']);
  if (stat['任务录']) delete stat['任务录']['当前'];
  return stat;
}

export function markExpiredTask(stat) {
  stat = safeObj(stat);
  var task = getCurrentTask(stat);
  if (!task.id || canCompleteTask(stat) || task['状态'] === '已失败') return stat;
  var trip = Number(safeObj(stat['世界与剧情'])['行程']) || 1;
  var deadline = Number(task['截止行程']) || 288;
  if (trip > deadline) {
    task['状态'] = '已失败';
    task['失败原因'] = '行程已逾截止';
  }
  return stat;
}

export function clearCurrentTask(stat) {
  stat = safeObj(stat);
  if (stat['任务录']) delete stat['任务录']['当前'];
  return stat;
}

export function abandonCurrentTask(stat) {
  return clearCurrentTask(stat);
}
