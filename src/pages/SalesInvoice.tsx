import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Grid,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Info as InfoIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { itemsApi, Item } from '../api/itemsApi';
import { invoiceAPI } from '../services/invoiceApi';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import fbrApiService from '../api/fbrApi';
import SalesInvoiceReport from '../components/SalesInvoiceReport';
// Scenario mapping imports removed - business activities and sectors now come from company profile

// Types for the invoice form
interface InvoiceItem {
  id: string;
  hsCodeDescription: string;
  productDescription: string;
  rate: string;
  uom: string;
  quantity: number;
  valueSalesExclST: number;
  salesTax: number;
  stWithheldAtSource: number;
  totalValueSales: number;
  extraTax: number;
  fixedNotifiedValue: number;
  furtherTax: number;
  sroScheduleNo: string;
  itemSrNo: string;
}

interface InvoiceFormData {
  buyerRegistrationNo: string;
  buyerName: string;
  buyerType: string;
  invoiceType: string;
  transactionType: string;
  invoiceNo: string;
  invoiceDate: string;
  saleOriginationProvince: string;
  destinationOfSupply: string;
  saleType: string;
  items: InvoiceItem[];
  transactionType: string;
}

// Dropdown options
const buyerTypes = [
  'Unregistered',
  'Registered',
  'Unregistered Distributor',
  'Retail Consumer'
];

const invoiceTypes = [
  'Select',
  'Sale Invoice',
  'Credit Note',
  'Debit Note',
  'Commercial Invoice'
];

const provinces = [
  'Select',
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir'
];

const transactionTypes = [
  'Select',
  'Domestic Supply',
  'Export',
  'Import',
  'Zero Rated Supply',
  'POS'
];

// Mapping function to convert database invoice type to transaction type
const mapInvoiceTypeToTransactionType = (invoiceType: string): string => {
  const mapping: { [key: string]: string } = {
    'Sale Invoice': 'Domestic Supply',
    'Export Invoice': 'Export',
    'Import Invoice': 'Import',
    'Zero Rated Invoice': 'Zero Rated Supply',
    'POS Invoice': 'POS'
  };
  return mapping[invoiceType] || 'Select';
};

// Mapping function to convert transaction type back to database invoice type
const mapTransactionTypeToInvoiceType = (transactionType: string): string => {
  const mapping: { [key: string]: string } = {
    'Domestic Supply': 'Sale Invoice',
    'Export': 'Export Invoice',
    'Import': 'Import Invoice',
    'Zero Rated Supply': 'Zero Rated Invoice',
    'POS': 'POS Invoice'
  };
  return mapping[transactionType] || 'Sale Invoice';
};

const saleTypes = [
  'Select',
  'Goods at standard rate (default)',
'Goods at Reduced Rate',
'Goods at zero-rate',
'Petroleum Products',
'Electricity Supply to Retailers',
'SIM',
'Gas to CNG stations',
'Mobile Phones',
'Rerollable scrap by ship breakers',
'Processing/Conversion of Goods',
'3rd Schedule Goods',
'Goods (FED in ST Mode)',
'Services (FED in ST Mode)',
'Services',
'Exempt goods',
'DTRE goods',
'Cotton ginners',
'Electric Vehicle',
'Cement /Concrete Block',
'Telecommunication services',
'Steel melting and re-rolling',
'Ship breaking',
'Potassium Chlorate',
'Non-Adjustable Supplies',
'Goods as per SRO.297(|)/2023',
'CNG Sales',
'Toll Manufacturing'
];

// HS Code options will be fetched from Items API

const sroScheduleOptions = [
  'Select',
  '01(I)/2022',
'1007(I)/2005',
'1125(I)/2011',
'1167(I)/2018',
'1180(I)/2016',
'1212(I)/2018',
'125(I)/2017',
'1308(I)/2018',
'1450(I)/2021',
'1579(1)/2021',
'1604(I)/2021',
'1636(1)/2022',
'164(I)/2010',
'172(I)/2006',
'183(I)/2022',
'188(I)/2015',
'1st Schedule FED',
'21(I)/2017',
'213(I)/2013',
'223(I)/2017',
'237(I)/2020',
'253(I)/2019',
'292(I)/2017',
'297(I)/2023-Table-I',
'297(I)/2023-Table-II',
'321(I)/2022',
'326(I)/2008',
'327(I)/2008',
'398(I)/2015',
'3rd Schd Table II',
'3rd Schedule goods',
'408(I)/2012',
'408(I)/2017',
'484(I)/2015',
'495(I)/2016',
'499(I)/2013',
'501(I)/2013',
'525(I)/2008',
'539(I)/2008',
'542(I)/2008',
'549(I)/2008',
'551(I)/2008',
'572(I)/2014',
'581(1)/2024',
'581(I)/2017',
'587(I)/2017',
'590(I)/2017',
'5th Schedule',
'608(I)/2012',
'641(I)/2017',
'646(I)/2005',
'657(I)/2013',
'670(I)/2013',
'678(I)/2004',
'6th Schd Table I',
'6th Schd Table II',
'6th Schd Table III',
'6th Schedule',
'713(I)/2017',
'727(I)/2011',
'757(I)/2017',
'76(I)/2008',
'760(I)/2012',
'777(I)2018',
'781(I)2018',
'79(I)/2012',
'802(I)/2009',
'811(I)/2009',
'863(I)/2007',
'867(I)/2017',
'88(I)/2022',
'880(I)/2007',
'896(I)/2013',
'898(I)/2013',
'8th Schedules',
'91(I)/2017',
'946(1)/2013',
'984(I)/2017',
'9th Schedule',
'9th Schedules',
'DTRE',
'EIGHTH SCHEDULE Table 1',
'EIGHTH SCHEDULE Table 2',
'FED 3rd Schd Table I',
'FED 3rd Schd Table II',
'FIFTH SCHEDULE',
'ICTO',
'ICTO TABLE I',
'ICTO TABLE II',
'NINTH SCHEDULE',
'Section 4(b)',
'SECTION 49',
'SRO 342 (I)/2002',
'Zero Rated Elec.',
'Zero Rated Gas',
'S.R.O. 1217(I)/2025'
];

const itemSrNoOptions = [
  'Select',
  '1',
'1(A)',
'1(B)',
'1(E)',
'1(F)',
'1(G)',
'1(i)',
'1(i)(a)',
'1(i)(b)',
'1(i)(i)',
'1(ii)',
'1(ii)(a)',
'1(ii)(b)',
'1(ii)(ii)(a)',
'1(ii)(ii)(b)',
'1(iii)',
'1(iv)',
'1(v)',
'1(vi)',
'10',
'100',
'100A',
'100A((i))',
'100A((ii))',
'100A((iii))',
'100B',
'100B((i))',
'100B((ii))',
'100B((iii))',
'100B((iv))',
'100B((v))',
'100B((vi))',
'100C',
'101',
'102',
'103',
'104',
'104(a)',
'104(b)',
'104(c)',
'104(d)',
'104(e)',
'104(f)',
'104(g)',
'104(h)',
'105',
'106',
'107',
'108',
'108(a)',
'108(b)',
'108(c)',
'108(d)',
'108(e)',
'108(f)',
'108(g)',
'108(h)',
'108(i)',
'108(j)',
'108(k)',
'109',
'11',
'11(a)',
'11(b)',
'11(i)',
'11(ii)',
'11(iii)',
'11(iv)',
'11(v)',
'11(vi)',
'11(vii)',
'11(viii)',
'110',
'110(a)',
'110(b)',
'110(c)',
'110(d)',
'110(e)',
'110(f)',
'110(g)',
'110(h)',
'110(i)',
'110(j)',
'111',
'112',
'112A',
'112A(i)',
'112A(ii)',
'112A(iii)',
'112A(iv)',
'112A(ix)',
'112A(v)',
'112A(vi)',
'112A(vii)',
'112A(viii)',
'112A(x)',
'112A(xi)',
'112A(xii)',
'112A(xiii)',
'112A(xiv)',
'112A(xix)',
'112A(xv)',
'112A(xvi)',
'112A(xvii)',
'112A(xviii)',
'112A(xx)',
'112A(xxi)',
'112A(xxii)',
'112A(xxiii)',
'112A(xxiv)',
'112A(xxv)',
'112B',
'112B(i)',
'112B(ii)',
'112B(iii)',
'112B(iv)',
'112B(v)',
'112B(vi)',
'112B(vii)',
'112C',
'112C(i)',
'112C(ii)',
'112C(iii)',
'112C(iv)',
'112C(ix)',
'112C(v)',
'112C(vi)',
'112C(vii)',
'112C(viii)',
'112C(x)',
'112D',
'112E',
'112F',
'112G',
'112H',
'112H(i)',
'112H(ii)',
'112H(iii)',
'112H(iv)',
'112H(ix)',
'112H(v)',
'112H(vi)',
'112H(vii)',
'112H(viii)',
'112H(x)',
'112H(xi)',
'112I',
'112I(i)',
'112J',
'112J(i)',
'112J(ii)',
'112J(iii)',
'112J(iv)',
'112J(ix)',
'112J(v)',
'112J(vi)',
'112J(vii)',
'112J(viii)',
'112J(viii)(a)',
'112J(viii)(b)',
'112J(viii)(c)',
'112J(x)',
'112J(xi)',
'112J(xii)',
'112K',
'112K(i)',
'112K(ii)',
'112K(iii)',
'112K(iv)',
'112K(ix)',
'112K(v)',
'112K(vi)',
'112K(vii)',
'112K(viii)',
'112K(x)',
'112K(xi)',
'112K(xii)',
'112K(xiii)',
'112K(xiv)',
'112K(xv)',
'112K(xvi)',
'112K(xvii)',
'112K(xviii)',
'112L',
'113',
'113(i)',
'113(ii)',
'113(iii)',
'114',
'114(i)',
'114(ii)',
'115',
'116',
'117',
'118',
'119',
'12',
'12(xix)',
'12(xvii)',
'12(xx)',
'12(xxi)',
'12(xxii)',
'12(xxiii)',
'12(xxiv)',
'12(xxv)',
'12(xxvi)',
'12(xxvii)',
'120',
'121',
'122',
'123',
'124',
'125',
'126',
'127',
'128',
'129',
'13',
'130',
'131',
'132',
'133',
'134',
'135',
'136',
'137',
'138',
'139',
'14',
'14(1)',
'14(1)(i)',
'14(1)(ii)',
'14(1)(iii)',
'14(1)(iv)',
'14(1)(v)',
'14(1)(vi)',
'14(2)',
'140',
'141',
'142',
'143',
'143(i)',
'143(i)(a)',
'143(i)(b)',
'143(i)(c)',
'143(i)(d)',
'144',
'145',
'145(i)',
'145(ii)',
'145(iii)',
'145(iv)',
'145(ix)',
'145(v)',
'145(vi)',
'145(vii)',
'145(viii)',
'145(x)',
'146',
'146(a)',
'146(b)',
'146(c)',
'146(d)',
'146(e)',
'146(f)',
'146(g)',
'146(h)',
'146(i)',
'146(j)',
'147',
'148',
'149',
'14A',
'14A(10)',
'14A(11)',
'14A(12)',
'14A(12a)',
'14A(12b)',
'14A(12b)(i)',
'14A(12b)(ii)',
'14A(12b)(iii)',
'14A(12b)(iv)',
'14A(12b)(v)',
'14A(12b)(vi)',
'14A(13)',
'14A(14)',
'14A(14)(i)',
'14A(14)(ii)',
'14A(14)(iii)',
'14A(14)(iv)',
'14A(14)(ix)',
'14A(14)(v)',
'14A(14)(vi)',
'14A(14)(vii)',
'14A(14)(viii)',
'14A(14)(x)',
'14A(1a)',
'14A(1b)',
'14A(1b)(i)',
'14A(1b)(ii)',
'14A(1b)(iii)',
'14A(1b)(iv)',
'14A(1b)(v)',
'14A(1b)(vi)',
'14A(2a)',
'14A(2b)',
'14A(2b)(i)',
'14A(2b)(ii)',
'14A(2b)(iii)',
'14A(2b)(iv)',
'14A(2b)(v)',
'14A(3a)',
'14A(3b)',
'14A(3b)(i)',
'14A(3b)(ii)',
'14A(3b)(iii)',
'14A(3b)(iv)',
'14A(3b)(v)',
'14A(3b)(vi)',
'14A(4a)',
'14A(4b)',
'14A(4b)(i)',
'14A(4b)(ii)',
'14A(4b)(iii)',
'14A(4b)(iv)',
'14A(4b)(v)',
'14A(5)',
'14A(6a)',
'14A(6b)',
'14A(6b)(i)',
'14A(6b)(ii)',
'14A(6b)(iii)',
'14A(6b)(iv)',
'14A(6c)',
'14A(6c)(i)',
'14A(6c)(ii)',
'14A(6c)(iii)',
'14A(6c)(iv)',
'14A(6c)(v)',
'14A(6c)(vi)',
'14A(7a)',
'14A(7b)',
'14A(7b)(i)',
'14A(7b)(ii)',
'14A(7b)(iii)',
'14A(7b)(iv)',
'14A(7b)(ix)',
'14A(7b)(v)',
'14A(7b)(vi)',
'14A(7b)(vii)',
'14A(7b)(viii)',
'14A(7b)(x)',
'14A(7b)(xi)',
'14A(8)',
'14A(8)(i)',
'14A(8)(ii)',
'14A(8)(iii)',
'14A(8)(iv)',
'14A(8)(v)',
'14A(8)(vi)',
'14A(8)(vii)',
'14A(8)(viii)',
'14A(9)',
'15',
'15(a)',
'15(b)',
'15(c.)',
'15(i)',
'15(ii)',
'15(iii)',
'15(iv)',
'15(ix)',
'15(v)',
'15(vi)',
'15(vii)',
'15(viii)',
'15(x)',
'15(xi)',
'15(xii)',
'15(xiii)',
'15(xiv)',
'15(xv)',
'15(xvi)',
'150',
'150(a)',
'150(b)',
'151(a)',
'151(b)',
'152',
'153',
'154',
'155',
'156',
'159',
'15A(i)',
'15A(ii)',
'15A(iii)',
'15A(iv)',
'16',
'160',
'163',
'164',
'165',
'166',
'167',
'168',
'169',
'17',
'170',
'171',
'172',
'173',
'174',
'175',
'176',
'176(i)',
'176(ii)',
'176(iii)',
'176(iv)',
'177',
'178',
'179',
'18',
'18(i)',
'18(ii)',
'18(iii)',
'18(iv)',
'18(ix)',
'18(v)',
'18(vi)',
'18(vii)',
'18(viii)',
'18(x)',
'18(xi)',
'18(xii)',
'18(xiii)',
'18(xiv)',
'18(xix)',
'18(xv)',
'18(xvi)',
'18(xvii)',
'18(xviii)',
'18(xx)',
'18(xxi)',
'180',
'181',
'19',
'2',
'2(i)',
'2(ii)',
'2(ii)(a)',
'2(ii)(b)',
'2(iii)',
'20',
'21',
'22',
'23',
'24',
'25',
'26',
'26(i)',
'26(ii)',
'26(iii)',
'26(iv)',
'26(ix)',
'26(v)',
'26(vi)',
'26(vii)',
'26(viii)',
'26(x)',
'26(xi)',
'26(xii)',
'26(xiii)',
'26(xiv)',
'26(xix)',
'26(xv)',
'26(xvi)',
'26(xvii)',
'26(xviii)',
'27',
'27(i)',
'27(ii)',
'27(iii)',
'27(iv)',
'27(v)',
'27(vi)',
'27(vii)',
'28',
'28(i)',
'28(ii)',
'28(iii)',
'28(iv)',
'28(v)',
'28(vi)',
'29',
'29(i)',
'29(ii)',
'29(iii)',
'29(iv)',
'29(ix)',
'29(v)',
'29(vi)',
'29(vii)',
'29(viii)',
'29(x)',
'29(xi)',
'29(xii)',
'29(xiii)',
'29(xiv)',
'29(xv)',
'29(xvi)',
'29(xvii)',
'29(xviii)',
'29C',
'2A',
'2A(i)',
'2A(ii)',
'2A(iii)',
'2A(iv)',
'2A(ix)',
'2A(v)',
'2A(vi)',
'2A(vii)',
'2A(viii)',
'2B',
'2B(i)',
'2B(ii)',
'2B(iii)',
'2C',
'2C(i)',
'2C(ii)',
'2D',
'2D(i)',
'2D(ii)',
'2E',
'2F',
'3',
'3(1A)',
'3(i)',
'3(ii)',
'30',
'30(i)',
'30(ii)',
'31',
'32',
'33',
'34',
'34(1)',
'34(2)',
'34(3)',
'34(4)',
'35',
'36',
'37',
'38',
'39',
'4',
'4(1)',
'4(2)',
'40',
'41',
'42',
'43',
'44',
'45',
'45(i)',
'45(ii)',
'45(iii)',
'45(iv)',
'45v',
'45vi',
'46',
'47',
'48',
'49',
'5',
'5(i)',
'5(ii)',
'50',
'51',
'52',
'52A',
'53',
'53(i)',
'53(ii)',
'53(iii)',
'53(iv)',
'53(ix)',
'53(v)',
'53(vi)',
'53(vii)',
'53(viii)',
'53(x)',
'53(xi)',
'53(xii)',
'53(xiii)',
'53(xiv)',
'53(xix)',
'53(xv)',
'53(xvi)',
'53(xvii)',
'53(xviii)',
'54',
'55',
'56',
'56(i)',
'56(ii)',
'57',
'58',
'59',
'6',
'6(A)',
'6(A)(i)',
'6(A)(ii)',
'6(A)(iii)',
'6(A)(iv)',
'6(A)(ix)',
'6(A)(v)',
'6(A)(vi)',
'6(A)(vii)',
'6(A)(viii)',
'6(A)(x)',
'6(i)',
'6(ii)',
'60',
'61',
'62',
'63',
'64',
'65',
'66',
'67',
'68',
'69',
'7',
'7(i)',
'7(ii)',
'70',
'70(i)',
'70(ii)',
'70(iii)',
'70(iv)',
'70(v)',
'70(vi)',
'71',
'72',
'73',
'73(a)',
'73(b)',
'73A',
'74',
'75',
'76',
'77',
'78',
'79',
'8',
'8(1)',
'8(2)',
'8(3)',
'8(4)',
'8(5)',
'8(i)',
'8(i)(a)',
'8(i)(b)',
'8(i)(c)',
'8(ii)',
'80',
'81',
'82',
'83',
'84',
'84(i)',
'84(ii)',
'84(iii)',
'84(iv)',
'84(v)',
'84(vi)',
'84(vii)',
'85',
'86',
'87',
'88',
'89',
'8A',
'9',
'9(i)',
'9(ii)',
'9(iii)',
'9(iv)',
'9(ix)',
'9(v)',
'9(vi)',
'9(vii)',
'9(viii)',
'9(x)',
'9(xi)',
'9(xii)',
'9(xiii)',
'9(xiv)',
'9(xix)',
'9(xv)',
'9(xvi)',
'9(xvii)',
'9(xviii)',
'9(xx)',
'9(xxi)',
'9(xxii)',
'9(xxiii)',
'90',
'91',
'92',
'93',
'94',
'95',
'96',
'97',
'98',
'99',
'Region-I',
'Region-II'

];

const SalesInvoice: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('Sales');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  const [sendingToFBR, setSendingToFBR] = useState(false);
  const [fbrResponse, setFbrResponse] = useState<any>(null);
  const [showFbrPreview, setShowFbrPreview] = useState(false);
  const [fbrPayloadPreview, setFbrPayloadPreview] = useState<any>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    buyerRegistrationNo: '',
    buyerName: '',
    buyerType: 'Unregistered',
    invoiceType: 'Select',
    transactionType: 'Select',
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    saleOriginationProvince: 'Select',
    destinationOfSupply: 'Select',
    saleType: 'Select',
    items: []
  });

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await itemsApi.getAllItems();
        if (response.success && Array.isArray(response.data)) {
          setItems(response.data);
        } else {
          console.error('Failed to fetch items:', response.message);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };

    fetchItems();
  }, []);

  // Load invoice data when in edit mode
  useEffect(() => {
    const loadInvoiceForEdit = async () => {
      if (invoiceId && items.length > 0) {
        setIsEditMode(true);
        try {
          const response = await invoiceAPI.getInvoiceById(invoiceId);
           if (response.success && response.data) {
             const invoice = Array.isArray(response.data) ? response.data[0] : response.data;
             setEditingInvoice(invoice);
            
            // Map invoice data to form data
            setFormData({
              buyerRegistrationNo: invoice.buyerNTNCNIC || '',
              buyerName: invoice.buyerBusinessName || '',
              buyerType: invoice.buyerRegistrationType || 'Unregistered',
              invoiceType: invoice.invoiceType || 'Select',
              transactionType: mapInvoiceTypeToTransactionType(invoice.invoiceType || ''), // Map from invoiceType field
              invoiceNo: invoice.invoiceRefNo || '',
              invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
              saleOriginationProvince: invoice.sellerProvince || 'Select',
              destinationOfSupply: invoice.buyerProvince || 'Select',
              saleType: invoice.items && invoice.items.length > 0 ? invoice.items[0].saleType || 'Select' : 'Select', // Map from first item's saleType

              items: invoice.items.map((item: any) => {
                // Find matching item from items list to get full description
                const matchingApiItem = items.find(apiItem => apiItem.hsCode === item.hsCode);
                const hsCodeDescription = matchingApiItem 
                  ? `${matchingApiItem.hsCode} - ${matchingApiItem.description}`
                  : item.hsCode || 'Select';
                  
                return {
                  id: item.itemID || Math.random().toString(36).substr(2, 9),
                  hsCodeDescription: hsCodeDescription,
                productDescription: item.productDescription || '',
                rate: item.rate || 'Select',
                uom: item.uoM || 'Select',
                quantity: item.quantity || 0,
                valueSalesExclST: item.valueSalesExcludingST || 0,
                salesTax: item.salesTaxApplicable || 0,
                stWithheldAtSource: item.salesTaxWithheldAtSource || 0,
                totalValueSales: item.totalValues || 0,
                extraTax: item.extraTax || 0,
                fixedNotifiedValue: item.fixedNotifiedValueOrRetailPrice || 0,
                furtherTax: item.furtherTax || 0,
                sroScheduleNo: item.sroScheduleNo || 'Select',
                itemSrNo: item.sroItemSerialNo || 'Select',
                saleType: item.saleType || 'Select'
              };
            })
            });
          }
        } catch (error) {
          console.error('Error loading invoice for edit:', error);
          setNotification({
            open: true,
            message: 'Failed to load invoice data',
            severity: 'error'
          });
        }
      } else {
        setIsEditMode(false);
        setEditingInvoice(null);
      }
    };

    loadInvoiceForEdit();
  }, [invoiceId, items]);

  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    id: '',
    hsCodeDescription: 'Select',
    productDescription: '',
    rate: 'Select',
    uom: 'Select',
    quantity: 0,
    valueSalesExclST: 0,
    salesTax: 0,
    stWithheldAtSource: 0,
    totalValueSales: 0,
    extraTax: 0,
    fixedNotifiedValue: 0,
    furtherTax: 0,
    sroScheduleNo: 'Select',
    itemSrNo: 'Select'
  });

  const handleInputChange = (field: keyof InvoiceFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-populate fields when Sale Type is set to "Exempt goods"
    if (field === 'saleType' && value === 'Exempt goods') {
      setCurrentItem(prev => ({
        ...prev,
        rate: 'Exempt',
        sroScheduleNo: '6th Schd Table I',
        itemSrNo: '100'
      }));
    }

    // Auto-populate fields when Sale Type is set to "Goods at zero-rate"
    if (field === 'saleType' && value === 'Goods at zero-rate') {
      setCurrentItem(prev => ({
        ...prev,
        rate: 'Exempt',
        sroScheduleNo: '327(I)/2008',
        itemSrNo: '1'
      }));
    }

    // Auto-populate fields when Sale Type is set to "Goods at Reduced Rate"
    if (field === 'saleType' && value === 'Goods at Reduced Rate') {
      setCurrentItem(prev => ({
        ...prev,
        rate: '1%',
        sroScheduleNo: 'EIGHTH SCHEDULE Table 1',
        itemSrNo: '82'
      }));
    }

    // Auto-populate fields when Sale Type is set to "SRO.297(I)/2023"
    if (field === 'saleType' && value === 'Goods as per SRO.297(I)/2023') {
      setCurrentItem(prev => ({
        ...prev,
        sroScheduleNo: '297(I)/2023-Table-I',
        itemSrNo: '12'
      }));
    }

    // Auto-populate fields when Sale Type is set to "SRO.297(|)/2023" (pipe character version)
    if (field === 'saleType' && value === 'Goods as per SRO.297(|)/2023') {
      setCurrentItem(prev => ({
        ...prev,
        sroScheduleNo: '297(I)/2023-Table-I',
        itemSrNo: '12'
      }));
    }
  };

  // Helper function to check if SRO fields should be disabled
  const isSroFieldsDisabled = () => {
    return formData.saleType === 'Goods as per SRO.297(I)/2023' || 
           formData.saleType === 'Goods as per SRO.297(|)/2023' ||
           formData.saleType === 'Goods at Reduced Rate';
  };

  // Helper function to check if Rate field should be disabled
  const isRateFieldDisabled = () => {
     return formData.saleType === 'Exempt goods';
  };

  const handleItemChange = (field: keyof InvoiceItem, value: string | number) => {
    // Prevent changes to SRO fields when sale type is SRO.297 (both I and | versions) or Goods at Reduced Rate
    if (isSroFieldsDisabled() && (field === 'sroScheduleNo' || field === 'itemSrNo')) {
      return;
    }

    // Prevent changes to Rate field when sale type is "Goods at Reduced Rate"
    if (isRateFieldDisabled() && field === 'rate') {
      return;
    }

    setCurrentItem(prev => {
      const updatedItem = {
        ...prev,
        [field]: value
      };

      // Auto-populate tax rate and UoM when HS Code is selected
      if (field === 'hsCodeDescription' && typeof value === 'string' && value !== 'Select') {
        // Find the selected item from the items array
        const selectedItem = items.find(item => 
          `${item.hsCode} - ${item.description}` === value
        );
        
        if (selectedItem) {
          updatedItem.rate = selectedItem.salesTaxValue.toString() + '%';
          updatedItem.uom = selectedItem.uom;
          updatedItem.productDescription = selectedItem.description;
        }
      }

      // Auto-calculate Sales Tax when Value of Sales Excl. ST or Rate changes
      if (field === 'valueSalesExclST' || field === 'rate') {
        const valueSalesExclST = field === 'valueSalesExclST' ? (value as number) : updatedItem.valueSalesExclST;
        const rateString = field === 'rate' ? (value as string) : updatedItem.rate;
        
        // Extract numeric tax rate from rate string (e.g., "18%" -> 18)
        const taxRateMatch = rateString.match(/^(\d+(?:\.\d+)?)%?$/);
        if (taxRateMatch && valueSalesExclST > 0) {
          const taxRate = parseFloat(taxRateMatch[1]);
          updatedItem.salesTax = (valueSalesExclST * taxRate) / 100;
        } else if (valueSalesExclST === 0) {
          updatedItem.salesTax = 0;
        }
      }

      return updatedItem;
    });
  };

  const addItem = () => {
    if (currentItem.hsCodeDescription !== 'Select' && currentItem.productDescription) {
      const newItem = {
        ...currentItem,
        id: Date.now().toString()
      };
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      // Reset current item with proper sales tax reset
      setCurrentItem({
        id: '',
        hsCodeDescription: 'Select',
        productDescription: '',
        rate: 'Select',
        uom: 'Select',
        quantity: 0,
        valueSalesExclST: 0,
        salesTax: 0,
        stWithheldAtSource: 0,
        totalValueSales: 0,
        extraTax: 0,
        fixedNotifiedValue: 0,
        furtherTax: 0,
        sroScheduleNo: 'Select',
        itemSrNo: 'Select'
      });
    }
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const editItem = (item: InvoiceItem) => {
    // Remove the item from the list first
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== item.id)
    }));
    
    // Find the matching item from the items list to get the full hsCode - description format
    const matchingItem = items.find(apiItem => 
      item.hsCodeDescription && 
      (apiItem.hsCode === item.hsCodeDescription || 
       apiItem.hsCode === item.hsCodeDescription.split(' - ')[0])
    );
    
    const hsCodeDescriptionValue = matchingItem 
      ? `${matchingItem.hsCode} - ${matchingItem.description}`
      : item.hsCodeDescription || 'Select';
    
    // Populate the form with the item's data
    setCurrentItem({
      id: item.id,
      hsCodeDescription: hsCodeDescriptionValue,
      productDescription: item.productDescription,
      rate: item.rate,
      uom: item.uom,
      quantity: item.quantity,
      valueSalesExclST: item.valueSalesExclST,
      salesTax: item.salesTax,
      stWithheldAtSource: item.stWithheldAtSource,
      totalValueSales: item.totalValueSales,
      extraTax: item.extraTax,
      fixedNotifiedValue: item.fixedNotifiedValue,
      furtherTax: item.furtherTax,
      sroScheduleNo: item.sroScheduleNo,
      itemSrNo: item.itemSrNo
    });
  };

  const clearForm = () => {
    setFormData({
      buyerRegistrationNo: '',
      buyerName: '',
      buyerType: 'Unregistered',
      invoiceType: 'Select',
      transactionType: 'Select',
      invoiceNo: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      saleOriginationProvince: 'Select',
      destinationOfSupply: 'Select',
      saleType: 'Select',
      items: []
    });
    setCurrentItem({
      id: '',
      hsCodeDescription: 'Select',
      productDescription: '',
      rate: 'Select',
      uom: 'Select',
      quantity: 0,
      valueSalesExclST: 0,
      salesTax: 0,
      stWithheldAtSource: 0,
      totalValueSales: 0,
      extraTax: 0,
      fixedNotifiedValue: 0,
      furtherTax: 0,
      sroScheduleNo: 'Select',
      itemSrNo: 'Select'
    });
    setInvoiceSaved(false);
    // Don't reset FBR response if invoice was successfully submitted to FBR
    // This ensures the invoice remains locked after successful submission
    if (!isInvoiceSentToFBR()) {
      setFbrResponse(null);
    }
  };

  // Function to determine FBR scenario based on invoice data
  const determineFbrScenario = () => {
    // Use scenario mapping logic based on company's business activities and sectors
    // TODO: Get business activities and sectors from company profile instead of form
    
    // Use legacy logic for scenario determination based on sale type and items
    // SN004: Sale of Steel Scrap by Ship Breakers
    if (formData.saleType === 'Ship breaking' ||
        formData.items.some(item => 
          item.hsCodeDescription?.split(' - ')[0]?.startsWith('7204') || 
          item.productDescription?.toLowerCase().includes('scrap') ||
          item.productDescription?.toLowerCase().includes('ship breaking') ||
          item.productDescription?.toLowerCase().includes('ship breaker')
        )) {
      return 'SN004';
    }
    
    // SN003: Sale of Steel (Melted and Re-Rolled)
    if (formData.saleType === 'Steel melting and re-rolling' ||
        formData.items.some(item => 
          item.hsCodeDescription?.split(' - ')[0]?.startsWith('7214') || 
          item.productDescription?.toLowerCase().includes('steel') ||
          item.productDescription?.toLowerCase().includes('billet') ||
          item.productDescription?.toLowerCase().includes('ingot') ||
          item.productDescription?.toLowerCase().includes('bar')
        )) {
      return 'SN003';
    }
    
    // SN001: Sale of Standard Rate Goods to Registered Buyers
    if (formData.buyerType === 'Registered' && 
        formData.saleType === 'Goods at standard rate (default)' &&
        formData.items.some(item => item.rate === '18%')) {
      return 'SN001';
    }
    
    // SN002: Sale of Standard Rate Goods to Unregistered Buyers
    if (formData.buyerType === 'Unregistered' && 
        formData.saleType === 'Goods at standard rate (default)' &&
        formData.items.some(item => item.rate === '18%')) {
      return 'SN002';
    }
    
    // SN005: Reduced rate sale (Eighth Schedule)
    if (formData.saleType === 'Goods at Reduced Rate' &&
        formData.items.some(item => ['12%', '5%', '1%'].includes(item.rate))) {
      return 'SN005';
    }
    
    // SN006: Exempt goods sale (Sixth Schedule)
    if (formData.saleType === 'Exempt goods' ||
        formData.items.some(item => item.rate === 'Exempt')) {
      return 'SN006';
    }
    
    // SN007: Zero rate sale (Fifth Schedule)
    if (formData.saleType === 'Goods at zero-rate' &&
        formData.items.some(item => item.rate === '0%')) {
      return 'SN007';
    }
    
    // SN008: Sale of 3rd Schedule Goods
    
    if (formData.saleType === '3rd Schedule Goods' && 
        formData.buyerType === 'Unregistered') {
      return 'SN008';
    }


 // SN026: Sale of Standard Rate Goods to Retail Consumer Buyers
    if (formData.saleType === 'Goods at standard rate (default)' &&
        formData.items.some(item => item.rate === '20%')) {
      return 'SN026';
    }
    


    // SN009: Purchase From Registered Cotton Ginners
    if (formData.saleType === 'Cotton ginners') {
      return 'SN009';
    }
    
    // SN010: Sale Of Telecom Services by Mobile Operators
    if (formData.saleType === 'Telecommunication services') {
      return 'SN010';
    }
    
    // SN011: Sale of Steel through Toll Manufacturing (Billets, Ingots and Long Bars)
    if (formData.saleType === 'Toll Manufacturing') {
      return 'SN011';
    }
    
    // SN012: Sale Of Petroleum Products
    if (formData.saleType === 'Petroleum Products') {
      return 'SN012';
    }
    
    // SN013: Sale Of Electricity to Retailers
    if (formData.saleType === 'Electricity Supply to Retailers') {
      return 'SN013';
    }
    
    // SN014: Sale of Gas to CNG Stations
    if (formData.saleType === 'Gas to CNG stations') {
      return 'SN014';
    }
    
    // SN015: Sale of Mobile Phones
    if (formData.saleType === 'Mobile Phones') {
      return 'SN015';
    }
    
    // SN016: Processing/Conversion of Goods
    if (formData.saleType === 'Processing/Conversion of Goods') {
      return 'SN016';
    }
    
    // SN017: Sale of Goods Where FED Is Charged in ST Mode
    if (formData.saleType === 'Goods (FED in ST Mode)') {
      return 'SN017';
    }
    
    // SN018: Sale of Services Where FED Is Charged in ST Mode
    if (formData.saleType === 'Services (FED in ST Mode)') {
      return 'SN018';
    }
    
    // SN019: Sale of Services (as per ICT Ordinance)
    if (formData.saleType === 'Services') {
      return 'SN019';
    }
    
    // SN020: Sale of Electric Vehicles
    if (formData.saleType === 'Electric Vehicle') {
      return 'SN020';
    }
    
    // SN021: Sale of Cement/Concrete Block
    if (formData.saleType === 'Cement /Concrete Block') {
      return 'SN021';
    }
    
    // SN022: Sale of Potassium Chlorate
    if (formData.saleType === 'Potassium Chlorate') {
      return 'SN022';
    }
    
    // SN023: Sale of CNG
    if (formData.saleType === 'CNG Sales') {
      return 'SN023';
    }
    
    // SN024: Sale of Goods Listed in SRO 297(I)/2023
    if (formData.saleType === 'Goods as per SRO.297(I)/2023') {
      return 'SN024';
    }
    
    // SN024: Sale of Goods Listed in SRO 297(|)/2023 (pipe character version)
    if (formData.saleType === 'Goods as per SRO.297(|)/2023') {
      return 'SN024';
    }
    
    // SN025: Drugs Sold at Fixed ST Rate Under Serial 81 Of Eighth Schedule Table 1
    if (formData.saleType === 'Drugs (Eighth Schedule Table 1, Serial 81)') {
      return 'SN025';
    }
    
    // // SN026: Sale Of Goods at Standard Rate to End Consumers by Retailers
    // if (formData.saleType === 'Goods at standard rate to end consumers (retail)') {
    //   return 'SN026';
    // }
    
 // SN026: Sale of Standard Rate Goods to Retail Consumer Buyers
    if (formData.saleType === 'Goods at standard rate (default)' &&
         formData.transactionType === 'POS') {
      return 'SN026';
    }



    // SN027: Sale Of 3rd Schedule Goods to End Consumers by Retailers
    if (formData.saleType === '3rd Schedule Goods') {
      return 'SN027';
    }
    
    // SN028: Sale of Goods at Reduced Rate to End Consumers by Retailers
    if (formData.saleType === 'Goods at Reduced Rate') {
      return 'SN028';
    }
    
    // Default to SN001 for standard rate goods to registered buyers
    return 'SN001';
  };

  const prepareFbrPayload = () => {
    return {
      invoiceType: mapTransactionTypeToInvoiceType(formData.transactionType),
      invoiceDate: formData.invoiceDate,
      sellerBusinessName: currentCompany?.name || 'Company Name',
      sellerProvince: formData.saleOriginationProvince,
      sellerNTNCNIC: currentCompany?.ntnNumber || '1234567',
      sellerAddress: currentCompany?.address || 'Company Address',
      buyerNTNCNIC: formData.buyerRegistrationNo,
      buyerBusinessName: formData.buyerName,
      buyerProvince: formData.destinationOfSupply,
      buyerAddress: 'Buyer Address',
      invoiceRefNo: formData.invoiceNo,
      scenarioId: determineFbrScenario(),
      buyerRegistrationType: formData.buyerType,
      items: formData.items.map(item => ({
        hsCode: item.hsCodeDescription.split(' - ')[0] || '0101.2100',
        productDescription: item.productDescription,
        rate: item.rate,
        uoM: item.uom,
        quantity: item.quantity,
        totalValues: item.totalValueSales,
        valueSalesExcludingST: item.valueSalesExclST,
        fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValue,
        salesTaxApplicable: item.salesTax,
        salesTaxWithheldAtSource: item.stWithheldAtSource,
        extraTax: item.extraTax === 0 ? "" : item.extraTax,
        furtherTax: item.furtherTax,
        sroScheduleNo: item.sroScheduleNo,
        fedPayable: 0,
        discount: 0,
        saleType: formData.saleType,
        sroItemSerialNo: item.itemSrNo
      }))
    };
  };

  const sendToFBR = async () => {
    if (!invoiceSaved) {
      setNotification({
        open: true,
        message: 'Please save the invoice first before sending to FBR',
        severity: 'error'
      });
      return;
    }

    // Prepare and show FBR payload for verification
    const payload = prepareFbrPayload();
    setFbrPayloadPreview(payload);
    setShowFbrPreview(true);
  };

  const confirmSendToFBR = async () => {
    setSendingToFBR(true);
    setShowFbrPreview(false);
    try {
      // Note: FBR token is now stored in database and retrieved automatically
      
      // Get current company ID and verify token exists
      // First try to get from super admin selection, then fall back to current user's company
      const selectedCompanyId = localStorage.getItem('selectedCompanyId') || user?.companyId || currentCompany?.id;
      let storedToken;
      if (selectedCompanyId) {
        storedToken = await fbrApiService.getApiToken(selectedCompanyId);
      } else {
        storedToken = localStorage.getItem('fbr_api_token');
      }
      
      if (!storedToken) {
        throw new Error('No FBR API token configured. Please configure token in FBR Integration page.');
      }
      
      // Log company information being submitted
      const response = await fbrApiService.submitInvoice(fbrPayloadPreview);
      setFbrResponse(response);
      
      // Check if the validation response indicates success
      const isValid = response.validationResponse && response.validationResponse.status === 'Valid';
      
      if (isValid) {
        setNotification({
          open: true,
          message: 'Invoice successfully submitted to FBR!',
          severity: 'success'
        });
      } else {
        const errorMessage = response.validationResponse?.error || response.message || 'Unknown error';
        setNotification({
          open: true,
          message: `FBR submission failed: ${errorMessage}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error sending to FBR: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setSendingToFBR(false);
    }
  };

  const cancelSendToFBR = () => {
    setShowFbrPreview(false);
    setFbrPayloadPreview(null);
  };

  // Helper function to check if invoice has been successfully sent to FBR
  const isInvoiceSentToFBR = () => {
    return fbrResponse && fbrResponse.validationResponse && fbrResponse.validationResponse.status === 'Valid';
  };

  const handlePreviewInvoice = () => {
    if (!invoiceSaved) {
      setNotification({
        open: true,
        message: 'Please save the invoice first before previewing',
        severity: 'error'
      });
      return;
    }
    setShowInvoicePreview(true);
  };

  const handlePrintInvoice = () => {
    if (!invoiceSaved) {
      setNotification({
        open: true,
        message: 'Please save the invoice first before printing',
        severity: 'error'
      });
      return;
    }
    
    // Open preview modal first, then trigger print
    setShowInvoicePreview(true);
    
    // Delay print to allow modal to render
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const prepareInvoiceData = () => {
    return {
      invoiceType: mapTransactionTypeToInvoiceType(formData.transactionType),
      invoiceDate: formData.invoiceDate,
      sellerNTNCNIC: currentCompany?.ntnNumber || '1234567890123',
      sellerBusinessName: currentCompany?.name || 'Your Company Name',
      sellerProvince: formData.saleOriginationProvince,
      sellerAddress: currentCompany?.address || 'Your Company Address',
      buyerNTNCNIC: formData.buyerRegistrationNo,
      buyerBusinessName: formData.buyerName,
      buyerProvince: formData.destinationOfSupply,
      buyerAddress: 'Buyer Address',
      invoiceRefNo: formData.invoiceNo,
      buyerRegistrationType: formData.buyerType,
      scenarioId: determineFbrScenario(),
      items: formData.items.map(item => ({
        hsCode: item.hsCodeDescription.split(' - ')[0] || '',
        productDescription: item.productDescription,
        rate: item.rate,
        uoM: item.uom,
        quantity: item.quantity,
        valueSalesExcludingST: item.valueSalesExclST,
        fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValue,
        salesTaxApplicable: item.salesTax,
        salesTaxWithheldAtSource: item.stWithheldAtSource,
        extraTax: item.extraTax,
        furtherTax: item.furtherTax,
        sroScheduleNo: item.sroScheduleNo,
        fedPayable: 0,
        discount: 0,
        totalValues: item.totalValueSales,
        saleType: formData.saleType,
        sroItemSerialNo: item.itemSrNo
      }))
    };
  };

  const saveItem = () => {
    addItem();
  };

  const saveInvoice = async () => {
    // Validate required fields
    if (!formData.buyerRegistrationNo || !formData.buyerName || 
        formData.invoiceType === 'Select' || formData.transactionType === 'Select' ||
        formData.saleOriginationProvince === 'Select' || formData.destinationOfSupply === 'Select' ||
        formData.saleType === 'Select' || formData.items.length === 0) {
      setNotification({
        open: true,
        message: 'Please fill all required fields and add at least one item',
        severity: 'error'
      });
      return;
    }

    // Business activity and sector validation will be handled based on company profile
    // TODO: Implement validation based on logged-in company's business activities and sectors

    setSaving(true);
    try {
      // Calculate totals from items
      const totalAmount = formData.items.reduce((sum, item) => sum + item.totalValueSales, 0);
      const totalSalesTax = formData.items.reduce((sum, item) => sum + item.salesTax, 0);
      const totalFurtherTax = formData.items.reduce((sum, item) => sum + item.furtherTax, 0);
      const totalDiscount = formData.items.reduce((sum, item) => sum + 0, 0); // No discount field in current form

      // Transform form data to match backend API format
      const invoiceData = {
        invoiceID: '', // Will be generated by backend
        companyID: user?.companyId || '',
        invoiceType: mapTransactionTypeToInvoiceType(formData.transactionType),
        invoiceDate: formData.invoiceDate,
        sellerNTNCNIC: currentCompany?.ntnNumber || '1234567890123', // Use company NTN number
        sellerBusinessName: currentCompany?.name || 'Your Company Name',
        sellerProvince: formData.saleOriginationProvince,
        sellerAddress: currentCompany?.address || 'Your Company Address',
        buyerNTNCNIC: formData.buyerRegistrationNo,
        buyerBusinessName: formData.buyerName,
        buyerProvince: formData.destinationOfSupply,
        buyerAddress: 'Buyer Address', // You may want to add this field to the form
        buyerRegistrationType: formData.buyerType,
        invoiceRefNo: formData.invoiceNo,
        totalAmount,
        totalSalesTax,
        totalFurtherTax,
        totalDiscount,
        scenarioID: '1', // Default scenario
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || '',
        items: formData.items.map(item => ({
          hsCode: item.hsCodeDescription.split(' - ')[0] || '',
          productDescription: item.productDescription,
          rate: item.rate,
          uoM: item.uom,
          quantity: item.quantity,
          totalValues: item.totalValueSales,
          valueSalesExcludingST: item.valueSalesExclST,
          fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValue,
          salesTaxApplicable: item.salesTax,
          salesTaxWithheldAtSource: item.stWithheldAtSource,
          extraTax: item.extraTax,
          furtherTax: item.furtherTax,
          sroScheduleNo: item.sroScheduleNo,
          fedPayable: 0,
          discount: 0,
          saleType: formData.saleType,
          sroItemSerialNo: item.itemSrNo
        }))
      };

      const response = isEditMode && editingInvoice 
        ? await invoiceAPI.updateInvoice({ ...invoiceData, invoiceID: editingInvoice.invoiceID })
        : await invoiceAPI.createInvoice(invoiceData);
      
      if (response.success) {
        setInvoiceSaved(true);
        setNotification({
          open: true,
          message: isEditMode ? 'Invoice updated successfully!' : 'Invoice saved successfully!',
          severity: 'success'
        });
        // Don't clear form after successful save to allow FBR submission
        // clearForm();
      } else {
        setNotification({
          open: true,
          message: response.error || (isEditMode ? 'Failed to update invoice' : 'Failed to save invoice'),
          severity: 'error'
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error saving invoice: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper 
        sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          p: 2,
          mb: 3,
          borderRadius: 2
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {isEditMode ? 'Edit Invoice' : 'FBR Invoice Details'}
        </Typography>
      </Paper>

      {/* FBR Submission Status Banner */}
      {isInvoiceSentToFBR() && (
        <Paper 
          sx={{ 
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white',
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: '2px solid #4caf50'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LockIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Invoice Successfully Submitted to FBR
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                This invoice has been submitted to FBR and is now locked for editing. All form fields and actions are disabled.
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Tab Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={selectedTab}
            onChange={(e) => setSelectedTab(e.target.value)}
          >
            <FormControlLabel value="Purchases" control={<Radio />} label="Purchases" />
            <FormControlLabel value="Sales" control={<Radio />} label="Sales" />
          </RadioGroup>
        </FormControl>
      </Paper>

      {/* Main Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* First Row */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Buyer Registration No."
              value={formData.buyerRegistrationNo}
              onChange={(e) => handleInputChange('buyerRegistrationNo', e.target.value)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Buyer Name*"
              value={formData.buyerName}
              onChange={(e) => handleInputChange('buyerName', e.target.value)}
              required
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Buyer Type*"
              value={formData.buyerType}
              onChange={(e) => handleInputChange('buyerType', e.target.value)}
              required
              size="small"
              disabled={isInvoiceSentToFBR()}
            >
              {buyerTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Second Row */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Invoice Type*"
              value={formData.invoiceType}
              onChange={(e) => handleInputChange('invoiceType', e.target.value)}
              required
              size="small"
              disabled={isInvoiceSentToFBR()}
            >
              {invoiceTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Transaction Type*"
              value={formData.transactionType}
              onChange={(e) => handleInputChange('transactionType', e.target.value)}
              required
              size="small"
              disabled={isInvoiceSentToFBR()}
            >
              {transactionTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Invoice No."
              value={formData.invoiceNo}
              onChange={(e) => handleInputChange('invoiceNo', e.target.value)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>

          {/* Third Row */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Invoice Date*"
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
              required
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>

          {/* Fourth Row */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Sale Origination Province of Supplier*"
              value={formData.saleOriginationProvince}
              onChange={(e) => handleInputChange('saleOriginationProvince', e.target.value)}
              required
              size="small"
              disabled={isInvoiceSentToFBR()}
            >
              {provinces.map((province) => (
                <MenuItem key={province} value={province}>
                  {province}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Destination of Supply*"
              value={formData.destinationOfSupply}
              onChange={(e) => handleInputChange('destinationOfSupply', e.target.value)}
              required
              size="small"
              disabled={isInvoiceSentToFBR()}
            >
              {provinces.map((province) => (
                <MenuItem key={province} value={province}>
                  {province}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Sale Type*"
              value={formData.saleType}
              onChange={(e) => handleInputChange('saleType', e.target.value)}
              required
              size="small"
              disabled={isInvoiceSentToFBR()}
            >
              {saleTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>


        </Grid>
      </Paper>

      {/* Item Detail Section */}
      <Paper 
        sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          p: 2,
          mb: 2,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Item Detail
        </Typography>
      </Paper>

      {/* Item Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="HSCode Description"
              value={currentItem.hsCodeDescription}
              onChange={(e) => handleItemChange('hsCodeDescription', e.target.value)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            >
              <MenuItem value="Select">
                Select
              </MenuItem>
              {items.map((item) => (
                <MenuItem key={item.itemId} value={`${item.hsCode} - ${item.description}`}>
                  {item.hsCode} - {item.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Product Description"
              value={currentItem.productDescription}
              onChange={(e) => handleItemChange('productDescription', e.target.value)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Rate"
              value={currentItem.rate}
              onChange={(e) => handleItemChange('rate', e.target.value)}
              size="small"
              placeholder="Tax rate will auto-populate"
              disabled={isRateFieldDisabled()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Unit of Measurement"
              value={currentItem.uom}
              onChange={(e) => handleItemChange('uom', e.target.value)}
              size="small"
              placeholder="UoM will auto-populate"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Quantity / Electricity Units"
              type="number"
              value={currentItem.quantity}
              onChange={(e) => handleItemChange('quantity', parseFloat(e.target.value) || 0)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Value of Sales Excl. ST"
              type="number"
              value={currentItem.valueSalesExclST}
              onChange={(e) => handleItemChange('valueSalesExclST', parseFloat(e.target.value) || 0)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Sales Tax"
              type="number"
              value={currentItem.salesTax}
              onChange={(e) => handleItemChange('salesTax', parseFloat(e.target.value) || 0)}
              size="small"
              placeholder="Auto-calculated or manual entry"
              helperText="Auto-calculated: (Value Excl. ST × Tax Rate) or enter manually"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Fixed / notified value or Retail Price"
              type="number"
              value={currentItem.fixedNotifiedValue}
              onChange={(e) => handleItemChange('fixedNotifiedValue', parseFloat(e.target.value) || 0)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="ST withheld at Source"
              type="number"
              value={currentItem.stWithheldAtSource}
              onChange={(e) => handleItemChange('stWithheldAtSource', parseFloat(e.target.value) || 0)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Total Value of Sales(in case of FPAD only)"
              type="number"
              value={currentItem.totalValueSales}
              onChange={(e) => handleItemChange('totalValueSales', parseFloat(e.target.value) || 0)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Extra Tax"
              type="number"
              value={currentItem.extraTax}
              onChange={(e) => handleItemChange('extraTax', parseFloat(e.target.value) || 0)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Further Tax"
              type="number"
              value={currentItem.furtherTax}
              onChange={(e) => handleItemChange('furtherTax', parseFloat(e.target.value) || 0)}
              size="small"
              disabled={isInvoiceSentToFBR()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="SRO / Schedule No."
              value={currentItem.sroScheduleNo}
              onChange={(e) => handleItemChange('sroScheduleNo', e.target.value)}
              size="small"
              disabled={isSroFieldsDisabled()}
            >
              {sroScheduleOptions.map((sro) => (
                <MenuItem key={sro} value={sro}>
                  {sro}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Item Sr. No."
              value={currentItem.itemSrNo}
              onChange={(e) => handleItemChange('itemSrNo', e.target.value)}
              size="small"
              disabled={isSroFieldsDisabled()}
            >
              {itemSrNoOptions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={clearForm}
            disabled={isInvoiceSentToFBR()}
          >
            Close
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearForm}
            disabled={isInvoiceSentToFBR()}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveItem}
            disabled={currentItem.hsCodeDescription === 'Select' || !currentItem.productDescription || isInvoiceSentToFBR()}
          >
            Save Item
          </Button>
        </Box>
      </Paper>

      {/* Items List Table */}
      <Paper 
        sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          p: 2,
          mb: 2,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Item(s) List
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Sr. No.</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Invoice Type</TableCell>
              <TableCell>Invoice No.</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Product Description</TableCell>
              <TableCell>HSCode Description</TableCell>
              <TableCell>Sale Type</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Value Excl. Tax</TableCell>
              <TableCell>Sales Tax</TableCell>
              <TableCell>Total Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formData.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    No items added yet. Add items using the form above.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              formData.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => editItem(item)}
                        title="Edit Item"
                        disabled={isInvoiceSentToFBR()}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(item.id)}
                        title="Delete Item"
                        disabled={isInvoiceSentToFBR()}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{formData.invoiceType}</TableCell>
                  <TableCell>{formData.invoiceNo}</TableCell>
                  <TableCell>{item.productDescription}</TableCell>
                  <TableCell>{item.productDescription}</TableCell>
                  <TableCell>{item.hsCodeDescription}</TableCell>
                  <TableCell>{formData.saleType}</TableCell>
                  <TableCell>{item.rate}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.valueSalesExclST || 0}</TableCell>
                  <TableCell>{item.salesTax || 0}</TableCell>
                  <TableCell>{((parseFloat(String(item.valueSalesExclST || 0)) || 0) + (parseFloat(String(item.salesTax || 0)) || 0)).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* FBR Scenario Indicator */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: '#f3e5f5', border: '1px solid #9c27b0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <InfoIcon color="primary" />
          <Typography variant="h6" color="primary">
            FBR Scenario Information
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Applicable Scenario:</strong> {determineFbrScenario()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
           {determineFbrScenario() === 'SN001' && 'Sale of Standard Rate Goods to Registered Buyers - This applies to the sale of goods subject to the standard sales tax rate made to sales tax registered buyers.'}
           {determineFbrScenario() === 'SN002' && 'Sale of Standard Rate Goods to Unregistered Buyers - When goods subject to the standard sales tax rate are sold to buyers who are not registered for sales tax (usually individual consumers or small businesses not registered for tax), the seller charges the full sales tax. This is often a business-to-consumer (B2C) sale.'}
           {determineFbrScenario() === 'SN003' && 'Sale of Steel (Melted and Re-Rolled) - This applies to steel products including billets, ingots, and long bars. The steel sector requires strict traceability and compliance with sector-specific regulations. These goods are commonly traded by re-rollers and manufacturers with distinct tax treatment and may require additional notifications or SRO compliance.'}
           {determineFbrScenario() === 'SN004' && 'Sale of Steel Scrap by Ship Breakers - This applies to steel scrap recovered from dismantled ships by ship breakers. The ship-breaking industry has specialized tax treatment recognizing the unique industry context. Special rates or exemptions may apply, and tax compliance is tailored to the ship-breaking sector with specific regulatory requirements.'}
           {determineFbrScenario() === 'SN005' && 'Sales of Reduced Rate Goods (Eighth Schedule) - This applies to certain goods taxed at reduced sales tax rates (lower than the standard rate) to encourage affordability or protect consumers. The Eighth Schedule lists these goods, commonly including basic food items, medicines, or essential commodities. These goods typically have rates of 12%, 5%, or 1% instead of the standard 18% rate.'}
           {determineFbrScenario() === 'SN006' && 'Sale of Exempt Goods (Sixth Schedule) - This applies to goods listed in the Sixth Schedule that are completely exempt from sales tax. These exemptions reduce the tax burden on essential or socially important items such as certain agricultural products, medicines, basic necessities, and other goods deemed critical for public welfare. No sales tax is charged on these transactions.'}
           {determineFbrScenario() === 'SN007' && 'Sale of Zero-Rated Goods (Fifth Schedule) - Zero-rated goods are those on which sales tax is charged at 0%. While the seller does not charge sales tax to the buyer, the seller can claim input tax credits on purchases related to these goods. This is often applied to exported goods or specific industries to promote exports and reduce tax layering.'}
           {determineFbrScenario() === 'SN008' && 'Sale of 3rd Schedule Goods - Items listed under the Third Schedule are subject to sales tax based on their printed retail price rather than the transaction value. Manufacturers or importers pay sales tax at the point of production or import, not at the point of sale. This system ensures tax collection on goods with standardized retail pricing and prevents tax evasion through undervaluation of transaction prices.'}
           {determineFbrScenario() === 'SN009' && 'Purchase From Registered Cotton Ginners - This applies to purchases from registered cotton ginners, subject to specific rules under cotton trade taxation. The cotton industry has specialized tax treatment that may involve reverse charge mechanisms or specific input tax provisions. This scenario ensures proper compliance with cotton sector regulations and facilitates the agricultural supply chain while maintaining tax integrity.'}
           {determineFbrScenario() === 'SN010' && 'Sale Of Telecom Services by Mobile Operators - This applies to telecommunication services provided by mobile operators including calls, data, and SMS services. These services are subject to specific taxation rules separate from goods, with both Federal Excise Duty (FED) and General Sales Tax (GST) applicable. Tax rates may vary by province and include additional regulatory fees. Mobile operators must ensure compliance with telecom-specific tax regulations and proper documentation of service charges.'}
           {determineFbrScenario() === 'SN011' && 'Sale of Steel through Toll Manufacturing (Billets, Ingots and Long Bars) - This applies to toll manufacturing arrangements where a third-party processes raw steel into finished billets, ingots, or long bars on behalf of another business. The processor issues an invoice for conversion charges (service), while the principal may generate a separate invoice for the actual product sale. Sales tax treatment differs because ownership and processing roles are split, requiring careful documentation of both service charges and product values with appropriate tax applications.'}
           {determineFbrScenario() === 'SN012' && 'Sale Of Petroleum Products - This applies to petroleum products like petrol, diesel, lubricants, and other fuel-related items. These products often have distinct sales tax rates and are subject to federal excise duties due to their economic and environmental importance. Multiple layers of taxation may apply including sales tax, federal excise duty, and additional regulatory levies. Petroleum products require compliance with sector-specific regulations and may have different tax rates based on product type and usage category.'}
           {determineFbrScenario() === 'SN013' && 'Sale Of Electricity to Retailers - This applies to electricity sales to retailers who distribute power to end consumers. Electricity sales have unique tax implications with different treatment for wholesale versus retail transactions. Sales tax or federal excise duty may be applied differently depending on the distribution level, with potential exemptions for certain consumer categories. Electricity suppliers must comply with energy sector regulations and may face varying tax rates based on consumer type, usage levels, and provincial policies.'}
           {determineFbrScenario() === 'SN014' && 'Sale of Gas to CNG Stations - This applies to natural gas sales to Compressed Natural Gas (CNG) filling stations. CNG stations have special tax treatment to promote cleaner fuels and regulate the energy sector. Tax rates and compliance requirements differ from other gas sales, with potential incentives for environmental benefits. Gas suppliers must comply with energy sector regulations and CNG-specific policies that may include reduced tax rates or special exemptions to encourage adoption of cleaner transportation fuels.'}
           {determineFbrScenario() === 'SN015' && 'Sale of Mobile Phones - This applies to sales of mobile handsets and smartphones. Mobile phones attract standard sales tax but may be subject to additional duties or regulatory charges due to their high value and import nature. Governments may adjust tax rates on mobile phones to encourage or discourage imports, affecting both local and international trade. Mobile phone sales require compliance with telecommunications regulations and may face varying tax rates based on device specifications, price ranges, and import/local manufacturing status.'}
           {determineFbrScenario() === 'SN016' && 'Processing/Conversion of Goods - This applies to value-added services where raw materials or semi-finished goods are converted into finished products through manufacturing or processing operations. The invoice covers processing charges (like dyeing, packaging, machining, assembly) rather than the goods themselves. Sales tax on processing services may differ from goods sales, often with specific rates for manufacturing services. Businesses must distinguish between material costs and processing fees, ensuring proper tax treatment for each component while maintaining compliance with manufacturing sector regulations.'}
           {determineFbrScenario() === 'SN017' && 'Sale of Goods Where FED Is Charged in ST Mode - This applies to goods where Federal Excise Duty (FED) is collected through the sales tax system rather than separately. Instead of charging FED as a distinct tax, the seller includes FED within the sales tax invoice, streamlining the collection process. This mode simplifies compliance by consolidating multiple tax types into a single invoice system. Businesses must ensure proper calculation and documentation of both sales tax and FED components while maintaining transparency about the total tax burden on goods subject to federal excise duties.'}
           {determineFbrScenario() === 'SN018' && 'Sale of Services Where FED Is Charged in ST Mode - This applies to certain services (e.g., advertisement, franchise, insurance) that are liable to Federal Excise Duty but invoiced under the sales tax framework. This allows FBR to monitor service sector revenue streams without requiring separate returns for FED and sales tax. The consolidated approach simplifies compliance for service providers while ensuring comprehensive tax collection. Businesses must properly identify FED-liable services and ensure accurate calculation of both sales tax and FED components within a unified invoicing system.'}
           {determineFbrScenario() === 'SN019' && 'Sale of Services (as per ICT Ordinance) - This applies to Information and Communication Technology services such as consultancy, software development, and IT solutions that are governed by specific ICT ordinances. These services may have distinct tax rates, exemptions, or incentives to promote the technology sector and digital economy growth. ICT services often benefit from reduced tax rates or special exemptions to encourage innovation and competitiveness. Service providers must comply with ICT-specific regulations and may qualify for various tax incentives based on service type, export orientation, and contribution to digital transformation initiatives.'}
           {determineFbrScenario() === 'SN020' && 'Sale of Electric Vehicles - This applies to electric vehicles that are incentivized through reduced sales tax rates or exemptions to encourage environmentally friendly transportation. Electric vehicles must be categorized distinctly from hybrids or combustion engine vehicles to qualify for tax benefits. Invoices must declare engine/battery specifications to validate eligibility for environmental incentives. These vehicles support government policies promoting clean energy adoption and reducing carbon emissions. Dealers must ensure proper documentation of vehicle specifications including battery capacity, electric motor details, and environmental compliance certificates to claim applicable tax reductions or exemptions.'}
           {determineFbrScenario() === 'SN021' && 'Sale of Cement/Concrete Block - This applies to cement and concrete blocks that are taxed at standard rates and subject to strict environmental regulations due to their construction industry impact. These products require compliance with input-output ratio tracking for construction regulations and environmental monitoring. Cement and concrete block sales must maintain detailed records of production volumes, raw material consumption, and environmental impact assessments. Manufacturers must ensure proper documentation of environmental compliance certificates, quality standards, and construction regulation adherence. The taxation framework supports infrastructure development while maintaining environmental oversight and construction industry standards.'}
           {determineFbrScenario() === 'SN022' && 'Sale of Potassium Chlorate - This applies to potassium chlorate, a sensitive chemical primarily used in matchstick manufacturing and subject to special regulatory controls. Unlike value-based taxation, potassium chlorate is taxed at a fixed rate per kilogram (weight-based taxation) due to its controlled nature and specific industrial applications. Sales require strict compliance with chemical handling regulations, safety protocols, and licensing requirements for both sellers and buyers. Businesses must maintain detailed records of quantities sold, buyer credentials, and intended use declarations. The weight-based tax system ensures consistent revenue collection regardless of market price fluctuations while supporting regulatory oversight of this controlled chemical substance.'}
           {determineFbrScenario() === 'SN023' && 'Sale of CNG - This applies to Compressed Natural Gas sales which involve regulated pricing structures and specific tax treatments that may include both Federal Excise Duty (FED) and sales tax. CNG stations must issue invoices for every sale, indicating the volume sold in cubic meters or kilograms, applicable tax rates, and billing rates per unit. These transactions are typically high-frequency and managed through automated dispensing and billing systems that integrate with point-of-sale terminals. CNG sales require compliance with petroleum product regulations, environmental standards, and safety protocols. Pricing is often government-regulated to ensure fair market access while supporting clean energy adoption and reducing vehicular emissions.'}
           {determineFbrScenario() === 'SN024' && 'Sale of Goods Listed in SRO 297(|)/2023 - This applies to specific goods subject to reduced, conditional, or fixed-rate taxation as notified under SRO 297(|)/2023. These goods may include solar equipment, medical devices, energy-efficient appliances, and other items eligible for special tax treatments to promote specific industries or social objectives. Businesses dealing in such goods must identify the correct SRO serial numbers and apply appropriate tax rates in their invoices. Each item requires proper documentation of its SRO classification, serial number from the notification table, and compliance with specific conditions for reduced taxation. The framework supports government policy objectives while ensuring proper tax collection and regulatory compliance for specially categorized goods.'}
           {determineFbrScenario() === 'SN025' && 'Sale of Drugs at Fixed ST Rate Under Serial 81 Of Eighth Schedule Table 1 - This applies to pharmaceutical products taxed at fixed sales tax rates under serial 81 of the Eighth Schedule to make medicines affordable and accessible. These fixed rates are often lower than standard rates to support public health objectives and ensure essential medicines remain cost-effective for consumers. The fixed rate structure means tax is calculated as a set amount or percentage regardless of price variations in the pharmaceutical market. Pharmaceutical businesses must properly classify drugs under the correct serial number, maintain detailed records of drug specifications, and ensure compliance with both tax regulations and pharmaceutical licensing requirements. This framework balances revenue collection with healthcare affordability while supporting the pharmaceutical industry and public health initiatives.'}
           {determineFbrScenario() === 'SN026' && 'Sale Of Goods at Standard Rate to End Consumers by Retailers - This applies to retailers selling taxable goods directly to end consumers at standard sales tax rates through Point-of-Sale (POS) systems integrated with FBR\'s IRIS platform. Since end consumers are typically unregistered persons, retailers collect sales tax without input tax credit implications for the buyer. These transactions require real-time reporting through POS integration to ensure compliance and prevent tax evasion. Retailers must maintain proper documentation of all sales, apply correct tax rates, and ensure their POS systems are properly configured for automatic tax calculation and FBR reporting. This scenario supports retail sector monitoring while ensuring comprehensive tax collection from consumer purchases and maintaining transparency in the retail supply chain.'}
           {determineFbrScenario() === 'SN027' && 'Sale Of 3rd Schedule Goods to End Consumers by Retailers - This applies to retailers selling goods under the 3rd Schedule, such as branded FMCGs, where sales tax must be charged and reported based on the maximum retail price (MRP) rather than the transactional or discounted price. This ensures consistent tax collection regardless of promotional pricing or discounts offered to consumers. Retailers must maintain proper documentation of MRP values, apply tax calculations based on these fixed prices, and ensure compliance with 3rd Schedule regulations. The MRP-based taxation framework prevents tax base erosion through artificial price reductions while supporting fair market competition and consistent revenue collection. This scenario requires careful inventory management and pricing documentation to ensure accurate tax reporting based on notified retail prices rather than actual selling prices.'}
           {determineFbrScenario() === 'SN028' && 'Sale of Goods at Reduced Rate to End Consumers by Retailers - This applies to essential goods such as baby milk, books, and other socially important products that qualify for reduced sales tax rates lower than the standard 18% to maintain affordability for end consumers. These preferential rates support government policies promoting access to vital goods and educational materials. Retailers must ensure proper classification of goods under applicable tax schedules to qualify for reduced rates and maintain detailed documentation of product categories, applicable rate schedules, and compliance with essential goods criteria. The reduced rate framework balances social welfare objectives with revenue collection while ensuring that essential items remain accessible to all economic segments of society. Proper product classification and rate application are critical for both compliance and social impact.'}
         </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Scenario is automatically determined based on Buyer Type: <strong>{formData.buyerType}</strong>, Sale Type: <strong>{formData.saleType}</strong>, and Tax Rates applied.
        </Typography>
      </Paper>

      {/* Save Invoice and Send to FBR Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<SaveIcon />}
          onClick={saveInvoice}
          disabled={saving || formData.items.length === 0 || isInvoiceSentToFBR()}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
            }
          }}
        >
          {saving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Invoice' : 'Save Invoice')}
        </Button>
        
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<SendIcon />}
          onClick={sendToFBR}
          disabled={!invoiceSaved || sendingToFBR || formData.items.length === 0 || isInvoiceSentToFBR()}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)'
            },
            '&:disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          {sendingToFBR ? 'Sending to FBR...' : 'Send to FBR'}
        </Button>
        
        <Button
          variant="outlined"
          color="info"
          size="large"
          startIcon={<VisibilityIcon />}
          onClick={handlePreviewInvoice}
          disabled={!invoiceSaved || formData.items.length === 0}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2
            }
          }}
        >
          Preview Invoice
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          size="large"
          startIcon={<PrintIcon />}
          onClick={handlePrintInvoice}
          disabled={!invoiceSaved || formData.items.length === 0}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2
            }
          }}
        >
          Print Invoice
        </Button>
      </Box>

      {/* FBR Data Preview Dialog */}
      <Dialog 
        open={showFbrPreview} 
        onClose={cancelSendToFBR}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Verify FBR Data Before Submission
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please review the data that will be sent to FBR. Click "Confirm & Send" to proceed or "Cancel" to go back.
          </Typography>
          <Box 
            component="pre" 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              border: 1, 
              borderColor: 'grey.300',
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              maxHeight: '400px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {fbrPayloadPreview ? JSON.stringify(fbrPayloadPreview, null, 2) : ''}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={cancelSendToFBR} 
            color="secondary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmSendToFBR} 
            color="primary"
            variant="contained"
            disabled={sendingToFBR}
            startIcon={<SendIcon />}
          >
            {sendingToFBR ? 'Sending...' : 'Confirm & Send to FBR'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FBR Response Display */}
      {fbrResponse && (
        <Paper sx={{ mt: 3, p: 3, bgcolor: fbrResponse.status === 'success' ? '#e8f5e8' : '#ffebee' }}>
          <Typography variant="h6" gutterBottom color={fbrResponse.status === 'success' ? 'success.main' : 'error.main'}>
            FBR Response
          </Typography>
          <Box component="pre" sx={{ 
            p: 2, 
            bgcolor: 'background.paper', 
            border: 1, 
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
            {JSON.stringify(fbrResponse, null, 2)}
          </Box>
        </Paper>
      )}

      {/* Invoice Preview Modal */}
      <Dialog 
        open={showInvoicePreview} 
        onClose={() => setShowInvoicePreview(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            '@media print': {
              boxShadow: 'none',
              margin: 0,
              maxWidth: 'none',
              maxHeight: 'none',
              width: '100%',
              height: '100%'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          '@media print': {
            display: 'none'
          }
        }}>
          <Typography variant="h6">Invoice Preview</Typography>
          <IconButton 
            onClick={() => setShowInvoicePreview(false)}
            sx={{
              '@media print': {
                display: 'none'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 0,
          '@media print': {
            padding: 0
          }
        }}>
          {showInvoicePreview && (
            <SalesInvoiceReport 
              invoiceData={prepareInvoiceData()}
              fbrResponse={fbrResponse}
            />
          )}
        </DialogContent>
        <DialogActions sx={{
          '@media print': {
            display: 'none'
          }
        }}>
          <Button 
            onClick={() => setShowInvoicePreview(false)} 
            color="secondary"
            variant="outlined"
          >
            Close
          </Button>
          <Button 
            onClick={() => window.print()} 
            color="primary"
            variant="contained"
            startIcon={<PrintIcon />}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesInvoice;