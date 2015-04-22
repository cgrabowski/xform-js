/**
 * tests for xform-js
 *
 * @author Christopher Grabowski
 *
 */

var xform;
var obj1;
var obj2;
var error;
var msg;
var threw = false;

if (this.xform == null) {
  xform = require('./xform.js');
} else {
  xform = this.xform;
}

/*
 * Some testing utilities
 */

Object.defineProperty(this, '__stack', {
  get: function() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack) {
      return stack;
    };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(this, '__line', {
  get: function() {
    return this.__stack[2].getLineNumber();
  }
});

function assert(assertion, message) {
  if (typeof assertion !== 'boolean') {
    console.error('line ' + this.__line + ': argument to assert not of type boolean');
  } else if (assertion === false) {
    if (message == null) {
      message = "Assertion failed.";
    }
    console.error('line ' + this.__line + ': ' + message);
  }
}


/* * * * * * * * * * * * *
 *
 * utility function tests
 *
 * * * * * * * * * * * * */

/*
 * usingNamespace
 */

if (typeof GLOBAL !== 'undefined') {
  xform.usingNamespace(GLOBAL);
} else {
  xform.usingNamespace(this);
}
assert(Dimensional === xform.Dimensional);
assert(Dimensions === xform.Dimensions);
assert(Vector === xform.Vector);
assert(Matrix === xform.Matrix);
assert(Quaternion === xform.Quaternion);
assert(Attitude === Attitude);
assert(DimensionError === xform.DimensionError);
assert(dimCheck === xform.dimCheck);
assert(arrayIndexedEntriesEqual === xform.arrayIndexedEntriesEqual);

/*
 * arrayIndexedEntriesEqual
 */

// arrayIndexedEntriesEqual with unequal Arrays
obj1 = [2, 3, [4, 5, [6, 7], 8], 9, [0, 1]];
obj2 = [2, 3, [4, 5, [6, 7], 8, 9], 0, [1, 2]];
assert(!arrayIndexedEntriesEqual(obj1, obj2));

// arrayEquals with equal Arrays
obj1 = [2, 3, [4, 5, [6, 7], 8], 9, [0, 1, [2], 3, [4]], 5, 6];
obj2 = [2, 3, [4, 5, [6, 7], 8], 9, [0, 1, [2], 3, [4]], 5, 6];
assert(arrayIndexedEntriesEqual(obj1, obj2));


/*
 * dimCheck tests
 */

// dimCheck with unequal Dimensionals
obj1 = new Dimensional([2, 3, 4]);
obj2 = new Dimensional([2, 3, 5]);
try {
  dimCheck(obj1, obj2);
} catch (e) {
  assert(e.dims.equals([
    [2, 3, 4],
    [2, 3, 5]
  ]));
}

// dimCheck with unequal Dimensional and Array
try {
  dimCheck(obj1, [2, 3, 4]);
} catch (e) {
  assert(e.dims.equals([
    [2, 3, 4],
    [3]
  ]));
}

// dimCheck with unequal Arrays
try {
  dimCheck([2, 3], [4, 5, 6]);
} catch (e) {
  assert(e.dims.equals([
    [2],
    [3]
  ]));
}

// dimCheck with two equal Dimensionals
obj1 = new Dimensional([2, 3, 4, 5]);
obj2 = new Dimensional([2, 3, 4, 5]);
try {
  dimCheck(obj1, obj2);
} catch (e) {
  assert(false);
}

// dimCheck with equal Dimensional and Array
obj1 = new Dimensional([4]);
try {
  dimCheck(obj1, [2, 3, 4, 5]);
} catch (_) {
  assert(false);
}

// dimCheck with equal Arrays
try {
  dimCheck([2, 3, 4, 5, 6], [7, 8, 9, 0, 1]);
} catch (_) {
  assert(false);
}

obj1 = null;
obj2 = null;

/* * * * * * * * * * * * *
 *
 * DimensionError tests
 *
 * * * * * * * * * * * * */

// DimensionError(String)
msg = 'test';
error;
try {
  throw new DimensionError(msg);
} catch (e) {
  error = e;
}
assert(error.message === 'test');
msg = null;
error = null;

// DimensionError(number)
try {
  throw new DimensionError(2, 3);
} catch (e) {
  error = e;
}
assert(error.dims.equals([
  [1],
  [1]
]));
error = null;

// DimensionError(Dimensional)
obj1 = {};
obj2 = {};
obj1.dim = [1, 2, 3];
obj2.dim = [4, 5, 6];
try {
  throw new DimensionError(obj1, obj2);
} catch (e) {
  error = e;
}
assert(error.dims.equals([obj1.dim, obj2.dim]));

// DimensionError(Array)
try {
  throw new DimensionError(new Array(2), new Array(3));
} catch (e) {
  error = e;
}
assert(error.dims.equals([
  [2],
  [3]
]));

// default
try {
  throw new DimensionError({}, {});
} catch (e) {
  error = e;
}
assert(error.dims.equals([
  [null],
  [null]
]));


/* * * * * * * * * * * * *
 *
 * Dimensional tests
 *
 * * * * * * * * * * * * */

// Dimensional.prototype.equals with unequal Dimensional(Array)
obj1 = new Dimensional([2, 3, 4]);
obj2 = new Dimensional([2, 3, 5]);
assert(!obj1.equals(obj2));

// Dimensional.prototype.equals with equal Dimensional(Array)
obj1 = new Dimensional([2, 3, 4]);
obj2 = new Dimensional([2, 3, 4]);
assert(obj2.equals(obj1));

// Dimensional.prototype.equals with unequal Dimensional(number)
obj1 = new Dimensional(3);
obj2 = new Dimensional(4);
assert(!obj1.equals(obj2));

// Dimensional.prototype.equals with equal Dimensional(number)
obj1 = new Dimensional(5);
obj1.equals(new Dimensional(5));


/* * * * * * * * * * * * *
 *
 * Dimensions tests
 *
 * * * * * * * * * * * * */

// Dimensions(array)
obj1 = new Dimensions([2, 3, 4]);
assert(obj1[0] === 2 && obj1[1] === 3 && obj1[2] === 4);
// Dimensions(number)
assert(new Dimensions(3)[0] === 3);

// equals with unequal Dimensions objects
obj2 = new Dimensions([3, 4, 5]);
assert(!obj1.equals(obj2));

// equals with equal Dimensions objects
obj2 = new Dimensions([2, 3, 4]);
assert(obj1.equals(obj2));

// equals with unequal Dimensions(array) and Dimensions(number) objects
obj1 = new Dimensions([4]);
obj2 = new Dimensions(5);
assert(!obj1.equals(obj2));

// equals with equal Dimensions(array) and Dimensions(number) objects
obj1 = new Dimensions([5]);
assert(obj1.equals(obj2));

// Dimensions.setArray
obj1 = new Dimensions([5]).set([6, 7]);
assert(obj1.equals([6, 7]));
obj1 = new Dimensions([8, 9]).set([4]);
assert(obj1.equals([4]));

/* * * * * * * * * * * * *
 *
 * Vector tests
 *
 * * * * * * * * * * * * */

// Vector(number)
obj1 = new Vector(4);
assert(obj1[0] === 0 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 0);
assert(typeof obj1[4] === 'undefined');

// Vector(Array)
obj2 = new Vector([9, 8, 7, 6, 5, 4]);
assert(obj2[0] === 9 && obj2[1] === 8 && obj2[2] === 7 && obj2[3] === 6);
assert(obj2[4] === 5 && obj2[5] === 4);
assert(typeof obj2[6] === 'undefined');

// equals with unequal Vectors
obj1 = new Vector([9, 8, 7, 6, 5, 4]);
obj2 = new Vector([9, 8, 7, 6, 5, 5]);
assert(!obj1.equals(obj2));
assert(!obj1.equals([9, 8, 7, 6, 5]));

// equals with equal Vectors
obj2 = new Vector([9, 8, 7, 6, 5, 4]);
assert(obj1.equals(obj2));

// Vector.flatten
obj1 = new Vector([
  new Vector([0, 1]),
  new Vector([2, 3]),
  new Vector([4, 5])
]);
assert(arrayIndexedEntriesEqual(Vector.flatten(obj1, Array), [0, 1, 2, 3, 4, 5]));
obj2 = new Float32Array([0, 1, 2, 3, 4, 5]);
assert(arrayIndexedEntriesEqual(Vector.flatten(obj1, Float32Array), obj2));

// Vector.dot
obj1 = new Vector([9.3, 8.2, 7.1, 6, 5.9, 4.8]);
obj2 = new Vector([9.7, 8.6, 7.5, 6.3, 5.2, 4.1]);
assert(Vector.dot(obj1, obj2) === 302.14);
obj1 = new Vector(3);
obj2 = new Vector(3);
assert(Vector.dot(obj1, obj2) === 0);

// Vector.cross
assert(Vector.cross(obj1, obj2).equals([0, 0, 0]));
obj1 = new Vector([1, 0, 0]);
obj2 = new Vector([0, 1, 0]);
assert(Vector.cross(obj1, obj2).equals([0, 0, 1]));
obj1 = new Vector([-0.5, 0.5, -0.75]);
obj2 = new Vector([0.75, -0.75, 0.5]);
assert(Vector.cross(obj1, obj2).equals([-0.3125, -0.3125, 0]));

// Vector.quadrance
obj1 = new Vector([1, 1, 2, 3, 5]);
obj2 = new Vector([8, 13, 21, 34, 55]);
assert(Vector.quadrance(obj1, obj2) === 440);

// Vector.magnitude
obj1 = new Vector([2, 3, 4, 5, 6]);
assert(obj1.magnitude().toString().substr(0, 10) == '9.48683298');
obj1 = new Vector([0, 0, 0]);
assert(obj1.magnitude() === 0);

// Vector.add
obj1 = new Vector([3, 5, 7, 9]);
obj2 = new Vector([5, 6, 7, 10]);
assert(obj1.add(obj2).equals([8, 11, 14, 19]));
obj1 = new Vector([0, 0, 0]);
obj2 = new Vector([0, 0, 0]);
assert(obj1.add(obj2).equals([0, 0, 0]));

// Vector.set
obj1 = new Vector(4);
assert(obj1.set([0.11, 1.22, 2.33, 3.44]).equals([0.11, 1.22, 2.33, 3.44]));

// Vector.normalize
obj1 = new Vector([3, 4]).normalize();
assert(obj1[0] === 3 / 5 && obj1[1] === 4 / 5);
obj1 = new Vector([2, 3, 5, 7]);
assert(new Vector(obj1.normalize().map(function(ele) {
  return ele.toString().substr(0, 10);
})).equals(['0.21442250', '0.32163376', '0.53605626', '0.75047877']));

// Vector.toArray()
obj1 = new Vector([1, 2, 3, 4]).toArray();
assert(obj1[0] === 1 && obj1[1] === 2 && obj1[2] === 3 && obj1[3] === 4);
assert(!(obj1 instanceof Vector));
obj1 = new Vector([9, 8, 7, 6, 5, 4, 3, 2]).toArray();
assert(obj1[0] === 9 && obj1[1] === 8 && obj1[2] === 7 && obj1[3] === 6);
assert(obj1[4] === 5 && obj1[5] === 4 && obj1[6] === 3 && obj1[7] === 2);
assert(!(obj1 instanceof Vector));

/* * * * * * * * * * * * *
 *
 * Matrix tests
 *
 * * * * * * * * * * * * */

// Matrix(m, n)
obj1 = new Matrix(2, 2);
assert(obj1[0] === 1 && obj1[1] === 0);
assert(obj1[2] === 0 && obj1[3] === 1);

obj1 = new Matrix(3, 2);
assert(obj1[0] === 1 && obj1[1] === 0);
assert(obj1[2] === 0 && obj1[3] === 1);
assert(obj1[4] === 0 && obj1[5] === 0);
assert(obj1.dim.equals([3, 2]));

obj1 = new Matrix();
assert(obj1[0] === 1 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 0);
assert(obj1[4] === 0 && obj1[5] === 1 && obj1[6] === 0 && obj1[7] === 0);
assert(obj1[8] === 0 && obj1[9] === 0 && obj1[10] === 1 && obj1[11] === 0);
assert(obj1[12] === 0 && obj1[13] === 0 && obj1[14] === 0 && obj1[15] === 1);
assert(obj1.dim.equals([4, 4]));

// Matrix.mul
obj1 = new Matrix(2, 2);
obj2 = new Vector([2, 3]);
assert(Matrix.mul(obj1, obj2).equals([2, 3]));
obj1.set([-2, 5, 4, 8]);
obj2.set([17, 19]);
assert(Matrix.mul(obj1, obj2) instanceof Vector);
assert(Matrix.mul(obj1, obj2).equals([61, 220]));

obj1 = new Matrix(2, 2).set([1, 2, 3, 4]);
obj2 = new Matrix(2, 4).set([10, 9, 8, 7, 6, 5, 4, 3]);
assert(Matrix.mul(obj1, obj2).dim[0] === 2);
assert(Matrix.mul(obj1, obj2).dim[1] === 4);
assert(Matrix.mul(obj1, obj2).equals([
  22, 19, 16, 13,
  54, 47, 40, 33
]));

obj1 = new Matrix();
obj2 = new Vector([1, 1, 1, 1]);
assert(Matrix.mul(obj1, obj2).equals([1, 1, 1, 1]));
for (var i = 0, len = obj1.length; i < len; ++i) {
  obj1[i] = i + 1;
}
obj2.set([1, 2, 3, 4]);
assert(Matrix.mul(obj1, obj2) instanceof Vector);
assert(Matrix.mul(obj1, obj2).equals([30, 70, 110, 150]));
obj1 = new Matrix();
for (var i = 0, len = obj1.length; i < len; ++i) {
  obj1[i] = i + 1;
}

obj2 = new Matrix();
for (var i = 0, len = obj2.length; i < len; ++i) {
  obj2[i] = 16 - i;
}
assert(Matrix.mul(obj1, obj2) instanceof Matrix);
assert(Matrix.mul(obj1, obj2).equals([
  80, 70, 60, 50,
  240, 214, 188, 162,
  400, 358, 316, 274,
  560, 502, 444, 386
]));
assert(obj1.mul(obj2).equals([
  80, 70, 60, 50,
  240, 214, 188, 162,
  400, 358, 316, 274,
  560, 502, 444, 386
]));

// Matrix.det
obj1 = new Matrix(2, 2);
assert(Matrix.det(obj1) === 1);
obj1.zero();
assert(Matrix.det(obj1) === 0);
obj1.set([1, -10, 20, -300]);
assert(Matrix.det(obj1) === -100);
assert(obj1.det() === -100);

obj1 = new Matrix(3, 3);
assert(Matrix.det(obj1) === 1);
obj1.zero();
assert(Matrix.det(obj1) === 0);
obj1.map(function(ele, i, _) {
  return (i % 8 === 0) ? 1 : 0;
});
assert(Matrix.det(obj1) === 0);
obj1.set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert(Matrix.det(obj1) === 0);
obj1.set([2, 4, 8, 16, 32, 64, 128, 256, 512]);
assert(Matrix.det(obj1) === 0);
obj1.set([2, 3, 4, 9, 16, 25, 128, 256, 513]);
assert(Matrix.det(obj1) === 389);

obj1 = new Matrix();
assert(Matrix.det(obj1) === 1);
obj1.zero();
assert(Matrix.det(obj1) === 0);
obj1.forEach(function(_, i, arr) {
  arr[i] = (i % 10 === 0 && i !== 15) ? 1 : 0
});
assert(Matrix.det(obj1) === 0);
obj1.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
assert(Matrix.det(obj1) === 0);
obj1.set([2, 3, 4, 5, 9, 16, 25, 36, 128, 256, 512, 1028, 3, 4, 5, 6]);
assert(Matrix.det(obj1) === -264);
assert(obj1.det() === -264);

obj1 = new Matrix(5, 5);
assert(Matrix.det(obj1) === 1);
obj1.zero();
assert(Matrix.det(obj1) === 0);
obj1.forEach(function(_, i, arr) {
  arr[i] = i + 1;
});
assert(Matrix.det(obj1) === 0);
obj1.forEach(function(ele, i, arr) {
  arr[i] = ele + i;
});
obj1[1] = -30;
obj1[12] = 1;
obj1[18] = 2;
obj1[20] = -47;
assert(Matrix.det(obj1) === 37276800);
assert(obj1.det() === 37276800);

// Matrix.invert
obj1 = new Matrix(2, 2);
assert(Matrix.invert(obj1).equals(obj1));
obj1.zero();

threw = false;
try {
  Matrix.invert(obj1);
} catch (_) {
  threw = true;
}
assert(threw);

obj1.set([2, 1 / 2, 5 / 3, 5 / 6]);
assert(Matrix.invert(obj1).equals([1, -3 / 5, -2, 12 / 5]));

obj1 = new Matrix(3, 3);
assert(Matrix.invert(obj1).equals(obj1));
obj1.zero();

threw = false;
try {
  Matrix.invert(obj1);
} catch (_) {
  threw = true;
}
assert(threw);

obj1.map(function(ele, i, _) {
  return (i % 8 === 0) ? 1 : 0;
});

threw = false;
try {
  Matrix.invert(obj1);
} catch (_) {
  threw = true;
}
assert(threw);

obj1.set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

threw = false;
try {
  Matrix.invert(obj1);
} catch (_) {
  threw = true;
}
assert(threw);

obj1.set([1, 1, 2, 0, 2, 3, 1, 2, 4]);
assert(Matrix.invert(obj1).equals([
  2, 0, -1,
  3, 2, -3, -2, -1, 2
]));

obj1 = new Matrix();
assert(Matrix.invert(obj1).equals(obj1));
obj1.zero();

threw = false;
try {
  Matrix.invert(obj1);
} catch (_) {
  threw = true;
}
assert(threw);

obj1.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

threw = false;
try {
  Matrix.invert(obj1);
} catch (_) {
  threw = true;
}
assert(threw);

obj1.set([
  1, 1, 2, 3,
  0, 3, 0, 2,
  3, 0, 6, 6,
  0, 9, 3, 4
]);
assert(Matrix.invert(obj1).equals([-10, 16 / 3, 11 / 3, -2 / 3, -2, 1, 2 / 3, 0,
  2, -5 / 3, -2 / 3, 1 / 3,
  3, -1, -1, 0
]));

obj1.set([-2, 0, 0, -6,
  2, 2, 2, -2,
  4, -4, -1, 0,
  0, 0, 0, -8
]);
assert(Matrix.invert(obj1).equals([-1 / 2, 0, 0, 3 / 8, -5 / 6, -1 / 6, -1 / 3, 2 / 3,
  4 / 3, 2 / 3, 1 / 3, -7 / 6,
  0, 0, 0, -1 / 8
]));

obj1 = new Matrix(5, 5);
assert(Matrix.invert(obj1).equals(obj1));
obj1.zero();

threw = false;
try {
  Matrix.invert(obj1);
} catch (e) {
  threw = true;
}
assert(threw);

obj1.set([
  1, 0, 1, 0, 2,
  0, 1, 0, 4, 3,
  0, 2, 1, 0, 4,
  0, 1, 0, 1, 5,
  0, 1, 1, 0, 1
]);
assert(Matrix.invert(obj1).equals([
  1, 1 / 2, 5 / 2, -2, -7 / 2,
  0, 3 / 8, 17 / 8, -3 / 2, -17 / 8,
  0, -1 / 4, -7 / 4, 1, 11 / 4,
  0, 1 / 4, -1 / 4, 0, 1 / 4,
  0, -1 / 8, -3 / 8, 1 / 2, 3 / 8
]));

// Matrix.set
obj1 = new Matrix(2, 2).set([5, 6], 2);
assert(obj1[0] === 1 && obj1[1] === 0);
assert(obj1[2] === 5 && obj1[3] === 6);

obj1 = new Matrix(2, 3).set([1, 2, 3, 4, 5, 6]);
assert(obj1.equals([1, 2, 3, 4, 5, 6]));
obj2 = new Matrix(3, 2).set([6, 5, 4, 3, 2, 1]);
assert(obj2.equals([6, 5, 4, 3, 2, 1]));

obj1 = new Matrix().set([10, 11, 12, 13, 14, 15], 10);
assert(obj1[0] === 1 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 0);
assert(obj1[4] === 0 && obj1[5] === 1 && obj1[6] === 0 && obj1[7] === 0);
assert(obj1[8] === 0 && obj1[9] === 0 && obj1[10] === 10 && obj1[11] === 11);
assert(obj1[12] === 12 && obj1[13] === 13 && obj1[14] === 14 && obj1[15] === 15);

// Matrix.setEntry
obj1 = new Matrix(4, 5).setEntry(1, 5, 2).setEntry(2, 4, 3).setEntry(3, 3, 4).setEntry(4, 2, 5);
assert(obj1[0] === 1 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 0, obj1[4] === 2);
assert(obj1[5] === 0 && obj1[6] === 1 && obj1[7] === 0 && obj1[8] === 3, obj1[9] === 0);
assert(obj1[10] === 0 && obj1[11] === 0 && obj1[12] === 4 && obj1[13] === 0, obj1[14] === 0);
assert(obj1[15] === 0 && obj1[16] === 5 && obj1[17] === 0 && obj1[18] === 1, obj1[19] === 0);

// Matrix.identity
obj1 = new Matrix(2, 2);
obj1.forEach(function(_, i, arr) {
  arr[i] = 2;
});
obj1.identity();

assert(obj1[0] === 1 && obj1[1] === 0);
assert(obj1[2] === 0 && obj1[3] === 1);

obj1 = new Matrix(3, 3);
obj1.forEach(function(_, i, arr) {
  arr[i] = 2;
});
obj1.identity();

assert(obj1[0] === 1 && obj1[1] === 0 && obj1[2] === 0);
assert(obj1[3] === 0 && obj1[4] === 1 && obj1[5] === 0);
assert(obj1[6] === 0 && obj1[7] === 0 && obj1[8] === 1);

obj1 = new Matrix();
obj1.forEach(function(_, i, arr) {
  arr[i] = 2;
});
obj1.identity();

assert(obj1[0] === 1 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 0);
assert(obj1[4] === 0 && obj1[5] === 1 && obj1[6] === 0 && obj1[7] === 0);
assert(obj1[8] === 0 && obj1[9] === 0 && obj1[10] === 1 && obj1[11] === 0);
assert(obj1[12] === 0 && obj1[13] === 0 && obj1[14] === 0 && obj1[15] === 1);

// Matrix.zero
obj1.zero().forEach(function(ele) {
  assert(ele === 0);
});

// Matrix.transpose
obj1 = new Matrix(2, 2).set([1, 2, 3, 4]).transpose();
assert(obj1[0] === 1 && obj1[1] === 3);
assert(obj1[2] === 2 && obj1[3] === 4);

obj1 = new Matrix(3, 2).set([1, 2, 3, 4, 5, 6]).transpose();
assert(obj1[0] === 1 && obj1[1] === 3 && obj1[2] === 5);
assert(obj1[3] === 2 && obj1[4] === 4 && obj1[5] === 6);

obj1 = new Matrix();
obj1.forEach(function(_, i, arr) {
  arr[i] = i + 1;
});
obj1.transpose();

assert(obj1[0] === 1 && obj1[1] === 5 && obj1[2] === 9 && obj1[3] === 13);
assert(obj1[4] === 2 && obj1[5] === 6 && obj1[6] === 10 && obj1[7] === 14);
assert(obj1[8] === 3 && obj1[9] === 7 && obj1[10] === 11 && obj1[11] === 15);
assert(obj1[12] === 4 && obj1[13] === 8 && obj1[14] === 12 && obj1[15] === 16);

// Matrix.asView
obj1 = new Matrix().asView([10, 20, 30]);
assert(obj1[0] === 1 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 10);
assert(obj1[4] === 0 && obj1[5] === 1 && obj1[6] === 0 && obj1[7] === 20);
assert(obj1[8] === 0 && obj1[9] === 0 && obj1[10] === 1 && obj1[11] === 30);
assert(obj1[12] === 0 && obj1[13] === 0 && obj1[14] === 0 && obj1[15] === 1);

// Matrix.asOrtographic
threw = false;
try {
  obj1 = new Matrix(3, 4).asOrthographic(200, -200, -100, 100, -100, 300);
} catch (_) {
  threw = true;
}
assert(threw);

obj1 = new Matrix().asOrthographic(200, -200, -100, 100, -100, 300);
assert(obj1[0] === -0.005 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 0);
assert(obj1[4] === 0 && obj1[5] === 0.01 && obj1[6] === 0 && obj1[7] === 0);
assert(obj1[8] === 0 && obj1[9] === 0 && obj1[10] === -0.005 && obj1[11] === -0.5);
assert(obj1[12] === 0 && obj1[13] === 0 && obj1[14] === 0 && obj1[15] === 1);

// Matrix.asPerspective
threw = false;
try {
  obj1 = new Matrix(3, 4).asPerspective(-10, 100, 0.7, 0.25);
} catch (_) {
  threw = true;
}
assert(threw);

obj1 = new Matrix().asPerspective(-10, 100, 0.7, 0.25);
var e11 = -10 / (-10 * Math.tan(0.25) * 0.7);
var e22 = -10 / (-10 * Math.tan(0.25));
var e33 = -(100 - 10) / (100 + 10);
var e34 = -2 * 100 * -10 / (100 + 10);
var e43 = -1;
var e44 = 0;
assert(obj1[0] === e11 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 0);
assert(obj1[4] === 0 && obj1[5] === e22 && obj1[6] === 0 && obj1[7] === 0);
assert(obj1[8] === 0 && obj1[9] === 0 && obj1[10] === e33 && obj1[11] === e34);
assert(obj1[12] === 0 && obj1[13] === 0 && obj1[14] === e43 && obj1[15] === e44);

// Matrix.asRotation
threw = false;
try {
  obj1 = new Matrix(3, 4).asRotation(Math.PI / 4);
} catch (_) {
  threw = true;
}
assert(threw);

obj1 = new Matrix(2, 2);
obj1.asRotation(Math.PI / 4);
assert(obj1[0] === Math.cos(Math.PI / 4));
assert(obj1[1] === -Math.sin(Math.PI / 4));
assert(obj1[2] === Math.sin(Math.PI / 4));
assert(obj1[3] === Math.cos(Math.PI / 4));

obj1 = new Matrix(3, 3);
obj1.asRotation(Math.PI / 6);
assert(obj1[0] === Math.cos(Math.PI / 6));
assert(obj1[1] === -Math.sin(Math.PI / 6));
assert(obj1[2] === 0);
assert(obj1[3] === Math.sin(Math.PI / 6));
assert(obj1[4] === Math.cos(Math.PI / 6));
assert(obj1[5] === 0);
assert(obj1[6] === 0);
assert(obj1[7] === 0);
assert(obj1[8] === 0);

obj2 = new Vector([1, 2, 3]).normalize();
obj1 = new Matrix(3, 3).asRotation(obj2, Math.PI / 4);
var x = obj2[0];
var y = obj2[1];
var z = obj2[2];

var c = Math.cos(Math.PI / 4);
var s = Math.sin(Math.PI / 4);
var t = 1 - c;

assert(obj1[0] === x * x * t + c);
assert(obj1[1] === x * y * t - z * s);
assert(obj1[2] === x * z * t + y * s);
assert(obj1[3] === x * y * t + z * s);
assert(obj1[4] === y * y * t + c);
assert(obj1[5] === y * z * t - x * s);
assert(obj1[6] === x * z * t - y * s);
assert(obj1[7] === y * z * t + x * s);
assert(obj1[8] === z * z * t + c);

obj2 = new Vector([1, 2, 3]).normalize();
obj1 = new Matrix().asRotation(obj2, Math.PI / 4);
var x = obj2[0];
var y = obj2[1];
var z = obj2[2];
var c = Math.cos(Math.PI / 4);
var s = Math.sin(Math.PI / 4);
var t = 1 - c;

assert(obj1[3] === 0 && obj1[7] === 0 && obj1[11] === 0 && obj1[12] === 0);
assert(obj1[13] === 0 && obj1[14] === 0 && obj1[15] === 1);
assert(obj1[0] === x * x * t + c);
assert(obj1[1] === x * y * t - z * s);
assert(obj1[2] === x * z * t + y * s);
assert(obj1[4] === x * y * t + z * s);
assert(obj1[5] === y * y * t + c);
assert(obj1[6] === y * z * t - x * s);
assert(obj1[8] === x * z * t - y * s);
assert(obj1[9] === y * z * t + x * s);
assert(obj1[10] === z * z * t + c);

// Matrix.rotate
threw = false;
try {
  obj1 = new Matrix(3, 4).rotate(Math.PI / 4);
} catch (_) {
  threw = true;
}
assert(threw);

obj1 = new Matrix(2, 2).asRotation(Math.PI / 8);
obj2 = new Matrix(2, 2);
obj2.rotate(Math.PI / 8);
assert(obj2.equals(obj1));

obj1 = new Matrix(3, 3).asRotation(new Vector([1, 2, 3]).normalize(), Math.PI / 8);
obj2 = new Matrix(3, 3);
obj2.rotate(new Vector([1, 2, 3]).normalize(), Math.PI / 8);
assert(obj2.equals(obj1));

obj1 = new Matrix().asRotation(new Vector([0, 1, 0]).normalize(), Math.PI / 3);
obj2 = new Matrix();
obj2.rotate(new Vector([0, 1, 0]).normalize(), Math.PI / 3);
assert(obj2.equals(obj1));

// Matrix.asTranslation
threw = false;
try {
  obj1 = new Matrix(3, 4).asTranslation(Math.PI / 4);
} catch (_) {
  threw = true;
}
assert(threw);


obj1 = new Matrix(3, 3).asTranslation([5, 6]);
assert(obj1[0] === 1 && obj1[1] === 0 && obj1[2] === 5);
assert(obj1[3] === 0 && obj1[4] === 1 && obj1[5] === 6);
assert(obj1[6] === 0 && obj1[7] === 0 && obj1[8] === 1);

obj1 = new Matrix().asTranslation([2, 3, 4]);
assert(obj1[0] === 1 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 2);
assert(obj1[4] === 0 && obj1[5] === 1 && obj1[6] === 0 && obj1[7] === 3);
assert(obj1[8] === 0 && obj1[9] === 0 && obj1[10] === 1 && obj1[11] === 4);
assert(obj1[12] === 0 && obj1[13] === 0 && obj1[14] === 0 && obj1[15] === 1);

// Matrix.translate
threw = false;
try {
  obj1 = new Matrix(3, 4).translate(Math.PI / 4);
} catch (_) {
  threw = true;
}
assert(threw);

obj1 = new Matrix(3, 3).asTranslation([5, 6]);
obj2 = new Matrix(3, 3);
assert(obj2.translate([5, 6]).equals(obj1));

obj1 = new Matrix().asTranslation([2, 3, 4]);
obj2 = new Matrix();
assert(obj2.translate([2, 3, 4]).equals(obj1));

// Matrix.asScale
threw = false;
try {
  obj1 = new Matrix().asScale([1, 2, 3, 4]);
} catch (_) {
  threw = true;
}
assert(threw);

obj1 = new Matrix(3, 3).asScale([5, 6]);
assert(obj1[0] === 5 && obj1[1] === 0 && obj1[2] === 0);
assert(obj1[3] === 0 && obj1[4] === 6 && obj1[5] === 0);
assert(obj1[6] === 0 && obj1[7] === 0 && obj1[8] === 1);

obj1 = new Matrix().asScale([2, 3, 4]);
assert(obj1[0] === 2 && obj1[1] === 0 && obj1[2] === 0 && obj1[3] === 0);
assert(obj1[4] === 0 && obj1[5] === 3 && obj1[6] === 0 && obj1[7] === 0);
assert(obj1[8] === 0 && obj1[9] === 0 && obj1[10] === 4 && obj1[11] === 0);
assert(obj1[12] === 0 && obj1[13] === 0 && obj1[14] === 0 && obj1[15] === 1);

// Matrix.scale
threw = false;
try {
  obj1 = new Matrix().scale([1, 2, 3, 4]);
} catch (_) {
  threw = true;
}
assert(threw);

obj1 = new Matrix(3, 3).asScale([5, 6]);
obj2 = new Matrix(3, 3);
assert(obj2.scale([5, 6]).equals(obj1));

obj1 = new Matrix().asScale([2, 3, 4]);
obj2 = new Matrix();
assert(obj2.scale([2, 3, 4]).equals(obj1));

/* * * * * * * * * * * * *
 *
 * Quaternion tests
 *
 * * * * * * * * * * * * */

// Quaternion.setAxisAngle
obj1 = new Quaternion();
obj1.setAxisAngle([0.1, 0.2, 0.3], Math.PI / 4);
obj2 = Math.sqrt(0.1 * 0.1 + 0.2 * 0.2 + 0.3 * 0.3);
assert(obj1.t === Math.cos(Math.PI / 8));
assert(obj1.v[0] === 0.1 * Math.sin(Math.PI / 8) / obj2);
assert(obj1.v[1] === 0.2 * Math.sin(Math.PI / 8) / obj2);
assert(obj1.v[2] === 0.3 * Math.sin(Math.PI / 8) / obj2);

obj1.setAxisAngle([1.0, 0.0, 0.0], Math.PI / 8);
assert(obj1.t === Math.cos(Math.PI / 16));
assert(obj1.v[0] === Math.sin(Math.PI / 16));
assert(obj1.v[1] === 0);
assert(obj1.v[2] === 0);

obj1.setAxisAngle([0.0, 1.0, 0.0], Math.PI);
assert(obj1.t === Math.cos(Math.PI / 2));
assert(obj1.v[0] === 0);
assert(obj1.v[1] === Math.sin(Math.PI / 2));
assert(obj1.v[2] === 0);

obj1.setAxisAngle([0.0, 0.0, 1.0], Math.PI / 67);
assert(obj1.t === Math.cos(Math.PI / 134));
assert(obj1.v[0] === 0);
assert(obj1.v[1] === 0);
assert(obj1.v[2] === Math.sin(Math.PI / 134));

// Quaternion.mul
obj1 = new Quaternion();
obj1.setAxisAngle([1.0, 0.0, 0.0], Math.PI / 2);
obj2 = new Quaternion();
obj2.setAxisAngle([0.0, 1.0, 0.0], Math.PI / 4);
obj1.mul(obj2);
assert(obj1.t === 0.6532814824381883);
assert(obj1.v[0] === 0.6532814824381882);
assert(obj1.v[1] === 0.2705980500730985);
assert(obj1.v[2] === 0.27059805007309845);

obj1.setAxisAngle([1.0, 0.0, 0.0], Math.PI / 2);
Quaternion.mul(obj1, obj2, obj1);
assert(obj1.t === 0.6532814824381883);
assert(obj1.v[0] === 0.6532814824381882);
assert(obj1.v[1] === 0.2705980500730985);
assert(obj1.v[2] === 0.27059805007309845);

obj1.setAxisAngle([0, 1, 0], Math.PI);
obj2.setAxisAngle([0, 0, 1], Math.PI);
obj1.mul(obj2);
assert(Math.round(obj1.t * 1000000) / 1000000 === 0);
assert(obj1.v[0] === 1);
assert(Math.round(obj1.v[1] * 1000000) / 1000000 === 0);
assert(Math.round(obj1.v[2] * 1000000) / 1000000 === 0);

obj1.setAxisAngle([0, 1, 0], Math.PI);
obj2.setAxisAngle([0, 0, 1], Math.PI);
obj1.mul(obj2);
assert(Math.round(obj1.t * 1000000) / 1000000 === 0);
assert(obj1.v[0] === 1);
assert(Math.round(obj1.v[1] * 1000000) / 1000000 === 0);
assert(Math.round(obj1.v[2] * 1000000) / 1000000 === 0);

obj1.setAxisAngle([1, 0, 0], Math.PI);
obj2.setAxisAngle([0, 0, -1], Math.PI);
Quaternion.mul(obj1, obj2, obj1);
assert(Math.round(obj1.t * 1000000) / 1000000 === 0);
assert(Math.round(obj1.v[0] * 1000000) / 1000000 === 0);
assert(obj1.v[1] === 1);
assert(Math.round(obj1.v[2] * 1000000) / 1000000 === 0);

obj1.setAxisAngle([1, 0, 0], Math.PI);
obj2.setAxisAngle([0, 0, -1], Math.PI);
Quaternion.mul(obj1, obj2, obj1);
assert(Math.round(obj1.t * 1000000) / 1000000 === 0);
assert(Math.round(obj1.v[0] * 1000000) / 1000000 === 0);
assert(obj1.v[1] === 1);
assert(Math.round(obj1.v[2] * 1000000) / 1000000 === 0);

// Quaternion.quadrance
obj1 = new Quaternion();
assert(obj1.quadrance() === 1);
obj1.setAxisAngle([1, 0, 0], 0);
assert(obj1.quadrance() === 1);
obj1.setAxisAngle([0.9, 0.1, 0.0], Math.PI / 8);
assert(obj1.quadrance() === 1);
obj1.t = 10;
assert(Math.round(obj1.quadrance() * 1000000) / 1000000 === 100.038060);
// Quaternion.length
obj1 = new Quaternion();
assert(obj1.length() === 1);
obj1.setAxisAngle([0, 1, 0], Math.PI / 6);
assert(obj1.length() === 1);
obj1.t = 10;
assert(Math.round(obj1.length() * 1000000) / 1000000 === 10.003349);

// Quaternion.invert
obj1 = new Quaternion();
obj1.invert();
assert(obj1.t === 1);
assert(obj1.v[0] === 0);
assert(obj1.v[1] === 0);
assert(obj1.v[2] === 0);

obj1.setAxisAngle([0.5, 0.5, 0], Math.PI / 9);
assert(obj1.invert().invert().equals(obj1));
obj1.invert();
assert(Math.round(obj1.t * 1000000) / 1000000 === 0.984808);
assert(Math.round(obj1.v[0] * 1000000) / 1000000 === -0.122788);
assert(Math.round(obj1.v[1] * 1000000) / 1000000 === -0.122788);
assert(obj1.v[2] === 0);

// Quaternion.conjugate
obj1 = new Quaternion();
assert(obj1.conjugate() === obj1);
obj1.t = -2;
obj1.v.set([3, -4, 5]);
obj1.conjugate();
assert(obj1.t === -2 && obj1.v.equals([-3, 4, -5]));

// Quaternion.normalize
obj1 = new Quaternion();
assert(obj1.normalize().quadrance() === 1);
obj1.t = 1000.98986;
obj1.v.set([12.111, 345.432, -936.2345]);
obj1.normalize();
assert(obj1.quadrance() === 1);
obj1.t = -34;
obj1.v.set([-456.46, 42, 4242.42]);
assert(obj1.normalize().quadrance() === 1);

// Quaternion.rotate
obj1 = new Quaternion();
obj1.setAxisAngle([0, 1, 0], Math.PI / 2);
obj2 = new Vector([1, 0, 0, 1]);
obj1.rotate(obj2);
assert(Math.round(obj2[0] * 1000000) === 0);
assert(obj2[1] === 0);
assert(obj2[2] === -1);
assert(obj2[3] === 1);

obj1.setAxisAngle([0, 0, 1], Math.PI);
obj2 = new Vector([0, 1, 0, 1]);
obj1.rotate(obj2);
assert(Math.round(obj2[0] * 1000000) === 0);
assert(obj2[1] === -1);
assert(obj2[2] === 0);
assert(obj2[3] === 1);

obj1.setAxisAngle([1, 0, 0], Math.PI / 4);
obj2 = new Vector([0, 0, 1]);
obj1.rotate(obj2);
assert(obj2[0] === 0);
assert(Math.round(obj2[1] * 1000000) / 1000000 === -0.707107);
assert(obj2[2] === Math.sin(Math.PI / 4));

obj1.setAxisAngle([0.1, 0.5, 0.4], Math.PI / 6);
obj2 = new Vector([100, 200, 300, 1]);
obj1.rotate(obj2);
assert(Math.round(obj2[0] * 1000000) / 1000000 === 147.945417);
assert(Math.round(obj2[1] * 1000000) / 1000000 === 217.603769);
assert(Math.round(obj2[2] * 1000000) / 1000000 === 266.008935);
assert(obj2[3] === 1);

// Quaternion.toMatrix
obj1 = new Quaternion();
obj1.setAxisAngle([1, 0, 0], Math.PI / 8);
obj2 = obj1.toMatrix();
assert(obj2[0] === 1 && obj2[1] === 0 && obj2[2] === 0 && obj2[3] === 0);
assert(obj2[4] === 0 && obj2[7] === 0);
assert(obj2[8] === 0 && obj2[11] === 0);
assert(obj2[12] === 0 && obj2[13] === 0 && obj2[14] === 0 && obj2[15] === 1);
assert(Math.round(obj2[5] * 1000000) / 1000000 === 0.923880);
assert(Math.round(obj2[6] * 1000000) / 1000000 === -0.382683);
assert(Math.round(obj2[9] * 1000000) / 1000000 === 0.382683);
assert(Math.round(obj2[10] * 1000000) / 1000000 === 0.923880);

obj1 = new Quaternion();
obj1.setAxisAngle([0.3, -0.3, 0.4], Math.PI / 6);
obj2 = obj1.toMatrix();
assert(obj2[3] === 0 && obj2[7] === 0 && obj2[11] === 0);
assert(obj2[12] === 0 && obj2[13] === 0 && obj2[14] === 0 && obj2[15] === 1);
assert(Math.round(obj2[0] * 1000000) / 1000000 === 0.901489);
assert(Math.round(obj2[1] * 1000000) / 1000000 === -0.378461);
assert(Math.round(obj2[2] * 1000000) / 1000000 === -0.209963);
assert(Math.round(obj2[4] * 1000000) / 1000000 === 0.307533);
assert(Math.round(obj2[5] * 1000000) / 1000000 === 0.901489);
assert(Math.round(obj2[6] * 1000000) / 1000000 === -0.304533);
assert(Math.round(obj2[8] * 1000000) / 1000000 === 0.304533);
assert(Math.round(obj2[9] * 1000000) / 1000000 === 0.209963);
assert(Math.round(obj2[10] * 1000000) / 1000000 === 0.929072);


/* * * * * * * * * * * * *
 *
 * Attitude tests
 *
 * * * * * * * * * * * * */

// Attitude.pitch
obj1 = new Attitude();
obj1.pitch(Math.PI / 4);
assert(obj1.cross.equals([1, 0, 0]));
assert(obj1.up.equals([0, Math.sin(Math.PI / 4), -Math.cos(Math.PI / 4)]));
assert(obj1.look.equals([0, Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)]));
obj1.pitch(Math.PI / 4);
assert(obj1.cross.equals([1, 0, 0]));
assert(obj1.up[0] === 0);
assert(obj1.up[1] === 0);
assert(Math.round(obj1.up[2] * 1000000) / 1000000 === -1);
assert(obj1.look[0] === 0);
assert(Math.round(obj1.look[1] * 1000000) / 1000000 === 1);
assert(obj1.look[2] === 0);

// Attitude.yaw
obj1.yaw(Math.PI / 6).yaw(-Math.PI / 6);
assert(Math.round(obj1.cross[0] * 1000000) / 1000000 === 1);
assert(Math.round(obj1.cross[1] * 1000000) / 1000000 === 0);
assert(obj1.cross[2] === 0);
assert(obj1.up[0] === 0);
assert(obj1.up[1] === 0);
assert(Math.round(obj1.up[2] * 1000000) / 1000000 === -1);
assert(Math.round(obj1.look[0] * 1000000) / 1000000 === 0);
assert(Math.round(obj1.look[1] * 1000000) / 1000000 === 1);
assert(obj1.look[2] === 0);

// Attitude.roll
obj1.roll(Math.PI / 2);
assert(Math.round(obj1.cross[0] * 1000000) / 1000000 === 0, obj1.cross[0]);
assert(Math.round(obj1.cross[1] * 1000000) / 1000000 === 0, obj1.cross[1]);
assert(Math.round(obj1.cross[2] * 1000000) / 1000000 === 1, obj1.cross[2]);
assert(Math.round(obj1.up[0] * 1000000) / 1000000 === 1);
assert(Math.round(obj1.up[1] * 1000000) / 1000000 === 0);
assert(Math.round(obj1.up[2] * 1000000) / 1000000 === 0);
assert(Math.round(obj1.look[0] * 1000000) / 1000000 === 0);
assert(Math.round(obj1.look[1] * 1000000) / 1000000 === 1);
assert(Math.round(obj1.look[2] * 1000000) / 1000000 === 0);

// Attitude.toMatrix
obj2 = new Matrix();
obj1.toMatrix(obj2);
obj1 = new Matrix();
obj1.asRotation([0, 1, 0], -Math.PI / 2);
obj1.rotate([1, 0, 0], -Math.PI / 2);
obj1.mul(obj2);
for (var i = 0; i < 4; ++i)
  for (var j = 0; j < 4; ++j) {
    if (i === j) {
      assert(Math.round(obj1[i * 4 + j] * 1000000) / 1000000 === 1);
    } else {
      assert(Math.round(obj1[i * 4 + j] * 1000000) / 1000000 === 0);
    }
  }

// Attitude.rotate
obj1 = new Attitude();
obj1.roll(Math.PI / 2);
obj1.yaw(Math.PI / 2);
obj2 = new Matrix();
obj1.rotate(obj2);
obj1 = new Matrix();
obj1.asRotation([1, 0, 0], -Math.PI / 2);
obj1.rotate([0, 0, 1], -Math.PI / 2);
obj1.mul(obj2);
for (var i = 0; i < 4; ++i)
  for (var j = 0; j < 4; ++j) {
    if (i === j) {
      assert(Math.round(obj1[i * 4 + j] * 1000000) / 1000000 === 1);
    } else {
      assert(Math.round(obj1[i * 4 + j] * 1000000) / 1000000 === 0);
    }
  }

console.log('xform test complete');