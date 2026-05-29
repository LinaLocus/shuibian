interface QuoteContext {
  score: number;
  bristolType?: number;
  effort?: string;
  symptoms?: string[];
}

const QUOTES_EXCELLENT = [
  '闻君一泻千里，畅快淋漓，此乃上品也',
  '行云流水，一气呵成，妙哉妙哉',
  '肠若清风明月，通达无碍，实乃佳境',
  '今日之畅，犹如大江东去，浩浩荡荡',
  '腹中无滞，身心俱爽，可喜可贺',
  '一朝通泰，万事皆宜，今日大吉',
  '如释重负，轻身健步，此为上上签',
];

const QUOTES_GOOD = [
  '通体舒泰，肠道安康，善哉善哉',
  '不疾不徐，从容而出，甚好甚好',
  '肠胃和顺，气血通畅，继续保持',
  '今日尚佳，明日可期，养生有道',
  '中正平和，不偏不倚，此为正道',
  '身体康健，肠道有序，值得欣慰',
];

const QUOTES_AVERAGE = [
  '中规中矩，尚可一观，明日再接再厉',
  '虽非上品，亦无大碍，稍加调养即可',
  '肠道略有迟疑，不妨多饮温水',
  '今日平平，来日方长，不必挂怀',
  '尚在常理之中，稍作调整便好',
  '不温不火，中庸之道，亦是一种平衡',
];

const QUOTES_CONCERN = [
  '肠胃微恙，宜多饮水食蔬，善待己身',
  '身体发出信号，当以清淡饮食调之',
  '小有不适，无需忧虑，静心调养为上',
  '肠道稍有不顺，建议早睡多动，以养正气',
  '今日欠佳，明日可期，饮食宜温宜软',
  '身体偶有波动，实属正常，好生休息',
];

const QUOTES_LOW = [
  '身体不适，切莫忧虑，调养为上，必有好转',
  '肠胃告急，宜速调理，若持续不适请就医',
  '今日辛苦了，好好休息，明天会更好',
  '身体是革命的本钱，请多加爱护，必要时寻医问药',
  '不适之时更需善待自己，清粥小菜，早些安歇',
  '暂时的不适终会过去，保持心情舒畅，静待康复',
];

const QUOTES_BRISTOL4_BONUS = [
  '形态完美，教科书般的存在',
  '此乃Bristol四型，黄金标准也',
  '形神兼备，堪称典范',
];

const QUOTES_EASY_BONUS = [
  '不费吹灰之力，举重若轻',
  '轻松写意，毫不费力',
  '信手拈来，从容不迫',
];

const QUOTES_BLEEDING = [
  '检测到出血，身体在求助，请尽早就医，莫要讳疾忌医',
  '出血非小事，望君重视，及时就诊方为上策',
  '身体发出警示，建议尽快咨询医生，早治早安心',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getQuote(ctx: QuoteContext): string {
  const { score, bristolType, effort, symptoms } = ctx;

  if (symptoms?.includes('出血')) {
    return pickRandom(QUOTES_BLEEDING);
  }

  let base: string;
  if (score >= 90) {
    base = pickRandom(QUOTES_EXCELLENT);
  } else if (score >= 80) {
    base = pickRandom(QUOTES_GOOD);
  } else if (score >= 60) {
    base = pickRandom(QUOTES_AVERAGE);
  } else if (score >= 40) {
    base = pickRandom(QUOTES_CONCERN);
  } else {
    base = pickRandom(QUOTES_LOW);
  }

  if (score >= 80 && bristolType === 4) {
    base += '。' + pickRandom(QUOTES_BRISTOL4_BONUS);
  } else if (score >= 80 && effort === 'easy') {
    base += '。' + pickRandom(QUOTES_EASY_BONUS);
  }

  return base;
}
