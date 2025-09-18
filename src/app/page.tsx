
"use client";
import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  useEffect(() => {
    /* ===== Utilidades ===== */
    const $ = (s: string): HTMLElement | null => document.querySelector(s);
    const $$ = (s: string): NodeListOf<HTMLElement> => document.querySelectorAll(s);
    const fmtCOP = (v: number, dec: number = 2) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: +dec, maximumFractionDigits: +dec }).format((+v) || 0);
    const cleanHeader = (h: string) => String(h || '').normalize("NFD").replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const todayISO = () => new Date().toISOString().slice(0, 10);

    function numeroALetras(num: number): string {
      const U = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte"];
      const D = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
      const C = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
      function s(n: number): string { if (n === 0) return ""; if (n <= 20) return U[n]; if (n < 100) return D[Math.floor(n / 10)] + (n % 10 ? " y " + U[n % 10] : ""); if (n === 100) return "cien"; return C[Math.floor(n / 100)] + (n % 100 ? " " + s(n % 100) : ""); }
      function m(n: number): string { if (n < 1000) return s(n); if (n < 2000) return "mil " + s(n % 1000); return s(Math.floor(n / 1000)) + " mil " + s(n % 1000); }
      function mm(n: number): string { if (n < 1e6) return m(n); if (n < 2e6) return "un millón " + m(n % 1e6); return m(Math.floor(n / 1e6)) + " millones " + m(n % 1e6); }
      const e = Math.floor(Math.abs(num)); const c = Math.round((Math.abs(num) - e) * 100);
      return (num < 0 ? "menos " : "") + (e === 0 ? "cero" : mm(e)).trim() + ` pesos con ${c.toString().padStart(2, "0")} centavos`;
    }

    /* Fechas por defecto */
    ($('#fecEmision') as HTMLInputElement).value = todayISO();
    let plus15 = new Date(); plus15.setDate(plus15.getDate() + 15);
    ($('#fecValidez') as HTMLInputElement).value = plus15.toISOString().slice(0, 10);

    /* Header */
    function syncHeader() {
      ($('#outEmisorNombre') as HTMLElement).textContent = ($('#emisorNombre') as HTMLInputElement).value || '—';
      ($('#outEmisorLinea1') as HTMLElement).textContent = `NIT: ${($('#emisorNIT') as HTMLInputElement).value || '—'} • ${($('#emisorRegimen') as HTMLInputElement).value || '—'}`;
      ($('#outEmisorLinea2') as HTMLElement).textContent = ($('#emisorDir') as HTMLInputElement).value || '';
      ($('#outEmisorLinea3') as HTMLElement).textContent = ($('#emisorTel') as HTMLInputElement).value || '';
      ($('#outEmisorLinea4') as HTMLElement).textContent = ($('#emisorEmail') as HTMLInputElement).value || '';
      ($('#outCotzNum') as HTMLElement).textContent = ($('#cotzNum') as HTMLInputElement).value || '—';
      ($('#outMoneda') as HTMLElement).textContent = ($('#moneda') as HTMLSelectElement).value || 'COP';
      ($('#outFecEmision') as HTMLElement).textContent = ($('#fecEmision') as HTMLInputElement).value || '—';
      ($('#outFecValidez') as HTMLElement).textContent = ($('#fecValidez') as HTMLInputElement).value || '—';
      ($('#outNotas') as HTMLElement).textContent = ($('#notas') as HTMLInputElement).value || '—';
      ($('#sigName') as HTMLElement).textContent = ($('#autoriza') as HTMLInputElement).value || '—';
      ($('#outCliNombre') as HTMLElement).innerHTML = `<b>${($('#cliNombre') as HTMLInputElement).value || '—'}</b>`;
      ($('#outCliNIT') as HTMLElement).textContent = `NIT/CC: ${($('#cliNIT') as HTMLInputElement).value || '—'}`;
      ($('#outCliDir') as HTMLElement).textContent = `Dirección: ${($('#cliDir') as HTMLInputElement).value || '—'}`;
      ($('#outCliTel') as HTMLElement).innerHTML = `Tel: ${($('#cliTel') as HTMLInputElement).value || '—'} • <span id="outCliEmail">Email: ${($('#cliEmail') as HTMLInputElement).value || '—'}</span>`;
    }
    ['input', 'change'].forEach(ev => {
      $$('.toolbar input, .toolbar select').forEach(el => el.addEventListener(ev, syncHeader));
    });
    syncHeader();

    /* Logo */
    const logoInput = $('#logoFile') as HTMLInputElement;
    const logoImg = $('#logoImg') as HTMLImageElement;
    logoInput.addEventListener('change', () => {
      const f = logoInput.files?.[0]; if (!f) return;
      const r = new FileReader(); r.onload = e => { logoImg.src = e.target?.result as string; logoImg.style.display = 'block'; }; r.readAsDataURL(f);
    });
    $('#clearLogo')?.addEventListener('click', () => { logoInput.value = ''; logoImg.src = ''; logoImg.style.display = 'none'; });

    /* Datos */
    let rows: any[] = [];
    const usedCodes = new Set();
    function genCode() {
      let c; do { c = 'ITM-' + Math.random().toString(36).slice(2, 7).toUpperCase(); } while (usedCodes.has(c));
      usedCodes.add(c); return c;
    }

    function parseSheetToRows(ws: any) {
      const XLSX = (window as any).XLSX;
      const data = XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });
      const mapped = [];
      for (const r of data) {
        const map: {[key: string]: any} = {}; for (const k in r) { map[cleanHeader(k)] = (r as any)[k]; }

        const codigo = map.codigo ?? map.cod ?? map.referencia ?? "";
        const descripcion = map.descripcion ?? map.descripcion_ ?? map['descripción'] ?? map.detalle ?? map.producto ?? "";
        const unidad = map.unidad ?? map.u_medida ?? map.um ?? "UND";
        const cantidad = Number(String(map.cantidad ?? map.cant ?? 1).toString().replace(',', '.')) || 1;
        const precio = Number(String(map.valor_unitario ?? map.valorunitario ?? map.precio_unitario ?? map.preciounitario ?? map.precio ?? map.valor ?? 0).toString().replace(',', '.')) || 0;
        const iva = Number(String(map.iva ?? '').toString().replace(',', '.'));
        const dcto = Number(String(map.descuento ?? map.dcto ?? 0).toString().replace(',', '.')) || 0;

        if (!descripcion && !codigo) continue;
        mapped.push({ codigo, descripcion, unidad, cantidad, precio, iva: isNaN(iva) ? null : iva, dcto });
      }
      return mapped;
    }

    function render() {
      const dec = +($('#dec') as HTMLSelectElement).value || 2;
      const tbody = $('#tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      let subtotal = 0, totalIVA = 0, totalDcto = 0, totalSumaColumna = 0;

      const extraerIVA = ($('#ivaIncluido') as HTMLInputElement).checked;

      rows.forEach((r, i) => {
        const ivaPct = Number.isFinite(r.iva) ? r.iva : (Number(($('#defaultIva') as HTMLSelectElement).value) || 0);
        const base = r.cantidad * r.precio;
        const dctoVal = base * ((r.dcto || 0) / 100);
        const bruto = base - dctoVal;

        let ivaVal, totalFila, netoSinIVA;

        if (extraerIVA) {
          ivaVal = bruto * (ivaPct / (100 + ivaPct));
          netoSinIVA = bruto - ivaVal;
          totalFila = netoSinIVA;
        } else {
          ivaVal = bruto * (ivaPct / 100);
          netoSinIVA = bruto;
          totalFila = netoSinIVA;
        }

        subtotal += netoSinIVA;
        totalIVA += ivaVal;
        totalDcto += dctoVal;
        totalSumaColumna += totalFila;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="num">${i + 1}</td>
          <td>${escapeHtml(r.codigo || '')}</td>
          <td>${escapeHtml(r.descripcion || '')}</td>
          <td>${escapeHtml(r.unidad || '')}</td>
          <td class="num">${fmtNum(r.cantidad, 0)}</td>
          <td class="num">${fmtCOP(r.precio, dec)}</td>
          <td class="num">
            <input class="cell iva-input" type="number" min="0" max="100" step="1" data-i="${i}" value="${Number.isFinite(r.iva) ? r.iva : (Number(($('#defaultIva') as HTMLSelectElement).value) || 0)}">%
          </td>
          <td class="num">${fmtNum(r.dcto || 0, 0)}%</td>
          <td class="num">${fmtCOP(ivaVal, dec)}</td>
          <td class="num">${fmtCOP(totalFila, dec)}</td>
        `;
        tbody.appendChild(tr);
      });

      ($('#rowsCount') as HTMLElement).textContent = `${rows.length} ítems`;
      ($('#tSubtotal') as HTMLElement).textContent = fmtCOP(subtotal, dec);
      ($('#tIva') as HTMLElement).textContent = fmtCOP(totalIVA, dec);
      ($('#tDesc') as HTMLElement).textContent = fmtCOP(totalDcto, dec);

      const total = totalSumaColumna;
      ($('#tTotal') as HTMLElement).textContent = fmtCOP(total, dec);
      ($('#sonLetras') as HTMLElement).textContent = "SON: " + numeroALetras(total).toUpperCase();
    }

    function fmtNum(n: number, d: number = 0) { return new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }).format((+n) || 0); }
    function escapeHtml(s: string) { return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" } as any)[m]) }

    /* Eventos tabla y opciones */
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('iva-input')) {
        const i = +(target.dataset.i || 0);
        rows[i].iva = Number(target.value) || 0;
        render();
      }
    });
    $('#ivaIncluido')?.addEventListener('change', render);

    /* Botones */
    $('#loadBtn')?.addEventListener('click', async () => {
      const XLSX = (window as any).XLSX;
      const file = ($('#file') as HTMLInputElement).files?.[0]; if (!file) { alert('Selecciona un archivo .xlsx/.xls'); return; }
      usedCodes.clear();
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = parseSheetToRows(ws).map((r: any) => {
        if (!r.codigo || String(r.codigo).trim() === '') { r.codigo = genCode(); }
        if (!Number.isFinite(r.iva)) { r.iva = Number(($('#defaultIva') as HTMLSelectElement).value) || 0; }
        return r;
      });
      render(); syncHeader();
    });

    $('#clearBtn')?.addEventListener('click', () => { rows = []; usedCodes.clear(); render(); });

    $('#applyIvaBtn')?.addEventListener('click', () => {
      const val = Number(($('#defaultIva') as HTMLSelectElement).value) || 0;
      rows = rows.map(r => ({ ...r, iva: val }));
      render();
    });

    $('#zeroIvaBtn')?.addEventListener('click', () => {
      rows = rows.map(r => ({ ...r, iva: 0 }));
      render();
    });

    $('.printbar .btn.primary')?.addEventListener('click', () => window.print());
    $('.printbar .btn:not(.primary)')?.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));


    /* Inicial */
    render();
  }, []);

  return (
    <>
      <Head>
        <title>Cotización – Generador desde Excel</title>
        <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" defer></script>
      </Head>
      <style jsx global>{`
        :root{ --primary:#f04a64; --ink:#1c1d21; --muted:#6b7280; --border:#e5e7eb; }
        *{box-sizing:border-box}
        body{font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;color:var(--ink);margin:0;background:#fafafa}
        .wrap{max-width:1100px;margin:28px auto;padding:0 16px}
        .toolbar{background:#fff;border:1px solid var(--border);padding:14px;border-radius:12px;display:grid;gap:12px;grid-template-columns:1fr 1fr;align-items:end}
        .toolbar .row{display:flex;gap:12px;flex-wrap:wrap}
        .toolbar label{font-size:12px;color:var(--muted)}
        .toolbar input,.toolbar select{border:1px solid var(--border);border-radius:10px;padding:10px 12px;width:100%;background:#fff}
        .toolbar .btn{background:var(--ink);color:#fff;border:none;padding:10px 14px;border-radius:10px;cursor:pointer;font-weight:600}
        .toolbar .btn.secondary{background:#fff;color:var(--ink);border:1px solid var(--border)}
        .toolbar .btn.accent{background:var(--primary);color:#fff;border:1px solid var(--primary)}
        .toolbar h2{margin:0 0 6px 0;font-size:18px}
        .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}

        .sheet{margin-top:20px;background:#fff;border:1px solid var(--border);border-radius:12px;padding:28px}
        .head{display:grid;grid-template-columns:2.2fr 1.1fr;gap:24px;align-items:start;border-bottom:2px solid var(--border);padding-bottom:14px}
        .brand h1{font-size:20px;margin:0 0 6px 0}
        .brand-top{display:flex;align-items:center;gap:16px}
        .logoBox{width:96px;height:96px;border:1px dashed var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff}
        .logoBox img{max-width:100%;max-height:100%;display:block}
        .box{border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:13px}
        .title-row{display:flex;justify-content:space-between;align-items:center;margin-top:14px}
        .info-2col{display:grid;grid-template-columns:1.4fr 1fr;gap:18px;margin-top:12px}
        .tbl{margin-top:14px;width:100%;border-collapse:collapse;font-size:13px}
        .tbl th,.tbl td{border-bottom:1px solid var(--border);padding:8px 6px;vertical-align:top}
        .tbl th{text-align:left;color:var(--muted);font-weight:600;border-top:1px solid var(--border);background:#fafafa}
        .tbl td.num,.tbl th.num{text-align:right;white-space:nowrap}
        .tbl input.cell{width:64px;text-align:right;padding:4px 6px;border:1px solid var(--border);border-radius:8px;font:inherit}
        .totals{margin-top:10px;display:flex;justify-content:flex-end}
        .totals table{border-collapse:collapse;font-size:13px}
        .totals td{padding:6px 10px}
        .totals tr td:first-child{color:var(--muted)}
        .totals tr:last-child td{border-top:2px solid var(--ink);font-weight:800}
        .notes{margin-top:12px;border:1px dashed var(--border);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--muted)}
        .sign{margin-top:40px;display:flex;gap:40px;align-items:center}
        .sigline{border-top:1px solid var(--ink);width:300px;padding-top:6px;text-align:center}
        .brandmark{margin-top:6px;font-weight:700;color:var(--primary);font-size:12px}
        .chip{display:inline-block;padding:2px 8px;border:1px solid var(--border);border-radius:999px;font-size:12px;color:var(--muted)}
        .right{text-align:right}
        .printbar{margin-top:12px;display:flex;gap:8px;justify-content:flex-end}
        .printbar .btn{padding:10px 14px;border-radius:10px;border:1px solid var(--border);background:#fff;cursor:pointer}
        .printbar .btn.primary{background:var(--ink);color:#fff;border-color:var(--ink)}
        @media print{ body{background:#fff} .toolbar,.printbar{display:none !important} .sheet{border:none;border-radius:0;padding:0} .wrap{max-width:100%;margin:0;padding:0 18mm} }
      `}</style>
      <div className="wrap">

        <div className="toolbar">
          <div>
            <h2>1) Cargar Excel</h2>
            <div className="row">
              <input id="file" type="file" accept=".xlsx,.xls" />
              <button className="btn" id="loadBtn">Leer archivo</button>
            </div>
            <div className="row">
              <small className="muted">Encabezados: <b>codigo</b>, <b>descripcion</b>, <b>unidad</b>, <b>cantidad</b>, <b>valor unitario</b>/<b>precio_unitario</b>, <b>iva</b>, <b>descuento</b>.</small>
            </div>
          </div>

          <div>
            <h2>2) Opciones</h2>
            <div className="grid-3">
              <div>
                <label>Moneda</label>
                <select id="moneda"><option value="COP">COP (Colombia)</option></select>
              </div>
              <div>
                <label>Decimales</label>
                <select id="dec"><option value="2">2</option><option value="0">0</option></select>
              </div>
              <div>
                <label>IVA predeterminado</label>
                <select id="defaultIva">
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="19">19%</option>
                </select>
              </div>
            </div>

            <div className="row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="ivaIncluido" />
                <span className="muted">Precios incluyen IVA (restar IVA en TOTAL)</span>
              </label>
            </div>

            <div className="row">
              <button className="btn accent" id="applyIvaBtn">Ejecutar IVA</button>
              <button className="btn secondary" id="zeroIvaBtn">IVA 0% a todo</button>
              <button className="btn secondary" id="clearBtn">Limpiar tabla</button>
            </div>
          </div>

          <div>
            <h2>Logo de la Empresa</h2>
            <div className="row">
              <input id="logoFile" type="file" accept="image/*" />
              <button className="btn secondary" id="clearLogo">Quitar logo</button>
            </div>
            <small className="muted">PNG/JPG/SVG</small>
          </div>

          <div>
            <h2>Datos del Emisor</h2>
            <div className="grid-3">
              <div><label>Empresa</label><input id="emisorNombre" defaultValue="Distribuidora Miladys Solano" /></div>
              <div><label>NIT</label><input id="emisorNIT" defaultValue="-" /></div>
              <div><label>Régimen</label><input id="emisorRegimen" defaultValue="Persona Jurídica" /></div>
            </div>
            <div className="grid-3" style={{ marginTop: '8px' }}>
              <div><label>Dirección</label><input id="emisorDir" defaultValue="" /></div>
              <div><label>Teléfono</label><input id="emisorTel" defaultValue="" /></div>
              <div><label>Email</label><input id="emisorEmail" defaultValue="" /></div>
            </div>
          </div>

          <div>
            <h2>Datos de la Cotización</h2>
            <div className="grid-3">
              <div><label># Cotización</label><input id="cotzNum" defaultValue="COTZ-001" /></div>
              <div><label>Fecha de Emisión</label><input id="fecEmision" type="date" /></div>
              <div><label>Válida Hasta</label><input id="fecValidez" type="date" /></div>
            </div>
            <div className="grid-2" style={{ marginTop: '8px' }}>
              <div><label>Notas</label><input id="notas" placeholder="Condiciones, tiempos de entrega..." /></div>
              <div><label>Autorizado por</label><input id="autoriza" defaultValue="Distribuidora Miladys Solano" /></div>
            </div>
          </div>

          <div>
            <h2>Datos del Cliente</h2>
            <div className="grid-3">
              <div><label>Cliente</label><input id="cliNombre" /></div>
              <div><label>NIT/CC</label><input id="cliNIT" /></div>
              <div><label>Teléfono</label><input id="cliTel" /></div>
            </div>
            <div className="grid-2" style={{ marginTop: '8px' }}>
              <div><label>Dirección</label><input id="cliDir" /></div>
              <div><label>Email</label><input id="cliEmail" /></div>
            </div>
          </div>
        </div>

        <div className="sheet" id="sheet">
          <div className="head">
            <div className="brand">
              <div className="brand-top">
                <div className="logoBox"><img id="logoImg" alt="Logo" style={{ display: 'none' }} /></div>
                <div>
                  <h1 id="outEmisorNombre">Distribuidora Miladys Solano</h1>
                  <div className="muted" id="outEmisorLinea1">NIT: — • Persona Jurídica</div>
                  <div className="muted" id="outEmisorLinea2"></div>
                  <div className="muted" id="outEmisorLinea3"></div>
                  <div className="muted" id="outEmisorLinea4"></div>
                </div>
              </div>
            </div>
            <div className="box">
              <div><b>COTIZACIÓN:</b> <span id="outCotzNum">COTZ-001</span></div>
              <div><b>MONEDA:</b> <span id="outMoneda">COP</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <div className="box" style={{ padding: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>FECHA DE EMISIÓN</div>
                  <div id="outFecEmision" style={{ fontWeight: 700 }}>—</div>
                </div>
                <div className="box" style={{ padding: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>VÁLIDO HASTA</div>
                  <div id="outFecValidez" style={{ fontWeight: 700 }}>—</div>
                </div>
              </div>
            </div>
          </div>

          <div className="title-row">
            <div className="left"><h3>Cliente</h3></div>
            <div className="right"><span className="chip" id="rowsCount">0 ítems</span></div>
          </div>

          <div className="info-2col">
            <div className="box">
              <div id="outCliNombre"><b>—</b></div>
              <div className="muted" id="outCliNIT">NIT/CC: —</div>
              <div className="muted" id="outCliDir">Dirección: —</div>
              <div className="muted" id="outCliTel">Tel: — • <span id="outCliEmail">Email: —</span></div>
            </div>
            <div className="box">
              <div className="muted">Notas</div>
              <div id="outNotas">—</div>
            </div>
          </div>

          <table className="tbl" id="tbl">
            <thead>
              <tr>
                <th className="num" style={{ width: '40px' }}>#</th>
                <th style={{ width: '120px' }}>CÓDIGO</th>
                <th>DESCRIPCIÓN</th>
                <th style={{ width: '90px' }}>U. MEDIDA</th>
                <th className="num" style={{ width: '80px' }}>CANTIDAD</th>
                <th className="num" style={{ width: '110px' }}>VALOR UNITARIO</th>
                <th className="num" style={{ width: '70px' }}>IVA</th>
                <th className="num" style={{ width: '80px' }}>DCTO.</th>
                <th className="num" style={{ width: '110px' }}>VALOR IVA</th>
                <th className="num" style={{ width: '120px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody id="tbody"></tbody>
          </table>

          <div className="totals">
            <table>
              <tbody>
                <tr><td>Subtotal:</td><td className="num" id="tSubtotal">$ 0</td></tr>
                <tr><td>IVA:</td><td className="num" id="tIva">$ 0</td></tr>
                <tr><td>Descuento aplicado:</td><td className="num" id="tDesc">$ 0</td></tr>
                <tr><td><b>Total:</b></td><td className="num" id="tTotal">$ 0</td></tr>
              </tbody>
            </table>
          </div>

          <div className="notes" id="sonLetras">SON: —</div>

          <div className="sign">
            <div className="sigline" id="sigName">Distribuidora Miladys Solano</div>
            <div className="brandmark">Autorización</div>
          </div>
        </div>

        <div className="printbar">
          <button className="btn">↑ Subir</button>
          <button className="btn primary">Imprimir / Guardar PDF</button>
        </div>
      </div>
    </>
  );
}

    