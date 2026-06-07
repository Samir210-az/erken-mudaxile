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
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

// İstifadəçi qovşağını təmin et — yoxdursa default "valideyn" + "pulsuz" yarat.
export async function ensureUserRecord(user, extra = {}) {
  const uRef = ref(db, `users/${user.uid}`);
  const snap = await get(uRef);
  if (!snap.exists()) {
    await set(uRef, {
      rol: "valideyn",          // default; yüksəltməni yalnız admin edir
      tier: "pulsuz",           // "pulsuz" | "premium" (dərinləşdirilmiş scoring üçün)
      ad: extra.ad || user.displayName || "",
      telefon: extra.telefon || user.phoneNumber || "",
      email: user.email || "",
      createdAt: Date.now()
    });
  }
  return (await get(uRef)).val();
}

// ── E-poçt + parol ────────────────────────────────────────────────
export async function registerWithEmail(email, password, ad = "") {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserRecord(cred.user, { ad });
  return cred.user;
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserRecord(cred.user);
  return cred.user;
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
