export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const staticProducts = [
    {
      id: 1,
      farm_id: "3",
      name: "Premium Joha Sual Rice",
      tags: "Organic, Heritage, Grains",
      description: "Joha is a special class of scented rice grown in Assam, famous for its sweet aroma and delicate grain structure. Sown in the clean soils of Nagaon, it is aged for 6 months post-harvest to bring out its full fragrance.",
      price: 180,
      discount_price: 150,
      ready_by_timeline: "Available Now",
      measure_of_unit: "kg",
      quantity: 450,
      availability_status: "available",
      image1: "/rice.jpg",
      image2: "/rice_field.jpg",
      image3: "/rice_bag.jpg"
    },
    {
      id: 2,
      farm_id: "4",
      name: "Orthodox Black Tea (Whole Leaf)",
      tags: "Single Origin, Tea, Autumn Flush",
      description: "Handpicked Orthodox whole-leaf black tea harvested from Kamalabari, Majuli. Brews a rich amber liquor with natural malty sweetness and notes of wild honey.",
      price: 650,
      discount_price: 580,
      ready_by_timeline: "October 2026",
      measure_of_unit: "500g pack",
      quantity: 0,
      availability_status: "ready_by_timeline",
      image1: "/tea.jpg",
      image2: "/tea_leaves.jpg",
      image3: "/tea_cup.jpg"
    },
    {
      id: 3,
      farm_id: "5",
      name: "High-Curcumin Lakadong Turmeric",
      tags: "Spices, Organic, Superfood",
      description: "Authentic Lakadong turmeric powder sourced directly from Kopili Valley, Jorhat. Known for its high curcumin content (above 7.5%) and intense aromatic flavor.",
      price: 320,
      discount_price: 280,
      ready_by_timeline: "Available Now",
      measure_of_unit: "250g pack",
      quantity: 120,
      availability_status: "available",
      image1: "/turmeric.jpg",
      image2: "/turmeric_root.jpg",
      image3: "/turmeric_powder.jpg"
    },
    {
      id: 4,
      farm_id: "6",
      name: "GI-Tagged Assam Kaji Nemu",
      tags: "Citrus, Fresh Fruit, GI Tagged",
      description: "Assam's native Kaji Nemu lemons, famous for their unique elongated shape, high juice yield, and distinctive fragrance. Grown organically in Darrang groves.",
      price: 120,
      discount_price: 90,
      ready_by_timeline: "September 2026",
      measure_of_unit: "dozen",
      quantity: 0,
      availability_status: "ready_by_timeline",
      image1: "/lemon.jpg",
      image2: "/lemon_tree.jpg",
      image3: "/lemon_slice.jpg"
    }
  ];

  if (!baseUrl) {
    return res.status(200).json(staticProducts);
  }

  try {
    const response = await fetch(`${baseUrl}/api/products`);
    if (!response.ok) throw new Error(`Railway backend returned status ${response.status}`);
    const data = await response.json();

    const enriched = data.map((serverProduct) => {
      const serverName = serverProduct.name;
      const matchedStatic = staticProducts.find(
        (sp) => sp.name.toLowerCase() === serverName.toLowerCase()
      );

      const parsedPrice = parseFloat(serverProduct.price) || (matchedStatic ? matchedStatic.price : 100);
      const parsedDiscount = parseFloat(serverProduct.discount_price) || (matchedStatic ? matchedStatic.discount_price : parsedPrice);
      const readyTimeline = serverProduct.ready_by_timeline || (matchedStatic ? matchedStatic.ready_by_timeline : "Available Now");
      
      const availability_status = (readyTimeline.toLowerCase().includes("now") || readyTimeline.toLowerCase().includes("available"))
        ? "available"
        : "ready_by_timeline";

      if (matchedStatic) {
        return {
          ...matchedStatic,
          id: serverProduct.id,
          farm_id: serverProduct.farm_id.toString(),
          name: serverProduct.name,
          tags: serverProduct.tags || matchedStatic.tags,
          price: parsedPrice,
          discount_price: parsedDiscount,
          ready_by_timeline: readyTimeline,
          measure_of_unit: serverProduct.measure_of_unit || matchedStatic.measure_of_unit,
          quantity: parseInt(serverProduct.quantity) || 0,
          availability_status
        };
      }

      return {
        id: serverProduct.id,
        farm_id: serverProduct.farm_id.toString(),
        name: serverProduct.name,
        tags: serverProduct.tags || "Organic",
        description: serverProduct.description || "Fresh crop cultivated naturally on our partner farm.",
        price: parsedPrice,
        discount_price: parsedDiscount,
        ready_by_timeline: readyTimeline,
        measure_of_unit: serverProduct.measure_of_unit || "kg",
        quantity: parseInt(serverProduct.quantity) || 0,
        availability_status,
        image1: "/images/farms/rohadoi_hero.png",
        image2: "/images/farms/rohadoi_hero.png",
        image3: "/images/farms/rohadoi_hero.png"
      };
    });

    return res.status(200).json(enriched);
  } catch (err) {
    console.error("Proxy error fetching products, serving local fallback:", err);
    return res.status(200).json(staticProducts);
  }
}
