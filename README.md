filer.js
=======

filer.js is a wrapper library for the [HTML5 Filesystem API](http://dev.w3.org/2009/dap/file-system/pub/FileSystem/),
an API which enables web applications to read and write files and folders to to
its own sandboxed filesystem.

Unlike other wrapper libraries [[1], [2]], filer.js takes a different approach
by reusing familiar UNIX commands (`cp`, `mv`, `ls`) for its API. The goal is to
make the HTML5 API more approachable for developers that have done file I/O in
other languages.

[1]: https://github.com/ajaxorg/webfs
[2]: http://code.google.com/p/closure-library/source/browse/trunk/closure/goog/fs/fs.js

Getting started
=======

I highly recommended that you familiarize yourself with the HTML5 Filesystem API.
I've written a book on the topic, ["Using the HTML5 Filesystem API"](http://shop.oreilly.com/product/0636920021360.do),
and there are two great articles on HTML5 Rocks that walk you through all of its
different methods and capabilities:

1. [Exploring the FileSystem APIs](http://www.html5rocks.com/tutorials/file/filesystem/)
2. [The Synchronous FileSystem API for Workers](http://www.html5rocks.com/tutorials/file/filesystem-sync/)

Usage
-----

The underlying Filesystem API is asynchronous, therefore, the library calls are
mostly asynchronous. This means you'll be passing callbacks all over the place.

First, create a `Filer` object:

    var filer = new Filer();

Next, initialize the library:

```javascript
filer.init({persistent: false, size: 1024 * 1024}, function(fs) {
  //  filer.size == Filer.DEFAULT_FS_SIZE
}, onError);
```

The first argument is an optional initialization object that can contain two
properties, `persistent` (the type of storage to use) and `size`. The second and
third arguments are a success and error callback, respectively:

The success callback is passed a `LocalFileSystem` object. If you don't initialize
the the filesystem with a size, a default size of `Filer.DEFAULT_FS_SIZE` (1MB)
will be used. Thus, the previous call can be simplified to:

```javascript
filer.init({}, function(fs) {
  ...
}, onError);

filer.init(); // All parameters are optional.
```

**Error handling**

Many methods take an optional error callback as their last argument. It can be a
good idea to setup a global error handler for all methods to use:

```javascript
function onError(e) {
  console.log('Error' + e.name);
}
```

Examples
============

ls()
-----

*List the contents of a directory.*

The first arg is a path to a directory:

```javascript
filer.ls('.', function(entries) {
  // entries in the current working directory.
}, onError);
```

```javascript
filer.ls('path/to/some/dir/', function(entries) {
  // entries in "path/to/some/dir/"
}, onError);
```

For versatility, the library accepts paths to files and directories as string
values or as `FileEntry`/`DirectoryEntry` objects. For example, you can pass a
`DirectorEntry` to `ls()`:

```javascript
filer.ls(filer.fs.root, function(entries) {
  // entries in the root directory.
}, onError);
```

which equivalent to:

```javascript
filer.ls('/', function(entries) {
  // entries in the root directory.
}, onError);
```

cd()
-----

*Allows you to change into another directory.*

When using `cd()`, future operations are treated relative to the new directory.
As a convenience, the success callback is passed the `DirectoryEntry` changed
into.

```javascript
// Passing a path.
filer.cd('/path/to/folder', function(dirEntry) {
  ...
}, onError);

// Passing a DirectoryEntry.
filer.cd(dirEntry, function(dirEntry2) {
  // dirEntry == dirEntry2
}, onError);

filer.cd('/path/to/folder'); // Both callbacks are optional.
```

mkdir()
-----

*Creates an empty directory.*

```javascript
filer.mkdir('myFolder', false, function(dirEntry) {
  // dirEntry.isDirectory == true
  // dirEntry.name == 'myFolder'
}, onError);
```

You can pass `mkdir()` a folder name or a path to create. In the latter,
it behaves like UNIX's `mkdir -p`, creating each intermediate directory as needed.

For example, the following would create a new hierarchy ("music/genres/jazz") in
the current folder:

```javascript
filer.mkdir('music/genres/jazz/', false, function(dirEntry) {
  // dirEntry.isDirectory == true
  // dirEntry.name == 'myFolder'
}, onError);
```

The second argument to `mkdir()` a boolean indicating whether or not an error
should be thrown if the directory already exists. The last two are a success
callback and optional error callback.
