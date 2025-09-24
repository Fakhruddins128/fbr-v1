// Utility functions for validating Business Activity and Sector combinations
// and determining applicable FBR scenarios

export interface ScenarioMapping {
  businessActivity: string;
  sector: string;
  applicableScenarios: string[];
}

// Valid Business Activity options
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

// Valid Sector options
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

export type BusinessActivity = typeof BUSINESS_ACTIVITIES[number];
export type Sector = typeof SECTORS[number];

/**
 * Validates if a business activity is valid
 * @param businessActivity - The business activity to validate
 * @returns boolean indicating if the business activity is valid
 */
export const isValidBusinessActivity = (businessActivity: string): businessActivity is BusinessActivity => {
  return BUSINESS_ACTIVITIES.includes(businessActivity as BusinessActivity);
};

/**
 * Validates if a sector is valid
 * @param sector - The sector to validate
 * @returns boolean indicating if the sector is valid
 */
export const isValidSector = (sector: string): sector is Sector => {
  return SECTORS.includes(sector as Sector);
};

/**
 * Validates if multiple business activities are valid
 * @param businessActivities - Array of business activities to validate
 * @returns boolean indicating if all business activities are valid
 */
export const areValidBusinessActivities = (businessActivities: string[]): boolean => {
  if (!Array.isArray(businessActivities) || businessActivities.length === 0) {
    return false;
  }
  return businessActivities.every(activity => isValidBusinessActivity(activity));
};

/**
 * Validates if multiple sectors are valid
 * @param sectors - Array of sectors to validate
 * @returns boolean indicating if all sectors are valid
 */
export const areValidSectors = (sectors: string[]): boolean => {
  if (!Array.isArray(sectors) || sectors.length === 0) {
    return false;
  }
  return sectors.every(sector => isValidSector(sector));
};

/**
 * Validates if the combination of business activities and sectors is valid
 * @param businessActivities - Array of selected business activities
 * @param sectors - Array of selected sectors
 * @returns object with validation result and error message if invalid
 */
export const validateBusinessActivitySectorCombination = (
  businessActivities: string[],
  sectors: string[]
): { isValid: boolean; errorMessage?: string } => {
  // Check if arrays are provided and not empty
  if (!businessActivities || !Array.isArray(businessActivities) || businessActivities.length === 0) {
    return {
      isValid: false,
      errorMessage: 'At least one Business Activity must be selected'
    };
  }

  if (!sectors || !Array.isArray(sectors) || sectors.length === 0) {
    return {
      isValid: false,
      errorMessage: 'At least one Sector must be selected'
    };
  }

  // Validate business activities
  if (!areValidBusinessActivities(businessActivities)) {
    const invalidActivities = businessActivities.filter(activity => !isValidBusinessActivity(activity));
    return {
      isValid: false,
      errorMessage: `Invalid Business Activities: ${invalidActivities.join(', ')}`
    };
  }

  // Validate sectors
  if (!areValidSectors(sectors)) {
    const invalidSectors = sectors.filter(sector => !isValidSector(sector));
    return {
      isValid: false,
      errorMessage: `Invalid Sectors: ${invalidSectors.join(', ')}`
    };
  }

  // Check for duplicate selections
  const uniqueActivities = Array.from(new Set(businessActivities));
  const uniqueSectors = Array.from(new Set(sectors));

  if (uniqueActivities.length !== businessActivities.length) {
    return {
      isValid: false,
      errorMessage: 'Duplicate Business Activities are not allowed'
    };
  }

  if (uniqueSectors.length !== sectors.length) {
    return {
      isValid: false,
      errorMessage: 'Duplicate Sectors are not allowed'
    };
  }

  return { isValid: true };
};

/**
 * Gets applicable scenarios for multiple business activity and sector combinations
 * This function calls the backend API to get the scenarios
 * @param businessActivities - Array of selected business activities
 * @param sectors - Array of selected sectors
 * @returns Promise with array of unique applicable scenario codes
 */
export const getApplicableScenariosForMultiple = async (
  businessActivities: string[],
  sectors: string[]
): Promise<string[]> => {
  // Validate input first
  const validation = validateBusinessActivitySectorCombination(businessActivities, sectors);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage);
  }

  try {
    const response = await fetch('/api/scenarios/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessActivities,
        sectors
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.applicableScenarios || [];
  } catch (error) {
    console.error('Error fetching applicable scenarios:', error);
    throw error;
  }
};

/**
 * Validates if a specific business activity and sector combination is valid
 * This function calls the backend API to validate the combination
 * @param businessActivity - The business activity to validate
 * @param sector - The sector to validate
 * @returns Promise with validation result
 */
export const validateCombinationWithAPI = async (
  businessActivity: string,
  sector: string
): Promise<{ isValid: boolean; errorMessage?: string }> => {
  // Basic validation first
  if (!isValidBusinessActivity(businessActivity)) {
    return {
      isValid: false,
      errorMessage: `Invalid Business Activity: ${businessActivity}`
    };
  }

  if (!isValidSector(sector)) {
    return {
      isValid: false,
      errorMessage: `Invalid Sector: ${sector}`
    };
  }

  try {
    const response = await fetch('/api/scenarios/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessActivity,
        sector
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      isValid: data.isValid,
      errorMessage: data.isValid ? undefined : 'Invalid Business Activity and Sector combination'
    };
  } catch (error) {
    console.error('Error validating combination:', error);
    return {
      isValid: false,
      errorMessage: 'Error validating combination. Please try again.'
    };
  }
};

/**
 * Formats scenario codes for display
 * @param scenarios - Array of scenario codes
 * @returns Formatted string of scenarios
 */
export const formatScenariosForDisplay = (scenarios: string[]): string => {
  if (!scenarios || scenarios.length === 0) {
    return 'No applicable scenarios';
  }
  return scenarios.sort().join(', ');
};

/**
 * Gets the count of applicable scenarios
 * @param scenarios - Array of scenario codes
 * @returns Number of scenarios
 */
export const getScenarioCount = (scenarios: string[]): number => {
  return scenarios ? scenarios.length : 0;
};

/**
 * Checks if scenarios array contains a specific scenario
 * @param scenarios - Array of scenario codes
 * @param scenarioCode - The scenario code to check for
 * @returns boolean indicating if the scenario is present
 */
export const hasScenario = (scenarios: string[], scenarioCode: string): boolean => {
  return scenarios ? scenarios.includes(scenarioCode) : false;
};