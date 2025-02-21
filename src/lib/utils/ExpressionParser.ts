/**
 * Expression parser for advanced filtering
 */
import type { FilterExpression, FilterField, FilterOperator } from '@/types/filter';

export class ExpressionEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpressionEvaluationError';
  }
}

// List of fields that can be filtered
export const FILTERABLE_FIELDS = [
  'qualityFraction',
  'totalMinutes',
  'batteryLevel',
  'activeStudies',
  'totalStudies',
  'averageQuality'
];

const OPERATORS: FilterOperator[] = ['=', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith'];

/**
 * Validates and parses a filter expression string into a structured FilterExpression
 */
export function validateExpression(expression: string, fields: FilterField[]): FilterExpression {
  if (!expression.trim()) {
    throw new ExpressionEvaluationError('Expression cannot be empty');
  }

  // Simple expression parsing (field operator value)
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 3) {
    throw new ExpressionEvaluationError('Invalid expression format. Expected: field operator value');
  }

  const field = parts[0];
  const operator = parts[1] as FilterOperator;
  const value = parts.slice(2).join(' ');

  // Validate field
  if (!fields.some(f => f.key === field)) {
    throw new ExpressionEvaluationError(`Invalid field: ${field}`);
  }

  // Validate operator
  if (!OPERATORS.includes(operator)) {
    throw new ExpressionEvaluationError(`Invalid operator: ${operator}`);
  }

  // Get field type
  const fieldDef = fields.find(f => f.key === field)!;

  // Parse and validate value based on field type
  let parsedValue: string | number | boolean | Date;
  try {
    switch (fieldDef.type) {
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          throw new Error('Invalid number');
        }
        parsedValue = num;
        break;
      case 'boolean':
        if (!['true', 'false'].includes(value.toLowerCase())) {
          throw new Error('Invalid boolean');
        }
        parsedValue = value.toLowerCase() === 'true';
        break;
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        parsedValue = date;
        break;
      default:
        parsedValue = value;
    }
  } catch (err) {
    throw new ExpressionEvaluationError(`Invalid value for type ${fieldDef.type}: ${value}`);
  }

  return {
    field,
    operator,
    value: parsedValue
  };
}

/**
 * Evaluates a filter expression against an item
 */
export function evaluateExpression<T>(item: T, expression: FilterExpression): boolean {
  const itemValue = (item as Record<string, unknown>)[expression.field];
  const exprValue = expression.value;
  
  switch (expression.operator) {
    case '=':
      return itemValue === exprValue;
    case '!=':
      return itemValue !== exprValue;
    case '>':
      return typeof itemValue === 'number' && typeof exprValue === 'number' && itemValue > exprValue;
    case '<':
      return typeof itemValue === 'number' && typeof exprValue === 'number' && itemValue < exprValue;
    case '>=':
      return typeof itemValue === 'number' && typeof exprValue === 'number' && itemValue >= exprValue;
    case '<=':
      return typeof itemValue === 'number' && typeof exprValue === 'number' && itemValue <= exprValue;
    case 'contains':
      return String(itemValue).toLowerCase().includes(String(exprValue).toLowerCase());
    case 'startsWith':
      return String(itemValue).toLowerCase().startsWith(String(exprValue).toLowerCase());
    case 'endsWith':
      return String(itemValue).toLowerCase().endsWith(String(exprValue).toLowerCase());
    default:
      return false;
  }
} 