

https://github.com/user-attachments/assets/bf749d78-5e23-43bc-8ccb-ec07adcb8251


The animated gif in the demo is made by Kirill Epler: https://dribbble.com/nikman2214

# GifFavicon

Use an animated GIF as the favicon for a website.

GifFavicon reads a GIF, decodes its frames in the browser, draws each frame to a canvas, and updates the page favicon as a PNG. This makes animated tab icons work in browsers that do not directly support animated GIF favicons.

[![npm version](https://img.shields.io/npm/v/gif-favicon.svg)](https://www.npmjs.com/package/gif-favicon)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What You Need

- A website or web app.
- A `.gif` file you want to use as the favicon.
- The `gif-favicon` script.
- The `omggif` script, which decodes the GIF.

Important: if your website is published online, the GIF must also be published online. A path like `./demo.gif` only works if `demo.gif` is uploaded next to the HTML file on your server. It will not use a GIF that only exists on your computer.

## Quick Start

Put your GIF in your website's public/static folder. For example:

```text
public/
  favicon.gif
```

Then add these scripts to your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/omggif/omggif.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gif-favicon/dist/gif-favicon.min.js"></script>

<script>
  new GifFavicon({
    gifPath: "/favicon.gif"
  });
</script>
```

For a plain HTML site, upload `favicon.gif` to the same place as your HTML file and use:

```js
new GifFavicon({
  gifPath: "./favicon.gif"
});
```

## Published Website Instructions

For a published website, do one of these:

1. Upload the GIF with your site files.
2. Use the final public URL or path to that GIF.
3. Make sure the GIF URL opens in a browser by itself.

Examples:

```js
// GIF in the root public folder
new GifFavicon({ gifPath: "/favicon.gif" });

// GIF in an assets folder
new GifFavicon({ gifPath: "/assets/favicon.gif" });

// GIF on a different domain, only if that domain allows CORS
new GifFavicon({ gifPath: "https://example.com/favicon.gif" });
```

Best option: host the GIF on the same domain as your website. Cross-domain GIF URLs may be blocked by the browser unless the other server allows CORS.

## Install With npm

```bash
npm install gif-favicon omggif
```

CommonJS:

```js
const GifFavicon = require("gif-favicon");

new GifFavicon({
  gifPath: "/favicon.gif"
});
```

## If You Open HTML Directly

Browsers block JavaScript from reading normal local files when a page is opened with `file://`. If you double-click an HTML file, `gifPath: "./favicon.gif"` may not work.

Use one of these instead:

- Run a local server.
- Let the user choose a GIF with a file input.
- Use a base64 GIF data URL.

File input example:

```html
<input id="gif-file" type="file" accept="image/gif">

<script>
  const favicon = new GifFavicon();

  document.querySelector("#gif-file").addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) {
      favicon.loadFromFile(file);
    }
  });
</script>
```

## Instructions for AI

If you are asking an AI assistant to add this to a website, you can paste this:

```text
Add gif-favicon to this website.

Use these CDN scripts in the HTML:
https://cdn.jsdelivr.net/npm/omggif/omggif.js
https://cdn.jsdelivr.net/npm/gif-favicon/dist/gif-favicon.min.js

Place my animated favicon GIF in the website's public/static assets so it is included when the site is published.

Then initialize it with:
new GifFavicon({ gifPath: "/favicon.gif" });

If the site uses a different public assets folder, update gifPath to the correct published URL, such as "/assets/favicon.gif".

Do not point gifPath to a local computer file path. The GIF must be available from the published website.
```

## Options

```js
new GifFavicon({
  gifPath: "/favicon.gif",
  fps: 0,
  autoStart: true,
  onLoad(info) {
    console.log(info);
  },
  onError(error) {
    console.error(error);
  }
});
```

- `gifPath`: URL or path to the GIF.
- `gifBase64`: Base64 string or GIF data URL.
- `gifFile`: Browser `File` object.
- `gifArrayBuffer`: GIF bytes as an `ArrayBuffer`.
- `gifBytes`: GIF bytes as a `Uint8Array` or byte array.
- `fps`: Animation speed. Use `0` to use the GIF's own timing.
- `autoStart`: Start after loading. Defaults to `true`.
- `onLoad(info)`: Runs after the GIF loads.
- `onStart()`: Runs when animation starts.
- `onStop()`: Runs when animation stops.
- `onError(error)`: Runs if loading or decoding fails.

## Methods

- `load(path)`: Load a GIF from a URL or path.
- `loadFromFile(file)`: Load a GIF chosen by the user.
- `loadFromBase64(base64)`: Load a GIF from base64 or a data URL.
- `loadFromArrayBuffer(buffer)`: Load a GIF from an `ArrayBuffer`.
- `loadFromBytes(bytes)`: Load a GIF from bytes.
- `start()`: Start animating.
- `stop()`: Stop animating.
- `setFps(fps)`: Change speed. Use `0` for native GIF timing.
- `reset()`: Stop and clear the favicon frames.
- `getInfo()`: Get the current state.


## License

MIT
