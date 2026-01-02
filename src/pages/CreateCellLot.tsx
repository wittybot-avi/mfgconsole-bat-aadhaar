import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '../components/ui/design-system';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { useAppStore } from '../lib/store';
// Add import for CellLot to resolve type mismatch on line 38
import { CellLot } from '../domain/types';

export default function CreateCellLot() {
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Fix: Explicitly type the form state to ensure chemistry and formFactor match CellLot literal unions
  const [form, setForm] = useState<{
    lotCode: string;
    supplierName: string;
    supplierLotNo: string;
    chemistry: CellLot['chemistry'];
    formFactor: CellLot['formFactor'];
    capacityAh: number;
    quantityReceived: number;
    receivedDate: string;
    prefix: string;
  }>({
    lotCode: '',
    supplierName: '',
    supplierLotNo: '',
    chemistry: 'LFP',
    formFactor: 'Prismatic',
    capacityAh: 100,
    quantityReceived: 0,
    receivedDate: new Date().toISOString().split('T')[0],
    prefix: 'C'
  });

  useEffect(() => {
    // P55: Failsafe loader - ensure form displays even if service is slow
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Fix line 38: cast to Partial<CellLot> to resolve the chemistry type incompatibility
      const newLot = await cellTraceabilityService.createLot({
        ...form
      } as Partial<CellLot>);
      addNotification({ title: 'Lot Created', message: `${newLot.lotCode} registered in ledger.`, type: 'success' });
      navigate(`/trace/cells/${newLot.id}`);
    } catch (err) {
      addNotification({ title: 'Error', message: 'Failed to create lot.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" />
        <p className="text-sm font-mono tracking-widest text-slate-400 uppercase">Synchronizing material ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/trace/cells')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Register Cell Shipment</h2>
           <p className="text-sm text-muted-foreground">Log physical arrival and establish digital provenance.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30">
            <CardTitle className="text-base font-bold flex items-center gap-2">
                <Info size={18} className="text-primary"/> S2 Inbound Manifest
            </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500">Internal Lot Code</label>
                <Input value={form.lotCode} onChange={e => setForm({...form, lotCode: e.target.value.toUpperCase()})} placeholder="e.g. CATL-24-001" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500">Received Date</label>
                <Input type="date" value={form.receivedDate} onChange={e => setForm({...form, receivedDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500">Supplier Name</label>
                <Input value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})} placeholder="e.g. CATL" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500">Quantity Received</label>
                <Input type="number" value={form.quantityReceived} onChange={e => setForm({...form, quantityReceived: Number(e.target.value)})} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500">Chemistry</label>
                <select className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-background" value={form.chemistry} onChange={e => setForm({...form, chemistry: e.target.value as any})}>
                  <option value="LFP">LFP</option>
                  <option value="NMC">NMC</option>
                  <option value="LTO">LTO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500">Unit ID Prefix</label>
                <Input value={form.prefix} onChange={e => setForm({...form, prefix: e.target.value.toUpperCase()})} maxLength={3} />
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="px-8 shadow-lg">
                {submitting ? 'Processing...' : 'Save Draft Manifest'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <strong>Workflow Note:</strong> Once the manifest is saved, you must perform a verification scan (S4) to finalize the identities for consumption in manufacturing batches.
          </p>
      </div>
    </div>
  );
}
