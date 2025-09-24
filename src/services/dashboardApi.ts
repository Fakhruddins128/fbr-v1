import { API_BASE_URL } from './api';

export interface DashboardStats {
  totalInvoices: number;
  totalAmount: number;
  totalTax: number;
  totalInventory: number;
  totalCustomers: number;
  profit: number;
}

export interface RecentActivity {
  id: number;
  description: string;
  date: string;
  amount: number;
  type: string;
}

export interface InventoryStatus {
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface SalesChartData {
  month: string;
  amount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  inventoryStatus: InventoryStatus;
  salesChart: SalesChartData[];
}

export interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
}

class DashboardApiService {
  private getAuthHeaders(companyId?: string) {
    const token = localStorage.getItem('auth_token');
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Add X-Company-ID header for super admin users when companyId is provided
    if (companyId) {
      headers['X-Company-ID'] = companyId;
    }
    
    return headers;
  }

  async getDashboardData(companyId?: string): Promise<DashboardData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(companyId)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DashboardApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

const dashboardApi = new DashboardApiService();
export default dashboardApi;