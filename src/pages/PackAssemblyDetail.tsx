import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packAssemblyService } from '../services/packAssemblyService';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { skuService, Sku } from '../services/skuService';
import { PackInstance, PackStatus, ModuleInstance, ModuleStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Layers, ShieldCheck, Cpu, Box, Trash2, Database, ClipboardCheck, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';
import { routes } from '../../app/routes';

export default function PackAssemblyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [sku, setSku] = useState<Sku | null>(null);
  const [modules, setModules] = useState<ModuleInstance[]>([]);
  const [eligibleModules, setEligibleModules] = useState<ModuleInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('linkage');
  const [bmsInput, setBmsInput] = useState('');

  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (pid: string) => {
    setLoading(true);
    const p = await packAssemblyService.getPack(pid);
    if (!p) {
        addNotification({ title: 'Redirection', message: 'Build order not found.', type: 'info' });
        navigate(routes.packAssemblyList());
        return;
    }
    setPack(p);
    setBmsInput(p.bmsId || '');
    const s = await skuService.getSku(p.skuId);
    if (s) setSku(s);
    const modDetails = await Promise.all(p.moduleIds.map(mid => moduleAssemblyService.getModule(mid)));
    setModules(modDetails.filter(m => !!m) as ModuleInstance[]);
    const eligible = await packAssemblyService.listEligibleModulesForPack(p.skuId);
    setEligibleModules(eligible);
    setLoading(false);
  };

  if (loading || !pack) return <div className="p-20 text-center animate-pulse">Syncing build order...</div>;

  const guards = workflowGuardrails.getPackGuardrail(pack, clusterId);
  const isComplete = pack.status === PackStatus.READY_FOR_EOL || pack.status === PackStatus.FINALIZED;
  const boundCount = pack.moduleIds.length;
  const targetCount = pack.requiredModules || 1;

  const handleLinkModule = async (moduleId: string) => {
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await packAssemblyService.linkModuleToPack(pack.id, moduleId, actor, clusterId === 'CS');
      addNotification({ title: 'Linked', message: `Module added to build.`, type: 'success' });
      await loadData(pack.id);
      setIsPickerOpen(false);
    } catch (e: any) {
      addNotification({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleQC = async (status: 'PASSED' | 'FAILED') => {
      await packAssemblyService.updatePack(pack.id, { qcStatus: status });
      addNotification({ title: 'QC Updated', message: `Assembly QC marked ${status}`, type: status === 'PASSED' ? 'success' : 'warning' });
      loadData(pack.id);
  };

  const handleBindBMS = async () => {
    try {
        const actor = `${currentRole?.name} (${clusterId})`;
        await packAssemblyService.bindDeviceToPack(pack.id, bmsInput, actor);
        addNotification({ title: 'BMS Bound', message: 'Hardware identity confirmed.', type: 'success' });
        loadData(pack.id);
    } catch (e: any) {
        addNotification({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleFinalize = async () => {
    try {
        const actor = `${currentRole?.name} (${clusterId})`;
        await packAssemblyService.markPackReadyForEOL(pack.id, actor);
        addNotification({ title: 'Finalized', message: 'Build order released to QA.', type: 'success' });
        navigate(`${routes.eolQueue()}?search=${pack.id}`);
    } catch (e: any) {
        addNotification({ title: 'Failure', message: e.message, type: 'error' });
    }
  };

  const stage = activeTab === 'qc' ? 'S6' : 'S5';
  const stageTitle = activeTab === 'qc' ? 'Pack Review & Pre-EOL' : 'Pack Assembly';

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode={stage}
        title={stageTitle}
        objective={activeTab === 'qc' ? "Validate main enclosure integrity and authorize EOL testing handover." : "Integrate sealed sub-assemblies into the final pack chassis and bind the BMS controller."}
        entityLabel={pack.id}
        status={pack.status}
        diagnostics={{ route: '/operate/packs', entityId: pack.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(routes.packAssemblyList())} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Back to Queue
            </Button>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-slate-400">Batch Context:</span>
               <Badge variant="outline" className="font-mono text-xs">{pack.batchId || 'UNLINKED'}</Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <NextStepsPanel entity={pack} type="PACK" />

            <div className="border-b flex gap-8 text-sm font-bold text-slate-400 overflow-x-auto pb-px">
              <button className={`pb-3 border-b-2 transition-all uppercase tracking-widest ${activeTab === 'linkage' ? 'border-primary text-primary' : 'border-transparent hover:text-slate-600'}`} onClick={() => setActiveTab('linkage')}>S5: Build Manifest</button>
              <button className={`pb-3 border-b-2 transition-all uppercase tracking-widest ${activeTab === 'qc' ? 'border-primary text-primary' : 'border-transparent hover:text-slate-600'}`} onClick={() => setActiveTab('qc')}>S6: Pack Review & Release</button>
            </div>

            {activeTab === 'linkage' && (
              <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                  <Card className="shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-slate-50/50 dark:bg-slate-800/30">
                          <CardTitle className="text-base flex items-center gap-2"><Layers size={18} className="text-primary"/> Linked Sub-Assemblies ({boundCount}/{targetCount})</CardTitle>
                          {!isComplete && <Button size="sm" variant="outline" onClick={() => setIsPickerOpen(true)} className="h-8 text-[10px] font-bold uppercase tracking-wider">Link Module</Button>}
                      </CardHeader>
                      <CardContent className="p-0">
                          <Table>
                              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow><TableHead>Module ID</TableHead><TableHead>Target Cells</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                              </TableHeader>
                              <tbody>
                                  {modules.length === 0 ? (
                                      <TableRow><TableCell colSpan={3} className="text-center py-20 text-slate-400 italic text-xs font-mono">Registry empty. Link sealed modules to start.</TableCell></TableRow>
                                  ) : (
                                      modules.map(m => (
                                          <TableRow key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                              <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{m.id}</TableCell>
                                              <TableCell className="text-xs font-medium">{m.targetCells} Units</TableCell>
                                              <TableCell className="text-right">
                                                  {!isComplete && (
                                                      <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-600" onClick={() => packAssemblyService.unlinkModuleFromPack(pack.id, m.id, 'Operator').then(() => loadData(pack.id))}>
                                                          <Trash2 size={16} />
                                                      </Button>
                                                  )}
                                              </TableCell>
                                          </TableRow>
                                      ))
                                  )}
                              </tbody>
                          </Table>
                      </CardContent>
                  </Card>
              </div>
            )}

            {activeTab === 'qc' && (
              <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                  <Card className="shadow-sm">
                      <CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck size={18} className="text-primary"/> Final Review Gate</CardTitle></CardHeader>
                      <CardContent className="space-y-8 pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BMS Hardware Binding</label>
                                  <div className="flex gap-2">
                                      <Input disabled={isComplete || !!pack.bmsId} placeholder="Scan BMS UID..." value={bmsInput} onChange={e => setBmsInput(e.target.value.toUpperCase())} className="font-mono bg-slate-50 dark:bg-slate-950 border-2" />
                                      {!pack.bmsId && <Button onClick={handleBindBMS} className="px-6">Bind</Button>}
                                  </div>
                              </div>
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Final SN</label>
                                  {pack.packSerial ? (
                                      <div className="p-3 border-2 border-slate-200 dark:border-slate-800 rounded-lg font-mono font-black text-center bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400">{pack.packSerial}</div>
                                  ) : (
                                      <Button variant="outline" className="w-full h-12 font-bold border-2 border-dashed" onClick={() => packAssemblyService.generatePackSerial(pack.id).then(() => loadData(pack.id))}>Assign Serial Identity</Button>
                                  )}
                              </div>
                          </div>
                          <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
                              <Button className={`flex-1 h-14 text-lg font-black transition-all ${pack.qcStatus === 'PASSED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-2'}`} variant={pack.qcStatus === 'PASSED' ? 'default' : 'outline'} onClick={() => handleQC('PASSED')} disabled={isComplete}>
                                  <CheckCircle className="mr-2 h-5 w-5" /> PASSED REVIEW
                              </Button>
                              <Button className={`flex-1 h-14 text-lg font-black transition-all ${pack.qcStatus === 'FAILED' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-2'}`} variant={pack.qcStatus === 'FAILED' ? 'default' : 'outline'} onClick={() => handleQC('FAILED')} disabled={isComplete}>
                                  <Trash2 className="mr-2 h-5 w-5" /> REJECT ASSEMBY
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              </div>
            )}
          </div>

          <div className="space-y-6">
              <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Registry Finalization</CardTitle></CardHeader>
                  <CardContent className="space-y-6 pt-6">
                      <div className="flex items-start gap-3">
                          <Database className="h-5 w-5 text-indigo-400 mt-0.5" />
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-relaxed">
                            Submitting this build record creates a permanent ledger entry. Ensure all sub-modules are verified.
                          </p>
                      </div>
                      <ActionGuard 
                          guard={guards.finalize} 
                          onClick={handleFinalize} 
                          label="Release to EOL Queue" 
                          icon={ShieldCheck} 
                          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-xl shadow-indigo-500/30 font-black text-sm"
                          actionName="Finalize_Pack_Build"
                          entityId={pack.id}
                      />
                  </CardContent>
                  <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-500/10 blur-3xl rounded-full" />
              </Card>

              <div className="p-5 border-2 border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">S6 Review Checklist</h5>
                <ul className="space-y-2 text-[10px] font-bold text-slate-500 uppercase">
                    <li className={`flex items-center gap-2 ${boundCount === targetCount ? 'text-emerald-500' : ''}`}><CheckCircle size={12}/> Modules Linked</li>
                    <li className={`flex items-center gap-2 ${pack.bmsId ? 'text-emerald-500' : ''}`}><CheckCircle size={12}/> BMS Serial Bound</li>
                    <li className={`flex items-center gap-2 ${pack.packSerial ? 'text-emerald-500' : ''}`}><CheckCircle size={12}/> Unique Pack SN</li>
                    <li className={`flex items-center gap-2 ${pack.qcStatus === 'PASSED' ? 'text-emerald-500' : ''}`}><CheckCircle size={12}/> Visual QC</li>
                </ul>
              </div>
          </div>
        </div>
      </div>

      {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border-none">
                  <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50 dark:bg-slate-900 py-5"><CardTitle className="text-xl font-black uppercase tracking-tight">Select Sealed Module</CardTitle><Button variant="ghost" size="icon" onClick={() => setIsPickerOpen(false)}><ArrowLeft size={20}/></Button></CardHeader>
                  <CardContent className="flex-1 overflow-auto p-0">
                      <Table>
                          <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                            <TableRow><TableHead className="font-black uppercase text-[10px]">Module ID</TableHead><TableHead className="text-right font-black uppercase text-[10px]">Action</TableHead></TableRow>
                          </TableHeader>
                          <tbody>
                              {eligibleModules.length === 0 ? (
                                  <TableRow><TableCell colSpan={2} className="text-center py-20 text-slate-400 italic text-sm">No SEALED modules match this SKU specification in local inventory.</TableCell></TableRow>
                              ) : (
                                eligibleModules.map(m => (
                                    <TableRow key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <TableCell className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-lg">{m.id}</TableCell>
                                        <TableCell className="text-right"><Button size="sm" onClick={() => handleLinkModule(m.id)} className="font-bold">Link to Enclosure</Button></TableCell>
                                    </TableRow>
                                ))
                              )}
                          </tbody>
                      </Table>
                  </CardContent>
              </Card>
          </div>
      )}
    </div>
  );
}