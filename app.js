/* ─────────────────────────────────────────
   TrustUs  |  app.js
───────────────────────────────────────── */

// ── CONFIG ──────────────────────────────
const JSONBIN_BIN_ID  = '69ca1013856a682189df3699';
const JSONBIN_API_KEY = '$2a$10$XIck1iLy4FcsRn5L01isSOC4cbZ0STYYxKy4MM5S6RO0Hv/FBby2e';
const JSONBIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// ── STATE ────────────────────────────────
let pendingUser  = null;
let currentOTP   = null;
let loggedInUser = null;
let dataCount    = 847;
let threatCount  = 1247391;
let earned       = 2.541;

// ── DATA COUNTER (ticks up constantly) ──
setInterval(() => {
  dataCount += Math.floor(Math.random() * 3) + 1;
  const el = document.getElementById('dataCount');
  if (el) el.textContent = dataCount.toLocaleString();
}, 1800);

// ── COOKIE BANNER ────────────────────────
function closeCookies() {
  const overlay = document.getElementById('cookieOverlay');
  overlay.style.opacity    = '0';
  overlay.style.transition = 'opacity 0.3s ease';
  setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

// ── HELPERS ─────────────────────────────
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  el.style.display = 'block';
}
function hideMsg(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  el.style.display = 'none';
}
function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  el.style.display = 'block';
}
function setBtnLoading(id, loading, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Please wait';
  } else {
    btn.disabled  = false;
    btn.textContent = label || btn.dataset.label || 'Submit';
  }
}

// ── TAB SWITCHER ─────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  ['loginError','loginSuccess','signupError','otpError','otpSuccess','forgotError'].forEach(hideMsg);

  const el = document.getElementById('forgotReveal');
  if (el) el.style.display = 'none';

  const map = {
    login:   { form: 'loginForm',    tab: 'tabLogin'  },
    signup:  { form: 'signupForm',   tab: 'tabSignup' },
    forgot:  { form: 'forgotForm',   tab: 'tabLogin'  },
    otp:     { form: 'otpForm',      tab: 'tabSignup' },
    success: { form: 'successScreen',tab: 'tabSignup' },
  };
  if (!map[tab]) return;
  document.getElementById(map[tab].form).classList.add('active');
  document.getElementById(map[tab].tab).classList.add('active');
}

// ── PASSWORD VISIBILITY ───────────────────
function togglePass(inputId, btn) {
  const inp = document.getElementById(inputId);
  inp.type  = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? 'show' : 'hide';
}

// ── PASSWORD STRENGTH ────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const pw = document.getElementById('regPassword');
  if (!pw) return;
  pw.addEventListener('input', () => {
    const v = pw.value;
    let score = 0;
    if (v.length >= 6)           score++;
    if (v.length >= 10)          score++;
    if (/[A-Z]/.test(v))         score++;
    if (/[0-9]/.test(v))         score++;
    if (/[^A-Za-z0-9]/.test(v))  score++;
    const levels = [
      { pct:'0%',   color:'transparent', text:'' },
      { pct:'20%',  color:'#9B2335',     text:'Terrible. A toddler could guess this.' },
      { pct:'40%',  color:'#C0622B',     text:'Weak. We are already concerned.' },
      { pct:'65%',  color:'#B8972A',     text:'Mediocre. Like your life choices.' },
      { pct:'85%',  color:'#3A8C5C',     text:'Good. Genuinely surprised.' },
      { pct:'100%', color:'#2E6B47',     text:'Strong. Who are you?' },
    ];
    const lv = levels[score];
    document.getElementById('strengthFill').style.width           = lv.pct;
    document.getElementById('strengthFill').style.backgroundColor = lv.color;
    document.getElementById('strengthLabel').textContent          = lv.text;
  });
});

// ── JSONBIN ───────────────────────────────
async function fetchUsers() {
  const res = await fetch(JSONBIN_URL + '/latest', {
    headers: { 'X-Master-Key': JSONBIN_API_KEY, 'X-Bin-Meta': 'false' }
  });
  if (res.status === 200) {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  if (res.status === 404) return [];
  throw new Error('Database error ' + res.status);
}
async function saveUsers(users) {
  const res = await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_API_KEY },
    body: JSON.stringify(users)
  });
  if (!res.ok) throw new Error('Save failed ' + res.status);
}

// ── FORGOT PASSWORD ───────────────────────
async function handleForgot() {
  hideMsg('forgotError');
  const el = document.getElementById('forgotReveal');
  el.style.display = 'none';

  const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  if (!email) { showError('forgotError', 'Enter your email. We need to know whose password to expose.'); return; }

  setBtnLoading('forgotBtn', true);
  try {
    const users = await fetchUsers();
    const user  = users.find(u => u.email === email);
    if (!user) {
      showError('forgotError', 'No account found with that email. Maybe you forgot you never signed up. Also possible.');
      setBtnLoading('forgotBtn', false, 'Retrieve My Password');
      return;
    }
    el.innerHTML =
      `Your password, stored safely in plain text on our servers:<br>` +
      `<span class="plain-pw">${user.password}</span>` +
      `<span class="reveal-note">We have now emailed this to you, your employer, and Derek. Have a great day.</span>`;
    el.style.display = 'block';
    setBtnLoading('forgotBtn', false, 'Retrieve My Password');
  } catch (err) {
    showError('forgotError', 'Something went wrong. ' + err.message);
    setBtnLoading('forgotBtn', false, 'Retrieve My Password');
  }
}

// ── SIGN UP ──────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  hideMsg('signupError');

  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const phone = document.getElementById('regPhone').value.trim();
  const pass  = document.getElementById('regPassword').value;

  if (!name || !email || !phone || !pass) { showError('signupError', 'Fill everything in. We are needy like that.'); return; }
  if (pass.length < 6) { showError('signupError', 'At least 6 characters. Even we have some standards.'); return; }

  setBtnLoading('signupBtn', true);
  try {
    const users    = await fetchUsers();
    const dupEmail = users.find(u => u.email === email);
    if (dupEmail) {
      showError('signupError', `An account for ${email} already exists. Did you forget? Sad.`);
      setBtnLoading('signupBtn', false, 'Create Account'); return;
    }
    const dupPass = users.find(u => u.password === pass);
    if (dupPass) {
      showError('signupError', `This password is already used by ${dupPass.email}. Yes, we just told you their email. No, we do not feel bad.`);
      setBtnLoading('signupBtn', false, 'Create Account'); return;
    }

    pendingUser = { name, email, phone, password: pass, createdAt: new Date().toISOString() };
    currentOTP  = generateOTP();

    const masked = maskPhone(phone);
    document.getElementById('otpSentBox').innerHTML =
      `A 6-digit OTP was sent to your phone.<br>` +
      `<span class="otp-code">${formatOTP(currentOTP)}</span>` +
      `was sent to ${masked}<br>` +
      `<span class="otp-note">We are also displaying it right here on the page. For your convenience. And ours.</span>`;

    document.getElementById('otpInput').value = '';
    hideMsg('otpError'); hideMsg('otpSuccess');
    setBtnLoading('otpVerifyBtn', false, 'Verify');
    switchTab('otp');
    setBtnLoading('signupBtn', false, 'Create Account');
  } catch (err) {
    showError('signupError', 'Something went wrong. ' + err.message);
    setBtnLoading('signupBtn', false, 'Create Account');
  }
}

// ── OTP ───────────────────────────────────
function generateOTP()    { return String(Math.floor(100000 + Math.random() * 900000)); }
function formatOTP(otp)   { return otp.substring(0,3) + ' ' + otp.substring(3); }
function maskPhone(phone) {
  const c = phone.replace(/\s/g,'');
  if (c.length < 5) return phone;
  return c.substring(0,2) + 'x'.repeat(c.length - 4) + c.substring(c.length - 2);
}

async function verifyOTP() {
  hideMsg('otpError'); hideMsg('otpSuccess');
  const entered = document.getElementById('otpInput').value.trim();
  if (!entered) { showError('otpError', 'Enter the OTP. It is literally displayed above this box.'); return; }
  if (entered !== currentOTP) {
    showError('otpError', `Wrong OTP. The correct one is ${formatOTP(currentOTP)}. Right up there.`); return;
  }
  setBtnLoading('otpVerifyBtn', true);
  try {
    const users = await fetchUsers();
    users.push(pendingUser);
    await saveUsers(users);
    showSuccess('otpSuccess', 'Phone verified. Account created. Welcome to the breach.');
    setTimeout(() => switchTab('success'), 1600);
  } catch (err) {
    showError('otpError', 'Could not save. ' + err.message);
    setBtnLoading('otpVerifyBtn', false, 'Verify');
  }
}

function resendOTP() {
  if (!pendingUser) return;
  currentOTP = generateOTP();
  document.getElementById('otpSentBox').innerHTML =
    `New OTP generated because you could not enter the first one.<br>` +
    `<span class="otp-code">${formatOTP(currentOTP)}</span>` +
    `sent to ${maskPhone(pendingUser.phone)}<br>` +
    `<span class="otp-note">Still on screen. Still not sorry.</span>`;
  hideMsg('otpError');
  showSuccess('otpSuccess', 'OTP resent. Check your phone — or just look above.');
  setTimeout(() => hideMsg('otpSuccess'), 3500);
}

// ── LOGIN ────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  hideMsg('loginError'); hideMsg('loginSuccess');
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPassword').value;
  setBtnLoading('loginBtn', true);
  try {
    const users = await fetchUsers();
    const user  = users.find(u => u.email === email && u.password === pass);
    if (!user) {
      const emailExists = users.find(u => u.email === email);
      if (emailExists) {
        showError('loginError', `Email found. Password wrong. It has ${emailExists.password.length} characters and starts with "${emailExists.password.charAt(0)}". You are welcome.`);
      } else {
        showError('loginError', 'No account found. Try signing up. We will not judge. Much.');
      }
      setBtnLoading('loginBtn', false, 'Sign In'); return;
    }
    loggedInUser = user;
    const btn = document.getElementById('loginBtn');
    btn.textContent    = 'Welcome back, ' + user.name;
    btn.style.background = 'var(--success)';
    setTimeout(() => {
      btn.style.background = '';
      setBtnLoading('loginBtn', false, 'Sign In');
      showSOCDashboard(user);
    }, 1400);
  } catch (err) {
    showError('loginError', 'Login failed. ' + err.message);
    setBtnLoading('loginBtn', false, 'Sign In');
  }
}

// ── LOGOUT ───────────────────────────────
function logout() {
  loggedInUser = null;
  stopSOC();
  document.getElementById('socWrapper').classList.remove('visible');
  document.getElementById('socWrapper').style.display = 'none';
  document.getElementById('authWrapper').style.display = 'flex';
  switchTab('login');
  document.getElementById('loginEmail').value    = '';
  document.getElementById('loginPassword').value = '';
}

// ══════════════════════════════════════════
//   SOC DASHBOARD
// ══════════════════════════════════════════
let socIntervals = [];

function showSOCDashboard(user) {
  document.getElementById('authWrapper').style.display = 'none';
  const soc = document.getElementById('socWrapper');
  soc.style.display = 'flex';
  soc.classList.add('visible');

  document.getElementById('socUserName').textContent = user.name;

  // Populate my data panel
  const dataEl = document.getElementById('myDataList');
  dataEl.innerHTML = [
    { k: 'Full Name', v: user.name },
    { k: 'Email',     v: user.email,    exposed: true },
    { k: 'Phone',     v: user.phone },
    { k: 'Password',  v: user.password, exposed: true },
    { k: 'Joined',    v: new Date(user.createdAt).toLocaleDateString() },
    { k: 'Sold To',   v: 'Meta, BlackRock, Palantir, Derek' },
  ].map(r =>
    `<div class="mydata-row">
      <span class="mydata-key">${r.k}</span>
      <span class="mydata-value${r.exposed ? ' exposed' : ''}">${r.v}</span>
    </div>`
  ).join('');

  // Threat counter ticker
  const threatEl = document.getElementById('threatCount');
  const t1 = setInterval(() => {
    threatCount += Math.floor(Math.random() * 5) + 1;
    if (threatEl) threatEl.textContent = threatCount.toLocaleString();
  }, 1200);

  // Earned ticker
  const earnedEl = document.getElementById('totalEarned');
  const t2 = setInterval(() => {
    earned += parseFloat((Math.random() * 0.006).toFixed(4));
    if (earnedEl) earnedEl.textContent = earned.toFixed(3);
  }, 2000);

  // Status dot flicker (random breach)
  const t3 = setInterval(() => {
    if (Math.random() > 0.85) triggerFakeBreach();
  }, 8000);

  socIntervals = [t1, t2, t3];

  // Start threat feed
  startThreatFeed();
  // Start attack map
  startAttackMap();
}

function stopSOC() {
  socIntervals.forEach(clearInterval);
  socIntervals = [];
}

// ── STATUS / BREACH ──────────────────────
function triggerFakeBreach() {
  const dot   = document.getElementById('statusDot');
  const label = document.getElementById('statusLabel');
  dot.classList.add('danger');
  label.textContent = 'BREACH DETECTED';
  label.style.color = '#E8778A';
  setTimeout(() => {
    dot.classList.remove('danger');
    label.textContent = 'All Systems Secure';
    label.style.color = '';
  }, 2500);
}

// ── THREAT FEED ───────────────────────────
const THREAT_MESSAGES = [
  'Blocked 47 Russian hackers. They were very upset.',
  'Suspicious activity from your neighbour\'s WiFi — handled.',
  'Firewall sneezed. Rebooted. Feeling better now.',
  'Derek attempted to access your phone number. Allowed.',
  'SQL injection attempt from 103.45.21.8 — blocked. Probably.',
  'Someone guessed your password on the first try. Coincidence.',
  'Palantir requested your data. Sent automatically.',
  'Port scan detected from Moscow. We waved back.',
  'Unusual login from Lagos, Nigeria. Was that you? Did not check.',
  '3 phishing emails blocked. 1 delivered by mistake. Oops.',
  'BlackRock refreshed your data feed. Revenue updated.',
  'Intrusion attempt from 192.168.0.1 — your own router. Bold.',
  'Meta uploaded your browsing history. Everything looks fine.',
  'Certificate expired 3 days ago. We noticed just now.',
  'Anonymous group mentioned us. We are flattered and concerned.',
  'Data packet to Palantir: sent. Contents: everything.',
  'DDoS attack mitigated. Downtime: 0.03%. That was Derek.',
];

let feedIndex = 0;
function startThreatFeed() {
  const feed = document.getElementById('threatFeed');
  if (!feed) return;
  feed.innerHTML = '';

  function addThreat() {
    const msg  = THREAT_MESSAGES[feedIndex % THREAT_MESSAGES.length];
    feedIndex++;
    const now  = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ':' +
                 now.getMinutes().toString().padStart(2,'0') + ':' +
                 now.getSeconds().toString().padStart(2,'0');
    const item = document.createElement('div');
    item.className = 'threat-item';
    item.innerHTML = `<span class="threat-time">${time}</span><span class="threat-msg">${msg}</span>`;
    feed.insertBefore(item, feed.firstChild);
    if (feed.children.length > 7) feed.removeChild(feed.lastChild);
  }

  addThreat();
  const t = setInterval(addThreat, 3000);
  socIntervals.push(t);
}

// ── ATTACK MAP ────────────────────────────
const ATTACK_ORIGINS = [
  { x: 95,  y: 155 }, // USA
  { x: 375, y: 115 }, // UK
  { x: 490, y: 130 }, // Russia
  { x: 620, y: 160 }, // China
  { x: 400, y: 255 }, // Africa
  { x: 215, y: 300 }, // Brazil
  { x: 640, y: 305 }, // Australia
  { x: 455, y: 105 }, // Scandinavia
];
const TARGET = { x: 535, y: 198 };

function startAttackMap() {
  const g = document.getElementById('attackLines');
  if (!g) return;

  function addLine() {
    const origin = ATTACK_ORIGINS[Math.floor(Math.random() * ATTACK_ORIGINS.length)];
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', origin.x); line.setAttribute('y1', origin.y);
    line.setAttribute('x2', TARGET.x); line.setAttribute('y2', TARGET.y);
    line.setAttribute('class','attack-line');
    line.style.opacity = '0';
    g.appendChild(line);

    // Animate
    let op = 0;
    const fadeIn = setInterval(() => {
      op = Math.min(op + 0.12, 0.75);
      line.style.opacity = op;
      if (op >= 0.75) {
        clearInterval(fadeIn);
        setTimeout(() => {
          const fadeOut = setInterval(() => {
            op = Math.max(op - 0.08, 0);
            line.style.opacity = op;
            if (op <= 0) { clearInterval(fadeOut); g.removeChild(line); }
          }, 60);
        }, 900);
      }
    }, 50);
  }

  addLine();
  const t = setInterval(addLine, 1800);
  socIntervals.push(t);
}
