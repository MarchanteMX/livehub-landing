/* Live Hub · landing
   CONFIG: lo único que hay que llenar antes de publicar (ver PLAN.md §5). */
const CONFIG = {
  whatsapp: "",          // solo dígitos con lada, ej. "5215512345678". Vacío = los botones llevan al formulario
  whatsappText: "Hola, quiero cotizar un live para mi marca.",
  calendly: "",          // URL de Calendly / Google Calendar. Vacío = se oculta
  formEndpoint: "",      // URL que recibe el lead (POST JSON): Formspree, n8n, CRM. Vacío = solo dataLayer
  privacyUrl: "",        // aviso de privacidad (LFPDPPP)
  opening: "por anunciar" // fecha de apertura del estudio
};

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = matchMedia("(max-width: 860px)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const motion = !reduced && hasGsap;

  window.dataLayer = window.dataLayer || [];
  const track = (event, params = {}) => window.dataLayer.push({ event, ...params });

  if (!motion) root.classList.remove("js-motion");

  /* ---------- claqueta 3·2·1 (primera visita) ---------- */
  if (root.classList.contains("js-slate")) {
    const n = $(".slate__count");
    let c = 3;
    const step = () => {
      c -= 1;
      if (c > 0) { n.textContent = c; setTimeout(step, 230); }
      else {
        try { sessionStorage.setItem("lh_slate", "1"); } catch (e) {}
        const s = $(".slate");
        s.style.transition = "opacity .35s";
        s.style.opacity = "0";
        setTimeout(() => root.classList.remove("js-slate"), 360);
      }
    };
    setTimeout(step, 230);
  }

  /* ---------- datos de CONFIG ---------- */
  $$("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
  $$("[data-opening]").forEach(el => (el.textContent = CONFIG.opening));
  $$("[data-privacy]").forEach(a => {
    if (CONFIG.privacyUrl) { a.href = CONFIG.privacyUrl; a.target = "_blank"; a.rel = "noopener"; }
  });
  const waHref = extra => {
    const text = CONFIG.whatsappText + (extra ? " " + extra : "");
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
  };
  $$("[data-wa]").forEach(a => {
    if (!CONFIG.whatsapp) return;
    a.href = waHref();
    a.target = "_blank";
    a.rel = "noopener";
  });
  $$("[data-calendly]").forEach(a => {
    if (!CONFIG.calendly) return;
    a.href = CONFIG.calendly; a.target = "_blank"; a.rel = "noopener"; a.hidden = false;
  });
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-cta]");
    if (!a) return;
    const where = a.dataset.cta;
    if (a.hasAttribute("data-wa") && CONFIG.whatsapp) track("whatsapp_click", { section: where });
    else if (a.hasAttribute("data-calendly")) track("calendly_open", { section: where });
    else track("cta_click", { section: where });
  });

  /* ---------- reloj CDMX ---------- */
  const clockFmt = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const clocks = $$("[data-clock]");
  const tickClock = () => { const t = clockFmt.format(new Date()); clocks.forEach(c => (c.textContent = t)); };
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- CAM activa en la barra ---------- */
  const camNum = $("[data-cam]"), camName = $("[data-cam-name]"), barTally = $(".bar .tally"), barTallyTxt = $(".bar .tally__txt");
  const camIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const { camId, camLabel } = en.target.dataset;
      camNum.textContent = camId;
      camName.textContent = camLabel;
      const onAir = camId === "PGM";
      barTally.dataset.state = onAir ? "pgm" : "pvw";
      barTallyTxt.textContent = onAir ? "PGM" : "PVW";
    });
  }, { rootMargin: "-50% 0px -50% 0px" });
  $$("[data-cam-id]").forEach(s => camIO.observe(s));

  /* ---------- multiview ---------- */
  const monitor = $(".monitor__screen"), lower = $(".monitor__lower");
  const cams = $$(".cam");
  const pick = (btn, focus) => {
    if (btn.classList.contains("is-pgm")) return;
    cams.forEach(c => { c.classList.remove("is-pgm"); c.setAttribute("aria-checked", "false"); c.tabIndex = -1; });
    btn.classList.add("is-pgm"); btn.setAttribute("aria-checked", "true"); btn.tabIndex = 0;
    if (focus) btn.focus();
    let img = $(`.monitor__img[data-set="${btn.dataset.set}"]`, monitor);
    if (!img) {
      img = new Image();
      img.className = "monitor__img";
      img.dataset.set = btn.dataset.set;
      img.src = btn.dataset.img;
      img.alt = btn.dataset.alt;
      monitor.appendChild(img);
    }
    const show = () => {
      $$(".monitor__img", monitor).forEach(i => i.classList.toggle("is-on", i === img));
    };
    img.complete ? requestAnimationFrame(show) : img.addEventListener("load", show, { once: true });
    $("[data-monitor-cam]").textContent = `CAM ${btn.dataset.set}`;
    $("[data-monitor-num]").textContent = `CAM ${btn.dataset.set}`;
    $("[data-monitor-name]").textContent = btn.dataset.name;
    $("[data-monitor-desc]").textContent = btn.dataset.desc;
    lower.classList.remove("is-swap"); void lower.offsetWidth; lower.classList.add("is-swap");
    track("set_select", { set: btn.dataset.name });
  };
  cams.forEach((c, i) => {
    c.tabIndex = i === 0 ? 0 : -1;
    c.addEventListener("click", () => pick(c));
    c.addEventListener("keydown", e => {
      const k = e.key;
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(k)) return;
      e.preventDefault();
      const d = k === "ArrowRight" || k === "ArrowDown" ? 1 : -1;
      pick(cams[(i + d + cams.length) % cams.length], true);
    });
  });

  /* ---------- ticker ---------- */
  const ticker = $(".ticker"), tickBtn = $(".ticker__pause");
  const setPaused = p => { ticker.classList.toggle("is-paused", p); tickBtn.setAttribute("aria-pressed", String(p)); tickBtn.textContent = p ? "Seguir" : "Pausa"; };
  if (reduced) setPaused(true);
  tickBtn.addEventListener("click", () => setPaused(!ticker.classList.contains("is-paused")));

  /* ---------- WhatsApp flotante (móvil) ---------- */
  const waFloat = $(".wa-float"), hero = $(".hero"), contact = $("#contacto");
  let pastHero = false, atContact = false;
  const syncFloat = () => waFloat.classList.toggle("is-on", pastHero && !atContact);
  new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting; syncFloat(); }).observe(hero);
  new IntersectionObserver(([en]) => { atContact = en.isIntersecting; syncFloat(); }, { threshold: .15 }).observe(contact);

  /* ---------- formulario de 2 pasos ---------- */
  const form = $(".form");
  const steps = $$(".step", form), stepTabs = $$(".form__steps span", form);
  const params = new URLSearchParams(location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ttclid", "fbclid", "gclid"].forEach(k => {
    const v = params.get(k);
    if (v) form.elements[k].value = v;
  });
  const go = n => {
    steps.forEach(s => s.classList.toggle("is-on", s.dataset.step === String(n)));
    stepTabs.forEach((t, i) => t.classList.toggle("is-on", i + 1 === Math.min(n, 2)));
    const target = steps.find(s => s.dataset.step === String(n));
    const first = n === 3 ? target : target.querySelector("input, select, button");
    first && first.focus({ preventScroll: true });
  };
  const validate = step => {
    const err = $(".form__err", step);
    let msg = "";
    const groups = new Set($$("input[type=radio][required]", step).map(i => i.name));
    for (const g of groups) {
      if (!form.elements[g].value) { msg = "Elige una opción en cada pregunta."; break; }
    }
    $$("input:not([type=radio]):not([type=hidden])", step).forEach(i => {
      const ok = i.checkValidity();
      if (i.type !== "checkbox") i.setAttribute("aria-invalid", String(!ok));
      if (!ok && !msg) msg = i.type === "checkbox" ? "Acepta el aviso de privacidad para continuar."
        : i.type === "email" ? "Revisa el correo." : "Completa los campos marcados.";
    });
    const wa = form.elements.whatsapp;
    if (step.contains(wa) && !msg && wa.value.replace(/\D/g, "").length < 10) {
      wa.setAttribute("aria-invalid", "true");
      msg = "El WhatsApp debe tener 10 dígitos.";
    }
    err.textContent = msg;
    return !msg;
  };
  $("[data-next]", form).addEventListener("click", () => {
    const s1 = steps[0];
    if (!validate(s1)) return;
    track("form_step_1_complete", { categoria: form.elements.categoria.value, rol: form.elements.rol.value, tiktok_shop: form.elements.tiktok_shop.value });
    go(2);
  });
  $("[data-prev]", form).addEventListener("click", () => go(1));
  let started = false;
  form.addEventListener("change", () => { if (!started) { started = true; track("form_start"); } });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const s2 = steps[1];
    if (!validate(s2)) return;
    const data = Object.fromEntries(new FormData(form));
    delete data.privacidad;
    const btn = $("[type=submit]", form);
    btn.disabled = true; btn.textContent = "Enviando…";
    if (CONFIG.formEndpoint) {
      try {
        const r = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error(r.status);
      } catch (err) {
        btn.disabled = false; btn.textContent = "Enviar";
        $(".form__err", s2).textContent = "No pudimos enviarlo. Intenta de nuevo o escríbenos por WhatsApp.";
        return;
      }
    }
    track("generate_lead", { categoria: data.categoria, rol: data.rol, tiktok_shop: data.tiktok_shop, presupuesto: data.presupuesto || "sin_dato", cuando: data.cuando });
    if (CONFIG.whatsapp) $$("[data-wa]", form).forEach(a => (a.href = waHref(`Soy ${data.nombre} de ${data.marca}.`)));
    go(3);
  });

  if (!motion) return;

  /* =================== MOTION =================== */
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .11 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length < 2 || a.target === "_blank") return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: id === "#top" ? 0 : -48 });
    }));
  }

  /* video que avanza con el scroll: lerp hacia el tiempo objetivo, sin pedir otro seek mientras uno está en curso */
  const scrubbers = [];
  const makeScrub = video => {
    const s = { video, target: 0, ready: false, cur: 0 };
    video.addEventListener("loadedmetadata", () => { s.ready = Number.isFinite(video.duration); });
    video.addEventListener("seeked", () => video.classList.add("is-ready"), { once: true });
    scrubbers.push(s);
    return s;
  };
  const loadVideo = v => {
    if (v.src) return;
    v.src = isMobile ? v.dataset.srcM : v.dataset.srcD;
    v.load();
  };
  gsap.ticker.add(() => {
    scrubbers.forEach(s => {
      const v = s.video;
      if (!s.ready || v.seeking) return;
      const t = s.target * (v.duration - .05);
      s.cur += (t - s.cur) * .22;
      if (Math.abs(v.currentTime - s.cur) > 1 / 40) v.currentTime = s.cur;
    });
  });
  // iOS no bufferea hasta que hay interacción
  const prime = () => scrubbers.forEach(s => { const p = s.video.play(); p && p.then(() => s.video.pause()).catch(() => {}); });
  addEventListener("touchstart", prime, { once: true, passive: true });

  /* hero */
  const heroV = $(".hero__video"), heroS = makeScrub(heroV);
  loadVideo(heroV);
  const dark = $(".hero__dark"), prog = $(".hero__progress"), heroLowers = $$(".hero .lower__item");
  const heroCopy = $(".hero__copy");
  gsap.set(dark, { "--lr": "60%" });
  gsap.timeline({ delay: root.classList.contains("js-slate") ? .95 : .15 })
    .to(dark, { "--lr": "150%", duration: 1.8, ease: "power2.out" })
    .from(".hero__title .line", { yPercent: 40, opacity: 0, stagger: .12, duration: 1, ease: "power3.out" }, .2)
    .from([".kicker", ".hero__sub", ".hero__ctas", ".hero__foot"], { y: 16, opacity: 0, stagger: .08, duration: .8, ease: "power3.out" }, .5);

  ScrollTrigger.create({
    trigger: ".hero", start: "top top", end: "bottom bottom",
    onUpdate: self => {
      const p = self.progress;
      heroS.target = p;
      prog.style.setProperty("--p", p.toFixed(3));
      dark.style.setProperty("--lr", `${150 + p * 120}%`);
      let on = 0;
      heroLowers.forEach((l, i) => { if (p >= parseFloat(l.dataset.at)) on = i; });
      heroLowers.forEach((l, i) => l.classList.toggle("is-on", i === on));
      const out = gsap.utils.clamp(0, 1, (p - .16) / .16);
      heroCopy.style.opacity = 1 - out;
      heroCopy.style.transform = `translateY(${-60 * out}px)`;
      heroCopy.style.visibility = out >= 1 ? "hidden" : "";
    }
  });

  /* pasillo */
  const dollyV = $(".dolly__video"), dollyS = makeScrub(dollyV), rail = $$(".dolly__rail span"), dollyCopy = $(".dolly__copy");
  ScrollTrigger.create({ trigger: ".dolly", start: "top 220%", once: true, onEnter: () => loadVideo(dollyV) });
  ScrollTrigger.create({
    trigger: ".dolly", start: "top top", end: "bottom bottom",
    onUpdate: self => {
      const p = self.progress;
      dollyS.target = p;
      let on = 0;
      rail.forEach((r, i) => { if (p >= parseFloat(r.dataset.at)) on = i; });
      rail.forEach((r, i) => r.classList.toggle("is-on", i === on));
      const out = gsap.utils.clamp(0, 1, (p - .08) / .1);
      dollyCopy.style.opacity = 1 - out;
      dollyCopy.style.transform = `translateY(${-40 * out}px)`;
    }
  });
  rail[0].classList.add("is-on");

  /* titulares: líneas que suben desde su máscara */
  document.fonts.ready.then(() => {
    if (window.SplitText) {
      $$(".split").forEach(h => {
        SplitText.create(h, {
          type: "lines", mask: "lines", linesClass: "split-line", autoSplit: true,
          onSplit: self => gsap.from(self.lines, {
            yPercent: 105, duration: 1.1, stagger: .09, ease: "power4.out",
            scrollTrigger: { trigger: h, start: "top 85%", once: true }
          })
        });
      });
    }
    ScrollTrigger.refresh();
  });

  /* filas y bloques */
  const rise = (targets, trigger, opts = {}) => gsap.from(targets, {
    y: 28, opacity: 0, duration: .9, stagger: .07, ease: "power3.out",
    scrollTrigger: { trigger, start: "top 80%", once: true }, ...opts
  });
  rise(".problem__body .lead", ".problem__body");
  rise(".rows li", ".callsheet");
  rise(".rundown__row", ".rundown__list");
  rise(".fmt__item", ".fmt");
  rise(".faq details", ".faq__list");
  rise([".founders__k", ".founders__h", ".founders__p", ".founders .btn"], ".founders");
  gsap.from(".monitor", { clipPath: "inset(12% 12% 12% 12%)", duration: 1.3, ease: "power3.inOut", scrollTrigger: { trigger: ".monitor", start: "top 80%", once: true } });
  rise(".cam", ".cams", { y: 18 });

  /* contadores con datos públicos */
  $$("[data-count]").forEach(el => {
    const end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || "0", 10), o = { v: 0 };
    el.textContent = (0).toFixed(dec);
    ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: "power3.out", onUpdate: () => (el.textContent = o.v.toFixed(dec)) })
    });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
