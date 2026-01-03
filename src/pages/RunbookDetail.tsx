import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '../components/ui/design-system';
import { ArrowLeft, CheckCircle, Circle, Lock, ExternalLink, ShieldAlert, ArrowRight, BookOpen, Search, Filter } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { StageHeader } from '../components/SopGuidedUX';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { dispatchService, batteryService } from '../services/api';
import { packAssemblyService } from '../services/packAssemblyService';
import { CellLot, DispatchOrder, PackInstance, Battery } from '../domain/types';
import { ScreenId } from '../rbac/screenIds';
import { navigateCanonical } from '../app/navigation';

// Mock Step Definitions - PP-061B: Using ScreenIds for canonical mapping
const RUNBOOK_STEPS: Record<string, any[]> = {
  'mfg-run': [
    { id: 'S1', title: 'Design Definition', objective: 'Select and authorize SKU blueprint.', screenId: ScreenId.SKU_LIST, role: 'Engineering' },
    { id: 'S3', title: 'Batch Authorization', objective: 'Authorize production lot and release to floor.', screenId: ScreenId.BATCHES_LIST, role: 'Supervisor' },
    { id: 'S5', title: 'Module Integration', objective: 'Bind cell units to module lattice.', screenId: ScreenId.MODULE_ASSEMBLY_LIST, role: 'Operator' },
    { id: 'S6', title: 'Pack Final Assembly', objective: 'Integrate modules and bind BMS.', screenId: ScreenId.PACK_ASSEMBLY_LIST, role: 'Operator' },
    { id: 'S7', title: 'EOL Testing', objective: 'Execute final electrical verification.', screenId: ScreenId.EOL_QA_QUEUE, role: 'QA' },
    { id: 'S8', title: 'Battery Certification', objective: 'Generate digital twin and certify identity.', screenId: ScreenId.BATTERIES_LIST, role: 'QA' },
    { id: 'S9', title: 'Provisioning', objective: 'Pair BMS and apply config baseline.', screenId: ScreenId.PROVISIONING_QUEUE, role: 'BMS Engineer' }
  ],
  'cell-receipt': [
    { id: 'S2', title: 'Inbound Documentation', objective: 'Register shipment and capture PO/GRN identifiers.', screenId: ScreenId.CELL_LOTS_LIST, role: 'Logistics' },
    { id: 'S2', title: 'Lot Serialization', objective: 'Generate unique cell identities.', screenId: ScreenId.CELL_LOTS_LIST, role: 'Logistics' },
    { id: 'S4', title: 'Identity Verification', objective: 'Confirm physical serial numbers via scanner.', screenId: ScreenId.CELL_LOTS_LIST, role: 'Operator' }
  ],
  'logistics-transfer': [
    { id: 'S10', title: 'Inventory Reservation', objective: 'Allocate certified packs to shipment.', screenId: ScreenId.INVENTORY, role: 'Logistics' },
    { id: 'S11', title: 'Dispatch Planning', objective: 'Prepare manifest and transport docs.', screenId: ScreenId.DISPATCH_LIST, role: 'Logistics' },
    { id: 'S12', title: 'Custody Transfer', objective: 'Formal sign-off at destination dock.', screenId: ScreenId.CUSTODY, role: 'External' }
  ],
  'warranty-claims': [
    { id: 'S13', title: 'Claim Intake', objective: 'Submit field report with evidence.', screenId: ScreenId.WARRANTY_EXTERNAL_INTAKE, role: 'External' },
    { id: 'S14', title: 'Technical RCA', objective: 'Analyze telemetry and physical state.', screenId: ScreenId.WARRANTY, role: 'Engineering' },
    { id: 'S15', title: 'Final Disposition', objective: 'Repair/Replace/Scrap decision.', screenId: ScreenId.WARRANTY, role: 'Supervisor' }
  ]
};

const RUNBOOK_META: Record<string, any> = {
  'mfg-run': { title: 'Manufacturing Execution Run', objective: 'End-to-end shopfloor production flow.' },
  'cell-receipt': { title: 'Material Receipt & Serialization', objective: 'Secure material intake and identity generation.' },
  'logistics-transfer': { title: 'Dispatch & Custody Chain', objective: 'Secure asset transfer across supply chain nodes.' },
  'warranty-claims': { title: 'Warranty Lifecycle Management', objective: 'Formal resolution of field anomalies.' }
};

export default function RunbookDetail() {
  const { runbookId } = useParams();
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  
  const [contextList, setContextList] = useState<any[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  
  const steps = runbookId ? RUNBOOK_STEPS[runbookId] : [];
  const meta = runbookId ? RUNBOOK_META[runbookId] : null;

  useEffect(() => {
    if (runbookId === 'cell-receipt') {
        cellTraceabilityService.listLots().then(setContextList);
    } else if (runbookId === 'logistics-transfer') {
        dispatchService.getOrders().then(setContextList);
    } else if (runbookId === 'mfg-run') {
        packAssemblyService.listPacks().then(setContextList);
    }
  }, [runbookId]);

  if (!runbookId || !meta) return <div className="p-20 text-center">Runbook not found.</div>;

  const handleStepNavigate = (step: any) => {
      // Logic for contextual detail vs list
      let params: Record<string, string> | undefined = undefined;
      let finalScreenId = step.screenId;

      if (selectedContextId) {
          params = { 
            lotId: selectedContextId, 
            id: selectedContextId, 
            buildId: selectedContextId, 
            batteryId: selectedContextId,
            claimId: selectedContextId,
            dispatchId: selectedContextId
          };
          
          // Smart detour to detail screens if context exists
          if (step.screenId === ScreenId.SKU_LIST) finalScreenId = ScreenId.SKU_DETAIL;
          if (step.screenId === ScreenId.BATCHES_LIST) finalScreenId = ScreenId.BATCHES_DETAIL;
          if (step.screenId === ScreenId.MODULE_ASSEMBLY_LIST) finalScreenId = ScreenId.MODULE_ASSEMBLY_DETAIL;
          if (step.screenId === ScreenId.PACK_ASSEMBLY_LIST) finalScreenId = ScreenId.PACK_ASSEMBLY_DETAIL;
          if (step.screenId === ScreenId.BATTERIES_LIST) finalScreenId = ScreenId.BATTERIES_DETAIL;
          if (step.screenId === ScreenId.EOL_QA_QUEUE) finalScreenId = ScreenId.EOL_DETAILS;
          if (step.screenId === ScreenId.INVENTORY) finalScreenId = ScreenId.INVENTORY_DETAIL;
          if (step.screenId === ScreenId.DISPATCH_LIST) finalScreenId = ScreenId.DISPATCH_DETAIL;
      }

      navigateCanonical(navigate, finalScreenId, params);
  };

  return (
    <div className="pb-12 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/runbooks')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Runbooks
        </Button>
      </div>

      <StageHeader 
        stageCode="GUIDE"
        title={meta.title}
        objective={meta.objective}
        entityLabel="Process Guide"
        status="ACTIVE"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {contextList.length > 0 && (
            <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                    <Filter className="text-muted-foreground h-4 w-4" />
                    <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Target Context (Order/Lot/Pack)</label>
                        <select 
                            className="w-full bg-white dark:bg-slate-950 border rounded h-10 px-2 text-sm font-bold"
                            value={selectedContextId}
                            onChange={e => setSelectedContextId(e.target.value)}
                        >
                            <option value="">Select identity to evaluate readiness...</option>
                            {contextList.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.lotCode || item.orderNumber || item.packSerial || item.id}
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>
        )}

        <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-12 py-4">
           {steps.map((step, index) => {
             const isPartner = currentCluster?.id === 'C9';
             const isQA = currentCluster?.id === 'C3';
             const isLogistics = currentCluster?.id === 'C6';
             const isBMS = currentCluster?.id === 'C5';
             const isSuper = currentCluster?.id === 'CS';
             
             let blocked = false;
             let reason = "";

             if (step.role === 'QA' && !isQA && !isSuper) {
                 blocked = true;
                 reason = "Requires C3 (QA) Cluster permissions.";
             }
             if (step.role === 'External' && !isPartner && !isSuper) {
                 blocked = true;
                 reason = "Requires C9 (External Partner) authorization.";
             }
             if (step.role === 'Logistics' && !isLogistics && !isSuper) {
                 blocked = true;
                 reason = "Requires C6 (Logistics) permissions.";
             }
             if (step.role === 'BMS Engineer' && !isBMS && !isSuper) {
                 blocked = true;
                 reason = "Requires C5 (BMS/Firmware) permissions.";
             }

             return (
               <div key={index} className="relative">
                  {/* Spine Indicator */}
                  <div className={`absolute -left-[41px] h-6 w-6 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-950 z-10 ${blocked ? 'border-slate-200 text-slate-300' : 'border-primary text-primary shadow-[0_0_10px_rgba(79,70,229,0.2)]'}`}>
                    <span className="text-[10px] font-bold">{step.id}</span>
                  </div>

                  <Card className={`overflow-hidden transition-all ${blocked ? 'opacity-70 grayscale-[0.5]' : 'hover:border-primary/50 hover:shadow-md'}`}>
                    <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{step.title}</h3>
                                <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter bg-slate-100">{step.role}</Badge>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{step.objective}</p>
                            
                            {blocked ? (
                                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded p-3 flex items-start gap-2">
                                    <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{reason}</p>
                                </div>
                            ) : (
                                <Button onClick={() => handleStepNavigate(step)} size="sm" variant="outline" className="gap-2 hover:bg-primary hover:text-white transition-colors">
                                    Go to Workstation <ExternalLink size={14} />
                                </Button>
                            )}
                        </div>

                        <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l">
                            {index === 0 && !blocked ? (
                                <div className="text-center space-y-2">
                                    <div className="h-8 w-8 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle size={20} />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase text-emerald-600">Active</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-2">
                                    <div className={`h-8 w-8 rounded-full border-2 border-dashed flex items-center justify-center mx-auto ${blocked ? 'border-slate-300' : 'border-slate-300'}`}>
                                        <Circle size={16} className="text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">SOP Gate</p>
                                </div>
                            )}
                        </div>
                    </div>
                  </Card>
               </div>
             );
           })}
        </div>

        <Card className="bg-primary/5 border-primary/20 border-2 border-dashed">
            <CardContent className="p-6 flex items-center gap-6">
                <BookOpen className="h-10 w-10 text-primary opacity-50 shrink-0" />
                <div className="space-y-1">
                    <h4 className="font-bold">Operational Spine Compliance</h4>
                    <p className="text-sm text-muted-foreground">Select a target context to verify real-time certification and provisioning status.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}