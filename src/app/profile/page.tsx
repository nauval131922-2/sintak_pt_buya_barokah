"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save, User, Camera, Lock, CheckCircle2, AlertCircle,
  Loader2, Eye, EyeOff, ShieldCheck, RefreshCw,
} from "lucide-react";
import { updateProfile } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsInitialLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setUsername(data.username || "");
          setRole(data.role || "");
          setPhotoUrl(data.photo || null);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setTimeout(() => setIsInitialLoading(false), 300);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran foto maksimal 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (password && password !== confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }
    if (password && password.length < 6) {
      setMessage({ type: "error", text: "Password minimal 6 karakter." });
      return;
    }
    setIsLoading(true);
    startTransition(async () => {
      try {
        const result = await updateProfile({
          name,
          username,
          password: password || undefined,
          photo: photoUrl,
        });
        if (result.success) {
          setMessage({ type: "success", text: "Profil berhasil diperbarui." });
          setPassword("");
          setConfirmPassword("");
          localStorage.setItem("sintak_profile_updated", Date.now().toString());
          router.refresh();
        } else {
          setMessage({ type: "error", text: result.message || "Gagal memperbarui profil." });
        }
      } catch {
        setMessage({ type: "error", text: "Terjadi kesalahan sistem." });
      } finally {
        setIsLoading(false);
      }
    });
  };

  const getInitials = (n: string) =>
    (n || "U").split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);

  const passwordMatch = password && confirmPassword && password === confirmPassword;
  const passwordMismatch = password && confirmPassword && password !== confirmPassword;
  const isSaving = isLoading || isPending;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
      <PageHeader
        title="Pengaturan Profil"
        description="Kelola informasi data diri dan keamanan akun Anda."
        showHelp={false}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {/* ── Feedback banner ─────────────────────────────────────────── */}
          {message && (
            <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-[12px] font-semibold animate-in slide-in-from-top-1 duration-200 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              {message.type === "success"
                ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span className="flex-1">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* ── Avatar card ─────────────────────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-50 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Camera size={14} />
                  </div>
                  <span className="text-[13px] font-bold text-gray-800">Foto Profil</span>
                </div>
                <span className="text-[10px] font-semibold text-gray-400">JPEG / PNG · Maks 2MB</span>
              </div>

              <div className="px-5 py-5 flex items-center gap-6">
                {isInitialLoading ? (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                ) : (
                  <div className="relative group shrink-0 p-2 -m-2">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md shadow-emerald-900/10 bg-emerald-600 flex items-center justify-center">
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrl} alt="Foto profil" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[22px] font-extrabold tracking-tight select-none">
                          {getInitials(name)}
                        </span>
                      )}
                    </div>
                    {/* Hover overlay */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera size={20} className="text-white" />
                    </div>
                    {/* Camera badge */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center shadow-sm border-2 border-white transition-colors"
                    >
                      <Camera size={12} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {isInitialLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 w-32 bg-gray-100 rounded-full" />
                      <div className="h-3 w-20 bg-gray-100 rounded-full" />
                    </div>
                  ) : (
                    <>
                      <p className="text-[15px] font-bold text-gray-800 truncate">{name || "—"}</p>
                      <p className="text-[12px] text-gray-400 font-medium truncate">@{username || "—"}</p>
                      <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-bold text-emerald-700">
                        <ShieldCheck size={10} />
                        {role || "—"}
                      </span>
                    </>
                  )}
                </div>

                {photoUrl && !isInitialLoading && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="shrink-0 text-[11px] font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-all"
                  >
                    Hapus foto
                  </button>
                )}
              </div>
            </div>

            {/* ── Informasi Dasar ──────────────────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-50 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <User size={14} />
                </div>
                <span className="text-[13px] font-bold text-gray-800">Informasi Dasar</span>
              </div>

              <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-2">
                    Nama Lengkap <span className="text-rose-400">*</span>
                  </label>
                  {isInitialLoading ? (
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  ) : (
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full pl-8 pr-3 py-2.5 text-[13px] font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none transition-all placeholder:text-gray-300"
                        placeholder="Nama lengkap Anda"
                      />
                    </div>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-2">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  {isInitialLoading ? (
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-[13px] font-bold select-none pointer-events-none">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                        required
                        className="w-full pl-7 pr-3 py-2.5 text-[13px] font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none transition-all lowercase placeholder:text-gray-300 placeholder:normal-case"
                        placeholder="username"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Keamanan Akun ────────────────────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-50 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock size={14} />
                </div>
                <div className="flex-1">
                  <span className="text-[13px] font-bold text-gray-800">Keamanan Akun</span>
                </div>
                <span className="text-[10px] font-semibold text-gray-400">Kosongkan jika tidak ingin mengubah password</span>
              </div>

              <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password baru */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-2">
                    Password Baru <span className="text-gray-400 font-medium">(opsional)</span>
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full pl-8 pr-10 py-2.5 text-[13px] font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none transition-all placeholder:text-gray-300"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 6 && (
                    <p className="mt-1.5 text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                      <AlertCircle size={10} /> Minimal 6 karakter
                    </p>
                  )}
                </div>

                {/* Konfirmasi password */}
                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-2">
                    Ulangi Password
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className={`w-full pl-8 pr-10 py-2.5 text-[13px] font-medium bg-gray-50 border rounded-lg focus:bg-white focus:outline-none transition-all placeholder:text-gray-300 ${
                        passwordMatch ? "border-emerald-400 focus:border-emerald-400" :
                        passwordMismatch ? "border-rose-400 focus:border-rose-400" :
                        "border-gray-200 focus:border-emerald-400"
                      }`}
                      placeholder="Ulangi password baru"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {passwordMatch && <CheckCircle2 size={14} className="text-emerald-500" />}
                      {passwordMismatch && <AlertCircle size={14} className="text-rose-500" />}
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  {passwordMismatch && (
                    <p className="mt-1.5 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                      <AlertCircle size={10} /> Password tidak cocok
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Footer actions ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="text-[11px] text-gray-400 font-medium">
                Pastikan data sudah benar sebelum menyimpan.
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2.5 text-[12px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !!passwordMismatch || isInitialLoading}
                  className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
                >
                  {isSaving
                    ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</>
                    : <><Save size={14} /> Simpan Profil</>
                  }
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
