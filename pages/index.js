import Head from "next/head";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Mekriha - Farmer-First Marketplace</title>
        <meta
          name="description"
          content="Where every harvest finds its true value. Mekriha is a farmer-first marketplace built to reconnect people with the true source of their food."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        className="font-sans min-h-screen flex flex-col justify-between overflow-x-hidden"
      >
        {/* Navigation Bar */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 md:py-10 flex items-center justify-between relative z-50">
          {/* Logo */}
          <div className="flex items-center">
            <span className="font-sans font-black text-3xl md:text-[38px] tracking-tight text-[#141414] cursor-pointer hover:opacity-90 transition-opacity">
              Logo
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12 font-mono text-[17px] font-normal text-[#141414]">
            <a
              href="#home"
              className="relative group py-1 transition-colors hover:text-black"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#about"
              className="relative group py-1 transition-colors hover:text-black"
            >
              About Mekriha
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#produce"
              className="relative group py-1 transition-colors hover:text-black"
            >
              Our Produce
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#visit"
              className="relative group py-1 transition-colors hover:text-black"
            >
              Visit Farms
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 focus:outline-none z-50"
            aria-label="Toggle Menu"
            id="mobile-menu-toggle"
          >
            <span
              className={`h-0.5 w-6 bg-[#141414] transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-[#141414] transition-opacity duration-300 ${mobileMenuOpen ? "opacity-0" : ""
                }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-[#141414] transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
            ></span>
          </button>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-[#FAF6D9] border-b border-[#141414]/10 px-6 py-8 flex flex-col gap-6 md:hidden shadow-xl animate-slide-down z-40">
              <nav className="flex flex-col gap-4 font-mono text-[18px] font-normal text-[#141414]">
                <a
                  href="#home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-black transition-colors"
                >
                  Home
                </a>
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-black transition-colors"
                >
                  About Mekriha
                </a>
                <a
                  href="#produce"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-black transition-colors"
                >
                  Our Produce
                </a>
                <a
                  href="#visit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-black transition-colors"
                >
                  Visit Farms
                </a>
              </nav>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden h-[82vh]">
          {/* Full-width Hero Image */}
          <div className="absolute inset-y-0 right-0 w-[95vw] lg:w-[95vw] xl:w-[95vw] pointer-events-none">
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
          <div className="relative z-10 max-w-7xl mx-auto px-3 h-full">
            <div className="grid md:grid-cols-12 lg:mt-30 min-h-[650px] lg:min-h-[760px]">
              {/* Left Column */}
              <div className="md:col-span-8 lg:col-span-8">
                <h1 className="font-sans font-black text-[36px] sm:text-[34px] md:text-[36px] lg:text-[36px] xl:text-[36px] leading-[1.08] tracking-tight text-[#141414]">
                  Where Every Harvest Finds Its True Value
                </h1>

                <p className="font-mono text-sm sm:text-base text-[#222222] leading-[1.7] mt-6 md:mt-8 max-w-xl">
                  Mekriha is a farmer-first marketplace built to reconnect people with
                  the true source of their food. We believe every harvest represents
                  months of dedication, care, and hard work — and that value should
                  reach the farms that grow it.
                </p>

                <div className="flex items-center gap-4 mt-8 font-mono">
                  <button className="py-3 px-8 border border-[#141414] text-[#141414] font-bold hover:bg-[#141414]/5 transition rounded-sm">
                    Know More
                  </button>

                  <button className="py-3 px-8 border border-[#141414] bg-[#FCD02C] text-[#141414] font-bold hover:bg-[#ebd25b] transition rounded-sm">
                    Our Produce
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Image */}
          <div className="relative w-full h-[360px] sm:h-[450px] md:hidden">
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
      </div>
    </>
  );
}

