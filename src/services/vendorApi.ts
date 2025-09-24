const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export interface Vendor {
  id: string;
  vendorName: string;
  vendorNTN: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorEmail: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVendorRequest {
  vendorName: string;
  vendorNTN: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorEmail: string;
}

export interface UpdateVendorRequest extends CreateVendorRequest {
  id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class VendorApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };

    // Add company ID header for super admin
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');
    
    if (currentUser.role === 'SUPER_ADMIN' && currentCompany.id) {
      headers['X-Company-ID'] = currentCompany.id;
    }

    return headers;
  }

  async getAllVendors(): Promise<ApiResponse<Vendor[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createVendor(vendorData: CreateVendorRequest): Promise<ApiResponse<Vendor>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(vendorData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating vendor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateVendor(vendorData: UpdateVendorRequest): Promise<ApiResponse<Vendor>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorData.id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          vendorName: vendorData.vendorName,
          vendorNTN: vendorData.vendorNTN,
          vendorAddress: vendorData.vendorAddress,
          vendorPhone: vendorData.vendorPhone,
          vendorEmail: vendorData.vendorEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating vendor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteVendor(vendorId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const vendorApi = new VendorApi();
export default vendorApi;