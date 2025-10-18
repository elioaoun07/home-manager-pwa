// Category keywords configuration for smart parsing
// Add keywords that should automatically map to categories

export interface CategoryKeywords {
  [categoryName: string]: string[];
}

// Default category keywords - these will be used if categories don't have custom keywords
export const defaultCategoryKeywords: CategoryKeywords = {
  // Work-related
  'Work': ['work', 'office', 'job', 'professional', 'business', 'meeting', 'project', 'task', 'deadline', 'client', 'team', 'colleague'],
  'Meeting': ['meeting', 'call', 'conference', 'discussion', 'sync', 'standup', 'one-on-one', '1:1'],
  'Project': ['project', 'milestone', 'deliverable', 'sprint', 'release', 'launch'],
  
  // Personal
  'Personal': ['personal', 'private', 'own', 'self', 'my'],
  'Family': ['family', 'mom', 'dad', 'parent', 'child', 'kids', 'spouse', 'wife', 'husband', 'brother', 'sister', 'relative', 'grandparent'],
  'Friends': ['friends', 'friend', 'buddy', 'pal', 'mate', 'bestie'],
  'Home': ['home', 'house', 'apartment', 'cleaning', 'chores', 'maintenance', 'repair', 'grocery', 'groceries'],
  
  // Health & Fitness
  'Health': ['health', 'doctor', 'appointment', 'medical', 'checkup', 'hospital', 'clinic', 'medicine', 'pharmacy'],
  'Fitness': ['fitness', 'gym', 'workout', 'exercise', 'run', 'running', 'yoga', 'training', 'sport'],
  
  // Finance
  'Finance': ['finance', 'money', 'bill', 'bills', 'payment', 'bank', 'budget', 'expense', 'invoice', 'pay', 'taxes'],
  'Shopping': ['shopping', 'buy', 'purchase', 'store', 'amazon', 'order', 'shop'],
  
  // Learning & Development
  'Learning': ['learning', 'study', 'course', 'class', 'lesson', 'tutorial', 'education', 'training', 'skill'],
  'Reading': ['read', 'reading', 'book', 'article', 'documentation', 'paper', 'review'],
  
  // Social
  'Social': ['social', 'friend', 'friends', 'party', 'event', 'celebration', 'birthday', 'hangout', 'dinner', 'lunch', 'coffee'],
  
  // Travel
  'Travel': ['travel', 'trip', 'flight', 'hotel', 'vacation', 'holiday', 'destination', 'booking', 'airport'],
  
  // Hobbies
  'Hobbies': ['hobby', 'hobbies', 'passion', 'interest', 'fun', 'creative', 'art', 'music', 'gaming', 'photography'],
  
  // Tasks & Errands
  'Errands': ['errand', 'errands', 'pickup', 'drop', 'deliver', 'delivery', 'post', 'mail'],
  'Chores': ['chore', 'chores', 'clean', 'cleaning', 'wash', 'laundry', 'dishes', 'vacuum', 'organize'],
  
  // Other
  'Important': ['important', 'urgent', 'critical', 'priority', 'must', 'asap'],
  'Ideas': ['idea', 'ideas', 'thought', 'brainstorm', 'concept', 'note'],
};

/**
 * Enhance categories with default keywords if they don't have custom ones
 */
export function enhanceCategoriesWithKeywords(
  categories: Array<{ id: string; name: string; keywords?: string[] }>
): Array<{ id: string; name: string; keywords: string[] }> {
  return categories.map(category => {
    // If category already has keywords, use them
    if (category.keywords && category.keywords.length > 0) {
      return {
        ...category,
        keywords: category.keywords
      };
    }
    
    // Otherwise, try to find matching default keywords
    const defaultKeywords = defaultCategoryKeywords[category.name] || [];
    
    // Also add the category name itself and its lowercase version
    const baseKeywords = [
      category.name,
      category.name.toLowerCase(),
      ...category.name.toLowerCase().split(' ')
    ];
    
    return {
      ...category,
      keywords: [...new Set([...baseKeywords, ...defaultKeywords])]
    };
  });
}
