import assert from 'node:assert/strict';

import {
  acceptTask,
  abandonCurrentTask,
  canCompleteTask,
  clearFailedTask,
  completeTask,
  getCurrentTask,
  hasCurrentTask,
  markExpiredTasks,
} from '../src/dawei/ui/status/dwf-task-state.mjs';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function taskWasAbandoned(stat, id) {
  return !!((stat['任务录'] || {})['已放弃'] || {})[id];
}

const baseStat = {
  世界与剧情: {
    行程: 6,
    当前地点: '清河郡·驿城',
    天时: { 显示: '景初三年五月中旬·暮' },
  },
  履历: {},
  命途: { 标签: [], 已锁: [], 主导: null },
  命途印记: {},
  鼎革纪: {},
  风闻录: {
    机宜: {
      津渡: {
        兄困清河: {
          因由: '津渡·兄困清河：兄长陷囹圄于清河驿城，嫂张氏与卢氏奔走营救',
          火急: 4,
          相关人物: '卢氏、张氏',
          建议地点: '清河郡·驿城',
          开启行程: 6,
          截止行程: 14,
          目标: {
            目标1: '赶赴清河驿城',
            目标2: '查明秦宽被困缘由',
            目标3: '救出秦宽或定下明确处置',
          },
          演完写入: {
            命途标签: ['仕进'],
            命途印记: { 清河: '救人' },
          },
        },
      },
      支汊: {
        麦田董氏: {
          因由: '支汊·麦田董氏：麦田间遇董氏送饭',
          火急: 2,
          截止行程: 10,
          目标: { 目标1: '前往麦田' },
          演完写入: {},
        },
      },
    },
    邸报: {},
    里巷: {},
  },
};

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  assert.equal(getCurrentTask(stat, '兄困清河').id, '兄困清河');
  assert.equal(getCurrentTask(stat, '兄困清河').状态, '进行中');
  assert.equal(getCurrentTask(stat, '兄困清河').目标.目标1.内容, '赶赴清河驿城');
  assert.equal(getCurrentTask(stat, '兄困清河').目标.目标1.完成, false);
  assert.equal(stat.风闻录.机宜.津渡.兄困清河, undefined);
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  stat.任务录.当前.兄困清河.目标.目标1.完成 = true;
  stat.任务录.当前.兄困清河.目标.目标2.完成 = true;
  assert.equal(canCompleteTask(stat, '兄困清河'), false);
  stat.任务录.当前.兄困清河.目标.目标3.完成 = true;
  assert.equal(canCompleteTask(stat, '兄困清河'), true);
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  Object.values(stat.任务录.当前.兄困清河.目标).forEach(goal => {
    goal.完成 = true;
  });
  const completed = completeTask(stat, '兄困清河');
  assert.equal(hasCurrentTask(completed, '兄困清河'), false);
  assert.equal(completed.履历['001'], '景初三年五月中旬·暮·清河郡·驿城·兄困清河');
  assert.deepEqual(completed.命途.标签, ['仕进']);
  assert.equal(completed.命途印记.清河, '救人');
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  stat.世界与剧情.行程 = 15;
  const expired = markExpiredTasks(stat);
  assert.equal(getCurrentTask(expired, '兄困清河').状态, '已失败');
  assert.equal(getCurrentTask(expired, '兄困清河').失败原因, '行程已逾截止');
}

{
  const hardStat = clone(baseStat);
  hardStat.风闻录.机宜.津渡.应召入仕 = {
    因由: '津渡·应召入仕：守孝期满',
    火急: 5,
    截止行程: 20,
    错过策略: 'hard',
    错过写入: { 命途已锁: ['不入中枢'] },
    目标: { 目标1: '听明征辟' },
    演完写入: {},
  };
  let stat = acceptTask(hardStat, '津渡', '应召入仕');
  stat.世界与剧情.行程 = 21;
  stat = markExpiredTasks(stat);
  assert.equal(getCurrentTask(stat, '应召入仕').状态, '已失败');
  assert.ok(stat.命途.已锁.includes('不入中枢'));
  assert.equal(stat.世界与剧情.津渡连续错失, 1);
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  stat.世界与剧情.行程 = 15;
  const expired = markExpiredTasks(stat);
  const cleared = clearFailedTask(expired, '兄困清河');
  assert.equal(hasCurrentTask(cleared, '兄困清河'), false);
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  const abandoned = abandonCurrentTask(stat, '兄困清河');
  assert.equal(hasCurrentTask(abandoned, '兄困清河'), false);
  assert.ok(taskWasAbandoned(abandoned, '兄困清河'));
  assert.deepEqual(abandoned.履历, {});
  assert.deepEqual(abandoned.命途.标签, []);
}

{
  let stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  stat = acceptTask(stat, '支汊', '麦田董氏');
  assert.equal(Object.keys(stat.任务录.当前).length, 2);
  assert.ok(hasCurrentTask(stat, '兄困清河'));
  assert.ok(hasCurrentTask(stat, '麦田董氏'));
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  stat.任务录.当前 = stat.任务录.当前['兄困清河'];
  Object.values(stat.任务录.当前.目标).forEach(goal => {
    goal.完成 = true;
  });
  const completed = completeTask(stat, '兄困清河');
  assert.equal(hasCurrentTask(completed, '兄困清河'), false);
}

console.log('dwf task state tests passed');
