// ─── Core enums ───────────────────────────────────────────────────────────────

export type WorkerStatus  = 'invited' | 'kyc_pending' | 'active' | 'inactive' | 'terminated';
export type ContractStatus= 'draft' | 'sent' | 'company_signed' | 'worker_signed' | 'active' | 'rejected' | 'terminated';
export type InvoiceStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'disputed';
export type Track         = 'track_1_india' | 'track_2_us';
export type WorkerType    = 'contractor' | 'full_time_employee';
export type PayFrequency  = 'monthly' | 'biweekly' | 'hourly';
export type DashboardPage = 'home' | 'workers' | 'contracts' | 'invoices' | 'documents' | 'settings';

// ─── Dechub service IDs ───────────────────────────────────────────────────────

export type DechubService =
  | 'contract_generation'
  | 'e_signature'
  | 'invoice_management'
  | 'payment_processing'
  | 'kyc_verification'
  | 'document_storage'
  | 'completion_certificate'
  | 'compliance_advisory'
  | 'hrms'
  | 'asset_management';

export interface ServiceConfig {
  id:           DechubService;
  name:         string;
  desc:         string;
  icon:         string;
  required:     boolean;
  defaultOn:    boolean;
  tier:         'core' | 'recommended' | 'optional';
  priceLabel?:  string;
  comingSoon?:  boolean;
}

// ─── Domain models ────────────────────────────────────────────────────────────

export interface Worker {
  _id:              string;
  companyId:        string;
  firstName:        string;
  lastName:         string;
  email:            string;
  phone:            string | null;
  country:          string;
  track:            Track;
  workerType:       WorkerType;
  roleTitle:        string;
  department:       string;
  kycStatus:        'pending' | 'approved' | 'rejected';
  status:           WorkerStatus;
  selectedServices: DechubService[];
  payRate:          number | null;
  payCurrency:      string;
  contractId:       string | null;
  lastPaymentAt:    string | null;
  createdAt:        string;
}

export interface Contract {
  _id:               string;
  workerId:          string;
  workerName:        string;
  workerRole:        string;
  contractType:      'contractor' | 'employment' | 'internship';
  track:             'track_1' | 'track_2';
  payRate:           number;
  payCurrency:       string;
  payFrequency:      PayFrequency;
  startDate:         string;
  endDate:           string | null;
  noticePeriodDays:  number;
  scopeOfWork:       string;
  status:            ContractStatus;
  pdfUrl:            string | null;
  companySigned:     boolean;
  workerSigned:      boolean;
  createdAt:         string;
}

export interface Invoice {
  _id:          string;
  workerId:     string;
  workerName:   string;
  workerRole:   string;
  invoiceNumber:string;
  periodStart:  string;
  periodEnd:    string;
  amountGross:  number;
  currency:     string;
  status:       InvoiceStatus;
  submittedAt:  string;
  approvedAt:   string | null;
  paidAt:       string | null;
  pdfUrl:       string | null;
}

export interface Document {
  _id:          string;
  workerId:     string | null;
  workerName:   string | null;
  documentType: 'contract' | 'invoice' | 'payslip' | 'kyc_id' | 'incorporation_cert' | 'completion_cert' | 'w8ben';
  fileName:     string;
  s3Url:        string;
  uploadedAt:   string;
}

export interface DashboardStats {
  activeWorkers:    number;
  pendingInvoices:  number;
  nextPayrollDate:  string | null;
  monthlyTotalCost: number;
  currency:         string;
  pendingKyc:       number;
  contractsExpiring:number;
}

// ─── Add worker multi-step form ───────────────────────────────────────────────

export interface AddWorkerFormData {
  // Step 1 — worker type
  workerType: WorkerType | '';
  track:      Track | '';

  // Step 2 — worker details
  firstName:  string;
  lastName:   string;
  email:      string;
  roleTitle:  string;
  country:    string;
  department: string;

  // Step 3 — services
  selectedServices: DechubService[];

  // Step 4 — contract terms
  payRate:           string;
  payCurrency:       string;
  payFrequency:      PayFrequency;
  startDate:         string;
  endDate:           string;
  noticePeriodDays:  string;
  scopeOfWork:       string;
}

export const INITIAL_ADD_WORKER: AddWorkerFormData = {
  workerType: '',
  track:      '',
  firstName:  '',
  lastName:   '',
  email:      '',
  roleTitle:  '',
  country:    '',
  department: '',
  selectedServices: [
    'contract_generation',
    'e_signature',
    'document_storage',
    'invoice_management',
    'payment_processing',
    'kyc_verification',
    'completion_certificate',
  ],
  payRate:          '',
  payCurrency:      'USD',
  payFrequency:     'monthly',
  startDate:        '',
  endDate:          '',
  noticePeriodDays: '30',
  scopeOfWork:      '',
};

// ─── Service catalogue ────────────────────────────────────────────────────────

export const DECHUB_SERVICES: ServiceConfig[] = [
  {
    id:        'contract_generation',
    name:      'Contract Generation',
    desc:      'Auto-generate a PDF contractor agreement from our legally compliant templates',
    icon:      '📄',
    required:  true,
    defaultOn: true,
    tier:      'core',
  },
  {
    id:        'e_signature',
    name:      'E-Signature (DocuSign)',
    desc:      'Send the contract for digital signature to both you and the worker via DocuSign',
    icon:      '✍️',
    required:  true,
    defaultOn: true,
    tier:      'core',
  },
  {
    id:        'document_storage',
    name:      'Document Storage',
    desc:      'AES-256 encrypted cloud storage for all contracts, invoices, and receipts',
    icon:      '☁️',
    required:  true,
    defaultOn: true,
    tier:      'core',
  },
  {
    id:          'invoice_management',
    name:        'Invoice Management',
    desc:        'Worker submits monthly invoices; you review and approve with one click',
    icon:        '🧾',
    required:    false,
    defaultOn:   true,
    tier:        'recommended',
  },
  {
    id:          'payment_processing',
    name:        'Payment Processing (Wise)',
    desc:        'Automated USD payouts via Wise API immediately after invoice approval',
    icon:        '💸',
    required:    false,
    defaultOn:   true,
    tier:        'recommended',
  },
  {
    id:          'kyc_verification',
    name:        'KYC Verification',
    desc:        'Verify worker identity via Stripe Identity ($1.50/check) before first payment',
    icon:        '🪪',
    required:    false,
    defaultOn:   true,
    tier:        'recommended',
    priceLabel:  '$1.50 / verification',
  },
  {
    id:          'completion_certificate',
    name:        'Completion Certificate',
    desc:        'Auto-generate a professional PDF certificate when the contract ends',
    icon:        '🏆',
    required:    false,
    defaultOn:   true,
    tier:        'recommended',
  },
  {
    id:          'compliance_advisory',
    name:        'Compliance & Tax Forms',
    desc:        'W-9 / W-8BEN form guidance, compliance calendar, and tax filing reminders',
    icon:        '⚖️',
    required:    false,
    defaultOn:   false,
    tier:        'optional',
    priceLabel:  '+$5 / month',
  },
  {
    id:          'hrms',
    name:        'HRMS',
    desc:        'Leave management, attendance tracking, and performance reviews',
    icon:        '📅',
    required:    false,
    defaultOn:   false,
    tier:        'optional',
    priceLabel:  '+$5 / month',
    comingSoon:  true,
  },
  {
    id:          'asset_management',
    name:        'Asset Management',
    desc:        'Track and manage company equipment assigned to this worker',
    icon:        '💻',
    required:    false,
    defaultOn:   false,
    tier:        'optional',
    comingSoon:  true,
  },
];
