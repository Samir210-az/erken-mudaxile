// children.js
// Uşaq-kartı (child record) CRUD — hər iki fazanın mərkəzi entity-si.
// Məxfilik: valideyn razılığı (consent) OLMADAN kart yaradılmır.

import { db, auth } from "./firebase-init.js";
import { ref, push, get, update, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

// Sabit domen siyahısı (Təlimat 3) — açarlar ASCII, etiketlər ayrıca map.
export const SABIT_DOMENLER = [
  "nitq", "sosial", "davranis", "ozunexidmet",
  "idrak", "boyuk-motorika", "ince-motorika"
];

export const DOMEN_ETIKETLERI = {
  nitq: { az: "Nitq", ru: "Речь" },
  sosial: { az: "Sosial", ru: "Социальное" },
  davranis: { az: "Davranış", ru: "Поведение" },
  ozunexidmet: { az: "Özünəxidmət", ru: "Самообслуживание" },
  idrak: { az: "İdrak", ru: "Когнитивное" },
  "boyuk-motorika": { az: "Böyük motorika", ru: "Крупная моторика" },
  "ince-motorika": { az: "İncə motorika", ru: "Мелкая моторика" }
};

// Yeni uşaq-kartı yarat — razılıq MƏCBURİDİR.
// Qaytarır: childId
export async function createChild({ profil, raziliq, valideynUid } = {}) {
  if (!raziliq || raziliq.verildi !== true) {
    throw new Error("Razılıq (consent) verilmədən uşaq-kartı yaradıla bilməz.");
  }
  const uid = valideynUid || auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş tələb olunur.");

  const childId = push(ref(db, "children")).key;

  const data = {
    profil: {
      ad: profil?.ad || "",
      dogumTarixi: profil?.dogumTarixi || "",   // ISO: "YYYY-MM-DD"
      cins: profil?.cins || ""                  // "oglan" | "qiz" | ""
    },
    raziliq: {
      verildi: true,
      tarix: raziliq.tarix || Date.now(),
      valideynUid: uid
    },
    parentIds: { [uid]: true },
    therapistIds: {},
    createdBy: uid,
    createdAt: Date.now()
  };

  // Atomik: kart + valideyn icazə indeksi birlikdə
  const updates = {};
  updates[`children/${childId}`] = data;
  updates[`userChildren/${uid}/${childId}`] = true;
  await update(ref(db), updates);

  return childId;
}

export async function getChild(childId) {
  const snap = await get(ref(db, `children/${childId}`));
  return snap.exists() ? { id: childId, ...snap.val() } : null;
}

export async function updateChild(childId, patch) {
  await update(ref(db, `children/${childId}`), patch);
}

// Valideyni karta bağla (+ indeks)
export async function linkParent(childId, parentUid) {
  const updates = {};
  updates[`children/${childId}/parentIds/${parentUid}`] = true;
  updates[`userChildren/${parentUid}/${childId}`] = true;
  await update(ref(db), updates);
}

// Terapevt təyin et — adətən ADMIN edir (+ indeks)
export async function assignTherapist(childId, therapistUid) {
  const updates = {};
  updates[`children/${childId}/therapistIds/${therapistUid}`] = true;
  updates[`userChildren/${therapistUid}/${childId}`] = true;
  await update(ref(db), updates);
}

// Cari istifadəçinin uşaqları — icazə indeksi üzərindən (public read yoxdur).
export async function listMyChildren(uid) {
  const id = uid || auth.currentUser?.uid;
  if (!id) throw new Error("Giriş tələb olunur.");
  const idxSnap = await get(ref(db, `userChildren/${id}`));
  if (!idxSnap.exists()) return [];
  const ids = Object.keys(idxSnap.val());
  const results = await Promise.all(ids.map(getChild));
  return results.filter(Boolean);
}

// Admin/terapevt — bütün uşaqlar (qaydalarda children kolleksiyası read admin/terapevt üçün açıqdır).
export async function listAllChildren() {
  const snap = await get(ref(db, "children"));
  if (!snap.exists()) return [];
  const v = snap.val();
  return Object.keys(v).map(id => ({ id, ...v[id] }));
}

// Skrininq nəticəsini karta yaz (Faza 1 → menbe: "skrininq").
// risk: "asagi" | "orta" | "yuksek"
export async function addSkrininqNeticesi(childId, { tool, bal, max = null, risk, cavablar = null } = {}) {
  const sRef = push(ref(db, `children/${childId}/skrininqNeticeleri`));
  await set(sRef, {
    tool: tool || "M-CHAT-R/F",
    bal,
    risk,
    menbe: "skrininq",
    tarix: Date.now(),
    ...(max != null ? { max } : {}),
    ...(cavablar ? { cavablar } : {})
  });
  return sRef.key;
}
