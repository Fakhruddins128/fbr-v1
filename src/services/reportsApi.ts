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

class ReportsApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
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
}

export const reportsApi = new ReportsApiService();
export default reportsApi;