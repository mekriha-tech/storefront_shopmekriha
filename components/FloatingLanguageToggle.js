export default function FloatingLanguageToggle({ lang, setLang }) {
  return (
    <div
      className="fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col overflow-hidden rounded-full border border-[#005748]/20 bg-[#FAF8F5]/95 p-1 shadow-lg backdrop-blur-md"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`h-10 w-10 rounded-full text-[11px] font-bold tracking-wider transition-all cursor-pointer ${
          lang === "en" ? "bg-[#005748] text-white shadow-sm" : "text-[#005748] hover:bg-[#005748]/10"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("as")}
        className={`h-10 w-10 rounded-full font-assamese text-[13px] font-bold transition-all cursor-pointer ${
          lang === "as" ? "bg-[#005748] text-white shadow-sm" : "text-[#005748] hover:bg-[#005748]/10"
        }`}
        aria-pressed={lang === "as"}
      >
        অ
      </button>
    </div>
  );
}
