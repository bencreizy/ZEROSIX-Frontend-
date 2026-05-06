/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

const GeometricMesh = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shapeIndex, setShapeIndex] = useState(0);
  const shapes = ["Cube", "Tetrahedron", "Octahedron", "Icosahedron", "Pyramid", "Diamond", "Hexagonal Prism", "Morphing"];

  const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec2 a_uv;
    varying vec2 v_texcoord;
    void main() {
        gl_Position = vec4(a_position, 1.0);
        v_texcoord = a_uv;
    }
  `;

  const fragmentShaderSource = `
    #ifdef GL_ES
    precision highp float;
    #endif
    uniform vec2 u_mouse;
    uniform vec2 u_resolution;
    uniform float u_pixelRatio;
    uniform float u_time;
    uniform int u_shape;
    #define PI 3.14159265359
    #define TWO_PI 6.28318530718
    mat3 rotateX(float a) { float s=sin(a), c=cos(a); return mat3(1,0,0,0,c,-s,0,s,c); }
    mat3 rotateY(float a) { float s=sin(a), c=cos(a); return mat3(c,0,s,0,1,0,-s,0,c); }
    mat3 rotateZ(float a) { float s=sin(a), c=cos(a); return mat3(c,-s,0,s,c,0,0,0,1); }
    vec2 coord(in vec2 p) {
        p = p / u_resolution.xy;
        if (u_resolution.x > u_resolution.y) {
            p.x *= u_resolution.x / u_resolution.y;
            p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
        } else {
            p.y *= u_resolution.y / u_resolution.x;
            p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
        }
        return p - 0.5;
    }
    vec2 project(vec3 p) { return p.xy * (2.0 / (2.0 - p.z)); }
    float drawLine(vec2 p, vec2 a, vec2 b, float thickness, float blur) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return smoothstep(thickness + blur, thickness - blur, length(pa - ba * h));
    }
    void getCube(out vec3 v[8]) {
        float s = 0.7;
        v[0]=vec3(-s,-s,-s); v[1]=vec3(s,-s,-s); v[2]=vec3(s,s,-s); v[3]=vec3(-s,s,-s);
        v[4]=vec3(-s,-s,s); v[5]=vec3(s,-s,s); v[6]=vec3(s,s,s); v[7]=vec3(-s,s,s);
    }
    void getTetra(out vec3 v[4]) {
        float a = 1.0 / sqrt(3.0);
        v[0]=vec3(a,a,a); v[1]=vec3(a,-a,-a); v[2]=vec3(-a,a,-a); v[3]=vec3(-a,-a,a);
    }
    void getOcta(out vec3 v[6]) {
        v[0]=vec3(1,0,0); v[1]=vec3(-1,0,0); v[2]=vec3(0,1,0); v[3]=vec3(0,-1,0); v[4]=vec3(0,0,1); v[5]=vec3(0,0,-1);
    }
    void getIco(out vec3 v[12]) {
        float t = (1.0 + sqrt(5.0)) / 2.0; float s = 1.0 / sqrt(1.0 + t * t);
        v[0]=vec3(-s,t*s,0); v[1]=vec3(s,t*s,0); v[2]=vec3(-s,-t*s,0); v[3]=vec3(s,-t*s,0);
        v[4]=vec3(0,-s,t*s); v[5]=vec3(0,s,t*s); v[6]=vec3(0,-s,-t*s); v[7]=vec3(0,s,-t*s);
        v[8]=vec3(t*s,0,-s); v[9]=vec3(t*s,0,s); v[10]=vec3(-t*s,0,-s); v[11]=vec3(-t*s,0,s);
    }
    float draw(vec2 p, int idx, mat3 rot, float sc, float th, float bl) {
        float r = 0.0;
        if (idx == 0) {
            vec3 v[8]; getCube(v); for(int i=0;i<8;i++) v[i]=rot*(v[i]*sc);
            r+=drawLine(p,project(v[0]),project(v[1]),th,bl); r+=drawLine(p,project(v[1]),project(v[2]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[3]),th,bl); r+=drawLine(p,project(v[3]),project(v[0]),th,bl);
            r+=drawLine(p,project(v[4]),project(v[5]),th,bl); r+=drawLine(p,project(v[5]),project(v[6]),th,bl);
            r+=drawLine(p,project(v[6]),project(v[7]),th,bl); r+=drawLine(p,project(v[7]),project(v[4]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[4]),th,bl); r+=drawLine(p,project(v[1]),project(v[5]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[6]),th,bl); r+=drawLine(p,project(v[3]),project(v[7]),th,bl);
        } else if (idx == 1) {
            vec3 v[4]; getTetra(v); for(int i=0;i<4;i++) v[i]=rot*(v[i]*sc);
            r+=drawLine(p,project(v[0]),project(v[1]),th,bl); r+=drawLine(p,project(v[0]),project(v[2]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[3]),th,bl); r+=drawLine(p,project(v[1]),project(v[2]),th,bl);
            r+=drawLine(p,project(v[1]),project(v[3]),th,bl); r+=drawLine(p,project(v[2]),project(v[3]),th,bl);
        } else if (idx == 2) {
            vec3 v[6]; getOcta(v); for(int i=0;i<6;i++) v[i]=rot*(v[i]*sc);
            r+=drawLine(p,project(v[2]),project(v[0]),th,bl); r+=drawLine(p,project(v[2]),project(v[1]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[4]),th,bl); r+=drawLine(p,project(v[2]),project(v[5]),th,bl);
            r+=drawLine(p,project(v[3]),project(v[0]),th,bl); r+=drawLine(p,project(v[3]),project(v[1]),th,bl);
            r+=drawLine(p,project(v[3]),project(v[4]),th,bl); r+=drawLine(p,project(v[3]),project(v[5]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[4]),th,bl); r+=drawLine(p,project(v[4]),project(v[1]),th,bl);
            r+=drawLine(p,project(v[1]),project(v[5]),th,bl); r+=drawLine(p,project(v[5]),project(v[0]),th,bl);
        } else if (idx == 3) {
            vec3 v[12]; getIco(v); for(int i=0;i<12;i++) v[i]=rot*(v[i]*sc);
            r+=drawLine(p,project(v[0]),project(v[1]),th,bl); r+=drawLine(p,project(v[0]),project(v[5]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[7]),th,bl); r+=drawLine(p,project(v[0]),project(v[10]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[11]),th,bl); r+=drawLine(p,project(v[1]),project(v[5]),th,bl);
            r+=drawLine(p,project(v[1]),project(v[7]),th,bl); r+=drawLine(p,project(v[1]),project(v[8]),th,bl);
            r+=drawLine(p,project(v[1]),project(v[9]),th,bl); r+=drawLine(p,project(v[2]),project(v[3]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[4]),th,bl); r+=drawLine(p,project(v[2]),project(v[6]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[10]),th,bl); r+=drawLine(p,project(v[2]),project(v[11]),th,bl);
            r+=drawLine(p,project(v[3]),project(v[4]),th,bl); r+=drawLine(p,project(v[3]),project(v[6]),th,bl);
            r+=drawLine(p,project(v[3]),project(v[8]),th,bl); r+=drawLine(p,project(v[3]),project(v[9]),th,bl);
            r+=drawLine(p,project(v[4]),project(v[5]),th,bl); r+=drawLine(p,project(v[4]),project(v[11]),th,bl);
            r+=drawLine(p,project(v[5]),project(v[11]),th,bl); r+=drawLine(p,project(v[6]),project(v[7]),th,bl);
            r+=drawLine(p,project(v[6]),project(v[8]),th,bl); r+=drawLine(p,project(v[6]),project(v[10]),th,bl);
            r+=drawLine(p,project(v[7]),project(v[10]),th,bl); r+=drawLine(p,project(v[8]),project(v[9]),th,bl);
            r+=drawLine(p,project(v[9]),project(v[11]),th,bl); r+=drawLine(p,project(v[10]),project(v[11]),th,bl);
        } else if (idx == 4) {
            vec3 v[5]; float s = 0.7;
            v[0]=vec3(-s,0,-s); v[1]=vec3(s,0,-s); v[2]=vec3(s,0,s); v[3]=vec3(-s,0,s); v[4]=vec3(0,1,0);
            for(int i=0;i<5;i++) v[i]=rot*(v[i]*sc);
            r+=drawLine(p,project(v[0]),project(v[1]),th,bl); r+=drawLine(p,project(v[1]),project(v[2]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[3]),th,bl); r+=drawLine(p,project(v[3]),project(v[0]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[4]),th,bl); r+=drawLine(p,project(v[1]),project(v[4]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[4]),th,bl); r+=drawLine(p,project(v[3]),project(v[4]),th,bl);
        } else if (idx == 5) {
            vec3 v[6]; float s = 0.6;
            v[0]=vec3(-s,0,-s); v[1]=vec3(s,0,-s); v[2]=vec3(s,0,s); v[3]=vec3(-s,0,s); v[4]=vec3(0,1,0); v[5]=vec3(0,-1,0);
            for(int i=0;i<6;i++) v[i]=rot*(v[i]*sc);
            r+=drawLine(p,project(v[0]),project(v[1]),th,bl); r+=drawLine(p,project(v[1]),project(v[2]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[3]),th,bl); r+=drawLine(p,project(v[3]),project(v[0]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[4]),th,bl); r+=drawLine(p,project(v[1]),project(v[4]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[4]),th,bl); r+=drawLine(p,project(v[3]),project(v[4]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[5]),th,bl); r+=drawLine(p,project(v[1]),project(v[5]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[5]),th,bl); r+=drawLine(p,project(v[3]),project(v[5]),th,bl);
        } else if (idx == 6) {
            vec3 v[12]; float a = TWO_PI / 6.0;
            for(int i=0;i<6;i++) {
                v[i]=vec3(cos(float(i)*a),-1,sin(float(i)*a));
                v[i+6]=vec3(cos(float(i)*a),1,sin(float(i)*a));
            }
            for(int i=0;i<12;i++) v[i]=rot*(v[i]*sc);
            r+=drawLine(p,project(v[0]),project(v[1]),th,bl); r+=drawLine(p,project(v[1]),project(v[2]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[3]),th,bl); r+=drawLine(p,project(v[3]),project(v[4]),th,bl);
            r+=drawLine(p,project(v[4]),project(v[5]),th,bl); r+=drawLine(p,project(v[5]),project(v[0]),th,bl);
            r+=drawLine(p,project(v[6]),project(v[7]),th,bl); r+=drawLine(p,project(v[7]),project(v[8]),th,bl);
            r+=drawLine(p,project(v[8]),project(v[9]),th,bl); r+=drawLine(p,project(v[9]),project(v[10]),th,bl);
            r+=drawLine(p,project(v[10]),project(v[11]),th,bl); r+=drawLine(p,project(v[11]),project(v[6]),th,bl);
            r+=drawLine(p,project(v[0]),project(v[6]),th,bl); r+=drawLine(p,project(v[1]),project(v[7]),th,bl);
            r+=drawLine(p,project(v[2]),project(v[8]),th,bl); r+=drawLine(p,project(v[3]),project(v[9]),th,bl);
            r+=drawLine(p,project(v[4]),project(v[10]),th,bl); r+=drawLine(p,project(v[5]),project(v[11]),th,bl);
        } else {
            float m = sin(u_time*0.5)*0.5+0.5; vec3 c[8], o[6], v[8]; getCube(c); getOcta(o);
            for(int i=0;i<8;i++) {
                if(i<6) v[i]=mix(c[i],o[i]*1.5,m); else v[i]=c[i]*(1.0-m*0.3);
                v[i]=rot*(v[i]*sc);
            }
            float al = 1.0-m*0.5;
            r+=drawLine(p,project(v[0]),project(v[1]),th,bl)*al; r+=drawLine(p,project(v[1]),project(v[2]),th,bl)*al;
            r+=drawLine(p,project(v[2]),project(v[3]),th,bl)*al; r+=drawLine(p,project(v[3]),project(v[0]),th,bl)*al;
            r+=drawLine(p,project(v[4]),project(v[5]),th,bl)*al; r+=drawLine(p,project(v[5]),project(v[6]),th,bl)*al;
            r+=drawLine(p,project(v[6]),project(v[7]),th,bl)*al; r+=drawLine(p,project(v[7]),project(v[4]),th,bl)*al;
            r+=drawLine(p,project(v[0]),project(v[6]),th,bl)*m; r+=drawLine(p,project(v[1]),project(v[7]),th,bl)*m;
            r+=drawLine(p,project(v[2]),project(v[4]),th,bl)*m; r+=drawLine(p,project(v[3]),project(v[5]),th,bl)*m;
        }
        return clamp(r, 0.0, 1.0);
    }
    void main() {
        vec2 st = coord(gl_FragCoord.xy);
        vec2 m = coord(u_mouse * u_pixelRatio) * vec2(1,-1);
        float d = length(st - m);
        float inf = 1.0 - smoothstep(0.0, 0.5, d);
        mat3 rot = rotateY(u_time*0.2 + (m.x)*inf) * rotateX(u_time*0.15 + (m.y)*inf);
        float v = draw(st, u_shape, rot, 0.26, mix(0.002, 0.003, inf), mix(0.0001, 0.05, inf));
        vec3 col = vec3(0.9, 0.95, 1.0) * v * (1.0 - inf*0.3);
        gl_FragColor = vec4(col, smoothstep(0.0, 0.01, length(col)));
    }
  `;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) return;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const unifs = {
      m: gl.getUniformLocation(program, 'u_mouse'),
      r: gl.getUniformLocation(program, 'u_resolution'),
      p: gl.getUniformLocation(program, 'u_pixelRatio'),
      t: gl.getUniformLocation(program, 'u_time'),
      s: gl.getUniformLocation(program, 'u_shape')
    };

    const buffer = (data: Float32Array, name: string, size: number) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const l = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0);
    };

    buffer(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 'a_position', 3);
    buffer(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 'a_uv', 2);

    const resize = () => {
      if (!containerRef.current) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = containerRef.current.clientWidth * dpr;
      canvas.height = containerRef.current.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    let mouse = { x: 0, y: 0 };
    let damp = { x: 0, y: 0 };
    const start = Date.now();

    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    window.addEventListener('mousemove', onMouseMove);

    let requestID: number;
    const loop = () => {
      damp.x += (mouse.x - damp.x) * 0.1;
      damp.y += (mouse.y - damp.y) * 0.1;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(unifs.m, damp.x, damp.y);
      gl.uniform2f(unifs.r, canvas.width, canvas.height);
      gl.uniform1f(unifs.p, Math.min(window.devicePixelRatio, 2));
      gl.uniform1f(unifs.t, (Date.now() - start) / 1000);
      gl.uniform1i(unifs.s, shapeIndex);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestID = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(requestID);
    };
  }, [shapeIndex]);

  const nextShape = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setShapeIndex((prev) => (prev + 1) % shapes.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setShapeIndex((prev) => (prev + 1) % shapes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [shapes.length]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-1 pointer-events-none"
      onClick={nextShape}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export { GeometricMesh };
