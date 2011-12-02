/*
Copyright 2011 - Eric Bidelman

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ebidel@gmail.com)
*/

var self = this; // window or worker context.

self.URL = self.URL || self.webkitURL;
self.requestFileSystem = self.requestFileSystem || self.webkitRequestFileSystem;
self.resolveLocalFileSystemURL = self.resolveLocalFileSystemURL ||
                                 self.webkitResolveLocalFileSystemURL;
self.BlobBuilder = self.BlobBuilder || self.MozBlobBuilder ||
                   self.WebKitBlobBuilder;


var Utils = {

  /**
   * Turns a NodeList into an array.
   *
   * @param {NodeList} list The array-like object.
   * @return {Array} The NodeList as an array.
   */
  toArray: function(list) {
    return Array.prototype.slice.call(list || [], 0);
  },

  /*toDataURL: function(contentType, uint8Array) {
    return 'data:' + contentType + ';base64,' +
        self.btoa(this.arrayToBinaryString(uint8Array));
  },*/

  /**
   * Creates a data: URL from string data.
   *
   * @param {string} str The content to encode the data: URL from.
   * @param {string} contentType The mimetype of the data str represents.
   * @param {bool=} opt_isBinary Whether the string data is a binary string
   *     (and therefore should be base64 encoded). True by default.
   * @return {string} The created data: URL.
   */
  toDataURL: function(str, contentType, opt_isBinary) {
    var isBinary = opt_isBinary != undefined ? opt_isBinary : true;
    if (isBinary) {
      return 'data:' + contentType + ';base64,' + self.btoa(str);
    } else {
      return 'data:' + contentType + ',' + str;
    }
  },

  /**
   * Creates a blob: URL from a binary str.
   *
   * @param {string} binStr The content as a binary string.
   * @param {string=} opt_contentType An optional mimetype of the data.
   * @return {string} A new blob: URL.
   */
  strToObjectURL: function(binStr, opt_contentType) {

    var ui8a = new Uint8Array(binStr.length);
    for (var i = 0; i < ui8a.length; ++i) { 
      ui8a[i] = binStr.charCodeAt(i);
    }

    var bb = new BlobBuilder();
    bb.append(ui8a.buffer);

    var blob = opt_contentType ? bb.getBlob(opt_contentType) : bb.getBlob();

    return self.URL.createObjectURL(blob);
  },

  /**
   * Creates a blob: URL from a File or Blob object.
   *
   * @param {string} blob The File or Blob data.
   * @return {string} A new blob: URL.
   */
  fileToObjectURL: function(blob) {
    return self.URL.createObjectURL(blob);
  },

  /**
   * Create a binary string out of an array of numbers (bytes), each varying
   * from 0-255.
   *
   * @param {Array} bytes The array of numbers to transform into a binary str.
   * @return {string} The byte array as a string.
   */
  arrayToBinaryString: function(bytes) {
    if (typeof bytes != typeof []) {
      return null;
    }
    var i = bytes.length;
    var bstr = new Array(i);
    while (i--) {
      bstr[i] = String.fromCharCode(bytes[i]);
    }
    return bstr.join('');
  }
};


var MyFileError = function(obj) {
  this.prototype = FileError.prototype;
  this.code = obj.code;
  this.name = obj.name;
};


// Extend FileError with custom errors and a convenience method to get error
// code mnemonic.
FileError.BROWSER_NOT_SUPPORTED = 1000;

// TODO: remove when FileError.name is implemented (crbug.com/86014).
FileError.prototype.__defineGetter__('name', function() {
  var keys = Object.keys(FileError);
  for (var i = 0, key; key = keys[i]; ++i) {
    if (FileError[key] == this.code) {
      return key;
    }
  }
  return 'Unknown Error';
});


var Filer = new function() {

  const FS_INIT_ERROR_MSG = 'Filesystem has not been initialized.';
  const NOT_IMPLEMENTED_MSG = 'Not implemented.';
  const FS_URL_SCHEME = 'filesystem:';
  const DEFAULT_FS_SIZE = 1024 * 1024; // 1MB.

  var fs_ = null;
  var cwd_ = null;
  var isOpen_ = false;
  var baseFsUrl_ = null;

  var isFsURL_ = function(path) {
    return path.indexOf(FS_URL_SCHEME) == 0;
  };

  var pathToFsURL_ = function(cwd, path) {
    if (!isFsURL_(path)) {
      path = (path[0] != '/') ? cwd.toURL() + '/' + path : baseFsUrl_ + path;
    }
    return path;
  };

  /**
   * Looks up a FileEntry or DirectoryEntry for a given path.
   *
   * @param {function(...FileEntry|DirectorEntry)} callback A callback to be
   *     passed the entry/entries that were fetched. The ordering of the
   *     entries passed to the callback correspond to the same order passed
   *     to this method.
   * @param {...string} var_args 1-2 paths to lookup and return entries for.
   *     These can be paths or filesystem: URLs.
   */
  var getEntry_ = function(callback, var_args) {
    var srcStr = arguments[1];
    var destStr = arguments[2];

    var onError = function(e) {
      if (e.code == FileError.NOT_FOUND_ERR) {
        if (destStr) {
          throw new Error('"' + srcStr + '" or "' + destStr +
                          '" does not exist.');
        } else {
          throw new Error('"' + srcStr + '" does not exist.');
        }
      } else {
        throw new Error('Problem getting Entry for one or more paths.');
      }
    };

    // Build a filesystem: URL manually if we need to.
    var src = pathToFsURL_(cwd_, srcStr);

    if (arguments.length == 3) {
      var dest = pathToFsURL_(cwd_, destStr);

      self.resolveLocalFileSystemURL(src, function(srcEntry) {
        self.resolveLocalFileSystemURL(dest, function(destEntry) {
          callback(srcEntry, destEntry);
        }, onError);
      }, onError);
    } else {
      self.resolveLocalFileSystemURL(src, callback, onError);
    }
  };

  function Filer(fs) {
    fs_  = fs || null;
    if (fs_) {
      cwd_ = fs_.root;
      isOpen_ = true; // TODO: this may not be the case.

      // Produces something like "filesystem:http://example.com/temporary/".
      baseFsUrl_ = fs_.root.toURL();
    }
  }

  Filer.DEFAULT_FS_SIZE = DEFAULT_FS_SIZE;

  Filer.prototype = {
    get fs() {
      return fs_;
    },
    get isOpen() {
      return isOpen_;
    }
  }

  /**
   * Initializes (opens) the file system.
   *
   * @param {object=} opt_initObj Optional object literal with the following
   *     properties. Note: If {} or null is passed, default values are used.
   *     persistent {Boolean=} Whether the browser should use persistent storage.
   *         Default is false.
   *     size {int=} The storage size (in bytes) to open the filesystem with.
   *         Defaults to DEFAULT_FS_SIZE.
   * @param {Function=} opt_successCallback Optional success handler passed a
  *      DOMFileSystem object.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.init = function(opt_initObj, opt_successCallback,
                                  opt_errorHandler) {
    if (!self.requestFileSystem) {
      throw new MyFileError({
        code: FileError.BROWSER_NOT_SUPPORTED,
        name: 'BROWSER_NOT_SUPPORTED'
      });
      return;
    }

    initObj = !opt_initObj ? {} : opt_initObj; // Use defaults if obj is null.

    var size = initObj.size || DEFAULT_FS_SIZE;
    this.type = self.TEMPORARY;
    if ('persistent' in initObj && initObj.persistent) {
      this.type = self.PERSISTENT;
    }

    var init = function(fs) {
      this.size = size;
      fs_ = fs;
      cwd_ = fs_.root;
      isOpen_ = true;

      // e.g. "filesystem:http://example.com/temporary/"
      baseFsUrl_ = fs_.root.toURL();

      opt_successCallback && opt_successCallback(fs);
    };

    self.requestFileSystem(this.type, size, init.bind(this), opt_errorHandler);
  };

  /**
   * Reads the contents of a directory.
   *
   * @param {string|DirectoryEntry} dirEntryOrPath A path relative to the
   *     current working directory. In most cases that is the root entry, unless
   *     cd() has been called. A DirectoryEntry can also be passed, in which
   *     case, its contents will be returned.
   * @param {Function} successCallback Success handler passed an Array<Entry>.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.ls = function(dirEntryOrPath, successCallback,
                                opt_errorHandler) {
    if (!fs_) {
      throw new Error(FS_INIT_ERROR_MSG);
    }

    var callback = function(dirEntry) {

      cwd_ = dirEntry;

      // Read contents of current working directory. According to spec, need to
      // keep calling readEntries() until length of result array is 0. We're
      // guarenteed the same entry won't be returned again.
      var entries_ = [];
      var reader = cwd_.createReader();

      var readEntries = function() {
        reader.readEntries(function(results) {
          if (!results.length) {
            // By default, sort the list by name.
            entries_.sort(function(a, b) {
              return a.name < b.name ? -1 : b.name < a.name ? 1 : 0;
            });
            successCallback(entries_);
          } else {
            entries_ = entries_.concat(Utils.toArray(results));
            readEntries();
          }
        }, opt_errorHandler);
      };

      readEntries();
    };

    if (dirEntryOrPath.isDirectory) {
      callback(dirEntryOrPath);
    } else {
      // We were passed a path. Look up DirectoryEntry and proceeed.
      cwd_.getDirectory(dirEntryOrPath, {}, callback, opt_errorHandler);
    }
    
  };

  /**
   * Creates a new directory.
   *
   * @param {string} name The name of the directory to create.
   * @param {bool=} opt_exclusive True (default) if an error should be thrown if
   *     the directory already exists.
   * @param {Function} successCallback Success handler passed the
   *     DirectoryEntry.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.mkdir = function(name, opt_exclusive, successCallback,
                                   opt_errorHandler) {
    if (!fs_) {
      throw new Error(FS_INIT_ERROR_MSG);
    }

    var exclusive = opt_exclusive != null ? opt_exclusive : true;

    cwd_.getDirectory(name, {create: true, exclusive: exclusive},
      function (dirEntry) {
        if (dirEntry.isDirectory) {
          successCallback(dirEntry);
        } else {
          throw new Error(name + ' is not a directory');
        }
      },
      function(e) {
        if (e.code == FileError.INVALID_MODIFICATION_ERR) {
          if (opt_errorHandler) {
            opt_errorHandler(e);
          } else {
            throw new Error("'" + name + "' already exists");   
          }
        }
      }
    );
  };

  /**
   * Opens a file.
   *
   * @param {string} path The relative path of the file to open, from the
   *     current workind directory.
   * @param {Function=} opt_successCallback Optional success callback.
   *     If present, this callback is passed a File object. If no success
   *     callback is passed, the file is opened in a popup window using its
   *     filesystem: URL.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.open = function(path, opt_successCallback, opt_errorHandler) {
    if (!fs_) {
      throw new Error(FS_INIT_ERROR_MSG);
    }

    cwd_.getFile(path, {}, function(fileEntry) {
      if (opt_successCallback) {
        fileEntry.file(function(file) {
          opt_successCallback(file);
        }, opt_errorHandler);
      } else {
        // Open popup window to the entry's filesystem: URL.
        var fileWin = self.open(fileEntry.toURL(), 'fileWin');
      }
    }, opt_errorHandler);
  };

  /**
   * Creates an empty file.
   *
   * @param {string} path The relative path of the file to create, from the
   *     current workind directory.
   * @param {bool=} opt_exclusive True (default) if an error should be thrown if
   *     the file already exists.
   * @param {Function} successCallback A success callback, which is passed
   *     the new FileEntry.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.create = function(path, opt_exclusive, successCallback,
                                    opt_errorHandler) {
    if (!fs_) {
      throw new Error(FS_INIT_ERROR_MSG);
    }

    var exclusive = opt_exclusive != null ? opt_exclusive : true;

    cwd_.getFile(path, {create: true,  exclusive: exclusive}, successCallback,
      function(e) {
        if (e.code == FileError.INVALID_MODIFICATION_ERR) {
          opt_errorHandler && opt_errorHandler(e);
          throw new Error("'" + path + "' already exists");
        }
      }
    );
  };

  /**
   * Renames a file or directory in the filesystem.
   *
   * @param {FileEntry|DirectoryEntry|string} entry The file or directory to
   *     rename. If a string, a filesystem URL or a path is accepted.
   * @param {string} newName The name to rename the entry with.
   * @param {Function=} opt_successCallback An optional success callback, passed
   *     the updated entry.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.rename = function(entry, newName, opt_successCallback,
                                    opt_errorHandler) {
    // Prevent error of renaming file to same name.
    if (entry.name == newName || entry == newName) {
      return;
    }

    // Intermmediate error handler. Calls the user's error callback if present.
    var errorHandler = function(e, opt_onError) {
      if (e.code == FileError.NOT_FOUND_ERR) {
         throw new Error('"' + entry + '" does not exist.');
       } else if (e.code == FileError.INVALID_MODIFICATION_ERR) {
         throw new Error('"' + newName + '" already exists.');
       }
       opt_onError && opt_onError(e);
    };

    if (entry.isFile || entry.isDirectory) {
      entry.moveTo(cwd_, newName, opt_successCallback, function(e) {
        errorHandler(e, opt_errorHandler);
      });
    } else {
      getEntry_(function(fileOrDirEntry) {
        fileOrDirEntry.moveTo(cwd_, newName, opt_successCallback, function(e) {
          errorHandler(e, opt_errorHandler);
        });
      }, entry);
    }
  };

  /**
   * Deletes a file or directory entry.
   *
   * @param {FileEntry|DirectoryEntry} entry The file or directory to remove.
   *     If entry is a DirectoryEntry, it's contents are removed recursively.
   * @param {Function} successCallback Zero arg callback invoked on
   *     successful removal.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.rm = function(entry, successCallback, opt_errorHandler) {
    if (!fs_) {
      throw new Error(FS_INIT_ERROR_MSG);
    }

    if (entry.isFile) {
      entry.remove(successCallback, opt_errorHandler);
    } else if (entry.isDirectory) {
      entry.removeRecursively(successCallback, opt_errorHandler);
    }
  };

  /**
   * Changes the current working directory.
   *
   * @param {Function} successCallback Success callback, which is passed
   *     the DirectoryEntry of the new current directory.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.cd = function(successCallback, opt_errorHandler) {
    if (!fs_) {
     throw new Error(FS_INIT_ERROR_MSG);
    }

    throw new Error(NOT_IMPLEMENTED_MSG);
    // TODO: Implement me. Change cwd_ = fs_.root;
  }

  /**
    * Copies a file or entire directory.
    *
    * @param {string} src Relative path or file system URL of the file/directory
    *     to copy.
    * @param {string} dest Relative path or file system URL of the destination
    *     directory.
    * @param {string=} opt_newName An optional name for the copied entry.
    * @param {Function=} opt_successCallback Optional zero arg callback invoked
    *     on a successful copy.
    * @param {Function=} opt_errorHandler Optional error callback.
    */
  Filer.prototype.cp = function(src, dest, opt_newName, opt_successCallback,
                                opt_errorHandler) {
    if (!fs_) {
      throw new Error(FS_INIT_ERROR_MSG);
    }

    var newName = opt_newName || null;

    if (src.isFile || src.isDirectory) {
      // TODO
    } else {
      getEntry_(function(srcEntry, destDir) {
        if (!destDir.isDirectory) {
          throw new Error('Oops! "' + destDir.name + ' is not a directory!');
        }
        srcEntry.copyTo(destDir, newName, opt_successCallback,
                        opt_errorHandler);
      }, src, dest);
    }
  };

  /**
   * Writes data to a file.
   *
   * If the file already exists, its contents are overwritten.
   *
   * @param {string} name The name of the file to open and write to.
   * @param {object} dataObj The data to write. Example:
   *     {data: string|Blob|File|ArrayBuffer, type: mimetype}
   * @param {Function} successCallback Success callback, which is passed
   *     the created FileEntry and FileWriter object used to write the data.
   * @param {Function=} opt_errorHandler Optional error callback.
   */
  Filer.prototype.write = function(name, dataObj, successCallback,
                                   opt_errorHandler) {
    if (!fs_) {
      throw new Error(FS_INIT_ERROR_MSG);
    }

    cwd_.getFile(name, {create: true, exclusive: false}, function(fileEntry) {

      fileEntry.createWriter(function(fileWriter) {

        fileWriter.onwrite = function(e) {
          console.log('Write completed.');
        };

        fileWriter.onerror = function(e) {
          console.log('Write failed: ' + e);
        };

        /*var bb = new BlobBuilder();
        bb.append(dataObj.data);
        //fileWriter.write(bb.getBlob(dataObj.type));*/
        fileWriter.write(dataObj.data);
console.log(dataObj, typeof dataObj.data)
        successCallback(fileEntry, fileWriter);
      }, opt_errorHandler);

    }, opt_errorHandler);
  };


  return Filer;
};

