// firebase-init.js
// AN Erkən Müdaxilə & İnkişaf Platforması — Firebase başlanğıc
// Firebase v12 (modular) SDK — CDN ESM. Standalone HTML + vanilla JS üçün.
//
// İSTİFADƏ (HTML-də):
//   <script type="module" src="./firebase-init.js"></script>
//   <script type="module" src="./auth.js"></script>
//
// QEYD (Təlimat 2-ci bənd): Firebase web "config" açıq ola bilər — qorunma
// DB Security Rules ilə təmin olunur. Başqa HEÇ BİR token/açar koda yazılmır.
// Aşağıdakı dəyərləri Firebase Console > Project settings > "Your apps" (Web)
// hissəsindən OLDUĞU KİMİ köçür. Səhv versə CDN/baglantı işləməz.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "KONSOLDAN_KÖÇÜR",                       // ← Firebase Console
  authDomain: "an-psixoloji-33442.firebaseapp.com",
  databaseURL: "KONSOLDAN_KÖÇÜR",                  // ← RTDB URL (region vacibdir!)
  //   Nümunə: https://an-psixoloji-33442-default-rtdb.firebaseio.com
  //   və ya:  https://an-psixoloji-33442-default-rtdb.europe-west1.firebasedatabase.app
  projectId: "an-psixoloji-33442",
  storageBucket: "KONSOLDAN_KÖÇÜR",                // məs. an-psixoloji-33442.firebasestorage.app
  messagingSenderId: "KONSOLDAN_KÖÇÜR",
  appId: "KONSOLDAN_KÖÇÜR"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
