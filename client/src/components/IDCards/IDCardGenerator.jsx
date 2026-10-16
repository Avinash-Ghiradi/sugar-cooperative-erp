import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Contact, Printer, Search, RefreshCw, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';

export default function IDCardGenerator() {
  const [shareholders, setShareholders] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [cardSide, setCardSide] = useState('Front'); // 'Front' or 'Back'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShareholders();
  }, [search]);

  const loadShareholders = async () => {
    setLoading(true);
    const res = await ApiService.getShareholders({ page: 1, limit: 12, search });
    if (res && res.data) {
      setShareholders(res.data);
      if (selectedCards.length === 0) {
        setSelectedCards(res.data.slice(0, 4));
      }
    }
    setLoading(false);
  };

  const toggleSelectCard = (sh) => {
    const shId = sh.shareholder_id || sh.id;
    if (selectedCards.some(c => (c.shareholder_id || c.id) === shId)) {
      setSelectedCards(prev => prev.filter(c => (c.shareholder_id || c.id) !== shId));
    } else {
      setSelectedCards(prev => [...prev, sh]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Contact className="w-5 h-5 text-emerald-400" /> Shareholder Statutory ID Card Generator (ಸದಸ್ಯರ ಗುರುತಿನ ಚೀಟಿ)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Print single or batch plastic member identity cards with Book No, Share No, Place, Circle & Nominee QR
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setCardSide('Front')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${cardSide === 'Front' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
            >
              Front View
            </button>
            <button
              onClick={() => setCardSide('Back')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${cardSide === 'Back' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
            >
              Back View
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <Printer className="w-4 h-4" /> Print Selected ({selectedCards.length}) Cards
          </button>
        </div>
      </div>

      {/* Selector Drawer */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 no-print">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Select Shareholders for ID Printing ({selectedCards.length} selected)</span>
          <button onClick={() => setSelectedCards(shareholders)} className="text-[11px] text-emerald-400 hover:underline font-medium">Select All on Page</button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search shareholder by Name (ಕನ್ನಡ/English), Share No, Book No, Place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none"
          />
        </div>
      </div>

      {/* Printable ID Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 id-card-grid printable-area">
        {selectedCards.map((sh, idx) => (
          <div
            key={sh.id || idx}
            className="w-[330px] h-[210px] mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/40 rounded-2xl p-4 text-slate-100 flex flex-col justify-between shadow-xl relative overflow-hidden group"
          >
            {/* Background Emblem Watermark */}
            <div className="absolute -right-6 -bottom-6 text-emerald-500/5 font-black text-8xl pointer-events-none select-none">
              CS
            </div>

            {cardSide === 'Front' ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      CS
                    </div>
                    <div>
                      <h3 className="font-black text-[11px] leading-none text-emerald-300">ಶ್ರೀ ಛತ್ರಪತಿ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</h3>
                      <p className="text-[8px] text-slate-400 uppercase tracking-tighter">Cooperative Society Ltd. • Vijayapura / Indi</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 bg-emerald-950 border border-emerald-800 rounded text-emerald-400 font-bold">
                    {sh.schedule_cast || 'ಅ - ವರ್ಗ'}
                  </span>
                </div>

                {/* Body: Photo + Info */}
                <div className="flex gap-3 items-center my-auto">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shrink-0 shadow-md">
                    {(sh.shareholder_name || sh.name || 'S').charAt(0)}
                  </div>

                  <div className="text-[10px] space-y-0.5 min-w-0">
                    <div className="font-bold text-slate-100 text-xs truncate">{sh.shareholder_name || sh.name}</div>
                    <div className="flex gap-2 font-mono text-[9px] pt-0.5">
                      <span className="text-sky-400 font-bold">{sh.book_no || 'B.No: 1'}</span>
                      <span>•</span>
                      <span>Share: <strong className="text-emerald-400">{sh.share_no || sh.share_number}</strong></span>
                      <span>•</span>
                      <span>Shares: <strong className="text-slate-200">{sh.number_of_shares || 1}</strong></span>
                    </div>
                    <div className="text-[9px] text-emerald-300 font-medium truncate">
                      Place: <strong>{sh.place || sh.village_name}</strong> (ತಾ: {sh.taluk || 'ಇಂಡಿ'})
                    </div>
                    <div className="text-[8px] text-slate-400 font-mono">
                      Aadhaar: {sh.aadhaar_card_no || sh.aadhaar_ref || '4582 9981 1234'}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[8px] text-slate-400">
                  <span>Mob: {sh.mobile_no || sh.mobile}</span>
                  <span>Circle: {sh.circle || sh.circle_name}</span>
                  <span className="font-semibold text-emerald-400">Auth Signature</span>
                </div>
              </>
            ) : (
              <>
                {/* Back Design */}
                <div className="space-y-2 text-[9px] my-auto">
                  <div className="border-b border-slate-800 pb-1 font-bold text-slate-200 flex justify-between">
                    <span>STATUTORY MEMBER RULES & NOMINEE</span>
                    <span className="font-mono text-emerald-400">{sh.book_no || 'B.No: 1'} / Sl: {sh.sl_no || idx + 1}</span>
                  </div>
                  <div className="text-[8px] text-slate-300 space-y-1">
                    <div>• <strong>Nominee (ನಾಮಿನಿ):</strong> {sh.nominee_name || '—'}</div>
                    <div>• <strong>Nominee Aadhaar:</strong> {sh.nominee_aadhaar_no || '—'}</div>
                    <div>• <strong>Board Tharava:</strong> {sh.tharava_no || 'TR-01/1982'} (Dt: {sh.tharava_date || sh.reg_date})</div>
                    <div>• <strong>Total Share Capital:</strong> ₹ {(sh.total_amount || 2000).toLocaleString()} (Rec: #{sh.receipt_no || idx + 1})</div>
                  </div>
                  <div className="pt-2 flex justify-between items-center font-mono text-[8px] border-t border-slate-800">
                    <span className="text-slate-400">Reg: {sh.reg_date || sh.registration_date}</span>
                    {/* Simulated Barcode */}
                    <div className="p-1 bg-white text-slate-900 rounded font-mono font-bold text-[8px]">
                      ||| | {sh.share_no || sh.share_number} |||
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
