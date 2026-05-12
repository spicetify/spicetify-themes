// =====================================================================
// Pioneer VFD - DEH-P7600MP Spicetify extension
//   All animations strictly INSIDE the LCD window.
//   OEL/LKD clips are the main center display system.
// =====================================================================


(function installPvfdSpicetifyWaitForChunksGuard() {
  if (window.__pvfdSpicetifyWaitForChunksGuard) return;

  const originalSetTimeout = window.setTimeout;

  window.__pvfdSpicetifyWaitForChunksGuard = {
    blocked: 0,
    restore() {
      window.setTimeout = originalSetTimeout;
      delete window.__pvfdSpicetifyWaitForChunksGuard;
    }
  };

  window.setTimeout = function(callback, delay, ...args) {
    const source = typeof callback === "function" ? String(callback) : "";

    const isBadSpicetifyWaitLoop =
      delay === 100 &&
      typeof callback === "function" &&
      callback.name === "waitForChunks" &&
      source.includes("listOfComponents") &&
      source.includes("require.m") &&
      source.includes("Cards.Audiobook") &&
      source.includes("Cards.Track");

    if (isBadSpicetifyWaitLoop) {
      window.__pvfdSpicetifyWaitForChunksGuard.blocked++;
      return 0;
    }

    return originalSetTimeout.call(this, callback, delay, ...args);
  };
})();


(function PioneerVFD() {
  const bootStartedAt = window.__PVFD_BOOT_STARTED_AT || Date.now();
  window.__PVFD_BOOT_STARTED_AT = bootStartedAt;
  const playerReady = !!(
    window.Spicetify
    && Spicetify.Player
    && typeof Spicetify.Player.isPlaying === "function"
  );

  if (!playerReady) {
    if (!window.__PVFD_BOOT_WARNED__ && Date.now() - bootStartedAt > 10000) {
      window.__PVFD_BOOT_WARNED__ = true;
      console.warn("[PVFD] Waiting for Spicetify Player API. If this never loads, run `spicetify config expose_apis 1`, then `spicetify apply`.");
    }
    setTimeout(PioneerVFD, 300);
    return;
  }
  if (window.__PVFD_EXTENSION_RUNNING__) return;
  window.__PVFD_EXTENSION_RUNNING__ = true;

  const NUM_BARS = 48;
  const SMOOTHING = 0.72;
  const FRAME_INTERVAL_MS = 33;
  const PVFD_PROF_STORAGE_KEY = "pvfd-prof";
  const MEDIUM_LANE_INTERVAL_MS = 120;
  const SLOW_LANE_INTERVAL_MS = 320;
  const ROUTE_STATE_SAMPLE_MS = 240;
  const ROUTE_CHURN_SUPPRESS_MS = 700;
  const ROUTE_CHURN_SEARCH_DELAY_MS = 220;
  const VISUALIZER_EPSILON = 0.004;
  const SCRUB_MS_PER_TICK = 5000;

  // Default RGB values for the 4 main LCD color roles, used if CSS variable parsing fails.
  let lcdBackgroundCache = null;
  const clipColorCache = new Map();

  const PVFD_DEFAULT_COLORS = {
    lcdVoid: "#02060c",
    lcdDeep: "#06121e",
    lcdRim: "#1a2c3c",

    cyan: "#89e0f8",
    cyanMid: "#7ed4f0",
    cyanDeep: "#4eb4d8",
    cyanGlow: "#6ed4f8",

    textBright: "#effcff",
    chromeText: "#1a2030",
    green: "#b8e896",

    light: [137, 224, 248],
    mid: [126, 212, 240],
    deep: [78, 180, 216],
    accentDim: [26, 58, 92],
    lcdVoidRgb: [2, 6, 12],
    lcdDeepRgb: [6, 18, 30],
    lcdRimRgb: [26, 44, 60],
    textBrightRgb: [239, 252, 255],
    greenRgb: [184, 232, 150]
  };

  const pvfdCssPalette = {
    lcdVoid: PVFD_DEFAULT_COLORS.lcdVoid,
    lcdDeep: PVFD_DEFAULT_COLORS.lcdDeep,
    lcdRim: PVFD_DEFAULT_COLORS.lcdRim,

    cyan: PVFD_DEFAULT_COLORS.cyan,
    cyanMid: PVFD_DEFAULT_COLORS.cyanMid,
    cyanDeep: PVFD_DEFAULT_COLORS.cyanDeep,
    cyanGlow: PVFD_DEFAULT_COLORS.cyanGlow,

    textBright: PVFD_DEFAULT_COLORS.textBright,
    chromeText: PVFD_DEFAULT_COLORS.chromeText,
    green: PVFD_DEFAULT_COLORS.green,

    light: PVFD_DEFAULT_COLORS.light.slice(),
    mid: PVFD_DEFAULT_COLORS.mid.slice(),
    deep: PVFD_DEFAULT_COLORS.deep.slice(),
    accentDim: PVFD_DEFAULT_COLORS.accentDim.slice(),
    lcdVoidRgb: PVFD_DEFAULT_COLORS.lcdVoidRgb.slice(),
    lcdDeepRgb: PVFD_DEFAULT_COLORS.lcdDeepRgb.slice(),
    lcdRimRgb: PVFD_DEFAULT_COLORS.lcdRimRgb.slice(),
    textBrightRgb: PVFD_DEFAULT_COLORS.textBrightRgb.slice(),
    greenRgb: PVFD_DEFAULT_COLORS.greenRgb.slice()
  };

  let pvfdPaletteVersion = 0;

  function pvfdSameRgb(a, b) {
    return (
      a &&
      b &&
      a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2]
    );
  }

  function pvfdNormalizeHexColor(value, fallback) {
    const raw = String(value || "").trim();

    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();

    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
    }

    return fallback;
  }

  function readCssColorVar(name, fallback) {
    const rootValue = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();

    const chassisValue = chassis
      ? getComputedStyle(chassis).getPropertyValue(name).trim()
      : "";

    return pvfdNormalizeHexColor(rootValue || chassisValue, fallback);
  }

  function readCssRgbVar(name, fallback) {
    const rootValue = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();

    const chassisValue = chassis
      ? getComputedStyle(chassis).getPropertyValue(name).trim()
      : "";

    const raw = rootValue || chassisValue;

    if (!raw) return fallback.slice();

    const parts = raw
      .split(",")
      .map((part) => Number(part.trim()));

    if (parts.length < 3 || parts.some((value) => !Number.isFinite(value))) {
      return fallback.slice();
    }

    return [
      Math.max(0, Math.min(255, Math.round(parts[0]))),
      Math.max(0, Math.min(255, Math.round(parts[1]))),
      Math.max(0, Math.min(255, Math.round(parts[2])))
    ];
  }

  function pvfdMixRgb(a, b, t) {
    const x = Math.max(0, Math.min(1, t));

    return [
      Math.round(a[0] + (b[0] - a[0]) * x),
      Math.round(a[1] + (b[1] - a[1]) * x),
      Math.round(a[2] + (b[2] - a[2]) * x)
    ];
  }

  function pvfdHexToRgb(hex, fallback) {
    const clean = pvfdNormalizeHexColor(hex, "");

    if (!clean) return fallback.slice();

    return [
      parseInt(clean.slice(1, 3), 16),
      parseInt(clean.slice(3, 5), 16),
      parseInt(clean.slice(5, 7), 16)
    ];
  }

  function pvfdRgb(rgb) {
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  }

  function pvfdRgba(rgb, alpha) {
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  }

  function refreshPvfdCssPalette() {
    const nextPalette = {
      lcdVoid: readCssColorVar("--pvfd-lcd-void", PVFD_DEFAULT_COLORS.lcdVoid),
      lcdDeep: readCssColorVar("--pvfd-lcd-deep", PVFD_DEFAULT_COLORS.lcdDeep),
      lcdRim: readCssColorVar("--pvfd-lcd-rim", PVFD_DEFAULT_COLORS.lcdRim),

      cyan: readCssColorVar("--pvfd-cyan", PVFD_DEFAULT_COLORS.cyan),
      cyanMid: readCssColorVar("--pvfd-cyan-mid", PVFD_DEFAULT_COLORS.cyanMid),
      cyanDeep: readCssColorVar("--pvfd-cyan-deep", PVFD_DEFAULT_COLORS.cyanDeep),
      cyanGlow: readCssColorVar("--pvfd-cyan-glow", PVFD_DEFAULT_COLORS.cyanGlow),

      textBright: readCssColorVar("--pvfd-text-bright", PVFD_DEFAULT_COLORS.textBright),
      chromeText: readCssColorVar("--pvfd-chrome-text", PVFD_DEFAULT_COLORS.chromeText),
      green: readCssColorVar("--pvfd-green", PVFD_DEFAULT_COLORS.green),

      light: readCssRgbVar("--pvfd-light-rgb", PVFD_DEFAULT_COLORS.light),
      mid: readCssRgbVar("--pvfd-light-mid-rgb", PVFD_DEFAULT_COLORS.mid),
      deep: readCssRgbVar("--pvfd-light-deep-rgb", PVFD_DEFAULT_COLORS.deep),
      accentDim: readCssRgbVar("--pvfd-accent-dim-rgb", PVFD_DEFAULT_COLORS.accentDim),
      lcdVoidRgb: readCssRgbVar("--pvfd-lcd-void-rgb", PVFD_DEFAULT_COLORS.lcdVoidRgb),
      lcdDeepRgb: readCssRgbVar("--pvfd-lcd-deep-rgb", PVFD_DEFAULT_COLORS.lcdDeepRgb),
      lcdRimRgb: readCssRgbVar("--pvfd-lcd-rim-rgb", PVFD_DEFAULT_COLORS.lcdRimRgb),
      textBrightRgb: readCssRgbVar("--pvfd-text-bright-rgb", PVFD_DEFAULT_COLORS.textBrightRgb),
      greenRgb: readCssRgbVar("--pvfd-green-rgb", PVFD_DEFAULT_COLORS.greenRgb)
    };

    const changed = (
      pvfdCssPalette.lcdVoid !== nextPalette.lcdVoid ||
      pvfdCssPalette.lcdDeep !== nextPalette.lcdDeep ||
      pvfdCssPalette.lcdRim !== nextPalette.lcdRim ||
      pvfdCssPalette.cyan !== nextPalette.cyan ||
      pvfdCssPalette.cyanMid !== nextPalette.cyanMid ||
      pvfdCssPalette.cyanDeep !== nextPalette.cyanDeep ||
      pvfdCssPalette.cyanGlow !== nextPalette.cyanGlow ||
      pvfdCssPalette.textBright !== nextPalette.textBright ||
      pvfdCssPalette.chromeText !== nextPalette.chromeText ||
      pvfdCssPalette.green !== nextPalette.green ||
      !pvfdSameRgb(pvfdCssPalette.light, nextPalette.light) ||
      !pvfdSameRgb(pvfdCssPalette.mid, nextPalette.mid) ||
      !pvfdSameRgb(pvfdCssPalette.deep, nextPalette.deep) ||
      !pvfdSameRgb(pvfdCssPalette.accentDim, nextPalette.accentDim) ||
      !pvfdSameRgb(pvfdCssPalette.lcdVoidRgb, nextPalette.lcdVoidRgb) ||
      !pvfdSameRgb(pvfdCssPalette.lcdDeepRgb, nextPalette.lcdDeepRgb) ||
      !pvfdSameRgb(pvfdCssPalette.lcdRimRgb, nextPalette.lcdRimRgb) ||
      !pvfdSameRgb(pvfdCssPalette.textBrightRgb, nextPalette.textBrightRgb) ||
      !pvfdSameRgb(pvfdCssPalette.greenRgb, nextPalette.greenRgb)
    );

    if (!changed) return false;

    pvfdCssPalette.lcdVoid = nextPalette.lcdVoid;
    pvfdCssPalette.lcdDeep = nextPalette.lcdDeep;
    pvfdCssPalette.lcdRim = nextPalette.lcdRim;
    pvfdCssPalette.cyan = nextPalette.cyan;
    pvfdCssPalette.cyanMid = nextPalette.cyanMid;
    pvfdCssPalette.cyanDeep = nextPalette.cyanDeep;
    pvfdCssPalette.cyanGlow = nextPalette.cyanGlow;
    pvfdCssPalette.textBright = nextPalette.textBright;
    pvfdCssPalette.chromeText = nextPalette.chromeText;
    pvfdCssPalette.green = nextPalette.green;

    pvfdCssPalette.light = nextPalette.light;
    pvfdCssPalette.mid = nextPalette.mid;
    pvfdCssPalette.deep = nextPalette.deep;
    pvfdCssPalette.accentDim = nextPalette.accentDim;
    pvfdCssPalette.lcdVoidRgb = nextPalette.lcdVoidRgb;
    pvfdCssPalette.lcdDeepRgb = nextPalette.lcdDeepRgb;
    pvfdCssPalette.lcdRimRgb = nextPalette.lcdRimRgb;
    pvfdCssPalette.textBrightRgb = nextPalette.textBrightRgb;
    pvfdCssPalette.greenRgb = nextPalette.greenRgb;

    pvfdPaletteVersion++;

    lcdBackgroundCache = null;
    lastCanvasFrameKey = "";

    return true;
  }

  // TINT cycle: full-color OEL/video keeps the old LCD hue-rotate path.
  // One-color WebM tint uses the CSS RGB tint wash directly so it is not
  // hue-rotated a second time.
  const TINT_LABELS = ["CYAN", "AMBER", "VIOLET"];
  const TINT_HUE_DEG = [0, 225, 100];
  const TINT_STORAGE_KEY = "pvfd-tint-mode";
  const DIM_STORAGE_KEY = "pvfd-dim-mode";
  const FONT_STORAGE_KEY = "pvfd-font-preset";
  const PERF_STORAGE_KEY = "pvfd-performance-mode";
  const LOGO_GLOW_STORAGE_KEY = "pvfd-logo-bpm-glow";
  const CLIP_STORAGE_KEY = "pvfd-oel-clip";
  const OEL_DISPLAY_STORAGE_KEY = "pvfd-oel-display";
  const RACING_COLOR_STORAGE_KEY = "pvfd-racing-color-mode";
  const LEGACY_RACING_COLOR_STORAGE_KEY = "pvfd-racing-color-breakout";
  const RACING_CLIP_ID = "racing-cart-longloop-webm";
  const OEL_WEBM_SOURCE_MAP_PLACEHOLDER = "__PVFD_" + "OEL_WEBM_SOURCE_MAP_JSON__";
  const OEL_WEBM_SOURCE_MAP = {
    "movie5_longloop.webm": "https://adainstarks.github.io/PioneerVFD/Themes/PioneerVFD/assets/movie5_longloop.webm",
    "movie1_longloop.webm": "https://adainstarks.github.io/PioneerVFD/Themes/PioneerVFD/assets/movie1_longloop.webm",
    "movie6_longloop.webm": "https://adainstarks.github.io/PioneerVFD/Themes/PioneerVFD/assets/movie6_longloop.webm",
    "movie10_f_longloop.webm": "https://adainstarks.github.io/PioneerVFD/Themes/PioneerVFD/assets/movie10_f_longloop.webm",
    "diverdolphins_longloop.webm": "https://adainstarks.github.io/PioneerVFD/Themes/PioneerVFD/assets/diverdolphins_longloop.webm",
    "6_Racing_Cart_longloop.webm": "https://adainstarks.github.io/PioneerVFD/Themes/PioneerVFD/assets/6_Racing_Cart_longloop.webm"
  };
  const OEL_WEBM_CLIPS = [
    { id: "movie5-longloop-webm-proof", label: "CARZERIA", name: "MOVIE5 LONG", assetName: "movie5_longloop.webm" },
    { id: "movie1-longloop-webm", label: "JETS", name: "MOVIE1 LONG", assetName: "movie1_longloop.webm" },
    { id: "movie6-longloop-webm", label: "J-FLYIN", name: "MOVIE6 LONG", assetName: "movie6_longloop.webm" },
    { id: "movie10f-longloop-webm", label: "MECHA", name: "MOVIE10 F", assetName: "movie10_f_longloop.webm" },
    { id: "diverdolphins-longloop-webm", label: "DOLPHIN", name: "DIVER DOLPHINS", assetName: "diverdolphins_longloop.webm" },
    { id: "racing-cart-longloop-webm", label: "RACING", name: "RACING CART", assetName: "6_Racing_Cart_longloop.webm" }
  ];
  const PVFD_PLAY_GLYPH = "\u25B6";
  const PVFD_PAUSE_GLYPH = "\u23F8";
  const PVFD_META_IDLE_GLYPH = "\u2014";
  const PVFD_META_PAUSE_GLYPH = "\u2161";
  const FONT_PRESETS = [
    { label: "DOT",  stack: "\"VT323\", \"Share Tech Mono\", monospace" },
    { label: "LCD",  stack: "\"Iceland\", \"Share Tech Mono\", monospace" },
    { label: "TECH", stack: "\"Share Tech Mono\", monospace" },
    { label: "CRT",  stack: "\"VCR OSD Mono\", \"Silkscreen\", \"VT323\", monospace" },
  ];
  const DEFAULT_FONT_PRESET = "TECH";
  let tintIdx = 0;
  let fontPresetIdx = FONT_PRESETS.findIndex(p => p.label === DEFAULT_FONT_PRESET);
  let performanceModeIdx = 0;
  let logoGlowEnabled = false;
  let pulseLiveFailureReason = "";
  let oelDisplayEnabled = true;
  let racingColorEnabled = false;

  const DEMO_CLIP_CYCLE_MS = 8000;
  const SOURCE_TARGETS = [
    { label: "PLAY", title: "Playback", kind: "playback" },
    { label: "LIB", title: "Your Library", kind: "library" },
    { label: "SRCH", title: "Search", kind: "search" },
    { label: "HOME", title: "Home", kind: "home" },
  ];
  let sourceIdx = 0;
  let sourceFlashUntil = 0;
  let demoAutoMode = false;
  let demoLastClipSwitchMs = 0;
  let menuOpen = false;

  // Legacy LKD payload intentionally stripped from the production path now that the
  // WebM OEL system is the only active renderer.
  const CLIPS = [];
  let clipIdx = 0;
  let clipStartMs = 0;
  let clipVirtualMs = 0;
  let clipLastTsMs = 0;

  let logoLiveGuitarCentroidPrev = 0;
  let logoLiveGuitarMotionEnv = 0;
  let logoLiveStyleCache = Object.create(null);
  let logoLiveAudioStream = null;
  let logoLiveAudioCtx = null;
  let logoLiveAudioAnalyser = null;
  let logoLiveAudioBins = null;
  let logoStrip = null;
  let logoLiveAudioSchedulerRaf = 0;
  let logoLiveAudioActive = false;
  let logoLiveAudioPending = false;
  let logoLiveAudioResumeTimer = 0;
  let desktopCaptureActive = false;
  let desktopCapturePending = false;
  let logoLivePrevBins = null;
  let logoLiveLastPulseMs = 0;
  let logoLiveDebugLastMs = 0;
  let logoLiveSubEnv = 0;
  let logoLiveBassEnv = 0;
  let logoLiveLowMidEnv = 0;
  let logoLiveMidEnv = 0;
  let logoLiveUpperMidEnv = 0;
  let logoLivePresenceEnv = 0;
  let logoLiveAirEnv = 0;
  let logoLiveLowEnv = 0;
  let logoLiveHighEnv = 0;
  let logoLiveSubSlow = 0;
  let logoLiveLowSlow = 0;
  let logoLiveMidSlow = 0;
  let logoLivePresenceSlow = 0;
  let logoLiveHighSlow = 0;
  let logoLiveSubPrev = 0;
  let logoLiveBassPrev = 0;
  let logoLiveLowMidPrev = 0;
  let logoLiveMidPrev = 0;
  let logoLiveUpperMidPrev = 0;
  let logoLivePresencePrev = 0;
  let logoLiveAirPrev = 0;
  let logoLiveLowPrev = 0;
  let logoLiveHighPrev = 0;
  let logoLiveFluxAvg = 0;
  let logoLivePunchEnv = 0;
  let logoLiveLogoEnv = 0;
  let lastLogoLiveAudioUpdateAt = -Infinity;
  let barHeights = new Array(NUM_BARS).fill(0);
  let sideVuEnergy = 0;
  let pvfdPlaylistScrollStressUntil = -Infinity;
  let pvfdPlaylistScrollStressInstalled = false;

  let lastScrollStressLogoDemandAt = -Infinity;
  let lastScrollStressKnobLedAt = -Infinity;

  let lastSideVuPlayingState = null;
  let lastSideVuReadoutAt = -Infinity;
  let sideVuSettleUntil = -Infinity;

  const SCROLL_STRESS_LOGO_DEMAND_MS = 500;
  const SCROLL_STRESS_KNOB_LED_MS = 350;

  const SIDE_VU_READOUT_MS = 1000;
  const SIDE_VU_SETTLE_MS = 420;
  const SIDE_VU_SETTLE_UPDATE_MS = 70;
  let lastMediumLaneAt = -Infinity;
  let lastSlowLaneAt = -Infinity;
  let globalSearchFocusState = false;
  let globalSearchFocusTimer = 0;
  let pendingGlobalSearchFocusTarget = null;
  const patchedLibrarySearchInputs = new WeakSet();
  const patchedLibrarySearchContainers = new WeakSet();
  const patchedLibraryToolbars = new WeakSet();
  const patchedLibraryRecentsControls = new WeakSet();
  const patchedLyricsSyncButtons = new WeakSet();
  const pvfdRouteState = { route: "other", at: -Infinity, churnUntil: 0 };
  const pvfdMutationWork = {
    chassisRecheck: false,
    mainViewChurn: false,
    searchRoot: null,
    lyricsRoot: null,
    browseFontTarget: false,
    routeMaybeChanged: false,
  };
  let pvfdPerfEnabled = false;
  const pvfdPerfStats = Object.create(null);

  let canvas = null, ctx = null;
  let lcdDimmed = false;
  let chassis = null;
  let trackTitle = "", trackArtist = "";
  let lastTrackUri = "";
  let pendingVolume = null;
  let volumeCommitTimer = null;
  let scrubPreviewMs = null;
  let scrubPreviewUntil = 0;
  let navDrag = null;
  let lastClipCacheKey = "";
  let lastCanvasFrameKey = "";
  let oelVideoActiveClipKey = "";
  let oelWebmSourceMap = null;
  let oelWebmLastCheckedUrl = "";
  let oelCanvasRendererDisabledLogged = false;
  let clipCacheRebuildBlockedUntil = 0;
  const CLIP_CACHE_BATCH_MS = 4;
  const CLIP_CACHE_ROUTE_REBUILD_BLOCK_MS = 650;
  const CLIP_CACHE_HOME_POINTER_REBUILD_BLOCK_MS = 220;
  const CLIP_RENDER_CACHE_ENABLED = true; // cached OEL frame path
  const MUTATION_FLUSH_DELAY_MS = 80;
  const PLAYER_STATE_SAMPLE_MS = 900;
  const PLAYER_TIMING_SAMPLE_MS = 1000;
  // logo strip is live-audio only. No Spotify analysis, no metronome fallback.
  // The analyser is throttled to ~30fps to keep the theme cheap for release users.
  const LOGO_LIVE_AUDIO_SCHEDULER_MS = 33;
  const LOGO_LIVE_SUB_MIN_HZ = 28;
  const LOGO_LIVE_SUB_MAX_HZ = 70;
  const LOGO_LIVE_BASS_MIN_HZ = 70;
  const LOGO_LIVE_BASS_MAX_HZ = 160;
  const LOGO_LIVE_LOWMID_MIN_HZ = 160;
  const LOGO_LIVE_LOWMID_MAX_HZ = 420;
  const LOGO_LIVE_MID_MIN_HZ = 420;
  const LOGO_LIVE_MID_MAX_HZ = 1500;
  const LOGO_LIVE_UPPERMID_MIN_HZ = 1500;
  const LOGO_LIVE_UPPERMID_MAX_HZ = 3200;
  const LOGO_LIVE_PRESENCE_MIN_HZ = 3200;
  const LOGO_LIVE_PRESENCE_MAX_HZ = 7000;
  const LOGO_LIVE_AIR_MIN_HZ = 7000;
  const LOGO_LIVE_AIR_MAX_HZ = 12000;
  const LOGO_LIVE_LOW_MIN_HZ = LOGO_LIVE_BASS_MIN_HZ;
  const LOGO_LIVE_LOW_MAX_HZ = LOGO_LIVE_LOWMID_MAX_HZ;
  const LOGO_LIVE_HIGH_MIN_HZ = LOGO_LIVE_UPPERMID_MIN_HZ;
  const LOGO_LIVE_HIGH_MAX_HZ = LOGO_LIVE_AIR_MAX_HZ;
  const LOGO_LIVE_ATTACK = 0.96;
  const LOGO_LIVE_RELEASE = 0.64;
  const LOGO_LIVE_HIGH_ATTACK = 0.97;
  const LOGO_LIVE_HIGH_RELEASE = 0.70;
  const LOGO_LIVE_LOGO_ATTACK = 0.24;
  const LOGO_LIVE_LOGO_RELEASE = 0.070;
  const LOGO_LIVE_DEBUG = false;
  const LOGO_GLOW_TIMING_SMOOTHING = 0.65;
  // 2048 gives ~23 Hz/bin at 48 kHz — coarser sizes (e.g. 256 → 187 Hz/bin) collapse
  // the 28–70 Hz SUB band and 70–160 Hz BASS band into the same bin.
  const DESKTOP_CAPTURE_FFT_SIZE = 2048;
  const TRACK_SYNC_INTERVAL_MS = 600;
  const BAR_UPDATE_INTERVAL_MS = 140;
  const PROGRESS_READOUT_INTERVAL_MS = 220;
  const STATIC_READOUT_INTERVAL_MS = 1200;
  const ECO_STATIC_READOUT_INTERVAL_MS = 4200;
  const EXTERNAL_VOLUME_LED_SAMPLE_MS = 5000;
  const VOLUME_SAMPLE_MS = 1200;
  const PERFORMANCE_MODES = [
    {
      label: "FULL",
      frameMs: FRAME_INTERVAL_MS,
      maxClipFps: 60,
      maxDpr: 2,
      cacheBatchMs: CLIP_CACHE_BATCH_MS,
      cacheFramesPerSlice: 3,
      barUpdateMs: BAR_UPDATE_INTERVAL_MS,
      sideVu: true,
      sideReadouts: true,
      reducedEffects: false,
      preloadFullClipCache: true,
      allowPartialClipCache: false,
      keepPreviousClipCache: true,
      releaseInactiveClipBytes: false,
      maxCachedClipFrames: Infinity,
    },
    {
      label: "ECO",
      frameMs: FRAME_INTERVAL_MS,
      maxClipFps: 12,
      maxDpr: 1,
      cacheBatchMs: 8,
      cacheFramesPerSlice: 6,
      barUpdateMs: 1000,
      sideVu: false,
      sideReadouts: false,
      reducedEffects: true,
      preloadFullClipCache: true,
      allowPartialClipCache: true,
      keepPreviousClipCache: false,
      releaseInactiveClipBytes: true,
      maxCachedClipFrames: Infinity,
    },
  ];

  // Cache for the logo spectrum meter canvases — avoids per-frame querySelector +
  // getContext. Populated by ensureLogoSpectrumMarkup; nulled by mutation observer
  // when the strip is rebuilt by Spotify.
  const logoMeterCache = { left: null, right: null };

  function fmtTime(ms) {
    const s = Math.max(0, Math.floor((ms || 0) / 1000));
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  }

  function findPlayerBar() {
    const root = document.querySelector(".Root__now-playing-bar");
    if (root) return root;

    const testIdBar = document.querySelector("[data-testid='now-playing-bar']");
    if (testIdBar) {
      const rootParent = testIdBar.closest(".Root__now-playing-bar");
      return rootParent || testIdBar;
    }

    return document.querySelector(".main-nowPlayingBar-container");
  }

  function preparePlayerBar(bar) {
    if (!bar) return;
    document.documentElement.classList.add("pvfd-theme-active");
    document.body.classList.add("pvfd-theme-active");
    bar.classList.add("pvfd-mounted");
    bar.style.setProperty("height", "var(--pvfd-player-height)", "important");
    bar.style.setProperty("min-height", "var(--pvfd-player-height)", "important");
    bar.style.setProperty("max-height", "var(--pvfd-player-height)", "important");
    bar.style.setProperty("position", "relative", "important");
    bar.style.setProperty("overflow", "hidden", "important");
  }

  function hideNativePlayerChildren(bar) {
    if (!bar) return;
    Array.from(bar.children).forEach((child) => {
      if (!child.classList || !child.classList.contains("pvfd-chassis")) {
        child.classList.add("pvfd-native-player-hidden");
        child.setAttribute("aria-hidden", "true");
      }
    });
  }

  function buildChassis() {
    const root = document.createElement("div");
    root.className = "pvfd-chassis";
    root.innerHTML = `
      <div class="pvfd-faceplate">
        <div style="display:flex;align-items:center;gap:14px;justify-content:flex-start;">
          <span class="pvfd-silk-eeq">EEQ</span>
          <span class="pvfd-silk-label">MOSFET 50W&times;4</span>
          <button class="pvfd-silk-lyrics" type="button" data-pvfd="lyrics" aria-label="Open song lyrics" title="Open lyrics">Lyrics</button>
        </div>
        <div class="pvfd-logo-strip" aria-label="Live audio spectrum logo strip">
          <div class="pvfd-logo-spectrum pvfd-logo-spectrum-left" aria-hidden="true">
            <span class="pvfd-vbar pvfd-vbar-left-air"></span>
            <span class="pvfd-vbar pvfd-vbar-left-presence"></span>
            <span class="pvfd-vbar pvfd-vbar-left-uppermid"></span>
            <span class="pvfd-vbar pvfd-vbar-left-mid"></span>
            <span class="pvfd-vbar pvfd-vbar-left-lowmid"></span>
            <span class="pvfd-vbar pvfd-vbar-left-bass"></span>
            <span class="pvfd-vbar pvfd-vbar-left-sub"></span>
          </div>
          <span class="pvfd-silk-pioneer">pioneer</span>
          <div class="pvfd-logo-spectrum pvfd-logo-spectrum-right" aria-hidden="true">
            <span class="pvfd-vbar pvfd-vbar-right-sub"></span>
            <span class="pvfd-vbar pvfd-vbar-right-bass"></span>
            <span class="pvfd-vbar pvfd-vbar-right-lowmid"></span>
            <span class="pvfd-vbar pvfd-vbar-right-mid"></span>
            <span class="pvfd-vbar pvfd-vbar-right-uppermid"></span>
            <span class="pvfd-vbar pvfd-vbar-right-presence"></span>
            <span class="pvfd-vbar pvfd-vbar-right-air"></span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;justify-content:flex-end;">
          <span class="pvfd-silk-label">WMA / MP3</span>
          <span class="pvfd-silk-dab">DAB CONTROL</span>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:#d8dce0;font-size:10px;font-weight:700;letter-spacing:0.5px;">OPEN</span>
            <div class="pvfd-open-led" data-pvfd="open" title="Open device picker"></div>
          </div>
        </div>
      </div>

      <div class="pvfd-mainrow">
        <div class="pvfd-knob-wrap">
          <div class="pvfd-knob" data-pvfd="lknob" title="Volume (scroll or drag)">
            <div class="pvfd-knob-glow"></div>
            <div class="pvfd-knob-bezel"></div>
            <div class="pvfd-knob-led-arc"></div>
            <div class="pvfd-knob-cap"></div>
            <div class="pvfd-knob-indicator"></div>
          </div>
        </div>

        <div class="pvfd-flank">
          <div class="pvfd-pill" data-pvfd="scan" title="Cycle Spotify source view">SRC</div>
          <div class="pvfd-pill" data-pvfd="dim"  title="Toggle LCD brightness">DIM</div>
          <div class="pvfd-pill" data-pvfd="clip" title="Next OEL/LKD animation">OEL</div>
        </div>

        <div class="pvfd-display-stack">
          <div class="pvfd-meta-lcd" aria-label="Now playing metadata">
            <div class="pvfd-meta-track">${PVFD_PLAY_GLYPH} ${PVFD_META_IDLE_GLYPH}</div>
            <div class="pvfd-meta-progress" data-pvfd="trackbar" title="Click or drag to scrub">
              <span class="pvfd-progress-text">:----------&gt;----------:</span>
            </div>
            <div class="pvfd-meta-time">0:00</div>
          </div>

          <div class="pvfd-compact-stage" aria-label="Compact Pioneer LCD test stage">
            <div class="pvfd-lcd-side pvfd-lcd-side-left" aria-label="Playback readouts">
              <div class="pvfd-side-label">PLAYBACK</div>
              <div class="pvfd-side-readout"><b>VOL</b><span data-pvfd="side-vol">--%</span></div>
              <div class="pvfd-side-readout"><b>MODE</b><span data-pvfd="side-mode">----</span></div>
              <div class="pvfd-side-readout"><b>TINT</b><span data-pvfd="side-tint">CYAN</span></div>
              <div class="pvfd-side-readout"><b>LCD</b><span data-pvfd="side-dim">FULL</span></div>
              <div class="pvfd-side-badges"><span>LIVE</span><span>VFD</span></div>
              <div class="pvfd-side-model pvfd-side-eco-model" data-pvfd="side-eco-model">ECO</div>
            </div>

            <div class="pvfd-lcd" aria-label="Pioneer VFD animation display">
              <div class="pvfd-lcd-video-probe" data-pvfd="lcd-video-probe" aria-hidden="true"></div>
              <video class="pvfd-lcd-video" data-pvfd="lcd-video" aria-hidden="true"></video>
              <div class="pvfd-oel-tint-wash" data-pvfd="oel-tint-wash" aria-hidden="true"></div>
              <canvas class="pvfd-lcd-canvas"></canvas>
            </div>

            <div class="pvfd-lcd-side pvfd-lcd-side-right" aria-label="Playback status readouts">
              <div class="pvfd-side-vu" data-pvfd="side-vu">
                <span></span><span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
              <div class="pvfd-side-readouts-right">
                <div class="pvfd-side-readout"><b>PROG</b><span data-pvfd="side-prog">--%</span></div>
                <div class="pvfd-side-readout"><b>LEFT</b><span data-pvfd="side-left">--:--</span></div>
                <div class="pvfd-side-readout"><b>RPT</b><span data-pvfd="side-repeat">OFF</span></div>
                <div class="pvfd-side-readout"><b>SHUF</b><span data-pvfd="side-shuffle">OFF</span></div>
              </div>
              <div class="pvfd-side-model" data-pvfd="side-status">PAUSE</div>
              <div class="pvfd-side-badges"><span>DSP</span><span data-pvfd="side-playbadge">IDLE</span></div>
            </div>
          </div>

          <div class="pvfd-menu-panel" data-pvfd="menu-panel" aria-hidden="true">
            <div class="pvfd-menu-title">PIONEER MENU</div>
            <div class="pvfd-menu-main" data-pvfd="menu-main">
              <div class="pvfd-menu-row-split">
                <div class="pvfd-menu-row" data-pvfd-menu-action="source"><b>SRC</b><span data-pvfd="menu-src">PLAY</span></div>
                <button class="pvfd-menu-row pvfd-menu-right-toggle pvfd-menu-perf-toggle" type="button" data-pvfd-menu-action="perf" title="Cycle performance mode"><b>PERF</b><span data-pvfd="menu-perf">FULL</span></button>
              </div>
              <div class="pvfd-menu-row-split">
                <div class="pvfd-menu-row" data-pvfd-menu-action="clip"><b>OEL</b><span data-pvfd="menu-oel">----</span></div>
                <button class="pvfd-menu-row pvfd-menu-right-toggle pvfd-menu-logo-toggle" type="button" data-pvfd-menu-action="logoGlow" title="Toggle Chromium live audio capture"><b>PULSE</b><span data-pvfd="menu-logo-glow">OFF</span></button>
              </div>
              <div class="pvfd-menu-row-split">
                <div class="pvfd-menu-row" data-pvfd-menu-action="demo"><b>DEMO</b><span data-pvfd="menu-demo">OFF</span></div>
                <button class="pvfd-menu-row pvfd-menu-right-toggle" type="button" data-pvfd-menu-action="racingColor" title="Racing only: TINT forces one-color VFD; COLOR keeps full range while still hue-shifting with the current tint"><b>RACING</b><span data-pvfd="menu-racing-color">TINT</span></button>
              </div>
              <div class="pvfd-menu-row-split">
                <div class="pvfd-menu-row" data-pvfd-menu-action="tint"><b>TINT</b><span data-pvfd="menu-tint">CYAN</span></div>
                <button class="pvfd-menu-row pvfd-menu-right-toggle pvfd-menu-logo-toggle" type="button" data-pvfd-menu-action="oelDisplay" title="Toggle large OEL display"><b>VFD</b><span data-pvfd="menu-oel-display">ON</span></button>
              </div>
              <div class="pvfd-menu-row" data-pvfd-menu-action="type"><b>TYPE</b><span data-pvfd="menu-type">DOT</span></div>
            </div>
          </div>
        </div>

        <div class="pvfd-flank">
          <div class="pvfd-pill" data-pvfd="demo" title="Toggle showroom auto-cycle">DEMO</div>
          <div class="pvfd-pill" data-pvfd="menu" title="Open Pioneer menu">MENU</div>
          <div class="pvfd-pill" data-pvfd="tint" title="Cycle LCD color (cyan / amber / violet)">TINT</div>
        </div>

        <div class="pvfd-knob-wrap">
          <div class="pvfd-nav" title="Outer ring scrolls to scrub. Center = play/pause. Arrows = save/queue/prev/next">
            <div class="pvfd-nav-glow"></div>
            <div class="pvfd-nav-outer" data-pvfd="navring"></div>
            <div class="pvfd-nav-led-ring"></div>
            <div class="pvfd-nav-inner-ring"></div>
            <div class="pvfd-nav-button" data-pvfd="navcenter"></div>
            <div class="pvfd-nav-arrow up"    data-pvfd="navup"    title="Save/like">&#9650;</div>
            <div class="pvfd-nav-arrow down"  data-pvfd="navdn"    title="Add to queue">&#9660;</div>
            <div class="pvfd-nav-arrow left"  data-pvfd="navleft"  title="Previous">&#9664;</div>
            <div class="pvfd-nav-arrow right" data-pvfd="navright" title="Next">&#9654;</div>
          </div>
        </div>
      </div>

      <div class="pvfd-transport">
        <div class="pvfd-tab-side" data-pvfd="queue" title="Queue">QUE<div class="pvfd-led-strip"></div></div>
        <div class="pvfd-preset-row">
          <div class="pvfd-tab-preset" data-pvfd="shuffle" title="Shuffle">&#8646;<div class="pvfd-led-strip"></div></div>
          <div class="pvfd-tab-preset" data-pvfd="prev"    title="Previous">&#9198;<div class="pvfd-led-strip"></div></div>
          <div class="pvfd-tab-preset" data-pvfd="play"    title="Play / pause">&#9654;<div class="pvfd-led-strip"></div></div>
          <div class="pvfd-tab-preset" data-pvfd="next"    title="Next">&#9197;<div class="pvfd-led-strip"></div></div>
          <div class="pvfd-tab-preset" data-pvfd="repeat"  title="Repeat">&#8635;<div class="pvfd-led-strip"></div></div>
          <div class="pvfd-tab-preset" data-pvfd="love"    title="Save to liked">&#9829;<div class="pvfd-led-strip"></div></div>
        </div>
        <div class="pvfd-tab-side" data-pvfd="devices" title="Devices">DEV<div class="pvfd-led-strip"></div></div>
      </div>
    `;
    return root;
  }

  function ensureOelVideoMarkup() {
    if (!chassis) return;
    const lcd = chassis.querySelector(".pvfd-lcd");
    if (!lcd) return;

    let domChanged = false;
    let probe = lcd.querySelector("[data-pvfd='lcd-video-probe']");
    if (!probe) {
      probe = document.createElement("div");
      probe.className = "pvfd-lcd-video-probe";
      probe.setAttribute("data-pvfd", "lcd-video-probe");
      probe.setAttribute("aria-hidden", "true");
      lcd.insertBefore(probe, lcd.firstChild || null);
      domChanged = true;
    }

    let video = lcd.querySelector("[data-pvfd='lcd-video']");
    if (!video) {
      video = document.createElement("video");
      video.className = "pvfd-lcd-video";
      video.setAttribute("data-pvfd", "lcd-video");
      video.setAttribute("aria-hidden", "true");
      lcd.insertBefore(video, probe.nextSibling);
      domChanged = true;
    }

    prepareOelVideoElement(video);

    let tintWash = lcd.querySelector("[data-pvfd='oel-tint-wash']");
    if (!tintWash) {
      tintWash = document.createElement("div");
      tintWash.className = "pvfd-oel-tint-wash";
      tintWash.setAttribute("data-pvfd", "oel-tint-wash");
      tintWash.setAttribute("aria-hidden", "true");
      lcd.insertBefore(tintWash, video.nextSibling);
      domChanged = true;
    }

    if (!lcd.hasAttribute("data-pvfd-video-state")) {
      lcd.setAttribute("data-pvfd-video-state", "fallback");
      domChanged = true;
    }

    if (domChanged) pvfdDom = null;
    syncOelColorModeAttributes();
  }

  function isRacingClip(clip) {
    return !!clip && clip.id === RACING_CLIP_ID;
  }

  function racingColorModeLabel() {
    return racingColorEnabled ? "COLOR" : "TINT";
  }

  function syncOelColorModeAttributes() {
    if (!chassis) return;
    const dom = getPvfdDom();
    const activeClip = getActiveOelClip();
    const activeClipId = activeClip && activeClip.id ? activeClip.id : "";
    const racingColorActive = isRacingClip(activeClip) && racingColorEnabled;
    const colorMode = racingColorActive ? "color" : "tint";

    setAttrIfChanged(chassis, "data-pvfd-racing-color", racingColorEnabled ? "on" : "off");
    setAttrIfChanged(chassis, "data-pvfd-active-oel-clip", activeClipId || "none");

    if (dom.lcd) {
      setAttrIfChanged(dom.lcd, "data-pvfd-oel-clip", activeClipId || "none");
      setAttrIfChanged(dom.lcd, "data-pvfd-oel-color", colorMode);
      setAttrIfChanged(dom.lcd, "data-pvfd-racing-color", racingColorActive ? "on" : "off");
      dom.lcd.title = isRacingClip(activeClip)
        ? `Racing color mode: ${racingColorModeLabel()} (click OEL to toggle)`
        : "Pioneer OEL display";
    }

    if (dom.lcdVideo && dom.lcdVideo.dataset) {
      dom.lcdVideo.dataset.pvfdClipId = activeClipId || "none";
      dom.lcdVideo.dataset.pvfdColorMode = colorMode;
      dom.lcdVideo.dataset.pvfdRacingColor = racingColorActive ? "on" : "off";
    }
  }

  function ensureLogoSpectrumMarkup() {
    if (!chassis) return;

    const strip = chassis.querySelector(".pvfd-logo-strip");
    if (!strip) return;

    logoStrip = strip;

    let glowCanvas = strip.querySelector("canvas.pvfd-logo-glow-canvas");

    if (!glowCanvas) {
      glowCanvas = document.createElement("canvas");
      glowCanvas.className = "pvfd-logo-glow-canvas";
      glowCanvas.width = LOGO_GLOW_W;
      glowCanvas.height = LOGO_GLOW_H;
      glowCanvas.setAttribute("aria-hidden", "true");
      strip.insertBefore(glowCanvas, strip.firstChild || null);
    }

    const glowCtx = glowCanvas.getContext("2d", { alpha: true });
    if (glowCtx) glowCtx.imageSmoothingEnabled = false;

    logoGlowCanvasCache.canvas = glowCanvas;
    logoGlowCanvasCache.ctx = glowCtx;

    const ensureSide = (selector, cacheKey) => {
      const side = strip.querySelector(selector);

      if (!side) {
        logoMeterCache[cacheKey] = null;
        return;
      }

      let meterCanvas = side.querySelector("canvas.pvfd-logo-meter-canvas");

      if (!meterCanvas || side.children.length !== 1 || side.firstElementChild !== meterCanvas) {
        side.textContent = "";

        meterCanvas = document.createElement("canvas");
        meterCanvas.className = "pvfd-logo-meter-canvas";
        meterCanvas.width = LOGO_METER_W;
        meterCanvas.height = LOGO_METER_H;
        meterCanvas.setAttribute("aria-hidden", "true");

        side.appendChild(meterCanvas);
      }

      const ctx2d = meterCanvas.getContext("2d", { alpha: true });
      if (ctx2d) ctx2d.imageSmoothingEnabled = false;

      side.setAttribute("data-pvfd-meter", "canvas");
      side.setAttribute("data-pvfd-vbar-count", String(LOGO_METER_BAND_COUNT));

      logoMeterCache[cacheKey] = {
        side,
        canvas: meterCanvas,
        ctx: ctx2d
      };
    };

    ensureSide(".pvfd-logo-spectrum-left", "left");
    ensureSide(".pvfd-logo-spectrum-right", "right");

    logoRenderState.dirty = true;
    renderLogoVisuals(performance.now(), true);
  }

  function injectChassis() {
    const bar = findPlayerBar();
    if (!bar) return false;

    preparePlayerBar(bar);

    if (bar.querySelector(".pvfd-chassis")) {
      chassis = bar.querySelector(".pvfd-chassis");
      hideNativePlayerChildren(bar);
      ensureLogoSpectrumMarkup();
      ensureOelVideoMarkup();
      canvas = chassis.querySelector(".pvfd-lcd-canvas");
      logoStrip = chassis.querySelector(".pvfd-logo-strip");
      if (canvas) ctx = canvas.getContext("2d");
      if (ctx) ctx.imageSmoothingEnabled = false;
      sizeCanvas();
      // belt-and-braces re-measure on next rAF in case the bar wasn't
      // laid out yet on first attach. Without this, canvasCssW could stay 0 and
      // the loop's safe-bail path would fire every frame until a window resize.
      if (!canvasCssW || !canvasCssH) scheduleSizeCanvas();
      syncOelVideoPlayback(true);
      return true;
    }

    hideNativePlayerChildren(bar);
    chassis = buildChassis();
    bar.appendChild(chassis);
    hideNativePlayerChildren(bar);
    ensureLogoSpectrumMarkup();
    ensureOelVideoMarkup();

    canvas = chassis.querySelector(".pvfd-lcd-canvas");
    logoStrip = chassis.querySelector(".pvfd-logo-strip");
    if (canvas) {
      ctx = canvas.getContext("2d");
      if (ctx) ctx.imageSmoothingEnabled = false;
      sizeCanvas();
      if (!canvasCssW || !canvasCssH) scheduleSizeCanvas();
      window.addEventListener("resize", scheduleSizeCanvas, { passive: true });
    }
    wireControls();
    syncOelVideoPlayback(true);
    return true;
  }

  let canvasResizeRaf = 0;
  let canvasCssW = 0, canvasCssH = 0;
  function scheduleSizeCanvas() {
    if (canvasResizeRaf) return;
    canvasResizeRaf = requestAnimationFrame(() => {
      canvasResizeRaf = 0;
      sizeCanvas();
    });
  }

  function sizeCanvas() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvasCssW = rect.width;
    canvasCssH = rect.height;
    const perf = activePerformanceConfig();
    const dpr = Math.max(1, Math.min(perf.maxDpr || 2, window.devicePixelRatio || 1));
    const pixelW = Math.max(1, Math.floor(rect.width * dpr));
    const pixelH = Math.max(1, Math.floor(rect.height * dpr));
    const dprKey = String(dpr);
    if (canvas.width === pixelW && canvas.height === pixelH && canvas.dataset.pvfdDpr === dprKey) return;
    canvas.width = pixelW;
    canvas.height = pixelH;
    canvas.dataset.pvfdDpr = dprKey;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function bind(el, fn) { if (el) el.addEventListener("click", fn); }
  function safe(fn) { try { fn(); } catch (e) { console.warn("[PVFD]", e); } }
  function safeReturn(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }
  function refreshPvfdPerfEnabled() {
    pvfdPerfEnabled = safeReturn(() => window.localStorage.getItem(PVFD_PROF_STORAGE_KEY) === "1", false);
    return pvfdPerfEnabled;
  }
  function pvfdPerfStart() {
    return pvfdPerfEnabled ? performance.now() : -1;
  }
  function pvfdPerfEnd(name, startedAt) {
    if (startedAt < 0 || !pvfdPerfEnabled) return;
    const duration = performance.now() - startedAt;
    const entry = pvfdPerfStats[name] || (pvfdPerfStats[name] = {
      count: 0,
      totalMs: 0,
      maxMs: 0,
    });
    entry.count += 1;
    entry.totalMs += duration;
    if (duration > entry.maxMs) entry.maxMs = duration;
  }
  function pvfdPerfDump() {
    refreshPvfdPerfEnabled();
    const rows = Object.keys(pvfdPerfStats)
      .sort()
      .map((name) => {
        const entry = pvfdPerfStats[name];
        const avgMs = entry.count ? entry.totalMs / entry.count : 0;
        return {
          name,
          count: entry.count,
          totalMs: Number(entry.totalMs.toFixed(3)),
          avgMs: Number(avgMs.toFixed(3)),
          maxMs: Number(entry.maxMs.toFixed(3)),
        };
      });
    if (console.table) console.table(rows);
    else console.log("[PVFD] perf", rows);
    return rows;
  }
  function pvfdPerfReset() {
    for (const key of Object.keys(pvfdPerfStats)) delete pvfdPerfStats[key];
    refreshPvfdPerfEnabled();
    return true;
  }
  window.pvfdPerfDump = pvfdPerfDump;
  window.pvfdPerfReset = pvfdPerfReset;
  function invokePlayerAction(fn, refreshDelay = 140) {
    safe(fn);
    schedulePlayerStateRefresh(refreshDelay);
  }
  function getCosmosAsync() {
    return window.Spicetify && Spicetify.CosmosAsync && typeof Spicetify.CosmosAsync.get === "function"
      ? Spicetify.CosmosAsync
      : null;
  }
  function applyRouteStateToDom() {
    const route = pvfdRouteState.route || "other";
    const churn = performance.now() < pvfdRouteState.churnUntil ? "1" : "0";
    const roots = [document.documentElement, document.body, chassis].filter(Boolean);
    for (const root of roots) {
      if (root.dataset) {
        root.dataset.pvfdRoute = route;
        root.dataset.pvfdRouteChurn = churn;
      } else {
        root.setAttribute("data-pvfd-route", route);
        root.setAttribute("data-pvfd-route-churn", churn);
      }
    }
  }

  function beginRouteChurn(ms = ROUTE_CHURN_SUPPRESS_MS) {
    const until = performance.now() + ms;
    if (until > pvfdRouteState.churnUntil) pvfdRouteState.churnUntil = until;
    applyRouteStateToDom();
  }

  function isRouteChurnActive(ts = performance.now()) {
    if (ts < pvfdRouteState.churnUntil) return true;
    if (pvfdRouteState.churnUntil !== 0) {
      pvfdRouteState.churnUntil = 0;
      applyRouteStateToDom();
    }
    return false;
  }

    function detectPvfdRoute() {
    const mainView = document.querySelector(".Root__main-view");
    const entityHeader = mainView && mainView.querySelector(".main-entityHeader-container");

    let spotifyPath = "";
    try {
      const hist = window.Spicetify && Spicetify.Platform && Spicetify.Platform.History;
      const loc = hist && hist.location;
      spotifyPath = String((loc && (loc.pathname || loc.href)) || "").toLowerCase();
    } catch {
      spotifyPath = "";
    }

    const fallbackPath = String(window.location && window.location.pathname || "").toLowerCase();
    const path = spotifyPath || fallbackPath;

    const allRouteHints = mainView
      ? Array.from(mainView.querySelectorAll("[data-test-uri], [data-uri], a[href]"))
          .map((el) => (
            el.getAttribute("data-test-uri") ||
            el.getAttribute("data-uri") ||
            el.getAttribute("href") ||
            ""
          ))
          .join(" ")
          .toLowerCase()
      : "";

    const headerText = entityHeader
      ? String(entityHeader.innerText || entityHeader.textContent || "").trim().toLowerCase()
      : "";

    const hasArtist =
      path.includes("/artist") ||
      allRouteHints.includes("spotify:artist:") ||
      !!(mainView && mainView.querySelector('section[data-test-uri^="spotify:artist:"]'));

    const hasAlbum =
      path.includes("/album") ||
      allRouteHints.includes("spotify:album:") ||
      /^\s*album\b/.test(headerText);

    const hasPlaylist =
      path.includes("/playlist") ||
      allRouteHints.includes("spotify:playlist:") ||
      /^\s*playlist\b/.test(headerText);

    if (hasArtist) return "artist";
    if (hasAlbum) return "album";
    if (hasPlaylist) return "playlist";

    if (path === "/" || path === "/home" || (mainView && mainView.querySelector("[data-testid='home-page']"))) return "home";
    if (path.includes("/search")) return "search";
    if (path.includes("/collection")) return "library";
    if (path.includes("/queue")) return "queue";
    if (path.includes("/lyrics")) return "lyrics";

    /*
      Only call it fullscreen when there is no entity header.
      Album/playlist/artist pages can keep fullscreen-ish or now-playing nodes mounted.
    */
    if (
      !entityHeader &&
      (
        document.fullscreenElement ||
        document.querySelector("[data-testid*='fullscreen' i], [class*='fullscreenView' i]")
      )
    ) {
      return "fullscreen";
    }

    return "other";
  }

  function updateRouteState(force = false, ts = performance.now()) {
    const perfAt = pvfdPerfStart();
    if (!force && ts - pvfdRouteState.at < ROUTE_STATE_SAMPLE_MS && !isRouteChurnActive(ts)) {
      pvfdPerfEnd("routeStateUpdate", perfAt);
      return pvfdRouteState.route;
    }
    const nextRoute = detectPvfdRoute();
    pvfdRouteState.at = ts;
    if (pvfdRouteState.route !== nextRoute) pvfdRouteState.route = nextRoute;
    applyRouteStateToDom();
    pvfdPerfEnd("routeStateUpdate", perfAt);
    return pvfdRouteState.route;
  }

  function readFontPresetIdx() {
    const saved = safeReturn(() => window.localStorage.getItem(FONT_STORAGE_KEY), "");
    const idx = FONT_PRESETS.findIndex(p => p.label === saved);
    return idx >= 0 ? idx : Math.max(0, FONT_PRESETS.findIndex(p => p.label === DEFAULT_FONT_PRESET));
  }

  function readTintIdx() {
    const saved = String(safeReturn(() => window.localStorage.getItem(TINT_STORAGE_KEY), "") || "").toUpperCase();
    const idx = TINT_LABELS.findIndex(label => label === saved);
    if (idx >= 0) return idx;
    const numericIdx = Number(saved);
    return Number.isInteger(numericIdx) && numericIdx >= 0 && numericIdx < TINT_LABELS.length ? numericIdx : 0;
  }

  function readDimEnabled() {
    const saved = String(safeReturn(() => window.localStorage.getItem(DIM_STORAGE_KEY), "") || "").toUpperCase();
    return saved === "ON" || saved === "TRUE" || saved === "1" || saved === "DIM";
  }

  function clipStorageId(clip, idx = 0) {
    return String((clip && (clip.id || clip.assetName || clip.source || clip.name)) || idx);
  }

  function getClipByStorageId(key) {
    if (!key) return null;
    const idx = OEL_WEBM_CLIPS.findIndex((clip, clipIndex) => clipStorageId(clip, clipIndex) === key);
    return idx >= 0 ? OEL_WEBM_CLIPS[idx] : null;
  }

  function clipWebmAssetName(clip) {
    return clip && clip.assetName ? clip.assetName : "";
  }

  function extractUrlFromCssValue(value) {
    const match = String(value || "").match(/^url\(["']?(.*?)["']?\)$/);
    return match ? match[1] : "";
  }

  function prepareOelVideoElement(video) {
    if (!video || video.dataset.pvfdInit === "1") return;
    video.dataset.pvfdInit = "1";
    console.log("[PVFD] OEL WebM proof: video element inserted into OEL frame");
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.controls = false;
    video.playsInline = true;
    video.preload = "auto";
    video.tabIndex = -1;
    video.removeAttribute("controls");
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    video.addEventListener("loadedmetadata", () => {
      const clipKey = video.dataset.pvfdClipKey || "unknown";
      console.log(`[PVFD] OEL WebM proof: loadedmetadata clip=${clipKey}`);
    });

    video.addEventListener("canplay", () => {
      const clipKey = video.dataset.pvfdClipKey || "unknown";
      console.log(`[PVFD] OEL WebM proof: canplay clip=${clipKey}`);
    });

    video.addEventListener("playing", () => {
      const clipKey = video.dataset.pvfdClipKey || "";
      console.log(`[PVFD] OEL WebM proof: playing clip=${clipKey}`);
      oelVideoActiveClipKey = clipKey;
      const dom = getPvfdDom();
      setAttrIfChanged(dom.lcd, "data-pvfd-video-state", "active");
      lastCanvasFrameKey = "";
    });

    video.addEventListener("error", () => {
      const clipKey = video.dataset.pvfdClipKey || "unknown";
      const errorCode = video.error && typeof video.error.code === "number" ? video.error.code : "unknown";
      const errorMessage = video.error && video.error.message ? video.error.message : "unavailable";
      console.warn(`[PVFD] OEL WebM proof: video error clip=${clipKey} code=${errorCode} message=${errorMessage}`);
      pauseOelVideoPlayback(oelDisplayEnabled ? "error" : "off", true);
    });
  }

  function setOelVideoState(state, clipKey = "") {
    const dom = getPvfdDom();
    setAttrIfChanged(dom.lcd, "data-pvfd-video-state", state);
    if (dom.lcdVideo) {
      if (clipKey) dom.lcdVideo.dataset.pvfdClipKey = clipKey;
      else delete dom.lcdVideo.dataset.pvfdClipKey;
    }
    if (state !== "active") oelVideoActiveClipKey = "";
    syncOelColorModeAttributes();
    applyLcdFilter();
  }

  function pauseOelVideoPlayback(state = "fallback", clearSrc = false) {
    const dom = getPvfdDom();
    const video = dom.lcdVideo;
    if (!video) {
      setOelVideoState(state);
      return;
    }

    safe(() => video.pause());
    delete video.dataset.pvfdPlayPending;
    if (clearSrc && video.getAttribute("src")) {
      video.removeAttribute("src");
      safe(() => video.load());
    }
    setOelVideoState(state);
  }

  function resolveOelWebmSourceMap() {
    if (!oelWebmSourceMap) {
      const injectedMap = OEL_WEBM_SOURCE_MAP;
      if (
        injectedMap &&
        injectedMap !== OEL_WEBM_SOURCE_MAP_PLACEHOLDER &&
        typeof injectedMap === "object" &&
        !Array.isArray(injectedMap)
      ) {
        oelWebmSourceMap = injectedMap;
        console.log(`[PVFD] OEL WebM registry ready: clips=${Object.keys(injectedMap).length}`);
      }
    }
    return oelWebmSourceMap;
  }

  async function logOelWebmSourceCheck(clip, url) {
    if (!url || url === oelWebmLastCheckedUrl) return;
    oelWebmLastCheckedUrl = url;
    const clipKey = clipStorageId(clip);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || blob.type || "unknown";
      console.log(`[PVFD] OEL WebM proof: fetch check clip=${clipKey} status=${response.status} content-type=${contentType} blob-size=${blob.size}`);
    } catch (err) {
      const detail = err && err.message ? err.message : err;
      console.warn(`[PVFD] OEL WebM proof: fetch check failed clip=${clipKey}`, detail);
    }
  }

  function requestOelVideoPlay(video) {
    if (!video || video.dataset.pvfdPlayPending === "1") return;
    video.dataset.pvfdPlayPending = "1";
    let playResult = null;
    try {
      playResult = video.play();
    } catch (err) {
      delete video.dataset.pvfdPlayPending;
      console.warn("[PVFD] OEL WebM proof: play() rejected", err);
      pauseOelVideoPlayback("error");
      return;
    }
    if (!playResult || typeof playResult.then !== "function") {
      delete video.dataset.pvfdPlayPending;
      console.log("[PVFD] OEL WebM proof: play() resolved");
      return;
    }
    playResult.then(() => {
      delete video.dataset.pvfdPlayPending;
      console.log("[PVFD] OEL WebM proof: play() resolved");
    }).catch((err) => {
      delete video.dataset.pvfdPlayPending;
      console.warn("[PVFD] OEL WebM proof: play() rejected", err);
      pauseOelVideoPlayback("error");
    });
  }

  function resolveClipWebmUrl(clip) {
    const assetName = clipWebmAssetName(clip);
    if (!assetName) return "";
    if (clip.webmUrl) return clip.webmUrl;
    const sourceMap = resolveOelWebmSourceMap();
    if (!sourceMap) return "";

    const url = String(sourceMap[assetName] || "");
    if (!url) return "";

    const sourceType = url.startsWith("data:video/webm;base64,")
      ? "data"
      : (url.startsWith("blob:") ? "blob" : "other");
    console.log(`[PVFD] OEL WebM proof: clip=${clip.id} source-type=${sourceType} length=${url.length}`);
    clip.webmUrl = url;
    return url;
  }

  function markClipWebmFailed(clip, err) {
    if (!clip) return;
    clip.webmFailed = true;
    const detail = err && err.message ? err.message : err;
    console.warn("[PVFD] OEL WebM failed; clip disabled:", clip.name, detail || "unknown error");
    pauseOelVideoPlayback(oelDisplayEnabled ? "error" : "off");
  }

  function isPvfdPlaylistScrollStressActive(now = performance.now()) {
    return now < pvfdPlaylistScrollStressUntil;
  }



  function installPvfdPlaylistScrollStressDetector() {
    if (pvfdPlaylistScrollStressInstalled) return;

    pvfdPlaylistScrollStressInstalled = true;

    document.addEventListener(
      "scroll",
      (event) => {
        const target = event.target;

        if (
          target &&
          target.nodeType === 1 &&
          (
            target.matches?.(".main-view-container__scroll-node, [data-overlayscrollbars-viewport]") ||
            target.closest?.(".main-view-container__scroll-node, [data-overlayscrollbars-viewport]")
          )
        ) {
          pvfdPlaylistScrollStressUntil = performance.now() + 240;
        }
      },
      true
    );
  }

  function syncOelVideoPlayback(force = false) {
    const perfAt = pvfdPerfStart();
    if (!chassis) {
      pvfdPerfEnd("webmOelSync", perfAt);
      return false;
    }
    ensureOelVideoMarkup();
    logOelCanvasRendererDisabled();

    const dom = getPvfdDom();
    const video = dom.lcdVideo;
    if (!dom.lcd || !video) {
      pvfdPerfEnd("webmOelSync", perfAt);
      return false;
    }

    if (!oelDisplayEnabled) {
      pauseOelVideoPlayback("off");
      pvfdPerfEnd("webmOelSync", perfAt);
      return false;
    }

    if (!force && dom.lcd.getAttribute("data-pvfd-video-state") === "error") {
      pvfdPerfEnd("webmOelSync", perfAt);
      return false;
    }

    const activeClip = getActiveOelClip();
    if (!activeClip) {
      pauseOelVideoPlayback("error");
      pvfdPerfEnd("webmOelSync", perfAt);
      return false;
    }

    syncOelColorModeAttributes();

    const clipKey = clipStorageId(activeClip, clipIdx);
    const webmUrl = resolveClipWebmUrl(activeClip);

    if (!webmUrl) {
      console.warn(`[PVFD] OEL WebM proof: ${activeClip.assetName} URL unavailable`);
      pauseOelVideoPlayback("error");
      pvfdPerfEnd("webmOelSync", perfAt);
      return false;
    }

    if (force || video.dataset.pvfdClipKey !== clipKey || video.getAttribute("src") !== webmUrl) {
      oelVideoActiveClipKey = "";
      setOelVideoState("loading", clipKey);
      safe(() => video.pause());
      delete video.dataset.pvfdPlayPending;
      video.dataset.pvfdClipKey = clipKey;
      video.dataset.pvfdClipLabel = activeClip.label;
      video.src = webmUrl;
      const assignedSrcType = video.src.startsWith("data:video/webm;base64,")
        ? "data"
        : (video.src.startsWith("blob:") ? "blob" : "other");
      console.log(`[PVFD] OEL WebM proof: assigned clip=${clipKey} src-type=${assignedSrcType} length=${video.src.length}`);
      logOelWebmSourceCheck(activeClip, video.src);
      safe(() => { video.currentTime = 0; });
      safe(() => video.load());
      video.addEventListener("canplay", () => {
        requestOelVideoPlay(video);
      }, { once: true });
      pvfdPerfEnd("webmOelSync", perfAt);
      return false;
    }

    if (oelVideoActiveClipKey === clipKey && !video.paused && !video.ended) {
      pvfdPerfEnd("webmOelSync", perfAt);
      return true;
    }

    if (video.readyState >= 3 && video.paused) {
      requestOelVideoPlay(video);
    }

    const active = oelVideoActiveClipKey === clipKey && !video.paused && !video.ended;
    pvfdPerfEnd("webmOelSync", perfAt);
    return active;
  }

  function readClipIdx() {
    const saved = String(safeReturn(() => window.localStorage.getItem(CLIP_STORAGE_KEY), "") || "");
    const clips = OEL_WEBM_CLIPS;
    if (!clips.length) return 0;
    if (!saved) return 0;
    const savedUpper = saved.toUpperCase();
    const exactIdx = clips.findIndex((clip, idx) => clipStorageId(clip, idx) === saved);
    if (exactIdx >= 0) return exactIdx;
    const nameIdx = clips.findIndex(clip => String(clip && clip.name || "").toUpperCase() === savedUpper);
    if (nameIdx >= 0) return nameIdx;
    const numericIdx = Number(saved);
    return Number.isInteger(numericIdx) && numericIdx >= 0 && numericIdx < clips.length ? numericIdx : 0;
  }

  function readPerformanceModeIdx() {
    const saved = safeReturn(() => window.localStorage.getItem(PERF_STORAGE_KEY), "");
    const idx = PERFORMANCE_MODES.findIndex(p => p.label === saved);
    return idx >= 0 ? idx : 0;
  }

  function readLogoGlowEnabled() {
    // PULSE should always boot idle so Chromium/system-audio capture never
    // re-engages itself on startup.
    return false;
  }

  function getActiveOelClip() {
    if (!OEL_WEBM_CLIPS.length) return null;
    return OEL_WEBM_CLIPS[clipIdx] || OEL_WEBM_CLIPS[0];
  }

  function readOelDisplayEnabled() {
    const saved = safeReturn(() => window.localStorage.getItem(OEL_DISPLAY_STORAGE_KEY), null);
    // Default ON when nothing has been saved yet.
    return saved !== "OFF";
  }

  function readRacingColorEnabled() {
    const saved = safeReturn(() => {
      return window.localStorage.getItem(RACING_COLOR_STORAGE_KEY) ||
        window.localStorage.getItem(LEGACY_RACING_COLOR_STORAGE_KEY);
    }, null);
    const value = String(saved || "").toUpperCase();
    return value === "COLOR" || value === "ON" || value === "TRUE" || value === "1";
  }

  function activePerformanceConfig() {
    return PERFORMANCE_MODES[performanceModeIdx] || PERFORMANCE_MODES[0];
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function validTempo(value) {
    const tempo = Number(value);
    return Number.isFinite(tempo) && tempo >= 45 && tempo <= 210 ? tempo : 0;
  }

  function readTempoFromObject(obj) {
    if (!obj || typeof obj !== "object") return 0;
    return validTempo(obj.tempo)
      || validTempo(obj.bpm)
      || validTempo(obj.audio_features && obj.audio_features.tempo)
      || validTempo(obj.audioFeatures && obj.audioFeatures.tempo)
      || validTempo(obj.metadata && obj.metadata.tempo)
      || validTempo(obj.metadata && obj.metadata.bpm)
      || validTempo(obj.metadata && obj.metadata.audio_features && obj.metadata.audio_features.tempo)
      || validTempo(obj.metadata && obj.metadata.audioFeatures && obj.metadata.audioFeatures.tempo);
  }

  function bindNowPlayingShortcut(el) {
    if (!el) return;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.addEventListener("click", () => {
      openPlaybackSource();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      openPlaybackSource();
    });
  }

  function activeClipName(maxLen = 12) {
    const activeClip = getActiveOelClip();
    const label = String(activeClip && (activeClip.label || activeClip.name) || "WEBM");
    return label.slice(0, maxLen).toUpperCase();
  }

  function logOelCanvasRendererDisabled() {
    if (oelCanvasRendererDisabledLogged) return;
    oelCanvasRendererDisabledLogged = true;
    console.log("[PVFD] hard-disabled old LKD canvas renderer");
  }

  function clickFirst(selectors) {
    for (const selector of selectors) {
      const el = safeReturn(() => document.querySelector(selector), null);
      if (el && typeof el.click === "function") {
        el.click();
        return true;
      }
    }
    return false;
  }

  function clickFirstOutsideChassis(selectors) {
    for (const selector of selectors) {
      const els = safeReturn(() => Array.from(document.querySelectorAll(selector)), []);
      const el = els.find((candidate) => !candidate.closest || !candidate.closest(".pvfd-chassis"));
      if (el && typeof el.click === "function") {
        el.click();
        return true;
      }
    }
    return false;
  }

  function pushSpotifyPath(path) {
    const history = Spicetify.Platform && Spicetify.Platform.History;
    if (history && typeof history.push === "function") {
      history.push(path);
      return true;
    }
    const app = Spicetify.Platform && Spicetify.Platform.Application;
    if (app && typeof app.navigate === "function") {
      app.navigate(path);
      return true;
    }
    return false;
  }

  function routeFromSpotifyUri(uri) {
    const parts = String(uri || "").split(":");
    if (parts[0] !== "spotify" || !parts[1] || !parts[2]) return "";
    if (!/^(album|artist|playlist|show|episode|track)$/.test(parts[1])) return "";
    return `/${parts[1]}/${parts[2]}`;
  }

  function openPlaybackSource() {
    const item = safeReturn(() => Spicetify.Player.data && Spicetify.Player.data.item, null);
    const route = item && routeFromSpotifyUri(item.uri || item.link);
    if (route && safeReturn(() => pushSpotifyPath(route), false)) return true;
    return clickFirst([
      "[data-testid='now-playing-widget']",
      "[class*='nowPlayingWidget']",
      "[aria-label*='Now playing' i]"
    ]);
  }

  function openLibrarySource() {
    return safeReturn(() => pushSpotifyPath("/collection/playlists"), false) || clickFirst([
      "a[href='/collection']",
      "a[href='/collection/playlists']",
      "[aria-label='Your Library']",
      "[aria-label*='Your Library' i]"
    ]);
  }

  function openSearchSource() {
    return safeReturn(() => pushSpotifyPath("/search"), false) || clickFirst([
      "a[href='/search']",
      "[aria-label='Search']",
      "[aria-label*='Search' i]"
    ]);
  }

  function openHomeSource() {
    return safeReturn(() => pushSpotifyPath("/"), false) || clickFirst([
      "a[href='/']",
      "a[href='/home']",
      "[aria-label='Home']",
      "[aria-label*='Home' i]"
    ]);
  }

  function openQueueSource() {
    return safeReturn(() => pushSpotifyPath("/queue"), false) || clickFirst([
      "[data-testid='control-button-queue']",
      "button[aria-label*='Queue' i]"
    ]);
  }

  function openDevicePicker() {
    return clickFirst([
      "button[data-testid='control-button-connect-picker']",
      "[data-testid='control-button-connect-picker']",
      "button[aria-label*='Connect to a device' i]",
      "button[aria-label*='Devices Available' i]",
      "button[aria-label*='device' i]",
      "[role='button'][aria-label*='device' i]",
      "[role='button'][aria-label*='connect' i]"
    ]);
  }

  function openLyrics() {
    const opened = clickFirstOutsideChassis([
      "button[data-testid='lyrics-button']",
      "button[data-testid='control-button-lyrics']",
      "[data-testid='lyrics-button']",
      "[data-testid='control-button-lyrics']",
      "button[aria-label*='Lyrics' i]",
      "[role='button'][aria-label*='Lyrics' i]",
      "[data-testid*='lyrics' i]"
    ]);
    const lyrics = chassis && chassis.querySelector("[data-pvfd='lyrics']");
    if (lyrics) {
      lyrics.classList.add("active");
      lyrics.title = opened ? "Open lyrics" : "Lyrics unavailable";
      setTimeout(() => lyrics.classList.remove("active"), 850);
    }
    if (!opened) console.warn("[PVFD] lyrics control unavailable");
    return opened;
  }

  function cycleSource() {
    sourceIdx = (sourceIdx + 1) % SOURCE_TARGETS.length;
    const source = SOURCE_TARGETS[sourceIdx];
    const opened =
      source.kind === "playback" ? openPlaybackSource() :
      source.kind === "library" ? openLibrarySource() :
      source.kind === "search" ? openSearchSource() :
      source.kind === "home" ? openHomeSource() :
      source.kind === "queue" ? openQueueSource() :
      false;
    sourceFlashUntil = performance.now() + 1600;
    markStaticReadoutsDirty();
    window.setTimeout(markStaticReadoutsDirty, 1650);
    const srcBtn = chassis && chassis.querySelector("[data-pvfd='scan']");
    if (srcBtn) {
      srcBtn.classList.add("active");
      srcBtn.title = `Source: ${source.title}`;
      setTimeout(() => srcBtn.classList.remove("active"), 900);
    }
    if (!opened) console.warn("[PVFD] source navigation unavailable:", source.title);
    updateMenuPanel();
  }

  function setMenuOpen(next) {
    menuOpen = !!next;
    if (!chassis) return;
    chassis.classList.toggle("pvfd-menu-open", menuOpen);
    const panel = chassis.querySelector("[data-pvfd='menu-panel']");
    if (panel) panel.setAttribute("aria-hidden", menuOpen ? "false" : "true");
    const menuBtn = chassis.querySelector("[data-pvfd='menu']");
    if (menuBtn) menuBtn.classList.toggle("active", menuOpen);
    updateMenuPanel();
  }

  let pvfdDom = null;
  const playerStateCache = { at: -Infinity, playing: false, shuffle: false, repeat: "OFF" };
  const playerTimingCache = { at: -Infinity, progressMs: 0, durationMs: 0, playing: false };
  const volumeStateCache = { at: -Infinity, value: 0.5 };
  let browseFontPresetKey = "";
  let staticReadoutsDirty = true;
  let knobLedDirty = true;

  function getPvfdDom() {
    if (!chassis) return {};
    if (pvfdDom && pvfdDom.chassis === chassis) return pvfdDom;
    pvfdDom = {
      chassis,
      menuPanel: chassis.querySelector("[data-pvfd='menu-panel']"),
      menuMain: chassis.querySelector("[data-pvfd='menu-main']"),
      menu: {
        src: chassis.querySelector("[data-pvfd='menu-src']"),
        oel: chassis.querySelector("[data-pvfd='menu-oel']"),
        demo: chassis.querySelector("[data-pvfd='menu-demo']"),
        tint: chassis.querySelector("[data-pvfd='menu-tint']"),
        type: chassis.querySelector("[data-pvfd='menu-type']"),
        perf: chassis.querySelector("[data-pvfd='menu-perf']"),
        logoGlow: chassis.querySelector("[data-pvfd='menu-logo-glow']"),
        oelDisplay: chassis.querySelector("[data-pvfd='menu-oel-display']"),
        racingColor: chassis.querySelector("[data-pvfd='menu-racing-color']"),
      },
      buttons: {
        play: chassis.querySelector("[data-pvfd='play']"),
        shuffle: chassis.querySelector("[data-pvfd='shuffle']"),
        repeat: chassis.querySelector("[data-pvfd='repeat']"),
        demo: chassis.querySelector("[data-pvfd='demo']"),
        menu: chassis.querySelector("[data-pvfd='menu']"),
      },
      side: {
        vol: chassis.querySelector("[data-pvfd='side-vol']"),
        mode: chassis.querySelector("[data-pvfd='side-mode']"),
        tint: chassis.querySelector("[data-pvfd='side-tint']"),
        dim: chassis.querySelector("[data-pvfd='side-dim']"),
        ecoModel: chassis.querySelector("[data-pvfd='side-eco-model']"),
        prog: chassis.querySelector("[data-pvfd='side-prog']"),
        left: chassis.querySelector("[data-pvfd='side-left']"),
        repeat: chassis.querySelector("[data-pvfd='side-repeat']"),
        shuffle: chassis.querySelector("[data-pvfd='side-shuffle']"),
        status: chassis.querySelector("[data-pvfd='side-status']"),
        playbadge: chassis.querySelector("[data-pvfd='side-playbadge']"),
      },
      sideVu: Array.from(chassis.querySelectorAll("[data-pvfd='side-vu'] span")),
      meta: chassis.querySelector(".pvfd-meta-track"),
      time: chassis.querySelector(".pvfd-meta-time"),
      progress: chassis.querySelector(".pvfd-meta-progress"),
      progressText: chassis.querySelector(".pvfd-progress-text"),
      lcd: chassis.querySelector(".pvfd-lcd"),
      lcdCanvas: chassis.querySelector(".pvfd-lcd-canvas"),
      lcdVideo: chassis.querySelector("[data-pvfd='lcd-video']"),
      lcdVideoProbe: chassis.querySelector("[data-pvfd='lcd-video-probe']"),
      knobArc: chassis.querySelector(".pvfd-knob-led-arc"),
      knobIndicator: chassis.querySelector(".pvfd-knob-indicator"),
    };
    return pvfdDom;
  }

  function setTextIfChanged(el, txt) {
    if (el && el.textContent !== txt) el.textContent = txt;
  }

  function setDataIfChanged(el, name, value) {
    if (el && el.dataset && el.dataset[name] !== value) el.dataset[name] = value;
  }

  function setAttrIfChanged(el, name, value) {
    if (el && el.getAttribute(name) !== value) el.setAttribute(name, value);
  }

  function setStyleIfChanged(el, name, value, priority) {
    if (!el || el.style.getPropertyValue(name) === value) return;
    el.style.setProperty(name, value, priority || "");
  }

  function getSampledPlayerState(now = performance.now()) {
    if (now - playerStateCache.at > PLAYER_STATE_SAMPLE_MS) {
      playerStateCache.at = now;
      playerStateCache.playing = Spicetify.Player.isPlaying();
      playerStateCache.shuffle = getShuffleState();
      playerStateCache.repeat = getRepeatState();
    }
    return playerStateCache;
  }

  function markStaticReadoutsDirty() {
    staticReadoutsDirty = true;
  }

  function markPlayerStateDirty() {
    playerStateCache.at = -Infinity;
    markStaticReadoutsDirty();
  }

  function schedulePlayerStateRefresh(delay = 140) {
    markPlayerStateDirty();
    window.setTimeout(markPlayerStateDirty, delay);
  }

  function markVolumeReadoutsDirty() {
    knobLedDirty = true;
    markStaticReadoutsDirty();
  }

  function updateMenuPanel() {
    const perfAt = pvfdPerfStart();
    if (!chassis) {
      pvfdPerfEnd("menuRefreshUpdate", perfAt);
      return;
    }
    const dom = getPvfdDom();
    const source = SOURCE_TARGETS[sourceIdx] || SOURCE_TARGETS[0];
    setTextIfChanged(dom.menu && dom.menu.src, source.label);
    setTextIfChanged(dom.menu && dom.menu.oel, activeClipName(12));
    setTextIfChanged(dom.menu && dom.menu.demo, demoAutoMode ? "AUTO" : "OFF");
    setTextIfChanged(dom.menu && dom.menu.tint, TINT_LABELS[tintIdx]);
    setTextIfChanged(dom.menu && dom.menu.type, FONT_PRESETS[fontPresetIdx].label);
    setTextIfChanged(dom.menu && dom.menu.perf, activePerformanceConfig().label);
    setTextIfChanged(dom.menu && dom.menu.logoGlow, currentPulseModeLabel());
    setTextIfChanged(dom.menu && dom.menu.oelDisplay, oelDisplayEnabled ? "ON" : "OFF");
    setTextIfChanged(dom.menu && dom.menu.racingColor, racingColorModeLabel());
    pvfdPerfEnd("menuRefreshUpdate", perfAt);
  }

  // Mirrors the Chromium live-audio path so the menu shows the same source the logo
  // pulse loop is trying to use.
  function currentPulseModeLabel() {
    if (!logoGlowEnabled) return "OFF";
    if (desktopCapturePending || logoLiveAudioPending) return "...";
    if (desktopCaptureActive) return "LIVE";
    return "...";
  }

  function updateRoleButtonStates() {
    if (!chassis) return;
    const dom = getPvfdDom();
    const demoBtn = dom.buttons && dom.buttons.demo;
    if (demoBtn) {
      demoBtn.classList.toggle("active", demoAutoMode);
      demoBtn.title = demoAutoMode ? "Showroom auto-cycle: on" : "Toggle showroom auto-cycle";
    }
    const menuBtn = dom.buttons && dom.buttons.menu;
    if (menuBtn) menuBtn.classList.toggle("active", menuOpen);
  }

  function applyDimMode(persist = false) {
    applyLcdFilter();
    const dimBtn = chassis && chassis.querySelector("[data-pvfd='dim']");
    if (dimBtn) dimBtn.classList.toggle("active", lcdDimmed);
    if (persist) safe(() => window.localStorage.setItem(DIM_STORAGE_KEY, lcdDimmed ? "ON" : "OFF"));
    markStaticReadoutsDirty();
    updateMenuPanel();
  }

  function toggleDimMode() {
    lcdDimmed = !lcdDimmed;
    applyDimMode(true);
  }

  function applyBrowseFontPreset(persist = false) {
    fontPresetIdx = ((fontPresetIdx % FONT_PRESETS.length) + FONT_PRESETS.length) % FONT_PRESETS.length;
    const preset = FONT_PRESETS[fontPresetIdx];
    const key = `${preset.label}:${preset.stack}`;
    let applied = false;
    document.querySelectorAll(".Root__main-view, .main-view-container, .main-view-container__scroll-node").forEach((el) => {
      const pixelCurrent = el.style.getPropertyValue("--pvfd-font-pixel");
      const vfdCurrent = el.style.getPropertyValue("--pvfd-font-vfd");
      if (pixelCurrent !== preset.stack) {
        el.style.setProperty("--pvfd-font-pixel", preset.stack);
        applied = true;
      }
      if (vfdCurrent !== preset.stack) {
        el.style.setProperty("--pvfd-font-vfd", preset.stack);
        applied = true;
      }
    });
    if (!applied && browseFontPresetKey === key && !persist) return;
    browseFontPresetKey = key;
    if (persist) safe(() => window.localStorage.setItem(FONT_STORAGE_KEY, preset.label));
    updateMenuPanel();
  }

  function cycleFontPreset() {
    fontPresetIdx = (fontPresetIdx + 1) % FONT_PRESETS.length;
    applyBrowseFontPreset(true);
  }

  function applyPerformanceMode(persist = false) {
    performanceModeIdx = ((performanceModeIdx % PERFORMANCE_MODES.length) + PERFORMANCE_MODES.length) % PERFORMANCE_MODES.length;
    const perf = activePerformanceConfig();
    const perfName = perf.label.toLowerCase();
    if (chassis) chassis.setAttribute("data-pvfd-performance", perfName);
    document.documentElement.setAttribute("data-pvfd-performance", perfName);
    if (document.body) document.body.setAttribute("data-pvfd-performance", perfName);
    if (persist) safe(() => window.localStorage.setItem(PERF_STORAGE_KEY, perf.label));
    lastCanvasFrameKey = "";
    clearAllClipRenderCaches(!perf.keepPreviousClipCache);
    if (perf.releaseInactiveClipBytes) releaseInactiveClipBytes(CLIPS[clipIdx] || null);
    scheduleSizeCanvas();
    applyLcdFilter();
    markStaticReadoutsDirty();
    knobLedDirty = true;
    updateMenuPanel();
  }

  function applyLogoGlowMode(persist = false) {
    if (chassis) {
      chassis.setAttribute("data-pvfd-logo-glow", logoGlowEnabled ? "on" : "off");
      chassis.classList.remove("pvfd-logo-burst", "pvfd-logo-burst-a", "pvfd-logo-burst-b");
    }
    if (!logoGlowEnabled) {
      pulseLiveFailureReason = "";
      stopDesktopAudioCapture();
      stopLogoLiveAudioCapture();
    }
    if (persist) safe(() => window.localStorage.setItem(LOGO_GLOW_STORAGE_KEY, logoGlowEnabled ? "ON" : "OFF"));
    updateMenuPanel();
  }

  async function toggleLogoGlowMode() {
    if (desktopCapturePending) return;
    if (logoGlowEnabled) {
      logoGlowEnabled = false;
      applyLogoGlowMode(true);
      return;
    }

    logoGlowEnabled = true;
    applyLogoGlowMode(true);

    const pulseStartPromise = startLogoLiveAudioCapture();
    const liveCaptureStarted = await startDesktopAudioCapture();
    const pulseStarted = await pulseStartPromise;

    if (!pulseStarted || !liveCaptureStarted) {
      logoGlowEnabled = false;
      stopDesktopAudioCapture();
      stopLogoLiveAudioCapture();
      applyLogoGlowMode(true);
      return;
    }

    pulseLiveFailureReason = "";
    updateMenuPanel();
  }

  function applyRacingColorMode(persist = false) {
    syncOelColorModeAttributes();
    applyLcdFilter();
    if (persist) safe(() => window.localStorage.setItem(RACING_COLOR_STORAGE_KEY, racingColorEnabled ? "COLOR" : "TINT"));
    markStaticReadoutsDirty();
    updateMenuPanel();
  }

  function toggleRacingColorMode() {
    racingColorEnabled = !racingColorEnabled;
    applyRacingColorMode(true);
  }

  function toggleRacingColorFromOel() {
    if (!isRacingClip(getActiveOelClip())) return;
    toggleRacingColorMode();
  }

  function applyOelDisplayMode(persist = false) {
    if (chassis) chassis.setAttribute("data-pvfd-oel-display", oelDisplayEnabled ? "on" : "off");
    logOelCanvasRendererDisabled();
    if (canvas) canvas.style.display = "";
    const dom = getPvfdDom();
    syncOelColorModeAttributes();
    if (dom.lcdVideo) dom.lcdVideo.style.display = oelDisplayEnabled ? "block" : "none";
    if (!oelDisplayEnabled && ctx && canvasCssW && canvasCssH) {
      ctx.clearRect(0, 0, canvasCssW, canvasCssH);
      lastCanvasFrameKey = "";
    }
    if (oelDisplayEnabled) {
      console.log("[PVFD] VFD ON: showing/playing WebM");
      syncOelVideoPlayback(true);
    } else {
      console.log("[PVFD] VFD OFF: hiding/pausing WebM");
      pauseOelVideoPlayback("off");
    }
    if (persist) safe(() => window.localStorage.setItem(OEL_DISPLAY_STORAGE_KEY, oelDisplayEnabled ? "ON" : "OFF"));
    updateMenuPanel();
  }

  function toggleOelDisplay() {
    oelDisplayEnabled = !oelDisplayEnabled;
    applyOelDisplayMode(true);
  }

  function cyclePerformanceMode() {
    performanceModeIdx = (performanceModeIdx + 1) % PERFORMANCE_MODES.length;
    applyPerformanceMode(true);
  }

  function cycleClipMode() {
    logOelCanvasRendererDisabled();
    if (!OEL_WEBM_CLIPS.length) return;
    setActiveClip(clipIdx + 1, true);
    const clipBtn = chassis && chassis.querySelector("[data-pvfd='clip']");
    if (clipBtn) {
      clipBtn.classList.add("active");
      setTimeout(() => clipBtn.classList.remove("active"), 900);
    }
  }

  function applyTintMode(persist = false) {
    tintIdx = ((tintIdx % TINT_HUE_DEG.length) + TINT_HUE_DEG.length) % TINT_HUE_DEG.length;
    applyLcdFilter();
    markStaticReadoutsDirty();
    const tintBtn = chassis && chassis.querySelector("[data-pvfd='tint']");
    if (tintBtn) {
      tintBtn.textContent = TINT_LABELS[tintIdx];
      tintBtn.classList.toggle("active", tintIdx !== 0);
    }
    if (persist) safe(() => window.localStorage.setItem(TINT_STORAGE_KEY, TINT_LABELS[tintIdx]));
    updateMenuPanel();
  }

  function cycleTintMode() {
    tintIdx = (tintIdx + 1) % TINT_HUE_DEG.length;
    applyTintMode(true);
  }

  function toggleDemoMode() {
    demoAutoMode = !demoAutoMode;
    demoLastClipSwitchMs = performance.now();
    if (chassis) chassis.setAttribute("data-pvfd-demo", demoAutoMode ? "on" : "off");
    markStaticReadoutsDirty();
    updateRoleButtonStates();
    updateMenuPanel();
  }

  function activateMenuAction(action) {
    if (action === "source") cycleSource();
    else if (action === "clip") cycleClipMode();
    else if (action === "demo") toggleDemoMode();
    else if (action === "tint") cycleTintMode();
    else if (action === "type") cycleFontPreset();
    else if (action === "perf") cyclePerformanceMode();
    else if (action === "logoGlow") toggleLogoGlowMode();
    else if (action === "oelDisplay") toggleOelDisplay();
    else if (action === "racingColor") toggleRacingColorMode();
  }

  function getPlayerVolume(now = performance.now(), force = false) {
    if (pendingVolume !== null) return pendingVolume;
    if (force || now - volumeStateCache.at > VOLUME_SAMPLE_MS) {
      const raw = safeReturn(() => Spicetify.Player.getVolume(), volumeStateCache.value);
      volumeStateCache.value = clamp(Number(raw) || 0, 0, 1);
      volumeStateCache.at = now;
    }
    return volumeStateCache.value;
  }

  function setVolumeSmooth(v) {
    pendingVolume = clamp(v, 0, 1);
    volumeStateCache.value = pendingVolume;
    volumeStateCache.at = performance.now();
    markStaticReadoutsDirty();
    updateLknobLED();
    if (volumeCommitTimer) return;
    volumeCommitTimer = setTimeout(() => {
      const next = pendingVolume;
      volumeCommitTimer = null;
      pendingVolume = null;
      safe(() => Spicetify.Player.setVolume(next));
      markVolumeReadoutsDirty();
    }, 35);
  }

  function activePlayerTimingSampleMs() {
    return PLAYER_TIMING_SAMPLE_MS;
  }

  function projectedPlayerProgressMs(ts = performance.now()) {
    if (!Number.isFinite(playerTimingCache.at)) return playerTimingCache.progressMs || 0;
    const elapsed = playerTimingCache.playing ? Math.max(0, ts - playerTimingCache.at) : 0;
    const duration = playerTimingCache.durationMs;
    const projected = playerTimingCache.progressMs + elapsed;
    return duration > 0 ? clamp(projected, 0, duration) : projected;
  }

  function getSampledPlaybackTiming(ts = performance.now(), force = false) {
    if (force || ts - playerTimingCache.at >= activePlayerTimingSampleMs()) {
      const projectedProgressMs = projectedPlayerProgressMs(ts);
      const sampledProgressMs = safeReturn(() => Spicetify.Player.getProgress(), projectedProgressMs) || 0;
      const durationMs = getCurrentDurationMs();
      const playing = safeReturn(() => Spicetify.Player.isPlaying(), false);
      let progressMs = sampledProgressMs;

      if (logoGlowEnabled && !force && playing && playerTimingCache.playing && Number.isFinite(playerTimingCache.at)) {
        const correctionMs = sampledProgressMs - projectedProgressMs;
        progressMs = Math.abs(correctionMs) <= 450
          ? projectedProgressMs + correctionMs * LOGO_GLOW_TIMING_SMOOTHING
          : sampledProgressMs;
      }

      playerTimingCache.at = ts;
      playerTimingCache.progressMs = durationMs > 0 ? clamp(progressMs, 0, durationMs) : progressMs;
      playerTimingCache.durationMs = durationMs;
      playerTimingCache.playing = playing;
    }

    return {
      progressMs: projectedPlayerProgressMs(ts),
      durationMs: playerTimingCache.durationMs,
      playing: playerTimingCache.playing,
    };
  }

  function getDisplayProgressMs(ts = performance.now(), timing = getSampledPlaybackTiming(ts)) {
    if (scrubPreviewMs !== null && ts < scrubPreviewUntil) return scrubPreviewMs;
    scrubPreviewMs = null;
    return timing.progressMs;
  }

  function seekToMs(ms) {
    const duration = getCurrentDurationMs();
    const target = clamp(ms || 0, 0, duration > 0 ? duration : Number.MAX_SAFE_INTEGER);
    scrubPreviewMs = target;
    scrubPreviewUntil = performance.now() + 700;
    playerTimingCache.at = -Infinity;
    safe(() => Spicetify.Player.seek(target));
  }

  function seekByMs(deltaMs) {
    seekToMs(getDisplayProgressMs() + deltaMs);
  }

  function seekToFraction(frac) {
    const duration = getCurrentDurationMs();
    if (!duration) return;
    seekToMs(clamp(frac, 0, 1) * duration);
  }

  function bindProgressScrubber(el) {
    if (!el) return;
    let scrubRect = null;
    const apply = (e) => {
      const rect = scrubRect || el.getBoundingClientRect();
      if (!rect.width) return;
      seekToFraction((e.clientX - rect.left) / rect.width);
    };
    let activePointer = null;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      activePointer = e.pointerId;
      scrubRect = el.getBoundingClientRect();
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
      apply(e);
      el.classList.add("scrubbing");
    });
    el.addEventListener("pointermove", (e) => {
      if (activePointer !== e.pointerId) return;
      e.preventDefault();
      apply(e);
    });
    const end = () => {
      activePointer = null;
      scrubRect = null;
      el.classList.remove("scrubbing");
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  function wireControls() {
    const $ = (sel) => chassis.querySelector(sel);

    const lknob = $("[data-pvfd='lknob']");
    if (lknob) {
      const knobCenter = () => {
        const rect = lknob.getBoundingClientRect();
        return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
      };
      const pointerAngleDeg = (e, center = knobCenter()) => {
        const { cx, cy } = center;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        // 0deg is straight up / 12 o'clock. Positive is clockwise.
        return (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
      };
      lknob.addEventListener("wheel", (e) => {
        e.preventDefault();
        const step = clamp(-e.deltaY / 1200, -0.04, 0.04);
        setVolumeSmooth(getPlayerVolume() + step);
      }, { passive: false });
      let volumeDrag = null;
      lknob.addEventListener("pointerdown", (e) => {
        const center = knobCenter();
        volumeDrag = {
          ...center,
          lastAngle: pointerAngleDeg(e, center),
          startVolume: getPlayerVolume(),
          accumDeg: 0
        };
        if (lknob.setPointerCapture) lknob.setPointerCapture(e.pointerId);
        lknob.classList.add("dragging");
        e.preventDefault();
      });
      lknob.addEventListener("pointermove", (e) => {
        if (!volumeDrag) return;
        const a = pointerAngleDeg(e, volumeDrag);
        let d = a - volumeDrag.lastAngle;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        volumeDrag.accumDeg += d;
        volumeDrag.lastAngle = a;
        setVolumeSmooth(volumeDrag.startVolume + volumeDrag.accumDeg / 360);
        e.preventDefault();
      });
      const endVolumeDrag = () => {
        volumeDrag = null;
        lknob.classList.remove("dragging");
      };
      lknob.addEventListener("pointerup", endVolumeDrag);
      lknob.addEventListener("pointercancel", endVolumeDrag);
      lknob.addEventListener("lostpointercapture", endVolumeDrag);
    }

    const navring = $("[data-pvfd='navring']");
    if (navring) {
      navring.addEventListener("wheel", (e) => {
        e.preventDefault();
        const ticks = clamp(-e.deltaY / 80, -3, 3);
        seekByMs(ticks * SCRUB_MS_PER_TICK);
      }, { passive: false });
      navring.addEventListener("pointerdown", (e) => {
        navDrag = { x: e.clientX, y: e.clientY, start: getDisplayProgressMs() };
        if (navring.setPointerCapture) navring.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      navring.addEventListener("pointermove", (e) => {
        if (!navDrag) return;
        const dx = e.clientX - navDrag.x;
        const dy = navDrag.y - e.clientY;
        seekToMs(navDrag.start + (dx + dy) * 420);
        e.preventDefault();
      });
      const endNavDrag = () => { navDrag = null; };
      navring.addEventListener("pointerup", endNavDrag);
      navring.addEventListener("pointercancel", endNavDrag);
    }

    bindProgressScrubber($("[data-pvfd='trackbar']"));
    bindNowPlayingShortcut($(".pvfd-meta-track"));

    bind($("[data-pvfd='navcenter']"), () => invokePlayerAction(() => Spicetify.Player.togglePlay()));
    bind($("[data-pvfd='navup']"),    () => safe(() => Spicetify.Player.toggleHeart()));
    bind($("[data-pvfd='navdn']"),    () => safe(() => {
      if (Spicetify.addToQueue && Spicetify.Player.data && Spicetify.Player.data.item) {
        Spicetify.addToQueue([Spicetify.Player.data.item.uri]);
      }
    }));
    bind($("[data-pvfd='navleft']"),  () => invokePlayerAction(() => Spicetify.Player.back(), 300));
    bind($("[data-pvfd='navright']"), () => invokePlayerAction(() => Spicetify.Player.next(), 300));

    bind($("[data-pvfd='scan']"), cycleSource);
    bind($("[data-pvfd='lyrics']"), openLyrics);
    bind($("[data-pvfd='dim']"), toggleDimMode);
    bind($("[data-pvfd='clip']"), cycleClipMode);
    bind($("[data-pvfd='tint']"), cycleTintMode);
    bind($("[data-pvfd='demo']"), toggleDemoMode);
    bind($(".pvfd-lcd"), toggleRacingColorFromOel);
    bind($("[data-pvfd='menu']"), () => {
      setMenuOpen(!menuOpen);
    });
  chassis.querySelectorAll("[data-pvfd-menu-action]").forEach((row) => {
    row.setAttribute("role", "menuitem");
    row.setAttribute("tabindex", "0");

    row.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      activateMenuAction(row.dataset.pvfdMenuAction);
    });

    row.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      e.stopPropagation();
      activateMenuAction(row.dataset.pvfdMenuAction);
    });
  });

    bind($("[data-pvfd='shuffle']"), () => invokePlayerAction(() => Spicetify.Player.toggleShuffle()));
    bind($("[data-pvfd='prev']"),    () => invokePlayerAction(() => Spicetify.Player.back(), 300));
    bind($("[data-pvfd='play']"),    () => invokePlayerAction(() => Spicetify.Player.togglePlay()));
    bind($("[data-pvfd='next']"),    () => invokePlayerAction(() => Spicetify.Player.next(), 300));
    bind($("[data-pvfd='repeat']"),  () => invokePlayerAction(() => Spicetify.Player.toggleRepeat()));
    bind($("[data-pvfd='love']"),    () => safe(() => Spicetify.Player.toggleHeart()));
    bind($("[data-pvfd='queue']"),   () => {
      const q = document.querySelector("[data-testid='control-button-queue']");
      if (q) q.click();
    });
    bind($("[data-pvfd='devices']"), () => {
      openDevicePicker();
    });
  }
//no synthetic fallback
  function getLogoSyntheticAudioMetrics() {
    const out = _syntheticMetricsBuf;

    logoLiveSubSlow *= 0.74;
    logoLiveLowSlow *= 0.74;
    logoLiveMidSlow *= 0.74;
    logoLivePresenceSlow *= 0.74;
    logoLiveHighSlow *= 0.74;

    out.sub = 0;
    out.low = 0;
    out.mid = 0;
    out.presence = 0;
    out.high = 0;

    out.subFlux = 0;
    out.lowFlux = 0;
    out.midFlux = 0;
    out.presenceFlux = 0;
    out.highFlux = 0;

    return out;
  }

  async function startLogoLiveAudioCapture() {
    if (logoLiveAudioActive || logoLiveAudioPending) return logoLiveAudioActive;
    logoLiveAudioPending = true;
    updateMenuPanel();
    try {
      // Chromium desktop capture only. If this fails, PULSE turns back off cleanly.
      stopLogoLiveAudioCapture();
      resetLogoLiveAudioState();
      setLogoAudioGlowVars(0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0);
      logoLiveAudioActive = true;
      startLogoLiveAudioScheduler();
      console.log("[PVFD] pulse visualizer active");
      return true;
    } catch (err) {
      console.warn("[PVFD] pulse visualizer start failed:", err);
      logoLiveAudioActive = false;
      return false;
    } finally {
      logoLiveAudioPending = false;
      updateMenuPanel();
    }
  }

  // Stops the per-pause envelope scheduler. Does NOT touch the desktop
  // capture stream — that lifecycle is owned by start/stopDesktopAudioCapture so
  // the user keeps their granted screen-share across pause/play.
  function stopLogoLiveAudioCapture() {
    stopLogoLiveAudioScheduler();
    logoLiveAudioActive = false;
    logoLiveAudioPending = false;
    resetLogoLiveAudioState();
    setLogoAudioGlowVars(0, 0, 0, 0, 0, 0, 0);
    updateMenuPanel();
  }

  async function startDesktopAudioCapture() {
    if (desktopCaptureActive || desktopCapturePending) return desktopCaptureActive;
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== "function") {
      pulseLiveFailureReason = "getDisplayMedia not available in this Spotify build";
      safe(() => Spicetify.showNotification && Spicetify.showNotification("PULSE LIVE: getDisplayMedia not available in this Spotify build."));
      return false;
    }
    desktopCapturePending = true;
    pulseLiveFailureReason = "";
    updateMenuPanel();
    let stream = null;
    try {
      // selfBrowserSurface:"exclude" is the critical option: it stops the user from
      // picking Spotify's own window, which avoids the compositor feedback loop that
      // froze the clock/scrubber/LCD in the previous getDisplayMedia attempt.
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: { suppressLocalAudioPlayback: false },
        selfBrowserSurface: "exclude",
        systemAudio: "include",
        surfaceSwitching: "exclude",
        monitorTypeSurfaces: "include",
      });
      // We only want audio. Drop video tracks immediately.
      stream.getVideoTracks().forEach((track) => safe(() => track.stop()));
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) {
        stream.getTracks().forEach((track) => safe(() => track.stop()));
        throw new Error("no system audio in stream — enable 'Also share system audio' in the picker");
      }
      const audioTrack = audioTracks[0];
      // Heuristic match WMPotify uses: a "tab" share label means the user picked
      // tab audio instead of system audio — refuse it cleanly.
      if (audioTrack.label && audioTrack.label.toLowerCase().includes("tab")) {
        stream.getTracks().forEach((track) => safe(() => track.stop()));
        throw new Error("tab audio selected; pick a screen/window with system audio enabled");
      }
      audioTrack.addEventListener("ended", () => {
        // Fires when user clicks "Stop sharing" in Chrome's banner.
        stopDesktopAudioCapture();
      });

      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtor();
      const sourceNode = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = DESKTOP_CAPTURE_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.62;
      sourceNode.connect(analyser);

      logoLiveAudioStream = stream;
      logoLiveAudioCtx = audioCtx;
      logoLiveAudioAnalyser = analyser;
      logoLiveAudioBins = new Uint8Array(analyser.frequencyBinCount);
      logoLivePrevBins = new Uint8Array(analyser.frequencyBinCount);
      desktopCaptureActive = true;
      pulseLiveFailureReason = "";
      console.log(`[PVFD] desktop audio capture active: ${audioTrack.label || "system audio"}`);
      return true;
    } catch (err) {
      // Cleanup any partial stream on failure.
      if (stream && stream.getTracks) stream.getTracks().forEach((track) => safe(() => track.stop()));
      const msg = err && err.name === "NotAllowedError" ? "permission denied" : (err && err.message ? err.message : err);
      pulseLiveFailureReason = String(msg || "live capture failed");
      console.warn("[PVFD] pulse live capture failed:", msg);
      safe(() => Spicetify.showNotification && Spicetify.showNotification("PULSE LIVE: " + msg));
      return false;
    } finally {
      desktopCapturePending = false;
      updateMenuPanel();
    }
  }

  function stopDesktopAudioCapture() {
    if (logoLiveAudioStream && logoLiveAudioStream.getTracks) {
      logoLiveAudioStream.getTracks().forEach((track) => safe(() => track.stop()));
    }
    if (logoLiveAudioCtx && typeof logoLiveAudioCtx.close === "function") {
      safe(() => logoLiveAudioCtx.close());
    }
    logoLiveAudioStream = null;
    logoLiveAudioCtx = null;
    logoLiveAudioAnalyser = null;
    logoLiveAudioBins = null;
    logoLivePrevBins = null;
    desktopCaptureActive = false;
    desktopCapturePending = false;
    updateMenuPanel();
  }

  function startLogoLiveAudioScheduler() {
    lastLogoLiveAudioUpdateAt = -Infinity;
  }

  function stopLogoLiveAudioScheduler() {
    lastLogoLiveAudioUpdateAt = -Infinity;
    if (!logoLiveAudioSchedulerRaf) return;
    cancelAnimationFrame(logoLiveAudioSchedulerRaf);
    logoLiveAudioSchedulerRaf = 0;
  }

  // Resets the smoothed envelopes used by the pulse loop. Does NOT
  // touch logoLivePrevBins — that buffer's lifecycle belongs to startDesktopAudioCapture.
  function resetLogoLiveAudioState() {
    logoLiveGuitarCentroidPrev = 0;
    logoLiveGuitarMotionEnv = 0;
    logoLiveLastPulseMs = 0;
    logoLiveDebugLastMs = 0;
    logoLiveSubEnv = 0;
    logoLiveBassEnv = 0;
    logoLiveLowMidEnv = 0;
    logoLiveMidEnv = 0;
    logoLiveUpperMidEnv = 0;
    logoLivePresenceEnv = 0;
    logoLiveAirEnv = 0;
    logoLiveLowEnv = 0;
    logoLiveHighEnv = 0;
    logoLiveSubSlow = 0;
    logoLiveLowSlow = 0;
    logoLiveMidSlow = 0;
    logoLivePresenceSlow = 0;
    logoLiveHighSlow = 0;
    logoLiveSubPrev = 0;
    logoLiveBassPrev = 0;
    logoLiveLowMidPrev = 0;
    logoLiveMidPrev = 0;
    logoLiveUpperMidPrev = 0;
    logoLivePresencePrev = 0;
    logoLiveAirPrev = 0;
    logoLiveLowPrev = 0;
    logoLiveHighPrev = 0;
    logoLiveFluxAvg = 0;
    logoLivePunchEnv = 0;
    logoLiveLogoEnv = 0;
    logoLiveStyleCache = Object.create(null);
    lastLogoLiveAudioUpdateAt = -Infinity;
    resetLogoRenderState();
  }

  function setLiveStyleVar(el, key, value, cachePrefix) {
    if (!el) return;
    const cacheKey = cachePrefix + key;
    if (logoLiveStyleCache[cacheKey] === value) return;
    logoLiveStyleCache[cacheKey] = value;
    el.style.setProperty(key, value);
  }

  const LOGO_METER_W = 48;
  const LOGO_METER_H = 23;
  const LOGO_METER_BAND_COUNT = 7;
  const LOGO_GLOW_W = 170;
  const LOGO_GLOW_H = 34;
  const LOGO_RENDER_NORMAL_MS = 33;
  const LOGO_RENDER_STRESS_MS = 66;
  const LOGO_RENDER_EPSILON = 0.0035;

  const logoRenderState = {
    lanes: new Float32Array(LOGO_METER_BAND_COUNT),
    opacities: new Float32Array(LOGO_METER_BAND_COUNT),
    energy: 0,
    punch: 0,
    dirty: true,
    lastRenderAt: -Infinity
  };

  const logoBarSpriteCache = {
    sprite: null,
    paletteVersion: -1
  };

  const logoGlowCanvasCache = {
    canvas: null,
    ctx: null,
    halo: null,
    haloPaletteVersion: -1
  };

  function isLogoRenderStressActive() {
    return (
      (typeof isHomeInteractionStressActive === "function" && isHomeInteractionStressActive()) ||
      (typeof isRouteChurnActive === "function" && isRouteChurnActive()) ||
      (pvfdRouteState && Number.isFinite(pvfdRouteState.churnUntil) && performance.now() < pvfdRouteState.churnUntil)
    );
  }

  function resetLogoRenderState() {
    logoRenderState.lanes.fill(0);
    logoRenderState.opacities.fill(0);
    logoRenderState.energy = 0;
    logoRenderState.punch = 0;
    logoRenderState.dirty = true;
    logoRenderState.lastRenderAt = -Infinity;
    logoBarSpriteCache.sprite = null;
    logoBarSpriteCache.paletteVersion = -1;
    logoGlowCanvasCache.halo = null;
    logoGlowCanvasCache.haloPaletteVersion = -1;
  }

  function getLogoBarSprite() {
    if (
      logoBarSpriteCache.sprite &&
      logoBarSpriteCache.paletteVersion === pvfdPaletteVersion
    ) {
      return logoBarSpriteCache.sprite;
    }

    const sprite = document.createElement("canvas");
    sprite.width = 6;
    sprite.height = LOGO_METER_H;

    const c = sprite.getContext("2d", { alpha: true });
    if (!c) return null;

    c.imageSmoothingEnabled = false;

    const grad = c.createLinearGradient(0, 0, 0, LOGO_METER_H);
    grad.addColorStop(0.00, "rgba(255,255,255,1)");
    grad.addColorStop(0.36, pvfdRgba(pvfdCssPalette.light, 0.96));
    grad.addColorStop(1.00, pvfdRgba(pvfdCssPalette.deep, 0.58));

    c.fillStyle = grad;
    c.fillRect(0, 0, 6, LOGO_METER_H);

    logoBarSpriteCache.sprite = sprite;
    logoBarSpriteCache.paletteVersion = pvfdPaletteVersion;

    return sprite;
  }

  function buildLogoGlowHaloSprite() {
    const halo = document.createElement("canvas");
    halo.width = LOGO_GLOW_W;
    halo.height = LOGO_GLOW_H;

    const c = halo.getContext("2d", { alpha: true });
    if (!c) return null;

    c.imageSmoothingEnabled = false;

    const g = c.createRadialGradient(
      LOGO_GLOW_W * 0.5,
      LOGO_GLOW_H * 0.5,
      1,
      LOGO_GLOW_W * 0.5,
      LOGO_GLOW_H * 0.5,
      Math.max(LOGO_GLOW_W, LOGO_GLOW_H) * 0.48
    );

    g.addColorStop(0.00, "rgba(255,255,255,0.42)");
    g.addColorStop(0.22, pvfdRgba(pvfdCssPalette.light, 0.72));
    g.addColorStop(0.50, pvfdRgba(pvfdCssPalette.mid, 0.38));
    g.addColorStop(0.76, pvfdRgba(pvfdCssPalette.deep, 0.16));
    g.addColorStop(1.00, "rgba(0,0,0,0)");

    c.fillStyle = g;
    c.fillRect(0, 0, LOGO_GLOW_W, LOGO_GLOW_H);

    logoGlowCanvasCache.halo = halo;
    logoGlowCanvasCache.haloPaletteVersion = pvfdPaletteVersion;

    return halo;
  }

  function ensureLogoCanvasReady() {
    if (!logoStrip || !logoStrip.isConnected) {
      logoStrip = chassis && chassis.querySelector(".pvfd-logo-strip");
    }

    if (!logoStrip) return false;

    const left = logoMeterCache.left;
    const right = logoMeterCache.right;
    const glow = logoGlowCanvasCache;

    if (
      !left ||
      !right ||
      !left.canvas ||
      !right.canvas ||
      !left.canvas.isConnected ||
      !right.canvas.isConnected ||
      !glow.canvas ||
      !glow.canvas.isConnected
    ) {
      ensureLogoSpectrumMarkup();
    }

    return !!(
      logoMeterCache.left &&
      logoMeterCache.right &&
      logoMeterCache.left.ctx &&
      logoMeterCache.right.ctx &&
      logoGlowCanvasCache.ctx
    );
  }

  function setLogoRenderState(energy, sub, low, mid, presence, high, punch) {
    const e = clamp(Number(energy) || 0, 0, 1);
    const p = clamp(Number(punch) || 0, 0, 1);

    const envSum =
      logoLiveSubEnv +
      logoLiveBassEnv +
      logoLiveLowMidEnv +
      logoLiveMidEnv +
      logoLiveUpperMidEnv +
      logoLivePresenceEnv +
      logoLiveAirEnv;

    const hasEnv = envSum > 0.001;

    const subLane = hasEnv ? clamp(logoLiveSubEnv, 0, 1) : clamp(sub, 0, 1);
    const bassLane = hasEnv ? clamp(logoLiveBassEnv, 0, 1) : clamp(low, 0, 1);
    const lowMidLane = hasEnv ? clamp(logoLiveLowMidEnv, 0, 1) : clamp(low, 0, 1);
    const midLane = hasEnv ? clamp(logoLiveMidEnv, 0, 1) : clamp(mid, 0, 1);
    const upperMidLane = hasEnv ? clamp(logoLiveUpperMidEnv, 0, 1) : clamp(presence, 0, 1);
    const presenceLane = hasEnv ? clamp(logoLivePresenceEnv, 0, 1) : clamp(presence, 0, 1);
    const airLane = hasEnv ? clamp(logoLiveAirEnv, 0, 1) : clamp(high, 0, 1);

    const presenceDisplay = clamp(upperMidLane * 0.65 + presenceLane * 0.35, 0, 1);

    const nextValues = [
      airLane,
      presenceDisplay,
      upperMidLane,
      midLane,
      lowMidLane,
      bassLane,
      subLane
    ];

    const lanes = logoRenderState.lanes;
    const opacities = logoRenderState.opacities;

    let dirty = false;

    for (let i = 0; i < LOGO_METER_BAND_COUNT; i++) {
      const v = nextValues[i];
      const o = clamp(0.70 + v * 0.30, 0, 1);

      if (Math.abs(lanes[i] - v) >= LOGO_RENDER_EPSILON) {
        lanes[i] = v;
        dirty = true;
      }

      if (Math.abs(opacities[i] - o) >= LOGO_RENDER_EPSILON) {
        opacities[i] = o;
        dirty = true;
      }
    }

    if (Math.abs(logoRenderState.energy - e) >= LOGO_RENDER_EPSILON) {
      logoRenderState.energy = e;
      dirty = true;
    }

    if (Math.abs(logoRenderState.punch - p) >= LOGO_RENDER_EPSILON) {
      logoRenderState.punch = p;
      dirty = true;
    }

    logoRenderState.dirty = logoRenderState.dirty || dirty;
  }

  function drawLogoMeterCanvasFast(cacheEntry, reverse) {
    if (!cacheEntry || !cacheEntry.canvas || !cacheEntry.ctx) return;

    const canvas = cacheEntry.canvas;
    const c = cacheEntry.ctx;

    if (canvas.width !== LOGO_METER_W) canvas.width = LOGO_METER_W;
    if (canvas.height !== LOGO_METER_H) canvas.height = LOGO_METER_H;

    c.clearRect(0, 0, LOGO_METER_W, LOGO_METER_H);

    if (!logoGlowEnabled || !logoLiveAudioActive) return;

    const sprite = getLogoBarSprite();
    if (!sprite) return;

    const lanes = logoRenderState.lanes;
    const opacities = logoRenderState.opacities;

    for (let i = 0; i < LOGO_METER_BAND_COUNT; i++) {
      const srcIdx = reverse ? LOGO_METER_BAND_COUNT - 1 - i : i;
      const value = clamp(lanes[srcIdx] || 0, 0, 1);
      const alpha = clamp(opacities[srcIdx] || 0, 0, 1);

      const x = i * 7;
      const barHeight = Math.max(1, Math.min(LOGO_METER_H, Math.round(1 + value * 22)));
      const y = LOGO_METER_H - barHeight;

      c.globalAlpha = alpha;
      c.drawImage(
        sprite,
        0, LOGO_METER_H - barHeight, 6, barHeight,
        x, y, 6, barHeight
      );

      c.globalAlpha = clamp(alpha * 0.42, 0, 1);
      c.fillStyle = "rgba(255,255,255,0.9)";
      c.fillRect(x, y, 6, 1);
    }

    c.globalAlpha = 1;
  }

  function drawLogoGlowCanvas() {
    const canvas = logoGlowCanvasCache.canvas;
    const c = logoGlowCanvasCache.ctx;

    if (!canvas || !c) return;

    if (canvas.width !== LOGO_GLOW_W) canvas.width = LOGO_GLOW_W;
    if (canvas.height !== LOGO_GLOW_H) canvas.height = LOGO_GLOW_H;

    c.clearRect(0, 0, LOGO_GLOW_W, LOGO_GLOW_H);

    if (!logoGlowEnabled || !logoLiveAudioActive) return;

    const energy = clamp(logoRenderState.energy, 0, 1);
    const punch = clamp(logoRenderState.punch, 0, 1);

    if (energy < 0.012 && punch < 0.012) return;

    let halo = logoGlowCanvasCache.halo;

    if (!halo || logoGlowCanvasCache.haloPaletteVersion !== pvfdPaletteVersion) {
      halo = buildLogoGlowHaloSprite();
    }

    if (!halo) return;

    c.globalAlpha = clamp(0.08 + energy * 0.52 + punch * 0.10, 0, 0.72);

    const scale = 0.92 + energy * 0.12 + punch * 0.04;
    const dw = LOGO_GLOW_W * scale;
    const dh = LOGO_GLOW_H * scale;
    const dx = (LOGO_GLOW_W - dw) * 0.5;
    const dy = (LOGO_GLOW_H - dh) * 0.5;

    c.drawImage(halo, dx, dy, dw, dh);
    c.globalAlpha = 1;
  }

  function renderLogoVisuals(ts = performance.now(), force = false) {
    if (!force && !logoRenderState.dirty) return;
    if (!ensureLogoCanvasReady()) return;

    const interval = isLogoRenderStressActive()
      ? LOGO_RENDER_STRESS_MS
      : LOGO_RENDER_NORMAL_MS;

    if (!force && ts - logoRenderState.lastRenderAt < interval) return;

    const perfAt = pvfdPerfStart();

    logoRenderState.lastRenderAt = ts;
    logoRenderState.dirty = false;

    drawLogoMeterCanvasFast(logoMeterCache.left, false);
    drawLogoMeterCanvasFast(logoMeterCache.right, true);
    drawLogoGlowCanvas();

    pvfdPerfEnd("logoCanvasRender", perfAt);
  }

  function clearLogoVisuals() {
    resetLogoRenderState();
    renderLogoVisuals(performance.now(), true);
  }

  // Compatibility shim:
  // Old name stays so existing start/stop/update call sites do not break.
  // New behavior: no per-frame CSS vars, no text-shadow vars, no DOM-band vars.
  function setLogoAudioGlowVars(energy, sub, low, mid, presence, high, punch) {
    setLogoRenderState(energy, sub, low, mid, presence, high, punch);
    renderLogoVisuals(performance.now(), !logoGlowEnabled || !logoLiveAudioActive);
  }

  function smoothLogoEnvelope(prev, value, attack = LOGO_LIVE_ATTACK, release = LOGO_LIVE_RELEASE) {
    const mix = value > prev ? attack : release;
    return prev + (value - prev) * mix;
  }

  function compressAudioValue(value, gain = 1, curve = 0.70) {
    return clamp(Math.pow(Math.max(0, value) * gain, curve), 0, 1);
  }

  function readLogoGuitarNoteMotion() {
    const analyser = logoLiveAudioAnalyser;
    const bins = logoLiveAudioBins;
    const ctx = logoLiveAudioCtx;

    if (!analyser || !bins || !ctx) return 0;

    const binHz = ctx.sampleRate / analyser.fftSize;

    const lo = Math.max(1, Math.floor(180 / binHz));
    const hi = Math.min(bins.length - 1, Math.ceil(5200 / binHz));

    let weighted = 0;
    let total = 0;

    for (let i = lo; i <= hi; i++) {
      const v = bins[i] / 255;

      if (v < 0.045) continue;

      const hz = i * binHz;

      const guitarWeight =
        hz < 320 ? 0.45 :
        hz < 700 ? 0.78 :
        hz < 1800 ? 1.00 :
        hz < 3600 ? 0.82 :
        0.52;

      const shaped = v * v * guitarWeight;

      weighted += shaped * i;
      total += shaped;
    }

    if (total <= 0.00001) return 0;

    const centroid = weighted / total;

    if (!logoLiveGuitarCentroidPrev) {
      logoLiveGuitarCentroidPrev = centroid;
      return 0;
    }

    const motion = Math.abs(centroid - logoLiveGuitarCentroidPrev) / Math.max(1, hi - lo);

    logoLiveGuitarCentroidPrev = centroid;

    return clamp(compressAudioValue(motion, 18.0, 0.58), 0, 1);
  }

  // Pre-computed bin offsets for each band, keyed on (sampleRate, fftSize, binsLen).
  // Recomputed only when those values actually change. Order:
  //   0=sub, 1=bass, 2=lowMid, 3=mid, 4=upperMid, 5=presence, 6=air
  const ANALYSER_BAND_RANGES = [
    [LOGO_LIVE_SUB_MIN_HZ,      LOGO_LIVE_SUB_MAX_HZ],
    [LOGO_LIVE_BASS_MIN_HZ,     LOGO_LIVE_BASS_MAX_HZ],
    [LOGO_LIVE_LOWMID_MIN_HZ,   LOGO_LIVE_LOWMID_MAX_HZ],
    [LOGO_LIVE_MID_MIN_HZ,      LOGO_LIVE_MID_MAX_HZ],
    [LOGO_LIVE_UPPERMID_MIN_HZ, LOGO_LIVE_UPPERMID_MAX_HZ],
    [LOGO_LIVE_PRESENCE_MIN_HZ, LOGO_LIVE_PRESENCE_MAX_HZ],
    [LOGO_LIVE_AIR_MIN_HZ,      LOGO_LIVE_AIR_MAX_HZ],
  ];
  // Flat Int32Array: [lo0, hi0, lo1, hi1, ...]. Uses Int32 to avoid SMI-vs-double
  // boundary jitter in tight loops.
  const _analyserBandOffsets = new Int32Array(ANALYSER_BAND_RANGES.length * 2);
  let _analyserBandOffsetKey = "";

  function ensureAnalyserBandOffsets(binHz, binsLen) {
    const key = `${binHz}|${binsLen}`;
    if (_analyserBandOffsetKey === key) return;
    _analyserBandOffsetKey = key;
    const cap = binsLen - 1;
    for (let b = 0; b < ANALYSER_BAND_RANGES.length; b++) {
      const range = ANALYSER_BAND_RANGES[b];
      const lo = Math.max(1, Math.floor(range[0] / binHz));
      const hi = Math.min(cap, Math.ceil(range[1] / binHz));
      _analyserBandOffsets[b * 2] = lo;
      _analyserBandOffsets[b * 2 + 1] = hi <= lo ? -1 : hi;
    }
  }

  // Reused per-frame so the analyser path doesn't allocate a 17-key object × 30fps.
  // Initialized to zero; mutated and returned on each call.
  const _analyserMetricsBuf = {
    sub: 0, bass: 0, lowMid: 0, mid: 0, upperMid: 0, presence: 0, air: 0,
    low: 0, high: 0,
    subFlux: 0, bassFlux: 0, lowMidFlux: 0, midFlux: 0,
    upperMidFlux: 0, presenceFlux: 0, airFlux: 0, highFlux: 0,
    guitarMotion: 0,
    guitarLevel: 0,
  };

  function readLogoLiveAudioMetrics(nowTs = performance.now()) {
    const perfAt = pvfdPerfStart();
    // Chromium desktop capture only. If no analyser is active, PULSE has no signal.
    const analyser = logoLiveAudioAnalyser;
    const bins = logoLiveAudioBins;
    const ctx = logoLiveAudioCtx;
    if (!analyser || !bins || !ctx) {
      pvfdPerfEnd("liveAudioRead", perfAt);
      return null;
    }

    analyser.getByteFrequencyData(bins);
    ensureAnalyserBandOffsets(ctx.sampleRate / analyser.fftSize, bins.length);
    const prev = logoLivePrevBins;
    const offsets = _analyserBandOffsets;
    const out = _analyserMetricsBuf;

    // Inline 7-band sweep: one loop per band, no function-call/closure overhead.
    // Uses pre-cached lo/hi indices instead of recomputing from frequency every call.
    let energy, flux, lo, hi;
    for (let b = 0; b < 7; b++) {
      lo = offsets[b * 2];
      hi = offsets[b * 2 + 1];
      energy = 0;
      flux = 0;
      if (hi > 0) {
        const count = hi - lo + 1;
        const denom = count * 255;

        let squareSum = 0;
        let fSum = 0;

        let top1 = 0;
        let top2 = 0;
        let top3 = 0;
        let top4 = 0;

        if (prev) {
          for (let i = lo; i <= hi; i++) {
            const v = bins[i];
            const n = v / 255;

            squareSum += n * n;

            if (n > top1) {
              top4 = top3;
              top3 = top2;
              top2 = top1;
              top1 = n;
            } else if (n > top2) {
              top4 = top3;
              top3 = top2;
              top2 = n;
            } else if (n > top3) {
              top4 = top3;
              top3 = n;
            } else if (n > top4) {
              top4 = n;
            }

            const d = v - prev[i];
            if (d > 0) fSum += d;
          }
        } else {
          for (let i = lo; i <= hi; i++) {
            const v = bins[i];
            const n = v / 255;

            squareSum += n * n;

            if (n > top1) {
              top4 = top3;
              top3 = top2;
              top2 = top1;
              top1 = n;
            } else if (n > top2) {
              top4 = top3;
              top3 = top2;
              top2 = n;
            } else if (n > top3) {
              top4 = top3;
              top3 = n;
            } else if (n > top4) {
              top4 = n;
            }
          }
        }

        const rms = Math.sqrt(squareSum / count);
        const topAverage = (top1 + top2 + top3 + top4) * 0.25;

        energy = rms * 0.72 + topAverage * 0.28;
        flux = fSum / denom;
      }
      // Map band index → out fields. Order matches ANALYSER_BAND_RANGES.
      switch (b) {
        case 0: out.sub      = energy; out.subFlux      = flux; break;
        case 1: out.bass     = energy; out.bassFlux     = flux; break;
        case 2: out.lowMid   = energy; out.lowMidFlux   = flux; break;
        case 3: out.mid      = energy; out.midFlux      = flux; break;
        case 4: out.upperMid = energy; out.upperMidFlux = flux; break;
        case 5: out.presence = energy; out.presenceFlux = flux; break;
        case 6: out.air      = energy; out.airFlux      = flux; break;
      }
    }

    out.low = out.bass * 0.58 + out.lowMid * 0.42;
    if (out.low > 1) out.low = 1; else if (out.low < 0) out.low = 0;
    out.high = out.upperMid * 0.42 + out.air * 0.58;
    if (out.high > 1) out.high = 1; else if (out.high < 0) out.high = 0;
    out.highFlux = out.upperMidFlux * 0.42 + out.airFlux * 0.58;
    if (out.highFlux > 1) out.highFlux = 1; else if (out.highFlux < 0) out.highFlux = 0;

    {
      const binHz = ctx.sampleRate / analyser.fftSize;
      const guitarLo = Math.max(1, Math.floor(180 / binHz));
      const guitarHi = Math.min(bins.length - 1, Math.ceil(5200 / binHz));

      let weighted = 0;
      let total = 0;

      for (let i = guitarLo; i <= guitarHi; i++) {
        const n = bins[i] / 255;

        if (n < 0.035) continue;

        const hz = i * binHz;

        const guitarWeight =
          hz < 320 ? 0.45 :
          hz < 700 ? 0.78 :
          hz < 1800 ? 1.00 :
          hz < 3600 ? 0.82 :
          0.52;

        const shaped = n * n * guitarWeight;

        weighted += shaped * i;
        total += shaped;
      }

      out.guitarLevel = clamp(total / Math.max(1, guitarHi - guitarLo + 1) * 18.0, 0, 1);

      if (total <= 0.00001) {
        out.guitarMotion = 0;
      } else {
        const centroid = weighted / total;

        if (!logoLiveGuitarCentroidPrev) {
          logoLiveGuitarCentroidPrev = centroid;
          out.guitarMotion = 0;
        } else {
          const centroidMotion = Math.abs(centroid - logoLiveGuitarCentroidPrev) / Math.max(1, guitarHi - guitarLo);
          logoLiveGuitarCentroidPrev = centroid;

          out.guitarMotion = clamp(compressAudioValue(centroidMotion, 28.0, 0.52) * out.guitarLevel, 0, 1);
        }
      }
    }

    if (prev) prev.set(bins);
    pvfdPerfEnd("liveAudioRead", perfAt);
    return out;
  }

  function updateLogoLiveAudioPulse(nowTs = performance.now()) {
    if (!logoGlowEnabled || !logoLiveAudioActive) return;
    const now = nowTs;
    const metrics = readLogoLiveAudioMetrics(nowTs);
    if (!metrics) return;

    const subRaw = clamp(metrics.sub, 0, 1);
    const bassRaw = clamp(metrics.bass != null ? metrics.bass : metrics.low, 0, 1);
    const lowMidRaw = clamp(metrics.lowMid != null ? metrics.lowMid : metrics.low, 0, 1);
    const midRaw = clamp(metrics.mid, 0, 1);
    const upperMidRaw = clamp(metrics.upperMid != null ? metrics.upperMid : metrics.presence, 0, 1);
    const presenceRaw = clamp(metrics.presence, 0, 1);
    const airRaw = clamp(metrics.air != null ? metrics.air : metrics.high, 0, 1);
    const subFlux = clamp(metrics.subFlux, 0, 1);
    const bassFlux = clamp(metrics.bassFlux != null ? metrics.bassFlux : metrics.lowFlux, 0, 1);
    const lowMidFlux = clamp(metrics.lowMidFlux != null ? metrics.lowMidFlux : metrics.lowFlux, 0, 1);
    const midFlux = clamp(metrics.midFlux, 0, 1);
    const upperMidFlux = clamp(metrics.upperMidFlux != null ? metrics.upperMidFlux : metrics.presenceFlux, 0, 1);
    const presenceFlux = clamp(metrics.presenceFlux, 0, 1);
    const airFlux = clamp(metrics.airFlux != null ? metrics.airFlux : metrics.highFlux, 0, 1);
    if (!Number.isFinite(subRaw + bassRaw + lowMidRaw + midRaw + upperMidRaw + presenceRaw + airRaw + subFlux + bassFlux + lowMidFlux + midFlux + upperMidFlux + presenceFlux + airFlux)) return;

    const metricEnergy = metrics.energy != null ? clamp(Number(metrics.energy), 0, 1) : null;
    const metricPunch = metrics.punch != null ? clamp(Number(metrics.punch), 0, 1) : null;

    const subEnergy = compressAudioValue(subRaw, 2.35, 0.58);
    const bassEnergy = compressAudioValue(bassRaw, 2.20, 0.57);
    const lowMidEnergy = compressAudioValue(lowMidRaw, 2.55, 0.55);
    const midEnergy = compressAudioValue(midRaw, 4.60, 0.50);
    const upperMidEnergy = compressAudioValue(upperMidRaw, 5.40, 0.49);
    const presenceEnergy = compressAudioValue(presenceRaw, 6.80, 0.47);
    const airEnergy = compressAudioValue(airRaw, 8.40, 0.45);

    const subMotion = compressAudioValue(subFlux, 9.5, 0.68);
    const bassMotion = compressAudioValue(bassFlux, 9.0, 0.68);
    const lowMidMotion = compressAudioValue(lowMidFlux, 8.2, 0.66);
    const midMotion = compressAudioValue(midFlux, 7.4, 0.64);
    const upperMidMotion = compressAudioValue(upperMidFlux, 6.8, 0.62);
    const presenceMotion = compressAudioValue(presenceFlux, 6.2, 0.60);
    const airMotion = compressAudioValue(airFlux, 5.8, 0.58);

    const hazeTexture = clamp(
      midEnergy * 0.10
        + upperMidEnergy * 0.13
        + presenceEnergy * 0.13
        + airEnergy * 0.05
        - bassEnergy * 0.06,
      0,
      0.12
    );

    const hazeMotion = clamp(
      midMotion * 0.30
        + upperMidMotion * 0.28
        + presenceMotion * 0.22
        + airMotion * 0.12,
      0,
      1
    );

    const hazeLift = clamp(hazeTexture * 0.34 + hazeMotion * 0.08, 0, 0.075);

    const guitarMotion = clamp(metrics.guitarMotion || 0, 0, 1);

    logoLiveGuitarMotionEnv = smoothLogoEnvelope(
      logoLiveGuitarMotionEnv,
      guitarMotion,
      0.58,
      0.105
    );

    const subInput = clamp(subEnergy * 0.44 + subMotion * 0.42 + subFlux * 2.2, 0, 1);
    const bassInput = clamp(bassEnergy * 0.42 + bassMotion * 0.44 + bassFlux * 2.4, 0, 1);
    const lowMidInput = clamp(lowMidEnergy * 0.36 + lowMidMotion * 0.46 + lowMidFlux * 2.8 + hazeLift * 0.020, 0, 1);
    const midInput = clamp(midEnergy * 0.30 + midMotion * 0.48 + midFlux * 3.2 + hazeLift * 0.040, 0, 1);
    const upperMidInput = clamp(upperMidEnergy * 0.26 + upperMidMotion * 0.50 + upperMidFlux * 3.4 + hazeLift * 0.050, 0, 1);
    const presenceInput = clamp(presenceEnergy * 0.24 + presenceMotion * 0.52 + presenceFlux * 3.6 + hazeLift * 0.055, 0, 1);
    const airInput = clamp(airEnergy * 0.24 + airMotion * 0.50 + airFlux * 3.2 + hazeLift * 0.040, 0, 1);

    if (!logoLiveSubEnv && !logoLiveBassEnv && !logoLiveLowMidEnv && !logoLiveMidEnv && !logoLiveUpperMidEnv && !logoLivePresenceEnv && !logoLiveAirEnv && !logoLiveLogoEnv) {
      logoLiveSubEnv = subInput;
      logoLiveBassEnv = bassInput;
      logoLiveLowMidEnv = lowMidInput;
      logoLiveMidEnv = midInput;
      logoLiveUpperMidEnv = upperMidInput;
      logoLivePresenceEnv = presenceInput;
      logoLiveAirEnv = airInput;
      logoLiveLowEnv = clamp(logoLiveBassEnv * 0.58 + logoLiveLowMidEnv * 0.42, 0, 1);
      logoLiveHighEnv = clamp(logoLiveUpperMidEnv * 0.42 + logoLiveAirEnv * 0.58, 0, 1);
      logoLiveLogoEnv = metricEnergy != null
        ? metricEnergy
        : clamp(compressAudioValue(subRaw * 0.16 + bassRaw * 0.18 + lowMidRaw * 0.16 + midRaw * 0.18 + upperMidRaw * 0.12 + presenceRaw * 0.11 + airRaw * 0.09, 1.80, 0.72), 0, 1);
      setLogoAudioGlowVars(logoLiveLogoEnv, logoLiveSubEnv, logoLiveLowEnv, logoLiveMidEnv, logoLivePresenceEnv, logoLiveHighEnv, 0);
      return;
    }

    logoLiveSubEnv = smoothLogoEnvelope(logoLiveSubEnv, subInput, LOGO_LIVE_ATTACK, 0.600);
    logoLiveBassEnv = smoothLogoEnvelope(logoLiveBassEnv, bassInput, LOGO_LIVE_ATTACK, 0.620);
    logoLiveLowMidEnv = smoothLogoEnvelope(logoLiveLowMidEnv, lowMidInput, LOGO_LIVE_ATTACK, 0.640);
    logoLiveMidEnv = smoothLogoEnvelope(logoLiveMidEnv, midInput, LOGO_LIVE_ATTACK, 0.660);
    logoLiveUpperMidEnv = smoothLogoEnvelope(logoLiveUpperMidEnv, upperMidInput, LOGO_LIVE_HIGH_ATTACK, 0.700);
    logoLivePresenceEnv = smoothLogoEnvelope(logoLivePresenceEnv, presenceInput, LOGO_LIVE_HIGH_ATTACK, 0.740);
    logoLiveAirEnv = smoothLogoEnvelope(logoLiveAirEnv, airInput, LOGO_LIVE_HIGH_ATTACK, 0.780);

    logoLiveLowEnv = clamp(logoLiveBassEnv * 0.58 + logoLiveLowMidEnv * 0.42, 0, 1);
    logoLiveHighEnv = clamp(logoLiveUpperMidEnv * 0.42 + logoLiveAirEnv * 0.58, 0, 1);

    const totalRaw = subRaw * 0.16 + bassRaw * 0.18 + lowMidRaw * 0.16 + midRaw * 0.18 + upperMidRaw * 0.12 + presenceRaw * 0.11 + airRaw * 0.09;
    const logoInput = metricEnergy != null
      ? metricEnergy
      : clamp(
          compressAudioValue(totalRaw, 1.80, 0.72) * 0.72
            + logoLiveSubEnv * 0.07
            + logoLiveBassEnv * 0.07
            + logoLiveLowMidEnv * 0.06
            + logoLiveMidEnv * 0.05
            + logoLiveUpperMidEnv * 0.04
            + logoLivePresenceEnv * 0.03
            + logoLiveAirEnv * 0.02,
          0,
          1
        );
    logoLiveLogoEnv = smoothLogoEnvelope(logoLiveLogoEnv, logoInput, LOGO_LIVE_LOGO_ATTACK, LOGO_LIVE_LOGO_RELEASE);

    const punchInput = metricPunch != null
      ? metricPunch
      : clamp(
          subFlux * 4.2
            + bassFlux * 3.4
            + lowMidFlux * 2.4
            + midFlux * 1.5
            + upperMidFlux * 0.9
            + presenceFlux * 0.6
            + airFlux * 0.4,
          0,
          1
        );
    logoLivePunchEnv = Math.max(logoLivePunchEnv * 0.58, punchInput > 0.24 ? punchInput : 0);

    setLogoAudioGlowVars(
      logoLiveLogoEnv,
      logoLiveSubEnv,
      logoLiveLowEnv,
      logoLiveMidEnv,
      logoLivePresenceEnv,
      logoLiveHighEnv,
      logoLivePunchEnv
    );

    if (LOGO_LIVE_DEBUG && now - logoLiveDebugLastMs > 500) {
      logoLiveDebugLastMs = now;
      console.log("[PVFD_AUDIO]", {
        raw: [
          Number(subRaw.toFixed(3)),
          Number(bassRaw.toFixed(3)),
          Number(lowMidRaw.toFixed(3)),
          Number(midRaw.toFixed(3)),
          Number(upperMidRaw.toFixed(3)),
          Number(presenceRaw.toFixed(3)),
          Number(airRaw.toFixed(3))
        ],
        flux: [
          Number(subFlux.toFixed(4)),
          Number(bassFlux.toFixed(4)),
          Number(lowMidFlux.toFixed(4)),
          Number(midFlux.toFixed(4)),
          Number(upperMidFlux.toFixed(4)),
          Number(presenceFlux.toFixed(4)),
          Number(airFlux.toFixed(4))
        ],
        lanes: [
          Number(logoLiveSubEnv.toFixed(3)),
          Number(logoLiveBassEnv.toFixed(3)),
          Number(logoLiveLowMidEnv.toFixed(3)),
          Number(logoLiveMidEnv.toFixed(3)),
          Number(logoLiveUpperMidEnv.toFixed(3)),
          Number(logoLivePresenceEnv.toFixed(3)),
          Number(logoLiveAirEnv.toFixed(3))
        ],
        logo: Number(logoLiveLogoEnv.toFixed(3)),
        punch: Number(logoLivePunchEnv.toFixed(3))
      });
    }

    logoLiveSubPrev = logoLiveSubEnv;
    logoLiveBassPrev = logoLiveBassEnv;
    logoLiveLowMidPrev = logoLiveLowMidEnv;
    logoLiveMidPrev = logoLiveMidEnv;
    logoLiveUpperMidPrev = logoLiveUpperMidEnv;
    logoLivePresencePrev = logoLivePresenceEnv;
    logoLiveAirPrev = logoLiveAirEnv;
    logoLiveLowPrev = logoLiveLowEnv;
    logoLiveHighPrev = logoLiveHighEnv;
  }

  function updateBars(isPlaying) {
    const base = isPlaying ? 0.52 : 0.10;
    const spread = isPlaying ? 0.30 : 0.06;

    let energySum = 0;

    for (let i = 0; i < NUM_BARS; i++) {
      const phase = NUM_BARS <= 1 ? 0 : i / (NUM_BARS - 1);
      let target = base + spread * (1 - Math.abs(phase - 0.5) * 1.65);

      if (target < 0.05) target = 0.05;
      else if (target > 1) target = 1;

      const prev = barHeights[i];
      const next = SMOOTHING * prev + (1 - SMOOTHING) * target;

      barHeights[i] = Math.abs(next - prev) >= VISUALIZER_EPSILON ? next : prev;
      energySum += barHeights[i];
    }

    sideVuEnergy = clamp(energySum / NUM_BARS, 0, 1);
  }

  function lcdBackground(w, h, targetCtx = ctx) {
    const bgW = Math.max(1, Math.round(w));
    const bgH = Math.max(1, Math.round(h));
    const key = `${bgW}x${bgH}:p${pvfdPaletteVersion}`;

    if (!lcdBackgroundCache || lcdBackgroundCache.key !== key) {
      const bg = document.createElement("canvas");
      bg.width = bgW;
      bg.height = bgH;

      const bgCtx = bg.getContext("2d");

      bgCtx.fillStyle = pvfdCssPalette.lcdVoid;
      bgCtx.fillRect(0, 0, bgW, bgH);

      bgCtx.fillStyle = pvfdRgba(pvfdCssPalette.mid, 0.045);
      for (let y = 0; y < bgH; y += 6) {
        bgCtx.fillRect(0, y, bgW, 1);
      }

      bgCtx.fillStyle = pvfdRgba(pvfdCssPalette.mid, 0.025);
      for (let x = 0; x < bgW; x += 8) {
        bgCtx.fillRect(x, 0, 1, bgH);
      }

      lcdBackgroundCache = { key, bg };
    }

    targetCtx.drawImage(lcdBackgroundCache.bg, 0, 0, w, h);
  }

  // Compose display filters. The WebM one-color path is already tinted by the
  // CSS RGB wash, so only full-color OEL mode keeps the hue-rotate filter.
  function applyLcdFilter() {
    if (!chassis) return;

    const tintName = TINT_LABELS[tintIdx].toLowerCase();
    const perf = activePerformanceConfig();

    chassis.setAttribute("data-pvfd-tint", tintName);
    document.documentElement.setAttribute("data-pvfd-tint", tintName);
    refreshPvfdCssPalette();

    const deg = TINT_HUE_DEG[tintIdx];
    const baseLcdParts = [];

    if (perf.reducedEffects) {
      if (lcdDimmed) baseLcdParts.push("brightness(0.70)");
    } else if (lcdDimmed) {
      baseLcdParts.push("brightness(0.50) contrast(0.98) saturate(1.05)");
    } else {
      baseLcdParts.push("brightness(1.00) contrast(0.96) saturate(1.20)");
    }

    chassis.querySelectorAll(".pvfd-lcd").forEach((lcd) => {
      const colorMode = lcd.getAttribute("data-pvfd-oel-color");
      const videoState = lcd.getAttribute("data-pvfd-video-state");
      const cssTintedWebm = colorMode === "tint" && (videoState === "active" || videoState === "loading");
      const parts = [];
      if (deg !== 0 && !cssTintedWebm) parts.push(`hue-rotate(${deg}deg)`);
      parts.push(...baseLcdParts);
      const nextFilter = parts.join(" ");
      if (lcd.style.filter !== nextFilter) lcd.style.filter = nextFilter;
    });

    const panelParts = [];

    if (lcdDimmed) {
      panelParts.push("brightness(0.55)");
    }

    chassis.querySelectorAll(".pvfd-meta-lcd, .pvfd-lcd-side").forEach((lcd) => {
      lcd.style.filter = panelParts.join(" ");
    });
  }

  function cyanRamp(y) {
    // Fixed cyan OEL palette.
    // Tint is applied later by CSS filter on .pvfd-lcd.
    const yy = Math.max(0, Math.min(1, y));
    const r = Math.max(0, Math.min(0.54, (yy - 0.68) * 1.65));
    const g = Math.max(0.08, Math.min(0.90, yy * 1.02 + 0.02));
    const b = Math.max(0.26, Math.min(1.00, 0.34 + yy * 0.92));
    return [r, g, b];
  }

  function clipCellColor(q, sparkleOn) {
    const key = `${q}:${sparkleOn ? 1 : 0}`;
    const cached = clipColorCache.get(key);

    if (cached) return cached;

    const y = Math.min(1, (q / 15) * 0.98);
    const ramp = cyanRamp(y);
    const sparkle = sparkleOn ? 0.035 : 0;

    const r = Math.min(255, Math.round((ramp[0] + sparkle) * 255));
    const g = Math.min(255, Math.round((ramp[1] + sparkle) * 255));
    const b = Math.min(255, Math.round((ramp[2] + sparkle) * 255));

    const color = `rgb(${r},${g},${b})`;
    clipColorCache.set(key, color);

    return color;
  }

  function decodePackedClip(clip) {
    if (!clip || clip.bytes) return;
    try {
      const binary = atob(clip.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      clip.bytes = bytes;
    } catch (e) {
      console.warn("[PVFD] packed clip decode failed:", clip && clip.name, e);
      clip.bytes = new Uint8Array(0);
    }
  }

  function clearClipRenderCache(clip, clearPrevious = true) {
    if (!clip) return;
    if (clip.renderCache) {
      clip.renderCache.frames = [];
      clip.renderCache.recentFrames = [];
      clip.renderCache = null;
    }
    if (clearPrevious && clip.lastReadyRenderCache) {
      clip.lastReadyRenderCache.frames = [];
      clip.lastReadyRenderCache = null;
    }
  }

  function clearAllClipRenderCaches(clearPrevious = true, exceptClip = null) {
    CLIPS.forEach((clip) => {
      if (clip !== exceptClip) clearClipRenderCache(clip, clearPrevious);
    });
  }

  function releaseInactiveClipBytes(activeClip) {
    CLIPS.forEach((clip) => {
      if (clip !== activeClip) clip.bytes = null;
    });
  }

  function setActiveClip(idx, persist = false) {
    if (!OEL_WEBM_CLIPS.length) return;
    clipIdx = ((idx % OEL_WEBM_CLIPS.length) + OEL_WEBM_CLIPS.length) % OEL_WEBM_CLIPS.length;
    clipStartMs = performance.now();
    clipVirtualMs = 0;
    clipLastTsMs = 0;
    lastCanvasFrameKey = "";
    const activeClip = OEL_WEBM_CLIPS[clipIdx];
    console.log(`[PVFD] OEL WebM clip: ${activeClip.name}`);
    syncOelVideoPlayback(true);
    syncOelColorModeAttributes();
    applyLcdFilter();
    if (persist) safe(() => window.localStorage.setItem(CLIP_STORAGE_KEY, clipStorageId(activeClip, clipIdx)));
    markStaticReadoutsDirty();
    updateMenuPanel();
  }

  function ensureClipRunning() {
    if (!OEL_WEBM_CLIPS.length) return null;
    const clip = OEL_WEBM_CLIPS[clipIdx] || OEL_WEBM_CLIPS[0];
    if (!clipStartMs) clipStartMs = performance.now();
    return clip;
  }

  function drawLCDStatus(text, w, h, targetCtx = ctx) {
    targetCtx.fillStyle = pvfdRgba(pvfdCssPalette.lcdVoidRgb, 0.72);
    targetCtx.fillRect(
      Math.round(w * 0.24),
      Math.round(h * 0.42),
      Math.round(w * 0.52),
      18
    );

    targetCtx.fillStyle = pvfdRgba(pvfdCssPalette.light, 0.88);
    targetCtx.font = "bold 11px 'Share Tech Mono', monospace";
    targetCtx.textAlign = "center";
    targetCtx.fillText(text, Math.round(w * 0.50), Math.round(h * 0.42) + 13);
    targetCtx.textAlign = "left";
  }

  function renderPackedClipFrame(targetCtx, clip, frame, w, h) {
    lcdBackground(w, h, targetCtx);

    const frameOffset = frame * ((clip.w * clip.h) >> 1);
    const cellW = w / clip.w;
    const cellH = h / clip.h;

    for (let py = 0; py < clip.h; py++) {
      for (let px = 0; px < clip.w; px++) {
        const packed = clip.bytes[frameOffset + ((py * clip.w + px) >> 1)] || 0;
        const q = (px & 1) ? (packed & 15) : (packed >> 4);
        const dx = Math.floor(px * cellW);
        const dy = Math.floor(py * cellH);
        const nextX = Math.ceil((px + 1) * cellW);
        const nextY = Math.ceil((py + 1) * cellH);
        const drawW = Math.max(1, nextX - dx);
        const drawH = Math.max(1, nextY - dy);

        if (q <= 0) {
          targetCtx.fillStyle = pvfdCssPalette.lcdDeep;
          targetCtx.fillRect(dx, dy, drawW, drawH);
          continue;
        }

        targetCtx.fillStyle = clipCellColor(q, (px * 13 + py * 7 + frame) % 37 === 0);
        targetCtx.fillRect(dx, dy, drawW, drawH);

        if (q >= 13 && drawW > 1 && drawH > 1) {
          targetCtx.fillStyle = pvfdRgba(pvfdCssPalette.light, 0.075);
          targetCtx.fillRect(dx, dy, Math.max(1, drawW - 1), Math.max(1, drawH - 1));
        }
      }
    }
  }
  function getClipCacheMeta(clip, w, h) {
    const perf = activePerformanceConfig();
    const dpr = Math.max(1, Math.min(perf.maxDpr || 2, window.devicePixelRatio || 1));
    const pixelW = Math.max(1, Math.floor(w * dpr));
    const pixelH = Math.max(1, Math.floor(h * dpr));
    const renderW = pixelW / dpr;
    const renderH = pixelH / dpr;
    const frameCount = clip.frames || 1;
    const cacheKey = `${perf.label}:${clip.source || clip.name}:${pixelW}x${pixelH}:${dpr}`;
    return { cacheKey, dpr, pixelW, pixelH, frameCount, w: renderW, h: renderH };
  }

  function ensureClipRenderCache(clip, meta) {
    const perf = activePerformanceConfig();
    if (!clip.renderCache || clip.renderCache.key !== meta.cacheKey) {
      if (perf.keepPreviousClipCache && clip.renderCache && clip.renderCache.ready) {
        clip.lastReadyRenderCache = clip.renderCache;
      } else if (!perf.keepPreviousClipCache) {
        clip.lastReadyRenderCache = null;
      }
      clip.renderCache = {
        key: meta.cacheKey,
        dpr: meta.dpr,
        pixelW: meta.pixelW,
        pixelH: meta.pixelH,
        w: meta.w,
        h: meta.h,
        frameCount: meta.frameCount,
        frames: new Array(meta.frameCount),
        recentFrames: [],
        warmed: 0,
        nextWarmFrame: 0,
        ready: false,
        warming: false,
        warmStartedAt: performance.now(),
      };
      lastClipCacheKey = meta.cacheKey;
    }
    return clip.renderCache;
  }

  function renderClipFrameCanvas(clip, frame, meta) {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = meta.pixelW;
    frameCanvas.height = meta.pixelH;
    const frameCtx = frameCanvas.getContext("2d");
    frameCtx.setTransform(meta.dpr, 0, 0, meta.dpr, 0, 0);
    frameCtx.imageSmoothingEnabled = false;
    renderPackedClipFrame(frameCtx, clip, frame, meta.w, meta.h);
    return frameCanvas;
  }

  function nextMissingClipFrame(cache) {
    for (let i = 0; i < cache.frameCount; i++) {
      const frame = (cache.nextWarmFrame + i) % cache.frameCount;
      if (!cache.frames[frame]) return frame;
    }
    return -1;
  }

  function finishClipCacheIfReady(clip, cache) {
    if (cache.ready || cache.warmed < cache.frameCount) return;
    const hadReadyCache = !!(clip.lastReadyRenderCache && clip.lastReadyRenderCache.ready);
    cache.ready = true;
    clip.lastReadyRenderCache = cache;
    if (!hadReadyCache && clip === (CLIPS[clipIdx] || CLIPS[0])) clipStartMs = performance.now();
  }

  function touchCachedClipFrame(cache, frame) {
    if (!cache.recentFrames) cache.recentFrames = [];
    const existingIdx = cache.recentFrames.indexOf(frame);
    if (existingIdx >= 0) cache.recentFrames.splice(existingIdx, 1);
    cache.recentFrames.push(frame);
    const maxFrames = activePerformanceConfig().maxCachedClipFrames;
    if (!Number.isFinite(maxFrames)) return;
    while (cache.recentFrames.length > maxFrames) {
      const evictFrame = cache.recentFrames.shift();
      if (evictFrame !== frame) cache.frames[evictFrame] = null;
    }
  }

  function markClipCacheRebuildStress(ms = CLIP_CACHE_ROUTE_REBUILD_BLOCK_MS) {
    clipCacheRebuildBlockedUntil = Math.max(clipCacheRebuildBlockedUntil, performance.now() + ms);
  }

  function isClipCacheRebuildStressActive() {
    return performance.now() < clipCacheRebuildBlockedUntil;
  }

  function metaFromClipRenderCache(cache) {
    if (!cache) return null;
    return {
      cacheKey: cache.key,
      dpr: cache.dpr,
      pixelW: cache.pixelW,
      pixelH: cache.pixelH,
      frameCount: cache.frameCount,
      w: cache.w,
      h: cache.h,
    };
  }

  function keepExistingClipCacheWarmupAlive(clip, cache) {
    if (!clip || !cache || cache.ready || cache.warming) return;
    const meta = metaFromClipRenderCache(cache);
    if (meta) scheduleClipCacheWarmup(clip, meta);
  }

  function getClipFrameDuringRebuildStress(clip, frame, meta) {
    if (!isClipCacheRebuildStressActive()) return null;
    const cache = clip && clip.renderCache;
    if (!cache || cache.key === meta.cacheKey || !cache.frames) return null;

    // Route/Home hover stress should not start a brand-new cache rebuild when an
    // existing OEL cache can still draw. Let the current incomplete cache finish
    // normally, but keep using available old frames until the renderer settles.
    keepExistingClipCacheWarmupAlive(clip, cache);

    const cacheFrame = frame % Math.max(1, cache.frameCount || meta.frameCount || 1);
    if (cache.frames[cacheFrame]) {
      touchCachedClipFrame(cache, cacheFrame);
      return cache.frames[cacheFrame];
    }

    const fallback = clip.lastReadyRenderCache;
    if (!fallback || !fallback.ready || !fallback.frames) return null;
    const fallbackFrame = frame % Math.max(1, fallback.frameCount || meta.frameCount || 1);
    if (fallback.frames[fallbackFrame]) {
      touchCachedClipFrame(fallback, fallbackFrame);
      return fallback.frames[fallbackFrame];
    }
    return null;
  }

  function warmClipCacheSlice(clip, meta) {
    const cache = ensureClipRenderCache(clip, meta);
    const startedAt = performance.now();
    let rendered = 0;
    const perf = activePerformanceConfig();
    while (rendered < 1 || (performance.now() - startedAt < perf.cacheBatchMs && rendered < perf.cacheFramesPerSlice)) {
      const frame = nextMissingClipFrame(cache);
      if (frame < 0) break;
      cache.frames[frame] = renderClipFrameCanvas(clip, frame, meta);
      touchCachedClipFrame(cache, frame);
      cache.warmed++;
      cache.nextWarmFrame = (frame + 1) % cache.frameCount;
      rendered++;
    }
    finishClipCacheIfReady(clip, cache);
  }

  function scheduleClipCacheWarmup(clip, meta) {
    if (!activePerformanceConfig().preloadFullClipCache) return;
    const cache = ensureClipRenderCache(clip, meta);
    if (cache.ready || cache.warming) return;
    cache.warming = true;
    const run = () => {
      cache.warming = false;
      if (clip.renderCache !== cache || cache.ready) return;
      warmClipCacheSlice(clip, meta);
      if (!cache.ready) scheduleClipCacheWarmup(clip, meta);
    };
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 80 });
    else window.setTimeout(run, 16);
  }

  function getCachedClipFrame(clip, frame, w, h) {
    const meta = getClipCacheMeta(clip, w, h);
    const stressFrame = getClipFrameDuringRebuildStress(clip, frame, meta);
    if (stressFrame) return stressFrame;
    const cache = ensureClipRenderCache(clip, meta);
    const perf = activePerformanceConfig();
    if (!perf.preloadFullClipCache || perf.allowPartialClipCache) {
      if (!cache.frames[frame]) {
        cache.frames[frame] = renderClipFrameCanvas(clip, frame, meta);
        cache.warmed = Math.min(cache.frameCount, cache.warmed + 1);
      }
      touchCachedClipFrame(cache, frame);
      if (perf.preloadFullClipCache) scheduleClipCacheWarmup(clip, meta);
      return cache.frames[frame];
    }
    scheduleClipCacheWarmup(clip, meta);
    if (cache.ready) {
      touchCachedClipFrame(cache, frame);
      return cache.frames[frame];
    }
    const fallback = clip.lastReadyRenderCache;
    if (!fallback || !fallback.ready || !fallback.frames) return null;
    return fallback.frames[frame % fallback.frameCount] || null;
  }

  function drawClipLoadingStatus(clip, w, h, t) {
    const cache = clip && clip.renderCache;
    const total = Math.max(1, cache ? cache.frameCount : (clip && clip.frames) || 1);
    const ready = Math.max(0, cache ? cache.warmed : 0);
    const pct = Math.min(99, Math.floor((ready / total) * 100));
    lcdBackground(w, h);

    ctx.save();
    if (!activePerformanceConfig().reducedEffects) {
      const scanX = Math.round((t * 36) % Math.max(1, w + 60)) - 60;
      const sweep = ctx.createLinearGradient(scanX, 0, scanX + 60, 0);
      sweep.addColorStop(0, pvfdRgba(pvfdCssPalette.mid, 0));
      sweep.addColorStop(0.5, pvfdRgba(pvfdCssPalette.mid, 0.11));
      sweep.addColorStop(1, pvfdRgba(pvfdCssPalette.mid, 0));
      ctx.fillStyle = sweep;
      ctx.fillRect(Math.max(0, scanX), 0, 60, h);
    }

    drawLCDStatus(ready ? `LOADING ${pct}%` : "LOADING...", w, h);

    const barW = Math.max(48, Math.round(w * 0.36));
    const barX = Math.round((w - barW) / 2);
    const barY = Math.min(h - 8, Math.round(h * 0.62));

    ctx.fillStyle = pvfdRgba(pvfdCssPalette.lcdDeepRgb, 0.92);
    ctx.fillRect(barX, barY, barW, 3);

    ctx.fillStyle = pvfdRgba(pvfdCssPalette.mid, 0.74);
    ctx.fillRect(barX, barY, Math.max(2, Math.round(barW * ready / total)), 3);

    ctx.restore();
  }

  function drawClip(w, h, t, tsMs = t * 1000) {
    logOelCanvasRendererDisabled();
    console.warn("[PVFD] OEL WebM proof: drawClip() blocked");
    return;
    const clip = ensureClipRunning();
    decodePackedClip(clip);
    if (!clip || !clip.bytes || !clip.bytes.length) {
      lastCanvasFrameKey = "";
      lcdBackground(w, h);
      drawLCDStatus("OEL DATA", w, h);
      return;
    }

    const frameCount = clip.frames || 1;
    const perf = activePerformanceConfig();
    const fps = Math.min(clip.fps || 12, perf.maxClipFps || 60);
    if (!clipLastTsMs || tsMs < clipLastTsMs) {
      clipLastTsMs = tsMs;
    }

    const rawDeltaMs = Math.max(0, tsMs - clipLastTsMs);
    const cappedDeltaMs = Math.min(rawDeltaMs, 50);

    clipVirtualMs += cappedDeltaMs;
    clipLastTsMs = tsMs;

    const elapsed = clipVirtualMs / 1000;
    const frame = Math.floor(elapsed * fps) % frameCount;
    if (!CLIP_RENDER_CACHE_ENABLED) {
      renderPackedClipFrame(ctx, clip, frame, w, h);
      return;
    }
    const cachedFrame = getCachedClipFrame(clip, frame, w, h);
    if (!cachedFrame) {
      lastCanvasFrameKey = "";
      drawClipLoadingStatus(clip, w, h, t);
      return;
    }
    const cacheKey = clip.renderCache && clip.renderCache.key ? clip.renderCache.key : `${w}x${h}`;
    const frameKey = `${clipIdx}:${cacheKey}:${frame}`;
    if (frameKey === lastCanvasFrameKey) return;
    ctx.drawImage(cachedFrame, 0, 0, w, h);
    lastCanvasFrameKey = frameKey;
  }

  function syncCurrentTrackFromPlayer(force = false, ts = performance.now()) {
    if (!force && ts - lastTrackSyncAt < TRACK_SYNC_INTERVAL_MS) return;
    lastTrackSyncAt = ts;
    const item = Spicetify.Player.data && Spicetify.Player.data.item;
    if (!item) return;

    const uri = item.uri || item.link || item.name || "";
    if (uri && uri !== lastTrackUri) {
      lastTrackUri = uri;
      trackTitle = (item.name || "").toUpperCase();
      trackArtist = ((item.artists && item.artists.map(a => a.name).join(", ")) || "").toUpperCase();
      markPlayerStateDirty();
    }

    if (!trackTitle && item.name) {
      trackTitle = item.name.toUpperCase();
    }
    if (!trackArtist && item.artists) {
      trackArtist = item.artists.map(a => a.name).join(", ").toUpperCase();
    }
  }

  function getCurrentDurationMs() {
    const data = Spicetify.Player.data || {};
    const item = data.item || {};
    const raw = data.duration || item.duration_ms || item.duration || item.durationMs || 0;
    if (typeof raw === "number") return raw;
    if (raw && typeof raw.milliseconds === "number") return raw.milliseconds;
    return 0;
  }

  function getRepeatState() {
    const data = Spicetify.Player.data || {};
    const candidates = [data.repeat, data.repeat_mode, data.options && data.options.repeat, data.state && data.state.repeat, data.state && data.state.repeat_mode, data.context && data.context.repeat, safeReturn(() => Spicetify.Player.getRepeat && Spicetify.Player.getRepeat(), null)].filter(v => v !== undefined && v !== null);
    for (const raw of candidates) {
      const val = String(raw).toLowerCase();
      if (val === "2" || val.includes("track") || val.includes("one")) return "ONE";
      if (val === "1" || val.includes("context") || val.includes("all") || val === "true") return "ALL";
      if (val === "0" || val.includes("off") || val === "false") return "OFF";
    }
    const btn = document.querySelector("[data-testid='control-button-repeat'], button[aria-label*='repeat' i]");
    const label = (btn && btn.getAttribute("aria-label") || "").toLowerCase();
    if (label.includes("enable repeat one")) return "ALL";
    if (label.includes("disable repeat") || label.includes("disable repeat one")) return "ONE";
    return "OFF";
  }

  function getShuffleState() {
    const data = Spicetify.Player.data || {};
    const raw = data.shuffle ?? (data.options && data.options.shuffle) ?? (data.state && data.state.shuffle);
    if (typeof raw === "boolean") return raw;
    if (raw !== undefined && raw !== null) return String(raw).toLowerCase() === "true" || String(raw) === "1";
    const btn = document.querySelector("[data-testid='control-button-shuffle'], button[aria-label*='shuffle' i]");
    if (!btn) return false;
    const checked = btn.getAttribute("aria-checked");
    if (checked) return checked === "true";
    return (btn.getAttribute("aria-label") || "").toLowerCase().includes("disable shuffle");
  }

  function makeProgressLabel(progressMs, durationMs) {
    const elapsed = fmtTime(progressMs);
    return durationMs > 0 ? `${elapsed} / ${fmtTime(durationMs)}` : elapsed;
  }

  function updateButtonStates(playerState = getSampledPlayerState()) {
    const dom = getPvfdDom();
    const playBtn = dom.buttons && dom.buttons.play;
    setTextIfChanged(playBtn, playerState.playing ? PVFD_PAUSE_GLYPH : PVFD_PLAY_GLYPH);
    const shuffleBtn = dom.buttons && dom.buttons.shuffle;
    const shuffleOn = playerState.shuffle;
    if (shuffleBtn) {
      shuffleBtn.classList.toggle("active", shuffleOn);
      setDataIfChanged(shuffleBtn, "label", shuffleOn ? "ON" : "OFF");
      setAttrIfChanged(shuffleBtn, "title", shuffleOn ? "Shuffle: on" : "Shuffle: off");
    }
    const repeatBtn = dom.buttons && dom.buttons.repeat;
    const rpt = playerState.repeat;
    if (repeatBtn) {
      repeatBtn.classList.toggle("active", rpt !== "OFF");
      repeatBtn.classList.toggle("repeat-context", rpt === "ALL");
      repeatBtn.classList.toggle("repeat-one", rpt === "ONE");
      setDataIfChanged(repeatBtn, "label", rpt);
      setAttrIfChanged(repeatBtn, "title", rpt === "ONE" ? "Repeat: current song" : (rpt === "ALL" ? "Repeat: playlist/album" : "Repeat: off"));
    }
    updateRoleButtonStates();
  }

  function disableSideVuReadout(opacity = "0.18") {
    const vu = getPvfdDom().sideVu || [];
    vu.forEach((seg) => {
      if (seg.classList.contains("on")) seg.classList.remove("on");
      setStyleIfChanged(seg, "opacity", opacity);
    });
  }

  function updateSideVuReadout() {
    if (!activePerformanceConfig().sideVu) {
      disableSideVuReadout("0.14");
      return;
    }
    const vu = getPvfdDom().sideVu || [];
    if (!vu.length) return;
    const energy = sideVuEnergy;
    vu.forEach((seg, idx) => {
      const threshold = 1 - (idx + 1) / vu.length;
      const on = energy > threshold * 0.92;
      setStyleIfChanged(seg, "opacity", on ? (0.35 + energy * 0.65).toFixed(2) : "0.22");
    });
  }

  function updateSideProgressReadouts(progressMs, durationMs) {
    const side = getPvfdDom().side || {};
    if (!activePerformanceConfig().sideReadouts) {
      setTextIfChanged(side.prog, "--");
      setTextIfChanged(side.left, "--:--");
      return;
    }
    const pct = durationMs ? clamp(progressMs / durationMs, 0, 1) : 0;
    setTextIfChanged(side.prog, durationMs ? Math.round(pct * 100) + "%" : "--%");
    setTextIfChanged(side.left, durationMs ? "-" + fmtTime(durationMs - progressMs) : "--:--");
  }

  function updateSideStaticReadouts(playerState = getSampledPlayerState()) {
    const dom = getPvfdDom();
    const side = dom.side || {};
    const perf = activePerformanceConfig();
    if (!perf.sideReadouts) {
      setTextIfChanged(side.vol, Math.round(getPlayerVolume() * 100) + "%");
      setTextIfChanged(side.mode, "WEBM");
      setTextIfChanged(side.tint, TINT_LABELS[tintIdx]);
      setTextIfChanged(side.dim, lcdDimmed ? "DIM" : "FULL");
      setTextIfChanged(side.prog, "--");
      setTextIfChanged(side.left, "--:--");
      setTextIfChanged(side.repeat, playerState.repeat);
      setTextIfChanged(side.shuffle, playerState.shuffle ? "ON" : "OFF");
      setTextIfChanged(side.status, "ECO");
      setTextIfChanged(side.playbadge, "WEBM");
      if (side.ecoModel) side.ecoModel.hidden = false;
      disableSideVuReadout("0.14");
      return;
    }
    const activeClipLabel = activeClipName(8);
    const source = SOURCE_TARGETS[sourceIdx] || SOURCE_TARGETS[0];
    const sourceFlash = performance.now() < sourceFlashUntil;
    if (side.ecoModel) side.ecoModel.hidden = true;
    setTextIfChanged(side.vol, Math.round(getPlayerVolume() * 100) + "%");
    setTextIfChanged(side.mode, demoAutoMode ? "DEMO" : (oelDisplayEnabled ? "WEBM" : "----"));
    setTextIfChanged(side.tint, TINT_LABELS[tintIdx]);
    setTextIfChanged(side.dim, perf.label === "ECO" ? (lcdDimmed ? "ECO DIM" : "ECO") : (lcdDimmed ? "DIM" : "FULL"));
    setTextIfChanged(side.repeat, playerState.repeat);
    setTextIfChanged(side.shuffle, playerState.shuffle ? "ON" : "OFF");
    setTextIfChanged(side.status, sourceFlash ? ("SRC " + source.label) : (demoAutoMode ? "DEMO" : (oelDisplayEnabled ? activeClipLabel : (playerState.playing ? "PLAY" : "PAUSE"))));
    setTextIfChanged(side.playbadge, demoAutoMode ? "AUTO" : (oelDisplayEnabled ? "WEBM" : (playerState.playing ? "RUN" : "IDLE")));
  }

  function activeStaticReadoutIntervalMs() {
    return activePerformanceConfig().label === "ECO" ? ECO_STATIC_READOUT_INTERVAL_MS : STATIC_READOUT_INTERVAL_MS;
  }

  function runStaticOverlayUpdate(playerState, ts) {
    lastStaticReadoutAt = ts;
    staticReadoutsDirty = false;
    updateButtonStates(playerState);
    updateSideStaticReadouts(playerState);
  }

  function updateOverlays(progressMs, timing, ts = performance.now()) {
    const staticDue = staticReadoutsDirty || ts - lastStaticReadoutAt >= activeStaticReadoutIntervalMs();
    if (ts - lastProgressReadoutAt < PROGRESS_READOUT_INTERVAL_MS) {
      if (staticDue) runStaticOverlayUpdate(getSampledPlayerState(ts), ts);
      return;
    }
    lastProgressReadoutAt = ts;
    const dom = getPvfdDom();
    const playerState = getSampledPlayerState(ts);
    const title = trackTitle || PVFD_META_IDLE_GLYPH;
    const artist = trackArtist || "";
    const label = artist ? `${artist} - ${title}` : title;
    const durationMs = timing && timing.durationMs !== undefined ? timing.durationMs : getCurrentDurationMs();
    const elapsed = fmtTime(progressMs);
    const timeText = durationMs > 0 ? `${elapsed} / ${fmtTime(durationMs)}` : elapsed;
    const pct = durationMs > 0 ? clamp(progressMs / durationMs, 0, 1) : 0;

    if (dom.meta) {
      const metaLabel = "Open Now Playing: " + label;
      setTextIfChanged(dom.meta, `${playerState.playing ? PVFD_PLAY_GLYPH : PVFD_META_PAUSE_GLYPH} ${label}`);
      if (dom.meta.title !== metaLabel) dom.meta.title = metaLabel;
      setAttrIfChanged(dom.meta, "aria-label", metaLabel);
    }
    setTextIfChanged(dom.time, timeText);
    if (dom.progress) {
      setStyleIfChanged(dom.progress, "--pvfd-progress", (pct * 100).toFixed(2) + "%");
      const progressLabel = makeProgressLabel(progressMs, durationMs);
      const titleText = "Scrub: " + progressLabel;
      if (dom.progress.title !== titleText) dom.progress.title = titleText;
      setAttrIfChanged(dom.progress, "aria-label", "Scrub progress " + progressLabel);
    }
    setTextIfChanged(dom.progressText, "");
    if (activePerformanceConfig().sideReadouts) updateSideProgressReadouts(progressMs, durationMs);
    if (staticDue) runStaticOverlayUpdate(playerState, ts);
  }

  function updateLknobLED() {
    knobLedDirty = false;
    const dom = getPvfdDom();
    if (!dom.knobArc) return;
    // 12 o'clock is 0%, one full clockwise sweep is 100%.
    const sweepDeg = (360 * getPlayerVolume()).toFixed(1) + "deg";
    setStyleIfChanged(dom.knobArc, "--pvfd-led-deg", sweepDeg);
    setStyleIfChanged(dom.knobIndicator, "--pvfd-rot", sweepDeg);
  }

  let lastFrame = 0;
  let lastProgressReadoutAt = -Infinity;
  let lastStaticReadoutAt = -Infinity;
  let lastTrackSyncAt = -Infinity;
  let lastBarUpdateAt = -Infinity;
  let lastKnobLedAt = -Infinity;

  function activeFrameIntervalMs() {
    const perf = activePerformanceConfig();
    return perf.frameMs;
  }

  function syncLogoAudioDemand(wantAudio) {
    if (!wantAudio) {
      if (logoLiveAudioResumeTimer) {
        clearTimeout(logoLiveAudioResumeTimer);
        logoLiveAudioResumeTimer = 0;
      }
      if (logoLiveAudioActive || logoLiveAudioPending) stopLogoLiveAudioCapture();
      return;
    }
    if (!logoLiveAudioActive && !logoLiveAudioPending && !logoLiveAudioResumeTimer) {
      logoLiveAudioResumeTimer = window.setTimeout(() => {
        logoLiveAudioResumeTimer = 0;
        if (logoGlowEnabled && !logoLiveAudioActive && !logoLiveAudioPending && safeReturn(() => Spicetify.Player.isPlaying(), false)) {
          startLogoLiveAudioCapture();
        }
      }, 250);
    }
  }


  installPvfdPlaylistScrollStressDetector();
  function loop(ts) {
    requestAnimationFrame(loop);


    if (ts - lastFrame < activeFrameIntervalMs()) return;

    lastFrame = ts;

    if (!ctx || !chassis) return;

    const perfAt = pvfdPerfStart();
    const scrollStress = isPvfdPlaylistScrollStressActive(ts);

    setAttrIfChanged(chassis, "data-pvfd-demo", demoAutoMode ? "on" : "off");

    // Never read canvas.clientWidth/Height inline — that forces a synchronous layout
    // flush which collides with Spotify's main-view mouseover delegate and React
    // scheduler tick on the same thread (measured 98ms forcedLayout across 4 frames
    // during home-quicklink sweeps). If the size cache is missing, schedule a
    // sizeCanvas in its own rAF and bail this frame.
    if (!canvasCssW || !canvasCssH) {
      scheduleSizeCanvas();
      pvfdPerfEnd("mainLoopTotal", perfAt);
      return;
    }

    const w = canvasCssW;
    const h = canvasCssH;

    const timing = getSampledPlaybackTiming(ts);
    const progressMs = getDisplayProgressMs(ts, timing);
    const perf = activePerformanceConfig();

    // OEL stays hot. Do not hide this inside the medium lane.
    if (oelDisplayEnabled) {
      syncOelVideoPlayback();
    }

    // Side VU/readout is decorative, so it yields during playlist scroll.
    if (perf.sideVu && !scrollStress) {
      const sideVuStateChanged = lastSideVuPlayingState !== timing.playing;

      if (sideVuStateChanged) {
        lastSideVuPlayingState = timing.playing;
        sideVuSettleUntil = ts + SIDE_VU_SETTLE_MS;
      }

      if (
        sideVuStateChanged ||
        (ts < sideVuSettleUntil && ts - lastBarUpdateAt >= SIDE_VU_SETTLE_UPDATE_MS)
      ) {
        lastBarUpdateAt = ts;

        const visualizerPerfAt = pvfdPerfStart();
        updateBars(timing.playing);
        pvfdPerfEnd("sideVuBarsUpdate", visualizerPerfAt);
      }

      if (sideVuStateChanged || ts - lastSideVuReadoutAt >= SIDE_VU_READOUT_MS) {
        lastSideVuReadoutAt = ts;

        const readoutPerfAt = pvfdPerfStart();
        updateSideVuReadout();
        pvfdPerfEnd("sideVuReadoutUpdate", readoutPerfAt);
      }
    }

    // Medium DOM maintenance yields during playlist scroll.
    // Logo audio demand still gets checked occasionally so the main visualizer stays alive.
    if (scrollStress) {
      if (ts - lastScrollStressLogoDemandAt >= SCROLL_STRESS_LOGO_DEMAND_MS) {
        lastScrollStressLogoDemandAt = ts;
        syncLogoAudioDemand(logoGlowEnabled && timing.playing);
      }

      if (
        (pendingVolume !== null || knobLedDirty) &&
        ts - lastScrollStressKnobLedAt >= SCROLL_STRESS_KNOB_LED_MS
      ) {
        lastScrollStressKnobLedAt = ts;
        updateLknobLED();
      }
    } else if (ts - lastMediumLaneAt >= MEDIUM_LANE_INTERVAL_MS) {
      lastMediumLaneAt = ts;

      syncCurrentTrackFromPlayer(false, ts);
      updateOverlays(progressMs, timing, ts);
      syncLogoAudioDemand(logoGlowEnabled && timing.playing);

      if (pendingVolume !== null || knobLedDirty || ts - lastKnobLedAt >= EXTERNAL_VOLUME_LED_SAMPLE_MS) {
        lastKnobLedAt = ts;
        updateLknobLED();
      }
    }

    // Main logo visualizer audio stays hot.
    if (logoGlowEnabled && logoLiveAudioActive && ts - lastLogoLiveAudioUpdateAt >= LOGO_LIVE_AUDIO_SCHEDULER_MS) {
      lastLogoLiveAudioUpdateAt = ts;
      updateLogoLiveAudioPulse(ts);
    }

    // Main logo visualizer render stays hot.
    if (logoRenderState.dirty) {
      renderLogoVisuals(ts, false);
    }

    // Slow maintenance yields during playlist scroll.
    if (!scrollStress && ts - lastSlowLaneAt >= SLOW_LANE_INTERVAL_MS) {
      lastSlowLaneAt = ts;
      refreshPvfdPerfEnabled();
      updateRouteState(false, ts);
      }

    pvfdPerfEnd("mainLoopTotal", perfAt);
  }

  function onTrackChange() {
    markPlayerStateDirty();
    playerTimingCache.at = -Infinity;
    lastTrackSyncAt = -Infinity;
    syncCurrentTrackFromPlayer(true);
    const playBtn = chassis && chassis.querySelector("[data-pvfd='play']");
    if (playBtn) playBtn.textContent = Spicetify.Player.isPlaying() ? PVFD_PAUSE_GLYPH : PVFD_PLAY_GLYPH;
  }

  const LIBRARY_RECENTS_SELECTOR = [
    "button[aria-label*='Recents' i]",
    "[role='button'][aria-label*='Recents' i]",
    "button[title*='Recents' i]",
    "[role='button'][title*='Recents' i]",
    "[data-testid*='recents' i]",
    "[class*='recents' i]",
    "[class*='Recents']"
  ].join(",");
  let librarySearchFixTimer = 0;
  let pvfdMutationTimer = 0;
  let pvfdMutationFlushTimer = 0;
  let librarySearchLastRoot = null;
  let lyricsSyncFixTimer = 0;
  let lyricsSyncLastRoot = null;
  let lyricsViewCacheAt = -Infinity;
  let lyricsViewCache = false;


  function syncLibrarySearchState(container, input) {
    const hasText = !!input.value;
    container.classList.toggle("pvfd-filter-has-text", hasText);
  }

  function isGlobalSearchFocusTarget(target) {
    if (!target || !target.matches) return false;
    if (!target.matches("input, [role='searchbox'], [contenteditable='true']")) return false;
    return !!(target.closest && target.closest(
      ".Root__top-bar, .Root__globalNav, [data-testid*='global-nav' i], [class*='globalNav' i]"
    ));
  }

  function syncGlobalSearchFocus(target = document.activeElement) {
    const perfAt = pvfdPerfStart();
    const nextFocused = isGlobalSearchFocusTarget(target);
    if (nextFocused === globalSearchFocusState) {
      pvfdPerfEnd("globalSearchFocusSync", perfAt);
      return;
    }
    globalSearchFocusState = nextFocused;
    document.documentElement.classList.toggle("pvfd-global-search-focused", nextFocused);
    if (document.body && document.body.dataset) document.body.dataset.pvfdGlobalSearchFocused = nextFocused ? "1" : "0";
    pvfdPerfEnd("globalSearchFocusSync", perfAt);
  }

  function scheduleGlobalSearchFocusSync(target = document.activeElement, delay = 0) {
    pendingGlobalSearchFocusTarget = target;
    if (globalSearchFocusTimer) return;
    globalSearchFocusTimer = window.setTimeout(() => {
      globalSearchFocusTimer = 0;
      const nextTarget = pendingGlobalSearchFocusTarget || document.activeElement;
      pendingGlobalSearchFocusTarget = null;
      syncGlobalSearchFocus(nextTarget);
    }, delay);
  }

  function findLibraryToolbarParts(container) {
    let node = container && container.parentElement;
    for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
      if (node.matches && node.matches(".Root__nav-bar, nav[aria-label='Main'], aside, [role='navigation']")) break;
      const recents = node.querySelector && node.querySelector(LIBRARY_RECENTS_SELECTOR);
      if (recents) {
        return {
          toolbar: node,
          recents: (recents.closest && recents.closest("button, [role='button']")) || recents,
        };
      }
    }
    return { toolbar: null, recents: null };
  }

  function reconcileLibraryToolbar(container) {
    const { toolbar, recents } = findLibraryToolbarParts(container);
    if (toolbar && !patchedLibraryToolbars.has(toolbar)) {
      patchedLibraryToolbars.add(toolbar);
      toolbar.classList.add("pvfd-library-toolbar");
    }
    if (recents && !patchedLibraryRecentsControls.has(recents)) {
      patchedLibraryRecentsControls.add(recents);
      recents.classList.add("pvfd-library-recents-control");
    }
  }


  function isLibrarySearchContainer(container) {
    if (!container || !container.closest) return false;
    // Only the left Your Library search should receive the JS layout class.
    // Playlist / Local Files / Liked Songs search boxes live in .Root__main-view and must be styled by static CSS.
    if (container.closest(".Root__main-view, .main-view-container, .main-view-container__scroll-node")) return false;
    return !!container.closest(".Root__nav-bar, nav[aria-label='Main'], [role='navigation'], .main-yourLibraryX-library");
  }

  function collectLibrarySearchBoxes(root = document) {
    const scope = root && root.querySelectorAll ? root : document;
    const boxes = [];
    if (scope.matches && scope.matches(".x-filterBox-filterInputContainer")) boxes.push(scope);
    if (scope.querySelectorAll) scope.querySelectorAll(".x-filterBox-filterInputContainer").forEach((container) => boxes.push(container));
    return boxes;
  }

  function reconcileLibrarySearchBoxes(root = document) {
    const perfAt = pvfdPerfStart();
    collectLibrarySearchBoxes(root).forEach((container) => {
      if (!isLibrarySearchContainer(container)) {
        container.classList.remove("pvfd-library-search-box", "pvfd-filter-has-text");
        return;
      }
      const input = container.querySelector(".x-filterBox-filterInput");
      if (!input) return;

      if (!patchedLibrarySearchContainers.has(container)) {
        patchedLibrarySearchContainers.add(container);
        container.classList.add("pvfd-library-search-box");
      } else if (!container.classList.contains("pvfd-library-search-box")) {
        container.classList.add("pvfd-library-search-box");
      }
      reconcileLibraryToolbar(container);

      if (!patchedLibrarySearchInputs.has(input)) {
        patchedLibrarySearchInputs.add(input);
        const sync = () => syncLibrarySearchState(container, input);
        input.addEventListener("input", sync);
        input.addEventListener("change", sync);
        input.addEventListener("focus", sync);
        input.addEventListener("blur", sync);
      }
      syncLibrarySearchState(container, input);
    });
    pvfdPerfEnd("searchReconciliation", perfAt);
  }

  function scheduleLibrarySearchReconcile(root, delay = 120) {
    librarySearchLastRoot = root && root.querySelectorAll ? root : document;
    if (librarySearchFixTimer) return;
    const nextDelay = Math.max(delay, isRouteChurnActive() ? ROUTE_CHURN_SEARCH_DELAY_MS : 0);
    librarySearchFixTimer = window.setTimeout(() => {
      const nextRoot = librarySearchLastRoot || document;
      librarySearchFixTimer = 0;
      librarySearchLastRoot = null;
      reconcileLibrarySearchBoxes(nextRoot);
    }, nextDelay);
  }

  function elementFromMutationNode(node) {
    return node && node.nodeType === 1 ? node : null;
  }

  function findLibrarySearchBox(el, includeDescendants = false) {
    if (!el || !el.matches) return null;
    if (el.matches(".x-filterBox-filterInputContainer")) return el;
    const closestBox = el.closest && el.closest(".x-filterBox-filterInputContainer");
    if (closestBox) return closestBox;
    if (includeDescendants && el.querySelector) return el.querySelector(".x-filterBox-filterInputContainer");
    return null;
  }

  const BROWSE_FONT_TARGET_SELECTOR = ".Root__main-view, .main-view-container, .main-view-container__scroll-node";

  function containsBrowseFontTarget(el) {
    if (!el || !el.matches) return false;
    // Deliberately do not use closest() here. Route/card churn inside the main view
    // used to retrigger font propagation on almost every Home mutation even though
    // the inherited variables already existed on the view root.
    return el.matches(BROWSE_FONT_TARGET_SELECTOR);
  }

  function addedNodeContainsBrowseFontTarget(el) {
    if (!el || !el.matches) return false;
    return el.matches(BROWSE_FONT_TARGET_SELECTOR) || !!(el.querySelector && el.querySelector(BROWSE_FONT_TARGET_SELECTOR));
  }

  const LIBRARY_SEARCH_SCOPE_SELECTOR = ".Root__nav-bar, nav[aria-label='Main'], aside, [role='navigation'], .main-yourLibraryX-library";

  function isLibrarySearchMutationScope(el) {
    if (!el || !el.matches) return false;
    if (el.matches(".x-filterBox-filterInputContainer, .x-filterBox-filterInput")) return true;
    if (el.closest && el.closest(".x-filterBox-filterInputContainer")) return true;
    return el.matches(LIBRARY_SEARCH_SCOPE_SELECTOR) || !!(el.closest && el.closest(LIBRARY_SEARCH_SCOPE_SELECTOR));
  }

  const LYRICS_SCOPE_SELECTOR = [
    "[data-testid*='lyrics' i]",
    "[class*='lyrics-lyrics' i]",
    "[class*='LyricsLyrics' i]",
    "[class*='lyricsPage' i]",
    "[class*='LyricsPage' i]",
    ".lyrics-lyrics-container",
    ".lyrics-lyrics-background",
    ".lyrics-lyrics-contentContainer"
  ].join(", ");

  const LYRICS_SURFACE_SELECTOR = [
    ".lyrics-lyrics-container",
    "[class*='lyrics-lyrics-container' i]",
    "[class*='LyricsLyricsContainer' i]",
    ".lyrics-lyrics-background",
    "[class*='lyrics-lyrics-background' i]",
    "[class*='LyricsLyricsBackground' i]",
    ".lyrics-lyrics-contentContainer",
    "[class*='lyrics-lyrics-contentContainer' i]",
    "[class*='LyricsLyricsContent' i]"
  ].join(", ");

  function hasLyricsView() {
    const now = performance.now();
    if (now - lyricsViewCacheAt < 500) return lyricsViewCache;
    lyricsViewCacheAt = now;
    lyricsViewCache = !!document.querySelector(LYRICS_SCOPE_SELECTOR);
    return lyricsViewCache;
  }

  function collectButtons(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const buttons = [];
    if (scope.matches && scope.matches("button, [role='button']")) buttons.push(scope);
    scope.querySelectorAll("button, [role='button']").forEach((button) => buttons.push(button));
    return buttons;
  }

  function rootLooksLyricsScoped(root) {
    const scope = root && root.querySelectorAll ? root : document;
    if (scope === document) return true;
    return !!(
      (scope.matches && scope.matches(LYRICS_SCOPE_SELECTOR)) ||
      (scope.closest && scope.closest(LYRICS_SCOPE_SELECTOR)) ||
      (scope.querySelector && scope.querySelector(LYRICS_SCOPE_SELECTOR))
    );
  }

  function tagLyricsSurfaces(root = document) {
    const scope = root && root.querySelectorAll ? root : document;
    let tagged = 0;
    const surfaces = [];
    if (scope.matches && scope.matches(LYRICS_SURFACE_SELECTOR)) surfaces.push(scope);
    scope.querySelectorAll(LYRICS_SURFACE_SELECTOR).forEach((el) => surfaces.push(el));

    surfaces.forEach((el) => {
      if (!el || !el.classList) return;
      if (el.matches(".lyrics-lyrics-container, [class*='lyrics-lyrics-container' i], [class*='LyricsLyricsContainer' i]") && !el.classList.contains("pvfd-lyrics-surface")) {
        el.classList.add("pvfd-lyrics-surface");
        tagged++;
      }
      if (el.matches(".lyrics-lyrics-background, [class*='lyrics-lyrics-background' i]")) {
        el.classList.add("pvfd-lyrics-background");
      }
      if (el.matches(".lyrics-lyrics-contentContainer, [class*='lyrics-lyrics-contentContainer' i]")) {
        el.classList.add("pvfd-lyrics-content");
      }
    });

    return tagged;
  }

  function isLyricsSyncButton(button) {
    if (!button) return false;
    const label = [
      button.textContent,
      button.getAttribute && button.getAttribute("aria-label"),
      button.getAttribute && button.getAttribute("title")
    ].map((value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase()).filter(Boolean).join(" ");
    return label === "sync" || /\bsync\b/.test(label);
  }

  function reconcileLyricsSyncButtons(root = document) {
    const perfAt = pvfdPerfStart();
    if (!hasLyricsView() || !rootLooksLyricsScoped(root)) {
      pvfdPerfEnd("searchReconciliation", perfAt);
      return 0;
    }
    let tagged = tagLyricsSurfaces(root);
    collectButtons(root).forEach((button) => {
      if (isLyricsSyncButton(button)) {
        if (!patchedLyricsSyncButtons.has(button)) patchedLyricsSyncButtons.add(button);
        if (!button.classList.contains("pvfd-lyrics-sync-button")) {
          button.classList.add("pvfd-lyrics-sync-button");
          button.setAttribute("data-pvfd", "lyrics-sync");
        }
        tagged++;
      }
    });
    pvfdPerfEnd("searchReconciliation", perfAt);
    return tagged;
  }

  function scheduleLyricsSyncReconcile(root, delay = 120) {
    lyricsSyncLastRoot = root && root.querySelectorAll ? root : document;
    lyricsViewCacheAt = -Infinity;
    if (lyricsSyncFixTimer) return;
    lyricsSyncFixTimer = window.setTimeout(() => {
      const nextRoot = lyricsSyncLastRoot || document;
      lyricsSyncFixTimer = 0;
      lyricsSyncLastRoot = null;
      const tagged = reconcileLyricsSyncButtons(nextRoot);
      if (!tagged && nextRoot !== document) reconcileLyricsSyncButtons(document);
    }, delay);
  }

  function findLyricsSyncRoot(node, includeDescendants = false) {
    if (!node || !node.matches) return null;
    if (node.matches(LYRICS_SCOPE_SELECTOR)) return node;
    const closestLyrics = node.closest && node.closest(LYRICS_SCOPE_SELECTOR);
    if (closestLyrics) return closestLyrics;
    if (includeDescendants && node.querySelector && node.querySelector(LYRICS_SCOPE_SELECTOR)) return node;
    if (node.matches("button, [role='button']")) return node;
    if (includeDescendants && node.querySelector) return node.querySelector("button, [role='button']");
    return null;
  }

  function scheduleChassisRecheck() {
    if (chassis && chassis.isConnected) return;
    if (pvfdMutationTimer) return;
    pvfdMutationTimer = window.setTimeout(() => {
      pvfdMutationTimer = 0;
      if (!chassis || !chassis.isConnected) injectChassis();
    }, 250);
  }

  function flushMutationRecords() {
    const perfAt = pvfdPerfStart();
    pvfdMutationFlushTimer = 0;
    const work = {
      chassisRecheck: pvfdMutationWork.chassisRecheck,
      mainViewChurn: pvfdMutationWork.mainViewChurn,
      searchRoot: pvfdMutationWork.searchRoot,
      lyricsRoot: pvfdMutationWork.lyricsRoot,
      browseFontTarget: pvfdMutationWork.browseFontTarget,
      routeMaybeChanged: pvfdMutationWork.routeMaybeChanged,
    };
    pvfdMutationWork.chassisRecheck = false;
    pvfdMutationWork.mainViewChurn = false;
    pvfdMutationWork.searchRoot = null;
    pvfdMutationWork.lyricsRoot = null;
    pvfdMutationWork.browseFontTarget = false;
    pvfdMutationWork.routeMaybeChanged = false;
    if (!work.chassisRecheck && !work.mainViewChurn && !work.searchRoot && !work.lyricsRoot && !work.browseFontTarget && !work.routeMaybeChanged) {
      pvfdPerfEnd("mutationFlush", perfAt);
      return;
    }

    if (work.chassisRecheck) scheduleChassisRecheck();
    if (work.routeMaybeChanged) updateRouteState(true);
    if (work.browseFontTarget) applyBrowseFontPreset(false);
    if (work.searchRoot) scheduleLibrarySearchReconcile(work.searchRoot, work.mainViewChurn ? ROUTE_CHURN_SEARCH_DELAY_MS : 80);
    if (hasLyricsView() && work.lyricsRoot) scheduleLyricsSyncReconcile(work.lyricsRoot, work.mainViewChurn ? ROUTE_CHURN_SEARCH_DELAY_MS : 80);
    pvfdPerfEnd("mutationFlush", perfAt);
  }

  const MAIN_VIEW_MUTATION_SELECTOR = ".Root__main-view, .main-view-container, .main-view-container__scroll-node";

  function isMainViewMutationTarget(el) {
    if (!el || !el.matches) return false;
    return !!(
      el.matches(MAIN_VIEW_MUTATION_SELECTOR) ||
      (el.closest && el.closest(MAIN_VIEW_MUTATION_SELECTOR))
    );
  }

  function accumulateMutationNodeWork(el, includeDescendants = false) {
    if (!el || !el.matches) return;
    if (!pvfdMutationWork.browseFontTarget && addedNodeContainsBrowseFontTarget(el)) {
      pvfdMutationWork.browseFontTarget = true;
    }
    if (!pvfdMutationWork.mainViewChurn) {
      const mainViewHit = includeDescendants
        ? addedNodeContainsBrowseFontTarget(el) || isMainViewMutationTarget(el)
        : isMainViewMutationTarget(el);
      if (mainViewHit) {
        pvfdMutationWork.mainViewChurn = true;
        pvfdMutationWork.routeMaybeChanged = true;
        beginRouteChurn(CLIP_CACHE_ROUTE_REBUILD_BLOCK_MS);
        markClipCacheRebuildStress(CLIP_CACHE_ROUTE_REBUILD_BLOCK_MS);
      }
    }
    if (!pvfdMutationWork.searchRoot && isLibrarySearchMutationScope(el)) {
      pvfdMutationWork.searchRoot = findLibrarySearchBox(el, includeDescendants) || document;
    }
    if (!pvfdMutationWork.lyricsRoot) {
      const lyricsRoot = findLyricsSyncRoot(el, includeDescendants);
      if (lyricsRoot) pvfdMutationWork.lyricsRoot = lyricsRoot;
    }
  }

  function queueMutationRecords(records) {
    const perfAt = pvfdPerfStart();
    let hasWork = false;
    for (const record of records) {
      const target = elementFromMutationNode(record.target);
      if (chassis && target && chassis.contains(target)) continue;
      pvfdMutationWork.chassisRecheck = true;
      accumulateMutationNodeWork(target, false);
      for (const node of record.addedNodes || []) {
        accumulateMutationNodeWork(elementFromMutationNode(node), true);
      }
      hasWork = true;
    }
    if (!hasWork) {
      pvfdPerfEnd("mutationQueue", perfAt);
      return;
    }
    if (!pvfdMutationFlushTimer) {
      pvfdMutationFlushTimer = window.setTimeout(flushMutationRecords, MUTATION_FLUSH_DELAY_MS);
    }
    pvfdPerfEnd("mutationQueue", perfAt);
  }

  function recoverNativePlayerAfterFatal() {
    try {
      stopLogoGlowScheduler();
      if (chassis && chassis.parentNode) chassis.parentNode.removeChild(chassis);
      const bar = findPlayerBar();
      if (bar) {
        bar.classList.remove("pvfd-mounted");
        Array.from(bar.children).forEach((child) => {
          child.classList.remove("pvfd-native-player-hidden");
          if (child.getAttribute("aria-hidden") === "true") child.removeAttribute("aria-hidden");
        });
      }
      chassis = null;
      logoStrip = null;
      pvfdDom = null;
      canvas = null;
      ctx = null;
    } catch (recoverErr) {
      console.warn("[PVFD] Native player recovery failed:", recoverErr);
    }
  }

  function attach() {
    try {
      attachUnsafe();
    } catch (err) {
      console.error("[PVFD] Init failed; restored Spotify player and will retry.", err);
      recoverNativePlayerAfterFatal();
      window.__PVFD_EXTENSION_RUNNING__ = false;
      setTimeout(PioneerVFD, 1000);
    }
  }

   // home-page hover/pointer event suppression
  //extends from quicklinks-only to full home-page cards).
  //
  // Background (diagnosed May 7, 2026 via window-capture event blocking A/B):
  //   After leaving Home and returning, fast horizontal sweeps over the top
  //   quick-link tiles produced 100-130ms longtasks paced at the user's hover
  //   rate. Attribution from `long-animation-frame`:
  //     - `xpui-modules.js | tX`  (DIV#main mouseover listener)  ~99% forced layout
  //     - `xpui-modules.js | P`   (MessagePort.onmessage = React 18 scheduler)
  //                               ~86% forced layout
  //   Each pointer movement drove a chain of:
  //     mouseover -> tX reads layout (forced flush) -> tX writes React state
  //     -> React schedules commit -> P commits the fiber, writes DOM
  //     -> next mouseover/pointerover/pointermove -> tX flushes again.
  //
  //   Diagnostic A/B (window-capture stopImmediatePropagation per type):
  //     - block mouseover  alone -> still lags
  //     - block pointerover alone -> still lags
  //     - block pointermove alone -> still lags
  //     - block ALL of {mouseover, mouseout, mouseenter, mouseleave,
  //                     pointerover, pointerout, pointerenter, pointerleave,
  //                     pointermove, mousemove} -> buttery smooth
  //   Conclusion: Spotify's React commit work is fired redundantly by every
  //   hover-class event, so silencing only one type leaves the others as backup
  //   triggers. Blocking the entire family is the minimum sufficient set.
  //
  //   intra-tile mouseover coalescer was insufficient: mouseover-only,
  //   same-tile-only. Replaced by full-family block on the quicklinks
  //   grid. extends the same proven block to the rest of the home page
  //   (album/playlist cards and their chrome play-button containers), verified
  //   via the same window-capture A/B method on the cards surface.
  //
  // What this DOES suppress (capture phase on `window`, scoped to the
  // selectors below):
  //     mouseover, mouseout, mouseenter, mouseleave,
  //     pointerover, pointerout, pointerenter, pointerleave,
  //     pointermove, mousemove.
  //
  // Scopes (any element matching closest() of these gets its hover events killed):
  //   - `.view-homeShortcutsGrid-grid`         (top quicklink tiles)
  //   - `[data-testid="home-page"] .main-card-card`
  //   - `[data-testid="home-page"] [data-encore-id="card"]`
  //   - `[data-testid="home-page"] .main-card-cardContainer`
  //   - `[data-testid="home-page"] .main-card-PlayButtonContainer`
  //
  // What this does NOT touch:
  //   - any event outside home (other pages unaffected; fix is gated by
  //     `[data-testid="home-page"]` for the cards + a unique class for quicklinks)
  //   - click, auxclick, dblclick, contextmenu (-> tile/card activation works)
  //   - mousedown/up, pointerdown/up, touchstart/end (-> activation works)
  //   - focusin/focusout, keydown/up (-> keyboard nav + focus rings work)
  //   - drag, dragstart, dragend, dragover, drop (-> dnd unaffected)
  //   - wheel, scroll (-> scrolling unaffected)
  //   - CSS :hover (browser-internal, independent of JS event dispatch),
  //     so the visible hover glow / play-button reveal still appear.
  //
  // Disable at runtime for A/B testing without a reinstall:
  //     window.__pvfdDisableHoverBlock = true;
  const PVFD_HOVER_BLOCK_TYPES = [
    "mouseover", "mouseout", "mouseenter", "mouseleave",
    "pointerover", "pointerout", "pointerenter", "pointerleave",
    "pointermove", "mousemove"
  ];
  const PVFD_HOVER_BLOCK_SCOPE = [
    ".view-homeShortcutsGrid-grid",
    '[data-testid="home-page"] .main-card-card',
    '[data-testid="home-page"] [data-encore-id="card"]',
    '[data-testid="home-page"] .main-card-cardContainer',
    '[data-testid="home-page"] .main-card-PlayButtonContainer',
    '.main-rootlist-wrapper'
  ].join(", ");
  let pvfdHoverBlockInstalled = false;
  function pvfdHoverBlockHandler(e) {
    if (window.__pvfdDisableHoverBlock) return;
    const t = e.target;
    if (!t || !t.closest) return;
    if (!t.closest(PVFD_HOVER_BLOCK_SCOPE)) return;
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
  function installShortcutHoverBlock() {
    if (pvfdHoverBlockInstalled) return;
    pvfdHoverBlockInstalled = true;
    for (let i = 0; i < PVFD_HOVER_BLOCK_TYPES.length; i++) {
      window.addEventListener(
        PVFD_HOVER_BLOCK_TYPES[i],
        pvfdHoverBlockHandler,
        { capture: true, passive: true }
      );
    }
  }

  function onHomeShortcutPointerStress(event) {
    const target = event && event.target;
    if (!target || !target.closest) return;
    const nextShortcut = target.closest(".view-homeShortcutsGrid-shortcut");
    if (!nextShortcut) return;

    const relatedTarget = event.relatedTarget;
    const previousShortcut = (
      relatedTarget &&
      relatedTarget.closest &&
      relatedTarget.closest(".view-homeShortcutsGrid-shortcut")
    ) || null;

    // pointerover fires for child-boundary hops too; only mark stress when the
    // cursor actually crosses into a different quick-link tile.
    if (previousShortcut === nextShortcut) return;
    markClipCacheRebuildStress(CLIP_CACHE_HOME_POINTER_REBUILD_BLOCK_MS);
  }

  function onHomeShortcutPointerStress(event) {
    const target = event && event.target;
    if (!target || !target.closest) return;
    const nextShortcut = target.closest(".view-homeShortcutsGrid-shortcut");
    if (!nextShortcut) return;

    const relatedTarget = event.relatedTarget;
    const previousShortcut = (
      relatedTarget &&
      relatedTarget.closest &&
      relatedTarget.closest(".view-homeShortcutsGrid-shortcut")
    ) || null;

    // pointerover fires for child-boundary hops too; only mark stress when the
    // cursor actually crosses into a different quick-link tile.
    if (previousShortcut === nextShortcut) return;
    markClipCacheRebuildStress(CLIP_CACHE_HOME_POINTER_REBUILD_BLOCK_MS);
  }

  function attachUnsafe() {
    if (!injectChassis()) {
      setTimeout(attach, 500);
      return;
    }
    fontPresetIdx = readFontPresetIdx();
    tintIdx = readTintIdx();
    lcdDimmed = readDimEnabled();
    performanceModeIdx = readPerformanceModeIdx();
    logoGlowEnabled = readLogoGlowEnabled();
    oelDisplayEnabled = readOelDisplayEnabled();
    racingColorEnabled = readRacingColorEnabled();
    clipIdx = readClipIdx();
    refreshPvfdPerfEnabled();
    applyBrowseFontPreset(false);
    applyPerformanceMode(false);
    applyTintMode(false);
    applyDimMode(false);
    applyLogoGlowMode(false);
    applyOelDisplayMode(false);
    applyRacingColorMode(false);
    updateRouteState(true);
    reconcileLibrarySearchBoxes();
    reconcileLyricsSyncButtons();
    syncGlobalSearchFocus();
    onTrackChange();
    if (typeof Spicetify.Player.addEventListener === "function") {
      Spicetify.Player.addEventListener("songchange", onTrackChange);
      Spicetify.Player.addEventListener("onplaypause", () => {
        markPlayerStateDirty();
        const playing = safeReturn(() => Spicetify.Player.isPlaying(), false);
        const playBtn = chassis && chassis.querySelector("[data-pvfd='play']");
        if (playBtn) playBtn.textContent = playing ? PVFD_PAUSE_GLYPH : PVFD_PLAY_GLYPH;
      });
    } else {
      console.warn("[PVFD] Spicetify Player events unavailable; using polling-only sync.");
    }
    requestAnimationFrame(loop);

    const obs = new MutationObserver(queueMutationRecords);
    obs.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("focusin", (e) => {
      const box = e.target && e.target.closest && e.target.closest(".x-filterBox-filterInputContainer");
      if (box) scheduleLibrarySearchReconcile(box, 0);
      scheduleGlobalSearchFocusSync(e.target, 0);
    }, true);

    document.addEventListener("focusout", (e) => {
      if (isGlobalSearchFocusTarget(e.target)) scheduleGlobalSearchFocusSync(document.activeElement, 0);
    }, true);

    installShortcutHoverBlock();

    console.log("[PVFD] PioneerVFD online - Chromium live-audio PULSE + taller logo bars loaded.");
  }

  attach();
})();
