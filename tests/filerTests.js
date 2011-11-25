
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

test('default arguments', 5, function() {
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
    stop();
    this.filer.init({}, function(fs) {
      start();
    }, onError);
  },
  teardown: function() {
    
  }
});

test('mkdir()', 5, function() {
  var filer = this.filer;
  var folderName = 'filer_test_case_folder';

  ok(filer.isOpen, 'FS opened');

  stop();
  // TODO: clean up this folder after done.
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
});

test('ls()', 5, function() {
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

  /*// Try to create a folder without first calling init().
  var filer2 = new Filer();
  try {
    stop();
    filer2.ls('.', function(entries) {}, onError);
  } catch (e) {
    ok(true, 'Attempted to use this method before calling init()');
    start();
  }*/

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
    filer2.ls('.', function(entries) {}, onError);
  } catch (e) {
    ok(true, 'Attempted to use this method before calling init()');
    start();
  }*/

});

/*
(function() {
  var reset = QUnit.reset;
  function afterTest() {
    ok( false, "reset should not modify test status" );
  }
  module("reset");
  test("reset runs assertions", function() {
    QUnit.reset = function() {
      afterTest();
      reset.apply( this, arguments );
    };
  });
  test("reset runs assertions2", function() {
    QUnit.reset = reset;
  });
})();

module("noglobals", {
  teardown: function() {
    delete window.badGlobalVariableIntroducedInTest;
  }
});
test("let teardown clean up globals", function() {
  // this test will always pass if run without ?noglobals=true
  window.badGlobalVariableIntroducedInTest = true;
});*/
