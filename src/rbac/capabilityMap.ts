
import { ScreenId } from './screenIds';
import { canView, canDo } from './can';

interface CapabilityCheck {
  label: string;
  check: (clusterId: string) => boolean;
  type: 'enable' | 'restrict';
}

const CAPABILITY_CHECKS: CapabilityCheck[] = [
  { 
    label: "Create and manage manufacturing batches", 
    check: (cid) => canDo(cid, ScreenId.BATCHES_CREATE, 'C'), 
    type: 'enable' 
  },
  { 
    label: "Perform EOL testing and certification", 
    // Fix: Corrected invalid ScreenId property reference from EOL_QA_STATION to EOL_QA_QUEUE.
    check: (cid) => canDo(cid, ScreenId.EOL_QA_QUEUE, 'X'), 
    type: 'enable' 
  },
  { 
    label: "Dispatch shipments and manage orders", 
    check: (cid) => canDo(cid, ScreenId.DISPATCH_LIST, 'C'), 
    type: 'enable' 
  },
  { 
    label: "Accept or reject custody transfers", 
    check: (cid) => canDo(cid, ScreenId.CUSTODY_ACCEPT_REJECT_ACTION, 'X'), 
    type: 'enable' 
  },
  { 
    label: "Decide warranty claim dispositions", 
    check: (cid) => canDo(cid, ScreenId.WARRANTY_DECIDE_DISPOSITION, 'A'), 
    type: 'enable' 
  },
  { 
    label: "Configure provisioning station parameters", 
    check: (cid) => canDo(cid, ScreenId.PROVISIONING_STATION_SETUP, 'E'), 
    type: 'enable' 
  },
  { 
    label: "View detailed telemetry history", 
    check: (cid) => canView(cid, ScreenId.TELEMETRY_HISTORY_VIEW), 
    type: 'enable' 
  },
  { 
    label: "Access System Settings", 
    check: (cid) => canView(cid, ScreenId.SETTINGS), 
    type: 'restrict' 
  },
  { 
    label: "Manage API Keys and Webhooks", 
    check: (cid) => canView(cid, ScreenId.SETTINGS_API_KEYS), 
    type: 'restrict' 
  },
  { 
    label: "Modify Compliance Findings", 
    check: (cid) => canDo(cid, ScreenId.COMPLIANCE_FINDINGS_EDIT, 'C'), 
    type: 'restrict' 
  }
];

export const getRoleCapabilities = (clusterId: string) => {
  const enabled: string[] = [];
  const restricted: string[] = [];

  CAPABILITY_CHECKS.forEach(({ label, check, type }) => {
    const isAllowed = check(clusterId);
    if (type === 'enable' && isAllowed) {
      enabled.push(label);
    } else if (type === 'restrict' && !isAllowed) {
      // Rephrase for restriction list
      if (label.startsWith("Access")) restricted.push(`Cannot ${label.toLowerCase()}`);
      else restricted.push(`Cannot ${label.toLowerCase()}`);
    }
  });

  // Default fallback if empty
  if (enabled.length === 0) enabled.push("View basic dashboard information");

  return { enabled, restricted };
};
