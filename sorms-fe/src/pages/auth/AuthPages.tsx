import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { UserRole } from "@/types/common";

interface LoginResponse {
  Token: string;
  UserId?: number;
  UserRole?: UserRole;
  token?: string;
  userId?: number;
  userRole?: UserRole;
}

const getApiErrorMessage = (error: any, fallback: string) => {
  if (!error?.response) {
    const message = String(error?.message ?? "");
    if (message.includes("Network Error") || message.includes("ERR_CONNECTION_REFUSED") || message.includes("ERR_NETWORK")) {
      return "Không thể kết nối tới máy chủ API (http://localhost:5183). Vui lòng chạy backend rồi thử lại.";
    }
  }

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

function AuthShell({
  title,
  subtitle,
  children,
  error
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="grid min-h-[calc(100vh-120px)] grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/30 via-slate-900 to-secondary/20 p-10 lg:block">
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=900&auto=format&fit=crop"
          alt="SORM residence"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-transparent" />
        <div className="relative z-10">
          <h2 className="text-h1 font-heading text-white drop-shadow">SORM</h2>
          <p className="mt-4 max-w-sm text-slate-100 drop-shadow">Premium resident management inspired by Airbnb experience.</p>
          <p className="mt-6 text-sm text-slate-200 drop-shadow">Smart. Secure. Seamless.</p>
        </div>
      </div>
      <div className="grid place-items-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md rounded-xl p-6">
          <h1 className="text-h3 font-heading">{title}</h1>
          <p className="mt-2 text-small text-slate-600 dark:text-slate-300">{subtitle}</p>
          {error ? <p className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          <div className="mt-6 space-y-3">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const from = useMemo(() => (location.state as { from?: string } | undefined)?.from, [location.state]);

  const completeLogin = (payload: LoginResponse) => {
    const token = payload.token ?? payload.Token;
    const role = payload.userRole ?? payload.UserRole ?? null;
    const userId = payload.userId ?? payload.UserId ?? null;

    if (!token) {
      setError("Đăng nhập thất bại: không nhận được token từ server.");
      return;
    }

    setAuth({ token, role, userId });
    navigate(from ?? (role === "Resident" ? "/resident/dashboard" : role === "Staff" ? "/staff/dashboard" : "/admin/dashboard"));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const response = await authApi.login({ email, password });
      completeLogin(response.data as LoginResponse);
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your SORM journey." error={error}>
      <form className="space-y-3" autoComplete="off" onSubmit={onSubmit}>
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5" placeholder="Email" autoComplete="off" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5" placeholder="Password" type="password" autoComplete="new-password" />
        <Button className="w-full" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
        <div className="flex items-center justify-between text-xs text-slate-300">
          <Link to="/forgot-password" className="underline-offset-4 hover:underline">Forgot password?</Link>
          <Link to="/register" className="underline-offset-4 hover:underline">Register as Resident</Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({
    email: "",
    userName: "",
    password: "",
    fullName: "",
    phone: "",
    identityNumber: "",
    gender: "Male",
    dateOfBirth: "",
    address: "",
    emergencyContact: ""
  });
  const [error, setError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setSuccessMessage(undefined);

    if (!form.email || !form.userName || !form.password) {
      setError("Vui lòng nhập Email, Username và Password.");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({
        email: form.email,
        userName: form.userName,
        password: form.password,
        roleId: 3,
        fullName: form.fullName || undefined,
        phone: form.phone || undefined,
        identityNumber: form.identityNumber || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address || undefined,
        emergencyContact: form.emergencyContact || undefined
      });

      const payload = response.data as LoginResponse & { message?: string; Message?: string };
      const token = payload.token ?? payload.Token;
      const role = payload.userRole ?? payload.UserRole ?? "Resident";
      const userId = payload.userId ?? payload.UserId ?? null;

      if (token) {
        setAuth({ token, role, userId });
        navigate("/resident/dashboard");
        return;
      }

      setSuccessMessage(payload.message ?? payload.Message ?? "Đăng ký thành công. Vui lòng đăng nhập.");
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Đăng ký thất bại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Đăng ký Resident" subtitle="Tạo tài khoản cư dân theo thông tin hồ sơ." error={error}>
      {successMessage ? <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{successMessage}</p> : null}
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="Email"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={form.userName}
          onChange={(event) => setForm((prev) => ({ ...prev, userName: event.target.value }))}
          placeholder="Username"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Password"
          type="password"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={form.fullName}
          onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          placeholder="Họ và tên"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          placeholder="Số điện thoại"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={form.identityNumber}
          onChange={(event) => setForm((prev) => ({ ...prev, identityNumber: event.target.value }))}
          placeholder="CCCD/CMND"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <select
          value={form.gender}
          onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
        >
          <option value="Male">Nam</option>
          <option value="Female">Nữ</option>
          <option value="Other">Khác</option>
        </select>
        <input
          value={form.dateOfBirth}
          onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
          placeholder="Ngày sinh"
          type="date"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          placeholder="Địa chỉ"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={form.emergencyContact}
          onChange={(event) => setForm((prev) => ({ ...prev, emergencyContact: event.target.value }))}
          placeholder="Liên hệ khẩn cấp"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
        />
        <Button className="w-full" type="submit" disabled={loading}>{loading ? "Đang đăng ký..." : "Đăng ký"}</Button>
        <p className="text-center text-xs text-slate-300">
          Đã có tài khoản? <Link to="/login" className="underline-offset-4 hover:underline">Đăng nhập</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "reset" | "done">("request");
  const [error, setError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submitRequestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setSuccessMessage(undefined);

    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setStep("verify");
      setSuccessMessage("OTP đã được gửi. Vui lòng kiểm tra email.");
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Không thể gửi OTP."));
    } finally {
      setLoading(false);
    }
  };

  const submitVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setSuccessMessage(undefined);

    if (!email || !otp) {
      setError("Vui lòng nhập email và OTP.");
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyOtp({ email, otp });
      setStep("reset");
      setSuccessMessage("OTP hợp lệ. Nhập mật khẩu mới để hoàn tất.");
    } catch (err: any) {
      setError(getApiErrorMessage(err, "OTP không hợp lệ hoặc đã hết hạn."));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError(undefined);
    setSuccessMessage(undefined);

    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSuccessMessage("OTP mới đã được gửi tới email của bạn.");
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Không thể gửi lại OTP."));
    } finally {
      setLoading(false);
    }
  };

  const submitResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setSuccessMessage(undefined);

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setStep("done");
      setSuccessMessage("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.");
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Không thể đặt lại mật khẩu."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Quên mật khẩu" subtitle="Xác thực OTP để đặt lại mật khẩu an toàn." error={error}>
      {successMessage ? <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{successMessage}</p> : null}

      {step === "request" ? (
        <form className="space-y-3" onSubmit={submitRequestOtp}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
          />
          <Button className="w-full" type="submit" disabled={loading}>{loading ? "Đang gửi OTP..." : "Gửi OTP"}</Button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form className="space-y-3" onSubmit={submitVerifyOtp}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
          />
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="OTP"
            maxLength={10}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
          />
          <Button className="w-full" type="submit" disabled={loading}>{loading ? "Đang xác thực..." : "Xác thực OTP"}</Button>
          <Button className="w-full" type="button" variant="ghost" onClick={resendOtp} disabled={loading}>
            {loading ? "Đang gửi lại..." : "Gửi lại OTP"}
          </Button>
        </form>
      ) : null}

      {step === "reset" ? (
        <form className="space-y-3" onSubmit={submitResetPassword}>
          <input
            value={email}
            readOnly
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
          />
          <input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Mật khẩu mới"
            type="password"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5"
          />
          <Button className="w-full" type="submit" disabled={loading}>{loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}</Button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="space-y-3">
          <Button className="w-full" onClick={() => navigate("/login")}>Quay lại đăng nhập</Button>
        </div>
      ) : null}

      {step !== "done" ? (
        <p className="text-center text-xs text-slate-300">
          Nhớ mật khẩu rồi? <Link to="/login" className="underline-offset-4 hover:underline">Đăng nhập</Link>
        </p>
      ) : null}
    </AuthShell>
  );
}

export function VerifyOtpPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string>();

  return (
    <AuthShell title="Verify OTP" subtitle="Enter your OTP to continue reset flow." error={message}>
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await authApi.verifyOtp({ email, otp });
            setMessage("OTP hợp lệ.");
          } catch {
            setMessage("OTP không hợp lệ.");
          }
        }}
      >
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5" />
        <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="OTP" className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5" />
        <Button className="w-full" type="submit">Verify</Button>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string>();

  return (
    <AuthShell title="Reset password" subtitle="Set your new secure password." error={message}>
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await authApi.resetPassword({ email, otp, newPassword });
            setMessage("Đặt lại mật khẩu thành công.");
          } catch {
            setMessage("Không thể đặt lại mật khẩu.");
          }
        }}
      >
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5" />
        <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="OTP" className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5" />
        <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" type="password" className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 dark:border-white/10 dark:bg-white/5" />
        <Button className="w-full" type="submit">Reset Password</Button>
      </form>
    </AuthShell>
  );
}
