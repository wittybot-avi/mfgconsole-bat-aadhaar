import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGate } from './src/components/AuthGate';
import { RouteGuard } from './src/components/RouteGuard';
import { ScreenId } from './src/rbac/screenIds';
import { Layout } from './src/components/Layout';
import { ROUTES } from './app/routes';

// Pages
import Login from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import Telemetry from './src/pages/Telemetry';
import Analytics from './src/pages/Analytics';
import SkuList from './src/pages/SkuList';
import SkuDetail from './src/pages/SkuDetail';
import CellLotsList from './src/pages/CellLotsList';
import CellLotDetail from './src/pages/CellLotDetail';
import CreateCellLot from './src/pages/CreateCellLot';
import LineageView from './src/pages/LineageView';
import Batches from './src/pages/Batches';
import BatchDetail from './src/pages/BatchDetail';
import ModuleAssemblyList from './src/pages/ModuleAssemblyList';
import ModuleAssemblyDetail from './src/pages/ModuleAssemblyDetail';
import PackAssemblyList from './src/pages/PackAssemblyList';
import PackAssemblyDetail from './src/pages/PackAssemblyDetail';
import Batteries from './src/pages/Batteries';
import BatteryDetail from './src/pages/BatteryDetail';
import ProvisioningConsole from './src/pages/ProvisioningConsole';
import ProvisioningStationSetup from './src/pages/ProvisioningStationSetup';
import ProvisioningQueue from './src/pages/ProvisioningQueue';
import InventoryList from './src/pages/InventoryList';
import DispatchList from './src/pages/DispatchList';
import DispatchDetail from './src/pages/DispatchDetail';
import EolQaList from './src/pages/EolQaList';
import EolDetails from './src/pages/EolDetails';
import EolRunTest from './src/pages/EolRunTest';
import EolAuditDetail from './src/pages/EolAuditDetail';
import Compliance from './src/pages/Compliance';
import Custody from './src/pages/Custody';
import CustodyDetail from './src/pages/CustodyDetail';
import Warranty from './src/pages/Warranty';
import WarrantyDetail from './src/pages/WarrantyDetail';
import WarrantyIntake from './src/pages/WarrantyIntake';
import RbacAdmin from './src/pages/RbacAdmin';
import Settings from './src/pages/Settings';
import DiagnosticsPage from './src/pages/DiagnosticsPage';
import EolStationSetup from './src/pages/EolStationSetup';
import EolReview from './src/pages/EolReview';
import ErrorBoundary from './src/components/ErrorBoundary';
import NotFound from './src/pages/NotFound';
import RunbookHub from './src/pages/RunbookHub';
import RunbookDetail from './src/pages/RunbookDetail';

/**
 * Main Application Routing Node
 * Patch P-056A: Boot-Safe Shell initialization.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          
          <Route path="/" element={<AuthGate><Layout /></AuthGate>}>
            <Route index element={<RouteGuard screen={ScreenId.DASHBOARD}><Dashboard /></RouteGuard>} />
            
            {/* Observe */}
            <Route path={ROUTES.TELEMETRY.substring(1)} element={<RouteGuard screen={ScreenId.TELEMETRY}><Telemetry /></RouteGuard>} />
            <Route path={ROUTES.ANALYTICS.substring(1)} element={<RouteGuard screen={ScreenId.ANALYTICS}><Analytics /></RouteGuard>} />
            
            {/* SOP Guide */}
            <Route path={ROUTES.RUNBOOKS.substring(1)} element={<RouteGuard screen={ScreenId.RUNBOOK_HUB}><RunbookHub /></RouteGuard>} />
            <Route path={ROUTES.RUNBOOK_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.RUNBOOK_DETAIL}><RunbookDetail /></RouteGuard>} />

            {/* Design */}
            <Route path={ROUTES.SKU_DESIGN.substring(1)} element={<RouteGuard screen={ScreenId.SKU_LIST}><SkuList /></RouteGuard>} />
            <Route path={ROUTES.SKU_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.SKU_LIST}><SkuDetail /></RouteGuard>} />
            
            {/* Trace Namespace */}
            <Route path="trace/cells">
               <Route index element={<Navigate to={ROUTES.CELL_SERIALIZATION_HAPPY} replace />} />
               <Route path="lot-happy" element={<RouteGuard screen={ScreenId.CELL_LOTS_LIST}><CellLotsList /></RouteGuard>} />
               <Route path="new" element={<RouteGuard screen={ScreenId.CELL_LOTS_CREATE}><CreateCellLot /></RouteGuard>} />
               <Route path=":lotId" element={<RouteGuard screen={ScreenId.CELL_LOTS_DETAIL}><CellLotDetail /></RouteGuard>} />
            </Route>

            {/* Trace Lineage */}
            <Route path={ROUTES.LINEAGE_AUDIT.substring(1)} element={<RouteGuard screen={ScreenId.LINEAGE_VIEW}><LineageView /></RouteGuard>} />
            <Route path={ROUTES.LINEAGE_AUDIT_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.LINEAGE_VIEW}><LineageView /></RouteGuard>} />
            
            {/* Operate */}
            <Route path={ROUTES.BATCHES.substring(1)} element={<RouteGuard screen={ScreenId.BATCHES_LIST}><Batches /></RouteGuard>} />
            <Route path={ROUTES.BATCH_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.BATCHES_DETAIL}><BatchDetail /></RouteGuard>} />
            <Route path={ROUTES.MODULE_ASSEMBLY.substring(1)} element={<RouteGuard screen={ScreenId.MODULE_ASSEMBLY_LIST}><ModuleAssemblyList /></RouteGuard>} />
            <Route path={ROUTES.MODULE_ASSEMBLY_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.MODULE_ASSEMBLY_DETAIL}><ModuleAssemblyDetail /></RouteGuard>} />
            <Route path={ROUTES.PACK_ASSEMBLY.substring(1)} element={<RouteGuard screen={ScreenId.PACK_ASSEMBLY_LIST}><PackAssemblyList /></RouteGuard>} />
            <Route path={ROUTES.PACK_ASSEMBLY_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.PACK_ASSEMBLY_DETAIL}><PackAssemblyDetail /></RouteGuard>} />
            <Route path={ROUTES.BATTERY_IDENTITY.substring(1)} element={<RouteGuard screen={ScreenId.BATTERIES_LIST}><Batteries /></RouteGuard>} />
            <Route path={ROUTES.BATTERY_IDENTITY_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.BATTERIES_DETAIL}><BatteryDetail /></RouteGuard>} />

            <Route path={ROUTES.PROVISIONING_QUEUE.substring(1)} element={<RouteGuard screen={ScreenId.PROVISIONING_QUEUE}><ProvisioningQueue /></RouteGuard>} />
            <Route path={ROUTES.PROVISIONING_SETUP.substring(1)} element={<RouteGuard screen={ScreenId.PROVISIONING_STATION_SETUP}><ProvisioningStationSetup /></RouteGuard>} />
            <Route path={ROUTES.PROVISIONING_WORKSTATION.substring(1)} element={<RouteGuard screen={ScreenId.PROVISIONING}><ProvisioningConsole /></RouteGuard>} />
            
            <Route path={ROUTES.INVENTORY.substring(1)} element={<RouteGuard screen={ScreenId.INVENTORY}><InventoryList /></RouteGuard>} />
            <Route path={ROUTES.DISPATCH_ORDERS.substring(1)} element={<RouteGuard screen={ScreenId.DISPATCH_LIST}><DispatchList /></RouteGuard>} />
            <Route path={ROUTES.DISPATCH_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.DISPATCH_DETAIL}><DispatchDetail /></RouteGuard>} />
            
            {/* Assure */}
            <Route path={ROUTES.EOL_QUEUE.substring(1)} element={<RouteGuard screen={ScreenId.EOL_QA_QUEUE}><EolQaList /></RouteGuard>} />
            <Route path={ROUTES.EOL_SETUP.substring(1)} element={<RouteGuard screen={ScreenId.EOL_SETUP}><EolStationSetup /></RouteGuard>} />
            <Route path={ROUTES.EOL_REVIEW.substring(1)} element={<RouteGuard screen={ScreenId.EOL_REVIEW}><EolReview /></RouteGuard>} />
            <Route path={ROUTES.EOL_DETAILS.substring(1)} element={<RouteGuard screen={ScreenId.EOL_DETAILS}><EolDetails /></RouteGuard>} />
            <Route path={ROUTES.EOL_RUN.substring(1)} element={<RouteGuard screen={ScreenId.EOL_RUN_TEST}><EolRunTest /></RouteGuard>} />
            <Route path={ROUTES.EOL_AUDIT.substring(1)} element={<RouteGuard screen={ScreenId.EOL_AUDIT_DETAIL}><EolAuditDetail /></RouteGuard>} />

            {/* Govern & Resolve */}
            <Route path={ROUTES.COMPLIANCE.substring(1)} element={<RouteGuard screen={ScreenId.COMPLIANCE}><Compliance /></RouteGuard>} />
            <Route path={ROUTES.CUSTODY.substring(1)} element={<RouteGuard screen={ScreenId.CUSTODY}><Custody /></RouteGuard>} />
            <Route path={ROUTES.CUSTODY_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.CUSTODY}><CustodyDetail /></RouteGuard>} />
            
            <Route path={ROUTES.WARRANTY_RETURNS.substring(1)} element={<RouteGuard screen={ScreenId.WARRANTY}><Warranty /></RouteGuard>} />
            <Route path={ROUTES.WARRANTY_CLAIM_DETAIL.substring(1)} element={<RouteGuard screen={ScreenId.WARRANTY}><WarrantyDetail /></RouteGuard>} />
            <Route path={ROUTES.WARRANTY_INTAKE.substring(1)} element={<RouteGuard screen={ScreenId.WARRANTY_EXTERNAL_INTAKE}><WarrantyIntake /></RouteGuard>} />
            
            {/* Admin & Diagnostics */}
            <Route path={ROUTES.SETTINGS.substring(1)} element={<RouteGuard screen={ScreenId.SETTINGS}><Settings /></RouteGuard>} />
            <Route path={ROUTES.ACCESS_AUDIT.substring(1)} element={<RouteGuard screen={ScreenId.RBAC_VIEW}><RbacAdmin /></RouteGuard>} />
            <Route path={ROUTES.SYSTEM_HEALTH.substring(1)} element={<DiagnosticsPage />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
