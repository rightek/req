"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.METHOD = void 0;
const DEFAULT = {
  verbose: false
};

const tryParseJSON = (s) => {
  if (!s) return false;

  try {
    var o = JSON.parse(s);
    if (o && typeof o === "object") return o;
  } catch (e) {}

  return false;
};

const isValidUrl = (input) =>
  !(typeof input === "undefined" || input === null || input.length === 0);

const send = (endpoint, method, data, headers, events, options) => {
  options = options || DEFAULT; // set up HTTP request

  const req = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    req.open(method || "GET", endpoint); // set request headers

    if (headers && headers.length > 0) {
      for (let i = 0; i < headers.length; i++)
        req.setRequestHeader(headers[i].key, headers[i].value);
    } // send the request

    data ? req.send(data) : req.send(); // done!

    req.onload = () => {
      let headers = {};
      req
        .getAllResponseHeaders()
        .trim()
        .split(/[\r\n]+/)
        .forEach((line) => {
          let parts = line.split(": ");
          headers[parts.shift()] = parts.join(": ");
        });

      if (req.status === 200) {
        let response = tryParseJSON(req.responseText);
        resolve({
          response: response || req.response,
          headers
        });
      } else {
        let response = {
          responseText: req.responseText,
          status: req.status,
          statusText: req.statusText,
          headers
        };
        options.verbose && console.warn(response);
        reject(response);
      }
    }; // only triggers if the request couldn't be made at all

    req.onerror = () => {
      let response = {
        responseText: req.responseText,
        status: req.status,
        statusText: req.statusText
      };
      options.verbose && console.error(response);
      reject(response);
    };

    req.onreadystatechange = function () {
      // 0
      if (this.readyState == this.UNSENT)
        options.verbose && console.log("UNSENT");
      // 1
      else if (this.readyState == this.OPENED && events.onOpened)
        events.onOpened.call();
      // 2
      else if (
        this.readyState == this.HEADERS_RECEIVED &&
        events.onHeadersReceived
      )
        events.onHeadersReceived.call();
      // 3
      else if (this.readyState == this.LOADING && events.onLoading)
        events.onLoading.call();
      // 4
      else if (this.readyState == this.DONE && events.onDone)
        events.onDone.call();
    };
  });
};

function http(_endpoint, _data, _headers, _events) {
  this.withEndpoint = (endpoint) => {
    if (!isValidUrl(endpoint)) throw "Url is not valid.";
    _endpoint = endpoint;
    return this;
  };

  this.withData = (data) => {
    _data = data;
    return this;
  };

  this.withHeader = (key, value) => {
    _headers.push({
      key,
      value
    });

    return this;
  };

  this.withHeaders = (headers) => {
    _headers = headers;
    return this;
  };

  this.onHeadersReceived = (func) => {
    _events.onHeadersReceived = func;
    return this;
  };

  this.onOpened = (func) => {
    _events.onOpened = func;
    return this;
  };

  this.onLoading = (func) => {
    _events.onLoading = func;
    return this;
  };

  this.onDone = (func) => {
    _events.onDone = func;
    return this;
  };

  this.post = (options) => {
    if (!isValidUrl(_endpoint)) throw "Url is not valid.";

    _headers.push({
      key: "Content-Type",
      value: "application/json"
    });

    return send(
      _endpoint,
      "POST",
      JSON.stringify(_data),
      _headers,
      _events,
      options
    );
  };

  this.get = (options) => {
    if (!isValidUrl(_endpoint)) throw "Url is not valid.";
    let endpoint = (_data ? `${_endpoint}/${_data}` : _endpoint).replace(
      /\/{2,}/g,
      "/"
    );
    return send(endpoint, "GET", null, _headers, _events, options);
  };

  this.upload = (options) => {
    if (!isValidUrl(_endpoint)) throw "Url is not valid.";
    return send(_endpoint, "POST", _data, _headers, _events, options);
  };

  this.send = (method, options) => {
    if (!isValidUrl(_endpoint)) throw "Url is not valid.";
    return send(_endpoint, method, _data, _headers, _events, options);
  };

  return this;
}

function req() {
  this.init = () =>
    new http("", null, [], {
      onHeadersReceived: null,
      onOpened: null,
      onLoading: null,
      onDone: null
    });
}

const METHOD = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE"
};

exports.METHOD = METHOD;

var _default = new req();

exports.default = _default;
