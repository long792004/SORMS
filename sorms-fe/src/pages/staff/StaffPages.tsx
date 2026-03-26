import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useMyNotifications } from "@/hooks/useNotifications";
import { residentApi } from "@/api/residentApi";
import { roomApi } from "@/api/roomApi";
import { checkInApi } from "@/api/checkInApi";
import { serviceRequestApi } from "@/api/serviceRequestApi";
import { paymentApi } from "@/api/paymentApi";
import { reportApi } from "@/api/reportApi";
import { notificationApi } from "@/api/notificationApi";
import { roomInspectionApi } from "@/api/roomInspectionApi";
import { getRoomImageUrls, resolveMediaUrl } from "@/utils/media";

const listOf = (value: unknown): any[] => (Array.isArray(value) ? value : []);
const genderOptions = ["Male", "Female", "Other"];
const roomTypeOptions = ["Single", "Double", "Triple", "Suite"];
const roomStatusOptions = ["Available", "Occupied", "Maintenance"];
const unwrap = (response: any) => response.data?.data ?? response.data;
const toDailyRate = (value: unknown) => {
  const monthly = Number(value ?? 0);
  if (!Number.isFinite(monthly) || monthly <= 0) return 0;
  return Math.round(monthly / 30);
};
const toMonthlyRate = (value: unknown) => {
  const daily = Number(value ?? 0);
  if (!Number.isFinite(daily) || daily <= 0) return 0;
  return Math.round(daily * 30);
};
const getApiErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;
  if (typeof data === "string") {
    return data;
  }
  if (typeof data?.message === "string") {
    return data.message;
  }
  if (typeof data?.Message === "string") {
    return data.Message;
  }
  return fallback;
};
const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};
const parseGuestNames = (guestList: unknown) => {
  if (!guestList) return [] as string[];
  if (Array.isArray(guestList)) {
    return guestList
      .map((guest: any) => String(guest?.fullName ?? guest?.name ?? "").trim())
      .filter(Boolean);
  }
  if (typeof guestList === "string") {
    try {
      const parsed = JSON.parse(guestList);
      if (Array.isArray(parsed)) {
        return parsed
          .map((guest: any) => String(guest?.fullName ?? guest?.name ?? "").trim())
          .filter(Boolean);
      }
    } catch {
      return guestList.split(",").map((name) => name.trim()).filter(Boolean);
    }
  }
  return [] as string[];
};

export function StaffDashboardPage() {
  const { data: residents } = useQuery({ queryKey: ["staff", "residents"], queryFn: async () => unwrap(await residentApi.getResidents()) });
  const { data: pendingCheckIn } = useQuery({ queryKey: ["staff", "checkin", "pending"], queryFn: async () => unwrap(await checkInApi.pendingCheckIn()) });
  const { data: pendingServices } = useQuery({ queryKey: ["staff", "service", "pending"], queryFn: async () => unwrap(await serviceRequestApi.getPending()) });
  const { data: invoices } = useQuery({ queryKey: ["staff", "invoices"], queryFn: async () => unwrap(await paymentApi.getAllInvoices()) });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Staff Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Residents</p><p className="mt-2 text-2xl font-semibold">{listOf(residents).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Pending Check-in</p><p className="mt-2 text-2xl font-semibold">{listOf(pendingCheckIn).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Pending Services</p><p className="mt-2 text-2xl font-semibold">{listOf(pendingServices).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Invoices</p><p className="mt-2 text-2xl font-semibold">{listOf(invoices).length}</p></article>
      </div>
    </section>
  );
}

export function StaffCheckInOutPage() {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("Không đủ điều kiện");
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: pendingCheckIn } = useQuery({
    queryKey: ["staff", "checkin", "pending-checkin"],
    queryFn: async () => unwrap(await checkInApi.pendingCheckIn())
  });

  const { data: pendingCheckOut } = useQuery({
    queryKey: ["staff", "checkin", "pending-checkout"],
    queryFn: async () => unwrap(await checkInApi.pendingCheckOut())
  });

  const pendingCheckOutList = listOf(pendingCheckOut);

  const { data: inspectedCheckInRecordIdsData } = useQuery({
    queryKey: ["staff", "checkin", "inspections", pendingCheckOutList.map((item: any) => item.id).join(",")],
    enabled: pendingCheckOutList.length > 0,
    queryFn: async () => {
      const checks = await Promise.all(
        pendingCheckOutList.map(async (item: any) => {
          try {
            await roomInspectionApi.getByCheckInRecordId(Number(item.id));
            return Number(item.id);
          } catch {
            return null;
          }
        })
      );

      return checks.filter((id): id is number => Number.isFinite(id));
    }
  });

  const { data: invoicesData } = useQuery({
    queryKey: ["staff", "checkin", "invoices"],
    queryFn: async () => unwrap(await paymentApi.getAllInvoices())
  });

  const { data: residentsData } = useQuery({
    queryKey: ["staff", "checkin", "residents"],
    queryFn: async () => unwrap(await residentApi.getResidents())
  });

  const invoiceMap = useMemo(() => {
    const map = new Map<string, any>();
    listOf(invoicesData).forEach((invoice: any) => {
      const key = `${invoice.residentId ?? ""}-${invoice.roomId ?? ""}`;
      const current = map.get(key);
      if (!current) {
        map.set(key, invoice);
        return;
      }

      const currentDate = new Date(current.createdAt ?? 0).getTime();
      const nextDate = new Date(invoice.createdAt ?? 0).getTime();
      if (nextDate >= currentDate) {
        map.set(key, invoice);
      }
    });
    return map;
  }, [invoicesData]);

  const approveCheckIn = useMutation({
    mutationFn: (requestId: number) => checkInApi.approveCheckIn({ requestId, isApproved: true, rejectReason: null }),
    onSuccess: (response: any) => {
      setActionNotice({
        type: "success",
        message: response?.data?.message ?? "Đã phê duyệt yêu cầu check-in thành công."
      });
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin"] });
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin", "invoices"] });
    },
    onError: (error: any) => {
      setActionNotice({
        type: "error",
        message: getApiErrorMessage(error, "Không thể phê duyệt check-in. Vui lòng kiểm tra điều kiện thời gian, CCCD và trạng thái thanh toán.")
      });
    }
  });

  const rejectCheckIn = useMutation({
    mutationFn: (requestId: number) => checkInApi.approveCheckIn({ requestId, isApproved: false, rejectReason }),
    onSuccess: (response: any) => {
      setActionNotice({
        type: "success",
        message: response?.data?.message ?? "Đã từ chối yêu cầu check-in."
      });
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin"] });
    },
    onError: (error: any) => {
      setActionNotice({
        type: "error",
        message: getApiErrorMessage(error, "Không thể từ chối yêu cầu check-in.")
      });
    }
  });

  const approveCheckOut = useMutation({
    mutationFn: (requestId: number) => checkInApi.approveCheckOut({ requestId, isApproved: true, rejectReason: null }),
    onSuccess: (response: any) => {
      setActionNotice({
        type: "success",
        message: response?.data?.message ?? "Đã phê duyệt yêu cầu check-out."
      });
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin"] });
    },
    onError: (error: any) => {
      setActionNotice({
        type: "error",
        message: getApiErrorMessage(error, "Không thể phê duyệt check-out.")
      });
    }
  });

  const rejectCheckOut = useMutation({
    mutationFn: (requestId: number) => checkInApi.approveCheckOut({ requestId, isApproved: false, rejectReason }),
    onSuccess: (response: any) => {
      setActionNotice({
        type: "success",
        message: response?.data?.message ?? "Đã từ chối yêu cầu check-out."
      });
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin"] });
    },
    onError: (error: any) => {
      setActionNotice({
        type: "error",
        message: getApiErrorMessage(error, "Không thể từ chối yêu cầu check-out.")
      });
    }
  });

  const createInspection = useMutation({
    mutationFn: (checkInRecordId: number) =>
      roomInspectionApi.createInspection({
        checkInRecordId,
        furnitureStatus: "OK",
        equipmentStatus: "OK",
        roomConditionStatus: "OK",
        result: "OK",
        additionalFee: 0,
        notes: "Quick inspection from check-out approval page"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin", "inspections"] });
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin", "pending-checkout"] });
    }
  });

  const verifyIdentity = useMutation({
    mutationFn: (residentId: number) => residentApi.verifyIdentity({ residentId, isVerified: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin", "residents"] });
      queryClient.invalidateQueries({ queryKey: ["staff", "residents"] });
    }
  });

  const residentMap = useMemo(() => {
    const map = new Map<number, any>();
    listOf(residentsData).forEach((resident: any) => {
      const id = Number(resident.id);
      if (Number.isFinite(id)) {
        map.set(id, resident);
      }
    });
    return map;
  }, [residentsData]);

  const inspectedCheckInRecordIds = useMemo(() => new Set<number>(listOf(inspectedCheckInRecordIdsData) as number[]), [inspectedCheckInRecordIdsData]);

  return (
    <section className="page-shell space-y-5">
      <h1 className="section-title">Check-in / Check-out Approval</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Chỉ phê duyệt check-in khi invoice đã được thanh toán (Paid).</p>
      {actionNotice ? (
        <div className={`rounded-xl border px-3 py-2 text-sm ${actionNotice.type === "success" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" : "border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
          {actionNotice.message}
        </div>
      ) : null}

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Pending Check-in Requests</h3>
        <div className="mt-3 space-y-3">
          {listOf(pendingCheckIn).length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Không có yêu cầu check-in chờ duyệt.</p> : null}
          {listOf(pendingCheckIn).map((item: any, index) => {
            const key = `${item.residentId ?? ""}-${item.roomId ?? ""}`;
            const invoice = invoiceMap.get(key);
            const paid = String(invoice?.status ?? "").toLowerCase() === "paid";
            const resident = residentMap.get(Number(item.residentId));
            const identityVerified = Boolean(resident?.identityVerified ?? resident?.IdentityVerified ?? false);
            const holdExpiresAt = item.holdExpiresAt ?? invoice?.expirationTime ?? null;
            const holdExpiresMs = holdExpiresAt ? new Date(holdExpiresAt).getTime() : 0;
            const holdState = holdExpiresMs > Date.now() ? "Active" : holdExpiresMs > 0 ? "Expired" : "Unknown";
            const guestNames = parseGuestNames(item.guestList);
            return (
              <article key={item.id ?? index} className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-soft dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Request #{item.id} • Room {item.roomNumber ?? item.roomId}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Resident: {item.residentName ?? item.residentId}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paid ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                    {invoice ? `Invoice #${invoice.id} • ${invoice.status}` : "No invoice"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <p className="muted-text">Check-in: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.expectedCheckInDate)}</span></p>
                  <p className="muted-text">Check-out: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.expectedCheckOutDate)}</span></p>
                  <p className="muted-text">Booker: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bookerFullName ?? "-"}</span></p>
                  <p className="muted-text">Phone: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bookerPhone ?? "-"}</span></p>
                  <p className="muted-text">CCCD: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bookerIdentityNumber ?? "-"}</span></p>
                  <p className="muted-text">Residents: <span className="font-medium text-slate-700 dark:text-slate-200">{item.numberOfResidents ?? "-"}</span></p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {guestNames.length > 0 ? guestNames.map((guestName, guestIndex) => (
                    <span key={`${item.id}-${guestIndex}-${guestName}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                      {guestName}
                    </span>
                  )) : <span className="text-xs text-slate-500 dark:text-slate-400">Guest list: -</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${identityVerified ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
                    CCCD: {identityVerified ? "Verified" : "Not verified"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 ${holdState === "Active" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : holdState === "Expired" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-slate-500/10 text-slate-600 dark:text-slate-300"}`}>
                    Hold: {holdState} • {formatDateTime(holdExpiresAt)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => approveCheckIn.mutate(item.id)}
                    disabled={!paid || !identityVerified || approveCheckIn.isPending}
                  >
                    Approve Check-in
                  </Button>
                  {!identityVerified ? (
                    <Button
                      variant="ghost"
                      onClick={() => verifyIdentity.mutate(Number(item.residentId))}
                      disabled={verifyIdentity.isPending}
                    >
                      {verifyIdentity.isPending ? "Verifying..." : "Verify CCCD"}
                    </Button>
                  ) : null}
                  <Button variant="ghost" onClick={() => rejectCheckIn.mutate(item.id)} disabled={rejectCheckIn.isPending}>Reject</Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Pending Check-out Requests</h3>
        <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Reject reason" className="mt-2 h-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
        <div className="mt-3 space-y-3">
          {pendingCheckOutList.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Không có yêu cầu check-out chờ duyệt.</p> : null}
          {pendingCheckOutList.map((item: any, index) => (
            <article key={item.id ?? index} className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Request #{item.id} • Room {item.roomNumber ?? item.roomId}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Resident: {item.residentName ?? item.residentId}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${inspectedCheckInRecordIds.has(Number(item.id)) ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                  Inspection: {inspectedCheckInRecordIds.has(Number(item.id)) ? "Completed" : "Missing"}
                </span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <p className="muted-text">Booked check-in: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.expectedCheckInDate)}</span></p>
                <p className="muted-text">Booked check-out: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.expectedCheckOutDate)}</span></p>
                <p className="muted-text">Booker: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bookerFullName ?? "-"}</span></p>
                <p className="muted-text">Phone: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bookerPhone ?? "-"}</span></p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => approveCheckOut.mutate(item.id)} disabled={approveCheckOut.isPending}>Approve Check-out</Button>
                {!inspectedCheckInRecordIds.has(Number(item.id)) ? (
                  <Button variant="ghost" onClick={() => createInspection.mutate(Number(item.id))} disabled={createInspection.isPending}>
                    {createInspection.isPending ? "Creating inspection..." : "Create Inspection"}
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={() => rejectCheckOut.mutate(item.id)} disabled={rejectCheckOut.isPending}>Reject</Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StaffBookingHistoryPage() {
  const { data: allBookingsData, isLoading } = useQuery({
    queryKey: ["staff", "checkin", "history-bookings"],
    queryFn: async () => unwrap(await checkInApi.all())
  });

  const bookings = useMemo(() => {
    return listOf(allBookingsData).sort((a: any, b: any) => {
      const aTime = new Date(a.requestTime ?? 0).getTime();
      const bTime = new Date(b.requestTime ?? 0).getTime();
      return bTime - aTime;
    });
  }, [allBookingsData]);

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">History Booking</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Lưu toàn bộ lịch sử đặt phòng của khách hàng (mọi trạng thái).</p>
      {isLoading ? <LoadingSkeleton lines={5} /> : null}
      {bookings.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có lịch sử booking.</p> : null}

      <div className="space-y-3">
        {bookings.map((item: any, index) => (
          <article key={item.id ?? index} className="glass-card rounded-2xl border border-slate-200 p-4 text-sm dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">Booking #{item.id} • Room {item.roomNumber ?? item.roomId}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Resident: {item.residentName ?? item.residentId}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.bookingStatus ?? item.status ?? "-"}</span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <p className="muted-text">Request time: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.requestTime)}</span></p>
              <p className="muted-text">Approved time: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.approvedTime)}</span></p>
              <p className="muted-text">Expected check-in: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.expectedCheckInDate)}</span></p>
              <p className="muted-text">Expected check-out: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.expectedCheckOutDate)}</span></p>
              <p className="muted-text">Actual check-in: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.checkInTime)}</span></p>
              <p className="muted-text">Actual check-out: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(item.checkOutTime)}</span></p>
              <p className="muted-text">Booker: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bookerFullName ?? "-"}</span></p>
              <p className="muted-text">Contact: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bookerEmail ?? "-"} • {item.bookerPhone ?? "-"}</span></p>
              <p className="muted-text">Booker CCCD: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bookerIdentityNumber ?? "-"}</span></p>
              <p className="muted-text">Residents: <span className="font-medium text-slate-700 dark:text-slate-200">{item.numberOfResidents ?? "-"}</span></p>
              <p className="muted-text">Bed: <span className="font-medium text-slate-700 dark:text-slate-200">{item.bedPreference ?? "-"}</span></p>
              <p className="muted-text">Smoking: <span className="font-medium text-slate-700 dark:text-slate-200">{item.smokingPreference ?? "-"}</span></p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parseGuestNames(item.guestList).length > 0 ? parseGuestNames(item.guestList).map((guestName, guestIndex) => (
                <span key={`${item.id}-history-${guestIndex}-${guestName}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                  {guestName}
                </span>
              )) : <span className="text-xs text-slate-500 dark:text-slate-400">Guest list: -</span>}
            </div>
            <p className="mt-2 muted-text">Approved by: <span className="font-medium text-slate-700 dark:text-slate-200">{item.approvedByName ?? item.approvedBy ?? "-"}</span></p>
            {item.rejectReason ? <p className="mt-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-700 dark:text-rose-300">Reject reason: {item.rejectReason}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function StaffResidentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["staff", "residents", "all"],
    queryFn: async () => {
      const response = await residentApi.getResidents();
      return response.data?.data ?? response.data;
    }
  });

  const [createForm, setCreateForm] = useState({
    userName: "",
    password: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    identityNumber: "",
    roomId: "",
    address: "",
    emergencyContact: "",
    gender: "",
    dateOfBirth: ""
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const trimmedCreateForm = {
    userName: createForm.userName.trim(),
    password: createForm.password.trim(),
    fullName: createForm.fullName.trim(),
    email: createForm.email.trim(),
    phoneNumber: createForm.phoneNumber.trim(),
    identityNumber: createForm.identityNumber.trim(),
    roomId: createForm.roomId.trim(),
    address: createForm.address.trim(),
    emergencyContact: createForm.emergencyContact.trim(),
    gender: createForm.gender.trim(),
    dateOfBirth: createForm.dateOfBirth.trim()
  };

  const missingRequiredFields: string[] = [];
  if (!trimmedCreateForm.userName) missingRequiredFields.push("Username");
  if (!trimmedCreateForm.password) missingRequiredFields.push("Password");
  if (!trimmedCreateForm.fullName) missingRequiredFields.push("Full name");
  if (!trimmedCreateForm.email) missingRequiredFields.push("Email");
  if (!trimmedCreateForm.phoneNumber) missingRequiredFields.push("Phone");
  if (!trimmedCreateForm.identityNumber) missingRequiredFields.push("CCCD");
  if (!trimmedCreateForm.gender) missingRequiredFields.push("Gender");
  if (!trimmedCreateForm.dateOfBirth) missingRequiredFields.push("Date of birth");

  const hasInvalidRoomId =
    Boolean(trimmedCreateForm.roomId) &&
    (!Number.isInteger(Number(trimmedCreateForm.roomId)) || Number(trimmedCreateForm.roomId) <= 0);

  const createResident = useMutation({
    mutationFn: () => residentApi.createResident({
      userName: trimmedCreateForm.userName,
      password: trimmedCreateForm.password,
      fullName: trimmedCreateForm.fullName,
      email: trimmedCreateForm.email,
      phoneNumber: trimmedCreateForm.phoneNumber,
      phone: trimmedCreateForm.phoneNumber,
      identityNumber: trimmedCreateForm.identityNumber,
      roomId: trimmedCreateForm.roomId ? Number(trimmedCreateForm.roomId) : null,
      address: trimmedCreateForm.address,
      emergencyContact: trimmedCreateForm.emergencyContact,
      gender: trimmedCreateForm.gender,
      dateOfBirth: trimmedCreateForm.dateOfBirth ? new Date(trimmedCreateForm.dateOfBirth).toISOString() : null
    }),
    onSuccess: () => {
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: ["staff", "residents", "all"] });
      setCreateForm({
        userName: "",
        password: "",
        fullName: "",
        email: "",
        phoneNumber: "",
        identityNumber: "",
        roomId: "",
        address: "",
        emergencyContact: "",
        gender: "",
        dateOfBirth: ""
      });
    },
    onError: (error: any) => {
      setCreateError(getApiErrorMessage(error, "Không thể tạo resident. Vui lòng kiểm tra lại dữ liệu."));
    }
  });

  const canCreateResident = missingRequiredFields.length === 0 && !hasInvalidRoomId && !createResident.isPending;

  const handleCreateResident = () => {
    if (missingRequiredFields.length > 0) {
      setCreateError(`Vui lòng nhập đầy đủ các trường bắt buộc: ${missingRequiredFields.join(", ")}.`);
      return;
    }

    if (hasInvalidRoomId) {
      setCreateError("Room ID phải là số nguyên dương.");
      return;
    }

    setCreateError(null);
    createResident.mutate();
  };

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Resident List</h1>
      {isLoading ? <LoadingSkeleton lines={5} /> : null}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Create Resident</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <input value={createForm.userName} onChange={(event) => setCreateForm((prev) => ({ ...prev, userName: event.target.value }))} placeholder="Username" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.password} onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Password" type="password" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.fullName} onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Full name" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.email} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" type="email" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.phoneNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} placeholder="Phone" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.identityNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, identityNumber: event.target.value }))} placeholder="CCCD" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <select value={createForm.gender} onChange={(event) => setCreateForm((prev) => ({ ...prev, gender: event.target.value }))} required className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="">Gender</option>
            {genderOptions.map((gender) => (<option key={gender} value={gender}>{gender}</option>))}
          </select>
          <input type="date" value={createForm.dateOfBirth} onChange={(event) => setCreateForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} required className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.roomId} onChange={(event) => setCreateForm((prev) => ({ ...prev, roomId: event.target.value }))} placeholder="Room ID" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.address} onChange={(event) => setCreateForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Address" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
          <input value={createForm.emergencyContact} onChange={(event) => setCreateForm((prev) => ({ ...prev, emergencyContact: event.target.value }))} placeholder="Emergency contact" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
          <Button onClick={handleCreateResident} disabled={!canCreateResident}>{createResident.isPending ? "Creating..." : "Create"}</Button>
        </div>
        {createError ? <p className="mt-2 text-sm text-red-500">{createError}</p> : null}
      </div>

      <div className="space-y-2">
        {listOf(data).map((resident: any, index) => (
          <article key={resident.id ?? index} className="glass-card rounded-xl p-3 text-sm">
            <p className="font-semibold">{resident.fullName ?? resident.name}</p>
            <p className="muted-text">{resident.email} • {resident.phoneNumber}</p>
            <p className="muted-text">CCCD: {resident.identityNumber ?? "-"} • Gender: {resident.gender ?? "-"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StaffRoomsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["staff", "rooms"],
    queryFn: async () => {
      const response = await roomApi.getRooms();
      return response.data?.data ?? response.data;
    }
  });

  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    roomType: "Single",
    floor: "1",
    monthlyRent: "100000",
    area: "20",
    maxCapacity: "1",
    status: "Available",
    description: "",
    imageUrls: [] as string[],
    maintenanceEndDate: ""
  });
  const [roomImageFiles, setRoomImageFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const uploadRoomImages = async (files: File[]) => {
    if (files.length === 0) {
      return [] as string[];
    }

    const uploads = await Promise.all(files.map((file) => roomApi.uploadImage(file)));
    return uploads
      .map((response) => response.data?.imageUrl ?? response.data?.ImageUrl ?? "")
      .filter((value): value is string => typeof value === "string" && value.length > 0);
  };

  const createRoom = useMutation({
    mutationFn: async () => {
      let imageUrls = [...roomForm.imageUrls];

      if (roomImageFiles.length > 0) {
        setIsUploadingImages(true);
        imageUrls = [...imageUrls, ...(await uploadRoomImages(roomImageFiles))];
        setIsUploadingImages(false);
      }

      return roomApi.createRoom({
        roomNumber: roomForm.roomNumber,
        roomType: roomForm.roomType,
        type: roomForm.roomType,
        floor: Number(roomForm.floor),
        monthlyRent: toMonthlyRate(roomForm.monthlyRent),
        area: Number(roomForm.area),
        maxCapacity: Number(roomForm.maxCapacity),
        status: roomForm.status,
        description: roomForm.description,
        maintenanceEndDate: roomForm.status === "Maintenance" && roomForm.maintenanceEndDate ? new Date(roomForm.maintenanceEndDate).toISOString() : null,
        imageUrl: imageUrls[0] ?? null,
        imageUrls,
        amenities: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "rooms"] });
      setRoomForm({
        roomNumber: "",
        roomType: "Single",
        floor: "1",
        monthlyRent: "100000",
        area: "20",
        maxCapacity: "1",
        status: "Available",
        description: "",
        imageUrls: [],
        maintenanceEndDate: ""
      });
      setRoomImageFiles([]);
    },
    onSettled: () => {
      setIsUploadingImages(false);
    }
  });

  const updateRoom = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => roomApi.updateRoom(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "rooms"] });
    }
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Rooms Management</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Create Room</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Số phòng (Room number)</label>
            <input value={roomForm.roomNumber} onChange={(event) => setRoomForm((prev) => ({ ...prev, roomNumber: event.target.value }))} placeholder="VD: 101" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Loại phòng (Room type)</label>
            <select value={roomForm.roomType} onChange={(event) => setRoomForm((prev) => ({ ...prev, roomType: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
              {roomTypeOptions.map((roomType) => (<option key={roomType} value={roomType}>{roomType}</option>))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Tầng (Floor)</label>
            <input value={roomForm.floor} onChange={(event) => setRoomForm((prev) => ({ ...prev, floor: event.target.value }))} placeholder="1" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Giá thuê/ngày (Daily rate)</label>
            <input value={roomForm.monthlyRent} onChange={(event) => setRoomForm((prev) => ({ ...prev, monthlyRent: event.target.value }))} placeholder="100,000" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Diện tích (Area m²)</label>
            <input value={roomForm.area} onChange={(event) => setRoomForm((prev) => ({ ...prev, area: event.target.value }))} placeholder="20" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Sức chứa (Capacity)</label>
            <input value={roomForm.maxCapacity} onChange={(event) => setRoomForm((prev) => ({ ...prev, maxCapacity: event.target.value }))} placeholder="1" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Trạng thái (Status)</label>
            <select value={roomForm.status} onChange={(event) => setRoomForm((prev) => ({ ...prev, status: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
              {roomStatusOptions.map((status) => (<option key={status} value={status}>{status}</option>))}
            </select>
          </div>
          {roomForm.status === "Maintenance" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 text-amber-500">Ngày xong (Expected End Date)</label>
              <input type="date" value={roomForm.maintenanceEndDate} onChange={(event) => setRoomForm((prev) => ({ ...prev, maintenanceEndDate: event.target.value }))} className="h-10 rounded-xl border border-amber-500/50 bg-white px-3 dark:bg-white/5" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Mô tả (Description)</label>
            <input value={roomForm.description} onChange={(event) => setRoomForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Mô tả về phòng" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-medium text-slate-500">Hình ảnh (Room Images)</label>
            <input type="file" accept="image/*" multiple onChange={(event) => setRoomImageFiles(Array.from(event.target.files ?? []))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
            {roomImageFiles.length > 0 ? <p className="text-[10px] text-slate-500 dark:text-slate-400">Đã chọn {roomImageFiles.length} ảnh để upload.</p> : null}
          </div>
          <div className="flex items-end md:col-span-2">
            <Button className="w-full h-10" onClick={() => createRoom.mutate()} disabled={isUploadingImages}>{isUploadingImages ? "Uploading..." : "Tạo phòng mới (Create Room)"}</Button>
          </div>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {listOf(data).map((room: any, index) => (
          <article key={room.id ?? index} className="glass-card rounded-xl p-3 text-sm">
            {getRoomImageUrls(room)[0] ? <img src={resolveMediaUrl(getRoomImageUrls(room)[0])} alt={`Room ${room.roomNumber}`} className="mb-3 h-32 w-full rounded-lg object-cover" /> : null}
            <p className="font-semibold">Room {room.roomNumber}</p>
            <p className="muted-text">{room.roomType ?? room.type} • Floor {room.floor ?? "-"} • {toDailyRate(room.monthlyRent ?? room.price ?? 0).toLocaleString("vi-VN")} VND/ngày</p>
            <p className="muted-text">
              Status: <span className={room.status === "Maintenance" ? "text-amber-500 font-medium" : ""}>{room.status ?? "-"}</span> 
              {room.status === "Maintenance" && room.maintenanceEndDate && ` • Dự kiến xong: ${formatDateTime(room.maintenanceEndDate)}`}
              {room.status !== "Maintenance" && ` • Capacity: ${room.maxCapacity ?? "-"}`}
            </p>
            {room.status === "Maintenance" && (
              <Button 
                variant="ghost" 
                className="mt-2 w-full text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                onClick={() => updateRoom.mutate({ id: room.id, payload: { ...room, status: "Available", maintenanceEndDate: null } })}
              >
                Hoàn thành bảo trì (Mark Completed)
              </Button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function StaffServiceRequestsPage() {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("Insufficient details");
  const [staffFeedback, setStaffFeedback] = useState("Reviewed by staff");
  const { data } = useQuery({
    queryKey: ["staff", "services"],
    queryFn: async () => {
      const response = await serviceRequestApi.getAll();
      return response.data?.data ?? response.data;
    }
  });

  const review = useMutation({
    mutationFn: ({ id, status, feedback }: { id: number; status: "Approved" | "InProgress" | "Completed" | "Rejected"; feedback: string }) =>
      serviceRequestApi.review(id, { status, staffFeedback: feedback }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff", "services"] })
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Service Requests</h1>
      <div className="flex flex-col gap-2 md:flex-row">
        <input value={staffFeedback} onChange={(event) => setStaffFeedback(event.target.value)} placeholder="Default staff feedback" className="h-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
        <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Default reject reason" className="h-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
      </div>
      <div className="space-y-2">
        {listOf(data).map((request: any, index) => (
          <article key={request.id ?? index} className="glass-card rounded-xl p-4 text-sm">
            <p className="font-semibold">{request.title ?? request.serviceType}</p>
            <p className="muted-text mt-1">{request.description}</p>
            <p className="mt-1 text-primary">Status: {request.status}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => review.mutate({ id: request.id, status: "Approved", feedback: staffFeedback })}>Approve</Button>
              <Button variant="ghost" onClick={() => review.mutate({ id: request.id, status: "InProgress", feedback: staffFeedback })}>In Progress</Button>
              <Button variant="ghost" onClick={() => review.mutate({ id: request.id, status: "Completed", feedback: staffFeedback })}>Complete</Button>
              <Button variant="ghost" onClick={() => review.mutate({ id: request.id, status: "Rejected", feedback: rejectReason })}>Reject</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StaffReportsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { data } = useQuery({
    queryKey: ["staff", "reports"],
    queryFn: async () => {
      const response = await reportApi.getReports();
      return response.data?.data ?? response.data;
    }
  });

  const create = useMutation({
    mutationFn: () => reportApi.createReport({ title, content, reportType: "Service" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff", "reports"] })
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Reports</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Create Report</h3>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Content" className="mt-2 h-24 w-full rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5" />
        <Button className="mt-2" onClick={() => create.mutate()}>Submit Report</Button>
      </div>

      <div className="space-y-2">
        {listOf(data).map((report: any, index) => (
          <article key={report.id ?? index} className="glass-card rounded-xl p-3 text-sm">
            <p className="font-semibold">{report.title}</p>
            <p className="muted-text">{report.status ?? "Pending"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StaffNotificationsPage() {
  const queryClient = useQueryClient();
  const { data } = useMyNotifications();
  const [residentId, setResidentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsedResidentId = Number.parseInt(residentId.trim(), 10);

  const sendNotification = useMutation({
    mutationFn: () => notificationApi.individual({ residentId: parsedResidentId, message: message.trim(), title: "Staff Notice" }),
    onSuccess: () => {
      setError(null);
      setMessage("");
      setResidentId("");
      queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
    },
    onError: (mutationError: any) => {
      setError(getApiErrorMessage(mutationError, "Không thể gửi thông báo."));
    }
  });

  const handleSend = () => {
    if (!Number.isInteger(parsedResidentId) || parsedResidentId <= 0) {
      setError("Resident ID phải là số nguyên dương.");
      return;
    }

    if (!message.trim()) {
      setError("Vui lòng nhập nội dung thông báo.");
      return;
    }

    setError(null);
    sendNotification.mutate();
  };

  const notifications = useMemo(() => listOf(data), [data]);

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">My Notifications</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Send Notification to Resident</h3>
        {error ? <p className="mt-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
        <div className="mt-2 grid gap-2 md:grid-cols-[140px_1fr_auto]">
          <input value={residentId} onChange={(event) => setResidentId(event.target.value)} placeholder="Resident ID" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <Button onClick={handleSend} disabled={sendNotification.isPending}>{sendNotification.isPending ? "Sending..." : "Send"}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {notifications.map((item: any, index) => (
          <article key={item.id ?? index} className="glass-card rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200">
            <p>{item.message ?? item.content ?? "Notification"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
