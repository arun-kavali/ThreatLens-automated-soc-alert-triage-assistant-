// Input sanitization utilities for AI prompts to prevent prompt injection attacks

/**
 * Sanitize text for use in AI prompts
 * Removes common prompt injection patterns
 */
export function sanitizeForPrompt(text: string, maxLength = 1000): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove common prompt injection patterns
    .replace(/ignore\s+(all\s+)?previous\s+instructions?/gi, '[filtered]')
    .replace(/forget\s+(everything|all|the\s+alert)/gi, '[filtered]')
    .replace(/you\s+are\s+now/gi, '[filtered]')
    .replace(/new\s+instructions?:/gi, '[filtered]')
    .replace(/system:/gi, '[filtered]')
    .replace(/assistant:/gi, '[filtered]')
    .replace(/\[INST\]/gi, '[filtered]')
    .replace(/<<SYS>>/gi, '[filtered]')
    .replace(/<\|im_start\|>/gi, '[filtered]')
    .replace(/<\|im_end\|>/gi, '[filtered]')
    // Remove attempts to override risk/severity
    .replace(/set\s+(severity|risk\s*score)\s+to/gi, '[filtered]')
    .replace(/classify\s+(as|severity)\s+(low|medium|high|critical)/gi, '[filtered]')
    // Limit length to prevent prompt stuffing
    .slice(0, maxLength);
}

/**
 * Recursively sanitize all string values in an object
 */
export function sanitizeObject(obj: unknown, maxStringLength = 500): unknown {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeForPrompt(obj, maxStringLength);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxStringLength));
  }
  
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, maxStringLength);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Check if content contains suspicious patterns that may indicate prompt injection
 */
export function containsSuspiciousPatterns(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?previous/i,
    /forget\s+(everything|all)/i,
    /you\s+are\s+now/i,
    /new\s+instructions?:/i,
    /\[INST\]/i,
    /<<SYS>>/i,
    /<\|im_start\|>/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
}

/**
 * Sanitize alert data specifically for SOC analysis prompts
 */
export function sanitizeAlertForPrompt(alert: {
  alert_type?: string;
  severity?: string;
  source_system?: string;
  timestamp?: string;
  raw_log?: unknown;
}): {
  alert_type: string;
  severity: string;
  source_system: string;
  timestamp: string;
  raw_log: unknown;
  contains_suspicious_content: boolean;
} {
  const rawLogStr = JSON.stringify(alert.raw_log || {});
  const isSuspicious = containsSuspiciousPatterns(rawLogStr) ||
    containsSuspiciousPatterns(alert.alert_type || '') ||
    containsSuspiciousPatterns(alert.source_system || '');

  return {
    alert_type: sanitizeForPrompt(alert.alert_type || '', 200),
    severity: alert.severity || 'Medium', // Enum, safe
    source_system: sanitizeForPrompt(alert.source_system || '', 200),
    timestamp: alert.timestamp || new Date().toISOString(),
    raw_log: sanitizeObject(alert.raw_log, 300),
    contains_suspicious_content: isSuspicious,
  };
}
