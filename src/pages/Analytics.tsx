import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge } from '../components/ui/design-system';
import { BarChart3, PieChart, TrendingUp, Inbox, CheckCircle, AlertCircle } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Yield, defects, and process insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
            <CardContent className="pt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase">Rolling Yield</p>
                <p className="text-2xl font-black mt-1 text-emerald-600">98.4%</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase">Scrap Rate</p>
                <p className="text-2xl font-black mt-1 text-rose-600">0.8%</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase">WIP Inventory</p>
                <p className="text-2xl font-black mt-1 text-indigo-600">184 units</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase">Top Defect</p>
                <p className="text-sm font-bold mt-2">OCV_RANGE_ERROR</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80 flex flex-col">
            <CardHeader><CardTitle className="text-base font-bold">Yield by SKU (7d)</CardTitle></CardHeader>
            <CardContent className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 m-6 rounded-xl">
                <div className="text-center space-y-2 opacity-30">
                    <BarChart3 size={32} className="mx-auto" />
                    <p className="text-xs uppercase font-black tracking-widest">Chart Visualization Mock</p>
                </div>
            </CardContent>
        </Card>
        <Card className="h-80 flex flex-col">
            <CardHeader><CardTitle className="text-base font-bold">Defect Distribution</CardTitle></CardHeader>
            <CardContent className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 m-6 rounded-xl">
                <div className="text-center space-y-2 opacity-30">
                    <PieChart size={32} className="mx-auto" />
                    <p className="text-xs uppercase font-black tracking-widest">Chart Visualization Mock</p>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-bold">SKU Performance Leaderboard</CardTitle></CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                        <TableHead className="font-black uppercase text-[10px]">SKU Code</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Total Produced</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">First Pass Yield</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px]">Last Updated</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {[
                        { code: 'VV360-LFP-48V', qty: 1450, yield: '99.1%', date: '2024-05-23' },
                        { code: 'EE720-NMC-72V', qty: 840, yield: '97.5%', date: '2024-05-23' },
                        { code: 'NA-STORAGE-V1', qty: 120, yield: '94.2%', date: '2024-05-22' },
                    ].map((row, i) => (
                        <TableRow key={i}>
                            <TableCell className="font-mono font-bold text-indigo-600">{row.code}</TableCell>
                            <TableCell className="text-xs">{row.qty} units</TableCell>
                            <TableCell><Badge variant="success" className="text-[10px]">{row.yield}</Badge></TableCell>
                            <TableCell className="text-right text-[10px] text-muted-foreground font-mono">{row.date}</TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}