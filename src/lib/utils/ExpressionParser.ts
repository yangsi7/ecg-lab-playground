import jsep from 'jsep';
import type { HolterStudy } from '../../types/domain/holter';

type SupportedValue = string | number | boolean | null;
type DataRecord = HolterStudy;

class ExpressionEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpressionEvaluationError';
  }
}

export const evaluateExpression = (expression: string, data: DataRecord): boolean => {
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

const evaluateAst = (node: jsep.Expression, data: DataRecord): any => {
  switch (node.type) {
    case 'BinaryExpression':
      return evaluateBinaryExpression(node as jsep.BinaryExpression, data);
    case 'Identifier':
      return evaluateIdentifier(node as jsep.Identifier, data);
    case 'Literal':
      return (node as jsep.Literal).value;
    case 'UnaryExpression':
      return evaluateUnaryExpression(node as jsep.UnaryExpression, data);
    default:
      throw new ExpressionEvaluationError(`Unsupported expression type: ${node.type}`);
  }
};

const evaluateBinaryExpression = (node: jsep.BinaryExpression, data: DataRecord): boolean => {
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

const evaluateUnaryExpression = (node: jsep.UnaryExpression, data: DataRecord): boolean => {
  const argument = evaluateAst(node.argument, data);
  
  switch (node.operator) {
    case '!': return !argument;
    default:
      throw new ExpressionEvaluationError(`Unsupported unary operator: ${node.operator}`);
  }
};

const evaluateIdentifier = (node: jsep.Identifier, data: DataRecord): SupportedValue => {
  const key = node.name as keyof DataRecord;
  const value = data[key];
  if (value === undefined) {
    throw new ExpressionEvaluationError(`Unknown field: ${node.name}`);
  }
  return value;
};

export const validateExpression = (expression: string): boolean => {
  try {
    jsep(expression);
    return true;
  } catch (error) {
    return false;
  }
}; 