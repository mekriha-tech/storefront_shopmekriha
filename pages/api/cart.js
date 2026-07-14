if (!global.mockCart) {
  global.mockCart = {
    items: [],
    total_price: 0
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!baseUrl) {
    return res.status(200).json(global.mockCart);
  }

  try {
    const response = await fetch(`${baseUrl}/api/cart`);
    if (!response.ok) throw new Error(`Railway server returned status ${response.status}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Proxy get-cart error:", err);
    return res.status(500).json({ error: "Failed to fetch Railway cart: " + err.message });
  }
}
