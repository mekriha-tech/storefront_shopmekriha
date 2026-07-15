import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Cal_Sans } from "next/font/google";

const calSansHeading = Cal_Sans({
  weight: "400",
  subsets: ["latin"],
});

// Translation fallbacks for Directory Page
const directoryTranslations = {
  en: {
    title: "Partner Farms Directory",
    subtitle: "Meet the organic farmers and heritage estates cultivating chemical-free crops across Assam.",
    pill: "🏡 Partner Program",
    btnView: "View Farm Profile →",
    established: "Est."
  },
  as: {
    title: "অংশীদাৰ পামসমূহৰ নিৰ্দেশিকা",
    subtitle: "অসম জুৰি ৰাসায়নিক মুক্ত শস্য উৎপাদন কৰা জৈৱিক খেতিয়ক আৰু ঐতিহ্যবাহী পামসমূহক লগ কৰক।",
    pill: "🏡 অংশীদাৰ আঁচনি",
    btnView: "পামৰ পৰিচয় চাওক →",
    established: "স্থাপিত"
  }
};

export default function FarmsDirectoryPage() {
  const [lang, setLang] = useState("en");
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/farms")
      .then((res) => res.json())
      .then((data) => {
        setFarms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading farms directory:", err);
        setLoading(false);
      });
  }, []);

  const t = directoryTranslations[lang];
  const fontClass = lang === "as" ? "font-assamese tracking-normal font-medium" : "";

  return (
    <>
      <Head>
        <title>{t.title} - Mekriha Storefront</title>
        <meta name="description" content={t.subtitle} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#FAF8F5] text-gray-900 flex flex-col justify-between font-sans selection:bg-[#005748]/10">
        {/* Sticky Header */}
        <header className="w-full bg-[#FAF8F5]/85 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 py-5">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <Image
                src={lang === "as" ? "/mekriha_assamese_logo.PNG" : "/mekriha_logo.png"}
                alt="Mekriha"
                width={160}
                height={34}
                priority
                className={lang === "as" ? "h-8 md:h-9 w-auto" : "h-7 md:h-8 w-auto"}
              />
            </Link>
            
            {/* Header Language Toggler */}
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100/80 p-0.5 rounded-full border border-gray-200">
                <button
                  onClick={() => setLang("en")}
                  className={`py-1.5 px-3.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                    lang === "en" ? "bg-[#005748] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("as")}
                  className={`py-1.5 px-3.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer font-assamese ${
                    lang === "as" ? "bg-[#005748] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  অসমীয়া
                </button>
              </div>
              
              <Link
                href="/"
                className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#005748] transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </header>

        {/* Directory Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-16">
          {/* Header Title segment */}
          <div className="max-w-3xl text-left mb-12 md:mb-16">
            <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-bold bg-[#005748]/10 text-[#005748] border border-[#005748]/20 uppercase tracking-widest mb-4 ${fontClass}`}>
              {t.pill}
            </span>
            <h1 className={`${calSansHeading.className} ${fontClass} font-bold text-4xl md:text-5xl tracking-tight text-gray-900 leading-tight mb-4`}>
              {t.title}
            </h1>
            <p className={`text-gray-600 text-sm sm:text-base leading-relaxed ${fontClass}`}>
              {t.subtitle}
            </p>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
              <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
              <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {farms.map((farm) => (
                <Link
                  href={`/farms/${farm.id}`}
                  key={farm.id}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Hero Image */}
                    <div className="relative w-full aspect-[16/10] bg-gray-50 overflow-hidden border-b border-gray-50">
                      <Image
                        src={farm.heroImage}
                        alt={`${farm.name} farm showcase`}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                        sizes="(max-w-768px) 100vw, 33vw"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-100 text-[10px] font-bold text-gray-800 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {farm.district}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-6 text-left">
                      {/* Badge Initials overlay */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full border border-gray-100 bg-[#FCD02C] text-[#005748] flex items-center justify-center font-bold font-mono text-sm shrink-0">
                          {farm.profileImage}
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">
                            Farmer: {farm.farmerName}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {t.established} {farm.established}
                          </span>
                        </div>
                      </div>

                      <h2 className={`${calSansHeading.className} text-xl font-bold text-gray-900 group-hover:text-[#005748] transition-colors leading-tight mb-2`}>
                        {farm.name}
                      </h2>
                      <p className="text-gray-500 text-xs md:text-sm line-clamp-3 leading-relaxed">
                        {farm.about}
                      </p>
                    </div>
                  </div>

                  {/* Address & link footer drawer */}
                  <div className="p-6 pt-0 border-t border-gray-50 flex flex-col gap-3">
                    <span className="text-xs text-gray-500 font-medium mt-4 line-clamp-1 block text-left">
                      📍 {farm.address}
                    </span>
                    <span className={`text-xs font-bold text-[#005748] group-hover:underline text-left mt-2 block ${fontClass}`}>
                      {t.btnView}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-gray-100 bg-[#FAF8F5] relative z-20 text-gray-500 text-xs">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
            <span>© {new Date().getFullYear()} Mekriha Partner program. All rights reserved.</span>
            <div className="flex gap-6 text-gray-400 hover:text-gray-600 transition-colors">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
