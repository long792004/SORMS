import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
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
    amenities: "",
    maintenanceEndDate: ""
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
    amenities: "",
    maintenanceEndDate: ""
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
    maintenanceEndDate: form.status === "Maintenance" && form.maintenanceEndDate ? new Date(form.maintenanceEndDate).toISOString() : null,
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
        amenities: "",
        maintenanceEndDate: ""
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
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Số phòng (Room number)</label>
            <input value={createForm.roomNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, roomNumber: event.target.value }))} placeholder="VD: 101" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Loại phòng (Room type)</label>
            <select value={createForm.roomType} onChange={(event) => setCreateForm((prev) => ({ ...prev, roomType: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
              <option value="">-- Room type --</option>
              {roomTypeOptions.map((roomType) => (<option key={roomType} value={roomType}>{roomType}</option>))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Tầng (Floor)</label>
            <input value={createForm.floor} onChange={(event) => setCreateForm((prev) => ({ ...prev, floor: event.target.value }))} placeholder="1" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Giá thuê (Monthly rent)</label>
            <input value={createForm.monthlyRent} onChange={(event) => setCreateForm((prev) => ({ ...prev, monthlyRent: event.target.value }))} placeholder="3,000,000" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Diện tích (Area m²)</label>
            <input value={createForm.area} onChange={(event) => setCreateForm((prev) => ({ ...prev, area: event.target.value }))} placeholder="20" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Sức chứa (Capacity)</label>
            <input value={createForm.maxCapacity} onChange={(event) => setCreateForm((prev) => ({ ...prev, maxCapacity: event.target.value }))} placeholder="1" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Trạng thái (Status)</label>
            <select value={createForm.status} onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
              <option value="">-- Status --</option>
              {roomStatusOptions.map((status) => (<option key={status} value={status}>{status}</option>))}
            </select>
          </div>
          {createForm.status === "Maintenance" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-amber-500">Ngày xong (Expected End Date)</label>
              <input type="date" value={createForm.maintenanceEndDate} onChange={(event) => setCreateForm((prev) => ({ ...prev, maintenanceEndDate: event.target.value }))} className="h-10 rounded-xl border border-amber-500/50 bg-white px-3 dark:bg-white/5" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Tiện ích (Amenities)</label>
            <input value={createForm.amenities} onChange={(event) => setCreateForm((prev) => ({ ...prev, amenities: event.target.value }))} placeholder="Wifi, AC, TV..." className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-3">
            <label className="text-xs font-medium text-slate-500">Mô tả (Description)</label>
            <input value={createForm.description} onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Mô tả về phòng" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-medium text-slate-500">Hình ảnh (Room Images)</label>
            <input type="file" accept="image/*" multiple onChange={(event) => setCreateImageFiles(Array.from(event.target.files ?? []))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
            {createForm.imageUrls.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">{createForm.imageUrls.map((imageUrl, index) => <img key={`${imageUrl}-${index}`} src={resolveMediaUrl(imageUrl)} alt={`Room preview ${index + 1}`} className="h-14 w-20 rounded-lg object-cover" />)}</div> : null}
            {createImageFiles.length > 0 ? <p className="text-[10px] text-slate-500 dark:text-slate-400">Đã chọn {createImageFiles.length} ảnh để upload.</p> : null}
          </div>
          <div className="flex items-end lg:col-start-4">
            <Button className="w-full h-10" onClick={() => create.mutate()} disabled={isUploadingImage}>{isUploadingImage ? "Uploading..." : "Tạo (Create)"}</Button>
          </div>
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
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500">Trạng thái (Status)</label>
                    <select value={editForm.status} onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
                      {roomStatusOptions.map((status) => (<option key={status} value={status}>{status}</option>))}
                    </select>
                  </div>
                  {editForm.status === "Maintenance" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-amber-500">Ngày xong (End Date)</label>
                      <input type="date" value={editForm.maintenanceEndDate} onChange={(event) => setEditForm((prev) => ({ ...prev, maintenanceEndDate: event.target.value }))} className="h-10 rounded-xl border border-amber-500/50 bg-white px-3 dark:bg-white/5" />
                    </div>
                  )}
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
                    <p className="muted-text">Area: {room.area ?? "-"}m² • Capacity: {room.maxCapacity ?? "-"} • Status: <span className={room.status === "Maintenance" ? "text-amber-500 font-medium" : ""}>{room.status ?? "-"}</span></p>
                    {room.status === "Maintenance" && (
                      <div className="mt-1 flex items-center gap-2">
                        {room.maintenanceEndDate && <p className="text-xs text-amber-500">Dự kiến xong: {new Date(room.maintenanceEndDate).toLocaleDateString("vi-VN")}</p>}
                        <Button 
                          variant="ghost" 
                          className="h-7 px-2 text-[10px] text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                          onClick={() => update.mutate({ id: room.id, payload: { ...room, status: "Available", maintenanceEndDate: null } })}
                        >
                          Hoàn thành (Mark Completed)
                        </Button>
                      </div>
                    )}
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
                        amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : "",
                        maintenanceEndDate: room.maintenanceEndDate ? String(room.maintenanceEndDate).slice(0, 10) : ""
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
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "payments"], queryFn: async () => unwrap(await paymentApi.getAllInvoices()) });

  const markAsPaid = useMutation({
    mutationFn: (invoiceId: number) => paymentApi.markInvoicePaid(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["staff", "checkin"] });
    }
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Invoice & Payment Management</h1>
      <div className="space-y-2">
        {listOf(data).map((invoice: any, index) => (
          <article key={invoice.id ?? index} className="glass-card rounded-xl p-3 text-sm">
            <p className="font-semibold">Invoice #{invoice.id}</p>
            <p className="muted-text">Amount: {Number(invoice.totalAmount ?? invoice.amount ?? 0).toLocaleString("vi-VN")} VND</p>
            <p className="text-primary">Status: {invoice.status ?? "Pending"}</p>
            {String(invoice.status ?? "").toLowerCase() !== "paid" ? (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  onClick={() => markAsPaid.mutate(Number(invoice.id))}
                  disabled={markAsPaid.isPending}
                >
                  {markAsPaid.isPending ? "Updating..." : "Mark as Paid"}
                </Button>
              </div>
            ) : null}
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
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [individualSuccess, setIndividualSuccess] = useState<string | null>(null);
  const [historyRoleFilter, setHistoryRoleFilter] = useState<"All" | "Resident" | "Staff">("All");
  const { data } = useMyNotifications();
  const { data: sentHistoryData } = useSentNotificationHistory();
  const broadcast = useBroadcastNotification();
  const individual = useIndividualNotification();
  const notifications = useMemo(() => listOf(data), [data]);
  const sentHistory = useMemo(() => listOf(sentHistoryData), [sentHistoryData]);
  const parsedResidentId = Number.parseInt(residentId.trim(), 10);
  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
  };

  const filteredSentHistory = useMemo(() => {
    if (historyRoleFilter === "All") return sentHistory.slice(0, 8);
    return sentHistory.filter((item: any) => String(item?.targetRole ?? "").toLowerCase() === historyRoleFilter.toLowerCase()).slice(0, 8);
  }, [sentHistory, historyRoleFilter]);

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
    setIndividualSuccess(null);
    individual.mutate(
      { residentId: parsedResidentId, title: "Individual Notice", message: individualMessage.trim() },
      {
        onSuccess: () => {
          setResidentId("");
          setIndividualMessage("");
          setIndividualError(null);
          setIndividualSuccess("Đã gửi thông báo cá nhân thành công.");
        },
        onError: (error: any) => {
          setIndividualError(getApiErrorMessage(error, "Không thể gửi thông báo cá nhân."));
          setIndividualSuccess(null);
        }
      }
    );
  };

  const sendBroadcastNotification = () => {
    if (!message.trim()) {
      setBroadcastError("Vui lòng nhập nội dung thông báo broadcast.");
      return;
    }

    setBroadcastError(null);
    setBroadcastSuccess(null);
    broadcast.mutate(
      { message: message.trim(), title: title.trim(), targetRole },
      {
        onSuccess: () => {
          setMessage("");
          setBroadcastSuccess("Đã gửi broadcast thành công.");
        },
        onError: (error: any) => {
          setBroadcastError(getApiErrorMessage(error, "Không thể gửi broadcast notification."));
        }
      }
    );
  };

  return (
    <section className="page-shell space-y-5">
      <h1 className="section-title">Notifications</h1>
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Broadcast Notification</h3>
        {broadcastError ? <p className="mt-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{broadcastError}</p> : null}
        {broadcastSuccess ? <p className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{broadcastSuccess}</p> : null}
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <select value={targetRole} onChange={(event) => setTargetRole(event.target.value as "All" | "Resident" | "Staff")} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
          <option value="All">All</option><option value="Resident">Resident</option><option value="Staff">Staff</option>
        </select>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write broadcast message..." className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <Button className="mt-3" onClick={sendBroadcastNotification} disabled={broadcast.isPending}>{broadcast.isPending ? "Sending..." : "Send Broadcast"}</Button>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Individual Notification</h3>
        {individualError ? <p className="mt-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{individualError}</p> : null}
        {individualSuccess ? <p className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{individualSuccess}</p> : null}
        <input value={residentId} onChange={(event) => setResidentId(event.target.value)} placeholder="Resident ID" className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <textarea value={individualMessage} onChange={(event) => setIndividualMessage(event.target.value)} placeholder="Write message for one resident..." className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <Button className="mt-3" onClick={sendIndividualNotification} disabled={individual.isPending}>{individual.isPending ? "Sending..." : "Send Individual"}</Button>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Recent Sent Notifications</h3>
          <div className="flex flex-wrap gap-2">
            {(["All", "Resident", "Staff"] as const).map((role) => (
              <Button key={role} variant="ghost" className={historyRoleFilter === role ? "border border-primary/40 bg-primary/10 text-primary" : ""} onClick={() => setHistoryRoleFilter(role)}>
                {role}
              </Button>
            ))}
            <Link to="/admin/notifications/history" className="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              View Full History
            </Link>
          </div>
        </div>
        <div className="space-y-2">
          {filteredSentHistory.map((item: any, index) => (
            <article key={item.id ?? index} className="rounded-xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <p>{item.message ?? item.content ?? "Notification"}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Type: {item.type ?? "-"} • Target: {item.targetRole ?? (item.residentId ? "Resident" : item.staffId ? "Staff" : "-")} • {formatDateTime(item.createdAt ?? item.time)}
              </p>
            </article>
          ))}
          {filteredSentHistory.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Không có thông báo phù hợp bộ lọc.</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        {notifications.slice(0, 4).map((item: any, index) => (
          <article key={item.id ?? index} className="glass-card rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200">
            <p>{item.message ?? item.content ?? "Notification"}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item.createdAt ?? item.time)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminNotificationHistoryPage() {
  const { data } = useSentNotificationHistory();
  const notifications = useMemo(() => listOf(data), [data]);
  const [roleFilter, setRoleFilter] = useState<"All" | "Resident" | "Staff">("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "Broadcast" | "Individual">("All");
  const [keyword, setKeyword] = useState("");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item: any) => {
      const role = String(item?.targetRole ?? "");
      const type = String(item?.type ?? "");
      const message = String(item?.message ?? item?.content ?? "").toLowerCase();
      const matchesRole = roleFilter === "All" || role.toLowerCase() === roleFilter.toLowerCase();
      const matchesType = typeFilter === "All" || type.toLowerCase() === typeFilter.toLowerCase();
      const matchesKeyword = !keyword.trim() || message.includes(keyword.trim().toLowerCase());
      return matchesRole && matchesType && matchesKeyword;
    });
  }, [notifications, roleFilter, typeFilter, keyword]);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
  };

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Notification History</h1>
      <div className="glass-card rounded-xl p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search message" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "All" | "Resident" | "Staff")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="All">All Roles</option>
            <option value="Resident">Resident</option>
            <option value="Staff">Staff</option>
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "All" | "Broadcast" | "Individual")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <option value="All">All Types</option>
            <option value="Broadcast">Broadcast</option>
            <option value="Individual">Individual</option>
          </select>
        </div>
      </div>

      {filteredNotifications.map((item: any, index) => (
        <article key={item.id ?? index} className="glass-card rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200">
          <p>{item.message ?? item.content ?? "Notification"}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Type: {item.type ?? "-"} • Target: {item.targetRole ?? (item.residentId ? "Resident" : item.staffId ? "Staff" : "-")} • {formatDateTime(item.createdAt ?? item.time)}
          </p>
        </article>
      ))}
      {filteredNotifications.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Không tìm thấy notification phù hợp.</p> : null}
    </section>
  );
}

export function AdminServiceRequestsPage() {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("Thiếu thông tin chi tiết");
  const [staffFeedback, setStaffFeedback] = useState("Đã tiếp nhận và xử lý yêu cầu");
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Completed">("All");
  const { data } = useQuery({ queryKey: ["admin", "service", "all"], queryFn: async () => unwrap(await serviceRequestApi.getAll()) });

  const filteredRequests = useMemo(() => {
    const requests = listOf(data);
    if (statusFilter === "All") {
      return requests;
    }

    const normalizedFilter = statusFilter.toLowerCase();
    return requests.filter((request: any) => String(request?.status ?? "").toLowerCase() === normalizedFilter);
  }, [data, statusFilter]);

  const review = useMutation({
    mutationFn: ({ id, status, feedback }: { id: number; status: "Approved" | "InProgress" | "Completed" | "Rejected"; feedback: string }) =>
      serviceRequestApi.review(id, { status, staffFeedback: feedback }),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "service", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "services"] });
    },
    onError: (error: any) => {
      setActionError(getApiErrorMessage(error, "Không thể xử lý yêu cầu dịch vụ."));
    }
  });

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Service Requests</h1>
      <div className="flex flex-wrap gap-2">
        {(["All", "Pending", "Approved", "Completed"] as const).map((status) => {
          const isActive = statusFilter === status;
          return (
            <Button
              key={status}
              variant="ghost"
              className={isActive ? "border border-primary/40 bg-primary/10 text-primary" : ""}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <input value={staffFeedback} onChange={(event) => setStaffFeedback(event.target.value)} placeholder="Default feedback" className="h-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
        <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Default reject reason" className="h-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
      </div>
      {actionError ? <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p> : null}
      {filteredRequests.map((request: any, index) => {
        const isCompleted = String(request?.status ?? "").toLowerCase() === "completed";

        return (
          <article key={request.id ?? index} className="glass-card rounded-xl p-4 text-sm">
            <p className="font-semibold">{request.title ?? request.serviceType}</p>
            <p className="muted-text mt-1">{request.description ?? "Không có mô tả"}</p>
            <p className="mt-1 text-primary">Status: {request.status}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => review.mutate({ id: Number(request.id), status: "Approved", feedback: staffFeedback })} disabled={review.isPending || isCompleted}>Approve</Button>
              <Button variant="ghost" onClick={() => review.mutate({ id: Number(request.id), status: "InProgress", feedback: staffFeedback })} disabled={review.isPending || isCompleted}>In Progress</Button>
              <Button variant="ghost" onClick={() => review.mutate({ id: Number(request.id), status: "Completed", feedback: staffFeedback })} disabled={review.isPending || isCompleted}>Complete</Button>
              <Button variant="ghost" onClick={() => review.mutate({ id: Number(request.id), status: "Rejected", feedback: rejectReason })} disabled={review.isPending || isCompleted}>Reject</Button>
              {isCompleted && request?.id ? (
                <Link to={`/admin/service-requests/${request.id}`} className="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                  View Details
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
      {filteredRequests.length === 0 ? <p className="muted-text">Không có yêu cầu nào ở trạng thái {statusFilter}.</p> : null}
    </section>
  );
}

export function AdminServiceRequestDetailPage() {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "service", "detail", id],
    enabled: Boolean(id),
    queryFn: async () => unwrap(await serviceRequestApi.getById(String(id)))
  });

  const request = data as any;
  const formatDateTime = (value?: string) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
  };

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Service Request Detail</h1>

      {isLoading ? <LoadingSkeleton lines={6} /> : null}
      {isError ? <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">Không thể tải chi tiết yêu cầu dịch vụ.</p> : null}

      {!isLoading && !isError && request ? (
        <article className="glass-card rounded-xl p-4 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="muted-text">Request ID</p>
              <p className="font-semibold">#{request.id ?? "-"}</p>
            </div>
            <div>
              <p className="muted-text">Status</p>
              <p className="font-semibold text-primary">{request.status ?? "-"}</p>
            </div>
            <div>
              <p className="muted-text">Title</p>
              <p className="font-semibold">{request.title ?? request.serviceType ?? "-"}</p>
            </div>
            <div>
              <p className="muted-text">Service Type</p>
              <p>{request.serviceType ?? "-"}</p>
            </div>
            <div>
              <p className="muted-text">Resident</p>
              <p>{request.residentName ?? `Resident #${request.residentId ?? "-"}`}</p>
            </div>
            <div>
              <p className="muted-text">Priority</p>
              <p>{request.priority ?? "-"}</p>
            </div>
            <div>
              <p className="muted-text">Request Date</p>
              <p>{formatDateTime(request.requestDate)}</p>
            </div>
            <div>
              <p className="muted-text">Last Updated</p>
              <p>{formatDateTime(request.lastUpdated)}</p>
            </div>
            <div>
              <p className="muted-text">Reviewed By</p>
              <p>{request.reviewedBy ?? "-"}</p>
            </div>
            <div>
              <p className="muted-text">Reviewed Date</p>
              <p>{formatDateTime(request.reviewedDate)}</p>
            </div>
            <div>
              <p className="muted-text">Completed Date</p>
              <p>{formatDateTime(request.completedDate)}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="muted-text">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{request.description ?? "-"}</p>
          </div>

          <div className="mt-4">
            <p className="muted-text">Staff Feedback</p>
            <p className="mt-1 whitespace-pre-wrap">{request.staffFeedback ?? "-"}</p>
          </div>

          <div className="mt-4">
            <Link to="/admin/service-requests" className="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              Back to Service Requests
            </Link>
          </div>
        </article>
      ) : null}
    </section>
  );
}
export const AdminReviewServiceRequestPage = () => <section className="page-shell"><h1 className="section-title">Review Service Request</h1></section>;

export function AdminReportsRevenuePage() {
  const queryClient = useQueryClient();
  const [reviewFeedback, setReviewFeedback] = useState("Báo cáo hợp lệ.");
  const [rejectFeedback, setRejectFeedback] = useState("Thiếu dữ liệu hoặc cần bổ sung thông tin.");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Reviewed" | "Rejected">("All");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const { data } = useQuery({ queryKey: ["admin", "reports", "all"], queryFn: async () => unwrap(await reportApi.getReports()) });

  const refreshReports = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "reports", "all"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "reports"] });
    queryClient.invalidateQueries({ queryKey: ["staff", "reports"] });
  };

  const review = useMutation({
    mutationFn: ({ id, status, adminFeedback }: { id: number; status: "Reviewed" | "Rejected"; adminFeedback: string }) =>
      reportApi.reviewReport(id, { status, adminFeedback }),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("Đã cập nhật trạng thái báo cáo thành công.");
      refreshReports();
    },
    onError: (error: any) => {
      setActionSuccess(null);
      setActionError(getApiErrorMessage(error, "Không thể review báo cáo."));
    }
  });

  const generateRevenue = useMutation({
    mutationFn: () => reportApi.createRevenueReport({}),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("Đã tạo báo cáo doanh thu.");
      refreshReports();
    },
    onError: (error: any) => setActionError(getApiErrorMessage(error, "Không thể tạo báo cáo doanh thu."))
  });

  const generateOccupancy = useMutation({
    mutationFn: () => reportApi.createOccupancyReport({}),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("Đã tạo báo cáo occupancy.");
      refreshReports();
    },
    onError: (error: any) => setActionError(getApiErrorMessage(error, "Không thể tạo báo cáo occupancy."))
  });

  const generateServiceUsage = useMutation({
    mutationFn: () => reportApi.createServiceUsageReport({}),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("Đã tạo báo cáo service usage.");
      refreshReports();
    },
    onError: (error: any) => setActionError(getApiErrorMessage(error, "Không thể tạo báo cáo service usage."))
  });

  const reports = useMemo(() => {
    const allReports = listOf(data);
    if (statusFilter === "All") return allReports;
    return allReports.filter((report: any) => String(report?.status ?? "").toLowerCase() === statusFilter.toLowerCase());
  }, [data, statusFilter]);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
  };

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Reports Management</h1>

      <div className="glass-card rounded-xl p-4">
        <h3 className="font-semibold">Generate System Reports</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => generateRevenue.mutate()} disabled={generateRevenue.isPending}>{generateRevenue.isPending ? "Generating..." : "Generate Revenue"}</Button>
          <Button variant="ghost" onClick={() => generateOccupancy.mutate()} disabled={generateOccupancy.isPending}>{generateOccupancy.isPending ? "Generating..." : "Generate Occupancy"}</Button>
          <Button variant="ghost" onClick={() => generateServiceUsage.mutate()} disabled={generateServiceUsage.isPending}>{generateServiceUsage.isPending ? "Generating..." : "Generate Service Usage"}</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["All", "Pending", "Reviewed", "Rejected"] as const).map((status) => (
          <Button key={status} variant="ghost" className={statusFilter === status ? "border border-primary/40 bg-primary/10 text-primary" : ""} onClick={() => setStatusFilter(status)}>
            {status}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <input value={reviewFeedback} onChange={(event) => setReviewFeedback(event.target.value)} placeholder="Feedback when reviewing" className="h-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
        <input value={rejectFeedback} onChange={(event) => setRejectFeedback(event.target.value)} placeholder="Feedback when rejecting" className="h-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
      </div>

      {actionError ? <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p> : null}
      {actionSuccess ? <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{actionSuccess}</p> : null}

      {reports.map((report: any, index) => {
        const isPending = String(report?.status ?? "").toLowerCase() === "pending";
        return (
          <article key={report.id ?? index} className="glass-card rounded-xl p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{report.title ?? "Untitled report"}</p>
                <p className="mt-1 text-primary">Status: {report.status ?? "-"}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generated: {formatDateTime(report.generatedDate)}</p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{report.content ?? "-"}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Created by: {report.createdBy ?? "-"} • Reviewed by: {report.reviewedBy ?? "-"} • Reviewed date: {formatDateTime(report.reviewedDate)}</p>
            {report.adminFeedback ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Admin feedback: {report.adminFeedback}</p> : null}

            {isPending ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => review.mutate({ id: Number(report.id), status: "Reviewed", adminFeedback: reviewFeedback })} disabled={review.isPending}>Approve</Button>
                <Button variant="ghost" onClick={() => review.mutate({ id: Number(report.id), status: "Rejected", adminFeedback: rejectFeedback })} disabled={review.isPending}>Reject</Button>
              </div>
            ) : null}
          </article>
        );
      })}

      {reports.length === 0 ? <p className="muted-text">Không có báo cáo phù hợp trạng thái {statusFilter}.</p> : null}
    </section>
  );
}

export function AdminReportsOccupancyPage() {
  const { data } = useQuery({ queryKey: ["admin", "reports", "occupancy"], queryFn: async () => unwrap(await reportApi.getReports()) });
  const reports = useMemo(() => listOf(data).filter((item: any) => String(item?.title ?? "").toLowerCase().includes("tỷ lệ phòng") || String(item?.title ?? "").toLowerCase().includes("occupancy")), [data]);
  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Occupancy Report</h1>
      <OccupancyChart />
      {reports.map((report: any, index) => (
        <article key={report.id ?? index} className="glass-card rounded-xl p-3 text-sm">
          <p className="font-semibold">{report.title}</p>
          <p className="muted-text mt-1 whitespace-pre-wrap">{report.content}</p>
        </article>
      ))}
    </section>
  );
}

export function AdminReportsServiceUsagePage() {
  const { data } = useQuery({ queryKey: ["admin", "reports", "service"], queryFn: async () => unwrap(await reportApi.getReports()) });
  const reports = useMemo(() => listOf(data).filter((item: any) => String(item?.title ?? "").toLowerCase().includes("dịch vụ") || String(item?.title ?? "").toLowerCase().includes("service")), [data]);
  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Service Usage Report</h1>
      {reports.map((report: any, index) => (
        <article key={report.id ?? index} className="glass-card rounded-xl p-3 text-sm">
          <p className="font-semibold">{report.title}</p>
          <p className="muted-text mt-1 whitespace-pre-wrap">{report.content}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Status: {report.status ?? "-"}</p>
        </article>
      ))}
      {reports.length === 0 ? <p className="muted-text">Chưa có báo cáo service usage.</p> : null}
    </section>
  );
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
