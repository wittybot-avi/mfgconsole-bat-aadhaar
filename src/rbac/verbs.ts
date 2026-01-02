export type PermissionVerb = 'V' | 'C' | 'E' | 'A' | 'X' | 'M';

export const Verbs = {
  View: 'V' as PermissionVerb,
  Create: 'C' as PermissionVerb,
  Edit: 'E' as PermissionVerb,
  Approve: 'A' as PermissionVerb,
  Execute: 'X' as PermissionVerb, // e.g. Run Test, Dispatch
  Manage: 'M' as PermissionVerb, // Admin / Config
};

export const VERB_LABELS: Record<PermissionVerb, string> = {
  V: 'View',
  C: 'Create',
  E: 'Edit',
  A: 'Approve',
  X: 'Execute',
  M: 'Manage',
};