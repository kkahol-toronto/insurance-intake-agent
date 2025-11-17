// Munich Re FNOL data loader
// Loads the 5 cases from the cases folder

// Case data will be loaded dynamically, but we'll create a structure for the dashboard
export const loadFNOLCases = async () => {
  const cases = [];
  
  // Load all 5 cases
  for (let i = 1; i <= 5; i++) {
    try {
      const fnolResponse = await fetch(`/cases/case${i}/fnol.json`);
      const statusResponse = await fetch(`/cases/case${i}/status.json`);
      const outcomeResponse = await fetch(`/cases/case${i}/outcome.txt`);
      
      if (fnolResponse.ok && statusResponse.ok && outcomeResponse.ok) {
        const fnol = await fnolResponse.json();
        const status = await statusResponse.json();
        const outcome = await outcomeResponse.text();
        
        const lossInfo = fnol.lossInformation;
        const reportedBy = fnol.reportedBy;
        const policyInfo = fnol.policyInformation;
        
        cases.push({
          id: `FNOL-CASE-${i}`,
          claimId: status.claimId,
          caseNumber: i,
          reportedBy: `${reportedBy.firstName} ${reportedBy.lastName}`,
          reporterRole: reportedBy.roleInRelationToLoss,
          insuredName: policyInfo.insuredName,
          policyNumber: policyInfo.policyNumber,
          dateOfLoss: lossInfo.dateOfLoss,
          lossDescription: lossInfo.lossDescription,
          city: lossInfo.lossLocation.city,
          state: lossInfo.lossLocation.stateProvince,
          zipCode: lossInfo.lossLocation.zipPostalCode,
          status: status.status,
          finalOutcome: status.status.includes('Accepted') ? 'accepted' : 
                       status.status.includes('Rejected') ? 'rejected' : 'pending',
          stages: status.logs || [],
          outcome: outcome,
          fnolData: fnol,
          statusData: status
        });
      }
    } catch (error) {
      console.warn(`Failed to load case ${i}:`, error);
    }
  }
  
  return cases;
};

// Generate statistics from cases
export const generateFNOLStatistics = (cases) => {
  const total = cases.length;
  const accepted = cases.filter(c => c.finalOutcome === 'accepted').length;
  const rejected = cases.filter(c => c.finalOutcome === 'rejected').length;
  const pending = cases.filter(c => c.finalOutcome === 'pending').length;
  
  // Group by state
  const stateData = {};
  cases.forEach(caseItem => {
    const state = caseItem.state;
    if (!stateData[state]) {
      stateData[state] = { total: 0, accepted: 0, rejected: 0, pending: 0 };
    }
    stateData[state].total++;
    stateData[state][caseItem.finalOutcome]++;
  });
  
  // Group by city
  const cityData = {};
  cases.forEach(caseItem => {
    const city = caseItem.city;
    if (!cityData[city]) {
      cityData[city] = { 
        city, 
        state: caseItem.state,
        total: 0, 
        accepted: 0, 
        rejected: 0, 
        pending: 0 
      };
    }
    cityData[city].total++;
    cityData[city][caseItem.finalOutcome]++;
  });
  
  return {
    total,
    accepted,
    rejected,
    pending,
    stateData,
    cityData: Object.values(cityData)
  };
};

// Mock data for development (when cases can't be loaded)
export const getMockFNOLCases = () => {
  return [
    {
      id: 'FNOL-CASE-1',
      claimId: 'FNOL-CP-101-0001-JM',
      caseNumber: 1,
      reportedBy: 'Joe Miller',
      reporterRole: 'Insured',
      insuredName: "Joe's Hardware Inc.",
      policyNumber: 'CP-101-0001',
      dateOfLoss: '2025-09-01',
      lossDescription: 'A fire started in the storage area, causing significant damage to inventory and parts of the building.',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      status: 'Processing Complete – Claim Accepted',
      finalOutcome: 'accepted',
      stages: []
    },
    {
      id: 'FNOL-CASE-2',
      claimId: 'FNOL-CP-201-4567-AJ',
      caseNumber: 2,
      reportedBy: 'Alice Johnson',
      reporterRole: 'Insured',
      insuredName: 'Sunshine Bakery LLC',
      policyNumber: 'CP-201-4567',
      dateOfLoss: '2025-06-30',
      lossDescription: 'Severe overnight rainstorms caused flooding in the bakery\'s basement, damaging equipment and supplies.',
      city: 'Miami',
      state: 'FL',
      zipCode: '33131',
      status: 'Processing Complete – Claim Rejected (Non-Covered Peril: Flood)',
      finalOutcome: 'rejected',
      stages: []
    },
    {
      id: 'FNOL-CASE-3',
      claimId: 'FNOL-CP-301-7890-MT',
      caseNumber: 3,
      reportedBy: 'Susan Lee',
      reporterRole: 'Broker',
      insuredName: 'Green Fields Apartments LLC',
      policyNumber: 'CP-301-7890',
      dateOfLoss: '2025-10-05',
      lossDescription: 'Over the weekend, several units were broken into and appliances were stolen. There were signs of forced entry and vandalism throughout the property.',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98103',
      status: 'Processing Complete – Claim Accepted',
      finalOutcome: 'accepted',
      stages: []
    },
    {
      id: 'FNOL-CASE-4',
      claimId: 'FNOL-CP-401-2345-DC',
      caseNumber: 4,
      reportedBy: 'Robert Miller',
      reporterRole: 'MGA',
      insuredName: 'Tech Solutions Corp.',
      policyNumber: 'CP-401-2345',
      dateOfLoss: '2025-07-22',
      lossDescription: 'A pipe burst on the second floor of the Los Angeles branch office, causing extensive water damage to the server room and adjacent offices.',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90026',
      status: 'Processing Complete – Claim Accepted',
      finalOutcome: 'accepted',
      stages: []
    },
    {
      id: 'FNOL-CASE-5',
      claimId: 'FNOL-CP-999-9999-HA',
      caseNumber: 5,
      reportedBy: 'Henry Adams',
      reporterRole: 'Other',
      insuredName: 'Lakeside Inn',
      policyNumber: 'CP-999-9999',
      dateOfLoss: '2025-08-15',
      lossDescription: 'Small electrical fire in the kitchen',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      status: 'Processing Complete – Claim Rejected (Invalid Policy Number)',
      finalOutcome: 'rejected',
      stages: []
    }
  ];
};

