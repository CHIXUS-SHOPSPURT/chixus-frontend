export interface Operator {
  nodeId: string;
  fourDigitCode: string; // The irreversible 4-digit code (birth year or unforgettable PIN)
  sector: string;
  avatarSeed: string;
  createdAt: string;
  verifiedCount: number;
  chixusLawAccepted: boolean;
}

export interface DefectItem {
  id: string;
  type: 'Cold Joint' | 'Solder Bridge' | 'Tombstoning' | 'Insufficient Solder' | 'Excess Solder' | 'Flux Residue' | 'Component Shift';
  severity: 'CRITICAL' | 'WARNING' | 'MINOR';
  ipcStandard: string;
  description: string;
  location: { x: number; y: number; width: number; height: number };
  reworkRecommendation: string;
  confidence: number;
}

export interface InspectionResult {
  id: string;
  timestamp: string;
  boardIdentifier: string;
  status: 'FAIL' | 'PASS' | 'WARNING';
  defects: DefectItem[];
  jointCount: number;
  qualityScore: number;
  operatorId: string;
  imageUrl?: string;
  notes: string;
}

export interface SampleBoard {
  id: string;
  title: string;
  description: string;
  type: string;
  imageUrl: string;
  defectCount: number;
  knownDefects: DefectItem[];
}

// ==================================================
// FASTAPI LIVE BACKEND & WEBSOCKET CONTRACT
// ==================================================
export interface CoreDiagnosticResponse {
  status: "SUCCESS" | "NO_FAULT_DETECTED" | "REROUTE_TO_SPECIALIST";
  reroute_reason: "LOW_VISION_CONFIDENCE" | "LOW_DIAGNOSTIC_CONFIDENCE" | null;

  vision_analysis: {
    board_condition: "DEFECTIVE" | "HEALTHY_INTACT";
    detected_anomaly: string;
    component_identifier: string | null;
    fault_tag: string | null;
    vision_confidence_score: number;
  };

  circuit_reasoning: {
    matched_fault_id: string | null;
    knowledge_base_reference: string | null;
    reasoning_confidence_score: number;
    repair_steps: string[];
  } | null;

  database_routing_filter: {
    target_fault_tag: string | null;
    minimum_engineer_tier: string;
  };

  bounding_box?: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null;

  frame_latency_ms?: number;
}

export interface InspectScanRequest {
  frame_base64: string;
  symptom_notes?: string;
  client_timestamp_ms: number;
}

export interface ZeroEnergySafetyVerificationRequest {
  voltage_reading?: number;
  meter_self_test_passed: boolean;
  circuit_deenergized: boolean;
  notes?: string;
}

export interface ZeroEnergySafetyVerificationResponse {
  status: "SAFETY_VERIFIED" | "HAZARD_DETECTED";
  zero_energy_state_confirmed: boolean;
  protocol: string;
  safety_clearance_id?: string;
  timestamp: string;
  warning_message?: string;
}

// ==================================================
// PERMANENT ACCOUNT IDENTITY, SETTINGS & VERIFICATION
// ==================================================
export type AiAccessLevel =
  | 'feed'
  | 'inspect'
  | 'profile'
  | 'none'
  | 'everything'
  | 'no_message_allow_other';

export interface EmailAlertPreferences {
  weeklyReport: boolean;
  verifiedOnly: boolean;
  newUpdate: boolean;
  tips: boolean;
}

export interface InAppNotificationPreferences {
  popupToast: boolean;
  appUpdate: boolean;
  directMessage: boolean;
  contactJoin: boolean;
}

export interface UserPreferencesPayload {
  emailAlerts: EmailAlertPreferences;
  inAppAlerts: InAppNotificationPreferences;
  soundFeedback: boolean;
  isIdPublic: boolean;
  aiAccessLevel: AiAccessLevel;
  theme: 'dark' | 'white' | 'system';
  language: string;
  updatedAt?: string;
}

export interface PermanentUserIdentity {
  internal_id: string;
  chixus_id: string;
  phone_number: string;
  email: string;
  full_name: string;
  username: string;
  location: string;
  headline: string;
  country: string;
  avatar_url?: string;
  cover_url?: string;
  summary?: string;
  inspections_conducted?: number;
  faults_isolated?: number;
  ai_scan_accuracy?: string;
  is_id_public?: boolean;
  ai_access_level?: AiAccessLevel;
  pending_phone?: string | null;
  pending_email?: string | null;
  created_at?: string;
}

export interface AuthSessionResponse {
  status: 'success' | 'error';
  authenticated?: boolean;
  access_token?: string;
  token?: string;
  token_type?: string;
  internal_id?: string;
  chixus_id?: string;
  operator_id?: string;
  node_id?: string;
  user?: Partial<PermanentUserIdentity> & Record<string, any>;
  operator?: Partial<PermanentUserIdentity> & Record<string, any>;
  preferences?: Partial<UserPreferencesPayload> & Record<string, any>;
  message?: string;
  detail?: string;
  error?: string;
}

export interface AccountChangeRequestResponse {
  status: 'pending_verification' | 'success' | 'error';
  message: string;
  pending_phone?: string;
  pending_email?: string;
  expires_at?: string;
  email_sent_to?: string;
  user?: Partial<PermanentUserIdentity> & Record<string, any>;
}

export interface AccountChangeConfirmResponse {
  status: 'verified' | 'success' | 'error';
  verified: boolean;
  change_type?: 'phone_change' | 'email_change';
  message: string;
  updated_phone?: string;
  updated_email?: string;
  user?: Partial<PermanentUserIdentity> & Record<string, any>;
}
