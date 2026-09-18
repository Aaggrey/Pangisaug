import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LISTING_FEE = 100000; // one-time UGX fee to publish a listing (mirrors src/lib/types.ts)

async function upsertUser(
  name: string,
  email: string,
  password: string,
  role: Role,
  phone?: string
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role, phone },
    create: { name, email, passwordHash, role, phone },
  });
}

async function main() {
  console.log("Seeding Pangisaug…");

  const admin = await upsertUser("Analisa Pangisaug", "admin@pangisaug.com", "admin123", "ADMIN", "0917 000 0001");
  const landlord1 = await upsertUser("Juan Dela Cruz", "landlord@pangisaug.com", "landlord123", "LANDLORD", "0917 123 4567");
  const landlord2 = await upsertUser("Maria Santos", "maria@pangisaug.com", "landlord123", "LANDLORD", "0918 765 4321");
  const landlord3 = await upsertUser("Pedro Reyes", "pedro@pangisaug.com", "landlord123", "LANDLORD", "0919 555 1234");
  const member = await upsertUser("Carla Lim", "user@pangisaug.com", "user123", "USER", "0920 111 2222");
  const member2 = await upsertUser("Berto Garcia", "berto@pangisaug.com", "user123", "USER", "0921 333 4444");

  const props = [
    {
      title: "Spacious 3-Bedroom House in Manila Bay Area",
      description:
        "A well-maintained 3-bedroom home minutes from Manila Bay and SM Mall of Asia. Features a modern kitchen, tiled bathrooms, and a small garden at the back. Perfect for growing families.",
      price: 4800000,
      address: "123 Roxas Blvd",
      city: "Manila",
      province: "Metro Manila",
      bedrooms: 3,
      bathrooms: 2,
      areaSqm: 132,
      listingType: "SALE" as const,
      images: ["/uploads/images/prop-1.svg", "/uploads/images/prop-2.svg"],
    },
    {
      title: "Cozy Condo Unit for Rent in Makati CBD",
      description:
        "Fully furnished 1-bedroom condo unit in the heart of Makati. Walking distance to Ayala Triangle and Greenbelt. Perfect for professionals. Monthly rent includes association dues.",
      price: 28000,
      listingType: "RENT" as const,
      address: "45 Dela Rosa St",
      city: "Makati",
      province: "Metro Manila",
      bedrooms: 1,
      bathrooms: 1,
      areaSqm: 38,
      images: ["/uploads/images/prop-2.svg", "/uploads/images/prop-3.svg"],
    },
    {
      title: "Modern Townhouse in Quezon City",
      description:
        "Brand new 3-storey townhouse with 3 bedrooms and a rooftop deck. Located in a gated community near Commonwealth Avenue with easy access to schools and malls.",
      price: 6900000,
      listingType: "SALE" as const,
      address: "88 Cathedral Heights",
      city: "Quezon City",
      province: "Metro Manila",
      bedrooms: 3,
      bathrooms: 3,
      areaSqm: 110,
      images: ["/uploads/images/prop-3.svg", "/uploads/images/prop-4.svg"],
    },
    {
      title: "Beachfront Lot in Cebu",
      description:
        "Prime beachfront residential lot with 25 meters of shoreline. Perfect for a beach house or resort development. Clean title, no liens.",
      price: 7500000,
      listingType: "SALE" as const,
      address: "Zona Beach Rd",
      city: "Cebu City",
      province: "Cebu",
      bedrooms: 0,
      bathrooms: 0,
      areaSqm: 320,
      images: ["/uploads/images/prop-4.svg", "/uploads/images/prop-5.svg"],
    },
    {
      title: "Family Home with Garden in Baguio",
      description:
        "A charming 2-storey home nestled in a quiet Baguio neighborhood. Cool climate, landscaped garden, and a spacious living area. Great for retirement or a vacation home.",
      price: 5200000,
      listingType: "SALE" as const,
      address: "16 Outlook Dr",
      city: "Baguio",
      province: "Benguet",
      bedrooms: 2,
      bathrooms: 2,
      areaSqm: 96,
      images: ["/uploads/images/prop-5.svg", "/uploads/images/prop-6.svg"],
    },
    {
      title: "Studio Apartment for Rent in Davao",
      description:
        "Affordable studio apartment near Ateneo de Davao. Air-conditioned, with a small kitchenette and private bathroom. Ideal for students and young professionals.",
      price: 8500,
      listingType: "RENT" as const,
      address: "29 Matina Crossing",
      city: "Davao City",
      province: "Davao del Sur",
      bedrooms: 1,
      bathrooms: 1,
      areaSqm: 24,
      images: ["/uploads/images/prop-6.svg", "/uploads/images/prop-7.svg"],
    },
    {
      title: "Elegant 4-Bedroom Home in Tagaytay",
      description:
        "Enjoy cool breezes in this elegant 4-bedroom home with a view of Taal Volcano. Features an open layout, lanai, and covered parking for two cars.",
      price: 9500000,
      listingType: "SALE" as const,
      address: "3 Ridge View St",
      city: "Tagaytay",
      province: "Cavite",
      bedrooms: 4,
      bathrooms: 3,
      areaSqm: 180,
      images: ["/uploads/images/prop-7.svg", "/uploads/images/prop-8.svg"],
    },
    {
      title: "Newly Renovated Unit in Iloilo",
      description:
        "A tastefully renovated 2-bedroom unit ready for occupancy. Near Robinsons Place Iloilo with easy access to the airport. Investment opportunity!",
      price: 3100000,
      listingType: "SALE" as const,
      address: "12 Jaro St",
      city: "Iloilo City",
      province: "Iloilo",
      bedrooms: 2,
      bathrooms: 2,
      areaSqm: 64,
      images: ["/uploads/images/prop-8.svg", "/uploads/images/prop-9.svg"],
    },
    {
      title: "Pending: Duplex House in Bacolod",
      description: "A 3-bedroom duplex listed by a landlord who has not yet paid the listing fee. Demo of pending payment state.",
      price: 2900000,
      listingType: "SALE" as const,
      address: "7 Lacson St",
      city: "Bacolod",
      province: "Negros Occidental",
      bedrooms: 3,
      bathrooms: 2,
      areaSqm: 88,
      images: ["/uploads/images/prop-9.svg"],
    },
  ];

  const created = [];
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    const landlord = [landlord1, landlord2, landlord3][i % 3];
    const isPending = p.title.startsWith("Pending:");
    const title = isPending ? p.title.replace("Pending: ", "") : p.title;
    const description = isPending
      ? "A 3-bedroom duplex in Bacolod. The owner is yet to complete the listing fee — shown here to demonstrate the pending payment workflow."
      : p.description;

    const property = await prisma.property.upsert({
      where: { id: `seed-prop-${i + 1}` },
      update: {},
      create: {
        id: `seed-prop-${i + 1}`,
        title,
        description,
        price: p.price,
        address: p.address,
        city: p.city,
        province: p.province,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqm: p.areaSqm,
        listingType: p.listingType,
        status: isPending ? "PENDING_PAYMENT" : "ACTIVE",
        featured: !isPending && i < 4,
        landlordId: landlord.id,
        images: {
          create: p.images.map((url, idx) => ({ url, isCover: idx === 0 })),
        },
      },
    });

    created.push(property.id);

    if (i === 0) {
      await prisma.visitBooking.upsert({
        where: { id: "seed-booking-1" },
        update: {},
        create: {
          id: "seed-booking-1",
          userId: member.id,
          propertyId: property.id,
          visitorName: "Carla Lim",
          phone: "0920 111 2222",
          email: member.email,
          preferredDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
          timeSlot: "10:00 – 11:00",
          notes: "Interested in the property, will bring family.",
          status: "PENDING",
        },
      });
      await prisma.payment.upsert({
        where: { reference: "SEED-PAY-0001" },
        update: {},
        create: {
          reference: "SEED-PAY-0001",
          landlordId: landlord.id,
          propertyId: property.id,
          amount: LISTING_FEE,
          method: "GCASH",
          status: "SUCCESS",
          paidAt: new Date(),
        },
      });
    }
    await prisma.visitBooking.upsert({
      where: { id: `seed-booking-${i + 2}` },
      update: {},
      create: {
        id: `seed-booking-${i + 2}`,
        userId: member2.id,
        propertyId: property.id,
        visitorName: "Berto Garcia",
        phone: "0921 333 4444",
        email: member2.email,
        preferredDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        timeSlot: i % 2 === 0 ? "14:00 – 15:00" : "09:00 – 10:00",
        status: i % 3 === 0 ? "CONFIRMED" : "PENDING",
      },
    });
  }

  console.log(`Seeded ${created.length} properties.`);
  console.log("Done! Demo accounts:");
  console.log("  Admin:     admin@pangisaug.com / admin123");
  console.log("  Landlord:  landlord@pangisaug.com / landlord123");
  console.log("  Member:    user@pangisaug.com / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());