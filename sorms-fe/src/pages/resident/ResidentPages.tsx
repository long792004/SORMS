import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X, Info, Clock, BedDouble } from "lucide-react";
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
import { uploadApi } from "@/api/uploadApi";
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
  if (diff <= 0) return "Đã hết hạn chờ tính phí";
  const totalMinutes = Math.floor(diff / 60000);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diff % 60000) / 1000);
  return `Còn ${totalMinutes}m ${seconds}s`;
};

const useCountdown = (expiresAt?: string | null) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  return formatRemainingTime(expiresAt);
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
  const [identityDocumentUrl, setIdentityDocumentUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const profile = data ?? {};
    setEmail(profile.email ?? "");
    setPhoneNumber(profile.phoneNumber ?? profile.phone ?? "");
    setAddress(profile.address ?? "");
    setEmergencyContact(profile.emergencyContact ?? "");
    setNotes(profile.notes ?? "");
    setIdentityDocumentUrl(profile.identityDocumentUrl ?? "");
  }, [data]);

  const updateAccount = useMutation({
    mutationFn: () => residentApi.updateAccount({ email, phone: phoneNumber }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resident", "my-profile"] })
  });

  const updateProfile = useMutation({
    mutationFn: () => residentApi.updateProfile({ address, emergencyContact, notes, identityDocumentUrl }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resident", "my-profile"] })
  });

  const handleUploadCCCD = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setIsUploading(true);
      const res = await uploadApi.uploadImage(e.target.files[0]);
      setIdentityDocumentUrl(res.data?.imageUrl ?? res.data?.ImageUrl ?? "");
    } catch (err) {
      console.error(err);
      alert("Tải lên thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

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
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Ảnh CCCD / Passport (Bắt buộc để Check-in):</p>
          <div className="flex items-center gap-4">
            {identityDocumentUrl ? (
              <img src={identityDocumentUrl} alt="CCCD" className="h-32 w-48 rounded-lg object-cover border border-slate-200 dark:border-white/10" />
            ) : (
              <div className="flex h-32 w-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400 dark:border-slate-700 dark:bg-white/5">
                Chưa có ảnh
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                {isUploading ? "Đang tải lên..." : "Chọn ảnh tải lên"}
                <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={handleUploadCCCD} />
              </label>
              <p className="text-xs text-slate-500">Giới hạn 5MB. (.jpg, .png)</p>
            </div>
          </div>
          {profile.identityVerified ? (
             <p className="text-sm font-medium text-emerald-500">✔️ Giấy tờ đã được nhân viên xác minh.</p>
          ) : identityDocumentUrl ? (
             <p className="text-sm font-medium text-amber-500">⏳ Giấy tờ đang chờ nhân viên xác minh.</p>
          ) : null}
        </div>

        <div className="mt-6 flex gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
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
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data } = useQuery({
    queryKey: ["resident", "checkin", "history"],
    queryFn: async () => {
      const response = await checkInApi.myHistory();
      return response.data?.data ?? response.data;
    }
  });
  const { data: invoiceData } = useMyInvoices();

  const { data: profileResponse } = useQuery({
    queryKey: ["resident", "my-profile"],
    queryFn: async () => {
      const response = await residentApi.getMyProfile();
      return response.data?.data ?? response.data;
    }
  });
  const profileData = profileResponse ?? null;

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

  const upcomingCheckIns = bookings.filter((b: any) => {
    const s = String(b.status ?? b.bookingStatus).toLowerCase();
    const isConfirmedOrPending = s === "confirmed" || s === "pending"; 
    const inDate = new Date(b.expectedCheckInDate ?? b.checkInDate).getTime();
    const diff = inDate - nowTime;
    // Tìm các phòng chưa check-in và giờ check-in diễn ra trong vòng 24h tới
    return isConfirmedOrPending && diff > 0 && diff <= 86400000;
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">My Booking History</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => navigate("/resident/invoices")}>View payment history</Button>
        <Button variant="ghost" onClick={() => navigate("/contact")}>Contact support</Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        {/* Profile Verification Banner */}
        {profileData && !profileData.identityDocumentUrl && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-200">
             <p className="font-semibold text-base mb-1">⚠️ Yêu cầu bổ sung hình ảnh CCCD</p>
             <p className="text-sm">Vui lòng cập nhật hình ảnh Giấy tờ tuỳ thân của bạn trong trang TÀI KHOẢN để nhân viên đối chiếu Check-in.</p>
             <Button variant="ghost" className="mt-3 bg-white border-amber-400 dark:bg-black/50" onClick={() => navigate("/resident/profile")}>Đến trang Tài Khoản</Button>
          </div>
        )}

        {/* Existing booking count / reminder */}
        {upcomingCheckIns.length > 0 && (
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 text-blue-200">
           <p className="font-semibold text-base mb-2">⏰ Sắp đến giờ nhận phòng</p>
           {upcomingCheckIns.map((b: any, index: number) => {
              const inDate = new Date(b.expectedCheckInDate ?? b.checkInDate).getTime();
              const diff = inDate - nowTime;
              const hours = Math.floor(diff / 3600000);
              const mins = Math.floor((diff % 3600000) / 60000);
              const secs = Math.floor((diff % 60000) / 1000);
              const checkInTimeText = new Date(inDate).toLocaleString("vi-VN");
              return (
                 <p key={index} className="text-sm border-t border-blue-400/20 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
                    Bạn có lịch nhận phòng <strong>{b.roomNumber ?? b.roomId}</strong> vào lúc {checkInTimeText}. <br/>
                    Thời gian còn lại: <strong>{hours}h {mins}m {secs}s</strong>.
                 </p>
              );
           })}
         </div>
      )}
      </div>

      {bookings.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No booking records found.</p> : null}
      <div className="space-y-2">
        {bookings.map((item: any, index) => (
          <article key={item.id ?? index} className="glass-card overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
            {(() => {
              const bookingId = item.id ?? index;
              const bookingRoomId = String(item.roomId ?? "");
              const bookingCheckIn = normalizeDateOnly(item.expectedCheckInDate ?? item.checkInDate);
              const bookingCheckOut = normalizeDateOnly(item.expectedCheckOutDate ?? item.checkOutDate);
              const status = formatBookingStatus(item.bookingStatus ?? item.status);
              const isConfirmed = status === "Confirmed" || status === "Checked In";
              
              const linkedInvoice = invoices.find((invoice: any) => {
                const sameRoom = String(invoice.roomId ?? "") === bookingRoomId;
                const sameCheckIn = normalizeDateOnly(invoice.bookingCheckInDate ?? invoice.checkInDate) === bookingCheckIn;
                const sameCheckOut = normalizeDateOnly(invoice.bookingCheckOutDate ?? invoice.checkOutDate) === bookingCheckOut;
                return sameRoom && sameCheckIn && sameCheckOut;
              });

              return (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-white/5 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BedDouble className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Room {item.roomNumber ?? item.roomId}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Booking ID: #{bookingId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        status === "Confirmed" ? "bg-emerald-500/10 text-emerald-500" : 
                        status === "Checked In" ? "bg-blue-500/10 text-blue-500" :
                        status === "Cancelled" ? "bg-slate-500/10 text-slate-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Thời gian lưu trú</p>
                        <p className="mt-1 text-sm font-medium">{bookingCheckIn} → {bookingCheckOut}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Người đặt & Liên hệ</p>
                        <p className="mt-1 text-sm font-medium">{item.bookerFullName || "Chưa cập nhật"}</p>
                        <p className="text-xs text-slate-500">{item.bookerPhone || "-"}</p>
                      </div>
                    </div>

                    {/* Guest Tags */}
                    {(() => {
                      try {
                        const guestsArr = JSON.parse(item.guestList);
                        if (Array.isArray(guestsArr) && guestsArr.length > 0) {
                          return (
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Khách lưu trú ({guestsArr.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {guestsArr.map((g: any, i: number) => (
                                  <span key={i} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                                    {g.fullName || "Khách " + (i+1)} {i === 0 ? "★" : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) { /* ignore */ }
                      return null;
                    })()}

                    {/* Check-in Instructions for Confirmed Bookings */}
                    {isConfirmed && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Hướng dẫn nhận phòng
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-600/80 dark:text-emerald-400/80 leading-relaxed">
                          Vui lòng mang theo CCCD bản gốc để lễ tân đối chiếu. <br/>
                          Thời gian mở cửa sân: 24/7. Hỗ trợ cư dân: 09xx.xxx.xxx
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                      <div className="text-xs text-slate-500">
                        {linkedInvoice ? (
                          <p>Hóa đơn: <span className="font-semibold text-slate-700 dark:text-slate-200">{(Number(linkedInvoice.totalAmount ?? linkedInvoice.amount ?? 0)).toLocaleString("vi-VN")} VND</span> ({linkedInvoice.status})</p>
                        ) : (
                          <p className="text-amber-500">Chưa có thông tin thanh toán</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {linkedInvoice?.id && (
                          <Button variant="ghost" className="h-8 px-3 text-[11px]" onClick={() => navigate(`/checkout?invoiceId=${linkedInvoice.id}`)}>Chi tiết</Button>
                        )}
                        {isCancellable(item.status ?? item.bookingStatus) && (
                          <Button variant="ghost" className="h-8 px-3 text-[11px] text-rose-400 hover:text-rose-300" onClick={() => cancelBooking.mutate(Number(item.id))} disabled={cancelBooking.isPending}>
                            Hủy đặt phòng
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
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
  const pendingInvoiceRemaining = useCountdown(pendingInvoiceExpiresAt);
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
            roomInfo={invoice.roomNumber ?? invoice.roomId}
            checkIn={normalizeDateOnly(invoice.bookingCheckInDate ?? invoice.checkInDate)}
            checkOut={normalizeDateOnly(invoice.bookingCheckOutDate ?? invoice.checkOutDate)}
            guestList={invoice.guestNames ?? invoice.guestList}
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
            roomInfo={invoice.roomNumber ?? invoice.roomId}
            checkIn={normalizeDateOnly(invoice.bookingCheckInDate ?? invoice.checkInDate)}
            checkOut={normalizeDateOnly(invoice.bookingCheckOutDate ?? invoice.checkOutDate)}
            guestList={invoice.guestNames ?? invoice.guestList}
            onPay={
              ["Created", "Pending"].includes(String(invoice.status ?? ""))
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
  const checkInTime = decodeURIComponent(searchParams.get("checkInTime") ?? "14:00");
  const checkOutTime = decodeURIComponent(searchParams.get("checkOutTime") ?? "12:00");
  const roomPriceFromQuery = Number(searchParams.get("roomPrice") ?? "0");
  const roomNumberFromQuery = searchParams.get("roomNumber") ?? "";
  const justBooked = searchParams.get("booked") === "true";
  const guestsCount = Number(searchParams.get("guests") ?? "1");

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
  const [guestsData, setGuestsData] = useState<Array<{ fullName: string; identityNumber: string; phone: string }>>(() => {
    return Array.from({ length: guestsCount }).map((_, i) => ({
      fullName: i === 0 ? "" : "",
      identityNumber: "",
      phone: i === 0 ? "" : ""
    }));
  });

  const { data: myProfile } = useQuery({
    queryKey: ["resident", "my-profile"],
    queryFn: async () => {
      const response = await residentApi.getMyProfile();
      return response.data?.data ?? response.data;
    }
  });

  // Tự động điền khách hàng số 1 bằng profile
  useEffect(() => {
    if (myProfile && !guestsData[0].fullName && !guestsData[0].phone) {
      setGuestsData((prev) => {
        const newData = [...prev];
        newData[0] = {
          fullName: myProfile.fullName ?? "",
          phone: myProfile.phoneNumber ?? myProfile.phone ?? "",
          identityNumber: myProfile.identityNumber ?? ""
        };
        return newData;
      });
    }
  }, [myProfile]);

  const updateGuest = (index: number, field: "fullName" | "identityNumber" | "phone", value: string) => {
    setGuestsData((prev) => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

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

      if (!guestsData[0].fullName || !guestsData[0].phone) {
        throw new Error("Vui lòng điền họ tên và số điện thoại của người đặt chính.");
      }

      return checkInApi.requestCheckIn({
        roomId: parsedRoomId,
        checkInDate: toApiDateTime(checkIn),
        checkOutDate: toApiDateTime(checkOut),
        numberOfResidents: Math.max(1, guestsCount || 1),
        bookerFullName: guestsData[0].fullName.trim() || undefined,
        bookerPhone: guestsData[0].phone.trim() || undefined,
        bookerIdentityNumber: guestsData[0].identityNumber.trim() || undefined,
        guestList: JSON.stringify(guestsData.filter(g => g.fullName.trim() !== "")),
        bedPreference,
        smokingPreference,
        earlyCheckInRequested: earlyCheckIn,
        checkInTime: checkInTime ? `${checkInTime}:00` : null,
        checkOutTime: checkOutTime ? `${checkOutTime}:00` : null
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
          `/checkout?invoiceId=${pendingInvoice.id}&roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsCount}&roomPrice=${roomPriceFromQuery}&roomNumber=${encodeURIComponent(roomNumberFromQuery)}&booked=true`,
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
  const holdRemaining = useCountdown(holdExpiresAt);
  const bookingCheckIn = String((invoice as any)?.bookingCheckInDate ?? (invoice as any)?.checkInDate ?? checkIn ?? "");
  const bookingCheckOut = String((invoice as any)?.bookingCheckOutDate ?? (invoice as any)?.checkOutDate ?? checkOut ?? "");
  const bookingRoomId = String((invoice as any)?.roomId ?? roomId ?? "");
  const bookingRoomNumber = String((invoice as any)?.roomNumber ?? decodeURIComponent(roomNumberFromQuery || "") ?? bookingRoomId);
  const bookingGuests = Number((invoice as any)?.bookingNumberOfResidents ?? guestsCount ?? 1);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title">Payment Checkout</h1>
        {holdRemaining ? (
          <div className="rounded border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-amber-600 dark:text-amber-400 animate-pulse font-medium text-sm">
            Hold expires in: {holdRemaining}
          </div>
        ) : null}
      </div>
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
          <p className="text-slate-600 dark:text-slate-300">Số người ở: {Math.max(1, guestsCount || 1)}</p>
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
        <div className="mt-3 space-y-4">
          {guestsData.map((guest, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">
                  Khách {index + 1} {index === 0 ? <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Người đặt chính</span> : ""}
                </p>
                {index === 0 && (
                  <p className="text-xs text-slate-500">Thông tin liên hệ bắt buộc</p>
                )}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input
                  value={guest.fullName}
                  onChange={(e) => updateGuest(index, "fullName", e.target.value)}
                  placeholder="Họ và tên"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5"
                />
                <input
                  value={guest.phone}
                  onChange={(e) => updateGuest(index, "phone", e.target.value)}
                  placeholder="Số điện thoại"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5"
                />
                {index === 0 && (
                  <input
                    value={guest.identityNumber}
                    onChange={(e) => updateGuest(index, "identityNumber", e.target.value)}
                    placeholder="CCCD / Passport"
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2"
                  />
                )}
              </div>
            </div>
          ))}
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
      <div className="glass-card overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
        <div className="bg-slate-50 p-4 dark:bg-white/5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Booking Receipt
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Invoice ID: {invoiceId || "Draft"}</p>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold">Room Information</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">Room {bookingRoomNumber || bookingRoomId || "-"}</p>
              <p className="text-slate-600 dark:text-slate-400">Standard Premium</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold">Stay Duration</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{bookingCheckIn.slice(0, 10)} → {bookingCheckOut.slice(0, 10)}</p>
              <p className="text-slate-600 dark:text-slate-400">{bookingNights || "-"} Nights • {bookingGuests} Guests</p>
            </div>
          </div>

          {guestsData.length > 0 && guestsData[0].fullName && (
            <div className="rounded-lg border border-dashed border-slate-200 p-3 dark:border-white/20">
              <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">Guest List</p>
              <div className="flex flex-wrap gap-2">
                {guestsData.filter(g => g.fullName).map((g, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {g.fullName} {i === 0 ? "★" : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 text-xs">Room cost ({bookingNights} nights)</span>
              <span className="font-medium">{originalAmount.toLocaleString("vi-VN")} VND</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 text-xs">Service Fee (5%)</span>
              <span className="font-medium">{estimatedServiceFee.toLocaleString("vi-VN")} VND</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 text-xs">Tax (10%)</span>
              <span className="font-medium">{estimatedTax.toLocaleString("vi-VN")} VND</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-500 font-medium">
                <span className="text-xs">Discount</span>
                <span>-{discountAmount.toLocaleString("vi-VN")} VND</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 dark:border-white/20">
              <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
              <span className="text-xl font-bold text-primary">{totalAmount.toLocaleString("vi-VN")} VND</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isPaid ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="font-semibold uppercase tracking-wider">{currentPaymentStatus}</span>
            </div>
            {!isPaid && holdExpiresAt && (
              <div className="text-amber-500 font-medium bg-amber-500/10 px-2 py-1 rounded">
                Hold expires in: {holdRemaining || "Expired"}
              </div>
            )}
          </div>
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
            { 
              invoiceId,
              returnUrl: `${window.location.origin}/booking-success?invoiceId=${invoiceId}`,
              cancelUrl: `${window.location.origin}/booking-success?invoiceId=${invoiceId}&cancel=true`
            },
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

export function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get("invoiceId");
  const orderCode = searchParams.get("orderCode");
  const cancel = searchParams.get("cancel") === "true";
  const status = searchParams.get("status");
  
  const isSuccess = status === "PAID" || (!cancel && orderCode);

  const { data: invoice } = useInvoiceDetail(invoiceId ?? "");
  const totalAmount = Number(invoice?.totalAmount ?? invoice?.amount ?? 0);

  return (
    <section className="page-shell flex flex-col items-center justify-center min-h-[80vh] py-12">
      <div className="w-full max-w-xl space-y-8 text-center">
        {/* Animated Icon */}
        <div className="relative mx-auto h-24 w-24">
          <div className={`absolute inset-0 animate-ping rounded-full opacity-20 ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`}></div>
          <div className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg ${isSuccess ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
            {isSuccess ? (
              <Check className="h-12 w-12" />
            ) : (
              <X className="h-12 w-12" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isSuccess ? "Đặt phòng thành công!" : "Thanh toán chưa hoàn tất"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isSuccess 
              ? "Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi. Thông tin đặt phòng của bạn đã được xác nhận."
              : "Giao dịch của bạn đã bị hủy hoặc gặp lỗi. Bạn có thể thử lại từ danh sách hóa đơn."}
          </p>
        </div>

        {isSuccess && (
          <div className="glass-card overflow-hidden rounded-2xl border border-slate-200 text-left shadow-xl dark:border-white/10">
            <div className="bg-slate-50 p-4 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Xác nhận đặt phòng</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">Mã đơn hàng</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">#{orderCode || invoiceId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Trạng thái</p>
                  <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">Đã thanh toán</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-y border-slate-100 py-6 dark:border-white/5">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Phòng</p>
                  <p className="mt-1 font-semibold">{invoice?.roomNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Tổng thanh toán</p>
                  <p className="mt-1 font-bold text-primary">{totalAmount.toLocaleString("vi-VN")} VND</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Nhận phòng</p>
                  <p className="mt-1 text-sm">{normalizeDateOnly(invoice?.checkInDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Trả phòng</p>
                  <p className="mt-1 text-sm">{normalizeDateOnly(invoice?.checkOutDate)}</p>
                </div>
              </div>

              <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                <p className="text-xs font-bold text-primary flex items-center gap-2 mb-2">
                  <Info className="h-3 w-3" /> Hướng dẫn tiếp theo
                </p>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex gap-2"><span>1.</span> <span>Mang theo CCCD bản gốc để nhận phòng.</span></li>
                  <li className="flex gap-2"><span>2.</span> <span>Bạn có thể xem mã QR nhận phòng trong ứng dụng.</span></li>
                  <li className="flex gap-2"><span>3.</span> <span>Mọi hỗ trợ vui lòng gọi hotline: 09xx-xxx-xxx.</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          {isSuccess ? (
            <Button className="px-8 shadow-lg shadow-primary/20" onClick={() => navigate("/resident/bookings")}>Xem đơn đặt phòng</Button>
          ) : (
            <Button className="px-8" onClick={() => navigate(`/checkout?invoiceId=${invoiceId ?? ""}`)}>Thử lại ngay</Button>
          )}
          <Button variant="ghost" className="px-8" onClick={() => navigate("/resident/dashboard")}>Về trang chủ</Button>
        </div>
      </div>
    </section>
  );
}
