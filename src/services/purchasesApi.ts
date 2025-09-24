import { API_BASE_URL } from './api';

export interface PurchaseItem {
  itemId: string;
  itemName: string;
  purchasePrice: number;
  purchaseQty: number;
  totalAmount: number;
}

export interface Purchase {
  id?: string;
  poNumber?: string; // for backward compatibility
  poDate?: string; // for backward compatibility
  crNumber?: string;
  date?: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: 'pending' | 'received' | 'cancelled';
  createdAt?: string;
}

export interface PurchaseResponse {
  success: boolean;
  data?: Purchase | Purchase[];
  message?: string;
  error?: string;
}

class PurchasesApi {
  private getAuthHeaders(user?: { role?: string; companyId?: string }) {
    const token = localStorage.getItem('auth_token');
    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // For super admins, use selectedCompanyId from localStorage
    // For company admins, use their companyId
    let companyId = selectedCompanyId;
    if (user?.role !== 'SUPER_ADMIN' && user?.companyId) {
      companyId = user.companyId;
    }
    
    if (companyId) {
      headers['X-Company-ID'] = companyId;
    }
    
    return headers;
  }

  async getAllPurchases(user?: { role?: string; companyId?: string }): Promise<PurchaseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchases`, {
        method: 'GET',
        headers: this.getAuthHeaders(user),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return {
        success: false,
        error: 'Failed to fetch purchases'
      };
    }
  }

  async createPurchase(purchaseData: Omit<Purchase, 'id' | 'createdAt'>, user?: { role?: string; companyId?: string }): Promise<PurchaseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchases`, {
        method: 'POST',
        headers: this.getAuthHeaders(user),
        body: JSON.stringify(purchaseData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating purchase:', error);
      return {
        success: false,
        error: 'Failed to create purchase'
      };
    }
  }

  async updatePurchase(id: string, purchaseData: Partial<Purchase>, user?: { role?: string; companyId?: string }): Promise<PurchaseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchases/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(user),
        body: JSON.stringify(purchaseData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating purchase:', error);
      return {
        success: false,
        error: 'Failed to update purchase'
      };
    }
  }

  async deletePurchase(id: string, user?: { role?: string; companyId?: string }): Promise<PurchaseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchases/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(user),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting purchase:', error);
      return {
        success: false,
        error: 'Failed to delete purchase'
      };
    }
  }

  async getPurchaseById(id: string, user?: { role?: string; companyId?: string }): Promise<PurchaseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchases/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(user),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching purchase:', error);
      return {
        success: false,
        error: 'Failed to fetch purchase'
      };
    }
  }
}

export const purchasesApi = new PurchasesApi();
export default purchasesApi;