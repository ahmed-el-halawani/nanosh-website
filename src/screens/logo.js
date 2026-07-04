// Static logo. Drop the real logo at public/logo.png; until then the wordmark shows.
export const logoBox = (size, radius) => `
  <div style="width:${size}px; height:${size}px; border-radius:${radius}px; background:#fff; border:1px solid #efe6d8; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; box-shadow:0 2px 6px rgba(60,40,20,.10);">
    <img src="/logo.png" alt="نانوش" style="width:100%; height:100%; object-fit:cover;"
      onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'ن',style:'font-family:Amiri,serif;font-weight:700;color:#1B695E;font-size:${Math.round(size*0.42)}px;line-height:1;'}))">
  </div>`;
