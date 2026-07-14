export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const staticFarms = [
    {
      id: "3",
      name: "Rohadoi Organic Farm",
      farmerName: "Rupesh Bhuyan",
      address: "Rohadoi Village, Nagaon, Assam - 782001",
      district: "Nagaon",
      state: "Assam",
      harvest: "Heritage Joha Rice & Organic Yellow Mustard",
      heroImage: "/images/farms/rohadoi_hero.png",
      logoImage: "/images/farms/rohadoi_logo.png",
      profileImage: "RF",
      about: "Rohadoi Organic Farm is dedicated to restoring heritage rice varieties and chemical-free mustard oil production in Nagaon. By following ancient crop rotation techniques combined with modern composting, we bring pure flavor back to your plate.",
      established: 2017,
      sizeAcres: 12.5,
      certifications: ["PGS-India Organic", "NPOP Certified"],
      coordinates: "26.3484° N, 92.6841° E"
    },
    {
      id: "4",
      name: "Majuli Heritage Tea Estate",
      farmerName: "Hemo Payeng",
      address: "Kamalabari, Majuli Island, Assam - 785104",
      district: "Majuli",
      state: "Assam",
      harvest: "Assam Orthodox Black Tea & Purple Tea",
      heroImage: "/images/farms/majuli_hero.png",
      logoImage: "/images/farms/majuli_logo.png",
      profileImage: "MT",
      about: "Located on the world's largest river island, Majuli Heritage Tea Estate produces organic, handmade orthodox black tea. Every leaf is hand-plucked and processed in small batches using traditional techniques to preserve the unique riverine terroir.",
      established: 2019,
      sizeAcres: 24.0,
      certifications: ["Fairtrade Certified", "NPOP Organic"],
      coordinates: "26.9602° N, 94.2185° E"
    },
    {
      id: "5",
      name: "Kopili Valley Spices",
      farmerName: "Devabrata Hazarika",
      address: "Mariani Road, Jorhat, Assam - 785008",
      district: "Jorhat",
      state: "Assam",
      harvest: "Organic Karbi Anglong Ginger & Lakadong Turmeric",
      heroImage: "/images/farms/jorhat_hero.png",
      logoImage: "/images/farms/rohadoi_logo.png",
      profileImage: "KV",
      about: "Jorhat's rich alluvial plains provide the perfect climate for our high-curcumin Lakadong turmeric and fibrous organic ginger. We partner with local self-help groups to cultivate, harvest, and dry our spices naturally under the sun.",
      established: 2015,
      sizeAcres: 8.2,
      certifications: ["USDA Organic", "India Organic"],
      coordinates: "26.7509° N, 94.2037° E"
    },
    {
      id: "6",
      name: "Dihing Citrus Groves",
      farmerName: "Prabal Saikia",
      address: "Mangaldai, Darrang, Assam - 784125",
      district: "Darrang",
      state: "Assam",
      harvest: "Kaji Nemu (Assam Lemon) & Assam Bhut Jolokia",
      heroImage: "/images/farms/darrang_hero.png",
      logoImage: "/images/farms/majuli_logo.png",
      profileImage: "DC",
      about: "Dihing Citrus Groves is Assam's premier grower of GI-tagged Kaji Nemu (Assam Lemons) and fiery Bhut Jolokia (Ghost Peppers). We pride ourselves on drip-irrigation water management and organic vermicompost fertilization.",
      established: 2021,
      sizeAcres: 15.0,
      certifications: ["PGS-India Green", "NPOP Organic"],
      coordinates: "26.4312° N, 92.0308° E"
    }
  ];

  if (!baseUrl) {
    return res.status(200).json(staticFarms);
  }

  try {
    const response = await fetch(`${baseUrl}/api/farms`);
    if (!response.ok) throw new Error(`Railway backend returned status ${response.status}`);
    const data = await response.json();

    const enriched = data.map((serverFarm) => {
      const serverName = serverFarm.farm_name || serverFarm.name;
      const matchedStatic = staticFarms.find(
        (sf) => sf.name.toLowerCase() === serverName.toLowerCase()
      );

      if (matchedStatic) {
        return {
          ...matchedStatic,
          id: serverFarm.id.toString(),
          name: serverName,
          farmerName: serverFarm.farmer_name || matchedStatic.farmerName,
          address: serverFarm.location || matchedStatic.address,
          sizeAcres: parseFloat(serverFarm.total_area_acres) || matchedStatic.sizeAcres,
          harvest: serverFarm.primary_crop || matchedStatic.harvest
        };
      }

      return {
        id: serverFarm.id.toString(),
        name: serverName,
        farmerName: serverFarm.farmer_name || "Assam Farmer",
        address: serverFarm.location || "Assam, India",
        district: "Nagaon",
        state: "Assam",
        harvest: serverFarm.primary_crop || "Organic Grains",
        heroImage: "/images/farms/rohadoi_hero.png",
        logoImage: "/images/farms/rohadoi_logo.png",
        profileImage: "AF",
        about: "A partner organic farm cultivating sustainable seasonal harvests.",
        established: 2020,
        sizeAcres: parseFloat(serverFarm.total_area_acres) || 10,
        certifications: ["India Organic"],
        coordinates: "26.3484° N, 92.6841° E"
      };
    });

    return res.status(200).json(enriched);
  } catch (err) {
    console.error("Proxy error fetching farms, using static fallbacks:", err);
    return res.status(200).json(staticFarms);
  }
}
