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
  xform.OrthonormalBasis = OrthonormalBasis;
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
      if (typeof array === 'number') {
        type = 'number';
      } else {
        type = array.constructor.name;
      }
      throw new TypeError('Dimensional.equals expected instanceof Array but got + ' + type);
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
    if (out == null) {
      out = new Vector(3);
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
   * TODO: finish generalizing all methods that can be generalized to any dimensionality
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

  // supports all (compatible) dimensionality
  Matrix.mul = function(mat1, mat2, out) {
    var m1, m2, n1, n2;

    m1 = mat1.dim[0];
    n1 = mat1.dim[1];

    if (mat2 instanceof Matrix) {
      m2 = mat2.dim[0];
      n2 = mat2.dim[1];
    } else {
      m2 = mat2.length;
      n2 = 1;
    }

    if (n1 !== m2) {
      throw new DimensionError('left matrix n = ' + n1 + ', right matrix m = ' + m2);
    }

    if (out == null) {
      out = new Matrix(m1, n2);
      out.zero();
    } else {
      out.dim = [m1, n2];
      out.zero();
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

  // TODO: this method must produce a permuation matrix
  // when necessary
  Matrix.lufac = function(matrix, lower, upper) {
    if (typeof matrix === 'undefined') {
      var msg = 'First argument to Matrix.lufac is undefined';
      throw new ReferenceError(msg);
    }
    if (matrix.dim[0] !== matrix.dim[1]) {
      var msg = 'Matrix.lufac requires a square matrix.';
      throw new DimensionError(msg);
    }

    var mat = matrix;
    var d = mat.dim[0];
    if (typeof lower === 'undefined') {
      lower = new Matrix(d, d);
    } else {
      lower.dim[0] = d;
      lower.dim[1] = d;
    }
    if (typeof upper === 'undefined') {
      upper = new Matrix(d, d);
    } else {
      upper.dim[0] = d;
      upper.dim[1] = d;
    }
    var lo = lower;
    var up = upper;

    for (var i = 0; i < d; ++i) {
      lo[i * d] = mat[i * d]
      for (var j = 0; j < d; ++j) {
        if (i > j) {
          up[i * d + j] = 0;
        } else if (i < j) {
          lo[i * d + j] = 0;
        } else {
          up[i * d + j] = 1;
        }
      }
    }

    for (var j = 1; j < d; ++j)
      for (var i = 0; i < d; ++i) {
        if (i >= j) {
          lo[i * d + j] = mat[i * d + j];

          for (var k = 0; k < j; ++k) {
            lo[i * d + j] -= lo[i * d + k] * up[k * d + j];
          }
        }

        if (i < j) {
          up[i * d + j] = mat[i * d + j];
          for (var k = 0; k < i; ++k) {
            up[i * d + j] -= lo[i * d + k] * up[k * d + j];
          }
          up[i * d + j] /= lo[i * d + i];
        }
    }
    return [lower, upper];
  };

  Matrix.det = function(matrix) {
    if (matrix.dim[0] !== matrix.dim[1]) {
      var msg = 'determinant is only defined for square matrices';
      throw new DimensionError(msg);

    } else if (matrix.dim[0] == 2) {
      return matrix[0] * matrix[3] - matrix[1] * matrix[2];
    }

    var d = matrix.dim[0];
    var det = 0;

    for (var j = 0; j < d; ++j) {
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
    if (Matrix.det(matrix) === 0) {
      var msg = 'Cannot invert a singular matrix.';
      throw new RangeError(msg);
    }
    var mat = matrix;
    var d = mat.dim[0];
    var det = 0;
    out = out || new Matrix(d, d);
    var minor = new Matrix(d - 1, d - 1);

    for (var i = 0; i < d; ++i)
      for (var j = 0; j < d; ++j) {
        var ind = i * d + j;
        out[ind] = Matrix.det(Matrix.minor(mat, i, j, minor));
      if (i % 2 !== j % 2) {
        out[ind] *= -1;
      }
      if (i === 0) {
        det += mat[j] * out[ind];
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

  Matrix.prototype.set = function(array) {
    var len = this.length;
    for (var i = 0; i < len; ++i) {
      this[i] = array[i];
    }
    return this;
  };

  Matrix.prototype.setEntry = function(m, n, val) {
    this[n - 1 + (m - 1) * this.dim[1]] = val;
    return this;
  };

  // supports all dimensions
  // allows seting a non-sqaure matrix to its analog of the identity matrix
  Matrix.prototype.identity = function() {
    var m = this.dim[0];
    var n = this.dim[1];

    for (var i = 0; i < m; ++i)
      for (var j = 0; j < n; ++j) {
        this[j + i * n] = (i === j) ? 1 : 0;
      }
    return this;
  };

  // suuports all dimensions
  Matrix.prototype.zero = function() {
    var len = this.dim[0] * this.dim[1];
    for (var i = 0; i < len; ++i) {
      this[i] = 0;
    }
    return this;
  }

  // supports all (compatible) dimensions
  Matrix.prototype.mul = function(matrix) {
    var m1 = this.dim[0];
    var n1 = this.dim[1];
    var m2, n2;

    if (matrix instanceof Matrix) {
      m2 = matrix.dim[0];
      n2 = matrix.dim[1];
    } else {
      m2 = matrix.length;
      n2 = 1;
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

  // supports all dimensions
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
    position = position || [0, 0, 0];
    if (!(position instanceof Array)) {
      throw new TypeError('position argument to asView must be an instance of Array');
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
    if (right - left === 0) {
      throw new RangeError('asOrthographic: right and left cannot have the same value');
    }
    if (top - bottom === 0) {
      throw new RangeError('asOrthographic: top and bottom cannot have the same value');
    }
    if (far - near === 0) {
      throw new RangeError('asOrthographic: far and near cannot have the same value');
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
    if (far - near === 0) {
      throw new RangeError('asPerspective: near and far cannot have the same value.');
    }
    if (aspect === 0) {
      throw new RangeError('asPerspective: aspect cannot equal zero.');
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

  // TODO: support all dimensions
  Matrix.prototype.asRotation = function(axis, angle) {
    var x = axis[0];
    var y = axis[1];
    var z = axis[2];

    if (x === 0 && y === 0 && z === 0) {
      throw new RangeError('rotation: axis cannot be the zero vector');
    }

    var mag = Math.sqrt(x * x + y * y + z * z);
    x /= mag;
    y /= mag;
    z /= mag;
    var c = Math.cos(angle);
    var s = Math.sin(angle)
    var t = 1 - c;

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

    return this;
  }

  // TODO: support all dimensions
  Matrix.prototype.asTranslation = function(vector) {
    var m = this.dim[0];
    var n = this.dim[1];
    var len = vector.length;
    if (m - 1 !== len) {
      var msg = 'translate: argument length must be one less than the number of rows in this matrix';
      throw new DimensionError();
    }
    this.identity();
    for (var i = 0; i < len; ++i) {
      this[(i + 1) * n - 1] = vector[i];
    }
    return this;
  };

  // supports all dimensions
  Matrix.prototype.asScale = function(arrayOrScalar) {
    this.identity();
    var m = this.dim[0];
    var n = this.dim[1];

    if (typeof arrayOrScalar === 'number') {
      for (var i = 0; i < m - 1; ++i) {
        this[i + i * n] = arrayOrScalar;
      }
    } else {
      if (arrayOrScalar.length !== m - 1) {
        var msg = 'scale: array argument length must be one minus the number of rows in this.';
        throw new RangeError(msg);
      }
      for (var i = 0; i < m - 1; ++i) {
        this[i + i * n] = arrayOrScalar[i];
      }
    }

    return this;
  };

  Matrix.prototype.rotate = function(axis, angle) {
    Matrix.cache2.dim.set(this.dim);
    return this.mul(Matrix.cache2.asRotation(axis, angle));
  }

  Matrix.prototype.translate = function(vector) {
    Matrix.cache2.dim.set(this.dim);
    return this.mul(Matrix.cache2.asTranslation(vector));
  }

  Matrix.prototype.scale = function(arrayOrScalar) {
    Matrix.cache2.dim.set(this.dim);
    return this.mul(Matrix.cache2.asScale(arrayOrScalar));
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

  Quaternion.cache1 = new Vector(3);
  Quaternion.cache2 = new Vector(3);

  Quaternion.mul = function(q1, q2, out) {
    out = out || new Quaternion();

    var t1 = q1.t;
    var v1 = q1.v;
    var t2 = q2.t;
    var v2 = q2.v;

    out.t = t1 * t2 - Vector.dot(v1, v2);
    Vector.cross(v1, v2, out.v);
    out.v[0] = t1 * v2[0] + t2 * v1[0];
    out.v[1] = t1 * v2[1] + t2 * v1[1];
    out.v[2] = t1 * v2[2] + t2 * v1[2];

    t1 = out.t;
    v1 = Quaternion.cache1.set(out.v);
    t2 = q1.t;
    v2 = Quaternion.cache2.set([-q1[0], -q1[1], -q2[2]]);

    out.t = t1 * t2 - Vector.dot(v1, v2);
    Vector.cross(v1, v2, out.v);
    out.v[0] = t1 * v2[0] + t2 * v1[0];
    out.v[1] = t1 * v2[1] + t2 * v1[1];
    out.v[2] + t1 * v2[2] + t2 * v1[2];

    return out;
  };

  Quaternion.prototype.rotate = function(vector) {
    var t1 = this.t;
    var v1 = this.v;
    var t2 = vector[3];
    var v2 = Quaternion.cache1.set([vector[0], vector[1], vector[2]]);

    vector[3] = t1 * t2 - Vector.dot(v1, v2);
    Vector.cross(v1, v2, [vector[0], vector[1], vector[2]]);
    vector[0] = t1 * v2[0] + t2 * v1[0];
    vector[1] = t1 * v2[1] + t2 * v1[1];
    vector[2] = t1 * v2[2] + t2 * v1[2];

    t1 = vector[3];
    v1 = Quaternion.cache1.set([vector[0], vector[1], vector[2]]);
    t2 = this.t;
    v2 = Quaternion.cache2.set([-this.v[0], -this.v[1], -this.v[2]]);

    vector[3] = t1 * t2 - Vector.dot(v1, v2);
    Vector.cross(v1, v2, [vector[0], vector[1], vector[2]]);
    vector[0] = t1 * v2[0] + t2 * v1[0];
    vector[1] = t1 * v2[1] + t2 * v1[1];
    vector[2] = t1 * v2[2] + t2 * v1[2];

    return vector;
  };

  Quaternion.prototype.mul = function(quaternion) {
    var t1 = quaternion.t;
    var v1 = quaternion.v;
    var t2 = this.t;
    var v2 = Quaternion.cache1.set(this.v);

    this.t = t1 * t2 - Vector.dot(v1, v2);
    Vector.cross(v1, v2, this.v);
    this.v[0] += t1 * v2[0] + t2 * v1[0];
    this.v[1] += t1 * v2[1] + t2 * v1[1];
    this.v[2] += t1 * v2[2] + t2 * v1[2];

    t1 = this.t;
    v1 = Quaternion.cache1.set(this.v);
    t2 = quaternion.t;
    v2 = Quaternion.cache2.set([-quaternion.v[0], -quaternion.v[1], -quaternion.v[2]]);

    Vector.cross(v1, v2, this.v);
    this.v[0] += t1 * v2[0] + t2 * v1[0];
    this.v[1] += t1 * v2[1] + t2 * v1[1];
    this.v[2] += t1 * v2[2] + t2 * v1[2];

    return this;
  };

  Quaternion.prototype.setAxisAngle = function(axis, angle) {
    if (!(axis instanceof Array)) {
      throw new TypeError('axis argument to setAxisAngle must be an instance of Array');
    }
    if (typeof angle !== 'number') {
      throw new TypeError('angle argument to SetAxisAngle must be of type Number');
    }

    this.t = Math.cos(angle / 2);
    this.v.set(axis).scale(Math.sin(angle / 2));
    return this;
  };

  Quaternion.prototype.toMatrix = function() {
    var mat = new Matrix();
    var theta = Math.acos(this.t) * 2;
    var x = this.v[0];
    var y = this.v[1];
    var z = this.v[2];
    var cos = Math.cos;
    var sin = Math.sin;

    mat[0] = cos(theta) + x * x * (1 - cos(theta));
    mat[1] = x * y * (1 - cos(theta)) - z * sin(theta);
    mat[2] = x * z * (1 - cos(theta)) + y * sin(theta);
    mat[4] = y * x(1 - cos(theta)) + z * sin(theta);
    mat[5] = cos(theta) + y * y * (1 - cos(theta));
    mat[6] = y * z * (1 - cos(theta)) - x * sin(theta);
    mat[8] = z * x * (1 - cos(theta)) - y * sin(theta);
    mat[9] = z * y * (1 - cos(theta)) + x * sin(theta);
    mat[10] = cos(theta) + z * z * (1 - cos(theta));
    return mat;
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
   * Creates an orthonormal basis in R3 that can be used for quaterion
   * rotations.
   */
  function OrthonormalBasis() {
    // binormal vector
    this.cross = new Vector([1, 0, 0, 1]);
    // normal vector
    this.up = new Vector([0, 1, 0, 1]);
    // tangent vector
    this.look = new Vector([0, 0, 1, 1]);
    // prduct of all rotations over time
    this.orientation = new Quaternion();
  }
  OrthonormalBasis.cache = new Quaternion();

  OrthonormalBasis.prototype.pitch = function(theta) {
    var cache = OrthonormalBasis.cache;
    cache.setAxisAngle(this.cross, theta);
    cache.rotate(up);
    cache.rotate(look);
    orientation.mul(cache);
  }

  OrthonormalBasis.prototype.yaw = function(theta) {
    var cache = OthonormalBasis.cache;
    cache.setAxisAngle(up, theta);
    cache.rotate(cross);
    cache.rotate(look);
    orientation.mul(cache);
  }

  OrthonormalBasis.prototype.roll = function(theta) {
    var cache = OrthonormalBasis.cache;
    cache.setAxisAngle(look, theta);
    cache.rotate(cross);
    cache.rotate(up);
    orientation.mul(cache);
  }

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
