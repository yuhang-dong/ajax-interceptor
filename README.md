# Ajax Interceptor

Support `XMLHttpRequest` And `Fetch` API


## XMLHttpRequest

A Simple XMLHttpRequest Usage:
```js
const xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
if (this.readyState == 4 && this.status == 200) {
    document.getElementById("demo").innerHTML = this.responseText;
}
};
xhttp.open("GET", "xmlhttp_info.txt", true);
xhttp.send();

```

We will provide three function to intercept the `XMLHttpRequest` 
* `beforeOpen`
* `beforeSend`
* `afterResponse`

### onRequest

There are two aspects:

1. change `open` config. 
2. support async

`beforeOpen` -> `beforeSend` -> `afterResponse`


## Fetch

* `beforeFetch`
* `afterFetch`