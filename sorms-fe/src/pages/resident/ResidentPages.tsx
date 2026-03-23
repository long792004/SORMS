import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { InvoiceCard } from "@/components/cards/InvoiceCard";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useMyInvoices, useApplyVoucher, useCreatePaymentLink, useInvoiceDetail } from "@/hooks/usePayments";
import { useMarkNotificationRead, useMyNotifications } from "@/hooks/useNotifications";
import { checkInApi } from "@/api/checkInApi";
import { paymentApi } from "@/api/paymentApi";
import { serviceRequestApi } from "@/api/serviceRequestApi";
import { residentApi } from "@/api/residentApi";
import { reviewApi } from "@/api/reviewApi";
import { roomApi } from "@/api/roomApi";
import { useAuthStore } from "@/store/authStore";

const listOf = (value: unknown): any[] => (Array.isArray(value) ? value : []);
const toApiDateTime = (dateText: string) => `${dateText}T00:00:00Z`;
const toApiErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as any)?.response?.data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
};

const extractCheckInIdFromNotification = (message: string) => {
  const match = message.match(/CHECKIN_ID:(\d+)/i);
  if (!match) return "";
  return match[1] ?? "";
};

const isCheckoutFeedbackNotification = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("checkout thành công") ||
    normalized.includes("review your room") ||
    normalized.includes("feedback trải nghiệm")
  );
};
const formatRemainingTime = (expiresAt?: string | null) => {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(diff)) return "";
  if (diff <= 0) return "Đã hết hạn giữ phòng";
  const totalMinutes = Math.floor(diff / 60000);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diff % 60000) / 1000);
  return `Còn ${minutes}m ${seconds}s`;
};

const countNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  if (Number.isNaN(inTime) || Number.isNaN(outTime) || outTime <= inTime) return 0;
  return Math.ceil((outTime - inTime) / (1000 * 60 * 60 * 24));
};

const normalizeDateOnly = (value: unknown) => String(value ?? "").slice(0, 10);

const formatBookingStatus = (status: string) => {
  const s = String(status ?? "").toLowerCase();
  if (!s) return "Pending";
  if (s.includes("checkedout")) return "Completed";
  if (s.includes("checkedin")) return "Checked In";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("pending")) return "Pending";
  if (s.includes("onhold")) return "On Hold";
  return status;
};

export function ResidentDashboardPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const { data: invoices } = useMyInvoices();
  const { data: notifications } = useMyNotifications();
  const { data: statusData } = useQuery({
    queryKey: ["resident", "checkin", "status"],
    enabled: isAuthenticated && role === "Resident",
    retry: false,
    queryFn: async () => {
      try {
        const response = await checkInApi.myStatus();
        return response.data?.data ?? response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 400 || status === 404) {
          return null;
        }
        throw error;
      }
    }
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Resident Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Pending Invoices</p><p className="mt-2 text-2xl font-semibold">{listOf(invoices).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Unread Notifications</p><p className="mt-2 text-2xl font-semibold">{listOf(notifications).filter((item: any) => !item.isRead).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Check-in Status</p><p className="mt-2 text-2xl font-semibold">{statusData?.status ?? "Pending"}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Membership</p><p className="mt-2 text-2xl font-semibold">Resident</p></article>
      </div>
    </section>
  );
}

export function ResidentProfilePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["resident", "my-profile"],
    queryFn: async () => {
      const response = await residentApi.getMyProfile();
      return response.data?.data ?? response.data;
    }
  });

  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const profile = data ?? {};
    setEmail(profile.email ?? "");
    setPhoneNumber(profile.phoneNumber ?? profile.phone ?? "");
    setAddress(profile.address ?? "");
    setEmergencyContact(profile.emergencyContact ?? "");
    setNotes(profile.notes ?? "");
  }, [data]);

  const updateAccount = useMutation({
    mutationFn: () => residentApi.updateAccount({ email, phone: phoneNumber }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resident", "my-profile"] })
  });

  const updateProfile = useMutation({
    mutationFn: () => residentApi.updateProfile({ address, emergencyContact, notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resident", "my-profile"] })
  });

  const profile = data ?? {};

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">My Profile</h1>
      {isLoading ? <LoadingSkeleton lines={5} /> : null}
      <div className="glass-card max-w-3xl rounded-xl p-5">
        <div className="mb-4 grid gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10">
          <p><span className="font-semibold">Full Name:</span> {profile.fullName ?? "-"}</p>
          <p><span className="font-semibold">CCCD:</span> {profile.identityNumber ?? "-"}</p>
          <p><span className="font-semibold">Gender:</span> {profile.gender ?? "-"}</p>
          <p><span className="font-semibold">Date of Birth:</span> {profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "-"}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Phone" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Address" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
          <input value={emergencyContact} onChange={(event) => setEmergencyContact(event.target.value)} placeholder="Emergency Contact" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" className="h-24 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => updateAccount.mutate()}>Update Account</Button>
          <Button variant="ghost" onClick={() => updateProfile.mutate()}>Update Profile</Button>
        </div>
      </div>
    </section>
  );
}

export function ResidentBookingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["resident", "checkin", "history"],
    queryFn: async () => {
      const response = await checkInApi.myHistory();
      return response.data?.data ?? response.data;
    }
  });
  const { data: invoiceData } = useMyInvoices();

  const bookings = listOf(data);
  const invoices = listOf(invoiceData);

  const cancelBooking = useMutation({
    mutationFn: (checkInRecordId: number) => checkInApi.cancelCheckIn({ checkInRecordId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "checkin"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "mine"] });
    }
  });

  const isCancellable = (status: string) => {
    const s = String(status ?? "").toLowerCase();
    return s === "pending" || s === "onhold";
  };

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">My Booking History</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => navigate("/resident/invoices")}>View payment history</Button>
        <Button variant="ghost" onClick={() => navigate("/contact")}>Contact support</Button>
      </div>
      {bookings.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No booking records found.</p> : null}
      <div className="space-y-2">
        {bookings.map((item: any, index) => (
          <article key={item.id ?? index} className="glass-card rounded-xl p-4 text-sm">
            {(() => {
              const bookingId = item.id ?? index;
              const bookingRoomId = String(item.roomId ?? "");
              const bookingCheckIn = normalizeDateOnly(item.expectedCheckInDate ?? item.checkInDate);
              const bookingCheckOut = normalizeDateOnly(item.expectedCheckOutDate ?? item.checkOutDate);
              const linkedInvoice = invoices.find((invoice: any) => {
                const sameRoom = String(invoice.roomId ?? "") === bookingRoomId;
                const sameCheckIn = normalizeDateOnly(invoice.bookingCheckInDate ?? invoice.checkInDate) === bookingCheckIn;
                const sameCheckOut = normalizeDateOnly(invoice.bookingCheckOutDate ?? invoice.checkOutDate) === bookingCheckOut;
                return sameRoom && sameCheckIn && sameCheckOut;
              });

              return (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Booking #{bookingId}</p>
                <p className="muted-text">Room {item.roomNumber ?? item.roomId} • {bookingCheckIn} → {bookingCheckOut}</p>
                <p className="mt-1 text-primary">Status: {formatBookingStatus(item.bookingStatus ?? item.status)}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Guests: {item.numberOfResidents ?? "-"}</p>
                {item.bookerFullName ? <p className="text-xs text-slate-500 dark:text-slate-400">Booker: {item.bookerFullName}</p> : null}
                {item.bookerPhone ? <p className="text-xs text-slate-500 dark:text-slate-400">Phone: {item.bookerPhone}</p> : null}
                {item.bedPreference || item.smokingPreference || item.earlyCheckInRequested ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Requests: {[item.bedPreference, item.smokingPreference, item.earlyCheckInRequested ? "Early check-in" : ""].filter(Boolean).join(" • ")}
                  </p>
                ) : null}
                <p className="text-xs text-slate-500 dark:text-slate-400">Payment: {linkedInvoice ? `${linkedInvoice.status ?? "Pending"} • ${(Number(linkedInvoice.totalAmount ?? linkedInvoice.amount ?? 0)).toLocaleString("vi-VN")} VND` : "No invoice linked"}</p>
                {linkedInvoice?.id ? <p className="text-xs text-slate-500 dark:text-slate-400">Invoice ID: {linkedInvoice.id}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {linkedInvoice?.id ? <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => navigate(`/checkout?invoiceId=${linkedInvoice.id}`)}>View booking details</Button> : null}
                  {linkedInvoice?.id ? <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => navigate("/resident/invoices")}>Open invoices</Button> : null}
                </div>
              </div>
              {isCancellable(item.status ?? item.bookingStatus) ? (
                <Button variant="ghost" className="shrink-0 text-rose-400 hover:text-rose-300" onClick={() => cancelBooking.mutate(Number(item.id))} disabled={cancelBooking.isPending}>
                  Cancel Booking
                </Button>
              ) : null}
            </div>
              );
            })()}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ResidentCheckinStatusPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const [searchParams] = useSearchParams();
  const prefillRoomId = searchParams.get("roomId") ?? "";
  const prefillCheckIn = searchParams.get("checkIn") ?? "";
  const prefillCheckOut = searchParams.get("checkOut") ?? "";
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [roomId, setRoomId] = useState("");
  const [numberOfResidents, setNumberOfResidents] = useState("1");

  useEffect(() => {
    if (prefillCheckIn && prefillCheckOut) {
      setCheckInDate(prefillCheckIn);
      setCheckOutDate(prefillCheckOut);
      if (prefillRoomId) setRoomId(prefillRoomId);
      return;
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date: Date) => date.toISOString().slice(0, 10);
    setCheckInDate(formatDate(today));
    setCheckOutDate(formatDate(tomorrow));
    if (prefillRoomId) setRoomId(prefillRoomId);
  }, [prefillCheckIn, prefillCheckOut, prefillRoomId]);

  const { data: statusData } = useQuery({
    queryKey: ["resident", "checkin", "status"],
    enabled: isAuthenticated && role === "Resident",
    retry: false,
    queryFn: async () => {
      try {
        const response = await checkInApi.myStatus();
        return response.data?.data ?? response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 400 || status === 404) {
          return null;
        }
        throw error;
      }
    }
  });

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["resident", "rooms", "available", checkInDate, checkOutDate],
    enabled: Boolean(checkInDate && checkOutDate),
    queryFn: async () => {
      const response = await roomApi.getAvailableRooms(checkInDate, checkOutDate);
      return response.data?.data ?? response.data;
    }
  });

  const { data: invoicesData } = useMyInvoices();
  const invoices = listOf(invoicesData);
  const pendingInvoice = invoices.find((invoice: any) => ["Pending", "Created"].includes(String(invoice.status ?? "")));
  const pendingInvoiceExpiresAt = pendingInvoice?.expirationTime ?? pendingInvoice?.expiredAt ?? pendingInvoice?.holdExpiresAt ?? null;
  const pendingInvoiceRemaining = formatRemainingTime(pendingInvoiceExpiresAt);
  const availableRooms = listOf(roomsData);
  const isCheckInDateValid = Boolean(checkInDate && checkOutDate && checkOutDate > checkInDate);

  const requestCheckIn = useMutation({
    mutationFn: () => checkInApi.requestCheckIn({
      roomId: Number(roomId),
      checkInDate: toApiDateTime(checkInDate),
      checkOutDate: toApiDateTime(checkOutDate),
      numberOfResidents: Math.max(1, Number(numberOfResidents) || 1)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "checkin"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "mine"] });
      navigate("/resident/invoices");
    }
  });

  const requestCheckOut = useMutation({
    mutationFn: () => checkInApi.requestCheckOut({ checkInRecordId: Number(statusData?.id) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resident", "checkin"] })
  });

  const canRequestCheckOut = statusData?.status === "CheckedIn" && statusData?.id;

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Check-in / Check-out</h1>
      <article className="glass-card rounded-xl p-4">
        <p className="muted-text">Current Status</p>
        <p className="mt-2 text-lg font-semibold text-primary">{statusData?.status ?? "No active record"}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Luồng chuẩn: gửi yêu cầu check-in → hệ thống giữ phòng 6 phút → thanh toán invoice → Staff/Admin phê duyệt thì check-in mới thành công.</p>
        {pendingInvoice ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            <span>
              Invoice #{pendingInvoice.id} đang chờ thanh toán.
              {pendingInvoiceExpiresAt ? ` Hết hạn: ${new Date(pendingInvoiceExpiresAt).toLocaleString("vi-VN")}.` : ""}
              {pendingInvoiceRemaining ? ` ${pendingInvoiceRemaining}.` : ""}
            </span>
            <Button variant="ghost" onClick={() => navigate(`/checkout?invoiceId=${pendingInvoice.id}`)}>Thanh toán ngay</Button>
          </div>
        ) : null}
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold">Request Check-in</h3>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Sau khi gửi yêu cầu, phòng sẽ ở trạng thái OnHold trong 6 phút để bạn hoàn tất thanh toán.</p>
            <input type="date" value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
            <input type="date" value={checkOutDate} onChange={(event) => setCheckOutDate(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
            <select value={roomId} onChange={(event) => setRoomId(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
              <option value="">Chọn phòng khả dụng</option>
              {availableRooms
                .filter((room: any) => room.status === "Available")
                .map((room: any) => (
                  <option key={room.id} value={room.id}>Room {room.roomNumber} - {room.type} - {Number(room.monthlyRent ?? 0).toLocaleString("vi-VN")} VND</option>
                ))}
            </select>
            <input
              value={numberOfResidents}
              onChange={(event) => setNumberOfResidents(event.target.value)}
              placeholder="Số người ở"
              type="number"
              min={1}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5"
            />
            {roomsLoading ? <p className="text-xs text-slate-500 dark:text-slate-400">Đang tải danh sách phòng khả dụng...</p> : null}
            {!isCheckInDateValid ? <p className="text-xs text-amber-300">Ngày check-out phải lớn hơn ngày check-in.</p> : null}
            <Button className="w-full" onClick={() => requestCheckIn.mutate()} disabled={!roomId || !isCheckInDateValid || requestCheckIn.isPending}>
              {requestCheckIn.isPending ? "Đang gửi yêu cầu..." : "Gửi yêu cầu check-in"}
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold">Request Check-out</h3>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">Check-in Record ID: {statusData?.id ?? "-"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bạn chỉ có thể gửi check-out khi trạng thái hiện tại là CheckedIn.</p>
            <Button className="w-full" onClick={() => requestCheckOut.mutate()} disabled={!canRequestCheckOut || requestCheckOut.isPending}>
              {requestCheckOut.isPending ? "Đang gửi..." : "Gửi yêu cầu check-out"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResidentPaymentPage() {
  const navigate = useNavigate();
  const { data } = useMyInvoices();
  const invoices = listOf(data);
  const pendingInvoices = invoices.filter((invoice: any) => ["Pending", "Created"].includes(String(invoice.status ?? "")));

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">My Payments</h1>
      <p className="muted-text">Invoices awaiting payment. See <a href="/resident/invoices" className="underline hover:text-white">Invoice History</a> for all records.</p>
      {pendingInvoices.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No pending payments.</p> : null}
      <div className="airbnb-grid">
        {pendingInvoices.map((invoice: any) => (
          <InvoiceCard
            key={invoice.id}
            id={String(invoice.id)}
            amount={`${Number(invoice.totalAmount ?? invoice.amount ?? 0).toLocaleString("vi-VN")} VND`}
            status={invoice.status ?? "Pending"}
            onPay={() => navigate(`/checkout?invoiceId=${invoice.id}`)}
          />
        ))}
      </div>
    </section>
  );
}

export function ResidentReviewsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const prefillCheckInId = searchParams.get("checkInId") ?? "";
  const [checkInId, setCheckInId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (prefillCheckInId) {
      setCheckInId(prefillCheckInId);
    }
  }, [prefillCheckInId]);

  const { data: historyData } = useQuery({
    queryKey: ["resident", "checkin", "history", "for-review"],
    queryFn: async () => {
      const response = await checkInApi.myHistory();
      return response.data?.data ?? response.data;
    }
  });

  const checkedOutStays = listOf(historyData).filter(
    (item: any) => String(item.status ?? "").toLowerCase() === "checkedout"
  );

  const { data } = useQuery({
    queryKey: ["resident", "reviews"],
    queryFn: async () => {
      const response = await reviewApi.getMyReviews();
      return response.data?.data ?? response.data;
    }
  });

  const createReview = useMutation({
    mutationFn: () => reviewApi.createReview({ checkInId: Number(checkInId), rating: Number(rating), comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "reviews"] });
      setComment("");
      setCheckInId("");
    }
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">My Reviews</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Create Review</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select
            value={checkInId}
            onChange={(event) => setCheckInId(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
          >
            <option value="">Chọn lượt ở đã check-out</option>
            {checkedOutStays.map((stay: any, index) => (
              <option key={stay.id ?? index} value={stay.id}>
                #{stay.id} • Room {stay.roomNumber ?? stay.roomId} • {String(stay.checkInDate ?? stay.expectedCheckInDate ?? "").slice(0, 10)} → {String(stay.checkOutDate ?? stay.expectedCheckOutDate ?? "").slice(0, 10)}
              </option>
            ))}
          </select>
          <input value={rating} onChange={(event) => setRating(event.target.value)} placeholder="Rating" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comment" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
        </div>
        {checkedOutStays.length === 0 ? <p className="mt-2 text-xs text-amber-300">Bạn chỉ có thể review sau khi checkout hoàn tất.</p> : null}
        <Button className="mt-3" onClick={() => createReview.mutate()} disabled={!checkInId || createReview.isPending}>Submit Review</Button>
      </div>

      <div className="space-y-2">
        {listOf(data).map((item: any, index) => (
          <article key={item.id ?? index} className="glass-card rounded-xl p-3 text-sm">
            <p className="font-semibold">Room {item.roomName ?? item.RoomName ?? "-"}</p>
            <p className="muted-text">{item.comment}</p>
            <p className="text-accent">{item.rating} ★</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ResidentNotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const notifications = useMemo(() => listOf(data), [data]);

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Notification Center</h1>
      {isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading notifications...</p> : null}
      <div className="space-y-3">
        {notifications.map((item: any, index) => (
          <div key={item.id ?? index} className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <Bell className="mt-0.5 h-4 w-4 text-secondary" />
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-100">{item.message ?? item.content ?? "Notification"}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.createdAt ?? item.time ?? "now"}</p>
                  {isCheckoutFeedbackNotification(String(item.message ?? item.content ?? "")) ? (
                    <Button
                      variant="ghost"
                      className="mt-2 px-2 py-1 text-xs"
                      onClick={() => {
                        const checkInId = extractCheckInIdFromNotification(String(item.message ?? item.content ?? ""));
                        if (item.id) {
                          markRead.mutate(item.id);
                        }
                        navigate(checkInId ? `/resident/reviews?checkInId=${checkInId}` : "/resident/reviews");
                      }}
                    >
                      Đánh giá ngay
                    </Button>
                  ) : null}
                </div>
              </div>
              <Button variant="ghost" onClick={() => markRead.mutate(item.id)}>
                Mark Read
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ResidentServiceRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["resident", "service-requests"],
    queryFn: async () => {
      const response = await serviceRequestApi.getMine();
      return response.data?.data ?? response.data;
    }
  });

  const requests = listOf(data);

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">My Service Requests</h1>
      {isLoading ? <LoadingSkeleton lines={4} /> : null}
      {requests.map((request: any, index) => (
        <article key={request.id ?? index} className="glass-card rounded-xl p-4 text-sm">
          <p className="font-semibold">{request.title ?? request.serviceType}</p>
          <p className="muted-text mt-1">{request.description}</p>
          <p className="mt-1 text-primary">Status: {request.status ?? "Pending"}</p>
        </article>
      ))}
    </section>
  );
}

export function ResidentCreateServiceRequestPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("Maintenance");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const createRequest = useMutation({
    mutationFn: () => serviceRequestApi.create({ title, serviceType, description, priority }),
    onMutate: () => {
      setSubmitError("");
      setSubmitSuccess("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident", "service-requests"] });
      setTitle("");
      setDescription("");
      setSubmitSuccess("Yêu cầu dịch vụ đã được gửi thành công.");
    },
    onError: (error) => {
      setSubmitError(toApiErrorMessage(error, "Không thể gửi yêu cầu dịch vụ. Vui lòng thử lại."));
    }
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Create Service Request</h1>
      <div className="glass-card max-w-2xl rounded-xl p-4">
        <div className="space-y-2">
          {submitError ? <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{submitError}</p> : null}
          {submitSuccess ? <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{submitSuccess}</p> : null}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={serviceType} onChange={(event) => setServiceType(event.target.value)} placeholder="Service type" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="h-28 w-full rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5" />
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>
          <Button className="w-full" onClick={() => createRequest.mutate()} disabled={createRequest.isPending}>
            {createRequest.isPending ? "Đang gửi yêu cầu..." : "Submit Request"}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ResidentInvoicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading } = useMyInvoices();
  const invoices = useMemo(() => listOf(data), [data]);
  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancel") === "true";

  return (
    <section className="page-shell">
      <h1 className="section-title">Invoice History</h1>
      <p className="muted-text mt-1">Full record of all invoices for your bookings.</p>
      {success ? <p className="mt-2 text-sm text-success">Payment success. Thank you!</p> : null}
      {cancelled ? <p className="mt-2 text-sm text-error">Payment cancelled.</p> : null}
      {isLoading ? <LoadingSkeleton lines={4} /> : null}
      <div className="airbnb-grid mt-4">
        {invoices.map((invoice: any) => (
          <InvoiceCard
            key={invoice.id}
            id={String(invoice.id)}
            amount={`${Number(invoice.totalAmount ?? invoice.amount ?? 0).toLocaleString("vi-VN")} VND`}
            status={invoice.status ?? "Pending"}
            onPay={
              ["Pending", "Created"].includes(String(invoice.status ?? ""))
                ? () => navigate(`/checkout?invoiceId=${invoice.id}`)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoiceId") ?? "";
  const roomId = searchParams.get("roomId") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const roomPriceFromQuery = Number(searchParams.get("roomPrice") ?? "0");
  const roomNumberFromQuery = searchParams.get("roomNumber") ?? "";
  const justBooked = searchParams.get("booked") === "true";
  const guests = Number(searchParams.get("guests") ?? "1");
  const parsedRoomId = Number(roomId);
  const hasValidRoomId = Number.isFinite(parsedRoomId) && parsedRoomId > 0;
  const hasValidDateRange = Boolean(checkIn && checkOut && checkOut > checkIn);
  const [voucherCode, setVoucherCode] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentLinkData, setPaymentLinkData] = useState<{ checkoutUrl?: string; qrCodeDataUrl?: string; orderCode?: string | number } | null>(null);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [guestList, setGuestList] = useState("");
  const [bedPreference, setBedPreference] = useState("Double Bed");
  const [smokingPreference, setSmokingPreference] = useState("Non-smoking");
  const [earlyCheckIn, setEarlyCheckIn] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("payos");
  const applyVoucher = useApplyVoucher();
  const createLink = useCreatePaymentLink();
  const { data } = useInvoiceDetail(invoiceId || undefined);
  const canCreateBookingAndInvoice = !invoiceId && !!roomId && !!checkIn && !!checkOut;
  const { data: paymentStatusData } = useQuery({
    queryKey: ["invoice", "payment-status", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const response = await paymentApi.getPaymentStatus(invoiceId);
      return response.data?.data ?? response.data;
    },
    refetchInterval: (query) => {
      const status = String((query.state.data as any)?.status ?? "");
      if (!status) return 5000;
      return status === "Paid" || status === "Cancelled" ? false : 5000;
    }
  });

  const createBookingAndInvoice = useMutation({
    mutationFn: () => {
      if (!hasValidRoomId) {
        throw new Error("Room ID không hợp lệ.");
      }

      if (!hasValidDateRange) {
        throw new Error("Ngày check-out phải lớn hơn ngày check-in.");
      }

      return checkInApi.requestCheckIn({
        roomId: parsedRoomId,
        checkInDate: toApiDateTime(checkIn),
        checkOutDate: toApiDateTime(checkOut),
        numberOfResidents: Math.max(1, guests || 1),
        bookerFullName: fullName.trim() || undefined,
        bookerEmail: email.trim() || undefined,
        bookerPhone: phone.trim() || undefined,
        bookerIdentityNumber: identityNumber.trim() || undefined,
        guestList: guestList.trim() || undefined,
        bedPreference,
        smokingPreference,
        earlyCheckInRequested: earlyCheckIn
      });
    },
    onSuccess: async () => {
      setBookingError("");
      queryClient.invalidateQueries({ queryKey: ["resident", "checkin"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "mine"] });

      const invoicesResponse = await paymentApi.getMyInvoices();
      const invoices = listOf(invoicesResponse.data?.data ?? invoicesResponse.data);
      const pendingInvoice = invoices.find((invoice: any) => ["Pending", "Created", "AwaitingHotelPayment"].includes(String(invoice.status ?? "")));

      if (pendingInvoice?.id) {
        navigate(
          `/checkout?invoiceId=${pendingInvoice.id}&roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&roomPrice=${roomPriceFromQuery}&roomNumber=${encodeURIComponent(roomNumberFromQuery)}&booked=true`,
          { replace: true }
        );
        return;
      }

      navigate("/resident/invoices", { replace: true });
    },
    onError: (error) => {
      setBookingError(toApiErrorMessage(error, "Không thể tạo yêu cầu check-in. Vui lòng kiểm tra dữ liệu rồi thử lại."));
    }
  });

  const invoice = data ?? {};
  const currentPaymentStatus = String(paymentStatusData?.status ?? invoice.status ?? "Pending");
  const currentPaymentMethod = String(paymentStatusData?.paymentMethod ?? (invoice as any).paymentMethod ?? "PayOS");
  const isPaid = currentPaymentStatus === "Paid";
  const isAwaitingHotelPayment = currentPaymentStatus === "AwaitingHotelPayment";
  const holdExpiresAt = (invoice as any)?.expirationTime ?? (invoice as any)?.expiredAt ?? (invoice as any)?.holdExpiresAt ?? null;
  const holdRemaining = formatRemainingTime(holdExpiresAt);
  const bookingCheckIn = String((invoice as any)?.bookingCheckInDate ?? (invoice as any)?.checkInDate ?? checkIn ?? "");
  const bookingCheckOut = String((invoice as any)?.bookingCheckOutDate ?? (invoice as any)?.checkOutDate ?? checkOut ?? "");
  const bookingRoomId = String((invoice as any)?.roomId ?? roomId ?? "");
  const bookingRoomNumber = String((invoice as any)?.roomNumber ?? decodeURIComponent(roomNumberFromQuery || "") ?? bookingRoomId);
  const bookingGuests = Number((invoice as any)?.bookingNumberOfResidents ?? guests ?? 1);
  const bookingNights = countNights(bookingCheckIn.slice(0, 10), bookingCheckOut.slice(0, 10));
  const originalAmount = Number((invoice as any)?.originalAmount ?? (invoice as any)?.amount ?? roomPriceFromQuery ?? 0);
  const discountAmount = Number((invoice as any)?.discountAmount ?? 0);
  const totalAmount = Number((invoice as any)?.totalAmount ?? (invoice as any)?.amount ?? roomPriceFromQuery ?? 0);
  const estimatedTax = Math.round(originalAmount * 0.1);
  const estimatedServiceFee = Math.round(originalAmount * 0.05);

  useEffect(() => {
    if (currentPaymentStatus === "Paid" && !paymentSuccess) {
      setPaymentSuccess(true);
    }
  }, [currentPaymentStatus, paymentSuccess]);

  const requestHotelPayment = useMutation({
    mutationFn: () => paymentApi.requestHotelPayment(invoiceId),
    onSuccess: () => {
      setPaymentError("");
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoice", "payment-status", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "mine"] });
    },
    onError: (error) => {
      setPaymentError(toApiErrorMessage(error, "Không thể đăng ký thanh toán tại khách sạn."));
    }
  });

  return (
    <section className="page-shell space-y-5">
      <h1 className="section-title">Payment Checkout</h1>
      {justBooked ? (
        <div className="glass-card rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Booking đã tạo thành công. Vui lòng hoàn tất thanh toán để giữ phòng và tiếp tục gửi/duyệt yêu cầu check-in.
              {paymentSuccess ? (
                <div className="glass-card rounded-xl border border-emerald-400/60 bg-emerald-500/15 p-5">
                  <p className="font-semibold text-emerald-300">🎉 Payment successful! Your booking is confirmed.</p>
                  <p className="mt-1 text-sm text-emerald-200">Proceed to the Check-in page to submit your check-in request.</p>
                  <Button className="mt-3" onClick={() => navigate(`/resident/checkin-status?roomId=${bookingRoomId}&checkIn=${bookingCheckIn.slice(0, 10)}&checkOut=${bookingCheckOut.slice(0, 10)}`)}>
                    Go to Check-in →
                  </Button>
                </div>
              ) : null}
        </div>
      ) : null}
      {canCreateBookingAndInvoice ? (
        <div className="glass-card rounded-xl p-4 text-sm">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Thông tin đặt phòng</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Phòng: {decodeURIComponent(roomNumberFromQuery || "") || roomId}</p>
          <p className="text-slate-600 dark:text-slate-300">Check-in: {checkIn} | Check-out: {checkOut}</p>
          <p className="text-slate-600 dark:text-slate-300">Số người ở: {Math.max(1, guests || 1)}</p>
          <p className="text-slate-600 dark:text-slate-300">Số tiền tạm tính: {roomPriceFromQuery.toLocaleString("vi-VN")} VND</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Hệ thống sẽ tạo yêu cầu check-in và invoice để bạn thanh toán.</p>
          {bookingError ? <p className="mt-2 text-xs text-rose-300">{bookingError}</p> : null}
          {!hasValidDateRange ? <p className="mt-2 text-xs text-amber-300">Ngày check-out phải lớn hơn ngày check-in.</p> : null}
          <Button className="mt-3" onClick={() => createBookingAndInvoice.mutate()} disabled={createBookingAndInvoice.isPending || !hasValidRoomId || !hasValidDateRange}>
            {createBookingAndInvoice.isPending ? "Đang tạo yêu cầu..." : "Tạo yêu cầu check-in & chuyển sang thanh toán"}
          </Button>
        </div>
      ) : null}

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold">Booking Form</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nhập thông tin người đặt, khách lưu trú và yêu cầu đặc biệt trước khi thanh toán.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={identityNumber} onChange={(event) => setIdentityNumber(event.target.value)} placeholder="CMND/CCCD (nếu yêu cầu)" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <textarea value={guestList} onChange={(event) => setGuestList(event.target.value)} placeholder="Danh sách khách lưu trú (nếu nhiều người)" className="h-20 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select value={bedPreference} onChange={(event) => setBedPreference(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
            <option value="Double Bed">Double bed</option>
            <option value="Twin Bed">Twin bed</option>
          </select>
          <select value={smokingPreference} onChange={(event) => setSmokingPreference(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
            <option value="Non-smoking">Non-smoking room</option>
            <option value="Smoking">Smoking room</option>
          </select>
          <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10">
            <input type="checkbox" checked={earlyCheckIn} onChange={(event) => setEarlyCheckIn(event.target.checked)} />
            Early check-in
          </label>
        </div>
      </div>

      {!invoiceId && !canCreateBookingAndInvoice ? (
        <div className="glass-card rounded-xl p-4 text-sm text-amber-200">
          Thiếu invoiceId. Vui lòng vào trang Invoice và chọn hóa đơn cần thanh toán.
        </div>
      ) : null}
      <div className="glass-card rounded-xl p-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">Invoice ID: {invoiceId || "(add ?invoiceId=...)"}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Phòng: {bookingRoomNumber || bookingRoomId || "-"}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">Ngày ở: {bookingCheckIn ? bookingCheckIn.slice(0, 10) : "-"} → {bookingCheckOut ? bookingCheckOut.slice(0, 10) : "-"}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">Số đêm: {bookingNights || "-"} • Số khách: {bookingGuests}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mã giảm giá được tạo bởi Admin và được áp dụng ở bước thanh toán này.</p>
        <div className="mt-3 space-y-1 text-sm">
          <p>Room cost: {originalAmount.toLocaleString("vi-VN")} VND</p>
          <p>Estimated tax (10%): {estimatedTax.toLocaleString("vi-VN")} VND</p>
          <p>Estimated service fee (5%): {estimatedServiceFee.toLocaleString("vi-VN")} VND</p>
          <p>Discount Amount: {discountAmount.toLocaleString("vi-VN")} VND</p>
          <p className="font-semibold text-secondary">Final total: {totalAmount.toLocaleString("vi-VN")} VND</p>
          <p className="font-semibold">Payment Status: <span className={isPaid ? "text-emerald-400" : "text-amber-300"}>{currentPaymentStatus}</span></p>
          {!isPaid && holdExpiresAt ? (
            <p className="text-amber-300">Hold expires at: {new Date(holdExpiresAt).toLocaleString("vi-VN")} {holdRemaining ? `• ${holdRemaining}` : ""}</p>
          ) : null}
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold">Payment Method</h2>
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10">
            <span>PayOS QR / E-wallet</span>
            <input type="radio" name="paymentMethod" checked={paymentMethod === "payos"} onChange={() => setPaymentMethod("payos")} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10">
            <span>Bank card</span>
            <input type="radio" name="paymentMethod" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10">
            <span>Pay at hotel</span>
            <input type="radio" name="paymentMethod" checked={paymentMethod === "hotel"} onChange={() => setPaymentMethod("hotel")} />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Bank card sử dụng cổng PayOS checkout. Pay at hotel sẽ tạo trạng thái chờ thanh toán tại quầy lễ tân.</p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold">Apply Voucher</h2>
        {voucherMessage ? (
          <p className={`mt-2 text-sm ${voucherMessage.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>{voucherMessage.text}</p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <input
            value={voucherCode}
            onChange={(event) => setVoucherCode(event.target.value)}
            placeholder="Enter voucher code"
            disabled={voucherApplied}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 disabled:opacity-50"
          />
          {voucherApplied ? (
            <Button variant="ghost" onClick={() => { setVoucherApplied(false); setVoucherCode(""); setVoucherMessage(null); }}>Remove</Button>
          ) : (
            <Button
              onClick={() => {
                if (!invoiceId || !voucherCode.trim()) return;
                applyVoucher.mutate(
                  { invoiceId, voucherCode: voucherCode.trim() },
                  {
                    onSuccess: () => {
                      setVoucherApplied(true);
                      setVoucherMessage({ type: "success", text: `Voucher "${voucherCode.trim()}" applied successfully!` });
                    },
                    onError: (error: any) => {
                      setVoucherMessage({ type: "error", text: toApiErrorMessage(error, "Failed to apply voucher. Check the code and try again.") });
                    }
                  }
                );
              }}
              disabled={!invoiceId || applyVoucher.isPending}
            >
              {applyVoucher.isPending ? "Applying..." : "Apply"}
            </Button>
          )}
        </div>
      </div>

      <Button
        className="w-full max-w-sm"
        disabled={!invoiceId || createLink.isPending || requestHotelPayment.isPending || isPaid}
        onClick={() => {
          if (!invoiceId) return;
          setPaymentError("");

          if (paymentMethod === "hotel") {
            requestHotelPayment.mutate();
            return;
          }

          createLink.mutate(
            { invoiceId },
            {
              onSuccess: (response) => {
                setPaymentLinkData({
                  checkoutUrl: response.data?.checkoutUrl,
                  qrCodeDataUrl: response.data?.qrCodeDataUrl,
                  orderCode: response.data?.orderCode
                });

                if (paymentMethod === "card" && response.data?.checkoutUrl) {
                  window.open(response.data.checkoutUrl, "_blank");
                }

                queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
                queryClient.invalidateQueries({ queryKey: ["invoice", "payment-status", invoiceId] });
              },
              onError: (error) => {
                setPaymentError(toApiErrorMessage(error, "Không thể tạo phiên thanh toán. Vui lòng thử lại."));
              }
            }
          );
        }}
      >
        {isPaid
          ? "Invoice đã thanh toán"
          : requestHotelPayment.isPending
            ? "Đang đăng ký thanh toán tại khách sạn..."
            : createLink.isPending
              ? "Đang tạo phiên thanh toán..."
              : paymentMethod === "hotel"
                ? "Xác nhận thanh toán tại khách sạn"
                : paymentMethod === "card"
                  ? "Thanh toán bằng thẻ"
                  : "Tạo QR thanh toán PayOS"}
      </Button>

      {paymentError ? <p className="text-sm text-rose-300">{paymentError}</p> : null}

      {paymentLinkData?.qrCodeDataUrl ? (
        <div className="glass-card max-w-sm rounded-xl p-4 text-center">
          <p className="text-sm font-semibold">QR Thanh Toán</p>
          <img src={paymentLinkData.qrCodeDataUrl} alt="PayOS QR" className="mx-auto mt-3 h-56 w-56 rounded-lg bg-white p-2" />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Order: {paymentLinkData.orderCode ?? "-"}</p>
          {paymentLinkData.checkoutUrl ? (
            <Button className="mt-3 w-full" variant="ghost" onClick={() => window.open(paymentLinkData.checkoutUrl, "_blank")}>Mở trang thanh toán PayOS</Button>
          ) : null}
        </div>
      ) : null}

      {isPaid || isAwaitingHotelPayment ? (
        <div className="glass-card rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-5 text-sm">
          <p className="font-semibold text-emerald-300">Booking confirmation</p>
          <p className="mt-1 text-emerald-200">Booking ID: {invoiceId || "-"}</p>
          <p className="text-emerald-200">Status: {isPaid ? "Confirmed" : "Pending"}</p>
          <p className="text-emerald-200">Room: {bookingRoomNumber || bookingRoomId || "-"}</p>
          <p className="text-emerald-200">Check-in / Check-out: {bookingCheckIn ? bookingCheckIn.slice(0, 10) : "-"} → {bookingCheckOut ? bookingCheckOut.slice(0, 10) : "-"}</p>
          <p className="text-emerald-200">Payment method: {currentPaymentMethod}</p>
          <p className="text-emerald-200">{isPaid ? "Total paid" : "Total due"}: {totalAmount.toLocaleString("vi-VN")} VND</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => navigate("/resident/bookings")}>View booking details</Button>
            <Button variant="ghost" onClick={() => navigate("/resident/bookings")}>Cancel booking</Button>
            <Button variant="ghost" onClick={() => navigate("/contact")}>Contact support</Button>
            <Button variant="ghost" onClick={() => navigate(`/resident/checkin-status?roomId=${bookingRoomId}&checkIn=${bookingCheckIn.slice(0, 10)}&checkOut=${bookingCheckOut.slice(0, 10)}`)}>
              Go to check-in flow
            </Button>
          </div>
        </div>
      ) : null}

      <Button variant="ghost" className="w-full max-w-sm" onClick={() => navigate("/resident/invoices")}>Quay lại danh sách invoice</Button>
    </section>
  );
}
