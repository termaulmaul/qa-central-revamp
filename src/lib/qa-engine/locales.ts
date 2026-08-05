export type Locale = 'id' | 'en';

let currentLocale: Locale = 'id';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

const DICTIONARY: Record<string, Record<Locale, string>> = {
  // Guest Mode
  guestAccess: {
    id: 'Akses aplikasi tanpa login (Guest mode).',
    en: 'Access application without login (Guest mode).'
  },
  guestAccessExpected: {
    id: 'Halaman utama tampil dengan menu terbatas.',
    en: 'Home page displayed with limited menu.'
  },
  
  // Login Page / Apps
  openLoginWebPro: {
    id: 'Buka halaman login https://pro.growin.id/login',
    en: 'Open login page https://pro.growin.id/login'
  },
  openLoginWebInvest: {
    id: 'Buka halaman login https://invest.growin.id/login',
    en: 'Open login page https://invest.growin.id/login'
  },
  openLoginIts: {
    id: 'Akses URL ITS https://its-dev.growin.id/login',
    en: 'Access ITS URL https://its-dev.growin.id/login'
  },
  openAppMobileInvest: {
    id: 'Buka aplikasi Growin Mobile Invest.',
    en: 'Open Growin Mobile Invest application.'
  },
  openAppGrowin: {
    id: 'Open growin app',
    en: 'Open growin app'
  },
  loginPageDisplayed: {
    id: 'Halaman login ditampilkan.',
    en: 'Login page displayed.'
  },
  appOpened: {
    id: 'growin app open',
    en: 'Growin app is open'
  },
  itsWebAccessSuccess: {
    id: 'Success access its web',
    en: 'Success access ITS web'
  },

  // Credentials
  inputUserId: {
    id: 'Input UserID',
    en: 'Input UserID'
  },
  inputUserIdOrEmail: {
    id: 'Input Email/UserID',
    en: 'Input Email/UserID'
  },
  inputUserIdLower: {
    id: 'input valid user id',
    en: 'Input valid user ID'
  },
  inputPassword: {
    id: 'Input Password',
    en: 'Input Password'
  },
  inputPasswordLower: {
    id: 'input valid password',
    en: 'Input valid password'
  },
  userIdSuccess: {
    id: 'UserID Successfully added',
    en: 'UserID Successfully added'
  },
  userIdOrEmailSuccess: {
    id: 'Email/UserID Successfully added',
    en: 'Email/UserID Successfully added'
  },
  userIdSuccessLower: {
    id: 'valid user ID was entered',
    en: 'Valid user ID was entered'
  },
  passwordSuccess: {
    id: 'Password Successfully added',
    en: 'Password Successfully added'
  },
  passwordSuccessLower: {
    id: 'valid password was entered',
    en: 'Valid password was entered'
  },
  
  // Login Button
  clickLogin: {
    id: 'Click button Login',
    en: 'Click button Login'
  },
  clickLoginLower: {
    id: 'Click login',
    en: 'Click login'
  },
  tapLogin: {
    id: 'Tap button Login',
    en: 'Tap button Login'
  },
  loginPinFormDisplayed: {
    id: 'Form PIN ditampilkan.',
    en: 'PIN Form displayed.'
  },
  loginDirectToPin: {
    id: 'Success direct to PIN page',
    en: 'Success direct to PIN page'
  },
  loginDirectToInvestHome: {
    id: 'Diarahkan ke homepage Growin Invest.',
    en: 'Directed to Growin Invest homepage.'
  },
  loginDirectToHome: {
    id: 'Success login dan diarahkan ke homepage.',
    en: 'Successfully logged in and directed to homepage.'
  },
  loginSuccessHomeOpen: {
    id: 'success to login, home screen open',
    en: 'Successfully logged in, home screen open'
  },

  // PIN
  inputPin: {
    id: 'Input valid PIN',
    en: 'Input valid PIN'
  },
  inputPinLower: {
    id: 'input valid pin',
    en: 'Input valid PIN'
  },
  inputPinSuccessToPro: {
    id: 'Success login dan diarahkan ke homepage Growin Pro.',
    en: 'Successfully logged in and directed to Growin Pro homepage.'
  },
  inputPinSuccess: {
    id: 'Success input PIN',
    en: 'Successfully input PIN'
  },
  clickSubmit: {
    id: 'Click button submit',
    en: 'Click submit button'
  },
  submitPinSuccessIts: {
    id: 'Success input pin and direct to homepage its',
    en: 'Successfully input PIN and directed to ITS homepage'
  },
  clickEyeIcon: {
    id: 'click "eye" icon in portfolio',
    en: 'Click "eye" icon in portfolio'
  },
  pinFormShow: {
    id: 'input pin form show',
    en: 'PIN input form is shown'
  },
  restrictedInfoShow: {
    id: 'all restricted info was show',
    en: 'All restricted info is shown'
  },

  // Menu Selection
  selectMenuPattern: {
    id: 'Pilih menu %s.',
    en: 'Select %s menu.'
  },
  pageRenderPattern: {
    id: 'Halaman %s terbuka dan render dengan sempurna.',
    en: '%s page opens and renders perfectly.'
  },

  // Filter & Screener
  tapFilter: {
    id: 'Tap Filter',
    en: 'Tap Filter'
  },
  filterAppeared: {
    id: 'Bottomsheet Filter Appeared',
    en: 'Bottomsheet Filter Appeared'
  },
  inputFilter: {
    id: 'Input kriteria filter sesuai test data (contoh: Sector = Finance).',
    en: 'Input filter criteria according to test data (e.g. Sector = Finance).'
  },
  filterApplied: {
    id: 'Filter criteria di-apply di UI.',
    en: 'Filter criteria applied in UI.'
  },
  confirmFilter: {
    id: 'Confirm',
    en: 'Confirm'
  },
  filterSuccess: {
    id: 'Result filtered successfully according to selected criteria',
    en: 'Result filtered successfully according to selected criteria'
  },

  // Backtest
  addStockToBasket: {
    id: 'Masukkan saham ke dalam basket (contoh: BBCA, BBRI).',
    en: 'Add stocks to basket (e.g. BBCA, BBRI).'
  },
  stockAdded: {
    id: 'Saham masuk ke list basket.',
    en: 'Stocks added to basket list.'
  },
  selectPeriod: {
    id: 'Pilih periode historical data (contoh: 5 Years).',
    en: 'Select historical data period (e.g. 5 Years).'
  },
  periodSet: {
    id: 'Periode tersetting di UI.',
    en: 'Period set in UI.'
  },
  runBacktest: {
    id: 'Tap tombol "Run Backtest".',
    en: 'Tap "Run Backtest" button.'
  },
  backtestRunning: {
    id: 'Proses kalkulasi backtest berjalan.',
    en: 'Backtest calculation process is running.'
  },
  verifyChart: {
    id: 'Verifikasi hasil chart equity curve.',
    en: 'Verify equity curve chart results.'
  },
  chartRendered: {
    id: 'Chart dirender menampilkan perbandingan return vs benchmark.',
    en: 'Chart rendered displaying return vs benchmark comparison.'
  },

  // Presets
  setFilterParams: {
    id: 'Atur beberapa filter parameters.',
    en: 'Set several filter parameters.'
  },
  paramsSet: {
    id: 'Parameters tersetting.',
    en: 'Parameters are set.'
  },
  savePreset: {
    id: 'Tap "Save Preset", masukkan nama unik, lalu klik Save.',
    en: 'Tap "Save Preset", input unique name, then click Save.'
  },
  presetSaved: {
    id: 'Toast notification "Preset Saved" muncul.',
    en: '"Preset Saved" toast notification appears.'
  },
  openMyPresets: {
    id: 'Buka daftar My Presets.',
    en: 'Open My Presets list.'
  },
  presetAppears: {
    id: 'Preset yang baru disimpan tampil di daftar.',
    en: 'Newly saved preset appears in the list.'
  },

  // Export
  showDataInTable: {
    id: 'Tampilkan hasil data di tabel.',
    en: 'Show data results in table.'
  },
  tableHasData: {
    id: 'Tabel memiliki data > 0.',
    en: 'Table has > 0 data.'
  },
  clickExport: {
    id: 'Klik tombol Export as CSV.',
    en: 'Click Export as CSV button.'
  },
  downloadStarted: {
    id: 'Browser memulai download file CSV.',
    en: 'Browser starts downloading CSV file.'
  },
  openCsv: {
    id: 'Buka file CSV yang didownload.',
    en: 'Open downloaded CSV file.'
  },
  csvMatchesTable: {
    id: 'Isi file CSV sama persis dengan data yang ada di tabel UI.',
    en: 'CSV file contents exactly match UI table data.'
  },

  // Negative Scenarios
  triggerInvalid: {
    id: 'Picu kondisi batas atau invalid data.',
    en: 'Trigger edge cases or invalid data.'
  },
  invalidDetected: {
    id: 'Sistem mendeteksi aksi invalid.',
    en: 'System detects invalid action.'
  },
  verifyError: {
    id: 'Verifikasi error feedback dari sistem.',
    en: 'Verify system error feedback.'
  },
  errorDisplayed: {
    id: 'Muncul pesan error spesifik yang user-friendly (bukan system crash).',
    en: 'Specific user-friendly error message is shown (no system crash).'
  },

  // Generic Scenarios
  actionProcessed: {
    id: 'Aksi diproses oleh sistem.',
    en: 'Action processed by system.'
  },
  performActionPattern: {
    id: 'Lakukan aksi: %s',
    en: 'Perform action: %s'
  },
  actionSuccess: {
    id: 'Aksi berhasil dilakukan.',
    en: 'Action successfully performed.'
  },
  verifyFinalState: {
    id: 'Verifikasi state akhir di UI.',
    en: 'Verify final UI state.'
  },
  finalStatePattern: {
    id: 'Tampilan UI terupdate sesuai dengan aksi: %s',
    en: 'UI updated according to action: %s'
  },
  
  // Auth Steps
  openTargetPattern: {
    id: 'Buka %s',
    en: 'Open %s'
  },
  loginEntryDisplayed: {
    id: 'Halaman login ditampilkan',
    en: 'Login entry point is displayed'
  },
  credentialFormDisplayed: {
    id: 'Form kredensial ditampilkan',
    en: 'Credential form is displayed'
  },
  inputUserIdAuth: {
    id: 'Input valid User ID atau email',
    en: 'Input valid User ID or email'
  },
  userIdAccepted: {
    id: 'Input identitas diterima',
    en: 'User identity field accepts the value'
  },
  inputPasswordAuth: {
    id: 'Input password valid',
    en: 'Input valid password'
  },
  passwordAccepted: {
    id: 'Field password menerima input',
    en: 'Password field accepts the masked value'
  },
  credentialsSubmitted: {
    id: 'Kredensial berhasil di-submit',
    en: 'Credentials are submitted successfully'
  },
  inputOtp: {
    id: 'Input valid OTP',
    en: 'Input valid OTP'
  },
  otpAccepted: {
    id: 'OTP diterima',
    en: 'OTP is accepted'
  },
  pinAccepted: {
    id: 'PIN diterima',
    en: 'PIN is accepted'
  },
  verifyLoggedIn: {
    id: 'Verifikasi user berhasil login',
    en: 'Verify user is logged in'
  },
  sessionEstablished: {
    id: 'Sesi tersambung untuk akses terkait',
    en: 'Authenticated session is established for the required scope'
  }
};

export function t(key: keyof typeof DICTIONARY, ...args: string[]): string {
  const value = DICTIONARY[key];
  if (!value) return key;
  
  let text = value[currentLocale] || value['id'];
  if (args.length > 0) {
    args.forEach(arg => {
      text = text.replace('%s', arg);
    });
  }
  return text;
}
