import { ChangeEvent, DragEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpRight, Check, ChevronDown, CloudUpload, Download,
  FileArchive, FileCheck2, Filter, Heart, Menu, MonitorDown, Plus, Search,
  Sparkles, Star, Upload, X, Zap,
} from 'lucide-react';

type Category = 'Aurora' | 'Minimal' | 'Nature' | 'Abstract' | 'Retro';
type Variant = 'lime' | 'blue' | 'coral' | 'violet' | 'mint';
type SortMode = 'newest' | 'popular' | 'name';

type Theme = {
  id: string; title: string; category: Category; description: string; creator: string;
  downloads: number; added: string; tags: string[]; variant: Variant;
  fileName?: string; fileUrl?: string; fileBlobUrl?: string; featured?: boolean;
};

type Toast = { title: string; message: string } | null;

const categoryMeta: Record<Category, { label: string; color: string }> = {
  Aurora: { label: 'অরোরা', color: '#9dff47' }, Minimal: { label: 'মিনিমাল', color: '#4c7cff' },
  Nature: { label: 'প্রকৃতি', color: '#65cfa6' }, Abstract: { label: 'অ্যাবস্ট্রাক্ট', color: '#b58aff' }, Retro: { label: 'রেট্রো', color: '#ff8f72' },
};

const initialThemes: Theme[] = [
  { id: 'greenhouse', title: 'Greenhouse After Dark', category: 'Nature', description: 'ঘন পাতার ছায়া, নরম আলো আর গভীর রাত—focus mode-এর জন্য।', creator: 'Nila Rahman', downloads: 2840, added: '২ দিন আগে', tags: ['Focus', 'Dark', '4K'], variant: 'mint', featured: true },
  { id: 'signal-bloom', title: 'Signal Bloom', category: 'Aurora', description: 'একটি ধীর, উজ্জ্বল horizon—রাত জাগা desktop-এর জন্য।', creator: 'Ari Studio', downloads: 1940, added: '৫ দিন আগে', tags: ['Calm', 'Wide', 'Green'], variant: 'lime' },
  { id: 'quiet-terminal', title: 'Quiet Terminal', category: 'Minimal', description: 'শুধু প্রয়োজনটুকু—একটি clean, low-noise workspace।', creator: 'Bashful Objects', downloads: 1268, added: '১ সপ্তাহ আগে', tags: ['Mono', 'Work', 'Clean'], variant: 'blue' },
  { id: 'clay-orbit', title: 'Clay Orbit', category: 'Abstract', description: 'উষ্ণ clay tone আর soft geometry—screen-এ একটু বেশি মানবিকতা।', creator: 'Momo Lab', downloads: 982, added: '২ সপ্তাহ আগে', tags: ['Warm', 'Shape', 'Soft'], variant: 'coral' },
  { id: 'night-garden', title: 'Night Garden', category: 'Nature', description: 'বৃষ্টির পরের গাছপালা, একটু নীল, আর প্রচুর breathing room।', creator: 'Jui Karim', downloads: 764, added: '৩ সপ্তাহ আগে', tags: ['Blue', 'Rain', 'Slow'], variant: 'violet' },
  { id: 'pixel-sunday', title: 'Pixel Sunday', category: 'Retro', description: 'পুরনো game room-এর উষ্ণতা, নতুন desktop-এর sharpness।', creator: 'Studio 1997', downloads: 611, added: '১ মাস আগে', tags: ['Fun', 'CRT', 'Color'], variant: 'coral' },
];

const categories: Array<'সব' | Category> = ['সব', 'Aurora', 'Minimal', 'Nature', 'Abstract', 'Retro'];
const acceptedTypes = '.zip,.rar,.7z,.theme,.themepack';

function App() {
  const [themes, setThemes] = useState(initialThemes);
  const [category, setCategory] = useState<'সব' | Category>('সব');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 3600); return () => window.clearTimeout(id); }, [toast]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSelectedTheme(null); setUploadOpen(false); setFilterOpen(false); } };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, []);

  const filteredThemes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = themes.filter((theme) => {
      const matchesCategory = category === 'সব' || theme.category === category;
      const haystack = [theme.title, theme.description, theme.creator, theme.category, theme.fileName || '', ...theme.tags].join(' ').toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
    return filtered.sort((a, b) => sort === 'popular' ? b.downloads - a.downloads : sort === 'name' ? a.title.localeCompare(b.title) : themes.indexOf(a) - themes.indexOf(b));
  }, [themes, category, search, sort]);

  const showToast = (title: string, message: string) => setToast({ title, message });
  const toggleFavorite = (id: string) => setFavorites((current) => { const next = new Set(current); const added = !next.has(id); added ? next.add(id) : next.delete(id); const theme = themes.find((item) => item.id === id); if (theme) showToast(added ? 'Collection-এ রাখা হয়েছে' : 'Collection থেকে সরানো হয়েছে', theme.title); return next; });
  const downloadTheme = (theme: Theme) => {
    setThemes((current) => current.map((item) => item.id === theme.id ? { ...item, downloads: item.downloads + 1 } : item));
    const fallback = `GreenHorizon theme pack\n${theme.title}\nCreator: ${theme.creator}`;
    const link = document.createElement('a');
    link.href = theme.fileBlobUrl || theme.fileUrl || `data:text/plain;charset=utf-8,${encodeURIComponent(fallback)}`;
    link.download = theme.fileName || `${theme.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    link.target = '_blank'; link.rel = 'noreferrer'; document.body.appendChild(link); link.click(); link.remove();
    showToast('ডাউনলোড শুরু হয়েছে', theme.fileName || `${theme.title} theme pack`);
  };
  const publishTheme = (draft: Omit<Theme, 'id' | 'downloads' | 'added'>) => {
    setThemes((current) => [{ ...draft, id: `upload-${Date.now()}`, downloads: 0, added: 'এইমাত্র' }, ...current]);
    setUploadOpen(false); showToast('থিমপ্যাক লাইভ হয়েছে', `${draft.fileName || draft.title} এই session-এর gallery-তে যোগ হয়েছে`);
  };

  return <div className="app-shell" id="top">
    <header className="site-header">
      <a className="brand" href="#top"><img src="/logo.svg" alt="" className="brand-mark" /><span>green<span>horizon</span></span></a>
      <nav className={`main-nav ${menuOpen ? 'open' : ''}`}><a href="#archive" onClick={() => setMenuOpen(false)}>থিমপ্যাক গ্যালারি</a><a href="#studio" onClick={() => setMenuOpen(false)}>ভিজ্যুয়াল স্টুডিও</a><button className="nav-upload" onClick={() => { setUploadOpen(true); setMenuOpen(false); }}><Plus size={15} /> থিমপ্যাক আপলোড</button></nav>
      <div className="header-right"><span className="live-badge"><i /> CURATED DAILY</span><button className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="মেনু"><Menu size={19} /></button></div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="spark-dot" /> A DESKTOP THEME CLUB <span>· 2026</span></div><h1>Make your screen feel <em>like yours.</em></h1><p>সুন্দর theme pack খুঁজে নিন, সরাসরি upload করুন, আর আপনার desktop-কে প্রতিদিনের mood-এ বদলে দিন।</p><div className="hero-actions"><button className="button primary" onClick={() => document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' })}>থিমপ্যাক খুঁজুন <ArrowUpRight size={17} /></button><button className="button outline" onClick={() => setUploadOpen(true)}><CloudUpload size={16} /> সরাসরি আপলোড করুন</button></div><div className="hero-proof"><span><Star size={14} fill="currentColor" /> 4.9/5 community mood</span><span><FileCheck2 size={14} /> .zip থেকে .theme</span></div></div>
        <HeroIllustration />
        <div className="hero-stats"><div><strong>24<span>+</span></strong><small>curated packs</small></div><div><strong>06</strong><small>visual moods</small></div><div><strong>100<span>%</span></strong><small>free downloads</small></div><p>আপনার screen<br />আপনার rules.</p></div>
      </section>

      <section className="mood-strip"><div className="strip-label"><Sparkles size={16} /> PICK YOUR MOOD</div><div className="mood-list"><span>slow mornings</span><span>deep focus</span><span>night shift</span><span>soft chaos</span><span>pixel joy</span></div><ArrowUpRight className="strip-arrow" size={18} /></section>

      <section className="archive" id="archive"><div className="section-top"><div><p className="kicker">THE LIVING ARCHIVE / {String(filteredThemes.length).padStart(2, '0')}</p><h2>A better backdrop<br /><em>for every day.</em></h2></div><p>প্রতিটি pack hand-picked, preview-ready এবং আপনার setup-এর জন্য আলাদা করে ভাবা।</p></div>
        <div className="toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম, mood বা creator খুঁজুন" aria-label="থিমপ্যাক খুঁজুন" />{search && <button onClick={() => setSearch('')} aria-label="সার্চ মুছুন"><X size={14} /></button>}</div><div className="toolbar-actions"><button className={`filter-button ${filterOpen ? 'active' : ''}`} onClick={() => setFilterOpen((v) => !v)}><Filter size={15} /> Filter {category !== 'সব' && <b>1</b>}</button><label className="sort"><span>সাজান</span><select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}><option value="newest">নতুন আগে</option><option value="popular">জনপ্রিয় আগে</option><option value="name">নাম অনুযায়ী</option></select><ChevronDown size={14} /></label></div></div>
        {filterOpen && <div className="mobile-filter"><CategoryPills category={category} setCategory={setCategory} themes={themes} /></div>}
        <div className="archive-meta"><div className="desktop-filter"><CategoryPills category={category} setCategory={setCategory} themes={themes} /></div><span>{filteredThemes.length}টি theme pack</span></div>
        {filteredThemes.length ? <div className="theme-grid">{filteredThemes.map((theme, index) => <ThemeCard key={theme.id} theme={theme} index={index} favorite={favorites.has(theme.id)} onFavorite={() => toggleFavorite(theme.id)} onPreview={() => setSelectedTheme(theme)} onDownload={() => downloadTheme(theme)} />)}</div> : <div className="empty"><Search size={24} /><h3>এই mood-এ কিছু পাওয়া যায়নি</h3><p>অন্য keyword বা category দিয়ে চেষ্টা করুন।</p><button className="button outline" onClick={() => { setSearch(''); setCategory('সব'); }}>সব pack দেখুন</button></div>}
      </section>

      <IllustrationShowcase />

      <section className="process" id="process"><div className="section-top"><div><p className="kicker">FROM IDEA TO DESKTOP</p><h2>আপনার pack.<br /><em>আপনার pace.</em></h2></div><p>কোনো complicated setup নয়। তিনটি ছোট step, তারপর আপনার screen একদম অন্যরকম।</p></div><div className="process-grid"><ProcessStep number="01" icon={<Search size={19} />} title="একটি mood বাছুন" text="Curated gallery থেকে আপনার vibe-এর pack খুঁজুন।" /><ProcessStep number="02" icon={<Download size={19} />} title="এক ক্লিকে download" text="Theme pack সরাসরি আপনার Downloads-এ চলে যাবে।" /><ProcessStep number="03" icon={<Upload size={19} />} title="নিজেরটা upload" text=".zip, .rar, .7z বা .theme pack সরাসরি শেয়ার করুন।" /></div></section>
    </main>

    <footer className="site-footer"><div className="footer-brand"><img src="/logo.svg" alt="" className="brand-mark" /><span>green<span>horizon</span></span></div><span>Curated calm for a better desktop.</span><div>© 2026 / built for your screen</div></footer>
    {selectedTheme && <ThemeDialog theme={selectedTheme} favorite={favorites.has(selectedTheme.id)} onClose={() => setSelectedTheme(null)} onFavorite={() => toggleFavorite(selectedTheme.id)} onDownload={() => downloadTheme(selectedTheme)} />}
    {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} onSubmit={publishTheme} />}
    {toast && <div className="toast"><div className="toast-check"><Check size={15} /></div><div><b>{toast.title}</b><span>{toast.message}</span></div><button onClick={() => setToast(null)} aria-label="বন্ধ করুন"><X size={15} /></button></div>}
  </div>;
}

function CategoryPills({ category, setCategory, themes }: { category: 'সব' | Category; setCategory: (value: 'সব' | Category) => void; themes: Theme[] }) {
  return <div className="category-pills">{categories.map((item) => <button key={item} className={item === category ? 'selected' : ''} onClick={() => setCategory(item)}>{item === 'সব' ? 'সব' : categoryMeta[item].label}<small>{item === 'সব' ? themes.length : themes.filter((theme) => theme.category === item).length}</small></button>)}</div>;
}

function HeroIllustration() {
  return <div className="hero-scene"><div className="scene-orbit orbit-a" /><div className="scene-orbit orbit-b" /><div className="scene-star star-a">✦</div><div className="scene-star star-b">✦</div><div className="scene-label label-top">GH / 001 <span>LIVE PREVIEW</span></div><div className="scene-note"><span>01</span><b>Find your<br />visual rhythm.</b></div><div className="monitor"><div className="monitor-top"><i /><i /><i /></div><div className="monitor-screen"><div className="screen-sun" /><div className="screen-arc arc-one" /><div className="screen-arc arc-two" /><div className="screen-line" /></div><div className="monitor-stand" /></div><div className="scene-pill"><span className="pill-dot" /> soft signal <ArrowUpRight size={14} /></div><div className="scene-label label-bottom">DESKTOP / AESTHETIC PACK</div></div>;
}

function IllustrationShowcase() {
  return <section className="illustration-showcase" id="studio"><div className="showcase-intro"><p className="kicker">THE GREENHORIZON VISUAL LANGUAGE</p><h2>Not just a theme.<br /><em>A whole feeling.</em></h2><p>প্রতিটি mood-এর পেছনে আছে আলাদা একটা ছোট universe—যেটা আপনার screen-কে শুধু সুন্দর নয়, নিজের মতো করে তোলে।</p><button className="button outline" onClick={() => document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' })}>illustrated packs দেখুন <ArrowUpRight size={16} /></button></div><div className="illustration-rail"><ArtPanel kind="focus" number="01" eyebrow="FOCUS MODE" title="চোখ রাখুন কাজে" /><ArtPanel kind="mood" number="02" eyebrow="MOOD SHIFT" title="আলো বদলান" /><ArtPanel kind="create" number="03" eyebrow="CREATOR MODE" title="নিজেরটা বানান" /></div></section>;
}

function ArtPanel({ kind, number, eyebrow, title }: { kind: 'focus' | 'mood' | 'create'; number: string; eyebrow: string; title: string }) {
  return <article className={`art-panel art-panel-${kind}`}><div className="art-panel-top"><span>{number}</span><span>{eyebrow}</span></div><div className="art-panel-canvas"><div className="panel-ring ring-one" /><div className="panel-ring ring-two" /><svg viewBox="0 0 220 170" aria-hidden="true">{kind === 'focus' && <><path className="focus-line" d="M24 117C53 61 92 52 112 96c16 35 36 37 84-25" /><circle className="focus-orb" cx="112" cy="95" r="22" /><circle className="focus-core" cx="112" cy="95" r="7" /><path className="focus-star" d="M49 39l4 9 9 4-9 4-4 9-4-9-9-4 9-4 4-9z" /></>}{kind === 'mood' && <><path className="mood-arc" d="M28 133C45 55 122 34 192 71" /><circle className="mood-sun" cx="121" cy="78" r="30" /><path className="mood-ray" d="M121 30v-13M121 139v-13M73 78H60M182 78h-13" /><circle className="mood-dot dot-a" cx="48" cy="61" r="4" /><circle className="mood-dot dot-b" cx="170" cy="120" r="6" /></>}{kind === 'create' && <><rect className="file-body" x="67" y="31" width="82" height="105" rx="9" /><path className="file-fold" d="M123 31v27h26" /><path className="file-mark" d="M89 85h39M89 101h24" /><circle className="create-plus" cx="57" cy="120" r="20" /><path className="create-cross" d="M57 111v18M48 120h18" /><path className="create-star" d="M174 37l4 9 9 4-9 4-4 9-4-9-9-4 9-4 4-9z" /></>}</svg></div><div className="art-panel-bottom"><span>{title}</span><ArrowUpRight size={17} /></div></article>;
}

function ThemeArtwork({ variant }: { variant: Variant }) {
  return <div className={`theme-art art-${variant}`}><div className="art-label"><span>GH / {variant.toUpperCase()}</span><span>LIVE PREVIEW</span></div><div className="art-orb orb-one" /><div className="art-orb orb-two" /><div className="art-grid" /><div className="art-wave" /><span className="art-chip">OPEN PREVIEW <ArrowUpRight size={13} /></span></div>;
}

function ThemeCard({ theme, index, favorite, onFavorite, onPreview, onDownload }: { key?: string; theme: Theme; index: number; favorite: boolean; onFavorite: () => void; onPreview: () => void; onDownload: () => void }) {
  return <article className="theme-card" style={{ animationDelay: `${index * 70}ms` }}><button className="theme-art-button" onClick={onPreview} aria-label={`${theme.title} preview দেখুন`}><ThemeArtwork variant={theme.variant} /></button><div className="theme-info"><div className="meta"><span className="category-label" style={{ color: categoryMeta[theme.category].color }}>{categoryMeta[theme.category].label}</span><span>{theme.added}</span></div><button className="title-button" onClick={onPreview}><h3>{theme.title}</h3><ArrowUpRight size={16} /></button><p>{theme.description}</p><div className="tags">{theme.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="card-footer"><span className="byline">by <b>{theme.creator}</b></span><span className="downloads"><Download size={13} /> {formatDownloads(theme.downloads)}</span><button className={`favorite ${favorite ? 'saved' : ''}`} onClick={onFavorite} aria-label="পছন্দের তালিকায় রাখুন"><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /></button><button className="download-mini" onClick={onDownload} aria-label={`${theme.title} download`}><ArrowDownToLine size={15} /></button></div></div></article>;
}

function ThemeDialog({ theme, favorite, onClose, onFavorite, onDownload }: { theme: Theme; favorite: boolean; onClose: () => void; onFavorite: () => void; onDownload: () => void }) {
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="theme-dialog" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="বন্ধ করুন"><X size={18} /></button><ThemeArtwork variant={theme.variant} /><div className="dialog-info"><div className="meta"><span className="category-label" style={{ color: categoryMeta[theme.category].color }}>{categoryMeta[theme.category].label}</span><span>{theme.added} · {formatDownloads(theme.downloads)} downloads</span></div><h2>{theme.title}</h2><p>{theme.description}</p><div className="dialog-specs"><div><small>CREATOR</small><b>{theme.creator}</b></div><div><small>PACK FILE</small><b>{theme.fileName || 'curated-theme-pack'}</b></div><div><small>FORMAT</small><b>4K · 16:9</b></div></div><div className="dialog-actions"><button className="button primary" onClick={onDownload}><ArrowDownToLine size={16} /> {theme.fileName ? 'ফাইল ডাউনলোড করুন' : 'প্যাক ডাউনলোড করুন'}</button><button className={`button outline ${favorite ? 'selected' : ''}`} onClick={onFavorite}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'সংরক্ষিত' : 'সংরক্ষণ'}</button></div></div></section></div>;
}

function UploadDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (theme: Omit<Theme, 'id' | 'downloads' | 'added'>) => void }) {
  const [form, setForm] = useState({ title: '', creator: '', category: 'Aurora' as Category, description: '', file: null as File | null });
  const [dragging, setDragging] = useState(false); const [error, setError] = useState('');
  const chooseFile = (file?: File) => { if (!file) return; if (file.size > 200 * 1024 * 1024) { setError('ফাইল 200MB-এর মধ্যে রাখুন।'); return; } setForm((current) => ({ ...current, file })); setError(''); };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => chooseFile(e.target.files?.[0]);
  const onDrop = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files?.[0]); };
  const submit = (e: FormEvent) => { e.preventDefault(); if (!form.title.trim() || !form.creator.trim() || !form.description.trim() || !form.file) { setError('নাম, creator, description এবং theme-pack file দিন।'); return; } onSubmit({ title: form.title.trim(), creator: form.creator.trim(), category: form.category, description: form.description.trim(), tags: ['New', categoryMeta[form.category].label], variant: form.category === 'Aurora' ? 'lime' : form.category === 'Minimal' ? 'blue' : form.category === 'Nature' ? 'mint' : form.category === 'Abstract' ? 'violet' : 'coral', fileName: form.file.name, fileBlobUrl: URL.createObjectURL(form.file) }); };
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="upload-dialog" role="dialog" aria-modal="true"><div className="upload-heading"><div><p className="kicker">CREATOR DROP / DIRECT UPLOAD</p><h2>আপনার pack <em>শেয়ার করুন।</em></h2><p>ফাইলটা সরাসরি বেছে নিন—কোনো URL paste করার দরকার নেই।</p></div><button className="modal-close" onClick={onClose} aria-label="বন্ধ করুন"><X size={18} /></button></div><form onSubmit={submit}><div className="form-fields"><label><span>থিমের নাম *</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="যেমন: Morning Moss" /></label><label><span>Creator name *</span><input value={form.creator} onChange={(e) => setForm({ ...form, creator: e.target.value })} placeholder="আপনার নাম" /></label><label><span>Category</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>{(Object.keys(categoryMeta) as Category[]).map((item) => <option key={item} value={item}>{categoryMeta[item].label}</option>)}</select></label><label className="wide"><span>Description *</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="এই pack-টা কেমন feeling দেয়?" rows={3} /></label><label className={`dropzone wide ${dragging ? 'dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><input type="file" accept={acceptedTypes} onChange={onFileChange} /><span className="drop-icon"><FileArchive size={25} /></span><strong>{form.file ? form.file.name : 'থিমপ্যাক ফাইল এখানে drop করুন'}</strong><small>{form.file ? formatFileSize(form.file.size) : 'অথবা ক্লিক করে বেছে নিন · .zip · .rar · .7z · .theme · max 200MB'}</small><em><Upload size={14} /> browse files</em></label></div>{error && <p className="form-error">{error}</p>}<div className="upload-submit"><span><FileCheck2 size={15} /> সরাসরি browser থেকে file pack নেওয়া হবে</span><button className="button primary" type="submit"><Upload size={16} /> গ্যালারিতে publish করুন</button></div></form></section></div>;
}

function ProcessStep({ number, icon, title, text }: { number: string; icon: ReactNode; title: string; text: string }) { return <div className="process-step"><span>{number}</span>{icon}<h3>{title}</h3><p>{text}</p></div>; }
function formatDownloads(value: number) { return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : String(value); }
function formatFileSize(value: number) { return value > 1024 * 1024 ? `${(value / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`; }

export default App;
