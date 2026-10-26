// WebGL 필터: fisheye 왜곡 + 색수차 + 색보정 + 가장자리 페더 + 필름 노이즈
(function () {
  const VERT = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }`;

  const FRAG = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform vec2  u_res, u_vid;
    uniform float u_time, u_mirror;
    uniform float u_fisheye, u_zoom, u_chroma;
    uniform float u_bright, u_contrast, u_sat;
    uniform float u_feather, u_inset, u_round;
    uniform float u_noise, u_grain;
    uniform vec3  u_edge;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    // 화면 좌표(p: 높이 기준 -1..1, x는 aspect 배) → 영상 텍스처 uv
    vec2 toVideo(vec2 p, float aspect) {
      vec2 s = vec2(p.x / aspect, p.y) * 0.5 + 0.5;
      float ca = u_res.x / u_res.y;
      float va = u_vid.x / u_vid.y;
      vec2 v = s - 0.5;
      if (va > ca) v.x *= ca / va; else v.y *= va / ca;   // cover fit
      v += 0.5;
      if (u_mirror > 0.5) v.x = 1.0 - v.x;
      return v;
    }

    bool outside(vec2 v) { return v.x < 0.0 || v.x > 1.0 || v.y < 0.0 || v.y > 1.0; }

    void main() {
      float aspect = u_res.x / u_res.y;
      vec2 p = v_uv * 2.0 - 1.0;
      p.x *= aspect;

      // fisheye: 중심은 확대, 가장자리는 압축 (모서리 고정)
      float maxR = length(vec2(aspect, 1.0));
      float r = length(p);
      float rn = r / maxR;
      float k = u_fisheye;
      float sr = rn * (1.0 - k + k * rn * rn);
      vec2 src = r > 0.0 ? p / r * sr * maxR : p;
      src /= u_zoom;

      // 색수차: 채널별로 방사 방향으로 살짝 어긋나게
      vec2 vr = toVideo(src * (1.0 + u_chroma), aspect);
      vec2 vg = toVideo(src, aspect);
      vec2 vb = toVideo(src * (1.0 - u_chroma), aspect);

      vec3 col;
      if (outside(vg)) {
        col = u_edge;
      } else {
        col = vec3(
          outside(vr) ? u_edge.r : texture2D(u_tex, vr).r,
          texture2D(u_tex, vg).g,
          outside(vb) ? u_edge.b : texture2D(u_tex, vb).b
        );
      }

      // 색보정
      col += u_bright;
      col = (col - 0.5) * u_contrast + 0.5;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum), col, u_sat);

      // 가장자리 페더 (둥근 사각형 ~ 타원)
      vec2 b = vec2(aspect, 1.0);
      float rad = u_round * min(b.x, b.y);
      vec2 q = abs(p) - b + rad;
      float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad; // 안쪽이 음수
      float mask = smoothstep(u_inset, u_inset + u_feather + 1e-4, -d);
      col = mix(u_edge, col, mask);

      // 필름 노이즈
      vec2 cell = floor(gl_FragCoord.xy / u_grain);
      float n = hash(cell + fract(u_time * 7.13) * 917.0);
      col += (n - 0.5) * u_noise;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`;

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  class BoothFilter {
    constructor(canvas) {
      const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw new Error('WebGL을 지원하지 않는 브라우저예요');
      this.gl = gl;
      this.canvas = canvas;

      const prog = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]]) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        gl.attachShader(prog, sh);
      }
      gl.linkProgram(prog);
      gl.useProgram(prog);
      this.prog = prog;

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this.u = {};
      const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const name = gl.getActiveUniform(prog, i).name;
        this.u[name] = gl.getUniformLocation(prog, name);
      }
    }

    render(video, params, time) {
      const { gl, u, canvas } = this;
      if (!video.videoWidth) return false;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);

      gl.uniform2f(u.u_res, canvas.width, canvas.height);
      gl.uniform2f(u.u_vid, video.videoWidth, video.videoHeight);
      gl.uniform1f(u.u_time, time);
      gl.uniform1f(u.u_mirror, params.mirror ? 1 : 0);
      gl.uniform1f(u.u_fisheye, params.fisheye);
      gl.uniform1f(u.u_zoom, params.zoom);
      gl.uniform1f(u.u_chroma, params.chroma);
      gl.uniform1f(u.u_bright, params.brightness);
      gl.uniform1f(u.u_contrast, params.contrast);
      gl.uniform1f(u.u_sat, params.saturation);
      gl.uniform1f(u.u_feather, params.feather);
      gl.uniform1f(u.u_inset, params.inset);
      gl.uniform1f(u.u_round, params.round);
      gl.uniform1f(u.u_noise, params.noise);
      gl.uniform1f(u.u_grain, params.grain);
      gl.uniform3fv(u.u_edge, hexToRgb(params.edgeColor));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return true;
    }
  }

  // 슬라이더 스키마 — 기본값은 여기서 조정
  BoothFilter.PARAMS = [
    { key: 'fisheye',    label: 'Fisheye (−오목 / +볼록)', min: -0.5, max: 1.0, step: 0.01, value: 0.9 },
    { key: 'zoom',       label: '줌',             min: 0.6,  max: 1.6,  step: 0.01,  value: 0.6 },
    { key: 'chroma',     label: '색수차',          min: 0,    max: 0.03, step: 0.001, value: 0.014 },
    { key: 'feather',    label: '페더 폭',         min: 0,    max: 1.0,  step: 0.01,  value: 0.06 },
    { key: 'inset',      label: '페더 안쪽 여백',   min: 0,    max: 0.5,  step: 0.01,  value: 0 },
    { key: 'round',      label: '테두리 둥글기',    min: 0,    max: 1,    step: 0.01,  value: 1 },
    { key: 'noise',      label: '노이즈',          min: 0,    max: 0.5,  step: 0.01,  value: 0.14 },
    { key: 'grain',      label: '노이즈 입자 크기', min: 1,    max: 6,    step: 0.5,   value: 2 },
    { key: 'brightness', label: '밝기',            min: -0.3, max: 0.3,  step: 0.01,  value: 0.02 },
    { key: 'contrast',   label: '대비',            min: 0.5,  max: 1.8,  step: 0.01,  value: 1.08 },
    { key: 'saturation', label: '채도',            min: 0,    max: 1.6,  step: 0.01,  value: 0.85 },
  ];
  BoothFilter.DEFAULTS = Object.assign(
    Object.fromEntries(BoothFilter.PARAMS.map(p => [p.key, p.value])),
    { edgeColor: '#000000', mirror: true }
  );

  // 필터 목록 — 촬영 화면 왼쪽 필터 버튼에서 고름
  BoothFilter.PRESETS = [
    { id: 'fisheye', name: 'Fisheye', fx: { ...BoothFilter.DEFAULTS } },
    { id: 'wide',    name: 'Wide',    fx: { ...BoothFilter.DEFAULTS, fisheye: -0.5, zoom: 1.3, chroma: 0.01 } },
  ];

  window.BoothFilter = BoothFilter;
})();
