# Changelog

## 1.0.1 — 2026-11-22

- Unify the project name as genix-video: custom element, source files, events, examples and repository links.
- Use https://genix-video.genixdev.com/ for the hosted demo.
- Update integrations to <genix-video>, src/genix-video.js, src/genix-video.css and genix:* events.

## 1.0.0 — 2026-11-22

First public release. Includes the complete component, configuration guide and browser tests.

- Add genixdev branding, contact links, favicon and page metadata to the examples.

- License the software under MIT and add English source headers with project and license links.
- Replace client YouTube references with genixdev's coast and waterfall uploads; add a vertical YouTube background example.
- Replace native demo media with credited nature footage under CC BY 4.0 and CC BY-SA 4.0.

- Add optional background="video" for native and YouTube playback, with a muted decorative copy, coordinated lifecycle and static-poster fallback.

- Automatically select the first valid YouTube thumbnail in maxresdefault → sddefault → hqdefault order. Reject small placeholders, respect explicit posters, and guard against stale image callbacks.

## 0.1.0 — 2026-11-04

Initial local release candidate; not published.

- YouTube and native video in one custom element, one JavaScript file and one stylesheet.
- Lazy shared YouTube API, poster activation, centered playback and optional blurred background.
- Fullwidth, custom and viewport sizing; optional maximum height and header offset.
- Playback methods, state events, cancellation, recovery and instance coordination.
- Configurable controls, mute, loop, autoplay, start position and end behavior.
- Generated or custom Play buttons, real full-screen control and optional close overlay.
- Close preserves the entire player area without a reserved top strip.
- Language attributes, regional fallback, read-only existing-cookie support and refreshLanguage().
- English runtime defaults, comments, documentation, examples and test descriptions.
- Installation/configuration reference in both README and examples/index.html; minimal HTML and PHP examples.
- All rights reserved. No MIT license, package publication or hosted CDN URL.
