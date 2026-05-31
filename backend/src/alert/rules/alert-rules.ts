import { AlertType, AlertSeverity } from '../alert.entity';
import { StoolColor } from '../../record/record.entity';

export interface AlertRuleInput {
  record: {
    id: string;
    bristolType: number;
    color: string;
    symptoms: string[] | null;
  };
  healthScore: { score: number };
  history: {
    recentScores: { score: number; createdAt: Date }[];
    recentRecords: { bristolType: number; score: number }[];
  };
  subjectNickname: string;
}

export interface AlertCandidate {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  summary: string;
  payload: object;
}

export function evaluate(input: AlertRuleInput): AlertCandidate[] {
  const candidates: AlertCandidate[] = [];
  const danger = evaluateDangerSignal(input);
  if (danger) candidates.push(danger);
  const scoreDrop = evaluateScoreDrop(input);
  if (scoreDrop) candidates.push(scoreDrop);
  const chronic = evaluateChronicTrend(input);
  if (chronic) candidates.push(chronic);
  return candidates;
}

function evaluateDangerSignal(input: AlertRuleInput): AlertCandidate | null {
  const { record, subjectNickname } = input;
  const rules: string[] = [];
  const summaries: string[] = [];

  if (record.color === StoolColor.BLACK) {
    rules.push('color_black');
    summaries.push('粪便颜色异常发黑，可能提示上消化道出血，建议尽快就医检查。');
  }
  if (record.color === StoolColor.RED) {
    rules.push('color_red');
    summaries.push('粪便颜色发红，可能有下消化道出血，建议尽快就医检查。');
  }
  if (record.symptoms?.includes('出血')) {
    rules.push('symptom_blood');
    summaries.push('本次记录伴随出血症状，建议关注并及时就医。');
  }

  if (rules.length === 0) return null;

  let summary = summaries.join('');
  if (rules.length > 1) {
    summary += '强烈建议 24 小时内就医。';
  }

  const label = rules.includes('symptom_blood')
    ? '出血'
    : rules.includes('color_black')
      ? '黑便'
      : '红色便';

  return {
    type: AlertType.DANGER_SIGNAL,
    severity: AlertSeverity.DANGER,
    title: `${subjectNickname} 出现${label}`,
    summary,
    payload: {
      color: record.color,
      symptoms: record.symptoms || [],
      bristolType: record.bristolType,
      rules,
    },
  };
}

function evaluateScoreDrop(input: AlertRuleInput): AlertCandidate | null {
  const { healthScore, history, subjectNickname } = input;
  const score = healthScore.score;

  if (score < 40) {
    return {
      type: AlertType.SCORE_DROP,
      severity: AlertSeverity.WARN,
      title: `${subjectNickname} 健康评分降至 ${score}`,
      summary: `本次健康评分 ${score}（< 40），建议关注饮食与休息。`,
      payload: { currentScore: score, rule: 'absolute_low' },
    };
  }

  if (history.recentScores.length < 3) return null;

  const avg = Math.round(
    history.recentScores.reduce((sum, s) => sum + s.score, 0) /
      history.recentScores.length,
  );
  const delta = score - avg;

  if (delta <= -25) {
    return {
      type: AlertType.SCORE_DROP,
      severity: AlertSeverity.WARN,
      title: `${subjectNickname} 健康评分降至 ${score}`,
      summary: `本次健康评分 ${score}，较 7 日均值（${avg}）下降 ${Math.abs(delta)} 分。`,
      payload: { currentScore: score, avgScore7d: avg, delta, rule: 'relative_drop' },
    };
  }

  return null;
}

function evaluateChronicTrend(input: AlertRuleInput): AlertCandidate | null {
  const { history, subjectNickname } = input;
  const records = history.recentRecords;

  if (records.length < 5) return null;
  const last5 = records.slice(0, 5);

  const constipationCount = last5.filter((r) => r.bristolType <= 2).length;
  if (constipationCount >= 4) {
    return {
      type: AlertType.CHRONIC_TREND,
      severity: AlertSeverity.INFO,
      title: `${subjectNickname} 近期排便规律异常`,
      summary: `近 5 次记录中 ${constipationCount} 次出现便秘症状，建议关注饮食与运动。`,
      payload: { pattern: 'constipation', windowSize: 5, matchCount: constipationCount },
    };
  }

  const diarrheaCount = last5.filter((r) => r.bristolType >= 6).length;
  if (diarrheaCount >= 4) {
    return {
      type: AlertType.CHRONIC_TREND,
      severity: AlertSeverity.INFO,
      title: `${subjectNickname} 近期排便规律异常`,
      summary: `近 5 次记录中 ${diarrheaCount} 次出现腹泻症状，建议关注饮食卫生。`,
      payload: { pattern: 'diarrhea', windowSize: 5, matchCount: diarrheaCount },
    };
  }

  const lowScoreCount = last5.filter((r) => r.score < 60).length;
  if (lowScoreCount >= 4) {
    return {
      type: AlertType.CHRONIC_TREND,
      severity: AlertSeverity.INFO,
      title: `${subjectNickname} 近期排便规律异常`,
      summary: `近 5 次记录平均健康评分偏低，建议整体关注肠道健康。`,
      payload: { pattern: 'low_score', windowSize: 5, matchCount: lowScoreCount },
    };
  }

  return null;
}
