import { API_BASE_URL } from '../services/api';

export interface Item {
  itemId: string;
  companyId: string;
  hsCode: string;
  description: string;
  unitPrice: number;
  purchaseTaxValue: number;
  salesTaxValue: number;
  uom: string;
  itemCreateDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequest {
  hsCode: string;
  description: string;
  unitPrice: number;
  purchaseTaxValue: number;
  salesTaxValue: number;
  uom: string;
}

export interface UpdateItemRequest extends CreateItemRequest {
  itemId: string;
}

export interface ItemResponse {
  success: boolean;
  data?: Item | Item[];
  message?: string;
  error?: string;
}

class ItemsApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (selectedCompanyId) {
      headers['X-Company-ID'] = selectedCompanyId;
    }
    
    return headers;
  }

  async getAllItems(): Promise<ItemResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching items:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch items',
        error: error.message
      };
    }
  }

  async createItem(item: CreateItemRequest): Promise<ItemResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`, {
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
      console.error('Error creating item:', error);
      return {
        success: false,
        message: error.message || 'Failed to create item',
        error: error.message
      };
    }
  }

  async updateItem(itemId: string, item: CreateItemRequest): Promise<ItemResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
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
      console.error('Error updating item:', error);
      return {
        success: false,
        message: error.message || 'Failed to update item',
        error: error.message
      };
    }
  }

  async deleteItem(itemId: string): Promise<ItemResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete item',
        error: error.message
      };
    }
  }
}

export const itemsApi = new ItemsApi();