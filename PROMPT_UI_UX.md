# Money Tracker UI/UX Design Prompt

## English Version (for AI design tools)

```
Design a modern, clean personal finance mobile-first web app called "MoneyTracker". The app helps users track income, expenses, budgets, and financial goals.

COLOR PALETTE:
- Primary: Deep Slate Blue (#1e293b) for headers and navigation
- Accent: Vibrant Teal (#0d9488) for CTAs and highlights
- Success: Emerald Green (#10b981) for income and positive states
- Danger: Coral Red (#ef4444) for expenses and alerts
- Warning: Amber (#f59e0b) for budget warnings
- Background: Soft Gray (#f8fafc) with White (#ffffff) cards
- Text: Dark (#0f172a) for headings, Muted (#64748b) for secondary

TYPOGRAPHY:
- Font: Inter for body, JetBrains Mono for monetary amounts
- Bold numbers for financial data
- Clear hierarchy: H1 24px, H2 20px, Body 14px, Caption 12px

DESIGN PRINCIPLES:
1. Mobile-first, clean, and minimal
2. Large touch targets (min 44px)
3. Clear visual hierarchy for financial data
4. Consistent spacing (8px grid system)
5. Subtle shadows and rounded corners (12px)
6. Smooth micro-animations on interactions

SCREENS TO DESIGN:

1. LOGIN / SIGNUP PAGE
- Clean, centered card design
- Social login buttons (Google, GitHub)
- Subtle gradient background
- App logo and tagline

2. DASHBOARD (Main Screen)
- Top: Total Balance card with large number (Rp format)
- Quick stats row: Income | Expense | Net (with colored indicators)
- Cash Flow Chart (Bar chart, last 6 months)
- Expense by Category (Donut chart with percentages)
- Recent Transactions list (5 items with category icons)
- Floating Action Button (+) for quick entry

3. TRANSACTIONS PAGE
- Tab bar: All | Income | Expense | Transfer
- Search bar with filter icon
- Transaction list with:
  - Category icon (colored circle)
  - Description and category name
  - Amount (green for income, red for expense)
  - Date and account name
- Quick Entry input at top: "Type something like 'Lunch 50k'..."

4. QUICK ENTRY MODAL
- Large text input with placeholder "lunch 50k"
- Auto-suggestion chips below
- Preview card showing parsed result
- Confirm button

5. ACCOUNTS PAGE
- Account cards in grid (2 columns)
- Each card shows: Account name, type icon, current balance
- Color-coded by account type
- Add Account button

6. BUDGET PAGE
- Monthly budget overview card
- Budget categories with progress bars
- Color-coded: Green (< 80%), Yellow (80-100%), Red (> 100%)
- Remaining amount display

7. GOALS PAGE
- Goal cards with progress ring/circle
- Target amount vs current amount
- Days remaining indicator
- Monthly required saving

8. ANALYTICS PAGE
- Period selector (Week | Month | Year)
- Income vs Expense comparison chart
- Top spending categories
- Account balance distribution pie chart
- Savings rate indicator

9. SIDEBAR / NAVIGATION
- Collapsible sidebar (desktop)
- Bottom navigation bar (mobile): Dashboard | Transactions | + | Budget | More
- User avatar and name at top
- Settings link

10. SETTINGS PAGE
- Profile section with avatar
- Notification preferences (toggle switches)
- Category management
- Data export/import options
- Theme toggle (Light/Dark)

UI COMPONENTS:
- Cards: White background, subtle shadow (0 1px 3px rgba), rounded-xl
- Buttons: Primary (teal), Secondary (outline), Danger (red)
- Inputs: Clean borders, focus ring in teal
- Badges: Colored pills for status
- Progress bars: Rounded, animated fill
- Icons: Lucide icon set, consistent 20px size
- Toast notifications: Slide in from top-right

ANIMATIONS:
- Page transitions: Fade + slide (200ms)
- Number counters: Animate on load
- Progress bars: Fill animation
- Cards: Subtle hover lift effect
- Charts: Draw animation on load

LAYOUT:
- Max width: 1200px centered
- Sidebar: 256px fixed (desktop)
- Content padding: 24px
- Card gap: 16px
- Mobile: Full width, bottom nav

MOCK DATA (for realistic preview):
- Balance: Rp 12.500.000
- Income this month: Rp 8.500.000
- Expense this month: Rp 4.250.000
- Categories: Food, Transport, Shopping, Bills, Entertainment
- Accounts: BCA (Bank), OVO (E-Wallet), Cash
```

---

## Indonesian Version (for Indonesian AI tools)

```
Desain aplikasi web finansial pribadi mobile-first yang modern dan bersih bernama "MoneyTracker". Aplikasi membantu pengguna melacak pendapatan, pengeluaran, anggaran, dan target keuangan.

WARNA:
- Primer: Slate Blue (#1e293b) untuk header dan navigasi
- Aksen: Teal (#0d9488) untuk tombol CTA dan highlight
- Sukses: Emerald Green (#10b981) untuk pendapatan
- Bahaya: Coral Red (#ef4444) untuk pengeluaran dan peringatan
- Peringatan: Amber (#f59e0b) untuk peringatan anggaran
- Latar: Soft Gray (#f8fafc) dengan kartu Putih (#ffffff)
- Teks: Gelap (#0f172a) untuk judul, Muted (#64748b) untuk sekunder

TIPOGRAFI:
- Font: Inter untuk body, JetBrains Mono untuk angka
- Angka tebal untuk data finansial
- Hierarki jelas: H1 24px, H2 20px, Body 14px, Caption 12px

PRINSIP DESAIN:
1. Mobile-first, bersih, dan minimal
2. Target sentuh besar (min 44px)
3. Hierarki visual jelas untuk data finansial
4. Spasi konsisten (grid 8px)
5. Bayangan halus dan sudut bulat (12px)
6. Animasi mikro halus pada interaksi

HALAMAN YANG HARUS DIDESAIN:

1. HALAMAN LOGIN / SIGNUP
- Desain kartu bersih, tengah
- Tombol login sosial (Google, GitHub)
- Latar belakang gradient halus
- Logo aplikasi dan tagline

2. DASHBOARD (Layar Utama)
- Atas: Kartu Saldo Total dengan angka besar (format Rp)
- Baris stats cepat: Pendapatan | Pengeluaran | Bersih (dengan indikator warna)
- Grafik Arus Kas (Bar chart, 6 bulan terakhir)
- Pengeluaran per Kategori (Donut chart dengan persentase)
- Daftar Transaksi Terakhir (5 item dengan ikon kategori)
- Tombol Aksi Mengambang (+) untuk entri cepat

3. HALAMAN TRANSAKSI
- Tab bar: Semua | Pendapatan | Pengeluaran | Transfer
- Bilah pencarian dengan ikon filter
- Daftar transaksi dengan:
  - Ikon kategori (lingkaran berwarna)
  - Deskripsi dan nama kategori
  - Jumlah (hijau untuk pendapatan, merah untuk pengeluaran)
  - Tanggal dan nama akun
- Input Quick Entry di atas: "Ketik sesuatu seperti 'lunch 50k'..."

4. MODAL QUICK ENTRY
- Input teks besar dengan placeholder "lunch 50k"
- Chip saran otomatis di bawah
- Kartu pratinjau menunjukkan hasil parsing
- Tombol Konfirmasi

5. HALAMAN AKUN
- Kartu akun dalam grid (2 kolom)
- Setiap kartu menunjukkan: Nama akun, ikon tipe, saldo saat ini
- Warna berdasarkan tipe akun
- Tombol Tambah Akun

6. HALAMAN ANGGARAN
- Kartu ikhtisar anggaran bulanan
- Kategori anggaran dengan bar progres
- Warna: Hijau (< 80%), Kuning (80-100%), Merah (> 100%)
- Tampilan sisa jumlah

7. HALAMAN TARGET
- Kartu target dengan lingkaran progres
- Jumlah target vs jumlah saat ini
- Indikator hari tersisa
- Tabungan bulanan yang diperlukan

8. HALAMAN ANALITIK
- Pilih periode (Minggu | Bulan | Tahun)
- Grafik perbandingan Pendapatan vs Pengeluaran
- Kategori pengeluaran teratas
- Grafik pie distribusi saldo akun
- Indikator tingkat tabungan

9. SIDEBAR / NAVIGASI
- Sidebar bisa dilipat (desktop)
- Bilah navigasi bawah (mobile): Dashboard | Transaksi | + | Anggaran | Lainnya
- Avatar dan nama pengguna di atas
- Tautan pengaturan

10. HALAMAN PENGATURAN
- Bagian profil dengan avatar
- Preferensi notifikasi (toggle switch)
- Manajemen kategori
- Opsi ekspor/impor data
- Ganti tema (Terang/Gelap)

KOMPONEN UI:
- Kartu: Latar putih, bayangan halus (0 1px 3px rgba), rounded-xl
- Tombol: Primer (teal), Sekunder (outline), Bahaya (merah)
- Input: Border bersih, fokus ring teal
- Badge: Pil warna untuk status
- Bar Progres: Bulat, animasi pengisian
- Ikon: Set Lucide, ukuran konsisten 20px
- Notifikasi toast: Geser masuk dari kanan atas

ANIMASI:
- Transisi halaman: Fade + geser (200ms)
- Penghitung angka: Animasi saat memuat
- Bar Progres: Animasi pengisian
- Kartu: Efek hover mengangkat halus
- Grafik: Animasi gambar saat memuat

TATA LETAK:
- Lebar maks: 1200px tengah
- Sidebar: 256px tetap (desktop)
- Konten padding: 24px
- Jarak kartu: 16px
- Mobile: Lebar penuh, navigasi bawah

DATA CONTOH (untuk pratinjau realistis):
- Saldo: Rp 12.500.000
- Pendapatan bulan ini: Rp 8.500.000
- Pengeluaran bulan ini: Rp 4.250.000
- Kategori: Makanan, Transportasi, Belanja, Tag Hiburan
- Akun: BCA (Bank), OVO (E-Wallet), Tunai
```

---

## Figma/Design Tool Prompt

```
Create a UI kit and design system for a personal finance app called "MoneyTracker".

Design System:
- 8px spacing grid
- Border radius: 8px (small), 12px (medium), 16px (large)
- Shadows: sm (0 1px 2px), md (0 4px 6px), lg (0 10px 15px)
- Typography scale: 12, 14, 16, 20, 24, 32px
- Icon style: Outlined, 20px, 1.5px stroke

Color Tokens:
- primary: #0d9488 (teal)
- primary-light: #ccfbf1
- success: #10b981 (emerald)
- success-light: #d1fae5
- danger: #ef4444 (red)
- danger-light: #fee2e2
- warning: #f59e0b (amber)
- warning-light: #fef3c7
- neutral-50: #f8fafc
- neutral-100: #f1f5f9
- neutral-200: #e2e8f0
- neutral-500: #64748b
- neutral-900: #0f172a

Component Variants:
1. Button: primary, secondary, ghost, danger (sm, md, lg)
2. Card: default, elevated, outlined
3. Input: default, error, disabled
4. Badge: success, warning, danger, neutral
5. Avatar: sm (32px), md (40px), lg (56px)
6. Progress: linear, circular
7. Tab: underline, pill
8. Modal: bottom-sheet (mobile), centered (desktop)

Screens (Mobile 375px):
1. Splash screen with logo
2. Onboarding (3 steps)
3. Login / Register
4. Dashboard
5. Transaction list
6. Transaction detail
7. Add transaction (with quick entry)
8. Accounts list
9. Add account
10. Budget overview
11. Budget detail
12. Goals list
13. Add goal
14. Analytics
15. Settings
16. Profile
17. Notifications
18. Category management

Screens (Desktop 1440px):
1. Dashboard with sidebar
2. Transaction list with filters
3. Analytics with charts
4. Settings with tabs

Interactions:
- Bottom sheet slides up on mobile
- Cards have press feedback (scale 0.98)
- Charts animate on load (1s ease-out)
- Pull to refresh on lists
- Swipe to delete on transaction items
- Long press for context menu
```

---

## Copy-Paste for Lovable/Bolt/Durable

```
Build a personal finance web app with these screens:

1. Login page with email/password and social login buttons
2. Dashboard showing total balance (Rp 12.500.000), income/expense cards, cash flow chart, expense by category donut chart, recent transactions
3. Transaction list with tabs (All/Income/Expense), search, and quick entry input
4. Add transaction modal with amount, category, account, date picker
5. Accounts page with account cards showing balance
6. Budget page with category progress bars
7. Goals page with progress circles
8. Analytics page with charts and insights
9. Settings page with profile and preferences

Design: Modern, clean, mobile-first. Use teal (#0d9488) as primary color. White cards on light gray background. Inter font. Rounded corners. Subtle shadows. Bottom navigation on mobile.
```
