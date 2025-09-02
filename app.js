/* Utility */
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const km_between = (a, b) => {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1*s1 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * s2*s2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa)));
};

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

/* App state */
let all_sales = window.SAMPLE_SALES.slice();
let origin_point = null;

/* CSV load */
qs("#csv_input").addEventListener("change", async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const rows = text.split(/\r?\n/).filter(x => x.trim().length);
  const headers = rows.shift().split(",").map(s => s.trim().toLowerCase());
  const idx = name => headers.indexOf(name);

  const list = rows.map((line, i) => {
    const cols = line.split(",");
    const obj = {
      id: "csv_" + i,
      title: cols[idx("title")] || "",
      address: cols[idx("address")] || "",
      suburb: cols[idx("suburb")] || "",
      postcode: (cols[idx("postcode")] || "").trim(),
      date: (cols[idx("date")] || "").trim(),
      start_time: cols[idx("start_time")] || "",
      end_time: cols[idx("end_time")] || "",
      description: cols[idx("description")] || "",
      lat: Number(cols[idx("lat")]) || null,
      lng: Number(cols[idx("lng")]) || null,
      url: cols[idx("url")] || ""
    };
    return obj;
  });
  all_sales = list;
  apply_filters();
});

qs("#reset_sample").addEventListener("click", () => {
  all_sales = window.SAMPLE_SALES.slice();
  apply_filters();
});

/* Location helpers */
qs("#use_my_location").addEventListener("click", async () => {
  try {
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 }));
    origin_point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    apply_filters();
  } catch {
    alert("Could not get your location");
  }
});

function origin_from_inputs() {
  const pc = qs("#f_origin_postcode").value.trim();
  if (pc && AUS_POSTCODE_TO_LL[pc]) return AUS_POSTCODE_TO_LL[pc];
  return origin_point;
}

/* Filters */
qs("#apply_filters").addEventListener("click", apply_filters);
qs("#clear_filters").addEventListener("click", () => {
  ["#f_keywords","#f_suburb","#f_postcode","#f_date_from","#f_date_to","#f_radius_km","#f_origin_postcode"].forEach(id => qs(id).value = "");
  qs("#f_future_only").checked = true;
  origin_point = null;
  apply_filters();
});
qs("#sort_by").addEventListener("change", apply_filters);

function apply_filters() {
  const kw = qs("#f_keywords").value.trim().toLowerCase();
  const suburb = qs("#f_suburb").value.trim().toLowerCase();
  const pc = qs("#f_postcode").value.trim();
  const df = qs("#f_date_from").value ? new Date(qs("#f_date_from").value) : null;
  const dt = qs("#f_date_to").value ? new Date(qs("#f_date_to").value) : null;
  const future_only = qs("#f_future_only").checked;
  const radius_km = Number(qs("#f_radius_km").value) || null;
  const origin = origin_from_inputs();

  let list = all_sales.slice();

  list = list.filter(it => {
    if (kw) {
      const blob = `${it.title} ${it.description} ${it.address} ${it.suburb}`.toLowerCase();
      if (!blob.includes(kw)) return false;
    }
    if (suburb && !(it.suburb || "").toLowerCase().includes(suburb)) return false;
    if (pc && it.postcode !== pc) return false;

    if (it.date) {
      const d = new Date(it.date + "T00:00:00");
      if (df && d < df) return false;
      if (dt && d > dt) return false;
      if (future_only) {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (d < today) return false;
      }
    }

    if (radius_km && origin) {
      const p = point_for_sale(it);
      if (p) {
        const dist = km_between(origin, p);
        if (dist == null || dist > radius_km) return false;
      } else {
        return false;
      }
    }

    return true;
  });

  // attach distance for sorting and display
  const o = origin_from_inputs();
  list.forEach(it => {
    it._distance_km = o ? km_between(o, point_for_sale(it)) : null;
  });

  const sort = qs("#sort_by").value;
  list.sort((a, b) => {
    if (sort === "distance_asc") {
      return (a._distance_km ?? 999999) - (b._distance_km ?? 999999);
    }
    if (sort === "title_asc") return a.title.localeCompare(b.title);
    // date asc default
    return (new Date(a.date || "2100-01-01")) - (new Date(b.date || "2100-01-01"));
  });

  render_cards(list);
}

function point_for_sale(it) {
  if (it.lat != null && it.lng != null) return { lat: it.lat, lng: it.lng };
  const pc = (it.postcode || "").trim();
  if (AUS_POSTCODE_TO_LL[pc]) return AUS_POSTCODE_TO_LL[pc];
  return null;
}

/* Cards */
const viewed = store.get("viewed_map", {});
const dismissed = store.get("dismissed_map", {});

function render_cards(list) {
  const wrap = qs("#cards");
  wrap.innerHTML = "";
  let shown = 0;

  list.forEach(it => {
    if (dismissed[it.id]) return;

    const t = qs("#card_template").content.cloneNode(true);
    const root = t.querySelector(".card");

    t.querySelector(".card_title").textContent = it.title || "Garage sale";
    t.querySelector(".chip_date").textContent = pretty_date(it);
    t.querySelector(".card_addr").textContent = address_line(it);
    t.querySelector(".card_desc").textContent = it.description || "";
    const dist_line = t.querySelector(".card_dist");
    if (it._distance_km != null) {
      dist_line.hidden = false;
      dist_line.textContent = `${it._distance_km} km from origin`;
    }

    const link = t.querySelector(".btn_visit");
    link.href = it.url || gmaps_link(it);

    const btn_viewed = t.querySelector(".btn_viewed");
    if (viewed[it.id]) btn_viewed.classList.add("viewed");
    btn_viewed.addEventListener("click", () => {
      viewed[it.id] = !viewed[it.id];
      store.set("viewed_map", viewed);
      btn_viewed.classList.toggle("viewed");
    });

    const btn_dismiss = t.querySelector(".btn_dismiss");
    btn_dismiss.addEventListener("click", () => {
      dismissed[it.id] = true;
      store.set("dismissed_map", dismissed);
      root.remove();
      qs("#result_count").textContent = `${--shown < 0 ? 0 : shown} results`;
    });

    wrap.appendChild(t);
    shown++;
  });

  qs("#result_count").textContent = `${shown} results`;
}

function pretty_date(it) {
  if (!it.date) return "Date not set";
  const d = new Date(it.date + "T00:00:00");
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  const base = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const times = [it.start_time, it.end_time].filter(Boolean).join(" to ");
  return times ? `${day} ${base} ${times}` : `${day} ${base}`;
}

function address_line(it) {
  const bits = [it.address, it.suburb, it.postcode].filter(Boolean);
  return bits.join(", ");
}

function gmaps_link(it) {
  const q = encodeURIComponent(`${it.address || ""} ${it.suburb || ""} ${it.postcode || ""}`);
  return `https://maps.google.com/?q=${q}`;
}

/* PWA install prompt */
let deferred;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferred = e;
  qs("#install_btn").hidden = false;
});
qs("#install_btn").addEventListener("click", async () => {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  qs("#install_btn").hidden = true;
});

/* Service worker */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}

/* Startup */
apply_filters();

