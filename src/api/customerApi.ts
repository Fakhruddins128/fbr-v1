const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export interface Customer {
  id: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
  buyerRegistrationNo: string;
  buyerEmail: string;
  buyerCellphone: string;
  contactPersonName?: string;
  businessActivity?: string[];
  sector?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerRequest {
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
  buyerRegistrationNo: string;
  buyerEmail: string;
  buyerCellphone: string;
  contactPersonName?: string;
  businessActivity?: string[];
  sector?: string[];
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class CustomerApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAllCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createCustomer(customerData: CreateCustomerRequest): Promise<ApiResponse<Customer>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateCustomer(customerData: UpdateCustomerRequest): Promise<ApiResponse<Customer>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerData.id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          buyerNTNCNIC: customerData.buyerNTNCNIC,
          buyerBusinessName: customerData.buyerBusinessName,
          buyerProvince: customerData.buyerProvince,
          buyerAddress: customerData.buyerAddress,
          buyerRegistrationType: customerData.buyerRegistrationType,
          buyerRegistrationNo: customerData.buyerRegistrationNo,
          buyerEmail: customerData.buyerEmail,
          buyerCellphone: customerData.buyerCellphone,
          contactPersonName: customerData.contactPersonName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteCustomer(customerId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const customerApi = new CustomerApi();
export default customerApi;