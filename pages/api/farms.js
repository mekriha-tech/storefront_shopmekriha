export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  if (!baseUrl) {
    console.error("NEXT_PUBLIC_API_BASE_URL is not set - cannot reach the backend.");
    return res.status(500).json({ error: "Backend API URL is not configured." });
  }

  const initialsOf = (name) =>
    (name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "AF";

  try {
    const response = await fetch(`${baseUrl}/api/farms`);
    if (!response.ok) throw new Error(`Backend returned status ${response.status}`);
    const data = await response.json();

    // Map the backend's own Farm fields directly. No hardcoded fallback -
    // every field the storefront displays now has a real column on the
    // backend model.
    const mapped = data.map((serverFarm) => ({
      id: serverFarm.id.toString(),
      name: serverFarm.farm_name,
      farmerName: serverFarm.farmer_name || "Assam Farmer",
      address: serverFarm.location || "Assam, India",
      district: serverFarm.district || "Assam",
      state: serverFarm.state || "Assam",
      harvest: serverFarm.primary_crop || "Organic Grains",
      heroImage: serverFarm.farm_image || null,
      logoImage: serverFarm.logo_image || null,
      profileImage: initialsOf(serverFarm.farm_name),
      about: serverFarm.about || "A partner organic farm cultivating sustainable seasonal harvests.",
      established: serverFarm.established_year || null,
      sizeAcres: parseFloat(serverFarm.total_area_acres) || 0,
      certifications: serverFarm.certifications
        ? serverFarm.certifications.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
      latitude: serverFarm.latitude,
      longitude: serverFarm.longitude,
      coordinates:
        serverFarm.latitude != null && serverFarm.longitude != null
          ? `${serverFarm.latitude}° N, ${serverFarm.longitude}° E`
          : null
    }));

    return res.status(200).json(mapped);
  } catch (err) {
    console.error("Proxy error fetching farms from backend:", err);
    return res.status(502).json({ error: "Could not reach the backend." });
  }
}
