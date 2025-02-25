/**
 * Expression parser for advanced filtering
 */
import type { FilterField, FilterCondition } from '@/types/filter';
// @ts-ignore - Ignoring type issues with jsep import
import jsep from 'jsep';
import { logger } from '@/lib/logger';

// Define Expression type
type Expression = ReturnType<typeof jsep>;

// Define our own FilterOperator to match the ones used in this file
export type FilterOperator = 
  | '=' 
  | '!=' 
  | '>' 
  | '<' 
  | '>=' 
  | '<=' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith';

// Custom FilterExpression that uses our local FilterOperator
export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

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

export function parseExpression(expression: string): Expression {
  try {
    return jsep(expression);
  } catch (error) {
    logger.error('Failed to parse expression:', { error });
    throw error;
  }
}

/**
 * Evaluates a JSEP expression node against a context object
 */
export function evaluateJsepExpression(node: Expression, context: Record<string, unknown>): unknown {
  if (!node) return null;

  try {
    switch (node.type) {
      case 'BinaryExpression': {
        const left = evaluateJsepExpression((node as any).left, context);
        const right = evaluateJsepExpression((node as any).right, context);
        const operator = (node as any).operator;

        switch (operator) {
          case '+': return Number(left) + Number(right);
          case '-': return Number(left) - Number(right);
          case '*': return Number(left) * Number(right);
          case '/': return Number(left) / Number(right);
          case '==': return left == right;
          case '===': return left === right;
          case '!=': return left != right;
          case '!==': return left !== right;
          case '>': return Number(left) > Number(right);
          case '<': return Number(left) < Number(right);
          case '>=': return Number(left) >= Number(right);
          case '<=': return Number(left) <= Number(right);
          case '&&': return Boolean(left) && Boolean(right);
          case '||': return Boolean(left) || Boolean(right);
          default:
            throw new Error(`Unsupported operator: ${operator}`);
        }
      }

      case 'UnaryExpression': {
        const argument = evaluateJsepExpression((node as any).argument, context);
        const operator = (node as any).operator;

        switch (operator) {
          case '!': return !argument;
          case '-': return -Number(argument);
          case '+': return +Number(argument);
          default:
            throw new Error(`Unsupported unary operator: ${operator}`);
        }
      }

      case 'Identifier':
        return context[(node as any).name];

      case 'Literal':
        return (node as any).value;

      case 'CallExpression': {
        const callee = (node as any).callee;
        if (callee.type !== 'Identifier') {
          throw new Error('Only simple function calls are supported');
        }

        const args = (node as any).arguments.map((arg: Expression) => 
          evaluateJsepExpression(arg, context)
        );

        const fn = context[callee.name];
        if (typeof fn !== 'function') {
          throw new Error(`Function ${callee.name} not found in context`);
        }

        return fn(...args);
      }

      default:
        throw new Error(`Unsupported expression type: ${node.type}`);
    }
  } catch (error) {
    logger.error('Failed to evaluate expression:', { error });
    throw error;
  }
} 