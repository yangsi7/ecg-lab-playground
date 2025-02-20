import jsep, { Expression, BinaryExpression, Identifier, Literal, UnaryExpression } from 'jsep';
import type { HolterStudy } from '../../types/domain/holter';

// Types
type SupportedValue = string | number | boolean | null;
type DataRecord = HolterStudy;

export type FilterableField = keyof Pick<HolterStudy, 
  'daysRemaining' | 
  'qualityFraction' | 
  'totalHours' | 
  'interruptions' | 
  'qualityVariance'
>;

export const FILTERABLE_FIELDS: FilterableField[] = [
  'daysRemaining',
  'qualityFraction',
  'totalHours',
  'interruptions',
  'qualityVariance'
];

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
export const evaluateExpression = (expression: string, data: DataRecord): boolean => {
  if (!expression.trim()) return true;

  try {
    const ast = jsep(expression);
    return evaluateAst(ast, data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new ExpressionEvaluationError(`Invalid filter expression: ${error.message}`);
    }
    throw new ExpressionEvaluationError('Invalid filter expression: Unknown error');
  }
};

const evaluateAst = (node: Expression, data: DataRecord): any => {
  switch (node.type) {
    case 'BinaryExpression':
      return evaluateBinaryExpression(node as BinaryExpression, data);
    case 'Identifier':
      return evaluateIdentifier(node as Identifier, data);
    case 'Literal':
      return (node as Literal).value;
    case 'UnaryExpression':
      return evaluateUnaryExpression(node as UnaryExpression, data);
    default:
      throw new ExpressionEvaluationError(`Unsupported expression type: ${node.type}`);
  }
};

const evaluateBinaryExpression = (node: BinaryExpression, data: DataRecord): boolean => {
  const left = evaluateAst(node.left, data);
  const right = evaluateAst(node.right, data);

  switch (node.operator) {
    case '==': return left == right;
    case '===': return left === right;
    case '!=': return left != right;
    case '!==': return left !== right;
    case '<': return left < right;
    case '<=': return left <= right;
    case '>': return left > right;
    case '>=': return left >= right;
    case '&&': return left && right;
    case '||': return left || right;
    default:
      throw new ExpressionEvaluationError(`Unsupported operator: ${node.operator}`);
  }
};

const evaluateUnaryExpression = (node: UnaryExpression, data: DataRecord): boolean => {
  const argument = evaluateAst(node.argument, data);
  
  switch (node.operator) {
    case '!': return !argument;
    default:
      throw new ExpressionEvaluationError(`Unsupported unary operator: ${node.operator}`);
  }
};

const evaluateIdentifier = (node: Identifier, data: DataRecord): SupportedValue => {
  const key = node.name as keyof DataRecord;
  
  // Validate that the field is filterable
  if (!FILTERABLE_FIELDS.includes(key as FilterableField)) {
    throw new ExpressionEvaluationError(`Unknown or unsupported field: ${node.name}`);
  }

  const value = data[key];
  if (value === undefined) {
    throw new ExpressionEvaluationError(`Field not found: ${node.name}`);
  }
  return value;
};

/**
 * Validates an expression without evaluating it.
 * Returns true if the expression is valid, false otherwise.
 * Throws an ExpressionEvaluationError with details if throwError is true.
 */
export const validateExpression = (expression: string, throwError = false): boolean => {
  if (!expression.trim()) return true;
  
  try {
    const ast = jsep(expression);
    validateAst(ast);
    return true;
  } catch (error) {
    if (throwError) {
      throw new ExpressionEvaluationError(
        error instanceof Error ? error.message : 'Invalid expression'
      );
    }
    return false;
  }
};

const validateAst = (node: Expression): void => {
  switch (node.type) {
    case 'BinaryExpression': {
      const binaryNode = node as BinaryExpression;
      if (!['>', '<', '>=', '<=', '==', '===', '!=', '!==', '&&', '||'].includes(binaryNode.operator)) {
        throw new ExpressionEvaluationError(`Unsupported operator: ${binaryNode.operator}`);
      }
      validateAst(binaryNode.left);
      validateAst(binaryNode.right);
      break;
    }
    
    case 'Identifier': {
      const identNode = node as Identifier;
      if (!FILTERABLE_FIELDS.includes(identNode.name as FilterableField)) {
        throw new ExpressionEvaluationError(`Unknown field: ${identNode.name}`);
      }
      break;
    }
    
    case 'Literal': {
      const literalNode = node as Literal;
      if (typeof literalNode.value !== 'number' && typeof literalNode.value !== 'boolean') {
        throw new ExpressionEvaluationError('Only numeric and boolean literals are supported');
      }
      break;
    }
    
    case 'UnaryExpression': {
      const unaryNode = node as UnaryExpression;
      if (unaryNode.operator !== '!') {
        throw new ExpressionEvaluationError(`Unsupported unary operator: ${unaryNode.operator}`);
      }
      validateAst(unaryNode.argument);
      break;
    }
    
    default:
      throw new ExpressionEvaluationError(`Unsupported expression type: ${node.type}`);
  }
}; 