export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { order_id, payment_id } = req.body;
  if (!order_id || !payment_id) {
    return res.status(400).json({ error: "Missing required fields: order_id, payment_id" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!baseUrl) {
    // Local mock database verify
    return res.status(200).json({
      status: "success",
      message: "Payment verified successfully (local mode)",
      order_id: parseInt(order_id),
      payment_id,
      verified_at: new Date().toISOString()
    });
  }

  try {
    const response = await fetch(`${baseUrl}/api/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        order_id: parseInt(order_id),
        payment_id
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway server returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Proxy payment verification error:", err);
    return res.status(500).json({ error: "Failed to verify payment on Railway backend: " + err.message });
  }
}
