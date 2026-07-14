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

  const { product_id, quantity } = req.body;
  if (!product_id || !quantity) {
    return res.status(400).json({ error: "Missing required fields: product_id, quantity" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!baseUrl) {
    // Local mock database cart
    const parsedId = parseInt(product_id);
    const parsedQty = parseInt(quantity);
    
    const productsLookup = {
      1: { name: "Premium Joha Sual Rice", price: 150, measure_of_unit: "kg" },
      2: { name: "Orthodox Black Tea (Whole Leaf)", price: 580, measure_of_unit: "500g pack" },
      3: { name: "High-Curcumin Lakadong Turmeric", price: 280, measure_of_unit: "250g pack" },
      4: { name: "GI-Tagged Assam Kaji Nemu", price: 90, measure_of_unit: "dozen" }
    };

    const prodDetails = productsLookup[parsedId];
    if (!prodDetails) {
      return res.status(404).json({ error: "Product not found" });
    }

    const existingIndex = global.mockCart.items.findIndex(item => item.product_id === parsedId);
    if (existingIndex > -1) {
      global.mockCart.items[existingIndex].quantity += parsedQty;
    } else {
      global.mockCart.items.push({
        id: Math.floor(Math.random() * 1000),
        product_id: parsedId,
        name: prodDetails.name,
        price: prodDetails.price,
        measure_of_unit: prodDetails.measure_of_unit,
        quantity: parsedQty
      });
    }

    global.mockCart.total_price = global.mockCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return res.status(200).json({
      status: "success",
      message: "Product added to cart locally",
      cart: global.mockCart
    });
  }

  try {
    const response = await fetch(`${baseUrl}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_id: parseInt(product_id),
        quantity: parseInt(quantity)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway server returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Proxy add-to-cart error:", err);
    return res.status(500).json({ error: "Failed to add product to Railway cart: " + err.message });
  }
}
