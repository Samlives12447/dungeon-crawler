import { useState, useMemo, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

// ─── Config ───────────────────────────────────────────────────────────────────
const COMPANY   = "Infinity Foods Wholesale";
const VAT       = 0.20;
const FONT      = "'Segoe UI', system-ui, sans-serif";

const COLORS = {
  green:   "#2d7a3a",
  greenL:  "#3a9b4a",
  greenBg: "#f0f7f1",
  white:   "#ffffff",
  bg:      "#f4f6f4",
  border:  "#d0dbd1",
  text:    "#1a2b1c",
  muted:   "#5a7060",
  yellow:  "#f59e0b",
  red:     "#dc2626",
  blue:    "#2563eb",
  card:    "#ffffff",
  hdr:     "#1e4d27",
};

const INIT_TIERS = [
  { id:1, name:"Retail",      margin:30, color:"#2563eb" },
  { id:2, name:"Trade",       margin:22, color:"#16a34a" },
  { id:3, name:"Wholesale",   margin:15, color:"#d97706" },
  { id:4, name:"Bulk/Direct", margin:8,  color:"#dc2626" },
];

const CURRENCIES = [
  { code:"GBP", symbol:"£", rate:1    },
  { code:"USD", symbol:"$", rate:1.27 },
  { code:"EUR", symbol:"€", rate:1.17 },
];

const INIT_SUPPLIERS = [
  { id:1, name:"AgriTrade Ltd",    contact:"John Mills",  email:"jmills@agritrade.co.uk",  phone:"01234 567890", notes:"Primary grain supplier"  },
  { id:2, name:"Northern Grains",  contact:"Sarah Booth", email:"sarah@northerngrains.com",phone:"01298 443210", notes:"Oats & maize specialist"  },
  { id:3, name:"PressedOils UK",   contact:"Tom Ashby",   email:"tom@pressedoils.co.uk",   phone:"01509 778800", notes:"Bulk oil supplier"        },
  { id:4, name:"GlobalFeed Co",    contact:"Priya Shah",  email:"priya@globalfeed.com",    phone:"02071 234567", notes:"Soy & feed ingredients"   },
  { id:5, name:"Allied Bakeries",  contact:"Dave Kerr",   email:"d.kerr@allied.co.uk",     phone:"01215 990011", notes:"Branded flour & baked"    },
  { id:6, name:"KTC Edibles",      contact:"Raj Patel",   email:"raj@ktcedibles.com",      phone:"01215 551234", notes:"Oils & ghee"              },
];

const INIT_PRODUCTS = [
  { id:1,  sku:"BLK-WHT-001", name:"Milling Wheat",               category:"Bulk Grain",    type:"bulk",    unit:"per tonne",         costPrice:210.00, minMargin:8,  inStock:true,  supplierId:1, notes:"Grade 1, 13%+ protein",     history:[] },
  { id:2,  sku:"BLK-BAR-001", name:"Malting Barley",              category:"Bulk Grain",    type:"bulk",    unit:"per tonne",         costPrice:195.00, minMargin:8,  inStock:true,  supplierId:1, notes:"Spring variety, low nitrogen",history:[] },
  { id:3,  sku:"BLK-OAT-001", name:"Feed Oats",                   category:"Bulk Grain",    type:"bulk",    unit:"per tonne",         costPrice:168.00, minMargin:8,  inStock:true,  supplierId:2, notes:"Clean sample",               history:[] },
  { id:4,  sku:"BLK-MZE-001", name:"Maize (Corn)",                category:"Bulk Grain",    type:"bulk",    unit:"per tonne",         costPrice:188.00, minMargin:8,  inStock:true,  supplierId:2, notes:"Feed grade, 14% moisture max",history:[] },
  { id:5,  sku:"BLK-RPS-001", name:"Rapeseed Oil",                category:"Bulk Oil",      type:"bulk",    unit:"per tonne",         costPrice:890.00, minMargin:6,  inStock:true,  supplierId:3, notes:"Cold-pressed, food grade",    history:[] },
  { id:6,  sku:"BLK-SFO-001", name:"Sunflower Oil",               category:"Bulk Oil",      type:"bulk",    unit:"per tonne",         costPrice:950.00, minMargin:6,  inStock:false, supplierId:3, notes:"Refined, EU origin",          history:[] },
  { id:7,  sku:"BLK-SYB-001", name:"Soybean Meal",                category:"Bulk Feed",     type:"bulk",    unit:"per tonne",         costPrice:385.00, minMargin:8,  inStock:true,  supplierId:4, notes:"Hi-pro 48% protein",          history:[] },
  { id:8,  sku:"BRD-FLR-001", name:"Allinson Strong White Flour", category:"Branded Flour", type:"branded", unit:"per 16kg case",     costPrice:18.40,  minMargin:18, inStock:true,  supplierId:5, notes:"16 x 1kg bags",              history:[] },
  { id:9,  sku:"BRD-FLR-002", name:"Doves Farm Organic Flour",    category:"Branded Flour", type:"branded", unit:"per 5kg bag",       costPrice:6.20,   minMargin:20, inStock:true,  supplierId:5, notes:"Organic certified",           history:[] },
  { id:10, sku:"BRD-OIL-001", name:"Filippo Berio EV Olive Oil",  category:"Branded Oil",   type:"branded", unit:"per 6-bottle case", costPrice:42.00,  minMargin:22, inStock:true,  supplierId:6, notes:"6 x 1L bottles",             history:[] },
  { id:11, sku:"BRD-OIL-002", name:"Crisp'n Dry Vegetable Oil",   category:"Branded Oil",   type:"branded", unit:"per 6-bottle case", costPrice:19.80,  minMargin:16, inStock:true,  supplierId:6, notes:"6 x 2L bottles",             history:[] },
  { id:12, sku:"BRD-SGR-001", name:"Silver Spoon Granulated Sugar",category:"Branded Sugar", type:"branded", unit:"per 10kg bag",      costPrice:9.60,   minMargin:14, inStock:false, supplierId:1, notes:"Catering size",              history:[] },
  { id:13, sku:"BRD-RCE-001", name:"Tilda Pure Basmati Rice",     category:"Branded Rice",  type:"branded", unit:"per 5kg bag",       costPrice:11.20,  minMargin:20, inStock:true,  supplierId:5, notes:"Aged basmati, premium",       history:[] },
  { id:14, sku:"BRD-PST-001", name:"De Cecco Spaghetti No.12",    category:"Branded Pasta", type:"branded", unit:"per 12-pack case",  costPrice:14.40,  minMargin:18, inStock:true,  supplierId:5, notes:"12 x 500g packs",            history:[] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sellPrice = (cost, margin) => cost / (1 - margin / 100);
const withVat   = (price)        => price * (1 + VAT);
const convertFx = (price, rate)  => price * rate;
const fmtM      = (n, sym="£")   => `${sym}${Number(n).toFixed(2)}`;
const fmtPct    = (n)            => `${Number(n).toFixed(1)}%`;
const today     = ()             => new Date().toLocaleDateString("en-GB");
const nid       = (arr)          => arr.length ? Math.max(...arr.map(x=>x.id)) + 1 : 1;

// ─── Shared UI primitives ─────────────────────────────────────────────────────
const inp = { background:"#fff", border:`1px solid ${COLORS.border}`, color:COLORS.text, padding:"7px 10px", fontFamily:FONT, fontSize:14, borderRadius:4, width:"100%", boxSizing:"border-box" };
const sel = { background:"#fff", border:`1px solid ${COLORS.border}`, color:COLORS.text, padding:"7px 10px", fontFamily:FONT, fontSize:14, borderRadius:4 };
const Btn = ({ children, onClick, variant="primary", small, style={} }) => {
  const bg   = variant==="primary"?COLORS.green: variant==="danger"?COLORS.red: variant==="yellow"?COLORS.yellow: "#fff";
  const col  = variant==="ghost"?COLORS.green: variant==="yellow"?COLORS.text: "#fff";
  const bdr  = variant==="ghost"?COLORS.green: "transparent";
  return (
    <button onClick={onClick} style={{ background:bg, color:col, border:`1.5px solid ${bdr}`, padding: small?"4px 10px":"7px 16px", borderRadius:4, cursor:"pointer", fontFamily:FONT, fontSize:small?12:14, fontWeight:600, display:"inline-flex", alignItems:"center", gap:5, whiteSpace:"nowrap", ...style }}>
      {children}
    </button>
  );
};
const Card = ({ children, style={} }) => <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:6, padding:16, ...style }}>{children}</div>;
const Label = ({ children }) => <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>{children}</div>;
const Modal = ({ children, onClose, width=560 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{ background:"#fff", borderRadius:8, padding:28, width, maxWidth:"96vw", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 8px 32px rgba(0,0,0,.18)" }}>
      {children}
    </div>
  </div>
);
const ModalHead = ({ title, onClose }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
    <div style={{ fontSize:17, fontWeight:700, color:COLORS.text }}>{title}</div>
    <Btn variant="ghost" small onClick={onClose}>✕ Close</Btn>
  </div>
);
const Th = ({ children, onClick, sorted }) => (
  <th onClick={onClick} style={{ textAlign:"left", padding:"9px 10px", background:COLORS.greenBg, borderBottom:`2px solid ${COLORS.border}`, fontSize:12, fontWeight:700, color:COLORS.muted, textTransform:"uppercase", letterSpacing:.5, cursor:onClick?"pointer":"default", userSelect:"none", whiteSpace:"nowrap" }}>
    {children}{sorted ? (sorted===1?" ▲":" ▼") : ""}
  </th>
);
const Td = ({ children, style={} }) => <td style={{ padding:"8px 10px", borderBottom:`1px solid ${COLORS.border}`, fontSize:14, ...style }}>{children}</td>;
const StatBox = ({ label, value, sub, color=COLORS.green }) => (
  <Card style={{ textAlign:"center", padding:20 }}>
    <div style={{ fontSize:28, fontWeight:800, color }}>{value}</div>
    <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginTop:2 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:COLORS.muted, marginTop:2 }}>{sub}</div>}
  </Card>
);
const Alert = ({ children, type="warn" }) => (
  <div style={{ background: type==="warn"?"#fef9c3": type==="danger"?"#fee2e2":"#dcfce7", border:`1px solid ${type==="warn"?"#fcd34d":type==="danger"?"#fca5a5":"#86efac"}`, borderRadius:4, padding:"8px 12px", fontSize:13, color:COLORS.text, marginBottom:8 }}>
    {children}
  </div>
);

// ─── Excel Export ─────────────────────────────────────────────────────────────
function doExport(products, tiers, mode, currency, showVat) {
  const sym   = currency.symbol;
  const rate  = currency.rate;
  const vatLbl = showVat ? " (inc VAT)" : " (ex VAT)";

  const rows = products.map(p => {
    const row = {
      SKU: p.sku, "Product Name": p.name, Category: p.category,
      Type: p.type, Unit: p.unit, Supplier: p.supplierId,
      "In Stock": p.inStock?"Yes":"No",
      [`Cost Price (${sym})`]: +(p.costPrice * rate).toFixed(2),
      "Min Margin (%)": p.minMargin, Notes: p.notes,
    };
    if (mode !== "customer") {
      tiers.forEach(t => {
        const raw = sellPrice(p.costPrice, t.margin) * rate;
        row[`${t.name} Price${vatLbl} (${sym})`] = +(showVat ? withVat(raw) : raw).toFixed(2);
      });
    } else {
      tiers.forEach(t => {
        const raw = sellPrice(p.costPrice, t.margin) * rate;
        row[`${t.name} Price${vatLbl} (${sym})`] = +(showVat ? withVat(raw) : raw).toFixed(2);
      });
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0]||{}).map(k => ({ wch: Math.max(k.length, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Price List");

  if (mode === "full") {
    const summary = [
      [COMPANY],["Price List Export — " + today()],[""],
      ["Total Products", products.length],
      ["In Stock", products.filter(p=>p.inStock).length],
      ["Bulk Items", products.filter(p=>p.type==="bulk").length],
      ["Branded Items", products.filter(p=>p.type==="branded").length],
      ["Currency", currency.code],
      ["VAT", showVat ? "Included" : "Excluded"],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");
  }
  const fname = mode==="full" ? "infinity-foods-full-export.xlsx" : "infinity-foods-price-list.xlsx";
  XLSX.writeFile(wb, fname);
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
const MAP_FIELDS = [
  {key:"sku",label:"SKU / Code"},{key:"name",label:"Product Name"},{key:"category",label:"Category"},
  {key:"type",label:"Type (bulk/branded)"},{key:"unit",label:"Unit"},
  {key:"costPrice",label:"Cost Price"},{key:"minMargin",label:"Min Margin %"},
  {key:"inStock",label:"In Stock"},{key:"supplier",label:"Supplier"},{key:"notes",label:"Notes"},
];

function ImportModal({ onImport, onClose }) {
  const [cols,setCols]=useState([]); const [raw,setRaw]=useState(null);
  const [prev,setPrev]=useState(null); const [map,setMap]=useState({});
  const ref=useRef();

  const load = file => {
    const r=new FileReader();
    r.onload = e => {
      const wb=XLSX.read(e.target.result,{type:"array"});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const json=XLSX.utils.sheet_to_json(ws,{header:1});
      if(!json.length)return;
      const headers=json[0].map(String);
      setCols(headers); setRaw(json.slice(1)); setPrev(json.slice(1,6));
      const auto={};
      MAP_FIELDS.forEach(f=>{
        const i=headers.findIndex(h=>{
          const hl=h.toLowerCase();
          return hl.includes(f.key.toLowerCase())||(f.key==="name"&&hl.includes("product"))||(f.key==="costPrice"&&(hl.includes("cost")||hl.includes("price")))||(f.key==="minMargin"&&hl.includes("margin"))||(f.key==="sku"&&(hl.includes("sku")||hl.includes("code")));
        });
        if(i>=0) auto[f.key]=String(i);
      });
      setMap(auto);
    };
    r.readAsArrayBuffer(file);
  };

  const doImport = () => {
    const products=raw.filter(r=>r.length).map((row,i)=>({
      id:i+2000, sku:map.sku!=null?String(row[+map.sku]??""):`IMP-${i}`,
      name:map.name!=null?String(row[+map.name]??""):`Product ${i}`,
      category:map.category!=null?String(row[+map.category]??""):"Imported",
      type:map.type!=null?String(row[+map.type]??"bulk").toLowerCase():"bulk",
      unit:map.unit!=null?String(row[+map.unit]??""):"per unit",
      costPrice:map.costPrice!=null?parseFloat(row[+map.costPrice])||0:0,
      minMargin:map.minMargin!=null?parseFloat(row[+map.minMargin])||10:10,
      inStock:map.inStock!=null?!/false|no|0/i.test(String(row[+map.inStock]??"yes")):true,
      supplierId:null, notes:map.notes!=null?String(row[+map.notes]??""):"", history:[],
    }));
    onImport(products);
  };

  return (
    <Modal onClose={onClose} width={740}>
      <ModalHead title="⬆ Import from Excel / CSV" onClose={onClose} />
      {!raw ? (
        <div
          onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=COLORS.green}}
          onDragLeave={e=>{e.currentTarget.style.borderColor=COLORS.border}}
          onDrop={e=>{e.preventDefault();load(e.dataTransfer.files[0])}}
          onClick={()=>ref.current.click()}
          style={{ border:`2px dashed ${COLORS.border}`, borderRadius:6, padding:48, textAlign:"center", color:COLORS.muted, cursor:"pointer" }}
        >
          <div style={{fontSize:40,marginBottom:8}}>📂</div>
          <div style={{fontSize:15,marginBottom:4}}>Drop your Excel (.xlsx) or CSV file here</div>
          <div style={{fontSize:13}}>or click to browse</div>
          <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>e.target.files[0]&&load(e.target.files[0])} />
        </div>
      ) : (
        <>
          <div style={{marginBottom:16}}>
            <Label>Map your spreadsheet columns</Label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
              {MAP_FIELDS.map(f=>(
                <div key={f.key} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,width:130,flexShrink:0,color:COLORS.muted}}>{f.label}</span>
                  <select style={{...sel,flex:1}} value={map[f.key]??""} onChange={e=>setMap(m=>({...m,[f.key]:e.target.value}))}>
                    <option value="">— skip —</option>
                    {cols.map((c,i)=><option key={i} value={i}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div style={{overflowX:"auto",marginBottom:16}}>
            <Label>Preview — first 5 rows</Label>
            <table style={{width:"100%",borderCollapse:"collapse",marginTop:6}}>
              <thead><tr>{cols.map((c,i)=><th key={i} style={{padding:"6px 8px",background:COLORS.greenBg,border:`1px solid ${COLORS.border}`,fontSize:11,textAlign:"left"}}>{c}</th>)}</tr></thead>
              <tbody>{prev?.map((row,ri)=><tr key={ri}>{cols.map((_,ci)=><td key={ci} style={{padding:"5px 8px",border:`1px solid ${COLORS.border}`,fontSize:12}}>{String(row[ci]??"")}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="ghost" onClick={()=>{setRaw(null);setCols([]);}}>↩ Re-upload</Btn>
            <Btn onClick={doImport}>✓ Import {raw.length} rows</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Edit Product Modal ───────────────────────────────────────────────────────
function EditProductModal({ product, suppliers, onSave, onClose }) {
  const blank = { sku:"", name:"", category:"", type:"bulk", unit:"per tonne", costPrice:"", minMargin:"", inStock:true, supplierId:"", notes:"" };
  const [f,setF]=useState(product?{...product}:blank);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const sp = f.costPrice&&f.minMargin ? sellPrice(+f.costPrice,+f.minMargin) : null;

  return (
    <Modal onClose={onClose}>
      <ModalHead title={product?"Edit Product":"Add Product"} onClose={onClose} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[["SKU","sku","text"],["Product Name","name","text"],["Category","category","text"],["Unit","unit","text"]].map(([l,k,t])=>(
          <div key={k}><Label>{l}</Label><input style={inp} type={t} value={f[k]} onChange={e=>set(k,e.target.value)} /></div>
        ))}
        <div><Label>Type</Label>
          <select style={{...sel,width:"100%"}} value={f.type} onChange={e=>set("type",e.target.value)}>
            <option value="bulk">Bulk Commodity</option><option value="branded">Branded Good</option>
          </select>
        </div>
        <div><Label>Supplier</Label>
          <select style={{...sel,width:"100%"}} value={f.supplierId??""} onChange={e=>set("supplierId",e.target.value?+e.target.value:null)}>
            <option value="">— None —</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><Label>Cost Price (£)</Label><input style={inp} type="number" step="0.01" value={f.costPrice} onChange={e=>set("costPrice",e.target.value)} /></div>
        <div><Label>Min Margin (%)</Label><input style={inp} type="number" step="0.1" value={f.minMargin} onChange={e=>set("minMargin",e.target.value)} /></div>
        <div><Label>In Stock</Label>
          <select style={{...sel,width:"100%"}} value={f.inStock?"yes":"no"} onChange={e=>set("inStock",e.target.value==="yes")}>
            <option value="yes">✓ In Stock</option><option value="no">✗ Out of Stock</option>
          </select>
        </div>
        <div style={{gridColumn:"1/-1"}}><Label>Notes</Label><input style={inp} value={f.notes} onChange={e=>set("notes",e.target.value)} /></div>
      </div>
      {sp&&(
        <div style={{background:COLORS.greenBg,border:`1px solid ${COLORS.border}`,borderRadius:4,padding:12,marginTop:14,display:"flex",gap:20}}>
          <span><span style={{color:COLORS.muted,fontSize:12}}>Min Sell Price: </span><strong style={{color:COLORS.green}}>£{sp.toFixed(2)}</strong></span>
          <span><span style={{color:COLORS.muted,fontSize:12}}>Min Profit: </span><strong style={{color:COLORS.green}}>£{(sp-+f.costPrice).toFixed(2)}</strong></span>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:20,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>onSave({...f,id:f.id??undefined,costPrice:+f.costPrice,minMargin:+f.minMargin,history:f.history??[]})}>✓ Save Product</Btn>
      </div>
    </Modal>
  );
}

// ─── Competitor Search Modal ──────────────────────────────────────────────────
function CompetitorModal({ product, tiers, currency, onClose }) {
  const [results,setResults]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);

  const search=async()=>{
    setLoading(true);setError(null);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`Find current UK wholesale or trade prices for "${product.name}" sold ${product.unit}. Find 4-5 real suppliers with prices. Return ONLY a JSON array: [{"supplier":"Name","price":0.00,"notes":"source/detail"}], no markdown.`}]
        })
      });
      const data=await res.json();
      const text=data.content.map(b=>b.text||"").join("\n");
      const match=text.replace(/```json|```/g,"").match(/\[[\s\S]*?\]/);
      setResults(match?JSON.parse(match[0]):[{supplier:"Summary",price:null,notes:text.slice(0,400)}]);
    }catch(e){setError("Search failed: "+e.message);}
    finally{setLoading(false);}
  };

  const ourPrices=tiers.map(t=>({...t,price:sellPrice(product.costPrice,t.margin)*currency.rate}));

  return (
    <Modal onClose={onClose} width={660}>
      <ModalHead title={`🔍 Competitor Prices — ${product.name}`} onClose={onClose} />
      <div style={{background:COLORS.greenBg,border:`1px solid ${COLORS.border}`,borderRadius:4,padding:12,marginBottom:16}}>
        <div style={{fontSize:12,color:COLORS.muted,marginBottom:6}}>OUR PRICES ({currency.code})</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {ourPrices.map(t=>(
            <span key={t.id}><span style={{color:COLORS.muted,fontSize:12}}>{t.name}: </span>
              <strong style={{color:t.color}}>{fmtM(t.price,currency.symbol)}</strong></span>
          ))}
        </div>
      </div>
      {!results&&!loading&&(
        <div style={{textAlign:"center",padding:28}}>
          <div style={{color:COLORS.muted,marginBottom:14}}>Search live web for current competitor prices for this product</div>
          <Btn onClick={search}>🔍 Search Competitor Prices</Btn>
        </div>
      )}
      {loading&&<div style={{textAlign:"center",padding:32,color:COLORS.muted}}>Searching market prices…</div>}
      {error&&<Alert type="danger">{error}</Alert>}
      {results&&(
        <>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><Th>Supplier</Th><Th>Their Price</Th><Th>vs Our Retail</Th><Th>Notes</Th></tr></thead>
            <tbody>
              {results.map((r,i)=>{
                const retail=ourPrices[0]?.price;
                const diff=r.price&&retail?r.price-retail:null;
                return(
                  <tr key={i}>
                    <Td>{r.supplier}</Td>
                    <Td>{r.price?fmtM(r.price,currency.symbol):"—"}</Td>
                    <Td>{diff!=null?<span style={{color:diff>0?COLORS.green:COLORS.red}}>{diff>0?"↑ ":"↓ "}{fmtM(Math.abs(diff),currency.symbol)}</span>:"—"}</Td>
                    <Td style={{color:COLORS.muted,fontSize:12}}>{r.notes}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{textAlign:"right",marginTop:10}}><Btn variant="ghost" onClick={search}>↻ Refresh</Btn></div>
        </>
      )}
    </Modal>
  );
}

// ─── History Modal ────────────────────────────────────────────────────────────
function HistoryModal({ product, onClose }) {
  return (
    <Modal onClose={onClose}>
      <ModalHead title={`📋 Price History — ${product.name}`} onClose={onClose} />
      {product.history?.length ? (
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr><Th>Date</Th><Th>Field</Th><Th>Old Value</Th><Th>New Value</Th><Th>Changed By</Th></tr></thead>
          <tbody>
            {[...product.history].reverse().map((h,i)=>(
              <tr key={i}>
                <Td style={{fontSize:12}}>{h.date}</Td>
                <Td style={{fontSize:12}}>{h.field}</Td>
                <Td style={{color:COLORS.red}}>{h.old}</Td>
                <Td style={{color:COLORS.green}}>{h.new}</Td>
                <Td style={{fontSize:12,color:COLORS.muted}}>{h.user||"Admin"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{textAlign:"center",padding:32,color:COLORS.muted}}>No price changes recorded yet for this product.</div>
      )}
    </Modal>
  );
}

// ─── Quote Builder Modal ──────────────────────────────────────────────────────
function QuoteModal({ products, tiers, currency, onClose }) {
  const [items,setItems]=useState([{productId:"",tierId:tiers[0]?.id,qty:1}]);
  const [customer,setCustomer]=useState(""); const [showVat,setShowVat]=useState(false);

  const addRow=()=>setItems(i=>[...i,{productId:"",tierId:tiers[0]?.id,qty:1}]);
  const setRow=(i,k,v)=>setItems(rows=>rows.map((r,ri)=>ri===i?{...r,[k]:v}:r));
  const removeRow=(i)=>setItems(rows=>rows.filter((_,ri)=>ri!==i));

  const lines=items.map(item=>{
    const p=products.find(x=>x.id===+item.productId);
    const t=tiers.find(x=>x.id===+item.tierId);
    if(!p||!t)return null;
    const up=sellPrice(p.costPrice,t.margin)*currency.rate;
    const upVat=showVat?withVat(up):up;
    return{...item,product:p,tier:t,unitPrice:upVat,lineTotal:upVat*+item.qty};
  });
  const total=lines.reduce((a,l)=>a+(l?.lineTotal||0),0);

  const exportQuote=()=>{
    const rows=lines.filter(Boolean).map(l=>({
      "Product":l.product.name,"SKU":l.product.sku,"Unit":l.product.unit,
      "Price Tier":l.tier.name,
      [`Unit Price (${currency.code})`]:+l.unitPrice.toFixed(2),
      "Qty":+l.qty,
      [`Line Total (${currency.code})`]:+l.lineTotal.toFixed(2),
    }));
    rows.push({"Product":"","SKU":"","Unit":"","Price Tier":"","Unit Price (£)":"","Qty":"TOTAL",[`Line Total (${currency.code})`]:+total.toFixed(2)});
    const ws=XLSX.utils.json_to_sheet(rows);
    ws["!cols"]=[{wch:28},{wch:14},{wch:16},{wch:12},{wch:14},{wch:6},{wch:14}];
    const header=[[COMPANY],[`Quote for: ${customer||"Customer"}`],[`Date: ${today()}`],[`VAT: ${showVat?"Included":"Excluded"}`],[""]];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(header),"Cover");
    XLSX.utils.book_append_sheet(wb,ws,"Quote");
    XLSX.writeFile(wb,`infinity-quote-${(customer||"customer").replace(/\s/g,"-").toLowerCase()}.xlsx`);
  };

  return (
    <Modal onClose={onClose} width={780}>
      <ModalHead title="📄 Quote Builder" onClose={onClose} />
      <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1}}><Label>Customer Name</Label><input style={inp} value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="e.g. Tesco Metro Birmingham" /></div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:16}}>
          <input type="checkbox" id="vatq" checked={showVat} onChange={e=>setShowVat(e.target.checked)} />
          <label htmlFor="vatq" style={{fontSize:14,cursor:"pointer"}}>Inc. VAT (20%)</label>
        </div>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:10}}>
        <thead><tr><Th>Product</Th><Th>Price Tier</Th><Th>Unit Price</Th><Th>Qty</Th><Th>Line Total</Th><Th></Th></tr></thead>
        <tbody>
          {items.map((item,i)=>{
            const line=lines[i];
            return(
              <tr key={i}>
                <Td>
                  <select style={{...sel,width:"100%"}} value={item.productId} onChange={e=>setRow(i,"productId",e.target.value)}>
                    <option value="">— Select product —</option>
                    {products.filter(p=>p.inStock).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Td>
                <Td>
                  <select style={{...sel,width:"100%"}} value={item.tierId} onChange={e=>setRow(i,"tierId",+e.target.value)}>
                    {tiers.map(t=><option key={t.id} value={t.id}>{t.name} ({t.margin}%)</option>)}
                  </select>
                </Td>
                <Td style={{color:COLORS.green,fontWeight:600}}>{line?fmtM(line.unitPrice,currency.symbol):"—"}</Td>
                <Td><input type="number" min="1" style={{...inp,width:70}} value={item.qty} onChange={e=>setRow(i,"qty",e.target.value)} /></Td>
                <Td style={{fontWeight:700}}>{line?fmtM(line.lineTotal,currency.symbol):"—"}</Td>
                <Td><Btn variant="ghost" small onClick={()=>removeRow(i)}>✕</Btn></Td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
        <Btn variant="ghost" onClick={addRow}>+ Add Line</Btn>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{fontSize:18,fontWeight:800,color:COLORS.green}}>Total: {fmtM(total,currency.symbol)}</div>
          <Btn onClick={exportQuote}>⬇ Export Quote to Excel</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Supplier Modal ───────────────────────────────────────────────────────────
function SupplierModal({ suppliers, setSuppliers, onClose }) {
  const blank={name:"",contact:"",email:"",phone:"",notes:""};
  const [editing,setEditing]=useState(null);
  const [f,setF]=useState(blank);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const save=()=>{
    if(!f.name)return;
    if(editing){
      setSuppliers(s=>s.map(x=>x.id===editing?{...f,id:editing}:x));
    } else {
      setSuppliers(s=>[...s,{...f,id:nid(s)}]);
    }
    setEditing(null);setF(blank);
  };

  return (
    <Modal onClose={onClose} width={700}>
      <ModalHead title="🏭 Supplier Management" onClose={onClose} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[["Company Name","name"],["Contact Person","contact"],["Email","email"],["Phone","phone"]].map(([l,k])=>(
          <div key={k}><Label>{l}</Label><input style={inp} value={f[k]} onChange={e=>set(k,e.target.value)} /></div>
        ))}
        <div style={{gridColumn:"1/-1"}}><Label>Notes</Label><input style={inp} value={f.notes} onChange={e=>set("notes",e.target.value)} /></div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <Btn onClick={save}>{editing?"✓ Update Supplier":"+ Add Supplier"}</Btn>
        {editing&&<Btn variant="ghost" onClick={()=>{setEditing(null);setF(blank);}}>Cancel</Btn>}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr><Th>Supplier</Th><Th>Contact</Th><Th>Email</Th><Th>Phone</Th><Th>Notes</Th><Th></Th></tr></thead>
        <tbody>
          {suppliers.map(s=>(
            <tr key={s.id}>
              <Td style={{fontWeight:600}}>{s.name}</Td>
              <Td>{s.contact}</Td>
              <Td style={{fontSize:12}}>{s.email}</Td>
              <Td style={{fontSize:12}}>{s.phone}</Td>
              <Td style={{fontSize:12,color:COLORS.muted}}>{s.notes}</Td>
              <Td>
                <div style={{display:"flex",gap:4}}>
                  <Btn small variant="ghost" onClick={()=>{setEditing(s.id);setF(s);}}>Edit</Btn>
                  <Btn small variant="danger" onClick={()=>setSuppliers(sup=>sup.filter(x=>x.id!==s.id))}>✕</Btn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

// ─── Tier Manager Modal ───────────────────────────────────────────────────────
function TierModal({ tiers, setTiers, onClose }) {
  const [local,setLocal]=useState(tiers.map(t=>({...t})));
  const set=(i,k,v)=>setLocal(ts=>ts.map((t,ti)=>ti===i?{...t,[k]:v}:t));
  return (
    <Modal onClose={onClose} width={480}>
      <ModalHead title="💰 Price Tiers" onClose={onClose} />
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {local.map((t,i)=>(
          <div key={t.id} style={{display:"grid",gridTemplateColumns:"1fr 120px 40px 40px",gap:8,alignItems:"center"}}>
            <input style={inp} value={t.name} onChange={e=>set(i,"name",e.target.value)} placeholder="Tier name" />
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <input style={{...inp,width:70}} type="number" value={t.margin} onChange={e=>set(i,"margin",+e.target.value)} />
              <span style={{fontSize:13,color:COLORS.muted}}>%</span>
            </div>
            <input type="color" value={t.color} onChange={e=>set(i,"color",e.target.value)} style={{width:36,height:34,border:"none",cursor:"pointer",borderRadius:4}} />
            <Btn small variant="danger" onClick={()=>setLocal(ts=>ts.filter((_,ti)=>ti!==i))}>✕</Btn>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
        <Btn variant="ghost" onClick={()=>setLocal(ts=>[...ts,{id:nid(ts),name:"New Tier",margin:15,color:"#6b7280"}])}>+ Add Tier</Btn>
        <Btn onClick={()=>{setTiers(local);onClose();}}>✓ Save Tiers</Btn>
      </div>
    </Modal>
  );
}

// ─── Admin Products Tab ───────────────────────────────────────────────────────
function AdminProducts({ products, setProducts, tiers, suppliers, currency }) {
  const [search,setSearch]=useState(""); const [cat,setCat]=useState("All"); const [type,setType]=useState("All");
  const [stockF,setStockF]=useState("All");
  const [editTarget,setEditTarget]=useState(null);
  const [compTarget,setCompTarget]=useState(null);
  const [histTarget,setHistTarget]=useState(null);
  const [showImport,setShowImport]=useState(false);
  const [bulkMgn,setBulkMgn]=useState("");
  const [sortK,setSortK]=useState("name"); const [sortD,setSortD]=useState(1);

  const cats=["All",...new Set(products.map(p=>p.category))];

  const visible=useMemo(()=>{
    let l=products.filter(p=>
      (cat==="All"||p.category===cat)&&(type==="All"||p.type===type)&&
      (stockF==="All"||(stockF==="in"&&p.inStock)||(stockF==="out"&&!p.inStock))&&
      (!search||[p.name,p.sku,p.category].some(s=>s.toLowerCase().includes(search.toLowerCase())))
    );
    l.sort((a,b)=>{let av=a[sortK]??0,bv=b[sortK]??0;if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase();}return av<bv?-sortD:av>bv?sortD:0;});
    return l;
  },[products,cat,type,stockF,search,sortK,sortD]);

  const SortTh=({k,l})=><Th onClick={()=>{if(sortK===k)setSortD(d=>-d);else{setSortK(k);setSortD(1);}}} sorted={sortK===k?sortD:0}>{l}</Th>;

  const saveProduct=f=>{
    const now=today();
    setProducts(prev=>{
      if(f.id){
        return prev.map(p=>{
          if(p.id!==f.id)return p;
          const hist=[...p.history||[]];
          if(p.costPrice!==f.costPrice) hist.push({date:now,field:"Cost Price",old:`£${p.costPrice}`,new:`£${f.costPrice}`,user:"Admin"});
          if(p.minMargin!==f.minMargin) hist.push({date:now,field:"Min Margin",old:`${p.minMargin}%`,new:`${f.minMargin}%`,user:"Admin"});
          return{...f,history:hist};
        });
      }
      return[...prev,{...f,id:nid(prev),history:[]}];
    });
    setEditTarget(null);
  };
  const del=id=>{if(window.confirm("Delete this product?"))setProducts(prev=>prev.filter(p=>p.id!==id));};

  const applyBulk=()=>{
    const m=parseFloat(bulkMgn);
    if(!m||m<=0||m>=100)return;
    setProducts(prev=>prev.map(p=>visible.find(v=>v.id===p.id)?{...p,minMargin:m}:p));
    setBulkMgn("");
  };

  const handleImport=imported=>{
    setProducts(prev=>{
      const skus=new Set(prev.map(p=>p.sku));
      const fresh=imported.filter(p=>!skus.has(p.sku));
      const updated=prev.map(p=>{const i=imported.find(x=>x.sku===p.sku);return i?{...p,...i,id:p.id}:p;});
      return[...updated,...fresh.map((p,i)=>({...p,id:nid(prev)+i}))];
    });
    setShowImport(false);
  };

  const alerts=products.filter(p=>tiers.some(t=>t.margin<p.minMargin));

  const supName=id=>suppliers.find(s=>s.id===id)?.name||"—";

  return (
    <div>
      {alerts.length>0&&(
        <Alert type="warn">
          ⚠️ <strong>{alerts.length} product{alerts.length>1?"s":""}</strong> have a tier margin below their minimum: {alerts.map(p=>p.name).join(", ")}
        </Alert>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        <StatBox label="Total Products" value={products.length} />
        <StatBox label="In Stock" value={products.filter(p=>p.inStock).length} color={COLORS.green} />
        <StatBox label="Out of Stock" value={products.filter(p=>!p.inStock).length} color={COLORS.red} />
        <StatBox label="Bulk Items" value={products.filter(p=>p.type==="bulk").length} color={COLORS.blue} />
        <StatBox label="Branded Items" value={products.filter(p=>p.type==="branded").length} color={COLORS.yellow} />
      </div>

      <Card style={{marginBottom:16,padding:12}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:1,minWidth:180}}>
            <Label>Search</Label>
            <input style={inp} placeholder="Name, SKU, category…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <select style={sel} value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <Label>Type</Label>
            <select style={sel} value={type} onChange={e=>setType(e.target.value)}>
              <option value="All">All Types</option><option value="bulk">Bulk</option><option value="branded">Branded</option>
            </select>
          </div>
          <div>
            <Label>Stock</Label>
            <select style={sel} value={stockF} onChange={e=>setStockF(e.target.value)}>
              <option value="All">All</option><option value="in">In Stock</option><option value="out">Out of Stock</option>
            </select>
          </div>
          <div style={{display:"flex",gap:4,alignItems:"flex-end"}}>
            <div>
              <Label>Bulk set min margin</Label>
              <div style={{display:"flex",gap:4}}>
                <input style={{...inp,width:70}} type="number" placeholder="%" value={bulkMgn} onChange={e=>setBulkMgn(e.target.value)} />
                <Btn onClick={applyBulk}>Apply to filtered</Btn>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,marginLeft:"auto",alignItems:"flex-end"}}>
            <Btn variant="ghost" onClick={()=>setShowImport(true)}>⬆ Import Excel</Btn>
            <Btn variant="ghost" onClick={()=>doExport(products,tiers,"full",currency,false)}>⬇ Export Full</Btn>
            <Btn onClick={()=>setEditTarget({})}>+ Add Product</Btn>
          </div>
        </div>
      </Card>

      <div style={{fontSize:12,color:COLORS.muted,marginBottom:8}}>{visible.length} of {products.length} products</div>

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
          <thead>
            <tr>
              <SortTh k="sku"        l="SKU"        />
              <SortTh k="name"       l="Product"    />
              <SortTh k="category"   l="Category"   />
              <SortTh k="type"       l="Type"       />
              <SortTh k="costPrice"  l="Cost (£)"   />
              <SortTh k="minMargin"  l="Min Margin" />
              {tiers.map(t=><th key={t.id} style={{textAlign:"left",padding:"9px 10px",background:COLORS.greenBg,borderBottom:`2px solid ${COLORS.border}`,fontSize:12,fontWeight:700,color:t.color,textTransform:"uppercase",letterSpacing:.5}}>{t.name}</th>)}
              <SortTh k="inStock"    l="Stock"      />
              <th style={{textAlign:"left",padding:"9px 10px",background:COLORS.greenBg,borderBottom:`2px solid ${COLORS.border}`,fontSize:12,fontWeight:700,color:COLORS.muted,textTransform:"uppercase"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(p=>{
              const belowMin=tiers.some(t=>t.margin<p.minMargin);
              return(
                <tr key={p.id} style={{background:belowMin?"#fff7ed":"#fff"}}>
                  <Td style={{fontSize:12,color:COLORS.muted}}>{p.sku}</Td>
                  <Td><div style={{fontWeight:600}}>{p.name}</div><div style={{fontSize:11,color:COLORS.muted}}>{supName(p.supplierId)}</div></Td>
                  <Td style={{fontSize:13}}>{p.category}</Td>
                  <Td><span style={{background:p.type==="bulk"?"#dbeafe":"#dcfce7",color:p.type==="bulk"?COLORS.blue:"#15803d",padding:"2px 8px",borderRadius:3,fontSize:12,fontWeight:600}}>{p.type}</span></Td>
                  <Td style={{fontWeight:600}}>£{p.costPrice.toFixed(2)}</Td>
                  <Td>{fmtPct(p.minMargin)}</Td>
                  {tiers.map(t=>{
                    const sp2=sellPrice(p.costPrice,t.margin)*currency.rate;
                    const low=t.margin<p.minMargin;
                    return<Td key={t.id} style={{color:low?COLORS.red:t.color,fontWeight:700}}>{fmtM(sp2,currency.symbol)}{low?" ⚠":""}
                    </Td>;
                  })}
                  <Td><span style={{background:p.inStock?"#dcfce7":"#fee2e2",color:p.inStock?"#15803d":COLORS.red,padding:"2px 8px",borderRadius:3,fontSize:12,fontWeight:600}}>{p.inStock?"✓ In Stock":"✗ Out"}</span></Td>
                  <Td>
                    <div style={{display:"flex",gap:4}}>
                      <Btn small variant="ghost" onClick={()=>setEditTarget(p)}>Edit</Btn>
                      <Btn small variant="ghost" onClick={()=>setHistTarget(p)}>Log</Btn>
                      <Btn small variant="ghost" onClick={()=>setCompTarget(p)}>🔍</Btn>
                      <Btn small variant="danger" onClick={()=>del(p.id)}>✕</Btn>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editTarget!==null && <EditProductModal product={editTarget.id?editTarget:null} suppliers={suppliers} onSave={saveProduct} onClose={()=>setEditTarget(null)} />}
      {compTarget!==null && <CompetitorModal product={compTarget} tiers={tiers} currency={currency} onClose={()=>setCompTarget(null)} />}
      {histTarget!==null && <HistoryModal product={histTarget} onClose={()=>setHistTarget(null)} />}
      {showImport        && <ImportModal onImport={handleImport} onClose={()=>setShowImport(false)} />}
    </div>
  );
}

// ─── Customer Price List Tab ───────────────────────────────────────────────────
function CustomerPriceList({ products, tiers, currency, showVat, setShowVat }) {
  const [search,setSearch]=useState(""); const [cat,setCat]=useState("All"); const [type,setType]=useState("All");
  const [showQuote,setShowQuote]=useState(false);

  const cats=["All",...new Set(products.map(p=>p.category))];
  const visible=useMemo(()=>products.filter(p=>
    p.inStock&&(cat==="All"||p.category===cat)&&(type==="All"||p.type===type)&&
    (!search||[p.name,p.sku,p.category].some(s=>s.toLowerCase().includes(search.toLowerCase())))
  ),[products,cat,type,search]);

  const calcPrice=(p,t)=>{
    const raw=sellPrice(p.costPrice,t.margin)*currency.rate;
    return showVat?withVat(raw):raw;
  };

  return (
    <div>
      <Card style={{marginBottom:16,padding:12}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:1,minWidth:180}}>
            <Label>Search</Label>
            <input style={inp} placeholder="Product name, SKU, category…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <select style={sel} value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <Label>Type</Label>
            <select style={sel} value={type} onChange={e=>setType(e.target.value)}>
              <option value="All">All</option><option value="bulk">Bulk</option><option value="branded">Branded</option>
            </select>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,paddingBottom:2}}>
            <input type="checkbox" id="vatp" checked={showVat} onChange={e=>setShowVat(e.target.checked)} />
            <label htmlFor="vatp" style={{fontSize:14,cursor:"pointer",fontWeight:600}}>Show inc. VAT</label>
          </div>
          <div style={{display:"flex",gap:6,marginLeft:"auto",alignItems:"flex-end"}}>
            <Btn variant="ghost" onClick={()=>setShowQuote(true)}>📄 Quote Builder</Btn>
            <Btn onClick={()=>doExport(visible,tiers,"customer",currency,showVat)}>⬇ Export Price List</Btn>
          </div>
        </div>
      </Card>

      <div style={{fontSize:12,color:COLORS.muted,marginBottom:12}}>{visible.length} products · Prices {showVat?"include":"exclude"} VAT · {currency.code}</div>

      {[...new Set(visible.map(p=>p.category))].map(c=>(
        <div key={c} style={{marginBottom:28}}>
          <div style={{fontSize:13,fontWeight:700,color:COLORS.green,letterSpacing:1,textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`2px solid ${COLORS.green}`}}>{c}</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>
                <Th>SKU</Th><Th>Product</Th><Th>Unit</Th>
                {tiers.map(t=><th key={t.id} style={{textAlign:"left",padding:"9px 10px",background:COLORS.greenBg,borderBottom:`2px solid ${COLORS.border}`,fontSize:12,fontWeight:700,color:t.color,textTransform:"uppercase",letterSpacing:.5}}>{t.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.filter(p=>p.category===c).map(p=>(
                <tr key={p.id}>
                  <Td style={{fontSize:12,color:COLORS.muted}}>{p.sku}</Td>
                  <Td>
                    <span style={{background:p.type==="bulk"?"#dbeafe":"#dcfce7",color:p.type==="bulk"?COLORS.blue:"#15803d",padding:"1px 6px",borderRadius:3,fontSize:11,fontWeight:600,marginRight:6}}>{p.type}</span>
                    <strong>{p.name}</strong>
                  </Td>
                  <Td style={{color:COLORS.muted,fontSize:13}}>{p.unit}</Td>
                  {tiers.map(t=>(
                    <Td key={t.id} style={{fontWeight:700,color:t.color,fontSize:15}}>{fmtM(calcPrice(p,t),currency.symbol)}</Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {visible.length===0&&<div style={{textAlign:"center",padding:48,color:COLORS.muted}}>No products match your filters.</div>}
      {showQuote&&<QuoteModal products={products} tiers={tiers} currency={currency} onClose={()=>setShowQuote(false)} />}
    </div>
  );
}

// ─── Margin Calculator Tab ────────────────────────────────────────────────────
function MarginCalc({ tiers, currency }) {
  const [cost,setCost]=useState(""); const [mgn,setMgn]=useState(""); const [sell,setSell]=useState(""); const [mode,setMode]=useState("margin");
  const MARGINS=[5,8,10,12,14,15,18,20,22,25,28,30,35,40];

  let sp2=null,gp=null,mg=null;
  if(mode==="margin"&&cost&&mgn){sp2=sellPrice(+cost,+mgn)*currency.rate;gp=sp2-+cost*currency.rate;mg=+mgn;}
  else if(mode==="sell"&&cost&&sell){sp2=+sell;const c=+cost*currency.rate;gp=sp2-c;mg=((sp2-c)/sp2)*100;}

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <div>
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:COLORS.text}}>Margin / Markup Calculator</div>
          <div style={{display:"flex",gap:4,marginBottom:16}}>
            {[["margin","I know the margin"],["sell","I know the sell price"]].map(([m,l])=>(
              <button key={m} style={{flex:1,padding:"8px",background:mode===m?COLORS.green:"#f4f6f4",color:mode===m?"#fff":COLORS.muted,border:`1px solid ${mode===m?COLORS.green:COLORS.border}`,borderRadius:4,cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600}}
                onClick={()=>{setMode(m);setCost("");setMgn("");setSell("");}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gap:12}}>
            <div><Label>Cost Price (£)</Label><input style={inp} type="number" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} placeholder="e.g. 210.00" /></div>
            {mode==="margin"&&<div><Label>Target Margin (%)</Label><input style={inp} type="number" step="0.1" value={mgn} onChange={e=>setMgn(e.target.value)} placeholder="e.g. 20" /></div>}
            {mode==="sell"&&<div><Label>Sell Price ({currency.symbol})</Label><input style={inp} type="number" step="0.01" value={sell} onChange={e=>setSell(e.target.value)} placeholder="e.g. 262.50" /></div>}
          </div>
          {sp2&&(
            <div style={{marginTop:16,background:COLORS.greenBg,border:`1px solid ${COLORS.border}`,borderRadius:4,padding:14}}>
              {[
                ["Sell Price",fmtM(sp2,currency.symbol),COLORS.green],
                ["Gross Profit",fmtM(gp,currency.symbol),COLORS.green],
                ["Margin",fmtPct(mg),COLORS.green],
                ["Markup",fmtPct((gp/(+cost*currency.rate))*100),COLORS.muted],
                ["Inc. VAT",fmtM(withVat(sp2),currency.symbol),COLORS.blue],
              ].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${COLORS.border}`}}>
                  <span style={{color:COLORS.muted,fontSize:13}}>{l}</span>
                  <span style={{color:c,fontWeight:700,fontSize:15}}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {cost&&(
          <Card>
            <div style={{fontSize:14,fontWeight:700,marginBottom:12,color:COLORS.text}}>Your Tier Prices for this Cost</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><Th>Tier</Th><Th>Margin</Th><Th>Sell Price</Th><Th>Profit</Th></tr></thead>
              <tbody>
                {tiers.map(t=>{
                  const s=sellPrice(+cost,t.margin)*currency.rate;
                  return(
                    <tr key={t.id}>
                      <Td style={{fontWeight:600,color:t.color}}>{t.name}</Td>
                      <Td>{fmtPct(t.margin)}</Td>
                      <Td style={{fontWeight:700,color:t.color}}>{fmtM(s,currency.symbol)}</Td>
                      <Td style={{color:COLORS.green}}>{fmtM(s-+cost*currency.rate,currency.symbol)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <Card>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12,color:COLORS.text}}>Margin Scenario Table</div>
        <div style={{marginBottom:14}}><Label>Cost Price (£)</Label>
          <input style={{...inp,width:180}} type="number" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} placeholder="Enter cost…" />
        </div>
        {cost?(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><Th>Margin %</Th><Th>Sell Price</Th><Th>Profit</Th><Th>Markup %</Th><Th>Inc. VAT</Th></tr></thead>
            <tbody>
              {MARGINS.map(m=>{
                const s=sellPrice(+cost,m)*currency.rate;
                const g=s-+cost*currency.rate;
                const isTier=tiers.some(t=>t.margin===m);
                return(
                  <tr key={m} style={{background:isTier?"#f0f7f1":"#fff"}}>
                    <Td style={{fontWeight:isTier?700:400,color:isTier?COLORS.green:COLORS.text}}>{m}%{isTier?" ★":""}</Td>
                    <Td style={{fontWeight:700,color:COLORS.green}}>{fmtM(s,currency.symbol)}</Td>
                    <Td>{fmtM(g,currency.symbol)}</Td>
                    <Td style={{color:COLORS.muted}}>{fmtPct((g/(+cost*currency.rate))*100)}</Td>
                    <Td style={{color:COLORS.blue}}>{fmtM(withVat(s),currency.symbol)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ):<div style={{textAlign:"center",padding:32,color:COLORS.muted}}>Enter a cost price to see scenarios</div>}
      </Card>
    </div>
  );
}

// ─── Suppliers Tab ────────────────────────────────────────────────────────────
function SuppliersTab({ suppliers, setSuppliers, products }) {
  const [editing,setEditing]=useState(null);
  const blank={name:"",contact:"",email:"",phone:"",notes:""};
  const [f,setF]=useState(blank);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const save=()=>{
    if(!f.name)return;
    if(editing){setSuppliers(s=>s.map(x=>x.id===editing?{...f,id:editing}:x));}
    else{setSuppliers(s=>[...s,{...f,id:nid(s)}]);}
    setEditing(null);setF(blank);
  };

  return (
    <div>
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>{editing?"Edit Supplier":"Add New Supplier"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:12}}>
          {[["Company Name","name"],["Contact Person","contact"],["Email","email"],["Phone","phone"]].map(([l,k])=>(
            <div key={k}><Label>{l}</Label><input style={inp} value={f[k]} onChange={e=>set(k,e.target.value)} /></div>
          ))}
          <div style={{gridColumn:"1/-1"}}><Label>Notes</Label><input style={inp} value={f.notes} onChange={e=>set("notes",e.target.value)} /></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={save}>{editing?"✓ Update":"+ Add Supplier"}</Btn>
          {editing&&<Btn variant="ghost" onClick={()=>{setEditing(null);setF(blank);}}>Cancel</Btn>}
        </div>
      </Card>

      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr><Th>Supplier</Th><Th>Contact</Th><Th>Email</Th><Th>Phone</Th><Th>Products</Th><Th>Notes</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {suppliers.map(s=>{
            const pCount=products.filter(p=>p.supplierId===s.id).length;
            return(
              <tr key={s.id}>
                <Td style={{fontWeight:600}}>{s.name}</Td>
                <Td>{s.contact}</Td>
                <Td style={{fontSize:12}}><a href={`mailto:${s.email}`} style={{color:COLORS.green}}>{s.email}</a></Td>
                <Td style={{fontSize:12}}>{s.phone}</Td>
                <Td><span style={{background:COLORS.greenBg,color:COLORS.green,padding:"2px 8px",borderRadius:3,fontWeight:600,fontSize:13}}>{pCount}</span></Td>
                <Td style={{color:COLORS.muted,fontSize:12}}>{s.notes}</Td>
                <Td>
                  <div style={{display:"flex",gap:4}}>
                    <Btn small variant="ghost" onClick={()=>{setEditing(s.id);setF(s);}}>Edit</Btn>
                    <Btn small variant="danger" onClick={()=>setSuppliers(sup=>sup.filter(x=>x.id!==s.id))}>✕</Btn>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ tiers, setTiers, currency, setCurrency }) {
  const [localTiers,setLocalTiers]=useState(tiers.map(t=>({...t})));
  const set=(i,k,v)=>setLocalTiers(ts=>ts.map((t,ti)=>ti===i?{...t,[k]:v}:t));

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <Card>
        <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>💰 Price Tiers</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {localTiers.map((t,i)=>(
            <div key={t.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 36px 36px",gap:8,alignItems:"center"}}>
              <input style={inp} value={t.name} onChange={e=>set(i,"name",e.target.value)} placeholder="Tier name" />
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <input style={{...inp,width:65}} type="number" value={t.margin} onChange={e=>set(i,"margin",+e.target.value)} />
                <span style={{fontSize:13,color:COLORS.muted}}>%</span>
              </div>
              <input type="color" value={t.color} onChange={e=>set(i,"color",e.target.value)} style={{width:34,height:34,border:`1px solid ${COLORS.border}`,cursor:"pointer",borderRadius:4,padding:2}} />
              <Btn small variant="danger" onClick={()=>setLocalTiers(ts=>ts.filter((_,ti)=>ti!==i))}>✕</Btn>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="ghost" onClick={()=>setLocalTiers(ts=>[...ts,{id:nid(ts),name:"New Tier",margin:15,color:"#6b7280"}])}>+ Add Tier</Btn>
          <Btn onClick={()=>setTiers(localTiers)}>✓ Save Tiers</Btn>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>🌍 Currency & Display</div>
        <Label>Display Currency</Label>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
          {CURRENCIES.map(c=>(
            <label key={c.code} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:10,border:`1px solid ${currency.code===c.code?COLORS.green:COLORS.border}`,borderRadius:4,background:currency.code===c.code?COLORS.greenBg:"#fff"}}>
              <input type="radio" checked={currency.code===c.code} onChange={()=>setCurrency(c)} />
              <span style={{fontWeight:600}}>{c.symbol} {c.code}</span>
              <span style={{color:COLORS.muted,fontSize:13}}>Rate: {c.rate} vs GBP</span>
            </label>
          ))}
        </div>
        <div style={{marginTop:16}}>
          <Alert type="info">
            💡 All cost prices are stored in GBP. Currency conversion is applied at display time only.
          </Alert>
        </div>
      </Card>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
const TABS=[
  {id:"pricelist",  label:"📋 Price List"},
  {id:"admin",      label:"⚙️ Admin"},
  {id:"calc",       label:"🧮 Margin Calc"},
  {id:"suppliers",  label:"🏭 Suppliers"},
  {id:"settings",   label:"⚙ Settings"},
];

export default function App() {
  const [tab,setTab]           = useState("pricelist");
  const [products,setProducts] = useState(INIT_PRODUCTS);
  const [suppliers,setSuppliers]= useState(INIT_SUPPLIERS);
  const [tiers,setTiers]       = useState(INIT_TIERS);
  const [currency,setCurrency] = useState(CURRENCIES[0]);
  const [showVat,setShowVat]   = useState(false);

  return (
    <div style={{fontFamily:FONT,background:COLORS.bg,minHeight:"100vh",color:COLORS.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{background:COLORS.hdr,color:"#fff",padding:"0 24px",display:"flex",alignItems:"stretch",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0"}}>
          <div style={{background:COLORS.greenL,borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🌿</div>
          <div>
            <div style={{fontWeight:800,fontSize:17,letterSpacing:.3}}>{COMPANY}</div>
            <div style={{fontSize:11,opacity:.7,letterSpacing:.5}}>Price Management System</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"stretch"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:tab===t.id?"rgba(255,255,255,.15)":"transparent",
              color:"#fff", border:"none", borderBottom:tab===t.id?"3px solid #7ed48a":"3px solid transparent",
              padding:"0 18px", cursor:"pointer", fontFamily:FONT, fontSize:14, fontWeight:tab===t.id?700:400,
              transition:"background .15s",
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,fontSize:13,opacity:.8}}>
          <span>{products.length} products</span>
          <span>·</span>
          <span>{products.filter(p=>p.inStock).length} in stock</span>
          <span>·</span>
          <span>{currency.code}</span>
        </div>
      </div>

      {/* Main */}
      <div style={{padding:24,maxWidth:1500,margin:"0 auto"}}>
        {tab==="pricelist"  && <CustomerPriceList products={products} tiers={tiers} currency={currency} showVat={showVat} setShowVat={setShowVat} />}
        {tab==="admin"      && <AdminProducts products={products} setProducts={setProducts} tiers={tiers} suppliers={suppliers} currency={currency} />}
        {tab==="calc"       && <MarginCalc tiers={tiers} currency={currency} />}
        {tab==="suppliers"  && <SuppliersTab suppliers={suppliers} setSuppliers={setSuppliers} products={products} />}
        {tab==="settings"   && <SettingsTab tiers={tiers} setTiers={setTiers} currency={currency} setCurrency={setCurrency} />}
      </div>

      {/* Footer */}
      <div style={{textAlign:"center",padding:"16px",fontSize:12,color:COLORS.muted,borderTop:`1px solid ${COLORS.border}`,marginTop:32}}>
        {COMPANY} · Price Management System · {today()}
      </div>
    </div>
  );
}
