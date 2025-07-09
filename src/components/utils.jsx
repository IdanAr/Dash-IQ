/**
 * Combines Tailwind CSS classes safely with proper precedence
 */
export function cn(...inputs) {
  // Simple implementation without dependencies
  return inputs.filter(Boolean).join(" ");
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text, maxLength = 20) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Handles responsive chart sizing
 */
export function getResponsiveChartDimensions(containerWidth) {
  // Base dimensions
  const dimensions = {
    margin: { top: 30, right: 30, left: 30, bottom: 30 },
    fontSize: 11,
    barSize: 20,
  };
  
  // Adjust based on container width
  if (containerWidth < 400) {
    dimensions.margin = { top: 20, right: 15, left: 15, bottom: 40 };
    dimensions.fontSize = 9;
    dimensions.barSize = 12;
  } else if (containerWidth < 600) {
    dimensions.margin = { top: 25, right: 20, left: 20, bottom: 40 };
    dimensions.fontSize = 10;
    dimensions.barSize = 16;
  }
  
  return dimensions;
}