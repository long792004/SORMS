import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { RoomCard } from "@/components/cards/RoomCard";
import { RoomGallery } from "@/components/cards/RoomGallery";
import { ReviewCard } from "@/components/cards/ReviewCard";
import { SearchBar } from "@/components/layout/SearchBar";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { RatingStars } from "@/components/ui/RatingStars";
import { reviewApi } from "@/api/reviewApi";
import { roomApi } from "@/api/roomApi";
import { useRoomDetail, useRoomReviews } from "@/hooks/useRooms";
import Tooltip from '@mui/material/Tooltip';
import { useAuthStore } from "@/store/authStore";
import { getRoomImageUrls } from "@/utils/media";

function toRoomList(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as any).items)) return (data as any).items;
  if (data && typeof data === "object" && Array.isArray((data as any).reviews)) return (data as any).reviews;
  if (data && typeof data === "object" && Array.isArray((data as any).Reviews)) return (data as any).Reviews;
  return [];
}

function getRoomId(room: any) {
  return room?.id ?? room?.roomId ?? room?.roomNumber;
}

function getRoomTitle(room: any) {
  return room?.roomNumber ?? room?.name ?? "Premium Room";
}

function getRoomPrice(room: any) {
  return Number(room?.price ?? room?.monthlyRent ?? 0);
}

function getRoomRating(room: any) {
  return Number(room?.averageRating ?? 0);
}

function getReviewCount(room: any) {
  return Number(room?.reviewCount ?? 0);
}

function getReviewAuthor(review: any) {
  return review?.residentName ?? review?.ResidentName ?? review?.reviewerName ?? "Ẩn danh";
}

function getReviewRoomName(review: any) {
  return review?.roomName ?? review?.RoomName ?? "";
}

function getRoomType(room: any) {
  return room?.roomType ?? room?.type ?? "Standard";
}

function getRoomArea(room: any) {
  return Number(room?.area ?? 0);
}

function getRoomCapacity(room: any) {
  return Number(room?.maxCapacity ?? 1);
}

function getNightlyRate(room: any) {
  const monthly = Number(room?.price ?? room?.monthlyRent ?? 0);
  if (!Number.isFinite(monthly) || monthly <= 0) return 0;
  return Math.round(monthly / 30);
}

function getLocationText(room: any) {
  const city = room?.city ?? room?.City;
  const area = room?.areaName ?? room?.district ?? room?.location ?? room?.Location;
  const hotel = room?.hotelName ?? room?.buildingName ?? "SORM Residence";
  return [hotel, city, area].filter(Boolean).join(" • ");
}

function getDistanceLabel(room: any) {
  const distance = room?.distanceKm ?? room?.distance;
  if (distance === undefined || distance === null || distance === "") return "";
  const value = Number(distance);
  if (Number.isFinite(value)) {
    return `${value.toFixed(1)} km`;
  }
  return String(distance);
}

function countNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  if (Number.isNaN(inTime) || Number.isNaN(outTime) || outTime <= inTime) return 0;
  return Math.ceil((outTime - inTime) / (1000 * 60 * 60 * 24));
}

export function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading } = useQuery({
    queryKey: ["rooms", "all", "homepage"],
    queryFn: async () => {
      const response = await roomApi.getRooms();
      return response.data?.data ?? response.data;
    }
  });
  const { data: recentReviewsData } = useQuery({
    queryKey: ["reviews", "public", "recent"],
    retry: false,
    queryFn: async () => {
      try {
        const response = await reviewApi.getPublicRecent(3);
        return response.data?.data ?? response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404) {
          return [];
        }
        throw error;
      }
    }
  });
  const rooms = useMemo(() => toRoomList(data), [data]);
  const recentReviews = useMemo(() => toRoomList(recentReviewsData), [recentReviewsData]);
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const handleBookFromCard = (room: any) => {
    const roomId = getRoomId(room);
    if (!roomId) {
      return;
    }

    const target = `/rooms/${roomId}`;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: target } });
      return;
    }

    navigate(target);
  };

  return (
    <section className="space-y-10">
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-white">
        <img
          src="https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?q=80&w=1600&auto=format&fit=crop"
          alt="SORM hero"
          className="h-[640px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/58 to-slate-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(20,184,166,0.32),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,0.22),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.05)_0%,rgba(2,6,23,0.45)_45%,rgba(2,6,23,0.65)_100%)]" />

        <div className="page-shell absolute inset-0 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-[1120px] space-y-5 rounded-3xl border border-white/20 bg-slate-950/28 p-6 backdrop-blur-md md:p-8"
          >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-fit rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm"
          >
            Smart Residence Platform
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-4xl text-h1 font-heading text-white drop-shadow">
            Smart premium booking experience for modern residents
          </motion.h1>

          <p className="max-w-2xl text-lg text-slate-100/95">Book rooms, manage invoices, and track services in one premium platform.</p>

          <SearchBar
            location={location}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            theme="hero"
            onLocationChange={setLocation}
            onCheckInChange={setCheckIn}
            onCheckOutChange={setCheckOut}
            onGuestsChange={setGuests}
            onSubmit={() => navigate(`/search?location=${encodeURIComponent(location)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button className="w-fit bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-white shadow-[0_18px_46px_rgba(249,115,22,0.45)]" onClick={() => navigate("/rooms")}>Explore Rooms</Button>
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-white/95 backdrop-blur-sm">
              <span>Secure Payments</span>
              <span className="h-1 w-1 rounded-full bg-white/80" />
              <span>24/7 Support</span>
            </div>
          </div>
          </motion.div>
        </div>
      </div>

      <section className="page-shell">
        <h2 className="section-title">Featured Rooms</h2>
        <p className="muted-text mt-2">Airbnb-style curated room cards with transparent pricing.</p>
        {isLoading ? <LoadingSkeleton lines={6} /> : null}
        <div className="airbnb-grid mt-4">
          {rooms.slice(0, 8).map((room: any) => (
            <RoomCard
              key={getRoomId(room)}
              title={getRoomTitle(room)}
              price={`${getRoomPrice(room).toLocaleString("vi-VN")} VND / month`}
              rating={getRoomRating(room).toFixed(1)}
              reviewCount={getReviewCount(room)}
              location={room.location ?? "SORM Residence"}
              imageUrl={getRoomImageUrls(room)[0]}
              status={room.status ?? "Available"}
              holdExpiresAt={room.maintenanceEndDate || room.holdExpiresAt}
              onView={() => navigate(`/rooms/${getRoomId(room)}`)}
              onBook={() => handleBookFromCard(room)}
            />
          ))}
        </div>
      </section>

      <section className="page-shell grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Smart Booking", "Secure Payment", "Fast Service", "Modern Rooms"].map((feature) => (
          <div key={feature} className="glass-card rounded-xl p-4">
            <p className="font-semibold text-slate-900 dark:text-white">{feature}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Enterprise-grade experience with smooth workflow.</p>
          </div>
        ))}
      </section>

      <section className="page-shell space-y-3">
        <h3 className="text-h3 font-heading">Testimonials</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {recentReviews.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có đánh giá thực tế nào hiển thị công khai.</p> : null}
          {recentReviews.map((review: any, index) => (
            <ReviewCard
              key={review.id ?? index}
              author={getReviewAuthor(review)}
              roomName={getReviewRoomName(review)}
              comment={review.comment ?? "Không có nhận xét."}
              rating={Number(review.rating ?? 0)}
              createdAt={review.createdAt}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

export function RoomListPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [minRating, setMinRating] = useState(0);
  const [minGuests, setMinGuests] = useState(1);
  const [roomType, setRoomType] = useState("all");
  const [locationKeyword, setLocationKeyword] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [filterCheckIn, setFilterCheckIn] = useState("");
  const [filterCheckOut, setFilterCheckOut] = useState("");
  const [page, setPage] = useState(1);

  const hasDateFilter = Boolean(filterCheckIn && filterCheckOut && filterCheckOut > filterCheckIn);

  const { data: allRoomsData, isLoading: allLoading } = useQuery({
    queryKey: ["rooms", "all"],
    enabled: !hasDateFilter,
    queryFn: async () => {
      const response = await roomApi.getRooms();
      return response.data?.data ?? response.data;
    }
  });

  const { data: availableData, isLoading: availLoading } = useQuery({
    queryKey: ["rooms", "available", filterCheckIn, filterCheckOut],
    enabled: hasDateFilter,
    queryFn: async () => {
      const response = await roomApi.getAvailableRooms(filterCheckIn, filterCheckOut);
      return response.data?.data ?? response.data;
    }
  });

  const isLoading = hasDateFilter ? availLoading : allLoading;
  const rawData = hasDateFilter ? availableData : allRoomsData;
  const rooms = useMemo(() => toRoomList(rawData), [rawData]);

  const filtered = rooms.filter((room: any) => {
    if (Number(room.price ?? room.monthlyRent ?? 0) > maxPrice) return false;
    if (Number(room.averageRating ?? 0) < minRating) return false;
    if (getRoomCapacity(room) < minGuests) return false;
    if (roomType !== "all" && getRoomType(room).toLowerCase() !== roomType.toLowerCase()) return false;
    if (locationKeyword.trim() && !getLocationText(room).toLowerCase().includes(locationKeyword.toLowerCase())) return false;
    if (roomSearch.trim() && !String(room.roomNumber ?? "").toLowerCase().includes(roomSearch.toLowerCase())) return false;
    return true;
  });
  const roomTypes = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((room: any) => {
      const value = getRoomType(room);
      if (value) set.add(String(value));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rooms]);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleBookFromCard = (room: any) => {
    const roomId = getRoomId(room);
    if (!roomId) {
      return;
    }

    const target = `/rooms/${roomId}`;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: target } });
      return;
    }

    navigate(target);
  };

  return (
    <section className="page-shell grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="glass-card h-fit space-y-4 rounded-xl p-4">
        <h1 className="text-h3 font-heading">Filters</h1>
        <input
          value={locationKeyword}
          onChange={(event) => { setLocationKeyword(event.target.value); setPage(1); }}
          placeholder="City / Hotel / Area"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={roomSearch}
          onChange={(event) => { setRoomSearch(event.target.value); setPage(1); }}
          placeholder="Search by room number..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <div className="space-y-1">
          <label className="text-xs text-slate-500 dark:text-slate-400">Check-in date (optional)</label>
          <input type="date" value={filterCheckIn} onChange={(event) => { setFilterCheckIn(event.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500 dark:text-slate-400">Check-out date (optional)</label>
          <input type="date" value={filterCheckOut} onChange={(event) => { setFilterCheckOut(event.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
        </div>
        {hasDateFilter ? <p className="text-xs text-emerald-400">Showing available rooms for selected dates.</p> : <p className="text-xs text-slate-500 dark:text-slate-400">Select dates to filter available rooms.</p>}
        {filterCheckIn && filterCheckOut && filterCheckOut <= filterCheckIn ? <p className="text-xs text-rose-400">Check-out must be after check-in.</p> : null}
        <label className="text-sm text-slate-600 dark:text-slate-300">Price up to: {maxPrice.toLocaleString("vi-VN")} VND</label>
        <input type="range" min={1000000} max={10000000} step={100000} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="w-full" />
        <label className="text-sm text-slate-600 dark:text-slate-300">Guests</label>
        <input type="number" min={1} value={minGuests} onChange={(event) => { setMinGuests(Math.max(1, Number(event.target.value) || 1)); setPage(1); }} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
        <label className="text-sm text-slate-600 dark:text-slate-300">Min rating</label>
        <select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
          <option value={0}>All</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
        </select>
        <label className="text-sm text-slate-600 dark:text-slate-300">Room type</label>
        <select value={roomType} onChange={(event) => { setRoomType(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
          <option value="all">All types</option>
          {roomTypes.map((item) => (<option key={item} value={item}>{item}</option>))}
        </select>
      </aside>

      <div>
        <h2 className="section-title">Room List</h2>
        {isLoading ? <LoadingSkeleton lines={8} /> : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((room: any) => (
            <RoomCard
              key={getRoomId(room)}
              title={`Room ${room?.roomNumber ?? getRoomTitle(room)} • ${getRoomType(room)}`}
              price={`${getNightlyRate(room).toLocaleString("vi-VN")} VND / night`}
              rating={getRoomRating(room).toFixed(1)}
              reviewCount={getReviewCount(room)}
              location={`${getLocationText(room)}${getDistanceLabel(room) ? ` • ${getDistanceLabel(room)}` : ""}`}
              imageUrl={getRoomImageUrls(room)[0]}
              status={room.status ?? "Available"}
              holdExpiresAt={room.maintenanceEndDate || room.holdExpiresAt}
              onView={() => navigate(`/rooms/${getRoomId(room)}`)}
              onBook={() => handleBookFromCard(room)}
            />
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </section>
  );
}

export function RoomDetailPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [searchParams] = useSearchParams();
  const { id = "" } = useParams();
  const { data: room } = useRoomDetail(id);
  const { data: reviewsData } = useRoomReviews(id);
  const reviews = toRoomList(reviewsData);
  const prefillCheckIn = searchParams.get("checkIn") ?? "";
  const prefillCheckOut = searchParams.get("checkOut") ?? "";
  const prefillGuests = Number(searchParams.get("guests") ?? "1");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    if (prefillCheckIn) setCheckIn(prefillCheckIn);
    if (prefillCheckOut) setCheckOut(prefillCheckOut);
    if (Number.isFinite(prefillGuests) && prefillGuests > 0) setGuests(prefillGuests);
  }, [prefillCheckIn, prefillCheckOut, prefillGuests]);

  const isDateRangeValid = Boolean(checkIn && checkOut && checkOut > checkIn);

  const { data: availableRoomsData, isFetching: checkingAvailability } = useQuery({
    queryKey: ["room-detail", "availability", id, checkIn, checkOut],
    enabled: isDateRangeValid,
    queryFn: async () => {
      const response = await roomApi.getAvailableRooms(checkIn, checkOut);
      return response.data?.data ?? response.data;
    }
  });

  const availableRooms = toRoomList(availableRoomsData);
  const isCurrentRoomAvailable = isDateRangeValid
    ? availableRooms.some((item: any) => String(item.id ?? item.roomId ?? item.roomNumber) === String(id))
    : false;

  const bookingStatusText = !checkIn || !checkOut
    ? "Vui lòng chọn ngày check-in và check-out để kiểm tra khả dụng."
    : !isDateRangeValid
      ? "Ngày check-out phải lớn hơn ngày check-in."
      : checkingAvailability
        ? "Đang kiểm tra trạng thái booking của phòng..."
        : isCurrentRoomAvailable
          ? "Phòng khả dụng cho khoảng ngày bạn chọn."
          : "Phòng đã được booking trước đó trong khoảng ngày này.";

  const roomPrice = Number(room?.price ?? room?.monthlyRent ?? 0);
  const nightlyRate = getNightlyRate(room);
  const stayNights = countNights(checkIn, checkOut);
  const estimatedRoomCost = nightlyRate * stayNights;
  const estimatedTax = Math.round(estimatedRoomCost * 0.1);
  const estimatedServiceFee = Math.round(estimatedRoomCost * 0.05);
  const estimatedTotal = estimatedRoomCost + estimatedTax + estimatedServiceFee;
  const policies = {
    checkIn: "Từ 14:00",
    checkOut: "Trước 12:00",
    cancellation: "Miễn phí hủy trước 48 giờ. Sau đó tính 1 đêm.",
    refund: "Hoàn tiền trong 5-7 ngày làm việc theo điều kiện booking.",
    houseRules: "Không hút thuốc trong phòng, giữ yên tĩnh sau 22:00."
  };
  const canProceedBooking = isDateRangeValid && isCurrentRoomAvailable;
  const bookingTarget = `/checkout?roomId=${id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&roomPrice=${roomPrice}&roomNumber=${encodeURIComponent(String(room?.roomNumber ?? id))}`;
  const alternativeRooms = isDateRangeValid
    ? availableRooms
        .filter((item: any) => String(item.id ?? item.roomId ?? item.roomNumber) !== String(id))
        .slice(0, 4)
    : [];

  return (
    <section className="page-shell grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-5">
        <RoomGallery images={getRoomImageUrls(room)} />
        <div className="glass-card rounded-xl p-5">
          <h1 className="text-h2 font-heading">{room?.hotelName ?? "SORM Residence"} - Room {room?.roomNumber ?? id}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{room?.description ?? "Premium room with full amenities."}</p>
          {room?.status === "Maintenance" && room?.maintenanceEndDate && (
            <p className="mt-2 rounded-lg bg-amber-500/10 p-3 text-sm font-medium text-amber-500 border border-amber-500/20">
              Phòng đang bảo trì. Dự kiến sẽ trống vào ngày: {new Date(room.maintenanceEndDate).toLocaleDateString("vi-VN")}
            </p>
          )}
          <p className="mt-2 text-xl font-semibold text-primary">{nightlyRate.toLocaleString("vi-VN")} VND/night</p>
          <div className="mt-2"><RatingStars rating={Number(room?.averageRating ?? 0)} /></div>
          <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10">
            <p><span className="font-semibold">Hotel:</span> {room?.hotelName ?? "SORM Residence"}</p>
            <p><span className="font-semibold">Room type:</span> {getRoomType(room)}</p>
            <p><span className="font-semibold">Area:</span> {getRoomArea(room) || "-"} m²</p>
            <p><span className="font-semibold">Max guests:</span> {getRoomCapacity(room)}</p>
            <p><span className="font-semibold">Location:</span> {getLocationText(room)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(room?.amenities ?? ["WiFi", "Air Conditioner", "TV", "Pool", "Parking", "Breakfast"]).map((item: string, index: number) => (
              <span key={`${item}-${index}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs dark:border-white/15">{item}</span>
            ))}
          </div>
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-white/10">
            <h3 className="text-base font-semibold">Policies</h3>
            <p><span className="font-semibold">Check-in:</span> {policies.checkIn}</p>
            <p><span className="font-semibold">Check-out:</span> {policies.checkOut}</p>
            <p><span className="font-semibold">Cancellation:</span> {policies.cancellation}</p>
            <p><span className="font-semibold">Refund:</span> {policies.refund}</p>
            <p><span className="font-semibold">Hotel rules:</span> {policies.houseRules}</p>
          </div>
          <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-white/10">
            <h3 className="text-base font-semibold">Estimated Price</h3>
            <p>Nightly rate: {nightlyRate.toLocaleString("vi-VN")} VND</p>
            <p>Nights: {stayNights || "-"}</p>
            <p>Room subtotal: {estimatedRoomCost.toLocaleString("vi-VN")} VND</p>
            <p>Tax (10%): {estimatedTax.toLocaleString("vi-VN")} VND</p>
            <p>Service fee (5%): {estimatedServiceFee.toLocaleString("vi-VN")} VND</p>
            <p className="font-semibold text-secondary">Estimated total: {estimatedTotal.toLocaleString("vi-VN")} VND</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-h3 font-heading">Reviews</h2>
          {reviews.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet.</p> : null}
          {reviews.map((review: any, index) => (
            <ReviewCard
              key={review.id ?? index}
              author={getReviewAuthor(review)}
              roomName={getReviewRoomName(review)}
              comment={review.comment ?? "Không có nhận xét."}
              rating={Number(review.rating ?? 0)}
              createdAt={review.createdAt}
            />
          ))}
        </div>
      </div>

      <aside className="glass-card h-fit rounded-xl p-5">
        <h3 className="text-lg font-semibold">Booking Panel</h3>
        <div className="mt-3 space-y-2">
          <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input type="number" min={1} value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <p className={`text-xs ${canProceedBooking ? "text-emerald-300" : "text-amber-300"}`}>{bookingStatusText}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Giá phòng: {roomPrice.toLocaleString("vi-VN")} VND/tháng</p>
          <Tooltip
            title={!isAuthenticated ? "Please log in to book this room" : ""}
            arrow
            placement="top"
          >
            <span>
              <Button
                className="w-full"
                disabled={isAuthenticated ? !canProceedBooking : false}
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate("/login", { state: { from: bookingTarget } });
                    return;
                  }
                  navigate(bookingTarget);
                }}
              >
                Book now
              </Button>
            </span>
          </Tooltip>

          {!checkingAvailability && isDateRangeValid && !isCurrentRoomAvailable ? (
            <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <p className="font-semibold">Gợi ý phòng thay thế khả dụng</p>
              {alternativeRooms.length === 0 ? (
                <p className="mt-2">Hiện chưa có phòng khác trống trong khoảng ngày này.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {alternativeRooms.map((alt: any, index) => {
                    const altId = alt.id ?? alt.roomId ?? alt.roomNumber;
                    const altPrice = Number(alt.price ?? alt.monthlyRent ?? 0);
                    return (
                      <div key={altId ?? index} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                        <div>
                          <p className="text-slate-100">Room {alt.roomNumber ?? altId}</p>
                          <p className="text-[11px] text-slate-300">{altPrice.toLocaleString("vi-VN")} VND/tháng</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-[11px]"
                          onClick={() => navigate(`/rooms/${altId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}
                        >
                          Chọn phòng
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </section>
  );
}

export function RoomReviewsPage() {
  const { id = "" } = useParams();
  const { data: reviewsData } = useRoomReviews(id);
  const reviews = toRoomList(reviewsData);

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Room Reviews</h1>
      {reviews.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet.</p> : null}
      <div className="grid gap-3">
        {reviews.map((review: any, index) => (
          <ReviewCard
            key={review.id ?? index}
            author={getReviewAuthor(review)}
            roomName={getReviewRoomName(review)}
            comment={review.comment ?? "Không có nhận xét."}
            rating={Number(review.rating ?? 0)}
            createdAt={review.createdAt}
          />
        ))}
      </div>
    </section>
  );
}

export function RoomBookingPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  return (
    <section className="page-shell space-y-5">
      <h1 className="section-title">Booking Flow</h1>
      <div className="glass-card rounded-xl p-5">
        <p className="text-sm text-slate-600 dark:text-slate-300">Room Detail → Select Dates → Check Availability → Booking Form → Payment → Confirmation</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full Name" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={identityNumber} onChange={(event) => setIdentityNumber(event.target.value)} placeholder="Identity Number" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
          <input value={emergencyContact} onChange={(event) => setEmergencyContact(event.target.value)} placeholder="Emergency Contact" className="h-10 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 md:col-span-2" />
        </div>
        <Button className="mt-4" onClick={() => navigate("/login")}>Continue to Payment</Button>
      </div>
    </section>
  );
}

export const RoomAvailabilityPage = () => (
  <section className="page-shell">
    <h1 className="section-title">Room Availability</h1>
    <p className="muted-text mt-2">Realtime room vacancy overview for booking decisions.</p>
  </section>
);

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const locationQuery = searchParams.get("location") ?? "";
  const checkInQuery = searchParams.get("checkIn") ?? "";
  const checkOutQuery = searchParams.get("checkOut") ?? "";
  const guestsQuery = Math.max(1, Number(searchParams.get("guests") ?? "1"));
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [minRating, setMinRating] = useState(0);
  const [roomType, setRoomType] = useState("all");
  const { data } = useQuery({
    queryKey: ["rooms", "all", "search"],
    queryFn: async () => {
      const response = await roomApi.getRooms();
      return response.data?.data ?? response.data;
    }
  });
  const rooms = useMemo(() => toRoomList(data), [data]);
  const filteredRooms = useMemo(() => {
    return rooms.filter((room: any) => {
      if (locationQuery.trim() && !getLocationText(room).toLowerCase().includes(locationQuery.toLowerCase())) return false;
      if (Number(room.price ?? room.monthlyRent ?? 0) > maxPrice) return false;
      if (Number(room.averageRating ?? 0) < minRating) return false;
      if (getRoomCapacity(room) < guestsQuery) return false;
      if (roomType !== "all" && getRoomType(room).toLowerCase() !== roomType.toLowerCase()) return false;
      return true;
    });
  }, [rooms, locationQuery, maxPrice, minRating, guestsQuery, roomType]);
  const roomTypes = useMemo(() => {
    const values = new Set<string>();
    rooms.forEach((room: any) => {
      const type = getRoomType(room);
      if (type) values.add(String(type));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rooms]);

  const handleBookFromCard = (room: any) => {
    const roomId = getRoomId(room);
    if (!roomId) {
      return;
    }

    const target = `/rooms/${roomId}`;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: target } });
      return;
    }

    navigate(target);
  };

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Search Results</h1>
      <div className="glass-card rounded-xl p-4 text-sm">
        <p><span className="font-semibold">Location:</span> {locationQuery || "Any"}</p>
        <p><span className="font-semibold">Dates:</span> {checkInQuery || "-"} → {checkOutQuery || "-"}</p>
        <p><span className="font-semibold">Guests:</span> {guestsQuery}</p>
      </div>
      <div className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10 md:grid-cols-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">Max price</label>
          <input type="range" min={1000000} max={10000000} step={100000} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="w-full" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{maxPrice.toLocaleString("vi-VN")} VND</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">Min rating</label>
          <select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
            <option value={0}>All</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">Room type</label>
          <select value={roomType} onChange={(event) => setRoomType(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
            <option value="all">All types</option>
            {roomTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
          </select>
        </div>
      </div>
      {filteredRooms.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No rooms match your criteria.</p> : null}
      <div className="airbnb-grid mt-1">
        {filteredRooms.map((room: any) => (
          <RoomCard
            key={getRoomId(room)}
            title={`Room ${room?.roomNumber ?? getRoomTitle(room)} • ${getRoomType(room)}`}
            price={`${getNightlyRate(room).toLocaleString("vi-VN")} VND / night`}
            rating={getRoomRating(room).toFixed(1)}
            reviewCount={getReviewCount(room)}
            location={`${getLocationText(room)}${getDistanceLabel(room) ? ` • ${getDistanceLabel(room)}` : ""}`}
            imageUrl={getRoomImageUrls(room)[0]}
            status={room.status ?? "Available"}
            holdExpiresAt={room.holdExpiresAt}
            onView={() => navigate(`/rooms/${getRoomId(room)}`)}
            onBook={() => handleBookFromCard(room)}
          />
        ))}
      </div>
    </section>
  );
}

export const AboutPage = () => (
  <section className="page-shell space-y-4">
    <h1 className="section-title">About SORM</h1>
    <p className="muted-text">SORM is a complete smart resident management platform for booking, payments, services, and operations.</p>
  </section>
);

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  return (
    <section className="page-shell space-y-4">
      <h1 className="section-title">Contact</h1>
      <div className="glass-card max-w-2xl rounded-xl p-5">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mb-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="mb-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5" />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" className="h-28 w-full rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5" />
        <Button className="mt-3">Send</Button>
      </div>
    </section>
  );
}

export const ServicesPage = () => (
  <section className="page-shell space-y-4">
    <h1 className="section-title">Services</h1>
    <div className="grid gap-3 md:grid-cols-3">
      <div className="glass-card rounded-xl p-4"><p className="font-semibold">Maintenance</p><p className="muted-text mt-1">Fast repair request handling.</p></div>
      <div className="glass-card rounded-xl p-4"><p className="font-semibold">Cleaning</p><p className="muted-text mt-1">Scheduled room cleaning services.</p></div>
      <div className="glass-card rounded-xl p-4"><p className="font-semibold">Resident Support</p><p className="muted-text mt-1">24/7 support for residents and staff.</p></div>
    </div>
  </section>
);
