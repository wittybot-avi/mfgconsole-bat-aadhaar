import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { packAssemblyService } from '../services/packAssemblyService';
import { batteryService } from '../services/api';
import { EolTestRun, EolTestItem, PackInstance, PackStatus, Battery as BatteryType } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, ShieldCheck, CheckCircle, XCircle, Info, ClipboardList, PlayCircle, Battery, Zap, Cpu, History } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { STATUS_MAP, workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

export default function EolQaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [testRun, setTestRun] = useState<EolTestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [createdBattery, setCreatedBattery] = useState<BatteryType | null>(null);

  const clusterId = currentCluster?.id || '';
  const isQA = clusterId === 'C3' || clusterId === 'CS';
  const isReviewMode = location.pathname.includes('eol-review');

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (pid: string) => {
    setLoading(true);
    const p = await packAssemblyService.getPack(pid);
    if (!p) {
        addNotification({ title: 'Redirection', message: 'Pack record missing.', type: 'info' });
        navigate('/assure/eol');
        return;
    }
    setPack(p);
    const actor = `${currentRole?.name} (${clusterId})`;
    const run = await eolQaService.createOrLoadTestRun(pid, actor);
    setTestRun(run);

    if (p.batteryRecordCreated) {
        const batteries = await batteryService.getBatteries();
        const found = batteries.find(b => b.packId === p.id);
        if (found) setCreatedBattery(found);
    }

    setLoading(false);
  };

  const updateItem = async (itemId: string, patch: Partial<EolTestItem>) => {
    if (!id || !isQA || isReviewMode) return;
    try {
      const updatedRun = await eolQaService.updateTestItem(id, itemId, patch);
      setTestRun(updatedRun);
    } catch (e) {
      addNotification({ title: 'Error', message: 'Failed to update test result.', type: 'error' });
    }
  };

  const handleStartTest = async () => {
    if (!id || isReviewMode) return;
    setProcessing(true);
    try {
        const actor = `${currentRole?.name} (${clusterId})`;
        await eolQaService.startEolTest(id, actor);
        addNotification({ title: "Started", message: "EOL session active.", type: "info" });
        await loadData(id);
    } finally {
        setProcessing(false);
    }
  };

  const handleDecision = async (decision: 'PASS' | 'QUARANTINE' | 'SCRAP') => {
    if (!id || isReviewMode) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await eolQaService.finalizeDecision(id, decision, { actor, notes: 'EOL Session Closure' });
      addNotification({ title: 'Success', message: `Pack disposition: ${decision}`, type: 'success' });
      await loadData(id);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateIdentity = async () => {
    if (!id || isReviewMode) return;
    setProcessing(true);
    try {
        const actor = `${currentRole?.name} (${clusterId})`;
        const battery = await eolQaService.createBatteryFromPack(id, actor);
        setCreatedBattery(battery);
        addNotification({ title: "Certified", message: "Battery Identity generated (S8).", type: "success" });
        await loadData(id);
    } catch (e: any) {
        addNotification({ title: "Failed", message: e.message, type: "error" });
    } finally {
        setProcessing(false);
    }
  };

  if (loading || !pack || !testRun) return <div className="p-20 text-center animate-pulse">Syncing QA record...</div>;

  const guards = workflowGuardrails.getPackGuardrail(pack, clusterId);
  const isFinalized = pack.status === PackStatus.PASSED || pack.status === PackStatus.QUARANTINED || pack.status === PackStatus.SCRAPPED;
  const canModify = isQA && !isFinalized && pack.eolStatus === 'IN_TEST' && !isReviewMode;
  
  const totalRequired = testRun.items.filter(i => i.required).length;
  const runRequired = testRun.items.filter(i => i.required && i.status !== 'NOT_RUN').length;
  const isReadyForDecision = runRequired === totalRequired;

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode={isReviewMode ? "REV" : "S7"}
        title={isReviewMode ? "EOL Audit & Review" : "EOL Testing / QA Analysis"}
        objective={isReviewMode ? "Audit immutable test results and certification provenance." : "Execute final electrical and BMS verification steps to certify pack compliance."}
        entityLabel={pack.id}
        status={pack.status}
        diagnostics={{ route: location.pathname, entityId: pack.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/assure/eol')} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Back to Queue
            </Button>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-slate-400">Batch Link:</span>
               <Badge variant="outline" className="font-mono text-xs">{pack.batchId || 'UNLINKED'}</Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {!isReviewMode && <NextStepsPanel entity={pack} type="PACK" />}

            <Card>
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30">
                    <CardTitle className="text-base flex items-center gap-2"><ClipboardList size={18} className="text-primary"/> EL Test Execution Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex items-center gap-6">
                   <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1 font-bold">
                        <span>Checklist Completion</span>
                        <span>{runRequired} / {totalRequired}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(runRequired/totalRequired)*100}%` }} />
                      </div>
                   </div>
                   <div className="shrink-0 text-center px-4 border-l">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Station State</p>
                        <Badge variant={pack.eolStatus === 'IN_TEST' ? 'default' : 'outline'} className="mt-1">
                            {pack.eolStatus || 'QUEUED'}
                        </Badge>
                   </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="border-b flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-lg">Test Matrix (Procedure Alpha)</CardTitle>
                    {!isReviewMode && pack.eolStatus !== 'IN_TEST' && !isFinalized && (
                        <ActionGuard 
                            guard={guards.startEol} 
                            onClick={handleStartTest} 
                            label="Start Test Cycle" 
                            icon={PlayCircle} 
                            size="sm"
                            actionName="Start_EOL_Session"
                            entityId={pack.id}
                        />
                    )}
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                            <TableHead>Parameter</TableHead>
                            <TableHead>Expected / Limits</TableHead>
                            <TableHead>Measurement</TableHead>
                            <TableHead className="text-right">Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody>
                          {testRun.items.map(item => (
                            <TableRow key={item.id} className={!isReviewMode && pack.eolStatus !== 'IN_TEST' ? 'opacity-50' : ''}>
                               <TableCell><span className="text-sm font-semibold">{item.name}</span></TableCell>
                               <TableCell className="text-xs text-muted-foreground font-mono">{item.threshold || 'Binary'}</TableCell>
                               <TableCell>
                                  {item.unit ? (
                                    <div className="flex items-center gap-2 max-w-[120px]">
                                       <Input className="h-8 text-xs font-mono" type="number" disabled={!canModify} value={item.measurement || ''} onChange={(e) => updateItem(item.id, { measurement: parseFloat(e.target.value) || 0 })} />
                                       <span className="text-xs text-muted-foreground">{item.unit}</span>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1">
                                       <Button variant={item.status === 'PASS' ? 'default' : 'outline'} size="sm" className={`h-7 text-[10px] ${item.status === 'PASS' ? 'bg-emerald-600' : ''}`} disabled={!canModify} onClick={() => updateItem(item.id, { status: 'PASS' })}>OK</Button>
                                       <Button variant={item.status === 'FAIL' ? 'destructive' : 'outline'} size="sm" className="h-7 text-[10px]" disabled={!canModify} onClick={() => updateItem(item.id, { status: 'FAIL' })}>FAIL</Button>
                                    </div>
                                  )}
                               </TableCell>
                               <TableCell className="text-right">
                                   {item.status === 'PASS' ? <CheckCircle size={18} className="text-emerald-500 ml-auto" /> : item.status === 'FAIL' ? <XCircle size={18} className="text-rose-500 ml-auto" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200 ml-auto" />}
                               </TableCell>
                            </TableRow>
                          ))}
                      </tbody>
                   </Table>
                </CardContent>
            </Card>

            {isReviewMode && (
                <Card className="border-indigo-100 bg-indigo-50/20 dark:bg-indigo-900/10">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><History size={18} className="text-indigo-600"/> QA Provenance</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Performed By</p>
                                <p className="font-medium">{pack.eolPerformedBy || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Timestamp</p>
                                <p className="font-medium">{pack.eolTimestamp ? new Date(pack.eolTimestamp).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
          </div>

          <div className="space-y-6">
              <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">QA Console</CardTitle></CardHeader>
                  <CardContent className="space-y-6 pt-6">
                      <div className="space-y-4">
                        <ActionGuard 
                            guard={{ ...guards.markEolPass, allowed: guards.markEolPass.allowed && !isReviewMode }} 
                            onClick={() => handleDecision('PASS')} 
                            label="Certify PASS" 
                            icon={ShieldCheck} 
                            loading={processing}
                            className={`w-full h-12 border-none shadow-lg shadow-emerald-500/20 ${isReadyForDecision ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800'}`}
                            actionName="Finalize_EOL_PASS"
                            entityId={pack.id}
                        />
                        <ActionGuard 
                            guard={{ ...guards.markEolPass, allowed: guards.markEolPass.allowed && !isReviewMode }} 
                            onClick={() => handleDecision('QUARANTINE')} 
                            label="Mark QUARANTINE" 
                            icon={XCircle} 
                            variant="outline"
                            className="w-full text-white border-slate-700 hover:bg-slate-800 h-12"
                            actionName="Finalize_EOL_FAIL"
                            entityId={pack.id}
                        />
                      </div>
                      
                      <div className="pt-6 border-t border-slate-800 space-y-4">
                          {pack.eolStatus === 'PASS' && !pack.batteryRecordCreated && !isReviewMode && (
                            <ActionGuard 
                                guard={guards.createBatteryIdentity}
                                onClick={handleCreateIdentity}
                                label="Approve for Provisioning"
                                icon={Battery}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-bold"
                                actionName="Bridge_S7_to_S8"
                                entityId={pack.id}
                            />
                          )}
                          {pack.batteryRecordCreated && createdBattery && (
                            <Button 
                                onClick={() => navigate(`/assure/provisioning/${createdBattery.id}`)}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 shadow-xl shadow-indigo-500/30"
                            >
                                <Cpu size={18} /> Go to Provisioning (S9)
                            </Button>
                          )}
                          {isFinalized && !isReviewMode && (
                            <Button variant="ghost" className="w-full text-slate-500" onClick={() => navigate('/assure/eol')}>
                                Return to QA Queue
                            </Button>
                          )}
                          <p className="text-[10px] text-slate-500 text-center italic">Enabling Stage S8 finalizes the asset's immutable identity.</p>
                      </div>
                  </CardContent>
                  <div className="absolute -bottom-8 -left-8 h-24 w-24 bg-indigo-500/10 blur-3xl rounded-full" />
              </Card>

              <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                 <Zap size={24} className="text-amber-500" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Telemetry Hook</p>
                 <p className="text-[9px] text-slate-400">Telemetry feed is mapped to workstation EOL-01 during active session.</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}