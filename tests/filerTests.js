
/*test("module without setup/teardown (default)", function() {
  expect(1);
  ok(true);
});

test("expect in test", 3, function() {
  ok(true);
  ok(true);
  ok(true);
});*/

function onError(e) {
  ok(false, 'unexpected error' + e.toString());
  start();
};

module('init()', {
  setup: function() {
    if (document.location.protocol == 'file:') {
      ok(false, 'These tests need to be run from a web server over http://.');
    }

    this.filer = new Filer();
  },
  teardown: function() {

  }
});


/*asyncTest('browser not supported', 1, function() {
  this.filer = new Filer();

  raises(function() {
    var temp = window.requestFileSystem;
    window.requestFileSystem = null; // pretend we're a browser without support.
    this.filer.init({}, function(fs) {});
    window.requestFileSystem = temp;
  }, 'BROWSER_NOT_SUPPORTED thrown');

  start();

});*/

test('default arguments', 6, function() {
  var filer = this.filer;

  equals(filer.isOpen, false, 'filesystem not open');

  stop();
  filer.init({}, function(fs) {
    equals(Filer.DEFAULT_FS_SIZE, filer.size,
           'default size used == ' + Filer.DEFAULT_FS_SIZE);
    equals(self.TEMPORARY, filer.type, 'TEMPORARY storage used by default');
    equals(filer.isOpen, true, 'filesystem opened');

    var filer2 = new Filer(filer.fs);
    ok(filer2.fs === filer.fs,
       'filesystem initialized with existing DOMFileSystem object');
    start();
  }, onError);

  stop();
  filer.init(null, function(fs) {
    ok('null used as first arg to init()');
    start();
  }, onError);
});

test('set size', 2, function() {
  var filer = new Filer();

  stop();
  filer.init({persistent: false, size: Filer.DEFAULT_FS_SIZE * 5}, function(fs) {
    equals(Filer.DEFAULT_FS_SIZE * 5, filer.size,
           'size set to ' + Filer.DEFAULT_FS_SIZE * 5);
    start();
  }, onError);

  stop();
  var filer2 = new Filer();
  filer2.init({persistent: true, size: Filer.DEFAULT_FS_SIZE * 2}, function(fs) {
    equals(Filer.DEFAULT_FS_SIZE * 2, filer2.size,
           'persistent size set to ' + Filer.DEFAULT_FS_SIZE * 2);
    start();
  }, onError);

});

test('storage type', 4, function() {
  var filer = this.filer;

  stop();
  filer.init({}, function(fs) {
    equals(Filer.DEFAULT_FS_SIZE, filer.size,
           'default size used == ' + Filer.DEFAULT_FS_SIZE);
    equals(self.TEMPORARY, filer.type,
           'TEMPORARY storage used by default');
    start();
  }, onError);

  stop();
  var filer2 = new Filer();
  filer2.init({persistent: false}, function(fs) {
    equals(self.TEMPORARY, filer2.type,
           'TEMPORARY storage used');
    start();
  }, onError);

  var filer3 = new Filer();
  filer3.init({persistent: true}, function(fs) {
    equals(self.PERSISTENT, filer3.type,
           'PERSISTENT storage used');
    start();
  }, onError);

});


module('methods', {
  setup: function() {
    this.filer = new Filer();
    this.FOLDER_NAME = 'filer_test_case_folder';
    this.FILE_NAME = 'filer_test_case.filer_test_case';
    stop();
    this.filer.init({}, function(fs) {
      start();
    }, onError);
  },
  teardown: function() {
    /*stop();
    this.filer.rm(this.FOLDER_NAME, function() {
      //start();
    }, onError);*/
  }
});

test('mkdir()', 5, function() {
  var filer = this.filer;
  var folderName = this.FOLDER_NAME;

  ok(filer.isOpen, 'FS opened');

  stop();
  filer.mkdir(folderName, false, function(entry) {
    ok(entry.isDirectory, 'created folder is a DirectoryEntry');
    equals(entry.name, folderName, 'created folder is named "' + folderName + '"');
    start();
  }, onError);

  stop();
  filer.mkdir(folderName, true, function(entry) {
    ok(false);
    start();
  }, function(e) {
    ok(true, "Attempted to create a folder that already exists");
    start();
  });

  // Try to create a folder without first calling init().
  var filer2 = new Filer();
  try {
    stop();
    filer2.mkdir(folderName, false, function(entry) {}, onError);
  } catch (e) {
    ok(true, 'Attempt to use this method before calling init()');
    start();
  }

  // TODO: cleanup for this test, although it is done later.
});

test('ls()', 6, function() {
  var filer = this.filer;

  ok(filer.isOpen, 'FS opened');
  ok(self.TEMPORARY == filer.type, 'TEMPORARY storage used');

  stop();
  filer.ls('.', function(entries) {
    ok(entries.slice, 'returned entries is an array') // Verify we got an Array.
    filer.ls('/', function(entries2) {
      equals(entries.length, entries2.length, 'Num root entries matches');
      start();
    }, onError);
  }, onError);

  stop();
  filer.ls('/myfolderthatdoesntexist' + Date.now(), function(entries) {
    ok(false);
    start();
  }, function(e) {
    ok(true, "Path doesn't exist");
    start();
  });

  stop();
  filer.ls(filer.fs.root, function(entries) {
    ok(true, 'DirEntry as argument');
    start();
  }, function(e) {
    ok(false);
    start();
  });

  /*// Try to create a folder without first calling init().
  var filer2 = new Filer();
  try {
    stop();
    filer2.ls('.', function(entries) {
      start();
    }, onError);
  } catch (e) {
    ok(true, 'Attempted to use this method before calling init()');
    start();
  }*/

});


test('cd()', 5, function() {
  var filer = this.filer;
  var folderName = this.FOLDER_NAME;

  stop();
  filer.cd('.', function(dirEntry) {
    ok(dirEntry.isDirectory, 'cd folder is a DirectoryEntry');
    start();
  }, onError);

  stop();
  filer.mkdir(folderName, false, function(dirEntry) {
    filer.cd(folderName, function(dirEntry) {
      ok(true, 'cd with path name as an argument.');
      start();
    }, onError);
  });

  stop();
  filer.mkdir(folderName, false, function(dirEntry) {
    filer.cd('/' + folderName, function(dirEntry) {
      ok(true, 'cd with abspath name as an argument.');
      start();
    }, onError);
  });

  stop();
  filer.mkdir(folderName, false, function(dirEntry) {
    filer.cd(dirEntry, function(dirEntry) {
      ok(true, 'cd with DirectoryEntry as an argument.');
      filer.ls('.', function(entries) {
        equals(entries.length, 0, 'Empty directory');
        start();
      }, onError);
    }, onError);
  });

  // Clean up.
  stop();
  filer.rm(folderName, function() {
    start();
  }, onError);

  // TODO: test optional callback args to cd().
});

test('create()', 3, function() {
  var filer = this.filer;
  var fileName = this.FILE_NAME;

  stop();
  filer.create(fileName, false, function(entry) {
    ok(entry.isFile, 'created folder is a FileEntry');
    equals(entry.name, fileName, 'created file named "' + fileName + '"');
    start();
  }, onError);

  stop();
  filer.create(fileName, true, function(entry) {
    ok(false);
    start();
  }, function(e) {
    ok(true, "Attempted to create a file that already exists");
    start();
  });

  // Clean up.
  stop();
  filer.rm(fileName, function() {
    start();
  }, onError);
});

test('rm()', 3, function() {
  var filer = this.filer;
  var fileName = this.FILE_NAME;

  stop();
  filer.create(fileName, false, function(entry) {
    filer.rm(fileName, function() {
      ok(true, fileName + ' removed by path.')
      start();
    }, onError);
  }, onError);

  stop();
  var fileName2 = fileName + '2';
  filer.create(fileName2, false, function(entry) {
    filer.rm(entry, function() {
      ok(true, fileName2 + ' removed by entry.')
      start();
    }, onError);
  }, onError);

  stop();
  var fileName3 = fileName + '3';
  filer.create(fileName3, false, function(entry) {
    var fsURL = filer.pathToFilesystemURL(entry.fullPath);
    filer.rm(fsURL, function() {
      ok(true, fileName3 + ' removed by filesystem URL.')
      start();
    }, onError);
  }, onError);
});

/*
test('rename()', 1, function() {

});
*/