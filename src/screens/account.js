import { signUpEmail, signInEmail, signInOAuth, signOut } from '../auth.js';
import { getProfile, saveProfile } from '../api.js';
import { waLink } from '../config.js';
import { logoBox } from './logo.js';
import { backBtn } from '../ui.js';

const field = (id, label, ph, type = 'text', dir = 'rtl') => `
  <div>
    <div style="font-size:13px; color:#5a5245; font-weight:600; margin-bottom:6px;">${label}</div>
    <input id="${id}" type="${type}" dir="${dir}" placeholder="${ph}" style="width:100%; height:48px; border-radius:13px; border:1px solid #ece2d3; background:#fff; padding:0 14px; font-size:14.5px; color:#243b37; ${dir === 'ltr' ? 'text-align:right;' : ''}"/>
  </div>`;

const oauthBtn = (provider, label, bg, color, border, icon) =>
  `<button data-oauth="${provider}" style="width:100%; height:50px; border-radius:14px; background:${bg}; color:${color}; border:1px solid ${border}; font-size:14.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">${icon}${label}</button>`;

const GOOGLE_ICON = `<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.6l6.2 5.2C39.9 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>`;
const FB_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>`;

export default async function account(root, ctx) {
  if (ctx.user) return loggedIn(root, ctx);
  return authForm(root, ctx);
}

function authForm(root, ctx) {
  let mode = 'login'; // 'login' | 'signup'
  const render = () => {
    const signup = mode === 'signup';
    root.innerHTML = `
    <div class="nn-page" style="height:100%; display:flex; flex-direction:column; background:#FBF6EE;">
      <div class="nn-scroll nn-body nn-card-narrow" style="flex:1; overflow-y:auto; padding:max(14px, env(safe-area-inset-top)) 20px 110px;">
        <div style="margin-bottom:12px;">${backBtn}</div>
        <div style="display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:22px;">
          ${logoBox(64, 18)}
          <div style="font-size:18px; font-weight:800; color:#243b37; margin-top:12px;">مرحبًا بك في نانوش</div>
          <div style="font-size:13px; color:#8a7f6f; margin-top:4px; line-height:1.6;">${signup ? 'أنشئي حسابك لتتبّعي طلباتك بسهولة' : 'سجّلي الدخول لمتابعة طلباتك'}</div>
        </div>

        <div style="display:flex; background:#f1e9db; border-radius:14px; padding:4px; margin-bottom:16px;">
          <button data-mode="login" style="flex:1; height:40px; border:none; border-radius:11px; cursor:pointer; font-size:14px; font-weight:700; background:${signup ? 'transparent' : '#fff'}; color:${signup ? '#8a7f6f' : '#1B695E'}; box-shadow:${signup ? 'none' : '0 1px 4px rgba(0,0,0,.06)'};">دخول</button>
          <button data-mode="signup" style="flex:1; height:40px; border:none; border-radius:11px; cursor:pointer; font-size:14px; font-weight:700; background:${signup ? '#fff' : 'transparent'}; color:${signup ? '#1B695E' : '#8a7f6f'}; box-shadow:${signup ? '0 1px 4px rgba(0,0,0,.06)' : 'none'};">إنشاء حساب</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${signup ? field('name', 'الاسم', 'اكتبي اسمك') : ''}
          ${signup ? field('phone', 'رقم الهاتف', '01xxxxxxxxx', 'tel', 'ltr') : ''}
          ${field('email', 'البريد الإلكتروني', 'you@example.com', 'email', 'ltr')}
          ${field('password', 'كلمة المرور', '••••••••', 'password', 'ltr')}
          <div id="msg" style="display:none; font-size:13px; border-radius:12px; padding:11px 13px; line-height:1.6;"></div>
          <button data-submit style="margin-top:2px; width:100%; height:52px; border-radius:15px; background:#1B695E; color:#fff; border:none; font-size:16px; font-weight:700; cursor:pointer; box-shadow:0 6px 16px rgba(27,105,94,.3); display:flex; align-items:center; justify-content:center;">${signup ? 'إنشاء الحساب' : 'تسجيل الدخول'}</button>
        </div>

        <div style="display:flex; align-items:center; gap:10px; margin:20px 0;">
          <div style="flex:1; height:1px; background:#e7ddce;"></div>
          <span style="font-size:12.5px; color:#a99e8e;">أو تابعي عبر</span>
          <div style="flex:1; height:1px; background:#e7ddce;"></div>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${oauthBtn('google', 'المتابعة عبر Google', '#fff', '#3c4043', '#e2d8c8', GOOGLE_ICON)}
          ${oauthBtn('facebook', 'المتابعة عبر Facebook', '#1877F2', '#fff', '#1877F2', FB_ICON)}
        </div>
      </div>
    </div>`;

    const msg = root.querySelector('#msg');
    const showMsg = (text, ok) => {
      msg.style.display = 'block';
      msg.textContent = text;
      msg.style.background = ok ? '#e8f0ec' : '#fbeeee';
      msg.style.color = ok ? '#356057' : '#a15b5b';
    };

    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));

    root.querySelector('[data-submit]').addEventListener('click', async () => {
      const email = root.querySelector('#email').value.trim();
      const password = root.querySelector('#password').value;
      if (!email || !password) return showMsg('يرجى إدخال البريد وكلمة المرور', false);
      if (signup && password.length < 6) return showMsg('كلمة المرور يجب أن تكون ٦ أحرف على الأقل', false);
      const btn = root.querySelector('[data-submit]');
      btn.disabled = true; btn.textContent = 'لحظة…';
      try {
        if (signup) {
          const name = root.querySelector('#name').value.trim();
          const phone = root.querySelector('#phone').value.trim();
          const { data, error } = await signUpEmail(email, password, name, phone);
          if (error) throw error;
          if (!data.session) showMsg('تم إنشاء الحساب ✅ تحقّقي من بريدك لتأكيد الحساب ثم سجّلي الدخول.', true);
          // if session exists, onAuthChange re-renders automatically
        } else {
          const { error } = await signInEmail(email, password);
          if (error) throw error;
          // onAuthChange re-renders
        }
      } catch (e) {
        showMsg(translateError(e.message), false);
      } finally {
        btn.disabled = false; btn.textContent = signup ? 'إنشاء الحساب' : 'تسجيل الدخول';
      }
    });

    root.querySelectorAll('[data-oauth]').forEach((b) => b.addEventListener('click', async () => {
      const { error } = await signInOAuth(b.dataset.oauth);
      if (error) showMsg('تعذّر تسجيل الدخول عبر ' + b.dataset.oauth + ' — تأكدي من إعداده.', false);
    }));
  };
  render();
}

async function loggedIn(root, ctx) {
  const profile = await getProfile(ctx.user.id) || {};
  const nameVal = profile.name || ctx.user.user_metadata?.name || '';
  const phoneVal = profile.phone || ctx.user.user_metadata?.phone || '';

  const initial = (nameVal || 'ن').trim().charAt(0);
  root.innerHTML = `
  <div class="nn-page" style="height:100%; display:flex; flex-direction:column; background:#FBF6EE;">
    <div class="nn-scroll nn-body nn-card-narrow" style="flex:1; overflow-y:auto; padding:max(14px, env(safe-area-inset-top)) 18px 110px;">

      <div style="background:linear-gradient(155deg,#1f7a6d,#14524a); border-radius:24px; padding:28px 22px; text-align:center; color:#fff; box-shadow:0 12px 28px rgba(27,105,94,.3);">
        <div style="width:78px; height:78px; margin:0 auto; border-radius:24px; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.28); display:flex; align-items:center; justify-content:center; font-family:'Amiri',serif; font-size:36px; font-weight:700;">${initial}</div>
        <div style="font-size:20px; font-weight:800; margin-top:14px;">${nameVal || 'عميلة نانوش'}</div>
        <div style="font-size:13px; opacity:.85; margin-top:5px;" dir="ltr">${ctx.user.email || phoneVal || ''}</div>
      </div>

      <div style="display:flex; gap:11px; margin-top:16px;">
        <button data-orders style="flex:1; display:flex; flex-direction:column; align-items:center; gap:7px; background:#fff; border:1px solid #f0e8db; border-radius:16px; padding:15px 8px; cursor:pointer; box-shadow:0 2px 8px rgba(60,40,20,.05);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 3h6l1 3H8l1-3Z" stroke="#1B695E" stroke-width="1.8" stroke-linejoin="round"/><rect x="5" y="6" width="14" height="15" rx="2.5" stroke="#1B695E" stroke-width="1.8"/><path d="M9 11h6M9 15h4" stroke="#1B695E" stroke-width="1.8" stroke-linecap="round"/></svg>
          <span style="font-size:13px; font-weight:700; color:#243b37;">طلباتي</span>
        </button>
        <a href="${waLink('مرحبًا نانوش 🌿')}" target="_blank" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:7px; background:#fff; border:1px solid #f0e8db; border-radius:16px; padding:15px 8px; text-decoration:none; box-shadow:0 2px 8px rgba(60,40,20,.05);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366" style="display:block;"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.42 1.27 4.86L2 22l5.28-1.24A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.13c-1.55 0-3-.44-4.23-1.2l-.3-.18-3.13.74.74-3.05-.2-.31A8.09 8.09 0 0 1 3.87 12 8.14 8.14 0 0 1 12 3.87 8.14 8.14 0 0 1 20.13 12 8.14 8.14 0 0 1 12 20.13Zm4.5-5.73c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z"/></svg>
          <span style="font-size:13px; font-weight:700; color:#243b37;">تواصلي معنا</span>
        </a>
      </div>

      <div style="background:#fff; border:1px solid #f0e8db; border-radius:18px; padding:18px; margin-top:16px; box-shadow:0 2px 10px rgba(60,40,20,.05);">
        <div style="font-size:15px; font-weight:800; color:#243b37;">بياناتي</div>
        <div style="font-size:12.5px; color:#8a7f6f; margin:3px 0 15px;">نستخدمها للتواصل معك بخصوص طلباتك</div>
        <div style="display:flex; flex-direction:column; gap:13px;">
          ${field('name', 'الاسم', 'اكتبي اسمك')}
          ${field('phone', 'رقم الهاتف', '01xxxxxxxxx', 'tel', 'ltr')}
          <div id="msg" style="display:none; font-size:13px; border-radius:12px; padding:11px 13px; background:#e8f0ec; color:#356057;"></div>
          <button data-save style="margin-top:2px; width:100%; height:50px; border-radius:15px; background:#1B695E; color:#fff; border:none; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 6px 14px rgba(27,105,94,.25);">حفظ التغييرات</button>
        </div>
      </div>

      ${ctx.isAdmin ? `<button data-admin style="margin-top:16px; width:100%; height:50px; border-radius:15px; background:#243b37; color:#fff; border:none; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:9px;">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>
        لوحة الإدارة</button>` : ''}
      <button data-signout style="margin-top:16px; width:100%; height:48px; border-radius:15px; background:#fff; color:#a15b5b; border:1px solid #f0dede; font-size:14.5px; font-weight:700; cursor:pointer;">تسجيل الخروج</button>
    </div>
  </div>`;

  root.querySelector('#name').value = nameVal;
  root.querySelector('#phone').value = phoneVal;

  root.querySelector('[data-save]').addEventListener('click', async () => {
    const name = root.querySelector('#name').value.trim();
    const phone = root.querySelector('#phone').value.trim();
    const msg = root.querySelector('#msg');
    try {
      await saveProfile(ctx.user.id, name, phone);
      msg.style.display = 'block'; msg.textContent = 'تم حفظ بياناتك ✅';
    } catch (e) {
      msg.style.display = 'block'; msg.style.background = '#fbeeee'; msg.style.color = '#a15b5b';
      msg.textContent = 'تعذّر الحفظ: ' + e.message;
    }
  });
  root.querySelector('[data-orders]').addEventListener('click', () => ctx.navigate('#/orders'));
  root.querySelector('[data-admin]')?.addEventListener('click', () => ctx.navigate('#/admin'));
  root.querySelector('[data-signout]').addEventListener('click', () => signOut());
}

// Reused by the orders screen when signed out.
export function loginPrompt(root, ctx, message) {
  root.innerHTML = `
  <div class="nn-page" style="height:100%; min-height:70vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:60px 32px; background:#FBF6EE;">
    ${logoBox(60, 16)}
    <div style="font-size:16px; font-weight:800; color:#243b37; margin-top:16px;">مطلوب تسجيل الدخول</div>
    <div style="font-size:13.5px; color:#8a7f6f; margin-top:8px; line-height:1.7;">${message}</div>
    <button data-go style="margin-top:20px; height:48px; padding:0 28px; border-radius:14px; background:#1B695E; color:#fff; border:none; font-size:15px; font-weight:700; cursor:pointer;">الذهاب لتسجيل الدخول</button>
  </div>`;
  root.querySelector('[data-go]').addEventListener('click', () => ctx.navigate('#/account'));
}

function translateError(m = '') {
  if (/Invalid login credentials/i.test(m)) return 'بيانات الدخول غير صحيحة';
  if (/already registered|already exists/i.test(m)) return 'هذا البريد مسجّل بالفعل — سجّلي الدخول';
  if (/Email not confirmed/i.test(m)) return 'يرجى تأكيد بريدك أولًا من رسالة التفعيل';
  return m;
}
