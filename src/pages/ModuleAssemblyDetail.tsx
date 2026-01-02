import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { skuService, Sku } from '../services/skuService';
import { ModuleInstance, ModuleStatus, CellBindingRecord } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, ShieldCheck, Trash2, Info, Scan, History, Database, Layers, Box } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

export default function ModuleAssemblyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [module, setModule] = useState<ModuleInstance | null>(null);
  const [bindings, setBindings] = useState<CellBindingRecord[]>([]);
  const [sku, setSku] = useState<Sku | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [scanInput, setScanInput] = useState('');
  
  const scanRef = useRef<HTMLInputElement>(null);
  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (mid: string) => {
    setLoading(true);
    const m = await moduleAssemblyService.getModule(mid);
    if (!m) {
        addNotification({ title: 'Redirection', message: 'Module record missing.', type: 'info' });
        navigate('/operate/modules');
        return;
    }
    setModule(m);
    const b = await moduleAssemblyService.listBindingsByModule(mid);
    setBindings(b);
    const s = await skuService.getSku(m.skuId);
    if (s) setSku(s);
    setLoading(false);
  };

  if (loading || !module) return <div className="p-20 text-center animate-pulse">Loading assembly data...</div>;

  const guards = workflowGuardrails.getModuleGuardrail(module, clusterId);
  const progress = Math.min(100, (module.boundCellSerials.length / module.targetCells) * 100);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!module || !scanInput || processing) return;

    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.bindCellToModule(module.id, scanInput.trim(), actor, clusterId === 'CS');
      addNotification({ title: 'Success', message: `Cell ${scanInput} bound.`, type: 'success' });
      setScanInput('');
      await loadData(module.id);
      setTimeout(() => scanRef.current?.focus(), 100);
    } catch (err: any) {
      addNotification({ title: 'Binding Error', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleSeal = async () => {
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.sealModule(module.id, actor);
      addNotification({ title: 'Sealed', message: 'Module work order finalized.', type: 'success' });
      await loadData(module.id);
    } catch (err: any) {
      addNotification({ title: 'Seal Failed', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S4"
        title="Module Assembly"
        objective="Bind validated cell units into a module lattice and verify electrical continuity."
        entityLabel={module.id}
        status={module.status}
        diagnostics={{ route: '/operate/modules', entityId: module.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/operate/modules')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Queue
            </Button>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-slate-400">Batch Context:</span>
               <Badge variant="outline" className="font-mono text-xs">{module.batchId || 'UNLINKED'}</Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <NextStepsPanel entity={module} type="MODULE" />

            <Card className="shadow-sm">
              <CardContent className="p-6">
                 <div className="flex justify-between items-end mb-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assembly Population</p>
                        <p className="text-3xl font-black font-mono">{module.boundCellSerials.length} / {module.targetCells}</p>
                    </div>
                    <Badge variant="outline" className="text-sm font-mono h-7 px-3 bg-slate-50 dark:bg-slate-800">{progress.toFixed(0)}% Completion</Badge>
                 </div>
                 <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                    <div className={`h-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                 </div>
              </CardContent>
            </Card>

            {module.status === ModuleStatus.IN_PROGRESS && (
              <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-lg">
                <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2 text-primary font-bold"><Scan className="h-5 w-5" /> Component Scan & Bind</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleScan} className="flex gap-3">
                        <Input 
                          ref={scanRef}
                          placeholder="Scan Cell Serial..." 
                          className="text-xl h-14 font-mono font-bold border-2 bg-white dark:bg-slate-950 focus:ring-primary shadow-inner"
                          value={scanInput}
                          onChange={e => setScanInput(e.target.value.toUpperCase())}
                          disabled={!guards.bind.allowed || processing}
                        />
                        <ActionGuard 
                          guard={guards.bind} 
                          onClick={handleScan} 
                          label="BIND" 
                          className="h-14 px-10 text-lg font-black shadow-lg shadow-primary/20" 
                          loading={processing}
                          actionName="Bind_Cell_To_Module"
                          entityId={module.id}
                        />
                    </form>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardHeader className="border-b"><CardTitle className="text-lg flex items-center gap-2"><History size={18} className="text-primary"/> Component Ledger</CardTitle></CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow><TableHead>Serial</TableHead><TableHead>Lot</TableHead><TableHead>Timestamp</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                    </TableHeader>
                    <tbody>
                        {bindings.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 font-mono text-xs italic">Awaiting first component binding...</TableCell></TableRow>
                        ) : (
                          bindings.slice().reverse().map(b => (
                            <TableRow key={b.serial} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <TableCell className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{b.serial}</TableCell>
                              <TableCell className="text-xs font-medium">{b.lotCode}</TableCell>
                              <TableCell className="text-xs text-slate-400">{new Date(b.boundAt).toLocaleTimeString()}</TableCell>
                              <TableCell className="text-right">
                                  {module.status === ModuleStatus.IN_PROGRESS && (
                                      <Button variant="ghost" size="icon" className="text-rose-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-all" onClick={() => moduleAssemblyService.unbindCellFromModule(module.id, b.serial, 'Operator').then(() => loadData(module.id))}>
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

          <div className="space-y-6">
              <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Assurance Console</CardTitle></CardHeader>
                  <CardContent className="space-y-6 pt-6">
                      <div className="flex items-start gap-3">
                          <Database className="h-5 w-5 text-blue-400 mt-0.5" />
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-relaxed">
                            Non-volatile record persistence active. Workflow signature required for SOP closure.
                          </p>
                      </div>
                      <ActionGuard 
                          guard={guards.seal} 
                          onClick={handleSeal} 
                          label="Seal Module Lattice" 
                          icon={ShieldCheck} 
                          loading={processing}
                          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/20"
                          actionName="Seal_Module"
                          entityId={module.id}
                      />
                  </CardContent>
                  <div className="absolute -bottom-8 -left-8 h-24 w-24 bg-blue-500/10 blur-3xl rounded-full" />
              </Card>

              <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                 <Box size={24} className="text-slate-400" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit Genealogy</p>
                 <p className="text-[9px] text-slate-400">Genealogy mapping is immutable once lattice is sealed.</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}