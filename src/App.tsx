import React from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { RouteGuard } from './components/RouteGuard';
import { ScreenId } from './rbac/screenIds';
import { Layout } from './components/Layout';
import { ROUTES } from '../app/routes';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Telemetry from './pages/Telemetry';
import Analytics from './pages/Analytics';
import SkuList from './pages/SkuList';
import SkuDetail from './pages/SkuDetail';
import CellLotsList from './pages/CellLotsList';
import CellLotDetail from './pages/CellLotDetail';
import CreateCellLot from './pages/CreateCellLot';
import LineageView from './pages/LineageView';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import ModuleAssemblyList from './pages/ModuleAssemblyList';
import ModuleAssemblyDetail from './pages/ModuleAssemblyDetail';
import PackAssemblyList from './pages/PackAssemblyList';
import PackAssemblyDetail from './pages/PackAssemblyDetail';
import Batteries from './pages/Batteries';
import BatteryDetail from './pages/BatteryDetail';
import ProvisioningConsole from './pages/ProvisioningConsole';
import ProvisioningStationSetup from './pages/ProvisioningStationSetup';
import ProvisioningQueue from './pages/ProvisioningQueue';
import InventoryList from './pages/InventoryList';
import InventoryDetail from './pages/InventoryDetail';
import DispatchList from './pages/DispatchList';
import DispatchDetail from './pages/DispatchDetail';
import EolQaList from './pages/EolQaList';
import EolDetails from './pages/EolDetails';
import EolRunTest from './pages/EolRunTest';
import EolAuditDetail from './pages/EolAuditDetail';
import Compliance from './pages/Compliance';
import Custody from './pages/Custody';
import CustodyDetail from './pages/CustodyDetail';
import Warranty from './pages/Warranty';
import WarrantyDetail from './pages/WarrantyDetail';
import WarrantyIntake from './pages/WarrantyIntake';
import RbacAdmin from './pages/RbacAdmin';
import Settings from './pages/Settings';
import DiagnosticsPage from './pages/DiagnosticsPage';
import EolStationSetup from './pages/EolStationSetup';
import EolReview from './pages/EolReview';
import NotFound from './pages/NotFound';
import RunbookHub from './pages/RunbookHub';
import RunbookDetail from './pages/RunbookDetail';

/**
 * Main Application Routing Node
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
            <Route path="observe/telemetry" element={<RouteGuard screen={ScreenId.TELEMETRY}><Telemetry /></RouteGuard>} />
            <Route path="observe/analytics" element={<RouteGuard screen={ScreenId.ANALYTICS}><Analytics /></RouteGuard>} />
            
            {/* Design */}
            <Route path="design/sku">
              <Route index element={<RouteGuard screen={ScreenId.SKU_LIST}><SkuList /></RouteGuard>} />
              <Route path=":id" element={<RouteGuard screen={ScreenId.SKU_DETAIL}><SkuDetail /></RouteGuard>} />
            </Route>

            {/* Trace */}
            <Route path="trace/cells">
               <Route index element={<Navigate to={ROUTES.CELL_SERIALIZATION_HAPPY} replace />} />
               <Route path="lot-happy" element={<RouteGuard screen={ScreenId.CELL_LOTS_LIST}><CellLotsList /></RouteGuard>} />
               <Route path="new" element={<RouteGuard screen={ScreenId.CELL_LOTS_CREATE}><CreateCellLot /></RouteGuard>} />
               <Route path=":lotId" element={<RouteGuard screen={ScreenId.CELL_LOTS_DETAIL}><CellLotDetail /></RouteGuard>} />
            </Route>
            <Route path="trace/lineage">
              <Route index element={<RouteGuard screen={ScreenId.LINEAGE_VIEW}><LineageView /></RouteGuard>} />
              <Route path=":id" element={<RouteGuard screen={ScreenId.LINEAGE_VIEW}><LineageView /></RouteGuard>} />
            </Route>
            
            {/* Operate */}
            <Route path="operate/batches">
              <Route index element={<RouteGuard screen={ScreenId.BATCHES_LIST}><Batches /></RouteGuard>} />
              <Route path=":id" element={<RouteGuard screen={ScreenId.BATCHES_DETAIL}><BatchDetail /></RouteGuard>} />
            </Route>
            <Route path="operate/modules">
              <Route index element={<RouteGuard screen={ScreenId.MODULE_ASSEMBLY_LIST}><ModuleAssemblyList /></RouteGuard>} />
              <Route path=":id" element={<RouteGuard screen={ScreenId.MODULE_ASSEMBLY_DETAIL}><ModuleAssemblyDetail /></RouteGuard>} />
            </Route>
            <Route path="operate/packs">
              <Route index element={<RouteGuard screen={ScreenId.PACK_ASSEMBLY_LIST}><PackAssemblyList /></RouteGuard>} />
              <Route path=":id" element={<RouteGuard screen={ScreenId.PACK_ASSEMBLY_DETAIL}><PackAssemblyDetail /></RouteGuard>} />
            </Route>
            <Route path="operate/identity">
              <Route index element={<RouteGuard screen={ScreenId.BATTERIES_LIST}><Batteries /></RouteGuard>} />
              <Route path=":id" element={<RouteGuard screen={ScreenId.BATTERIES_DETAIL}><BatteryDetail /></RouteGuard>} />
            </Route>
            <Route path="operate/inventory">
              <Route index element={<RouteGuard screen={ScreenId.INVENTORY}><InventoryList /></RouteGuard>} />
              <Route path=":id" element={<RouteGuard screen={ScreenId.INVENTORY_DETAIL}><InventoryDetail /></RouteGuard>} />
            </Route>
            <Route path="operate/dispatch">
              <Route index element={<RouteGuard screen={ScreenId.DISPATCH_LIST}><DispatchList /></RouteGuard>} />
              <Route path=":id" element={<RouteGuard screen={ScreenId.DISPATCH_DETAIL}><DispatchDetail /></RouteGuard>} />
            </Route>

            {/* Assure */}
            <Route path="assure/eol">
              <Route index element={<RouteGuard screen={ScreenId.EOL_QA_QUEUE}><EolQaList /></RouteGuard>} />
              <Route path="details/:buildId" element={<RouteGuard screen={ScreenId.EOL_DETAILS}><EolDetails /></RouteGuard>} />
              <Route path="stations" element={<RouteGuard screen={ScreenId.EOL_SETUP}><EolStationSetup /></RouteGuard>} />
              <Route path="review" element={<RouteGuard screen={ScreenId.EOL_REVIEW}><EolReview /></RouteGuard>} />
            </Route>

            {/* Resolve */}
            <Route path="resolve/warranty-returns" element={<RouteGuard screen={ScreenId.WARRANTY}><Warranty /></RouteGuard>} />
            <Route path="resolve/warranty-returns/claims/:claimId" element={<RouteGuard screen={ScreenId.WARRANTY}><WarrantyDetail /></RouteGuard>} />
            <Route path="warranty/intake" element={<RouteGuard screen={ScreenId.WARRANTY_EXTERNAL_INTAKE}><WarrantyIntake /></RouteGuard>} />
            
            {/* Govern */}
            <Route path="govern/compliance" element={<RouteGuard screen={ScreenId.COMPLIANCE}><Compliance /></RouteGuard>} />
            <Route path="govern/chain-of-custody" element={<RouteGuard screen={ScreenId.CUSTODY}><Custody /></RouteGuard>} />
            <Route path="govern/chain-of-custody/:dispatchId" element={<RouteGuard screen={ScreenId.CUSTODY}><CustodyDetail /></RouteGuard>} />
            
            {/* Admin */}
            <Route path="admin/settings" element={<RouteGuard screen={ScreenId.SETTINGS}><Settings /></RouteGuard>} />
            <Route path="admin/access-audit" element={<RouteGuard screen={ScreenId.RBAC_VIEW}><RbacAdmin /></RouteGuard>} />
            
            {/* SOP Guide */}
            <Route path="runbooks" element={<RouteGuard screen={ScreenId.RUNBOOK_HUB}><RunbookHub /></RouteGuard>} />
            <Route path="runbooks/:runbookId" element={<RouteGuard screen={ScreenId.RUNBOOK_DETAIL}><RunbookDetail /></RouteGuard>} />

            {/* System Health */}
            <Route path="diagnostics/system-health" element={<DiagnosticsPage />} />

            {/* Redirects */}
            <Route path="telemetry" element={<Navigate to="/observe/telemetry" replace />} />
            <Route path="analytics" element={<Navigate to="/observe/analytics" replace />} />
            <Route path="sku" element={<Navigate to="/design/sku" replace />} />
            <Route path="operate/batteries" element={<Navigate to="/operate/identity" replace />} />
            <Route path="inventory" element={<Navigate to="/operate/inventory" replace />} />
            <Route path="dispatch" element={<Navigate to="/operate/dispatch" replace />} />
            <Route path="eol" element={<Navigate to="/assure/eol" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}