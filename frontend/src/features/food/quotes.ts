interface TagStat {
  tag: string;
  occurrences: number;
  avgScoreSameDay: number | null;
  avgScoreNextDay: number | null;
  baselineAvg: number;
  delta: number;
}

const SUSPICIOUS_TEMPLATES = [
  ({ label, occurrences, delta }: { label: string; occurrences: number; delta: number }) =>
    `江湖传闻：${label}与君不合，远之为上。证据：近${occurrences}日同食，肠道失序约${Math.abs(delta)}分`,
  ({ label, occurrences, delta }: { label: string; occurrences: number; delta: number }) =>
    `${label}：嫌疑重大，七遇五败。共${occurrences}次相遇，平均评分跌${Math.abs(delta)}分`,
  ({ label, occurrences, delta }: { label: string; occurrences: number; delta: number }) =>
    `每逢${label}，肠胃必乱。证据${occurrences}例，落差${Math.abs(delta)}分，宜暂别之`,
  ({ label, occurrences, delta }: { label: string; occurrences: number; delta: number }) =>
    `${label}虽美，与君无缘。${occurrences}次同行，皆失水准约${Math.abs(delta)}分`,
];

const FRIENDLY_TEMPLATES = [
  ({ label, occurrences, delta }: { label: string; occurrences: number; delta: number }) =>
    `${label}：肠之挚友，宜常亲近。共${occurrences}遇，皆获好评（+${delta}分）`,
  ({ label, occurrences, delta }: { label: string; occurrences: number; delta: number }) =>
    `君与${label}，天作之合。近${occurrences}日相伴，肠安体泰（+${delta}分）`,
  ({ label, occurrences, delta }: { label: string; occurrences: number; delta: number }) =>
    `${label}入腹，万事顺遂。证据${occurrences}例，评分见涨${delta}分`,
];

const NEUTRAL_TEMPLATES = [
  ({ label, occurrences }: { label: string; occurrences: number }) =>
    `${label}：不咸不淡，无功无过（${occurrences}次记录）`,
  ({ label, occurrences }: { label: string; occurrences: number }) =>
    `${label}：寻常之物，${occurrences}遇皆平`,
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function seedFromTag(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return h;
}

export function suspiciousQuote(s: TagStat, label: string): string {
  return pick(SUSPICIOUS_TEMPLATES, seedFromTag(s.tag))({
    label,
    occurrences: s.occurrences,
    delta: s.delta,
  });
}

export function friendlyQuote(s: TagStat, label: string): string {
  return pick(FRIENDLY_TEMPLATES, seedFromTag(s.tag))({
    label,
    occurrences: s.occurrences,
    delta: s.delta,
  });
}

export function neutralQuote(s: TagStat, label: string): string {
  return pick(NEUTRAL_TEMPLATES, seedFromTag(s.tag))({
    label,
    occurrences: s.occurrences,
  });
}
