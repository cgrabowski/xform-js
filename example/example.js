/*
 * Christopher Grabowski
 * COSC 355 Assignment 5
 * 14 April 2015
 */

'use strict';

// add the xform namespace to the global context
xform.usingNamespace(this);

var INIT_RADIUS = 5;
var INIT_MERIDIANS = 50;
var INIT_PARALLELS = 50;
var INIT_TEXT_SPIN = 3200;
var INIT_SHININESS = 32;

var canvas;
var gl;
var torusModel1;
var torusModel2;
var normalMat;
var torusRot;
var quat;
var view;
var projection;
var modelView;
var mvp;
var uMV;
var uMVP;
var uLightPos;
var uLightColor;
var uCamPos;
var uColor;
var uNormal;
var uTime;
var uShininess;
var uText;
var torus;
var light;
var textID;
var textSpin = INIT_TEXT_SPIN;
var shininess = INIT_SHININESS;

window.onload = function() {
  canvas = document.getElementById('gl-canvas');
  gl = WebGLUtils.setupWebGL(canvas) || (function() {
    throw new Error('Failed to get WebGL context.');
  }());
  projection = new Matrix(); // projection matrix is set in resize()
  window.onresize = resize;
  resize();

  var vertexShader = genShader('phong-vertex-shader', gl.VERTEX_SHADER);
  var fragmentShader = genShader('phong-fragment-shader', gl.FRAGMENT_SHADER);
  var program = genProgram(vertexShader, fragmentShader);
  gl.useProgram(program);

  uMVP = gl.getUniformLocation(program, 'uMVP');
  uLightPos = gl.getUniformLocation(program, 'uLightPos');
  uLightColor = gl.getUniformLocation(program, 'uLightColor');
  uCamPos = gl.getUniformLocation(program, 'uCamPos');
  uMV = gl.getUniformLocation(program, 'uMV');
  uTime = gl.getUniformLocation(program, 'uTime');
  uShininess = gl.getUniformLocation(program, 'uShininess');

  view = new Matrix().asView([0, 0, -30]);
  modelView = new Matrix();
  mvp = new Matrix();

  torus = new TorusPhongMesh(gl, program, INIT_RADIUS, INIT_MERIDIANS, INIT_PARALLELS);

  torusModel1 = new Matrix();
  torusModel1.asTranslation([-10, 0, 0]);
  torusModel2 = new Matrix();
  torusModel2.asTranslation([10, 0, 0]);

  normalMat = new Matrix(3, 3);
  torusRot = new Attitude();
  quat = new Quaternion();

  light = new PointLight([0.0, 0.0, 10.0], [0.8, 0.4, 0.4]);
  gl.uniform3fv(uLightColor, new Float32Array(light.color));
  gl.uniform1f(uShininess, shininess);

  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.enable(gl.DEPTH_TEST);
  gl.polygonOffset(1.0, 2.0);

  TextureManager.setGL(gl);
  var image = new Image();
  image.onload = function() {
    textID = TextureManager.create(image);
    TextureManager.bind(textID);
    gl.uniform1i(uText, textID);
    render(0);
  };
  image.src = 'skulls.jpg';
}

function render(time) {
  gl.uniform1f(uTime, time % textSpin / textSpin);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_COLOR_BIT);

  quat.setAxisAngle(torusRot.look, Math.PI / 100);
  quat.toMatrix(torusModel1);
  torusModel2.mul(torusModel1);

  torusRot.pitch(Math.PI / 400);
  torusRot.yaw(Math.PI / 600);
  torusRot.roll(Math.PI / 900);
  torusModel1.asTranslation([-10, 0, 0]);
  torusRot.rotate(torusModel1);

  gl.uniform3fv(uLightPos, new Float32Array(light.position));
  gl.uniform3fv(uCamPos, new Float32Array([view[3], view[7], view[11]]));

  mvp.identity().mul(projection).mul(view).mul(torusModel1).transpose();
  modelView.identity().mul(view).mul(torusModel1);
  gl.uniformMatrix4fv(uMVP, gl.FALSE, new Float32Array(mvp));
  Matrix.minor(modelView, 3, 3, normalMat);
  normalMat.invert();
  gl.uniformMatrix3fv(uMV, gl.FALSE, new Float32Array(normalMat));
  torus.render(gl);

  mvp.identity().mul(projection).mul(view).mul(torusModel2).transpose();
  modelView.identity().mul(view).mul(torusModel2);
  gl.uniformMatrix4fv(uMVP, gl.FALSE, new Float32Array(mvp));
  Matrix.minor(modelView, 3, 3, normalMat);
  normalMat.invert();
  gl.uniformMatrix3fv(uMV, gl.FALSE, new Float32Array(normalMat));
  torus.render(gl);

  requestAnimFrame(render);
}

window.onmousemove = function(event) {
  var cx = event.clientX;
  var cy = event.clientY;
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  light.position[0] = (cx / ww - 0.5) * 50;
  light.position[1] = -(cy / wh - 0.5) * 50;
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(canvas.left, canvas.top, canvas.width, canvas.height);
  projection.asPerspective(1, 200, canvas.width / canvas.height, Math.PI / 6);
}

function PointLight(position, color) {
  if (typeof position !== 'undefined' && position instanceof Array && !(position instanceof Vector)) {
    position = new Vector(position);
  }
  if (typeof color !== 'undefined' && color instanceof Array && !(color instanceof Vector)) {
    color = new Vector(color);
  }
  this.position = position || new Vector([0.0, 0.0, 0.0]);
  this.color = color || new Vector([1.0, 1.0, 1.0]);;
}

function TorusPhongMesh(gl, program, radius, meridians, parallels) {
  this.radius = radius;
  this.meridians = meridians;
  this.parallels = parallels;
  this.vertices = [];
  this.normals = [];
  this.uvs = [];
  this.uniforms = {}; // no uniforms
  this.attributes = {
    // attributes set below in this constructor
    'aPosition': null,
    'aNormal': null,
    'aUV': null
  };

  var cos = Math.cos;
  var sin = Math.sin;
  var PI = Math.PI;
  var r = radius;
  var a = r / 2;
  var m = meridians;
  var p = parallels;

  for (var j = 0; j < p; ++j) {
    var f1 = 2 * PI / p * j;
    var f2 = 2 * PI / p * (j + 1);

    for (var i = 0; i < m + 1; ++i) {
      var t = 2 * PI / m * i;

      var center = new Vector([r * cos(t), r * sin(t), 0.0]);

      var vert = new Vector([
        (r + a * cos(f1)) * cos(t), (r + a * cos(f1)) * sin(t),
        a * sin(f1),
        1
      ]);
      this.vertices.push(vert);

      this.normals.push(new Vector([
        vert[0] - center[0],
        vert[1] - center[1],
        vert[2] - center[2]
      ]).normalize());

      vert = new Vector([
        (r + a * cos(f2)) * cos(t), (r + a * cos(f2)) * sin(t),
        a * sin(f2),
        1
      ]);
      this.vertices.push(vert);

      this.normals.push(new Vector([
        vert[0] - center[0],
        vert[1] - center[1],
        vert[2] - center[2]
      ]).normalize());

      var red = Math.random() * 0.15;
      var green = Math.random() * 0.15;
      var blue = Math.random() * 0.15;

      this.uvs.push(new Vector([j / p, i / m]));
      this.uvs.push(new Vector([(j + 1) / p, i / m]));
    }
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, Vector.flatten(this.vertices, Float32Array), gl.STATIC_DRAW);
  this.attributes.aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.vertexAttribPointer(this.attributes.aPosition, 4, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, Vector.flatten(this.normals, Float32Array), gl.STATIC_DRAW);
  this.attributes.aNormal = gl.getAttribLocation(program, 'aNormal');
  gl.vertexAttribPointer(this.attributes.aNormal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, Vector.flatten(this.uvs, Float32Array), gl.STATIC_DRAW);
  this.attributes.aUV = gl.getAttribLocation(program, 'aUV');
  gl.vertexAttribPointer(this.attributes.aUV, 2, gl.FLOAT, false, 0, 0);

}

TorusPhongMesh.prototype.render = function(gl) {
  gl.enableVertexAttribArray(this.attributes.aPosition);
  gl.enableVertexAttribArray(this.attributes.aNormal);
  gl.enableVertexAttribArray(this.attributes.aUV);

  var m = this.meridians + 1;
  for (var i = 0, p = this.parallels; i < p; ++i) {
    gl.drawArrays(gl.TRIANGLE_STRIP, m * 2 * i, m * 2);
  }
}

var TextureManager = (function() {
  var _textures = [];
  var _gl;

  function _createTexture(image, flipY) {
    var texture = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, texture);
    if (typeof flipY !== 'undefined' && flipY === true) {
      _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
    }
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
    _gl.bindTexture(_gl.TEXTURE_2D, null);
    return texture;
  }

  return {
    setGL: function(gl) {
      _gl = gl;
    },
    create: function(imageOrArrayOfImages, flipY) {
      // one parameter: one image or an array of images
      flipY = flipY || false;
      if (arguments[0] instanceof Array) {
        var firstHandle = _textures.length;

        for (var i = 0; i < imageArg.length; i++) {
          _textures.push(_createTexture(arguments[0][i], flipY));
        }
        return firstHandle;
      } else {
        _textures.push(_createTexture(arguments[0], flipY));
        return _textures.length - 1;
      }
    },
    bind: function(index) {

      _gl.bindTexture(_gl.TEXTURE_2D, _textures[index]);
    },
    replace: function(image, index) {
      var oldTexture = _textures[index];

      _textures[index] = createTexture(image);
      _gl.deleteTexture(oldTexture);
      return _textures[index];
    },
    dispose: function(index) {
      _gl.deleteTexture(_textures[index]);
      _textures.splice(index, 1);
    },
    disposeAll: function() {
      for (var i = 0; i < _textures.length; i++) {;
        _gl.deleteTexture(_textures[i]);
      }
      _textures = [];
    },
  };

}());

function genProgram(vertexShader, fragmentShader) {
  var program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS) === 0) {
    throw new Error(gl.getProgramInfoLog(program));
  }

  return program;
}

function genShader(id, type) {
  var shader = gl.createShader(type);
  var source = document.getElementById(id).innerHTML;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === 0) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}
