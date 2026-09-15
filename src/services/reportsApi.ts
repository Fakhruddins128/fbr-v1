import { API_BASE_URL } from './api';

export interface ReportData {
  period: string;
  sales: number;
  purchases: number;
  profit: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  sales: number;
  percentage: number;
}

export interface TopCustomer {
  name: string;
  amount: number;
  orders: number;
  percentage: number;
}

export interface ReportsData {
  salesData: ReportData[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
}

export interface ReportsResponse {
  success: boolean;
  data?: ReportsData;
  message?: string;
  error?: string;
}

export interface ReportsParams {
  reportType?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

/** One line item of an invoice, as shown in the Sales Register. */
export interface SalesRegisterRow {
  invoiceDate: string;
  invoiceNo: string;
  term: string;
  partyCode: string;
  partyName: string;
  address: string;
  ntnNo: string;
  gstNo: string;
  description: string;
  hsCode: string;
  unit: string;
  quantity: number;
  /** Unit price (value excluding sales tax / quantity). */
  rate: number;
  valueExcludingST: number;
  salesTax: number;
  furtherTax: number;
  extraTax: number;
  valueIncludingST: number;
}

export interface SalesRegisterTotals {
  quantity: number;
  valueExcludingST: number;
  salesTax: number;
  furtherTax: number;
  extraTax: number;
  valueIncludingST: number;
}

export interface SalesRegisterData {
  company: { name: string; ntnNumber: string };
  period: { startDate: string | null; endDate: string | null };
  rows: SalesRegisterRow[];
  totals: SalesRegisterTotals;
}

export interface SalesRegisterResponse {
  success: boolean;
  data?: SalesRegisterData;
  message?: string;
  error?: string;
}

class ReportsApiService {
  private getAuthHeaders(companyId?: string): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };

    // Super admin targets a specific company through this header
    if (companyId) {
      headers['X-Company-ID'] = companyId;
    }

    return headers;
  }

  async getReportsData(params: ReportsParams = {}): Promise<ReportsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.reportType) queryParams.append('reportType', params.reportType);
      if (params.dateRange) queryParams.append('dateRange', params.dateRange);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const url = `${API_BASE_URL}/api/reports/sales${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching reports data:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch reports data',
        error: error.message
      };
    }
  }

  async getSalesRegister(
    params: { startDate?: string; endDate?: string } = {},
    companyId?: string
  ): Promise<SalesRegisterResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const query = queryParams.toString();
      const url = `${API_BASE_URL}/api/reports/sales-register${query ? `?${query}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(companyId),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || result?.message || `HTTP error! status: ${response.status}`
        );
      }

      return result;
    } catch (error: any) {
      console.error('Error fetching sales register:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch sales register',
        error: error.message
      };
    }
  }
}

export const reportsApi = new ReportsApiService();
export default reportsApi;