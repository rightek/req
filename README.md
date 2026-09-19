# ℝ℈ℚ

A small, dependency-free, promise-based wrapper around `XMLHttpRequest` with a fluent (chainable) API.

- Fluent builder API: `req.init().withEndpoint(...).withHeader(...).post()`
- Promise-based, works with `async/await`
- Automatic JSON serialization and parsing
- Request lifecycle callbacks (`onOpened`, `onHeadersReceived`, `onLoading`, `onDone`)
- Upload progress, timeout, cancellation (`AbortSignal`), credentials and `responseType` support

## Installation

```bash
npm i @rightek/req -S
```

## Quick start

```js
import req from '@rightek/req';

req.init()
    .withEndpoint('https://jsonplaceholder.typicode.com/todos')
    .withData(1)
    .get()
    .then(({ response, headers, status }) => {
        console.log(response);
    })
    .catch(e => {
        console.error(e);
    });
```

Or with `async/await`:

```js
const { response } = await req.init()
    .withEndpoint('https://jsonplaceholder.typicode.com/todos')
    .withData(1)
    .get();
```

> **Note:** Call `req.init()` for every request. It returns a fresh builder, so headers, data and callbacks are never shared between requests.

## Examples

### GET with a path segment

```js
// GET https://api.example.com/users/42
await req.init()
    .withEndpoint('https://api.example.com/users')
    .withData(42)
    .get();
```

### GET with query parameters

When `withData` receives an object, it is converted to a query string. `null` and `undefined` values are skipped, and arrays are repeated as `key=a&key=b`.

```js
// GET https://api.example.com/users?page=2&tags=a&tags=b
await req.init()
    .withEndpoint('https://api.example.com/users')
    .withData({ page: 2, tags: ['a', 'b'] })
    .get();
```

### POST JSON

The body is serialized with `JSON.stringify` and `Content-Type: application/json` is added automatically (unless you already set a `Content-Type` header).

```js
const { response } = await req.init()
    .withEndpoint('https://api.example.com/users')
    .withData({ username: 'john' })
    .withHeader('Authorization', 'Bearer YOUR_TOKEN')
    .post();
```

### Upload a file with progress

`upload()` sends the data as-is (no JSON serialization), so it is suitable for `FormData`, `Blob`, etc.

```js
const form = new FormData();
form.append('file', fileInput.files[0]);

await req.init()
    .withEndpoint('https://api.example.com/upload')
    .withData(form)
    .onUploadProgress(e => {
        if (e.lengthComputable) console.log(`${Math.round((e.loaded / e.total) * 100)}%`);
    })
    .upload();
```

### Timeout and cancellation

```js
const controller = new AbortController();

const request = req.init()
    .withEndpoint('https://api.example.com/slow')
    .get({ timeout: 5000, signal: controller.signal });

// later...
controller.abort();

try {
    await request;
} catch (e) {
    console.log(e.type); // 'timeout' | 'abort' | ...
}
```

### Downloading binary data

```js
const { response: blob } = await req.init()
    .withEndpoint('https://api.example.com/report.pdf')
    .get({ responseType: 'blob' });
```

### Lifecycle callbacks

```js
req.init()
    .withEndpoint('https://api.example.com/users')
    .onOpened(() => console.log('opened'))
    .onHeadersReceived(() => console.log('headers received'))
    .onLoading(() => console.log('loading'))
    .onDone(() => console.log('done'))
    .get();
```

## API

### `req.init()`

Returns a new request builder. Must be called before any of the methods below.

### Builder methods

All `with...` and `on...` methods return the builder, so they can be chained.

| Method | Description |
| --- | --- |
| `withEndpoint(endpoint)` | Sets the request URL. Throws an `Error` synchronously if the URL is not valid. |
| `withData(data)` | Sets the request data (see [How data is handled](#how-data-is-handled)). |
| `withHeader(key, value)` | Adds a single request header. |
| `withHeaders(headers)` | Replaces all headers. Expects an array of `{ key, value }` objects. |
| `onOpened(func)` | Called when the request is opened. |
| `onHeadersReceived(func)` | Called when response headers are received. |
| `onLoading(func)` | Called while the response body is being received. |
| `onDone(func)` | Called when the request completes (on success **and** on failure). |
| `onUploadProgress(func)` | Receives the `ProgressEvent` of the upload. |

### Request methods

All request methods return a `Promise`. If no valid endpoint has been set, the promise is rejected with an `Error('Url is not valid.')`.

| Method | Description |
| --- | --- |
| `get(options)` | Sends a `GET` request. `withData` is appended as a path segment or query string. |
| `post(options)` | Sends a `POST` request. Objects are JSON-serialized. |
| `upload(options)` | Sends a `POST` request with the data as-is (for `FormData`, `Blob`, ...). |
| `send(method, options)` | Sends a request with any method. The data is sent as-is. |

The `METHOD` constant is also exported:

```js
import req, { METHOD } from '@rightek/req';

req.init()
    .withEndpoint('https://api.example.com/users/42')
    .send(METHOD.DELETE);
```

`METHOD` contains `GET`, `POST`, `PUT` and `DELETE`.

### Options

Every request method accepts an optional `options` object:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `verbose` | `boolean` | `false` | Logs failed requests to the console. |
| `timeout` | `number` | `0` | Timeout in milliseconds. `0` means no timeout. |
| `withCredentials` | `boolean` | `false` | Sends cookies and auth headers on cross-site requests. |
| `responseType` | `string` | `''` | `XMLHttpRequest.responseType` (`''`, `'text'`, `'json'`, `'blob'`, `'arraybuffer'`, ...). |
| `signal` | `AbortSignal` | `null` | Aborts the request when the signal is aborted. |

## How data is handled

| Method | `withData` value | Behavior |
| --- | --- | --- |
| `get` | number / string | Appended to the URL as a path segment (`/todos` + `1` -> `/todos/1`). |
| `get` | object | Converted to a query string. |
| `post` | object / array / number / boolean | Serialized with `JSON.stringify`; `Content-Type: application/json` is added if missing. |
| `post` | string | Treated as an already-serialized JSON string and sent as-is (not stringified twice). |
| `post` | `FormData`, `Blob`, `ArrayBuffer`, `URLSearchParams` | Sent as-is; the browser sets the `Content-Type`. |
| `upload` / `send` | anything | Sent as-is. |

## Response

On success (any `2xx` status), the promise resolves with:

```js
{
    response, // parsed JSON (object/array), or the raw response
    headers,  // response headers as an object, with lower-cased names
    status    // HTTP status code
}
```

The response body is parsed as JSON when the `Content-Type` contains `json`, or when the body is a JSON object/array. Otherwise the raw response is returned.

## Errors

On failure, the promise is rejected with an object:

```js
{
    type,         // 'http' | 'network' | 'timeout' | 'abort'
    status,       // HTTP status code (0 when no response was received)
    statusText,
    responseText, // undefined when responseType is not text
    headers       // response headers as an object
}
```

| `type` | Meaning |
| --- | --- |
| `http` | The server responded with a non-`2xx` status. |
| `network` | The request could not be made (offline, CORS failure, DNS error, ...). |
| `timeout` | The `timeout` option was exceeded. |
| `abort` | The request was aborted via `signal`. |

Errors thrown while preparing the request (for example an invalid header name) reject the promise with the original `Error`.

## Browser support

Works in all browsers that support `XMLHttpRequest`, `Promise` and `URL`. The library ships modern JavaScript (ES2018+). Transpile it if you need to support older environments.

## Migrating from the previous version

The public API is backwards compatible. The changes below fix bugs and may affect behavior:

- **GET URLs are no longer corrupted.** Previously `https://` could become `https:/` when data was appended.
- **`Content-Type` is no longer duplicated** when `post` is called more than once or headers are reused.
- **`onOpened` now fires.** Handlers are attached before the request is opened.
- **All `2xx` statuses resolve** (e.g. `201`, `204`); previously only `200` did.
- **URL validation is stricter.** Invalid URLs are now rejected, and errors are thrown as `Error` objects instead of strings.
- **`get` with an object** now builds a query string instead of producing `/[object Object]`.
- **`post` with a string** no longer stringifies it a second time.
- **JSON parsing is more accurate.** Falsy JSON values are no longer lost, and plain-text bodies such as `"123"` are not converted to numbers.
- **New features:** `timeout`, `withCredentials`, `responseType`, `signal`, `onUploadProgress`, and error `type` / response `status` fields.
