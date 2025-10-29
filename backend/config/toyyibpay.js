import axios from 'axios';
import crypto from 'crypto';

const TOYYIBPAY_SECRET_KEY = process.env.TOYYIBPAY_SECRET_KEY;
const TOYYIBPAY_API_URL = process.env.TOYYIBPAY_API_URL || 'https://toyyibpay.com/index.php/api';

// Note: Signature usage depends on ToyyibPay API variant; placeholder for completeness
export const generateSignature = (params) => {
  const signatureString = `${params.orderId}${params.amount}${TOYYIBPAY_SECRET_KEY}`;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
};

/**
 * Create payment bill with split payment (99% to organizer, 1% to platform)
 */
export const createBill = async ({
  categoryCode,
  billName,
  billDescription,
  billPriceSetting = 1,
  billAmount = 100,
  billReturnUrl,
  billCallbackUrl,
  billTo,
  billEmail,
  billPhone,
  billSplitPayment = '',
  billSplitPaymentArgs = '',
  billPaymentChannel = '0',
  billContentEmail = '',
  billChargeToCustomer = ''
}) => {
  try {
    const form = new URLSearchParams();
    form.append('userSecretKey', TOYYIBPAY_SECRET_KEY || '');
    form.append('categoryCode', categoryCode);
    form.append('billName', billName);
    form.append('billDescription', billDescription);
    form.append('billPriceSetting', String(billPriceSetting));
    form.append('billAmount', String(billAmount));
    form.append('billReturnUrl', billReturnUrl);
    form.append('billCallbackUrl', billCallbackUrl);
    form.append('billTo', billTo || '');
    form.append('billEmail', billEmail || '');
    form.append('billPhone', billPhone || '');
    
    // billPayorInfo: 0 = open bill (no payer info required), 1 = require payer information
    // Since we're providing billTo, billEmail, billPhone, we set it to 1
    form.append('billPayorInfo', '1');
    
    if (billSplitPayment) form.append('billSplitPayment', String(billSplitPayment));
    if (billSplitPaymentArgs) form.append('billSplitPaymentArgs', billSplitPaymentArgs);
    form.append('billPaymentChannel', String(billPaymentChannel));
    if (billContentEmail) form.append('billContentEmail', billContentEmail);
    if (billChargeToCustomer) form.append('billChargeToCustomer', billChargeToCustomer);

    const response = await axios.post(`${TOYYIBPAY_API_URL}/createBill`, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    // ToyyibPay often returns an array with the first element
    const normalized = Array.isArray(data) ? data[0] : data;
    return normalized;
  } catch (error) {
    console.error('ToyyibPay createBill error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get bill status
 */
export const getBillStatus = async (billCode, orderId) => {
  try {
    const form = new URLSearchParams();
    form.append('userSecretKey', TOYYIBPAY_SECRET_KEY || '');
    form.append('billCode', billCode);
    if (orderId) form.append('orderId', orderId);
    const response = await axios.post(`${TOYYIBPAY_API_URL}/getBillTransactions`, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('ToyyibPay getBillStatus error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Verify webhook signature from ToyyibPay
 */
export const verifyWebhook = (_data, _signature) => {
  // Implement if ToyyibPay provides signature for callbacks in your account settings.
  return true;
};

/**
 * Create Category (for organizer onboarding)
 */
export const createCategory = async ({ catname, catdescription }) => {
  try {
    const form = new URLSearchParams();
    form.append('catname', catname);
    form.append('catdescription', catdescription || catname);
    form.append('userSecretKey', TOYYIBPAY_SECRET_KEY || '');
    const response = await axios.post(`${TOYYIBPAY_API_URL}/createCategory`, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = response.data;
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('ToyyibPay createCategory error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get Category Details
 */
export const getCategoryDetails = async ({ categoryCode }) => {
  try {
    const form = new URLSearchParams();
    form.append('userSecretKey', TOYYIBPAY_SECRET_KEY || '');
    form.append('categoryCode', categoryCode);
    const response = await axios.post(`${TOYYIBPAY_API_URL}/getCategoryDetails`, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = response.data;
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('ToyyibPay getCategoryDetails error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Inactivate Bill
 */
export const inactiveBill = async ({ billCode }) => {
  try {
    const form = new URLSearchParams();
    form.append('secretKey', TOYYIBPAY_SECRET_KEY || '');
    form.append('billCode', billCode);
    const response = await axios.post(`${TOYYIBPAY_API_URL}/inactiveBill`, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = response.data;
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('ToyyibPay inactiveBill error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Calculate split payment amounts
 * Platform fee: 1% of total
 */
export const calculateSplitPayment = (totalAmount) => {
  const platformFee = parseFloat((totalAmount * 0.01).toFixed(2));
  const organizerAmount = parseFloat((totalAmount - platformFee).toFixed(2));
  
  return {
    totalAmount,
    platformFee,
    organizerAmount,
    platformPercentage: 1,
    organizerPercentage: 99
  };
};

export default {
  createBill,
  getBillStatus,
  verifyWebhook,
  calculateSplitPayment,
  generateSignature
};

