@import url('https://fonts.googleapis.com/css2?family=Gloock&family=Lexend:wght@400;500;600&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
@import 'tailwindcss';

:root {
  --brand-orange: #ad3603;
  --brand-navy: #0a2e44;
  --brand-magenta: #960238;
  --brand-teal: #166868;
  --neutral-0: #ffffff;
  --neutral-50: #fafafa;
  --neutral-100: #f2f2f2;
  --neutral-200: #d9d9d9;
  --neutral-700: #4a4a4a;
  --neutral-950: #111111;
  --font-display: 'Gloock', Georgia, serif;
  --font-body: 'Public Sans', Arial, sans-serif;
  --font-ui: 'Lexend', Arial, sans-serif;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --radius-control: 0.625rem;
  --radius-card: 0.75rem;
  --radius-sheet: 1rem;
  --type-body: 1rem;
  --type-caption: 0.875rem;
  --size-touch-target: 48px;
  --type-onboarding: clamp(2.25rem, 7.5vw, 3rem);
  --radius-pill: 999px;
  color: var(--neutral-950);
  font-family: var(--font-body);
  font-synthesis: none;
}

@layer base {
  html,
  body,
  #root {
    width: 100%;
    min-height: 100%;
  }

  body {
    margin: 0;
    background: #e9e7e2;
    color: var(--neutral-950);
  }

  button {
    cursor: pointer;
  }

  button:focus-visible,
  [tabindex]:focus-visible {
    outline: 0.1875rem solid var(--brand-navy);
    outline-offset: 0.1875rem;
  }
}

.app-shell {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  width: 100%;
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
  background: var(--neutral-50);
}

.main-header {
  z-index: 5;
  display: flex;
  min-height: 6.75rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: max(1rem, env(safe-area-inset-top)) var(--space-5) var(--space-4);
  background: color-mix(in srgb, var(--neutral-50) 94%, transparent);
  border-bottom: 1px solid var(--neutral-200);
  backdrop-filter: blur(1rem);
}

.main-header .eyebrow {
  display: none;
}

.eyebrow,
.language-label {
  margin: 0 0 var(--space-1);
  color: var(--brand-orange);
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  line-height: 1.4;
  text-transform: uppercase;
}

.main-header h1 {
  margin: 0;
  color: var(--brand-navy);
  font-family: var(--font-display);
  font-size: clamp(2.25rem, 9vw, 3rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1;
}

.dictionary-button,
.primary-button {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 0;
  border-radius: var(--radius-control);
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  transition: background 120ms ease, color 120ms ease, transform 120ms ease;
}

.dictionary-button {
  width: 3.5rem;
  min-width: 3.5rem;
  height: 3.5rem;
  padding: 0;
  color: var(--brand-navy);
  background: color-mix(in srgb, var(--brand-navy) 8%, transparent);
  border-radius: 50%;
}

.dictionary-button svg {
  width: 1.4rem;
}

.dictionary-button span {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.floating-dictionary-button {
  position: absolute;
  z-index: 12;
  top: max(var(--space-4), env(safe-area-inset-top));
  right: var(--space-5);
  box-shadow: 0 0.5rem 1.5rem rgb(10 46 68 / 0.12);
}

.package-context {
  position: absolute;
  z-index: 11;
  top: max(var(--space-4), env(safe-area-inset-top));
  left: 50%;
  display: flex;
  min-height: 3.5rem;
  max-width: calc(100% - 10rem);
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
  pointer-events: none;
}

.package-pill {
  padding: var(--space-2) var(--space-4);
  border-radius: 999px;
  color: var(--brand-navy);
  background: color-mix(in srgb, var(--brand-navy) 8%, var(--neutral-0));
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
}

.dictionary-button:active,
.primary-button:active,
.icon-button:active {
  transform: scale(0.96);
}

.feed-region {
  position: relative;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scroll-behavior: smooth;
  scroll-snap-type: y mandatory;
  scrollbar-width: thin;
  scrollbar-color: var(--neutral-200) transparent;
}

.word-card {
  position: relative;
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-5);
  background: var(--neutral-0);
  border-bottom: 1px solid var(--neutral-200);
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.word-card:nth-of-type(even) {
  background: var(--neutral-0);
}

.word-number {
  position: absolute;
  top: var(--space-5);
  left: var(--space-5);
  color: var(--neutral-700);
  font-family: var(--font-ui);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.word-content {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  transform: translateY(-4%);
}

.word-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.word-card h2 {
  margin: 0;
  color: var(--neutral-950);
  font-family: var(--font-display);
  font-size: clamp(3.5rem, 16vw, 5.25rem);
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 1.04;
}

.pronunciation-row {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-4);
  padding-left: var(--space-4);
  color: var(--brand-navy);
  background: color-mix(in srgb, var(--brand-navy) 8%, transparent);
  border-radius: 999px;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.meaning {
  max-width: 32rem;
  margin: var(--space-6) 0 var(--space-5);
  color: var(--neutral-950);
  font-size: clamp(1.125rem, 4vw, 1.4rem);
  line-height: 1.55;
}

.meaning span {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--neutral-700);
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.word-meta {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  color: var(--neutral-700);
  font-family: var(--font-ui);
  font-size: 0.8125rem;
}

.icon-button {
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  flex: 0 0 3rem;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--brand-navy);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
  transition: color 120ms ease, background 120ms ease, transform 120ms ease;
}

.icon-button svg {
  width: 1.35rem;
  height: 1.35rem;
}

.audio-button {
  width: 2.75rem;
  height: 2.75rem;
  flex-basis: 2.75rem;
  color: var(--brand-navy);
  background: transparent;
  border-color: transparent;
}

.audio-button.is-playing {
  color: var(--neutral-0);
  background: var(--brand-orange);
  border-color: var(--brand-orange);
}

.info-button {
  width: 3rem;
  height: 3rem;
  flex-basis: 3rem;
  color: var(--brand-navy);
  border-color: var(--neutral-200);
}

.info-button:hover {
  color: var(--brand-orange);
  background: color-mix(in srgb, var(--brand-orange) 12%, transparent);
}

.is-loading {
  animation: pulse 900ms ease-in-out infinite;
}

.audio-note {
  margin: var(--space-2) 0 0;
  color: var(--brand-magenta);
  font-size: 0.875rem;
}

.feed-end-mark {
  display: flex;
  height: 5rem;
  align-items: center;
  justify-content: center;
  background: var(--neutral-50);
  scroll-snap-align: end;
}

.feed-end-mark span {
  width: 2rem;
  height: 0.1875rem;
  background: var(--brand-orange);
}

.loading-region {
  background: var(--neutral-0);
}

.skeleton-card {
  display: block;
}

.skeleton {
  border-radius: var(--radius-control);
  background: linear-gradient(90deg, var(--neutral-100) 25%, #e7e7e7 45%, var(--neutral-100) 65%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-kicker {
  width: 4.5rem;
  height: 0.75rem;
}

.skeleton-word {
  width: 55%;
  height: 3.5rem;
  margin-top: var(--space-4);
}

.skeleton-meaning {
  width: 76%;
  height: 1.125rem;
  margin-top: var(--space-4);
}

.skeleton-meta {
  width: 6.5rem;
  height: 0.875rem;
  margin-top: var(--space-6);
}

.next-batch {
  border-top: 1px solid var(--neutral-200);
}

.state-panel,
.dictionary-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: var(--space-8) var(--space-5);
  text-align: center;
}

.state-panel h2,
.dictionary-empty h1,
.tooltip-card h2 {
  margin: var(--space-3) 0;
  color: var(--brand-navy);
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.15;
}

.state-panel p,
.dictionary-empty > p:not(.eyebrow),
.tooltip-card > p:not(.eyebrow) {
  max-width: 28rem;
  margin: 0 0 var(--space-6);
  color: var(--neutral-700);
  font-size: 1rem;
  line-height: 1.55;
}

.state-icon,
.dictionary-mark {
  display: flex;
  width: 4rem;
  height: 4rem;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-3);
  color: var(--brand-magenta);
  background: color-mix(in srgb, var(--brand-magenta) 12%, transparent);
  border-radius: 50%;
}

.dictionary-mark {
  color: var(--brand-navy);
  background: color-mix(in srgb, var(--brand-navy) 8%, transparent);
}

.state-icon svg,
.dictionary-mark svg {
  width: 1.75rem;
}

.primary-button {
  min-width: 8rem;
  padding: 0 var(--space-5);
  color: var(--neutral-0);
  background: var(--brand-orange);
}

.primary-button:hover {
  background: var(--brand-navy);
}

.primary-button svg {
  width: 1.125rem;
}

.tooltip-scrim {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-4);
  background: color-mix(in srgb, var(--neutral-950) 72%, transparent);
}

.tooltip-card {
  width: min(100%, 34rem);
  padding: var(--space-3) var(--space-6) max(1.5rem, env(safe-area-inset-bottom));
  background: var(--neutral-0);
  border-radius: var(--radius-sheet);
  box-shadow: 0 1.25rem 3.5rem rgb(0 0 0 / 0.22);
  animation: sheet-in 200ms ease-out;
}

.tooltip-card .primary-button {
  width: 100%;
}

.tooltip-handle {
  width: 2.5rem;
  height: 0.25rem;
  margin: 0 auto var(--space-6);
  background: var(--neutral-200);
  border-radius: 999px;
}

.bottom-nav {
  z-index: 10;
  padding-bottom: env(safe-area-inset-bottom);
  background: color-mix(in srgb, var(--neutral-0) 96%, transparent);
  border-top: 1px solid var(--neutral-200);
  backdrop-filter: blur(1rem);
}

.bottom-nav [role='tablist'] {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  min-height: 4.75rem;
}

.nav-tab {
  position: relative;
  display: flex;
  min-width: 3rem;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.2rem;
  padding: var(--space-2) var(--space-1);
  color: var(--neutral-700);
  background: transparent;
  border: 0;
  font-family: var(--font-ui);
  font-size: 0.6875rem;
  font-weight: 500;
}

.nav-icon {
  display: flex;
  width: 2.5rem;
  height: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.nav-icon svg {
  width: 1.35rem;
}

.nav-tab.is-selected {
  color: var(--brand-navy);
  font-weight: 600;
}

.nav-tab.is-selected .nav-icon {
  background: color-mix(in srgb, var(--brand-orange) 12%, transparent);
}

.nav-tab.is-selected::before {
  position: absolute;
  top: 0;
  width: 1.75rem;
  height: 0.1875rem;
  content: '';
  background: var(--brand-orange);
}

.topbar {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  justify-content: space-between;
  padding: max(0.75rem, env(safe-area-inset-top)) var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--neutral-200);
}

.topbar-title {
  margin: 0;
  color: var(--brand-navy);
  font-family: var(--font-ui);
  font-weight: 600;
}

.topbar-spacer {
  width: 3rem;
}

.dictionary-screen {
  grid-template-rows: auto 1fr;
}

body:has(.dictionary-drawer) { overflow-x: clip; }

.dictionary-drawer {
  position: fixed;
  z-index: 40;
  inset: 0;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr);
  margin-inline: auto;
  background: var(--neutral-50);
  animation: dictionary-enter 280ms ease-out both;
}

.dictionary-drawer.is-closing {
  pointer-events: none;
  animation: dictionary-exit 200ms ease-in both;
}

.dictionary-header {
  display: flex;
  min-height: 5.5rem;
  align-items: center;
  gap: var(--space-3);
  padding: max(var(--space-4), env(safe-area-inset-top)) var(--space-5) var(--space-4);
  background: var(--neutral-50);
}

.dictionary-back {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-control);
  background: var(--neutral-0);
}

.dictionary-header h1 {
  margin: 0;
  color: var(--brand-navy);
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.2;
}

.dictionary-controls { min-width: 0; padding: 0 var(--space-5); border-bottom: 1px solid var(--neutral-200); }
.dictionary-search { display: flex; min-height: 3.5rem; align-items: center; gap: var(--space-3); padding-left: var(--space-4); border: 1px solid var(--neutral-200); border-radius: var(--radius-control); background: var(--neutral-0); }
.dictionary-search:focus-within { border-color: var(--brand-navy); outline: 2px solid var(--brand-navy); outline-offset: 2px; }
.dictionary-search > svg { width: var(--space-5); height: var(--space-5); flex: 0 0 var(--space-5); color: var(--neutral-700); }
.dictionary-search input { width: 100%; min-width: 0; min-height: 3.5rem; padding: var(--space-3) var(--space-2) var(--space-3) 0; border: 0; outline: 0; color: var(--neutral-950); background: transparent; font-family: var(--font-body); font-size: var(--type-body); line-height: 1.5; }
.dictionary-search input::placeholder { color: var(--neutral-700); opacity: 1; }
.dictionary-search input::-webkit-search-cancel-button { appearance: none; }
.dictionary-search .dictionary-clear { margin-right: var(--space-1); }
.dictionary-filters { display: flex; gap: var(--space-2); overflow-x: auto; overscroll-behavior-x: contain; margin: 0 calc(-1 * var(--space-5)); padding: var(--space-4) var(--space-5); scrollbar-width: none; }
.dictionary-filters::-webkit-scrollbar { display: none; }
.dictionary-filter { display: inline-flex; min-height: 3rem; flex: 0 0 auto; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: 1px solid var(--neutral-200); border-radius: var(--radius-pill); color: var(--neutral-700); background: var(--neutral-0); font-family: var(--font-ui); font-size: var(--type-caption); line-height: 1.5; transition: background 120ms, color 120ms; }
.dictionary-filter svg { width: var(--space-4); height: var(--space-4); }
.dictionary-filter.is-selected { border-color: var(--brand-navy); color: var(--neutral-0); background: var(--brand-navy); }
.dictionary-list { min-width: 0; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain; padding: var(--space-5) var(--space-5) max(var(--space-8), env(safe-area-inset-bottom)); scrollbar-width: thin; scrollbar-color: var(--neutral-200) transparent; }
.dictionary-list-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--space-2); margin: 0 0 var(--space-4); color: var(--neutral-700); font-family: var(--font-ui); font-size: var(--type-caption); line-height: 1.5; }
.dictionary-word-card { margin-bottom: var(--space-4); padding: var(--space-5); border: 1px solid var(--neutral-200); border-radius: var(--radius-card); background: var(--neutral-0); overflow-wrap: anywhere; }
.dictionary-word-top { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
.dictionary-word-top > div { min-width: 0; flex: 1 1 8rem; }
.dictionary-word-top h2 { margin: 0 0 var(--space-2); overflow-wrap: anywhere; color: var(--brand-navy); font-family: var(--font-display); font-size: 2.25rem; font-weight: 400; line-height: 1.15; letter-spacing: -0.035em; }
.dictionary-pronunciation { margin: 0; color: var(--neutral-700); font-size: var(--type-body); line-height: 1.5; }
.dictionary-audio { border-color: var(--neutral-200); color: var(--brand-navy); background: var(--neutral-50); }
.dictionary-audio.is-playing { border-color: var(--brand-orange); color: var(--neutral-0); background: var(--brand-orange); }
.dictionary-definition { margin: var(--space-5) 0 var(--space-4); }
.dictionary-word-class { margin: 0 0 var(--space-1); color: var(--neutral-700); font-family: var(--font-ui); font-size: var(--type-caption); line-height: 1.5; text-transform: capitalize; }
.dictionary-meaning { color: var(--neutral-950); font-size: var(--type-body); line-height: 1.6; }
.dictionary-register { padding-top: var(--space-2); border-top: 1px solid var(--neutral-200); color: var(--neutral-700); font-size: var(--type-caption); line-height: 1.6; }
.dictionary-register summary { display: flex; min-height: 3rem; align-items: center; justify-content: space-between; gap: var(--space-3); cursor: pointer; list-style: none; }
.dictionary-register summary::-webkit-details-marker { display: none; }
.dictionary-register summary:focus-visible { outline: 2px solid var(--brand-navy); outline-offset: 2px; border-radius: var(--space-1); }
.dictionary-register summary > span { display: inline-flex; min-width: 0; align-items: center; gap: var(--space-2); color: var(--brand-teal); font-family: var(--font-ui); font-size: var(--type-caption); }
.dictionary-register-label { min-width: 0; }
.dictionary-register summary svg { width: var(--space-4); height: var(--space-4); flex: 0 0 var(--space-4); }
.dictionary-register-affordance { transition: transform 120ms; }
.dictionary-register[open] .dictionary-register-affordance { transform: rotate(180deg); }
.dictionary-register > p { padding: 0 0 var(--space-2); font-size: var(--type-body); }
.dictionary-audio-note { margin-top: var(--space-3); color: var(--brand-magenta); font-size: var(--type-caption); line-height: 1.5; }
.dictionary-empty-state { display: flex; min-height: 70%; align-items: center; justify-content: center; flex-direction: column; padding: var(--space-8) var(--space-4); text-align: center; }
.dictionary-empty-state > svg { width: 2.75rem; height: 2.75rem; margin-bottom: var(--space-5); color: var(--brand-navy); }
.dictionary-empty-state h2 { margin-bottom: var(--space-3); color: var(--brand-navy); font-family: var(--font-display); font-size: 1.75rem; font-weight: 400; line-height: 1.3; }
.dictionary-empty-state p { max-width: 24rem; color: var(--neutral-700); font-size: var(--type-body); line-height: 1.6; }
.dictionary-skeleton { min-height: 15rem; }
.dictionary-skeleton-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
.dictionary-skeleton-lemma { width: 45%; height: 2.5rem; }
.dictionary-skeleton-audio { width: 3rem; height: 3rem; border-radius: 50%; }
.dictionary-skeleton-pronunciation { width: 25%; height: var(--space-4); margin-top: var(--space-2); }
.dictionary-skeleton-meaning { width: 80%; height: var(--space-5); margin-top: var(--space-6); }
.dictionary-skeleton-register { width: 35%; height: var(--space-4); margin-top: var(--space-6); }
@keyframes dictionary-enter { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes dictionary-exit { from { transform: translateX(0); } to { transform: translateX(100%); } }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.onboarding-shell {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--neutral-50);
}

.onboarding-top {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: max(var(--space-6), env(safe-area-inset-top)) var(--space-6) var(--space-3);
}

.clata-wordmark {
  color: var(--brand-navy);
  font-family: var(--font-display);
  font-size: 2rem;
  letter-spacing: -0.05em;
}

.onboarding-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.clata-wordmark > span { color: var(--brand-orange); }

.onboarding-skip {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  color: var(--neutral-700);
  font-family: var(--font-ui);
  font-size: var(--type-caption);
}

.onboarding-skip svg { width: var(--space-4); }

.onboarding-body {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
}

.onboarding-art {
  display: flex;
  min-height: 17rem;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  overflow: hidden;
}

.editorial-word-stack {
  position: relative;
  width: 20rem;
  height: 18rem;
}

.paper-word {
  position: absolute;
  display: flex;
  width: 12rem;
  min-height: 12rem;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  padding: var(--space-6);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-card);
  box-shadow: 0 var(--space-2) var(--space-6) rgb(10 46 68 / 0.07);
}

.paper-word > span {
  font-family: var(--font-ui);
  font-size: 0.5625rem;
  font-weight: 500;
  letter-spacing: 0.12em;
}

.paper-word strong {
  margin: var(--space-3) 0 var(--space-2);
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 400;
  letter-spacing: -0.04em;
}

.paper-word em { font-size: var(--type-caption); font-style: normal; }
.paper-word svg { width: var(--space-6); margin-bottom: var(--space-4); }
.paper-word-back { top: var(--space-8); left: var(--space-2); color: var(--brand-navy); background: var(--neutral-0); transform: rotate(-10deg); }
.paper-word-front { top: 3.5rem; right: var(--space-1); color: var(--neutral-0); background: var(--brand-navy); border-color: var(--brand-navy); transform: rotate(8deg); }

.onboarding-copy {
  width: 100%;
  max-width: 34rem;
  margin: auto;
  padding: var(--space-6);
}

.onboarding-copy h1 {
  margin: 0 0 var(--space-4);
  color: var(--brand-navy);
  font-family: var(--font-display);
  font-size: var(--type-onboarding);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.12;
}

.onboarding-copy h1:focus { outline: none; }

.onboarding-description {
  margin: 0;
  color: var(--neutral-700);
  font-size: var(--type-body);
  line-height: 1.6;
}

.onboarding-footer {
  width: 100%;
  max-width: 34rem;
  flex-shrink: 0;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6) max(var(--space-6), env(safe-area-inset-bottom));
}

.onboarding-next { width: 100%; min-height: 3.5rem; justify-content: space-between; padding: var(--space-4) var(--space-5); font-size: var(--type-body); }
.onboarding-next svg { width: var(--space-5); }

.local-art { display: flex; align-items: center; flex-direction: column; gap: var(--space-6); }
.local-art-ring { position: relative; display: flex; width: 11rem; height: 11rem; align-items: center; justify-content: center; border: 1px solid var(--neutral-200); border-radius: 50%; }
.local-art-symbol { display: flex; width: 8rem; height: 8rem; align-items: center; justify-content: center; border: 1px solid var(--neutral-200); border-radius: var(--radius-sheet); background: var(--neutral-0); transform: rotate(-7deg); }
.local-art-symbol svg { width: 3rem; height: 3rem; color: var(--brand-navy); }
.local-art-check { position: absolute; right: var(--space-3); bottom: var(--space-4); display: flex; width: 2.5rem; height: 2.5rem; align-items: center; justify-content: center; border: 4px solid var(--neutral-50); border-radius: 50%; color: var(--neutral-0); background: var(--brand-teal); }
.local-art-check svg { width: var(--space-5); }
.local-art-caption { color: var(--neutral-700); font-size: var(--type-caption); }

.age-form { margin-top: var(--space-6); }
.age-form select { width: 100%; min-height: 3.5rem; padding: var(--space-4); border: 1px solid var(--neutral-200); border-radius: var(--radius-control); color: var(--neutral-950); background: var(--neutral-0); font-family: var(--font-ui); font-size: var(--type-body); }
.age-form select:focus-visible { outline: 2px solid var(--brand-navy); outline-offset: 2px; }
.age-form select[aria-invalid='true'] { border-color: var(--brand-magenta); }
.age-error { margin-top: var(--space-3); color: var(--brand-magenta); font-size: var(--type-body); line-height: 1.5; }
.preparation-list { margin-top: var(--space-6); }
.preparation-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; color: var(--neutral-700); font-size: var(--type-caption); }
.preparation-row.is-done { color: var(--brand-teal); }
.prep-status,
.prep-spinner { display: flex; width: var(--space-6); height: var(--space-6); flex: 0 0 var(--space-6); align-items: center; justify-content: center; border: 1px solid var(--neutral-200); border-radius: 50%; font-family: var(--font-ui); font-size: 0.75rem; }
.prep-status svg { width: var(--space-4); }
.is-done .prep-status { color: var(--neutral-0); background: var(--brand-teal); border-color: var(--brand-teal); }
.prep-spinner { color: transparent; border: 2px solid var(--neutral-200); border-top-color: var(--brand-orange); animation: preparation-spin 900ms linear infinite; }
.preparation-footer { margin: 0; color: var(--neutral-700); text-align: center; font-size: var(--type-caption); }
.onboarding-check { display: flex; align-items: center; justify-content: center; color: var(--brand-navy); }

.onboarding-package-screen .onboarding-body {
  justify-content: center;
}

.onboarding-package-screen .onboarding-copy {
  padding-top: var(--space-8);
  padding-bottom: var(--space-8);
}

.onboarding-package-area {
  position: relative;
  display: grid;
  min-height: 20rem;
  margin-top: var(--space-8);
}

.onboarding-package-list {
  grid-area: 1 / 1;
  list-style: none;
  padding: 0;
  margin: 0;
}

.onboarding-package-list.is-installing {
  opacity: 0.15;
}

.onboarding-package-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-card);
  background: var(--neutral-0);
}

.onboarding-package-icon {
  display: flex;
  width: 3rem;
  height: 3rem;
  flex: 0 0 3rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-control);
  color: var(--brand-navy);
  background: color-mix(in srgb, var(--brand-navy) 8%, transparent);
}

.onboarding-package-icon svg { width: var(--space-6); height: var(--space-6); }
.onboarding-package-details { min-width: 0; flex: 1; }
.onboarding-package-details h2 { margin-bottom: var(--space-2); color: var(--brand-navy); font-family: var(--font-ui); font-size: var(--type-body); font-weight: 500; line-height: 1.5; }
.onboarding-package-details > p { color: var(--neutral-700); font-size: var(--type-body); line-height: 1.5; }
.onboarding-package-selected { width: var(--space-5); height: var(--space-5); flex: 0 0 var(--space-5); color: var(--brand-teal); }
.onboarding-package-content { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: var(--space-4) 0; }
.onboarding-package-content span { padding: var(--space-1) var(--space-2); border-radius: var(--space-1); color: var(--brand-navy); background: var(--neutral-100); font-family: var(--font-ui); font-size: var(--type-caption); line-height: 1.5; }
.onboarding-package-details > .onboarding-package-bundled { font-size: var(--type-caption); }
.onboarding-install-overlay { position: relative; grid-area: 1 / 1; align-self: start; padding: var(--space-6); border: 1px solid var(--neutral-200); border-radius: var(--radius-sheet); background: var(--neutral-0); box-shadow: 0 var(--space-2) var(--space-6) rgb(10 46 68 / 0.06); }
.onboarding-install-symbol { display: flex; width: 3rem; height: 3rem; align-items: center; justify-content: center; margin-bottom: var(--space-4); border-radius: 50%; color: var(--brand-navy); background: color-mix(in srgb, var(--brand-navy) 8%, transparent); }
.onboarding-install-symbol.is-ready { color: var(--brand-teal); background: color-mix(in srgb, var(--brand-teal) 10%, transparent); }
.onboarding-install-symbol > svg { width: var(--space-6); height: var(--space-6); }
.onboarding-install-overlay h2 { color: var(--brand-navy); font-family: var(--font-ui); font-size: var(--type-body); font-weight: 500; line-height: 1.5; }
.onboarding-install-overlay .preparation-list { margin-top: var(--space-3); }

.has-practice-session { grid-template-rows: minmax(0, 1fr); }
.practice-screen {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: var(--space-6);
  background: var(--neutral-50);
}
.practice-header {
  padding: max(var(--space-6), env(safe-area-inset-top)) var(--space-6) var(--space-6);
}
.practice-header h1 {
  margin: 0;
  color: var(--brand-navy);
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.practice-home-body { padding: 0 var(--space-6); }
.practice-cards { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-4); }
.practice-mode-label { margin: 0; color: var(--neutral-700); font-family: var(--font-ui); font-size: 1.25rem; font-weight: 500; letter-spacing: 0.08em; line-height: 1.5; }
.practice-mode-card {
  display: flex;
  min-width: 0;
  width: 100%;
  min-height: 8rem;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-card);
  color: var(--brand-navy);
  background: var(--neutral-0);
  text-align: left;
  overflow-wrap: anywhere;
  transition: border-color 120ms, background 120ms;
}
.practice-mode-card:hover { border-color: var(--brand-navy); }
.practice-mode-dialog { grid-column: 1; }
.practice-card-icon { display: flex; width: 2.75rem; height: 2.75rem; flex: 0 0 2.75rem; align-items: center; justify-content: center; border-radius: var(--radius-control); color: var(--brand-orange); background: color-mix(in srgb, var(--brand-orange) 8%, transparent); }
.practice-card-icon svg { width: var(--space-6); height: var(--space-6); }
.practice-card-copy { display: flex; min-width: 0; width: 100%; flex: 1; flex-direction: column; }
.practice-card-title { margin-bottom: var(--space-2); font-family: var(--font-body); font-size: 1.375rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
.practice-card-description { color: var(--neutral-700); font-size: var(--type-body); line-height: 1.5; }
.practice-recovery { display: grid; width: 100%; min-height: 3rem; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: var(--space-2) var(--space-4); padding: var(--space-4); margin: 0 0 var(--space-5); border: 1px solid var(--brand-navy); border-radius: var(--radius-card); background: var(--neutral-0); text-align: left; transition: border-color 120ms; }
.practice-recovery:hover { border-color: var(--brand-navy); }
.practice-recovery-title { grid-column: 1; color: var(--brand-navy); font-family: var(--font-ui); font-size: var(--type-body); font-weight: 500; line-height: 1.5; }
.practice-recovery-description { grid-column: 1; color: var(--neutral-700); font-size: var(--type-caption); line-height: 1.5; }
.practice-recovery-history { grid-column: 2; grid-row: 1 / 3; align-self: center; width: var(--space-6); height: var(--space-6); color: var(--brand-navy); }
.practice-text-button { display: inline-flex; min-height: 3rem; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); color: var(--brand-navy); font-family: var(--font-ui); font-size: var(--type-caption); text-decoration: underline; text-underline-offset: var(--space-1); }
.practice-loading,
.practice-empty { display: flex; min-height: 14rem; align-items: center; justify-content: center; flex-direction: column; gap: var(--space-4); padding: var(--space-6); text-align: center; }
.practice-empty > svg { width: var(--space-8); height: var(--space-8); color: var(--brand-navy); }
.practice-empty h2 { font-family: var(--font-ui); font-size: var(--type-body); font-weight: 500; }
.practice-empty p { color: var(--neutral-700); font-size: var(--type-body); line-height: 1.5; }
.practice-topbar { display: flex; min-height: 5rem; align-items: center; justify-content: space-between; gap: var(--space-3); padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-5) var(--space-3); border-bottom: 1px solid var(--neutral-200); color: var(--brand-navy); font-family: var(--font-ui); font-size: var(--type-caption); }
.practice-topbar h1 { font-size: var(--type-body); font-weight: 500; line-height: 1.5; }

.guess-setup-screen {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding-bottom: 0;
  overflow: hidden;
}
.guess-setup-topbar {
  display: grid;
  grid-template-columns: var(--size-touch-target) minmax(0, 1fr) var(--size-touch-target);
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-1);
  padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--neutral-200);
}
.guess-setup-topbar h1 {
  min-width: 0;
  color: var(--brand-navy);
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
  overflow-wrap: anywhere;
}
.guess-setup-topbar .icon-button { width: var(--size-touch-target); height: var(--size-touch-target); }
.guess-setup-body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  padding: var(--space-5);
}
.guess-setup-context { display: flex; flex-shrink: 0; flex-wrap: wrap; align-items: flex-start; gap: var(--space-2); }
.guess-setup-context .package-pill { font-size: var(--type-caption); }
.guess-setup-main {
  display: flex;
  min-width: 0;
  width: 100%;
  flex: 1 0 auto;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: var(--space-8) 0;
  text-align: center;
}
.guess-setup-illustration { display: block; width: min(100%, 20rem); height: auto; flex-shrink: 0; margin-bottom: var(--space-6); }
.guess-art-paper { fill: var(--neutral-0); stroke: var(--neutral-200); stroke-width: 1.5; }
.guess-art-rule { fill: var(--neutral-200); }
.guess-art-front { fill: var(--brand-navy); }
.guess-art-question { fill: none; stroke: var(--neutral-0); stroke-width: 5; stroke-linecap: round; }
.gap-art-blank { fill: none; stroke: var(--brand-orange); stroke-width: 2; stroke-dasharray: 5 4; }
.guess-art-choice { fill: none; stroke: var(--neutral-0); stroke-width: 1; }
.guess-art-choice-selected { fill: var(--brand-orange); }
.guess-art-rule-light { stroke: var(--neutral-0); stroke-width: 3; stroke-linecap: round; }
.guess-art-tick { fill: none; stroke: var(--neutral-0); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.guess-art-lens { fill: var(--neutral-0); stroke: var(--brand-orange); stroke-width: 6; }
.guess-art-handle { fill: none; stroke: var(--brand-orange); stroke-width: 10; stroke-linecap: round; }
.guess-art-lens-tick { fill: none; stroke: var(--brand-navy); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.guess-setup-instruction { max-width: 24rem; margin: 0 0 var(--space-5); color: var(--brand-navy); font-family: var(--font-body); font-size: 1.125rem; line-height: 1.5; }
.guess-setup-details { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-3) var(--space-5); color: var(--neutral-700); font-family: var(--font-body); font-size: var(--type-caption); line-height: 1.5; }
.guess-setup-details > span { display: inline-flex; align-items: center; gap: var(--space-2); }
.guess-setup-details svg { width: var(--space-5); height: var(--space-5); flex: 0 0 var(--space-5); color: var(--brand-navy); }
.guess-setup-footer { flex-shrink: 0; padding: var(--space-4) var(--space-5) max(var(--space-5), env(safe-area-inset-bottom)); border-top: 1px solid var(--neutral-200); background: var(--neutral-50); }
.guess-setup-footer .practice-full-button { justify-content: center; }
.guess-setup-screen .practice-save-error { flex-shrink: 0; }
.conversation-setup-screen .guess-setup-body { overflow-x: hidden; }
.conversation-setup-screen .guess-setup-main { padding-top: var(--space-5); padding-bottom: var(--space-3); }
.conversation-setup-screen .conversation-setup-illustration { width: min(100%, 12rem); margin-bottom: var(--space-3); }
.conversation-setup-screen .guess-setup-instruction { margin-bottom: var(--space-2); }
.conversation-carousel-wrap { align-self: center; width: calc(100% + 2 * var(--space-5)); min-width: 0; }
.conversation-carousel { --topic-card-width: min(78vw, 22rem); position: relative; display: flex; align-items: stretch; gap: var(--space-3); width: 100%; overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none; padding: var(--space-4) calc((100% - var(--topic-card-width)) / 2) var(--space-5); }
.conversation-carousel::-webkit-scrollbar { display: none; }
.conversation-topic-card { display: flex; min-width: 0; flex: 0 0 var(--topic-card-width); align-items: flex-start; flex-direction: column; padding: var(--space-5); border: 2px solid var(--neutral-200); border-radius: var(--radius-sheet); color: var(--neutral-950); background: var(--neutral-0); text-align: left; scroll-snap-align: center; scroll-snap-stop: always; transform: scale(0.9); transition: transform 200ms ease, border-color 120ms; overflow-wrap: anywhere; }
.conversation-topic-card.is-selected { border-color: var(--brand-navy); box-shadow: 0 var(--space-1) var(--space-4) rgb(10 46 68 / 0.06); transform: scale(1); }
.conversation-topic-card:focus-visible { outline-offset: -6px; }
.conversation-topic-kicker { margin-bottom: var(--space-2); color: var(--neutral-700); font-family: var(--font-ui); font-size: var(--type-caption); line-height: 1.5; }
.conversation-topic-title { margin-bottom: var(--space-2); color: var(--brand-navy); font-family: var(--font-body); font-size: 1.25rem; font-weight: 700; line-height: 1.4; }
.conversation-topic-description { margin-bottom: var(--space-4); color: var(--neutral-700); font-size: var(--type-body); line-height: 1.5; }
.conversation-topic-roles { display: grid; width: 100%; gap: var(--space-3); padding-top: var(--space-4); margin-top: auto; border-top: 1px solid var(--neutral-200); }
.conversation-topic-roles > span { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--type-body); line-height: 1.5; }
.conversation-role-label { color: var(--neutral-700); font-family: var(--font-ui); font-size: var(--type-caption); }
@media (max-height: 42rem) {
  .guess-setup-main { padding: var(--space-5) 0; }
  .guess-setup-illustration { width: min(100%, 15rem); margin-bottom: var(--space-4); }
}

.practice-setup { max-width: 36rem; margin: auto; padding: var(--space-8) var(--space-6); }
.practice-setup-icon { display: flex; width: 4rem; height: 4rem; align-items: center; justify-content: center; margin-bottom: var(--space-6); border-radius: var(--radius-sheet); color: var(--brand-navy); background: color-mix(in srgb, var(--brand-navy) 8%, transparent); }
.practice-setup-icon svg { width: var(--space-8); height: var(--space-8); }
.practice-setup > .package-pill { display: inline-flex; margin-bottom: var(--space-5); font-size: var(--type-caption); }
.practice-setup h1 { margin: 0 0 var(--space-4); color: var(--brand-navy); font-family: var(--font-display); font-size: 2.5rem; font-weight: 400; letter-spacing: -0.035em; line-height: 1.15; }
.practice-setup > p { margin-bottom: var(--space-6); color: var(--neutral-700); font-size: var(--type-body); line-height: 1.6; }
.practice-session-details { display: flex; flex-wrap: wrap; gap: var(--space-3) var(--space-5); margin: var(--space-6) 0 var(--space-8); padding: var(--space-4) 0; border-top: 1px solid var(--neutral-200); border-bottom: 1px solid var(--neutral-200); color: var(--neutral-700); font-size: var(--type-caption); }
.practice-full-button { display: flex; width: 100%; min-height: 3.5rem; gap: var(--space-3); justify-content: space-between; padding: var(--space-4) var(--space-5); font-size: var(--type-body); }
.practice-full-button svg { width: var(--space-5); flex: 0 0 var(--space-5); }
.practice-full-button:disabled { cursor: not-allowed; color: var(--neutral-700); background: var(--neutral-200); }
.practice-dialog-options { display: flex; flex-direction: column; gap: var(--space-3); margin: var(--space-6) 0; }
.practice-session { display: flex; flex-direction: column; }
.practice-question-progress { display: flex; gap: var(--space-1); padding: var(--space-4) var(--space-6) 0; }
.practice-question-progress span { min-width: 0; height: var(--space-1); flex: 1; border-radius: var(--radius-pill); background: var(--neutral-200); }
.practice-question-progress .is-filled { background: var(--brand-teal); }
.practice-question-body { flex: 1; padding: var(--space-6); }
.practice-question-type { margin-bottom: var(--space-5); color: var(--neutral-700); font-family: var(--font-ui); font-size: var(--type-caption); }
.practice-prompt { min-height: 9rem; margin-bottom: var(--space-6); }
.practice-prompt h2 { color: var(--brand-navy); font-family: var(--font-display); font-size: 1.875rem; font-weight: 400; line-height: 1.35; white-space: pre-line; }
.practice-answers { display: flex; flex-direction: column; gap: var(--space-3); }
.practice-answer { display: flex; width: 100%; min-height: 3.75rem; align-items: center; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--neutral-200); border-radius: var(--radius-card); color: var(--neutral-950); background: var(--neutral-0); font-size: var(--type-body); line-height: 1.5; text-align: left; }
.practice-answer > svg { width: var(--space-5); height: var(--space-5); flex: 0 0 var(--space-5); margin-left: auto; }
.practice-answer.is-selected { border: 2px solid var(--brand-navy); padding: calc(var(--space-4) - 1px); background: color-mix(in srgb, var(--brand-navy) 8%, var(--neutral-0)); }
.practice-answer.is-correct { border-color: var(--brand-teal); }
.practice-answer-letter { display: flex; width: var(--space-6); height: var(--space-6); flex: 0 0 var(--space-6); align-items: center; justify-content: center; border: 1px solid var(--neutral-200); border-radius: var(--space-1); font-family: var(--font-ui); font-size: var(--type-caption); }
.practice-answer.is-selected .practice-answer-letter { border-color: var(--brand-navy); color: var(--neutral-0); background: var(--brand-navy); }
.practice-feedback-slot { min-height: 13rem; padding-top: var(--space-5); }
.practice-feedback { padding: var(--space-4); border: 1px solid var(--brand-teal); border-radius: var(--radius-card); background: color-mix(in srgb, var(--brand-teal) 6%, var(--neutral-0)); font-size: var(--type-body); line-height: 1.5; }
.practice-feedback > div { display: flex; align-items: flex-start; gap: var(--space-2); color: var(--brand-teal); }
.practice-feedback svg { width: var(--space-5); flex: 0 0 var(--space-5); margin-top: var(--space-1); }
.practice-feedback strong { font-weight: 600; }
.practice-feedback p { margin-top: var(--space-3); color: var(--neutral-700); }
.practice-feedback .practice-example { color: var(--neutral-950); }
.feedback-incorrect { border-color: var(--brand-magenta); background: color-mix(in srgb, var(--brand-magenta) 5%, var(--neutral-0)); }
.feedback-incorrect > div { color: var(--brand-magenta); }
.practice-question-footer { position: sticky; bottom: 0; margin-top: auto; padding: var(--space-4) var(--space-6) max(var(--space-4), env(safe-area-inset-bottom)); border-top: 1px solid var(--neutral-200); background: var(--neutral-50); }
.structured-question-screen { height: 100%; overflow: hidden; padding-bottom: 0; }
.structured-question-screen .practice-topbar,
.structured-question-screen .practice-question-progress { flex-shrink: 0; }
.structured-question-screen .practice-question-body { display: flex; min-height: 0; flex: 1; flex-direction: column; overflow-y: auto; padding: var(--space-5); }
.guess-word-stage { display: flex; flex: 1 0 auto; flex-direction: column; justify-content: center; padding-bottom: var(--space-5); }
.guess-word-prompt { display: flex; min-height: 11rem; align-items: center; justify-content: center; padding: var(--space-6); border-radius: var(--radius-sheet); background: var(--brand-teal); text-align: center; }
.guess-word-prompt h2 { color: var(--neutral-0); font-family: var(--font-body); font-size: 2.25rem; font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
.guess-word-audio-row { display: flex; justify-content: flex-end; margin-top: var(--space-3); }
.structured-question-screen .guess-question-audio { flex: 0 0 var(--size-touch-target); width: var(--size-touch-target); height: var(--size-touch-target); color: var(--brand-teal); background: color-mix(in srgb, var(--brand-teal) 12%, var(--neutral-0)); }
.structured-question-screen .guess-question-audio.is-playing { color: var(--neutral-0); background: var(--brand-teal); }
.gap-question-stage { display: flex; flex: 1 0 auto; align-items: stretch; flex-direction: column; justify-content: center; padding-bottom: var(--space-5); }
.gap-question-prompt { width: 100%; min-height: 11rem; padding: var(--space-6); border-radius: var(--radius-sheet); background: var(--brand-navy); text-align: center; }
.gap-question-prompt h2 { color: var(--neutral-0); font-family: var(--font-body); font-size: 1.625rem; font-weight: 700; line-height: 1.55; overflow-wrap: anywhere; }
.gap-question-blank { display: inline-flex; min-width: 5rem; height: 1.15em; margin: 0 0.2em; border-bottom: 0.1875rem solid var(--brand-orange); vertical-align: -0.08em; }
.gap-question-prompt p { margin-top: var(--space-5); color: color-mix(in srgb, var(--neutral-0) 72%, transparent); font-size: var(--type-body); line-height: 1.5; }
.gap-question-audio-row { display: flex; justify-content: flex-end; margin-top: var(--space-3); }
.structured-question-screen .practice-answers { flex-shrink: 0; margin-top: auto; }
.guess-answer-row { display: flex; min-width: 0; align-items: center; gap: var(--space-3); }
.guess-answer-row .practice-answer { min-width: 0; flex: 1; overflow-wrap: anywhere; }
.guess-answer-row .practice-answer > span:not(.practice-answer-letter) { min-width: 0; }
.structured-question-screen .practice-feedback-slot { min-height: 0; flex-shrink: 0; padding-top: var(--space-4); }
.structured-question-screen .practice-feedback-slot:empty { display: none; }
.structured-question-screen .practice-question-footer { position: static; flex-shrink: 0; margin-top: 0; }
.structured-question-screen .practice-save-error { flex-shrink: 0; }
.guess-feedback-overlay { position: fixed; z-index: 30; inset: 0; }
.guess-feedback-backdrop { position: absolute; background: rgb(10 46 68 / 0.48); inset: 0; }
.guess-feedback-sheet { position: absolute; bottom: 0; left: 50%; display: flex; width: min(100%, 46rem); max-height: 100%; flex-direction: column; align-items: center; padding: var(--space-8) var(--space-6) max(var(--space-6), env(safe-area-inset-bottom)); border-radius: var(--radius-sheet) var(--radius-sheet) 0 0; overflow-y: auto; background: var(--neutral-0); box-shadow: 0 -0.75rem 2.5rem rgb(10 46 68 / 0.16); text-align: center; transform: translateX(-50%); animation: guess-feedback-sheet-in 180ms ease-out; }
.guess-feedback-icon { display: flex; width: 4rem; height: 4rem; align-items: center; justify-content: center; margin-bottom: var(--space-4); border-radius: 50%; }
.guess-feedback-icon svg { width: 2.5rem; height: 2.5rem; }
.guess-feedback-sheet.is-correct .guess-feedback-icon { color: var(--brand-teal); background: color-mix(in srgb, var(--brand-teal) 12%, var(--neutral-0)); }
.guess-feedback-sheet.is-incorrect .guess-feedback-icon { color: var(--brand-magenta); background: color-mix(in srgb, var(--brand-magenta) 10%, var(--neutral-0)); }
.guess-feedback-sheet h2 { color: var(--brand-navy); font-family: var(--font-ui); font-size: 1.5rem; font-weight: 700; line-height: 1.3; }
.guess-feedback-sheet p { max-width: 31rem; margin: var(--space-3) 0 var(--space-6); color: var(--neutral-700); font-size: var(--type-body); line-height: 1.6; }
.guess-feedback-sheet p strong { color: var(--neutral-950); font-weight: 700; }
.guess-feedback-sheet .practice-full-button { max-width: 31rem; }
@keyframes guess-feedback-sheet-in {
  from { transform: translate(-50%, 100%); }
}
.conversation-question-screen { --conversation-background: color-mix(in srgb, var(--brand-teal) 3%, var(--neutral-50)); height: 100%; padding-bottom: 0; overflow: hidden; background: var(--conversation-background); }
.conversation-question-screen .practice-topbar,
.conversation-question-screen .practice-question-progress { flex-shrink: 0; }
.conversation-question-screen .practice-question-body { min-height: 0; overflow-y: auto; padding: var(--space-5); background: var(--conversation-background); }
.conversation-question-screen .practice-question-footer { position: static; flex-shrink: 0; }
.conversation-question-screen .conversation-composer { z-index: 2; display: flex; min-height: 0; max-height: 70%; flex-shrink: 1; flex-direction: column; gap: var(--space-3); padding-top: var(--space-3); border-color: var(--neutral-200); overflow-y: auto; overscroll-behavior-y: contain; background: var(--conversation-background); box-shadow: 0 -0.5rem 1.5rem color-mix(in srgb, var(--brand-navy) 6%, transparent); }
.conversation-composer .practice-answers { gap: var(--space-2); }
.conversation-composer .practice-full-button { margin-top: var(--space-1); }
.conversation-topbar { min-height: 5.5rem; }
.conversation-contact { display: flex; min-width: 0; align-items: center; gap: var(--space-3); }
.conversation-contact-avatar,
.conversation-message-avatar { display: block; border-radius: 50%; object-fit: cover; background: var(--neutral-200); }
.conversation-contact-avatar { width: 2.75rem; height: 2.75rem; flex: 0 0 2.75rem; }
.conversation-contact-copy { display: flex; min-width: 0; flex-direction: column; justify-content: center; }
.conversation-contact-copy h1 { min-width: 0; color: var(--brand-navy); font-size: var(--type-body); font-weight: 700; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.conversation-thread { display: flex; flex-direction: column; gap: var(--space-5); }
.conversation-message-pair { display: flex; flex-direction: column; gap: var(--space-3); }
.conversation-message { display: flex; width: 100%; align-items: flex-end; gap: var(--space-2); }
.conversation-message-avatar { width: 2rem; height: 2rem; flex: 0 0 2rem; margin-bottom: var(--space-1); }
.conversation-message.is-incoming { align-items: flex-start; }
.conversation-message.is-incoming .conversation-message-avatar { margin-top: var(--space-1); margin-bottom: 0; }
.conversation-message-content { display: flex; min-width: 0; max-width: min(82%, 28rem); flex-direction: column; align-items: flex-start; }
.conversation-bubble { position: relative; display: flex; min-width: 0; align-items: flex-end; gap: var(--space-2); padding: var(--space-3) var(--space-4); border: 1px solid var(--neutral-200); border-radius: 1.25rem 1.25rem 1.25rem 0.35rem; color: var(--neutral-950); background: var(--neutral-0); box-shadow: 0 var(--space-1) var(--space-3) rgb(10 46 68 / 0.04); }
.conversation-bubble p { min-width: 0; font-size: var(--type-body); line-height: 1.55; overflow-wrap: anywhere; }
.conversation-message.is-outgoing { justify-content: flex-end; }
.conversation-message.is-outgoing .conversation-message-content { align-items: flex-end; }
.conversation-message.is-outgoing .conversation-bubble { border-color: var(--brand-teal); border-radius: 1.25rem 1.25rem 0.35rem 1.25rem; color: var(--neutral-0); background: var(--brand-teal); }
.conversation-delivery { width: var(--space-4); height: var(--space-4); flex: 0 0 var(--space-4); color: color-mix(in srgb, var(--neutral-0) 78%, transparent); }
.conversation-typing { display: inline-flex; min-width: 2.75rem; min-height: 1.5rem; align-items: center; justify-content: center; gap: 0.3rem; }
.conversation-typing i { width: 0.42rem; height: 0.42rem; border-radius: 50%; background: currentColor; opacity: 0.35; animation: conversation-typing 900ms ease-in-out infinite; }
.conversation-typing i:nth-child(2) { animation-delay: 150ms; }
.conversation-typing i:nth-child(3) { animation-delay: 300ms; }
.conversation-repair-note { max-width: 20rem; margin-top: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-control); color: var(--brand-magenta); background: color-mix(in srgb, var(--brand-magenta) 7%, var(--neutral-0)); font-size: var(--type-caption); line-height: 1.5; }
@keyframes conversation-typing {
  50% { opacity: 1; transform: translateY(-0.15rem); }
}
.conversation-message-tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin-top: var(--space-2); }
.conversation-message-tools .conversation-audio { width: var(--size-touch-target); height: var(--size-touch-target); color: var(--brand-teal); background: color-mix(in srgb, var(--brand-teal) 10%, var(--neutral-0)); }
.conversation-translation-toggle { display: inline-flex; min-height: var(--size-touch-target); align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-pill); color: var(--brand-navy); font-family: var(--font-ui); font-size: var(--type-caption); }
.conversation-translation-toggle svg { width: var(--space-5); height: var(--space-5); }
.conversation-translation { margin-top: var(--space-2); padding: var(--space-3) var(--space-4); border-left: 3px solid var(--brand-orange); border-radius: 0 var(--radius-control) var(--radius-control) 0; color: var(--neutral-700); background: color-mix(in srgb, var(--brand-orange) 6%, var(--neutral-0)); font-size: var(--type-caption); line-height: 1.5; }
.conversation-response-heading { color: var(--brand-navy); font-family: var(--font-ui); font-size: var(--type-caption); font-weight: 700; line-height: 1.5; }
.conversation-question-screen .practice-answers { gap: var(--space-2); }
.conversation-reply { display: flex; width: 100%; min-height: 3.5rem; align-items: center; justify-content: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--neutral-200); border-radius: 1.25rem; color: var(--brand-navy); background: var(--neutral-0); font-size: var(--type-body); line-height: 1.5; text-align: left; }
.conversation-reply-letter { display: flex; width: var(--space-6); height: var(--space-6); flex: 0 0 var(--space-6); align-items: center; justify-content: center; border: 1px solid var(--neutral-200); border-radius: var(--space-1); font-family: var(--font-ui); font-size: var(--type-caption); }
.conversation-reply-text { min-width: 0; flex: 1; overflow-wrap: anywhere; }
.conversation-reply > svg { width: var(--space-5); height: var(--space-5); flex: 0 0 var(--space-5); margin-left: auto; color: var(--brand-teal); }
.conversation-reply.is-selected { border: 2px solid var(--brand-navy); padding: calc(var(--space-3) - 1px) calc(var(--space-4) - 1px); background: color-mix(in srgb, var(--brand-navy) 7%, var(--neutral-0)); }
.conversation-reply.is-selected .conversation-reply-letter { border-color: var(--brand-navy); color: var(--neutral-0); background: var(--brand-navy); }
.conversation-reply:disabled { opacity: 0.72; }
.conversation-question-screen .practice-feedback-slot { min-height: 0; }
.practice-audio { color: var(--brand-navy); }
.practice-audio.is-playing { color: var(--brand-orange); border-color: var(--brand-orange); }
.practice-audio-note { margin-bottom: var(--space-4); color: var(--neutral-700); font-size: var(--type-caption); line-height: 1.5; }
.practice-summary-screen { display: flex; height: 100%; padding-bottom: 0; overflow: hidden; }
.practice-summary { display: flex; min-height: 0; width: 100%; flex: 1; flex-direction: column; }
.practice-summary-body { display: flex; min-height: 0; flex: 1; overflow-y: auto; padding: var(--space-5); }
.practice-summary-main { display: flex; width: 100%; max-width: 36rem; flex: 1 0 auto; align-items: center; flex-direction: column; justify-content: center; margin: auto; padding: var(--space-6) 0; text-align: center; }
.practice-summary-illustration { display: block; width: min(100%, 18rem); height: auto; flex-shrink: 0; margin-bottom: var(--space-5); }
.summary-art-halo { fill: color-mix(in srgb, var(--brand-teal) 9%, transparent); }
.summary-art-paper { fill: var(--neutral-0); stroke: var(--neutral-200); stroke-width: 2; }
.summary-art-rule { fill: var(--neutral-200); }
.summary-art-result { fill: var(--brand-navy); }
.summary-art-confetti { fill: none; stroke-width: 5; stroke-linecap: round; }
.summary-art-confetti-teal { stroke: var(--brand-teal); }
.summary-art-confetti-orange { stroke: var(--brand-orange); }
.summary-art-badge circle { fill: var(--brand-orange); stroke: var(--neutral-50); stroke-width: 7; }
.summary-art-badge path { fill: none; stroke: var(--neutral-0); stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; }
.practice-summary-main > .package-pill { display: inline-flex; margin-bottom: var(--space-4); font-size: var(--type-caption); }
.practice-summary-main h1 { max-width: 30rem; margin-bottom: var(--space-3); color: var(--brand-navy); font-family: var(--font-body); font-size: 2rem; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2; }
.practice-summary-main > p { margin-bottom: var(--space-6); color: var(--neutral-700); font-size: var(--type-body); line-height: 1.6; }
.practice-summary-results { display: grid; width: 100%; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.practice-result-card { display: grid; min-width: 0; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--space-2) var(--space-3); padding: var(--space-4); border: 1px solid var(--neutral-200); border-radius: var(--radius-card); background: var(--neutral-0); text-align: left; }
.practice-result-card > svg { width: var(--space-6); height: var(--space-6); grid-row: 1 / 3; }
.practice-result-card > strong { color: var(--brand-navy); font-family: var(--font-ui); font-size: 1.5rem; font-weight: 700; line-height: 1; }
.practice-result-card > span { min-width: 0; color: var(--neutral-700); font-size: var(--type-caption); line-height: 1.4; overflow-wrap: anywhere; }
.practice-result-card.is-correct { border-color: color-mix(in srgb, var(--brand-teal) 35%, var(--neutral-200)); background: color-mix(in srgb, var(--brand-teal) 6%, var(--neutral-0)); }
.practice-result-card.is-correct > svg { color: var(--brand-teal); }
.practice-result-card.is-incorrect { border-color: color-mix(in srgb, var(--brand-magenta) 30%, var(--neutral-200)); background: color-mix(in srgb, var(--brand-magenta) 5%, var(--neutral-0)); }
.practice-result-card.is-incorrect > svg { color: var(--brand-magenta); }
.practice-summary-footer { flex-shrink: 0; padding: var(--space-4) var(--space-5) max(var(--space-5), env(safe-area-inset-bottom)); border-top: 1px solid var(--neutral-200); background: var(--neutral-50); }
.practice-summary-footer .practice-full-button { justify-content: center; margin: 0 auto; max-width: 36rem; }
@media (max-width: 23rem) {
  .practice-summary-results { grid-template-columns: 1fr; }
}
.practice-save-error { padding: var(--space-4); margin: var(--space-4) var(--space-6); border: 1px solid var(--brand-magenta); border-radius: var(--radius-control); color: var(--brand-magenta); background: var(--neutral-0); font-size: var(--type-body); line-height: 1.5; }
.practice-confirm { width: min(30rem, calc(100% - 2.5rem)); margin: auto; padding: var(--space-6); border: 1px solid var(--neutral-200); border-radius: var(--radius-sheet); color: var(--neutral-950); background: var(--neutral-0); }
.practice-confirm::backdrop { background: color-mix(in srgb, var(--neutral-950) 72%, transparent); }
.practice-confirm h2 { margin-bottom: var(--space-4); color: var(--brand-navy); font-family: var(--font-display); font-size: 1.75rem; }
.practice-confirm p { margin-bottom: var(--space-6); color: var(--neutral-700); font-size: var(--type-body); line-height: 1.6; }
.practice-confirm > .practice-text-button { display: flex; width: 100%; margin-top: var(--space-3); }
@media (min-width: 46rem) {
  .practice-home-body, .practice-header { padding-left: var(--space-8); padding-right: var(--space-8); }
}
.reset-confirmation h2 { font-family: var(--font-ui); font-size: var(--type-body); font-weight: 500; margin-bottom: var(--space-3); }
.reset-confirmation p { max-width: 28rem; margin-bottom: var(--space-4); color: var(--neutral-700); font-size: var(--type-body); line-height: 1.5; }
.reset-confirmation .onboarding-skip { display: flex; margin: var(--space-2) auto 0; }
.reset-confirmation button:disabled { cursor: wait; opacity: 0.65; }
@keyframes preparation-spin { to { transform: rotate(360deg); } }

@media (min-width: 46rem) {
  .onboarding-art { min-height: 21rem; }
  .editorial-word-stack { transform: scale(1.1); }
}

@media (max-height: 48rem) {
  .onboarding-art { min-height: 12rem; padding-top: var(--space-3); padding-bottom: var(--space-3); }
  .editorial-word-stack { height: 15rem; transform: scale(0.88); }
  .local-art-ring { width: 8rem; height: 8rem; }
  .local-art-symbol { width: 6rem; height: 6rem; }
  .local-art-caption { display: none; }
}

@keyframes shimmer {
  to { background-position-x: -200%; }
}

@keyframes pulse {
  50% { opacity: 0.45; }
}

@keyframes sheet-in {
  from { transform: translateY(1.5rem); opacity: 0; }
}

@media (min-width: 46rem) {
  .app-shell {
    width: min(100%, 46rem);
    margin: 0 auto;
    border-right: 1px solid var(--neutral-200);
    border-left: 1px solid var(--neutral-200);
    box-shadow: 0 0 4rem rgb(10 46 68 / 0.08);
  }

  .word-card {
    padding: 2.5rem var(--space-8);
  }
}

@media (max-height: 42rem) {
  .word-card h2 {
    font-size: clamp(3rem, 14vw, 4.5rem);
  }

  .meaning {
    margin-top: var(--space-4);
    margin-bottom: var(--space-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
