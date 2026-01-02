import React from 'react';
import { APP_ROUTES } from '../app/routeRegistry';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge } from '../components/ui/design-system';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function DiagnosticsPage() {
  const routes = Object.values(APP_ROUTES);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Diagnostics</h2>
        <p className="text-muted-foreground">Route Registry & Component Mapping Verification.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Registered Pages ({routes.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Screen ID</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {routes.map((route, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{route.screenId}</TableCell>
                  <TableCell className="font-mono text-xs text-blue-600">{route.path}</TableCell>
                  <TableCell>{route.label}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{route.componentName}</TableCell>
                  <TableCell>
                    {route.componentName ? (
                        <div className="flex items-center text-emerald-600 gap-1 text-xs font-bold">
                            <CheckCircle className="h-3 w-3" /> MAPPED
                        </div>
                    ) : (
                        <div className="flex items-center text-rose-600 gap-1 text-xs font-bold">
                            <AlertTriangle className="h-3 w-3" /> MISSING
                        </div>
                    )}
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
