import { Category } from '@/api/entities';
import { getDefaultCategories } from './defaultCategories';
import { getCurrentLanguage } from './i18n';

// Initialize new user with default categories
export const initializeUserData = async () => {
  try {
    const currentLanguage = getCurrentLanguage();
    
    // Check if user already has categories
    const existingCategories = await Category.list();
    if (existingCategories && existingCategories.length > 0) {
      console.log('User already has categories, skipping initialization');
      return { success: true, message: 'User already initialized' };
    }

    // Create default categories
    const defaultCategories = getDefaultCategories(currentLanguage);
    const createdCategories = [];

    for (const categoryData of defaultCategories) {
      try {
        const category = await Category.create(categoryData);
        createdCategories.push(category);
      } catch (error) {
        console.error('Error creating category:', categoryData.name, error);
      }
    }

    console.log(`Successfully created ${createdCategories.length} default categories`);
    
    return {
      success: true,
      message: `Created ${createdCategories.length} default categories`,
      categoriesCreated: createdCategories.length
    };

  } catch (error) {
    console.error('Error initializing user data:', error);
    return {
      success: false,
      message: 'Failed to initialize user data',
      error: error.message
    };
  }
};

// Check if user needs initialization
export const checkUserInitialization = async () => {
  try {
    const categories = await Category.list();
    return {
      needsInitialization: !categories || categories.length === 0,
      categoryCount: categories ? categories.length : 0
    };
  } catch (error) {
    console.error('Error checking user initialization:', error);
    return {
      needsInitialization: true,
      categoryCount: 0,
      error: error.message
    };
  }
};

export default {
  initializeUserData,
  checkUserInitialization
};