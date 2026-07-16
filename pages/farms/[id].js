import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Cal_Sans } from "next/font/google";
import usePersistentLanguage from "../../components/usePersistentLanguage";
import FloatingLanguageToggle from "../../components/FloatingLanguageToggle";

const calSansHeading = Cal_Sans({
  weight: "400",
  subsets: ["latin"],
});

export default function FarmPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lang, setLang] = usePersistentLanguage("en");
  const [farm, setFarm] = useState(null);
  const [farmProducts, setFarmProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Weather States
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Booking Modal States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    if (!id) return;

    // Fetch farm detail from local proxy endpoint
    fetch("/api/farms")
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((f) => f && f.id === id);
        setFarm(found || null);
        
        if (found) {
          // Fetch associated products
          fetch("/api/products")
            .then((r) => r.json())
            .then((productsData) => {
              const matchedProducts = productsData.filter((p) => p && p.farm_id === found.id);
              setFarmProducts(matchedProducts);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading farm details:", err);
        setLoading(false);
      });
  }, [id]);

  // Fetch Live Weather of the District / Address dynamically
  useEffect(() => {
    if (!farm) return;

    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";

    const generateMockForecast = () => {
      return Array.from({ length: 5 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + 1 + i);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const temp_max = 30 + (i % 2) - (i % 3);
        const temp_min = 24 + (i % 2);
        const descriptions = ["Showers", "Partly Cloudy", "Thunderstorm", "Clear Sky", "Passing Showers"];
        return {
          dayName,
          temp_max,
          temp_min,
          description: descriptions[i % descriptions.length],
        };
      });
    };

    function geocodeAddress(query) {
      return fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`)
        .then((res) => {
          if (!res.ok) throw new Error("Geocoding request failed");
          return res.json();
        })
        .then((data) => {
          if (data.results && data.results.length > 0) {
            return {
              lat: data.results[0].latitude,
              lon: data.results[0].longitude,
            };
          }
          throw new Error("No geocoding results found");
        });
    }

    function triggerOfflineFallback() {
      setWeather({
        temp: 29,
        description: "Passing Showers",
        humidity: 85,
        wind: 4.8,
        forecast: generateMockForecast(),
        source: "Offline Simulation",
      });
      setWeatherLoading(false);
    }

    function fallbackToHardcodedCoords() {
      if (farm?.latitude != null && farm?.longitude != null) {
        fetchWeatherByCoords(farm.latitude, farm.longitude);
        return;
      }
      const coordinatesString = farm?.coordinates || "";
      const matches = coordinatesString.match(/(\d+\.\d+)/g);
      if (matches && matches.length >= 2) {
        const lat = matches[0];
        const lon = matches[1];
        fetchWeatherByCoords(lat, lon);
      } else {
        triggerOfflineFallback();
      }
    }

    function fetchOpenMeteoWeather(lat, lon) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`)
        .then((res) => {
          if (!res.ok) throw new Error("Open-Meteo API call failed");
          return res.json();
        })
        .then((data) => {
          const temp = Math.round(data.current.temperature_2m);
          const humidity = data.current.relative_humidity_2m;
          const wind = data.current.wind_speed_10m;
          const code = data.current.weather_code;
          
          let description = "Partly Cloudy";
          if (code === 0) description = "Clear Sky";
          else if (code >= 1 && code <= 3) description = "Partly Cloudy";
          else if (code >= 45 && code <= 48) description = "Foggy";
          else if (code >= 51 && code <= 67) description = "Rainy";
          else if (code >= 80 && code <= 82) description = "Showers";
          else if (code >= 95) description = "Thunderstorm";

          const forecastList = [];
          if (data.daily && data.daily.time) {
            for (let i = 1; i <= 5 && i < data.daily.time.length; i++) {
              const dateStr = data.daily.time[i];
              const dailyCode = data.daily.weather_code[i];
              
              let dailyDesc = "Partly Cloudy";
              if (dailyCode === 0) dailyDesc = "Clear Sky";
              else if (dailyCode >= 1 && dailyCode <= 3) dailyDesc = "Partly Cloudy";
              else if (dailyCode >= 45 && dailyCode <= 48) dailyDesc = "Foggy";
              else if (dailyCode >= 51 && dailyCode <= 67) dailyDesc = "Rainy";
              else if (dailyCode >= 80 && dailyCode <= 82) dailyDesc = "Showers";
              else if (dailyCode >= 95) dailyDesc = "Thunderstorm";

              forecastList.push({
                dayName: new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
                temp_max: Math.round(data.daily.temperature_2m_max[i]),
                temp_min: Math.round(data.daily.temperature_2m_min[i]),
                description: dailyDesc,
              });
            }
          }

          setWeather({
            temp,
            description,
            humidity,
            wind,
            forecast: forecastList,
            source: "Open-Meteo",
          });
          setWeatherLoading(false);
        })
        .catch((e) => {
          console.error("Open-Meteo API fetch failed:", e);
          triggerOfflineFallback();
        });
    }

    function fetchWeatherByCoords(lat, lon) {
      if (apiKey) {
        const currentPromise = fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
          .then((res) => {
            if (!res.ok) throw new Error("OpenWeather current coordinates call failed");
            return res.json();
          });

        const forecastPromise = fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
          .then((res) => {
            if (!res.ok) throw new Error("OpenWeather forecast coordinates call failed");
            return res.json();
          });

        Promise.all([currentPromise, forecastPromise])
          .then(([currentData, forecastData]) => {
            const dailyForecasts = {};
            const todayStr = new Date().toISOString().split("T")[0];

            forecastData.list.forEach((item) => {
              const dateStr = item.dt_txt.split(" ")[0];
              if (dateStr === todayStr) return;
              if (!dailyForecasts[dateStr]) {
                dailyForecasts[dateStr] = {
                  temps: [],
                  descriptions: [],
                  icons: [],
                };
              }
              dailyForecasts[dateStr].temps.push(item.main.temp);
              dailyForecasts[dateStr].descriptions.push(item.weather[0].description);
              dailyForecasts[dateStr].icons.push(item.weather[0].main);
            });

            const forecastList = Object.keys(dailyForecasts)
              .slice(0, 5)
              .map((dateStr) => {
                const dayData = dailyForecasts[dateStr];
                const maxTemp = Math.round(Math.max(...dayData.temps));
                const minTemp = Math.round(Math.min(...dayData.temps));
                const midIdx = Math.floor(dayData.descriptions.length / 2);
                return {
                  dayName: new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
                  temp_max: maxTemp,
                  temp_min: minTemp,
                  description: dayData.descriptions[midIdx] || "Partly Cloudy",
                };
              });

            setWeather({
              temp: Math.round(currentData.main.temp),
              description: currentData.weather[0].description,
              humidity: currentData.main.humidity,
              wind: currentData.wind.speed,
              forecast: forecastList,
              source: "OpenWeatherMap",
            });
            setWeatherLoading(false);
          })
          .catch((err) => {
            console.warn("OpenWeather coords fetch failed, falling back to Open-Meteo...", err);
            fetchOpenMeteoWeather(lat, lon);
          });
      } else {
        fetchOpenMeteoWeather(lat, lon);
      }
    }

    const address = farm?.address || "";
    const district = farm?.district || "";
    
    // Clean up zip codes from address query
    const cleanAddress = address.replace(/-\s*\d+\s*$/g, "").trim();

    if (cleanAddress) {
      geocodeAddress(cleanAddress)
        .then((coords) => {
          fetchWeatherByCoords(coords.lat, coords.lon);
        })
        .catch(() => {
          if (district) {
            geocodeAddress(district)
              .then((coords) => {
                fetchWeatherByCoords(coords.lat, coords.lon);
              })
              .catch(() => {
                fallbackToHardcodedCoords();
              });
          } else {
            fallbackToHardcodedCoords();
          }
        });
    } else if (district) {
      geocodeAddress(district)
        .then((coords) => {
          fetchWeatherByCoords(coords.lat, coords.lon);
        })
        .catch(() => {
          fallbackToHardcodedCoords();
        });
    } else {
      fallbackToHardcodedCoords();
    }
  }, [farm]);

  // Handle farm visit reservation submission
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingSubmitted(true);

    const bookingPayload = {
      farm_id: farm?.id || "",
      full_name: visitorName,
      phone: visitorPhone,
      email: visitorEmail || undefined
    };

    fetch("/api/farm-visits/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bookingPayload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Booking request failed");
        return res.json();
      })
      .then(() => {
        setBookingSubmitted(false);
        setBookingModalOpen(false);
        setVisitorName("");
        setVisitorPhone("");
        setVisitorEmail("");
        alert("Success! Your farm visit booking has been created. The farm coordinator will call you to confirm directions.");
      })
      .catch((err) => {
        console.error("Booking error:", err);
        setBookingSubmitted(false);
        alert("Failed to submit visit request. Please check your connection and try again.");
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-sans text-gray-800">
        <FloatingLanguageToggle lang={lang} setLang={setLang} />
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005748] mx-auto mb-4"></div>
          <p className="font-semibold text-sm text-gray-600">Loading Farm Profile...</p>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-sans text-gray-800">
        <FloatingLanguageToggle lang={lang} setLang={setLang} />
        <div className="text-center bg-white p-8 border border-gray-100 shadow-xl rounded-2xl max-w-md mx-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Profile Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">The organic farm profile you are looking for does not exist or has been moved.</p>
          <Link
            href="/"
            className="py-2.5 px-6 bg-[#005748] text-white font-bold hover:bg-[#004337] transition inline-block text-sm rounded-full shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{farm?.name || "Partner Farm"} - Mekriha Partner Farm</title>
        <meta name="description" content={`Explore ${farm?.name || ""} in ${farm?.district || ""}, Assam. Dynamic details about organic harvesting of ${farm?.harvest || ""}.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <FloatingLanguageToggle lang={lang} setLang={setLang} />

      <div className="min-h-screen bg-[#FAF8F5] text-gray-900 flex flex-col justify-between font-sans selection:bg-[#005748]/10">
        {/* Navigation / Back Header */}
        <header className="w-full bg-[#FAF8F5]/85 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 py-5">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <Image
                src="/mekriha_logo.png"
                alt="Mekriha"
                width={160}
                height={34}
                priority
                className="h-7 md:h-8 w-auto"
              />
            </Link>
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#005748] transition-colors flex items-center gap-1"
            >
              ← Back to Home
            </Link>
          </div>
        </header>

        {/* Profile Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-12 gap-12 md:gap-16 items-start">
          
          {/* Left Column: Huge Farm Image */}
          <div className="col-span-12 md:col-span-6 relative w-full aspect-[4/3] md:aspect-[3/2] border border-gray-100 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            {farm?.heroImage && (
              <Image
                src={farm.heroImage}
                alt={`${farm?.name || "Farm"} agricultural fields`}
                fill
                priority
                className="object-cover"
                sizes="(max-w-768px) 100vw, 50vw"
              />
            )}
          </div>

          {/* Right Column: Left-aligned Farm Info */}
          <div className="col-span-12 md:col-span-6 flex flex-col text-left">
            {/* Header Badge */}
            <div className="flex items-center gap-4 mb-6">
              {/* Circular Logo Badge */}
              <div className="w-16 h-16 rounded-full border border-gray-100 bg-white shadow-md flex items-center justify-center overflow-hidden p-0.5 shrink-0 select-none">
                <div className="w-full h-full relative rounded-full overflow-hidden">
                  {farm?.logoImage && (
                    <Image
                      src={farm.logoImage}
                      alt={`${farm?.name || "Farm"} logo`}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
              <div>
                <span className="inline-flex items-center py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-[#005748]/10 text-[#005748] uppercase tracking-wider">
                  Partner Farm
                </span>
                <h1 className={`${calSansHeading.className} font-bold text-3xl sm:text-4xl text-gray-900 mt-1 leading-tight tracking-tight`}>
                  {farm?.name}
                </h1>
              </div>
            </div>

            {/* Coordinates / Meta Grid */}
            <div className="grid grid-cols-2 gap-4 border border-gray-100 p-5 bg-white shadow-sm rounded-2xl mb-6 text-sm">
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Farmer In Charge</span>
                <span className="font-semibold text-gray-800">{farm?.farmerName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Established</span>
                <span className="font-semibold text-gray-800">{farm?.established || "Not specified"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Land Size</span>
                <span className="font-semibold text-gray-800">{farm?.sizeAcres} Acres</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Coordinates</span>
                <span className="font-semibold text-gray-800">{farm?.coordinates || "Not specified"}</span>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="border border-gray-150/80 p-5 bg-white shadow-sm rounded-2xl mb-6 flex flex-col justify-between items-stretch">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Current Weather in {farm?.district || ""}</h3>
                <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Live
                </span>
              </div>
              {weatherLoading ? (
                <div className="py-4 flex justify-center items-center">
                  <div className="animate-pulse flex gap-2 items-center">
                    <div className="w-2.5 h-2.5 bg-gray-200 rounded-full"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ) : weather ? (
                <>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {weather?.description?.toLowerCase().includes("rain") || weather?.description?.toLowerCase().includes("drizzle") || weather?.description?.toLowerCase().includes("shower") ? "🌧️" :
                         weather?.description?.toLowerCase().includes("clear") || weather?.description?.toLowerCase().includes("sunny") ? "☀️" :
                         weather?.description?.toLowerCase().includes("cloud") ? "⛅" :
                         weather?.description?.toLowerCase().includes("thunder") ? "⛈️" : "☁️"}
                      </span>
                      <div className="text-left">
                        <span className="text-2xl font-extrabold text-gray-900">{weather?.temp}°C</span>
                        <span className="text-xs text-gray-500 block capitalize">{weather?.description}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 font-medium">
                      <span className="block">Humidity: {weather?.humidity}%</span>
                      <span className="block">Wind: {weather?.wind} km/h</span>
                    </div>
                  </div>

                  {weather.forecast && weather.forecast.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2.5 text-left">5-Day Forecast</h4>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center">
                        {weather.forecast.map((day, idx) => {
                          const dayIcon = day.description?.toLowerCase().includes("rain") || day.description?.toLowerCase().includes("drizzle") || day.description?.toLowerCase().includes("shower") ? "🌧️" :
                                          day.description?.toLowerCase().includes("clear") || day.description?.toLowerCase().includes("sunny") ? "☀️" :
                                          day.description?.toLowerCase().includes("cloud") ? "⛅" :
                                          day.description?.toLowerCase().includes("thunder") ? "⛈️" : "☁️";
                          return (
                            <div key={idx} className="flex flex-col items-center bg-gray-50/50 p-1.5 rounded-xl border border-gray-100 hover:bg-emerald-50/20 hover:border-emerald-100/50 transition-all duration-200">
                              <span className="text-[9px] font-bold text-gray-500">{day.dayName}</span>
                              <span className="text-base my-0.5" title={day.description}>{dayIcon}</span>
                              <span className="text-[11px] font-extrabold text-gray-900">{day.temp_max}°</span>
                              <span className="text-[9px] font-semibold text-gray-400">{day.temp_min}°</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[9px] text-gray-400 font-medium">
                    <span>Source: <span className="text-gray-500 font-bold">{weather.source}</span></span>
                    {weather.source !== "Offline Simulation" && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Synchronized
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Weather details temporarily offline</p>
              )}
            </div>

            {/* About Narrative */}
            <div className="mb-8">
              <h2 className={`${calSansHeading.className} text-xl font-bold mb-2 text-gray-900 tracking-tight`}>Backstory & Ethos</h2>
              <p className="text-gray-600 leading-[1.65] text-sm sm:text-base font-normal">
                {farm?.about}
              </p>
            </div>

            {/* Harvest Display */}
            <div className="border border-emerald-100 bg-emerald-50/50 p-6 rounded-2xl mb-6">
              <h2 className="text-xs uppercase font-bold text-emerald-800 mb-2 tracking-wider">🌾 Active Organic Harvest</h2>
              <p className="font-semibold text-lg text-emerald-900">
                {farm?.harvest}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {farm?.certifications?.map((cert, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold border border-emerald-200 bg-white text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm"
                  >
                    ✓ {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Book Farm Visit Button & Address */}
            <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-1">Physical Address</span>
                <p className="text-sm text-gray-600 leading-relaxed text-left">
                  📍 {farm?.address}
                </p>
              </div>
              <button
                onClick={() => setBookingModalOpen(true)}
                className="py-3 px-6 bg-[#005748] text-white hover:bg-[#004337] transition-all rounded-full font-bold text-sm tracking-wider shadow-sm shrink-0 cursor-pointer active:scale-95"
              >
                Book Farm Visit
              </button>
            </div>
          </div>

          {/* Bottom Row: Products Produced By This Farm */}
          {farmProducts.length > 0 && (
            <div className="col-span-12 border-t border-gray-150 pt-12 mt-8 text-left">
              <h2 className={`${calSansHeading.className} text-2xl font-bold text-gray-900 tracking-tight mb-8`}>
                Crops Cultivated Here
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {farmProducts.map((product) => {
                  const isAvailable = product?.availability_status === "available";
                  return (
                    <Link
                      href={`/products/${product?.id}`}
                      key={product?.id}
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {/* Crop Image */}
                        <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden border-b border-gray-50">
                          {product?.image1 && (
                            <Image
                              src={product.image1}
                              alt={product?.name || "Crop"}
                              fill
                              className="object-cover group-hover:scale-103 transition-transform duration-500"
                              sizes="(max-w-768px) 100vw, 33vw"
                            />
                          )}
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

                        {/* Product Info */}
                        <div className="p-5 text-left">
                          <span className="text-[9px] font-bold text-[#005748] tracking-wider uppercase bg-[#005748]/5 px-2 py-0.5 rounded-sm">
                            {product?.tags?.split(",")[0]?.trim() || "Organic"}
                          </span>
                          <h3 className="font-sans font-bold text-gray-900 text-base mt-2.5 line-clamp-1 group-hover:text-[#005748] transition-colors">
                            {product?.name}
                          </h3>
                          <p className="text-gray-505 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                            {product?.description}
                          </p>
                        </div>
                      </div>

                      {/* Info footer drawer */}
                      <div className="p-5 pt-0 border-t border-gray-50 flex items-center justify-between text-xs mt-auto">
                        {isAvailable ? (
                          <div className="flex flex-col items-start">
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-[#005748] text-base">₹{product?.discount_price}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">per {product?.measure_of_unit}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-amber-700">Ready date</span>
                            <span className="text-gray-900 font-semibold">{product?.ready_by_timeline}</span>
                          </div>
                        )}
                        <span className="text-[10px] font-bold tracking-wider uppercase text-[#005748] group-hover:underline">
                          {isAvailable ? "Buy Now" : "Request"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Book Visit Modal Form */}
        {bookingModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-155 animate-slide-down">
              {/* Close Button */}
              <button
                onClick={() => setBookingModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-mono font-bold text-lg cursor-pointer"
              >
                ✕
              </button>

              <h2 className={`${calSansHeading.className} text-2xl font-bold text-gray-900 mb-2`}>
                Book a Farm Visit
              </h2>
              <p className="text-xs text-gray-505 mb-6">
                Fill in details to request an guided experience tour at {farm?.name || ""}.
              </p>

              <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Enter your full name"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={bookingSubmitted}
                  className="bg-[#005748] text-white py-3 rounded-full font-bold text-sm mt-4 hover:bg-[#004337] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {bookingSubmitted ? "Booking Your Tour..." : "Request Tour Booking"}
                </button>
              </form>
            </div>
          </div>
        )}

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
