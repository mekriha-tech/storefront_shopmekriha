export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { farm_name, farmer_name, phone, email, location, total_area_acres } = req.body;
  if (!farm_name || !farmer_name || !phone || !location || total_area_acres === undefined) {
    return res.status(400).json({ error: "Missing required fields: farm_name, farmer_name, phone, location, total_area_acres" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!baseUrl) {
    // Local mock database fallback
    return res.status(201).json({
      status: "success",
      message: "Farm registered successfully (local mode)",
      farm: {
        id: Math.floor(Math.random() * 100000),
        farm_name,
        farmer_name,
        phone,
        email: email || null,
        location,
        total_area_acres: parseFloat(total_area_acres),
        primary_crop: "",
        created_at: new Date().toISOString()
      }
    });
  }

  try {
    // Format parameters as URL encoded form body as expected by the backend
    const formBody = [];
    formBody.push("farm_name=" + encodeURIComponent(farm_name));
    formBody.push("farmer_name=" + encodeURIComponent(farmer_name));
    formBody.push("phone=" + encodeURIComponent(phone));
    if (email) formBody.push("email=" + encodeURIComponent(email));
    formBody.push("location=" + encodeURIComponent(location));
    formBody.push("total_area_acres=" + encodeURIComponent(total_area_acres));
    formBody.push("primary_crop=");
    
    const requestBody = formBody.join("&");

    const response = await fetch(`${baseUrl}/api/farms/register`, {
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
    console.error("Proxy registration error:", err);
    return res.status(500).json({ error: "Failed to submit registration to Railway backend: " + err.message });
  }
}
