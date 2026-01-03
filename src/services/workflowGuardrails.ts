import { ScreenId } from '../rbac/screenIds';
import { canDo } from '../rbac/can';
import { 
  ModuleStatus, 
  PackStatus, 
  BatchStatus, 
  BatteryStatus, 
  Battery, 
  ModuleInstance, 
  PackInstance, 
  Batch,
  CellLot,
  DispatchOrder,
  DispatchStatus
} from '../domain/types';

export interface GuardrailResult {
  allowed: boolean;
  reason: string;
}

export interface NextStep {
  label: string;
  screenId: ScreenId;
  params?: Record<string, string>;
  description: string;
  roleRequired: string;
}

/**
 * Standardized Status Mapping for UI Badges
 */
export const STATUS_MAP: Record<string, { label: string, variant: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  // Common
  DRAFT: { label: 'DRAFT', variant: 'outline' },
  ACTIVE: { label: 'ACTIVE', variant: 'success' },
  IN_PROGRESS: { label: 'IN PROGRESS', variant: 'default' },
  BLOCKED: { label: 'BLOCKED', variant: 'warning' },
  COMPLETED: { label: 'COMPLETED', variant: 'success' },
  FAILED: { label: 'FAILED', variant: 'destructive' },
  
  // Specific Overrides
  [BatchStatus.ON_HOLD]: { label: 'BLOCKED', variant: 'warning' },
  [BatchStatus.CLOSED]: { label: 'COMPLETED', variant: 'success' },
  [ModuleStatus.SEALED]: { label: 'COMPLETED', variant: 'success' },
  [ModuleStatus.CONSUMED]: { label: 'COMPLETED (LINKED)', variant: 'secondary' },
  [PackStatus.READY_FOR_EOL]: { label: 'IN PROGRESS (QUEUED)', variant: 'default' },
  [PackStatus.FINALIZED]: { label: 'COMPLETED', variant: 'success' },
  [BatteryStatus.DEPLOYED]: { label: 'COMPLETED (FIELD)', variant: 'success' },
  [BatteryStatus.SCRAPPED]: { label: 'FAILED (SCRAP)', variant: 'destructive' },
  [BatteryStatus.QA_TESTING]: { label: 'IN PROGRESS (QA)', variant: 'default' },
  [BatteryStatus.ASSEMBLY]: { label: 'ASSEMBLY', variant: 'outline' },
  [BatteryStatus.PROVISIONING]: { label: 'PROVISIONING', variant: 'secondary' }
};

export const STATUS_LABELS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  IN_PROGRESS: 'IN PROGRESS',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

class WorkflowGuardrailsService {
  /**
   * S2: Cell Lot Guardrails
   */
  getCellLotGuardrail(lot: CellLot, clusterId: string): Record<string, GuardrailResult> {
    const isLogistics = clusterId === 'C6' || clusterId === 'CS';
    const isOperator = clusterId === 'C2' || clusterId === 'CS';
    
    const docsComplete = !!(lot.poNumber && lot.invoiceNumber && lot.grnNumber);
    const serializationComplete = lot.generatedCount > 0;
    const scanComplete = lot.scannedCount >= lot.generatedCount && serializationComplete;

    return {
      generateSerials: {
        allowed: isLogistics && lot.status === 'DRAFT' && docsComplete,
        reason: !docsComplete ? "Prerequisite: Capture PO/Invoice/GRN docs" : lot.status !== 'DRAFT' ? "Already serialized" : "Logistics permissions required"
      },
      releaseToProd: {
        allowed: isLogistics && scanComplete && lot.qcPassed === true,
        reason: !scanComplete ? "Identity binding incomplete" : !lot.qcPassed ? "Incoming QC required" : ""
      }
    };
  }

  /**
   * SKU Guardrails
   */
  getSkuGuardrail(sku: any, clusterId: string): Record<string, GuardrailResult> {
    const canEdit = canDo(clusterId, ScreenId.SKU_LIST, 'E');
    return {
      activate: {
        allowed: canEdit && sku.status === 'DRAFT',
        reason: sku.status !== 'DRAFT' ? "Blueprint is already processed" : "Engineering permissions required (C4)"
      },
      createBatch: {
        allowed: sku.status === 'ACTIVE',
        reason: "Blueprint must be ACTIVATED before production use"
      }
    };
  }

  /**
   * Batch Guardrails
   */
  getBatchGuardrail(batch: Batch, clusterId: string): Record<string, GuardrailResult> {
    const isProd = clusterId === 'C2' || clusterId === 'CS';
    const isQA = clusterId === 'C3' || clusterId === 'CS';
    return {
      release: {
        allowed: isProd && batch.status === BatchStatus.DRAFT,
        reason: batch.status !== BatchStatus.DRAFT ? "Batch already released" : "Production Manager permissions required (C2)"
      },
      close: {
        allowed: (isProd || isQA) && batch.qtyBuilt >= batch.targetQuantity && batch.qtyPassedEOL > 0,
        reason: "Closure requires built quantity to meet target and units to pass EOL"
      }
    };
  }

  /**
   * S4: Module Guardrails
   */
  getModuleGuardrail(module: ModuleInstance, clusterId: string): Record<string, GuardrailResult> {
    const isOperator = clusterId === 'C2' || clusterId === 'CS';
    const isFull = module.boundCellSerials.length === module.targetCells;
    return {
      bind: {
        allowed: isOperator && module.status === ModuleStatus.IN_PROGRESS && !isFull,
        reason: isFull ? "Module is full" : module.status !== ModuleStatus.IN_PROGRESS ? "Module is sealed" : "Operator permissions required (C2)"
      },
      seal: {
        allowed: isOperator && isFull && module.status === ModuleStatus.IN_PROGRESS,
        reason: !isFull ? `Prerequisite: Bind all ${module.targetCells} cells (Currently ${module.boundCellSerials.length})` : "Module already sealed"
      }
    };
  }

  /**
   * S5-S7: Pack Guardrails
   */
  getPackGuardrail(pack: PackInstance, clusterId: string): Record<string, GuardrailResult> {
    const isOperator = clusterId === 'C2' || clusterId === 'CS';
    const isQA = clusterId === 'C3' || clusterId === 'CS';
    const hasRequiredModules = pack.moduleIds.length === (pack.requiredModules || 1);
    const hasBms = !!pack.bmsId;
    const hasSerial = !!pack.packSerial;

    return {
      finalize: {
        allowed: isOperator && hasRequiredModules && hasBms && hasSerial && pack.qcStatus === 'PASSED',
        reason: !hasRequiredModules ? "Incomplete module linkage" : !hasBms ? "BMS identity not bound" : !hasSerial ? "Serial identity not generated" : pack.qcStatus !== 'PASSED' ? "Assembly QC check failed" : ""
      },
      startEol: {
        allowed: isQA && (pack.status === PackStatus.READY_FOR_EOL || pack.eolStatus === 'PENDING'),
        reason: isQA ? "Test already in progress or completed" : "QA Analyst permissions required (C3)"
      },
      markEolPass: {
        allowed: isQA && pack.eolStatus === 'IN_TEST',
        reason: "Must start EOL test sequence first"
      },
      createBatteryIdentity: {
        allowed: (isQA || clusterId === 'CS') && pack.eolStatus === 'PASS' && !pack.batteryRecordCreated,
        reason: pack.eolStatus !== 'PASS' ? "Requires successful EOL PASS" : "Record already initialized"
      }
    };
  }

  /**
   * S8-S9: Battery Guardrails
   */
  getBatteryGuardrail(battery: Battery, clusterId: string): Record<string, GuardrailResult> {
    const isEng = clusterId === 'C5' || clusterId === 'CS';
    const isQA = clusterId === 'C3' || clusterId === 'CS';
    const isOperator = clusterId === 'C2' || clusterId === 'CS';

    return {
      provision: {
        allowed: (isEng || isOperator) && battery.provisioningStatus !== 'DONE',
        reason: battery.provisioningStatus === 'DONE' ? "Provisioning already finalized" : "BMS/Operator permissions required"
      },
      test: {
        allowed: isQA && battery.status === BatteryStatus.QA_TESTING,
        reason: "QA Analyst permissions required (C3)"
      }
    };
  }

  /**
   * S11: Dispatch Order Guardrails
   */
  getDispatchGuardrail(order: DispatchOrder, batteries: Battery[], clusterId: string): Record<string, GuardrailResult> {
    const isLogistics = clusterId === 'C6' || clusterId === 'CS';
    const allBatteriesReady = batteries.length > 0 && batteries.every(b => this.isBatteryDispatchReady(b).allowed);
    const hasDocs = !!(order.packingListRef && order.manifestRef);

    return {
      authorize: {
        allowed: isLogistics && order.status === DispatchStatus.DRAFT && allBatteriesReady && hasDocs,
        reason: !allBatteriesReady ? "Some units are not dispatch-ready" : !hasDocs ? "Missing required transport documents" : "Order already processed"
      }
    };
  }

  /**
   * Dispatch Readiness Check (S7-S9 Hard Gates)
   */
  isBatteryDispatchReady(battery: Battery): GuardrailResult {
    if (battery.eolResult !== 'PASS') {
      return { allowed: false, reason: "S7: Missing EOL PASS Certification" };
    }
    if (battery.certificationStatus !== 'CERTIFIED') {
      return { allowed: false, reason: "S8: Battery Identity not certified" };
    }
    if (battery.provisioningStatus !== 'DONE') {
      return { allowed: false, reason: "S9: BMS Provisioning incomplete" };
    }
    return { allowed: true, reason: "" };
  }

  /**
   * Guidance Logic - PP-061B: Returns ScreenId instead of path strings.
   */
  getNextRecommendedStep(entity: any, type: 'SKU' | 'BATCH' | 'MODULE' | 'PACK' | 'BATTERY' | 'LOT' | 'DISPATCH'): NextStep | null {
    switch (type) {
      case 'LOT':
        if (!entity.poNumber) return { label: 'Capture Docs', screenId: ScreenId.CELL_LOTS_DETAIL, params: { lotId: entity.id }, description: 'Bind PO/GRN identifiers to this lot.', roleRequired: 'Logistics' };
        if (entity.status === 'DRAFT') return { label: 'Generate IDs', screenId: ScreenId.CELL_LOTS_DETAIL, params: { lotId: entity.id }, description: 'Initialize unique cell identities.', roleRequired: 'Logistics' };
        if (entity.scannedCount < entity.generatedCount) return { label: 'Complete Scans', screenId: ScreenId.CELL_LOTS_DETAIL, params: { lotId: entity.id }, description: 'Perform physical verification of identities.', roleRequired: 'Operator' };
        if (!entity.qcPassed) return { label: 'Incoming QC', screenId: ScreenId.CELL_LOTS_DETAIL, params: { lotId: entity.id }, description: 'Record material inspection result.', roleRequired: 'QA' };
        if (entity.status === 'READY_TO_BIND') return { label: 'Release to Production', screenId: ScreenId.CELL_LOTS_DETAIL, params: { lotId: entity.id }, description: 'Allow these cells to be consumed in assembly.', roleRequired: 'Logistics' };
        break;
      case 'SKU':
        if (entity.status === 'DRAFT') return { label: 'Activate Spec', screenId: ScreenId.SKU_DETAIL, params: { id: entity.id }, description: 'Promote this blueprint to production status.', roleRequired: 'Engineering' };
        if (entity.status === 'ACTIVE') return { label: 'Create Batch', screenId: ScreenId.BATCHES_LIST, description: 'Start a manufacturing run using this blueprint.', roleRequired: 'Production' };
        break;
      case 'BATCH':
        if (entity.status === BatchStatus.DRAFT) return { label: 'Release to Line', screenId: ScreenId.BATCHES_DETAIL, params: { id: entity.id }, description: 'Begin assembly operations for this lot.', roleRequired: 'Supervisor' };
        if (entity.status === BatchStatus.IN_PRODUCTION) return { label: 'Link Components', screenId: ScreenId.MODULE_ASSEMBLY_LIST, description: 'Bind individual cells and modules to this batch.', roleRequired: 'Operator' };
        break;
      case 'MODULE':
        if (entity.status === ModuleStatus.IN_PROGRESS && entity.boundCellSerials.length < entity.targetCells) return { label: 'Bind Cells', screenId: ScreenId.MODULE_ASSEMBLY_DETAIL, params: { id: entity.id }, description: 'Scan cell serials into the digital ledger.', roleRequired: 'Operator' };
        if (entity.status === ModuleStatus.IN_PROGRESS && entity.boundCellSerials.length === entity.targetCells) return { label: 'Seal Module', screenId: ScreenId.MODULE_ASSEMBLY_DETAIL, params: { id: entity.id }, description: 'Lock the sub-assembly and verify integrity.', roleRequired: 'Operator' };
        if (entity.status === ModuleStatus.SEALED) return { label: 'Link to Pack Build', screenId: ScreenId.PACK_ASSEMBLY_LIST, description: 'Integrate this sealed module into a pack build.', roleRequired: 'Operator' };
        break;
      case 'PACK':
        if (entity.status === PackStatus.DRAFT || entity.status === PackStatus.IN_PROGRESS) return { label: 'QC & Finalize', screenId: ScreenId.PACK_ASSEMBLY_DETAIL, params: { id: entity.id }, description: 'Perform assembly QC and lock the record.', roleRequired: 'Operator' };
        if (entity.status === PackStatus.READY_FOR_EOL) return { label: 'Run EOL Test', screenId: ScreenId.EOL_RUN_TEST, params: { buildId: entity.id }, description: 'Hand over to QA for electrical verification.', roleRequired: 'QA' };
        if (entity.eolStatus === 'PASS' && !entity.batteryRecordCreated) return { label: 'Create Identity', screenId: ScreenId.EOL_DETAILS, params: { buildId: entity.id }, description: 'Generate certified battery twin record.', roleRequired: 'QA' };
        break;
      case 'BATTERY':
        if (entity.provisioningStatus !== 'DONE') return { label: 'Finalize Provisioning', screenId: ScreenId.PROVISIONING, params: { id: entity.id }, description: 'Connect BMS and verify config profile.', roleRequired: 'BMS Engineer' };
        if (entity.status === BatteryStatus.PROVISIONING && entity.provisioningStatus === 'DONE') return { label: 'Move to Inventory', screenId: ScreenId.INVENTORY, description: 'Confirm placement on warehouse shelf.', roleRequired: 'Logistics' };
        break;
      case 'DISPATCH':
        if (entity.batteryIds.length === 0) return { label: 'Add Units', screenId: ScreenId.DISPATCH_DETAIL, params: { id: entity.id }, description: 'Select certified packs for this shipment.', roleRequired: 'Logistics' };
        if (!entity.packingListRef) return { label: 'Prepare Docs', screenId: ScreenId.DISPATCH_DETAIL, params: { id: entity.id }, description: 'Generate required transport documentation.', roleRequired: 'Logistics' };
        if (entity.status === DispatchStatus.DRAFT) return { label: 'Authorize', screenId: ScreenId.DISPATCH_DETAIL, params: { id: entity.id }, description: 'Formal release for transport execution.', roleRequired: 'Supervisor' };
        break;
    }
    return null;
  }
}

export const workflowGuardrails = new WorkflowGuardrailsService();