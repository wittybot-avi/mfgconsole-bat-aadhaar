import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { CLUSTERS, Cluster } from '../rbac/clusters';
import { ROLES, Role } from '../rbac/roleCatalog';
import { RBAC_POLICY } from '../rbac/policy';
import { getLandingRouteForRole } from '../rbac/landing';
import { Button, Card, CardContent, CardHeader, CardTitle, CardTitle as CardHeaderTitle } from '../components/ui/design-system';
import { ShieldCheck, User, ArrowRight, Battery, Layers } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { loginAsRole, isAuthenticated, currentRole } = useAppStore();
  
  const [selectedClusterId, setSelectedClusterId] = useState<string>('C1');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const clusters = Object.values(CLUSTERS);
  const availableRoles = ROLES.filter(r => r.clusterId === selectedClusterId);
  const currentCluster = CLUSTERS[selectedClusterId];
  
  // Set default role when cluster changes
  useEffect(() => {
    if (availableRoles.length > 0) {
      setSelectedRoleId(availableRoles[0].id);
    }
  }, [selectedClusterId]);

  const handleLogin = () => {
    if (selectedRoleId) {
      loginAsRole(selectedRoleId);
      // Navigation will happen in useEffect or after action
      const role = ROLES.find(r => r.id === selectedRoleId);
      const cluster = CLUSTERS[role?.clusterId || ''];
      const landing = getLandingRouteForRole(cluster);
      navigate(landing);
    }
  };

  const getPermissionSummary = () => {
    const policy = RBAC_POLICY[selectedClusterId] || {};
    const count = Object.keys(policy).length;
    const modules = Object.keys(policy).slice(0, 5).map(s => s.replace('_', ' '));
    return { count, modules };
  };

  const summary = getPermissionSummary();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Brand Side */}
        <div className="space-y-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
             <div className="h-12 w-12 rounded bg-primary flex items-center justify-center text-white font-bold text-2xl">A</div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Aayatana Tech</h1>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Battery Pack<br />Manufacturer Console
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
            Advanced lifecycle management, telemetry monitoring, and digital compliance for next-gen energy storage.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded border text-sm text-slate-500">
               <Battery className="h-4 w-4" /> Lifecycle
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded border text-sm text-slate-500">
               <ShieldCheck className="h-4 w-4" /> Compliance
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded border text-sm text-slate-500">
               <Layers className="h-4 w-4" /> Manufacturing
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-primary/10 w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Select Persona</CardTitle>
            <p className="text-sm text-muted-foreground">Choose your operational role to enter the console.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Operational Cluster
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedClusterId}
                onChange={(e) => setSelectedClusterId(e.target.value)}
              >
                {clusters.map(c => (
                  <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Role
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                {availableRoles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Preview Panel */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 border text-sm space-y-2">
               <div className="flex justify-between items-center">
                 <span className="font-semibold text-primary">{currentCluster.id} Capabilities</span>
                 <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{summary.count} Modules</span>
               </div>
               <p className="text-xs text-muted-foreground">{currentCluster.description}</p>
               <div className="flex flex-wrap gap-1 mt-2">
                 {summary.modules.map(m => (
                   <span key={m} className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-slate-500 capitalize">{m.toLowerCase()}</span>
                 ))}
                 {summary.count > 5 && <span className="text-[10px] px-1.5 py-0.5 text-slate-400">+{summary.count - 5} more</span>}
               </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleLogin}>
              Enter Console <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        <p>Aayatana Tech Internal System | Auth Node v1.2</p>
      </div>
    </div>
  );
}