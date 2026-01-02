
import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { RBAC_POLICY } from '../rbac/policy';
import { SCREEN_GROUPS, ScreenId } from '../rbac/screenIds';
import { VERB_LABELS, Verbs } from '../rbac/verbs';
import { getRoleCapabilities } from '../rbac/capabilityMap';
import { getRestrictionInfo } from '../rbac/restrictionReasons';
import { generateRbacSnapshot } from '../rbac/exportRbacSnapshot';
import { POLICY_CHANGELOG } from '../app/policyChangelog';
import { PATCH_LEVEL, LAST_PATCH_ID } from '../app/patchInfo';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Tooltip } from '../components/ui/design-system';
import { Shield, Download, UserCircle, Zap, Search, Info, Lock, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RbacAdmin() {
  const { currentRole, currentCluster } = useAppStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Export handlers
  const handleExportPolicy = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(RBAC_POLICY, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "rbac_policy_full.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportSnapshot = () => {
    if (!currentRole || !currentCluster) return;
    const snapshot = generateRbacSnapshot(currentCluster.id, currentRole.name);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `rbac_snapshot_${currentCluster.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Safe guard
  if (!currentRole || !currentCluster) return null;

  const isSuperUser = currentCluster.id === 'CS';
  const allScreenIds = Object.values(SCREEN_GROUPS).flat();
  const capabilities = getRoleCapabilities(currentCluster.id);

  // Compute restricted screens for explanation
  const restrictedScreens = allScreenIds.filter(sid => {
    const perms = isSuperUser ? ['V'] : RBAC_POLICY[currentCluster.id]?.[sid as ScreenId];
    return !perms || !perms.includes('V');
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Access Control Audit</h2>
          <p className="text-muted-foreground">Policy version: P{PATCH_LEVEL} • {LAST_PATCH_ID}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/login')}>
            <UserCircle className="mr-2 h-4 w-4" /> Switch Role
          </Button>
          <Button variant="outline" onClick={handleExportSnapshot}>
            <Download className="mr-2 h-4 w-4" /> Export Snapshot
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExportPolicy} title="Export Full Policy JSON">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Session Card with Legend */}
      <Card className={`bg-slate-50 dark:bg-slate-900 ${isSuperUser ? 'border-amber-400 dark:border-amber-600' : 'border-primary/20'}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isSuperUser ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                {isSuperUser ? <Zap className="h-6 w-6" fill="currentColor" /> : <Shield className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <p className="text-sm font-medium text-muted-foreground">Active Session</p>
                   {isSuperUser && <Badge variant="warning" className="text-[10px]">Super User Mode</Badge>}
                </div>
                <h3 className="text-xl font-bold">{currentRole.name}</h3>
                <p className="text-sm text-slate-500">{currentCluster.id} - {currentCluster.name}</p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs bg-white dark:bg-slate-950 p-3 rounded border">
                <span className="font-semibold text-muted-foreground mr-1">Legend:</span>
                <div className="flex items-center gap-1"><Badge variant="success" className="h-2 w-2 p-0 rounded-full">{null}</Badge> <span>Active</span></div>
                <div className="flex items-center gap-1"><Badge variant="secondary" className="h-2 w-2 p-0 rounded-full">{null}</Badge> <span>Restricted</span></div>
                <div className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded border border-amber-200">Full</span> <span>All Actions</span></div>
                <div className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">V</span> <span>View Only</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Capability Summary */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Role Capability Summary</CardTitle></CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-sm font-semibold text-emerald-600 mb-3 flex items-center gap-2"><Check className="h-4 w-4" /> Enabled Capabilities</h4>
                    <ul className="space-y-2">
                        {capabilities.enabled.map((cap, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                {cap}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2"><Lock className="h-4 w-4" /> Restricted Areas</h4>
                    <ul className="space-y-2">
                        {capabilities.restricted.length === 0 ? (
                            <li className="text-sm text-muted-foreground italic">No specific major restrictions.</li>
                        ) : (
                            capabilities.restricted.map((cap, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                    {cap}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Permissions Matrix</CardTitle>
          <div className="relative w-64">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Search screen ID..." 
                className="pl-9 h-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {Object.entries(SCREEN_GROUPS).map(([group, screens]) => {
              // Filter screens based on search
              const filteredScreens = screens.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
              if (filteredScreens.length === 0 && searchTerm) return null;

              return (
                <div key={group}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider border-b pb-1">{group}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredScreens.map((screen) => {
                      const verbs = isSuperUser ? Object.values(Verbs) : RBAC_POLICY[currentCluster.id]?.[screen as ScreenId];
                      const isAllowed = !!verbs;
                      
                      return (
                        <div key={screen} className={`p-3 rounded border transition-all ${isAllowed ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60'}`}>
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex flex-col">
                                 <span className="font-semibold text-sm">{screen.split('_').map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(' ')}</span>
                                 <span className="font-mono text-[10px] text-muted-foreground">{screen}</span>
                             </div>
                             {isAllowed ? <Badge variant="success" className="text-[10px] h-5">Active</Badge> : <Badge variant="secondary" className="text-[10px] h-5">Restricted</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {isAllowed ? (
                               isSuperUser ? 
                               <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800 font-medium w-full text-center">ALL ACTIONS ENABLED</span> 
                               :
                               verbs?.map(v => (
                                  <Tooltip key={`${screen}-${v}`} content={VERB_LABELS[v]}>
                                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 font-mono cursor-help">
                                        {v}
                                      </span>
                                  </Tooltip>
                               ))
                            ) : (
                               <span className="text-[10px] text-muted-foreground italic flex items-center gap-1"><Lock className="h-3 w-3" /> No access</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Restricted Access Explanations */}
      {restrictedScreens.length > 0 && (
          <Card>
              <CardHeader><CardTitle className="text-lg">Restricted Access Explanations</CardTitle></CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {restrictedScreens.slice(0, 5).map(screen => {
                          const info = getRestrictionInfo(screen as ScreenId);
                          if (!info) return null;
                          return (
                              <div key={screen} className="border-b last:border-0 pb-2">
                                  <div className="flex justify-between text-sm font-medium">
                                      <span>{screen}</span>
                                      <span className="text-muted-foreground font-normal text-xs">Allowed for: {info.allowedRoles.join(', ')}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{info.reason}</p>
                              </div>
                          );
                      })}
                      {restrictedScreens.length > 5 && (
                          <p className="text-xs text-center text-muted-foreground italic">...and {restrictedScreens.length - 5} more restricted modules.</p>
                      )}
                      
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded text-xs text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900 flex items-center gap-2 mt-4">
                          <Info className="h-4 w-4" />
                          <span>To request access, contact your System Administrator or Compliance Lead.</span>
                      </div>
                  </div>
              </CardContent>
          </Card>
      )}

      {/* Policy Change Log */}
      <Card>
          <CardHeader><CardTitle className="text-lg">Policy Change Log (Preview)</CardTitle></CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {POLICY_CHANGELOG.map((log, i) => (
                      <div key={i} className="flex gap-4 text-sm">
                          <div className="w-32 shrink-0 text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" /> {log.date}
                          </div>
                          <div>
                              <div className="font-mono text-xs font-semibold text-primary">{log.id}</div>
                              <div className="text-muted-foreground">{log.summary}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
