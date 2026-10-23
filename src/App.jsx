import React, { useContext } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import StudentDashboard from './components/StudentDashboard';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import StudentPort from './components/StudentPort';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import List from './components/List';
import SupplySections from './components/SupplySections';
import Menu from './components/Menu';
import PersonInfo from './store/StudentData';
import Admin from './components/Admin';
import AdminLogin from './components/AdminLogin';
import StudentManagement from './components/StudentManagement';
import UniversalMenuStudio from './components/menu/UniversalMenuStudio';
import DietaryManagement from './components/DietaryManagement';
import AuditTrail from './components/audit/AuditTrail';
import KitchenDisplay from './components/KitchenDisplay';
import GuidePage from './components/guide/GuidePage';
import DiningEthicsPage from './components/ethics/DiningEthicsPage';
import NotFound from './components/NotFound';
import AdminRoute from './components/guards/AdminRoute';
import RoleRoute from './components/guards/RoleRoute';
import StudentRoute from './components/guards/StudentRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { DialogProvider } from './components/ui/AppDialog';
import { NotificationProvider } from './store/NotificationContext';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import EmergencyNotificationDialog from './components/notifications/EmergencyNotificationDialog';
import ApexNotificationManager from './components/notifications/admin/ApexNotificationManager';
import CareHubPage from './components/support/CareHubPage';
import SupportCommandCenter from './components/admin/support/SupportCommandCenter';
import { AuthContext } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { LanguageProvider } from './store/LanguageContext';
import { SidebarProvider, useSidebar } from './components/nav/SidebarContext';
import BrowserLeftSidebar from './components/nav/BrowserLeftSidebar';
import { ROLES } from './utils/rbac';
import SmoothScrollProvider from './components/scroll/SmoothScrollProvider';
import ScrollProgressBar from './components/scroll/ScrollProgressBar';
import BackToTopButton from './components/scroll/BackToTopButton';
import ScrollRestorationWatcher from './components/scroll/ScrollRestorationWatcher';
import './App.css';

function AppContent() {
  const { user, homeRoute } = useContext(AuthContext);
  const isAdmin = Boolean(user);
  const location = useLocation();
  const { sidebarOpen } = useSidebar();

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-[#f8faf8] dark:bg-[#080d0b] text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-x-hidden">
      <ScrollProgressBar />
      <ScrollRestorationWatcher />
      <Navbar isAdmin={isAdmin} />
      <div className="flex flex-1 w-full relative min-w-0">
        <BrowserLeftSidebar />
        {/* Desktop Sidebar Spacer to reserve space for fixed sidebar */}
        <div
          className={`hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-72' : 'w-0'
          }`}
          aria-hidden="true"
        />
        <main className="flex-1 w-full min-w-0 flex flex-col overflow-x-hidden pb-24 md:pb-8 transition-all duration-300">
        <ErrorBoundary>
          <Routes>
            {/* Unified Public Student Dashboard / Home */}
            <Route path="/" element={<StudentDashboard />} />

            {/* Legacy Token Board Redirect to Unified Dashboard */}
            <Route path="/board" element={<Navigate to="/" replace />} />

            {/* Public Canteen Food Menu */}
            <Route path="/menu" element={<Menu />} />
            <Route path="/fmenu" element={<Navigate to="/menu" replace />} />

            {/* Public Document Downloads & Information */}
            <Route path="/login" element={<Login />} />
            <Route path="/list" element={<List />} />
            <Route path="/lunch" element={<SupplySections defaultMeal="lunch" />} />
            <Route path="/breakfast" element={<SupplySections defaultMeal="breakfast" />} />
            <Route path="/supply" element={<Navigate to="/breakfast" replace />} />
            <Route path="/manifest" element={<Navigate to="/breakfast" replace />} />
            <Route path="/guide" element={<GuidePage />} />
            {/* Sacred Islamic Dining Ethics & Dars Adab Sanctuary */}
            <Route path="/adab" element={<DiningEthicsPage />} />
            <Route path="/ethics" element={<Navigate to="/adab" replace />} />
            <Route path="/dining-ethics" element={<Navigate to="/adab" replace />} />
            <Route path="/adab-al-maidah" element={<Navigate to="/adab" replace />} />
            <Route path="/support" element={<CareHubPage />} />
            <Route path="/feedback" element={<CareHubPage />} />
            <Route path="/contact" element={<CareHubPage />} />

            {/* Student Dining Portal (Clean canonical route + backward-compatible alias) */}
            <Route
              path="/student"
              element={
                <StudentRoute>
                  <StudentPort />
                </StudentRoute>
              }
            />
            <Route path="/student-portal" element={<Navigate to="/student" replace />} />

            {/* Dedicated Kitchen Display System (Cooks, Canteen Committee, Central, Devs) */}
            <Route
              path="/kitchen"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.COOK,
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <KitchenDisplay />
                </RoleRoute>
              }
            />
            <Route path="/kds" element={<Navigate to="/kitchen" replace />} />
            <Route path="/cook-portal" element={<Navigate to="/kitchen" replace />} />

            {/* Master Board & Student Management (Central Committee, Canteen Sub-Committee, Devs) */}
            <Route
              path="/admin"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <Admin />
                </RoleRoute>
              }
            />
            <Route
              path="/student-management"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <StudentManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <RoleRoute allowedRoles={[ROLES.CENTRAL_COMMITTEE, ROLES.DEVELOPER]}>
                  <AuditTrail />
                </RoleRoute>
              }
            />
            <Route path="/admin/audit" element={<Navigate to="/admin/audit-logs" replace />} />
            <Route path="/audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />

            {/* Broadcast Notifications & Announcements (Canteen Sub-Committee, Central, Devs) */}
            <Route
              path="/admin/notifications"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <ApexNotificationManager />
                </RoleRoute>
              }
            />
            <Route path="/notifications" element={<Navigate to="/admin/notifications" replace />} />

            {/* Support, Inquiries & Care Center (Canteen Committee, Central, Devs, Cooks) */}
            <Route
              path="/admin/support"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                    ROLES.COOK,
                  ]}
                >
                  <SupportCommandCenter />
                </RoleRoute>
              }
            />
            <Route path="/admin/feedback" element={<Navigate to="/admin/support" replace />} />

            {/* Menu & Dietary Consoles (Canteen Sub-Committee, Central, Devs) */}
            <Route
              path="/admin/menu"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <UniversalMenuStudio />
                </RoleRoute>
              }
            />
            <Route path="/menu-management" element={<Navigate to="/admin/menu" replace />} />
            <Route
              path="/admin/dietary"
              element={
                <RoleRoute
                  allowedRoles={[
                    ROLES.CANTEEN_COMMITTEE,
                    ROLES.CENTRAL_COMMITTEE,
                    ROLES.DEVELOPER,
                  ]}
                >
                  <DietaryManagement />
                </RoleRoute>
              }
            />
            <Route path="/admin/avoiders" element={<Navigate to="/admin/dietary" replace />} />
            <Route path="/dietary-management" element={<Navigate to="/admin/dietary" replace />} />

            {/* Legacy Redirects */}
            <Route path="/add-student" element={<Navigate to="/student-management?add=true" replace />} />
            <Route path="/add-students" element={<Navigate to="/student-management?add=true" replace />} />
            <Route path="/astudent-port" element={<Navigate to="/student-management" replace />} />
            <Route path="/m-tokens" element={<Navigate to="/student-management" replace />} />
            <Route path="/pdfg" element={<Navigate to="/breakfast" replace />} />
            <Route
              path="/alogin"
              element={user ? <Navigate to={homeRoute || '/admin'} replace /> : <AdminLogin />}
            />

            {/* 404 Catch-All Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
        <Footer />
        </main>
      </div>
      {!location.pathname.startsWith('/kitchen') && <BackToTopButton />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PersonInfo>
          <NotificationProvider>
            <DialogProvider>
              <SmoothScrollProvider>
                <SidebarProvider>
                  <AppContent />
                  <NotificationDrawer />
                  <EmergencyNotificationDialog />
                </SidebarProvider>
              </SmoothScrollProvider>
            </DialogProvider>
          </NotificationProvider>
        </PersonInfo>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;