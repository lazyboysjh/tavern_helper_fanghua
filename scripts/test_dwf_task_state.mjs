import assert from 'node:assert/strict';

import {
  acceptTask,
  abandonCurrentTask,
  canCompleteTask,
  completeTask,
  markExpiredTask,
} from '../src/dawei/ui/status/dwf-task-state.mjs';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
      支汊: {},
    },
    邸报: {},
    里巷: {},
  },
};

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  assert.equal(stat.任务录.当前.id, '兄困清河');
  assert.equal(stat.任务录.当前.状态, '进行中');
  assert.equal(stat.任务录.当前.目标.目标1.内容, '赶赴清河驿城');
  assert.equal(stat.任务录.当前.目标.目标1.完成, false);
  assert.equal(stat.风闻录.机宜.津渡.兄困清河, undefined);
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  stat.任务录.当前.目标.目标1.完成 = true;
  stat.任务录.当前.目标.目标2.完成 = true;
  assert.equal(canCompleteTask(stat), false);
  stat.任务录.当前.目标.目标3.完成 = true;
  assert.equal(canCompleteTask(stat), true);
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  Object.values(stat.任务录.当前.目标).forEach(goal => {
    goal.完成 = true;
  });
  const completed = completeTask(stat);
  assert.equal(completed.任务录.当前, undefined);
  assert.equal(completed.履历['001'], '景初三年五月中旬·暮·清河郡·驿城·兄困清河');
  assert.deepEqual(completed.命途.标签, ['仕进']);
  assert.equal(completed.命途印记.清河, '救人');
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  stat.世界与剧情.行程 = 15;
  const expired = markExpiredTask(stat);
  assert.equal(expired.任务录.当前.状态, '已失败');
  assert.equal(expired.任务录.当前.失败原因, '行程已逾截止');
}

{
  const stat = acceptTask(clone(baseStat), '津渡', '兄困清河');
  const abandoned = abandonCurrentTask(stat);
  assert.equal(abandoned.任务录.当前, undefined);
  assert.deepEqual(abandoned.履历, {});
  assert.deepEqual(abandoned.命途.标签, []);
}

console.log('dwf task state tests passed');
