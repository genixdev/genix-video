# gennix-video

Version **0.1.0**. A dependency-free custom element for YouTube and native video: full-width posters, centered uncropped playback and an optional blurred background. One JavaScript file and one stylesheet; no build step, framework, provider system or plugins.

**All rights reserved.** See [LICENSE](LICENSE). This repository does not grant an open-source license. Nothing has been published to a package registry or CDN.

## Quick start

Copy `src/gennix-video.js` and `src/gennix-video.css` to your web server. Add these tags to your page, adjusting paths to your installation:

```html
<link rel="stylesheet" href="/gennix-video/src/gennix-video.css">
<script src="/gennix-video/src/gennix-video.js" defer></script>
```

Then add a video:

```html
<gennix-video size="fullwidth" aspect-ratio="16/9"
  max-height="80dvh" background="poster"
  provider="youtube" src="HuACikeyg0c">
</gennix-video>
```

Serve through HTTP(S), not `file://`. Native sources and posters resolve relative to the HTML document. Include the stylesheet and script once; repeated script inclusion is guarded. No npm install is required. Keep the custom button inside the element before initialization; using the deferred script above ensures normal parsed HTML is ready.

For a native file:

```html
<gennix-video provider="native" src="/media/video.mp4"
  poster="/media/poster.jpg" size="fullwidth" aspect-ratio="16/9">
</gennix-video>
```

## Live configuration guide

[Open the examples](examples/index.html) for installation, all attributes and copyable demos. On the configured local host: [gennixgithub.loc](http://gennixgithub.loc/gennix-video/examples/).

- [Playback, buttons, coordination and full screen](examples/options.html)
- [Height limits](examples/height-limit.html) and [viewport with a header](examples/viewport.html)
- [Languages and existing site cookies](examples/languages.html)
- [Explicit autoplay](examples/autoplay.html)
- [Minimal HTML](examples/minimal.html) and [escaped PHP integration](examples/integration.php)
- [Browser tests](tests/index.html)

For another environment, serve the repository with your existing web server. Alternatively, `php -S localhost:8080` from the repository directory serves both static examples and PHP; open `/examples/`. PHP is only needed for the PHP example. There is no hosted/CDN installation URL yet: use the two local files, not an invented package URL.

## Configuration

Boolean attributes accept an empty value or `true` as true, `false` as false. Missing or unrecognized values use the documented default. Values are case-insensitive for booleans. For other attributes, use the documented spelling.

| Attribute | Default | Values and behavior |
| --- | --- | --- |
| `provider` | youtube | youtube or native. |
| `src` | Required | YouTube ID or full watch, youtu.be, embed or shorts URL; native HTTP(S) URL or relative file path. |
| `poster` | YouTube thumbnail; none for native | Poster image URL. Use a local image to avoid an initial remote thumbnail request. |
| `size` | fullwidth | fullwidth, custom or viewport. Fullwidth fills the parent width, not necessarily the entire browser. |
| `aspect-ratio` | 16/9 | Reserved box ratio, e.g. 4/3, 1/1 or 9/16. Native metadata adjusts the player ratio without changing the box. |
| `width` | 100% | Custom width: positive pixels (900 or 900px), or a percentage greater than 0 and at most 100%. |
| `height` | auto | Custom height: positive pixels or auto. Fixed height stays fixed on narrow screens. |
| `max-height` | No extra limit | Positive pixels, vh, dvh or svh. Example: 80dvh. Modern viewport units fall back to vh when unsupported. |
| `viewport-offset` | 0 | Non-negative pixels subtracted from viewport height or an explicit max-height. Applied once. If greater than the limit, height becomes zero. |
| `background` | poster for custom/viewport; solid for fullwidth | poster enables a blurred static background; solid uses a color; none is transparent. |
| `fit` | contain | contain shows the whole video. cover crops native video only; YouTube always uses contain. |
| `template` | inline | Legacy inline or hero layout. Explicit size is recommended and takes precedence. |
| `controls` | true | Show original player controls. When false, provide your own pause control if needed. |
| `muted` | false | Start without sound. |
| `loop` | false | Repeat; takes precedence over on-end. Native looping returns to the beginning of the file. |
| `autoplay` | false | Request playback on connection. Allows initial loading; browser policy may still block playback. |
| `start` | URL time or 0 | Initial position in whole seconds or h/m/s format, e.g. 1m30s. Explicit start (including 0) overrides URL start, t or #t. |
| `poster-click` | false | Allow clicking the poster to play; the keyboard-accessible Play button remains available. |
| `pause-others` | false | Pause other connected instances only after this one actually starts. Set on both for mutual coordination. |
| `on-end` | keep | keep retains the player; poster resets to the poster after emitting ended. Ignored while looping. |
| `play-button` | true | false loads the player and exposes original controls without an initial click. Cannot combine with controls=false unless a custom Play button exists. |
| `close-button` | true | Show an overlay × during loading and playback. Closing resets to the poster without restarting autoplay. No label attribute; internal accessible name is Close video. |
| `fullscreen` | false | Show a real full-screen toggle. Reserves a 48px bottom toolbar; unrelated to viewport sizing. |
| `playsinline` | true | Request inline playback on mobile. false permits the browser’s native full-screen behavior. |
| `preload` | none | Native hint: none, metadata or auto, after creating the video. No-button passive mode uses auto to expose working controls. |
| `playlabel` | Play | Generated Play button text; supports language suffixes such as playlabel-fr. |
| `play-content` | both | both, text or icon. Icon-only buttons retain an accessible name. |
| `button-background` | #fff | Button background color. |
| `button-color` | #172026 | Button text/icon color. |
| `button-hover-background` | #e3f5a4 | Background on hover. |
| `button-hover-color` | #172026 | Text/icon color on hover. |
| `button-focus-background` | #e3f5a4 | Background with keyboard focus. |
| `button-focus-color` | #172026 | Text/icon color with keyboard focus. |
| `button-radius` | 100 | Non-negative radius in pixels, e.g. 12. |
| `lang` | Not set | Explicit language takes priority. Normalizes en_US to en-us. |
| `lang-cookie` | Not set | Name of an existing site cookie to read. Never creates or modifies cookies. |
| `aria-label` | Generic player name | Accessible name for the component and embedded player; does not replace playlabel. |
| `loadinglabel` | Loading video… | Configurable text; also accepts language suffixes, e.g. loadinglabel-fr. |
| `errorlabel` | Unable to load the video. | Configurable text; also accepts language suffixes, e.g. errorlabel-fr. |
| `retrylabel` | Retry | Configurable text; also accepts language suffixes, e.g. retrylabel-fr. |
| `fullscreenlabel` | Full screen | Configurable text; also accepts language suffixes, e.g. fullscreenlabel-fr. |
| `exitfullscreenlabel` | Exit full screen | Configurable text; also accepts language suffixes, e.g. exitfullscreenlabel-fr. |
| `blockedlabel` | Press Play to start the video. | Configurable text; also accepts language suffixes, e.g. blockedlabel-fr. |
| `fullscreenerrorlabel` | The browser did not allow full screen. | Configurable text; also accepts language suffixes, e.g. fullscreenerrorlabel-fr. |

### Sizing and backgrounds

Fullwidth height is width × ratio denominator ÷ numerator: 1920px at 16/9 gives 1080px. `max-height="80dvh"` caps that height without reducing width. `max-height="100dvh" viewport-offset="80"` caps it at visible viewport height minus 80px. `dvh` follows mobile browser bars; `svh` uses the smaller viewport with bars visible; `vh` is the traditional unit. A height cap does not remove scrolling caused by other page content.

```html
<gennix-video size="custom" width="900" height="500"
  provider="youtube" src="HuACikeyg0c" background="poster"></gennix-video>

<gennix-video size="viewport" viewport-offset="80"
  provider="youtube" src="HuACikeyg0c"></gennix-video>
```

Custom width shrinks to fit its parent, but a fixed height stays fixed. Use height=auto for a ratio-derived height. Fullwidth ignores legacy width/height CSS limits unless the explicit max-height attribute is present. Real full screen overrides size limits.

The poster is sharp before activation. `background="poster"` blurs a static copy behind the player; it becomes visible where the player leaves space. `cover` fills by cropping and is not a blur setting. Native metadata determines the player's actual ratio. YouTube uses the declared ratio and may contain its own black bars.

The close × overlays the container and **does not reserve top space or reduce player height**. It may overlap an iframe corner when no background margin exists. Disable it with close-button=false if necessary. The optional full-screen toolbar still reserves 48px at the bottom.

### Playback and loading

YouTube accepts IDs and complete HTTP(S) URLs from youtube.com, www.youtube.com, m.youtube.com, youtu.be, www.youtu.be, youtube-nocookie.com and www.youtube-nocookie.com. Supported paths are watch, embed, shorts and youtu.be/ID. Explicit start overrides URL start, t and #t in that order. Native start must be less than the media duration.

The shared YouTube API loads on activation, unless autoplay or play-button=false explicitly requests initial loading. It does not overwrite onYouTubeIframeAPIReady. The API download has a 20-second timeout; iframe readiness comes from onReady. Reset/pause can cancel a pending activation. Posters may make earlier network requests. youtube-nocookie.com does not guarantee no tracking.

Autoplay is a request, not a guarantee; muted=true usually helps. A policy rejection keeps a manual action and does not emit a media error. Reset/close always restores manual Play, even with play-button=false, and does not restart autoplay. Native loop repeats from the file beginning; YouTube manages its own loop. With loop, no ended event is emitted on each repetition.

Sizes update live without replacing the player. Language changes are described below. For playback/source changes on a loaded instance: reset(), update attributes, then play(). A custom Play button takes precedence over play-button=false. If controls=false, provide a way to pause through the public API.

### Custom buttons

```html
<gennix-video provider="native" src="/media/video.mp4">
  <button type="button" data-gv-play aria-label="Watch our story">
    <span aria-hidden="true">▶</span><strong>Watch our story</strong>
  </button>
</gennix-video>
```

The element reuses this button without replacing its children. Its content and accessible label belong to the website; translation attributes affect the generated button only. Enter and Space work normally. Text is rendered through textContent, not configurable HTML.

## Languages and existing cookies

```html
<gennix-video lang-cookie="SETLANG" provider="youtube" src="HuACikeyg0c"
  playlabel="Watch video" playlabel-en="Play" playlabel-es="Reproducir"
  playlabel-fr="Lire" playlabel-it="Riproduci" playlabel-de="Abspielen">
</gennix-video>
```

The component **never creates or modifies cookies** and does not poll them. A valid explicit lang wins. Otherwise, if lang-cookie is set, only that cookie is read. A missing, invalid or inaccessible cookie selects default text rather than the document language. Without lang-cookie or a valid explicit lang, document.documentElement.lang is used.

For each text: regional attribute → base-language attribute → unsuffixed attribute → built-in English text. en_US normalizes to en-us, selecting playlabel-en-us then playlabel-en. If playlabel is absent too, the button says **Play**. Translations are supplied by your website, not automatically generated. Empty translations fall through. Use hyphens in translation attribute suffixes.

```js
// After your website changes its existing language cookie:
document.querySelectorAll('gennix-video').forEach(video => video.refreshLanguage());
```

lang, lang-cookie and base text attributes refresh automatically. Call refreshLanguage() after changing suffixed attributes or the document language. Refreshing never reloads or pauses media. Cookies must be readable by JavaScript on the current domain/path; HttpOnly cookies cannot be read. Malformed encoded values safely fall back. The demo selector changes lang, never a cookie.

These labels do not translate YouTube/native controls. The close icon has an internal English accessible name, with no label configuration attribute.

## JavaScript API

```js
await customElements.whenDefined('gennix-video');
const video = document.querySelector('gennix-video');
try {
  await video.play(); // Resolves only when playback actually starts.
} catch (error) {
  if (error.name !== 'AbortError') console.error(error);
}
```

| Member | Contract |
| --- | --- |
| `state` | Read-only: idle, loading, ready, playing, paused, ended or error. Also exposed as data-gv-state; do not write it to control playback. |
| `play()` | Promise<void>. Loads/retries, resumes, or replays. Concurrent requests share a promise/player. Already playing resolves without another play event. |
| `pause()` | Synchronous, returns undefined. Idle/error: no load. Pending initial load: cancel and reset. Ready player: request pause and await its real signal for state changes. |
| `reset()` | Synchronous, returns undefined. Cancel, release player/listeners and restore poster with manual Play. Returns focus to Play if focus was inside. |
| `refreshLanguage()` | Synchronous, returns undefined. Read language again and update text in place without playback events. |
| `requestFullscreen()` | Promise<void>. Requires a user gesture and browser support; does not load or play media. Rejects if unavailable. Use document.exitFullscreen() to exit. |

play() rejects with InvalidStateError when disconnected, AbortError when cancelled, NotAllowedError for policy rejection, or a loading/player error. UI actions handle their own rejections. There is no public destroy(): disconnecting releases resources; reconnecting keeps one structure and permits activation again. Closing while in full screen resets the video but leaves full-screen mode active.

### Events

All events bubble, are not cancelable and contain `{ state, provider, src }` in detail. Native src is absolute; YouTube src is the normalized ID.

| Event | Additional information |
| --- | --- |
| `gennix:statechange` | previousState. Not emitted for initial idle. |
| `gennix:ready` | Once per loaded player (native loadeddata or YouTube onReady). |
| `gennix:play` | Confirmed start/resume, not duplicate buffering. |
| `gennix:pause` | Confirmed pause. |
| `gennix:ended` | Confirmed end; emitted before reset for on-end=poster. |
| `gennix:error` | error: { name, message, code }. Original provider error code where available. |

Cancellation, autoplay policy rejection and full-screen denial do not emit gennix:error. User-visible errors use errorlabel; diagnostic details remain in the event. Buffering retains the player and avoids placing status text over its controls.

```js
document.addEventListener('gennix:error', event => {
  console.error(event.target, event.detail.error);
});
```

## Optional CSS customization

Normal configuration uses HTML attributes, not inline CSS variables. Developers can use these variables in their site's stylesheet:

| CSS variable | Default | Purpose |
| --- | --- | --- |
| `--gv-height` | `auto (inline), 32rem (hero)` | Legacy box height. |
| `--gv-width` | `100%` | Legacy/custom width. |
| `--gv-max-width` | `100%` | Legacy/custom width limit. |
| `--gv-min-height` | `0px` | Legacy/custom minimum height. |
| `--gv-max-height` | `none` | Legacy/custom maximum height. |
| `--gv-viewport-offset` | `0px` | Legacy viewport offset. |
| `--gv-poster-fit` | `cover` | Poster: cover or contain. |
| `--gv-poster-position` | `center` | Poster and blurred background position. |
| `--gv-video-position` | `center` | Native cover crop position. |
| `--gv-background-color` | `#151b21` | Solid base color. |
| `--gv-blur` | `20px` | Background blur radius. |
| `--gv-dim` | `35%` | Background darkening. |
| `--gv-button-padding` | `1rem 1.5rem` | Button padding. |
| `--gv-button-border` | `1px solid rgb(255 255 255 / 50%)` | Button border. |
| `--gv-button-radius` | `100px` | Button radius. |
| `--gv-button-font-size` | `1rem` | Button font size. |
| `--gv-button-icon-size` | `12px` | Generated icon size. |
| `--gv-button-background` | `#fff` | Button background color. |
| `--gv-button-color` | `#172026` | Button text/icon color. |
| `--gv-button-hover-background` | `#e3f5a4` | Background on hover. |
| `--gv-button-hover-color` | `#172026` | Text/icon color on hover. |
| `--gv-button-focus-background` | `#e3f5a4` | Background with keyboard focus. |
| `--gv-button-focus-color` | `#172026` | Text/icon color with keyboard focus. |

Attributes take precedence over equivalent variables. --gv-attr-*, --gv-ratio, --gv-container-ratio, --gv-limited-height and internal gv-* classes are implementation details.

## Development and checks

Open tests/index.html through HTTP and click Run tests. Tests use native sample files; the policy-rejection and cookie-read cases are explicitly simulated. They do not create real cookies. If Node.js is available, npm run check validates the runtime syntax; npm install is unnecessary. Browser tests provide behavioral coverage, not just syntax checks.

Manually verify Play/pause/reset, close during loading, retry after a bad URL, reconnect, keyboard focus, full screen, mobile sizing and YouTube network behavior. Local sample generation commands are in [examples/assets/README.md](examples/assets/README.md).

## Compatibility and troubleshooting

Requires modern Custom Elements, AbortController event listeners, CSS size containers and cqw/cqh units. Real full screen depends on browser/device/embedding permissions. Native controls and codecs depend on the browser. Physical mobile devices, Safari and Firefox require separate validation; a resized desktop window is not equivalent.

- No blur visible: use background=poster and a box ratio that leaves space around the contained player.
- Unexpected height: fullwidth fills its parent; use max-height and inspect the parent's width. A header is not measured automatically.
- YouTube fails: inspect gennix:error and network access. Embedding restrictions, ads and third-party policy remain under YouTube's control. It recommends a minimum 200×200 player viewport; a small contained player can be smaller.
- No cookie translation: confirm the exact cookie name, JavaScript accessibility and matching suffixed attribute. A configured missing cookie uses default text.
- No autoplay: try muted=true; keep a manual activation path.
- Keep the referrer policy compatible with YouTube. Do not strip all referrer information from embeds.

## Rights and release status

All rights reserved. No MIT or other open-source permission is granted. Third-party media, trademarks and services retain their respective rights. The embedded YouTube video is a demonstration, not an included or licensed asset. No repository, package or CDN has been published as part of this delivery.
