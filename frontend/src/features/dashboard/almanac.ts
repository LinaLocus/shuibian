interface AlmanacInput {
  records: Array<{
    bristolType: number;
    healthScore?: { score: number } | null;
    symptoms?: string[];
    createdAt: string;
  }>;
}

export interface AlmanacResult {
  fortune: 'great' | 'good' | 'normal' | 'caution' | 'rest';
  fortuneLabel: string;
  fortuneText: string;
  good: string[];
  bad: string[];
}

const GOOD_POOL = {
  hydration: ['多饮温水', '晨起一杯温水', '冲泡花草茶'],
  fiber: ['食用粗粮', '多食蔬果', '燕麦为伴'],
  exercise: ['散步半时', '腹部按摩', '舒展筋骨'],
  rest: ['早睡静养', '安卧勿熬', '调息凝神'],
  warm: ['温食养胃', '小米粥饮', '红枣山药'],
  mild: ['清淡为宜', '蒸煮为佳', '少油少盐'],
  laugh: ['畅怀大笑', '舒心一刻', '与友闲谈'],
};

const BAD_POOL = {
  spicy: ['忌食辛辣', '远离麻辣', '勿食火锅'],
  oily: ['忌油炸物', '远离烧烤', '勿食肥腻'],
  cold: ['忌食生冷', '勿饮冰品', '远离冷饮'],
  alcohol: ['戒酒戒烟', '勿沾杯中物', '远离烈酒'],
  latenight: ['勿熬至深夜', '忌通宵达旦', '莫贪夜食'],
  stress: ['莫动肝火', '忌焦虑烦躁', '勿郁结于心'],
  sweet: ['少食甜腻', '忌过多糖分', '远离精制糖'],
  heavy: ['勿暴饮暴食', '忌饱餐过度', '莫贪多嚼快'],
};

const FORTUNE_MAP = {
  great: { label: '畅', text: '通泰无阻，万事如意' },
  good: { label: '顺', text: '顺顺当当，悠然自得' },
  normal: { label: '稳', text: '不咸不淡，稳中有序' },
  caution: { label: '缓', text: '今日宜缓不宜急' },
  rest: { label: '歇', text: '身体喊累，听它的话' },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getAlmanac({ records }: AlmanacInput): AlmanacResult {
  const recent = records.slice(0, 14);
  const seed = dailySeed();

  if (recent.length === 0) {
    return {
      fortune: 'normal',
      fortuneLabel: '新',
      fortuneText: '初来乍到，万事可期',
      good: seededShuffle(
        [pick(GOOD_POOL.hydration), pick(GOOD_POOL.fiber), pick(GOOD_POOL.exercise)],
        seed,
      ).slice(0, 3),
      bad: seededShuffle([pick(BAD_POOL.spicy), pick(BAD_POOL.oily)], seed).slice(0, 2),
    };
  }

  const avg =
    recent.reduce((s, r) => s + (r.healthScore?.score || 0), 0) / recent.length;
  const bristolCounts = recent.reduce<Record<number, number>>((acc, r) => {
    acc[r.bristolType] = (acc[r.bristolType] || 0) + 1;
    return acc;
  }, {});
  const hardCount = (bristolCounts[1] || 0) + (bristolCounts[2] || 0);
  const looseCount = (bristolCounts[6] || 0) + (bristolCounts[7] || 0);
  const allSymptoms = recent.flatMap((r) => r.symptoms || []);
  const hasBleeding = allSymptoms.includes('出血');
  const hasPain = allSymptoms.includes('疼痛');

  let fortune: AlmanacResult['fortune'];
  if (avg >= 85) fortune = 'great';
  else if (avg >= 70) fortune = 'good';
  else if (avg >= 55) fortune = 'normal';
  else if (avg >= 40) fortune = 'caution';
  else fortune = 'rest';

  const goods: string[] = [];
  const bads: string[] = [];

  if (hardCount >= looseCount + 2) {
    goods.push(pick(GOOD_POOL.hydration));
    goods.push(pick(GOOD_POOL.fiber));
    bads.push(pick(BAD_POOL.spicy));
  } else if (looseCount >= hardCount + 2) {
    goods.push(pick(GOOD_POOL.warm));
    goods.push(pick(GOOD_POOL.rest));
    bads.push(pick(BAD_POOL.cold));
    bads.push(pick(BAD_POOL.oily));
  } else {
    goods.push(pick(GOOD_POOL.hydration));
    goods.push(pick(GOOD_POOL.exercise));
  }

  if (hasBleeding || hasPain) {
    goods.push(pick(GOOD_POOL.rest));
    bads.push(pick(BAD_POOL.spicy));
    bads.push(pick(BAD_POOL.alcohol));
  }

  if (avg < 60) {
    goods.push(pick(GOOD_POOL.mild));
    bads.push(pick(BAD_POOL.latenight));
  } else if (avg >= 80) {
    goods.push(pick(GOOD_POOL.laugh));
  }

  if (bads.length < 2) bads.push(pick(BAD_POOL.heavy));
  if (bads.length < 2) bads.push(pick(BAD_POOL.sweet));
  if (goods.length < 3) goods.push(pick(GOOD_POOL.exercise));

  const uniqueGoods = Array.from(new Set(goods)).slice(0, 3);
  const uniqueBads = Array.from(new Set(bads)).slice(0, 3);

  return {
    fortune,
    fortuneLabel: FORTUNE_MAP[fortune].label,
    fortuneText: FORTUNE_MAP[fortune].text,
    good: seededShuffle(uniqueGoods, seed),
    bad: seededShuffle(uniqueBads, seed + 1),
  };
}
