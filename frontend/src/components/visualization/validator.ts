'use client';

import { TEMPLATE_REQUIRED_CONFIG, type ValidatedVisualizationPayload, type VisualizationTemplate } from './schema';

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
}

function getConfigNumber(config: Record<string, unknown> | undefined, key: string, fallback = 0): number {
  const value = config?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function validateVisualizationPayload(
  payload: ValidatedVisualizationPayload,
): TemplateValidationResult {
  const errors: string[] = [];
  const template = payload.type as VisualizationTemplate;
  const config = payload.config;

  if (payload.primaryCount < 0 || payload.secondaryCount < 0 || payload.totalCount < 0) {
    errors.push('Counts must be non-negative.');
  }

  for (const key of TEMPLATE_REQUIRED_CONFIG[template] ?? []) {
    if (!(key in (config ?? {}))) {
      errors.push(`Missing required config key '${key}'.`);
    }
  }

  if (template === 'comparison_visual') {
    const expected = payload.primaryCount > payload.secondaryCount ? '>' : payload.primaryCount < payload.secondaryCount ? '<' : '=';
    const operator = config?.compare_operator;
    if (typeof operator === 'string' && operator !== expected) {
      errors.push('Comparison operator does not match the counts.');
    }
  }

  if (template === 'place_value_blocks') {
    const number = getConfigNumber(config, 'number', payload.totalCount);
    const hundreds = getConfigNumber(config, 'hundreds', 0);
    const tens = getConfigNumber(config, 'tens', payload.primaryCount);
    const ones = getConfigNumber(config, 'ones', payload.secondaryCount);
    if (hundreds * 100 + tens * 10 + ones !== number) {
      errors.push('Place value config does not rebuild the number.');
    }
  }

  if (template === 'array_model') {
    const rows = getConfigNumber(config, 'rows', payload.primaryCount);
    const cols = getConfigNumber(config, 'cols', payload.secondaryCount);
    if (rows * cols !== payload.totalCount) {
      errors.push('Array model rows and cols do not match totalCount.');
    }
  }

  if (template === 'operation_story' || template === 'stick_bundles' || template === 'ten_frame' || template === 'number_line') {
    const before = getConfigNumber(config, 'before', payload.primaryCount);
    const change = getConfigNumber(config, 'change', payload.secondaryCount);
    const result = getConfigNumber(config, 'result', payload.totalCount);
    const operation = typeof config?.operation === 'string' ? config.operation : '+';
    const expected = operation === '-' ? before - change : before + change;
    if (result !== expected) {
      errors.push('Operation payload is mathematically inconsistent.');
    }
  }

  if (template === 'money_visual') {
    const denominations = Array.isArray(config?.denominations)
      ? config?.denominations.map((value) => Number(value)).filter(Number.isFinite)
      : [];
    if (!denominations.length) {
      errors.push('Money visual requires denominations.');
    }
    const totalValue = getConfigNumber(config, 'total_value', payload.totalCount);
    if (denominations.length && denominations.reduce((sum, value) => sum + value, 0) !== totalValue) {
      errors.push('Money visual total does not match the denominations.');
    }
  }

  if (template === 'picture_graph' || template === 'data_table') {
    const labels = Array.isArray(config?.labels) ? config.labels : [];
    const values = Array.isArray(config?.values) ? config.values : [];
    if (labels.length !== values.length || labels.length === 0) {
      errors.push('Data visuals require matching labels and values.');
    }
  }

  if (template === 'probability_experiment') {
    const outcomes = Array.isArray(config?.outcomes) ? config.outcomes : [];
    const favorableCount = getConfigNumber(config, 'favorable_count', payload.secondaryCount);
    if (!outcomes.length) {
      errors.push('Probability visual requires outcomes.');
    } else if (favorableCount > outcomes.length) {
      errors.push('Probability favorable count exceeds outcomes length.');
    }
  }

  if (template === 'ten_frame' && payload.totalCount > 20) {
    errors.push('Ten-frame mental math should stay within 20.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
