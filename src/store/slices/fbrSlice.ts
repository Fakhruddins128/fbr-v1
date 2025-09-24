import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  FBRApiResponse, 
  FBRInvoicePayload, 
  Province, 
  ProvincesApiResponse,
  DocumentType,
  DocumentTypesApiResponse,
  ItemDescriptionCode,
  ItemDescriptionCodesApiResponse,
  SroItemCode,
  SroItemCodesApiResponse,
  TransactionType,
  TransactionTypesApiResponse,
  UnitOfMeasurement,
  UomApiResponse
} from '../../types';
import fbrApiService from '../../api/fbrApi';
import { validateFBRInvoice } from '../../utils/fbrUtils';

interface FBRState {
  isSubmitting: boolean;
  lastSubmittedInvoice: FBRInvoicePayload | null;
  lastResponse: FBRApiResponse | null;
  validationErrors: string[];
  isValidating: boolean;
  environment: 'production' | 'sandbox';
  error: string | null;
  provinces: Province[];
  isLoadingProvinces: boolean;
  provincesError: string | null;
  documentTypes: DocumentType[];
  isLoadingDocumentTypes: boolean;
  documentTypesError: string | null;
  itemDescriptionCodes: ItemDescriptionCode[];
  isLoadingItemDescriptionCodes: boolean;
  itemDescriptionCodesError: string | null;
  sroItemCodes: SroItemCode[];
  isLoadingSroItemCodes: boolean;
  sroItemCodesError: string | null;
  transactionTypes: TransactionType[];
  isLoadingTransactionTypes: boolean;
  transactionTypesError: string | null;
  unitOfMeasurements: UnitOfMeasurement[];
  isLoadingUnitOfMeasurements: boolean;
  unitOfMeasurementsError: string | null;
}

const initialState: FBRState = {
  isSubmitting: false,
  lastSubmittedInvoice: null,
  lastResponse: null,
  validationErrors: [],
  isValidating: false,
  environment: (process.env.REACT_APP_FBR_ENVIRONMENT as 'production' | 'sandbox') || 'sandbox',
  error: null,
  provinces: [],
  isLoadingProvinces: false,
  provincesError: null,
  documentTypes: [],
  isLoadingDocumentTypes: false,
  documentTypesError: null,
  itemDescriptionCodes: [],
  isLoadingItemDescriptionCodes: false,
  itemDescriptionCodesError: null,
  sroItemCodes: [],
  isLoadingSroItemCodes: false,
  sroItemCodesError: null,
  transactionTypes: [],
  isLoadingTransactionTypes: false,
  transactionTypesError: null,
  unitOfMeasurements: [],
  isLoadingUnitOfMeasurements: false,
  unitOfMeasurementsError: null
};

// Async thunks for FBR API
export const submitInvoiceToFBR = createAsyncThunk(
  'fbr/submitInvoice',
  async (invoiceData: FBRInvoicePayload, { rejectWithValue }) => {
    try {
      // Validate invoice data before submission
      const validation = validateFBRInvoice(invoiceData);
      if (!validation.isValid) {
        return rejectWithValue({
          validationErrors: validation.errors,
          apiResponse: null
        });
      }
      
      // Log company information being submitted
      
      
      // Submit to FBR API
      const response = await fbrApiService.submitInvoice(invoiceData);
      
      // Check for API errors
      if (response.status !== '00') { // Assuming '00' is success code
        return rejectWithValue({
          validationErrors: [],
          apiResponse: response
        });
      }
      
      return {
        invoice: invoiceData,
        response
      };
    } catch (error) {
      return rejectWithValue({
        validationErrors: [(error as Error).message],
        apiResponse: null
      });
    }
  }
);

export const validateInvoice = createAsyncThunk(
  'fbr/validateInvoice',
  async (invoiceData: FBRInvoicePayload, { rejectWithValue }) => {
    try {
      // Client-side validation
      const clientValidation = validateFBRInvoice(invoiceData);
      if (!clientValidation.isValid) {
        return rejectWithValue(clientValidation.errors);
      }
      
      // API validation (if available)
      const response = await fbrApiService.validateInvoice(invoiceData);
      
      if (response.status !== '00') {
        return rejectWithValue(response.errors || [response.message]);
      }
      
      return true;
    } catch (error) {
      return rejectWithValue([(error as Error).message]);
    }
  }
);

export const fetchProvinces = createAsyncThunk(
  'fbr/fetchProvinces',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fbrApiService.getProvinces();
      
      if (response.status !== '00' && response.status !== 'success') {
        return rejectWithValue(response.errors || [response.message || 'Failed to fetch provinces']);
      }
      
      return response.data || [];
    } catch (error) {
      return rejectWithValue([(error as Error).message]);
    }
  }
);

// Async thunk for fetching document types
export const fetchDocumentTypes = createAsyncThunk(
  'fbr/fetchDocumentTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fbrApiService.getDocumentTypes();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch document types');
    }
  }
);

// Async thunk for fetching item description codes
export const fetchItemDescriptionCodes = createAsyncThunk(
  'fbr/fetchItemDescriptionCodes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fbrApiService.getItemDescriptionCodes();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch item description codes');
    }
  }
);

// Async thunk for fetching SRO item codes
export const fetchSroItemCodes = createAsyncThunk(
  'fbr/fetchSroItemCodes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fbrApiService.getSroItemCodes();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch SRO item codes');
    }
  }
);

// Async thunk for fetching transaction types
export const fetchTransactionTypes = createAsyncThunk(
  'fbr/fetchTransactionTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fbrApiService.getTransactionTypes();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch transaction types');
    }
  }
);

// Async thunk for fetching units of measurement
export const fetchUnitOfMeasurements = createAsyncThunk(
  'fbr/fetchUnitOfMeasurements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fbrApiService.getUnitOfMeasurements();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch units of measurement');
    }
  }
);

const fbrSlice = createSlice({
  name: 'fbr',
  initialState,
  reducers: {
    setEnvironment: (state, action: PayloadAction<'production' | 'sandbox'>) => {
      state.environment = action.payload;
    },
    clearValidationErrors: (state) => {
      state.validationErrors = [];
    },
    clearLastResponse: (state) => {
      state.lastResponse = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Submit Invoice
      .addCase(submitInvoiceToFBR.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
        state.validationErrors = [];
      })
      .addCase(submitInvoiceToFBR.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.lastSubmittedInvoice = action.payload.invoice;
        state.lastResponse = action.payload.response;
      })
      .addCase(submitInvoiceToFBR.rejected, (state, action) => {
        state.isSubmitting = false;
        
        const payload = action.payload as { 
          validationErrors: string[], 
          apiResponse: FBRApiResponse | null 
        };
        
        if (payload) {
          state.validationErrors = payload.validationErrors || [];
          state.lastResponse = payload.apiResponse;
        } else {
          state.error = 'Failed to submit invoice';
        }
      })
      // Validate Invoice
      .addCase(validateInvoice.pending, (state) => {
        state.isValidating = true;
        state.validationErrors = [];
      })
      .addCase(validateInvoice.fulfilled, (state) => {
        state.isValidating = false;
      })
      .addCase(validateInvoice.rejected, (state, action) => {
        state.isValidating = false;
        state.validationErrors = action.payload as string[];
      })
      // Fetch Provinces
      .addCase(fetchProvinces.pending, (state) => {
        state.isLoadingProvinces = true;
        state.provincesError = null;
      })
      .addCase(fetchProvinces.fulfilled, (state, action) => {
        state.isLoadingProvinces = false;
        // Handle both direct array response and wrapped response
        if (Array.isArray(action.payload)) {
          state.provinces = action.payload;
        } else if (action.payload && 'data' in action.payload) {
          state.provinces = (action.payload as any).data || [];
        } else {
          state.provinces = [];
        }
      })
      .addCase(fetchProvinces.rejected, (state, action) => {
        state.isLoadingProvinces = false;
        state.provincesError = action.payload as string || 'Failed to fetch provinces';
      })
      // Fetch Document Types
      .addCase(fetchDocumentTypes.pending, (state) => {
        state.isLoadingDocumentTypes = true;
        state.documentTypesError = null;
      })
      .addCase(fetchDocumentTypes.fulfilled, (state, action) => {
        state.isLoadingDocumentTypes = false;
        state.documentTypes = action.payload.data || [];
      })
      .addCase(fetchDocumentTypes.rejected, (state, action) => {
        state.isLoadingDocumentTypes = false;
        state.documentTypesError = action.payload as string || 'Failed to fetch document types';
      })
      // Fetch Item Description Codes
      .addCase(fetchItemDescriptionCodes.pending, (state) => {
        state.isLoadingItemDescriptionCodes = true;
        state.itemDescriptionCodesError = null;
      })
      .addCase(fetchItemDescriptionCodes.fulfilled, (state, action) => {
        state.isLoadingItemDescriptionCodes = false;
        state.itemDescriptionCodes = action.payload.data || [];
      })
      .addCase(fetchItemDescriptionCodes.rejected, (state, action) => {
        state.isLoadingItemDescriptionCodes = false;
        state.itemDescriptionCodesError = action.payload as string || 'Failed to fetch item description codes';
      })
      // Fetch SRO Item Codes
      .addCase(fetchSroItemCodes.pending, (state) => {
        state.isLoadingSroItemCodes = true;
        state.sroItemCodesError = null;
      })
      .addCase(fetchSroItemCodes.fulfilled, (state, action) => {
        state.isLoadingSroItemCodes = false;
        state.sroItemCodes = action.payload.data || [];
      })
      .addCase(fetchSroItemCodes.rejected, (state, action) => {
        state.isLoadingSroItemCodes = false;
        state.sroItemCodesError = action.payload as string || 'Failed to fetch SRO item codes';
      })
      // Fetch Transaction Types
      .addCase(fetchTransactionTypes.pending, (state) => {
        state.isLoadingTransactionTypes = true;
        state.transactionTypesError = null;
      })
      .addCase(fetchTransactionTypes.fulfilled, (state, action) => {
        state.isLoadingTransactionTypes = false;
        state.transactionTypes = action.payload.data || [];
      })
      .addCase(fetchTransactionTypes.rejected, (state, action) => {
        state.isLoadingTransactionTypes = false;
        state.transactionTypesError = action.payload as string || 'Failed to fetch transaction types';
      })
      // Fetch Unit of Measurements
      .addCase(fetchUnitOfMeasurements.pending, (state) => {
        state.isLoadingUnitOfMeasurements = true;
        state.unitOfMeasurementsError = null;
      })
      .addCase(fetchUnitOfMeasurements.fulfilled, (state, action) => {
        state.isLoadingUnitOfMeasurements = false;
        state.unitOfMeasurements = action.payload.data || [];
      })
      .addCase(fetchUnitOfMeasurements.rejected, (state, action) => {
        state.isLoadingUnitOfMeasurements = false;
        state.unitOfMeasurementsError = action.payload as string || 'Failed to fetch unit of measurements';
      });
  }
});

export const { 
  setEnvironment, 
  clearValidationErrors, 
  clearLastResponse,
  clearError 
} = fbrSlice.actions;

export default fbrSlice.reducer;