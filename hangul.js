// 화면 내 한/영 전환 입력기
// 기본은 영문. 'A/가' 버튼으로 한글 모드로 바꾸면 영문 자판 입력을 두벌식 한글로 조합해 넣음.
// (맥 입력 소스가 이미 한글이면 OS가 조합한 글자를 그대로 받음)
(function () {
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ',
                'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const VCOMB = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ' };
  const TCOMB = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
                  'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ' };
  const KEYS = {
    q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
    a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
    z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
    Q: 'ㅃ', W: 'ㅉ', E: 'ㄸ', R: 'ㄲ', T: 'ㅆ', O: 'ㅒ', P: 'ㅖ',
  };
  const isV = c => JUNG.includes(c);
  const isC = c => CHO.includes(c) || JONG.includes(c);

  // 자모 배열 → 완성형 문자열
  function assemble(j) {
    let out = '', i = 0;
    while (i < j.length) {
      const c = j[i];
      if (CHO.includes(c) && isV(j[i + 1])) {
        let v = j[i + 1];
        i += 2;
        if (VCOMB[v + j[i]]) { v = VCOMB[v + j[i]]; i++; }
        let t = '';
        if (j[i] && JONG.includes(j[i]) && !isV(j[i + 1])) {
          t = j[i]; i++;
          if (j[i] && TCOMB[t + j[i]] && !isV(j[i + 1])) { t = TCOMB[t + j[i]]; i++; }
        }
        out += String.fromCharCode(0xAC00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28 + JONG.indexOf(t));
      } else if (isV(c) && VCOMB[c + j[i + 1]]) {
        out += VCOMB[c + j[i + 1]]; i += 2;
      } else {
        out += c; i++;
      }
    }
    return out;
  }

  function attach(input, toggle, onChange) {
    let mode = 'en', prefix = '', buf = [], rendering = false;
    const notify = () => onChange && onChange(input.value);
    const render = () => {
      rendering = true;
      input.value = prefix + assemble(buf);
      const end = input.value.length;
      input.setSelectionRange(end, end);
      rendering = false;
      notify();
    };
    const commit = () => { prefix = input.value; buf = []; };
    const setMode = m => {
      commit();
      mode = m;
      toggle.textContent = m === 'en' ? 'A' : '가';
      toggle.setAttribute('aria-label', m === 'en' ? '영문 입력 중 (한글로 전환)' : '한글 입력 중 (영문으로 전환)');
    };

    toggle.addEventListener('pointerdown', e => e.preventDefault()); // 입력창 포커스 유지
    toggle.addEventListener('click', () => { setMode(mode === 'en' ? 'ko' : 'en'); input.focus(); });

    input.addEventListener('keydown', e => {
      if (mode !== 'ko' || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length === 1 && KEYS[e.key] !== undefined || /^[A-Z]$/.test(e.key)) {
        if (input.value.length >= input.maxLength && input.maxLength > 0 && !buf.length) return;
        e.preventDefault();
        buf.push(KEYS[e.key] || KEYS[e.key.toLowerCase()]);
        render();
      } else if (e.key === 'Backspace' && buf.length) {
        e.preventDefault();
        buf.pop();
        render();
      } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        commit();
      }
    });
    input.addEventListener('input', () => { if (!rendering) { commit(); notify(); } });
    // 커서는 항상 끝에 (조합 중인 글자가 엉키지 않게)
    const toEnd = () => { const end = input.value.length; input.setSelectionRange(end, end); };
    input.addEventListener('click', toEnd);
    input.addEventListener('focus', () => setTimeout(toEnd, 0));

    return {
      reset() { input.value = ''; setMode('en'); notify(); },
      commit,
    };
  }

  window.HangulInput = { attach, assemble };
})();
