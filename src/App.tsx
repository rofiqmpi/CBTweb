import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  Filter,
  Globe2,
  Heart,
  Menu,
  Monitor,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react';

type Category = 'Aurora' | 'Minimal' | 'Nature' | 'Abstract' | 'Retro';
type SortMode = 'newest' | 'popular' | 'name';

type Theme = {
  id: string;
  title: string;
  category: Category;
  description: string;
  creator: string;
  downloads: number;
  added: string;
  tags: string[];
  visual: string;
  imageUrl?: string;
  fileUrl?: string;
  featured?: boolean;
};

type Toast = { title: string; message: string } | null;

const categoryMeta: Record<Category, { label: string; color: string }> = {
  Aurora: { label: 'অরোরা', color: '#D7FF4F' },
  Minimal: { label: 'মিনিমাল', color: '#F1E9D8' },
  Nature: { label: 'প্রকৃতি', color: '#A7D3A6' },
  Abstract: { label: 'অ্যাবস্ট্রাক্ট', color: '#D4B4FF' },
  Retro: { label: 'রেট্রো', color: '#FFB28D' },
};

const defaultThemes: Theme[] = [
  {
    id: 'greenhouse-after-dark',
    title: 'Greenhouse After Dark',
    category: 'Nature',
    description: 'ঘন পাতার ছায়া, নরম আলো আর গভীর রাত—focus mode-এর জন্য তৈরি।',
    creator: 'Nila Rahman',
    downloads: 2840,
    added: '২ দিন আগে',
    tags: ['Focus', 'Dark', '4K'],
    visual: 'radial-gradient(circle at 65% 18%, rgba(215,255,79,.42), transparent 20%), radial-gradient(circle at 25% 100%, rgba(52,92,72,.95), transparent 46%), linear-gradient(135deg, #19251f 0%, #0d110f 68%)',
    featured: true,
  },
  {
    id: 'signal-bloom',
    title: 'Signal Bloom',
    category: 'Aurora',
    description: 'একটি ধীর, উজ্জ্বল horizon—রাত জাগা desktop-এর জন্য।',
    creator: 'Ari Studio',
    downloads: 1940,
    added: '৫ দিন আগে',
    tags: ['Calm', 'Green', 'Wide'],
    visual: 'radial-gradient(ellipse at 72% 35%, rgba(216,255,79,.92) 0%, rgba(145,177,68,.48) 16%, transparent 38%), linear-gradient(126deg, #111612 3%, #273628 58%, #0c100e 100%)',
  },
  {
    id: 'quiet-terminal',
    title: 'Quiet Terminal',
    category: 'Minimal',
    description: 'শুধু প্রয়োজনটুকু—একটি clean, low-noise workspace।',
    creator: 'Bashful Objects',
    downloads: 1268,
    added: '১ সপ্তাহ আগে',
    tags: ['Mono', 'Work', 'Clean'],
    visual: 'linear-gradient(150deg, #e8e3d7 0%, #f5f1e6 44%, #9da997 44%, #687463 100%)',
  },
  {
    id: 'clay-orbit',
    title: 'Clay Orbit',
    category: 'Abstract',
    description: 'উষ্ণ clay tone আর soft geometry—screen-এ একটু বেশি মানবিকতা।',
    creator: 'Momo Lab',
    downloads: 982,
    added: '২ সপ্তাহ আগে',
    tags: ['Warm', 'Shape', 'Soft'],
    visual: 'radial-gradient(circle at 60% 42%, #f8d3a6 0 12%, transparent 13%), radial-gradient(ellipse at 62% 42%, transparent 0 22%, #b96c54 23% 31%, transparent 32%), linear-gradient(135deg, #4a2a27 0%, #a86551 58%, #e6b27d 100%)',
  },
  {
    id: 'night-garden',
    title: 'Night Garden',
    category: 'Nature',
    description: 'বৃষ্টির পরের গাছপালা, একটু নীল, আর প্রচুর breathing room।',
    creator: 'Jui Karim',
    downloads: 764,
    added: '৩ সপ্তাহ আগে',
    tags: ['Blue', 'Rain', 'Slow'],
    visual: 'radial-gradient(circle at 38% 24%, rgba(123,204,176,.46), transparent 17%), radial-gradient(circle at 75% 75%, rgba(50,93,109,.65), transparent 40%), linear-gradient(145deg, #172b32, #0d1820 62%, #263c3c)',
  },
  {
    id: 'pixel-sunday',
    title: 'Pixel Sunday',
    category: 'Retro',
    description: 'পুরনো game room-এর উষ্ণতা, নতুন desktop-এর sharpness।',
    creator: 'Studio 1997',
    downloads: 611,
    added: '১ মাস আগে',
    tags: ['Fun', 'CRT', 'Color'],
    visual: 'linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(140deg, #261a46, #7f367c 48%, #e27b4f 100%)',
  },
];

const categories: Array<'সব' | Category> = ['সব', 'Aurora', 'Minimal', 'Nature', 'Abstract', 'Retro'];

function App() {
  const [themes, setThemes] = useState<Theme[]>(defaultThemes);
  const [category, setCategory] = useState<'সব' | Category>('সব');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedTheme(null);
        setIsUploadOpen(false);
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredThemes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = themes.filter((theme) => {
      const matchesCategory = category === 'সব' || theme.category === category;
      const searchable = [theme.title, theme.description, theme.creator, theme.category, ...theme.tags].join(' ').toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });

    return [...next].sort((a, b) => {
      if (sort === 'popular') return b.downloads - a.downloads;
      if (sort === 'name') return a.title.localeCompare(b.title);
      return themes.findIndex((theme) => theme.id === a.id) - themes.findIndex((theme) => theme.id === b.id);
    });
  }, [category, search, sort, themes]);

  const showToast = (title: string, message: string) => setToast({ title, message });

  const toggleFavorite = (id: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      const added = !next.has(id);
      if (added) next.add(id);
      else next.delete(id);
      const theme = themes.find((item) => item.id === id);
      if (theme) showToast(added ? 'সংরক্ষণ করা হয়েছে' : 'সংরক্ষণ থেকে সরানো হয়েছে', added ? `${theme.title} আপনার collection-এ আছে।` : `${theme.title} collection থেকে সরানো হয়েছে।`);
      return next;
    });
  };

  const downloadTheme = (theme: Theme) => {
    setThemes((current) => current.map((item) => item.id === theme.id ? { ...item, downloads: item.downloads + 1 } : item));
    const fileContents = `GreenHorizon theme\n${theme.title}\nCategory: ${theme.category}\nCreator: ${theme.creator}\n\nApply this theme pack from GreenHorizon.`;
    const href = theme.fileUrl || `data:text/plain;charset=utf-8,${encodeURIComponent(fileContents)}`;
    const link = document.createElement('a');
    link.href = href;
    link.download = `${theme.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'greenhorizon-theme'}.txt`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('ডাউনলোড শুরু হয়েছে', `${theme.title} আপনার desktop-এর জন্য প্রস্তুত।`);
  };

  const scrollToBrowse = () => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="GreenHorizon home">
          <img src="/logo.svg" alt="" className="brand-mark" />
          <span className="brand-name">green<span>horizon</span></span>
        </a>
        <nav className={`main-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="প্রধান নেভিগেশন">
          <a href="#browse" onClick={() => setMobileMenuOpen(false)}>থিম গ্যালারি</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>কীভাবে কাজ করে</a>
          <button className="nav-upload" onClick={() => { setIsUploadOpen(true); setMobileMenuOpen(false); }}><Plus size={15} /> থিম আপলোড করুন</button>
        </nav>
        <div className="header-actions">
          <span className="online-status"><i /> লাইভ গ্যালারি</span>
          <button className="icon-button menu-button" aria-label="মেনু" onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={19} /></button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> CURATED PC THEMES <span className="eyebrow-year">· 2026</span></p>
            <h1>আপনার desktop-এর <em>নতুন দিগন্ত।</em></h1>
            <p className="hero-description">শান্ত, সুন্দর এবং মনোযোগ ধরে রাখার মতো PC themes—যেখানে প্রতিটি pixel নিজের একটা mood তৈরি করে।</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={scrollToBrowse}>থিম ঘুরে দেখুন <ArrowUpRight size={17} /></button>
              <button className="button button-ghost" onClick={() => setIsUploadOpen(true)}>আমি তৈরি করি <Upload size={16} /></button>
            </div>
            <div className="hero-note"><Sparkles size={14} /> প্রতি সপ্তাহে নতুন curated drop</div>
          </div>
          <div className="hero-art" aria-label="GreenHorizon abstract aurora preview" role="img">
            <div className="hero-art-overlay" />
            <div className="hero-art-label"><span>GH / 001</span><span>LIVE PREVIEW</span></div>
            <div className="hero-art-caption"><span className="caption-line" /> <span>Signal in the quiet</span></div>
          </div>
          <div className="hero-bottom-line">
            <div className="hero-stat"><strong>24<span>+</span></strong><span>curated themes</span></div>
            <div className="hero-stat"><strong>06</strong><span>distinct moods</span></div>
            <div className="hero-stat"><strong>100<span>%</span></strong><span>free to download</span></div>
            <p>একবার খুঁজে নিন। প্রতিদিন ব্যবহার করুন।</p>
          </div>
        </section>

        <section className="featured-section" aria-labelledby="featured-title">
          <div className="section-intro">
            <div>
              <p className="section-kicker">EDITOR'S PICK / 01</p>
              <h2 id="featured-title">এই সপ্তাহের <span>নির্বাচন।</span></h2>
            </div>
            <p>কম distraction, বেশি intention—এই mood-টা আপনার জন্য।</p>
          </div>
          <div className="featured-card" onClick={() => setSelectedTheme(themes[0])} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelectedTheme(themes[0]); }}>
            <div className="featured-visual" style={{ background: themes[0].visual }}>
              <div className="featured-visual-label"><span>GH / NATURE</span><span>4K · 16:9</span></div>
              <div className="featured-orbit orbit-one" /><div className="featured-orbit orbit-two" />
              <div className="featured-sun" />
              <div className="featured-scanline" />
            </div>
            <div className="featured-info">
              <div className="card-meta-row"><span className="theme-category">{categoryMeta[themes[0].category].label}</span><span>{themes[0].added}</span></div>
              <h3>{themes[0].title}</h3>
              <p>{themes[0].description}</p>
              <div className="featured-footer"><span>by <strong>{themes[0].creator}</strong></span><span>{formatDownloads(themes[0].downloads)} downloads <ArrowUpRight size={15} /></span></div>
            </div>
            <button className="card-open" aria-label={`${themes[0].title} preview খুলুন`}><ArrowUpRight size={18} /></button>
          </div>
        </section>

        <section className="browse-section" id="browse" aria-labelledby="browse-title">
          <div className="browse-heading">
            <div>
              <p className="section-kicker">THE ARCHIVE / {String(filteredThemes.length).padStart(2, '0')}</p>
              <h2 id="browse-title">আপনার <span>mood</span> খুঁজে নিন।</h2>
            </div>
            <p className="browse-aside">প্রতিটি থিম hand-picked। কারণ আপনার desktop-ও একটা space।</p>
          </div>

          <div className="browse-toolbar">
            <div className="search-wrap"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="থিম, mood বা creator খুঁজুন..." aria-label="থিম খুঁজুন" />{search && <button aria-label="সার্চ মুছুন" onClick={() => setSearch('')}><X size={14} /></button>}</div>
            <div className="toolbar-right">
              <button className={`filter-toggle ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen((open) => !open)}><SlidersHorizontal size={16} /> ফিল্টার <span>{category === 'সব' ? '' : '1'}</span></button>
              <label className="sort-select"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="সাজানোর ধরন"><option value="newest">নতুন আগে</option><option value="popular">জনপ্রিয় আগে</option><option value="name">নাম অনুযায়ী</option></select><ChevronDown size={14} /></label>
            </div>
          </div>

          {isFilterOpen && <div className="filter-panel"><div className="filter-panel-label"><Filter size={15} /> CATEGORY</div><div className="category-pills">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item === 'সব' ? 'সব থিম' : categoryMeta[item].label}<span>{item === 'সব' ? themes.length : themes.filter((theme) => theme.category === item).length}</span></button>)}</div></div>}

          <div className="active-filters">
            <div className="category-pills desktop-pills">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item === 'সব' ? 'সব থিম' : categoryMeta[item].label}<span>{item === 'সব' ? themes.length : themes.filter((theme) => theme.category === item).length}</span></button>)}</div>
            <span className="results-copy">{filteredThemes.length}টি থিম দেখানো হচ্ছে</span>
          </div>

          {filteredThemes.length > 0 ? <div className="theme-grid">{filteredThemes.map((theme, index) => <ThemeCard key={theme.id} theme={theme} index={index} isFavorite={favoriteIds.has(theme.id)} onFavorite={() => toggleFavorite(theme.id)} onPreview={() => setSelectedTheme(theme)} onDownload={() => downloadTheme(theme)} />)}</div> : <div className="empty-state"><div className="empty-icon"><Search size={24} /></div><h3>এই mood-এ এখনও কিছু নেই</h3><p>অন্য শব্দ বা category দিয়ে আবার খুঁজে দেখুন।</p><button className="button button-secondary" onClick={() => { setSearch(''); setCategory('সব'); }}>সব থিম দেখুন</button></div>}
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-heading"><p className="section-kicker">SIMPLE BY DESIGN</p><h2>Desktop সাজানো <span>এতটা সহজ।</span></h2></div>
          <div className="steps"><div className="step"><span>01</span><Monitor size={19} /><h3>একটি mood বাছুন</h3><p>আপনার কাজ, বিশ্রাম বা রাতজাগার জন্য ঠিক vibe-টা খুঁজে নিন।</p></div><div className="step"><span>02</span><ArrowDownToLine size={19} /><h3>ডাউনলোড করুন</h3><p>একটি ক্লিকেই theme pack আপনার Downloads folder-এ চলে যাবে।</p></div><div className="step"><span>03</span><Zap size={19} /><h3>নিজের মতো করুন</h3><p>আপনার setup-এ apply করুন, share করুন, আর চাইলে নিজেরটা upload করুন।</p></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><img src="/logo.svg" alt="" className="brand-mark" /><span>green<span>horizon</span></span></div><p>Curated calm for a better desktop.</p><div className="footer-right"><span><Globe2 size={14} /> বাংলা / English</span><span>© 2026 GreenHorizon</span></div></footer>

      {selectedTheme && <ThemeDialog theme={selectedTheme} isFavorite={favoriteIds.has(selectedTheme.id)} onClose={() => setSelectedTheme(null)} onFavorite={() => toggleFavorite(selectedTheme.id)} onDownload={() => downloadTheme(selectedTheme)} />}
      {isUploadOpen && <UploadDialog onClose={() => setIsUploadOpen(false)} onSubmit={(theme) => { setThemes((current) => [theme, ...current]); setIsUploadOpen(false); showToast('থিম গ্যালারিতে যোগ হয়েছে', `${theme.title} এখন সবার জন্য live।`); }} />}
      {toast && <div className="toast" role="status"><div className="toast-icon"><Check size={15} /></div><div><strong>{toast.title}</strong><span>{toast.message}</span></div><button aria-label="নোটিফিকেশন বন্ধ করুন" onClick={() => setToast(null)}><X size={15} /></button></div>}
    </div>
  );
}

function ThemeCard({ theme, index, isFavorite, onFavorite, onPreview, onDownload }: { key?: string; theme: Theme; index: number; isFavorite: boolean; onFavorite: () => void; onPreview: () => void; onDownload: () => void }) {
  return <article className="theme-card" style={{ animationDelay: `${index * 60}ms` }}>
    <button className="theme-visual" onClick={onPreview} style={{ background: theme.imageUrl ? `linear-gradient(180deg, rgba(11,14,11,.02), rgba(11,14,11,.25)), url(${theme.imageUrl}) center/cover, ${theme.visual}` : theme.visual }} aria-label={`${theme.title} preview দেখুন`}>
      <span className="visual-topline"><span>GH / {theme.category.toUpperCase()}</span><span>LIVE PREVIEW</span></span>
      <span className="visual-grain" />
      <span className="preview-chip">PREVIEW <ArrowUpRight size={13} /></span>
    </button>
    <div className="theme-card-body"><div className="card-meta-row"><span className="theme-category" style={{ color: categoryMeta[theme.category].color }}>{categoryMeta[theme.category].label}</span><span>{theme.added}</span></div><button className="theme-title-button" onClick={onPreview}><h3>{theme.title}</h3><ArrowUpRight size={16} /></button><p>{theme.description}</p><div className="tag-row">{theme.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="theme-card-footer"><span className="creator">by <strong>{theme.creator}</strong></span><span className="download-count"><Download size={13} /> {formatDownloads(theme.downloads)}</span><button className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`} onClick={onFavorite} aria-label={isFavorite ? 'পছন্দের তালিকা থেকে সরান' : 'পছন্দের তালিকায় রাখুন'}><Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} /></button><button className="mini-download" onClick={onDownload} aria-label={`${theme.title} ডাউনলোড করুন`}><ArrowDownToLine size={15} /></button></div></div>
  </article>;
}

function ThemeDialog({ theme, isFavorite, onClose, onFavorite, onDownload }: { theme: Theme; isFavorite: boolean; onClose: () => void; onFavorite: () => void; onDownload: () => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="theme-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="dialog-close" onClick={onClose} aria-label="বন্ধ করুন"><X size={18} /></button><div className="dialog-visual" style={{ background: theme.imageUrl ? `url(${theme.imageUrl}) center/cover, ${theme.visual}` : theme.visual }}><span className="dialog-visual-code">GH / {theme.category.toUpperCase()}</span><span className="dialog-visual-note">DESKTOP THEME</span></div><div className="dialog-content"><div className="card-meta-row"><span className="theme-category" style={{ color: categoryMeta[theme.category].color }}>{categoryMeta[theme.category].label}</span><span>{theme.added} · {formatDownloads(theme.downloads)} downloads</span></div><h2 id="dialog-title">{theme.title}</h2><p>{theme.description}</p><div className="dialog-details"><div><span>CREATOR</span><strong>{theme.creator}</strong></div><div><span>FORMAT</span><strong>4K · 16:9</strong></div><div><span>MOOD</span><strong>{theme.tags.join(' · ')}</strong></div></div><div className="dialog-actions"><button className="button button-primary" onClick={onDownload}><ArrowDownToLine size={16} /> থিম ডাউনলোড করুন</button><button className={`button button-icon-text ${isFavorite ? 'selected' : ''}`} onClick={onFavorite}><Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}</button></div></div></section></div>;
}

function UploadDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (theme: Theme) => void }) {
  const [form, setForm] = useState({ title: '', category: 'Aurora' as Category, description: '', creator: '', imageUrl: '', fileUrl: '' });
  const [error, setError] = useState('');
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.creator.trim()) { setError('নাম, description এবং creator name লিখুন।'); return; }
    const visualByCategory: Record<Category, string> = { Aurora: 'radial-gradient(circle at 70% 30%, #d7ff4f 0 8%, transparent 28%), linear-gradient(135deg, #102015, #40553c 55%, #121912)', Minimal: 'linear-gradient(140deg, #f0ece2, #b9c1ae)', Nature: 'radial-gradient(circle at 38% 20%, #a7d3a6 0 6%, transparent 28%), linear-gradient(135deg, #173127, #0d1612)', Abstract: 'radial-gradient(circle at 64% 36%, #d4b4ff 0 10%, transparent 27%), linear-gradient(145deg, #271d43, #9d568a)', Retro: 'linear-gradient(135deg, #251a44, #d97858)' };
    onSubmit({ id: `uploaded-${Date.now()}`, title: form.title.trim(), category: form.category, description: form.description.trim(), creator: form.creator.trim(), downloads: 0, added: 'এইমাত্র', tags: ['New', categoryMeta[form.category].label], visual: visualByCategory[form.category], imageUrl: form.imageUrl.trim() || undefined, fileUrl: form.fileUrl.trim() || undefined });
  };
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="upload-dialog" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="upload-head"><div><p className="section-kicker">CREATOR DROP / NEW</p><h2 id="upload-title">আপনার থিম <span>শেয়ার করুন।</span></h2><p>আপনার desktop-এর mood-টা GreenHorizon community-তে দিন।</p></div><button className="dialog-close" onClick={onClose} aria-label="বন্ধ করুন"><X size={18} /></button></div><form onSubmit={submit}><div className="form-grid"><label><span>থিমের নাম *</span><input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="যেমন: Morning Moss" /></label><label><span>Creator name *</span><input value={form.creator} onChange={(event) => update('creator', event.target.value)} placeholder="আপনার নাম" /></label><label><span>Category</span><select value={form.category} onChange={(event) => update('category', event.target.value as Category)}>{(Object.keys(categoryMeta) as Category[]).map((item) => <option value={item} key={item}>{categoryMeta[item].label}</option>)}</select></label><label><span>Preview image URL <small>(optional)</small></span><input value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} placeholder="https://..." /></label><label className="full-field"><span>Description *</span><textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="এই থিমটা কেমন অনুভূতি দেয়?" rows={3} /></label><label className="full-field"><span>Theme file URL <small>(optional)</small></span><input value={form.fileUrl} onChange={(event) => update('fileUrl', event.target.value)} placeholder="https://...zip" /></label></div>{error && <p className="form-error">{error}</p>}<div className="upload-footer"><span><Check size={14} /> আপলোডের পর moderation ছাড়াই live preview</span><button className="button button-primary" type="submit"><Upload size={16} /> গ্যালারিতে প্রকাশ করুন</button></div></form></section></div>;
}

function formatDownloads(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : String(value);
}

export default App;
