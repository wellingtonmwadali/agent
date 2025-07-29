// Comprehensive list of business types and locations for lead generation in Kenya

const businessTypes = [
  // Home Services
  'plumber', 'electrician', 'painter', 'carpenter', 'gardener', 'cleaning service',
  'pest control', 'security service', 'handyman', 'locksmith', 'roofing contractor',
  'solar installer', 'air conditioning repair', 'appliance repair', 'interior designer',
  'landscaper', 'fence installer', 'tile installer', 'window cleaner', 'pool maintenance',
  
  // Automotive
  'garage', 'auto repair', 'car wash', 'tire shop', 'car dealership', 'motorcycle repair',
  'auto parts', 'car rental', 'driving school', 'auto electrician', 'body shop',
  'car insurance', 'car accessories', 'auto glass repair', 'car audio installation',
  
  // Medical & Health
  'clinic', 'pharmacy', 'dentist', 'eye clinic', 'physiotherapy', 'laboratory',
  'hospital', 'veterinary', 'optician', 'medical supplies', 'health center',
  'diagnostic center', 'dental clinic', 'maternity clinic', 'mental health center',
  
  // Food & Beverage
  'restaurant', 'cafe', 'bar', 'catering', 'bakery', 'butchery', 'grocery store',
  'supermarket', 'fast food', 'hotel', 'lodge', 'pub', 'juice bar', 'ice cream shop',
  'pizza place', 'fish market', 'fruit vendor', 'water supplier', 'cooking gas supplier',
  
  // Professional Services
  'law firm', 'accounting firm', 'real estate agent', 'insurance broker', 'travel agent',
  'marketing agency', 'web design', 'consultant', 'architect', 'surveyor', 'engineer',
  'financial advisor', 'tax consultant', 'business consultant', 'investment advisor',
  
  // Construction & Manufacturing
  'construction company', 'contractor', 'building materials', 'hardware store',
  'cement supplier', 'steel supplier', 'quarry', 'concrete supplier', 'paint shop',
  'lumber yard', 'construction equipment', 'scaffolding rental', 'excavation service',
  
  // Retail & Shopping
  'boutique', 'salon', 'barbershop', 'electronics shop', 'phone repair', 'computer repair',
  'printing shop', 'stationery shop', 'bookstore', 'toy store', 'jewelry store',
  'shoe store', 'clothing store', 'furniture store', 'home decor', 'sports shop',
  
  // Education & Training
  'school', 'college', 'driving school', 'computer training', 'language school',
  'music school', 'dance studio', 'gym', 'fitness center', 'yoga studio',
  
  // Entertainment & Events
  'photography', 'videography', 'event planning', 'DJ service', 'band', 'sound system',
  'catering hall', 'wedding venue', 'entertainment center', 'game arcade',
  
  // Transportation & Logistics
  'taxi service', 'courier service', 'moving company', 'freight service', 'logistics',
  'truck rental', 'motorcycle taxi', 'bus service', 'delivery service',
  
  // Agriculture & Farming
  'farm', 'greenhouse', 'poultry farm', 'dairy farm', 'fish farm', 'veterinary service',
  'agricultural supplies', 'feed store', 'irrigation service', 'farm equipment',
  
  // Technology & Communication
  'internet provider', 'phone service', 'computer service', 'software company',
  'IT support', 'cybercafe', 'mobile money agent', 'tech repair',
];

const locations = [
  // Major Cities
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos', 'Meru',
  'Nyeri', 'Kitale', 'Garissa', 'Kakamega', 'Malindi', 'Kitui', 'Voi', 'Busia',
  'Mumias', 'Naivasha', 'Nanyuki', 'Isiolo', 'Kericho', 'Bomet', 'Homa Bay',
  'Migori', 'Siaya', 'Bondo', 'Kilifi', 'Kwale', 'Lamu', 'Tana River', 'Marsabit',
  
  // Nairobi Areas & Estates
  'Westlands', 'Karen', 'Kilimani', 'Lavington', 'Kileleshwa', 'Upperhill',
  'Parklands', 'South B', 'South C', 'Langata', 'Runda', 'Muthaiga', 'Spring Valley',
  'Loresho', 'Riverside', 'Gigiri', 'Rosslyn', 'Kasarani', 'Roysambu', 'Thome',
  'Kahawa', 'Ruaka', 'Kiambu Road', 'Ngong Road', 'Mombasa Road', 'Waiyaki Way',
  'Jogoo Road', 'Outering Road', 'Eastern Bypass', 'Thika Road', 'Limuru Road',
  'Kitengela', 'Ongata Rongai', 'Ngong', 'Banana Hill', 'Ruiru', 'Juja', 'Githurai',
  'Zimmerman', 'Pipeline', 'Embakasi', 'Donholm', 'Umoja', 'Kariobangi', 'Kayole',
  'Dandora', 'Mathare', 'Eastleigh', 'Pangani', 'Shauri Moyo', 'Makadara',
  
  // Mombasa Areas
  'Nyali', 'Bamburi', 'Shanzu', 'Diani', 'Ukunda', 'Likoni', 'Tudor', 'Changamwe',
  'Port Reitz', 'Kizingo', 'Old Town', 'Mvita', 'Majengo', 'Kongowea',
  
  // Other Regional Centers
  'Kisii', 'Kapsabet', 'Kapenguria', 'Lodwar', 'Moyale', 'Mandera', 'Wajir',
  'Embu', 'Chuka', 'Mwingi', 'Makindu', 'Kajiado', 'Namanga', 'Taveta',
];

// Generate all keyword+location combinations
const generateSearchTerms = () => {
  const searchTerms = [];
  
  businessTypes.forEach(business => {
    locations.forEach(location => {
      searchTerms.push(`${business} in ${location}`);
    });
  });
  
  return searchTerms;
};

// Additional specific search terms
const specificSearchTerms = [
  // High-value service combinations
  'web design company in Nairobi',
  'digital marketing agency in Mombasa',
  'construction company in Kisumu',
  'real estate agent in Karen',
  'law firm in Westlands',
  'accounting firm in Upperhill',
  'medical clinic in Thika',
  'dental clinic in Nakuru',
  'restaurant in Kilimani',
  'hotel in Malindi',
  'salon in Lavington',
  'gym in Kileleshwa',
  'pharmacy in Eastleigh',
  'supermarket in Kasarani',
  'electronics shop in CBD',
  'car dealership in Industrial Area',
  'insurance broker in Riverside',
  'travel agent in Parklands',
  'event planning in Runda',
  'catering service in South B',
];

module.exports = {
  businessTypes,
  locations,
  generateSearchTerms,
  specificSearchTerms,
  getAllSearchTerms: () => {
    return [...generateSearchTerms(), ...specificSearchTerms];
  }
};
