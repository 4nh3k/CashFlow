// UTF-8 text utilities for Vietnamese language support

// Validate UTF-8 text
export const isValidUTF8 = (text: string): boolean => {
  try {
    // Test if the string can be properly encoded and decoded as UTF-8
    const encoded = new TextEncoder().encode(text);
    const decoded = new TextDecoder('utf-8').decode(encoded);
    return decoded === text;
  } catch {
    return false;
  }
};

// Sanitize text for safe storage (remove invalid UTF-8 characters)
export const sanitizeUTF8Text = (text: string): string => {
  try {
    // Remove null bytes and other problematic characters
    let sanitized = text.replace(/\0/g, '');
    
    // Normalize Unicode characters
    sanitized = sanitized.normalize('NFC');
    
    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized;
  } catch {
    return '';
  }
};

// Validate Vietnamese text
export const isValidVietnameseText = (text: string): boolean => {
  // Vietnamese alphabet pattern including diacritics
  const vietnamesePattern = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s\d.,!?@#$%^&*()_+\-=\[\]{};':"\\|<>\/]+$/;
  
  return vietnamesePattern.test(text);
};

// Clean Vietnamese text (remove extra spaces, normalize)
export const cleanVietnameseText = (text: string): string => {
  // Normalize Unicode
  let cleaned = text.normalize('NFC');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
};

// Validate text length for different purposes
export const validateTextLength = (text: string, minLength: number = 1, maxLength: number = 500): boolean => {
  return text.length >= minLength && text.length <= maxLength;
};

// Get text statistics
export const getTextStats = (text: string) => {
  return {
    length: text.length,
    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
    characterCount: text.replace(/\s/g, '').length,
    lineCount: text.split('\n').length
  };
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.substring(0, maxLength - suffix.length);
  return truncated + suffix;
};

// Escape HTML entities for safe display
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Unescape HTML entities
export const unescapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || '';
};

// Format Vietnamese currency text
export const formatVietnameseCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(amount);
};

// Format Vietnamese date
export const formatVietnameseDate = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  
  return formatter.format(date);
};

// Format Vietnamese number
export const formatVietnameseNumber = (number: number): string => {
  const formatter = new Intl.NumberFormat('vi-VN');
  return formatter.format(number);
};

// Text validation for forms
export const validateFormText = (text: string, fieldName: string): { isValid: boolean; error?: string } => {
  // Check if empty
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: `${fieldName} không được để trống` };
  }
  
  // Check UTF-8 validity
  if (!isValidUTF8(text)) {
    return { isValid: false, error: `${fieldName} chứa ký tự không hợp lệ` };
  }
  
  // Check length
  if (text.length > 500) {
    return { isValid: false, error: `${fieldName} quá dài (tối đa 500 ký tự)` };
  }
  
  return { isValid: true };
}; 