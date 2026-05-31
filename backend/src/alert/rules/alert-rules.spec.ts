import { describe, it, expect } from 'vitest';
import { evaluate, AlertRuleInput } from './alert-rules';
import { AlertType, AlertSeverity } from '../alert.entity';

function makeInput(overrides: Partial<AlertRuleInput> = {}): AlertRuleInput {
  return {
    record: { id: 'r1', bristolType: 4, color: 'brown', symptoms: [] },
    healthScore: { score: 80 },
    history: { recentScores: [], recentRecords: [] },
    subjectNickname: '妈妈',
    ...overrides,
  };
}

describe('DANGER_SIGNAL', () => {
  it('triggers on black stool', () => {
    const result = evaluate(makeInput({
      record: { id: 'r1', bristolType: 4, color: 'black', symptoms: [] },
    }));
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(AlertType.DANGER_SIGNAL);
    expect(result[0].severity).toBe(AlertSeverity.DANGER);
    expect((result[0].payload as any).rules).toEqual(['color_black']);
  });

  it('triggers on red stool', () => {
    const result = evaluate(makeInput({
      record: { id: 'r1', bristolType: 4, color: 'red', symptoms: [] },
    }));
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(AlertType.DANGER_SIGNAL);
    expect((result[0].payload as any).rules).toEqual(['color_red']);
  });

  it('triggers on blood symptom', () => {
    const result = evaluate(makeInput({
      record: { id: 'r1', bristolType: 4, color: 'brown', symptoms: ['出血'] },
    }));
    expect(result).toHaveLength(1);
    expect((result[0].payload as any).rules).toEqual(['symptom_blood']);
  });

  it('combines multiple rules with urgent advice', () => {
    const result = evaluate(makeInput({
      record: { id: 'r1', bristolType: 6, color: 'black', symptoms: ['出血'] },
    }));
    expect(result).toHaveLength(1);
    const d = result[0];
    expect((d.payload as any).rules).toEqual(['color_black', 'symptom_blood']);
    expect(d.summary).toContain('强烈建议 24 小时内就医');
  });

  it('does not trigger on normal record', () => {
    const result = evaluate(makeInput());
    const danger = result.find((r) => r.type === AlertType.DANGER_SIGNAL);
    expect(danger).toBeUndefined();
  });
});

describe('SCORE_DROP', () => {
  it('triggers on absolute low score < 40', () => {
    const result = evaluate(makeInput({ healthScore: { score: 35 } }));
    const drop = result.find((r) => r.type === AlertType.SCORE_DROP);
    expect(drop).toBeDefined();
    expect(drop!.severity).toBe(AlertSeverity.WARN);
    expect((drop!.payload as any).rule).toBe('absolute_low');
  });

  it('triggers on relative drop >= 25 with enough history', () => {
    const scores = [
      { score: 95, createdAt: new Date() },
      { score: 90, createdAt: new Date() },
      { score: 92, createdAt: new Date() },
    ];
    const result = evaluate(makeInput({
      healthScore: { score: 65 },
      history: { recentScores: scores, recentRecords: [] },
    }));
    const drop = result.find((r) => r.type === AlertType.SCORE_DROP);
    expect(drop).toBeDefined();
    expect((drop!.payload as any).rule).toBe('relative_drop');
  });

  it('does not trigger when drop is < 25', () => {
    const scores = [
      { score: 70, createdAt: new Date() },
      { score: 72, createdAt: new Date() },
      { score: 68, createdAt: new Date() },
    ];
    const result = evaluate(makeInput({
      healthScore: { score: 65 },
      history: { recentScores: scores, recentRecords: [] },
    }));
    const drop = result.find((r) => r.type === AlertType.SCORE_DROP);
    expect(drop).toBeUndefined();
  });

  it('skips relative check when history < 3', () => {
    const scores = [{ score: 95, createdAt: new Date() }];
    const result = evaluate(makeInput({
      healthScore: { score: 65 },
      history: { recentScores: scores, recentRecords: [] },
    }));
    const drop = result.find((r) => r.type === AlertType.SCORE_DROP);
    expect(drop).toBeUndefined();
  });
});

describe('CHRONIC_TREND', () => {
  it('triggers constipation pattern', () => {
    const records = [
      { bristolType: 1, score: 50 },
      { bristolType: 2, score: 55 },
      { bristolType: 1, score: 45 },
      { bristolType: 2, score: 50 },
      { bristolType: 4, score: 80 },
    ];
    const result = evaluate(makeInput({
      history: { recentScores: [], recentRecords: records },
    }));
    const trend = result.find((r) => r.type === AlertType.CHRONIC_TREND);
    expect(trend).toBeDefined();
    expect((trend!.payload as any).pattern).toBe('constipation');
  });

  it('triggers diarrhea pattern', () => {
    const records = [
      { bristolType: 7, score: 40 },
      { bristolType: 6, score: 45 },
      { bristolType: 7, score: 35 },
      { bristolType: 6, score: 40 },
      { bristolType: 4, score: 80 },
    ];
    const result = evaluate(makeInput({
      history: { recentScores: [], recentRecords: records },
    }));
    const trend = result.find((r) => r.type === AlertType.CHRONIC_TREND);
    expect(trend).toBeDefined();
    expect((trend!.payload as any).pattern).toBe('diarrhea');
  });

  it('does not trigger on mixed pattern', () => {
    const records = [
      { bristolType: 1, score: 50 },
      { bristolType: 7, score: 40 },
      { bristolType: 3, score: 70 },
      { bristolType: 2, score: 55 },
      { bristolType: 5, score: 65 },
    ];
    const result = evaluate(makeInput({
      history: { recentScores: [], recentRecords: records },
    }));
    const trend = result.find((r) => r.type === AlertType.CHRONIC_TREND);
    expect(trend).toBeUndefined();
  });

  it('does not trigger with < 5 records', () => {
    const records = [
      { bristolType: 1, score: 50 },
      { bristolType: 1, score: 50 },
      { bristolType: 1, score: 50 },
    ];
    const result = evaluate(makeInput({
      history: { recentScores: [], recentRecords: records },
    }));
    const trend = result.find((r) => r.type === AlertType.CHRONIC_TREND);
    expect(trend).toBeUndefined();
  });
});
