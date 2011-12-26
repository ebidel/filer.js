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
  // filer.size == Filer.DEFAULT_FS_SIZE
  // filer.isOpen == true
  // filer.fs == fs
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

General rule of thumb
---------------------

For versatility, the library accepts paths to files or directories as string
arguments (a path) or as filesystem URLs. It also can take the
`FileEntry`/`DirectoryEntry` object representing the file/directory.

ls()
-----

*List the contents of a directory.*

The first arg is a path to a directory:

```javascript
// Pass a path.
filer.ls('/', function(entries) {
  // entries in the root directory.
}, onError);

filer.ls('.', function(entries) {
  // entries in the current working directory.
}, onError);

filer.ls('path/to/some/dir/', function(entries) {
  // entries in "path/to/some/dir/"
}, onError);

// Pass a filesystem: URL.
var fsURL = filer.fs.root.toURL(); // e.g. 'filesystem:http://example.com/temporary/';
filer.ls(fsURL, function(entries) {
  // entries in the root folder.
}, onError);

// Pass a DirectorEntry.
filer.ls(filer.fs.root, function(entries) {
  // entries in the root directory.
}, onError);
```

cd()
-----

*Allows you to change into another directory.*

This is a convenience method. When using `cd()`, future operations are treated
relative to the new directory. The success callback is passed the `DirectoryEntry`
changed into.

```javascript
// Passing a path.
filer.cd('/path/to/folder', function(dirEntry) {
  ...
}, onError);

// Passing a filesystem: URL.
var fsURL = filer.fs.root.toURL(); // e.g. 'filesystem:http://example.com/temporary/';
filer.cd(fsURL + 'myDir', function(dirEntry) {
  // cwd becomes /myDir.
}, onError);

// Passing a DirectoryEntry.
filer.cd(dirEntry, function(dirEntry2) {
  // dirEntry == dirEntry2
}, onError);

filer.cd('/path/to/folder'); // Both callbacks are optional.
```

create()
-----

*Creates an empty file.*

`create()` creates an empty file in the current working directory. If you wish
to write data to a file, see the `write()` method.

```javascript
filer.create('myFile.txt', false, function(fileEntry) {
  // fileEntry.name == 'myFile.txt'
}, onError);

filer.create('/path/to/some/dir/myFile.txt', false, function(fileEntry) {
  // fileEntry.fullPath == '/path/to/some/dir/myFile.txt'
}, onError);

filer.create('myFile.txt'); // Both callbacks are optional.
```

The second (optional) argument is a boolean. Setting it to true throws an error
if the file you're trying to create already exists.

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
  // dirEntry.name == 'jazz' // Note: dirEntry is the last entry created.
}, onError);
```

The second argument to `mkdir()` a boolean indicating whether or not an error
should be thrown if the directory already exists. The last two are a success
callback and optional error callback.

rm()
-----

*Removes a file or directory.*

```javascript
TODO
```

cp()
-----

*Copies a file or directory.*

```javascript
TODO
```

rename()
-----

*Renames a file or directory.*

```javascript
TODO
```

write()
-----

*Writes content to a file.*

```javascript
TODO
```

Utility methods
============

The library contains a few utility methods to help you out.

```javascript
Util.fileToObjectURL(Blob|File);

Util.fileToArrayBuffer(blob, function(arrayBuffer) {
  ...
});

var blob = Util.arrayBufferToBlob((new Uint8Array(10)).buffer, opt_contentType);

Util.arrayBufferToBinaryString((new Uint8Array(10)).buffer, function(binStr) {
  ...
});

Util.strToObjectURL(binaryStr, opt_contentType);

Util.strToDataURL(binaryStr, contentType) // e.g. "data:application/pdf;base64,Ym9keSB7IG..."
// For plaintext (non-binary data):
// Util.strToDataURL('body { background: green; }', 'text/css', false) == data:text/css,body { background: green; }

Util.arrayToBinaryString(bytes); // bytes is an Array, each varying from 0-255.

Util.getFileExtension('myfile.txt') == '.txt'

// Util.toArray(DOMList/NodeList) == Array
document.querySelector('input[type="file"]').onchange = function(e) {
  Util.toArray(this.files).forEach(function(file, i) {
    // blah blah blah.
  });
};
```

