import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  acceptTask,
  completeTask,
  getCurrentTasks,
  markExpiredTasks,
  taskAcceptBlockReason,
  taskIsExpired,
} from '../src/dawei/ui/status/dwf-task-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dwfPath = path.join(__dirname, '../src/dawei/ui/status/dwf-mvu.js');

// trip165 开场7 近似态
const stat165 = {
  世界与剧情: {
    行程: 165,
    当前地点: '洛阳·卫将军府',
    天时: { 显示: '正始八年七月中旬·昼', 月: '七', 旬: '中旬', 时辰: '昼' },
    津渡连续错失: 0,
    已终局: false,
  },
  朝局: {
    皇帝: '曹芳',
    权柄: '勤王系',
    纪年: { 年号: '正始', 年数: '八' },
  },
  鼎革纪: {
    洛阳权柄: '勤王军控洛阳',
    大将军: '王凌',
    曹芳: '在位',
    东兴: '未战',
  },
  履历: {
    '001': '景初三年·应曹征辟·应召入仕',
    '002': '景初三年·洛阳·入大将军府',
    '003': '正始元年·淮南·淮南入幕',
    '004': '正始元年·洛阳乐津里·娶王令君',
    '005': '正始元年·洛阳·离淮南赴洛',
    '006': '正始元年·洛阳·郭太后初谒',
    '007': '正始三年·洛阳·绑太后出京',
    '008': '正始五年·寿春·勤王起兵',
    '009': '正始五年·许昌·许昌之战',
    '010': '正始六年·伊阙关·伊阙大战',
    '011': '正始七年·洛阳·迎驾洛阳',
    '012': '正始七年·洛阳·大将军府',
    '013': '正始八年·洛阳·伐吴议政',
  },
  命途: { 标签: ['仕进', '从龙', '掌权'], 已锁: [], 主导: '潜龙' },
  任务录: {
    当前: {
      东关之战: {
        id: '东关之战',
        类型: '津渡',
        状态: '进行中',
        开始行程: 165,
        截止行程: 170,
        因由: '津渡·东关之战：名将云集东关，东兴大败前线血战',
        火急: 5,
        目标: {
          目标1: { 内容: '率军赶赴东关', 完成: false },
          目标2: { 内容: '迎战诸葛恪与吴军', 完成: false },
          目标3: { 内容: '打完东关战事', 完成: false },
        },
        演完写入: {},
        错过策略: 'soft',
        错过写入: { 潮汛后继: 'tid_东兴之战' },
      },
    },
    已放弃: {},
  },
  风闻录: {
    机宜: { 津渡: {}, 支汊: { 费氏东兴前后: { 因由: '支汊·费氏东兴前后', 火急: 3, 截止行程: 172, 目标: { 目标1: 'x' } } } },
    邸报: {},
    里巷: {},
  },
};

{
  const tasks = getCurrentTasks(stat165);
  assert.equal(tasks.length, 1);
  assert.equal(taskAcceptBlockReason(stat165, '津渡'), '已有主线进行中');
  assert.equal(taskAcceptBlockReason(stat165, '支汊'), '');
}

{
  const expired = JSON.parse(JSON.stringify(stat165));
  expired['世界与剧情']['行程'] = 171;
  assert.equal(taskIsExpired(expired, '东关之战'), true);
  const after = markExpiredTasks(expired);
  assert.equal(after['任务录']['当前']['东关之战']['状态'], '已失败');
  assert.equal(after['任务录']['当前']['东关之战']['失败原因'], '行程已逾截止');
}

{
  const bigLili = JSON.parse(JSON.stringify(stat165));
  for (let i = 14; i <= 80; i++) {
    bigLili['履历'][String(i).padStart(3, '0')] = `正始${i}年·洛阳·节点${i}`;
  }
  assert.equal(Object.keys(bigLili['履历']).length, 80);
  const t = markExpiredTasks(bigLili);
  assert.ok(t['履历']);
}

console.log('dwf post-trip100 tests passed');
