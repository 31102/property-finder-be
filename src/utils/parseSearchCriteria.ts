export function parseSearchCriteria(query: string) {
  const filters: any = {};
  const lowerQuery = query.toLowerCase();

  // Property type detection
  if (lowerQuery.includes('villa')) filters.propertyType = 'villa';
  else if (lowerQuery.includes('apartment')) filters.propertyType = 'apartment';
  else if (lowerQuery.includes('house')) filters.propertyType = 'house';
  else if (lowerQuery.includes('condo')) filters.propertyType = 'condo';

  // Bedroom detection
  const bedroomMatch = lowerQuery.match(/(\d+)\s*bedroom/);
  if (bedroomMatch) filters.bedrooms = parseInt(bedroomMatch[1]);

  // Bathroom detection
  const bathroomMatch = lowerQuery.match(/(\d+)\s*bathroom/);
  if (bathroomMatch) filters.bathrooms = parseInt(bathroomMatch[1]);

  // Location detection
  const locationKeywords = ['near', 'in', 'at', 'close to'];
  locationKeywords.forEach(keyword => {
    const regex = new RegExp(`${keyword}\\s+([^\\s,]+(?:\\s+[^\\s,]+)*)`, 'i');
    const match = query.match(regex);
    if (match && match[1]) {
      filters.location = match[1].trim();
    }
  });

  // Price detection
  const priceMatch = lowerQuery.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|million|m)?/);
  if (priceMatch) {
    let price = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (lowerQuery.includes('k') || lowerQuery.includes('thousand')) price *= 1000;
    if (lowerQuery.includes('m') || lowerQuery.includes('million')) price *= 1000000;

    if (lowerQuery.includes('under') || lowerQuery.includes('below')) {
      filters.maxPrice = price;
    } else if (lowerQuery.includes('over') || lowerQuery.includes('above')) {
      filters.minPrice = price;
    }
  }

  // Features detection
  const features: string[] = [];
  if (lowerQuery.includes('pool')) features.push('pool');
  if (lowerQuery.includes('garden')) features.push('garden');
  if (lowerQuery.includes('parking')) features.push('parking');
  if (lowerQuery.includes('balcony')) features.push('balcony');
  if (lowerQuery.includes('sea') || lowerQuery.includes('ocean')) features.push('sea view');

  if (features.length > 0) filters.features = features;

  return filters;
}
