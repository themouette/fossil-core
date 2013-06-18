Fossil.Mixins.Deferrable
========================

Add the ability to defer some process while asynchronous process are done.  This
mixin is based on `[jQuery deferred
object](http://api.jquery.com/category/deferred-object/)`.

Usage
-----

### Declare asynchronous calls

Given `foo` a deferrable object, you register asynchronous processes by using
`foo.waitFor(promise, options)`.

Following options are available:

##### timeout (ms - false)

Maximum number of milliseconds allowed for this asynchronous call.

> If no timeout is given, deferred can go forever without failing. If you
> provide a timeout, then async process will be aborted automatically when
> timeout is reached.

##### failFast (bool - true)

trigger the error when this call has failed without waiting for other
asynchronous calls to return.

> Unterminated calls will still be processed, but it does not interfere with
> deferrable execution and current queue is cleared.

### Resolution callbacks

It is now possible to add callbacks when all asynchronous processes are done by
using `foo.then(success, [error, [always]])` and `foo.thenWith(context, success,
[error, [always]])`.

Parameters are:

* success: function ([promise1, promise2, ...]) {}
* error: function (exception, [promise1, promise2, ...]) {}
* always: function ([promise1, promise2, ...]) {}

> If no asynchronous call are processing, the success callback is called
> imediately, so it is a best practice to use `then` for any treatment coming
> after an event.

### aborting

Call all the enqueued failure callback. Use this function when you are sure you
start a new process.

> Unterminated calls will still be processed, but it does not interfere with
> deferrable execution and current queue is cleared.

Error handling
--------------

It is possible to handle errors automatically only if the asynchronous call has
the (default) option `failFast`.

The first argument given to

Examples
--------

### Simple

``` javascript
deferrable.wait($.get('/my/url.ext'), 2000);
deferrable.thenWith(this.ok, this.fail, this.always);
```

### Typical controller with data fetching

``` javascript
// create collections
this.friends = new FriendCollection();
this.pictures = new PictureCollection();

// controller process
this
    // ensure all previous calls are resolved
    // in case previous action didn't complete
    .abort()
    // initialize collections
    .waitFor(this.friends.fetch())
    .waitFor(this.pictures.fetch())
    // when collections are initialized
    .thenWith(this, this.render, this.renderError);
```
