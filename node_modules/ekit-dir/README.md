# ekit-dir
A small node.js module to provide some convenience methods for dealing with dir.

#### methods
For the sake of brevity, assume that the following line of code precedes all of the examples.

```javascript
var dir = require('ekit-dir');
```

#### subdirs( dir, callback )
List all subdir in dir (not recursive)

```javascript
dir.subdirs(__dirname, function(err, subdirs) {
    if (err) throw err;
    console.log(subdirs);
});
```

#### contributors
- [hungtaoquang](https://github.com/hungtaoquang)
- [robatron](https://github.com/robatron)
- [nazomikan](https://github.com/nazomikan)

## License
MIT licensed (See LICENSE.txt)
