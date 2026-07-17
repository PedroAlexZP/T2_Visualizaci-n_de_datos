const MONTH_LABELS = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};

const MONTH_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const MONTH_SHORT = {
  1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic",
};

const SECTOR_NAME_MAPPING = {};

function normalizeSectorName(name) {
  return SECTOR_NAME_MAPPING[name] || name;
}

let currentSectorView = {
  growth: "annual",
  decline: "annual"
};

let annualSectorData = {
  growth: null,
  decline: null
};

let annualSectorNames = {
  growth: [],
  decline: []
};

let monthlySectorData = null;

const formatterMoney = new Intl.NumberFormat("es-EC", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatterShort = new Intl.NumberFormat("es-EC", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatterPercent = new Intl.NumberFormat("es-EC", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return `$${formatterMoney.format(value)}`;
}

function formatShortMoney(value) {
  return `$${formatterShort.format(value)}`;
}

function formatChange(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatterPercent.format(value)}%`;
}

function formatSignedMoney(value) {
  const absolute = formatShortMoney(Math.abs(value));
  if (value > 0) {
    return `+${absolute}`;
  }
  if (value < 0) {
    return `-${absolute}`;
  }
  return absolute;
}

function animateKPI(element, targetValue, duration, formatter) {
  if (!element) return;
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatter(targetValue * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function toBillions(value) {
  return value / 1_000_000_000;
}

function buildPlotLayout(extra = {}) {
  return {
    margin: { l: 58, r: 28, t: 28, b: 56 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "rgba(239, 246, 255, 0.88)", size: 13 },
    hoverlabel: {
      bgcolor: "rgba(7, 19, 29, 0.96)",
      bordercolor: "rgba(255,255,255,0.12)",
      font: { color: "#eff6ff" },
    },
    xaxis: {
      gridcolor: "rgba(255,255,255,0.08)",
      zeroline: false,
      tickfont: { color: "rgba(239, 246, 255, 0.72)" },
      titlefont: { color: "rgba(239, 246, 255, 0.9)" },
    },
    yaxis: {
      gridcolor: "rgba(255,255,255,0.08)",
      zeroline: false,
      tickfont: { color: "rgba(239, 246, 255, 0.72)" },
      titlefont: { color: "rgba(239, 246, 255, 0.9)" },
    },
    ...extra,
  };
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function buildSectionButtons() {
  const buttons = Array.from(document.querySelectorAll(".story-nav button"));
  const sections = buttons
    .map((button) => document.getElementById(button.dataset.target))
    .filter(Boolean);

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      sections[index]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    });
  });

  return { buttons, sections };
}

function updateSectionButtons(buttons, activeIndex) {
  buttons.forEach((button, index) => {
    button.classList.toggle("is-active", index === activeIndex);
  });
}

let provinceSectorData = null;
let kpiValues = null;
let provinceTop3Value = null;

function animateKPIs() {
  if (!kpiValues) return;
  const { annual2023, delta } = kpiValues;
  animateKPI(document.getElementById("annual-2023"), annual2023, 1600, formatShortMoney);
  animateKPI(document.getElementById("annual-2024"), annual2023 + delta, 1600, formatShortMoney);
  animateKPI(document.getElementById("annual-delta"), (delta / annual2023) * 100, 1600, (v) => formatChange(v));
}

function animateProvinceTop3() {
  if (provinceTop3Value == null) return;
  animateKPI(document.getElementById("province-top3"), provinceTop3Value, 1600, (v) => `${formatterPercent.format(v)}%`);
}

function populateSummary(data) {
  const annual2023 = data.annual_totals["2023"];
  const annual2024 = data.annual_totals["2024"];
  const delta = annual2024 - annual2023;

  kpiValues = { annual2023, delta };
  animateKPIs();

  setText("positive-sector", data.sectors.positive.sector);
  setText("positive-change", `${formatChange(data.sectors.positive.pct_change)} · ${formatSignedMoney(data.sectors.positive.abs_change)}`);

  setText("negative-sector", data.sectors.negative.sector);
  setText("negative-change", `${formatChange(data.sectors.negative.pct_change)} · ${formatSignedMoney(data.sectors.negative.abs_change)}`);

  provinceTop3Value = data.provinces.top3_share;
  animateProvinceTop3();
  setText("province-top5", `Top 5: ${formatterPercent.format(data.provinces.top5_share)}% del total`);
}

function setupScrollNavigation() {
  if (!window.gsap || !window.ScrollTrigger) {
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  const desktop = window.matchMedia("(min-width: 901px)");
  const track = document.getElementById("panels-track");
  const panels = Array.from(document.querySelectorAll(".panel"));
  const buttons = Array.from(document.querySelectorAll(".story-nav button"));
  const arrowLeft = document.getElementById("arrow-left");
  const arrowRight = document.getElementById("arrow-right");

  let currentIndex = 0;
  let isScrolling = false;

  const scrollLength = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);

  function scrollToSection(index) {
    index = Math.max(0, Math.min(panels.length - 1, index));
    const maxScroll = scrollLength();
    const target = (index / (panels.length - 1)) * maxScroll;
    window.scrollTo({ top: target, behavior: "smooth" });
  }

  function updateArrows() {
    if (!desktop.matches) return;
    arrowLeft?.classList.toggle("visible", currentIndex > 0);
    arrowRight?.classList.toggle("visible", currentIndex < panels.length - 1);
  }

  let tween;

  function activateDesktop() {
    if (tween) {
      tween.scrollTrigger?.kill();
      tween.kill();
    }

    tween = window.gsap.to(track, {
      x: () => -scrollLength(),
      ease: "none",
      scrollTrigger: {
        trigger: ".story-shell",
        pin: true,
        scrub: 1,
        start: "top top",
        end: () => `+=${scrollLength()}`,
        anticipatePin: 1,
        onUpdate: (self) => {
          const activeIndex = Math.min(panels.length - 1, Math.round(self.progress * (panels.length - 1)));
          if (activeIndex !== currentIndex) {
            currentIndex = activeIndex;
            updateSectionButtons(buttons, activeIndex);
            updateArrows();
            if (activeIndex === 0) animateKPIs();
            if (activeIndex === 6) animateProvinceTop3();
          }
        },
      },
    });

    currentIndex = 0;
    updateArrows();
  }

  function clearDesktop() {
    if (tween) {
      tween.scrollTrigger?.kill();
      tween.kill();
      tween = null;
    }
    window.gsap.set(track, { x: 0 });
    currentIndex = 0;
    updateSectionButtons(buttons, 0);
    arrowLeft?.classList.remove("visible");
    arrowRight?.classList.remove("visible");
  }

  if (desktop.matches) {
    activateDesktop();
  } else {
    clearDesktop();
  }

  desktop.addEventListener("change", () => {
    if (desktop.matches) {
      activateDesktop();
    } else {
      clearDesktop();
      window.ScrollTrigger.refresh();
    }
  });

  arrowLeft?.addEventListener("click", () => {
    if (!desktop.matches) return;
    scrollToSection(currentIndex - 1);
  });

  arrowRight?.addEventListener("click", () => {
    if (!desktop.matches) return;
    scrollToSection(currentIndex + 1);
  });

  window.addEventListener("wheel", (e) => {
    if (!desktop.matches || isScrolling) return;

    const direction = e.deltaY > 0 ? 1 : -1;
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= panels.length) return;

    e.preventDefault();
    isScrolling = true;
    scrollToSection(nextIndex);

    setTimeout(() => {
      isScrolling = false;
    }, 800);
  }, { passive: false });

  window.addEventListener("keydown", (event) => {
    if (!desktop.matches) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToSection(currentIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToSection(currentIndex - 1);
    }
  });

  const heroSection = document.getElementById("hero");
  if (heroSection) {
    let heroFirstSeen = true;
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (heroFirstSeen) { heroFirstSeen = false; return; }
        animateKPIs();
      }
    }, { threshold: 0.5 }).observe(heroSection);
  }

  const provinceSection = document.getElementById("province-concentration");
  if (provinceSection) {
    let provinceFirstSeen = true;
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (provinceFirstSeen) { provinceFirstSeen = false; return; }
        animateProvinceTop3();
      }
    }, { threshold: 0.5 }).observe(provinceSection);
  }
}

function setupViewToggle(monthlySectorData) {
  const toggleGrowthView = document.getElementById("toggle-growth-view");
  const toggleGrowthMonthly = document.getElementById("toggle-growth-monthly");
  const toggleDeclineView = document.getElementById("toggle-decline-view");
  const toggleDeclineMonthly = document.getElementById("toggle-decline-monthly");

  const growthSliderContainer = document.getElementById("growth-slider-container");
  const declineSliderContainer = document.getElementById("decline-slider-container");
  const sliderGrowth = document.getElementById("month-slider-growth");
  const sliderDecline = document.getElementById("month-slider-decline");

  function updateSectorView(type, view) {
    currentSectorView[type] = view;

    if (type === "growth") {
      if (view === "annual") {
        toggleGrowthView.classList.add("view-toggle-btn--active");
        toggleGrowthMonthly.classList.remove("view-toggle-btn--active");
        growthSliderContainer.classList.remove("visible");
        createSectorChart("sector-growth-chart", annualSectorData.growth, "positive");
      } else {
        toggleGrowthView.classList.remove("view-toggle-btn--active");
        toggleGrowthMonthly.classList.add("view-toggle-btn--active");
        growthSliderContainer.classList.add("visible");
        const month = parseInt(sliderGrowth.value);
        redrawSectorChartForMonthFiltered(monthlySectorData, month, "sector-growth-chart", "growth");
      }
      setTimeout(() => animateChartPaths("sector-growth-chart", 0), 100);
    } else if (type === "decline") {
      if (view === "annual") {
        toggleDeclineView.classList.add("view-toggle-btn--active");
        toggleDeclineMonthly.classList.remove("view-toggle-btn--active");
        declineSliderContainer.classList.remove("visible");
        createSectorChart("sector-decline-chart", annualSectorData.decline, "negative");
      } else {
        toggleDeclineView.classList.remove("view-toggle-btn--active");
        toggleDeclineMonthly.classList.add("view-toggle-btn--active");
        declineSliderContainer.classList.add("visible");
        const month = parseInt(sliderDecline.value);
        redrawSectorChartForMonthFiltered(monthlySectorData, month, "sector-decline-chart", "decline");
      }
      setTimeout(() => animateChartPaths("sector-decline-chart", 0), 100);
    }
  }

  toggleGrowthView?.addEventListener("click", () => updateSectorView("growth", "annual"));
  toggleGrowthMonthly?.addEventListener("click", () => updateSectorView("growth", "monthly"));
  toggleDeclineView?.addEventListener("click", () => updateSectorView("decline", "annual"));
  toggleDeclineMonthly?.addEventListener("click", () => updateSectorView("decline", "monthly"));
}

function setupMonthlySliders(monthlySectorData) {
  const sliderGrowth = document.getElementById("month-slider-growth");
  const sliderDecline = document.getElementById("month-slider-decline");
  const labelGrowth = document.getElementById("month-label-growth");
  const labelDecline = document.getElementById("month-label-decline");

  if (!sliderGrowth || !sliderDecline) return;

  sliderDecline.addEventListener("input", (e) => {
    if (currentSectorView.decline === "monthly") {
      const month = parseInt(e.target.value);
      redrawSectorChartForMonthFiltered(monthlySectorData, month, "sector-decline-chart", "decline");
      labelDecline.textContent = MONTH_LABELS[month];
      sliderGrowth.value = month;
      if (currentSectorView.growth === "monthly") {
        redrawSectorChartForMonthFiltered(monthlySectorData, month, "sector-growth-chart", "growth");
        labelGrowth.textContent = MONTH_LABELS[month];
      }
      setTimeout(() => {
        if (currentSectorView.growth === "monthly") animateChartPaths("sector-growth-chart", 0);
        if (currentSectorView.decline === "monthly") animateChartPaths("sector-decline-chart", 0);
      }, 150);
    }
  });

  sliderGrowth.addEventListener("input", (e) => {
    if (currentSectorView.growth === "monthly") {
      const month = parseInt(e.target.value);
      redrawSectorChartForMonthFiltered(monthlySectorData, month, "sector-growth-chart", "growth");
      labelGrowth.textContent = MONTH_LABELS[month];
      sliderDecline.value = month;
      if (currentSectorView.decline === "monthly") {
        redrawSectorChartForMonthFiltered(monthlySectorData, month, "sector-decline-chart", "decline");
        labelDecline.textContent = MONTH_LABELS[month];
      }
      setTimeout(() => {
        if (currentSectorView.growth === "monthly") animateChartPaths("sector-growth-chart", 0);
        if (currentSectorView.decline === "monthly") animateChartPaths("sector-decline-chart", 0);
      }, 150);
    }
  });

  setupViewToggle(monthlySectorData);
}

function setupChartAnimations() {
  const chartContainers = document.querySelectorAll(".chart");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const chartId = entry.target.id;
        setTimeout(() => {
          animateChartPaths(chartId, 0);
        }, 100);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "50px"
  });

  chartContainers.forEach((chart) => {
    observer.observe(chart);
  });
}

function animateChartPaths(chartId, delay = 0) {
  const chart = document.getElementById(chartId);
  if (!chart) return;

  const paths = chart.querySelectorAll("path[d]");
  const circles = chart.querySelectorAll("circle");
  const rects = chart.querySelectorAll("rect[class*='slice']");

  gsap.killTweensOf([...paths, ...circles, ...rects]);

  paths.forEach((path) => {
    const length = path.getTotalLength();
    if (!isNaN(length)) {
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
    }
  });

  circles.forEach((circle) => {
    gsap.set(circle, { attr: { r: circle.getAttribute("data-original-r") || circle.getAttribute("r") } });
    circle.style.opacity = "1";
  });

  rects.forEach((rect) => {
    gsap.set(rect, {
      attr: {
        width: rect.getAttribute("data-original-width") || rect.getAttribute("width"),
        height: rect.getAttribute("data-original-height") || rect.getAttribute("height")
      }
    });
  });

  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    if (isNaN(length)) return;

    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.2,
      delay: delay + index * 0.08,
      ease: "power2.inOut"
    });
  });

  circles.forEach((circle, index) => {
    const originalR = parseFloat(circle.getAttribute("r"));
    gsap.fromTo(
      circle,
      { attr: { r: 0 } },
      {
        attr: { r: originalR },
        duration: 0.6,
        delay: delay + 0.4 + index * 0.06,
        ease: "back.out"
      }
    );
  });

  rects.forEach((rect, index) => {
    const x = parseFloat(rect.getAttribute("x"));
    const y = parseFloat(rect.getAttribute("y"));
    const w = parseFloat(rect.getAttribute("width"));
    const h = parseFloat(rect.getAttribute("height"));

    rect.setAttribute("data-original-width", w);
    rect.setAttribute("data-original-height", h);

    gsap.from(rect, {
      attr: { width: 0, height: 0 },
      x: x + w / 2,
      y: y + h / 2,
      duration: 1,
      delay: delay + index * 0.05,
      ease: "back.out"
    });
  });
}

async function boot() {
  try {
    const response = await fetch("./data/sri_ventas_story.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    populateSummary(data);
    createSeasonalityChart(data);
    createSectorChart("sector-growth-chart", data.sectors.ranking, "positive");
    createSectorChart("sector-decline-chart", data.sectors.ranking, "negative");
    createProvinceTreemap(data);
    setupScrollNavigation();

    try {
      const psResponse = await fetch("./data/sri_ventas_province_sectors.json", { cache: "no-store" });
      if (psResponse.ok) {
        provinceSectorData = await psResponse.json();
        setupProvinceFilter(data);
      }
    } catch (err) {
      console.warn("No se pudieron cargar datos de provincia x sector", err);
    }

    try {
      const monthlySectorResponse = await fetch("./data/sri_ventas_monthly_sectors.json", { cache: "no-store" });
      if (monthlySectorResponse.ok) {
        monthlySectorData = await monthlySectorResponse.json();
        setupMonthlySliders(monthlySectorData);
      }
    } catch (err) {
      console.warn("No se pudieron cargar datos mensuales de sectores", err);
    }

    const { buttons } = buildSectionButtons();
    updateSectionButtons(buttons, 0);

    setText("load-status", "Datos procesados y gráficos listos");
    window.addEventListener("resize", () => window.ScrollTrigger?.refresh());

    annualSectorData.growth = data.sectors.ranking;
    annualSectorData.decline = data.sectors.ranking;

    window.annualSectorData = annualSectorData;
    window.annualSectorNames = annualSectorNames;
    window.monthlySectorData = monthlySectorData;

    setTimeout(setupChartAnimations, 100);
    setupFullscreen();
  } catch (error) {
    console.error(error);
    setText("load-status", "No se pudo cargar data/sri_ventas_story.json");
  }
}

function setupFullscreen() {
  const btn = document.getElementById("fullscreen-btn");
  const iconEnter = document.getElementById("fs-icon-enter");
  const iconExit = document.getElementById("fs-icon-exit");
  if (!btn) return;

  function updateIcon() {
    const isFull = !!document.fullscreenElement;
    iconEnter.style.display = isFull ? "none" : "";
    iconExit.style.display = isFull ? "" : "none";
  }

  btn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  document.addEventListener("fullscreenchange", updateIcon);
  updateIcon();
}

document.addEventListener("DOMContentLoaded", boot);
