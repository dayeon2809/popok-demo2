/* @ds-bundle: {"namespace":"PocApp","components":[{"name":"ArtistCard","sourcePath":"components/general/ArtistCard/ArtistCard.jsx"},{"name":"ArtistModal","sourcePath":"components/general/ArtistModal/ArtistModal.jsx"},{"name":"AuthNav","sourcePath":"components/general/AuthNav/AuthNav.jsx"},{"name":"CountUp","sourcePath":"components/general/CountUp/CountUp.jsx"},{"name":"EmptyState","sourcePath":"components/general/EmptyState/EmptyState.jsx"},{"name":"ErrorMessage","sourcePath":"components/general/ErrorMessage/ErrorMessage.jsx"},{"name":"LoadingSpinner","sourcePath":"components/general/LoadingSpinner/LoadingSpinner.jsx"},{"name":"Logo3D","sourcePath":"components/general/Logo3D/Logo3D.jsx"},{"name":"PerformanceCard","sourcePath":"components/general/PerformanceCard/PerformanceCard.jsx"}],"sourceHashes":{"components/general/ArtistCard/ArtistCard.jsx":"ed54dc80894a","components/general/ArtistCard/ArtistCard.d.ts":"b2288c14b1e2","components/general/ArtistCard/ArtistCard.prompt.md":"19a657c9d47c","components/general/ArtistModal/ArtistModal.jsx":"3c48f4832e74","components/general/ArtistModal/ArtistModal.d.ts":"0e053d1ea61e","components/general/ArtistModal/ArtistModal.prompt.md":"fe252968eaa1","components/general/AuthNav/AuthNav.jsx":"76eefc089938","components/general/AuthNav/AuthNav.d.ts":"873a8de07525","components/general/AuthNav/AuthNav.prompt.md":"edd690fdb7b7","components/general/CountUp/CountUp.jsx":"5a27eab987a2","components/general/CountUp/CountUp.d.ts":"09c28904591d","components/general/CountUp/CountUp.prompt.md":"fe617fc8bfe5","components/general/EmptyState/EmptyState.jsx":"9932a1e81faf","components/general/EmptyState/EmptyState.d.ts":"1ab521b8fc80","components/general/EmptyState/EmptyState.prompt.md":"58f84cb8ae7c","components/general/ErrorMessage/ErrorMessage.jsx":"09a3bb5a1f55","components/general/ErrorMessage/ErrorMessage.d.ts":"efae6fe61407","components/general/ErrorMessage/ErrorMessage.prompt.md":"e275e798f18b","components/general/LoadingSpinner/LoadingSpinner.jsx":"7af3c606a2b0","components/general/LoadingSpinner/LoadingSpinner.d.ts":"656133fee072","components/general/LoadingSpinner/LoadingSpinner.prompt.md":"a7759298ff27","components/general/Logo3D/Logo3D.jsx":"f7bf565000fd","components/general/Logo3D/Logo3D.d.ts":"04a762d60010","components/general/Logo3D/Logo3D.prompt.md":"130371c62604","components/general/PerformanceCard/PerformanceCard.jsx":"f0385a6d11d3","components/general/PerformanceCard/PerformanceCard.d.ts":"6b0620ece300","components/general/PerformanceCard/PerformanceCard.prompt.md":"a34d307cac00"},"inlinedExternals":[],"builtBy":"cc-design-sync"} */
"use strict";
var PocApp = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <define:import.meta.env>
  var init_define_import_meta_env = __esm({
    "<define:import.meta.env>"() {
    }
  });

  // shim:react-shim
  var require_react_shim = __commonJS({
    "shim:react-shim"(exports, module) {
      init_define_import_meta_env();
      function getR() {
        return window.React;
      }
      function np(p, k) {
        var o = {};
        for (var x in p) if (x !== "children") o[x] = p[x];
        if (k !== void 0) o.key = k;
        return o;
      }
      function jsx7(t, p, k) {
        var R = getR();
        var c = p && p.children;
        return c === void 0 ? R.createElement(t, np(p, k)) : R.createElement(t, np(p, k), c);
      }
      function jsxs8(t, p, k) {
        var R = getR();
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports.jsx = jsx7;
      module.exports.jsxs = jsxs8;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs8 : jsx7)(t, p, k);
      };
      Object.defineProperty(module.exports, "Fragment", { get: function () { return getR() && getR().Fragment; }, configurable: true });
      Object.defineProperty(module.exports, "createElement", { get: function () { return getR() && getR().createElement; }, configurable: true });
      Object.defineProperty(module.exports, "useState", { get: function () { return getR() && getR().useState; }, configurable: true });
      Object.defineProperty(module.exports, "useEffect", { get: function () { return getR() && getR().useEffect; }, configurable: true });
      Object.defineProperty(module.exports, "useRef", { get: function () { return getR() && getR().useRef; }, configurable: true });
    }
  });

  // .design-sync/entry.tsx
  var entry_exports = {};
  __export(entry_exports, {
    ArtistCard: () => ArtistCard,
    ArtistModal: () => ArtistModal,
    AuthNav: () => AuthNav,
    CountUp: () => CountUp,
    EmptyState: () => EmptyState,
    ErrorMessage: () => ErrorMessage,
    LoadingSpinner: () => LoadingSpinner,
    Logo3D: () => Logo3D,
    PerformanceCard: () => PerformanceCard
  });
  init_define_import_meta_env();

  // components/CountUp.tsx
  init_define_import_meta_env();
  var import_react = __toESM(require_react_shim());
  var import_jsx_runtime = __toESM(require_react_shim());
  function CountUp({ end, duration = 1800, suffix = "" }) {
    const [count, setCount] = (0, import_react.useState)(0);
    const ref = (0, import_react.useRef)(null);
    const started = (0, import_react.useRef)(false);
    (0, import_react.useEffect)(() => {
      const el = ref.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const startTime = performance.now();
            const tick = (now) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(eased * end));
              if (progress < 1) requestAnimationFrame(tick);
              else setCount(end);
            };
            requestAnimationFrame(tick);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [end, duration]);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { ref, children: [
      count.toLocaleString(),
      suffix
    ] });
  }

  // components/Logo3D.tsx
  init_define_import_meta_env();
  var import_jsx_runtime2 = __toESM(require_react_shim());
  function Logo3D() {
    var uid = (0, import_jsx_runtime2.useState)(function(){ return "lg" + Math.random().toString(36).slice(2); })[0];
    var svgMarkup = [
      '<svg viewBox="0 0 240 225" width="100%" height="100%" style="overflow:visible;display:block">',
      '<defs>',
      '<linearGradient id="gFrost' + uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFDF7"/><stop offset="1" stop-color="#F2DFB8"/></linearGradient>',
      '<linearGradient id="gBand1' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFBF2"/><stop offset="1" stop-color="#FFEDD0"/></linearGradient>',
      '<linearGradient id="gBand2' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCE6A0"/><stop offset="1" stop-color="#F6C568"/></linearGradient>',
      '<linearGradient id="gBand3' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8AFC0"/><stop offset="1" stop-color="#ED7F98"/></linearGradient>',
      '<linearGradient id="gBand4' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCEFCB"/><stop offset="1" stop-color="#F2DDA0"/></linearGradient>',
      '<linearGradient id="gCherry' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9BAC"/><stop offset="1" stop-color="#D65A73"/></linearGradient>',
      '<linearGradient id="gPlate' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF6"/><stop offset="1" stop-color="#F3E6D2"/></linearGradient>',
      '<clipPath id="clipCut' + uid + '"><path d="M 130.00,109.00 Q 130.00,95.00 140.98,103.69 L 191.02,143.31 Q 202.00,152.00 188.95,157.07 L 143.05,174.93 Q 130.00,180.00 130.00,166.00 L 130.00,109.00 Z"/></clipPath>',
      '</defs>',
      '<ellipse cx="130" cy="210" rx="92" ry="16" fill="#D9B98A" opacity="0.35" style="filter:blur(5px)" class="pc-lg3d-shadow"/>',
      '<ellipse cx="130" cy="193" rx="100" ry="24" fill="#EAD6B4"/>',
      '<ellipse cx="130" cy="190" rx="100" ry="24" fill="url(#gPlate' + uid + ')"/>',
      '<g class="pc-lg3d-body">',
      '<path d="M 118.11,105.70 Q 130.00,95.00 130.00,111.00 L 130.00,164.00 Q 130.00,180.00 114.74,175.20 L 75.26,162.80 Q 60.00,158.00 71.89,147.30 L 118.11,105.70 Z" fill="url(#gFrost' + uid + ')" stroke="rgba(120,90,50,0.10)" stroke-width="1"/>',
      '<g clip-path="url(#clipCut' + uid + ')">',
      '<rect x="40" y="93" width="180" height="25" fill="url(#gBand1' + uid + ')"/>',
      '<rect x="40" y="118" width="180" height="37" fill="url(#gBand2' + uid + ')"/>',
      '<rect x="40" y="155" width="180" height="9" fill="url(#gBand3' + uid + ')"/>',
      '<rect x="40" y="164" width="180" height="21" fill="url(#gBand4' + uid + ')"/>',
      '</g>',
      '<path d="M 130.00,109.00 Q 130.00,95.00 140.98,103.69 L 191.02,143.31 Q 202.00,152.00 188.95,157.07 L 143.05,174.93 Q 130.00,180.00 130.00,166.00 L 130.00,109.00 Z" fill="none" stroke="rgba(120,90,50,0.12)" stroke-width="1"/>',
      '<ellipse cx="98" cy="128" rx="26" ry="13" fill="#fff" opacity="0.30" style="filter:blur(5px)" transform="rotate(-24 98 128)"/>',
      '<path d="M130,68 Q134,54 143,44" fill="none" stroke="#8A6A3C" stroke-width="2.5" stroke-linecap="round"/>',
      '<circle cx="130" cy="79" r="14" fill="url(#gCherry' + uid + ')"/>',
      '<ellipse cx="124" cy="74" rx="3.6" ry="2.4" fill="#fff" opacity="0.8"/>',
      '</g>',
      '<style>',
      '@keyframes pcLg3dFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }',
      '@keyframes pcLg3dShadow { 0%,100% { transform: scale(1); opacity: 0.75; } 50% { transform: scale(0.86); opacity: 0.45; } }',
      '.pc-lg3d-body { animation: pcLg3dFloat 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }',
      '.pc-lg3d-shadow { animation: pcLg3dShadow 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }',
      '</style>',
      '</svg>'
    ].join("");
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", {
      style: { width: "240px", height: "240px", display: "flex", alignItems: "center", justifyContent: "center" },
      dangerouslySetInnerHTML: { __html: svgMarkup }
    });
  }

  // components/ui/States.tsx
  init_define_import_meta_env();
  var import_jsx_runtime3 = __toESM(require_react_shim());
  function LoadingSpinner({ message = "\uBD88\uB7EC\uC624\uB294 \uC911..." }) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { textAlign: "center", padding: "80px 20px", color: "var(--ink-muted)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: {
        width: "36px",
        height: "36px",
        margin: "0 auto 16px",
        border: "3px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "0.88rem", fontWeight: 500 }, children: message }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })
    ] });
  }
  function ErrorMessage({ message }) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: {
      textAlign: "center",
      padding: "72px 20px",
      color: "var(--ink-muted)"
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: "2.4rem", marginBottom: "12px" }, children: "\u26A0\uFE0F" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }, children: "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "0.84rem", color: "var(--ink-muted)", marginBottom: "20px" }, children: message }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          onClick: () => window.location.reload(),
          style: {
            padding: "8px 20px",
            background: "var(--navy)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit"
          },
          children: "\uB2E4\uC2DC \uC2DC\uB3C4"
        }
      )
    ] });
  }
  function EmptyState({ message = "\uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { textAlign: "center", padding: "80px 20px", color: "var(--ink-muted)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: "2.4rem", marginBottom: "12px" }, children: "\u{1F50D}" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "6px" }, children: message }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "0.84rem" }, children: "\uB2E4\uB978 \uAC80\uC0C9\uC5B4\uB098 \uD544\uD130\uB97C \uC2DC\uB3C4\uD574\uBCF4\uC138\uC694." })
    ] });
  }

  // components/ArtistCard.tsx
  init_define_import_meta_env();

  // types/index.ts
  init_define_import_meta_env();
  var FIELD_LABELS = {
    all: "\uC804\uCCB4 \uBD84\uC57C",
    contemporary_dance: "\uD604\uB300\uBB34\uC6A9",
    ballet: "\uBC1C\uB808",
    korean_dance: "\uD55C\uAD6D\uBB34\uC6A9",
    interdisciplinary: "\uB2E4\uC6D0\uC608\uC220",
    unknown: "\uAE30\uD0C0"
  };
  var TYPE_LABELS = {
    all: "\uC804\uCCB4",
    individual: "\uAC1C\uC778 \uC548\uBB34\uAC00",
    company: "\uBB34\uC6A9\uB2E8\xB7\uB2E8\uCCB4",
    project_group: "\uD504\uB85C\uC81D\uD2B8\uD300"
  };

  // components/ArtistCard.tsx
  var import_jsx_runtime4 = __toESM(require_react_shim());
  function colorFromName(name) {
    const colors = ["#F5A623", "#1E2D40", "#4A8C6F", "#9B59B6", "#E06060", "#2980B9", "#F39C12", "#16A085"];
    let h = 0;
    for (const c of name) h = h * 31 + c.charCodeAt(0) & 4294967295;
    return colors[Math.abs(h) % colors.length];
  }
  function ArtistCard({ artist: a, onClick }) {
    const color = colorFromName(a.name);
    const initial = a.name.charAt(0);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "div",
      {
        className: "card",
        onClick,
        style: { cursor: "pointer", display: "flex", flexDirection: "column", width: "100%" },
        role: onClick ? "button" : void 0,
        tabIndex: onClick ? 0 : void 0,
        onKeyDown: onClick ? (e) => e.key === "Enter" && onClick() : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: {
            width: "100%",
            aspectRatio: "4/3",
            overflow: "hidden",
            background: a.profileImage || a.photo_url ? `url(${a.profileImage || a.photo_url}) center/cover no-repeat` : `linear-gradient(135deg, ${color}1A 0%, ${color}40 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }, children: [
            !(a.profileImage || a.photo_url) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: "3rem", fontWeight: 800, color, opacity: 0.45 }, children: initial }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { position: "absolute", top: "10px", right: "10px" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tag", style: { fontSize: "0.62rem" }, children: a.field ? FIELD_LABELS[a.field] ?? a.field : "" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "5px", flexGrow: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: "0.63rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }, children: a.type ? TYPE_LABELS[a.type] ?? a.type : "" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { style: { fontSize: "0.98rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2, letterSpacing: "-0.01em" }, children: a.name }),
            a.name_en && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { fontSize: "0.72rem", color: "var(--ink-muted)" }, children: a.name_en }),
            a.works && a.works.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { style: { fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "3px" }, children: [
              "\u3008",
              a.works[0],
              "\u3009",
              a.works.length > 1 && ` \uC678 ${a.works.length - 1}\uAC74`
            ] }) : a.representative_work ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { style: { fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "3px" }, children: [
              "\u3008",
              a.representative_work,
              "\u3009"
            ] }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", gap: "4px", marginTop: "auto", paddingTop: "10px", flexWrap: "wrap" }, children: [
              (a.instagram || a.instagram_url) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tag-navy", children: "IG" }),
              (a.website || a.website_url) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tag-navy", children: "Web" }),
              (a.verified === true || a.verification_status === "verified") && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: "0.6rem", padding: "2px 7px", borderRadius: "20px", background: "#E0F0E8", color: "var(--verified)", fontWeight: 700 }, children: "\u2713" })
            ] })
          ] })
        ]
      }
    );
  }

  // components/ArtistModal.tsx
  init_define_import_meta_env();
  var import_react2 = __toESM(require_react_shim());
  var import_jsx_runtime5 = __toESM(require_react_shim());
  function colorFromName2(name) {
    const colors = ["#F5A623", "#1E2D40", "#4A8C6F", "#9B59B6", "#E06060", "#2980B9", "#F39C12", "#16A085"];
    let h = 0;
    for (const c of name) h = h * 31 + c.charCodeAt(0) & 4294967295;
    return colors[Math.abs(h) % colors.length];
  }
  function ArtistModal({ artist: a, loading, error, onClose }) {
    const [toggledReviews, setToggledReviews] = (0, import_react2.useState)({});
    (0, import_react2.useEffect)(() => {
      const fn = (e) => e.key === "Escape" && onClose();
      document.addEventListener("keydown", fn);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", fn);
        document.body.style.overflow = "";
      };
    }, [onClose]);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "div",
      {
        className: "modal-overlay",
        onClick: (e) => e.target === e.currentTarget && onClose(),
        children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "modal-box", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              onClick: onClose,
              "aria-label": "\uB2EB\uAE30",
              style: {
                position: "absolute",
                top: "14px",
                right: "14px",
                zIndex: 10,
                border: "none",
                background: "rgba(255,255,255,0.88)",
                color: "var(--navy)",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
                fontWeight: 700,
                backdropFilter: "blur(4px)"
              },
              children: "\xD7"
            }
          ),
          loading && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { padding: "60px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(LoadingSpinner, { message: "\uC544\uD2F0\uC2A4\uD2B8 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911..." }) }),
          error && !loading && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { padding: "40px 20px" }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ErrorMessage, { message: error }) }),
          a && !loading && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
            (() => {
              const color = colorFromName2(a.name);
              return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: {
                width: "100%",
                height: "200px",
                borderRadius: "22px 22px 0 0",
                overflow: "hidden",
                background: a.profileImage || a.photo_url ? `url(${a.profileImage || a.photo_url}) center/cover no-repeat` : `linear-gradient(135deg, ${color}1A 0%, ${color}50 100%)`,
                display: "flex",
                alignItems: "flex-end",
                position: "relative"
              }, children: [
                !(a.profileImage || a.photo_url) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  fontSize: "5rem",
                  fontWeight: 800,
                  color,
                  opacity: 0.25
                }, children: a.name.charAt(0) }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { padding: "14px 20px", display: "flex", gap: "6px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tag", children: a.field ? FIELD_LABELS[a.field] ?? a.field : "" }),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tag-navy", children: a.type ? TYPE_LABELS[a.type] ?? a.type : "" })
                ] })
              ] });
            })(),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { padding: "22px 28px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { style: { fontSize: "1.65rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em", lineHeight: 1.15 }, children: a.name }),
                  a.name_en && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }, children: a.name_en })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: {
                  fontSize: "0.64rem",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  marginTop: "4px",
                  background: a.verified === true || a.verification_status === "verified" ? "#E0F0E8" : "#FEF3DC",
                  color: a.verified === true || a.verification_status === "verified" ? "var(--verified)" : "var(--needs-review)"
                }, children: a.verified === true || a.verification_status === "verified" ? "\u2713 \uAC80\uC99D\uB428" : "\uAC80\uD1A0 \uD544\uC694" })
              ] }),
              (a.company || a.organization_or_affiliation || a.festival_or_venue) && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { style: { fontSize: "0.82rem", color: "var(--ink-muted)", marginTop: "8px" }, children: [
                "\u{1F4CD} ",
                a.company || a.organization_or_affiliation || a.festival_or_venue,
                a.year ? ` \xB7 ${a.year}` : ""
              ] }),
              (a.website || a.website_url || a.instagram || a.instagram_url || a.video_url) && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }, children: [
                (a.website || a.website_url) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href: a.website || a.website_url, target: "_blank", rel: "noopener noreferrer", style: linkBtnStyle("navy"), children: "\u{1F310} \uC6F9\uC0AC\uC774\uD2B8" }),
                (a.instagram || a.instagram_url) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href: a.instagram || a.instagram_url, target: "_blank", rel: "noopener noreferrer", style: linkBtnStyle("accent"), children: "\u{1F4F7} Instagram" }),
                a.video_url && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href: a.video_url, target: "_blank", rel: "noopener noreferrer", style: linkBtnStyle("outline"), children: "\u25B6 \uC601\uC0C1" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { padding: "0 28px 32px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Divider, {}),
              (a.bio || a.bio_short) && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginBottom: "20px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SectionLabel, { children: "\uC18C\uAC1C" }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.75 }, children: a.bio || a.bio_short })
              ] }),
              a.works && a.works.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginBottom: "20px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(SectionLabel, { children: [
                  "\uC791\uD488 \uBAA9\uB85D (",
                  a.works.length,
                  ")"
                ] }),
                a.works.map((w, i) => {
                  const title = typeof w === "string" ? w : w.title || "";
                  const year = typeof w === "string" ? null : w.year;
                  const venue = typeof w === "string" ? "" : w.venue || w.festival || "";
                  const sourceUrl = typeof w === "string" ? "" : w.source_url || "";
                  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: {
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start"
                  }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: "0.7rem", color: "var(--ink-faint)", fontWeight: 600, minWidth: "36px", paddingTop: "2px" }, children: year ?? i + 1 }),
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { flex: 1 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { fontWeight: 700, fontSize: "0.9rem", color: "var(--navy)" }, children: [
                          "\u3008",
                          title,
                          "\u3009"
                        ] }),
                        venue && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { marginLeft: "8px", fontSize: "0.78rem", color: "var(--ink-muted)" }, children: venue })
                      ] }),
                      (() => {
                        const workReviews = a.reviews ? a.reviews.filter((r) => r.workTitle === title) : [];
                        if (workReviews.length === 0) return null;
                        const isExpanded = !!toggledReviews[title];
                        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginTop: "4px" }, children: [
                          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                setToggledReviews((prev) => ({ ...prev, [title]: !prev[title] }));
                              },
                              style: {
                                background: "transparent",
                                border: "none",
                                color: "var(--accent-dark)",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px"
                              },
                              children: [
                                "\uAD00\uB828 \uB9AC\uBDF0 \uBCF4\uAE30 ",
                                isExpanded ? "\u25B2" : "\u25BC"
                              ]
                            }
                          ),
                          isExpanded && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { style: {
                            listStyle: "none",
                            padding: "6px 10px",
                            margin: "4px 0 0",
                            background: "var(--accent-light)",
                            borderRadius: "6px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                            border: "1px solid var(--accent)"
                          }, children: workReviews.map((rev, revIdx) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { style: { fontSize: "0.78rem", display: "flex", alignItems: "center" }, children: [
                            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { marginRight: "4px", color: "var(--accent-dark)" }, children: "\u2022" }),
                            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                              "a",
                              {
                                href: rev.url,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                style: {
                                  color: "var(--ink)",
                                  textDecoration: "underline",
                                  fontWeight: 500
                                },
                                children: rev.source
                              }
                            )
                          ] }, revIdx)) })
                        ] });
                      })()
                    ] }),
                    sourceUrl && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                      "a",
                      {
                        href: sourceUrl,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        style: { fontSize: "0.68rem", color: "var(--accent-dark)", textDecoration: "none", fontWeight: 700 },
                        children: "\uCD9C\uCC98\u2197"
                      }
                    )
                  ] }, i);
                })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginBottom: "20px", background: "var(--accent-light)", padding: "16px", borderRadius: "12px", border: "1.5px solid var(--accent)" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SectionLabel, { style: { color: "var(--accent-dark)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }, children: "\u{1F916} AI Summary" }),
                a.aiSummary ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.6, marginBottom: "8px", whiteSpace: "pre-line" }, children: a.aiSummary }),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 500, borderTop: "1px solid var(--border)", paddingTop: "6px", marginTop: "6px" }, children: "* \uC774 \uC694\uC57D\uC740 \uB300\uD45C\uC791 \uC18C\uAC1C\uC640 \uACF5\uAC1C\uB41C \uC790\uB8CC\uB97C \uBC14\uD0D5\uC73C\uB85C \uC0DD\uC131\uB41C AI \uC694\uC57D\uC785\uB2C8\uB2E4." })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "0.8rem", color: "var(--ink-muted)" }, children: "\uC544\uC9C1 AI Summary\uAC00 \uC900\uBE44\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginBottom: "20px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SectionLabel, { children: "\uC778\uD130\uBDF0 \uBC0F \uAE30\uD0C0 \uAE30\uC0AC" }),
                (() => {
                  const generalReviews = a.reviews ? a.reviews.filter((r) => r.workTitle === "GENERAL") : [];
                  if (generalReviews.length > 0) {
                    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { style: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "5px" }, children: generalReviews.map((rev, revIdx) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { style: { fontSize: "0.82rem", display: "flex", alignItems: "center" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { marginRight: "5px", color: "var(--accent-dark)" }, children: "\u2022" }),
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                        "a",
                        {
                          href: rev.url,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          style: {
                            color: "var(--ink)",
                            textDecoration: "underline",
                            fontWeight: 600
                          },
                          children: rev.source
                        }
                      )
                    ] }, revIdx)) });
                  } else {
                    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "0.8rem", color: "var(--ink-faint)" }, children: "\uB4F1\uB85D\uB41C \uB9AC\uBDF0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." });
                  }
                })()
              ] }),
              a.tags && a.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginBottom: "20px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SectionLabel, { children: "\uD0DC\uADF8" }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: a.tags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tag", children: t }, t)) })
              ] }),
              a.source_file && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { paddingTop: "14px", borderTop: "1px solid var(--border)" }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { style: { fontSize: "0.64rem", color: "var(--ink-faint)", fontWeight: 500 }, children: [
                "source: ",
                a.source_file
              ] }) })
            ] })
          ] })
        ] })
      }
    );
  }
  function Divider() {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { height: "1.5px", background: "var(--border)", margin: "18px 0" } });
  }
  function SectionLabel({ children, style }) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: {
      fontSize: "0.67rem",
      fontWeight: 700,
      color: "var(--ink-muted)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "10px",
      ...style
    }, children });
  }
  function linkBtnStyle(variant) {
    const base = {
      textDecoration: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "0.8rem",
      fontWeight: 700,
      display: "inline-block"
    };
    if (variant === "navy") return { ...base, background: "var(--navy)", color: "#fff" };
    if (variant === "accent") return { ...base, background: "var(--accent)", color: "var(--navy)" };
    return { ...base, border: "1.5px solid var(--border)", color: "var(--ink)" };
  }

  // components/AuthNav.tsx
  init_define_import_meta_env();
  var import_react3 = __toESM(require_react_shim());

  // .design-sync/mocks/next-link.tsx
  init_define_import_meta_env();
  function Link({ href, children, ...rest }) {
    return /* @__PURE__ */ React.createElement("a", { href, ...rest }, children);
  }

  // .design-sync/mocks/supabase.ts
  init_define_import_meta_env();
  function getLoggedInUser() {
    return null;
  }
  function logout() {
  }

  // components/AuthNav.tsx
  var import_jsx_runtime6 = __toESM(require_react_shim());
  function AuthNav() {
    const [user, setUser] = (0, import_react3.useState)(null);
    (0, import_react3.useEffect)(() => {
      setUser(getLoggedInUser());
      const handleAuthChange = () => {
        setUser(getLoggedInUser());
      };
      window.addEventListener("poc-auth-change", handleAuthChange);
      return () => {
        window.removeEventListener("poc-auth-change", handleAuthChange);
      };
    }, []);
    const handleLogout = () => {
      logout();
      setUser(null);
      window.dispatchEvent(new Event("poc-auth-change"));
      window.location.href = "/";
    };
    if (!user) {
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        Link,
        {
          href: "/login",
          style: {
            textDecoration: "none",
            fontSize: "0.82rem",
            fontWeight: 700,
            padding: "8px 20px",
            border: "1.5px solid var(--navy)",
            color: "var(--navy)",
            borderRadius: "22px",
            transition: "all 0.15s"
          },
          onMouseOver: (e) => {
            e.currentTarget.style.background = "var(--accent-light)";
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent-dark)";
          },
          onMouseOut: (e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--navy)";
            e.currentTarget.style.color = "var(--navy)";
          },
          children: "\uB85C\uADF8\uC778"
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: "16px", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Link, { href: "/profile", style: {
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: 700,
        color: "var(--navy)",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "img",
          {
            src: user.avatarUrl,
            alt: user.nickname,
            style: {
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1px solid var(--border-dark)",
              objectFit: "cover"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: user.nickname })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "button",
        {
          onClick: handleLogout,
          style: {
            background: "transparent",
            border: "none",
            color: "var(--ink-muted)",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 0
          },
          children: "\uB85C\uADF8\uC544\uC6C3"
        }
      )
    ] });
  }

  // components/PerformanceCard.tsx
  init_define_import_meta_env();

  // lib/performances.ts
  init_define_import_meta_env();
  function formatImageUrl(urlStr) {
    if (!urlStr) return "";
    try {
      const trimmed = urlStr.trim();
      let decoded = trimmed;
      try {
        decoded = decoded.replace(/%28/gi, "(").replace(/%29/gi, ")");
        decoded = decodeURI(decoded);
      } catch (e) {
        decoded = trimmed.replace(/%28/gi, "(").replace(/%29/gi, ")");
      }
      let encoded = encodeURI(decoded);
      encoded = encoded.replace(/\(/g, "%28").replace(/\)/g, "%29");
      return encoded;
    } catch (e) {
      return urlStr;
    }
  }
  function getPerformancePosterUrl(p) {
    if (p.imageUrl && p.imageUrl.trim() !== "") {
      return formatImageUrl(p.imageUrl);
    }
    if (p.posterImage && p.posterImage.trim() !== "") {
      return formatImageUrl(p.posterImage);
    }
    return void 0;
  }

  // components/PerformanceCard.tsx
  var import_jsx_runtime7 = __toESM(require_react_shim());
  function colorFromName3(name) {
    const colors = ["#F5A623", "#1E2D40", "#4A8C6F", "#9B59B6", "#E06060", "#2980B9", "#F39C12", "#16A085"];
    let h = 0;
    for (const c of name) h = h * 31 + c.charCodeAt(0) & 4294967295;
    return colors[Math.abs(h) % colors.length];
  }
  function PerformanceCard({ performance: p, onClick }) {
    const color = colorFromName3(p.title);
    const initial = p.title.charAt(0);
    const posterUrl = getPerformancePosterUrl(p);
    const formatDateRange = () => {
      if (!p.startDate) return "\uC77C\uC815 \uBBF8\uC815";
      if (!p.endDate || p.startDate === p.endDate) return p.startDate;
      return `${p.startDate} ~ ${p.endDate}`;
    };
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        className: "card",
        onClick,
        style: { cursor: "pointer", display: "flex", flexDirection: "column", width: "100%", height: "100%" },
        role: onClick ? "button" : void 0,
        tabIndex: onClick ? 0 : void 0,
        onKeyDown: onClick ? (e) => e.key === "Enter" && onClick() : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: {
            width: "100%",
            aspectRatio: "3/4",
            // Standard poster ratio (portrait)
            overflow: "hidden",
            background: posterUrl ? `url(${posterUrl}) center/cover no-repeat` : `linear-gradient(135deg, ${color}2A 0%, ${color}4B 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }, children: [
            !posterUrl && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "20px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { fontSize: "3.6rem", fontWeight: 900, color, opacity: 0.6 }, children: initial }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)", textAlign: "center", opacity: 0.8 }, children: p.title })
            ] }),
            p.genre && p.genre.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { position: "absolute", top: "12px", right: "12px", display: "flex", gap: "4px" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "tag", style: { fontSize: "0.6rem", padding: "3px 8px" }, children: p.genre[1] || p.genre[0] }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { padding: "16px", display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { fontSize: "0.65rem", fontWeight: 800, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }, children: p.company || "\uAE30\uD0C0 \uB2E8\uCCB4" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { style: {
              fontSize: "1.05rem",
              fontWeight: 800,
              color: "var(--navy)",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              margin: "2px 0"
            }, children: p.title }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { marginTop: "auto", display: "flex", flexDirection: "column", gap: "4px", paddingTop: "8px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { style: { fontSize: "0.78rem", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: "4px" }, children: [
                "\u{1F4C5} ",
                formatDateRange()
              ] }),
              p.venue && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { style: { fontSize: "0.78rem", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: "4px" }, children: [
                "\u{1F4CD} ",
                p.venue
              ] })
            ] })
          ] })
        ]
      }
    );
  }
  return __toCommonJS(entry_exports);
})();
window.PocApp=PocApp.__dsMainNs?Object.assign({},PocApp,PocApp.__dsMainNs,{__dsMainNs:undefined}):PocApp;
