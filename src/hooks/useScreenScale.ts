import { useState, useEffect, useCallback } from 'react';

const REF_W = 393; // iPhone 14 Pro width
const REF_H = 852; // iPhone 14 Pro height

export function useScreenScale() {
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const sw = dims.w / REF_W; // 0.954–1.120
  const sh = dims.h / REF_H; // 0.953–1.122

  // Scale by width (most common)
  const s = useCallback((px: number) => Math.round(px * sw), [sw]);
  // Scale by height (for vertical spacing)
  const vs = useCallback((px: number) => Math.round(px * sh), [sh]);

  return { s, vs, sw, sh, width: dims.w, height: dims.h };
}
