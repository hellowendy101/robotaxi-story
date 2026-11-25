// ---------- settings to fill in ----------
const CONFIG = {
  author: "",          // Jingwen Xiao
  explorerUrl: ""      // Streamlit Community Cloud link, once deployed
};

const S = window.STORY;
const $ = (sel) => document.querySelector(sel);
const pct = (x, d = 0) => `${(+x).toFixed(d)}%`;

// ---------- results from the R topic model (K = 9) and Python association rules ----------
const TOPICS = [
  { name: "Rear-ended in a signal queue", share: 21.8, crashes: 400, eff: [6.4, 1.3, 11.3],
    desc: "Robotaxi waits in a line of traffic at a red light; the car behind hits it as the queue moves.",
    quote: "The Waymo AV was stopped … in a queue of traffic for a red light … a passenger car initially stopped directly behind the Waymo AV approached the Waymo AV from behind, and the front of the passenger car made contact with the rear of the stationary Waymo AV." },
  { name: "Large vehicles squeezing past", share: 12.1, crashes: 212, eff: [-8.2, -12.1, -4.3],
    desc: "Robotaxi stops on a narrow street to yield; a truck or trailer scrapes it while passing, or backs into it.",
    quote: "The Waymo AV came to a stop in-lane on a narrow portion of [street] to yield to a pickup truck towing a flatbed trailer. As the pickup truck attempted to pass the Waymo AV, the left side of the pickup truck made contact with the front left side of the stationary Waymo AV." },
  { name: "Lane intrusions", share: 11.8, crashes: 143, eff: [1.2, -2.1, 4.4],
    desc: "Cars cutting in, motorcycles splitting lanes, and pedestrians, cyclists or debris entering the lane.",
    quote: "An SUV traveling eastbound in the leftmost lane changed lanes to the right across two lanes … and the front right side of the SUV made contact with the left side of the Waymo AV." },
  { name: "Rear-ended at a stop sign", share: 11.1, crashes: 148, eff: [4.2, 0.7, 7.7],
    desc: "Robotaxi stops at a stop sign; the vehicle behind does not.",
    quote: "The Waymo AV … came to a stop for the stop sign at the intersection with [street]. An SUV that was traveling behind the Waymo AV approached the Waymo AV from behind and … made contact with the rear left side of the stationary Waymo AV." },
  { name: "Dual left-turn lanes", share: 11.0, crashes: 128, eff: [-2.2, -5.1, 0.6],
    desc: "Two lanes turn left side by side; the car in the next lane drifts across the line.",
    quote: "… a van that was also turning left in the adjacent leftmost designated left turn lane crossed the dashed white lane line into the Waymo AV's lane of travel …" },
  { name: "Parked for pickup or drop-off", share: 10.6, crashes: 145, eff: [-2.9, -6.3, 0.4],
    desc: "Robotaxi stops in the travel lane with hazards on; passing vehicles clip it, or hit a door as a rider gets out.",
    quote: "The Waymo AV was parked in-lane … with hazards activated for a passenger drop-off. … A Waymo AV passenger then opened the rear driver side door of the Waymo AV, and the passenger side of the van made contact with the rear driver side door …" },
  { name: "Supervised-fleet reports", share: 8.3, crashes: 184, eff: [4.2, 2.1, 6.1], style: true,
    desc: "A reporting style, not a crash type: fleets with safety operators describe takeovers, police contact and discomfort reported later.",
    quote: "The Zoox vehicle operator then disengaged from autonomy. No injuries were reported at that time and police were not notified. … its operator later reported \"lower back stiffness\"." },
  { name: "Road hazards and takeovers", share: 7.3, crashes: 78, eff: [2.3, -0.8, 5.0],
    desc: "A mixed topic: downed utility lines and debris in the road, plus test drivers taking over.",
    quote: "The Waymo AV was traveling eastbound on [street] when the front of the Waymo AV made contact with a fallen utility line hanging in the travel lane." },
  { name: "Parking-lot entrances", share: 6.0, crashes: 87, eff: [-5.1, -8.2, -2.4],
    desc: "Turning into a lot or driveway, the robotaxi scrapes raised pavement with its underside.",
    quote: "As the Waymo AV was completing the left turn into the entrance of the parking lot, the undercarriage of the Waymo AV made contact with raised pavement at the entrance." }
];

const RULES_TYPICAL = [
  { ifs: "Other vehicle backing up", then: "robotaxi hit in the front", conf: 71.9, lift: 2.44, n: 120 },
  { ifs: "Robotaxi stopped + other vehicle going straight", then: "hit from behind", conf: 90.5, lift: 1.72, n: 296 },
  { ifs: "Heavy truck or bus, regular street", then: "robotaxi was stopped", conf: 83.9, lift: 1.67, n: 130 }
];
const RULES_INJURY = [
  { ifs: "Robotaxi hits a pedestrian or cyclist", then: "injury", conf: 62.5, lift: 6.07, n: 15 },
  { ifs: "Both going straight, robotaxi at 10–25 mph", then: "injury", conf: 30.3, lift: 2.94, n: 10 },
  { ifs: "Night + other vehicle going straight, regular street", then: "injury", conf: 26.3, lift: 2.56, n: 35 }
];

const AGREE = [
  ["Rear-end crashes", "Robotaxi stopped + other vehicle going straight → hit from behind (90%)", "Two rear-end scenarios together make up a third of narrative content", "Agree", "agree-v"],
  ["Who gets hurt", "Other vehicle going straight → injury 2.6 to 2.9 times the average", "Rear-end scenarios are more common in injury crashes", "Agree", "agree-v"],
  ["Large vehicles", "Heavy truck or bus → robotaxi was stopped; few injuries", "Large vehicles squeezing past: less common in injury crashes", "Agree", "agree-v"],
  ["Backing up", "Other vehicle backing → robotaxi hit in front (72%)", "Backing shows up in the large-vehicle and pickup scenarios", "Agree", "agree-v"],
  ["Pedestrians and cyclists", "Pedestrian or cyclist → injury, 6.1 times the average", "Too rare (24 crashes) to form a topic of their own", "Complement", "comp-v"],
  ["Curbside pickup, dual left turns, pavement scrapes, utility lines", "No checkbox exists for these", "Each forms its own topic", "Only in the narratives", "only-v"]
];

const METROS = [
  ["Phoenix", -112.07, 33.45, 2020], ["San Francisco", -122.42, 37.77, 2024], ["Los Angeles", -118.24, 34.05, 2024],
  ["Austin", -97.74, 30.27, 2025], ["Atlanta", -84.39, 33.75, 2025], ["Las Vegas", -115.14, 36.17, 2025],
  ["Miami", -80.19, 25.76, 2026], ["Dallas", -96.80, 32.78, 2026], ["Houston", -95.37, 29.76, 2026],
  ["San Antonio", -98.49, 29.42, 2026], ["Orlando", -81.38, 28.54, 2026], ["Denver", -104.99, 39.74, 2026]
];
const DC = [-77.04, 38.91];
const FIPS = { "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY" };

// ---------- top-down crash sketches (police-diagram style) ----------
const car = (x, y, cls) => `<g transform="translate(${x},${y})"><g class="${cls}"><rect class="body" x="-11" y="-19" width="22" height="38" rx="5"/><rect class="glass" x="-8" y="-13" width="16" height="7" rx="2"/>${cls === "robotaxi" ? '<circle class="roof" cx="0" cy="3" r="4"/>' : ""}</g></g>`;
function sketch(type, labelled = false) {
  const id = `ah-${type}-${labelled ? "b" : "s"}`;
  const road = `<defs><marker id="${id}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L6,3L0,6z" fill="#1b1b19"/></marker></defs>
    <rect class="curb" x="0" y="0" width="30" height="120"/><rect class="curb" x="130" y="0" width="30" height="120"/>
    <rect class="road" x="30" y="0" width="100" height="120"/><line class="edge-line" x1="32" y1="0" x2="32" y2="120"/><line class="edge-line" x1="128" y1="0" x2="128" y2="120"/>
    <line class="lane-line" x1="80" y1="0" x2="80" y2="120"/>`;
  const arrow = (x1, y1, x2, y2) => `<path class="arrow" d="M${x1},${y1}L${x2},${y2}" style="marker-end:url(#${id})"/>`;
  const impact = (x, y) => `<circle class="impact" cx="${x}" cy="${y}" r="7"/>`;
  const lab = (x, y, t) => (labelled ? `<text class="sketch-label" x="${x}" y="${y}">${t}</text>` : "");
  let body = "";
  if (type === "stopped") body = `<line class="edge-line" x1="32" y1="14" x2="80" y2="14"/>${arrow(55, 118, 55, 104)}${car(55, 36, "robotaxi")}${car(55, 76, "other")}${impact(55, 56)}${lab(70, 30, "ROBOTAXI (STOPPED)")}${lab(70, 96, "VEHICLE 2")}`;
  if (type === "moving") body = `${car(55, 55, "robotaxi")}${car(105, 60, "other")}${arrow(110, 100, 86, 70)}${impact(66, 55)}`;
  if (type === "pedestrian") body = `${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${86 + i * 7}" y="30" width="4" height="12" fill="#fff"/>`).join("")}${car(105, 62, "robotaxi")}<g transform="translate(100,36)"><circle class="ped-dot" r="4"/></g>${impact(102, 41)}`;
  if (type === "fixed") body = `<circle class="pole" cx="138" cy="29" r="4.5"/>${car(126, 52, "robotaxi")}${impact(136, 32)}`;
  return `<svg viewBox="0 0 160 120" class="anim-${{ stopped: "rear", moving: "move", pedestrian: "ped", fixed: "pole" }[type]}" role="img" aria-hidden="true">${road}${body}</svg>`;
}

// ---------- 01 opening ----------
$("#n-crashes").textContent = S.crashes.toLocaleString();

// ---------- 02 metro map ----------
const metroList = $("#metro-list");
[...new Set(METROS.map((m) => m[3]))].forEach((yr) => {
  const li = document.createElement("li");
  li.innerHTML = `<b>${yr}</b> ${METROS.filter((m) => m[3] === yr).map((m) => m[0]).join(", ")}`;
  metroList.appendChild(li);
});
let mapTimer = null;
function playYears() {
  clearInterval(mapTimer);
  let yr = 2020;
  const step = () => {
    $("#year").textContent = yr;
    const on = METROS.filter((m) => m[3] <= yr).length;
    $("#metro-count").textContent = `${on} metro${on > 1 ? "s" : ""} with public robotaxi rides`;
    document.querySelectorAll(".metro").forEach((g) => g.classList.toggle("on", +g.dataset.year <= yr));
    if (yr++ >= 2026) clearInterval(mapTimer);
  };
  step();
  mapTimer = setInterval(step, 850);
}
$("#replay-map").addEventListener("click", playYears);

// ---------- 03 guess ----------
const OPTIONS = [
  ["moving", "Moving, crashed into another vehicle"],
  ["stopped", "Stopped, hit by another vehicle"],
  ["pedestrian", "Hit a pedestrian or cyclist"],
  ["fixed", "Hit a pole, curb or barrier"]
];
let guess = null;
OPTIONS.forEach(([key, label], i) => {
  const b = document.createElement("button");
  b.className = "card"; b.type = "button"; b.dataset.key = key;
  b.innerHTML = `<span class="tag-letter">OPTION ${"ABCD"[i]}</span>${sketch(key)}<p>${label}</p>`;
  b.addEventListener("click", () => {
    guess = key;
    document.querySelectorAll(".card").forEach((c) => c.classList.toggle("picked", c === b));
    $("#guess-feedback").textContent = `Logged: option ${"ABCD"[i]}. Scroll down for the answer ↓`;
    showGuess();
  });
  $("#guess-grid").appendChild(b);
});

// ---------- 04 answer ----------
$(".big-anim").innerHTML = sketch("stopped", true);
const LABELS = { stopped: "Stopped, hit by another vehicle", moving: "Moving, crashed into another vehicle", other: "Other", fixed: "Hit a fixed object", pedestrian: "Hit a pedestrian or cyclist" };
const scen = Object.entries(S.scenario_pct).sort((a, b) => b[1] - a[1]);
const maxScen = scen[0][1];
$("#scenario-bars").innerHTML = scen.map(([k, v]) => `<div class="bar-row"><span>${LABELS[k] || k}</span><div class="bar-track"><div class="bar ${k === "stopped" ? "hl-bar" : ""}" data-w="${(v / maxScen) * 82}"></div><span class="bar-val" data-left="${(v / maxScen) * 82}">${pct(v, 1)}</span></div></div>`).join("");
document.querySelectorAll(".bar-val").forEach((el) => (el.style.left = "0%"));
function showGuess() {
  if (!guess) return;
  const top = scen[0][0], name = OPTIONS.find((o) => o[0] === guess)[1];
  $("#your-guess").textContent = guess === top ? `You picked "${name}". Correct.` : `You picked "${name}". Most people guess a moving crash, but the answer is below.`;
}
$("#rear-stopped").textContent = pct(S.rear_pct["Stopped or parked"]);
$("#rear-moving").textContent = pct(S.rear_pct["Moving"]);

// ---------- 05 pedestrians ----------
function waffle(el, n) {
  el.innerHTML = Array.from({ length: 100 }, () => "<i></i>").join("");
  el.dataset.n = n;
}
const ib = S.injury_by_partner;
const pedRate = Math.round(ib.pedestrian.rate), carRate = Math.round(ib.car.rate), truckRate = Math.round(ib.truck.rate);
waffle($("#waffle-ped"), pedRate); waffle($("#waffle-car"), carRate); waffle($("#waffle-truck"), truckRate);
$("#ped-rate").textContent = pedRate; $("#car-rate").textContent = carRate; $("#truck-rate").textContent = truckRate;
$("#ped-n").textContent = `n = ${ib.pedestrian.injured} injured in ${ib.pedestrian.crashes} crashes`;
function fillWaffles(scope) {
  scope.querySelectorAll(".waffle").forEach((w) => {
    if (w.dataset.done) return;
    w.dataset.done = 1;
    [...w.children].slice(0, +w.dataset.n).forEach((cell, i) => setTimeout(() => cell.classList.add("fill"), 25 * i));
  });
}

// ---------- 06 topics: bar chart + evidence panel ----------
const injClass = (t) => (t.style ? "style" : t.eff[1] > 0 ? "up" : t.eff[2] < 0 ? "down" : "flat");
const MARK = { up: "▲", down: "▼", flat: "", style: "" };
$("#topic-bars").innerHTML = TOPICS.map((t, i) => `<button type="button" class="tbar ${injClass(t)}" data-i="${i}">
  <span class="tbar-name">${t.name} <b>${MARK[injClass(t)]}</b></span>
  <span class="tbar-track"><span class="tbar-fill" data-w="${(t.share / 21.8) * 82}"></span><span class="tbar-val">${t.share.toFixed(1)}%</span></span></button>`).join("");
function showTopic(i) {
  const t = TOPICS[i], [d, lo, hi] = t.eff, c = injClass(t);
  const inj = t.style ? "Reflects reporting: operators on board report their own injuries." :
    { up: `More common when someone was injured (${d > 0 ? "+" : ""}${d.toFixed(1)} pts, 95% CI ${lo.toFixed(1)} to ${hi.toFixed(1)})`,
      down: `Less common when someone was injured (${d.toFixed(1)} pts, 95% CI ${lo.toFixed(1)} to ${hi.toFixed(1)})`,
      flat: "No clear difference between injury and non-injury crashes" }[c];
  $("#evidence").innerHTML = `<p class="ev-tag mono">EVIDENCE · ${t.crashes} crashes</p><h4>${t.name}</h4><p class="ev-desc">${t.desc}</p>
    <blockquote>"${t.quote}"</blockquote><p class="ev-inj ${c}">${inj}</p>`;
  document.querySelectorAll(".tbar").forEach((b) => b.classList.toggle("active", +b.dataset.i === i));
}
document.querySelectorAll(".tbar").forEach((b) => b.addEventListener("click", () => showTopic(+b.dataset.i)));
showTopic(0);

// ---------- 07 rules: lift chart ----------
const MAX_LIFT = 8;
const ruleRow = (r) => `<div class="lrow"><p class="lrow-label">${r.ifs} <span class="arrow-to">→ ${r.then}</span></p>
  <div class="lrow-track"><i class="chance" style="left:${100 / MAX_LIFT}%"></i><span class="lrow-fill" data-w="${(r.lift / MAX_LIFT) * 100}"></span>
  <span class="lrow-val mono" style="left:${(r.lift / MAX_LIFT) * 100}%"><b>${r.lift.toFixed(1)}×</b> ${Math.round(r.conf)}% · ${r.n} crashes</span></div></div>`;
$("#rules-typical").innerHTML = RULES_TYPICAL.map(ruleRow).join("");
$("#rules-injury").innerHTML = RULES_INJURY.map(ruleRow).join("");
$("#lift-axis").innerHTML = `<span></span><div class="axis-track">${[0, 1, 2, 3, 4, 5, 6, 7].map((v) => `<span style="left:${(v / MAX_LIFT) * 100}%">${v}×${v === 1 ? " chance" : ""}</span>`).join("")}</div>`;

// ---------- 08 agreement ----------
$("#agree-table").innerHTML = `<div class="row head" role="row"><span>Finding</span><span>Rules (checkbox fields)</span><span>Topics (narratives)</span><span>Verdict</span></div>` +
  AGREE.map((r) => `<div class="row" role="row"><span>${r[0]}</span><span>${r[1]}</span><span>${r[2]}</span><span class="verdict ${r[4]}">${r[3]}</span></div>`).join("");

// ---------- 09 gaps ----------
const counts = S.state_counts, total = Object.values(counts).reduce((a, b) => a + b, 0);
const top3 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
$("#top3-share").textContent = pct((top3.reduce((a, b) => a + b[1], 0) / total) * 100);
$("#snow-zero").textContent = S.snow_crashes;

// ---------- 11 end ----------
if (CONFIG.explorerUrl) $("#explorer-link").href = CONFIG.explorerUrl;
else { $("#explorer-link").classList.add("disabled"); $("#explorer-link").textContent = "Streamlit explorer: local prototype; }
if (CONFIG.author) $("#byline").textContent = `${CONFIG.author} · PPOL 5205 Concept Showcase · Georgetown University`;

// ---------- maps (need internet for D3 and the U.S. outline) ----------
function drawMaps() {
  if (!window.d3 || !window.topojson) return mapFallback();
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then((us) => {
    const states = topojson.feature(us, us.objects.states).features.filter((f) => FIPS[f.id]);
    const W = 960, H = 600, proj = d3.geoAlbersUsa().fitSize([W, H], { type: "FeatureCollection", features: states }), path = d3.geoPath(proj);
    // metro map
    const m = d3.select("#metro-map").append("svg").attr("viewBox", `0 0 ${W} ${H}`);
    m.append("g").selectAll("path").data(states).join("path").attr("class", "state").attr("d", path);
    const g = m.append("g").selectAll("g").data(METROS).join("g").attr("class", "metro").attr("data-year", (d) => d[3])
      .attr("transform", (d) => `translate(${proj([d[1], d[2]])})`);
    g.append("circle").attr("r", 9);
    g.append("text").attr("x", 13).attr("y", 4).text((d) => d[0]);
    const dc = m.append("g").attr("class", "dc-mark").attr("transform", `translate(${proj(DC)})`);
    dc.append("circle").attr("r", 8);
    dc.append("text").attr("class", "q").attr("x", -4).attr("y", 5).text("?");
    dc.append("text").attr("x", 14).attr("y", 5).text("Washington, DC");
    // state choropleth
    const color = d3.scaleSqrt().domain([0, d3.max(Object.values(counts))]).range(["#e9e5da", "#1f5fae"]);
    const s = d3.select("#state-map").append("svg").attr("viewBox", `0 0 ${W} ${H}`);
    s.append("g").selectAll("path").data(states).join("path").attr("class", "state-fill").attr("d", path)
      .attr("fill", (d) => (counts[FIPS[d.id]] ? color(counts[FIPS[d.id]]) : "#efece3"))
      .append("title").text((d) => `${FIPS[d.id]}: ${counts[FIPS[d.id]] || 0} crashes`);
    top3.forEach(([st, n]) => {
      const f = states.find((x) => FIPS[x.id] === st);
      if (f) s.append("text").attr("transform", `translate(${path.centroid(f)})`).attr("text-anchor", "middle").attr("fill", "#fff")
        .style("font", "700 15px Overpass, sans-serif").text(`${st} ${n}`);
    });
    const dc2 = s.append("g").attr("class", "dc-mark").attr("transform", `translate(${proj(DC)})`);
    dc2.append("circle").attr("r", 7);
    dc2.append("text").attr("x", 12).attr("y", 5).text(`DC: ${counts.DC || 0} test-vehicle crashes`);
    if ($("#s-now").classList.contains("seen")) playYears();
  }).catch(mapFallback);
}
function mapFallback() {
  ["#metro-map", "#state-map"].forEach((id) => ($(id).innerHTML = '<p class="source">The map needs an internet connection to load.</p>'));
  $("#state-map").insertAdjacentHTML("beforeend", `<p class="source">${top3.map(([s, n]) => `${s}: ${n}`).join(" · ")}</p>`);
}
drawMaps();

// ---------- scroll behaviour: reveal, animate charts, section index ----------
const scenes = [...document.querySelectorAll(".scene")];
const nav = $(".dots");
scenes.forEach((sc, i) => {
  const a = document.createElement("a");
  a.href = `#${sc.id}`; a.textContent = String(i + 1).padStart(2, "0"); a.title = sc.dataset.label;
  nav.appendChild(a);
  sc.querySelectorAll(".wrap > *, .opening-text > *").forEach((el) => el.classList.add("reveal"));
});
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  const sc = e.target, first = !sc.classList.contains("seen");
  sc.classList.add("seen");
  sc.querySelectorAll(".reveal").forEach((el, i) => setTimeout(() => el.classList.add("in"), 90 * i));
  sc.querySelectorAll("[data-w]").forEach((el) => setTimeout(() => (el.style.width = `${el.dataset.w}%`), 300));
  sc.querySelectorAll(".bar-val").forEach((el) => setTimeout(() => (el.style.left = `${el.dataset.left}%`), 300));
  fillWaffles(sc);
  if (sc.id === "s-now" && first) playYears();
  if (sc.id === "s-answer") showGuess();
  nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${sc.id}`));
}), { threshold: 0.15 });
scenes.forEach((sc) => io.observe(sc));
