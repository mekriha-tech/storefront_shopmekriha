const url = "https://shopmekrihabackend-production.up.railway.app";

const mockFarms = [
  {
    farm_name: "Rohadoi Organic Farm",
    farmer_name: "Rupesh Bhuyan",
    phone: "+91 98540 12210",
    email: "rupesh@rohodoiorganic.in",
    location: "Rohadoi Village, Nagaon, Assam",
    total_area_acres: 12.5,
    primary_crop: "Heritage Joha Rice"
  },
  {
    farm_name: "Majuli Heritage Estate",
    farmer_name: "Hemo Payeng",
    phone: "+91 94350 88204",
    email: "hemo@majuliheritage.org",
    location: "Kamalabari, Majuli, Assam",
    total_area_acres: 24.0,
    primary_crop: "Orthodox Black Tea"
  },
  {
    farm_name: "Kopili Valley Spices",
    farmer_name: "Devabrata Hazarika",
    phone: "+91 88110 44302",
    email: "contact@kopilivalley.in",
    location: "Kopili Riverbed, Jorhat, Assam",
    total_area_acres: 8.2,
    primary_crop: "Lakadong Turmeric"
  },
  {
    farm_name: "Dihing Citrus Groves",
    farmer_name: "Prabal Saikia",
    phone: "+91 91012 30456",
    email: "prabal@dihinggroves.com",
    location: "Mangaldoi, Darrang, Assam",
    total_area_acres: 15.0,
    primary_crop: "GI Kaji Nemu Lemons"
  }
];

const mockProducts = [
  {
    farm_index: 0, // Rohadoi
    name: "Premium Joha Sual Rice",
    tags: "Grains, Organic, Heritage",
    ready_by_timeline: "Available Now",
    measure_of_unit: "kg",
    quantity: 450,
    description: "Our signature scented, short-grain organic Joha rice grown traditionally along the rich alluvial floodplains of Nagaon, Assam.",
    price: 180,
    discount_price: 150,
    image1: "/rice.jpg",
    image2: "/rice_field.jpg",
    image3: "/rice_bag.jpg"
  },
  {
    farm_index: 1, // Majuli
    name: "Orthodox Black Tea (Whole Leaf)",
    tags: "Tea, Organic, Assam Tea",
    ready_by_timeline: "October 2026",
    measure_of_unit: "500g pack",
    quantity: 120,
    description: "Exquisite handpicked whole-leaf orthodox black tea crafted carefully in the heart of Majuli River Island. Smooth texture with a sweet, malty finish.",
    price: 580,
    discount_price: 580,
    image1: "/tea.jpg",
    image2: "/tea_leaves.jpg",
    image3: "/tea_cup.jpg"
  },
  {
    farm_index: 2, // Kopili
    name: "High-Curcumin Lakadong Turmeric",
    tags: "Spices, Organic, Powder",
    ready_by_timeline: "Available Now",
    measure_of_unit: "250g pack",
    quantity: 200,
    description: "Finest shade-dried, high-curcumin Lakadong turmeric root powder, ground to perfection. Sourced directly from Kopili Valley's micro-climates.",
    price: 320,
    discount_price: 280,
    image1: "/turmeric.jpg",
    image2: "/turmeric_root.jpg",
    image3: "/turmeric_powder.jpg"
  },
  {
    farm_index: 3, // Dihing
    name: "GI-Tagged Assam Kaji Nemu",
    tags: "Citrus, Fruit, GI-Tagged",
    ready_by_timeline: "September 2026",
    measure_of_unit: "dozen",
    quantity: 80,
    description: "Ultra-juicy, premium GI-tagged lemons with an intense aroma. Rich in Vitamin C and ideal for authentic Assamese cuisines.",
    price: 120,
    discount_price: 90,
    image1: "/lemon.jpg",
    image2: "/lemon_tree.jpg",
    image3: "/lemon_slice.jpg"
  }
];

async function seed() {
  console.log("Seeding live backend database...");
  const registeredFarms = [];

  for (const farm of mockFarms) {
    try {
      // Content-Type: application/x-www-form-urlencoded
      const formBody = [];
      for (const property in farm) {
        const encodedKey = encodeURIComponent(property);
        const encodedValue = encodeURIComponent(farm[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }
      const requestBody = formBody.join("&");

      const res = await fetch(`${url}/api/farms/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: requestBody
      });
      if (!res.ok) {
        throw new Error(`Status ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      console.log(`Registered Farm: ${farm.farm_name}`);
      registeredFarms.push(data);
    } catch (err) {
      console.error(`Failed to register farm ${farm.farm_name}:`, err);
    }
  }

  // Get current farm list from server to get correct database assigned IDs
  let serverFarmsList = [];
  try {
    const listRes = await fetch(`${url}/api/farms`);
    serverFarmsList = await listRes.json();
    console.log("Retrieved registered farms list from backend.");
  } catch (err) {
    console.error("Failed to retrieve farm list:", err);
    return;
  }

  for (const product of mockProducts) {
    try {
      // Match farm name with server list to get assigned ID
      const targetFarmName = mockFarms[product.farm_index].farm_name;
      const matchedServerFarm = serverFarmsList.find(
        (f) => f.farm_name === targetFarmName || f.name === targetFarmName
      );

      if (!matchedServerFarm) {
        console.error(`Could not find server farm ID for name: ${targetFarmName}`);
        continue;
      }

      // Live database farm ID
      const farmId = matchedServerFarm.id;

      const productPayload = {
        farm_id: farmId.toString(),
        name: product.name,
        tags: product.tags,
        ready_by_timeline: product.ready_by_timeline,
        measure_of_unit: product.measure_of_unit,
        quantity: product.quantity.toString(),
        description: product.description,
        price: product.price.toString(),
        discount_price: product.discount_price.toString(),
        image1: product.image1,
        image2: product.image2,
        image3: product.image3
      };

      const formBody = [];
      for (const property in productPayload) {
        const encodedKey = encodeURIComponent(property);
        const encodedValue = encodeURIComponent(productPayload[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }
      const requestBody = formBody.join("&");

      const res = await fetch(`${url}/api/products/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: requestBody
      });
      if (!res.ok) {
        throw new Error(`Status ${res.status}: ${await res.text()}`);
      }
      console.log(`Added Product: ${product.name} under Farm ID: ${farmId}`);
    } catch (err) {
      console.error(`Failed to add product ${product.name}:`, err);
    }
  }

  console.log("Seeding complete!");
}

seed();
