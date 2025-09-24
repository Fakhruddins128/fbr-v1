import { API_BASE_URL } from '../services/api';

export interface Vendor {
  vendorId: string;
  companyId: string;
  vendorName: string;
  vendorNTN: string;
  vendorCNIC: string;
  contactPersonName: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorEmail: string;
  businessActivity?: string[];
  sector?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  vendorName: string;
  vendorNTN: string;
  vendorCNIC: string;
  contactPersonName: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorEmail: string;
  businessActivity?: string[];
  sector?: string[];
}

export interface UpdateVendorRequest extends CreateVendorRequest {
  vendorId: string;
}

export interface VendorResponse {
  success: boolean;
  data?: Vendor | Vendor[];
  message?: string;
  error?: string;
}

class VendorApi {
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

  async getAllVendors(user?: { role?: string; companyId?: string }): Promise<VendorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors`, {
        method: 'GET',
        headers: this.getAuthHeaders(user),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return {
        success: false,
        error: 'Failed to fetch vendors'
      };
    }
  }

  async getVendorById(vendorId: string): Promise<VendorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      return {
        success: false,
        error: 'Failed to fetch vendor'
      };
    }
  }

  async createVendor(vendor: CreateVendorRequest): Promise<VendorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(vendor),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      return {
        success: false,
        error: 'Failed to create vendor: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  async updateVendor(vendor: UpdateVendorRequest): Promise<VendorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${vendor.vendorId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(vendor),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error updating vendor:', error);
      return {
        success: false,
        error: 'Failed to update vendor: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  async deleteVendor(vendorId: string): Promise<VendorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      return {
        success: false,
        error: 'Failed to delete vendor'
      };
    }
  }

  async toggleVendorStatus(vendorId: string): Promise<VendorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorId}/toggle-status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error toggling vendor status:', error);
      return {
        success: false,
        error: 'Failed to toggle vendor status'
      };
    }
  }
}

export const vendorApi = new VendorApi();