export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { farm_id, full_name, phone, email } = req.body;
  if (!farm_id || !full_name || !phone) {
    return res.status(400).json({ error: "Missing required fields: farm_id, full_name, phone" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!baseUrl) {
    // Local mock database fallback
    return res.status(201).json({
      status: "success",
      message: "Farm visit booked successfully (local mode)",
      booking: {
        id: Math.floor(Math.random() * 100000),
        farm_id,
        full_name,
        phone,
        email: email || null,
        created_at: new Date().toISOString()
      }
    });
  }

  try {
    // Format parameters as URL encoded form body as expected by the backend
    const formBody = [];
    formBody.push("farm_id=" + encodeURIComponent(farm_id));
    formBody.push("full_name=" + encodeURIComponent(full_name));
    formBody.push("phone=" + encodeURIComponent(phone));
    if (email) formBody.push("email=" + encodeURIComponent(email));
    
    const requestBody = formBody.join("&");

    const response = await fetch(`${baseUrl}/api/farm-visits/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: requestBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway server returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return res.status(201).json(data);
  } catch (err) {
    console.error("Proxy booking error:", err);
    return res.status(500).json({ error: "Failed to submit booking to Railway backend: " + err.message });
  }
}
