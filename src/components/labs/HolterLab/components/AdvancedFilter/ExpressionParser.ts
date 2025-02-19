import jsep, { Expression, BinaryExpression, Identifier, Literal } from 'jsep';
import type { HolterStudy } from '../../../../../types/domain/holter';

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

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export function validateExpression(expression: string): void {
  if (!expression.trim()) return;
  
  try {
    const ast = jsep(expression);
    validateAst(ast);
  } catch (error) {
    throw new ParseError(error instanceof Error ? error.message : 'Invalid expression');
  }
}

function validateAst(node: Expression): void {
  switch (node.type) {
    case 'BinaryExpression': {
      const binaryNode = node as BinaryExpression;
      if (!['>', '<', '>=', '<=', '==', '===', '!=', '!=='].includes(binaryNode.operator)) {
        throw new ParseError(`Unsupported operator: ${binaryNode.operator}`);
      }
      validateAst(binaryNode.left);
      validateAst(binaryNode.right);
      break;
    }
    
    case 'Identifier': {
      const identNode = node as Identifier;
      if (!FILTERABLE_FIELDS.includes(identNode.name as FilterableField)) {
        throw new ParseError(`Unknown field: ${identNode.name}`);
      }
      break;
    }
    
    case 'Literal': {
      const literalNode = node as Literal;
      if (typeof literalNode.value !== 'number') {
        throw new ParseError('Only numeric literals are supported');
      }
      break;
    }
    
    default:
      throw new ParseError(`Unsupported expression type: ${node.type}`);
  }
}

export function evaluateExpression(expression: string, study: HolterStudy): boolean {
  if (!expression.trim()) return true;
  
  try {
    const ast = jsep(expression);
    if (!ast) return true;
    return Boolean(evaluateAst(ast, study));
  } catch (error) {
    console.error('Filter evaluation error:', error);
    return false;
  }
}

function evaluateAst(node: Expression, study: HolterStudy): number {
  switch (node.type) {
    case 'BinaryExpression': {
      const binaryNode = node as BinaryExpression;
      if (!binaryNode.left || !binaryNode.right) return 0;
      
      const left = evaluateAst(binaryNode.left, study);
      const right = evaluateAst(binaryNode.right, study);
      
      switch (binaryNode.operator) {
        case '>': return Number(left > right);
        case '<': return Number(left < right);
        case '>=': return Number(left >= right);
        case '<=': return Number(left <= right);
        case '==':
        case '===': return Number(left === right);
        case '!=':
        case '!==': return Number(left !== right);
        default: return 0;
      }
    }
    
    case 'Identifier': {
      const identNode = node as Identifier;
      return study[identNode.name as FilterableField] as number;
    }
    
    case 'Literal': {
      const literalNode = node as Literal;
      return literalNode.value as number;
    }
    
    default:
      return 0;
  }
} 