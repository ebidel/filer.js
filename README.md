filer.js
=======

filer.js is a wrapper library for the [HTML5 Filesystem API](http://dev.w3.org/2009/dap/file-system/pub/FileSystem/),
an API which enables web applications to read and write files and folders to
to its own sandboxed filesystem.

Getting Started
=======

I highly recommended that you familiarize yourself with the HTML5 Filesystem API.
I've written a book on the topic, ["Using the HTML5 Filesystem API"](http://shop.oreilly.com/product/0636920021360.do),
and there's also two great articles on HTML5 Rocks that walksyou through all of
the different methods and capabilities:

1. [Exploring the FileSystem APIs](http://www.html5rocks.com/tutorials/file/filesystem/)
2. [The Synchronous FileSystem API for Workers](http://www.html5rocks.com/tutorials/file/filesystem-sync/)

Usage
-----

First, create a `Filer` object:

    var filer = new Filer();

Before using the filesystem, we need to "open" it. To initialize the library,
call the `init()` method. Its first parameter is an object literal taking two
optional arguments, `persistent` and `size`:

    filer.init({persistent: false, size: 1024 * 1024}, function(fs) {
      equals(Filer.DEFAULT_FS_SIZE * 5, filer.size,
             'size set to ' + Filer.DEFAULT_FS_SIZE * 5);
    }, onError);

If you don't initialize the the filesystem with a size, a default size of
`Filer.DEFAULT_FS_SIZE` (1MB) will be used. Thus, the previous call can be simplified
to:

    filer.init({}, function(fs) {
      equals(Filer.DEFAULT_FS_SIZE * 5, filer.size,
             'size set to ' + Filer.DEFAULT_FS_SIZE * 5);
    }, onError);


Examples
============

The underlying Filesystem API is asynchronous, therefore, the library itself has many asynchronous calls. This means you will be passing callbacks all over the place.

The first step is to request a Filesystem

    TODO

TODO