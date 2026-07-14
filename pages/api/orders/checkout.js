if (!global.mockCart) {
  global.mockCart = {
    items: [],
    total_price: 0
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { full_name, phone, shipping_address } = req.body;
  if (!full_name || !phone || !shipping_address) {
    return res.status(400).json({ error: "Missing required fields: full_name, phone, shipping_address" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!baseUrl) {
    // Local mock database checkout
    if (global.mockCart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty. Cannot checkout." });
    }

    const orderId = Math.floor(Math.random() * 90000) + 10000;
    const totalAmount = global.mockCart.total_price;
    const purchasedItems = [...global.mockCart.items];

    global.mockCart.items = [];
    global.mockCart.total_price = 0;

    return res.status(200).json({
      status: "pending",
      order_id: orderId,
      total_amount: totalAmount,
      purchased_items: purchasedItems
    });
  }

  try {
    const response = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        full_name,
        phone,
        shipping_address
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway server returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Proxy checkout error:", err);
    return res.status(500).json({ error: "Failed to process Railway order checkout: " + err.message });
  }
}
