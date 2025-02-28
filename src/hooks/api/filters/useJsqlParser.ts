import type { HolterStudy } from '@/types/domain/holter';

type FilterFunction<T> = (item: T) => boolean;

/**
 * Parse a simple JSQL expression string into a filter function
 * @param expression - A string expression like "qualityFraction > 0.8"
 * @returns A filter function that can be used to filter an array of items
 */
export function parseJsqlExpression(expression: string): FilterFunction<HolterStudy> {
  return (study: HolterStudy) => {
    // Handle empty expressions
    if (!expression || expression.trim() === '') return true;
    
    try {
      // Handle AND operations with multiple expressions
      if (expression.includes('&&')) {
        const subExpressions = expression.split('&&').map(e => e.trim());
        return subExpressions.every(expr => parseJsqlExpression(expr)(study));
      }
      
      // Handle OR operations with multiple expressions
      if (expression.includes('||')) {
        const subExpressions = expression.split('||').map(e => e.trim());
        return subExpressions.some(expr => parseJsqlExpression(expr)(study));
      }
      
      // Parse simple expression like "field operator value"
      const matches = expression.match(/(\w+)\s*([=<>!]=?|!=)\s*(.+)/);
      if (!matches || matches.length !== 4) return true;
      
      const [_, field, operator, valueStr] = matches;
      
      // Skip if field doesn't exist on study
      if (!(field in study)) return true;
      
      const studyValue = study[field as keyof HolterStudy];
      let value: string | number | boolean = valueStr;
      
      // Convert to appropriate type
      if (!isNaN(Number(valueStr))) {
        value = Number(valueStr);
      } else if (valueStr === 'true' || valueStr === 'false') {
        value = valueStr === 'true';
      }
      
      // Comparison based on operator
      switch(operator) {
        case '>': return Number(studyValue) > Number(value);
        case '<': return Number(studyValue) < Number(value);
        case '>=': return Number(studyValue) >= Number(value);
        case '<=': return Number(studyValue) <= Number(value);
        case '==': 
        case '=': return String(studyValue) === String(value);
        case '!=': return String(studyValue) !== String(value);
        default: return true;
      }
    } catch (err) {
      console.error('Error parsing filter expression:', err);
      // On error, include the study
      return true;
    }
  };
}

/**
 * Validate a JSQL expression syntax
 * @param expression - The expression to validate
 * @returns An object with valid flag and optional error message
 */
export function validateJsqlExpression(expression: string): { valid: boolean; error?: string } {
  if (!expression || expression.trim() === '') {
    return { valid: true };
  }
  
  try {
    // Check for balanced operators
    const operators = ['&&', '||', '>', '<', '>=', '<=', '==', '=', '!='];
    let hasValidOperator = false;
    
    for (const op of operators) {
      if (expression.includes(op)) {
        hasValidOperator = true;
        break;
      }
    }
    
    if (!hasValidOperator) {
      return { 
        valid: false, 
        error: 'Expression must include a comparison operator (>, <, >=, <=, ==, !=)' 
      };
    }
    
    // For complex expressions, ensure proper syntax
    if (expression.includes('&&') || expression.includes('||')) {
      const subExpressions = expression
        .split(/&&|\|\|/)
        .map(e => e.trim())
        .filter(Boolean);
      
      for (const subExpr of subExpressions) {
        const subValidation = validateJsqlExpression(subExpr);
        if (!subValidation.valid) {
          return subValidation;
        }
      }
    }
    
    return { valid: true };
  } catch (err) {
    return { 
      valid: false, 
      error: 'Invalid expression syntax' 
    };
  }
} 