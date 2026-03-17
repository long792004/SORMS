import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OccupancyChart } from "@/components/charts/OccupancyChart";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useBroadcastNotification, useIndividualNotification, useMyNotifications, useSentNotificationHistory } from "@/hooks/useNotifications";
import { checkInApi } from "@/api/checkInApi";
import { residentApi } from "@/api/residentApi";
import { reviewApi } from "@/api/reviewApi";
import { roomApi } from "@/api/roomApi";
import { serviceRequestApi } from "@/api/serviceRequestApi";
import { staffApi } from "@/api/staffApi";
import { paymentApi } from "@/api/paymentApi";
import { reportApi } from "@/api/reportApi";
import { notificationApi } from "@/api/notificationApi";
import { voucherApi } from "@/api/voucherApi";
import { getRoomImageUrls, resolveMediaUrl } from "@/utils/media";

const listOf = (value: unknown): any[] => (Array.isArray(value) ? value : []);
const unwrap = (response: any) => response.data?.data ?? response.data;
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
const genderOptions = ["Male", "Female", "Other"];
const roomTypeOptions = ["Single", "Double", "Triple", "Suite"];
const roomStatusOptions = ["Available", "Occupied", "Maintenance"];

export function AdminDashboardPage() {
  const { data: rooms } = useQuery({ queryKey: ["admin", "dashboard", "rooms"], queryFn: async () => unwrap(await roomApi.getRooms()) });
  const { data: residents } = useQuery({ queryKey: ["admin", "dashboard", "residents"], queryFn: async () => unwrap(await residentApi.getResidents()) });
  const { data: staffs } = useQuery({ queryKey: ["admin", "dashboard", "staffs"], queryFn: async () => unwrap(await staffApi.getStaffs()) });
  const { data: services } = useQuery({ queryKey: ["admin", "dashboard", "services"], queryFn: async () => unwrap(await serviceRequestApi.getAll()) });
  const { data: pendingCheckIns } = useQuery({ queryKey: ["admin", "dashboard", "checkin", "pending"], queryFn: async () => unwrap(await checkInApi.pendingCheckIn()) });
  const { data: invoices } = useQuery({ queryKey: ["admin", "dashboard", "invoices"], queryFn: async () => unwrap(await paymentApi.getAllInvoices()) });
  const { data: reports } = useQuery({ queryKey: ["admin", "dashboard", "reports"], queryFn: async () => unwrap(await reportApi.getReports()) });
  const { data: vouchers } = useQuery({ queryKey: ["admin", "dashboard", "vouchers"], queryFn: async () => unwrap(await voucherApi.getAll()) });
  const { data: reviews } = useQuery({ queryKey: ["admin", "dashboard", "reviews"], queryFn: async () => unwrap(await reviewApi.getAllForAdmin()) });

  const invoiceList = listOf(invoices);
  const roomList = listOf(rooms);
  const now = Date.now();
  const totalRevenue = invoiceList.filter((item: any) => String(item.status ?? "").toLowerCase() === "paid").reduce((sum, item: any) => sum + Number(item.totalAmount ?? item.amount ?? 0), 0);
  const activeHolds = roomList.filter((room: any) => {
    const status = String(room.status ?? "").toLowerCase();
    const holdExpiresAt = room.holdExpiresAt ? new Date(room.holdExpiresAt).getTime() : 0;
    return status === "onhold" && holdExpiresAt > now;
  }).length;
  const expiredHolds = roomList.filter((room: any) => {
    const status = String(room.status ?? "").toLowerCase();
    const holdExpiresAt = room.holdExpiresAt ? new Date(room.holdExpiresAt).getTime() : 0;
    return status === "onhold" && holdExpiresAt > 0 && holdExpiresAt <= now;
  }).length;

  return (
    <section className="page-shell space-y-6">
      <h1 className="section-title">System Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Rooms</p><p className="mt-2 text-2xl font-semibold">{roomList.length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Residents</p><p className="mt-2 text-2xl font-semibold">{listOf(residents).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Staff Accounts</p><p className="mt-2 text-2xl font-semibold">{listOf(staffs).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Service Requests</p><p className="mt-2 text-2xl font-semibold">{listOf(services).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Pending Check-ins</p><p className="mt-2 text-2xl font-semibold">{listOf(pendingCheckIns).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Active Room Holds</p><p className="mt-2 text-2xl font-semibold text-amber-400">{activeHolds}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Expired Holds</p><p className="mt-2 text-2xl font-semibold text-rose-300">{expiredHolds}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Invoices</p><p className="mt-2 text-2xl font-semibold">{invoiceList.length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Paid Revenue</p><p className="mt-2 text-2xl font-semibold text-emerald-400">{totalRevenue.toLocaleString("vi-VN")}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Reports</p><p className="mt-2 text-2xl font-semibold">{listOf(reports).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Vouchers</p><p className="mt-2 text-2xl font-semibold">{listOf(vouchers).length}</p></article>
        <article className="glass-card rounded-xl p-4"><p className="muted-text">Reviews</p><p className="mt-2 text-2xl font-semibold">{listOf(reviews).length}</p></article>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart />
        <OccupancyChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold">Recent Invoices</h3>
          <div className="mt-2 space-y-2 text-sm">
            {invoiceList.slice(0, 5).map((invoice: any, index) => (
              <p key={invoice.id ?? index}>#{invoice.id} • {Number(invoice.totalAmount ?? invoice.amount ?? 0).toLocaleString("vi-VN")} • {invoice.status ?? "Pending"}</p>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold">Pending Service Requests</h3>
          <div className="mt-2 space-y-2 text-sm">
            {listOf(services).filter((item: any) => `${item.status ?? ""}`.toLowerCase().includes("pending")).slice(0, 5).map((item: any, index) => (
              <p key={item.id ?? index}>{item.title ?? item.serviceType ?? "Request"}</p>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold">Latest Reviews</h3>
          <div className="mt-2 space-y-2 text-sm">
            {listOf(reviews).slice(0, 5).map((review: any, index) => (
              <p key={review.id ?? index}>{review.residentName ?? "Resident"} • {review.roomName ?? "Room"} • {review.rating}★</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminResidentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "residents"], queryFn: async () => unwrap(await residentApi.getResidents()) });
  const residents = listOf(data);

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
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
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

  const mapResidentPayload = (form: typeof createForm | typeof editForm) => ({
    fullName: form.fullName,
    email: form.email,
    userName: form.userName,
    password: form.password,
    phoneNumber: form.phoneNumber,
    phone: form.phoneNumber,
    identityNumber: form.identityNumber,
    roomId: form.roomId ? Number(form.roomId) : null,
    address: form.address,
    emergencyContact: form.emergencyContact,
    gender: form.gender,
    dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null
  });

  const create = useMutation({
    mutationFn: () => residentApi.createResident(mapResidentPayload(createForm)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "residents"] });
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
    }
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => residentApi.updateResidentById(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "residents"] });
      setEditId(null);
    }
  });

  const remove = useMutation({
    mutationFn: (id: number) => residentApi.deleteResidentById(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "residents"] })
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Resident Accounts</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Create Resident</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <input value={createForm.userName} onChange={(event) => setCreateForm((prev) => ({ ...prev, userName: event.target.value }))} placeholder="Username" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.password} onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Password" type="password" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.fullName} onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Full name" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.email} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.phoneNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} placeholder="Phone" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.identityNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, identityNumber: event.target.value }))} placeholder="CCCD" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.roomId} onChange={(event) => setCreateForm((prev) => ({ ...prev, roomId: event.target.value }))} placeholder="Room ID" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <select value={createForm.gender} onChange={(event) => setCreateForm((prev) => ({ ...prev, gender: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="">Gender</option>
            {genderOptions.map((gender) => (<option key={gender} value={gender}>{gender}</option>))}
          </select>
          <input type="date" value={createForm.dateOfBirth} onChange={(event) => setCreateForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.address} onChange={(event) => setCreateForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Address" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
          <input value={createForm.emergencyContact} onChange={(event) => setCreateForm((prev) => ({ ...prev, emergencyContact: event.target.value }))} placeholder="Emergency contact" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
          <Button onClick={() => create.mutate()}>Create</Button>
        </div>
      </div>

      {isLoading ? <LoadingSkeleton lines={6} /> : null}
      <div className="space-y-2">
        {residents.map((resident: any, index) => {
          const isEditing = editId === resident.id;
          return (
            <article key={resident.id ?? index} className="glass-card rounded-xl p-3 text-sm">
              {isEditing ? (
                <div className="grid gap-2 md:grid-cols-4">
                  <input value={editForm.userName} onChange={(event) => setEditForm((prev) => ({ ...prev, userName: event.target.value }))} placeholder="Username" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.password} onChange={(event) => setEditForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="New password (optional)" type="password" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.fullName} onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.email} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.phoneNumber} onChange={(event) => setEditForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.identityNumber} onChange={(event) => setEditForm((prev) => ({ ...prev, identityNumber: event.target.value }))} placeholder="CCCD" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.roomId} onChange={(event) => setEditForm((prev) => ({ ...prev, roomId: event.target.value }))} placeholder="Room ID" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <select value={editForm.gender} onChange={(event) => setEditForm((prev) => ({ ...prev, gender: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                    <option value="">Gender</option>
                    {genderOptions.map((gender) => (<option key={gender} value={gender}>{gender}</option>))}
                  </select>
                  <input type="date" value={editForm.dateOfBirth} onChange={(event) => setEditForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.address} onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Address" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
                  <input value={editForm.emergencyContact} onChange={(event) => setEditForm((prev) => ({ ...prev, emergencyContact: event.target.value }))} placeholder="Emergency contact" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => update.mutate({ id: resident.id, payload: mapResidentPayload(editForm) })}>Save</Button>
                    <Button variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{resident.fullName ?? resident.name}</p>
                    <p className="muted-text">#{resident.id} • {resident.email} • {resident.phoneNumber ?? resident.phone}</p>
                    <p className="muted-text">CCCD: {resident.identityNumber ?? "-"} • Room: {resident.roomNumber ?? resident.roomId ?? "-"} • Gender: {resident.gender ?? "-"}</p>
                    <p className="muted-text">Address: {resident.address ?? "-"} • Emergency: {resident.emergencyContact ?? "-"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => {
                      setEditId(resident.id);
                      setEditForm({
                        userName: resident.userName ?? "",
                        password: "",
                        fullName: resident.fullName ?? "",
                        email: resident.email ?? "",
                        phoneNumber: resident.phoneNumber ?? resident.phone ?? "",
                        identityNumber: resident.identityNumber ?? "",
                        roomId: resident.roomId ? String(resident.roomId) : "",
                        address: resident.address ?? "",
                        emergencyContact: resident.emergencyContact ?? "",
                        gender: resident.gender ?? "",
                        dateOfBirth: resident.dateOfBirth ? String(resident.dateOfBirth).slice(0, 10) : ""
                      });
                    }}>Edit</Button>
                    <Button variant="ghost" onClick={() => remove.mutate(Number(resident.id))}>Delete</Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export const AdminResidentDetailPage = () => <section className="page-shell"><h1 className="section-title">Resident Detail</h1></section>;
export const AdminCreateResidentPage = AdminResidentsPage;

export function AdminStaffPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "staff"], queryFn: async () => unwrap(await staffApi.getStaffs()) });
  const staffs = listOf(data);

  const [createForm, setCreateForm] = useState({ userName: "", email: "", password: "", fullName: "", phone: "", identityNumber: "", gender: "", dateOfBirth: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", identityNumber: "", gender: "", dateOfBirth: "" });

  const mapCreateStaffPayload = (form: typeof createForm) => ({
    roleId: 2,
    userName: form.userName.trim(),
    email: form.email.trim(),
    password: form.password,
    fullName: form.fullName.trim() || undefined,
    phone: form.phone.trim() || undefined,
    identityNumber: form.identityNumber.trim() || undefined,
    gender: form.gender.trim() || undefined,
    dateOfBirth: form.dateOfBirth ? new Date(`${form.dateOfBirth}T00:00:00Z`).toISOString() : undefined
  });

  const mapStaffPayload = (id: number, form: typeof editForm) => ({
    id,
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    identityNumber: form.identityNumber.trim() || null,
    gender: form.gender.trim() || null,
    dateOfBirth: form.dateOfBirth ? new Date(`${form.dateOfBirth}T00:00:00Z`).toISOString() : null
  });

  const create = useMutation({
    mutationFn: () => staffApi.createStaff(mapCreateStaffPayload(createForm)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setCreateError(null);
      setCreateForm({ userName: "", email: "", password: "", fullName: "", phone: "", identityNumber: "", gender: "", dateOfBirth: "" });
    },
    onError: (error: any) => {
      setCreateError(getApiErrorMessage(error, "Không thể tạo tài khoản Staff."));
    }
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => staffApi.updateStaff(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setEditId(null);
    }
  });

  const remove = useMutation({
    mutationFn: (id: number) => staffApi.deleteStaff(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] })
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Staff Accounts</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Create Staff Account</h3>
        {createError ? <p className="mt-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{createError}</p> : null}
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <input value={createForm.userName} onChange={(event) => setCreateForm((prev) => ({ ...prev, userName: event.target.value }))} placeholder="Username" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.email} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.password} onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Password" type="password" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.fullName} onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Full name" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.phone} onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.identityNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, identityNumber: event.target.value }))} placeholder="CCCD" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <select value={createForm.gender} onChange={(event) => setCreateForm((prev) => ({ ...prev, gender: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="">Gender</option>
            {genderOptions.map((gender) => (<option key={gender} value={gender}>{gender}</option>))}
          </select>
          <input type="date" value={createForm.dateOfBirth} onChange={(event) => setCreateForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <Button onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Creating..." : "Create"}</Button>
        </div>
      </div>

      <div className="space-y-2">
        {staffs.map((staff: any, index) => {
          const isEditing = editId === staff.id;
          return (
            <article key={staff.id ?? index} className="glass-card rounded-xl p-3 text-sm">
              {isEditing ? (
                <div className="grid gap-2 md:grid-cols-4">
                  <input value={editForm.fullName} onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.email} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.phone} onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.identityNumber} onChange={(event) => setEditForm((prev) => ({ ...prev, identityNumber: event.target.value }))} placeholder="CCCD" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <select value={editForm.gender} onChange={(event) => setEditForm((prev) => ({ ...prev, gender: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                    <option value="">Gender</option>
                    {genderOptions.map((gender) => (<option key={gender} value={gender}>{gender}</option>))}
                  </select>
                  <input type="date" value={editForm.dateOfBirth} onChange={(event) => setEditForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => update.mutate({ id: staff.id, payload: mapStaffPayload(Number(staff.id), editForm) })}
                    >
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{staff.fullName}</p>
                    <p className="muted-text">#{staff.id} • {staff.email} • {staff.phone}</p>
                    <p className="muted-text">CCCD: {staff.identityNumber ?? "-"} • Gender: {staff.gender ?? "-"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => {
                      setEditId(staff.id);
                      setEditForm({
                        fullName: staff.fullName ?? "",
                        email: staff.email ?? "",
                        phone: staff.phone ?? "",
                        identityNumber: staff.identityNumber ?? "",
                        gender: staff.gender ?? "",
                        dateOfBirth: staff.dateOfBirth ? String(staff.dateOfBirth).slice(0, 10) : ""
                      });
                    }}>Edit</Button>
                    <Button variant="ghost" onClick={() => remove.mutate(Number(staff.id))}>Delete</Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export const AdminStaffDetailPage = () => <section className="page-shell"><h1 className="section-title">Staff Detail</h1></section>;
export const AdminCreateStaffPage = AdminStaffPage;

export function AdminRoomsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "rooms"], queryFn: async () => unwrap(await roomApi.getRooms()) });
  const rooms = listOf(data);

  const [createForm, setCreateForm] = useState({
    roomNumber: "",
    roomType: "",
    floor: "",
    monthlyRent: "",
    area: "",
    maxCapacity: "",
    status: "",
    description: "",
    imageUrls: [] as string[],
    amenities: ""
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    roomNumber: "",
    roomType: "Single",
    floor: "1",
    monthlyRent: "3000000",
    area: "20",
    maxCapacity: "1",
    status: "Available",
    description: "",
    imageUrls: [] as string[],
    amenities: ""
  });
  const [createImageFiles, setCreateImageFiles] = useState<File[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const mapRoomPayload = (form: typeof createForm | typeof editForm) => ({
    roomNumber: form.roomNumber,
    roomType: form.roomType,
    type: form.roomType,
    floor: Number(form.floor),
    monthlyRent: Number(form.monthlyRent),
    area: Number(form.area),
    maxCapacity: Number(form.maxCapacity),
    status: form.status,
    description: form.description,
    imageUrl: form.imageUrls[0] ?? null,
    imageUrls: form.imageUrls,
    amenities: form.amenities
      .split(",")
      .map((item) => item.trim())
      .filter((item) => !!item)
  });

  const uploadRoomImages = async (files: File[]) => {
    if (files.length === 0) {
      return [] as string[];
    }

    const uploads = await Promise.all(files.map((file) => roomApi.uploadImage(file)));
    return uploads
      .map((response) => response.data?.imageUrl ?? response.data?.ImageUrl ?? "")
      .filter((value): value is string => typeof value === "string" && value.length > 0);
  };

  const create = useMutation({
    mutationFn: async () => {
      let imageUrls = [...createForm.imageUrls];

      if (createImageFiles.length > 0) {
        setIsUploadingImage(true);
        imageUrls = [...imageUrls, ...(await uploadRoomImages(createImageFiles))];
        setIsUploadingImage(false);
      }

      return roomApi.createRoom(mapRoomPayload({ ...createForm, imageUrls }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      setCreateForm({
        roomNumber: "",
        roomType: "",
        floor: "",
        monthlyRent: "",
        area: "",
        maxCapacity: "",
        status: "",
        description: "",
        imageUrls: [],
        amenities: ""
      });
      setCreateImageFiles([]);
    },
    onSettled: () => {
      setIsUploadingImage(false);
    }
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Record<string, unknown> }) => {
      let nextPayload = payload;

      if (editImageFiles.length > 0) {
        setIsUploadingImage(true);
        const uploadedImageUrls = await uploadRoomImages(editImageFiles);
        const existingImageUrls = Array.isArray((payload as any).imageUrls) ? (payload as any).imageUrls : [];
        nextPayload = {
          ...payload,
          imageUrls: [...existingImageUrls, ...uploadedImageUrls],
          imageUrl: [...existingImageUrls, ...uploadedImageUrls][0] ?? null
        };
        setIsUploadingImage(false);
      }

      return roomApi.updateRoom(id, nextPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      setEditId(null);
      setEditImageFiles([]);
    },
    onSettled: () => {
      setIsUploadingImage(false);
    }
  });

  const remove = useMutation({
    mutationFn: (id: number) => roomApi.deleteRoom(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] })
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Rooms Management</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Create Room</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <input value={createForm.roomNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, roomNumber: event.target.value }))} placeholder="Room number" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <select value={createForm.roomType} onChange={(event) => setCreateForm((prev) => ({ ...prev, roomType: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="">-- Room type --</option>
            {roomTypeOptions.map((roomType) => (<option key={roomType} value={roomType}>{roomType}</option>))}
          </select>
          <input value={createForm.floor} onChange={(event) => setCreateForm((prev) => ({ ...prev, floor: event.target.value }))} placeholder="Floor" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.monthlyRent} onChange={(event) => setCreateForm((prev) => ({ ...prev, monthlyRent: event.target.value }))} placeholder="Monthly rent" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.area} onChange={(event) => setCreateForm((prev) => ({ ...prev, area: event.target.value }))} placeholder="Area (m²)" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={createForm.maxCapacity} onChange={(event) => setCreateForm((prev) => ({ ...prev, maxCapacity: event.target.value }))} placeholder="Max capacity" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <select value={createForm.status} onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="">-- Status --</option>
            {roomStatusOptions.map((status) => (<option key={status} value={status}>{status}</option>))}
          </select>
          <input type="file" accept="image/*" multiple onChange={(event) => setCreateImageFiles(Array.from(event.target.files ?? []))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 md:col-span-2" />
          {createForm.imageUrls.length > 0 ? <div className="md:col-span-2 flex flex-wrap gap-2">{createForm.imageUrls.map((imageUrl, index) => <img key={`${imageUrl}-${index}`} src={resolveMediaUrl(imageUrl)} alt={`Room preview ${index + 1}`} className="h-14 w-20 rounded-lg object-cover" />)}</div> : null}
          {createImageFiles.length > 0 ? <p className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">Đã chọn {createImageFiles.length} ảnh để upload.</p> : null}
          <input value={createForm.amenities} onChange={(event) => setCreateForm((prev) => ({ ...prev, amenities: event.target.value }))} placeholder="Amenities (comma separated)" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
          <input value={createForm.description} onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Description" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-3" />
          <Button onClick={() => create.mutate()} disabled={isUploadingImage}>{isUploadingImage ? "Uploading..." : "Create"}</Button>
        </div>
      </div>

      <div className="space-y-2">
        {rooms.map((room: any, index) => {
          const isEditing = editId === room.id;
          return (
            <article key={room.id ?? index} className="glass-card rounded-xl p-3 text-sm">
              {isEditing ? (
                <div className="grid gap-2 md:grid-cols-4">
                  <input value={editForm.roomNumber} onChange={(event) => setEditForm((prev) => ({ ...prev, roomNumber: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <select value={editForm.roomType} onChange={(event) => setEditForm((prev) => ({ ...prev, roomType: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                    {roomTypeOptions.map((roomType) => (<option key={roomType} value={roomType}>{roomType}</option>))}
                  </select>
                  <input value={editForm.floor} onChange={(event) => setEditForm((prev) => ({ ...prev, floor: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.monthlyRent} onChange={(event) => setEditForm((prev) => ({ ...prev, monthlyRent: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.area} onChange={(event) => setEditForm((prev) => ({ ...prev, area: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.maxCapacity} onChange={(event) => setEditForm((prev) => ({ ...prev, maxCapacity: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <select value={editForm.status} onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                    {roomStatusOptions.map((status) => (<option key={status} value={status}>{status}</option>))}
                  </select>
                  <input type="file" accept="image/*" multiple onChange={(event) => setEditImageFiles(Array.from(event.target.files ?? []))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 md:col-span-2" />
                  {editForm.imageUrls.length > 0 ? <div className="md:col-span-2 flex flex-wrap gap-2">{editForm.imageUrls.map((imageUrl, index) => <div key={`${imageUrl}-${index}`} className="relative"><img src={resolveMediaUrl(imageUrl)} alt={`Room image ${index + 1}`} className="h-14 w-20 rounded-lg object-cover" /><button type="button" onClick={() => setEditForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, currentIndex) => currentIndex !== index) }))} className="absolute -right-1 -top-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">x</button></div>)}</div> : null}
                  {editImageFiles.length > 0 ? <p className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">Đã chọn {editImageFiles.length} ảnh mới để thêm.</p> : null}
                  <input value={editForm.amenities} onChange={(event) => setEditForm((prev) => ({ ...prev, amenities: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" placeholder="Amenities comma separated" />
                  <input value={editForm.description} onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-3" placeholder="Description" />
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => update.mutate({ id: room.id, payload: mapRoomPayload(editForm) })} disabled={isUploadingImage}>{isUploadingImage ? "Uploading..." : "Save"}</Button>
                    <Button variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Room {room.roomNumber}</p>
                    <p className="muted-text">#{room.id} • {room.roomType ?? room.type} • Floor {room.floor ?? "-"} • {Number(room.monthlyRent ?? room.price ?? 0).toLocaleString("vi-VN")} VND</p>
                    <p className="muted-text">Area: {room.area ?? "-"}m² • Capacity: {room.maxCapacity ?? "-"} • Status: {room.status ?? "-"}</p>
                    <p className="muted-text">Amenities: {Array.isArray(room.amenities) ? room.amenities.join(", ") : "-"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => {
                      setEditId(room.id);
                      const roomImageUrls = getRoomImageUrls(room);
                      setEditForm({
                        roomNumber: room.roomNumber ?? "",
                        roomType: room.roomType ?? room.type ?? "Single",
                        floor: String(room.floor ?? 1),
                        monthlyRent: String(room.monthlyRent ?? room.price ?? 0),
                        area: String(room.area ?? 20),
                        maxCapacity: String(room.maxCapacity ?? 1),
                        status: room.status ?? "Available",
                        description: room.description ?? "",
                        imageUrls: roomImageUrls,
                        amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : ""
                      });
                      setEditImageFiles([]);
                    }}>Edit</Button>
                    <Button variant="ghost" onClick={() => remove.mutate(Number(room.id))}>Delete</Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export const AdminRoomAvailabilityPage = () => <section className="page-shell"><h1 className="section-title">Room Availability</h1></section>;

export function AdminPaymentsPage() {
  const { data } = useQuery({ queryKey: ["admin", "payments"], queryFn: async () => unwrap(await paymentApi.getAllInvoices()) });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Payment Management</h1>
      <div className="space-y-2">
        {listOf(data).map((invoice: any, index) => (
          <article key={invoice.id ?? index} className="glass-card rounded-xl p-3 text-sm">
            <p className="font-semibold">Invoice #{invoice.id}</p>
            <p className="muted-text">Amount: {Number(invoice.totalAmount ?? invoice.amount ?? 0).toLocaleString("vi-VN")} VND</p>
            <p className="text-primary">Status: {invoice.status ?? "Pending"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export const AdminInvoiceDetailPage = () => <section className="page-shell"><h1 className="section-title">Invoice Detail</h1></section>;
export const AdminApplyVoucherPage = () => <section className="page-shell"><h1 className="section-title">Apply Voucher</h1></section>;

export function AdminNotificationsPage() {
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("SORM Notice");
  const [targetRole, setTargetRole] = useState<"All" | "Resident" | "Staff">("All");
  const [residentId, setResidentId] = useState("");
  const [individualMessage, setIndividualMessage] = useState("");
  const [individualError, setIndividualError] = useState<string | null>(null);
  const { data } = useMyNotifications();
  const broadcast = useBroadcastNotification();
  const individual = useIndividualNotification();
  const notifications = useMemo(() => listOf(data), [data]);
  const parsedResidentId = Number.parseInt(residentId.trim(), 10);

  const sendIndividualNotification = () => {
    if (!Number.isInteger(parsedResidentId) || parsedResidentId <= 0) {
      setIndividualError("Resident ID phải là số nguyên dương.");
      return;
    }

    if (!individualMessage.trim()) {
      setIndividualError("Vui lòng nhập nội dung thông báo.");
      return;
    }

    setIndividualError(null);
    individual.mutate(
      { residentId: parsedResidentId, title: "Individual Notice", message: individualMessage.trim() },
      {
        onSuccess: () => {
          setResidentId("");
          setIndividualMessage("");
          setIndividualError(null);
        },
        onError: (error: any) => {
          setIndividualError(getApiErrorMessage(error, "Không thể gửi thông báo cá nhân."));
        }
      }
    );
  };

  return (
    <section className="page-shell space-y-5">
      <h1 className="section-title">Notifications</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Broadcast Notification</h3>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <select value={targetRole} onChange={(event) => setTargetRole(event.target.value as "All" | "Resident" | "Staff")} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
          <option value="All">All</option><option value="Resident">Resident</option><option value="Staff">Staff</option>
        </select>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write broadcast message..." className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <Button className="mt-3" onClick={() => { if (!message.trim()) return; broadcast.mutate({ message: message.trim(), title: title.trim(), targetRole }, { onSuccess: () => setMessage("") }); }}>Send Broadcast</Button>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Individual Notification</h3>
        {individualError ? <p className="mt-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{individualError}</p> : null}
        <input value={residentId} onChange={(event) => setResidentId(event.target.value)} placeholder="Resident ID" className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <textarea value={individualMessage} onChange={(event) => setIndividualMessage(event.target.value)} placeholder="Write message for one resident..." className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <Button className="mt-3" onClick={sendIndividualNotification} disabled={individual.isPending}>{individual.isPending ? "Sending..." : "Send Individual"}</Button>
      </div>

      <div className="space-y-2">
        {notifications.slice(0, 8).map((item: any, index) => (
          <article key={item.id ?? index} className="glass-card rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200">{item.message ?? item.content ?? "Notification"}</article>
        ))}
      </div>
    </section>
  );
}

export function AdminNotificationHistoryPage() {
  const { data } = useSentNotificationHistory();
  const notifications = useMemo(() => listOf(data), [data]);

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Notification History</h1>
      {notifications.map((item: any, index) => (
        <article key={item.id ?? index} className="glass-card rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200">
          <p>{item.message ?? item.content ?? "Notification"}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.createdAt ?? item.time ?? ""}</p>
        </article>
      ))}
    </section>
  );
}

export function AdminServiceRequestsPage() {
  const { data } = useQuery({ queryKey: ["admin", "service", "all"], queryFn: async () => unwrap(await serviceRequestApi.getAll()) });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Service Requests</h1>
      {listOf(data).map((request: any, index) => (
        <article key={request.id ?? index} className="glass-card rounded-xl p-3 text-sm">
          <p className="font-semibold">{request.title ?? request.serviceType}</p>
          <p className="muted-text">{request.status}</p>
        </article>
      ))}
    </section>
  );
}

export const AdminServiceRequestDetailPage = () => <section className="page-shell"><h1 className="section-title">Service Request Detail</h1></section>;
export const AdminReviewServiceRequestPage = () => <section className="page-shell"><h1 className="section-title">Review Service Request</h1></section>;

export function AdminReportsRevenuePage() {
  const { data } = useQuery({ queryKey: ["admin", "reports", "revenue"], queryFn: async () => unwrap(await reportApi.getReports()) });
  return <section className="page-shell space-y-4"><h1 className="section-title">Revenue Report</h1>{listOf(data).map((report: any, index) => <article key={report.id ?? index} className="glass-card rounded-xl p-3 text-sm"><p className="font-semibold">{report.title}</p></article>)}</section>;
}

export function AdminReportsOccupancyPage() {
  return <section className="page-shell space-y-4"><h1 className="section-title">Occupancy Report</h1><OccupancyChart /></section>;
}

export function AdminReportsServiceUsagePage() {
  const { data } = useQuery({ queryKey: ["admin", "reports", "service"], queryFn: async () => unwrap(await reportApi.getReports()) });
  return <section className="page-shell space-y-4"><h1 className="section-title">Service Usage Report</h1>{listOf(data).map((report: any, index) => <article key={report.id ?? index} className="glass-card rounded-xl p-3 text-sm"><p className="font-semibold">{report.title}</p></article>)}</section>;
}

export function AdminVouchersPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "vouchers"], queryFn: async () => unwrap(await voucherApi.getAll()) });
  const vouchers = useMemo(() => listOf(data), [data]);

  const [createForm, setCreateForm] = useState({ code: "", description: "Campaign voucher", discountType: "Percentage", value: "10", minInvoiceAmount: "0", maxDiscountAmount: "100000", usageLimit: "500" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ code: "", description: "", discountType: "Percentage", value: "10", minInvoiceAmount: "0", maxDiscountAmount: "100000", usageLimit: "500", isActive: true });

  const toVoucherPayload = (form: typeof createForm | typeof editForm) => ({
    code: form.code.trim(),
    description: form.description,
    discountType: form.discountType,
    value: Number(form.value),
    minInvoiceAmount: Number(form.minInvoiceAmount),
    maxDiscountAmount: Number(form.maxDiscountAmount),
    usageLimit: Number(form.usageLimit),
    startDate: new Date(Date.now() - 3600_000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
    isActive: "isActive" in form ? form.isActive : true
  });

  const create = useMutation({
    mutationFn: () => voucherApi.create(toVoucherPayload(createForm)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      setCreateForm({ code: "", description: "Campaign voucher", discountType: "Percentage", value: "10", minInvoiceAmount: "0", maxDiscountAmount: "100000", usageLimit: "500" });
    }
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => voucherApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      setEditId(null);
    }
  });

  const remove = useMutation({
    mutationFn: (id: number) => voucherApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] })
  });

  const toggleActive = useMutation({
    mutationFn: (id: number) => voucherApi.toggleActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] })
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Voucher Codes</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Create Voucher</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input value={createForm.code} onChange={(event) => setCreateForm((prev) => ({ ...prev, code: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" placeholder="Code" />
          <input value={createForm.value} onChange={(event) => setCreateForm((prev) => ({ ...prev, value: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" placeholder="Value" />
          <select value={createForm.discountType} onChange={(event) => setCreateForm((prev) => ({ ...prev, discountType: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="Percentage">Percentage</option>
            <option value="FixedAmount">FixedAmount</option>
          </select>
          <Button onClick={() => create.mutate()}>Create</Button>
        </div>
      </div>

      <div className="space-y-2">
        {vouchers.map((voucher: any) => {
          const isEditing = editId === voucher.id;
          return (
            <article key={voucher.id} className="glass-card rounded-xl p-3 text-sm">
              {isEditing ? (
                <div className="grid gap-2 md:grid-cols-5">
                  <input value={editForm.code} onChange={(event) => setEditForm((prev) => ({ ...prev, code: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <input value={editForm.value} onChange={(event) => setEditForm((prev) => ({ ...prev, value: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <select value={editForm.discountType} onChange={(event) => setEditForm((prev) => ({ ...prev, discountType: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                    <option value="Percentage">Percentage</option>
                    <option value="FixedAmount">FixedAmount</option>
                  </select>
                  <input value={editForm.usageLimit} onChange={(event) => setEditForm((prev) => ({ ...prev, usageLimit: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => update.mutate({ id: voucher.id, payload: toVoucherPayload(editForm) })}>Save</Button>
                    <Button variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{voucher.code}</p>
                    <p className="text-slate-600 dark:text-slate-300">{voucher.discountType} • {voucher.value} • used {voucher.usedCount}/{voucher.usageLimit}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => {
                      setEditId(voucher.id);
                      setEditForm({
                        code: voucher.code ?? "",
                        description: voucher.description ?? "",
                        discountType: voucher.discountType ?? "Percentage",
                        value: String(voucher.value ?? 10),
                        minInvoiceAmount: String(voucher.minInvoiceAmount ?? 0),
                        maxDiscountAmount: String(voucher.maxDiscountAmount ?? 0),
                        usageLimit: String(voucher.usageLimit ?? 100),
                        isActive: !!voucher.isActive
                      });
                    }}>Edit</Button>
                    <Button variant="ghost" onClick={() => toggleActive.mutate(Number(voucher.id))}>{voucher.isActive ? "Deactivate" : "Activate"}</Button>
                    <Button variant="ghost" onClick={() => remove.mutate(Number(voucher.id))}>Delete</Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "reviews"], queryFn: async () => unwrap(await reviewApi.getAllForAdmin()) });
  const remove = useMutation({
    mutationFn: (id: number) => reviewApi.deleteReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] })
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Reviews Management</h1>
      {isLoading ? <LoadingSkeleton lines={6} /> : null}
      <div className="space-y-2">
        {listOf(data).map((review: any, index) => (
          <article key={review.id ?? index} className="glass-card flex items-center justify-between rounded-xl p-3 text-sm">
            <div>
              <p className="font-semibold">{review.residentName ?? "Resident"} • {review.roomName ?? "Room"}</p>
              <p className="muted-text">{review.rating}★ • {review.comment ?? "No comment"}</p>
            </div>
            <Button variant="ghost" onClick={() => remove.mutate(Number(review.id))}>Delete</Button>
          </article>
        ))}
      </div>
    </section>
  );
}

export const AdminSettingsPage = () => (
  <section className="page-shell space-y-4">
    <h1 className="section-title">System Settings</h1>
    <div className="glass-card rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300">Upload images, configure global settings, and maintain platform preferences.</div>
  </section>
);
