// auth.js
// Auth skeleti — rollar: admin / terapevt / valideyn
// Yeni istifadəçi default "valideyn" olur. Yüksəltməni (terapevt/admin)
// YALNIZ admin edir (Security Rules tərəfindən məcbur edilir).

import { auth, db } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

// İstifadəçi qovşağını təmin et — yoxdursa default "valideyn" + "pulsuz" yarat.
export async function ensureUserRecord(user, extra = {}) {
  const uRef = ref(db, `users/${user.uid}`);
  const snap = await get(uRef);
  if (!snap.exists()) {
    const rec = {
      rol: "valideyn",          // default; yüksəltməni yalnız admin edir
      tier: "pulsuz",           // "pulsuz" | "premium" (dərinləşdirilmiş scoring üçün)
      ad: extra.ad || user.displayName || "",
      telefon: extra.telefon || user.phoneNumber || "",
      email: user.email || "",
      createdAt: Date.now()
    };
    if (extra.talebRol === "terapevt") rec.talebRol = "terapevt";  // admin görsün, özü rol vermir
    await set(uRef, rec);
  }
  return (await get(uRef)).val();
}

// ── E-poçt + parol ────────────────────────────────────────────────
export async function registerWithEmail(email, password, ad = "", opts = {}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserRecord(cred.user, { ad, talebRol: opts.talebRol });
  return cred.user;
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserRecord(cred.user);
  return cred.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  await ensureUserRecord(cred.user);
  return cred.user;
}

export async function resetPassword(email) {
  auth.languageCode = document.documentElement.lang || "az";
  await sendPasswordResetEmail(auth, email);
}

// Azərbaycan nömrəsini E.164 formatına salır: 0552107111, 552107111, +994 55 210 71 11 → +994552107111
export function normalizePhone(raw) {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return /^\+\d{9,15}$/.test(d) ? d : null;
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("994")) { /* ölkə kodu ilə yazılıb */ }
  else if (d.startsWith("0") && d.length === 10) d = "994" + d.slice(1);
  else if (d.length === 9) d = "994" + d;
  return /^\d{9,15}$/.test(d) ? "+" + d : null;
}

// ── Telefon (SMS) ─────────────────────────────────────────────────
// HTML-də görünməz reCAPTCHA üçün boş bir konteyner lazımdır:
//   <div id="recaptcha-container"></div>
export function setupRecaptcha(containerId = "recaptcha-container") {
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

// Addım 1: SMS kodu göndər. phoneE164 nümunə: "+994501234567"
export async function sendPhoneCode(phoneE164, verifier) {
  return await signInWithPhoneNumber(auth, phoneE164, verifier);
}

// Addım 2: gələn SMS kodunu təsdiqlə
export async function confirmPhoneCode(confirmationResult, code, ad = "") {
  const cred = await confirmationResult.confirm(code);
  await ensureUserRecord(cred.user, { ad });
  return cred.user;
}

// ── Ümumi ─────────────────────────────────────────────────────────
export async function logout() {
  return signOut(auth);
}

export async function getRol(uid) {
  const snap = await get(ref(db, `users/${uid}/rol`));
  return snap.exists() ? snap.val() : null;
}

// Auth vəziyyətini izlə → callback(user|null, rol|null)
export function onUser(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return callback(null, null);
    await ensureUserRecord(user);
    const rol = await getRol(user.uid);
    callback(user, rol);
  });
}
