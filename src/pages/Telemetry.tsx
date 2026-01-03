import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Input } from '../components/ui/design-system';
import { Activity, Signal, AlertTriangle, Clock, Search, Filter } from 'lucide-react';

const MOCK_EVENTS = [
  { id: 1, timestamp: new Date().toISOString(), assetId: 'BATT-2024-X1', signal: 'V_MAX', value: '4.21', severity: 'INFO' },
  { id: 2, timestamp: new Date(Date.now() - 5000).toISOString(), assetId: 'PB-9921', signal: 'CURR_LINE', value: '12.5A', severity: 'INFO' },
  { id: 3, timestamp: new Date(Date.now() - 15000).toISOString(), assetId: 'MOD-B-01', signal: 'TEMP_S1', value: '45.2°C', severity: 'WARN' },
  { id: 4, timestamp: new Date(Date.now() - 30000).toISOString(), assetId: 'BATT-2024-X2', signal: 'COMM_HB', value: 'OK', severity: 'INFO' },
  { id: 5, timestamp: new Date(Date.now() - 45000).toISOString(), assetId: 'SN-VANG-101', signal: 'V_MIN', value: '3.1V', severity: 'CRITICAL' },
  { id: 6, timestamp: new Date(Date.now() - 60000).toISOString(), assetId: 'PB-8821', signal: 'SOC_EST', value: '82%', severity: 'INFO' },
];

export default function Telemetry() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Telemetry</h2>
        <p className="text-muted-foreground">Live signals, device health, and line events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-emerald-500">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Active Devices</p>
                    <Signal size={14} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-black mt-1">1,242</p>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-500">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Signals / Min</p>
                    <Activity size={14} className="text-blue-500" />
                </div>
                <p className="text-2xl font-black mt-1">45.2k</p>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-rose-500">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Alerts Open</p>
                    <AlertTriangle size={14} className="text-rose-500" />
                </div>
                <p className="text-2xl font-black mt-1">12</p>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Avg Latency</p>
                    <Clock size={14} className="text-amber-500" />
                </div>
                <p className="text-2xl font-black mt-1">18ms</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Signal Stream</CardTitle>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Filter by ID..." className="pl-9 h-9 w-48" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="h-9 rounded-md border border-input px-3 py-1 text-xs bg-background">
                    <option>All Assets</option>
                    <option>Battery</option>
                    <option>Module</option>
                </select>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                        <TableHead className="font-black uppercase text-[10px]">Timestamp</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Asset ID</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Signal</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Value</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px]">Severity</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {MOCK_EVENTS.filter(e => e.assetId.toLowerCase().includes(search.toLowerCase())).map(evt => (
                        <TableRow key={evt.id}>
                            <TableCell className="text-[10px] font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</TableCell>
                            <TableCell className="font-bold font-mono text-xs">{evt.assetId}</TableCell>
                            <TableCell className="text-xs font-medium text-slate-500">{evt.signal}</TableCell>
                            <TableCell className="font-bold text-xs">{evt.value}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant={evt.severity === 'CRITICAL' ? 'destructive' : evt.severity === 'WARN' ? 'warning' : 'outline'} className="text-[9px]">
                                    {evt.severity}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}