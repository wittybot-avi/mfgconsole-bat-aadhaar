import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cellLotService, CellLot } from '../services/cellLotService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input } from '../components/ui/design-system';
import { Plus, Search, Fingerprint, ExternalLink } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function CellLots() {
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  const [lots, setLots] = useState<CellLot[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cellLotService.listLots().then(data => {
      setLots(data);
      setLoading(false);
    });
  }, []);

  const filtered = lots.filter(l => 
    l.supplier.toLowerCase().includes(search.toLowerCase()) || 
    l.shipmentId.toLowerCase().includes(search.toLowerCase()) ||
    l.id.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = ['C2', 'C6', 'CS'].includes(currentCluster?.id || '');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cell Serialization</h2>
          <p className="text-muted-foreground">Manage incoming cell shipments, serial numbers, and label printing.</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/trace/cells/new')}>
            <Plus className="mr-2 h-4 w-4" /> Register Shipment
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search lot, supplier, or shipment..." 
                className="pl-9" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No cell lots found.</TableCell></TableRow>
              ) : (
                filtered.map(lot => (
                  <TableRow key={lot.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => navigate(`/trace/cells/${lot.id}`)}>
                    <TableCell className="font-mono font-bold">{lot.id}</TableCell>
                    <TableCell>{lot.supplier}</TableCell>
                    <TableCell>{lot.cellModel}</TableCell>
                    <TableCell>{lot.receivedQty}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{lot.serialPolicy.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lot.status === 'OPEN' ? 'success' : 'secondary'}>{lot.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Manage <ExternalLink className="ml-2 h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}