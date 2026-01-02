export interface PolicyChange {
  id: string;
  date: string;
  summary: string;
}

export const POLICY_CHANGELOG: PolicyChange[] = [
  {
    id: 'UI_PATCH_ADMIN_SETTINGS_CONTROL_PLANE_V1',
    date: '2024-05-24',
    summary: 'Added Settings Control Plane with preview panels for Profile, Users, Keys, Notifications.'
  },
  {
    id: 'UI_PATCH_RESOLVE_WARRANTY_SUITE_V1',
    date: '2024-05-24',
    summary: 'Implemented Warranty module with Claims workflow and External Intake for C9.'
  },
  {
    id: 'UI_PATCH_GOVERN_CUSTODY_SUITE_V1',
    date: '2024-05-24',
    summary: 'Added Chain of Custody tracking with Accept/Reject actions for C6 and C9.'
  },
  {
    id: 'UI_PATCH_GOVERN_COMPLIANCE_SUITE_V1',
    date: '2024-05-24',
    summary: 'Launched Compliance module with automated checks and Evidence Packs.'
  },
  {
    id: 'UI_PATCH_OBSERVE_ANALYTICS_SUITE_V1',
    date: '2024-05-24',
    summary: 'Deployed Analytics Suite with Quality Pareto and Logistics Dwell Time metrics.'
  }
];