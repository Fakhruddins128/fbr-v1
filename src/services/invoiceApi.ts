import { API_BASE_URL } from './api';
import { Invoice } from '../types';

export interface InvoiceResponse {
  success: boolean;
  data?: Invoice | Invoice[];
  message?: string;
  error?: string;
}

class InvoiceApi {
  private getAuthHeaders(companyId?: string): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    // Add X-Company-ID header for super admin users when companyId is provided
    if (companyId) {
      headers['X-Company-ID'] = companyId;
    }
    
    return headers;
  }

  private getUserData() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  async getAllInvoices(): Promise<InvoiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getInvoiceById(invoiceId: string): Promise<InvoiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createInvoice(invoiceData: Invoice, companyId?: string): Promise<InvoiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: this.getAuthHeaders(companyId),
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateInvoice(invoiceData: Invoice): Promise<InvoiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceData.invoiceID}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteInvoice(invoiceId: string): Promise<InvoiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const invoiceAPI = new InvoiceApi();
export default invoiceAPI;