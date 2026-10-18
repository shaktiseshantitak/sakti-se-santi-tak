import React, { useState } from 'react';
import { Star, Trash2, Pencil, Plus, Upload } from 'lucide-react';
import { useBooks } from '../../context/BookContext';
import type { Testimonial } from '../../types';

interface Props {
  /** The Control Panel's existing storage-upload helper (R2/Supabase). */
  onUpload: (file: File, folder: string, onSuccess: (url: string) => void, options?: { allowedMimeTypes?: string[] }) => void;
  notify: (message: string) => void;
}

const BLANK: Omit<Testimonial, 'id'> = {
  name: '', role: '', location: '', avatar: '', comment: '', rating: 5, verified: false,
};

// Only real web links or site-relative paths may be used as the photo.
const isSafeImageUrl = (v: string) => v === '' || /^https:\/\//i.test(v) || v.startsWith('/');

/**
 * Add / edit / delete the home-page "Reader Reflections" cards. Until now these
 * could only be changed in the database, which is why sample entries could not
 * be removed from the Control Panel. The home section hides itself when the
 * list is empty.
 */
export const TestimonialsManager: React.FC<Props> = ({ onUpload, notify }) => {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial } = useBooks();
  const [form, setForm] = useState<Omit<Testimonial, 'id'>>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const reset = () => { setForm(BLANK); setEditingId(null); setOpen(false); };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = {
      ...form,
      name: form.name.trim(),
      role: form.role.trim(),
      location: form.location.trim(),
      comment: form.comment.trim(),
      avatar: form.avatar.trim(),
      rating: Math.min(5, Math.max(1, Number(form.rating) || 5)),
    };
    if (!clean.name || !clean.comment) { notify('नाम और टिप्पणी ज़रूरी है / Name and comment are required.'); return; }
    if (!isSafeImageUrl(clean.avatar)) { notify('फोटो का लिंक https:// से शुरू होना चाहिए / Photo link must start with https://'); return; }
    if (editingId) { updateTestimonial(editingId, clean); notify('Testimonial updated.'); }
    else { addTestimonial(clean); notify('Testimonial added.'); }
    reset();
  };

  const edit = (t: Testimonial) => {
    const { id, ...rest } = t;
    setForm(rest); setEditingId(id); setOpen(true);
  };

  const remove = (t: Testimonial) => {
    if (window.confirm(`"${t.name}" का testimonial हटाएं? / Delete this testimonial?`)) {
      deleteTestimonial(t.id);
      notify('Testimonial deleted.');
    }
  };

  const input = 'w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="font-serif font-bold text-xl text-zinc-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Home Page Testimonials ({testimonials.length})
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            होम पेज के "साधकों एवं विद्वानों की सम्मतियां" कार्ड। सभी हटा देने पर यह सेक्शन अपने आप छुप जाएगा।
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => { setForm(BLANK); setEditingId(null); setOpen(true); }}
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> नया जोड़ें
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div><label className="text-[11px] font-bold block mb-1">नाम / Name *</label>
            <input className={input} maxLength={80} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-[11px] font-bold block mb-1">पेशा / Role (e.g. Teacher)</label>
            <input className={input} maxLength={80} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          <div><label className="text-[11px] font-bold block mb-1">शहर / Location</label>
            <input className={input} maxLength={60} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <div><label className="text-[11px] font-bold block mb-1">रेटिंग / Rating (1-5)</label>
            <input className={input} type="number" min={1} max={5} value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2"><label className="text-[11px] font-bold block mb-1">टिप्पणी / Comment *</label>
            <textarea className={input} rows={3} maxLength={500} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="text-[11px] font-bold block mb-1">फोटो / Photo (link या upload)</label>
            <div className="flex gap-2 items-center">
              <input className={input} placeholder="https://..." value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} />
              <label className="shrink-0 cursor-pointer flex items-center gap-1 bg-zinc-200 dark:bg-zinc-700 text-xs font-bold px-3 py-2 rounded-xl">
                <Upload className="w-4 h-4" /> Upload
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, 'testimonials', url => setForm(p => ({ ...p, avatar: url })), { allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] }); e.target.value = ''; }} />
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold sm:col-span-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.verified} onChange={e => setForm({ ...form, verified: e.target.checked })} />
            Verified purchaser का हरा निशान दिखाएं (सिर्फ़ तब जब ये सच में खरीदार हो)
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2 rounded-xl">{editingId ? 'अपडेट करें' : 'सेव करें'}</button>
            <button type="button" onClick={reset} className="text-xs font-bold px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600">रद्द करें</button>
          </div>
        </form>
      )}

      {testimonials.length === 0 && !open && (
        <p className="text-xs text-zinc-500 py-3">कोई testimonial नहीं है — होम पेज पर यह सेक्शन अभी छुपा हुआ है।</p>
      )}

      <div className="space-y-2">
        {testimonials.map(t => (
          <div key={t.id} className="flex items-start gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            {t.avatar ? <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" loading="lazy" /> : <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold">{t.name} <span className="font-normal text-zinc-500">• {t.role} • {t.location}</span> <span className="text-amber-600">{'★'.repeat(Math.round(t.rating))}</span></p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{t.comment}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button type="button" onClick={() => edit(t)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
              <button type="button" onClick={() => remove(t)} className="p-2 rounded-lg text-rose-700 hover:bg-rose-50" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
