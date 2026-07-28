import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const categories = [
  {
    name: "Vehicles",
    slug: "vehicles",
    children: [
      { name: "Cars", slug: "cars" },
      { name: "Motorbikes", slug: "motorbikes" },
      { name: "Three Wheelers", slug: "three-wheelers" },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    children: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Laptops", slug: "laptops" },
      { name: "TVs", slug: "tvs" },
    ],
  },
  {
    name: "Property",
    slug: "property",
    children: [
      { name: "Houses", slug: "houses" },
      { name: "Apartments", slug: "apartments" },
      { name: "Land", slug: "land" },
    ],
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    children: [
      { name: "Furniture", slug: "furniture" },
      { name: "Appliances", slug: "appliances" },
    ],
  },
];

const locations = [
  "Colombo",
  "Gampaha",
  "Kandy",
  "Galle",
  "Jaffna",
  "Negombo",
  "Kurunegala",
  "Matara",
  "Anuradhapura",
  "Batticaloa",
];

const sellers = [
  { name: "Nimal Perera", email: "nimal.perera@example.com" },
  { name: "Ayesha Fernando", email: "ayesha.fernando@example.com" },
  { name: "Ruwan Silva", email: "ruwan.silva@example.com" },
];

const ads = [
  {
    title: "Toyota Aqua 2015 Hybrid",
    description:
      "Well maintained Toyota Aqua 2015, single owner from new. Full service history available with the original agent, recently serviced with new brake pads and battery. Registered in Colombo, all documents clear and ready for transfer.",
    price: 8450000,
    category: "cars",
    location: "Colombo",
    status: "ACTIVE",
    seller: 0,
  },
  {
    title: "Honda Vezel RS 2017",
    description:
      "Honda Vezel RS in excellent condition with genuine mileage of 62,000 km. Beige interior, reverse camera, alloy wheels and a brand new set of tyres fitted last month. Any inspection welcome at my Kandy residence.",
    price: 12900000,
    category: "cars",
    location: "Kandy",
    status: "ACTIVE",
    seller: 1,
  },
  {
    title: "Suzuki Wagon R Stingray",
    description:
      "Suzuki Wagon R Stingray, 2018 registration, second owner and used only for weekend family trips. Air conditioning recently regassed, no accidents or repainting, and the interior is in showroom condition throughout.",
    price: 5200000,
    category: "cars",
    location: "Gampaha",
    status: "ACTIVE",
    seller: 2,
  },
  {
    title: "Yamaha FZ v3 Low Mileage",
    description:
      "Yamaha FZ version 3 with only 9,000 km on the clock, purchased new in 2022 and garage kept the whole time. Comes with the original tool kit, spare key and a new helmet. Selling because I am relocating overseas.",
    price: 685000,
    category: "motorbikes",
    location: "Negombo",
    status: "ACTIVE",
    seller: 0,
  },
  {
    title: "Bajaj RE Three Wheeler 2019",
    description:
      "Bajaj RE four stroke three wheeler registered in 2019, currently on the road and earning daily. New tyres all round, meter working perfectly and the hood was replaced two months ago. Leasing can be arranged if required.",
    price: 1150000,
    category: "three-wheelers",
    location: "Kurunegala",
    status: "ACTIVE",
    seller: 1,
  },
  {
    title: "iPhone 15 Pro 256GB",
    description:
      "iPhone 15 Pro in natural titanium, 256GB storage and battery health still at 96 percent. Complete with the original box, cable and unused charger. Always used with a case and screen protector so it is free of scratches.",
    price: 298000,
    category: "mobile-phones",
    location: "Colombo",
    status: "ACTIVE",
    seller: 2,
  },
  {
    title: "Samsung Galaxy S24 Ultra",
    description:
      "Samsung Galaxy S24 Ultra 512GB in titanium grey, bought locally in March with the warranty card and receipt included. S Pen has never been removed and the phone has been in a folio case since day one.",
    price: 335000,
    category: "mobile-phones",
    location: "Galle",
    status: "ACTIVE",
    seller: 0,
  },
  {
    title: "Google Pixel 8a Unlocked",
    description:
      "Google Pixel 8a in bay blue, factory unlocked and running the latest Android release with several years of updates remaining. Excellent camera for the price and battery easily lasts a full day of heavy use.",
    price: 142000,
    category: "mobile-phones",
    location: "Jaffna",
    status: "ACTIVE",
    seller: 1,
  },
  {
    title: "MacBook Air M2 8GB 256GB",
    description:
      "MacBook Air M2 in midnight, 8GB unified memory and 256GB SSD with only 41 charge cycles recorded. Used for university coursework and kept in a sleeve at all times. Includes the original 30W adapter and box.",
    price: 385000,
    category: "laptops",
    location: "Colombo",
    status: "ACTIVE",
    seller: 2,
  },
  {
    title: "Dell XPS 15 i7 Workstation",
    description:
      "Dell XPS 15 with a twelfth generation i7, 32GB of RAM and a 1TB NVMe drive, ideal for development or video editing work. The 4K display is flawless and the chassis has no dents or scuffs anywhere.",
    price: 465000,
    category: "laptops",
    location: "Kandy",
    status: "ACTIVE",
    seller: 0,
  },
  {
    title: "LG 55 inch 4K Smart TV",
    description:
      "LG 55 inch 4K UHD smart television bought eighteen months ago and still under the extended local warranty. Wall bracket and remote included, and the panel has no dead pixels or backlight bleed at all.",
    price: 178000,
    category: "tvs",
    location: "Matara",
    status: "ACTIVE",
    seller: 1,
  },
  {
    title: "Three Bedroom House in Nugegoda",
    description:
      "Solid three bedroom two bathroom house on ten perches in a quiet residential lane, walking distance to schools and the main road. Comes with a parking space for two vehicles and a small garden at the rear.",
    price: 42500000,
    category: "houses",
    location: "Colombo",
    status: "ACTIVE",
    seller: 2,
  },
  {
    title: "Modern Apartment with Sea View",
    description:
      "Two bedroom apartment on the eighth floor with an uninterrupted sea view from the living room balcony. Building has a gym, pool and twenty four hour security, and the unit comes fully furnished if required.",
    price: 28900000,
    category: "apartments",
    location: "Galle",
    status: "ACTIVE",
    seller: 0,
  },
  {
    title: "20 Perch Land Block Near Town",
    description:
      "Flat rectangular twenty perch block with clear title deeds and direct access from a fifteen foot motorable road. Electricity and water lines already run along the boundary so building can start immediately.",
    price: 9800000,
    category: "land",
    location: "Anuradhapura",
    status: "ACTIVE",
    seller: 1,
  },
  {
    title: "Teak Dining Table with Six Chairs",
    description:
      "Handcrafted solid teak dining set seating six comfortably, bought from a workshop in Moratuwa four years ago. The surface has a couple of light marks but the joints are all tight and completely solid.",
    price: 96000,
    category: "furniture",
    location: "Batticaloa",
    status: "ACTIVE",
    seller: 2,
  },
  {
    title: "Samsung Inverter Washing Machine",
    description:
      "Samsung eight kilogram front loading inverter washing machine, roughly three years old and working perfectly with no leaks or noise. Selling because we have moved to a house with a built in laundry unit.",
    price: 74000,
    category: "appliances",
    location: "Gampaha",
    status: "PENDING",
    seller: 0,
  },
  {
    title: "Nissan Leaf 2018 Electric",
    description:
      "Nissan Leaf 2018 with eleven of twelve battery bars remaining and a real world range of about 150 kilometres. Home charger included in the sale. Extremely cheap to run compared to any petrol equivalent.",
    price: 7350000,
    category: "cars",
    location: "Colombo",
    status: "PENDING",
    seller: 1,
  },
  {
    title: "Office Chairs Bulk Sale Ten Units",
    description:
      "Ten ergonomic mesh back office chairs from an office closure, all with working gas lifts and adjustable arms. Happy to sell the full lot at this price or split into smaller batches for a slightly higher rate.",
    price: 135000,
    category: "furniture",
    location: "Colombo",
    status: "PENDING",
    seller: 2,
  },
  {
    title: "Gaming Laptop RTX 4060 Warranty",
    description:
      "Gaming laptop with an RTX 4060, sixteen gigabytes of RAM and a 144Hz display, still carrying eight months of local warranty. Runs everything at high settings without thermal throttling under sustained load.",
    price: 412000,
    category: "laptops",
    location: "Kurunegala",
    status: "PENDING",
    seller: 0,
  },
  {
    title: "Cheap Phones Contact Me Fast",
    description:
      "Selling many phones at very low prices, all brands available in stock right now. Contact me on the number listed for the full price list and current availability. No time wasters and serious buyers only please.",
    price: 15000,
    category: "mobile-phones",
    location: "Colombo",
    status: "REJECTED",
    rejectionNote:
      "Listings must describe a single specific item with an accurate price. Please repost with the exact model, condition and photographs of the actual device.",
    seller: 1,
  },
];

const placeholders = [
  "/placeholders/ad-1.svg",
  "/placeholders/ad-2.svg",
  "/placeholders/ad-3.svg",
  "/placeholders/ad-4.svg",
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  console.log("Seeding categories...");
  for (const parent of categories) {
    const created = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name },
      create: { name: parent.name, slug: parent.slug },
    });

    for (const child of parent.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: created.id },
        create: { name: child.name, slug: child.slug, parentId: created.id },
      });
    }
  }

  console.log("Seeding locations...");
  for (const name of locations) {
    await prisma.location.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
  }

  console.log("Seeding users...");
  const users = [];
  for (const seller of sellers) {
    users.push(
      await prisma.user.upsert({
        where: { email: seller.email },
        update: { name: seller.name },
        create: { name: seller.name, email: seller.email },
      }),
    );
  }

  const moderatorEmail = process.env.MODERATOR_EMAIL;
  if (moderatorEmail) {
    await prisma.user.upsert({
      where: { email: moderatorEmail },
      update: { role: "MODERATOR" },
      create: { name: "Platform Moderator", email: moderatorEmail, role: "MODERATOR" },
    });
    console.log(`Promoted ${moderatorEmail} to MODERATOR`);
  } else {
    console.warn("MODERATOR_EMAIL not set — no moderator account was created.");
  }

  console.log("Seeding advertisements...");
  const categoryBySlug = new Map(
    (await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );
  const locationByName = new Map(
    (await prisma.location.findMany({ select: { id: true, name: true } })).map((l) => [l.name, l.id]),
  );

  await prisma.advertisement.deleteMany({ where: { user: { email: { in: sellers.map((s) => s.email) } } } });

  for (const [index, ad] of ads.entries()) {
    await prisma.advertisement.create({
      data: {
        title: ad.title,
        description: ad.description,
        price: ad.price,
        status: ad.status as "PENDING" | "ACTIVE" | "REJECTED",
        rejectionNote: ad.rejectionNote ?? null,
        contactPhone: `07${(11111111 + index * 1234567).toString().slice(0, 8)}`,
        userId: users[ad.seller].id,
        categoryId: categoryBySlug.get(ad.category)!,
        locationId: locationByName.get(ad.location)!,
        createdAt: new Date(Date.now() - index * 5 * 3600 * 1000),
        images: {
          create: [
            { filePath: placeholders[index % placeholders.length], isPrimary: true },
            { filePath: placeholders[(index + 1) % placeholders.length], isPrimary: false },
          ],
        },
      },
    });
  }

  console.log(`Done. ${ads.length} advertisements seeded.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
