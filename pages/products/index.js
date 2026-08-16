import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Cal_Sans } from "next/font/google";
import usePersistentLanguage from "../../components/usePersistentLanguage";
import FloatingLanguageToggle from "../../components/FloatingLanguageToggle";

const calSansHeading = Cal_Sans({
  weight: "400",
  subsets: ["latin"],
});

// Translation fallbacks for Products directory
const pageTranslations = {
  en: {
    title: "Explore Our Produce",
    subtitle: "Find clean, farm-fresh organic harvests sourced directly from partner farms in Assam.",
    pill: "🛒 Crop Market",
    searchPlaceholder: "Search crops, farms, tags or descriptions...",
    filterStatusLabel: "Availability Status",
    statusAll: "All Products",
    statusAvailable: "Available Now",
    statusUpcoming: "Upcoming Harvests",
    noProducts: "No crops found matching your filters. Try resetting search or tags.",
    btnBuy: "Buy Now",
    btnRequest: "Request Share",
    readyLabel: "Ready in",
    unitLabel: "per",
    catAll: "All",
    catGrains: "Grains",
    catTea: "Assam Tea",
    catSpices: "Spices",
    catCitrus: "Citrus"
  },
  as: {
    title: "আমাৰ শস্যসমূহ অন্বেষণ কৰক",
    subtitle: "অসমৰ সহযোগী পামসমূহৰ পৰা পোনপটীয়াকৈ সংগৃহীত পৰিষ্কাৰ, সজীৱ জৈৱিক শস্যসমূহ বিচাৰি উলিয়াওক।",
    pill: "🛒 শস্য বজাৰ",
    searchPlaceholder: "শস্য, পাম, টেগ বা বিৱৰণ অনুসন্ধান কৰক...",
    filterStatusLabel: "উপলব্ধতাৰ স্থিতি",
    statusAll: "সকলো উৎপাদন",
    statusAvailable: "এতিয়াই উপলব্ধ",
    statusUpcoming: "আগন্তুক চপোৱা শস্য",
    noProducts: "আপোনাৰ ফিল্টাৰৰ সৈতে কোনো উৎপাদন মিলি যোৱা নাই। পুনৰ চেষ্টা কৰক।",
    btnBuy: "কিনিবলৈ",
    btnRequest: "অনুৰোধ কৰক",
    readyLabel: "উপলব্ধ সময়",
    unitLabel: "প্ৰতি",
    catAll: "সকলো",
    catGrains: "ধান-জাতীয়",
    catTea: "অসমীয়া চাহ",
    catSpices: "মচলা",
    catCitrus: "টেঙা জাতীয়"
  }
};

export default function ProductsDirectoryPage() {
  const [lang, setLang] = usePersistentLanguage("en");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading products directory:", err);
        setLoading(false);
      });
  }, []);

  const t = pageTranslations[lang];
  const fontClass = lang === "as" ? "font-assamese tracking-normal font-medium" : "";

  // Dynamic filter handler
  const filteredProducts = products.filter((product) => {
    // 1. Search Query filter
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category tag filter (e.g. Grains, Tea, Spices, Citrus)
    const matchesCategory =
      selectedCategory === "all" ||
      product.tags.toLowerCase().includes(selectedCategory.toLowerCase());

    // 3. Status filter (available vs ready_by_timeline)
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "available" && product.availability_status === "available") ||
      (selectedStatus === "upcoming" && product.availability_status === "ready_by_timeline");

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <>
      <Head>
        <title>{t.title} - Mekriha Storefront</title>
        <meta name="description" content={t.subtitle} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <FloatingLanguageToggle lang={lang} setLang={setLang} />

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
            
            <div className="flex items-center gap-4">
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
          <div className="max-w-3xl text-left mb-12">
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

          {/* 1. Category Icon Filter (rounded logos at the top) */}
          <div className="flex justify-start md:justify-center items-center gap-6 md:gap-8 overflow-x-auto pb-6 mb-12 border-b border-gray-100 scrollbar-none w-full">
            {/* Category: All */}
            <button
              onClick={() => setSelectedCategory("all")}
              className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                selectedCategory === "all"
                  ? "bg-[#005748] text-white scale-105 shadow-md ring-4 ring-[#005748]/10"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-[#005748] hover:bg-gray-50"
              }`}>
                🌾
              </div>
              <span className={`text-xs font-bold ${selectedCategory === "all" ? "text-[#005748]" : "text-gray-500"} ${fontClass}`}>
                {t.catAll}
              </span>
            </button>

            {/* Category: Grains */}
            <button
              onClick={() => setSelectedCategory("grains")}
              className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                selectedCategory === "grains"
                  ? "bg-[#005748] text-white scale-105 shadow-md ring-4 ring-[#005748]/10"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-[#005748] hover:bg-gray-50"
              }`}>
                🌾
              </div>
              <span className={`text-xs font-bold ${selectedCategory === "grains" ? "text-[#005748]" : "text-gray-500"} ${fontClass}`}>
                {t.catGrains}
              </span>
            </button>

            {/* Category: Tea */}
            <button
              onClick={() => setSelectedCategory("tea")}
              className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                selectedCategory === "tea"
                  ? "bg-[#005748] text-white scale-105 shadow-md ring-4 ring-[#005748]/10"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-[#005748] hover:bg-gray-50"
              }`}>
                🍃
              </div>
              <span className={`text-xs font-bold ${selectedCategory === "tea" ? "text-[#005748]" : "text-gray-500"} ${fontClass}`}>
                {t.catTea}
              </span>
            </button>

            {/* Category: Spices */}
            <button
              onClick={() => setSelectedCategory("spices")}
              className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                selectedCategory === "spices"
                  ? "bg-[#005748] text-white scale-105 shadow-md ring-4 ring-[#005748]/10"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-[#005748] hover:bg-gray-50"
              }`}>
                🍠
              </div>
              <span className={`text-xs font-bold ${selectedCategory === "spices" ? "text-[#005748]" : "text-gray-500"} ${fontClass}`}>
                {t.catSpices}
              </span>
            </button>

            {/* Category: Citrus */}
            <button
              onClick={() => setSelectedCategory("citrus")}
              className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                selectedCategory === "citrus"
                  ? "bg-[#005748] text-white scale-105 shadow-md ring-4 ring-[#005748]/10"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-[#005748] hover:bg-gray-50"
              }`}>
                🍋
              </div>
              <span className={`text-xs font-bold ${selectedCategory === "citrus" ? "text-[#005748]" : "text-gray-500"} ${fontClass}`}>
                {t.catCitrus}
              </span>
            </button>
          </div>

          {/* 2. Search & More Filters Section */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 mb-12">
            
            {/* Search Input Box */}
            <div className="relative flex-1 max-w-xl">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full bg-white border border-gray-200 pl-11 pr-4 py-3 rounded-full text-sm focus:outline-none focus:border-[#005748] focus:ring-2 focus:ring-[#005748]/5 shadow-sm transition-all ${fontClass}`}
              />
            </div>

            {/* Status Segmented Filters */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {/* Filter Label */}
              <span className={`text-xs font-bold uppercase tracking-wider text-gray-400 mr-2 hidden lg:inline-block ${fontClass}`}>
                {t.filterStatusLabel}:
              </span>
              
              <div className="flex bg-white p-1 rounded-full border border-gray-200 shadow-sm shrink-0">
                <button
                  onClick={() => setSelectedStatus("all")}
                  className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                    selectedStatus === "all" ? "bg-[#005748] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  } ${fontClass}`}
                >
                  {t.statusAll}
                </button>
                <button
                  onClick={() => setSelectedStatus("available")}
                  className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                    selectedStatus === "available" ? "bg-[#005748] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  } ${fontClass}`}
                >
                  {t.statusAvailable}
                </button>
                <button
                  onClick={() => setSelectedStatus("upcoming")}
                  className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                    selectedStatus === "upcoming" ? "bg-[#005748] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  } ${fontClass}`}
                >
                  {t.statusUpcoming}
                </button>
              </div>
            </div>

          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
              <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
              <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
              <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto px-6">
              <span className="text-4xl">🌾</span>
              <p className={`text-gray-500 text-sm mt-4 leading-relaxed ${fontClass}`}>
                {t.noProducts}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const isAvailable = product.availability_status === "available";
                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <Link href={`/products/${product.id}`} className="cursor-pointer">
                      {/* Product Image */}
                      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden border-b border-gray-50">
                        <Image
                          src={product.image1}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-103 transition-transform duration-500"
                          sizes="(max-w-768px) 100vw, 25vw"
                        />
                        {/* Availability tags */}
                        <div className="absolute top-3 right-3">
                          {isAvailable ? (
                            <span className="text-[9px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Text info */}
                      <div className="p-5 pb-0 text-left">
                        {/* Primary Tag */}
                        <span className="text-[9px] font-bold text-[#005748] tracking-wider uppercase bg-[#005748]/5 px-2 py-0.5 rounded-sm">
                          {product.tags.split(",")[0].trim()}
                        </span>

                        <h3 className={`font-sans font-bold text-gray-900 text-base mt-2.5 line-clamp-1 group-hover:text-[#005748] transition-colors ${fontClass}`}>
                          {product.name}
                        </h3>

                        <p className={`text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed ${fontClass}`}>
                          {product.description}
                        </p>
                      </div>
                    </Link>

                    <div className="px-5">
                      {/* Farm badge - separate link so it navigates to the farm, not the product */}
                      {product.farm_name && (
                        <Link
                          href={`/farms/${product.farm_id}`}
                          className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors"
                        >
                          🏡 {product.farm_name}
                        </Link>
                      )}
                    </div>

                    {/* Bottom Action Section */}
                    <Link href={`/products/${product.id}`} className="p-5 pt-3 flex flex-col gap-3 cursor-pointer">
                      <div className="border-t border-gray-50 pt-4 flex items-center justify-between text-xs mt-auto w-full">
                        {isAvailable ? (
                          <div className="flex flex-col items-start">
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-[#005748] text-base">₹{product.discount_price}</span>
                              <span className="text-[10px] text-gray-400 line-through">₹{product.price}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">{t.unitLabel} {product.measure_of_unit}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-amber-700">{t.readyLabel}</span>
                            <span className="text-gray-900 font-semibold">{product.ready_by_timeline}</span>
                          </div>
                        )}

                        {/* Action text indicator */}
                        <span className={`text-[10px] font-bold tracking-wider uppercase border-b-2 border-transparent transition-all ${
                          isAvailable ? "text-[#005748] group-hover:border-[#005748]" : "text-amber-800 group-hover:border-amber-800"
                        } ${fontClass}`}>
                          {isAvailable ? t.btnBuy : t.btnRequest}
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-gray-100 bg-[#FAF8F5] relative z-20 text-gray-500 text-xs">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
            <span>© {new Date().getFullYear()} Mekriha Partner Program. All rights reserved.</span>
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
