filer.js
=======

filer.js is a wrapper library for the [HTML5 Filesystem API](http://dev.w3.org/2009/dap/file-system/pub/FileSystem/), an API which enables web applications to read and write files and folders to to its own sandboxed filesystem.

Unlike other wrapper libraries [[1], [2]], filer.js takes a different approach by reusing familiar UNIX commands (`cp`, `mv`, `ls`) for its API. The goal is to make the HTML5 API more approachable for developers that have done file I/O in other languages.

[1]: https://github.com/ajaxorg/webfs
[2]: http://code.google.com/p/closure-library/source/browse/trunk/closure/goog/fs/fs.js

Getting started
=======

I highly recommended that you familiarize yourself with the HTML5 Filesystem API. I've written a book on the topic, ["Using the HTML5 Filesystem API"](http://shop.oreilly.com/product/0636920021360.do), and there are two great articles on HTML5 Rocks that walk you through all of its different methods and capabilities:

1. [Exploring the FileSystem APIs](http://www.html5rocks.com/tutorials/file/filesystem/)
2. [The Synchronous FileSystem API for Workers](http://www.html5rocks.com/tutorials/file/filesystem-sync/)

Usage
-----

The underlying Filesystem API is asynchronous, therefore, the library calls are mostly asynchronous. This means you'll be passing callbacks all over the place.

First, create a `Filer` object:

    var filer = new Filer();

Next, initialize the library:

```javascript
filer.init({persistent: false, size: 1024 * 1024}, function(fs) {
  //  filer.size == Filer.DEFAULT_FS_SIZE
}, onError);
```

The first argument is an optional initialization object that can contain two properties, `persistent` (the type of storage to use) and `size`. The second and third arguments are a success and error callback, respectively:

The success callback is passed a `LocalFileSystem` object. If you don't initialize the the filesystem with a size, a default size of `Filer.DEFAULT_FS_SIZE` (1MB) will be used. Thus, the previous call can be simplified to:

```javascript
filer.init({}, function(fs) {
  ...
}, onError);
```

Examples
============

To list the files in the current directory:

```javascript
filer.ls('.', function(entries) {
  // entries
}, onError);
```

TODO