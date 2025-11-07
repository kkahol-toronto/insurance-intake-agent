// Mock claims data generator based on the JSON structure
// In production, this would fetch from an API

// Sample data structures - in production, load from API or file system
const sample1Data = {
  section_1_to_be_completed_by_dentist: {
    insurance_unique_number: "SLF DEN 9997310",
    patient: {
      given_name: "AMELIA",
      last_name: "JOHNSON",
      address: {
        province: "ON"
      }
    },
    services: {
      total_fee_submitted: 310,
      currency: "CAD",
      line_items: [
        { date_of_service: "2020-10-28" },
        { date_of_service: "2020-10-26" },
        { date_of_service: "2020-10-28" }
      ]
    },
    signatures: {
      office_verification_or_claimant_signature_name: "Dr. Avis Williams"
    }
  },
  section_2_information_about_you: {
    member_id_number: "SLF-9997310"
  }
}

const sample2Data = {
  section_1_to_be_completed_by_dentist: {
    insurance_unique_number: "SLF-81612",
    patient: {
      given_name: "SARA",
      last_name: "SMITH",
      address: {
        province: "ON"
      }
    },
    services: {
      total_fee_submitted: 110,
      currency: "CAD",
      line_items: [
        { date_of_service: "2024-02-10" },
        { date_of_service: "2024-02-13" }
      ]
    },
    signatures: {
      office_verification_or_claimant_signature_name: "Dr. Anwar Dhurai"
    }
  },
  section_2_information_about_you: {
    member_id_number: "TS22000024"
  }
}

const sample3Data = {
  section_1_to_be_completed_by_dentist: {
    insurance_unique_number: "SLF-L263371",
    patient: {
      given_name: "DAVID",
      last_name: "ANDERSON",
      address: {
        province: "ON"
      }
    },
    services: {
      total_fee_submitted: 120,
      currency: "CAD",
      line_items: [
        { date_of_service: "2024-11-21" },
        { date_of_service: "2024-11-29" }
      ]
    },
    signatures: {
      office_verification_or_claimant_signature_name: "Dr. Anne"
    }
  },
  section_2_information_about_you: {
    member_id_number: "TS22000004"
  }
}

const externalScenario1Claim = {
  ClaimantInformation: {
    ClaimantName: 'Robin Noah',
    Relationship: '4',
    PolicyNumber: '129835',
    CertificateOrMemberID: '7354648',
    SpouseCoverage: 'No',
    COBClaim: 'Yes',
    AlreadyProcessedUnderAnotherPlan: 'Yes'
  },
  ClaimDetails: {
    Expense: {
      ProviderName: 'George Miller',
      FacilityId: 'F325373292',
      ServiceDate: '2025-10-25',
      TypeOfService: 'Autres frais',
      ClaimAmount: 550.0,
      COB: 'Y',
      COBAmount: 300.0,
      InitialVisit: 'N',
      ImageAttached: 'Y'
    }
  },
  ProviderInformation: {
    FirstName: 'George',
    LastName: 'Miller',
    LicenceNumber: '',
    PhoneNumber: '',
    FacilityName: '',
    Address: {
      Line1: '',
      Line2: '',
      City: '',
      Province: 'QC',
      PostalCode: ''
    },
    Specialty: '',
    GenericID: '8464539'
  },
  DepositInformation: {
    ClaimDeposit: 'Bank Account'
  },
  Invoice: {
    Clinic: 'OrthoAction Orthèse / Prothèse',
    Location: 'St-Mathieu de Beloeil',
    Address: '4362, Longueuil, suite 105, Quebec, J3G 0R2',
    ReceiptNumber: 'R-007-78357',
    Date: '2025-08-35',
    Orthotist: 'George Miller',
    TP: '8352 C.O.P',
    FileNumber: '53279',
    BilledTo: {
      Name: 'Robin Noah',
      Address: '654, Dr. Cuisson, St-Bruno, Quebec, J3Z 6G8'
    },
    Items: [
      {
        Code: 'OP31A',
        Description: 'Orthèses plantaires moulées aux pieds fabriquées à partir d\'un moule 3D en cire',
        Quantity: 1,
        Price: 550.0,
        Total: 550.0
      },
      {
        Code: 'AP100',
        Description: 'Portion non réclamée',
        Quantity: 1,
        Price: -300.0,
        Total: -300.0
      }
    ],
    TotalDue: 250.0
  },
  PrescriptionRequest: {
    Clinic: 'Clinique Familiale des Hauts-Bois',
    ClinicAddress: '2105 boul. Armand-Frappier, bur.301, Sainte-Julie, Quebec, J3E 3R7',
    Patient: {
      Name: 'Robin Noah',
      NAM: 'MLR64282008 (2067-75)',
      DOB: '2012-05-31',
      Sex: 'Femme',
      FileNumber: 'D62478-N',
      Phone: '+1 865 875 8642',
      Email: 'gaty98@hotmail.com',
      Address: '818 Simoni-Monet St, Beloeil, Quebec, J3G 0G3, Canada'
    },
    Reason: 'Orthèses plantaires sur mesure',
    Description: 'Ci-haut'
  }
}

// Generate additional mock claims based on the patterns
const generateMockClaim = (baseData, variations) => {
  const cities = ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener']
  const statuses = ['accepted', 'pending', 'denied']
  
  const city = variations.city || cities[Math.floor(Math.random() * cities.length)]
  const status = variations.status || statuses[Math.floor(Math.random() * statuses.length)]
  const date = variations.date || new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  return {
    id: `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    claimNumber: baseData.section_1_to_be_completed_by_dentist?.insurance_unique_number || `SLF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    patientName: `${baseData.section_1_to_be_completed_by_dentist?.patient?.given_name || ''} ${baseData.section_1_to_be_completed_by_dentist?.patient?.last_name || ''}`.trim(),
    memberId: baseData.section_2_information_about_you?.member_id_number || 'N/A',
    city: city,
    province: baseData.section_1_to_be_completed_by_dentist?.patient?.address?.province || 'ON',
    status: status,
    amount: baseData.section_1_to_be_completed_by_dentist?.services?.total_fee_submitted || 0,
    currency: baseData.section_1_to_be_completed_by_dentist?.services?.currency || 'CAD',
    submittedDate: date,
    processedDate: status === 'accepted' ? new Date(Date.parse(date) + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
    dentist: baseData.section_1_to_be_completed_by_dentist?.signatures?.office_verification_or_claimant_signature_name || 'N/A',
    procedureCount: baseData.section_1_to_be_completed_by_dentist?.services?.line_items?.length || 0,
    rawData: baseData
  }
}

// Generate claims from sample data
export const generateClaimsData = () => {
  const claims = []
  
  // Add claims from sample data (based on actual data from JSON files)
  claims.push(generateMockClaim(sample1Data, { city: 'Toronto', status: 'accepted', date: '2024-11-15' }))
  claims.push(generateMockClaim(sample2Data, { city: 'Toronto', status: 'pending', date: '2024-11-20' }))
  claims.push(generateMockClaim(sample3Data, { city: 'Kitchener', status: 'accepted', date: '2024-11-25' }))
  claims.push({
    id: 'CLM-ROBIN-NOAH-20251107',
    claimNumber: 'SLF-129835',
    patientName: 'ROBIN NOAH',
    memberId: '7354648',
    city: 'St-Bruno',
    province: 'QC',
    status: 'pending',
    amount: 550,
    currency: 'CAD',
    submittedDate: '2025-10-25',
    processedDate: null,
    dentist: 'George Miller',
    procedureCount: 1,
    rawData: externalScenario1Claim
  })
  
  // Generate additional mock claims for various scenarios
  const cities = ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener']
  const statuses = ['accepted', 'pending', 'denied']
  
  // List of real patient names for generating claims
  const patientNames = [
    'JAMES WILSON', 'MARY BROWN', 'ROBERT TAYLOR', 'PATRICIA DAVIS', 'MICHAEL MILLER',
    'JENNIFER MOORE', 'WILLIAM THOMPSON', 'LINDA MARTINEZ', 'RICHARD WHITE', 'BARBARA HARRIS',
    'JOSEPH LEWIS', 'ELIZABETH CLARK', 'THOMAS ROBINSON', 'SUSAN WALKER', 'CHARLES YOUNG',
    'JESSICA KING', 'CHRISTOPHER SCOTT', 'SARAH GREEN', 'DANIEL ADAMS', 'KAREN BAKER',
    'MATTHEW NELSON', 'NANCY HALL', 'ANTHONY ALLEN', 'BETTY WRIGHT', 'MARK LOPEZ',
    'MARGARET HILL', 'DONALD SCOTT', 'DOROTHY GREEN', 'STEVEN ADAMS', 'LISA BAKER',
    'PAUL NELSON', 'KAREN HALL', 'ANDREW ALLEN', 'HELEN WRIGHT', 'KENNETH LOPEZ',
    'SANDRA HILL', 'JOSHUA KING', 'DONNA YOUNG', 'KEVIN SCOTT', 'CAROL GREEN',
    'BRIAN ADAMS', 'RUTH BAKER', 'GEORGE NELSON', 'SHARON HALL', 'EDWARD ALLEN',
    'MICHELLE WRIGHT', 'RONALD LOPEZ', 'LAURA HILL', 'TIMOTHY KING', 'AMY YOUNG',
    'JASON SCOTT', 'ANGELA GREEN', 'RYAN ADAMS', 'MELISSA BAKER', 'ERIC NELSON',
    'STEPHANIE HALL', 'JACOB ALLEN', 'DEBORAH WRIGHT', 'GARY LOPEZ', 'RACHEL HILL'
  ]
  
  // Generate more claims for better visualization
  for (let i = 0; i < 50; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const mockClaim = {
      id: `CLM-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      claimNumber: `SLF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      patientName: patientNames[i % patientNames.length],
      memberId: `M${Math.floor(Math.random() * 1000000)}`,
      city: city,
      province: 'ON',
      status: status,
      amount: Math.floor(Math.random() * 5000) + 100,
      currency: 'CAD',
      submittedDate: date,
      processedDate: status === 'accepted' ? new Date(Date.parse(date) + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      dentist: `Dr. ${Math.random().toString(36).substr(2, 8)}`,
      procedureCount: Math.floor(Math.random() * 5) + 1,
      rawData: null
    }
    claims.push(mockClaim)
  }
  
  return claims
}

export const getClaimsStatistics = (claims, timeSeriesData = null) => {
  // Use time series data if available for more accurate current values
  if (timeSeriesData && timeSeriesData.daily) {
    const dailyEntries = Object.entries(timeSeriesData.daily).sort(([a], [b]) => new Date(a) - new Date(b))
    const latestDaily = dailyEntries[dailyEntries.length - 1]
    const previousDaily = dailyEntries[dailyEntries.length - 2]
    const weeklyEntries = timeSeriesData.weekly ? Object.entries(timeSeriesData.weekly).sort(([a], [b]) => new Date(a) - new Date(b)) : []
    const monthlyEntries = timeSeriesData.monthly ? Object.entries(timeSeriesData.monthly).sort(([a], [b]) => a.localeCompare(b)) : []
    const quarterlyEntries = timeSeriesData.quarterly ? Object.entries(timeSeriesData.quarterly).sort(([a], [b]) => a.localeCompare(b)) : []
    
    if (latestDaily) {
      const latest = latestDaily[1]
      const previous = previousDaily ? previousDaily[1] : null
      const latestWeekly = weeklyEntries.length ? weeklyEntries[weeklyEntries.length - 1][1] : null
      const latestMonthly = monthlyEntries.length ? monthlyEntries[monthlyEntries.length - 1][1] : null
      const latestQuarterly = quarterlyEntries.length ? quarterlyEntries[quarterlyEntries.length - 1][1] : null

      const getAgentCounts = (entry) => {
        if (!entry) return { pega: 0, chess: 0 }
        const processed = entry.processed || 0
        const pega = typeof entry.pega === 'number' ? entry.pega : Math.round(processed * 0.6)
        const chess = typeof entry.chess === 'number' ? entry.chess : Math.max(processed - pega, 0)
        return { pega, chess }
      }
      const dailyAgents = getAgentCounts(latest)
      const weeklyAgents = getAgentCounts(latestWeekly)
      const monthlyAgents = getAgentCounts(latestMonthly)
      const quarterlyAgents = getAgentCounts(latestQuarterly)
      
      // Use the latest time series data for today's values
      return {
        processedToday: latest.processed || 0,
        processedWeek: latestWeekly?.processed || 0,
        processedMonth: latestMonthly?.processed || 0,
        processedQuarter: latestQuarterly?.processed || 0,
        accepted: latest.accepted || 0,
        pending: latest.pending || 0,
        denied: latest.denied || 0,
        pegaAgent: dailyAgents.pega,
        chessAgent: dailyAgents.chess,
        pegaAgentWeek: weeklyAgents.pega,
        chessAgentWeek: weeklyAgents.chess,
        pegaAgentMonth: monthlyAgents.pega,
        chessAgentMonth: monthlyAgents.chess,
        pegaAgentQuarter: quarterlyAgents.pega,
        chessAgentQuarter: quarterlyAgents.chess,
        total: claims.length
      }
    }
  }
  
  // Fallback to calculating from claims data
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const processedToday = claims.filter(c => {
    const date = new Date(c.processedDate || c.submittedDate)
    return date >= today
  }).length
  
  const processedWeek = claims.filter(c => {
    const date = new Date(c.processedDate || c.submittedDate)
    return date >= weekAgo
  }).length
  
  const processedMonth = claims.filter(c => {
    const date = new Date(c.processedDate || c.submittedDate)
    return date >= monthAgo
  }).length
  const processedQuarter = processedMonth // simple fallback approximation
  
  const accepted = claims.filter(c => c.status === 'accepted').length
  const pending = claims.filter(c => c.status === 'pending').length
  const denied = claims.filter(c => c.status === 'denied').length

  const estimateAgents = (count) => {
    const pega = Math.round(count * 0.6)
    const chess = Math.max(count - pega, 0)
    return { pega, chess }
  }
  const dailyAgents = estimateAgents(processedToday)
  const weeklyAgents = estimateAgents(processedWeek)
  const monthlyAgents = estimateAgents(processedMonth)
  const quarterlyAgents = estimateAgents(processedQuarter)
  
  return {
    processedToday,
    processedWeek,
    processedMonth,
    processedQuarter,
    accepted,
    pending,
    denied,
    pegaAgent: dailyAgents.pega,
    chessAgent: dailyAgents.chess,
    pegaAgentWeek: weeklyAgents.pega,
    chessAgentWeek: weeklyAgents.chess,
    pegaAgentMonth: monthlyAgents.pega,
    chessAgentMonth: monthlyAgents.chess,
    pegaAgentQuarter: quarterlyAgents.pega,
    chessAgentQuarter: quarterlyAgents.chess,
    total: claims.length
  }
}

export const getCityWiseClaims = (claims) => {
  const cityMap = {}
  
  claims.forEach(claim => {
    const city = claim.city
    if (!cityMap[city]) {
      cityMap[city] = {
        city,
        total: 0,
        accepted: 0,
        pending: 0,
        denied: 0,
        amount: 0
      }
    }
    
    cityMap[city].total++
    cityMap[city][claim.status]++
    cityMap[city].amount += claim.amount
  })
  
  return Object.values(cityMap).sort((a, b) => b.total - a.total)
}
