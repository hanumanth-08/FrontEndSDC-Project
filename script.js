// --- Helper: Generate Synthetic Timeframe Curve ---
function createHistory(basePrice, count, volatility) {
  let arr = [];
  let cur = basePrice * (1 - volatility * (count / 10));
  for (let i = 0; i < count; i++) {
    cur += (Math.random() - 0.48) * (basePrice * volatility);
    cur = Math.max(1, cur);
    arr.push(+cur.toFixed(2));
  }
  arr.push(basePrice);
  return arr;
}

// --- Application State ---
const state = {
  activeSymbol: 'AAPL',
  orderType: 'BUY',
  timeframe: '1D',
  hoverIndex: null,
  filterCap: 'ALL',
  searchQuery: '',
  stocks: {
    AAPL: { name: 'Apple Inc.', category: 'Large Cap', price: 185.50, vol: 0.015 },
    MSFT: { name: 'Microsoft Corp.', category: 'Large Cap', price: 415.20, vol: 0.014 },
    GOOGL: { name: 'Alphabet Inc.', category: 'Large Cap', price: 168.40, vol: 0.016 },
    AMZN: { name: 'Amazon.com Inc.', category: 'Large Cap', price: 178.90, vol: 0.018 },
    META: { name: 'Meta Platforms', category: 'Large Cap', price: 495.30, vol: 0.022 },
    NVDA: { name: 'NVIDIA Corp.', category: 'Large Cap', price: 485.60, vol: 0.025 },
    TSLA: { name: 'Tesla Inc.', category: 'Large Cap', price: 238.40, vol: 0.030 },
    JPM: { name: 'JPMorgan Chase & Co.', category: 'Large Cap', price: 198.70, vol: 0.012 },
    V: { name: 'Visa Inc.', category: 'Large Cap', price: 275.40, vol: 0.011 },
    JNJ: { name: 'Johnson & Johnson', category: 'Large Cap', price: 156.10, vol: 0.009 },
    LLY: { name: 'Eli Lilly and Co.', category: 'Large Cap', price: 742.80, vol: 0.018 },
    WMT: { name: 'Walmart Inc.', category: 'Large Cap', price: 68.20, vol: 0.010 },
    DIS: { name: 'The Walt Disney Co.', category: 'Large Cap', price: 112.50, vol: 0.017 },
    PLTR: { name: 'Palantir Technologies', category: 'Small/Mid Cap', price: 28.40, vol: 0.035 },
    SOFI: { name: 'SoFi Technologies', category: 'Small/Mid Cap', price: 7.65, vol: 0.040 },
    RIVN: { name: 'Rivian Automotive', category: 'Small/Mid Cap', price: 13.80, vol: 0.045 },
    SMCI: { name: 'Super Micro Computer', category: 'Small/Mid Cap', price: 48.90, vol: 0.050 },
    CRWD: { name: 'CrowdStrike Holdings', category: 'Small/Mid Cap', price: 265.10, vol: 0.028 },
    CELH: { name: 'Celsius Holdings Inc.', category: 'Small/Mid Cap', price: 34.20, vol: 0.038 },
    RUN: { name: 'Sunrun Inc.', category: 'Small/Mid Cap', price: 11.45, vol: 0.048 },
    SYM: { name: 'Symbotic Inc.', category: 'Small/Mid Cap', price: 22.80, vol: 0.052 }
  }
};

function initStockHistories() {
  Object.keys(state.stocks).forEach(sym => {
    const s = state.stocks[sym];
    if (!s.history) {
      s.history = {
        '1D': createHistory(s.price, 30, s.vol * 0.4),
        '1W': createHistory(s.price, 40, s.vol * 0.8),
        '1M': createHistory(s.price, 50, s.vol * 1.2),
        '1Y': createHistory(s.price, 60, s.vol * 2.0),
        '3Y': createHistory(s.price, 75, s.vol * 3.2),
        '5Y': createHistory(s.price, 90, s.vol * 4.5)
      };
    }
  });
}
initStockHistories();

// --- LocalStorage State Handling ---
let currentSession = null;
let currentUser = null;
let isSignupMode = false;
let selectedPaymentMethod = 'PhonePe';
let pendingDepositAmount = 1000;

function getAllUserKeys() {
  return Object.keys(localStorage)
    .filter(k => k.startsWith('tradesim_user_'))
    .map(k => k.replace('tradesim_user_', ''));
}

function loadUserData(username) {
  const raw = localStorage.getItem(`tradesim_user_${username}`);
  if (raw) return JSON.parse(raw);
  return {
    username: username,
    clientId: 'TS-' + Math.floor(1000 + Math.random() * 9000),
    joinedDate: new Date().toLocaleDateString(),
    cash: 0.00,
    isKycVerified: false,
    kycStatus: 'NOT_SUBMITTED',
    kycDetails: null,
    portfolio: {},
    orders: []
  };
}

function saveUserData(userObj) {
  if (!userObj) return;
  localStorage.setItem(`tradesim_user_${userObj.username}`, JSON.stringify(userObj));
}

// --- DOM References ---
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authRole = document.getElementById('auth-role');
const authUsername = document.getElementById('auth-username');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const authToggleBox = document.getElementById('auth-toggle-box');
const authToggleMsg = document.getElementById('auth-toggle-msg');

const userModuleRoot = document.getElementById('user-module-root');
const adminModuleRoot = document.getElementById('admin-module-root');
const userNavTabs = document.getElementById('user-nav-tabs');
const adminNavTabs = document.getElementById('admin-nav-tabs');
const moduleIndicatorBadge = document.getElementById('module-indicator-badge');
const navUserLabel = document.getElementById('nav-user-label');
const userStatusMetrics = document.getElementById('user-status-metrics');
const btnUserLogout = document.getElementById('btn-user-logout');

// Admin Profile & Dropdown
const adminProfileContainer = document.getElementById('admin-profile-container');
const btnAdminProfileToggle = document.getElementById('btn-admin-profile-toggle');
const adminDropdownMenu = document.getElementById('admin-dropdown-menu');
const btnAdminLogout = document.getElementById('btn-admin-logout');

// KYC Elements
const kycOverlay = document.getElementById('kyc-overlay');
const closeKycBtn = document.getElementById('close-kyc-btn');
const kycForm = document.getElementById('kyc-form');
const kycWarningBanner = document.getElementById('kyc-warning-banner');
const navKycStatus = document.getElementById('nav-kyc-status');

// Groww Multi-Step Checkout Elements
const depositOverlay = document.getElementById('deposit-overlay');
const openDepositBtn = document.getElementById('open-deposit-btn');
const closeDepositBtn = document.getElementById('close-deposit-btn');
const growwBackBtn = document.getElementById('groww-back-btn');
const growwStepTitle = document.getElementById('groww-step-title');
const growwStepSub = document.getElementById('groww-step-sub');

const growwStep1 = document.getElementById('groww-step-1');
const growwStep2 = document.getElementById('groww-step-2');
const growwStep3 = document.getElementById('groww-step-3');
const growwStep4 = document.getElementById('groww-step-4');

const depositCustomAmt = document.getElementById('deposit-custom-amt');
const btnStep1Continue = document.getElementById('btn-step1-continue');
const step2AmountLabel = document.getElementById('step2-amount-label');
const btnStep2Proceed = document.getElementById('btn-step2-proceed');

const pinBrandBadge = document.getElementById('pin-brand-badge');
const pinAmountDue = document.getElementById('pin-amount-due');
const pinBoxes = document.querySelectorAll('.pin-box');
const btnSubmitPin = document.getElementById('btn-submit-pin');

const successCreditedAmount = document.getElementById('success-credited-amount');
const successMetaMsg = document.getElementById('success-meta-msg');
const successTxId = document.getElementById('success-tx-id');
const btnFinishDeposit = document.getElementById('btn-finish-deposit');
const depositLoader = document.getElementById('deposit-loader');
const depositLoaderText = document.getElementById('deposit-loader-text');

// User KPI Ribbon
const navCash = document.getElementById('nav-cash');
const kpiCash = document.getElementById('kpi-cash');
const kpiInvested = document.getElementById('kpi-invested');
const kpiNetworth = document.getElementById('kpi-networth');
const kpiPnl = document.getElementById('kpi-pnl');
const navHoldingsBadge = document.getElementById('nav-holdings-badge');
const navOrdersBadge = document.getElementById('nav-orders-badge');

const watchlistBody = document.getElementById('watchlist-body');
const screenerSearch = document.getElementById('screener-search');
const screenerFilter = document.getElementById('screener-filter');

const tradeActiveName = document.getElementById('trade-active-name');
const tradeActiveCategory = document.getElementById('trade-active-category');
const tradeActivePrice = document.getElementById('trade-active-price');
const tradeActiveDelta = document.getElementById('trade-active-delta');
const tradeHoverPrice = document.getElementById('trade-hover-price');
const orderSymbolSelect = document.getElementById('order-symbol-select');
const posSym = document.getElementById('pos-sym');
const posDetails = document.getElementById('pos-details');

const fullHoldingsBody = document.getElementById('full-holdings-body');
const fullOrdersBody = document.getElementById('full-orders-body');
const orderForm = document.getElementById('order-form');
const orderQty = document.getElementById('order-qty');
const orderUnitPrice = document.getElementById('order-unit-price');
const orderTotal = document.getElementById('order-total');
const btnBuy = document.getElementById('btn-buy');
const btnSell = document.getElementById('btn-sell');
const btnSubmit = document.getElementById('btn-submit');

const canvas = document.getElementById('price-chart');
const ctx = canvas.getContext('2d');
const crosshair = document.getElementById('chart-crosshair');
const tooltip = document.getElementById('chart-tooltip');

const adminKpiUsers = document.getElementById('admin-kpi-users');
const adminKpiKycPending = document.getElementById('admin-kpi-kyc-pending');
const adminKpiTotalCash = document.getElementById('admin-kpi-total-cash');
const adminKpiStocks = document.getElementById('admin-kpi-stocks');
const adminUsersBody = document.getElementById('admin-users-body');
const adminStocksBody = document.getElementById('admin-stocks-body');
const adminAddStockForm = document.getElementById('admin-add-stock-form');

function refreshSymbolSelect() {
  orderSymbolSelect.innerHTML = Object.keys(state.stocks).map(sym => `
    <option value="${sym}">${sym} - ${state.stocks[sym].name}</option>
  `).join('');
}
refreshSymbolSelect();

// --- Auth & Redirection ---
authRole.addEventListener('change', () => {
  if (authRole.value === 'admin') {
    authToggleBox.classList.add('hidden');
    authUsername.value = 'admin';
    authPassword.value = '';
    authSubmitBtn.textContent = 'Enter Admin Dashboard';
  } else {
    authToggleBox.classList.remove('hidden');
    authUsername.value = '';
    authPassword.value = '';
    authSubmitBtn.textContent = isSignupMode ? 'Register Client Demat' : 'Access Trading Terminal';
  }
});

authToggleBtn.addEventListener('click', () => {
  isSignupMode = !isSignupMode;
  if (isSignupMode) {
    authSubmitBtn.textContent = 'Register Client Demat';
    authToggleMsg.textContent = 'Already have an account?';
    authToggleBtn.textContent = 'Log In';
  } else {
    authSubmitBtn.textContent = 'Access Trading Terminal';
    authToggleMsg.textContent = "Don't have an account?";
    authToggleBtn.textContent = 'Sign Up';
  }
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const role = authRole.value;
  const username = authUsername.value.trim().toLowerCase();
  const password = authPassword.value;

  if (role === 'admin') {
    if (username === 'admin' && password === 'admin123') {
      currentSession = { role: 'admin', username: 'admin' };
      sessionStorage.setItem('tradesim_session', JSON.stringify(currentSession));
      authOverlay.classList.add('hidden');
      redirectModule('admin');
      return;
    } else {
      return alert('Invalid Admin Credentials! Use username "admin" and password "admin123".');
    }
  }

  if (!username || !password) return alert('Enter both username and password.');
  const storedPwd = localStorage.getItem(`tradesim_pwd_${username}`);

  if (isSignupMode) {
    if (storedPwd) return alert('Username already registered! Please log in.');
    localStorage.setItem(`tradesim_pwd_${username}`, password);
    currentUser = loadUserData(username);
    saveUserData(currentUser);
  } else {
    if (!storedPwd) return alert('User does not exist! Please click Sign Up.');
    if (storedPwd !== password) return alert('Incorrect password.');
    currentUser = loadUserData(username);
  }

  currentSession = { role: 'user', username: username };
  sessionStorage.setItem('tradesim_session', JSON.stringify(currentSession));
  authOverlay.classList.add('hidden');
  redirectModule('user');

  if (currentUser && currentUser.kycStatus === 'NOT_SUBMITTED') {
    setTimeout(() => kycOverlay.classList.remove('hidden'), 400);
  }
});

function redirectModule(role) {
  if (role === 'admin') {
    userModuleRoot.classList.add('hidden');
    adminModuleRoot.classList.remove('hidden');
    userNavTabs.classList.add('hidden');
    adminNavTabs.classList.remove('hidden');
    userStatusMetrics.classList.add('hidden');
    adminProfileContainer.classList.remove('hidden');
    moduleIndicatorBadge.textContent = 'ADMIN CONSOLE';
    moduleIndicatorBadge.style.backgroundColor = '#ef4444';
    renderAdminDashboard();
  } else {
    adminModuleRoot.classList.add('hidden');
    userModuleRoot.classList.remove('hidden');
    adminNavTabs.classList.add('hidden');
    userNavTabs.classList.remove('hidden');
    userStatusMetrics.classList.remove('hidden');
    adminProfileContainer.classList.add('hidden');
    moduleIndicatorBadge.textContent = 'USER PORTAL';
    moduleIndicatorBadge.style.backgroundColor = '#0284c7';
    navUserLabel.textContent = currentUser ? currentUser.username.toUpperCase() : 'Sign Out';
    initUserSession();
  }
}

function checkActiveSession() {
  const sessionRaw = sessionStorage.getItem('tradesim_session');
  if (sessionRaw) {
    currentSession = JSON.parse(sessionRaw);
    if (currentSession.role === 'admin') {
      authOverlay.classList.add('hidden');
      redirectModule('admin');
      return;
    } else if (currentSession.role === 'user') {
      currentUser = loadUserData(currentSession.username);
      authOverlay.classList.add('hidden');
      redirectModule('user');
      return;
    }
  }
  authOverlay.classList.remove('hidden');
}

// User Logout
btnUserLogout.addEventListener('click', () => {
  sessionStorage.removeItem('tradesim_session');
  currentSession = null;
  currentUser = null;
  authOverlay.classList.remove('hidden');
});

// Admin Profile Dropdown & Logout
btnAdminProfileToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  adminDropdownMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  adminDropdownMenu.classList.add('hidden');
});

btnAdminLogout.addEventListener('click', () => {
  sessionStorage.removeItem('tradesim_session');
  currentSession = null;
  adminDropdownMenu.classList.add('hidden');
  authOverlay.classList.remove('hidden');
});

function setupTabNavigation(containerId) {
  document.getElementById(containerId).addEventListener('click', (e) => {
    if (!e.target.classList.contains('nav-tab-btn')) return;
    const tabId = e.target.dataset.tab;
    const parent = e.target.parentElement;
    parent.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.toggle('active', b === e.target));

    const root = containerId === 'user-nav-tabs' ? userModuleRoot : adminModuleRoot;
    root.querySelectorAll('.tab-view').forEach(v => {
      v.classList.toggle('active', v.id === tabId);
      v.classList.toggle('hidden', v.id !== tabId);
    });

    if (tabId === 'trade-view') setTimeout(drawInteractiveChart, 50);
  });
}
setupTabNavigation('user-nav-tabs');
setupTabNavigation('admin-nav-tabs');

// --- User Module Logic ---
function initUserSession() {
  updateUserKYCVisuals();
  updateUserKPIRibbon();
  renderWatchlist();
  renderHoldings();
  renderOrders();
  renderTradeHeader();
  drawInteractiveChart();
}

function updateUserKYCVisuals() {
  if (!currentUser) return;
  if (currentUser.isKycVerified) {
    navKycStatus.textContent = 'KYC Verified';
    navKycStatus.className = 'badge badge-green';
    kycWarningBanner.classList.add('hidden');
  } else if (currentUser.kycStatus === 'PENDING') {
    navKycStatus.textContent = 'KYC Under Review';
    navKycStatus.className = 'badge badge-amber';
    kycWarningBanner.textContent = '⏳ KYC Submitted: Waiting for Administrator verification approval.';
    kycWarningBanner.classList.remove('hidden');
  } else {
    navKycStatus.textContent = 'KYC Required';
    navKycStatus.className = 'badge badge-red cursor-pointer';
    kycWarningBanner.textContent = '⚠️ KYC Required: Digital KYC must be approved by the Admin before trading.';
    kycWarningBanner.classList.remove('hidden');
  }
}

navKycStatus.addEventListener('click', () => {
  if (!currentUser.isKycVerified) kycOverlay.classList.remove('hidden');
});
closeKycBtn.addEventListener('click', () => kycOverlay.classList.add('hidden'));

kycForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const pan = document.getElementById('kyc-pan').value.trim().toUpperCase();
  const aadhaar = document.getElementById('kyc-aadhaar').value.trim();
  const fullname = document.getElementById('kyc-fullname').value.trim();
  const bank = document.getElementById('kyc-bank').value.trim();

  if (pan.length !== 10) return alert('Enter valid 10-character PAN.');
  if (aadhaar.length !== 12) return alert('Enter valid 12-digit Aadhaar.');

  currentUser.kycStatus = 'PENDING';
  currentUser.kycDetails = { fullname, pan, aadhaar, bank };
  saveUserData(currentUser);
  updateUserKYCVisuals();
  kycOverlay.classList.add('hidden');
  alert('KYC details submitted! Switch to Admin Module to approve it.');
});

// ==================== GROWW-STYLE STEP-BY-STEP PAYMENT CONTROLLER ====================
function showGrowwStep(stepNumber) {
  growwStep1.classList.add('hidden');
  growwStep2.classList.add('hidden');
  growwStep3.classList.add('hidden');
  growwStep4.classList.add('hidden');

  if (stepNumber === 1) {
    growwStep1.classList.remove('hidden');
    growwBackBtn.classList.add('hidden');
    growwStepTitle.textContent = 'Add Money to Wallet';
    growwStepSub.textContent = 'Step 1 of 3: Enter Amount';
  } else if (stepNumber === 2) {
    growwStep2.classList.remove('hidden');
    growwBackBtn.classList.remove('hidden');
    growwStepTitle.textContent = 'Select Payment Method';
    growwStepSub.textContent = 'Step 2 of 3: UPI / Cards / Net Banking';
    step2AmountLabel.textContent = `$${pendingDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  } else if (stepNumber === 3) {
    growwStep3.classList.remove('hidden');
    growwBackBtn.classList.remove('hidden');
    growwStepTitle.textContent = 'UPI Security PIN';
    growwStepSub.textContent = 'Step 3 of 3: Authenticate with PIN';
    pinBrandBadge.textContent = `${selectedPaymentMethod} Gateway`;
    pinAmountDue.textContent = `$${pendingDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    pinBoxes.forEach(b => b.value = '');
    setTimeout(() => pinBoxes[0].focus(), 100);
  } else if (stepNumber === 4) {
    growwStep4.classList.remove('hidden');
    growwBackBtn.classList.add('hidden');
    growwStepTitle.textContent = 'Payment Completed';
    growwStepSub.textContent = 'Transaction Successful';
    successCreditedAmount.textContent = `+$${pendingDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    successMetaMsg.textContent = `Money credited to wallet via ${selectedPaymentMethod}`;
    successTxId.textContent = `TXN: ${selectedPaymentMethod.toUpperCase()}/2026/${Math.floor(100000 + Math.random() * 900000)}`;
  }
}

openDepositBtn.addEventListener('click', () => {
  pendingDepositAmount = parseFloat(depositCustomAmt.value) || 1000;
  showGrowwStep(1);
  depositOverlay.classList.remove('hidden');
});

closeDepositBtn.addEventListener('click', () => {
  depositOverlay.classList.add('hidden');
});

growwBackBtn.addEventListener('click', () => {
  if (!growwStep2.classList.contains('hidden')) showGrowwStep(1);
  else if (!growwStep3.classList.contains('hidden')) showGrowwStep(2);
});

// Step 1: Quick Amount Chips
document.querySelectorAll('.quick-amt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-amt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    depositCustomAmt.value = btn.dataset.amt;
  });
});

btnStep1Continue.addEventListener('click', () => {
  const amt = parseFloat(depositCustomAmt.value);
  if (isNaN(amt) || amt <= 0) return alert('Enter a valid deposit amount.');
  pendingDepositAmount = amt;
  showGrowwStep(2);
});

// Step 2: Payment Method Selectors
document.querySelectorAll('.pay-option').forEach(tile => {
  tile.addEventListener('click', () => {
    document.querySelectorAll('.pay-option').forEach(t => {
      t.classList.remove('selected');
      t.querySelector('input[type="radio"]').checked = false;
    });
    tile.classList.add('selected');
    tile.querySelector('input[type="radio"]').checked = true;
    selectedPaymentMethod = tile.dataset.method;
  });
});

btnStep2Proceed.addEventListener('click', () => {
  showGrowwStep(3);
});

// Step 3: PIN Input Auto-Focus Handling
pinBoxes.forEach((box, index) => {
  box.addEventListener('input', (e) => {
    if (e.target.value.length === 1 && index < pinBoxes.length - 1) {
      pinBoxes[index + 1].focus();
    }
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      pinBoxes[index - 1].focus();
    }
  });
});

btnSubmitPin.addEventListener('click', () => {
  let pinVal = '';
  pinBoxes.forEach(b => pinVal += b.value);
  if (pinVal.length < 4) return alert('Please enter your 4-digit PIN to authorize payment.');

  // Trigger banking simulation overlay
  depositLoader.classList.remove('hidden');
  depositLoaderText.textContent = `Authorizing $${pendingDepositAmount.toFixed(2)} with ${selectedPaymentMethod}...`;

  setTimeout(() => {
    depositLoader.classList.add('hidden');
    currentUser.cash = +(currentUser.cash + pendingDepositAmount).toFixed(2);
    saveUserData(currentUser);
    updateUserKPIRibbon();
    showGrowwStep(4);
  }, 1400);
});

// Step 4: Finish and close
btnFinishDeposit.addEventListener('click', () => {
  depositOverlay.classList.add('hidden');
});

function updateUserKPIRibbon() {
  if (!currentUser) return;
  let invested = 0;
  let cost = 0;
  Object.entries(currentUser.portfolio).forEach(([sym, pos]) => {
    invested += pos.qty * state.stocks[sym].price;
    cost += pos.qty * pos.avgPrice;
  });

  const pnl = invested - cost;
  const net = currentUser.cash + invested;
  const isPos = pnl >= 0;

  navCash.textContent = `$${currentUser.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  kpiCash.textContent = `$${currentUser.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  kpiInvested.textContent = `$${invested.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  kpiNetworth.textContent = `$${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  kpiPnl.textContent = `${isPos ? '+' : ''}$${pnl.toFixed(2)}`;
  kpiPnl.className = `kpi-val ${isPos ? 'text-green' : 'text-red'}`;
}

// Watchlist & Screener
function renderWatchlist() {
  const search = state.searchQuery.toLowerCase();
  const filter = state.filterCap;

  const filtered = Object.entries(state.stocks).filter(([sym, s]) => {
    const matchS = sym.toLowerCase().includes(search) || s.name.toLowerCase().includes(search);
    const matchF = filter === 'ALL' || s.category === filter;
    return matchS && matchF;
  });

  watchlistBody.innerHTML = filtered.map(([sym, item]) => {
    const firstP = item.history['1D'][0] || item.price;
    const pct = (((item.price - firstP) / firstP) * 100).toFixed(2);
    const isUp = pct >= 0;

    return `
      <tr class="table-row">
        <td class="font-bold text-white">${sym}</td>
        <td style="color: var(--text-secondary);">${item.name}</td>
        <td><span class="cat-tag" style="font-size: 0.65rem;">${item.category}</span></td>
        <td class="font-mono font-bold text-white">$${item.price.toFixed(2)}</td>
        <td class="font-mono ${isUp ? 'text-green' : 'text-red'}">${isUp ? '+' : ''}${pct}%</td>
        <td class="text-right">
          <button class="select-btn" onclick="startTrade('${sym}')">Open Trade Desk</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.startTrade = (sym) => {
  state.activeSymbol = sym;
  orderSymbolSelect.value = sym;
  renderTradeHeader();
  document.querySelector('#user-nav-tabs [data-tab="trade-view"]').click();
};

screenerSearch.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderWatchlist();
});

screenerFilter.addEventListener('change', (e) => {
  state.filterCap = e.target.value;
  renderWatchlist();
});

// Chart & Trade Desk
function renderTradeHeader() {
  const s = state.stocks[state.activeSymbol];
  tradeActiveName.textContent = `${s.name} (${state.activeSymbol})`;
  tradeActiveCategory.textContent = s.category;
  tradeActivePrice.textContent = `$${s.price.toFixed(2)}`;

  const curData = s.history[state.timeframe];
  const firstP = curData[0] || s.price;
  const pct = (((s.price - firstP) / firstP) * 100).toFixed(2);
  const isUp = pct >= 0;

  tradeActiveDelta.className = `badge ${isUp ? 'badge-green' : 'badge-red'}`;
  tradeActiveDelta.textContent = `${isUp ? '+' : ''}${pct}%`;

  orderUnitPrice.textContent = `$${s.price.toFixed(2)}`;
  const qty = Math.max(1, parseInt(orderQty.value) || 1);
  orderTotal.textContent = `$${(s.price * qty).toFixed(2)}`;

  posSym.textContent = state.activeSymbol;
  if (currentUser && currentUser.portfolio[state.activeSymbol]) {
    const pos = currentUser.portfolio[state.activeSymbol];
    posDetails.textContent = `${pos.qty} units (Avg: $${pos.avgPrice.toFixed(2)} | Val: $${(pos.qty * s.price).toFixed(2)})`;
  } else {
    posDetails.textContent = `0 units ($0.00)`;
  }
}

orderSymbolSelect.addEventListener('change', (e) => {
  state.activeSymbol = e.target.value;
  renderTradeHeader();
  drawInteractiveChart();
});

orderQty.addEventListener('input', renderTradeHeader);

btnBuy.addEventListener('click', () => {
  state.orderType = 'BUY';
  btnBuy.className = 'toggle-btn active-buy';
  btnSell.className = 'toggle-btn';
  btnSubmit.className = 'submit-btn btn-green';
  btnSubmit.textContent = 'Confirm Purchase';
});

btnSell.addEventListener('click', () => {
  state.orderType = 'SELL';
  btnSell.className = 'toggle-btn active-sell';
  btnBuy.className = 'toggle-btn';
  btnSubmit.className = 'submit-btn btn-red';
  btnSubmit.textContent = 'Confirm Sale';
});

orderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentUser) return;
  if (!currentUser.isKycVerified) {
    alert('Compliance Warning: Trade blocked! Your KYC is not verified by the Admin yet.');
    return;
  }

  const qty = parseInt(orderQty.value);
  if (!qty || qty <= 0) return alert('Enter valid share count.');

  const sym = state.activeSymbol;
  const stock = state.stocks[sym];
  const total = +(stock.price * qty).toFixed(2);

  if (state.orderType === 'BUY') {
    if (currentUser.cash < total) return alert('Insufficient wallet balance! Click + Add Money.');
    currentUser.cash = +(currentUser.cash - total).toFixed(2);

    if (!currentUser.portfolio[sym]) {
      currentUser.portfolio[sym] = { qty, avgPrice: stock.price, companyName: stock.name };
    } else {
      const prev = currentUser.portfolio[sym];
      prev.avgPrice = +(((prev.qty * prev.avgPrice) + total) / (prev.qty + qty)).toFixed(2);
      prev.qty += qty;
    }
  } else {
    if (!currentUser.portfolio[sym] || currentUser.portfolio[sym].qty < qty) {
      return alert(`Cannot sell. You do not hold ${qty} shares of ${sym}.`);
    }
    currentUser.cash = +(currentUser.cash + total).toFixed(2);
    currentUser.portfolio[sym].qty -= qty;
    if (currentUser.portfolio[sym].qty === 0) delete currentUser.portfolio[sym];
  }

  currentUser.orders.unshift({
    id: Math.floor(100000 + Math.random() * 900000),
    timestamp: new Date().toLocaleTimeString(),
    type: state.orderType,
    symbol: sym,
    qty: qty,
    price: stock.price,
    total: total
  });

  saveUserData(currentUser);
  orderQty.value = 1;
  updateUserKPIRibbon();
  renderHoldings();
  renderOrders();
  renderTradeHeader();
  alert('Order executed successfully!');
});

function renderHoldings() {
  if (!currentUser) return;
  const keys = Object.keys(currentUser.portfolio);
  navHoldingsBadge.textContent = keys.length;

  if (keys.length === 0) {
    fullHoldingsBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#64748b;">No active shares held in portfolio.</td></tr>`;
    return;
  }

  fullHoldingsBody.innerHTML = keys.map(sym => {
    const pos = currentUser.portfolio[sym];
    const curP = state.stocks[sym].price;
    const curVal = pos.qty * curP;
    const pnl = (curP - pos.avgPrice) * pos.qty;
    const ret = (((curP - pos.avgPrice) / pos.avgPrice) * 100).toFixed(2);
    const isPos = pnl >= 0;

    return `
      <tr>
        <td class="font-bold text-white">${sym}</td>
        <td style="color:#94a3b8;">${pos.companyName}</td>
        <td class="font-bold">${pos.qty}</td>
        <td class="font-mono">$${pos.avgPrice.toFixed(2)}</td>
        <td class="font-mono">$${curP.toFixed(2)}</td>
        <td class="font-mono font-bold text-white">$${curVal.toFixed(2)}</td>
        <td class="font-mono ${isPos ? 'text-green' : 'text-red'} font-bold">${isPos ? '+' : ''}$${pnl.toFixed(2)}</td>
        <td class="font-mono ${isPos ? 'text-green' : 'text-red'}">${isPos ? '+' : ''}${ret}%</td>
        <td class="text-right"><button class="select-btn" onclick="startTrade('${sym}')">Trade</button></td>
      </tr>
    `;
  }).join('');
}

function renderOrders() {
  if (!currentUser) return;
  navOrdersBadge.textContent = currentUser.orders.length;

  if (currentUser.orders.length === 0) {
    fullOrdersBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No past trades recorded.</td></tr>`;
    return;
  }

  fullOrdersBody.innerHTML = currentUser.orders.map(o => `
    <tr>
      <td class="font-mono" style="color:#64748b;">#${o.id}</td>
      <td style="color:#94a3b8;">${o.timestamp}</td>
      <td><span class="badge ${o.type === 'BUY' ? 'badge-green' : 'badge-red'}">${o.type}</span></td>
      <td class="font-bold text-white">${o.symbol}</td>
      <td>${o.qty}</td>
      <td class="font-mono">$${o.price.toFixed(2)}</td>
      <td class="font-mono font-bold text-white">$${o.total.toFixed(2)}</td>
    </tr>
  `).join('');
}

function drawInteractiveChart() {
  if (!canvas.offsetParent) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const dataset = state.stocks[state.activeSymbol].history[state.timeframe];
  const min = Math.min(...dataset) * 0.99;
  const max = Math.max(...dataset) * 1.01;
  const range = max - min || 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (canvas.height / 5) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '10px monospace';
    ctx.fillText(`$${(max - ((i / 5) * range)).toFixed(2)}`, 8, y - 4);
  }

  const isUp = dataset[dataset.length - 1] >= dataset[0];
  const color = isUp ? '#10b981' : '#f43f5e';

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)');
  grad.addColorStop(1, 'rgba(3, 7, 18, 0)');

  ctx.beginPath();
  dataset.forEach((v, i) => {
    const x = (canvas.width / (dataset.length - 1)) * i;
    const y = canvas.height - ((v - min) / range) * canvas.height;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
  dataset.forEach((v, i) => {
    const x = (canvas.width / (dataset.length - 1)) * i;
    const y = canvas.height - ((v - min) / range) * canvas.height;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

document.getElementById('timeframe-container').addEventListener('click', (e) => {
  if (!e.target.classList.contains('tf-btn')) return;
  document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  state.timeframe = e.target.dataset.tf;
  drawInteractiveChart();
});

// --- ADMIN MODULE ENGINE ---
function renderAdminDashboard() {
  const userKeys = getAllUserKeys();
  let totalCirculatingCash = 0;
  let pendingKycCount = 0;

  adminUsersBody.innerHTML = userKeys.map(uname => {
    const u = loadUserData(uname);
    totalCirculatingCash += u.cash || 0;
    if (u.kycStatus === 'PENDING') pendingKycCount++;

    let badgeClass = 'badge-red';
    if (u.isKycVerified) badgeClass = 'badge-green';
    else if (u.kycStatus === 'PENDING') badgeClass = 'badge-amber';

    return `
      <tr>
        <td class="font-mono text-white">${u.clientId}</td>
        <td class="font-bold text-white">${u.username}</td>
        <td class="font-mono text-green">$${(u.cash || 0).toFixed(2)}</td>
        <td>${u.kycDetails ? u.kycDetails.fullname : '<span style="color:#64748b;">Not Entered</span>'}</td>
        <td class="font-mono">${u.kycDetails ? u.kycDetails.pan : 'N/A'}</td>
        <td><span class="badge ${badgeClass}">${u.kycStatus}</span></td>
        <td class="text-right">
          ${u.kycStatus === 'PENDING' ? `
            <button class="select-btn" style="background:#059669; color:#fff;" onclick="adminVerifyUser('${u.username}', true)">Approve KYC</button>
            <button class="select-btn" style="background:#dc2626; color:#fff;" onclick="adminVerifyUser('${u.username}', false)">Reject</button>
          ` : u.isKycVerified ? `
            <span style="color:#10b981; font-size:0.75rem;">Verified</span>
          ` : `
            <span style="color:#64748b; font-size:0.75rem;">Awaiting Client Submission</span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  adminKpiUsers.textContent = userKeys.length;
  adminKpiKycPending.textContent = pendingKycCount;
  adminKpiTotalCash.textContent = `$${totalCirculatingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  adminKpiStocks.textContent = Object.keys(state.stocks).length;

  adminStocksBody.innerHTML = Object.entries(state.stocks).map(([sym, item]) => `
    <tr>
      <td class="font-bold text-white">${sym}</td>
      <td style="color:#94a3b8;">${item.name}</td>
      <td class="font-mono text-green">$${item.price.toFixed(2)}</td>
      <td class="text-right">
        <button class="select-btn" onclick="adminBoostPrice('${sym}')">+5% Boost</button>
      </td>
    </tr>
  `).join('');
}

window.adminVerifyUser = (username, isApproved) => {
  const u = loadUserData(username);
  if (isApproved) {
    u.isKycVerified = true;
    u.kycStatus = 'VERIFIED';
    if (u.cash === 0) u.cash = 10000.00;
    alert(`e-KYC Approved for client: ${username}. $10,000 credit allocated.`);
  } else {
    u.isKycVerified = false;
    u.kycStatus = 'REJECTED';
    alert(`e-KYC Rejected for client: ${username}.`);
  }
  saveUserData(u);
  renderAdminDashboard();
};

window.adminBoostPrice = (sym) => {
  state.stocks[sym].price = +(state.stocks[sym].price * 1.05).toFixed(2);
  state.stocks[sym].history['1D'].push(state.stocks[sym].price);
  renderAdminDashboard();
};

adminAddStockForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const sym = document.getElementById('new-stock-symbol').value.trim().toUpperCase();
  const name = document.getElementById('new-stock-name').value.trim();
  const cat = document.getElementById('new-stock-category').value;
  const price = parseFloat(document.getElementById('new-stock-price').value);

  if (state.stocks[sym]) return alert('Ticker already exists on exchange!');

  state.stocks[sym] = {
    name: name,
    category: cat,
    price: price,
    vol: 0.02,
    history: {
      '1D': createHistory(price, 30, 0.01),
      '1W': createHistory(price, 40, 0.02),
      '1M': createHistory(price, 50, 0.03),
      '1Y': createHistory(price, 60, 0.04),
      '3Y': createHistory(price, 75, 0.05),
      '5Y': createHistory(price, 90, 0.06)
    }
  };

  refreshSymbolSelect();
  renderAdminDashboard();
  adminAddStockForm.reset();
  alert(`IPO Successful: ${sym} (${name}) is now listed on TradeSim!`);
});

// Simulation Heartbeat Loop
setInterval(() => {
  Object.keys(state.stocks).forEach(sym => {
    const s = state.stocks[sym];
    const delta = (Math.random() - 0.49) * (s.price * (s.vol * 0.35));
    s.price = Math.max(1.0, +(s.price + delta).toFixed(2));
    s.history['1D'].push(s.price);
    if (s.history['1D'].length > 30) s.history['1D'].shift();
  });

  if (currentSession && currentSession.role === 'user') {
    renderWatchlist();
    renderTradeHeader();
    renderHoldings();
    updateUserKPIRibbon();
    drawInteractiveChart();
  }
}, 2000);

window.addEventListener('resize', drawInteractiveChart);

checkActiveSession();