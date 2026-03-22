import { ReactElement } from "react";
import {
  AboutPage,
  ContactPage,
  HomePage,
  RoomAvailabilityPage,
  RoomDetailPage,
  RoomListPage,
  RoomReviewsPage,
  SearchResultsPage,
  ServicesPage
} from "../pages/public/PublicPages";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage, VerifyOtpPage } from "../pages/auth/AuthPages";
import {
  CheckoutPage,
  ResidentBookingPage,
  ResidentCheckinStatusPage,
  ResidentCreateServiceRequestPage,
  ResidentDashboardPage,
  ResidentInvoicesPage,
  ResidentNotificationsPage,
  ResidentPaymentPage,
  ResidentProfilePage,
  ResidentReviewsPage,
  ResidentServiceRequestsPage
} from "../pages/resident/ResidentPages";
import {
  AdminApplyVoucherPage,
  AdminCreateResidentPage,
  AdminCreateStaffPage,
  AdminDashboardPage,
  AdminInvoiceDetailPage,
  AdminNotificationHistoryPage,
  AdminNotificationsPage,
  AdminPaymentsPage,
  AdminReviewsPage,
  AdminReportsOccupancyPage,
  AdminReportsRevenuePage,
  AdminReportsServiceUsagePage,
  AdminResidentDetailPage,
  AdminResidentsPage,
  AdminReviewServiceRequestPage,
  AdminRoomAvailabilityPage,
  AdminRoomsPage,
  AdminServiceRequestDetailPage,
  AdminServiceRequestsPage,
  AdminSettingsPage,
  AdminStaffDetailPage,
  AdminStaffPage,
  AdminVouchersPage
} from "../pages/admin/AdminPages";
import {
  StaffCheckInOutPage,
  StaffDashboardPage,
  StaffNotificationsPage,
  StaffReportsPage,
  StaffResidentsPage,
  StaffRoomsPage,
  StaffServiceRequestsPage
} from "../pages/staff/StaffPages";


interface RouteEntry {
  path: string;
  element: ReactElement;
}

interface RouteGroups {
  public: RouteEntry[];
  resident: RouteEntry[];
  staff: RouteEntry[];
  admin: RouteEntry[];
}

export const allRoutes: RouteGroups = {
  public: [
    { path: "/", element: <HomePage /> },
    { path: "/rooms", element: <RoomListPage /> },
    { path: "/rooms/:id", element: <RoomDetailPage /> },
    { path: "/rooms/:id/reviews", element: <RoomReviewsPage /> },
    { path: "/rooms/availability", element: <RoomAvailabilityPage /> },
    { path: "/search", element: <SearchResultsPage /> },
    { path: "/services", element: <ServicesPage /> },
    { path: "/about", element: <AboutPage /> },
    { path: "/contact", element: <ContactPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/verify-otp", element: <VerifyOtpPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> }
  ],
  resident: [
    { path: "/resident/dashboard", element: <ResidentDashboardPage /> },
    { path: "/resident/profile", element: <ResidentProfilePage /> },
    { path: "/resident/bookings", element: <ResidentBookingPage /> },
    { path: "/resident/checkin-status", element: <ResidentCheckinStatusPage /> },
    { path: "/resident/payments", element: <ResidentPaymentPage /> },
    { path: "/resident/reviews", element: <ResidentReviewsPage /> },
    { path: "/resident/notifications", element: <ResidentNotificationsPage /> },
    { path: "/resident/services", element: <ResidentServiceRequestsPage /> },
    { path: "/resident/services/create", element: <ResidentCreateServiceRequestPage /> },
    { path: "/resident/invoices", element: <ResidentInvoicesPage /> },
    { path: "/checkout", element: <CheckoutPage /> }
  ],
  staff: [
    { path: "/staff/dashboard", element: <StaffDashboardPage /> },
    { path: "/staff/checkin-checkout", element: <StaffCheckInOutPage /> },
    { path: "/staff/residents", element: <StaffResidentsPage /> },
    { path: "/staff/rooms", element: <StaffRoomsPage /> },
    { path: "/staff/service-requests", element: <StaffServiceRequestsPage /> },
    { path: "/staff/reports", element: <StaffReportsPage /> },
    { path: "/staff/notifications", element: <StaffNotificationsPage /> }
  ],
  admin: [
    { path: "/admin/dashboard", element: <AdminDashboardPage /> },
    { path: "/admin/checkin-checkout", element: <StaffCheckInOutPage /> },
    { path: "/admin/residents", element: <AdminResidentsPage /> },
    { path: "/admin/residents/:id", element: <AdminResidentDetailPage /> },
    { path: "/admin/residents/create", element: <AdminCreateResidentPage /> },
    { path: "/admin/staff", element: <AdminStaffPage /> },
    { path: "/admin/staff/:id", element: <AdminStaffDetailPage /> },
    { path: "/admin/staff/create", element: <AdminCreateStaffPage /> },
    { path: "/admin/rooms", element: <AdminRoomsPage /> },
    { path: "/admin/rooms/availability", element: <AdminRoomAvailabilityPage /> },
    { path: "/admin/reviews", element: <AdminReviewsPage /> },
    { path: "/admin/payments", element: <AdminPaymentsPage /> },
    { path: "/admin/payments/:id", element: <AdminInvoiceDetailPage /> },
    { path: "/admin/payments/apply-voucher", element: <AdminApplyVoucherPage /> },
    { path: "/admin/notifications", element: <AdminNotificationsPage /> },
    { path: "/admin/notifications/history", element: <AdminNotificationHistoryPage /> },
    { path: "/admin/service-requests", element: <AdminServiceRequestsPage /> },
    { path: "/admin/service-requests/:id", element: <AdminServiceRequestDetailPage /> },
    { path: "/admin/service-requests/:id/review", element: <AdminReviewServiceRequestPage /> },
    { path: "/admin/reports/revenue", element: <AdminReportsRevenuePage /> },
    { path: "/admin/reports/occupancy", element: <AdminReportsOccupancyPage /> },
    { path: "/admin/reports/service-usage", element: <AdminReportsServiceUsagePage /> },
    { path: "/admin/vouchers", element: <AdminVouchersPage /> },
    { path: "/admin/settings", element: <AdminSettingsPage /> }
  ]
};
