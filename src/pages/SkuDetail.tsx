import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '../components/ui/design-system';
import { ArrowLeft, Save, ShieldCheck, Info, CheckCircle, AlertCircle, Box, Layout } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

export default function SkuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  const [sku, setSku] = useState<Sku | null>(null);
  const [loading, setLoading] = useState(true);

  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadSku(id);
  }, [id]);

  const loadSku = async (skuId: string) => {
    setLoading(true);
    const data = await skuService.getSku(skuId);
    if (!data) {
        addNotification({ title: 'Redirection', message: 'Asset not found in registry.', type: 'info' });
        navigate('/sku');
        return;
    }
    setSku(data);
    setLoading(false);
  };

  if (loading || !sku) return <div className="p-20 text-center animate-pulse">Syncing blueprint...</div>;

  const guards = workflowGuardrails.getSkuGuardrail(sku, clusterId);

  const handleActivate = async () => {
    try {
      const updated = await skuService.updateSku(sku.id, { status: 'ACTIVE' });
      setSku(updated);
      addNotification({ title: 'Activated', message: `${sku.skuCode} is now ready for production.`, type: 'success' });
    } catch (e) {
      addNotification({ title: 'Error', message: 'Activation failed.', type: 'error' });
    }
  };

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S1"
        title="Design Definition"
        objective="Define and authorize the core electrical and mechanical specifications for this model."
        entityLabel={sku.skuCode}
        status={sku.status}
        diagnostics={{ route: '/sku', entityId: sku.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/sku')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Studio
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <NextStepsPanel entity={sku} type="SKU" />
            
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" /> Technical Specifications
                  </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 bg-white dark:bg-slate-900">
                <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Chemistry</p><p className="font-bold text-slate-700 dark:text-slate-200">{sku.chemistry}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Topology</p><p className="font-bold text-slate-700 dark:text-slate-200">{sku.seriesCount}S {sku.parallelCount}P</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Voltage</p><p className="font-bold text-slate-700 dark:text-slate-200">{sku.nominalVoltage}V</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Capacity</p><p className="font-bold text-slate-700 dark:text-slate-200">{sku.capacityAh}Ah</p></div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Assembly Hierarchy</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-slate-50 dark:bg-slate-900">
                            <Box className="h-8 w-8 text-primary opacity-50" />
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Module Spec</p>
                                <p className="text-sm font-medium">{sku.moduleStructure} Configuration</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-slate-50 dark:bg-slate-900">
                            <Layout className="h-8 w-8 text-primary opacity-50" />
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Pack Layout</p>
                                <p className="text-sm font-medium">{sku.requiredModules} Sub-Assemblies</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">BMS Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Controller Type</p>
                            <p className="text-sm font-bold">{sku.bmsType}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Firmware Baseline</p>
                            <p className="text-sm font-bold">{sku.firmwareFamily}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>

          <div className="space-y-6">
              <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
                  <CardHeader className="border-b border-slate-800 pb-3"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Governance Gate</CardTitle></CardHeader>
                  <CardContent className="space-y-4 pt-4">
                      <div className="flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                            Active blueprint locks prevent unauthorized tampering during production runs.
                          </p>
                      </div>
                      <div className="pt-4 space-y-3">
                          <ActionGuard 
                            guard={guards.activate} 
                            onClick={handleActivate} 
                            label="Activate Blueprint" 
                            icon={CheckCircle} 
                            variant="default"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                            actionName="Activate_SKU"
                            entityId={sku.id}
                          />
                          <ActionGuard 
                            guard={guards.createBatch} 
                            onClick={() => navigate('/batches')} 
                            label="Start Mfg Batch" 
                            icon={Box} 
                            variant="outline"
                            className="w-full text-white border-slate-700 hover:bg-slate-800"
                            actionName="Start_Batch_From_SKU"
                            entityId={sku.id}
                          />
                      </div>
                  </CardContent>
                  <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary/20 blur-3xl rounded-full" />
              </Card>

              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-slate-500 italic">Revisions to active specs require a cloned engineering change order (ECO).</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
