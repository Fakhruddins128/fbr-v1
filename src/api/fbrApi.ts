import axios, { AxiosError, AxiosResponse } from 'axios';
import { 
  FBRApiResponse, 
  FBRInvoicePayload, 
  ProvincesApiResponse,
  DocumentTypesApiResponse,
  ItemDescriptionCodesApiResponse,
  SroItemCodesApiResponse,
  TransactionTypesApiResponse,
  UomApiResponse,
  SroScheduleApiResponse,
  SaleTypeRateApiResponse
} from '../types';

// Backend API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// FBR API Configuration
const API_CONFIG = {
  PRODUCTION: {
    BASE_URL: 'https://gw.fbr.gov.pk/di_data/v1/di',
    INVOICE_ENDPOINT: '/postinvoicedata',
    PDI_BASE_URL: 'https://gw.fbr.gov.pk/pdi/v1'
  },
  SANDBOX: {
    BASE_URL: 'https://gw.fbr.gov.pk/di_data/v1/di',
    INVOICE_ENDPOINT: '/postinvoicedata_sb',
    PDI_BASE_URL: 'https://gw.fbr.gov.pk/pdi/v1'
  }
};

// Environment selection
const isSandbox = process.env.REACT_APP_FBR_ENVIRONMENT === 'sandbox';
const apiConfig = isSandbox ? API_CONFIG.SANDBOX : API_CONFIG.PRODUCTION;

// Create axios instance for invoice API
const fbrApiClient = axios.create({
  baseURL: apiConfig.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Create axios instance for PDI API (provinces, etc.)
const fbrPdiApiClient = axios.create({
  baseURL: apiConfig.PDI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for adding auth token to invoice API
fbrApiClient.interceptors.request.use(
  async config => {
    // Get current company ID - prioritize super admin selection, then fall back to user's company
    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    // Determine which company ID to use
    let companyId = selectedCompanyId;
    if (!companyId && user?.companyId) {
      companyId = user.companyId;
    }
    
    let token = null;
    if (companyId) {
      // Try to get token from database via API
      try {
        const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/fbr-token`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          token = result.data?.fbrToken || null;
        }
      } catch (error) {
        console.warn('Failed to fetch FBR token from database:', error);
        // Fallback to localStorage for backward compatibility
        token = localStorage.getItem(`fbr_api_token_${companyId}`);
      }
    }
    
    // Fallback to global token for backward compatibility
    if (!token) {
      token = localStorage.getItem('fbr_api_token');
    }
    
    if (token) {
      // Token from database already includes "Bearer " prefix
      config.headers['Authorization'] = token;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Request interceptor for adding auth token to PDI API
fbrPdiApiClient.interceptors.request.use(
  async config => {
    // Get current company ID - prioritize super admin selection, then fall back to user's company
    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    // Determine which company ID to use
    let companyId = selectedCompanyId;
    if (!companyId && user?.companyId) {
      companyId = user.companyId;
    }
    
    let token = null;
    if (companyId) {
      // Try to get token from database via API
      try {
        const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/fbr-token`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          token = result.data?.fbrToken || null;
        }
      } catch (error) {
        console.warn('Failed to fetch FBR token from database:', error);
        // Fallback to localStorage for backward compatibility
        token = localStorage.getItem(`fbr_api_token_${companyId}`);
      }
    }
    
    // Fallback to global token for backward compatibility
    if (!token) {
      token = localStorage.getItem('fbr_api_token');
    }
    
    if (token) {
      // Token from database already includes "Bearer " prefix
      config.headers['Authorization'] = token;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for handling common errors (Invoice API)
fbrApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Prepare error details for popup
    const errorDetails = {
      message: 'An error occurred while communicating with FBR API',
      status: undefined as number | undefined,
      statusText: undefined as string | undefined,
      data: undefined as any,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase()
    };
    
    // Handle specific error codes
    if (error.response) {
      const { status, data, statusText } = error.response;
      
      errorDetails.status = status;
      errorDetails.statusText = statusText;
      errorDetails.data = data;
      
      if (status === 401) {
        // Handle unauthorized - token expired or invalid
        console.error('FBR API Authentication failed');
        console.error('Please configure a valid FBR API token in the FBR Integration page.');
        errorDetails.message = 'FBR API authentication failed. Please configure a valid API token in the FBR Integration page.';
      } else if (status === 400) {
        console.error('FBR API Bad Request');
        errorDetails.message = 'Invalid request data sent to FBR API. Please check your input and try again.';
      } else if (status === 500) {
        console.error('FBR API Server error');
        errorDetails.message = 'FBR server encountered an internal error. Please try again later.';
      } else {
        errorDetails.message = `FBR API returned an error (${status}). Please check the details below.`;
      }
    } else if (error.request) {
      console.error('No response received from FBR API');
      errorDetails.message = 'No response received from FBR API. Please check your internet connection and try again.';
      errorDetails.data = { error: 'Network error - no response received' };
    } else {
      console.error('Error setting up FBR API request', error.message);
      errorDetails.message = `Error setting up FBR API request: ${error.message}`;
      errorDetails.data = { error: error.message };
    }
    
    // Dispatch custom event for error popup
    const event = new CustomEvent('fbrApiError', {
      detail: errorDetails
    });
    window.dispatchEvent(event);
    
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors (PDI API)
fbrPdiApiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Prepare error details for popup
    const errorDetails = {
      message: 'An error occurred while communicating with FBR PDI API',
      status: undefined as number | undefined,
      statusText: undefined as string | undefined,
      data: undefined as any,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase()
    };
    
    // Handle specific error codes
    if (error.response) {
      const { status, data, statusText } = error.response;
      
      errorDetails.status = status;
      errorDetails.statusText = statusText;
      errorDetails.data = data;
      
      if (status === 401) {
        console.error('FBR PDI API Authentication failed');
        console.error('Please configure a valid FBR API token in the FBR Integration page.');
        errorDetails.message = 'FBR PDI API authentication failed. Please configure a valid API token in the FBR Integration page.';
      } else if (status === 400) {
        console.error('FBR PDI API Bad Request');
        errorDetails.message = 'Invalid request data sent to FBR PDI API. Please check your input and try again.';
      } else if (status === 500) {
        console.error('FBR PDI API Server error');
        errorDetails.message = 'FBR PDI server encountered an internal error. Please try again later.';
      } else {
        errorDetails.message = `FBR PDI API returned an error (${status}). Please check the details below.`;
      }
    } else if (error.request) {
      console.error('No response received from FBR PDI API');
      errorDetails.message = 'No response received from FBR PDI API. Please check your internet connection and try again.';
      errorDetails.data = { error: 'Network error - no response received' };
    } else {
      console.error('Error setting up FBR PDI API request', error.message);
      errorDetails.message = `Error setting up FBR PDI API request: ${error.message}`;
      errorDetails.data = { error: error.message };
    }
    
    // Dispatch custom event for error popup
    const event = new CustomEvent('fbrApiError', {
      detail: errorDetails
    });
    window.dispatchEvent(event);
    
    return Promise.reject(error);
  }
);

// FBR API Service
export const fbrApiService = {
  /**
   * Submit invoice to FBR
   * @param invoiceData - The invoice data to submit
   * @returns Promise with the FBR response
   */
  submitInvoice: async (invoiceData: FBRInvoicePayload): Promise<FBRApiResponse> => {
    try {
      const response = await fbrApiClient.post<FBRApiResponse>(
        apiConfig.INVOICE_ENDPOINT,
        invoiceData
      );
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Return the error response from FBR
        return error.response.data as FBRApiResponse;
      }
      
      // Generic error handling
      return {
        status: '01', // Error status code
        message: 'Failed to submit invoice to FBR',
        errors: [(error as Error).message]
      };
    }
  },
  
  /**
   * Validate invoice data before submission
   * @param invoiceData - The invoice data to validate
   * @returns Promise with validation result
   */
  validateInvoice: async (invoiceData: FBRInvoicePayload): Promise<FBRApiResponse> => {
    try {
      // Assuming FBR provides a validation endpoint
      // If not, we can implement client-side validation
      const response = await fbrApiClient.post<FBRApiResponse>(
        '/validateinvoice', // This endpoint may need to be updated based on FBR docs
        invoiceData
      );
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as FBRApiResponse;
      }
      
      return {
        status: '01',
        message: 'Failed to validate invoice',
        errors: [(error as Error).message]
      };
    }
  },
  
  /**
   * Set the FBR API token for a specific company
   * @param token - The authentication token
   * @param companyId - The company ID (optional, for backward compatibility)
   */
  setApiToken: async (token: string, companyId?: string): Promise<void> => {
    if (companyId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/fbr-token`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ fbrToken: token })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save FBR token to database');
        }
        
        // Also save to localStorage as fallback
        localStorage.setItem(`fbr_api_token_${companyId}`, token);
      } catch (error) {
        console.warn('Failed to save FBR token to database, using localStorage only:', error);
        localStorage.setItem(`fbr_api_token_${companyId}`, token);
      }
    } else {
      // Backward compatibility - global token
      localStorage.setItem('fbr_api_token', token);
    }
  },
  
  /**
   * Get the FBR API token for a specific company
   * @param companyId - The company ID (optional)
   * @returns The token or null if not found
   */
  getApiToken: async (companyId?: string): Promise<string | null> => {
    if (companyId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/fbr-token`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          return result.data?.fbrToken || null;
        }
      } catch (error) {
        console.warn('Failed to fetch FBR token from database:', error);
      }
      
      // Fallback to localStorage
      return localStorage.getItem(`fbr_api_token_${companyId}`);
    } else {
      // Backward compatibility - global token
      return localStorage.getItem('fbr_api_token');
    }
  },
  
  /**
   * Clear the FBR API token for a specific company
   * @param companyId - The company ID (optional, clears global token if not provided)
   */
  clearApiToken: async (companyId?: string): Promise<void> => {
    if (companyId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/fbr-token`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          console.warn('Failed to delete FBR token from database');
        }
      } catch (error) {
        console.warn('Failed to delete FBR token from database:', error);
      }
      
      // Also remove from localStorage
      localStorage.removeItem(`fbr_api_token_${companyId}`);
    } else {
      // Backward compatibility - clear global token
      localStorage.removeItem('fbr_api_token');
    }
  },
  
  /**
   * Get all company tokens (for superadmin management)
   * @returns Object with companyId as key and token status as value
   */
  getAllCompanyTokens: async (): Promise<Record<string, { hasToken: boolean; tokenPreview?: string }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/fbr-tokens`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // Transform backend response to expected format
        const companies: Record<string, { hasToken: boolean; tokenPreview?: string }> = {};
        if (result.data && Array.isArray(result.data)) {
          result.data.forEach((company: any) => {
            companies[company.id] = {
              hasToken: company.hasFbrToken,
              tokenPreview: company.hasFbrToken ? '••••••••••...' : undefined
            };
          });
        }
        return companies;
      }
    } catch (error) {
      console.warn('Failed to fetch company tokens from database:', error);
    }
    
    // Fallback to localStorage for backward compatibility
    const tokens: Record<string, { hasToken: boolean; tokenPreview?: string }> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fbr_api_token_')) {
        const companyId = key.replace('fbr_api_token_', '');
        const token = localStorage.getItem(key);
        if (token) {
          tokens[companyId] = {
            hasToken: true,
            tokenPreview: token.substring(0, 10) + '...'
          };
        }
      }
    }
    return tokens;
  },

  /**
    * Get list of provinces from FBR PDI API
    * @returns Promise with the provinces data
    */
   getProvinces: async (): Promise<ProvincesApiResponse> => {
    try {
      const response = await fbrPdiApiClient.get('/provinces');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Return the error response from FBR
        return error.response.data;
      }
      
      // Generic error handling
      return {
        status: '01',
        message: 'Failed to fetch provinces from FBR',
        errors: [(error as Error).message]
      };
    }
  },

  getDocumentTypes: async (): Promise<DocumentTypesApiResponse> => {
    try {
      const response = await fbrPdiApiClient.get('/doctypecode');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        data: [],
        success: false,
        message: 'Failed to fetch document types from FBR'
      };
    }
  },

  getItemDescriptionCodes: async (): Promise<ItemDescriptionCodesApiResponse> => {
    try {
      const response = await fbrPdiApiClient.get('/itemdesccode');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        data: [],
        success: false,
        message: 'Failed to fetch item description codes from FBR'
      };
    }
  },

  getSroItemCodes: async (): Promise<SroItemCodesApiResponse> => {
    try {
      const response = await fbrPdiApiClient.get('/sroitemcode');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        data: [],
        success: false,
        message: 'Failed to fetch SRO item codes from FBR'
      };
    }
  },

  getTransactionTypes: async (): Promise<TransactionTypesApiResponse> => {
    try {
      const response = await fbrPdiApiClient.get('/transtypecode');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        data: [],
        success: false,
        message: 'Failed to fetch transaction types from FBR'
      };
    }
  },

  getUnitOfMeasurements: async (): Promise<UomApiResponse> => {
    try {
      const response = await fbrPdiApiClient.get('/uom');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        data: [],
        success: false,
        message: 'Failed to fetch units of measurement from FBR'
      };
    }
  },

  getSroSchedule: async (rateId: string, date: string, originationSupplier: number): Promise<SroScheduleApiResponse> => {
    try {
      const response = await fbrPdiApiClient.get(`/SroSchedule?rate_id=${rateId}&date=${date}&origination_supplier_csv=${originationSupplier}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        data: [],
        success: false,
        message: 'Failed to fetch SRO schedule from FBR'
      };
    }
  },

  getSaleTypeToRate: async (date: string, transTypeId: string, originationSupplier: number): Promise<SaleTypeRateApiResponse> => {
    try {
      const response = await fbrPdiApiClient.get(`/v2/SaleTypeToRate?date=${date}&transTypeId=${transTypeId}&originationSupplier=${originationSupplier}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      return {
        data: [],
        success: false,
        message: 'Failed to fetch sale type to rate from FBR'
      };
    }
  }
};

export default fbrApiService;