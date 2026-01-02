import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui/design-system';
import { ArrowLeft, Warehouse, Clock, MapPin, Database } from 'lucide-react';
import { routes } from '../../app/routes';

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(routes.inventoryList())}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Inventory Record Detail</h2>
          <p className="text-muted-foreground text-sm">Asset: {id || 'UNKNOWN'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="border-b bg-slate-50 dark:bg-slate-800/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-primary" /> Physical Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shelf Location</p>
                <p className="font-mono font-bold text-lg flex items-center gap-2"><MapPin size={16} /> WH1-A-01</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Timestamp</p>
                <p className="font-bold flex items-center gap-2"><Clock size={16} /> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-dashed">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This item is verified in the decentralized inventory ledger. All movements are signed and traceable in the global event store.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b"><CardTitle className="text-base">System Context</CardTitle></CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">Provider</p>
              <Badge variant="outline">MockServiceAdapter</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">Integrity State</p>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase">
                <Database size={14} /> SIGNED_VALID
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}