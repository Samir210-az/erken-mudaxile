import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "KONSOLDAN_KÖÇÜR",
  authDomain: "an-psixoloji-33442.firebaseapp.com",
  databaseURL: "KONSOLDAN_KÖÇÜR",          // məs: https://an-psixoloji-33442-default-rtdb.firebaseio.com
  projectId: "an-psixoloji-33442",
  storageBucket: "KONSOLDAN_KÖÇÜR",
  messagingSenderId: "KONSOLDAN_KÖÇÜR",
  appId: "KONSOLDAN_KÖÇÜR"
};

export let app = null, auth = null, db = null, initError = null;

function banner(text){
  const make = ()=>{
    const d=document.createElement("div");
    d.textContent=text;
    d.style.cssText="position:fixed;left:0;right:0;top:0;z-index:9999;background:#c0533f;color:#fff;font:600 14px/1.4 system-ui,sans-serif;padding:12px 16px;text-align:center;";
    document.body.prepend(d);
  };
  if(document.body) make(); else document.addEventListener("DOMContentLoaded", make);
}

const PH = "KONSOLDAN_KÖÇÜR";
const missing = Object.entries(firebaseConfig).filter(([k,v])=>!v || v===PH).map(([k])=>k);

try{
  if(missing.length) throw new Error("Firebase config doldurulmayıb → " + missing.join(", "));
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
}catch(e){
  initError = e;
  console.error("[firebase-init]", e);
  banner("⚠ Firebase qoşulmadı: " + e.message);
}
