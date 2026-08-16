export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  if (!baseUrl) {
    console.error("NEXT_PUBLIC_API_BASE_URL is not set - cannot reach the backend.");
    return res.status(500).json({ error: "Backend API URL is not configured." });
  }

  try {
    const response = await fetch(`${baseUrl}/api/products`);
    if (!response.ok) throw new Error(`Backend returned status ${response.status}`);
    const data = await response.json();

    // Map the backend's own Product fields directly. No hardcoded fallback
    // list, no matching-by-name - every field the storefront displays comes
    // straight from the real Product row.
    const mapped = data.map((serverProduct) => ({
      id: serverProduct.id,
      farm_id: serverProduct.farm_id.toString(),
      farm_name: serverProduct.farm_name,
      name: serverProduct.name,
      tags: serverProduct.tags || "Organic",
      description: serverProduct.description || "Fresh crop cultivated naturally on our partner farm.",
      price: parseFloat(serverProduct.price) || null,
      discount_price: parseFloat(serverProduct.discount_price) || null,
      ready_by_timeline: serverProduct.ready_by_timeline,
      measure_of_unit: serverProduct.measure_of_unit,
      quantity: parseInt(serverProduct.quantity) || 0,
      availability_status: serverProduct.availability_status === "Available" ? "available" : "ready_by_timeline",
      image1: serverProduct.image1 || null,
      image2: serverProduct.image2 || null,
      image3: serverProduct.image3 || null
    }));

    return res.status(200).json(mapped);
  } catch (err) {
    console.error("Proxy error fetching products from backend:", err);
    return res.status(502).json({ error: "Could not reach the backend." });
  }
}
