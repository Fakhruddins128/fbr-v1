import { API_BASE_URL } from './api';

export interface InventoryItem {
  id?: string;
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  totalValue?: number;
  lastUpdated?: string;
}

export interface InventoryResponse {
  success: boolean;
  data?: InventoryItem | InventoryItem[];
  message?: string;
  error?: string;
}

class InventoryApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAllInventory(): Promise<InventoryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch inventory',
        error: error.message
      };
    }
  }

  async createInventoryItem(item: Omit<InventoryItem, 'id' | 'totalValue' | 'lastUpdated'>): Promise<InventoryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error creating inventory item:', error);
      return {
        success: false,
        message: error.message || 'Failed to create inventory item',
        error: error.message
      };
    }
  }

  async updateInventoryItem(id: string, item: Omit<InventoryItem, 'id' | 'totalValue' | 'lastUpdated'>): Promise<InventoryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error updating inventory item:', error);
      return {
        success: false,
        message: error.message || 'Failed to update inventory item',
        error: error.message
      };
    }
  }

  async deleteInventoryItem(id: string): Promise<InventoryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete inventory item',
        error: error.message
      };
    }
  }
}

export const inventoryApi = new InventoryApiService();