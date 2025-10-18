// Smart NLP Parser for Quick Add
import * as chrono from 'chrono-node';
import nlp from 'compromise';
import { ItemType, Priority } from '@/types';

export interface SmartParsedData {
  // Core fields
  title: string;
  cleanedText: string;
  
  // Smart detections with confidence
  detections: {
    type?: {
      value: ItemType;
      confidence: 'high' | 'medium' | 'low';
      keywords: string[];
    };
    priority?: {
      value: Priority;
      confidence: 'high' | 'medium' | 'low';
      keywords: string[];
    };
    isPublic?: {
      value: boolean;
      confidence: 'high' | 'medium' | 'low';
      keywords: string[];
    };
    categories?: Array<{
      value: string;
      confidence: 'high' | 'medium' | 'low';
      matchedKeywords: string[];
    }>;
    time?: {
      value: Date;
      confidence: 'high' | 'medium' | 'low';
      text: string;
    };
    startTime?: {
      value: Date;
      confidence: 'high' | 'medium' | 'low';
      text: string;
    };
    endTime?: {
      value: Date;
      confidence: 'high' | 'medium' | 'low';
      text: string;
    };
  };
}

interface CategoryDefinition {
  id: string;
  name: string;
  keywords: string[];
}

// Priority keywords with confidence levels
const priorityPatterns = {
  urgent: {
    high: ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'now', 'crisis'],
    medium: ['very important', 'must do', 'crucial', 'essential', 'vital'],
    low: ['rush', 'hurry', 'quick']
  },
  high: {
    high: ['important', 'priority', 'significant'],
    medium: ['soon', 'needed', 'required', 'should'],
    low: ['focus', 'attention']
  },
  low: {
    high: ['maybe', 'someday', 'eventually', 'whenever', 'optional'],
    medium: ['consider', 'think about', 'might'],
    low: ['nice to have', 'if possible']
  }
};

// Type detection patterns
const typePatterns = {
  event: {
    high: ['meeting', 'appointment', 'conference', 'call', 'interview', 'party', 'celebration', 'dinner', 'lunch', 'breakfast'],
    medium: ['event', 'gathering', 'session', 'class', 'webinar', 'presentation'],
    low: ['with', 'at', 'schedule', 'book']
  },
  reminder: {
    high: ['remind', 'reminder', 'remember', 'don\'t forget', 'note to self'],
    medium: ['check', 'review', 'follow up', 'follow-up'],
    low: ['need to', 'should', 'must']
  }
};

// Privacy detection patterns
const privacyPatterns = {
  public: {
    high: ['public', 'shared', 'everyone', 'team', 'group', 'company', 'office'],
    medium: ['share with', 'collaborative', 'together'],
    low: ['announce', 'broadcast']
  },
  private: {
    high: ['private', 'personal', 'confidential', 'secret', 'just me'],
    medium: ['own', 'my', 'solo'],
    low: []
  }
};

// Smart time context patterns
const timeContextPatterns = {
  businessDay: /next\s+business\s+day|next\s+working\s+day|next\s+weekday/i,
  afternoon: /afternoon|after\s+lunch|post\s+lunch/i,
  morning: /morning|before\s+lunch/i,
  evening: /evening|tonight|after\s+work/i,
  endOfDay: /end\s+of\s+day|eod|before\s+close/i,
  startOfDay: /start\s+of\s+day|first\s+thing|beginning\s+of\s+day/i,
  endOfWeek: /end\s+of\s+week|eow|friday/i,
  nextWeekSameTime: /next\s+week\s+same\s+time|next\s+week\s+this\s+time/i,
  yesterday: /yesterday/i,
};

/**
 * Apply smart time context adjustments
 */
function applyTimeContext(baseDate: Date, input: string): Date {
  const result = new Date(baseDate);
  const lowerInput = input.toLowerCase();
  
  // Business day logic
  if (timeContextPatterns.businessDay.test(lowerInput)) {
    // Move to next weekday
    let daysToAdd = 1;
    result.setDate(result.getDate() + daysToAdd);
    while (result.getDay() === 0 || result.getDay() === 6) {
      result.setDate(result.getDate() + 1);
    }
  }
  
  // Time of day adjustments
  if (timeContextPatterns.afternoon.test(lowerInput)) {
    result.setHours(14, 0, 0, 0); // 2 PM
  } else if (timeContextPatterns.morning.test(lowerInput)) {
    result.setHours(9, 0, 0, 0); // 9 AM
  } else if (timeContextPatterns.evening.test(lowerInput)) {
    result.setHours(18, 0, 0, 0); // 6 PM
  } else if (timeContextPatterns.endOfDay.test(lowerInput)) {
    result.setHours(17, 0, 0, 0); // 5 PM
  } else if (timeContextPatterns.startOfDay.test(lowerInput)) {
    result.setHours(8, 0, 0, 0); // 8 AM
  }
  
  // End of week
  if (timeContextPatterns.endOfWeek.test(lowerInput)) {
    const currentDay = result.getDay();
    const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
    result.setDate(result.getDate() + daysUntilFriday);
    result.setHours(17, 0, 0, 0); // 5 PM Friday
  }
  
  // Next week same time
  if (timeContextPatterns.nextWeekSameTime.test(lowerInput)) {
    result.setDate(result.getDate() + 7);
  }
  
  // Yesterday
  if (timeContextPatterns.yesterday.test(lowerInput)) {
    result.setDate(result.getDate() - 1);
  }
  
  return result;
}

/**
 * Parse date/time with chrono-node and apply smart context
 */
function parseDateTime(input: string): { dates: Date[], text: string } | null {
  // Use chrono to parse natural language dates
  const parsed = chrono.parse(input, new Date(), { forwardDate: true });
  
  if (parsed.length === 0) return null;
  
  const dates: Date[] = [];
  const firstMatch = parsed[0];
  
  // Get start date
  if (firstMatch.start) {
    let startDate = firstMatch.start.date();
    
    // Apply smart context adjustments
    startDate = applyTimeContext(startDate, input);
    dates.push(startDate);
    
    // Get end date if available
    if (firstMatch.end) {
      let endDate = firstMatch.end.date();
      endDate = applyTimeContext(endDate, input);
      dates.push(endDate);
    }
  }
  
  return {
    dates,
    text: firstMatch.text
  };
}

/**
 * Detect type with confidence
 */
function detectType(input: string): SmartParsedData['detections']['type'] | undefined {
  const lowerInput = input.toLowerCase();
  
  // Check for explicit type markers first
  if (/\/event\b/i.test(input)) {
    return { value: 'event', confidence: 'high', keywords: ['/event'] };
  }
  if (/\/reminder\b/i.test(input)) {
    return { value: 'reminder', confidence: 'high', keywords: ['/reminder'] };
  }
  
  // IMPORTANT: Check for reminder patterns FIRST (higher priority than events)
  // This ensures "remind" beats "meeting" or other event words
  for (const [confidence, keywords] of Object.entries(typePatterns.reminder)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return {
          value: 'reminder',
          confidence: 'high', // Always high confidence for reminder keywords
          keywords: [keyword]
        };
      }
    }
  }
  
  // Only check for event patterns if no reminder detected
  for (const [confidence, keywords] of Object.entries(typePatterns.event)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return {
          value: 'event',
          confidence: confidence as 'high' | 'medium' | 'low',
          keywords: [keyword]
        };
      }
    }
  }
  
  return undefined;
}

/**
 * Detect priority with confidence
 */
function detectPriority(input: string): SmartParsedData['detections']['priority'] | undefined {
  const lowerInput = input.toLowerCase();
  
  // Check for explicit priority markers first
  if (/!urgent\b/i.test(input)) {
    return { value: 'urgent', confidence: 'high', keywords: ['!urgent'] };
  }
  if (/!high\b/i.test(input)) {
    return { value: 'high', confidence: 'high', keywords: ['!high'] };
  }
  if (/!low\b/i.test(input)) {
    return { value: 'low', confidence: 'high', keywords: ['!low'] };
  }
  if (/!normal\b/i.test(input)) {
    return { value: 'normal', confidence: 'high', keywords: ['!normal'] };
  }
  
  // Check for negation patterns like "not urgent", "not important"
  // These should flip the priority to low/normal
  if (/\b(not|no|non)\s+(urgent|emergency|critical|asap|important|priority)/i.test(lowerInput)) {
    return {
      value: 'low',
      confidence: 'high',
      keywords: ['not urgent/important']
    };
  }
  
  // Check for urgent patterns (highest priority)
  for (const [confidence, keywords] of Object.entries(priorityPatterns.urgent)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return {
          value: 'urgent',
          confidence: confidence as 'high' | 'medium' | 'low',
          keywords: [keyword]
        };
      }
    }
  }
  
  // Check for high priority patterns
  for (const [confidence, keywords] of Object.entries(priorityPatterns.high)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return {
          value: 'high',
          confidence: confidence as 'high' | 'medium' | 'low',
          keywords: [keyword]
        };
      }
    }
  }
  
  // Check for low priority patterns
  for (const [confidence, keywords] of Object.entries(priorityPatterns.low)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return {
          value: 'low',
          confidence: confidence as 'high' | 'medium' | 'low',
          keywords: [keyword]
        };
      }
    }
  }
  
  return undefined;
}

/**
 * Detect privacy (public/private) with confidence
 */
function detectPrivacy(input: string): SmartParsedData['detections']['isPublic'] | undefined {
  const lowerInput = input.toLowerCase();
  
  // Check for public patterns
  for (const [confidence, keywords] of Object.entries(privacyPatterns.public)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return {
          value: true,
          confidence: confidence as 'high' | 'medium' | 'low',
          keywords: [keyword]
        };
      }
    }
  }
  
  // Check for private patterns
  for (const [confidence, keywords] of Object.entries(privacyPatterns.private)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return {
          value: false,
          confidence: confidence as 'high' | 'medium' | 'low',
          keywords: [keyword]
        };
      }
    }
  }
  
  return undefined;
}

/**
 * Detect categories based on keywords
 */
function detectCategories(
  input: string,
  availableCategories: CategoryDefinition[]
): SmartParsedData['detections']['categories'] | undefined {
  const lowerInput = input.toLowerCase();
  const doc = nlp(input);
  const nouns = doc.nouns().out('array');
  const matches: SmartParsedData['detections']['categories'] = [];
  
  // Check for explicit hashtags first
  const hashtagMatches = input.matchAll(/#(\w+)/g);
  for (const match of hashtagMatches) {
    const tag = match[1].toLowerCase();
    const category = availableCategories.find(c => 
      c.name.toLowerCase() === tag || c.keywords.some(k => k.toLowerCase() === tag)
    );
    if (category) {
      matches.push({
        value: category.id,
        confidence: 'high',
        matchedKeywords: [`#${tag}`]
      });
    }
  }
  
  // Check for keyword matches in input
  for (const category of availableCategories) {
    // Skip if already matched via hashtag
    if (matches.find(m => m.value === category.id)) continue;
    
    const matchedKeywords: string[] = [];
    let bestConfidence: 'high' | 'medium' | 'low' = 'low';
    
    // Check category name with word boundary (exact match)
    const categoryNamePattern = new RegExp(`\\b${category.name.toLowerCase()}\\b`, 'i');
    if (categoryNamePattern.test(lowerInput)) {
      matchedKeywords.push(category.name);
      bestConfidence = 'high';
    }
    
    // Check keywords with word boundaries
    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Use word boundary regex for better matching
      const keywordPattern = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      // Exact match with word boundaries
      if (keywordPattern.test(lowerInput)) {
        matchedKeywords.push(keyword);
        bestConfidence = 'high'; // Word boundary match = high confidence
      }
      
      // Check if keyword appears in extracted nouns
      if (nouns.some(noun => noun.toLowerCase().includes(keywordLower))) {
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
          bestConfidence = bestConfidence === 'low' ? 'medium' : bestConfidence;
        }
      }
    }
    
    if (matchedKeywords.length > 0) {
      matches.push({
        value: category.id,
        confidence: bestConfidence,
        matchedKeywords
      });
    }
  }
  
  return matches.length > 0 ? matches : undefined;
}

/**
 * Clean text by removing detected markers
 */
function cleanText(
  input: string,
  detectedKeywords: string[],
  dateText?: string
): string {
  let cleaned = input;
  
  // Remove explicit markers
  cleaned = cleaned.replace(/\/(reminder|event)\b/gi, '');
  cleaned = cleaned.replace(/!(urgent|high|normal|low)\b/gi, '');
  cleaned = cleaned.replace(/#\w+/g, '');
  
  // Remove detected keywords (but be careful not to remove title words)
  // Only remove if they appear at the start or end, or are surrounded by spaces
  for (const keyword of detectedKeywords) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\b${escapedKeyword}\\b`, 'gi'), '');
  }
  
  // Remove date text
  if (dateText) {
    cleaned = cleaned.replace(dateText, '');
  }
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Main smart parsing function
 */
export function smartParse(
  input: string,
  availableCategories: Array<{ id: string; name: string; keywords?: string[] }> = []
): SmartParsedData {
  // Prepare category definitions with keywords
  const categoryDefs: CategoryDefinition[] = availableCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    keywords: cat.keywords || []
  }));
  
  const detections: SmartParsedData['detections'] = {};
  const detectedKeywords: string[] = [];
  
  // Detect type
  const typeDetection = detectType(input);
  if (typeDetection) {
    detections.type = typeDetection;
    detectedKeywords.push(...typeDetection.keywords);
  }
  
  // Detect priority
  const priorityDetection = detectPriority(input);
  if (priorityDetection) {
    detections.priority = priorityDetection;
    detectedKeywords.push(...priorityDetection.keywords);
  }
  
  // Detect privacy
  const privacyDetection = detectPrivacy(input);
  if (privacyDetection) {
    detections.isPublic = privacyDetection;
    detectedKeywords.push(...privacyDetection.keywords);
  }
  
  // Detect categories
  const categoryDetections = detectCategories(input, categoryDefs);
  if (categoryDetections) {
    detections.categories = categoryDetections;
    categoryDetections.forEach(cat => {
      detectedKeywords.push(...cat.matchedKeywords);
    });
  }
  
  // Parse date/time
  const dateTimeParse = parseDateTime(input);
  if (dateTimeParse) {
    const [startDate, endDate] = dateTimeParse.dates;
    
    if (startDate) {
      // Determine confidence based on how specific the date is
      const hasTime = dateTimeParse.text.match(/\d{1,2}:\d{2}|am|pm|\d{1,2}\s*(am|pm)/i);
      const confidence = hasTime ? 'high' : 'medium';
      
      if (endDate) {
        detections.startTime = {
          value: startDate,
          confidence,
          text: dateTimeParse.text
        };
        detections.endTime = {
          value: endDate,
          confidence,
          text: dateTimeParse.text
        };
      } else {
        detections.time = {
          value: startDate,
          confidence,
          text: dateTimeParse.text
        };
      }
    }
  }
  
  // Clean text and extract title
  const cleanedText = cleanText(
    input,
    detectedKeywords,
    dateTimeParse?.text
  );
  const title = cleanedText || 'Untitled';
  
  return {
    title,
    cleanedText,
    detections
  };
}
