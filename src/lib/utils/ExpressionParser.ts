import type { FilterExpression, FilterField } from '../../types/filter';

export class ExpressionParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpressionParserError';
  }
}

export function parseExpression(
  expression: string,
  fields: FilterField[]
): FilterExpression | null {
  if (!expression.trim()) return null;

  // Basic expression parsing (field operator value)
  const parts = expression.split(/\s+/);
  if (parts.length < 3) {
    throw new ExpressionParserError('Expression must contain field, operator, and value');
  }

  const [field, operator, ...valueParts] = parts;
  const value = valueParts.join(' ');

  // Validate field
  const fieldDef = fields.find(f => f.key === field);
  if (!fieldDef) {
    throw new ExpressionParserError(`Unknown field: ${field}`);
  }

  // Validate operator
  const validOperators = {
    string: ['=', '!=', 'contains', 'startsWith', 'endsWith'],
    number: ['=', '!=', '>', '<', '>=', '<='],
    boolean: ['=', '!='],
    date: ['=', '!=', '>', '<', '>=', '<=']
  };

  if (!validOperators[fieldDef.type].includes(operator)) {
    throw new ExpressionParserError(
      `Invalid operator '${operator}' for field type '${fieldDef.type}'`
    );
  }

  // Parse value based on field type
  let parsedValue: string | number | boolean | Date;
  try {
    switch (fieldDef.type) {
      case 'number':
        parsedValue = Number(value);
        if (isNaN(parsedValue)) {
          throw new Error('Invalid number');
        }
        break;
      case 'boolean':
        if (!['true', 'false'].includes(value.toLowerCase())) {
          throw new Error('Invalid boolean');
        }
        parsedValue = value.toLowerCase() === 'true';
        break;
      case 'date':
        parsedValue = new Date(value);
        if (isNaN(parsedValue.getTime())) {
          throw new Error('Invalid date');
        }
        break;
      default:
        parsedValue = value;
    }
  } catch (err) {
    throw new ExpressionParserError(
      `Invalid value for field type '${fieldDef.type}': ${value}`
    );
  }

  return {
    field,
    operator,
    value: parsedValue
  };
} 