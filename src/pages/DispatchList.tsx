import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dispatchService } from '../services/api';
import { DispatchOrder, DispatchStatus } from '../domain/types';
import { Button, Input, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Card, CardContent } from '../components/ui/design-system';
import { Plus, Search, Filter, Eye, Truck, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { routes } from '../../app/routes';

// --- Helpers ---

const getStatusVariant = (status: DispatchStatus) => {
  switch (status) {
    case DispatchStatus.DISPATCHED: return 'success';
    case DispatchStatus.READY: return 'default';
    case DispatchStatus.DRAFT: return 'secondary';
    case DispatchStatus.CANCELLED: return 'destructive';
    default: return 'outline';
  }
};

// --- Create Modal ---

const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer required"),
  destinationAddress: z.string().min(1, "Address required"),
  expectedShipDate: z.string().min(1, "Date required"),
});

const CreateOrderModal = ({ isOpen, onClose, onCreated }: any) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(createOrderSchema)
  });
  const [loading, setLoading] = useState(false);
  const { currentRole, currentCluster } = useAppStore();

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setLoading(true);
    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;
    try {
      await dispatchService.createOrder(data, userLabel);
      reset();
      onCreated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[500px] shadow-xl border dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4">Create Dispatch Order</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Name</label>
            <Input {...register('customerName')} placeholder="e.g. Acme EV Corp" />
            {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination Address</label>
            <Input {...register('destinationAddress')} placeholder="Street, City, State, Country" />
            {errors.destinationAddress && <p className="text-xs text-red-500">{errors.destinationAddress.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Ship Date</label>
            <Input type="date" {...register('expectedShipDate')} />
            {errors.expectedShipDate && <p className="text-xs text-red-500">{errors.expectedShipDate.message as string}</p>}
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Order'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page ---

export default function DispatchList() {
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const canCreate = canDo(currentCluster?.id || '', ScreenId.DISPATCH_LIST, 'C');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    const data = await dispatchService.getOrders({ status: statusFilter === 'All' ? undefined : statusFilter });
    setOrders(data);
    setLoading(false);
  };

  const handleCreateSuccess = () => {
    addNotification({ title: "Success", message: "Dispatch Order Created", type: "success" });
    loadOrders();
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispatch Orders</h2>
          <p className="text-muted-foreground">Manage outbound shipments and logistics operations.</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Order
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Order # or Customer..." 
                className="pl-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.values(DispatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Ship Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Batteries</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading orders...</TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No dispatch orders found.</TableCell>
                </TableRow>
              ) : (
                filteredOrders.map(order => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(routes.dispatchDetails(order.id))}>
                    <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{order.destinationAddress}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {order.expectedShipDate}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>{order.batteryIds.length}</TableCell>
                    <TableCell>
                        <div className="flex gap-1">
                            {order.packingListRef && <span className="w-2 h-2 rounded-full bg-blue-500" title="Packing List" />}
                            {order.manifestRef && <span className="w-2 h-2 rounded-full bg-indigo-500" title="Manifest" />}
                            {order.invoiceRef && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Invoice" />}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(routes.dispatchDetails(order.id))}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <CreateOrderModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={handleCreateSuccess} />
    </div>
  );
}