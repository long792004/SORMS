import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthLayout = lazy(() => import('../layouts/AuthLayout'));
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const VerifyOtpPage = lazy(() => import('../pages/auth/VerifyOtpPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const ChangePasswordPage = lazy(() => import('../pages/auth/ChangePasswordPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ResidentListPage = lazy(() => import('../pages/residents/ResidentListPage'));
const ResidentDetailPage = lazy(() => import('../pages/residents/ResidentDetailPage'));
const ResidentFormPage = lazy(() => import('../pages/residents/ResidentFormPage'));
const MyProfilePage = lazy(() => import('../pages/residents/MyProfilePage'));
const RoomListPage = lazy(() => import('../pages/rooms/RoomListPage'));
const RoomDetailPage = lazy(() => import('../pages/rooms/RoomDetailPage'));
const RoomFormPage = lazy(() => import('../pages/rooms/RoomFormPage'));
const RequestCheckInPage = lazy(() => import('../pages/checkin/RequestCheckInPage'));
const CheckInStatusPage = lazy(() => import('../pages/checkin/CheckInStatusPage'));
const CheckInHistoryPage = lazy(() => import('../pages/checkin/CheckInHistoryPage'));
const PendingCheckInPage = lazy(() => import('../pages/checkin/PendingCheckInPage'));
const CheckInRecordsPage = lazy(() => import('../pages/checkin/CheckInRecordsPage'));
const CreateServiceRequestPage = lazy(() => import('../pages/service-requests/CreateServiceRequestPage'));
const ServiceRequestListPage = lazy(() => import('../pages/service-requests/ServiceRequestListPage'));
const MyNotificationsPage = lazy(() => import('../pages/notifications/MyNotificationsPage'));
const BroadcastNotificationPage = lazy(() => import('../pages/notifications/BroadcastNotificationPage'));
const SendNotificationPage = lazy(() => import('../pages/notifications/SendNotificationPage'));
const SentHistoryPage = lazy(() => import('../pages/notifications/SentHistoryPage'));
const ReportListPage = lazy(() => import('../pages/reports/ReportListPage'));
const CreateReportPage = lazy(() => import('../pages/reports/CreateReportPage'));
const GeneratedReportPage = lazy(() => import('../pages/reports/GeneratedReportPage'));
const StaffListPage = lazy(() => import('../pages/staff/StaffListPage'));
const StaffDetailPage = lazy(() => import('../pages/staff/StaffDetailPage'));
const StaffFormPage = lazy(() => import('../pages/staff/StaffFormPage'));
const StaffProfilePage = lazy(() => import('../pages/staff/StaffProfilePage'));
const InvoicesPage = lazy(() => import('../pages/invoices/InvoicesPage'));
const AdminPaymentPage = lazy(() => import('../pages/invoices/AdminPaymentPage'));
const RoomPricingPage = lazy(() => import('../pages/rooms/RoomPricingPage'));
const PaymentSuccessPage = lazy(() => import('../pages/invoices/PaymentSuccessPage'));
const PaymentFailurePage = lazy(() => import('../pages/invoices/PaymentFailurePage'));

function RouteFallback() {
  return <LoadingSpinner text="Loading page..." />;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuth = useAuthStore(s => s.isAuthenticated);
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
}

function RoleRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !roles.includes(user.userRole)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  const isAuth = useAuthStore(s => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Payment Success/Failure Routes (Public) */}
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure" element={<PaymentFailurePage />} />

        {/* Dashboard Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings/change-password" element={<ChangePasswordPage />} />

          {/* Residents */}
          <Route path="/residents" element={<RoleRoute roles={['Admin','Staff']}><ResidentListPage /></RoleRoute>} />
          <Route path="/residents/create" element={<RoleRoute roles={['Admin','Staff']}><ResidentFormPage /></RoleRoute>} />
          <Route path="/residents/:id" element={<RoleRoute roles={['Admin','Staff']}><ResidentDetailPage /></RoleRoute>} />
          <Route path="/residents/:id/edit" element={<RoleRoute roles={['Admin','Staff']}><ResidentFormPage /></RoleRoute>} />
          <Route path="/my-profile" element={<RoleRoute roles={['Resident']}><MyProfilePage /></RoleRoute>} />
          <Route path="/resident/invoices" element={<RoleRoute roles={['Resident']}><InvoicesPage /></RoleRoute>} />
          <Route path="/invoices" element={<RoleRoute roles={['Admin','Staff']}><AdminPaymentPage /></RoleRoute>} />

          {/* Rooms */}
          <Route path="/rooms" element={<RoomListPage />} />
          <Route path="/rooms/available" element={<RoomListPage availableOnly />} />
          <Route path="/rooms/create" element={<RoleRoute roles={['Admin','Staff']}><RoomFormPage /></RoleRoute>} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/rooms/:id/edit" element={<RoleRoute roles={['Admin','Staff']}><RoomFormPage /></RoleRoute>} />
          <Route path="/rooms/pricing" element={<RoleRoute roles={['Admin','Staff']}><RoomPricingPage /></RoleRoute>} />

          {/* Check-In */}
          <Route path="/checkin/request" element={<RoleRoute roles={['Resident']}><RequestCheckInPage /></RoleRoute>} />
          <Route path="/checkin/my-status" element={<RoleRoute roles={['Resident']}><CheckInStatusPage /></RoleRoute>} />
          <Route path="/checkin/my-history" element={<RoleRoute roles={['Resident']}><CheckInHistoryPage /></RoleRoute>} />
          <Route path="/checkin/pending" element={<RoleRoute roles={['Admin','Staff']}><PendingCheckInPage type="checkin" /></RoleRoute>} />
          <Route path="/checkout/pending" element={<RoleRoute roles={['Admin','Staff']}><PendingCheckInPage type="checkout" /></RoleRoute>} />
          <Route path="/checkin/records" element={<RoleRoute roles={['Admin','Staff']}><CheckInRecordsPage /></RoleRoute>} />

          {/* Service Requests */}
          <Route path="/service-requests/create" element={<RoleRoute roles={['Resident']}><CreateServiceRequestPage /></RoleRoute>} />
          <Route path="/service-requests/my" element={<RoleRoute roles={['Resident']}><ServiceRequestListPage myOnly /></RoleRoute>} />
          <Route path="/service-requests" element={<RoleRoute roles={['Admin','Staff']}><ServiceRequestListPage /></RoleRoute>} />
          <Route path="/service-requests/pending" element={<RoleRoute roles={['Admin','Staff']}><ServiceRequestListPage pendingOnly /></RoleRoute>} />

          {/* Notifications */}
          <Route path="/notifications/my" element={<RoleRoute roles={['Resident']}><MyNotificationsPage /></RoleRoute>} />
          <Route path="/notifications/staff" element={<RoleRoute roles={['Staff']}><MyNotificationsPage isStaff /></RoleRoute>} />
          <Route path="/notifications/broadcast" element={<RoleRoute roles={['Admin']}><BroadcastNotificationPage /></RoleRoute>} />
          <Route path="/notifications/send" element={<RoleRoute roles={['Admin','Staff']}><SendNotificationPage /></RoleRoute>} />
          <Route path="/notifications/history" element={<RoleRoute roles={['Admin','Staff']}><SentHistoryPage /></RoleRoute>} />

          {/* Reports */}
          <Route path="/reports" element={<RoleRoute roles={['Admin','Staff']}><ReportListPage /></RoleRoute>} />
          <Route path="/reports/create" element={<RoleRoute roles={['Staff']}><CreateReportPage /></RoleRoute>} />
          <Route path="/reports/pending" element={<RoleRoute roles={['Admin']}><ReportListPage pendingOnly /></RoleRoute>} />
          <Route path="/reports/occupancy" element={<RoleRoute roles={['Admin','Staff']}><GeneratedReportPage type="occupancy" /></RoleRoute>} />
          <Route path="/reports/service-usage" element={<RoleRoute roles={['Admin','Staff']}><GeneratedReportPage type="service-usage" /></RoleRoute>} />
          <Route path="/reports/revenue" element={<RoleRoute roles={['Admin','Staff']}><GeneratedReportPage type="revenue" /></RoleRoute>} />

          {/* Staff */}
          <Route path="/staff" element={<RoleRoute roles={['Admin']}><StaffListPage /></RoleRoute>} />
          <Route path="/staff/create" element={<RoleRoute roles={['Admin']}><StaffFormPage isCreate /></RoleRoute>} />
          <Route path="/staff/:id" element={<RoleRoute roles={['Admin']}><StaffDetailPage /></RoleRoute>} />
          <Route path="/staff/:id/edit" element={<RoleRoute roles={['Admin']}><StaffFormPage /></RoleRoute>} />
          <Route path="/staff/me" element={<RoleRoute roles={['Staff']}><StaffProfilePage /></RoleRoute>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuth ? '/dashboard' : '/login'} replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
