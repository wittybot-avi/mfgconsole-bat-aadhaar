
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { canView, canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { generateSettingsSpec } from '../services/settingsSpec';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { Settings as SettingsIcon, Users, Key, Bell, Webhook, Building, Lock, Download, AlertTriangle, Info, ToggleLeft, ToggleRight, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

const DisabledInput = (props: any) => (
    <div className="relative">
        <Input {...props} disabled className="pr-8 bg-slate-50 dark:bg-slate-900 text-slate-500" />
        <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
    </div>
);

const DisabledToggle = ({ label, checked }: { label?: string, checked: boolean }) => (
    <div className="flex items-center gap-2 opacity-60 cursor-not-allowed">
        {checked ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
        <span className="text-sm text-muted-foreground">{label}</span>
    </div>
);

/* Updated BackendRequiredTooltip to use React.FC for better children prop detection */
const BackendRequiredTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Tooltip content="Action disabled: Backend IAM/Secret Manager integration required.">
        <div className="opacity-60 pointer-events-none">{children}</div>
    </Tooltip>
);

// --- Tabs ---

const ProfileTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Organization Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Organization Name</label>
                        <DisabledInput defaultValue="Aayatana Technologies Pvt Ltd" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tax ID / GSTIN</label>
                        <DisabledInput defaultValue="29AAACA1234A1Z5" />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-sm font-medium">Registered Address</label>
                        <DisabledInput defaultValue="Unit 42, Tech Park, Electronic City, Bangalore, KA" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Support Email</label>
                        <DisabledInput defaultValue="support@aayatana.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Jurisdiction</label>
                        <DisabledInput defaultValue="India (Default)" />
                    </div>
                </div>
                <div className="pt-4 border-t flex justify-end">
                    <BackendRequiredTooltip>
                        <Button>Save Changes</Button>
                    </BackendRequiredTooltip>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-base">Data Usage</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Profile data is embedded in:</p>
                <ul className="space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Compliance Evidence Packs</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Warranty Certificates</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Custody Handover Docs</li>
                    <li className="flex items-center gap-2 opacity-50"><CheckCircle className="h-4 w-4" /> DPP Exports (Future)</li>
                </ul>
            </CardContent>
        </Card>
    </div>
);

const UsersTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded border border-blue-100 dark:border-blue-900 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold">Identity Management Preview</p>
                <p className="mt-1">Permissions are governed by Access Control policies. This view manages identity-to-role mapping. Real user management requires integration with an IdP (Auth0, Azure AD, etc).</p>
            </div>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Registered Users (Sample)</CardTitle>
                <BackendRequiredTooltip>
                    <Button size="sm">Create User</Button>
                </BackendRequiredTooltip>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role Cluster</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {[
                            { name: 'Alice Admin', email: 'alice@aayatana.com', role: 'Super User', scope: 'Global', status: 'Active' },
                            { name: 'Bob Build', email: 'bob@aayatana.com', role: 'C2 Manufacturing', scope: 'Plant A', status: 'Active' },
                            { name: 'Charlie Check', email: 'charlie@aayatana.com', role: 'C3 QA', scope: 'Plant A', status: 'Active' },
                            { name: 'Dave Driver', email: 'dave@logistics.com', role: 'C6 Logistics', scope: 'Region South', status: 'Disabled' },
                        ].map((u, i) => (
                            <TableRow key={i} className="opacity-75">
                                <TableCell className="font-medium">{u.name}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                                <TableCell>{u.scope}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                        {u.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <BackendRequiredTooltip><Button variant="ghost" size="icon"><Lock className="h-3 w-3" /></Button></BackendRequiredTooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    </div>
);

const ApiKeysTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Active Keys</CardTitle>
                    <BackendRequiredTooltip>
                        <Button size="sm">Generate Key</Button>
                    </BackendRequiredTooltip>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Key Name</TableHead>
                                <TableHead>Prefix</TableHead>
                                <TableHead>Scope</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {[
                                { name: 'MQTT Ingest - Plant A', prefix: 'pk_live_...', scope: 'Ingest', date: '2023-11-01' },
                                { name: 'ERP Connector', prefix: 'pk_live_...', scope: 'Read/Write', date: '2024-01-15' },
                                { name: 'Partner Portal API', prefix: 'pk_test_...', scope: 'Read Only', date: '2024-03-10' },
                            ].map((k, i) => (
                                <TableRow key={i} className="opacity-75">
                                    <TableCell className="font-medium">{k.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{k.prefix}••••</TableCell>
                                    <TableCell><Badge variant="secondary">{k.scope}</Badge></TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{k.date}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <BackendRequiredTooltip><Button variant="ghost" size="icon"><RefreshCw className="h-3 w-3" /></Button></BackendRequiredTooltip>
                                            <BackendRequiredTooltip><Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="h-3 w-3" /></Button></BackendRequiredTooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Security Policy</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 rounded text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="h-4 w-4 mb-2" />
                        <p>Secrets are stored and rotated via backend secret manager (Vault/AWS Secrets). Frontend never handles raw private keys.</p>
                    </div>
                    <ul className="space-y-2 text-muted-foreground">
                        <li>• Keys auto-rotate every 90 days.</li>
                        <li>• Usage logs available in Audit Trail.</li>
                        <li>• Scopes enforced at API Gateway level.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    </div>
);

const NotificationsTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <Card>
            <CardHeader><CardTitle className="text-base">Event Subscriptions</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Channels</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead className="text-right">Enabled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {[
                            { event: 'Custody: Acceptance SLA Breach', sev: 'High', chan: 'Email, In-App', group: 'Logistics, Warranty' },
                            { event: 'Warranty: New Claim Created', sev: 'Medium', chan: 'In-App', group: 'Warranty' },
                            { event: 'EOL: Failure Rate Spike', sev: 'Critical', chan: 'Email, SMS', group: 'QA, Production' },
                            { event: 'Compliance: Finding Opened', sev: 'Low', chan: 'In-App', group: 'Compliance' },
                        ].map((n, i) => (
                            <TableRow key={i} className="opacity-75">
                                <TableCell className="font-medium">{n.event}</TableCell>
                                <TableCell>
                                    <Badge variant={n.sev === 'Critical' ? 'destructive' : n.sev === 'High' ? 'warning' : 'outline'}>
                                        {n.sev}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs">{n.chan}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{n.group}</TableCell>
                                <TableCell className="text-right">
                                    <DisabledToggle checked={true} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    </div>
);

const WebhooksTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Outbound Webhooks</CardTitle>
                    <BackendRequiredTooltip>
                        <Button size="sm">Add Endpoint</Button>
                    </BackendRequiredTooltip>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Target URL</TableHead>
                                <TableHead>Events</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {[
                                { name: 'SAP ERP Sync', url: 'https://api.sap.corp/hooks/•••', events: 'Custody.*, Warranty.Decided', status: 'Active' },
                                { name: 'Slack Alerts', url: 'https://hooks.slack.com/•••', events: 'Start.*, Critical.*', status: 'Active' },
                            ].map((w, i) => (
                                <TableRow key={i} className="opacity-75">
                                    <TableCell className="font-medium">{w.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{w.url}</TableCell>
                                    <TableCell className="text-xs truncate max-w-[150px]" title={w.events}>{w.events}</TableCell>
                                    <TableCell><Badge variant="success">{w.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <BackendRequiredTooltip><Button variant="ghost" size="icon">Test</Button></BackendRequiredTooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Integration Guide</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <p className="text-muted-foreground">Recommended backend contract for webhook consumers:</p>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded border font-mono text-xs">
                        <p>POST /webhook</p>
                        <p>Content-Type: application/json</p>
                        <p>X-Aayatana-Signature: sha256=...</p>
                        <p className="mt-2 text-slate-500">Payload:</p>
                        <p>{`{ "event": "type", "data": { ... }, "ts": 123 }`}</p>
                    </div>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                        <li>Expect exponential backoff retries.</li>
                        <li>Verify HMAC signatures.</li>
                        <li>Idempotency keys included in headers.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    </div>
);

// --- Main Page ---

export default function Settings() {
    const { currentCluster, addNotification } = useAppStore();
    const [activeTab, setActiveTab] = useState('');

    // Permissions
    const showProfile = canView(currentCluster?.id || '', ScreenId.SETTINGS_PROFILE);
    const showUsers = canView(currentCluster?.id || '', ScreenId.SETTINGS_USERS);
    const showKeys = canView(currentCluster?.id || '', ScreenId.SETTINGS_API_KEYS);
    const showNotifs = canView(currentCluster?.id || '', ScreenId.SETTINGS_NOTIFICATIONS);
    const showWebhooks = canView(currentCluster?.id || '', ScreenId.SETTINGS_WEBHOOKS);
    const canExport = canDo(currentCluster?.id || '', ScreenId.SETTINGS_EXPORT, 'X');

    useEffect(() => {
        // Set default tab
        if (!activeTab) {
            if (showProfile) setActiveTab('profile');
            else if (showUsers) setActiveTab('users');
            else if (showKeys) setActiveTab('keys');
            else if (showNotifs) setActiveTab('notifications');
            else if (showWebhooks) setActiveTab('webhooks');
        }
    }, [showProfile, showUsers, showKeys, showNotifs, showWebhooks, activeTab]);

    const handleExport = () => {
        const spec = generateSettingsSpec();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spec, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `settings_spec_v${spec.version}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addNotification({ title: "Exported", message: "Settings schema specification downloaded.", type: "success" });
    };

    if (!showProfile && !showUsers && !showKeys && !showNotifs && !showWebhooks) {
        return <div className="p-10 text-center">Access Denied</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                    <p className="text-muted-foreground">Control plane for identity, access, integrations, and communications.</p>
                </div>
                {canExport && (
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Download Spec
                    </Button>
                )}
            </div>

            {/* Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-bold">PREVIEW / BACKEND REQUIRED</p>
                    <p>These settings are representative of the final control plane. Input fields and actions are disabled until backend services (IAM, Secrets Manager, Notification Service) are integrated.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
                {showProfile && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('profile')}
                    >
                        <Building className="h-4 w-4" /> Profile
                    </button>
                )}
                {showUsers && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('users')}
                    >
                        <Users className="h-4 w-4" /> Users
                    </button>
                )}
                {showKeys && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'keys' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('keys')}
                    >
                        <Key className="h-4 w-4" /> API Keys
                    </button>
                )}
                {showNotifs && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'notifications' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('notifications')}
                    >
                        <Bell className="h-4 w-4" /> Notifications
                    </button>
                )}
                {showWebhooks && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'webhooks' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('webhooks')}
                    >
                        <Webhook className="h-4 w-4" /> Webhooks
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="pt-2">
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'keys' && <ApiKeysTab />}
                {activeTab === 'notifications' && <NotificationsTab />}
                {activeTab === 'webhooks' && <WebhooksTab />}
            </div>
        </div>
    );
}
