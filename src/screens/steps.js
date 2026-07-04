import { ORDER_AREAS, STATUS_LABEL } from '../config.js';

const doneCheck = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5 9-11" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Single source of truth for deriving an order's status from its order_steps.
export function orderProgress(order) {
  const all = order.order_steps || [];
  const areas = ORDER_AREAS.map((a) => {
    const steps = all
      .filter((s) => (s.area || 'received') === a.key)
      .sort((x, y) => x.sort - y.sort);
    const done = steps.filter((s) => s.done).length;
    return {
      ...a,
      steps,
      done,
      total: steps.length,
      complete: steps.length > 0 && done === steps.length,
    };
  });
  const current = areas.find((a) => !a.complete);
  const key = current ? current.key : 'done';
  return {
    areas,
    currentKey: key,
    label: STATUS_LABEL[key],
    done: all.filter((s) => s.done).length,
    total: all.length,
  };
}

// Per-item progress: linear sequence, not area-grouped.
export function itemProgress(item) {
  const steps = (item.order_item_steps || [])
    .slice()
    .sort((x, y) => x.sort - y.sort);
  const current = steps.find((s) => !s.done) || null;
  const complete = steps.length > 0 && steps.every((s) => s.done);
  const done = steps.filter((s) => s.done).length;
  return {
    steps,
    current,
    currentLabel: complete ? 'مكتمل' : current?.label || '—',
    done,
    total: steps.length,
    complete,
  };
}

// Compact linear dot timeline for one item (reuses order timeline styling).
export function itemStepsHtml(item, big = false) {
  const { steps, current, complete } = itemProgress(item);
  if (!steps.length) return '';
  const sz = big ? 22 : 18;
  return steps.map((s, i) => {
    const done = s.done;
    const isCurrent = !done && s.id === current?.id;
    const last = i === steps.length - 1;
    const dotBg = done ? '#1B695E' : '#fff';
    const dotBorder = done || isCurrent ? '#1B695E' : '#d9cdb9';
    const lineColor = done ? '#1B695E' : '#e7ddce';
    const check = done ? doneCheck(big ? 12 : 10) : '';
    return `<div style="display:flex; gap:10px; align-items:flex-start;">
      <div style="display:flex; flex-direction:column; align-items:center; align-self:stretch;">
        <div style="width:${sz}px; height:${sz}px; border-radius:50%; background:${dotBg}; border:2px solid ${dotBorder}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${check}</div>
        ${last ? '' : `<div style="width:2px; flex:1; min-height:${sz}px; background:${lineColor};"></div>`}
      </div>
      <div style="padding-bottom:${big ? 16 : 14}px; flex:1;">
        <div style="font-size:${big ? 13.5 : 12.5}px; font-weight:${isCurrent ? 800 : done ? 700 : 500}; color:${done ? '#243b37' : isCurrent ? '#1B695E' : '#a99e8e'};">${s.label}</div>
        ${s.note && big ? `<div style="font-size:11.5px; color:#a99e8e; margin-top:1px;">${s.note}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

// Customer timeline: one node per ORDER_AREAS entry. Sub-steps stay admin-only.
export function stepsHtml(order, big = false) {
  const { areas } = orderProgress(order);
  const firstNotDone = areas.findIndex((a) => !a.complete);
  const sz = big ? 24 : 22;
  return areas.map((a, i) => {
    const done = a.complete;
    const current = i === firstNotDone;
    const last = i === areas.length - 1;
    const dotBg = done ? '#1B695E' : '#fff';
    const dotBorder = done || current ? '#1B695E' : '#d9cdb9';
    const lineColor = done ? '#1B695E' : '#e7ddce';
    const check = done ? doneCheck(big ? 12 : 11) : '';
    return `<div style="display:flex; gap:11px; align-items:flex-start;">
      <div style="display:flex; flex-direction:column; align-items:center; align-self:stretch;">
        <div style="width:${sz}px; height:${sz}px; border-radius:50%; background:${dotBg}; border:2px solid ${dotBorder}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${check}</div>
        ${last ? '' : `<div style="width:2px; flex:1; min-height:${sz}px; background:${lineColor};"></div>`}
      </div>
      <div style="padding-bottom:${big ? 18 : 16}px; flex:1;">
        <div style="font-size:${big ? 14.5 : 14}px; font-weight:${current ? 800 : done ? 700 : 500}; color:${done ? '#243b37' : '#a99e8e'};">${a.label}</div>
        <div style="font-size:12px; color:#a99e8e; margin-top:1px;">${a.note || ''}</div>
      </div>
    </div>`;
  }).join('');
}
