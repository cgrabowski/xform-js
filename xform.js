/**
 * xform.js Linear Algebra Library
 *
 * @author Christopher Grabowski - https://github.com/cgrabowski
 * @license MIT License
 * @version 0.0.1
 *
 * Copyright (c) 2015 Christopher Grabowski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

// create the xform namespace for running in a browser environment
var xform = {};

(function(undefined) {
  'use strict';

  // Set the exports property if this is a CommonJS environment (e.g., node.js)
  if (typeof module !== 'undefined') {
    module.exports = xform;
  }

  /*
   * The types provided by xform-js
   */
  xform.Dimensional = Dimensional;
  xform.Dimensions = Dimensions;
  xform.Vector = Vector;
  xform.Matrix = Matrix;
  xform.Quaternion = Quaternion;
  xform.Attitude = Attitude;
  xform.DimensionError = DimensionError;
  xform.dimCheck = dimCheck;
  xform.arrayIndexedEntriesEqual = arrayIndexedEntriesEqual;

  /**
   * Adds the xform namespace to the specified context
   *
   * This function is intended to allow all members of the xform namespace to
   * be added to the global object or any other object.
   *
   * NOTE: In node.js if you want to add the xform members to the global object you
   * must pass the object named GLOBAL as the argument.
   *
   * @param the object that will gain xform's members
   */
  xform.usingNamespace = function(object) {
    for (var prop in xform) {
      Object.defineProperty(object, prop, {
        value: xform[prop],
        configurable: true,
        enumerable: true,
        writable: true
      });
    }
  };

  /*
   * Common supertype of all types with dimensions.
   */
  function Dimensional(dimensionality) {
    dimensionality = dimensionality || null;
    if (typeof dimensionality === 'number') {
      this.dim = new Dimensions([dimensionality]);
    } else if (dimensionality instanceof Array) {
      this.dim = new Dimensions(dimensionality);
    } else {
      var msg = "Dimensional constructor expected number or array but got ";
      var type = (dimensionality === null) ? 'null' : dimensionality.constructor;
      throw new TypeError(msg + type);
    }
  }
  Dimensional.prototype = Object.create(Array.prototype);
  Dimensional.prototype.constructor = Dimensional;

  Dimensional.prototype.equals = function(array) {
    if (array instanceof Dimensional) {
      if (this.dim.equals(array.dim) && arrayIndexedEntriesEqual(this, array)) {
        return true;
      } else {
        return false;
      }
    } else if (array instanceof Array) {
      if (arrayIndexedEntriesEqual(this, array)) {
        return true;
      } else {
        return false;
      }
    } else {
      var type;
      var ctorName = this.constructor.name;
      if (typeof array === 'number') {
        type = 'number';
      } else {
        type = array.constructor.name;
      }
      throw new TypeError(ctorName + '.prototype.equals expected instanceof Array but got ' + type);
    }
  };

  function Dimensions(arrayOrNumber) {
    arrayOrNumber = arrayOrNumber || null;
    if (typeof arrayOrNumber === 'number') {
      this.push(arrayOrNumber);
    } else if (arrayOrNumber instanceof Array) {
      for (var i = 0, len = arrayOrNumber.length; i < len; ++i) {
        this.push(arrayOrNumber[i]);
      }
    } else {
      var msg = 'Dimensions constructor expected number or array but got ';
      var type = (arrayOrNumber === null) ? 'null' : arrayOrNumber.constructor;
      throw new TypeError(msg + type);
    }
  }
  Dimensions.prototype = Object.create(Array.prototype);
  Dimensions.prototype.constructor = Dimensions;

  Dimensions.prototype.equals = function(dimensionsObj) {
    return arrayIndexedEntriesEqual(this, dimensionsObj);
  };

  Dimensions.prototype.set = function(array) {
    this.length = array.length;
    for (var i = 0, len = array.length; i < len; ++i) {
      this[i] = array[i];
    }
    return this;
  };

  /*
   * General vector type
   */
  function Vector(dimOrArray) {
    var dimension = (dimOrArray instanceof Array) ? dimOrArray.length : dimOrArray;
    Dimensional.call(this, dimension);
    if (typeof dimOrArray === 'number') {
      for (var i = 0; i < dimOrArray; ++i) {
        this.push(0);
      }
    } else if (dimOrArray instanceof Array) {
      var len = dimOrArray.length;
      for (var i = 0; i < len; ++i) {
        this.push(dimOrArray[i]);
      }
    } else {
      var msg = "Argument to Vector constructor must be an instance of Array or Number.";
      throw new TypeError(msg);
    }
  }
  Vector.prototype = Object.create(Dimensional.prototype);
  Vector.prototype.constructor = Vector;

  Vector.copy = function(vector, out) {
    if (out == null) {
      out = new Vector(vector);
    } else {
      var len = vector.length;
      out.length = len;
      for (var i = 0; i < len; ++i) {
        out[i] = vector[i];
      }
    }
    return out;
  };

  Vector.flatten = function(arrayOfVectors, arrayType) {
    var arr = arrayOfVectors.reduce(function(sum, ele) {
      return sum.concat(ele.toArray());
    }, []);
    if (arrayType === Array) {
      return arr;
    } else {
      return new arrayType(arr);
    }
  };

  Vector.dot = function(vec1, vec2) {
    dimCheck(vec1, vec2);
    var out = 0;
    var len = vec1.length;
    for (var i = 0; i < len; ++i) {
      out += vec1[i] * vec2[i];
    }
    return out;
  };

  Vector.cross = function(vec1, vec2, out) {
    if (vec1.length !== 3 || vec2.length !== 3) {
      throw new DimensionError("Cross product is only defined for three-dimensional vectors.");
    }
    if (typeof out === 'undefined') {
      out = new Vector(3);
    } else if (!(out instanceof Vector)) {
      throw new TypeError('out argument to Vector.cross must be a Vector or undefined.');
    }

    out.set(vec1[1] * vec2[2] - vec1[2] * vec2[1],
      vec1[2] * vec2[0] - vec1[0] * vec2[2],
      vec1[0] * vec2[1] - vec1[1] * vec2[0]);
    return out;
  };

  Vector.quadrance = function(vec1, vec2) {
    vec2 = vec2 || vec1;
    dimCheck(vec1, vec2);
    var out = 0;
    var len = vec1.length;
    for (var i = 0; i < len; ++i) {
      out += vec1[i] * vec2[i];
    }
    return out;
  };

  Vector.prototype.zero = function() {
    for (var i = 0, len = this.length; i < len; ++i) {
      this[i] = 0;
    }
  };

  Vector.prototype.dot = function(vec) {
    return Vector.dot(this, vec);
  }

  Vector.prototype.quadrance = function(vector) {
    return Vector.quadrance(this, vector);
  };

  Vector.prototype.magnitude = function() {
    return Math.sqrt(Vector.quadrance(this));
  };

  Vector.prototype.add = function(vector) {
    dimCheck(this, vector);
    var len = this.length;
    for (var i = 0; i < len; ++i) {
      this[i] += vector[i];
    }
    return this;
  };

  Vector.prototype.scale = function(scalar) {
    if (typeof scalar !== 'number') {
      throw new TypeError("argument to Vector.scale must be of type number.");
    }
    var len = this.length;
    for (var i = 0; i < len; ++i) {
      this[i] *= scalar;
    }
    return this;
  };

  Vector.prototype.set = function(arrayOrVarargs) {
    var vals = (arguments.length === 1) ? arguments[0] : arguments;
    if (vals.length == null) {
      vals = [vals];
    }
    dimCheck(this, vals);
    for (var i = 0, len = this.length; i < len; ++i) {
      this[i] = vals[i];
    }
    return this;
  };

  Vector.prototype.normalize = function() {
    var mag = this.magnitude();
    for (var i = 0, len = this.length; i < len; ++i) {
      this[i] /= mag;
    }
    return this;
  }

  // This handles some edge cases such as Array.concat
  // in which a subtype of Array is not considered an Array
  Vector.prototype.toArray = function() {
    return this.map(function(ele) {
      return ele;
    });
  };

  Vector.prototype.toString = function() {
    return '( ' + this.reduce(function(sum, ele) {
      return sum + ', ' + ele;
    }) + ' )';
  };

  /*
   * General matrix type
   */
  function Matrix(m, n) {
    m = m || 4;
    n = n || 4;
    this.dim = new Dimensions([m, n]);
    for (var i = 0; i < m; ++i)
      for (var j = 0; j < n; ++j) {
        if (i === j) {
          this.push(1);
        } else {
          this.push(0);
        }
      }
  }
  Matrix.prototype = Object.create(Dimensional.prototype);
  Matrix.prototype.constructor = Matrix;

  Matrix.cache1 = new Matrix(4, 4);
  Matrix.cache2 = new Matrix(4, 4);

  Matrix.mul = function(mat1, mat2, out) {
    var m1, m2, n1, n2;

    m1 = mat1.dim[0];
    n1 = mat1.dim[1];

    if (mat2 instanceof Matrix) {
      m2 = mat2.dim[0];
      n2 = mat2.dim[1];

      if (out == null) {
        out = new Matrix(m1, n2);
        out.zero();
      } else {
        out.dim = [m1, n2];
        out.zero();
      }

    } else if (mat2 instanceof Vector) {
      m2 = mat2.length;
      n2 = 1;

      if (out == null) {
        out = new Vector(mat2.length);
      } else {
        out.zero();
      }

    } else {
      throw new TypeError('second argument to Matrix.mul must be instance of Matrix or Vector');
    }

    if (n1 !== m2) {
      throw new DimensionError('left matrix n = ' + n1 + ', right matrix m = ' + m2);
    }

    for (var i = 0; i < m1; ++i)
      for (var j = 0; j < n2; ++j)
        for (var e = 0; e < n1; ++e) {
          out[j + n2 * i] += mat1[e + n1 * i] * mat2[n2 * e + j];
        }
    return out;
  };

  Matrix.copy = function(matrix, out) {
    if (out == null) {
      out = new Matrix(matrix.dim[0], matrix.dim[1]);
    } else {
      out.dim = [matrix.dim[0], matrix.dim[1]];
    }

    for (var i = 0; i < matrix.length; ++i) {
      out[i] = matrix[i];
    }
    return out;
  };

  Matrix.det = function(matrix) {
    if (matrix.dim[0] !== matrix.dim[1]) {
      var msg = 'determinant is only defined for square matrices';
      throw new DimensionError(msg);

    } else if (matrix.dim[0] === 2) {
      return matrix[0] * matrix[3] - matrix[1] * matrix[2];

    } else if (matrix.dim[0] === 3) {
      var m = matrix;
      var x = m[0] * (m[4] * m[8] - m[5] * m[7]);
      var y = m[1] * (m[3] * m[8] - m[5] * m[6]);
      var z = m[2] * (m[3] * m[7] - m[4] * m[6]);
      return x - y + z;

    } else if (matrix.dim[0] === 4) {
      var m = matrix;
      var xy = m[8] * m[13] - m[9] * m[12];
      var xz = m[8] * m[14] - m[10] * m[12];
      var xw = m[8] * m[15] - m[11] * m[12];
      var yz = m[9] * m[14] - m[10] * m[13];
      var yw = m[9] * m[15] - m[11] * m[13];
      var zw = m[10] * m[15] - m[11] * m[14];
      var x = m[0] * (m[5] * zw - m[6] * yw + m[7] * yz);
      var y = m[1] * (m[4] * zw - m[6] * xw + m[7] * xz);
      var z = m[2] * (m[4] * yw - m[5] * xw + m[7] * xy);
      var w = m[3] * (m[4] * yz - m[5] * xz + m[6] * xy);
      return x - y + z - w;
    }

    var det = 0;
    for (var j = 0, d = matrix.dim[0]; j < d; ++j) {
      var md = matrix[j] * Matrix.det(Matrix.minor(matrix, 0, j));
      det += (j % 2 === 0) ? md : -md;
    }

    return det;
  };

  Matrix.invert = function(matrix, out) {
    if (typeof matrix === 'undefined') {
      var msg = 'First argument to Matrix.invert is undefined';
      throw new ReferenceError(msg);
    }
    if (matrix.dim[0] !== matrix.dim[1]) {
      var msg = 'Matrix.invert requires a square matrix.';
      throw new DimensionError(msg);
    }
    var det = Matrix.det(matrix);
    if (det === 0) {
      var msg = 'Cannot invert a singular matrix.';
      throw new RangeError(msg);
    }
    var mat = matrix;
    if (mat.dim[0] === 2) {
      return mat.set([mat[3] / det, -mat[1] / det, -mat[2] / det, mat[0] / det]);
    }

    var d = mat.dim[0];
    if (typeof out === 'undefined') {
      out = new Matrix(d, d);
    } else {
      out.dim[0] = mat.dim[0];
      out.dim[1] = mat.dim[1];
    }
    var minor;
    if (d < 6) {
      minor = Matrix.cache1;
      minor.dim[0] = d;
      minor.dim[1] = d;
    } else {
      minor = new Matrix(d - 1, d - 1);
    }

    for (var i = 0; i < d; ++i)
      for (var j = 0; j < d; ++j) {
        var ind = i * d + j;
        out[ind] = Matrix.det(Matrix.minor(mat, i, j, minor));
        if (i % 2 !== j % 2) {
          out[ind] *= -1;
        }
      }
    for (var i = 0, len = mat.length; i < len; ++i) {
      out[i] /= det;
    }
    return out.transpose();
  };

  Matrix.minor = function(matrix, di, dj, out) {
    var m = matrix.dim[0];
    var n = matrix.dim[1];
    var arr = [];
    if (typeof out === 'undefined') {
      out = new Matrix(m - 1, n - 1);
    } else {
      out.dim[0] = m - 1;
      out.dim[1] = n - 1;
    }

    row: for (var i = 0; i < m; ++i) {
      col: for (var j = 0; j < n; ++j) {
        if (i === di) {
          continue row;
        }
        if (j === dj) {
          continue col;
        }

        arr.push(matrix[i * m + j]);
      }
    }
    return out.set(arr);
  };

  Matrix.prototype.set = function(array, offset) {
    offset = offset || 0;
    if(array.length + offset > this.length) {
      var msg = 'Matrix.prototype.set arguments array + offset greater than this matrix.length';
      throw new RangeError(msg);
    }

    for (var i = 0, len = array.length; i < len; ++i) {
      this[i + offset] = array[i];
    }
    return this;
  };

  Matrix.prototype.setEntry = function(m, n, val) {
    this[n - 1 + (m - 1) * this.dim[1]] = val;
    return this;
  };

  // allows seting a non-sqaure matrix to its analog of the identity matrix
  // (i.e., acts like the Kronecker delta over the indicies)
  Matrix.prototype.identity = function() {
    var m = this.dim[0];
    var n = this.dim[1];

    for (var i = 0; i < m; ++i)
      for (var j = 0; j < n; ++j) {
        this[j + i * n] = (i === j) ? 1 : 0;
      }
    return this;
  };

  Matrix.prototype.zero = function() {
    var len = this.dim[0] * this.dim[1];
    for (var i = 0; i < len; ++i) {
      this[i] = 0;
    }
    return this;
  }

  Matrix.prototype.mul = function(matrix) {
    var m1 = this.dim[0];
    var n1 = this.dim[1];
    var m2, n2;

    if (matrix instanceof Matrix) {
      m2 = matrix.dim[0];
      n2 = matrix.dim[1];
    } else {
      var msg = 'Argument to Matrix.prototype.mul must be instance of Matrix. ';
      msg += 'If you want to multiply a vector by this matrix then use Matrix.mul';
      throw new TypeError(msg);
    }

    var cache = Matrix.cache1;
    cache.dim.set(this.dim);

    if (n1 !== m2) {
      throw new DimensionError('this matrix n = ' + n1 + ', other matrix m = ' + m2);
    }

    for (var i = 0, len = this.length; i < len; ++i) {
      cache[i] = this[i];
      this[i] = 0;
    }

    this.dim.set(matrix.dim);

    for (var i = 0; i < m1; ++i)
      for (var j = 0; j < n2; ++j)
        for (var e = 0; e < n1; ++e) {
          this[j + n2 * i] += cache[e + n1 * i] * matrix[n2 * e + j];
        }
    return this;
  };

  Matrix.prototype.det = function() {
    return Matrix.det(this);
  };

  Matrix.prototype.invert = function() {
    var cache = Matrix.cache2;
    cache.dim[0] = this.dim[0];
    cache.dim[1] = this.dim[1];
    cache.set(this);
    return Matrix.invert(cache, this);
  };

  Matrix.prototype.transpose = function() {
    var len = this.length;
    var m = this.dim[0];
    var n = this.dim[1];
    var cache = Matrix.cache1;

    cache.dim.set([m, n]);

    for (var i = 0; i < len; ++i) {
      cache[i] = this[i];
    }

    this.dim.set([n, m]);
    for (var i = 0; i < m; ++i)
      for (var j = 0; j < n; ++j) {
        this[i + m * j] = cache[j + i * n];
      }
    return this;
  };

  // must be 4x4 matrix
  Matrix.prototype.asView = function(position) {
    dimCheck(this, {dim: [4, 4]});
    position = position || [0, 0, 0];
    if (!(position instanceof Array)) {
      var msg = 'Matrix.prototype.asView argument must be an instance of Array'
      throw new TypeError(msg);
    }
    this.dim.set([4, 4]);
    this.identity();
    this[3] = position[0];
    this[7] = position[1];
    this[11] = position[2];
    return this;
  }

  // must be 4x4 matrix
  Matrix.prototype.asOrthographic = function(left, right, bottom, top, near, far) {
    try {
      dimCheck(this, {dim: [4, 4]});
    } catch (e) {
      e.message = 'Matrix.prototype.asOrthographic requires this matrix to be a 4x4 matrix, ';
      e.message += 'but this matrix is a ' + this.dim[0] + 'x' + this.dim[1] + ' matrix.';
      throw e;
    }

    if (right - left === 0) {
      var msg = 'Matrix.prototype.asOrthographic: right and left cannot have the same value';
      throw new RangeError(msg);
    }
    if (top - bottom === 0) {
      var msg = 'Matrix.prototype.asOrthographic: top and bottom cannot have the same value';
      throw new RangeError(msg);
    }
    if (far - near === 0) {
      var msg = 'iMatrix.prototype.asOrthographic: far and near cannot have the same value';
      throw new RangeError(msg);
    }

    this.dim.set([4, 4]);
    this.identity();
    this[0] = 2 / (right - left);
    this[3] = -(right + left) / (right - left);
    this[5] = 2 / (top - bottom);
    this[6] = 0;
    this[7] = -(top + bottom) / (top - bottom);
    this[10] = -2 / (far - near);
    this[11] = -(far + near) / (far - near);

    return this;
  };

  // must be 4x4 matrix
  Matrix.prototype.asPerspective = function(near, far, aspect, fov) {
    try {
      dimCheck(this, {dim: [4, 4]});
    } catch (e) {
      e.message = 'Matrix.prototype.asPerspective requires this matrix to be a 4x4 matrix, ';
      e.message += 'but this matrix is a ' + this.dim[0] + 'x' + this.dim[1] + ' matrix.';
      throw e;
    }

    if (far - near === 0) {
      var msg = 'Matrix.prototype.asPerspective: near and far cannot have the same value.';
      throw new RangeError(msg);
    }
    if (aspect === 0) {
      var msg = 'Matrix.prototype.asPerspective: aspect cannot equal zero.';
      throw new RangeError(msg);
    }
    near = (near === 0) ? Number.MIN_VALUE : near;
    far = (far === 0) ? Number.MIN_VALUE : far;
    fov = (fov === 0) ? Number.MIN_VALUE : fov;


    var top = near * Math.tan(fov);
    var right = top * aspect;

    this.dim.set([4, 4]);
    this.identity();
    this[0] = near / right;
    this[5] = near / top;
    this[10] = -(far + near) / (far - near);
    this[11] = -2 * far * near / (far - near);
    this[14] = -1;
    this[15] = 0;

    return this;
  };

  Matrix.prototype.asRotation = function() {

    if (this.dim[0] > 4 || this.dim[1] > 4) {
      var msg = 'Matrix.prototype.asRotation does not support matrices of dim > 4, ';
      msg += 'but this matrix is a ' + this.dim[0] + 'x' + this.dim[1] + ' matrix';
      throw new DimensionError(msg);
    } else if (this.dim[0] !== this.dim[1]) {
      var msg = 'Matrix.prototype.asRotation requires this matrix to be square, ';
      msg += 'but this matrix is a ' + this.dim[0] + 'x' + this.dim[1] + ' matrix';
      throw new DimensionErrror(msg);
    }

    if (typeof arguments[0] === 'number') {
      var angle = arguments[0];
      var c = Math.cos(angle);
      var s = Math.sin(angle);

      // non-homogeneous 2x2 matrix
      if (this.dim[0] === 2 && this.dim[1] === 2) {
        this[0] = c;
        this[1] = -s;
        this[2] = s;
        this[3] = c;

      // homogeneous 3x3 matrix
      } else if (this.dim[0] === 3 && this.dim[1] === 3) {
        this[0] = c;
        this[1] = -s;
        this[2] = 0;
        this[3] = s;
        this[4] = c;
        this[5] = 0;
        this[6] = 0;
        this[7] = 0;
        this[8] = 0;

      } else {
        var msg = 'Matrix.prototype.asRotation with first argument of type number requires this ';
        msg += 'matrix to be a non-homogeneous 2x2 matrix or a homogeneous 3x3 matrix, but ';
        msg += 'this matrix dim is ' + this.dim[0] + 'x' + this.dim[1] + '.';
        throw new DimensionError(msg);
      }

    } else if (arguments[0] instanceof Array) {
      var axis = arguments[0];
      var x = axis[0];
      var y = axis[1];
      var z = axis[2];

      if (x === 0 && y === 0 && z === 0) {
        throw new RangeError('Matrix.prototype.asRotation: axis cannot be the zero vector');
      }

      var mag = Math.sqrt(x * x + y * y + z * z);
      x /= mag;
      y /= mag;
      z /= mag;

      var c = Math.cos(arguments[1]);
      var s = Math.sin(arguments[1]);
      var t = 1 - c;

      // non-homogeneous 3x3 matrix
      if (this.dim[0] === 3 && this.dim[1] === 3) {
        this[0] = x * x * t + c;
        this[1] = x * y * t - z * s;
        this[2] = x * z * t + y * s;
        this[3] = x * y * t + z * s;
        this[4] = y * y * t + c;
        this[5] = y * z * t - x * s;
        this[6] = x * z * t - y * s;
        this[7] = y * z * t + x * s;
        this[8] = z * z * t + c;

      // homogeneous 4x4 matrix
      } else if (this.dim[0] === 4 && this.dim[1] === 4) {
        this[0] = x * x * t + c;
        this[1] = x * y * t - z * s;
        this[2] = x * z * t + y * s;
        this[3] = 0;
        this[4] = x * y * t + z * s;
        this[5] = y * y * t + c;
        this[6] = y * z * t - x * s;
        this[7] = 0;
        this[8] = x * z * t - y * s;
        this[9] = y * z * t + x * s;
        this[10] = z * z * t + c;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
      } else {
        var msg = 'Matrix.prototype.asRotation with first argument instnaceof Array requires ';
        msg += 'this matrix to be a non-homogeneous 3x3 matrix or a homogeneous 4x4 matrix, but ';
        msg += 'this matrix dim is ' + this.dim[0] + 'x' + this.dim[1] + '.';
        throw new DimensionError(msg);
      }

    } else {
      var msg = 'Matrix.prototype.asRotation first argument must be of type number or ';
      msg += 'instanceof Array.';
    }

    return this;
  }

  Matrix.prototype.asTranslation = function(vector) {
    var m = this.dim[0];
    var n = this.dim[1];
    var len = vector.length;

    if(this.dim[0] !== this.dim[1]) {
      var msg = 'Matrix.prototype.asTranslation requires this matrix to be square, ';
      msg += 'but this matrix is a ' + this.dim[0] + 'x' + this.dim[1] + ' matrix';
      throw new DimensionError(msg);
    }
    if(this.dim[0] < 3) {
      var msg = 'Matrix.prototype.asTranslation requries this matrix to have dim >= 3, ';
      msg += 'but this matrix is a ' + this.dim[0] + 'x' + this.dim[1] + ' matrix';
      throw new DimensionError(msg);
    }
    if (m - 1 !== len) {
      var msg = 'Matrix.prototype.asTranslation: argument length must be one less than the number ';
      msg += 'of rows in this matrix';
      throw new DimensionError(msg);
    }

    this.identity();
    for (var i = 0; i < len; ++i) {
      this[(i + 1) * n - 1] = vector[i];
    }
    return this;
  };

  // supports all dimensions
  Matrix.prototype.asScale = function(arrayOrScalar) {
    var m = this.dim[0];
    var n = this.dim[1];

    this.identity();

    if (typeof arrayOrScalar === 'number') {
      for (var i = 0; i < m - 1; ++i) {
        this[i + i * n] = arrayOrScalar;
      }
    } else {
      if (arrayOrScalar.length !== m - 1) {
        var msg = 'Matrix.prototype.asScale array argument length must be one minus the number ';
        msg += 'of rows in this matrix because asScale only supports homogeneous coordinates.';
        throw new RangeError(msg);
      }
      for (var i = 0; i < m - 1; ++i) {
        this[i + i * n] = arrayOrScalar[i];
      }
    }

    return this;
  };

  Matrix.prototype.rotate = function(axis, angle) {
    Matrix.cache2.dim.set(this.dim);i
    try {
      this.mul(Matrix.cache2.asRotation(axis, angle));
    } catch(e) {
      e.message = e.message.replace('asRotation', 'rotate');
      throw e;
    }

    return this;
  }

  Matrix.prototype.translate = function(vector) {
    Matrix.cache2.dim.set(this.dim);
    try {
      this.mul(Matrix.cache2.asTranslation(vector));
    } catch(e) {
      e.message = e.message.replace('asTranslation', 'translate');
      throw e;
    }

    return this;
  }

  Matrix.prototype.scale = function(arrayOrScalar) {
    Matrix.cache2.dim.set(this.dim);
    try {
      this.mul(Matrix.cache2.asScale(arrayOrScalar));
    } catch(e) {
      e.message = e.message.replace('asScale', 'scale');
      throw e;
    }

    return this;
  }

  // supports all dimensions
  Matrix.prototype.toString = function() {
    var str = '';
    var m = this.dim[0];
    var n = this.dim[1];

    for (var i = 0; i < m; ++i) {
      if (i !== 0) {
        str += ' ';
      }
      for (var j = 0; j < n; ++j) {
        str += this[j + i * n];
        if (j !== n - 1) {
          str += ' ';
        }
      }
      if (i !== m - 1) {
        str += '\n';
      }
    }
    return str;
  };

  /*
   * Quaternion type
   */
  function Quaternion() {
    this.t = 1;
    this.v = new Vector(3);
    this.dim = new Dimensions(4);
  }
  Quaternion.prototype = Object.create(Dimensional.prototype);
  Quaternion.prototype.constructor = Quaternion;
  Quaternion.prototype.equals = function(quaternion) {
    return (this.t === quaternion.t && this.v.equals(quaternion.v));
  };

  Quaternion.cache1 = new Quaternion(4);
  Quaternion.cache2 = new Quaternion(4);

  Quaternion.mul = function(q1, q2, out) {
    out = out || new Quaternion();
    var q1V = q1.v;
    var q2V = q2.v;
    var outV = out.v;
    var w = q1.t;
    var x = q1V[0];
    var y = q1V[1];
    var z = q1V[2];
    var ow = q2.t;
    var ox = q2V[0];
    var oy = q2V[1];
    var oz = q2V[2];

    out.t = w * ow - x * ox - y * oy - z * oz;
    outV[0] = w * ox + x * ow + y * oz - z * oy;
    outV[1] = w * oy - x * oz + y * ow + z * ox;
    outV[2] = w * oz + x * oy - y * ox + z * ow;

    return out;
  };

  Quaternion.invert = function(quaternion, out) {
    out = out || new Quaternion();

    var vin = quaterinon.v;
    var vout = out.v;
    var quad = quaternion.quadrance();
    out.t = quaternion.t * invQuad;
    vout[0] = -vin[0] / quad;
    vout[1] = -vin[1] / quad;
    vout[2] = -vin[2] / quad;

    return out;
  };

  Quaternion.conjugate = function(qin, out) {
    out = out || new Quaternion();
    var vin = qin.v;
    var vout = out.v;

    out.t = qin.t;
    vout[0] = -vin[0];
    vout[1] = -vin[1];
    vout[2] = -vin[2];

    return out;
  };

  Quaternion.prototype.quadrance = function() {
    var v = this.v;
    return this.t * this.t + v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  };

  Quaternion.prototype.length = function() {
    return Math.sqrt(this.quadrance());
  };

  Quaternion.prototype.invert = function() {
    var v = this.v;
    var quad = this.quadrance();
    this.t /= quad;
    v[0] /= -quad;
    v[1] /= -quad;
    v[2] /= -quad;
    return this;
  };

  Quaternion.prototype.conjugate = function() {
    this.v.scale(-1);
    return this;
  };

  Quaternion.prototype.normalize = function() {
    var len = this.length();

    this.t /= len;
    this.v.scale(1 / len);

    return this;
  };

  Quaternion.prototype.rotate = function(vector) {
    var v = this.v;
    var t = this.t;
    var cx = Vector.cross(v, [vector[0], vector[1], vector[2]]).scale(2);
    var cx2 = Vector.cross(v, cx);
    vector[0] += t * cx[0] + cx2[0];
    vector[1] += t * cx[1] + cx2[1];
    vector[2] += t * cx[2] + cx2[2];
    return vector;
  };

  Quaternion.prototype.mul = function(quaternion) {
    var thisV = this.v;
    var otherV = quaternion.v;
    var w = this.t;
    var x = thisV[0];
    var y = thisV[1];
    var z = thisV[2];
    var ow = quaternion.t;
    var ox = otherV[0];
    var oy = otherV[1];
    var oz = otherV[2];

    this.t = w * ow - x * ox - y * oy - z * oz;
    thisV[0] = w * ox + x * ow + y * oz - z * oy;
    thisV[1] = w * oy - x * oz + y * ow + z * ox;
    thisV[2] = w * oz + x * oy - y * ox + z * ow;

    return this;
  };

  Quaternion.prototype.setAxisAngle = function(axis, angle) {
    if (!(axis instanceof Array)) {
      var msg = 'Quaternion.prototype.setAxisAngle axis argument must be an instance of Array';
      throw new TypeError(msg);
    }
    if (typeof angle !== 'number') {
      var msg = 'Quaternion.prototype.SetAxisAngle angle argument must be of type Number';
      throw new TypeError(msg);
    }
    var len = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
    this.t = Math.cos(angle / 2);
    this.v.set(axis).scale(Math.sin(angle / 2) / len);
    return this;
  };

  Quaternion.prototype.toMatrix = function(matrix) {
    if (typeof matrix === 'undefined') {
      matrix = new Matrix();
    }

    var v = this.v;
    var w = this.t;
    var x = v[0];
    var y = v[1];
    var z = v[2];
    var s = 2.0 / this.quadrance();
    var xs = x * s;
    var ys = y * s;
    var zs = z * s;
    var wx = w * xs;
    var wy = w * ys;
    var wz = w * zs;
    var xx = x * xs;
    var xy = x * ys;
    var xz = x * zs;
    var yy = y * ys;
    var yz = y * zs;
    var zz = z * zs;

    if(matrix.dim[0] === 4 && matrix.dim[1] === 4) {

      matrix[0] = 1 - (yy + zz);
      matrix[1] = xy - wz;
      matrix[2] = xz + wy;
      matrix[3] = 0;
      matrix[4] = xy + wz;
      matrix[5] = 1 - (xx + zz);
      matrix[6] = yz - wx;
      matrix[7] = 0;
      matrix[8] = xz - wy;
      matrix[9] = yz + wx;
      matrix[10] = 1 - (xx + yy);
      matrix[11] = 0;
      matrix[12] = 0;
      matrix[13] = 0;
      matrix[14] = 0;
      matrix[15] = 1;

    } else if (matrix.dim[0] === 3 && matrix.dim[1] === 3) {
      matrix[0] = 1 - (yy + zz);
      matrix[1] = xy + wz;
      matrix[2] = xz - wy;
      matrix[3] = xy - wz;
      matrix[4] = 1 - (xx + zz);
      matrix[5] = yz + wx;
      matrix[6] = xz + wy;
      matrix[7] = yz - wx;
      matrix[8] = 1 - (xx + yy);

    } else {
      var msg = 'Quaternion.prototype.toMatrix argument must be undefined, a 3x3 matrix, ';
      msg += 'or a 4x4 matrix.';
      throw new DImensionError(msg);
    }

    return matrix;
  };

  Quaternion.prototype.toTVArray = function() {
    return [this.t, this.v[0], this.v[1], this.v[2]];
  };

  Quaternion.prototype.toVTArray = function() {
    return [this.v[0], this.v[1], this.v[2], this.t];
  };

  Quaternion.prototype.toString = function() {
    return 'r: ' + this.t + ', i: [ ' + this.v[0] + ', ' + this.v[1] + ', ' + this.v[2] + ' ]';
  };


  /*
   * Provides yaw, pitch, and roll attitude rotations.
   *
   * Uses a quaternion and orthagonal 3x3 matrix under the hood.
   */
  function Attitude() {
    // lateral axis
    this.cross = new Vector([1, 0, 0]);
    // normal axis
    this.up = new Vector([0, 1, 0]);
    // longitudinal axis
    this.look = new Vector([0, 0, 1]);
  }
  Attitude.cache = new Quaternion();

  Attitude.toMatrix = function(attitude, matrix) {
    if (typeof matrix === 'undefined') {
      matrix = new Matrix();
    }
    matrix.identity();
    var c = attitude.cross;
    var u = attitude.up;
    var l = attitude.look;

    if (matrix.dim[0] === 3 && matrix.dim[1] === 3) {
      matrix[0] = c[0];
      matrix[1] = c[1];
      matrix[2] = c[2];
      matrix[3] = u[0];
      matrix[4] = u[1];
      matrix[5] = u[2];
      matrix[6] = l[0];
      matrix[7] = l[1];
      matrix[8] = l[2];
    } else if (matrix.dim[0] === 4 && matrix.dim[1] === 4) {
      matrix[0] = c[0];
      matrix[1] = c[1];
      matrix[2] = c[2];
      matrix[4] = u[0];
      matrix[5] = u[1];
      matrix[6] = u[2];
      matrix[8] = l[0];
      matrix[9] = l[1];
      matrix[10] = l[2];
    } else {
      var msg = 'Attitude.toMatrix matrix argument must be undefined or a 3x3 or 4x4 Matrix.';
      throw new DimensionsEror(msg);
    }

    return matrix;
  };

  Attitude.prototype.pitch = function(theta) {
    var cache = Attitude.cache;
    cache.setAxisAngle(this.cross, -theta);
    cache.rotate(this.up);
    cache.rotate(this.look);
    return this;
  }

  Attitude.prototype.yaw = function(theta) {
    var cache = Attitude.cache;
    cache.setAxisAngle(this.up, -theta);
    cache.rotate(this.cross);
    cache.rotate(this.look);
    return this;
  }

  Attitude.prototype.roll = function(theta) {
    var cache = Attitude.cache;
    cache.setAxisAngle(this.look, -theta);
    cache.rotate(this.cross);
    cache.rotate(this.up);
    return this;
  }

  Attitude.prototype.toMatrix = function(matrix) {
    if (typeof Matrix === 'undefined') {
      var msg = 'Attitude.prototype.toMatrix matrix argument must be defined. ';
      msg += 'to create a new Matrix from this attitude use Attitude.toMatrix instead.';
      throw new ReferenceError(msg);
    }
    return Attitude.toMatrix(this, matrix);
  };

  Attitude.prototype.rotate = function(matrix) {
    var cache = Matrix.cache2;
    cache.dim[0] = matrix.dim[0];
    cache.dim[1] = matrix.dim[1];
    this.toMatrix(cache);

    return matrix.mul(cache);
  };

  Attitude.prototype.toString = function() {
    return this.cross.toString() + "\n " + this.up.toString() + "\n " + this.look.toString();
  };


  /**
   * @name DimensionError
   */
  /**
   * @name DimensionError^2
   */
  function DimensionError(obj1, obj2) {
    if (typeof obj1 === 'string') {
      this.message = obj1;
      this.dims = new Dimensions([null]);
    } else {
      var t1 = obj1.constructor.name;
      var t2 = obj2.constructor.name;
      var d1;

      var d2;
      if (obj1.dim != null) {
        d1 = obj1.dim;
      } else if (obj1 instanceof Array) {
        d1 = obj1.length;
      } else if (typeof obj1 === 'number') {
        d1 = 1;
      } else {
        d1 = [null];
      }

      if (obj2.dim != null) {
        d2 = obj2.dim;
      } else if (obj2 instanceof Array) {
        d2 = obj2.length;
      } else if (typeof obj2 === 'number') {
        d2 = 1;
      } else {
        d2 = [null];
      }

      this.dims = [new Dimensions(d1), new Dimensions(d2)];
      this.dims.equals = function(array) {
        return this[0].equals(array[0]) && this[1].equals(array[1]);
      };

      if (this.dims[0][0] === null) {
        d1 = 'null';
      }
      if (this.dims[1][0] === null) {
        d2 = 'null';
      }

      this.message = 'Dimension mismatch: dim(' + t1 + ') = ' + d1 + '; dim(' + t2 + ') = ' + d2;
    }
  }
  DimensionError.prototype = Object.create(Error.prototype);
  DimensionError.prototype.constructor = DimensionError;

  function dimCheck(obj1, obj2) {
    if (obj1.dim != null) {
      var dim = obj2.dim || [obj2.length];
      if (!obj1.dim.equals(dim)) {
        throw new DimensionError(obj1, obj2);
      }
    } else if (obj2.dim != null) {
      var dim = obj1.dim || [obj1.length];
      if (!obj2.dim.equals(dim)) {
        throw new DimensionError(obj1, obj2);
      }
    } else if (obj1.length !== obj2.length) {
      throw new DimensionError(obj1, obj2);
    }
  }

  // this array and one array parameter or
  // two array parameters
  function arrayIndexedEntriesEqual(arr1, arr2) {
    var toString = Object.prototype.toString;

    // determine if arr1 and arr2 are array-like
    if (!(arr1 instanceof Array) && !/Array/.test(toString.call(arr1))) {
      return false;
    } else if (!(arr2 instanceof Array) && !/Array/.test(toString.call(arr2))) {
      return false;
    }

    for (var i = 0, len = arr1.length; i < len; ++i) {
      if (arr1[i] instanceof Array && arr2[i] instanceof Array) {
        if (!arrayIndexedEntriesEqual(arr1[i], arr2[i])) {
          return false;
        }
      } else if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }
}());
