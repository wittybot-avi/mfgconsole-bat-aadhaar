
import { ScreenId } from './screenIds';

interface RestrictionInfo {
  reason: string;
  allowedRoles: string[];
}

export const RESTRICTION_REASONS: Partial<Record<ScreenId, RestrictionInfo>> = {
  [ScreenId.PROVISIONING]: {
    reason: "Restricted to firmware/production authorized roles due to device calibration risk.",
    allowedRoles: ["Manufacturing (C2)", "BMS Engineer (C5)", "Super User"]
  },
  // Fix: Corrected invalid ScreenId property reference from EOL_QA_STATION to EOL_QA_QUEUE.
  [ScreenId.EOL_QA_QUEUE]: {
    reason: "Restricted to QA personnel to ensure certification integrity.",
    allowedRoles: ["QA (C3)", "Super User"]
  },
  [ScreenId.COMPLIANCE]: {
    reason: "Restricted to compliance officers for regulatory audit trail management.",
    allowedRoles: ["Compliance (C8)", "Super User"]
  },
  [ScreenId.CUSTODY]: {
    reason: "Restricted to logistics and external receiving partners for chain-of-custody signing.",
    allowedRoles: ["Logistics (C6)", "External (C9)", "Super User"]
  },
  [ScreenId.WARRANTY_DECIDE_DISPOSITION]: {
    reason: "Liability decision authority restricted to Warranty Managers.",
    allowedRoles: ["Warranty (C7)", "Super User"]
  },
  [ScreenId.SETTINGS]: {
    reason: "System configuration restricted to Administrators.",
    allowedRoles: ["Executive (C1)", "IT (C4)", "Super User"]
  },
  [ScreenId.SETTINGS_API_KEYS]: {
    reason: "Secret management restricted to IT/Engineering leads.",
    allowedRoles: ["IT (C4)", "Super User"]
  },
  [ScreenId.DISPATCH_LIST]: {
    reason: "Shipment creation restricted to Logistics operators.",
    allowedRoles: ["Logistics (C6)", "Super User"]
  }
};

export const getRestrictionInfo = (screenId: ScreenId): RestrictionInfo | null => {
  return RESTRICTION_REASONS[screenId] || null;
};
