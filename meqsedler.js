// meqsedler.js
// Məqsəd kitabxanası (goal library) — Faza 2.
// Domenlər üzrə şablon məqsədlər. Seans qeydi (növbəti addım) bu məqsədlərə
// meqsedId ilə istinad edəcək.
// Oxu: giriş edən hər kəs. Yazı: admin və ya terapevt (Security Rules ilə qorunur).

import { db, auth } from "./firebase-init.js";
import {
  ref, push, get, set, update, query, orderByChild, equalTo
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
import { SABIT_DOMENLER, DOMEN_ETIKETLERI } from "./children.js";

// Domen siyahısı/etiketləri children.js-dən təkrar ixrac (tək mənbə).
export { SABIT_DOMENLER, DOMEN_ETIKETLERI };

// Yeni məqsəd yarat. Qaytarır: meqsedId
export async function createMeqsed({ domen, ad, tesvir } = {}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş tələb olunur.");
  if (!SABIT_DOMENLER.includes(domen)) throw new Error("Yanlış domen: " + domen);
  if (!ad || !ad.az) throw new Error("Məqsəd adı (AZ) tələb olunur.");

  const mRef = push(ref(db, "meqsedKitabxanasi"));
  await set(mRef, {
    domen,
    ad:     { az: ad.az || "",       ru: ad?.ru || "" },
    tesvir: { az: tesvir?.az || "",  ru: tesvir?.ru || "" },
    aktiv: true,
    createdBy: uid,
    createdAt: Date.now()
  });
  return mRef.key;
}

// Məqsədləri oxu. domen verilərsə yalnız o domen (indeks üzrə), yoxsa hamısı.
export async function listMeqsedler(domen = null) {
  let snap;
  if (domen) {
    snap = await get(query(ref(db, "meqsedKitabxanasi"), orderByChild("domen"), equalTo(domen)));
  } else {
    snap = await get(ref(db, "meqsedKitabxanasi"));
  }
  if (!snap.exists()) return [];
  const val = snap.val();
  return Object.keys(val).map(id => ({ id, ...val[id] }));
}

// Mövcud məqsədi yenilə (qismən patch).
export async function updateMeqsed(meqsedId, patch) {
  await update(ref(db, `meqsedKitabxanasi/${meqsedId}`), patch);
}

// Aktiv/passiv (silmək əvəzinə — tarixçə qorunur).
export async function setMeqsedAktiv(meqsedId, aktiv) {
  await update(ref(db, `meqsedKitabxanasi/${meqsedId}`), { aktiv: !!aktiv });
}

// ── Başlanğıc məqsəd dəsti (AN orijinal — ümumi inkişaf hədəfləri) ──
// Hər domen üçün təkrar işlədilə bilən, generik hədəflər. AZ/RU ikidilli.
export const BASLANGIC_MEQSEDLERI = [
  // nitq
  { domen:"nitq", ad:{az:"Adına reaksiya", ru:"Реакция на имя"}, tesvir:{az:"Adı çağırılanda baxır və ya cavab verir.", ru:"Смотрит или откликается, когда зовут по имени."} },
  { domen:"nitq", ad:{az:"Göz təması ilə səs çıxarma", ru:"Звук с зрительным контактом"}, tesvir:{az:"Tələbini bildirmək üçün göz təması quraraq səs çıxarır.", ru:"Издаёт звук, устанавливая зрительный контакт, чтобы выразить просьбу."} },
  { domen:"nitq", ad:{az:"Tək sözlə tələb", ru:"Просьба одним словом"}, tesvir:{az:"İstədiyini tək sözlə adlandırır (\"su\", \"ver\").", ru:"Называет желаемое одним словом (\"вода\", \"дай\")."} },
  { domen:"nitq", ad:{az:"İki sözlü ifadə", ru:"Фраза из двух слов"}, tesvir:{az:"İki sözü birləşdirir (\"ana gəl\", \"daha su\").", ru:"Соединяет два слова (\"мама иди\", \"ещё вода\")."} },
  { domen:"nitq", ad:{az:"Sual sözlərinə cavab", ru:"Ответы на вопросы"}, tesvir:{az:"\"Nə?\" və \"harada?\" suallarına uyğun cavab verir.", ru:"Отвечает на вопросы \"что?\" и \"где?\"."} },

  // sosial
  { domen:"sosial", ad:{az:"Ortaq diqqət", ru:"Совместное внимание"}, tesvir:{az:"Maraqlı əşyaya işarə edib baxışı ilə böyüklə paylaşır.", ru:"Указывает на интересный предмет и делится взглядом со взрослым."} },
  { domen:"sosial", ad:{az:"İşarə ilə tələb", ru:"Просьба указанием"}, tesvir:{az:"İstədiyini barmaqla göstərərək tələb edir.", ru:"Просит желаемое, указывая пальцем."} },
  { domen:"sosial", ad:{az:"Salamlaşma", ru:"Приветствие"}, tesvir:{az:"Əl yelləyərək və ya səslə salamlaşır/sağollaşır.", ru:"Здоровается/прощается жестом или голосом."} },
  { domen:"sosial", ad:{az:"Növbə gözləmə", ru:"Ожидание очереди"}, tesvir:{az:"Sadə oyunda növbəsini gözləyir.", ru:"Ждёт своей очереди в простой игре."} },
  { domen:"sosial", ad:{az:"Həmyaşıdla oyun", ru:"Игра со сверстником"}, tesvir:{az:"Qısa müddət başqa uşaqla birgə oynayır.", ru:"Недолго играет вместе с другим ребёнком."} },

  // davranis
  { domen:"davranis", ad:{az:"\"Dayan\" göstərişinə əməl", ru:"Команда \"стоп\""}, tesvir:{az:"\"Dayan\" deyiləndə hərəkəti dayandırır.", ru:"Останавливает действие по команде \"стоп\"."} },
  { domen:"davranis", ad:{az:"Keçidlərə uyğunlaşma", ru:"Адаптация к переходам"}, tesvir:{az:"Bir fəaliyyətdən digərinə kəskin etiraz olmadan keçir.", ru:"Переходит между занятиями без сильного протеста."} },
  { domen:"davranis", ad:{az:"Gözləməyi tolerasiya", ru:"Толерантность к ожиданию"}, tesvir:{az:"Qısa gözləməni sakit keçirir.", ru:"Спокойно переносит короткое ожидание."} },
  { domen:"davranis", ad:{az:"Tələbi uyğun formada bildirmə", ru:"Приемлемая форма просьбы"}, tesvir:{az:"Qışqırmaq əvəzinə işarə/söz ilə tələb edir.", ru:"Просит жестом/словом вместо крика."} },
  { domen:"davranis", ad:{az:"Sadə qaydalara əməl", ru:"Следование правилам"}, tesvir:{az:"Otaq və ya oyun qaydalarına riayət edir.", ru:"Соблюдает правила комнаты или игры."} },

  // ozunexidmet
  { domen:"ozunexidmet", ad:{az:"Qaşıqla yemək", ru:"Еда ложкой"}, tesvir:{az:"Köməksiz qaşıqla yeyir.", ru:"Ест ложкой самостоятельно."} },
  { domen:"ozunexidmet", ad:{az:"Stəkandan içmək", ru:"Питьё из стакана"}, tesvir:{az:"Stəkanı tutub tökmədən içir.", ru:"Держит стакан и пьёт, не проливая."} },
  { domen:"ozunexidmet", ad:{az:"Geyinmədə iştirak", ru:"Участие в одевании"}, tesvir:{az:"Geyinərkən qol/ayağını uzadır, sadə hissələri özü geyir.", ru:"При одевании протягивает руку/ногу, надевает простые вещи."} },
  { domen:"ozunexidmet", ad:{az:"Əl yuma", ru:"Мытьё рук"}, tesvir:{az:"Köməklə əllərini yuyub qurulayır.", ru:"С помощью моет и вытирает руки."} },
  { domen:"ozunexidmet", ad:{az:"Tualet ehtiyacını bildirmə", ru:"Сообщение о туалете"}, tesvir:{az:"Tualetə getmək ehtiyacını bildirir.", ru:"Сообщает о потребности сходить в туалет."} },

  // idrak
  { domen:"idrak", ad:{az:"Əşyanı uyğunlaşdırma", ru:"Сопоставление предметов"}, tesvir:{az:"Eyni əşyaları/şəkilləri tapıb uyğunlaşdırır.", ru:"Находит и сопоставляет одинаковые предметы/картинки."} },
  { domen:"idrak", ad:{az:"Rəngləri tanıma", ru:"Узнавание цветов"}, tesvir:{az:"Əsas rəngləri göstərir və ya adlandırır.", ru:"Показывает или называет основные цвета."} },
  { domen:"idrak", ad:{az:"Bir mərhələli göstəriş", ru:"Одношаговая инструкция"}, tesvir:{az:"Bir mərhələli göstərişi yerinə yetirir (\"topu ver\").", ru:"Выполняет одношаговую инструкцию (\"дай мяч\")."} },
  { domen:"idrak", ad:{az:"Kateqoriyalara ayırma", ru:"Сортировка по категориям"}, tesvir:{az:"Əşyaları formaya/növə görə qruplaşdırır.", ru:"Группирует предметы по форме/виду."} },
  { domen:"idrak", ad:{az:"Saymanın başlanğıcı", ru:"Начало счёта"}, tesvir:{az:"1–3 əşyanı sayır.", ru:"Считает 1–3 предмета."} },

  // boyuk-motorika
  { domen:"boyuk-motorika", ad:{az:"Dəstəksiz oturma", ru:"Сидение без опоры"}, tesvir:{az:"Tarazlığı qoruyaraq dəstəksiz oturur.", ru:"Сидит без опоры, удерживая равновесие."} },
  { domen:"boyuk-motorika", ad:{az:"Müstəqil yerimə", ru:"Самостоятельная ходьба"}, tesvir:{az:"Köməksiz bir neçə addım atır.", ru:"Делает несколько шагов без помощи."} },
  { domen:"boyuk-motorika", ad:{az:"Topu atma/tutma", ru:"Бросок и ловля мяча"}, tesvir:{az:"Topu istiqamətli atır və ya tutur.", ru:"Бросает мяч в цель или ловит его."} },
  { domen:"boyuk-motorika", ad:{az:"Pilləkəni qalxma", ru:"Подъём по лестнице"}, tesvir:{az:"Dəstəklə pilləkəni qalxır.", ru:"Поднимается по лестнице с поддержкой."} },
  { domen:"boyuk-motorika", ad:{az:"Yerində tullanma", ru:"Прыжки на месте"}, tesvir:{az:"İki ayağı ilə yerində tullanır.", ru:"Прыгает на двух ногах на месте."} },

  // ince-motorika
  { domen:"ince-motorika", ad:{az:"Tutub buraxma", ru:"Захват и отпускание"}, tesvir:{az:"Kiçik əşyanı barmaqları ilə tutub buraxır.", ru:"Берёт и отпускает мелкий предмет пальцами."} },
  { domen:"ince-motorika", ad:{az:"Üst-üstə qoyma", ru:"Складывание башенки"}, tesvir:{az:"2–3 kubu üst-üstə qoyur.", ru:"Ставит 2–3 кубика друг на друга."} },
  { domen:"ince-motorika", ad:{az:"Karandaşla cızma", ru:"Каракули карандашом"}, tesvir:{az:"Karandaşı tutub kağızda iz qoyur.", ru:"Держит карандаш и оставляет след на бумаге."} },
  { domen:"ince-motorika", ad:{az:"Səhifə çevirmə", ru:"Перелистывание страниц"}, tesvir:{az:"Kitabın səhifələrini çevirir.", ru:"Перелистывает страницы книги."} },
  { domen:"ince-motorika", ad:{az:"Halqa/muncuq keçirmə", ru:"Нанизывание"}, tesvir:{az:"Halqaları çubuğa keçirir.", ru:"Нанизывает кольца на стержень."} }
];

// Başlanğıc dəstini yüklə. Təkrar çağırılsa belə dublikat yaratmır
// (domen + AZ ad cütünə görə yoxlayır). Qaytarır: {elaveEdildi, kecildi}.
export async function seedBaslangic() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş tələb olunur.");
  const mevcud = await listMeqsedler();
  const movcudAcarlar = new Set(mevcud.map(m => `${m.domen}::${m.ad?.az || ""}`));
  let elaveEdildi = 0;
  for (const m of BASLANGIC_MEQSEDLERI) {
    if (movcudAcarlar.has(`${m.domen}::${m.ad.az}`)) continue;
    await createMeqsed(m);
    elaveEdildi++;
  }
  return { elaveEdildi, kecildi: BASLANGIC_MEQSEDLERI.length - elaveEdildi };
}
