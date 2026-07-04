/* 由 scripts/compose_dwf_schema.mjs 从 plot/schema.mvu.js 生成；供状态栏 Schema.parse */
(function (global) {
  if (typeof global.z === 'undefined') {
    console.warn('[大魏芳华:UI] z 未就绪，无法注册 Stat Schema');
    return;
  }
  var z = global.z;
  var _ = global._;
  
  const 群芳录EntrySchema = z
    .object({
      是否登场: z.boolean().prefault(false),
      当前位置: z.string().describe('当前所处地点').prefault(''),
      好感度: z.coerce.number().prefault(0),
      好感度上限: z.coerce.number().prefault(100),
      服饰: z.string().describe('严格使用原著描写').prefault(''),
      外貌: z.string().describe('严格使用原著描写').prefault(''),
      当前状态: z.string().describe('严格使用原著描写').prefault(''),
      心里想法: z.string().describe('角色此刻未说出口的第一人称口语独白').prefault(''),
      心情: z.string().describe('两到四字概括当前情绪').prefault(''),
      与user关系: z.string().describe('与{{user}}关系定位').prefault(''),
      本名: z.string().describe('档案本名；问名按此作答').prefault(''),
      通称: z.string().describe('世人常用称呼，逗号或顿号分隔').prefault(''),
      有孕: z.boolean().prefault(false),
      子嗣数: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
    })
    .prefault({})
    .transform(data => {
      data.好感度上限 = _.clamp(Number(data.好感度上限) || 0, 0, 100);
      data.好感度 = _.clamp(Number(data.好感度) || 0, 0, data.好感度上限);
      data.子嗣数 = Math.max(0, Math.floor(Number(data.子嗣数) || 0));
      if (data.是否登场 === false) data.心里想法 = '';
      return data;
    });
  
  const 机宜条目Schema = z.object({
    因由: z.string(),
    火急: z.coerce.number().transform(v => _.clamp(Math.floor(v), 1, 5)),
    相关人物: z.string().prefault(''),
    建议地点: z.string().prefault(''),
    目标: z.preprocess(v => (v === null || v === undefined ? {} : v), z.record(z.string(), z.string())).prefault({}),
    选项: z.preprocess(v => (v === null || v === undefined ? {} : v), z.record(z.string(), z.string())).prefault({}),
    开启行程: z.coerce.number().transform(v => _.clamp(Math.floor(v), 1, 288)).optional(),
    截止行程: z.coerce.number().transform(v => _.clamp(Math.floor(v), 1, 288)),
    演完写入: z.preprocess(v => (v === null || v === undefined ? {} : v), z.record(z.string(), z.any())).prefault({}),
    错过策略: z.string().prefault(''),
    错过写入: z.preprocess(v => (v === null || v === undefined ? {} : v), z.record(z.string(), z.any())).prefault({}),
  }).prefault({});
  
  const 当前任务EntrySchema = z.object({
    id: z.string().prefault(''),
    类型: z.enum(['津渡', '支汊']).or(z.string()).prefault(''),
    状态: z.enum(['进行中', '已失败']).or(z.string()).prefault('进行中'),
    开始行程: z.coerce.number().prefault(1),
    截止行程: z.coerce.number().prefault(288),
    因由: z.string().prefault(''),
    火急: z.coerce.number().transform(v => _.clamp(Math.floor(v), 1, 5)).prefault(2),
    相关人物: z.string().prefault(''),
    建议地点: z.string().prefault(''),
    目标: z.preprocess(
      v => (v === null || v === undefined ? {} : v),
      z.record(z.string(), z.object({
        内容: z.string().prefault(''),
        选项: z.string().prefault(''),
        完成: z.boolean().prefault(false),
      }).prefault({})),
    ).prefault({}),
    演完写入: z.preprocess(v => (v === null || v === undefined ? {} : v), z.record(z.string(), z.any())).prefault({}),
    错过策略: z.string().prefault(''),
    错过写入: z.preprocess(v => (v === null || v === undefined ? {} : v), z.record(z.string(), z.any())).prefault({}),
    失败原因: z.string().optional(),
  }).prefault({});
  
  const 当前任务Schema = z.preprocess(v => {
    if (v === null || v === undefined || typeof v !== 'object') return {};
    if (v.id) return { [String(v.id)]: v };
    return v;
  }, z.record(z.string(), 当前任务EntrySchema)).prefault({});
  
  const 任务录Schema = z.object({
    当前: 当前任务Schema,
    已放弃: z.preprocess(
      v => (v === null || v === undefined ? {} : v),
      z.record(z.string(), z.object({
        行程: z.coerce.number().prefault(1),
        因由: z.string().prefault(''),
      }).prefault({})),
    ).prefault({}),
  }).prefault({});
  
  const 主导枚举 = z.enum(['潜龙', '魏祚', '旁观', '山林', '异数']).nullable();
  
  /** YAML 空键常被解析为 null；归一化为 schema 期望的空容器 */
  const recordOrEmpty = (inner) =>
    z.preprocess(v => (v === null || v === undefined ? {} : v), inner);
  const arrayOrEmpty = (inner) =>
    z.preprocess(v => (v === null || v === undefined ? [] : v), inner);
  const objectOrEmpty = (inner) =>
    z.preprocess(v => (v === null || v === undefined ? {} : v), inner);
  
  function syncPresenceFields(data) {
    const book = data.群芳录 || {};
    const world = data.世界与剧情 || {};
    const isOn = name => {
      const ent = book[name];
      return !!(ent && typeof ent === 'object' && ent.是否登场 === true);
    };
    const sceneRaw = String(world.当前场景角色 || '');
    const sceneParts = sceneRaw
      .split(/[、,，\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const cleaned = [];
    for (const name of sceneParts) {
      if (isOn(name) && !cleaned.includes(name)) cleaned.push(name);
    }
    world.当前场景角色 = cleaned.join('、');
    const cur = String(world.当前互动角色 || '').trim();
    if (cur && !isOn(cur)) {
      world.当前互动角色 = cleaned[0] || '';
    }
    data.世界与剧情 = world;
    return data;
  }
  
  var Schema = z.object({
    世界与剧情: z.object({
      行程: z.coerce.number().transform(v => _.clamp(Math.floor(v), 1, 288)).prefault(1),
      当前地点: z.string().prefault(''),
      当前互动角色: z.string().prefault(''),
      当前场景角色: z.string().prefault(''),
      已终局: z.boolean().prefault(false),
      收束意向: z.boolean().prefault(false),
      津渡连续错失: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
      路线预判: z.object({
        倾向: z.string().prefault(''),
        主导: 主导枚举.prefault(null),
        匹配度: z.coerce.number().prefault(0),
        id: z.string().prefault(''),
      }).prefault({}),
      终局: objectOrEmpty(z.object({
        id: z.string().optional(),
        名: z.string().optional(),
        叙述: z.string().optional(),
        收束行程: z.coerce.number().optional(),
      }).prefault({})),
      天时: z.object({
        月: z.string().prefault(''),
        旬: z.enum(['上旬', '中旬', '下旬']).or(z.string()).prefault('上旬'),
        时辰: z.string().prefault(''),
        显示: z.string().prefault(''),
      }).prefault({}),
    }).prefault({}),
  
    朝局: z.object({
      皇帝: z.string().prefault(''),
      法统: z.string().prefault(''),
      权柄: z.string().prefault(''),
      纪年: z.object({
        年号: z.string().prefault(''),
        年数: z.union([z.string(), z.coerce.number()]).prefault(''),
        干支: z.string().optional(),
      }).prefault({}),
    }).prefault({}),
  
    履历: recordOrEmpty(
      z.record(z.string().describe('三位序号键'), z.string().describe('时间快照·地点·简称')),
    ),
  
    命途: objectOrEmpty(z.object({
      标签: arrayOrEmpty(z.array(z.string())),
      已锁: arrayOrEmpty(z.array(z.string())),
      主导: 主导枚举.prefault(null),
    }).prefault({})),
  
    命途印记: recordOrEmpty(z.record(z.string(), z.string())),
  
    鼎革纪: recordOrEmpty(z.record(z.string(), z.string())),
  
    风闻录: objectOrEmpty(z.object({
      机宜: objectOrEmpty(z.object({
        津渡: recordOrEmpty(z.record(z.string(), 机宜条目Schema)),
        支汊: recordOrEmpty(z.record(z.string(), 机宜条目Schema)),
      }).prefault({})),
      邸报: recordOrEmpty(z.record(z.string(), z.string())),
      里巷: recordOrEmpty(z.record(z.string(), z.string())),
      预制选项: objectOrEmpty(z.object({
        日常句: z.string().describe('日常类预制发送句').prefault(''),
        桃色句: z.string().describe('桃色类预制发送句').prefault(''),
      }).describe('状态栏风闻Tab常驻行动芯片文案').prefault({})),
    }).prefault({})),
  
    任务录: objectOrEmpty(任务录Schema),
  
    主角: objectOrEmpty(z.object({
      当前位置: z.string().prefault(''),
      当前状态: z.string().prefault(''),
    }).prefault({})),
  
    主角势力: z.object({
      官爵: z.string().describe('当前实职，守孝期空').prefault(''),
      阵营: z.enum(['无', '曹爽', '王凌', '司马氏', '勤王系', '自立']).prefault('无'),
      部曲: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
      根基: z.string().describe('根据地一句，如庄园名/幕府/军镇').prefault(''),
    }).prefault({}),
  
    群芳录: z
      .record(z.string().describe('女子姓名'), 群芳录EntrySchema)
      .prefault({}),
  
    房名次: recordOrEmpty(
      z.record(
        z.string(),
        z.object({ 位分: z.enum(['正室', '侧室', '妾室', '外室', '情妇', '偷情', '近侍', '婢妾']) }),
      ),
    ),
  
    子嗣: recordOrEmpty(
      z.record(
        z.string(),
        z.object({
          男女: z.enum(['男', '女']),
          春秋: z.coerce.number().transform(v => Math.max(0, Math.floor(v))),
          生母: z.string(),
          孺慕: z.coerce.number().transform(v => _.clamp(Math.floor(v), 0, 100)).prefault(50),
        }),
      ),
    ),
  
    _潮汛已触发: arrayOrEmpty(z.array(z.string())).describe('EJS 潮汛结算只读追踪'),
  }).prefault({}).transform(syncPresenceFields);
  
  global.__DWF_STAT_SCHEMA__ = Schema;
})(typeof window !== 'undefined' ? window : globalThis);
