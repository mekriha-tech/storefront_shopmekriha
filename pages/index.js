import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Cal_Sans } from "next/font/google";
import ScrollRiver from "../components/ScrollRiver";

const calSansHeading = Cal_Sans({
  weight: "400",
  subsets: ["latin"],
});

// Production-ready static fallbacks for instant mounting
const defaultTranslations = {
  en: {
    nav: {
      home: "Home",
      about: "About Mekriha",
      produce: "Our Produce",
      visit: "Visit Farms"
    },
    hero: {
      title: "From the fertile banks of the Brahmaputra and the nutrient-rich soils of Assam, we harvest organic, naturally grown food for you — collaborating directly with farms and farmers across the region.",
      description: "Mekriha is a farmer-first marketplace built to reconnect people with the true source of their food. We believe every harvest represents months of dedication, care, and hard work — and that value should reach the farms that grow it.",
      btnOurFarms: "Our Farms",
      btnOurHarvests: "Our Harvests"
    },
    section2: {
      pill: "🌾 Sustainable Partnerships",
      title: "Growing Stronger, Together",
      description: "We partner with organic farms, helping them establish a strong identity and lasting presence. From digital visibility to direct customer connections, we grow together.",
      partnerFarms: "Partner Farms"
    },
    section3: {
      pill: "🔍 Traceability & Transparency",
      title: "Know Your Crop Journey",
      description: "Know where your crop was grown, how it was cultivated, and how it traveled from the field to your home. Mekriha brings complete transparency so every harvest has a story you can trust.",
      step1Title: "1. Sowing & Cultivation",
      step1Desc: "Heritage seeds sown in rich soils using organic compost.",
      step2Title: "2. Harvest at Peak",
      step2Desc: "Handpicked crop harvested at peak maturity by local farmers.",
      step3Title: "3. Quality Check",
      step3Desc: "Organic sorting and eco-friendly packaging at regional hubs.",
      step4Title: "4. Direct Delivery",
      step4Desc: "Fast transit from Assam's valleys straight to your home."
    },
    section4: {
      pill: "🏡 Farm Experiences",
      title: "Visit the Farm",
      description: "Experience the farm beyond the marketplace. Visit our partner farms, meet the people behind your food, and create unforgettable memories.",
      cta: "Visit Farm Now"
    },
    section5: {
      pill: "🛒 Organic Harvest",
      title: "Explore Our Produce",
      description: "Discover seasonal, farm-fresh produce from trusted partner farms. Every order supports fair trade and sustainable farming.",
      cta: "Explore Our Produce"
    },
    footer: {
      brand: "Mekriha – Farmer First Marketplace",
      tagline: "From Rural Fields to Urban Homes — Fairly.",
      exploreTitle: "Explore",
      ourFarmsTitle: "Our Farms",
      learnTitle: "Learn",
      supportTitle: "Support",
      newsletterTitle: "Stay Close to the Harvest",
      newsletterPlaceholder: "Your email address",
      newsletterBtn: "Subscribe",
      bottom: "© 2026 Mekriha. All Rights Reserved. Supporting Farms. Connecting Communities. Growing Together."
    }
  },
  as: {
    nav: {
      home: "গৃহ",
      about: "মেক্ৰিহাৰ বিষয়ে",
      produce: "আমাৰ উৎপাদন",
      visit: "পাম ভ্ৰমণ"
    },
    hero: {
      title: "ব্ৰহ্মপুত্ৰৰ উৰ্বৰ পাৰ আৰু অসমৰ পুষ্টিসমৃদ্ধ মাটিৰ পৰা, আমি আপোনালোকৰ বাবে জৈৱিক, প্ৰাকৃতিকভাৱে উৎপাদিত খাদ্য চপাওঁ — অঞ্চলটোৰ পাম আৰু খেতিয়কসকলৰ সৈতে পোনপটীয়াকৈ সহযোগিতা কৰি।",
      description: "মেক্ৰিহা হৈছে এক খেতিয়ক-প্ৰথম বজাৰ যি মানুহক তেওঁলোকৰ খাদ্যৰ প্ৰকৃত উৎসৰ সৈতে পুনৰ সংযোগ কৰাৰ বাবে গঢ়ি তোলা হৈছে। আমি বিশ্বাস কৰোঁ যে প্ৰতিটো শস্যই মাহ মাহ ধৰি কৰা উৎসৰ্গা, যত্ন আৰু কঠোৰ পৰিশ্ৰমক প্ৰতিনিধিত্ব কৰে — আৰু সেই মূল্য ইয়াৰ উৎপাদক পামসমূহৰ ওচৰলৈ যাব লাগে।",
      btnOurFarms: "আমাৰ পামসমূহ",
      btnOurHarvests: "আমাৰ শস্যসমূহ"
    },
    section2: {
      pill: "🌾 বহনক্ষম অংশীদাৰিত্ব",
      title: "একেলগে শক্তিশালীভাৱে বৃদ্ধি পাইছোঁ",
      description: "আমি জৈৱিক পামসমূহৰ সৈতে অংশীদাৰিত্ব কৰোঁ, তেওঁলোকক এক শক্তিশালী পৰিচয় আৰু স্থায়ী স্থিতি স্থাপন কৰাত সহায় কৰোঁ। ডিজিটেল দৃশ্যমানতাৰ পৰা আৰম্ভ কৰি গ্ৰাহকৰ সৈতে পোনপটীয়া সংযোগলৈকে, আমি একেলগে বৃদ্ধি পাইছোঁ।",
      partnerFarms: "অংশীদাৰ পামসমূহ"
    },
    section3: {
      pill: "🔍 ট্ৰেচেবিলিটি আৰু স্বচ্ছতা",
      title: "আপোনাৰ শস্যৰ যাত্ৰা জানক",
      description: "আপোনাৰ শস্য ক’ত খেতি কৰা হৈছিল, কেনেকৈ উৎপাদন কৰা হৈছিল, আৰু পথাৰৰ পৰা আপোনাৰ ঘৰলৈ কেনেকৈ যাত্ৰা কৰিলে সেইটো জানক। মেক্ৰিহা সম্পূৰ্ণ স্বচ্ছতা প্ৰদান কৰে যাতে প্ৰতিটো চপোৱা শস্যৰ আঁৰত আপুনি বিশ্বাস কৰিব পৰা এটা কাহিনী থাকে।",
      step1Title: "১. ৰোপণ আৰু খেতি",
      step1Desc: "জৈৱিক সাৰ ব্যৱহাৰ কৰি সাৰুৱা মাটিত ঐতিহ্যবাহী বীজ সিঁচা হয়।",
      step2Title: "২. উপযুক্ত সময়ত চপোৱা",
      step2Desc: "স্থানীয় কৃষকসকলে উপযুক্ত পৈণত অৱস্থাত শস্যসমূহ হাতেৰে চপোৱা কৰে।",
      step3Title: "৩. গুণগত মান নিৰূপণ",
      step3Desc: "আঞ্চলিক কেন্দ্ৰসমূহত জৈৱিক শ্ৰেণীবিভাজন আৰু পৰিৱেশ-অনুকূল পেকেজিং কৰা হয়।",
      step4Title: "৪. পোনপটীয়া বিতৰণ",
      step4Desc: "অসমৰ উপত্যকাৰ পৰা পোনে পোনে আপোনাৰ ঘৰলৈ দ্ৰুত পৰিবহন।"
    },
    section4: {
      pill: "🏡 পামৰ অভিজ্ঞতা",
      title: "পাম ভ্ৰমণ কৰক",
      description: "বজাৰৰ সিপাৰেও পামখনৰ অভিজ্ঞতা লওক। আমাৰ অংশীদাৰ পামসমূহ ভ্ৰমণ কৰক, আপোনাৰ খাদ্যৰ আঁৰৰ মানুহখিনিক লগ কৰক, আৰু চিৰদিন মনত ৰৈ যোৱা স্মৃতি গঢ়ক।",
      cta: "এতিয়াই পাম ভ্ৰমণ কৰক"
    },
    section5: {
      pill: "🛒 জৈৱিক উৎপাদন",
      title: "আমাৰ শস্যসমূহ অন্বেষণ কৰক",
      description: "আস্থাভাজন অংশীদাৰ পামসমূহৰ পৰা ঋতুভিত্তিক, পামৰ সজীৱ শস্যসমূহ আৱিষ্কাৰ কৰক। প্ৰতিটো অৰ্ডাৰে ন্যায্য ব্যৱসায় আৰু বহনক্ষম কৃষিক সমৰ্থন কৰে।",
      cta: "আমাৰ শস্যসমূহ অন্বেষণ কৰক"
    },
    footer: {
      brand: "মেক্ৰিহা – খেতিয়ক প্ৰথম বজাৰ",
      tagline: "গ্ৰাম্য পথাৰৰ পৰা চহৰীয়া ঘৰলৈ — ন্যায্যভাৱে।",
      exploreTitle: "অন্বেষণ",
      ourFarmsTitle: "আমাৰ পামসমূহ",
      learnTitle: "জানক",
      supportTitle: "সহায়",
      newsletterTitle: "শস্য চপোৱাৰ ওচৰত থাকক",
      newsletterPlaceholder: "আপোনাৰ ইমেইল ঠিকনা",
      newsletterBtn: "চাবস্ক্ৰাইব কৰক",
      bottom: "© ২০২৬ মেক্ৰিহা। সৰ্বস্বত্ব সংৰক্ষিত। পামসমূহক সমৰ্থন। সমাজ সংযোগ। একেলগে বিকাশ।"
    }
  }
};

export default function Home() {
  const [lang, setLang] = useState("en");
  const [translations, setTranslations] = useState(defaultTranslations);
  const [farms, setFarms] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Partner Farm Registration Modal & Form States
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [registerFarmName, setRegisterFarmName] = useState("");
  const [registerFarmerName, setRegisterFarmerName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerLocation, setRegisterLocation] = useState("");
  const [registerTotalArea, setRegisterTotalArea] = useState("");
  const [registerPrimaryCrop, setRegisterPrimaryCrop] = useState("");

  const handlePartnerRegisterSubmit = (e) => {
    e.preventDefault();
    setRegisterSubmitted(true);

    const payload = {
      farm_name: registerFarmName,
      farmer_name: registerFarmerName,
      phone: registerPhone,
      email: registerEmail || undefined,
      location: registerLocation,
      total_area_acres: parseFloat(registerTotalArea),
      primary_crop: registerPrimaryCrop
    };

    fetch("/api/farms/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.error || "Registration failed");
          }).catch(() => {
            throw new Error("Registration failed");
          });
        }
        return res.json();
      })
      .then(() => {
        setRegisterSubmitted(false);
        setPartnerModalOpen(false);
        setRegisterFarmName("");
        setRegisterFarmerName("");
        setRegisterPhone("");
        setRegisterEmail("");
        setRegisterLocation("");
        setRegisterTotalArea("");
        setRegisterPrimaryCrop("");
        alert("Success! Your farm registration request has been submitted. A Mekriha coordinator will reach out to verify details soon.");
      })
      .catch((err) => {
        console.error("Registration error:", err);
        setRegisterSubmitted(false);
        alert(`Failed to submit registration: ${err.message}`);
      });
  };

  // Fetch dynamic farm data, products, and translations
  useEffect(() => {
    fetch("/api/farms")
      .then((res) => res.json())
      .then((data) => {
        setFarms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading farm data:", err);
        setLoading(false);
      });

    // Fetch dynamic products database
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => {
        console.error("Error loading products data:", err);
      });

    // Fetch dynamic JSON locale translations so they can be modified manually
    fetch("/locales/translations.json")
      .then((res) => res.json())
      .then((data) => {
        setTranslations(data);
      })
      .catch((err) => {
        console.error("Failed to load locales/translations.json, using default fallbacks", err);
      });
  }, []);

  // Shortcut for selected translations dictionary based on state
  const t = translations[lang] || defaultTranslations[lang];

  // Helper font class to apply Noto Sans Bengali when Assamese is active
  const fontClass = lang === "as" ? "font-assamese tracking-normal font-medium" : "";

  return (
    <>
      <Head>
        <title>Mekriha - Farmer-First Organic Marketplace</title>
        <meta
          name="description"
          content="Where every harvest finds its true value. Mekriha is a farmer-first marketplace built to reconnect people with the true source of their food."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="font-sans min-h-screen flex flex-col justify-between overflow-x-hidden bg-[#FAF8F5] text-[#111827]">
        {/* Navigation Bar */}
        <header className="w-full sticky top-0 bg-[#FAF8F5]/85 backdrop-blur-md z-50 border-b border-gray-100 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 py-5 md:py-6 flex items-center justify-between">
            {/* Logo */}
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

            {/* Desktop Navigation Links */}
            <nav className={`hidden md:flex items-center gap-8 lg:gap-12 font-medium text-sm text-gray-600 ${fontClass}`}>
              <a
                href="#home"
                className="relative py-1 transition-colors hover:text-[#005748]"
              >
                {t.nav.home}
              </a>
              <a
                href="#about"
                className="relative py-1 transition-colors hover:text-[#005748]"
              >
                {t.nav.about}
              </a>
              <a
                href="#produce"
                className="relative py-1 transition-colors hover:text-[#005748]"
              >
                {t.nav.produce}
              </a>
              <a
                href="#visit"
                className="relative py-1 transition-colors hover:text-[#005748]"
              >
                {t.nav.visit}
              </a>
            </nav>

            {/* Language Switcher Toggle Buttons */}
            <div className="flex items-center gap-3">
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

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 focus:outline-none z-50 ml-1"
                aria-label="Toggle Menu"
                id="mobile-menu-toggle"
              >
                <span
                  className={`h-0.5 w-6 bg-[#111827] transition-transform duration-300 ease-in-out ${
                    mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                ></span>
                <span
                  className={`h-0.5 w-6 bg-[#111827] transition-opacity duration-300 ${
                    mobileMenuOpen ? "opacity-0" : ""
                  }`}
                ></span>
                <span
                  className={`h-0.5 w-6 bg-[#111827] transition-transform duration-300 ease-in-out ${
                    mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                ></span>
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-[#FAF8F5]/98 backdrop-blur-lg border-b border-gray-200/80 px-6 py-8 flex flex-col gap-6 md:hidden shadow-xl animate-slide-down z-40">
              <nav className={`flex flex-col gap-4 font-semibold text-base text-gray-700 ${fontClass}`}>
                <a
                  href="#home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-[#005748] transition-colors"
                >
                  {t.nav.home}
                </a>
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-[#005748] transition-colors"
                >
                  {t.nav.about}
                </a>
                <a
                  href="#produce"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-[#005748] transition-colors"
                >
                  {t.nav.produce}
                </a>
                <a
                  href="#visit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-[#005748] transition-colors"
                >
                  {t.nav.visit}
                </a>
              </nav>
            </div>
          )}
        </header>

        <ScrollRiver sectionIds={["home", "about", "produce", "visit", "produce-explore"]}>
        {(riverLayer) => (
        <>
        {/* Hero Section */}
        <section id="home" className="relative overflow-hidden min-h-[82vh] bg-gradient-to-br from-[#FAF8F5] via-[#FAF8F5] to-[#F3EEE5] flex items-center">
          {riverLayer("home")}
          {/* Full-width Hero Image */}
          <div className="absolute inset-y-0 right-0 w-[100vw] lg:w-[100vw] xl:w-[100vw] pointer-events-none z-0">
            <Image
              src="/herovector.png"
              alt="Farmer walking with harvested bundles under a leafy green tree"
              fill
              priority
              className="object-contain object-right-bottom select-none"
              sizes="60vw"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-12 md:py-20">
            <div className="grid md:grid-cols-12 items-center">
              {/* Left Column */}
              <div className="md:col-span-7 flex flex-col items-start">
                <h1 className={`${calSansHeading.className} ${fontClass} font-bold text-[36px] sm:text-[48px] md:text-[44px] lg:text-[54px] xl:text-[62px] leading-[1.12] tracking-tight text-gray-900`}>
                  {t.hero.title}
                </h1>

                <p className={`text-gray-600 text-sm sm:text-base md:text-lg leading-[1.65] mt-6 max-w-xl font-normal ${fontClass}`}>
                  {t.hero.description}
                </p>

                <div className="flex items-center gap-4 mt-8">
                  <a
                    href="#about"
                    className={`py-3 px-8 border border-gray-300 text-gray-700 hover:text-[#005748] hover:border-[#005748] font-bold text-sm hover:bg-white transition-all rounded-full shadow-sm active:scale-95 ${fontClass}`}
                  >
                    {t.hero.btnOurFarms}
                  </a>

                  <Link
                    href="/products"
                    className={`py-3 px-8 bg-[#005748] text-white font-bold text-sm hover:bg-[#004337] transition-all rounded-full shadow-md hover:shadow-lg active:scale-95 ${fontClass}`}
                  >
                    {t.hero.btnOurHarvests}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Image Fallback */}
          <div className="relative w-full h-[320px] sm:h-[400px] md:hidden mt-4">
            <Image
              src="/herovector.png"
              alt="Farmer"
              fill
              priority
              className="object-contain object-bottom"
              sizes="100vw"
            />
          </div>
        </section>

        {/* Section 2: Growing Stronger, Together */}
        <section id="about" className="relative overflow-hidden min-h-[82vh] border-t border-gray-100 bg-white text-[#111827] flex items-center">
          {riverLayer("about")}
          {/* Mirrored Left-aligned Artwork matching Section 1 structure */}
          <div className="absolute inset-y-0 left-0 w-[100vw] lg:w-[100vw] xl:w-[100vw] pointer-events-none z-0">
            <Image
              src="/herovector.png"
              alt="Farmer walking mirrored illustration"
              fill
              priority
              className="object-contain object-right-bottom select-none transform scale-x-[-1]"
              sizes="60vw"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-16 md:py-24">
            <div className="grid md:grid-cols-12 items-center">
              {/* Right Column: Text and Logo section matching Section 1 grid width but on the right */}
              <div className="md:col-start-6 md:col-span-7 flex flex-col justify-center items-start text-left">
                {/* Modern Pill Badge */}
                <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-bold bg-[#005748]/10 text-[#005748] border border-[#005748]/20 uppercase tracking-widest mb-6 ${fontClass}`}>
                  {t.section2.pill}
                </span>

                <h2 className={`${calSansHeading.className} ${fontClass} font-bold text-[36px] sm:text-[44px] md:text-[42px] lg:text-[48px] leading-[1.1] tracking-tight text-gray-900`}>
                  {t.section2.title}
                </h2>

                <p className={`text-gray-600 text-sm sm:text-base leading-[1.65] mt-4 max-w-xl font-normal ${fontClass}`}>
                  {t.section2.description}
                </p>

                {/* Clickable circular logo list centered */}
                <div className="mt-12 w-full flex flex-col items-start justify-center">
                  <span className={`${calSansHeading.className} ${fontClass} text-xl md:text-2xl text-gray-900 block mb-6 tracking-tight font-bold`}>
                    {t.section2.partnerFarms}
                  </span>
                  {loading ? (
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-full border border-dashed border-gray-300 animate-pulse"></div>
                      <div className="w-16 h-16 rounded-full border border-dashed border-gray-300 animate-pulse"></div>
                      <div className="w-16 h-16 rounded-full border border-dashed border-gray-300 animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-start gap-6 lg:gap-8 overflow-x-auto flex-nowrap snap-x snap-mandatory -mx-6 px-6 pb-2 md:flex-wrap md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:snap-none w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {farms.slice(0, 3).map((farm) => (
                        <Link href={`/farms/${farm.id}`} key={farm.id} className="group flex flex-col items-center gap-2 max-w-[100px] shrink-0 snap-start transition-all">
                          {/* Sleek Circular Glass Logo Badge */}
                          <div className="w-20 h-20 rounded-full border border-gray-200 bg-white shadow-sm group-hover:translate-y-[-6px] group-hover:border-[#005748] group-hover:shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden relative p-1 shrink-0">
                            <div className="w-full h-full relative rounded-full overflow-hidden bg-white">
                              <Image
                                src={farm.logoImage}
                                alt={`${farm.name} logo`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="80px"
                              />
                            </div>
                          </div>
                          <span className="font-sans text-xs font-semibold text-gray-700 group-hover:text-[#005748] group-hover:underline text-center leading-tight mt-1 line-clamp-2 transition-colors">
                            {farm.name}
                          </span>
                        </Link>
                      ))}

                      {/* Explore All Farms Circle */}
                      <Link href="/farms" className="group flex flex-col items-center gap-2 max-w-[100px] shrink-0 snap-start transition-all">
                        <div className="w-20 h-20 rounded-full border border-dashed border-gray-300 bg-white hover:bg-gray-50 group-hover:translate-y-[-6px] group-hover:border-[#005748] group-hover:shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden relative shrink-0">
                          <span className="text-[#005748] font-bold text-2xl">→</span>
                        </div>
                        <span className={`font-sans text-xs font-semibold text-gray-700 group-hover:text-[#005748] group-hover:underline text-center leading-tight mt-1 line-clamp-2 transition-colors ${fontClass}`}>
                          {t.section2.exploreAll}
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Image Fallback */}
          <div className="relative w-full h-[320px] sm:h-[400px] md:hidden mt-4">
            <Image
              src="/herovector.png"
              alt="Farmer"
              fill
              priority
              className="object-contain object-bottom transform scale-x-[-1]"
              sizes="100vw"
            />
          </div>
        </section>

        {/* Section 3: Know Your Crop Journey */}
        <section id="produce" className="bg-[#FAF8F5] py-20 md:py-28 border-t border-gray-100 relative z-20">
          {riverLayer("produce")}
          <div className="relative z-10 max-w-7xl mx-auto px-6">

            {/* Header Content */}
            <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
              <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-bold bg-[#005748]/10 text-[#005748] border border-[#005748]/20 uppercase tracking-widest mb-6 ${fontClass}`}>
                {t.section3.pill}
              </span>
              
              <h2 className={`${calSansHeading.className} ${fontClass} text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-6`}>
                {t.section3.title}
              </h2>
              
              <p className={`text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto ${fontClass}`}>
                {t.section3.description}
              </p>
            </div>

            {/* Infographic Center-Aligned Journey Steps */}
            <div className="relative w-full max-w-5xl mx-auto">
              
              {/* Desktop Connecting Dotted Line */}
              <div className="absolute top-10 left-12 right-12 h-0.5 border-t border-dashed border-gray-300 z-0 hidden md:block" />

              {/* Steps Layout */}
              <div className="flex flex-nowrap overflow-x-auto gap-6 snap-x snap-mandatory -mx-6 px-6 pb-4 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:snap-none relative z-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {/* Step 1: Cultivation */}
                <div className="group flex flex-col items-center text-center w-[220px] shrink-0 snap-start md:w-auto md:shrink">
                  <div className="w-20 h-20 rounded-full border border-gray-200 bg-white hover:border-[#005748] hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-sm relative z-10 shrink-0">
                    <svg className="w-8 h-8 text-[#005748]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V10M12 10a5 5 0 0 1 5-5M12 14a5 5 0 0 0-5-5"></path>
                    </svg>
                  </div>
                  <h3 className={`font-sans font-bold text-base text-gray-900 mt-6 transition-colors group-hover:text-[#005748] ${fontClass}`}>
                    {t.section3.step1Title}
                  </h3>
                  <p className={`text-gray-500 text-xs md:text-sm leading-relaxed mt-2 max-w-[200px] mx-auto ${fontClass}`}>
                    {t.section3.step1Desc}
                  </p>
                </div>

                {/* Step 2: Harvest */}
                <div className="group flex flex-col items-center text-center w-[220px] shrink-0 snap-start md:w-auto md:shrink">
                  <div className="w-20 h-20 rounded-full border border-gray-200 bg-white hover:border-[#005748] hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-sm relative z-10 shrink-0">
                    <svg className="w-8 h-8 text-[#005748]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 22c5-5 15-5 20 0M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
                    </svg>
                  </div>
                  <h3 className={`font-sans font-bold text-base text-gray-900 mt-6 transition-colors group-hover:text-[#005748] ${fontClass}`}>
                    {t.section3.step2Title}
                  </h3>
                  <p className={`text-gray-500 text-xs md:text-sm leading-relaxed mt-2 max-w-[200px] mx-auto ${fontClass}`}>
                    {t.section3.step2Desc}
                  </p>
                </div>

                {/* Step 3: Packaging */}
                <div className="group flex flex-col items-center text-center w-[220px] shrink-0 snap-start md:w-auto md:shrink">
                  <div className="w-20 h-20 rounded-full border border-gray-200 bg-white hover:border-[#005748] hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-sm relative z-10 shrink-0">
                    <svg className="w-8 h-8 text-[#005748]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                  </div>
                  <h3 className={`font-sans font-bold text-base text-gray-900 mt-6 transition-colors group-hover:text-[#005748] ${fontClass}`}>
                    {t.section3.step3Title}
                  </h3>
                  <p className={`text-gray-500 text-xs md:text-sm leading-relaxed mt-2 max-w-[200px] mx-auto ${fontClass}`}>
                    {t.section3.step3Desc}
                  </p>
                </div>

                {/* Step 4: Delivery */}
                <div className="group flex flex-col items-center text-center w-[220px] shrink-0 snap-start md:w-auto md:shrink">
                  <div className="w-20 h-20 rounded-full border border-gray-200 bg-white hover:border-[#005748] hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-sm relative z-10 shrink-0">
                    <svg className="w-8 h-8 text-[#005748]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0m-2-3H5m14 0V8a2 2 0 00-2-2h-3m4 8h-4m0 0V6m0 8H9m0 0V9a2 2 0 00-2-2H4"></path>
                    </svg>
                  </div>
                  <h3 className={`font-sans font-bold text-base text-gray-900 mt-6 transition-colors group-hover:text-[#005748] ${fontClass}`}>
                    {t.section3.step4Title}
                  </h3>
                  <p className={`text-gray-500 text-xs md:text-sm leading-relaxed mt-2 max-w-[200px] mx-auto ${fontClass}`}>
                    {t.section3.step4Desc}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Section 4: Visit the Farm */}
        <section id="visit" className="relative overflow-hidden min-h-[80vh] bg-white text-[#111827] flex items-center py-20 md:py-28 border-t border-gray-100">
          {riverLayer("visit")}
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              {/* Left Column: Text Content */}
              <div className="md:col-span-6 flex flex-col items-start text-left relative z-10">
                <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-bold bg-[#005748]/10 text-[#005748] border border-[#005748]/20 uppercase tracking-widest mb-6 ${fontClass}`}>
                  {t.section4.pill}
                </span>

                <h2 className={`${calSansHeading.className} ${fontClass} font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-gray-900 mb-6`}>
                  {t.section4.title}
                </h2>

                <p className={`text-gray-600 text-sm sm:text-base md:text-lg leading-[1.65] max-w-xl font-normal mb-8 ${fontClass}`}>
                  {t.section4.description}
                </p>

                <button className={`py-3.5 px-8 bg-[#005748] text-white hover:bg-[#004337] transition-all rounded-full shadow-md hover:shadow-lg active:scale-95 font-bold text-sm cursor-pointer ${fontClass}`}>
                  {t.section4.cta}
                </button>
              </div>

              {/* Right Column: Visual farm visit card mockup */}
              <div className="md:col-span-6 relative w-full aspect-[4/3] md:aspect-[3/2] rounded-2xl overflow-hidden border border-gray-200 shadow-xl relative group">
                <Image
                  src="/images/farms/majuli_hero.png"
                  alt="Assam organic tea field visit experience"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Overlay card descriptor */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between text-left">
                  <div>
                    <h4 className="text-white text-sm font-bold font-sans">Majuli Tea Experience</h4>
                    <p className="text-emerald-200 text-xs mt-0.5">Meet farmer Ananya Dutta • Majuli Island</p>
                  </div>
                  <span className="text-xs bg-white/15 px-2.5 py-1 rounded-full font-mono font-bold text-[#FCD02C]">Active tour</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Explore Our Produce */}
        <section id="produce-explore" className="bg-[#FAF8F5] py-20 md:py-28 border-t border-gray-100 relative z-20">
          {riverLayer("produce-explore")}
          <div className="relative z-10 max-w-7xl mx-auto px-6">

            {/* Header Content */}
            <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
              <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-bold bg-[#005748]/10 text-[#005748] border border-[#005748]/20 uppercase tracking-widest mb-6 ${fontClass}`}>
                {t.section5.pill}
              </span>
              
              <h2 className={`${calSansHeading.className} ${fontClass} text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-6`}>
                {t.section5.title}
              </h2>
              
              <p className={`text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto ${fontClass}`}>
                {t.section5.description}
              </p>
            </div>

            {/* Produce Grid from Database API */}
            <div className="flex flex-nowrap overflow-x-auto gap-4 snap-x snap-mandatory -mx-6 px-6 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:snap-none max-w-6xl mx-auto mb-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {products.map((product) => {
                const isAvailable = product.availability_status === "available";
                return (
                  <Link href={`/products/${product.id}`} key={product.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer w-[168px] shrink-0 snap-start md:w-auto md:shrink">
                    <div>
                      {/* Product Image */}
                      <div className="relative w-full aspect-square md:aspect-[4/3] bg-gray-50 overflow-hidden">
                        <Image
                          src={product.image1}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-103 transition-transform duration-300"
                          sizes="(max-width: 768px) 40vw, 25vw"
                        />
                        {/* Status tag */}
                        <div className="absolute top-2 right-2 md:top-3 md:right-3">
                          {isAvailable ? (
                            <span className="text-[9px] md:text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-wider">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[9px] md:text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-wider">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Text info */}
                      <div className="p-3 md:p-5 text-left">
                        {/* Tags */}
                        <span className="hidden md:inline-block text-[9px] font-bold text-[#005748] tracking-wider uppercase bg-[#005748]/5 px-2 py-0.5 rounded-sm">
                          {product.tags.split(",")[0].trim()}
                        </span>

                        <h3 className={`font-sans font-bold text-gray-900 text-sm md:text-base mt-0 md:mt-2.5 line-clamp-1 group-hover:text-[#005748] transition-colors ${fontClass}`}>
                          {product.name}
                        </h3>

                        <p className={`hidden md:block text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed ${fontClass}`}>
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom action drawer */}
                    <div className="p-3 pt-0 md:p-5 md:pt-0 border-t border-gray-50 flex items-center justify-between text-xs mt-auto">
                      {isAvailable ? (
                        <div className="flex flex-col items-start">
                          <div className="flex items-baseline gap-1">
                            <span className="font-extrabold text-[#005748] text-sm md:text-base">₹{product.discount_price}</span>
                            <span className="text-[9px] md:text-[10px] text-gray-400 line-through">₹{product.price}</span>
                          </div>
                          <span className="text-[9px] md:text-[10px] text-gray-400">per {product.measure_of_unit}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] md:text-[10px] font-bold text-amber-700">Harvest Timeline</span>
                          <span className="text-gray-900 font-semibold text-xs md:text-sm">{product.ready_by_timeline}</span>
                        </div>
                      )}

                      {/* Action text button */}
                      <span className={`text-[10px] md:text-[11px] font-bold tracking-wider uppercase border-b-2 border-transparent transition-all ${
                        isAvailable ? "text-[#005748] group-hover:border-[#005748]" : "text-amber-800 group-hover:border-amber-800"
                      }`}>
                        {isAvailable ? "Buy Now" : "Request"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Centered CTA */}
            <div className="text-center">
              <Link href="/products">
                <button className={`py-3.5 px-10 bg-[#005748] text-white hover:bg-[#004337] transition-all rounded-full shadow-md hover:shadow-lg active:scale-95 font-bold text-sm cursor-pointer ${fontClass}`}>
                  {t.section5.cta}
                </button>
              </Link>
            </div>

          </div>
        </section>
        </>
        )}
        </ScrollRiver>

        {/* Expanded Premium Footer */}
        <footer className="w-full bg-[#FAF8F5] border-t border-gray-200/80 pt-16 pb-8 relative z-20 text-sm text-gray-600">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-16">
            
            {/* Column 1: Brand & Tagline */}
            <div className="md:col-span-4 flex flex-col items-start text-left">
              <Image
                src={lang === "as" ? "/mekriha_assamese_logo.PNG" : "/mekriha_logo.png"}
                alt="Mekriha"
                width={160}
                height={34}
                className={lang === "as" ? "h-8 w-auto mb-4" : "h-7 w-auto mb-4"}
              />
              <p className={`font-semibold text-gray-900 mb-1 ${fontClass}`}>
                {t.footer.brand}
              </p>
              <p className={`text-gray-500 text-xs leading-relaxed max-w-sm mb-6 ${fontClass}`}>
                {t.footer.tagline}
              </p>
            </div>

            {/* Column 2: Explore links */}
            <div className="md:col-span-2 flex flex-col items-start text-left">
              <h4 className={`font-bold text-gray-900 mb-4 uppercase tracking-wider text-[11px] ${fontClass}`}>{t.footer.exploreTitle}</h4>
              <ul className="flex flex-col gap-2.5 text-xs font-medium text-gray-500">
                <li><a href="#home" className="hover:text-[#005748] transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-[#005748] transition-colors">About Mekriha</a></li>
                <li><a href="#produce-explore" className="hover:text-[#005748] transition-colors">Our Produce</a></li>
                <li><a href="#produce" className="hover:text-[#005748] transition-colors">Crop Journey</a></li>
                <li><a href="#visit" className="hover:text-[#005748] transition-colors">Visit Farms</a></li>
              </ul>
            </div>

            {/* Column 3: Our Farms */}
            <div className="md:col-span-2 flex flex-col items-start text-left">
              <h4 className={`font-bold text-gray-900 mb-4 uppercase tracking-wider text-[11px] ${fontClass}`}>{t.footer.ourFarmsTitle}</h4>
              <ul className="flex flex-col gap-2.5 text-xs font-medium text-gray-500">
                <li><a href="#about" className="hover:text-[#005748] transition-colors">Partner Farms</a></li>
                <li><a href="#about" className="hover:text-[#005748] transition-colors">Organic Farms</a></li>
                <li><a href="#about" className="hover:text-[#005748] transition-colors">Featured Farms</a></li>
                <li>
                  <button
                    onClick={() => setPartnerModalOpen(true)}
                    className="hover:text-[#005748] transition-colors bg-transparent border-none p-0 cursor-pointer font-medium text-left text-xs text-gray-500"
                  >
                    Become a Partner Farm
                  </button>
                </li>
                <li><a href="#visit" className="hover:text-[#005748] transition-colors">Farm Experiences</a></li>
              </ul>
            </div>

            {/* Column 4: Learn */}
            <div className="md:col-span-2 flex flex-col items-start text-left">
              <h4 className={`font-bold text-gray-900 mb-4 uppercase tracking-wider text-[11px] ${fontClass}`}>{t.footer.learnTitle}</h4>
              <ul className="flex flex-col gap-2.5 text-xs font-medium text-gray-500">
                <li><a href="#mission" className="hover:text-[#005748] transition-colors">Our Mission</a></li>
                <li><a href="#sustainability" className="hover:text-[#005748] transition-colors">Sustainability</a></li>
                <li><a href="#how-it-works" className="hover:text-[#005748] transition-colors">How Mekriha Works</a></li>
                <li><a href="#blog" className="hover:text-[#005748] transition-colors">Blog</a></li>
                <li><a href="#faq" className="hover:text-[#005748] transition-colors">FAQs</a></li>
              </ul>
            </div>

            {/* Column 5: Support */}
            <div className="md:col-span-2 flex flex-col items-start text-left">
              <h4 className={`font-bold text-gray-900 mb-4 uppercase tracking-wider text-[11px] ${fontClass}`}>{t.footer.supportTitle}</h4>
              <ul className="flex flex-col gap-2.5 text-xs font-medium text-gray-500">
                <li><a href="#contact" className="hover:text-[#005748] transition-colors">Contact Us</a></li>
                <li><a href="#help" className="hover:text-[#005748] transition-colors">Help Center</a></li>
                <li><a href="#shipping" className="hover:text-[#005748] transition-colors">Shipping</a></li>
                <li><a href="#privacy" className="hover:text-[#005748] transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-[#005748] transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar containing Newsletter signup and final copyright row */}
          <div className="max-w-7xl mx-auto px-6 border-t border-gray-200/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Newsletter Subscription */}
            <div className="flex flex-col items-start text-left gap-2 w-full md:w-auto">
              <h4 className={`font-bold text-gray-900 uppercase tracking-wider text-[11px] ${fontClass}`}>{t.footer.newsletterTitle}</h4>
              <div className="flex items-center gap-2 mt-1 w-full max-w-sm">
                <input
                  type="email"
                  placeholder={t.footer.newsletterPlaceholder}
                  className={`bg-white border border-gray-200 text-xs px-4 py-2.5 rounded-full w-full focus:outline-none focus:border-[#005748] shadow-sm ${fontClass}`}
                />
                <button className={`bg-[#005748] text-white hover:bg-[#004337] transition-all text-xs font-bold px-5 py-2.5 rounded-full shadow-sm whitespace-nowrap cursor-pointer ${fontClass}`}>
                  {t.footer.newsletterBtn}
                </button>
              </div>
            </div>

            {/* Bottom Copyright Text */}
            <div className={`text-gray-400 text-xs text-center md:text-right max-w-md leading-relaxed ${fontClass}`}>
              {t.footer.bottom}
            </div>

          </div>
        </footer>

        {/* Become a Partner Farm Modal Form */}
        {partnerModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-gray-100 animate-slide-down max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setPartnerModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-mono font-bold text-lg cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🚜</span>
                <h2 className={`${calSansHeading.className} text-2xl font-bold text-gray-900`}>
                  Become a Partner Farm
                </h2>
              </div>
              <p className="text-xs text-gray-500 mb-6 text-left">
                Register your organic farm with Mekriha to list crops, get digital visibility, and connect directly with urban markets.
              </p>

              <form onSubmit={handlePartnerRegisterSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-600 uppercase">Farm Name *</label>
                  <input
                    type="text"
                    required
                    value={registerFarmName}
                    onChange={(e) => setRegisterFarmName(e.target.value)}
                    placeholder="e.g. Kopili Valley Spices"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] w-full bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Farmer Name *</label>
                  <input
                    type="text"
                    required
                    value={registerFarmerName}
                    onChange={(e) => setRegisterFarmerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] w-full bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="Enter active phone number"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] w-full bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] w-full bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Total Area (Acres) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={registerTotalArea}
                    onChange={(e) => setRegisterTotalArea(e.target.value)}
                    placeholder="e.g. 12.5"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] w-full bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Primary Organic Crop *</label>
                  <input
                    type="text"
                    required
                    value={registerPrimaryCrop}
                    onChange={(e) => setRegisterPrimaryCrop(e.target.value)}
                    placeholder="e.g. Joha Rice / Yellow Mustard"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] w-full bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-600 uppercase">Farm Location / Address *</label>
                  <input
                    type="text"
                    required
                    value={registerLocation}
                    onChange={(e) => setRegisterLocation(e.target.value)}
                    placeholder="e.g. Rohadoi Village, Nagaon, Assam"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] w-full bg-white text-gray-800"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={registerSubmitted}
                  className="bg-[#005748] text-white py-3 rounded-full font-bold text-sm mt-4 sm:col-span-2 hover:bg-[#004337] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {registerSubmitted ? "Registering Your Farm..." : "Submit Registration"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
