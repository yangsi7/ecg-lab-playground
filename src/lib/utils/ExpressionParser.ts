import jsep from 'jsep';
import type { HolterStudy } from '../../types/domain/holter';

// Types
type SupportedValue = string | number | boolean | null;
type DataRecord = HolterStudy;

// Define filterable fields and their types
export const FILTERABLE_FIELDS = [
  'daysRemaining',
  'qualityFraction',
  'totalHours',
  'interruptions',
  'qualityVariance',
  'created_at',
  'updated_at',
  'status',
] as const;

export type FilterableField = typeof FILTERABLE_FIELDS[number];

// Type guard for filterable fields
export function isFilterableField(field: string): field is FilterableField {
  return FILTERABLE_FIELDS.includes(field as FilterableField);
}

// Error types
export class ExpressionEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpressionEvaluationError';
  }
}

/**
 * Evaluates a simple JavaScript-like expression against a study object.
 * Supports basic comparisons and logical operators.
 * 
 * Example expressions:
 * - "qualityFraction < 0.5"
 * - "totalHours > 10 && qualityFraction >= 0.7"
 * - "daysRemaining <= 3"
 */
export function evaluateExpression<T extends Record<string, unknown>>(
  expression: string,
  record: T
): boolean {
  if (!expression.trim()) return true;

  try {
    const ast = jsep(expression);
    return evaluateNode(ast, record);
  } catch (err) {
    if (err instanceof Error) {
      throw new ExpressionEvaluationError(err.message);
    }
    throw new ExpressionEvaluationError('Expression evaluation failed');
  }
}

// Validate expression syntax and field names
export function validateExpression(expression: string): void {
  if (!expression.trim()) return;

  try {
    const ast = jsep(expression);
    validateNode(ast);
  } catch (err) {
    if (err instanceof Error) {
      throw new ExpressionEvaluationError(err.message);
    }
    throw new ExpressionEvaluationError('Invalid expression');
  }
}

// Helper functions for AST validation and evaluation
function validateNode(node: jsep.Expression): void {
  switch (node.type) {
    case 'BinaryExpression': {
      const binExpr = node as jsep.BinaryExpression;
      validateNode(binExpr.left);
      validateNode(binExpr.right);
      break;
    }
    case 'Identifier': {
      const idNode = node as jsep.Identifier;
      if (!isFilterableField(idNode.name)) {
        throw new ExpressionEvaluationError(`Invalid field: ${idNode.name}`);
      }
      break;
    }
    case 'Literal':
      break;
    default:
      throw new ExpressionEvaluationError(`Unsupported expression type: ${node.type}`);
  }
}

function evaluateNode<T extends Record<string, unknown>>(
  node: jsep.Expression,
  record: T
): boolean {
  switch (node.type) {
    case 'BinaryExpression': {
      const binExpr = node as jsep.BinaryExpression;
      const left = evaluateNode(binExpr.left, record);
      const right = evaluateNode(binExpr.right, record);

      switch (binExpr.operator) {
        case '==':
        case '===':
          return left === right;
        case '!=':
        case '!==':
          return left !== right;
        case '<':
          return left < right;
        case '<=':
          return left <= right;
        case '>':
          return left > right;
        case '>=':
          return left >= right;
        case '&&':
          return left && right;
        case '||':
          return left || right;
        default:
          throw new ExpressionEvaluationError(`Unsupported operator: ${binExpr.operator}`);
      }
    }
    case 'Identifier': {
      const idNode = node as jsep.Identifier;
      if (!isFilterableField(idNode.name)) {
        throw new ExpressionEvaluationError(`Invalid field: ${idNode.name}`);
      }
      return record[idNode.name];
    }
    case 'Literal': {
      const litNode = node as jsep.Literal;
      return litNode.value;
    }
    default:
      throw new ExpressionEvaluationError(`Unsupported expression type: ${node.type}`);
  }
}

// Helper functions for common filter patterns
export function createDateRangeFilter(
  field: FilterableField,
  startDate: Date,
  endDate: Date
): string {
  return `${field} >= "${startDate.toISOString()}" && ${field} <= "${endDate.toISOString()}"`;
}

export function createQualityFilter(threshold: number, operator: '>=' | '<='): string {
  return `qualityFraction ${operator} ${threshold}`;
}

export function createCompoundFilter(...expressions: string[]): string {
  return expressions.filter(Boolean).join(' && ');
} 