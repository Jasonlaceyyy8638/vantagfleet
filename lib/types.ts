export type AppRole = 'Owner' | 'Safety_Manager' | 'Driver';

export type OrgStatus = 'active' | 'suspended' | 'trial';

export interface Organization {
  id: string;
  name: string;
  usdot_number: string | null;
  status: OrgStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  org_id: string;
  role: AppRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  org_id: string;
  name: string;
  license_number: string | null;
  license_state: string | null;
  med_card_expiry: string | null;
  clearinghouse_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  org_id: string;
  unit_number: string | null;
  vin: string | null;
  plate: string | null;
  annual_inspection_due: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDoc {
  id: string;
  org_id: string;
  driver_id: string | null;
  doc_type: string;
  file_path: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertItem {
  id: string;
  type: 'driver' | 'vehicle' | 'compliance_doc';
  title: string;
  dueOrExpiry: string;
  daysLeft: number;
  meta?: Record<string, unknown>;
}
