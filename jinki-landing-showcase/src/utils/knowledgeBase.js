/**
 * ═══════════════════════════════════════════════════════════════
 * KNOWLEDGE BASE & FAQ SYSTEM
 * ═══════════════════════════════════════════════════════════════
 * Content integration with semantic similarity matching
 */

// ─────────────────────────────────────────────────────────────
// INDUSTRIES DATABASE
// ─────────────────────────────────────────────────────────────
export const INDUSTRIES_DB = {
  'data centers': {
    title: 'Data Centers',
    slug: 'data-centers',
    section: '#industries',
    description: 'Thermal monitoring for critical infrastructure',
    problem: '19% of outages stem from cooling failures. Average cost: $700K.',
    solution: 'Thermal monitoring with 0.05°C sensitivity detects hotspots 72 hours early.',
    stats: [
      { value: '$700K', label: 'Avg Outage Cost' },
      { value: '72hrs', label: 'Early Detection' }
    ],
    features: ['thermal imaging', '0.05°C sensitivity', 'real-time monitoring'],
    keywords: ['data center', 'cooling', 'thermal', 'outage', 'temperature'],
  },
  'electric utilities': {
    title: 'Electric Utilities',
    slug: 'utilities',
    section: '#industries',
    description: 'Comprehensive infrastructure inspection with LiDAR and aerial surveys',
    problem: 'Ground crews miss 48% of defects. Helicopters cost $2,000+/hour.',
    solution: 'LiDAR at 2.4M points/sec. 60% cost reduction vs helicopter.',
    stats: [
      { value: '60%', label: 'Cost Reduction' },
      { value: '4.5x', label: 'More Defects Detected' }
    ],
    features: ['LiDAR', '2.4M points/sec', 'RTK accuracy', 'aerial survey'],
    keywords: ['utilities', 'power lines', 'infrastructure', 'lidar', 'inspection'],
  },
  'precision agriculture': {
    title: 'Precision Agriculture',
    slug: 'agriculture',
    section: '#industries',
    description: 'Early crop stress detection through multispectral imaging',
    problem: 'Crop stress visible to eye only after 14+ days of damage.',
    solution: 'NDVI multispectral imaging detects stress 14 days earlier.',
    stats: [
      { value: '14 days', label: 'Earlier Detection' },
      { value: '150%', label: 'Proven ROI' }
    ],
    features: ['NDVI imaging', 'multispectral', 'crop analysis', 'early detection'],
    keywords: ['agriculture', 'crop', 'ndvi', 'multispectral', 'farming'],
  },
  'oil & gas': {
    title: 'Oil & Gas',
    slug: 'oil-gas',
    section: '#industries',
    description: 'Methane detection and environmental compliance monitoring',
    problem: 'EPA requires continuous methane monitoring. Manual inspection takes days.',
    solution: 'Optical Gas Imaging with 99.2% detection. 14km daily coverage.',
    stats: [
      { value: '99.2%', label: 'Detection Rate' },
      { value: '14km', label: 'Daily Coverage' }
    ],
    features: ['OGI', 'gas detection', '99.2% accuracy', 'EPA compliant'],
    keywords: ['oil', 'gas', 'methane', 'ogi', 'emissions'],
  },
}

// ─────────────────────────────────────────────────────────────
// FEATURES DATABASE
// ─────────────────────────────────────────────────────────────
export const FEATURES_DB = {
  'thermal imaging': {
    name: 'Thermal Imaging',
    section: '#platform',
    description: 'Military-grade thermal cameras with extreme sensitivity',
    specs: ['0.05°C thermal sensitivity', 'Real-time monitoring', '640x512 resolution'],
    benefits: 'Detects equipment failures 72 hours before catastrophic breakdown',
    applications: ['data centers', 'industrial equipment', 'electrical systems'],
  },
  'lidar': {
    name: 'LiDAR System',
    section: '#platform',
    description: '3D point cloud generation for precise infrastructure mapping',
    specs: ['2.4M points/second', '±1cm RTK accuracy', '20km transmission range'],
    benefits: 'Complete 3D map generation in single flight, superior to traditional surveys',
    applications: ['power lines', 'pipeline routes', 'structural assessment'],
  },
  'multispectral imaging': {
    name: 'Multispectral Imaging',
    section: '#platform',
    description: 'NDVI and advanced spectral analysis for vegetation and stress detection',
    specs: ['5-band multispectral', 'NDVI index calculation', 'Real-time processing'],
    benefits: 'Detect crop stress 14 days before visible damage occurs',
    applications: ['agriculture', 'environmental monitoring', 'vegetation mapping'],
  },
  'optical gas imaging': {
    name: 'Optical Gas Imaging (OGI)',
    section: '#platform',
    description: 'Non-contact gas leak detection technology',
    specs: ['99.2% detection rate', 'Real-time visualization', 'EPA 40 CFR 60.18 compliant'],
    benefits: 'Identify methane leaks from altitude, enabling 14km daily coverage',
    applications: ['oil & gas', 'landfill monitoring', 'environmental compliance'],
  },
}

// ─────────────────────────────────────────────────────────────
// PLATFORM SPECIFICATIONS
// ─────────────────────────────────────────────────────────────
export const PLATFORM_SPECS = {
  title: 'Enterprise-Grade Platform',
  tagline: 'Military-adjacent inspection technology',
  specs: [
    { name: 'Thermal Sensitivity', value: '0.05°C', icon: '🌡️' },
    { name: 'LiDAR Resolution', value: '2.4M pts/sec', icon: '📡' },
    { name: 'Weather Rating', value: 'IP55', icon: '⛈️' },
    { name: 'Flight Redundancy', value: 'Dual Systems', icon: '🔄' },
    { name: 'Transmission Range', value: '20km', icon: '📶' },
    { name: 'RTK Accuracy', value: '±1cm', icon: '🎯' },
    { name: 'Battery Endurance', value: '59 minutes', icon: '🔋' },
  ],
}

// ─────────────────────────────────────────────────────────────
// FAQ SYSTEM WITH SIMILARITY MATCHING
// ─────────────────────────────────────────────────────────────
export const FAQ_DB = {
  general: [
    {
      id: 'what-is-jinki',
      question: 'What is Jinki Intelligence?',
      keywords: ['what', 'jinki', 'company', 'about'],
      answer: 'Jinki Intelligence provides enterprise-grade autonomous aerial intelligence for critical infrastructure. We use advanced sensors—thermal, LiDAR, multispectral—to detect anomalies before catastrophic failure. From above, all things are revealed.',
    },
    {
      id: 'how-does-it-work',
      question: 'How does the Jinki platform work?',
      keywords: ['how', 'works', 'process', 'system'],
      answer: 'Our AI-powered drones autonomously patrol critical infrastructure, collecting multi-sensor data (thermal, LiDAR, visual). The platform processes this data in real-time, identifying anomalies and predicting failures 14-72 hours before they occur.',
    },
    {
      id: 'who-uses-jinki',
      question: 'Who are Jinki\'s customers?',
      keywords: ['who', 'customer', 'client', 'industry'],
      answer: 'We serve enterprise clients in critical infrastructure: data centers, electric utilities, precision agriculture, and oil & gas. Our technology is trusted by industry leaders who need predictive maintenance and regulatory compliance.',
    },
  ],
  technical: [
    {
      id: 'thermal-specs',
      question: 'What are the thermal imaging specifications?',
      keywords: ['thermal', 'specifications', 'sensitivity', 'camera'],
      answer: 'Our thermal cameras offer 0.05°C sensitivity—20x more precise than industry standard. This extreme sensitivity allows detection of equipment failures 72 hours before catastrophic breakdown, enabling preventive maintenance.',
    },
    {
      id: 'lidar-accuracy',
      question: 'How accurate is the LiDAR system?',
      keywords: ['lidar', 'accuracy', 'precise', 'mapping'],
      answer: 'Our LiDAR system delivers ±1cm RTK (Real-Time Kinematic) accuracy with 2.4M points per second acquisition. This creates complete 3D infrastructure maps in single flights, replacing multi-day traditional surveys.',
    },
    {
      id: 'battery-life',
      question: 'How long can the drone fly?',
      keywords: ['battery', 'endurance', 'flight', 'time'],
      answer: 'The Jinki platform offers 59 minutes of flight endurance with full sensor payload, enabling comprehensive infrastructure surveys in single missions. Redundant battery systems ensure mission success.',
    },
    {
      id: 'weather-capability',
      question: 'Can it fly in adverse weather?',
      keywords: ['weather', 'rain', 'wind', 'conditions'],
      answer: 'Our platform is IP55 rated for all-weather operation. Built with military-adjacent specifications, it maintains full capability in rain, wind, and challenging field conditions. Dual flight systems ensure redundancy.',
    },
  ],
  industries: [
    {
      id: 'data-center-benefits',
      question: 'How does thermal imaging help data centers?',
      keywords: ['data center', 'thermal', 'cooling', 'benefit'],
      answer: '19% of data center outages stem from cooling failures—averaging $700K each. Our 0.05°C thermal sensitivity detects hotspots 72 hours before catastrophic failure, enabling preventive maintenance and avoiding costly downtime.',
    },
    {
      id: 'utility-savings',
      question: 'How much can utilities save with Jinki?',
      keywords: ['utility', 'cost', 'save', 'reduction'],
      answer: 'Compared to helicopter inspections ($2,000+/hour), Jinki reduces inspection costs by 60% while detecting 4.5x more defects. LiDAR mapping that takes 3 weeks via traditional methods takes one day.',
    },
    {
      id: 'agriculture-roi',
      question: 'What\'s the ROI for agricultural monitoring?',
      keywords: ['agriculture', 'crop', 'roi', 'benefit'],
      answer: 'Our NDVI multispectral imaging detects crop stress 14 days earlier than visible damage—enabling intervention before significant crop loss. Customers report 150% proven ROI within first season.',
    },
    {
      id: 'oil-gas-compliance',
      question: 'How does Jinki help with EPA compliance?',
      keywords: ['oil', 'gas', 'epa', 'compliance'],
      answer: 'Optical Gas Imaging (OGI) delivers 99.2% detection accuracy for methane emissions. We cover 14km daily, enabling continuous EPA 40 CFR 60.18 compliance without manual crews.',
    },
  ],
  commercial: [
    {
      id: 'pricing-model',
      question: 'How is Jinki priced?',
      keywords: ['price', 'cost', 'model', 'payment'],
      answer: 'We offer flexible models: mission-based pricing for one-time assessments, quarterly retainers for continuous monitoring, or enterprise contracts. Each industry has different requirements—contact us for a custom quote.',
    },
    {
      id: 'implementation-timeline',
      question: 'How long does implementation take?',
      keywords: ['implementation', 'timeline', 'deployment', 'start'],
      answer: 'Initial assessment: 2-4 weeks. Full deployment: 6-12 weeks depending on infrastructure scale. We provide comprehensive training and work within your operational constraints.',
    },
    {
      id: 'support-services',
      question: 'What support is included?',
      keywords: ['support', 'service', 'help', 'included'],
      answer: '24/7 technical support, weekly insights reports, annual system audits, and dedicated account management. Our Principal Security Architect provides enterprise architecture guidance.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────
// SEMANTIC SIMILARITY MATCHING
// ─────────────────────────────────────────────────────────────
const levenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0))

  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      )
    }
  }

  return track[str2.length][str1.length]
}

const calculateSimilarity = (str1, str2) => {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLength = Math.max(str1.length, str2.length)
  return 1 - distance / maxLength
}

// ─────────────────────────────────────────────────────────────
// SEARCH & RETRIEVAL FUNCTIONS
// ─────────────────────────────────────────────────────────────
export const searchFAQ = (query, category = null) => {
  const queryTokens = query.toLowerCase().split(' ')
  const allFAQs = category
    ? FAQ_DB[category] || []
    : Object.values(FAQ_DB).flat()

  return allFAQs
    .map(faq => {
      // Keyword matching
      let keywordScore = faq.keywords.filter(kw =>
        queryTokens.some(token => kw.includes(token) || token.includes(kw))
      ).length / faq.keywords.length

      // Question similarity
      const questionSimilarity = calculateSimilarity(query, faq.question)

      // Combined score
      const score = (keywordScore * 0.4) + (questionSimilarity * 0.6)

      return { ...faq, score, matched: true }
    })
    .sort((a, b) => b.score - a.score)
    .filter(faq => faq.score > 0.3)
}

export const getIndustryInfo = (industryKeyword) => {
  const key = Object.keys(INDUSTRIES_DB).find(k =>
    k.includes(industryKeyword.toLowerCase()) ||
    industryKeyword.toLowerCase().includes(k)
  )
  return key ? INDUSTRIES_DB[key] : null
}

export const getFeatureInfo = (featureKeyword) => {
  const key = Object.keys(FEATURES_DB).find(k =>
    k.includes(featureKeyword.toLowerCase()) ||
    featureKeyword.toLowerCase().includes(k)
  )
  return key ? FEATURES_DB[key] : null
}

export const findRelatedContent = (query, limit = 3) => {
  const results = {
    faq: searchFAQ(query).slice(0, limit),
    industries: [],
    features: [],
  }

  // Search industries
  Object.entries(INDUSTRIES_DB).forEach(([key, industry]) => {
    const similarity = calculateSimilarity(
      query,
      `${industry.title} ${industry.description} ${industry.keywords.join(' ')}`
    )
    if (similarity > 0.4) {
      results.industries.push({ ...industry, similarity })
    }
  })

  // Search features
  Object.entries(FEATURES_DB).forEach(([key, feature]) => {
    const similarity = calculateSimilarity(
      query,
      `${feature.name} ${feature.description}`
    )
    if (similarity > 0.4) {
      results.features.push({ ...feature, similarity })
    }
  })

  return results
}

export default {
  INDUSTRIES_DB,
  FEATURES_DB,
  PLATFORM_SPECS,
  FAQ_DB,
  searchFAQ,
  getIndustryInfo,
  getFeatureInfo,
  findRelatedContent,
}
