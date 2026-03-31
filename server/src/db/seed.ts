// server/src/db/seed.ts
import { db } from "./db";
import { users, vehicles, listings, bids, listingInteractions } from "./schema";
import { hashPassword } from "../utils/auth";
import { inArray } from "drizzle-orm";

type SeedVehicle = {
  year: number;
  make: string;
  model: string;
  mileage: number;
  vin: string;
  style: string;
  engine_size: string;
  price: number;
  description: string;
  image_url: string[];
};

async function seed() {
  const secondsFromNow = (seconds: number) =>
    new Date(Date.now() + seconds * 1000);

  try {
    console.log("Seeding database...");

    // Clean previous seed data (keeps existing real users but clears demo data)
    // Order matters due to foreign keys.
    await db.delete(listingInteractions);
    await db.delete(bids);
    await db.delete(listings);
    await db.delete(vehicles);
    await db
      .delete(users)
      .where(
        inArray(users.email, [
          "alice@example.com",
          "bob@example.com",
          "charlie@example.com",
          "letsridecanada30@gmail.com",
        ]),
      );

    // ---------------- Users ----------------
    const insertedUsers = await db
      .insert(users)
      .values([
        {
          name: "Alice",
          email: "alice@example.com",
          password_hash: await hashPassword("Alice1234@@"),
          role: "buyer",
          is_verified: true,
          email_verified: true,
        },
        {
          name: "Bob",
          email: "bob@example.com",
          password_hash: await hashPassword("Bob1234@@"),
          role: "seller",
          is_verified: true,
          email_verified: true,
        },
        {
          name: "Charlie",
          email: "charlie@example.com",
          password_hash: await hashPassword("Charlie1234@@"),
          role: "seller",
          is_verified: true,
          email_verified: true,
        },
        {
          name: "lets ride",
          email: "letsridecanada30@gmail.com",
          password_hash: await hashPassword("Letsride1234@@"),
          role: "seller",
          is_verified: true,
          email_verified: true,
        },
      ])
      .returning({ id: users.id });

    const [user1, user2, user3, mainSeller] = insertedUsers;

    // ---------------- Vehicles ----------------
    const vehicleData: SeedVehicle[] = [
      {
        year: 2021,
        make: "Ducati",
        model: "Monster",
        mileage: 3423,
        vin: "ZDMMAMDT4MB000558",
        style: "Sport",
        engine_size: "937",
        price: 14988,
        description: "2021 Ducati Monster with 3,423 km. Naked sport bike with premium Italian styling and strong midrange power. Clean title, ready to ride, and priced for auction interest.",
        image_url: [
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/27-img-0326.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/01-img-0359.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/02-img-0358.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/03-img-0350.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/04-img-0348.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/05-img-0370.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/06-img-0369.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/07-img-0368.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/08-img-0367.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/09-img-0366.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/10-img-0365.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/11-img-0364.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/12-img-0363.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/13-img-0362.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/14-img-0360.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/15-img-0354.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/16-img-0353.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/17-img-0344.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/18-img-0343.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/19-img-0341.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/20-img-0339.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/21-img-0338.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/22-img-0336.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/23-img-0334.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/24-img-0331.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/25-img-0330.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2021%20Ducati%20Monster/26-img-0327.jpg",
        ],
      },
      {
        year: 2014,
        make: "Aprilia",
        model: "RSV4 Factory",
        mileage: 15045,
        vin: "ZD4RKUA23ES000146",
        style: "Sport",
        engine_size: "999",
        price: 14988,
        description: "2014 Aprilia RSV4 Factory with 15,045 km. Track-focused superbike with race-bred electronics and aggressive ergonomics. Clean title, ready to ride, and priced for auction interest.",
        image_url: [
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.17.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.19%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.19%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.19%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.19%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.19.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.22%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.22%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.22%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.22%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.22.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.23.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.25.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.26%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.26%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.26%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.26%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.26%20(5).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.26.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.27%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.27%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.27%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.27%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.27.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.28%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.28%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.28%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Aprilia%20rsv4%20Factory/WhatsApp%20Image%202025-08-25%20at%2022.27.28.jpeg",
        ],
      },
      {
        year: 2025,
        make: "Suzuki",
        model: "GSX-R600",
        mileage: 3140,
        vin: "JS1GN7FA2S7101084",
        style: "Sport",
        engine_size: "599",
        price: 14988,
        description: "2025 Suzuki GSX-R600 with 3,140 km. Modern supersport with crisp handling and a responsive 599cc engine. Clean title, ready to ride, and priced for auction interest.",
        image_url: [
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.20.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.21%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.21.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.22%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.22.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.23.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.27%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.27.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.28%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.28%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.28%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.28%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.28%20(5).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.28.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.29%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.29%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.29%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.29%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.29.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.30%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.30%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2025%20Suzuki%20GS-r600/WhatsApp%20Image%202025-08-26%20at%2014.27.30.jpeg",
        ],
      },
      {
        year: 2014,
        make: "Yamaha",
        model: "YZF-R6",
        mileage: 17972,
        vin: "JYARJ16N4EA002778",
        style: "Sport",
        engine_size: "599",
        price: 13988,
        description: "2014 Yamaha YZF-R6 with 17,972 km. Legendary 600cc supersport known for sharp cornering and high-rev character. Clean title, ready to ride, and priced for auction interest.",
        image_url: [
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.17%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.17%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.17.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.25%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.25.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.26%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.26%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.26%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.26%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.26.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.27%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.27%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.27%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.27%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.27%20(5).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.27.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.28%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.28%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.28%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.28%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.28%20(5).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.28%20(6).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.28.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.29%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2014%20Yahama%20r6/WhatsApp%20Image%202025-08-25%20at%2022.34.29.jpeg",
        ],
      },
      {
        year: 2019,
        make: "Suzuki",
        model: "GSX-R750",
        mileage: 7136,
        vin: "JS1GR7MA9K7100828",
        style: "Sport",
        engine_size: "749",
        price: 14988,
        description: "2019 Suzuki GSX-R750 with 7,136 km. Iconic middleweight sport bike that blends 600 agility with extra power. Clean title, ready to ride, and priced for auction interest.",
        image_url: [
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.15.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.20.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.21%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.21%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.21.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.22%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.22%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.22.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.23%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.23%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.23%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.23.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.26%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.26%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.26%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.26%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.26.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.27%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.27%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.27%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.27%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.27%20(5).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.27.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.28%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.28%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2019%20Suzuki%20gsxr750/WhatsApp%20Image%202025-08-25%20at%2022.24.28.jpeg",
        ],
      },
      {
        year: 2006,
        make: "Buell",
        model: "Redneck Mutant Custom",
        mileage: 5789,
        vin: "4MZDX03DX63703961",
        style: "Cruiser",
        engine_size: "1200",
        price: 13988,
        description: "2006 Buell Redneck Mutant Custom with 5,789 km. Custom cruiser with a big 1200cc engine and unique one-off style. Clean title, ready to ride, and priced for auction interest.",
        image_url: [
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.21.48%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.21.48.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.04%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.04.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.05.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.06%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.06.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.07%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.07.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.08%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.08.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.10%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.10.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.11%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.11%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.11%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.11%20(4).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.11%20(5).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.11.jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.12%20(1).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.12%20(2).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.12%20(3).jpeg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/Buell%20Mutant/WhatsApp%20Image%202025-08-25%20at%2022.22.12.jpeg",
        ],
      },
      {
        year: 2009,
        make: "Yamaha",
        model: "YZF-R1",
        mileage: 9761,
        vin: "JYARN23N19A000328",
        style: "Sport",
        engine_size: "999",
        price: 14988,
        description: "2009 Yamaha YZF-R1 with 9,761 km. Liter-bike performance with aggressive styling and proven Yamaha reliability. Clean title, ready to ride, and priced for auction interest.",
        image_url: [
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/01-img-6285.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/02-img-6286.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/03-img-6287.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/04-img-6288.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/05-img-6289.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/06-img-6290.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/07-img-6291.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/08-img-6292.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/09-img-6293.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/10-img-6294.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/11-img-6295.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/12-img-6296.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/13-img-6297.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/14-img-6298.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/15-img-6299.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/16-img-6300.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/17-img-6301.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/18-img-6302.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/19-img-6303.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/20-img-6304.jpg",
          "https://itxmrhtersnnhleuizpv.supabase.co/storage/v1/object/public/powerbidz-images/2009%20Yahama%20R1/21-img-6305.jpg",
        ],
      },
    ];

    const insertedVehicles = await db
      .insert(vehicles)
      .values(
        vehicleData.map((vehicle) => ({
          user_id: mainSeller.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          price: vehicle.price.toFixed(2),
          mileage_hours: vehicle.mileage,
          condition: "used" as const,
          status: "available" as const,
          description: vehicle.description,
          image_url: vehicle.image_url,
          vin: vehicle.vin,
          style: vehicle.style,
          engine_size: vehicle.engine_size,
          engine_size_unit: "CC" as const,
        })),
      )
      .returning({ id: vehicles.id });

    console.log("Inserted vehicles:", insertedVehicles);

    const now = new Date();

    // Create active listings based on reserve prices
    const activeListings = await db
      .insert(listings)
      .values(
        insertedVehicles.map((vehicle, index) => {
          const reserve = vehicleData[index].price;
          const start = Math.max(500, Math.round(reserve * 0.8));
          const current = Math.max(start, Math.round(reserve * 0.88));
          const buyNow = Math.round(reserve * 1.12);

          return {
            vehicle_id: vehicle.id,
            seller_id: mainSeller.id,
            type: "auction" as const,
            start_price: start.toFixed(2),
            reserve_price: reserve.toFixed(2),
            buy_now_price: buyNow.toFixed(2),
            current_price: current.toFixed(2),
            start_time: now,
            end_time: secondsFromNow(60 * (index + 1)),
            status: "active" as const,
            views_count: 12 + index * 7,
            location: "Calgary, AB",
            latitude: "51.0447",
            longitude: "-114.0719",
          };
        }),
      )
      .returning({ id: listings.id });

    console.log("Inserted active listings:", activeListings);

    // Create historic listings for bid history demonstration
    const historicStart = new Date();
    historicStart.setDate(historicStart.getDate() - 10);

    const historicEnd = new Date();
    historicEnd.setDate(historicEnd.getDate() - 7);

    const historicListings = await db
      .insert(listings)
      .values(
        insertedVehicles.slice(0, insertedVehicles.length - 1).map((vehicle, index) => {
          const reserve = vehicleData[index].price;
          const start = Math.max(500, Math.round(reserve * 0.75));
          const metReserve = index % 3 === 0;
          const cancelled = index % 3 === 1;
          const current = metReserve
            ? reserve + 250
            : cancelled
              ? Math.round(reserve * 0.82)
              : Math.round(reserve * 0.93);

          return {
            vehicle_id: vehicle.id,
            seller_id: mainSeller.id,
            type: "auction" as const,
            start_price: start.toFixed(2),
            reserve_price: reserve.toFixed(2),
            buy_now_price: Math.round(reserve * 1.1).toFixed(2),
            current_price: current.toFixed(2),
            start_time: new Date(historicStart.getTime() - index * 24 * 60 * 60 * 1000),
            end_time: new Date(historicEnd.getTime() - index * 12 * 60 * 60 * 1000),
            status: "cancelled" as const,
            end_reason: metReserve
              ? ("success" as const)
              : cancelled
                ? ("cancelled" as const)
                : ("unmet" as const),
            views_count: 20 + index * 6,
            location: index % 2 === 0 ? "Calgary, AB" : "Edmonton, AB",
            latitude: index % 2 === 0 ? "51.0447" : "53.5461",
            longitude: index % 2 === 0 ? "-114.0719" : "-113.4938",
          };
        }),
      )
      .returning({ id: listings.id });

    console.log("Inserted historic listings:", historicListings);

    // Add bids for active listings
    await db.insert(bids).values(
      activeListings.flatMap((listing, index) => {
        const reserve = vehicleData[index].price;
        return [
          {
            listing_id: listing.id,
            bidder_id: user1.id,
            bid_amount: Math.round(reserve * 0.82).toFixed(2),
            location: "Calgary, AB",
            bid_time: new Date(Date.now() - (index + 3) * 1000),
          },
          {
            listing_id: listing.id,
            bidder_id: user2.id,
            bid_amount: Math.round(reserve * 0.86).toFixed(2),
            location: "Edmonton, AB",
            bid_time: new Date(Date.now() - (index + 2) * 1000),
          },
          {
            listing_id: listing.id,
            bidder_id: user3.id,
            bid_amount: Math.round(reserve * 0.9).toFixed(2),
            location: "Red Deer, AB",
            bid_time: new Date(Date.now() - (index + 1) * 1000),
          },
        ];
      }),
    );

    // Add bids for historic listings
    await db.insert(bids).values(
      historicListings.flatMap((listing, index) => {
        const reserve = vehicleData[index].price;
        const metReserve = index % 3 === 0;
        const cancelled = index % 3 === 1;

        if (cancelled) {
          return [
            {
              listing_id: listing.id,
              bidder_id: user1.id,
              bid_amount: Math.round(reserve * 0.8).toFixed(2),
              location: "Calgary, AB",
            },
          ];
        }

        return [
          {
            listing_id: listing.id,
            bidder_id: user1.id,
            bid_amount: Math.round(reserve * 0.84).toFixed(2),
            location: "Calgary, AB",
          },
          {
            listing_id: listing.id,
            bidder_id: user2.id,
            bid_amount: Math.round(
              reserve * (metReserve ? 1.0 : 0.91),
            ).toFixed(2),
            location: "Edmonton, AB",
          },
          {
            listing_id: listing.id,
            bidder_id: user3.id,
            bid_amount: Math.round(
              reserve * (metReserve ? 1.02 : 0.93),
            ).toFixed(2),
            location: "Vancouver, BC",
          },
        ];
      }),
    );

    // Add listing interactions
    await db.insert(listingInteractions).values([
      ...activeListings.flatMap((listing) => [
        {
          listing_id: listing.id,
          user_id: user1.id,
          interaction_type: "view" as const,
        },
        {
          listing_id: listing.id,
          user_id: user2.id,
          interaction_type: "view" as const,
        },
        {
          listing_id: listing.id,
          user_id: user3.id,
          interaction_type: "view" as const,
        },
      ]),
      ...historicListings.slice(0, 4).flatMap((listing) => [
        {
          listing_id: listing.id,
          user_id: user1.id,
          interaction_type: "view" as const,
        },
        {
          listing_id: listing.id,
          user_id: user3.id,
          interaction_type: "view" as const,
        },
      ]),
    ]);

    console.log(`Inserted ${insertedVehicles.length} vehicles`);
    console.log(`Inserted ${activeListings.length} active listings`);
    console.log(`Inserted ${historicListings.length} historic listings`);
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    process.exit(0);
  }
}

seed();

