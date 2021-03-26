# ℝ℈ℚ
Simple wrapper around XMLHttpRequest. 

## Install
`npm i @rightek/req -S`

## Example

```
import req from '@rightek/req';

req.init()
    .withEndpoint('https://jsonplaceholder.typicode.com/todos')
    .withData(1)
    .get()
    .then(res => {
        console.log(res);
    })
    .catch(e => {
        console.error(e);
    });
```

## Api
- `init`: Should be called before any of following methods
- `withEndpoint(endpoint)`: e.g: `withEndpoint('https://jsonplaceholder.typicode.com/todos')`
- `withData(data)`: e.g: `withData({username: 'john'})`
- `withHeader(key, value)`: e.g: `withHeader('Content-Type', 'application/json')`
- `withHeaders(headers)`: e.g: `withHeaders([{ key: 'Content-Type', value: 'application/json' }])`
- `post(options)`
- `get(options)`
- `send(method, options)`
- Callbacks
    - `onHeadersReceived(func)`
    - `onOpened(func)`
    - `onLoading(func)`
    - `onDone(func)`
