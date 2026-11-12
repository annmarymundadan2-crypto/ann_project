import { TransactionRecord, TransactionInput } from '../types/fraud';
import { predictWithANN } from '../ml/annEngine';
import { predictWithRandomForest } from '../ml/randomForestEngine';

const SAMPLE_BENEFICIARIES = [
  'Swiggy Foods Pvt Ltd',
  'Amazon Pay India',
  'Rohit Sharma',
  'QuickCrypto Exchange',
  'Reliance Retail Ltd',
  'Unknown VPA (pay_crypto_99)',
  'Aarav Mehta',
  'Zomato Order Pay',
  'Global Remit Hub',
  'Priya Patel',
  'Uber Rides India',
  'Offshore Gaming VPA',
  'Electricity Board Bill',
  'Kavita Nair',
  'FastCash Peer Loan',
  'Flipkart Internet Pvt Ltd',
];

const SAMPLE_CITIES = [
  'Mumbai, MH',
  'Bengaluru, KA',
  'New Delhi, DL',
  'Hyderabad, TS',
  'Pune, MH',
  'Chennai, TN',
  'Kolkata, WB',
  'Jaipur, RJ',
  'Ahmedabad, GJ',
  'Lagos, NG (Proxy)',
  'Kyiv, UA (VPN)',
];

const SAMPLE_DEVICES = [
  'Samsung Galaxy S24 Ultra',
  'Apple iPhone 15 Pro',
  'OnePlus 12 5G',
  'Redmi Note 13 Pro',
  'Pixel 8 Pro',
  'Emulated Android (BlueStacks)',
  'Linux Headless Chromium',
  'Vivo V29 5G',
];

// Initial pre-loaded transaction seed
export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  // Colab Notebook 2 exact test case (ANN): 3000 UPI, 2 AM, loc 0, dev 0, daily 12, failed 3, new 1 -> 99.8% Fraud
  {
    id: 'TXN-904812',
    timestamp: '2026-11-12 02:14:08',
    amount: 3000.0,
    transaction_type: 'UPI',
    hour: 2,
    location_match: 0,
    device_match: 0,
    daily_transactions: 12,
    failed_attempts: 3,
    new_beneficiary: 1,
    senderAccount: 'AC-8891-XXXX-4019',
    beneficiaryName: 'Offshore Gaming VPA',
    upiHandle: 'unknown_offshore@okaxis',
    locationCity: 'Kyiv, UA (VPN)',
    deviceModel: 'Emulated Android (BlueStacks)',
    ipAddress: '194.26.29.112',
    annScore: 0.998,
    rfScore: 0.92,
    isFraud: true,
    status: 'BLOCKED',
    notes: 'Matches Colab Notebook ANN test case. Flagged for nocturnal brute-force + unregistered device.',
  },
  // Colab Notebook 1 exact test case (Random Forest): 25000 UPI, 2 AM, loc 0, dev 0, daily 12, failed 3, new 1
  {
    id: 'TXN-904811',
    timestamp: '2026-11-12 02:08:45',
    amount: 25000.0,
    transaction_type: 'UPI',
    hour: 2,
    location_match: 0,
    device_match: 0,
    daily_transactions: 12,
    failed_attempts: 3,
    new_beneficiary: 1,
    senderAccount: 'AC-3120-XXXX-8921',
    beneficiaryName: 'QuickCrypto Exchange',
    upiHandle: 'pay_cryptomint@ybl',
    locationCity: 'Lagos, NG (Proxy)',
    deviceModel: 'Linux Headless Chromium',
    ipAddress: '102.89.34.201',
    annScore: 0.999,
    rfScore: 0.95,
    isFraud: true,
    status: 'BLOCKED',
    notes: 'Matches Colab Notebook RF test case. High-value nocturnal crypto drain.',
  },
  // Legitimate routine grocery P2M
  {
    id: 'TXN-904810',
    timestamp: '2026-11-12 14:32:10',
    amount: 450.0,
    transaction_type: 'P2M',
    hour: 14,
    location_match: 1,
    device_match: 1,
    daily_transactions: 2,
    failed_attempts: 0,
    new_beneficiary: 0,
    senderAccount: 'AC-7741-XXXX-1920',
    beneficiaryName: 'Reliance Retail Ltd',
    upiHandle: 'relianceretail@hdfcbank',
    locationCity: 'Bengaluru, KA',
    deviceModel: 'Apple iPhone 15 Pro',
    ipAddress: '122.161.45.89',
    annScore: 0.008,
    rfScore: 0.02,
    isFraud: false,
    status: 'APPROVED',
    notes: 'Routine merchant point-of-sale checkout.',
  },
  // Legitimate food delivery order
  {
    id: 'TXN-904809',
    timestamp: '2026-11-12 20:15:33',
    amount: 890.5,
    transaction_type: 'P2M',
    hour: 20,
    location_match: 1,
    device_match: 1,
    daily_transactions: 3,
    failed_attempts: 0,
    new_beneficiary: 0,
    senderAccount: 'AC-5512-XXXX-7140',
    beneficiaryName: 'Swiggy Foods Pvt Ltd',
    upiHandle: 'swiggy@icici',
    locationCity: 'Mumbai, MH',
    deviceModel: 'Samsung Galaxy S24 Ultra',
    ipAddress: '49.37.112.44',
    annScore: 0.012,
    rfScore: 0.03,
    isFraud: false,
    status: 'APPROVED',
    notes: 'Verified regular delivery merchant.',
  },
  // Moderate Suspicion / Step-up 2FA: High P2P transfer late night to new beneficiary
  {
    id: 'TXN-904808',
    timestamp: '2026-11-11 23:42:19',
    amount: 14500.0,
    transaction_type: 'P2P',
    hour: 23,
    location_match: 1,
    device_match: 1,
    daily_transactions: 5,
    failed_attempts: 1,
    new_beneficiary: 1,
    senderAccount: 'AC-4419-XXXX-6602',
    beneficiaryName: 'FastCash Peer Loan',
    upiHandle: 'fastcash_lend@okaxis',
    locationCity: 'Pune, MH',
    deviceModel: 'OnePlus 12 5G',
    ipAddress: '157.34.88.190',
    annScore: 0.442,
    rfScore: 0.42,
    isFraud: false,
    status: 'FLAGGED',
    notes: 'Requires Step-Up 2FA biometric confirmation before releasing funds.',
  },
  // Fraud Account Takeover: PIN spray at 3 AM
  {
    id: 'TXN-904807',
    timestamp: '2026-11-11 03:19:50',
    amount: 9800.0,
    transaction_type: 'UPI',
    hour: 3,
    location_match: 0,
    device_match: 0,
    daily_transactions: 8,
    failed_attempts: 4,
    new_beneficiary: 1,
    senderAccount: 'AC-9901-XXXX-3341',
    beneficiaryName: 'Unknown VPA (pay_crypto_99)',
    upiHandle: 'pay_crypto_99@ibl',
    locationCity: 'Kyiv, UA (VPN)',
    deviceModel: 'Emulated Android (BlueStacks)',
    ipAddress: '185.220.101.5',
    annScore: 0.996,
    rfScore: 0.91,
    isFraud: true,
    status: 'BLOCKED',
    notes: '4 prior failed PIN attempts from an untrusted IP address.',
  },
  // Routine electricity bill payment
  {
    id: 'TXN-904806',
    timestamp: '2026-11-11 11:05:12',
    amount: 2150.0,
    transaction_type: 'P2M',
    hour: 11,
    location_match: 1,
    device_match: 1,
    daily_transactions: 1,
    failed_attempts: 0,
    new_beneficiary: 0,
    senderAccount: 'AC-2234-XXXX-9011',
    beneficiaryName: 'Electricity Board Bill',
    upiHandle: 'bescom_bill@sbi',
    locationCity: 'Bengaluru, KA',
    deviceModel: 'Pixel 8 Pro',
    ipAddress: '106.51.72.18',
    annScore: 0.007,
    rfScore: 0.01,
    isFraud: false,
    status: 'APPROVED',
  },
  // Routine peer payment to known friend
  {
    id: 'TXN-904805',
    timestamp: '2026-11-11 17:28:40',
    amount: 1200.0,
    transaction_type: 'P2P',
    hour: 17,
    location_match: 1,
    device_match: 1,
    daily_transactions: 4,
    failed_attempts: 0,
    new_beneficiary: 0,
    senderAccount: 'AC-8812-XXXX-5544',
    beneficiaryName: 'Rohit Sharma',
    upiHandle: 'rohitsharma@paytm',
    locationCity: 'Mumbai, MH',
    deviceModel: 'Samsung Galaxy S24 Ultra',
    ipAddress: '49.36.19.78',
    annScore: 0.015,
    rfScore: 0.02,
    isFraud: false,
    status: 'APPROVED',
  },
  // High-frequency burst test
  {
    id: 'TXN-904804',
    timestamp: '2026-11-11 04:45:11',
    amount: 1850.0,
    transaction_type: 'UPI',
    hour: 4,
    location_match: 0,
    device_match: 1,
    daily_transactions: 16,
    failed_attempts: 2,
    new_beneficiary: 1,
    senderAccount: 'AC-1099-XXXX-4433',
    beneficiaryName: 'Global Remit Hub',
    upiHandle: 'globalremit@okicici',
    locationCity: 'Ahmedabad, GJ',
    deviceModel: 'Redmi Note 13 Pro',
    ipAddress: '115.114.77.21',
    annScore: 0.884,
    rfScore: 0.79,
    isFraud: true,
    status: 'BLOCKED',
    notes: 'Exceeded daily velocity cap (16 txns) with unfamiliar beneficiary.',
  },
  // Legitimate E-commerce shopping
  {
    id: 'TXN-904803',
    timestamp: '2026-11-10 16:50:20',
    amount: 3499.0,
    transaction_type: 'P2M',
    hour: 16,
    location_match: 1,
    device_match: 1,
    daily_transactions: 2,
    failed_attempts: 0,
    new_beneficiary: 0,
    senderAccount: 'AC-6611-XXXX-9900',
    beneficiaryName: 'Amazon Pay India',
    upiHandle: 'amazonpay@apl',
    locationCity: 'Hyderabad, TS',
    deviceModel: 'Apple iPhone 15 Pro',
    ipAddress: '183.82.110.15',
    annScore: 0.009,
    rfScore: 0.02,
    isFraud: false,
    status: 'APPROVED',
  },
  // E-commerce purchase from unfamiliar city (traveling customer, verified device)
  {
    id: 'TXN-904802',
    timestamp: '2026-11-10 13:12:05',
    amount: 1890.0,
    transaction_type: 'P2M',
    hour: 13,
    location_match: 0,
    device_match: 1,
    daily_transactions: 3,
    failed_attempts: 0,
    new_beneficiary: 0,
    senderAccount: 'AC-7788-XXXX-1234',
    beneficiaryName: 'Flipkart Internet Pvt Ltd',
    upiHandle: 'flipkart@axisbank',
    locationCity: 'Jaipur, RJ',
    deviceModel: 'Apple iPhone 15 Pro',
    ipAddress: '103.240.160.9',
    annScore: 0.082,
    rfScore: 0.12,
    isFraud: false,
    status: 'VERIFIED',
    notes: 'Location mismatch resolved by secure device cryptographic key & zero auth failures.',
  },
  // Critical nocturnal crypto drain
  {
    id: 'TXN-904801',
    timestamp: '2026-11-10 01:55:40',
    amount: 19500.0,
    transaction_type: 'UPI',
    hour: 1,
    location_match: 0,
    device_match: 0,
    daily_transactions: 9,
    failed_attempts: 3,
    new_beneficiary: 1,
    senderAccount: 'AC-3321-XXXX-0012',
    beneficiaryName: 'QuickCrypto Exchange',
    upiHandle: 'instantcrypto@yesbank',
    locationCity: 'Lagos, NG (Proxy)',
    deviceModel: 'Linux Headless Chromium',
    ipAddress: '197.210.8.44',
    annScore: 0.997,
    rfScore: 0.94,
    isFraud: true,
    status: 'BLOCKED',
    notes: 'Immediate freeze applied by automated ANN policy.',
  },
];

/**
 * Helper to generate random synthetic transactions matching the 2,000 dataset distribution
 */
export function generateSyntheticDataset(count: number = 50): TransactionRecord[] {
  const records: TransactionRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const isFraudulentCandidate = Math.random() < 0.18; // ~18% fraud base rate
    const hour = isFraudulentCandidate
      ? Math.random() < 0.65 ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 24)
      : Math.floor(Math.random() * 15) + 8; // Normal transactions mostly 8 AM - 11 PM

    const transaction_type = Math.random() < 0.4 ? 'UPI' : Math.random() < 0.7 ? 'P2M' : 'P2P';
    const location_match = isFraudulentCandidate ? (Math.random() < 0.2 ? 1 : 0) : (Math.random() < 0.92 ? 1 : 0);
    const device_match = isFraudulentCandidate ? (Math.random() < 0.15 ? 1 : 0) : (Math.random() < 0.95 ? 1 : 0);
    const failed_attempts = isFraudulentCandidate ? Math.floor(Math.random() * 4) + 1 : (Math.random() < 0.9 ? 0 : 1);
    const new_beneficiary = isFraudulentCandidate ? (Math.random() < 0.85 ? 1 : 0) : (Math.random() < 0.2 ? 1 : 0);
    const daily_transactions = isFraudulentCandidate ? Math.floor(Math.random() * 14) + 4 : Math.floor(Math.random() * 5) + 1;
    
    const amount = isFraudulentCandidate
      ? Math.round(Math.random() * 28000 + 1500)
      : Math.round(Math.random() * 6500 + 100);

    const input: TransactionInput = {
      amount,
      transaction_type,
      hour,
      location_match,
      device_match,
      daily_transactions,
      failed_attempts,
      new_beneficiary,
    };

    const ann = predictWithANN(input);
    const rf = predictWithRandomForest(input);
    const isFraud = ann.isFraud;

    const recordTime = new Date(now - i * (Math.random() * 7200000 + 600000));
    const timestamp = recordTime.toISOString().replace('T', ' ').substring(0, 19);

    const beneficiaryName = SAMPLE_BENEFICIARIES[Math.floor(Math.random() * SAMPLE_BENEFICIARIES.length)];
    const locationCity = location_match === 1 ? 'Bengaluru, KA' : SAMPLE_CITIES[Math.floor(Math.random() * SAMPLE_CITIES.length)];
    const deviceModel = device_match === 1 ? 'Samsung Galaxy S24 Ultra' : SAMPLE_DEVICES[Math.floor(Math.random() * SAMPLE_DEVICES.length)];

    records.push({
      id: `TXN-${904800 - i}`,
      timestamp,
      amount,
      transaction_type,
      hour,
      location_match,
      device_match,
      daily_transactions,
      failed_attempts,
      new_beneficiary,
      senderAccount: `AC-${1000 + (i * 37) % 9000}-XXXX-${1000 + (i * 19) % 9000}`,
      beneficiaryName,
      upiHandle: `${beneficiaryName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
      locationCity,
      deviceModel,
      ipAddress: `192.168.${(i * 3) % 255}.${(i * 7) % 255}`,
      annScore: ann.probability,
      rfScore: rf.probability,
      isFraud,
      status: isFraud ? 'BLOCKED' : ann.probability > 0.35 ? 'FLAGGED' : 'APPROVED',
      notes: isFraud ? 'Suspicious pattern identified by Deep Learning ANN.' : 'Verified legitimate.',
    });
  }

  return records;
}

/**
 * Convert transaction array to CSV format matching upi_fraud_dataset_2000_v2.csv
 */
export function exportToCSV(records: TransactionRecord[]): string {
  const headers = [
    'transaction_id',
    'amount',
    'transaction_type',
    'hour',
    'location_match',
    'device_match',
    'daily_transactions',
    'failed_attempts',
    'new_beneficiary',
    'ann_fraud_probability',
    'is_fraud',
  ];

  const rows = records.map((r) => [
    r.id,
    r.amount.toFixed(2),
    r.transaction_type,
    r.hour,
    r.location_match,
    r.device_match,
    r.daily_transactions,
    r.failed_attempts,
    r.new_beneficiary,
    r.annScore.toFixed(4),
    r.isFraud ? 1 : 0,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
