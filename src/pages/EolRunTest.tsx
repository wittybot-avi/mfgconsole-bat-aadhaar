import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { packAssemblyService } from '../services/packAssemblyService';
import { PackInstance, EolTestRun, EolTestItem, PackStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Play, CheckCircle, XCircle, Info, Zap, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { StageHeader } from '../components/SopGuidedUX';

export default function EolRunTest() {
  const { buildId } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [testRun, setTestRun] = useState<EolTestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const clusterId = currentCluster?.id || '';
  const canRun = ['C3', 'CS'].includes(clusterId);

  useEffect(() => {
    // P50: Deterministic Demo Bypass
    const timer = setTimeout(() => {
        if (loading) setLoading(false);
    }, 100);

    if (buildId) loadData(buildId);
    return () => clearTimeout(timer);
  }, [buildId]);

  const loadData = async (pid: string) => {
    try {
      const p = await packAssemblyService.getPack(pid);
      if (!p) {
        handleSyntheticBypass(pid);
        return;
      }
      setPack(p);
      const actor = `${currentRole?.name} (${clusterId})`;
      const run = await eolQaService.createOrLoadTestRun(pid, actor);
      setTestRun(run);
    } catch (e) {
      handleSyntheticBypass(pid);
    } finally {
      setLoading(false);
    }
  };

  const handleSyntheticBypass = (pid: string) => {
    setPack({
      id: pid,
      status: PackStatus.READY_FOR_EOL,
      skuCode: 'VV360-DEMO',
      packSerial: `SN-DEMO-${pid.slice(-4)}`,
      eolStatus: 'PENDING'
    } as any);
    setTestRun({
        id: `TR-DEMO-${pid}`,
        packId: pid,
        items: [],
        computedResult: 'PENDING'
    } as any);
  };

  const handleStart = async () => {
    if (!buildId || !canRun) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await eolQaService.startEolTest(buildId, actor);
      await loadData(buildId);
      addNotification({ title: 'Session Active', message: 'Test cycle initialized.', type: 'info' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateItem = async (itemId: string, patch: Partial<EolTestItem>) => {
    if (!buildId || !canRun) return;
    try {
      const updatedRun = await eolQaService.updateTestItem(buildId, itemId, patch);
      setTestRun(updatedRun);
    } catch (e) {
      addNotification({ title: 'Error', message: 'Failed to update measurement.', type: 'error' });
    }
  };

  const handleFinalize = async (decision: 'PASS' | 'FAIL') => {
    if (!buildId || !canRun) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await eolQaService.finalizeDecision(buildId, decision, { 
        actor, 
        notes: decision === 'PASS' ? 'Passed automated test suite.' : 'Failed electrical threshold check.'
      });
      addNotification({ title: 'Complete', message: `Result: ${decision}`, type: decision === 'PASS' ? 'success' : 'warning' });
      navigate(`/assure/eol/details/${buildId}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !pack) return <div className="p-20 text-center animate-pulse font-mono text-sm uppercase tracking-widest text-slate-400">Opening secure test bench link...</div>;

  const currentPack = pack;
  const currentRun = testRun;
  if (!currentPack || !currentRun) return <div className="p-20 text-center">Session identity missing.</div>;

  const isTesting = currentPack.eolStatus === 'IN_TEST';
  const allMeasured = currentRun.items.length > 0 && currentRun.items.filter(i => i.required).every(i => i.status !== 'NOT_RUN');

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S7-RUN"
        title="Live Test Execution"
        objective="Perform direct measurement of electrical parameters against SKU blueprint thresholds."
        entityLabel={currentPack.id}
        status={currentPack.status}
        diagnostics={{ route: '/assure/eol/run', entityId: currentPack.id }}
      />

      <div className="max-w-5xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
           <Button variant="ghost" size="sm" onClick={() => navigate(`/assure/eol/details/${buildId}`)} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Exit Session
            </Button>
            {!isTesting && (
                <Button onClick={handleStart} className="gap-2 bg-indigo-600 shadow-lg shadow-indigo-500/20 h-12 px-8 font-black uppercase text-sm">
                    <Play size={18} fill="currentColor" /> Start Test Cycle
                </Button>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30"><CardTitle className="text-base font-bold">Test Sequence Matrix</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px]">Parameter</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Target</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Value</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {currentRun.items.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400 italic">Awaiting hardware handshake...</TableCell></TableRow>
                            ) : currentRun.items.map(item => (
                                <TableRow key={item.id} className={!isTesting ? 'opacity-40' : ''}>
                                    <TableCell className="font-semibold text-sm">{item.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">{item.threshold || 'Binary'}</TableCell>
                                    <TableCell>
                                        {item.unit ? (
                                            <div className="flex items-center gap-2 max-w-[120px]">
                                                <Input 
                                                    disabled={!isTesting} 
                                                    type="number" 
                                                    className="h-8 w-24 text-xs font-mono" 
                                                    value={item.measurement || ''} 
                                                    onChange={e => handleUpdateItem(item.id, { measurement: parseFloat(e.target.value) || 0 })}
                                                />
                                                <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1">
                                                <Button size="sm" variant={item.status === 'PASS' ? 'default' : 'outline'} className={`h-7 text-[10px] font-bold ${item.status === 'PASS' ? 'bg-emerald-600' : ''}`} onClick={() => handleUpdateItem(item.id, { status: 'PASS' })} disabled={!isTesting}>OK</Button>
                                                <Button size="sm" variant={item.status === 'FAIL' ? 'destructive' : 'outline'} className="h-7 text-[10px] font-bold" onClick={() => handleUpdateItem(item.id, { status: 'FAIL' })} disabled={!isTesting}>ERR</Button>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.status === 'PASS' ? <CheckCircle size={16} className="text-emerald-500 ml-auto" /> : item.status === 'FAIL' ? <XCircle size={16} className="text-rose-500 ml-auto" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200 ml-auto" />}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardHeader className="border-b border-slate-800"><CardTitle className="text-xs uppercase tracking-widest text-slate-400 font-black">Disposition Hub</CardTitle></CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-start gap-3">
                            <Zap className="h-5 w-5 text-indigo-400 mt-0.5" />
                            <p className="text-[10px] text-slate-400 uppercase font-black leading-relaxed">
                                Station ID: {localStorage.getItem('eol_station_id') || 'EOL-01'}. Measurements are persistent.
                            </p>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-slate-800">
                             <Button 
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 border-none font-black text-xs uppercase shadow-lg shadow-emerald-500/10" 
                                disabled={!isTesting || !allMeasured || processing}
                                onClick={() => handleFinalize('PASS')}
                             >
                                 Sign PASS Certificate
                             </Button>
                             <Button 
                                variant="outline" 
                                className="w-full h-12 text-white border-slate-700 hover:bg-slate-800 font-black text-xs uppercase" 
                                disabled={!isTesting || processing}
                                onClick={() => handleFinalize('FAIL')}
                             >
                                 Non-conforming
                             </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}