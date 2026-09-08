import React, { useState, useEffect, useRef } from "react";
const loginImage = "https://cdn-icons-png.flaticon.com/512/4712/4712139.png";
const defaultPP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3CclipPath id='cl'%3E%3Ccircle cx='50' cy='50' r='48'/%3E%3C/clipPath%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='48' fill='%23111111'/%3E%3Cg clip-path='url(%23cl)'%3E%3Ccircle cx='50' cy='36' r='20' fill='white'/%3E%3Cellipse cx='50' cy='88' rx='38' ry='26' fill='white'/%3E%3C/g%3E%3C/svg%3E";
const logo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%234F46E5'/%3E%3Ctext x='50' y='58' text-anchor='middle' font-size='36' font-family='Arial' font-weight='bold' fill='white'%3EUR%3C/text%3E%3C/svg%3E";

const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT_TR = ["Pzt", "Sal", "Çar", "Per", "Cum"];
const DAYS_SHORT_EN = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Meal = { name: string; kal: number };
type DayMenu = { normal: Meal[] };
type MenuData = Record<string, DayMenu>;

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtDate = (d: Date, lang = "tr") => {
  const days = lang === "en" ? DAYS_EN : DAYS_TR;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} - ${days[d.getDay()]}`;
};

const loadMenu = (): MenuData => { try { return JSON.parse(localStorage.getItem("uni_menu") || "{}"); } catch { return {}; } };
const saveMenu = (d: MenuData) => localStorage.setItem("uni_menu", JSON.stringify(d));
const profileKey = () => { const uid = localStorage.getItem("uni_current_user_id"); return uid ? `uni_profile_${uid}` : "uni_profile"; };
const loadProfile = () => { try { return JSON.parse(localStorage.getItem(profileKey()) || "{}"); } catch { return {}; } };
const saveProfile = (p: object) => localStorage.setItem(profileKey(), JSON.stringify(p));
const loadCreds = () => { try { return JSON.parse(localStorage.getItem("uni_creds") || "{}"); } catch { return {}; } };
const saveCreds = (c: object) => localStorage.setItem("uni_creds", JSON.stringify(c));
const loadDark = () => localStorage.getItem("uni_dark") === "1";
const saveDark = (v: boolean) => localStorage.setItem("uni_dark", v ? "1" : "0");
const isLoggedIn = () => localStorage.getItem("uni_session") === "1";
const setLoggedIn = (v: boolean) => v ? localStorage.setItem("uni_session", "1") : localStorage.removeItem("uni_session");

type PendingUser = { id: string; name: string; pw: string; unit: string; createdAt: number };
const loadPending = (): PendingUser[] => { try { return JSON.parse(localStorage.getItem("uni_pending") || "[]"); } catch { return []; } };
const savePending = (p: PendingUser[]) => localStorage.setItem("uni_pending", JSON.stringify(p));
type ApprovedCred = { id: string; pw: string };
const loadApprovedCreds = (): ApprovedCred[] => { try { return JSON.parse(localStorage.getItem("uni_approved_creds") || "[]"); } catch { return []; } };
const saveApprovedCreds = (a: ApprovedCred[]) => localStorage.setItem("uni_approved_creds", JSON.stringify(a));
const checkLogin = (id: string, pw: string): "ok" | "pending" | "wrong" => {
  const admin = loadCreds();
  if ((admin.id || "1234") === id && (admin.pw || "1234") === pw) return "ok";
  const approved = loadApprovedCreds();
  if (approved.find(c => c.id === id && c.pw === pw)) return "ok";
  const pending = loadPending();
  if (pending.find(p => p.id === id)) return "pending";
  return "wrong";
};
const getCurrentUserId = () => localStorage.getItem("uni_current_user_id") || "";
const setCurrentUserId = (id: string) => localStorage.setItem("uni_current_user_id", id);
const isAdminId = (id: string) => { const c = loadCreds(); return id === (c.id || "1234") || (!id && !c.id); };
const isAdminProfile = () => isAdminId(getCurrentUserId());

type Contact = { id: string; name: string; role: string; phone: string };
type Message = { id: string; from: string; text: string; time: number };

type Notif = { id: string; title: string; body: string; time: number; read: boolean };
const notifKey = (uid: string) => `uni_notifs_${uid}`;
const loadNotifs = (uid: string): Notif[] => { try { return JSON.parse(localStorage.getItem(notifKey(uid)) || "[]"); } catch { return []; } };
const saveNotifs = (uid: string, n: Notif[]) => localStorage.setItem(notifKey(uid), JSON.stringify(n));
const pushNotif = (uid: string, title: string, body: string) => {
  const existing = loadNotifs(uid);
  saveNotifs(uid, [{ id: Date.now().toString(), title, body, time: Date.now(), read: false }, ...existing]);
};

// Shared user registry — everyone who has set up a profile appears here
const loadUsers = (): Contact[] => { try { return JSON.parse(localStorage.getItem("uni_users") || "[]"); } catch { return []; } };
const saveUsers = (u: Contact[]) => localStorage.setItem("uni_users", JSON.stringify(u));

const registerUser = (id: string, name: string, role: string) => {
  if (!name.trim()) return;
  const users = loadUsers();
  const existing = users.findIndex(u => u.id === id);
  const entry: Contact = { id, name: name.trim(), role: role.trim(), phone: "" };
  if (existing >= 0) users[existing] = entry; else users.push(entry);
  saveUsers(users);
};

function getWeekDays(d: Date): Date[] {
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 5 }, (_, i) => { const dd = new Date(mon); dd.setDate(mon.getDate() + i); return dd; });
}

// ── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ dark, lang, onLogin, lockedId, onRegister }: { dark: boolean; lang: string; onLogin: () => void; lockedId?: string; onRegister?: () => void }) {
  const [id, setId] = useState(lockedId ?? "");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const t = getLang(lang);

  const bg = dark ? "bg-[#0f172a]" : "bg-[#111111]";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const labelColor = dark ? "text-slate-300" : "text-slate-600";
  const inputBg = dark ? "bg-[#0f172a] border-slate-600 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-800";

  const [pending, setPending] = useState(false);
  const handleLogin = () => {
    const result = checkLogin(id, pw);
    if (result === "ok") { setCurrentUserId(id); setLoggedIn(true); onLogin(); }
    else if (result === "pending") setPending(true);
    else setError(t.wrongCredentials);
  };
  if (pending) return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 z-50 ${dark ? "bg-[#0f172a]" : "bg-[#111111]"}`} style={{ borderRadius: 32 }}>
      <div className="w-20 h-20 rounded-full bg-[#dc2626]/10 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={1.8} className="w-10 h-10"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg>
      </div>
      <div className="text-center gap-2 flex flex-col">
        <p className="text-white font-bold text-xl">{t.pendingTitle}</p>
        <p className="text-slate-400 text-sm leading-relaxed">{t.pendingDesc}</p>
      </div>
      <button onClick={() => setPending(false)} className="mt-2 text-[#dc2626] text-sm font-semibold">{t.back}</button>
    </div>
  );

  return (
    <div className={`absolute inset-0 flex flex-col ${bg} z-50`} style={{ borderRadius: 32 }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Login image - profil boyutu */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 shadow-xl">
            <img src={loginImage} alt="Unirobotics" className="w-full h-full object-cover"/>
          </div>
          <p className="text-white font-bold text-2xl tracking-wide">Unirobotics</p>
          <p className="text-slate-400 text-sm">{t.employeeLogin}</p>
        </div>

        {/* Form */}
        <div className={`w-full ${cardBg} rounded-2xl px-5 py-6 flex flex-col gap-4 shadow-xl`}>
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${labelColor}`}>{t.employeeId}</label>
            <input
              type="text" value={id}
              onChange={lockedId ? undefined : e => { setId(e.target.value); setError(""); }}
              readOnly={!!lockedId}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder={t.enterIdPlaceholder}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputBg} ${lockedId ? "opacity-60 cursor-default" : ""}`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${labelColor}`}>{t.password}</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={pw} onChange={e => { setPw(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder={t.enterPwPlaceholder}
                className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputBg}`}
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button onClick={handleLogin}
            className="w-full bg-[#111111] text-white border-b border-white/10 rounded-xl py-3 text-sm font-bold active:scale-95 transition-all mt-1 shadow-md">
            {t.login}
          </button>
          {!lockedId && onRegister && (
            <button onClick={onRegister}
              className="w-full border-2 border-[#dc2626] text-[#dc2626] rounded-xl py-3 text-sm font-bold active:scale-95 transition-all">
              {t.register}
            </button>
          )}
        </div>
        {!lockedId && <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"} text-center`}>
          {t.defaultHint} <span className="font-bold">1234</span> · {t.password} <span className="font-bold">1234</span>
        </p>}
      </div>
    </div>
  );
}

// ── Register Screen ───────────────────────────────────────────────────────────
function RegisterScreen({ dark, lang, onBack, onRegistered }: { dark: boolean; lang: string; onBack: () => void; onRegistered: () => void }) {
  const t = getLang(lang);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [unit, setUnit] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const bg = dark ? "bg-[#0f172a]" : "bg-[#111111]";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const labelColor = dark ? "text-slate-300" : "text-slate-600";
  const inputBg = dark ? "bg-[#0f172a] border-slate-600 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-800";

  const handleRegister = () => {
    if (!name.trim() || !id.trim() || !pw || !pw2) { setError(t.fillAll); return; }
    if (pw !== pw2) { setError(t.passwordMismatch); return; }
    const pending = loadPending();
    const approved = loadApprovedCreds();
    const admin = loadCreds();
    const idTaken = pending.find(p => p.id === id.trim()) || approved.find(c => c.id === id.trim()) || (admin.id || "1234") === id.trim();
    if (idTaken) { setError(t.idTaken); return; }
    savePending([...pending, { id: id.trim(), name: name.trim(), pw, unit: unit.trim(), createdAt: Date.now() }]);
    setSuccess(true);
    setTimeout(() => onRegistered(), 1400);
  };

  return (
    <div className={`absolute inset-0 flex flex-col ${bg} z-50`} style={{ borderRadius: 32 }}>
      <div className="flex items-center px-5 pt-5 pb-2">
        <button onClick={onBack} className="p-1 text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-col items-center gap-2 mb-1">
          <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center overflow-hidden">
            <img src={logo} alt="Unirobotics" className="w-full h-full object-contain"/>
          </div>
          <p className="text-white font-bold text-xl tracking-wide">Unirobotics</p>
          <p className="text-slate-400 text-sm">{t.registerTitle}</p>
        </div>

        <div className={`w-full ${cardBg} rounded-2xl px-5 py-6 flex flex-col gap-4 shadow-xl`}>
          {[
            { label: t.fullName, value: name, set: setName, placeholder: t.fullNamePlaceholder, type: "text" },
            { label: t.employeeId, value: id, set: setId, placeholder: t.enterIdPlaceholder, type: "text" },
            { label: t.unit, value: unit, set: setUnit, placeholder: t.unitPlaceholder, type: "text" },
          ].map(f => (
            <div key={f.label} className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold ${labelColor}`}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={e => { f.set(e.target.value); setError(""); }}
                placeholder={f.placeholder}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputBg}`}/>
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${labelColor}`}>{t.newPassword}</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={pw}
                onChange={e => { setPw(e.target.value); setError(""); }}
                placeholder={t.newPasswordPlaceholder}
                className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputBg}`}/>
              <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${labelColor}`}>{t.confirmPassword}</label>
            <input type="password" value={pw2} onChange={e => { setPw2(e.target.value); setError(""); }}
              placeholder={t.confirmPwPlaceholder}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputBg}`}/>
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button onClick={handleRegister}
            className={`w-full rounded-xl py-3 text-sm font-bold active:scale-95 transition-all mt-1 shadow-md ${success ? "bg-amber-500 text-white" : "bg-[#dc2626] text-white"}`}>
            {success ? t.pendingTitle : t.register}
          </button>

          <button onClick={onBack} className={`text-xs text-center ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {t.alreadyHaveAccount} <span className="text-[#dc2626] font-semibold">{t.signIn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const loadLang = () => localStorage.getItem("uni_lang") || "tr";
const saveLang = (l: string) => localStorage.setItem("uni_lang", l);

const TR = {
  appName: "Unirobotics", settings: "Ayarlar", logout: "Çıkış", back: "Geri",
  todayMenu: "Günün Menüsü", weeklyMenu: "Haftalık menü için tıkla →",
  noMenu: "Bugün için menü girilmemiş.", total: "Toplam",
  canteen: "Yemekhane", directory: "Rehber", messages: "Mesajlar",
  edit: "Düzenle", addShortcut: "Kısayol Ekle",
  darkMode: "Karanlık Mod", darkModeDesc: "Koyu tema kullan",
  appearance: "Görünüm", language: "Dil Seçenekleri",
  turkish: "Türkçe", english: "İngilizce", changeLang: "Dili Değiştir",
  sessionTimeout: "Oturum Zamanaşımı", never: "Asla",
  credentials: "Giriş Bilgilerini Değiştir", employeeId: "Çalışan ID", password: "Şifre",
  save: "Kaydet", saved: "Kaydedildi ✓",
  login: "Giriş Yap", loginTitle: "Çalışan Girişi",
  menuMgmt: "Menü Yönetimi", weeklyTitle: "Yemekhane",
  // LoginScreen
  employeeLogin: "Çalışan Girişi", enterIdPlaceholder: "ID numaranızı girin",
  enterPwPlaceholder: "Şifrenizi girin", wrongCredentials: "Hatalı ID veya şifre.",
  defaultHint: "Varsayılan: ID",
  // Drawer profile
  profileEditHint: "Düzenlemek için tıkla", nameSurname: "Ad Soyad",
  employeeIdLabel: "Çalışan ID", cancel: "İptal",
  unit: "Birim", unitPlaceholder: "Biriminizi girin",
  profileTitle: "Profil",
  // Drawer labels
  profile: "Profil", announcements: "Duyurular", leaveRequests: "İzin Talepleri",
  myDocuments: "Belgelerim", workHours: "Çalışma Saatleri", contact: "İletişim",
  qrCode: "Karekodum", feedback: "Geri Bildirim", workLocation: "İş Yeri Konumu",
  // Admin panel
  meals: "Yemekler", clear: "Temizle", noMealsYet: "Henüz yemek eklenmedi.",
  addMeal: "Yemek Ekle", mealName: "Yemek adı", calories: "Kalori", add: "Ekle",
  totalCalories: "Toplam Kalori", menuNotEntered: "Menü girilmemiş.",
  todaysMenu: "Günün Menüsü",
  // Rehber
  noOtherUsers: "Başka kullanıcı henüz kayıt olmamış.", noResults: "Sonuç bulunamadı.",
  search: "Ara...",
  // Messages / Chat
  noMessagesYet: "Henüz mesaj yok. İlk mesajı sen gönder!",
  addToRehberHint: "Rehbere kişi ekleyerek mesajlaşabilirsin.",
  typeMessage: "Mesaj yaz...", noMessage: "Mesaj yok",
  // ShortcutPicker
  manageShortcuts: "Ana sayfaya eklemek istediğin kısayolları seç",
  shortcutAdded: "Ekli ✓",
  // QuickCarousel
  editLabel: "Düzenle",
  // Register
  register: "Kaydol", registerTitle: "Hesap Oluştur", alreadyHaveAccount: "Zaten hesabın var mı?",
  signIn: "Giriş Yap", confirmPassword: "Şifre Tekrar", confirmPwPlaceholder: "Şifrenizi tekrar girin",
  passwordMismatch: "Şifreler eşleşmiyor.", idTaken: "Bu ID zaten kayıtlı.",
  fillAll: "Tüm alanları doldurun.", registerSuccess: "Kayıt başarılı!",
  fullName: "Ad Soyad", fullNamePlaceholder: "Adınızı ve soyadınızı girin",
  newPassword: "Yeni Şifre", newPasswordPlaceholder: "Şifrenizi belirleyin",
  // Pending / Admin approval
  pendingTitle: "Onay Bekleniyor", pendingDesc: "Hesabınız yönetici onayını bekliyor. Onaylandıktan sonra giriş yapabilirsiniz.",
  pendingApprovals: "Onay Bekleyenler", approve: "Onayla", reject: "Reddet",
  noApprovals: "Bekleyen kayıt yok.", notifications: "Bildirimler",
};
const EN = {
  appName: "Unirobotics", settings: "Settings", logout: "Logout", back: "Back",
  todayMenu: "Today's Menu", weeklyMenu: "Tap for weekly menu →",
  noMenu: "No menu for today.", total: "Total",
  canteen: "Canteen", directory: "Directory", messages: "Messages",
  edit: "Edit", addShortcut: "Add Shortcut",
  darkMode: "Dark Mode", darkModeDesc: "Use dark theme",
  appearance: "Appearance", language: "Language Options",
  turkish: "Turkish", english: "English", changeLang: "Change Language",
  sessionTimeout: "Session Timeout", never: "Never",
  credentials: "Change Login Credentials", employeeId: "Employee ID", password: "Password",
  save: "Save", saved: "Saved ✓",
  login: "Login", loginTitle: "Employee Login",
  menuMgmt: "Menu Management", weeklyTitle: "Canteen",
  // LoginScreen
  employeeLogin: "Employee Login", enterIdPlaceholder: "Enter your ID",
  enterPwPlaceholder: "Enter your password", wrongCredentials: "Wrong ID or password.",
  defaultHint: "Default: ID",
  // Drawer profile
  profileEditHint: "Tap to edit", nameSurname: "Full Name",
  employeeIdLabel: "Employee ID", cancel: "Cancel",
  unit: "Unit", unitPlaceholder: "Enter your unit",
  profileTitle: "Profile",
  // Drawer labels
  profile: "Profile", announcements: "Announcements", leaveRequests: "Leave Requests",
  myDocuments: "My Documents", workHours: "Work Hours", contact: "Contact",
  qrCode: "QR Code", feedback: "Feedback", workLocation: "Work Location",
  // Admin panel
  meals: "Meals", clear: "Clear", noMealsYet: "No meals added yet.",
  addMeal: "Add Meal", mealName: "Meal name", calories: "Calories", add: "Add",
  totalCalories: "Total Calories", menuNotEntered: "Menu not entered.",
  todaysMenu: "Today's Menu",
  // Rehber
  noOtherUsers: "No other users registered yet.", noResults: "No results found.",
  search: "Search...",
  // Messages / Chat
  noMessagesYet: "No messages yet. Send the first one!",
  addToRehberHint: "Add contacts to the directory to start messaging.",
  typeMessage: "Type a message...", noMessage: "No message",
  // ShortcutPicker
  manageShortcuts: "Select shortcuts to add to the home screen",
  shortcutAdded: "Added ✓",
  // QuickCarousel
  editLabel: "Edit",
  // Register
  register: "Register", registerTitle: "Create Account", alreadyHaveAccount: "Already have an account?",
  signIn: "Sign In", confirmPassword: "Confirm Password", confirmPwPlaceholder: "Re-enter your password",
  passwordMismatch: "Passwords do not match.", idTaken: "This ID is already registered.",
  fillAll: "Please fill in all fields.", registerSuccess: "Registration successful!",
  fullName: "Full Name", fullNamePlaceholder: "Enter your full name",
  newPassword: "New Password", newPasswordPlaceholder: "Choose a password",
  // Pending / Admin approval
  pendingTitle: "Awaiting Approval", pendingDesc: "Your account is pending admin approval. You can log in once approved.",
  pendingApprovals: "Pending Approvals", approve: "Approve", reject: "Reject",
  noApprovals: "No pending registrations.", notifications: "Notifications",
};
type Lang = typeof TR;
const getLang = (l: string): Lang => l === "en" ? EN : TR;
const loadTimeout = () => localStorage.getItem("uni_timeout") || "never";
const saveTimeout = (t: string) => localStorage.setItem("uni_timeout", t);

// ── Settings Screen ───────────────────────────────────────────────────────────
function SettingsScreen({ dark, onToggleDark, onClose, onLangChange }: { dark: boolean; onToggleDark: () => void; onClose: () => void; onLangChange: (l: string) => void }) {
  const creds = loadCreds();
  const [newId, setNewId] = useState(creds.id || "1234");
  const [newPw, setNewPw] = useState(creds.pw || "1234");
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState(loadLang);
  const [timeout, setTimeout_] = useState(loadTimeout);
  const [langSaved, setLangSaved] = useState(false);

  const t = getLang(lang);
  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-400" : "text-slate-500";
  const inputCls = dark ? "bg-[#0f172a] border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800";
  const selectCls = dark ? "bg-[#0f172a] border-slate-600 text-white" : "bg-white border-slate-200 text-slate-800";

  const saveCredentials = () => {
    saveCreds({ id: newId, pw: newPw });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyLang = () => {
    saveLang(lang);
    onLangChange(lang);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2000);
  };

  const timeoutOptions = [
    { value: "never", label: lang === "en" ? "Never"      : "Asla" },
    { value: "15m",   label: lang === "en" ? "15 Minutes" : "15 Dakika" },
    { value: "30m",   label: lang === "en" ? "30 Minutes" : "30 Dakika" },
    { value: "1h",    label: lang === "en" ? "1 Hour"     : "1 Saat" },
    { value: "4h",    label: lang === "en" ? "4 Hours"    : "4 Saat" },
  ];

  return (
    <div className={`absolute inset-0 flex flex-col z-50 ${bg}`} style={{ borderRadius: 32 }}>
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={onClose} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">{t.settings}</span>
        <div className="w-8"/>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        {/* Dark mode */}
        <div className={`${cardBg} rounded-2xl px-5 py-4 shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${textSub}`}>{t.appearance}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${textMain}`}>{t.darkMode}</p>
              <p className={`text-xs ${textSub} mt-0.5`}>{t.darkModeDesc}</p>
            </div>
            <button onClick={onToggleDark}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${dark ? "bg-[#dc2626]" : "bg-slate-200"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${dark ? "translate-x-6" : "translate-x-0"}`}/>
            </button>
          </div>
        </div>

        {/* Language */}
        <div className={`${cardBg} rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-3`}>
          <div className="flex items-center gap-2 mb-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-5 h-5 ${textSub}`}><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
            <p className={`text-xs font-semibold uppercase tracking-wide ${textSub}`}>{t.language}</p>
          </div>
          {[{ value: "tr", label: t.turkish }, { value: "en", label: t.english }].map(opt => (
            <button key={opt.value} onClick={() => setLang(opt.value)}
              className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${lang === opt.value ? "border-[#dc2626]" : (dark ? "border-slate-500" : "border-slate-300")}`}>
                {lang === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"/>}
              </div>
              <span className={`text-sm font-medium ${textMain}`}>{opt.label}</span>
            </button>
          ))}
          <button onClick={applyLang}
            className={`mt-1 w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95 ${langSaved ? "bg-green-500 text-white" : "bg-[#dc2626] text-white"}`}>
            {langSaved ? t.saved : t.changeLang}
          </button>
        </div>

        {/* Session timeout */}
        <div className={`${cardBg} rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-3`}>
          <div className="flex items-center gap-2 mb-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-5 h-5 ${textSub}`}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg>
            <p className={`text-xs font-semibold uppercase tracking-wide ${textSub}`}>{t.sessionTimeout}</p>
          </div>
          <select value={timeout} onChange={e => { setTimeout_(e.target.value); saveTimeout(e.target.value); }}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${selectCls}`}>
            {timeoutOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Change credentials */}
        <div className={`${cardBg} rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-3`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${textSub}`}>{t.credentials}</p>
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-medium ${textSub}`}>{t.employeeId}</label>
            <input type="text" value={newId} onChange={e => setNewId(e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputCls}`}/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-medium ${textSub}`}>{t.password}</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputCls}`}/>
          </div>
          <button onClick={saveCredentials}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95 ${saved ? "bg-green-500 text-white" : "bg-[#111111] text-white border-b border-white/10"}`}>
            {saved ? t.saved : t.save}
          </button>
        </div>

        <p className={`text-center text-xs pb-2 ${textSub}`}>v1.0.0</p>
      </div>
    </div>
  );
}

// ── Profile Screen ────────────────────────────────────────────────────────────
function ProfileScreen({ dark, lang, onBack, onLogout }: { dark: boolean; lang: string; onBack: () => void; onLogout: () => void }) {
  const t = getLang(lang);
  const raw = loadProfile();
  const [name, setName] = useState(raw.name || "");
  const [id, setId] = useState(raw.id || "");
  const [unit, setUnit] = useState(raw.unit || "");
  const [avatar, setAvatar] = useState(raw.avatar || ""); // Yeni: Avatar state'i
  const [editing, setEditing] = useState(false);
  const [tmpName, setTmpName] = useState(name);
  const [tmpId, setTmpId] = useState(id);
  const [tmpUnit, setTmpUnit] = useState(unit);
  const fileInputRef = useRef<HTMLInputElement>(null); // Yeni: Dosya seçici referansı

  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-400" : "text-slate-500";
  const inputCls = dark ? "bg-[#0f172a] border-slate-600 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-800";
  const rowBorder = dark ? "border-slate-700" : "border-slate-100";

  const saveEdit = () => {
    setName(tmpName); setId(tmpId); setUnit(tmpUnit);
    saveProfile({ ...raw, name: tmpName, id: tmpId, unit: tmpUnit }); // Avatarı silmemek için ...raw eklendi
    registerUser(tmpId || Date.now().toString(), tmpName, tmpUnit);
    setEditing(false);
  };

  // Yeni: Fotoğraf yükleme fonksiyonu
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        const existing = loadProfile();
        saveProfile({ ...existing, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`absolute inset-0 flex flex-col z-50 ${bg}`} style={{ borderRadius: 32 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={onBack} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">{t.profileTitle}</span>
        <button onClick={onLogout} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        {/* Photo + name/id card */}
        <div className={`${cardBg} rounded-2xl px-5 py-5 flex items-center gap-4 shadow-sm`}>
          {/* Tıklanabilir Avatar Alanı */}
          <div onClick={() => fileInputRef.current?.click()} className="relative w-16 h-16 rounded-full bg-[#111111] flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-[#dc2626]/30 cursor-pointer group">
            <img src={avatar || defaultPP} alt="Unirobotics" className={`${avatar ? "w-full h-full object-cover" : "w-4/5 h-4/5 object-contain"}`}/>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-white text-[10px] font-bold">Değiştir</span>
            </div>
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
          
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-base leading-tight ${textMain} truncate`}>{name || t.nameSurname}</p>
            <p className={`text-sm mt-0.5 ${textSub} truncate`}>{id || t.employeeIdLabel}</p>
          </div>
          <button onClick={() => { setTmpName(name); setTmpId(id); setTmpUnit(unit); setEditing(true); }}
            className="text-[#dc2626] p-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>

        {/* Info rows */}
        <div className={`${cardBg} rounded-2xl shadow-sm overflow-hidden`}>
          {[
            { label: t.unit, value: unit },
            { label: t.employeeId, value: id },
          ].map(({ label, value }, i, arr) => (
            <div key={label} className={`flex items-center justify-between px-5 py-4 ${i < arr.length - 1 ? `border-b ${rowBorder}` : ""}`}>
              <span className={`text-sm font-semibold ${textSub} w-28 flex-shrink-0`}>{label}:</span>
              <span className={`text-sm ${textMain} flex-1 text-right`}>{value || "—"}</span>
            </div>
          ))}
        </div>

        {/* Edit modal */}
        {editing && (
          <div className="absolute inset-0 z-10 flex items-end" style={{ borderRadius: 32 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setEditing(false)} style={{ borderRadius: 32 }}/>
            <div className={`relative w-full ${cardBg} rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-3 shadow-2xl`}>
              <p className={`text-sm font-bold mb-1 ${textMain}`}>{t.edit}</p>
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-medium ${textSub}`}>{t.nameSurname}</label>
                <input value={tmpName} onChange={e => setTmpName(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputCls}`}/>
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-medium ${textSub}`}>{t.employeeIdLabel}</label>
                <input value={tmpId} onChange={e => setTmpId(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputCls}`}/>
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-medium ${textSub}`}>{t.unit}</label>
                <input value={tmpUnit} onChange={e => setTmpUnit(e.target.value)} placeholder={t.unitPlaceholder}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputCls}`}/>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setEditing(false)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${dark ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-700"}`}>{t.cancel}</button>
                <button onClick={saveEdit}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-[#dc2626] text-white">{t.save}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────
const drawerItems = [
  { label: "Profil", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  { label: "Rehber", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><rect x="2" y="3" width="16" height="18" rx="2"/><path d="M6 7h8M6 11h8M6 15h5"/><path d="M19 8h1a2 2 0 0 1 0 4h-1"/><path d="M19 14h1a2 2 0 0 1 0 4h-1"/></svg> },
  { label: "Mesajlar", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { label: "Yemekhane", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
  { label: "Duyurular", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path d="M22 3L12 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2l1.5 4h2L8 16h4l10 5V3z" strokeLinejoin="round"/></svg> },
  { label: "İzin Talepleri", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg> },
  { label: "Belgelerim", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg> },
  { label: "Çalışma Saatleri", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg> },
  { label: "Karekodum", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h.01M18 14h.01M14 18h4v3M21 18v.01" strokeLinecap="round" strokeWidth={2}/></svg> },
  { label: "Geri Bildirim", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { label: "İş Yeri Konumu", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { label: "Ayarlar", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { label: "Çıkış", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> },
];

const DRAWER_LABEL_MAP: Record<string, keyof typeof TR> = {
  "Profil": "profile", "Rehber": "directory", "Mesajlar": "messages",
  "Yemekhane": "canteen", "Duyurular": "announcements", "İzin Talepleri": "leaveRequests",
  "Belgelerim": "myDocuments", "Çalışma Saatleri": "workHours", "İletişim": "contact",
  "Karekodum": "qrCode", "Geri Bildirim": "feedback", "İş Yeri Konumu": "workLocation",
  "Ayarlar": "settings", "Çıkış": "logout",
};

const ADMIN_ONLY_ITEMS = ["Menü Yönetimi"];
const LOGGED_IN_ONLY_ITEMS = ["Profil", "Rehber", "Mesajlar", "İzin Talepleri", "Belgelerim", "Çalışma Saatleri", "Karekodum", "Geri Bildirim", "Çıkış"];
const USER_HIDDEN_ITEMS: string[] = [];

function Drawer({ open, dark, lang, isAdmin, loggedIn, onClose, onMenuYonetimi, onSettings, onLogout, onRehber, onMessages, onProfile, onWeekly, onFeedback }: {
  open: boolean; dark: boolean; lang: string; isAdmin: boolean; loggedIn: boolean; onClose: () => void;
  onMenuYonetimi: () => void; onSettings: () => void; onLogout: () => void;
  onRehber: () => void; onMessages: () => void; onProfile: () => void; onWeekly: () => void; onFeedback: () => void;
}) {
  const t = getLang(lang);
  const raw = loadProfile();
  const name = raw.name || t.nameSurname;
  const id = raw.id || t.employeeIdLabel;
  const avatar = raw.avatar || "";

  const bg = dark ? "bg-[#1e293b]" : "bg-white";
  const itemText = dark ? "text-slate-200" : "text-slate-700";
  const iconColor = dark ? "text-slate-400" : "text-slate-500";
  const hoverBg = dark ? "hover:bg-slate-700/50 active:bg-slate-700" : "hover:bg-slate-50 active:bg-slate-100";

  return (
    <>
      <div onClick={onClose}
        className={`absolute inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ borderRadius: 32 }}/>

      <div className={`absolute top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-300 shadow-2xl ${bg}`}
        style={{ width: "78%", borderRadius: "32px 0 0 32px", transform: open ? "translateX(0)" : "translateX(-100%)" }}>

        <div className="bg-[#111111] px-5 pt-8 pb-5 flex-shrink-0 border-t-4 border-[#dc2626]">
          {loggedIn && (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#111111] flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={avatar || defaultPP} alt="Unirobotics" className={`${avatar ? "w-full h-full object-cover" : "w-4/5 h-4/5 object-contain"}`}/>
              </div>
              <div>
                <p className="text-white font-bold text-base leading-tight">{name}</p>
                <p className="text-slate-400 text-sm mt-0.5">{id}</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "none" }}>
          {drawerItems.filter(item => (isAdmin || !ADMIN_ONLY_ITEMS.includes(item.label)) && (loggedIn || !LOGGED_IN_ONLY_ITEMS.includes(item.label))).map((item) => {
            const isLogout = item.label === "Çıkış";
            const isSettings = item.label === "Ayarlar";
            return (
              <button key={item.label}
                onClick={() => {
                  if (isSettings) { onClose(); onSettings(); }
                  else if (isLogout) { onClose(); onLogout(); }
                  else if (item.label === "İş Yeri Konumu") { onClose(); window.open("https://maps.google.com", "_blank"); }
                  else if (item.label === "Profil") { onClose(); onProfile(); }
                  else if (item.label === "Yemekhane") { onClose(); onWeekly(); }
                  else if (item.label === "Rehber") { onClose(); onRehber(); }
                  else if (item.label === "Mesajlar") { onClose(); onMessages(); }
                  else if (item.label === "Geri Bildirim") { onClose(); onFeedback(); }
                  else onClose();
                }}
                className={`w-full flex items-center gap-4 px-6 py-3.5 transition-colors ${isLogout ? "hover:bg-red-50 active:bg-red-100" : hoverBg}`}>
                <span className={isLogout ? "text-red-500" : iconColor}>{item.icon}</span>
                <span className={`text-sm font-medium ${isLogout ? "text-red-500" : itemText}`}>{t[DRAWER_LABEL_MAP[item.label]] ?? item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Admin Approval Screen ─────────────────────────────────────────────────────
function AdminApprovalScreen({ dark, lang, onClose }: { dark: boolean; lang: string; onClose: () => void }) {
  const t = getLang(lang);
  const [pending, setPending] = useState<PendingUser[]>(loadPending);

  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-400" : "text-slate-500";

  const approve = (user: PendingUser) => {
    const approved = loadApprovedCreds();
    saveApprovedCreds([...approved, { id: user.id, pw: user.pw }]);
    registerUser(user.id, user.name, user.unit);
    pushNotif(user.id, "Hesabınız Onaylandı", "Hesabınız yönetici tarafından onaylandı. Giriş yapabilirsiniz.");
    const next = pending.filter(p => p.id !== user.id);
    savePending(next);
    setPending(next);
  };

  const reject = (user: PendingUser) => {
    const next = pending.filter(p => p.id !== user.id);
    savePending(next);
    setPending(next);
  };

  return (
    <div className={`absolute inset-0 flex flex-col z-50 ${bg}`} style={{ borderRadius: 32 }}>
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={onClose} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">{t.pendingApprovals}</span>
        <div className="w-8"/>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {pending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-12 h-12 ${textSub}`}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p className={`text-sm ${textSub}`}>{t.noApprovals}</p>
          </div>
        )}
        {pending.map(u => (
          <div key={u.id} className={`${cardBg} rounded-2xl px-4 py-4 shadow-sm flex flex-col gap-3`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#dc2626]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[#dc2626] font-bold">{u.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${textMain} truncate`}>{u.name}</p>
                <p className={`text-xs ${textSub}`}>{u.id}{u.unit ? ` · ${u.unit}` : ""}</p>
              </div>
              <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">{t.pendingTitle}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => reject(u)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"} active:scale-95 transition-all`}>{t.reject}</button>
              <button onClick={() => approve(u)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#dc2626] text-white active:scale-95 transition-all">{t.approve}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Menu Card ─────────────────────────────────────────────────────────────────
function MenuCard({ title, date, meals, dark, lang = "tr" }: { title: string; date: Date; meals: Meal[]; dark: boolean; lang?: string }) {
  const t = getLang(lang);
  const total = meals.reduce((s, m) => s + m.kal, 0);
  const cardBg = dark ? "bg-[#1e3a6e]" : "bg-[#1a1a1a]";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-300" : "text-slate-700";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const border = dark ? "border-white/10" : "border-slate-300/50";

  return (
    <div className={`${cardBg} rounded-2xl px-5 py-4 mb-3`}>
      <p className={`text-center text-sm italic mb-1 ${textMuted}`}>{fmtDate(date, lang)}</p>
      <h3 className={`text-center text-base font-bold mb-3 ${textMain}`}>{title}</h3>
      {meals.length === 0 ? (
        <p className={`text-center text-sm py-2 ${textMuted}`}>{t.menuNotEntered}</p>
      ) : (
        <>
          {meals.map((m, i) => (
            <div key={i} className={`flex justify-between py-2.5 border-b last:border-0 ${border}`}>
              <span className={`text-sm ${textSub}`}>{m.name}:</span>
              <span className={`text-sm font-medium ${textSub}`}>{m.kal} KAL</span>
            </div>
          ))}
          <div className="mt-3 pt-2 text-right">
            <span className={`text-sm font-bold ${textMain}`}>{t.totalCalories}: {total} KAL</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Notifications Screen ──────────────────────────────────────────────────────
function NotificationsScreen({ dark, lang, uid, onBack }: { dark: boolean; lang: string; uid: string; onBack: () => void }) {
  const [notifs, setNotifs] = useState<Notif[]>(() => loadNotifs(uid));
  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-400" : "text-slate-500";

  useEffect(() => {
    const read = notifs.map(n => ({ ...n, read: true }));
    saveNotifs(uid, read);
    setNotifs(read);
  }, []);

  const deleteNotif = (id: string) => {
    const next = notifs.filter(n => n.id !== id);
    saveNotifs(uid, next);
    setNotifs(next);
  };

  const fmtTime = (t: number) => {
    const d = new Date(t);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  return (
    <div className={`absolute inset-0 flex flex-col z-50 ${bg}`} style={{ borderRadius: 32 }}>
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={onBack} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">Bildirimler</span>
        <div className="w-8"/>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {notifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-12 h-12 ${textSub}`}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <p className={`text-sm ${textSub}`}>Bildirim yok</p>
          </div>
        )}
        {notifs.map(n => (
          <div key={n.id} className={`${cardBg} rounded-2xl px-4 py-4 shadow-sm flex gap-3`}>
            <div className="w-9 h-9 rounded-full bg-[#dc2626]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2} className="w-4 h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${textMain}`}>{n.title}</p>
              <p className={`text-xs ${textSub} mt-0.5 leading-relaxed`}>{n.body}</p>
              <p className={`text-[10px] mt-1.5 ${textSub}`}>{fmtTime(n.time)}</p>
            </div>
            <button onClick={() => deleteNotif(n.id)} className={`${textSub} flex-shrink-0 self-start mt-0.5`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weekly Screen ─────────────────────────────────────────────────────────────
function WeeklyScreen({ dark, lang, onBack }: { dark: boolean; lang: string; onBack: () => void }) {
  const t = getLang(lang);
  const today = new Date();
  const weekDays = getWeekDays(today);
  const defaultIdx = today.getDay() >= 1 && today.getDay() <= 5 ? today.getDay() - 1 : 0;
  const [activeIdx, setActiveIdx] = useState(defaultIdx);
  const [menuData] = useState<MenuData>(loadMenu);

  const selectedDay = weekDays[activeIdx];
  const key = toKey(selectedDay);
  const dayMenu: DayMenu = menuData[key] || { normal: [] };
  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const daysShort = lang === "en" ? DAYS_SHORT_EN : DAYS_SHORT_TR;

  return (
    <div className={`absolute inset-0 flex flex-col z-40 ${bg}`} style={{ borderRadius: 32 }}>
      <div className="bg-[#111111] text-white px-5 pt-4 pb-0" style={{ borderRadius: "32px 32px 0 0" }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <span className="font-bold text-base">{t.weeklyTitle}</span>
          <div className="w-8"/>
        </div>
        <div className="flex">
          {daysShort.map((day, i) => (
            <button key={day} onClick={() => setActiveIdx(i)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeIdx === i ? "text-white border-b-2 border-[#dc2626]" : "text-slate-400 border-b-2 border-transparent"}`}>
              {day}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>
        <MenuCard title={t.todaysMenu} date={selectedDay} meals={dayMenu.normal} dark={dark} lang={lang} />
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ dark, lang, onClose }: { dark: boolean; lang: string; onClose: () => void }) {
  const t = getLang(lang);
  const [menuData, setMenuData] = useState<MenuData>(loadMenu);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newName, setNewName] = useState("");
  const [newKal, setNewKal] = useState("");

  const key = toKey(selectedDate);
  const meals = menuData[key]?.normal || [];
  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-300" : "text-slate-700";
  const textMuted = dark ? "text-slate-400" : "text-slate-400";
  const inputCls = dark ? "bg-[#0f172a] border-slate-600 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-800";

  const changeDay = (delta: number) => { const d = new Date(selectedDate); d.setDate(d.getDate() + delta); setSelectedDate(d); };
  const update = (next: DayMenu) => { const u = { ...menuData, [key]: next }; setMenuData(u); saveMenu(u); };
  const addMeal = () => {
    if (!newName.trim() || !newKal) return;
    const c = menuData[key] || { normal: [] };
    update({ normal: [...c.normal, { name: newName.trim(), kal: Number(newKal) }] });
    setNewName(""); setNewKal("");
  };
  const removeMeal = (idx: number) => { const c = menuData[key] || { normal: [] }; update({ normal: c.normal.filter((_, i) => i !== idx) }); };

  return (
    <div className={`absolute inset-0 flex flex-col z-50 ${bg}`} style={{ borderRadius: 32 }}>
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={onClose} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">{t.menuMgmt}</span>
        <div className="w-8"/>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        <div className={`${cardBg} rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm`}>
          <button onClick={() => changeDay(-1)} className={`p-2 rounded-xl ${dark ? "bg-slate-700" : "bg-slate-100"} text-[#dc2626]`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="text-center">
            <p className={`text-xs ${textMuted}`}>{(lang === "en" ? DAYS_EN : DAYS_TR)[selectedDate.getDay()]}</p>
            <p className={`text-base font-bold text-[#dc2626]`}>{selectedDate.getDate()} {(lang === "en" ? MONTHS_EN : MONTHS_TR)[selectedDate.getMonth()]} {selectedDate.getFullYear()}</p>
          </div>
          <button onClick={() => changeDay(1)} className={`p-2 rounded-xl ${dark ? "bg-slate-700" : "bg-slate-100"} text-[#dc2626]`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <div className={`${cardBg} rounded-2xl shadow-sm px-4 py-3`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${textMain}`}>{t.meals}</span>
            {meals.length > 0 && <button onClick={() => update({ normal: [] })} className="text-xs text-red-400 font-medium">{t.clear}</button>}
          </div>
          {meals.length === 0 && <p className={`text-xs text-center py-3 ${textMuted}`}>{t.noMealsYet}</p>}
          {meals.map((m, i) => (
            <div key={i} className={`flex items-center justify-between py-2 border-b last:border-0 ${dark ? "border-slate-700" : "border-slate-100"}`}>
              <span className={`text-sm ${textSub}`}>{m.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#dc2626]">{m.kal} KAL</span>
                <button onClick={() => removeMeal(i)} className="text-slate-400 hover:text-red-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={`${cardBg} rounded-2xl shadow-sm px-4 py-4 flex flex-col gap-3`}>
          <span className={`text-sm font-semibold ${textMain}`}>{t.addMeal}</span>
          <input type="text" placeholder={t.mealName} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMeal()}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputCls}`}/>
          <input type="number" placeholder={t.calories} value={newKal} onChange={e => setNewKal(e.target.value)} onKeyDown={e => e.key === "Enter" && addMeal()}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputCls}`}/>
          <button onClick={addMeal} disabled={!newName.trim() || !newKal}
            className="w-full bg-[#111111] text-white border-b border-white/10 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 active:scale-95 transition-all">
            {t.add}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── All available shortcut items — same order as drawer ───────────────────────
const allShortcutItems: { label: string; icon: React.ReactNode }[] = [
  { label: "Profil", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  { label: "Rehber", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><rect x="2" y="3" width="16" height="18" rx="2"/><path d="M6 7h8M6 11h8M6 15h5"/><path d="M19 8h1a2 2 0 0 1 0 4h-1"/><path d="M19 14h1a2 2 0 0 1 0 4h-1"/></svg> },
  { label: "Mesajlar", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { label: "Yemekhane", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
  { label: "Duyurular", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M22 3L12 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2l1.5 4h2L8 16h4l10 5V3z" strokeLinejoin="round"/></svg> },
  { label: "İzin Talepleri", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg> },
  { label: "Belgelerim", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg> },
  { label: "Çalışma Saatleri", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg> },
  { label: "Karekodum", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h.01M18 14h.01M14 18h4v3M21 18v.01" strokeLinecap="round" strokeWidth={2.2}/></svg> },
  { label: "Geri Bildirim", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { label: "İş Yeri Konumu", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { label: "Ayarlar", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { label: "Çıkış", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> },
];

const DEFAULT_SHORTCUTS = ["İzin Talepleri", "Duyurular", "Karekodum"];
const loadExtraShortcuts = (): string[] => { try { return JSON.parse(localStorage.getItem("uni_extra_shortcuts") || JSON.stringify(DEFAULT_SHORTCUTS)); } catch { return DEFAULT_SHORTCUTS; } };
const saveExtraShortcuts = (s: string[]) => localStorage.setItem("uni_extra_shortcuts", JSON.stringify(s));

// ── Shortcut Picker Modal ─────────────────────────────────────────────────────
function ShortcutPicker({ dark, lang, current, onClose }: { dark: boolean; lang: string; current: string[]; onClose: (next: string[]) => void }) {
  const t = getLang(lang);

  // order = full list order (persisted), selected = which are active
  const loadOrder = (): string[] => {
    try { return JSON.parse(localStorage.getItem("uni_shortcut_order") || "[]"); } catch { return []; }
  };
  const savedOrder = loadOrder();
  const defaultOrder = allShortcutItems.map(x => x.label);
  const initialOrder = savedOrder.length === defaultOrder.length ? savedOrder : defaultOrder;

  const [order, setOrder] = useState<string[]>(initialOrder);
  const [selected, setSelected] = useState<string[]>(current);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pointerStartY = useRef(0);
  const pointerItemH = useRef(0);

  const bg = dark ? "bg-[#0f172a]" : "bg-white";
  const itemBg = dark ? "bg-[#1e293b]" : "bg-slate-50";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-400" : "text-slate-500";

  const toggle = (label: string) => {
    setSelected(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label]);
  };

  const onPointerDown = (e: React.PointerEvent, idx: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIdx(idx);
    setOverIdx(idx);
    pointerStartY.current = e.clientY;
    pointerItemH.current = (e.currentTarget as HTMLElement).offsetHeight + 8;
  };

  const onPointerMove = (e: React.PointerEvent, idx: number) => {
    if (dragIdx === null || dragIdx !== idx) return;
    const delta = e.clientY - pointerStartY.current;
    const steps = Math.round(delta / pointerItemH.current);
    const next = Math.min(Math.max(dragIdx + steps, 0), order.length - 1);
    setOverIdx(next);
  };

  const onPointerUp = (e: React.PointerEvent, idx: number) => {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      setOrder(prev => {
        const arr = [...prev];
        const [moved] = arr.splice(dragIdx, 1);
        arr.splice(overIdx, 0, moved);
        return arr;
      });
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const orderedItems = order.map(l => allShortcutItems.find(x => x.label === l)).filter(Boolean) as typeof allShortcutItems;

  const handleSave = () => {
    localStorage.setItem("uni_shortcut_order", JSON.stringify(order));
    const ordered = order.filter(l => selected.includes(l));
    saveExtraShortcuts(ordered);
    onClose(ordered);
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${bg}`} style={{ borderRadius: 32 }}>
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={() => onClose(current)} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">{t.addShortcut}</span>
        <button onClick={handleSave} className="text-[#dc2626] text-sm font-bold w-8 text-right">{t.save}</button>
      </div>
      <p className={`text-xs px-5 pt-4 pb-2 ${textSub}`}>{t.manageShortcuts}</p>
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pt-2 pb-4 flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
        {orderedItems.map((item, i) => {
          const on = selected.includes(item.label);
          const isDragging = dragIdx === i;
          const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
          return (
            <div key={item.label}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all select-none
                ${itemBg} ${on ? "ring-2 ring-[#dc2626]" : ""}
                ${isDragging ? "opacity-50 scale-[0.97]" : ""}
                ${isOver ? "ring-2 ring-[#dc2626]/40" : ""}`}
              style={{ touchAction: "none" }}>
              {/* Drag handle */}
              <div
                className="cursor-grab active:cursor-grabbing flex items-center justify-center w-5 flex-shrink-0 touch-none"
                onPointerDown={e => onPointerDown(e, i)}
                onPointerMove={e => onPointerMove(e, i)}
                onPointerUp={e => onPointerUp(e, i)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 ${textSub}`}>
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
              </div>
              {/* Tap area for toggle */}
              <button className="flex items-center gap-3 flex-1 text-left" onClick={() => toggle(item.label)}>
                <span className={`inline-flex items-center justify-center flex-shrink-0 ${on ? "text-[#dc2626]" : textSub}`}>{item.icon}</span>
                <span className={`text-sm font-medium flex-1 ${textMain}`}>{t[DRAWER_LABEL_MAP[item.label]] ?? item.label}</span>
                {on && <span className="text-xs font-semibold text-[#dc2626]">{t.shortcutAdded}</span>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Rehber (Directory) ────────────────────────────────────────────────────────
function RehberScreen({ dark, lang, myId, myName, onBack }: { dark: boolean; lang: string; myId: string; myName: string; onBack: () => void }) {
  const t = getLang(lang);
  const isAdmin = isAdminId(myId);
  const [users, setUsers] = useState<Contact[]>(() => loadUsers());
  const [search, setSearch] = useState("");
  const [openChat, setOpenChat] = useState<Contact | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);

  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-400" : "text-slate-500";

  const others = users.filter(u => u.id !== myId);
  const filtered = others.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  const deleteUser = (user: Contact) => {
    const nextUsers = users.filter(u => u.id !== user.id);
    saveUsers(nextUsers);
    setUsers(nextUsers);
    const approved = loadApprovedCreds().filter(c => c.id !== user.id);
    saveApprovedCreds(approved);
    const pending = loadPending().filter(p => p.id !== user.id);
    savePending(pending);
    setConfirmDelete(null);
  };

  if (openChat) return <ChatScreen dark={dark} lang={lang} contact={openChat} myId={myId} myName={myName} onBack={() => setOpenChat(null)}/>;

  return (
    <div className={`absolute inset-0 flex flex-col z-40 ${bg}`} style={{ borderRadius: 32 }}>
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={onBack} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">{t.directory}</span>
        <div className="w-8"/>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <div className={`flex items-center gap-2 ${cardBg} rounded-2xl px-4 py-2.5 shadow-sm`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 flex-shrink-0 ${textSub}`}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
            className={`flex-1 bg-transparent text-sm outline-none ${textMain}`}/>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-12 h-12 ${textSub}`}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p className={`text-sm ${textSub}`}>{others.length === 0 ? t.noOtherUsers : t.noResults}</p>
          </div>
        )}
        {filtered.map(c => (
          <div key={c.id} className={`${cardBg} rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm`}>
            <button onClick={() => setOpenChat(c)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <div className="w-10 h-10 rounded-full bg-[#dc2626]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[#dc2626] font-bold text-sm">{c.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${textMain} truncate`}>{c.name}</p>
                {c.role && <p className={`text-xs ${textSub} truncate`}>{c.role}</p>}
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-5 h-5 flex-shrink-0 ${textSub}`}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            {isAdmin && (
              <button onClick={() => setConfirmDelete(c)} className="ml-1 p-1.5 text-red-400 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Silme onay modalı */}
      {confirmDelete && (
        <div className="absolute inset-0 z-50 flex items-end" style={{ borderRadius: 32 }}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} style={{ borderRadius: 32 }}/>
          <div className={`relative w-full ${cardBg} rounded-t-3xl px-5 pt-6 pb-8 flex flex-col gap-4 shadow-2xl`}>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} className="w-6 h-6"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </div>
              <p className={`font-bold text-base ${textMain}`}>{confirmDelete.name}</p>
              <p className={`text-sm ${textSub}`}>Bu kullanıcıyı silmek istediğinden emin misin? Hesabı kalıcı olarak kaldırılacak.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold ${dark ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-700"}`}>İptal</button>
              <button onClick={() => deleteUser(confirmDelete)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold bg-red-500 text-white">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chat Screen ───────────────────────────────────────────────────────────────
function ChatScreen({ dark, lang, contact, myId, myName, onBack }: { dark: boolean; lang: string; contact: Contact; myId: string; myName: string; onBack: () => void }) {
  const t = getLang(lang);
  const convKey = `uni_conv_${[contact.id, myId].sort().join("_")}`;
  const [messages, setMessages] = useState<Message[]>(() => { try { return JSON.parse(localStorage.getItem(convKey) || "[]"); } catch { return []; } });
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const inputCls = dark ? "bg-[#1e293b] border-slate-600 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-800";

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const next = [...messages, { id: Date.now().toString(), from: myName, text: text.trim(), time: Date.now() }];
    setMessages(next);
    localStorage.setItem(convKey, JSON.stringify(next));
    setText("");
  };

  const fmtTime = (t: number) => {
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  return (
    <div className={`absolute inset-0 flex flex-col z-50 ${bg}`} style={{ borderRadius: 32 }}>
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={onBack} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">{contact.name}</span>
        <div className="w-8 h-8 rounded-full bg-[#dc2626]/20 flex items-center justify-center">
          <span className="text-[#dc2626] font-bold text-sm">{contact.name.charAt(0).toUpperCase()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
        {messages.length === 0 && (
          <p className={`text-center text-xs py-8 ${dark ? "text-slate-500" : "text-slate-400"}`}>{t.noMessagesYet}</p>
        )}
        {messages.map(m => {
          const isMe = m.from === myName;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl ${isMe ? "bg-[#dc2626] text-white rounded-br-sm" : `${cardBg} ${textMain} rounded-bl-sm`}`}>
                {!isMe && <p className="text-[10px] font-semibold text-[#dc2626] mb-0.5">{m.from}</p>}
                <p className="text-sm leading-snug">{m.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-white/60 text-right" : dark ? "text-slate-500" : "text-slate-400"}`}>{fmtTime(m.time)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      <div className={`px-4 py-3 border-t ${dark ? "border-slate-700 bg-[#0f172a]" : "border-slate-200 bg-slate-100"}`} style={{ borderRadius: "0 0 32px 32px" }}>
        <div className="flex gap-2 items-center">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder={t.typeMessage}
            className={`flex-1 border rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[#dc2626] transition-colors ${inputCls}`}/>
          <button onClick={send} disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-[#dc2626] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Feedback Screen ───────────────────────────────────────────────────────────
function FeedbackScreen({ dark, lang, myId, myName, onBack }: { dark: boolean; lang: string; myId: string; myName: string; onBack: () => void }) {
  const adminCreds = loadCreds();
  const adminId = adminCreds.id || "1234";
  const adminContact: Contact = { id: adminId, name: "Admin", role: "Yönetici", phone: "" };
  return <ChatScreen dark={dark} lang={lang} contact={adminContact} myId={myId} myName={myName} onBack={onBack}/>;
}

// ── Messages Screen ───────────────────────────────────────────────────────────
function MessagesScreen({ dark, lang, myName, myId, onBack }: { dark: boolean; lang: string; myName: string; myId: string; onBack: () => void }) {
  const t = getLang(lang);
  const [contacts] = useState<Contact[]>(() => loadUsers().filter(u => u.id !== myId));
  const [openChat, setOpenChat] = useState<Contact | null>(null);

  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-400" : "text-slate-500";

  const getLastMsg = (contact: Contact) => {
    const convKey = `uni_conv_${[contact.id, myId].sort().join("_")}`;
    try {
      const msgs: Message[] = JSON.parse(localStorage.getItem(convKey) || "[]");
      return msgs[msgs.length - 1] || null;
    } catch { return null; }
  };

  if (openChat) return <ChatScreen dark={dark} lang={lang} contact={openChat} myId={myId} myName={myName} onBack={() => setOpenChat(null)}/>;

  return (
    <div className={`absolute inset-0 flex flex-col z-40 ${bg}`} style={{ borderRadius: 32 }}>
      <div className="flex items-center justify-between px-5 py-4 bg-[#111111] text-white" style={{ borderRadius: "32px 32px 0 0" }}>
        <button onClick={onBack} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="font-bold text-base">{t.messages}</span>
        <div className="w-8"/>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2" style={{ scrollbarWidth: "none" }}>
        {contacts.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-12 h-12 ${textSub}`}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p className={`text-sm ${textSub}`}>{t.addToRehberHint}</p>
          </div>
        )}
        {contacts.map(c => {
          const last = getLastMsg(c);
          return (
            <button key={c.id} onClick={() => setOpenChat(c)}
              className={`${cardBg} rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform w-full text-left`}>
              <div className="w-11 h-11 rounded-full bg-[#dc2626]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[#dc2626] font-bold">{c.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${textMain}`}>{c.name}</p>
                <p className={`text-xs truncate mt-0.5 ${textSub}`}>{last ? last.text : c.role || t.noMessage}</p>
              </div>
              {last && <p className={`text-[10px] ${textSub} flex-shrink-0`}>{new Date(last.time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Quick Actions Carousel ────────────────────────────────────────────────────
function QuickCarousel(props: {
  actions: { label: string; icon: React.ReactNode; isLogin?: boolean }[];
  dark: boolean;
  lang: string;
  loggedIn: boolean;
  onAddShortcut: () => void;
  onLogin: () => void;
  onAction?: (label: string) => void;
}) {
  const { actions, dark, lang, loggedIn, onAddShortcut, onLogin, onAction } = props;
  const t = getLang(lang);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const actionBg = dark ? "bg-[#1e293b] text-slate-200" : "bg-white text-[#111111]";

  const goTo = (i: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: i * scrollRef.current.offsetWidth, behavior: "smooth" });
      setPage(i);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div ref={scrollRef}
        onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth))}
        className="overflow-x-auto snap-x snap-mandatory flex w-full"
        style={{ scrollbarWidth: "none", touchAction: "pan-x" }}>

        <div className="snap-start flex-shrink-0 min-w-full grid grid-cols-3 gap-3">
          {actions.map((action, i) => (
            <button key={action.label + i}
              onClick={action.isLogin ? onLogin : () => onAction?.(action.label)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 shadow-sm active:scale-95 transition-all ${action.isLogin ? "bg-[#dc2626] text-white" : actionBg}`}>
              {action.icon}
              <span className="text-[11px] font-semibold text-center leading-tight">{t[DRAWER_LABEL_MAP[action.label]] ?? action.label}</span>
            </button>
          ))}
        </div>

        {loggedIn && (
          <div className="snap-start flex-shrink-0 min-w-full flex items-start">
            <button onClick={onAddShortcut}
              style={{ width: "calc(33.333% - 8px)" }}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 shadow-sm active:scale-95 transition-all ${actionBg}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span className="text-[11px] font-semibold text-center leading-tight">{t.editLabel}</span>
            </button>
          </div>
        )}
      </div>

      {loggedIn && (
        <div className="flex justify-center gap-1.5 pt-1">
          {[0, 1].map(i => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all ${i === page ? "w-4 h-2 bg-[#dc2626]" : "w-2 h-2 bg-slate-300"}`}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
const TIMEOUT_MS: Record<string, number> = {
  "15m": 15 * 60 * 1000, "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000, "4h": 4 * 60 * 60 * 1000,
};

function App() {
  const [loggedIn, setLoggedInState] = useState(isLoggedIn);
  const [dark, setDark] = useState(loadDark);
  const [screen, setScreen] = useState<"main" | "weekly" | "admin" | "settings" | "login" | "shortcuts" | "rehber" | "messages" | "profile" | "register" | "approvals" | "notifications" | "feedback">("main");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuData, setMenuData] = useState<MenuData>(loadMenu);
  const [extraShortcuts, setExtraShortcuts] = useState<string[]>(loadExtraShortcuts);
  const [lang, setLang] = useState(loadLang);
  const [lockedId, setLockedId] = useState<string | undefined>(undefined);
  const t = getLang(lang);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const setting = loadTimeout();
    const ms = TIMEOUT_MS[setting];
    if (!ms) return;
    timeoutRef.current = setTimeout(() => {
      const p = loadProfile();
      setLockedId(p.id || loadCreds().id || "");
      setLoggedIn(false);
      setLoggedInState(false);
      setScreen("login");
    }, ms);
  };

  useEffect(() => {
    if (!loggedIn) return;
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loggedIn]);

  useEffect(() => { setMenuData(loadMenu()); }, [screen]);

  const toggleDark = () => { const next = !dark; setDark(next); saveDark(next); };
  const handleLogout = () => { setLockedId(undefined); setLoggedIn(false); setLoggedInState(false); localStorage.removeItem("uni_current_user_id"); setScreen("main"); };
  const handleLogin = () => {
    setLockedId(undefined);
    setLoggedInState(true);
    setScreen("main");
    const uid = getCurrentUserId();
    if (isAdminId(uid)) {
      const p = loadProfile();
      const adminId = loadCreds().id || "1234";
      saveProfile({ ...p, name: "Admin", id: adminId });
      const cleaned = loadUsers().filter(u => u.id !== adminId && u.name !== "Admin");
      saveUsers(cleaned);
    } else {
      const existing = loadProfile();
      if (!existing.id) {
        const user = loadUsers().find(u => u.id === uid);
        if (user) saveProfile({ name: user.name, id: user.id, unit: user.role });
      }
      const user = loadUsers().find(u => u.id === uid);
      if (user) registerUser(user.id, user.name, user.role);
    }
  };

  const today = new Date();
  const key = toKey(today);
  const todayMenu = menuData[key]?.normal || [];
  const totalKal = todayMenu.reduce((s, m) => s + m.kal, 0);

  const bg = dark ? "bg-[#0f172a]" : "bg-slate-100";
  const cardBg = dark ? "bg-[#1e293b]" : "bg-white";
  const textMain = dark ? "text-white" : "text-slate-800";
  const textSub = dark ? "text-slate-300" : "text-slate-700";
  const textMuted = dark ? "text-slate-500" : "text-slate-400";

  const quickActions = loggedIn
    ? extraShortcuts.map(label => allShortcutItems.find(x => x.label === label)).filter(Boolean) as typeof allShortcutItems
    : [{ label: "Giriş", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>, isLogin: true },
        { label: "Duyurular", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><path d="M22 3L12 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2l1.5 4h2L8 16h4l10 5V3z" strokeLinejoin="round"/></svg> }];

  return (
    <div className="size-full flex items-center justify-center bg-slate-200">
      <div className={`relative flex flex-col w-full h-full max-w-[430px] max-h-[956px] overflow-hidden shadow-2xl ${bg}`} style={{ borderRadius: 32 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#111111] text-white border-b border-white/10 shadow-md" style={{ borderRadius: "32px 32px 0 0" }}>
          <button className="p-1" onClick={() => setDrawerOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-bold text-base tracking-wide">{t.appName}</span>
          {loggedIn && isAdminProfile() ? (
            <button className="relative p-1" onClick={() => setScreen("approvals")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              </svg>
              {loadPending().length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#dc2626] text-white text-[9px] font-bold flex items-center justify-center">
                  {loadPending().length}
                </span>
              )}
            </button>
          ) : loggedIn ? (
            <button className="relative p-1" onClick={() => setScreen("notifications")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {(() => { const uid = getCurrentUserId(); const count = loadNotifs(uid).filter(n => !n.read).length; return count > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#dc2626] text-white text-[9px] font-bold flex items-center justify-center">{count}</span>
              ) : null; })()}
            </button>
          ) : <div className="w-8"/>}
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 ${bg}`} style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setScreen("weekly")}
            className={`w-full text-left ${cardBg} rounded-2xl shadow-sm px-5 py-4 active:scale-[0.98] transition-transform`}>
            <p className={`text-center text-xs mb-1 ${textMuted}`}>{fmtDate(today, lang)}</p>
            <h2 className={`text-center text-lg font-bold mb-3 ${textMain}`}>{t.todayMenu}</h2>
            {todayMenu.length === 0 ? (
              <div className="text-center py-3">
                <p className={`text-sm ${textMuted}`}>{t.noMenu}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {todayMenu.map((item, i) => (
                    <div key={i} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${dark ? "border-slate-700" : "border-slate-100"}`}>
                      <span className={`text-sm font-medium ${textSub}`}>{item.name}</span>
                      <span className="text-sm font-semibold text-[#dc2626]">{item.kal} KAL</span>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 pt-3 border-t flex justify-between items-center ${dark ? "border-slate-700" : "border-slate-200"}`}>
                  <span className={`text-xs font-medium ${textMuted}`}>{t.total}</span>
                  <span className="text-sm font-bold text-[#dc2626]">{totalKal} KAL</span>
                </div>
              </>
            )}
            <p className={`text-center text-xs mt-3 ${textMuted}`}>{t.weeklyMenu}</p>
          </button>

          <QuickCarousel
            actions={quickActions}
            dark={dark}
            lang={lang}
            loggedIn={loggedIn}
            onAddShortcut={() => setScreen("shortcuts")}
            onLogin={() => setScreen("login")}
            onAction={label => {
              if (label === "Yemekhane") setScreen("weekly");
              else if (label === "Rehber") setScreen("rehber");
              else if (label === "Mesajlar") setScreen("messages");
              else if (label === "Ayarlar") setScreen("settings");
              else if (label === "Profil") setScreen("profile");
              else if (label === "Çıkış") handleLogout();
            }}
          />
        </div>

        <Drawer open={drawerOpen} dark={dark} lang={lang} isAdmin={isAdminProfile()} loggedIn={loggedIn} onClose={() => setDrawerOpen(false)}
          onMenuYonetimi={() => setScreen("admin")}
          onSettings={() => setScreen("settings")}
          onLogout={handleLogout}
          onRehber={() => setScreen("rehber")}
          onMessages={() => setScreen("messages")}
          onProfile={() => setScreen("profile")}
          onWeekly={() => setScreen("weekly")}
          onFeedback={() => setScreen("feedback")}/>

        {screen === "weekly"    && <WeeklyScreen dark={dark} lang={lang} onBack={() => setScreen("main")}/>}
        {screen === "admin"     && isAdminProfile() && <AdminPanel dark={dark} lang={lang} onClose={() => setScreen("main")}/>}
        {screen === "approvals" && isAdminProfile() && <AdminApprovalScreen dark={dark} lang={lang} onClose={() => setScreen("main")}/>}
        {screen === "settings"  && <SettingsScreen dark={dark} onToggleDark={toggleDark} onClose={() => setScreen("main")} onLangChange={l => setLang(l)}/>}
        {screen === "login"     && <LoginScreen dark={dark} lang={lang} onLogin={handleLogin} lockedId={lockedId} onRegister={() => setScreen("register")}/>}
        {screen === "register"  && <RegisterScreen dark={dark} lang={lang} onBack={() => setScreen("login")} onRegistered={handleLogin}/>}
        {screen === "shortcuts" && <ShortcutPicker dark={dark} lang={lang} current={extraShortcuts} onClose={next => { setExtraShortcuts(next); setScreen("main"); }}/>}
        {screen === "profile"   && <ProfileScreen dark={dark} lang={lang} onBack={() => setScreen("main")} onLogout={handleLogout}/>}
        {screen === "rehber"    && <RehberScreen dark={dark} lang={lang} myId={loadProfile().id || ""} myName={loadProfile().name || ""} onBack={() => setScreen("main")}/>}
        {screen === "messages"  && <MessagesScreen dark={dark} lang={lang} myName={loadProfile().name || "Ben"} myId={loadProfile().id || ""} onBack={() => setScreen("main")}/>}
        {screen === "notifications" && <NotificationsScreen dark={dark} lang={lang} uid={getCurrentUserId()} onBack={() => setScreen("main")}/>}
        {screen === "feedback"      && <FeedbackScreen dark={dark} lang={lang} myId={loadProfile().id || ""} myName={loadProfile().name || "Ben"} onBack={() => setScreen("main")}/>}
      </div>
    </div>
  );
}

export default App;
