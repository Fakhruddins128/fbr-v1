/**
 * FBR Scenario Mapping Utility
 * Maps Business Activity and Sector combinations to applicable FBR scenarios
 * Based on the Business Activity and Sector Scenarios document
 */

export interface ScenarioMapping {
  businessActivity: string;
  sector: string;
  scenarios: string[];
}

// Define all possible business activities
export const BUSINESS_ACTIVITIES = [
  'Manufacturing',
  'Importer',
  'Distributor',
  'Wholesaler',
  'Exporter',
  'Retailer',
  'Service Provider',
  'Other'
] as const;

// Define all possible sectors
export const SECTORS = [
  'All Other Sectors',
  'Steel',
  'FMCG',
  'Textile',
  'Telecom',
  'Petroleum',
  'Electricity Distribution',
  'Gas Distribution',
  'Services',
  'Automobile',
  'CNG Stations',
  'Pharmaceuticals',
  'Wholesale/Retails'
] as const;

// Scenario mapping data based on the business logic document
const SCENARIO_MAPPINGS: Record<string, Record<string, string[]>> = {
  'Manufacturing': {
    'All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024'],
    'Steel': ['SN003', 'SN004', 'SN011'],
    'FMCG': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Textile': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Telecom': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN010'],
    'Petroleum': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN012'],
    'Electricity Distribution': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN013'],
    'Gas Distribution': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN014'],
    'Services': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019'],
    'Automobile': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN020'],
    'CNG Stations': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN023'],
    'Pharmaceuticals': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Wholesale/Retails': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']
  },
  'Importer': {
    'All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024'],
    'Steel': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN003', 'SN004', 'SN011'],
    'FMCG': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Textile': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Telecom': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN010'],
    'Petroleum': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN012'],
    'Electricity Distribution': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN013'],
    'Gas Distribution': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN014'],
    'Services': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019'],
    'Automobile': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN020'],
    'CNG Stations': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN023'],
    'Pharmaceuticals': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Wholesale/Retails': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']
  },
  'Distributor': {
    'All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Steel': ['SN003', 'SN004', 'SN011', 'SN026', 'SN027', 'SN028', 'SN008'],
    'FMCG': ['SN008', 'SN026', 'SN027', 'SN028'],
    'Textile': ['SN009', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Telecom': ['SN010', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Petroleum': ['SN012', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Electricity Distribution': ['SN013', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Gas Distribution': ['SN014', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Services': ['SN018', 'SN019', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Automobile': ['SN020', 'SN026', 'SN027', 'SN028', 'SN008'],
    'CNG Stations': ['SN023', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Pharmaceuticals': ['SN025', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Wholesale/Retails': ['SN001', 'SN002', 'SN026', 'SN027', 'SN028', 'SN008']
  },
  'Wholesaler': {
    'All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Steel': ['SN003', 'SN004', 'SN011', 'SN026', 'SN027', 'SN028', 'SN008'],
    'FMCG': ['SN008', 'SN026', 'SN027', 'SN028'],
    'Textile': ['SN009', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Telecom': ['SN010', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Petroleum': ['SN012', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Electricity Distribution': ['SN013', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Gas Distribution': ['SN014', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Services': ['SN018', 'SN019', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Automobile': ['SN020', 'SN026', 'SN027', 'SN028', 'SN008'],
    'CNG Stations': ['SN023', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Pharmaceuticals': ['SN025', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Wholesale/Retails': ['SN001', 'SN002', 'SN026', 'SN027', 'SN028', 'SN008']
  },
  'Exporter': {
    'All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024'],
    'Steel': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN003', 'SN004', 'SN011'],
    'FMCG': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Textile': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Telecom': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN010'],
    'Petroleum': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN012'],
    'Electricity Distribution': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN013'],
    'Gas Distribution': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN014'],
    'Services': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019'],
    'Automobile': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN020'],
    'CNG Stations': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN023'],
    'Pharmaceuticals': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Wholesale/Retails': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']
  },
  'Retailer': {
    'All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Steel': ['SN026', 'SN027', 'SN028', 'SN008'],
    'FMCG': ['SN026', 'SN027', 'SN028', 'SN008'],
    'Textile': ['SN026', 'SN027', 'SN028', 'SN008'],
    'Telecom': ['SN010', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Petroleum': ['SN012', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Electricity Distribution': ['SN013', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Gas Distribution': ['SN014', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Services': ['SN018', 'SN019', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Automobile': ['SN020', 'SN026', 'SN027', 'SN028', 'SN008'],
    'CNG Stations': ['SN023', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Pharmaceuticals': ['SN025', 'SN026', 'SN027', 'SN028', 'SN008'],
    'Wholesale/Retails': ['SN026', 'SN027', 'SN028', 'SN008']
  },
  'Service Provider': {
    'All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019'],
    'Steel': ['SN003', 'SN004', 'SN011', 'SN018', 'SN019'],
    'FMCG': ['SN008', 'SN018', 'SN019'],
    'Textile': ['SN009', 'SN018', 'SN019'],
    'Telecom': ['SN010', 'SN018', 'SN019'],
    'Petroleum': ['SN012', 'SN018', 'SN019'],
    'Electricity Distribution': ['SN013', 'SN018', 'SN019'],
    'Gas Distribution': ['SN014', 'SN018', 'SN019'],
    'Services': ['SN018', 'SN019'],
    'Automobile': ['SN020', 'SN018', 'SN019'],
    'CNG Stations': ['SN023', 'SN018', 'SN019'],
    'Pharmaceuticals': ['SN025', 'SN018', 'SN019'],
    'Wholesale/Retails': ['SN026', 'SN027', 'SN028', 'SN008', 'SN018', 'SN019']
  },
  'Other': {
    'All Other Sectors': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024'],
    'Steel': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN003', 'SN004', 'SN011'],
    'FMCG': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN008'],
    'Textile': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN009'],
    'Telecom': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN010'],
    'Petroleum': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN012'],
    'Electricity Distribution': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN013'],
    'Gas Distribution': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN014'],
    'Services': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019'],
    'Automobile': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN020'],
    'CNG Stations': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN023'],
    'Pharmaceuticals': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025'],
    'Wholesale/Retails': ['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']
  }
};

/**
 * Get applicable FBR scenarios for a given business activity and sector combination
 * @param businessActivity - The business activity
 * @param sector - The sector
 * @returns Array of applicable scenario codes
 */
export function getApplicableScenarios(businessActivity: string, sector: string): string[] {
  const activityMappings = SCENARIO_MAPPINGS[businessActivity];
  if (!activityMappings) {
    return [];
  }
  
  return activityMappings[sector] || [];
}

/**
 * Get all applicable scenarios for multiple business activities and sectors
 * @param businessActivities - Array of business activities
 * @param sectors - Array of sectors
 * @returns Array of unique scenario codes
 */
export function getApplicableScenariosForMultiple(
  businessActivities: string[],
  sectors: string[]
): string[] {
  const allScenarios = new Set<string>();
  
  businessActivities.forEach(activity => {
    sectors.forEach(sector => {
      const scenarios = getApplicableScenarios(activity, sector);
      scenarios.forEach(scenario => allScenarios.add(scenario));
    });
  });
  
  return Array.from(allScenarios).sort();
}

/**
 * Get all unique scenarios for multiple business activities and sectors
 * @param businessActivities - Array of business activities
 * @param sectors - Array of sectors
 * @returns Array of unique scenario codes
 */
export function getUniqueScenarios(businessActivities: string[], sectors: string[]): string[] {
  const allScenarios = new Set<string>();
  
  businessActivities.forEach(activity => {
    sectors.forEach(sector => {
      const scenarios = getApplicableScenarios(activity, sector);
      scenarios.forEach(scenario => allScenarios.add(scenario));
    });
  });
  
  return Array.from(allScenarios).sort();
}

/**
 * Validate if the selected combination of business activities and sectors is valid
 * @param businessActivities Array of selected business activities
 * @param sectors Array of selected sectors
 * @returns Object with validation result and error message if invalid
 */
export function validateBusinessActivitySectorCombination(
  businessActivities: string[],
  sectors: string[]
): { isValid: boolean; errorMessage?: string } {
  // At least one business activity must be selected
  if (businessActivities.length === 0) {
    return {
      isValid: false,
      errorMessage: 'At least one Business Activity must be selected'
    };
  }

  // At least one sector must be selected
  if (sectors.length === 0) {
    return {
      isValid: false,
      errorMessage: 'At least one Sector must be selected'
    };
  }

  // Check if all combinations have applicable scenarios
  const applicableScenarios = getUniqueScenarios(businessActivities, sectors);
  if (applicableScenarios.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Selected combination of Business Activity and Sector has no applicable FBR scenarios'
    };
  }

  return { isValid: true };
}

/**
 * Validate if a business activity and sector combination is valid
 * @param businessActivity - The business activity
 * @param sector - The sector
 * @returns Boolean indicating if the combination is valid
 */
export function isValidCombination(businessActivity: string, sector: string): boolean {
  return BUSINESS_ACTIVITIES.includes(businessActivity as any) && 
         SECTORS.includes(sector as any) &&
         getApplicableScenarios(businessActivity, sector).length > 0;
}

/**
 * Get scenario mappings for all combinations
 * @returns Array of all scenario mappings
 */
export function getAllScenarioMappings(): ScenarioMapping[] {
  const mappings: ScenarioMapping[] = [];
  
  BUSINESS_ACTIVITIES.forEach(activity => {
    SECTORS.forEach(sector => {
      const scenarios = getApplicableScenarios(activity, sector);
      if (scenarios.length > 0) {
        mappings.push({
          businessActivity: activity,
          sector: sector,
          scenarios: scenarios
        });
      }
    });
  });
  
  return mappings;
}

/**
 * Get scenario description (placeholder for future implementation)
 * @param scenarioCode - The scenario code (e.g., 'SN001')
 * @returns Scenario description
 */
export function getScenarioDescription(scenarioCode: string): string {
  // This would be expanded with actual scenario descriptions
  return `FBR Tax Scenario ${scenarioCode}`;
}

/**
 * Check if scenarios are applicable for compliance reporting
 * @param scenarios - Array of scenario codes
 * @returns Boolean indicating if scenarios are valid for reporting
 */
export function areValidForReporting(scenarios: string[]): boolean {
  return scenarios.length > 0 && scenarios.every(scenario => scenario.startsWith('SN'));
}