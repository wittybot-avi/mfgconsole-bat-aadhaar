
// Status Enums
export enum BatchStatus {
  DRAFT = 'Draft',
  RELEASED_TO_PRODUCTION = 'Released to Production',
  IN_PRODUCTION = 'In Production',
  IN_EOL_TEST = 'In EOL Test',
  QA_REVIEW = 'QA Review',
  ON_HOLD = 'On Hold',
  RELEASED_TO_INVENTORY = 'Released to Inventory',
  DISPATCHED = 'Dispatched',
  CLOSED = 'Closed',
  SCRAPPED = 'Scrapped'
}

export enum BatteryStatus {
  ASSEMBLY = 'Assembly',
  PROVISIONING = 'Provisioning',
  QA_TESTING = 'QA Testing',
  IN_INVENTORY = 'In Inventory',
  IN_TRANSIT = 'In Transit',
  DEPLOYED = 'Deployed',
  RMA = 'RMA',
  RETIRED = 'Retired',
  SCRAPPED = 'Scrapped'
}

export enum InventoryStatus {
  PENDING_PUTAWAY = 'Pending Put-away',
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  QUARANTINED = 'Quarantined',
  DISPATCHED = 'Dispatched'
}

export enum DispatchStatus {
  DRAFT = 'Draft',
  READY = 'Ready',
  DISPATCHED = 'Dispatched',
  CANCELLED = 'Cancelled'
}

export enum CustodyStatus {
  AT_FACTORY = 'At Factory',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered', // Physical arrival
  ACCEPTED = 'Accepted',   // Signed off
  REJECTED = 'Rejected'    // Returned/Issue
}

export enum QaDisposition {
  PASS = 'PASS',
  FAIL = 'FAIL',
  HOLD = 'HOLD',
  REWORK = 'REWORK',
  SCRAP = 'SCRAP'
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum UserRole {
  MANUFACTURER_ADMIN = 'Manufacturer Admin',
  QA_ENGINEER = 'QA Engineer',
  LOGISTICS_OPERATOR = 'Logistics Operator'
}

export enum ModuleStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  SEALED = 'SEALED',
  CONSUMED = 'CONSUMED',
  QUARANTINED = 'QUARANTINED'
}

export enum PackStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_EOL = 'READY_FOR_EOL',
  IN_EOL_TEST = 'IN_EOL_TEST',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  QUARANTINED = 'QUARANTINED',
  RELEASED = 'RELEASED',
  SCRAPPED = 'SCRAPPED',
  FINALIZED = 'FINALIZED',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

export interface ModuleInstance {
  id: string;
  skuId: string;
  skuCode: string;
  batchId?: string;
  targetCells: number;
  boundCellSerials: string[];
  status: ModuleStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  actor?: string;
}

export interface PackInstance {
  id: string;
  skuId: string;
  skuCode: string;
  batchId?: string;
  moduleIds: string[];
  status: PackStatus;
  packSerial: string;
  bmsSerial: string;
  firmwareVersion: string;
  qcStatus: 'PENDING' | 'PASSED' | 'FAILED';
  destination?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  actor?: string;
  requiredModules?: number;
  bmsId?: string;
  // Patch P40 EOL Fields (S7)
  eolStatus?: 'PENDING' | 'IN_TEST' | 'PASS' | 'FAIL';
  eolMeasuredSummary?: Record<string, any>;
  eolPerformedBy?: string;
  eolTimestamp?: string;
  eolFailReason?: string;
  batteryRecordCreated?: boolean;
}

export type EolTestStatus = 'NOT_RUN' | 'PASS' | 'FAIL' | 'NA';

export interface EolTestItem {
  id: string;
  group: 'Electrical' | 'Thermal' | 'BMS' | 'Mechanical';
  name: string;
  required: boolean;
  status: EolTestStatus;
  measurement?: number;
  unit?: string;
  threshold?: string;
  comment?: string;
}

export interface EolTestRun {
  id: string;
  packId: string;
  startedAt: string;
  completedAt?: string;
  actor: string;
  items: EolTestItem[];
  computedResult: 'PASS' | 'FAIL' | 'PENDING';
  finalDecision?: 'PASS' | 'FAIL' | 'QUARANTINE' | 'SCRAP';
  decisionBy?: string;
  decisionAt?: string;
  notes?: string;
}

export interface QuarantineRecord {
  id: string;
  packId: string;
  reason: string;
  ncrId?: string;
  disposition?: 'REWORKED' | 'REPLACED_MODULE' | 'REPLACED_BMS' | 'RETEST_REQUIRED' | 'SCRAP';
  createdAt: string;
  createdBy: string;
  releasedAt?: string;
  releasedBy?: string;
  notes?: string;
}

export interface CellLot {
  id: string;
  lotCode: string;
  supplierName: string;
  supplierLotNo: string;
  chemistry: 'LFP' | 'NMC' | 'LTO' | 'Na-Ion';
  formFactor: 'Prismatic' | 'Cylindrical' | 'Pouch';
  capacityAh: number;
  receivedDate: string;
  quantityReceived: number;
  status: CellLotStatus;
  updatedAt: string;
  createdAt: string;
  generatedCount: number;
  scannedCount: number;
  boundCount: number;
  // Patch P36 Inbound Docs
  poNumber?: string;
  invoiceNumber?: string;
  grnNumber?: string;
  qcPassed?: boolean;
}

export interface BatchNote {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  type?: string;
}

export interface SupplierLot {
  id: string;
  lotType: string;
  supplierName: string;
  supplierLotId: string;
  receivedDate: string;
  qtyConsumed: number;
}

export interface Batch {
  id: string;
  batchNumber: string;
  plantId: string;
  lineId: string;
  shiftId: string;
  supervisorId: string;
  createdBy: string;
  createdAt: string;
  sku: string;
  packModelId: string;
  packVariant: string;
  chemistry: string;
  seriesCount: number;
  parallelCount: number;
  nominalVoltageV: number;
  capacityAh: number;
  energyWh: number;
  targetQuantity: number;
  customerProgram: string;
  bomVersion: string;
  cellSpec: string;
  bmsSpec: string;
  mechanicalsSpec: string;
  supplierLots: SupplierLot[];
  processRouteId: string;
  stationRecipeVersion: string;
  startPlannedAt: string;
  status: BatchStatus;
  qtyStarted: number;
  qtyBuilt: number;
  qtyPassedEOL: number;
  qtyFailedEOL: number;
  qtyReworked: number;
  yieldPct: number;
  eolPassRatePct: number;
  riskLevel: RiskLevel;
  holdRequestPending: boolean;
  closeRequestByProd: boolean;
  closeApprovedByQA: boolean;
  notes: BatchNote[];
}

export interface AssemblyEvent {
  id: string;
  stationId: string;
  operatorId: string;
  eventType: string;
  timestamp: string;
}

export interface ProvisioningLogEntry {
  id: string;
  timestamp: string;
  stationId: string;
  step: string;
  outcome: 'PASS' | 'FAIL' | 'INFO';
  operator: string;
}

export interface EolMeasurements {
  voltage: number;
  capacityAh: number;
  internalResistance: number;
  temperatureMax: number;
  cellBalancingDelta: number;
  timestamp: string;
}

export interface InventoryMovementEntry {
  id: string;
  timestamp: string;
  type: 'PUT_AWAY' | 'MOVE' | 'RESERVE' | 'QUARANTINE' | 'RELEASE';
  fromLocation?: string;
  toLocation?: string;
  operator: string;
  details?: string;
}

export interface CustodyEvent {
  id: string;
  timestamp: string;
  status: CustodyStatus;
  location: string;
  handler: string;
  notes?: string;
  dispatchId?: string;
  reasonCode?: string;
}

export interface Battery {
  id: string;
  serialNumber: string;
  packId: string; // Linked Pack
  skuId: string; // Derived SKU
  batchId: string;
  qrCode: string;
  plantId: string;
  lineId?: string;
  stationId?: string;
  status: BatteryStatus;
  location: string;
  lastSeen: string;
  manufacturedAt?: string;
  assemblyEvents: AssemblyEvent[];
  reworkFlag: boolean;
  scrapFlag: boolean;
  provisioningStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  cryptoProvisioned: boolean;
  firmwareVersion?: string;
  bmsUid?: string;
  calibrationProfile?: string;
  calibrationStatus?: string;
  provisioningLogs?: ProvisioningLogEntry[];
  eolStatus?: string;
  eolMeasurements?: EolMeasurements;
  qaDisposition?: QaDisposition;
  releaseToInventory?: boolean;
  inventoryStatus?: InventoryStatus;
  inventoryLocation?: string;
  inventoryEnteredAt?: string;
  inventoryMovementLog?: InventoryMovementEntry[];
  custodyStatus?: CustodyStatus;
  soh: number;
  soc: number;
  voltage: number;
  capacityAh: number;
  internalResistance?: number;
  eolResult?: 'PASS' | 'FAIL';
  certificateRef?: string;
  qaApproverId?: string;
  qaApprovedAt?: string;
  thermalResult?: 'PASS' | 'FAIL';
  dispatchStatus?: string;
  dispatchId?: string;
  notes: any[];
  custodyLog?: CustodyEvent[];
  eolLog?: EolLogEntry[];
  reservedAt?: string;
  reservedBy?: string;
  // Patch P40 Fields (S8/S9)
  certificationStatus?: 'CERTIFIED' | 'REVOKED' | 'PENDING';
  certificateId?: string;
  configProfile?: string;
  provisioningBy?: string;
  provisioningTimestamp?: string;
}

export interface KPIData {
  totalBatteries: number;
  activeBatches: number;
  eolPassRate: number;
  exceptions: number;
  inTransit: number;
}

export interface MovementOrder {
  id: string;
  batteryId: string;
  fromLocation: string;
  toLocation: string;
  status: string;
}

export interface TelemetryPoint {
  timestamp: number;
  voltage: number;
  current: number;
  temperature: number;
  soc: number;
  cellMaxVol: number;
  cellMinVol: number;
}

export interface EolLogEntry {
  id: string;
  timestamp: string;
  stationId: string;
  action: string;
  outcome: string;
  operator: string;
}

export interface CellSerialRecord {
  serial: string;
  lotId: string;
  status: CellSerialStatus;
  generatedAt: string;
  scannedAt?: string;
  exportedAt?: string;
  actor: string;
}

export type CellLotStatus = 'DRAFT' | 'SERIALIZED' | 'EXPORTED' | 'SCANNED' | 'READY_TO_BIND' | 'PUBLISHED' | 'CONSUMED_PARTIAL' | 'CLOSED';
export type CellSerialStatus = 'GENERATED' | 'SCANNED' | 'BOUND' | 'AVAILABLE' | 'QUARANTINED';

export interface CellBindingRecord {
  moduleId: string;
  serial: string;
  lotId: string;
  lotCode: string;
  boundAt: string;
  actor: string;
  chemistry: string;
}

export interface ExceptionRecord {
  id: string;
  entityType: 'module' | 'pack';
  entityId: string;
  severity: RiskLevel | 'MED';
  message: string;
  createdAt: string;
  actor: string;
}

export interface DeviceBinding {
  entityType: 'PACK' | 'MODULE';
  entityId: string;
  deviceType: 'BMS';
  deviceId: string;
  boundAt: string;
  actor: string;
}

export interface DispatchOrder {
  id: string;
  orderNumber: string;
  status: DispatchStatus;
  custodyStatus?: CustodyStatus;
  customerName: string;
  destinationAddress: string;
  expectedShipDate: string;
  batteryIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;
  packingListRef?: string;
  manifestRef?: string;
  invoiceRef?: string;
  carrierName?: string;
  // Patch P36 Transport Docs
  vehicleNumber?: string;
  driverContact?: string;
}

export enum ClaimStatus {
  OPEN = 'OPEN',
  UNDER_ANALYSIS = 'UNDER_ANALYSIS',
  AWAITING_EVIDENCE = 'AWAITING_EVIDENCE',
  DECIDED = 'DECIDED',
  CLOSED = 'CLOSED'
}

export enum ClaimPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum FailureCategory {
  LOGISTICS_DAMAGE = 'LOGISTICS_DAMAGE',
  FIELD_MISUSE = 'FIELD_MISUSE',
  AGING_WEAR = 'AGING_WEAR',
  UNKNOWN = 'UNKNOWN'
}

export enum ClaimDisposition {
  REPAIR = 'REPAIR',
  REPLACE = 'REPLACE',
  REFUND = 'REFUND',
  REJECTED = 'REJECTED'
}

export enum LiabilityAttribution {
  MANUFACTURER = 'MANUFACTURER',
  SUPPLIER = 'SUPPLIER',
  LOGISTICS = 'LOGISTICS',
  CUSTOMER = 'CUSTOMER',
  UNKNOWN = 'UNKNOWN'
}

export interface WarrantyClaim {
  claimId: string;
  status: ClaimStatus;
  priority: ClaimPriority;
  evidenceAttachments: Array<{ id: string, fileName: string, type: string }>;
  reportedAt: string;
  createdByRole: string;
  createdByName: string;
  batteryId: string;
  batchId?: string;
  customerName: string;
  failureCategory: FailureCategory;
  symptoms: string;
  rca?: {
    suspectedCause: FailureCategory;
    contributingFactors: string[];
    analystNotes: string;
    analyzedAt: string;
    analyzedBy: string;
  };
  disposition?: ClaimDisposition;
  liabilityAttribution?: LiabilityAttribution;
  decisionNotes?: string;
  decidedAt?: string;
  decidedBy?: string;
  closureNotes?: string;
  closedAt?: string;
  updatedAt?: string;
}