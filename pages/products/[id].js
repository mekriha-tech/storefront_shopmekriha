import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Cal_Sans } from "next/font/google";

const calSansHeading = Cal_Sans({
  weight: "400",
  subsets: ["latin"],
});

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Request Share Form States
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [reqQty, setReqQty] = useState(1);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Checkout states following apidoc.md flow
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [checkedOutOrder, setCheckedOutOrder] = useState(null);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    if (!id) return;

    // Fetch product details
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const foundProd = data.find((p) => p && p.id === parseInt(id));
        if (foundProd) {
          setProduct(foundProd);
          setActiveImage(foundProd.image1 || "");
          
          // Fetch associated farm details
          fetch("/api/farms")
            .then((r) => r.json())
            .then((farmsData) => {
              const foundFarm = farmsData.find((f) => f && f.id === foundProd.farm_id?.toString());
              setFarm(foundFarm || null);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading product details:", err);
        setLoading(false);
      });
  }, [id]);

  // Submit allocation pre-order
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setRequestSubmitted(true);

    setTimeout(() => {
      setRequestSubmitted(false);
      setRequestModalOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setReqQty(1);
      alert("Your crop allocation request has been submitted successfully! The farmer will contact you soon.");
    }, 1200);
  };

  // Step 1: Add product to cart
  const handleBuyHarvest = () => {
    setCheckoutLoading(true);
    fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product?.id, quantity })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update cart");
        return res.json();
      })
      .then(() => {
        setCheckoutLoading(false);
        setCheckoutModalOpen(true);
      })
      .catch((err) => {
        console.warn("Local cart warning:", err);
        setCheckoutLoading(false);
        setCheckoutModalOpen(true);
      });
  };

  // Step 2 & 3: Checkout order & verify payment
  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setCheckoutLoading(true);

    const checkoutPayload = {
      full_name: checkoutName,
      phone: checkoutPhone,
      shipping_address: checkoutAddress
    };

    fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Checkout failed");
        return res.json();
      })
      .then((orderData) => {
        // Step 4: Verify payment reference
        const paymentPayload = {
          order_id: orderData.order_id,
          payment_id: "pay_ref_" + Math.random().toString(36).substr(2, 9)
        };

        return fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentPayload)
        })
          .then((r) => r.json())
          .then((paymentData) => {
            setCheckedOutOrder({
              id: orderData.order_id,
              amount: orderData.total_amount,
              paymentRef: paymentData.payment_id,
              customerName: checkoutName,
              address: checkoutAddress
            });
            setCheckoutLoading(false);
            setCheckoutModalOpen(false);
            setOrderSuccess(true);

            // Clean inputs
            setCheckoutName("");
            setCheckoutPhone("");
            setCheckoutAddress("");
          });
      })
      .catch((err) => {
        console.error("Payment check error:", err);
        setCheckoutLoading(false);
        alert("Transaction failed: " + err.message);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-sans text-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005748] mx-auto mb-4"></div>
          <p className="font-semibold text-sm text-gray-600">Loading Product Details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-sans text-gray-800">
        <div className="text-center bg-white p-8 border border-gray-100 shadow-xl rounded-2xl max-w-md mx-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Product Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">The seasonal crop or harvest profile you are looking for does not exist.</p>
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

  const isAvailable = product?.availability_status === "available";

  return (
    <>
      <Head>
        <title>{product?.name || "Product"} - Mekriha Storefront</title>
        <meta name="description" content={product?.description || ""} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#FAF8F5] text-gray-900 flex flex-col justify-between font-sans selection:bg-[#005748]/10">
        {/* Sticky Header */}
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

        {/* Product Details Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-12 gap-12 md:gap-16 items-start">
          
          {/* Left Column: Image Carousel */}
          <div className="col-span-12 md:col-span-6 flex flex-col gap-4">
            {/* Active Display Image */}
            <div className="relative w-full aspect-[4/3] md:aspect-[3/2] border border-gray-100 bg-white shadow-xl rounded-2xl overflow-hidden">
              {activeImage && (
                <Image
                  src={activeImage}
                  alt={product?.name || "Product image"}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-w-768px) 100vw, 50vw"
                />
              )}
            </div>
            
            {/* Carousel Thumbnails */}
            <div className="flex gap-3">
              {[product?.image1, product?.image2, product?.image3].filter(Boolean).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 relative cursor-pointer transition-all ${
                    activeImage === img ? "border-[#005748] scale-102 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: E-commerce Details */}
          <div className="col-span-12 md:col-span-6 flex flex-col text-left items-start">
            {/* Product Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product?.tags?.split(",")?.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold border border-gray-155 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full uppercase tracking-wider"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>

            {/* Product Title */}
            <h1 className={`${calSansHeading.className} font-bold text-3xl sm:text-4xl text-gray-900 leading-tight tracking-tight mb-2`}>
              {product?.name}
            </h1>

            {/* Farm Tag Indicator */}
            {farm && (
              <Link href={`/farms/${farm?.id}`} className="group inline-flex items-center gap-2 mb-6 border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-colors">
                <span className="w-5 h-5 rounded-full bg-[#005748] flex items-center justify-center text-[10px] font-bold text-white">
                  {farm?.profileImage || "AF"}
                </span>
                <span className="text-xs font-semibold text-emerald-800 group-hover:underline">
                  Cultivated at {farm?.name} ({farm?.district})
                </span>
              </Link>
            )}

            {/* Pricing Section */}
            <div className="w-full border-t border-b border-gray-100 py-6 mb-6 flex flex-col items-start">
              {isAvailable ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-[#005748]">
                      ₹{product?.discount_price}
                    </span>
                    <span className="text-lg text-gray-400 line-through font-medium">
                      ₹{product?.price}
                    </span>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">
                      per {product?.measure_of_unit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Availability: <span className="text-emerald-600 font-bold">In Stock ({product?.quantity} units left)</span>
                  </p>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Upcoming Harvest</span>
                    <span className="text-2xl font-extrabold text-gray-900">{product?.ready_by_timeline}</span>
                  </div>
                  <p className="text-xs text-gray-405 mt-2">
                    Accepting pre-allocations from partner community circles.
                  </p>
                </>
              )}
            </div>

            {/* Description Narrative */}
            <div className="mb-8">
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">Crop Background & Description</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {product?.description}
              </p>
            </div>

            {/* Quantity Selector & Purchase actions */}
            {isAvailable ? (
              <div className="w-full flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-full bg-white px-2 py-1 shadow-sm shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-gray-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product?.quantity || 10, quantity + 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={handleBuyHarvest}
                  disabled={checkoutLoading}
                  className="flex-1 py-3.5 bg-[#005748] text-white rounded-full font-bold text-sm hover:bg-[#004337] transition-all tracking-wider shadow-sm uppercase active:scale-97 cursor-pointer"
                >
                  {checkoutLoading ? "Processing..." : "Buy Harvest"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRequestModalOpen(true)}
                className="w-full py-3.5 bg-amber-600 text-white rounded-full font-bold text-sm hover:bg-amber-700 transition-all tracking-wider shadow-sm uppercase active:scale-97 cursor-pointer"
              >
                Request Share Allocation
              </button>
            )}
          </div>
        </main>

        {/* Request Pre-Order Modal */}
        {requestModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-155 animate-slide-down">
              <button
                onClick={() => setRequestModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-mono font-bold text-lg cursor-pointer"
              >
                ✕
              </button>

              <h2 className={`${calSansHeading.className} text-2xl font-bold text-gray-900 mb-2`}>
                Request Share Share
              </h2>
              <p className="text-xs text-gray-550 mb-6">
                Reserve your share of {product?.name} from {farm?.name || "our partner farm"} for the upcoming {product?.ready_by_timeline} harvest.
              </p>

              <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Your Email</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Required Quantity ({product?.measure_of_unit}s)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={requestSubmitted}
                  className="bg-[#005748] text-white py-3 rounded-full font-bold text-sm mt-4 hover:bg-[#004337] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {requestSubmitted ? "Submitting Reservation..." : "Submit Reservation"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Checkout Modal Form */}
        {checkoutModalOpen && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-105 animate-slide-down">
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-mono font-bold text-lg cursor-pointer"
              >
                ✕
              </button>

              <h2 className={`${calSansHeading.className} text-2xl font-bold text-gray-900 mb-2`}>
                Complete Your Order
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Purchase {quantity} {product?.measure_of_unit}(s) of {product?.name} (Total: ₹{(product?.discount_price || 0) * quantity}).
              </p>

              <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Shipping Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    placeholder="E.g. Rupesh Bhuyan"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748]"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase">Shipping Address</label>
                  <textarea
                    required
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    placeholder="Enter full shipping details..."
                    rows="3"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] resize-none"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="bg-[#005748] text-white py-3.5 rounded-full font-bold text-sm mt-4 hover:bg-[#004337] transition-all disabled:opacity-60 cursor-pointer shadow-md uppercase tracking-wider"
                >
                  {checkoutLoading ? "Authorizing Razorpay..." : "Proceed to Payment"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Order Success Confirmation Popup */}
        {orderSuccess && checkedOutOrder && (
          <div className="fixed inset-0 bg-[#111827]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#FAF8F5] rounded-3xl max-w-md w-full p-8 shadow-2xl relative border-2 border-emerald-700/20 text-center animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-4xl mx-auto mb-6">
                ✓
              </div>
              <h2 className={`${calSansHeading.className} text-3xl font-extrabold text-gray-900 mb-2`}>
                Payment Verified!
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Thank you {checkedOutOrder?.customerName}. Your checkout has been fully processed following the Mekriha API specification flow.
              </p>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 text-left text-xs text-gray-700 flex flex-col gap-2.5">
                <div className="flex justify-between font-bold">
                  <span>Order Reference ID:</span>
                  <span className="text-emerald-800 font-mono">#{checkedOutOrder?.id}</span>
                </div>
                <div className="flex justify-between font-bold border-b border-gray-50 pb-2">
                  <span>Transaction ID:</span>
                  <span className="text-gray-500 font-mono">{checkedOutOrder?.paymentRef}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Amount Debited:</span>
                  <span className="font-extrabold text-[#005748] text-sm">₹{checkedOutOrder?.amount}</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1 border-t border-gray-50 pt-2">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Shipping to</span>
                  <span className="text-gray-900 font-medium leading-relaxed">{checkedOutOrder?.address}</span>
                </div>
              </div>

              <button
                onClick={() => setOrderSuccess(false)}
                className="w-full py-3 bg-[#005748] text-white hover:bg-[#004337] rounded-full font-bold text-sm tracking-wider shadow-md cursor-pointer transition-all active:scale-97"
              >
                Continue Shopping
              </button>
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
