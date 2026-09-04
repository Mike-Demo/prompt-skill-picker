/**
 * Web Awesome Design System — entry point.
 *
 * Components are typed React wrappers around the Web Awesome custom
 * elements (see ./react). Nothing here imports an npm package: Web Awesome
 * and Font Awesome load from a version-pinned CDN via theme.css and
 * WebAwesomeLoader, so consumers need no install step.
 */
// Side-effect import: consumers who import this barrel inherit the full
// theme (tokens, base styles, utilities, Font Awesome) without a separate
// stylesheet link. The preview app links theme.css?url in the root head
// instead and never imports this barrel, so styles are not loaded twice.
import "./theme.css";

export {
  WebAwesomeLoader,
  WEB_AWESOME_HTML_CLASSES,
  WEB_AWESOME_CDN,
  WEB_AWESOME_VERSION,
  FONT_AWESOME_VERSION,
} from "./setup";
export * from "./react";
