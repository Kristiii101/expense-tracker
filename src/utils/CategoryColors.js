import { CATEGORY_COLORS } from '../config/constants';

const generateColorFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.floor(Math.abs(Math.sin(hash) * 16777215));
    return '#' + color.toString(16).padStart(6, '0');
  };
  
  export const getCategoryColor = (category) => {
    // First check if it exists in your CATEGORY_COLORS constant
    if (CATEGORY_COLORS[category]) {
      return CATEGORY_COLORS[category];
    }
    // If not, generate a consistent color based on the category name
    return generateColorFromString(category);
  };
  