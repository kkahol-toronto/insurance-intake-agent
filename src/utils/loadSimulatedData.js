// Load simulated data from JSON file
// In production, this would fetch from an API

// Note: Vite doesn't support JSON imports directly, so we'll use fetch
// or define the data inline for now
const simulatedData = {
  "claims": [],
  "statistics": {
    "daily": {
      "2024-11-26": { "processed": 95, "accepted": 72, "pending": 18, "denied": 5 },
      "2024-11-27": { "processed": 98, "accepted": 74, "pending": 19, "denied": 5 },
      "2024-11-28": { "processed": 102, "accepted": 77, "pending": 20, "denied": 5 },
      "2024-11-29": { "processed": 105, "accepted": 79, "pending": 21, "denied": 5 },
      "2024-11-30": { "processed": 108, "accepted": 82, "pending": 21, "denied": 5 }
    },
    "weekly": {
      "2024-11-04": { "processed": 420, "accepted": 320, "pending": 80, "denied": 20 },
      "2024-11-11": { "processed": 445, "accepted": 340, "pending": 85, "denied": 20 },
      "2024-11-18": { "processed": 470, "accepted": 360, "pending": 90, "denied": 20 },
      "2024-11-25": { "processed": 495, "accepted": 380, "pending": 95, "denied": 20 },
      "2024-12-02": { "processed": 520, "accepted": 400, "pending": 100, "denied": 20 }
    },
    "monthly": {
      "2024-07": { "processed": 1800, "accepted": 1380, "pending": 350, "denied": 70 },
      "2024-08": { "processed": 1850, "accepted": 1420, "pending": 360, "denied": 70 },
      "2024-09": { "processed": 1900, "accepted": 1460, "pending": 370, "denied": 70 },
      "2024-10": { "processed": 1950, "accepted": 1500, "pending": 380, "denied": 70 },
      "2024-11": { "processed": 2000, "accepted": 1540, "pending": 390, "denied": 70 }
    },
    "quarterly": {
      "2023-Q2": { "processed": 5200, "accepted": 4000, "pending": 1000, "denied": 200 },
      "2023-Q3": { "processed": 5400, "accepted": 4160, "pending": 1040, "denied": 200 },
      "2023-Q4": { "processed": 5600, "accepted": 4320, "pending": 1080, "denied": 200 },
      "2024-Q1": { "processed": 5800, "accepted": 4480, "pending": 1120, "denied": 200 },
      "2024-Q2": { "processed": 6000, "accepted": 4640, "pending": 1160, "denied": 200 }
    }
  },
  "cityData": {
    "Toronto": { "total": 450, "accepted": 340, "pending": 85, "denied": 25, "lat": 43.6532, "lng": -79.3832 },
    "Montreal": { "total": 320, "accepted": 240, "pending": 60, "denied": 20, "lat": 45.5017, "lng": -73.5673 },
    "Vancouver": { "total": 280, "accepted": 210, "pending": 55, "denied": 15, "lat": 49.2827, "lng": -123.1207 },
    "Calgary": { "total": 180, "accepted": 135, "pending": 35, "denied": 10, "lat": 51.0447, "lng": -114.0719 },
    "Ottawa": { "total": 150, "accepted": 110, "pending": 30, "denied": 10, "lat": 45.4215, "lng": -75.6972 },
    "Edmonton": { "total": 140, "accepted": 105, "pending": 28, "denied": 7, "lat": 53.5461, "lng": -113.4938 },
    "Winnipeg": { "total": 120, "accepted": 90, "pending": 25, "denied": 5, "lat": 49.8951, "lng": -97.1384 },
    "Quebec City": { "total": 100, "accepted": 75, "pending": 20, "denied": 5, "lat": 46.8139, "lng": -71.2080 },
    "Hamilton": { "total": 90, "accepted": 68, "pending": 18, "denied": 4, "lat": 43.2557, "lng": -79.8711 },
    "Kitchener": { "total": 85, "accepted": 64, "pending": 17, "denied": 4, "lat": 43.4516, "lng": -80.4925 },
    "Victoria": { "total": 75, "accepted": 56, "pending": 15, "denied": 4, "lat": 48.4284, "lng": -123.3656 },
    "Saskatoon": { "total": 65, "accepted": 48, "pending": 13, "denied": 4, "lat": 52.1332, "lng": -106.6700 },
    "Regina": { "total": 55, "accepted": 41, "pending": 11, "denied": 3, "lat": 50.4452, "lng": -104.6189 },
    "Halifax": { "total": 45, "accepted": 34, "pending": 9, "denied": 2, "lat": 44.6488, "lng": -63.5752 },
    "Fredericton": { "total": 35, "accepted": 26, "pending": 7, "denied": 2, "lat": 45.9636, "lng": -66.6431 },
    "Charlottetown": { "total": 30, "accepted": 22, "pending": 6, "denied": 2, "lat": 46.2382, "lng": -63.1311 },
    "St. John's": { "total": 40, "accepted": 30, "pending": 8, "denied": 2, "lat": 47.5615, "lng": -52.7126 }
  }
}

const ensureAgentMetrics = (bucket) => {
  if (!bucket) return
  Object.keys(bucket).forEach((key) => {
    const entry = bucket[key]
    if (!entry || typeof entry !== 'object') return
    const processed = entry.processed || 0
    if (typeof entry.pega !== 'number') {
      entry.pega = Math.round(processed * 0.6)
    }
    if (typeof entry.chess !== 'number') {
      const pega = entry.pega || Math.round(processed * 0.6)
      entry.chess = Math.max(processed - pega, 0)
    }
  })
}

const stats = simulatedData.statistics
ensureAgentMetrics(stats.daily)
ensureAgentMetrics(stats.weekly)
ensureAgentMetrics(stats.monthly)
ensureAgentMetrics(stats.quarterly)

export const loadSimulatedData = () => {
  return simulatedData
}

export const getTimeSeriesData = () => {
  return simulatedData.statistics || {}
}

export const getSimulatedCityData = () => {
  const cityDataObj = simulatedData.cityData || {}
  
  // Ensure all major cities have data, even if it's 0
  const allCities = [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton',
    'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'Victoria',
    'Saskatoon', 'Regina', 'Halifax', 'Fredericton', 'Charlottetown', "St. John's"
  ]
  
  return allCities.map(cityName => {
    const data = cityDataObj[cityName] || {}
    return {
      city: cityName,
      total: data.total || 0,
      accepted: data.accepted || 0,
      pending: data.pending || 0,
      denied: data.denied || 0,
      lat: data.lat || 0,
      lng: data.lng || 0
    }
  })
}
