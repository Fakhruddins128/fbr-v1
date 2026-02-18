// Common Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  companyId?: string; // Not applicable for Super Admin
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  SALES_PERSON = 'SALES_PERSON'
}

export interface Company {
  id: string;
  name: string;
  ntnNumber: string;
  cnic: string;
  businessNameForSalesInvoice?: string;
  address: string;
  city: string;
  province: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  businessActivity: string[];
  sector: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// FBR API Types
export interface FBRInvoicePayload {
  invoiceType: string;
  invoiceDate: string;
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
  invoiceRefNo: string;
  scenarioId: string;
  items: FBRInvoiceItem[];
}

export interface FBRInvoiceItem {
  hsCode: string;
  productDescription: string;
  rate: string;
  uoM: string;
  quantity: number;
  totalValues: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  saleType: string;
  sroItemSerialNo: string;
}

export interface FBRApiResponse {
  status: string;
  message: string;
  invoiceNumber?: string;
  InvoiceNumber?: string; // Add PascalCase fallback
  errors?: string[];
  validationResponse?: {
    statusCode: string;
    status: string;
    error?: string;
    invoiceStatuses?: Array<{
      itemSNo: string;
      statusCode: string;
      status: string;
      invoiceNo: string;
      errorCode: string;
      error: string;
    }>;
  };
}

// Invoice Management Types
export interface Invoice {
  invoiceID: string;
  companyID: string;
  invoiceType: string;
  invoiceDate: string;
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
  invoiceRefNo: string;
  poNumber?: string;
  fbrInvoiceNumber?: string;
  items: InvoiceItem[];
  totalAmount: number;
  totalSalesTax: number;
  totalFurtherTax: number;
  totalDiscount: number;
  scenarioID: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface InvoiceItem {
  itemID?: string;
  invoiceID?: string;
  hsCode: string;
  productDescription: string;
  rate: string;
  uoM: string;
  quantity: number;
  totalValues: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  saleType: string;
  sroItemSerialNo: string;
  unitPrice?: number;
  salesTax?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Province Types
export interface Province {
  id: string;
  name: string;
  code: string;
}

export interface ProvincesApiResponse {
  status: string;
  message?: string;
  data?: Province[];
  errors?: string[];
}

// Document Type interfaces
export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface DocumentTypesApiResponse {
  data: DocumentType[];
  success: boolean;
  message?: string;
}

// Item Description Code interfaces
export interface ItemDescriptionCode {
  id: string;
  code: string;
  description: string;
  hsCode?: string;
}

export interface ItemDescriptionCodesApiResponse {
  data: ItemDescriptionCode[];
  success: boolean;
  message?: string;
}

// SRO Item Code interfaces
export interface SroItemCode {
  id: string;
  code: string;
  description: string;
  rate?: number;
}

export interface SroItemCodesApiResponse {
  data: SroItemCode[];
  success: boolean;
  message?: string;
}

// Transaction Type interfaces
export interface TransactionType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface TransactionTypesApiResponse {
  data: TransactionType[];
  success: boolean;
  message?: string;
}

// UOM interfaces
export interface UnitOfMeasurement {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface UomApiResponse {
  data: UnitOfMeasurement[];
  success: boolean;
  message?: string;
}

// SRO Schedule interfaces
export interface SroSchedule {
  id: string;
  scheduleNo: string;
  description: string;
  rate: number;
  effectiveDate: string;
}

export interface SroScheduleApiResponse {
  data: SroSchedule[];
  success: boolean;
  message?: string;
}

// Sale Type to Rate interfaces
export interface SaleTypeRate {
  id: string;
  rateId: string;
  saleType: string;
  rate: number;
  description?: string;
}

export interface SaleTypeRateApiResponse {
  data: SaleTypeRate[];
  success: boolean;
  message?: string;
}
