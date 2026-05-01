# GifFavicon

Animated GIF favicons for browsers, rendered through canvas with supersampling for crisp tab icons.

[![npm version](https://img.shields.io/npm/v/gif-favicon.svg)](https://www.npmjs.com/package/gif-favicon)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- Loads GIFs from URLs, files, or base64 strings
- Uses native GIF frame timing by default
- Supports custom FPS override
- Renders favicon output as PNG data URLs
- Works with CommonJS, AMD, and browser globals

## Installation

```bash
npm install gif-favicon omggif
```

`omggif` is a peer dependency. Load it before `gif-favicon` when using script tags.

## Usage

### Same-origin GIF

Put the GIF in your app's public/static folder and load it from the same domain as the page:

```js
new GifFavicon({
  gifPath: "/favicon.gif"
});
```

### Browser script tags

```html
<script src="https://cdn.jsdelivr.net/npm/omggif/omggif.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gif-favicon/dist/gif-favicon.min.js"></script>

<script>
  const favicon = new GifFavicon({
    gifPath: "/favicon.gif",
    fps: 0
  });
</script>
```

### CommonJS

```js
const GifFavicon = require("gif-favicon");

const favicon = new GifFavicon({
  autoStart: false,
  onLoad(info) {
    console.log(info);
  }
});

favicon.load("/favicon.gif").then(() => favicon.start());
```

### Direct file usage

Browsers do not allow JavaScript to silently read arbitrary local files from a `file://` page. If you open an HTML file directly in the browser, use a file input or a base64/data URL:

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

### Blocked URLs and CORS

`GifFavicon` needs the original GIF bytes so it can decode every frame. If `gifPath` points to another domain, that server must allow browser reads with CORS. If it does not, the browser will block the request and the library cannot bypass it.

Use one of these fixes:

- Host the GIF in your own app, for example `/favicon.gif`.
- Enable CORS on the server that hosts the GIF.
- Convert the GIF to a base64/data URL and use `gifBase64` or `loadFromBase64()`.
- Let the user choose a local file with `loadFromFile(file)`.
- Fetch the GIF through your own backend/proxy and pass the bytes to `loadFromArrayBuffer(buffer)`.

```js
const response = await fetch("/api/favicon-gif");
const buffer = await response.arrayBuffer();

const favicon = new GifFavicon();
await favicon.loadFromArrayBuffer(buffer);
```

## API

### `new GifFavicon(options)`

Options:

- `gifPath`: URL/path to load immediately.
- `gifBase64`: Base64 string or GIF data URL to load immediately.
- `gifFile`: Browser `File` object to load immediately.
- `gifArrayBuffer`: `ArrayBuffer` containing GIF bytes to load immediately.
- `gifBytes`: `Uint8Array` or byte array containing GIF bytes to load immediately.
- `fps`: Custom frames per second. Use `0` for native GIF timing.
- `autoStart`: Starts animation after loading. Defaults to `true`.
- `onLoad(info)`: Called after the GIF is decoded.
- `onStart()`: Called when animation starts.
- `onStop()`: Called when animation stops.
- `onError(error)`: Called when loading or decoding fails.

### Methods

- `load(path)`: Load a GIF from a URL or path.
- `loadFromFile(file)`: Load a GIF from a browser `File`.
- `loadFromBase64(base64)`: Load a GIF from a base64 string or data URL.
- `loadFromArrayBuffer(buffer)`: Load a GIF from an `ArrayBuffer`.
- `loadFromBytes(bytes)`: Load a GIF from a `Uint8Array` or byte array.
- `start()`: Start animating the favicon.
- `stop()`: Stop animating the favicon.
- `setFps(fps)`: Change FPS. Use `0` for native GIF timing.
- `reset()`: Stop and clear loaded frames.
- `getInfo()`: Return current GIF and animation state.

## Development

```bash
npm install
npm run build
npm run check
```

`npm run check` builds the package and runs `npm pack --dry-run` so you can inspect what will be published.

## Publishing

Before publishing, update these fields in `package.json`:

- `author`
- `repository.url`
- `bugs.url`
- `homepage`

Then run:

```bash
npm run check
npm publish
```

## License

MIT
