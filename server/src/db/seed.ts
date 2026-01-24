// server/src/db/seed.ts
import { db } from "./db";
import { users, vehicles, listings } from "./schema";
import { hashPassword } from "../utils/auth";

async function seed() {
  const secondsFromNow = (seconds: number) =>
    new Date(Date.now() + seconds * 1000);

  try {
    console.log("Seeding database...");

    // ---------------- Users ----------------
    const insertedUsers = await db
      .insert(users)
      .values([
        {
          name: "Alice",
          email: "alice@example.com",
          password_hash: await hashPassword("alice123"),
          role: "buyer",
        },
        {
          name: "Bob",
          email: "bob@example.com",
          password_hash: await hashPassword("bob123"),
          role: "seller",
        },
        {
          name: "Charlie",
          email: "charlie@example.com",
          password_hash: await hashPassword("charlie123"),
          role: "admin",
        },
      ])
      .returning({ id: users.id });

    const [user1, user2, user3] = insertedUsers;

    // ---------------- Vehicles (Powersports + Motorcycles) ----------------
    const insertedVehicles = await db
      .insert(vehicles)
      .values([
        {
          user_id: user2.id,
          make: "Honda",
          model: "CRF250R",
          year: 2021,
          price: "7899.00",
          mileage_hours: 120,
          condition: "used",
          status: "available",
          description:
            "High-performance dirt bike perfect for off-road and motocross riding.",
          image_url: [
            "https://loremflickr.com/800/600/dirtbike",
            "https://loremflickr.com/800/600/motocross",
            "https://loremflickr.com/800/600/motorcycle",
          ],
        },
        {
          user_id: user2.id,
          make: "Yamaha",
          model: "YZ450F",
          year: 2022,
          price: "9499.00",
          mileage_hours: 80,
          condition: "used",
          status: "available",
          description: "Race-ready motocross bike with power and precision.",
          image_url: [
            "https://loremflickr.com/800/600/motocross",
            "https://loremflickr.com/800/600/dirt-bike",
            "https://loremflickr.com/800/600/yamaha",
          ],
        },
        {
          user_id: user3.id,
          make: "Polaris",
          model: "Sportsman 570",
          year: 2020,
          price: "6999.00",
          mileage_hours: 200,
          condition: "used",
          status: "available",
          description: "Reliable ATV built for trail riding and utility tasks.",
          image_url: [
            "https://loremflickr.com/800/600/atv",
            "https://loremflickr.com/800/600/quad",
            "https://loremflickr.com/800/600/powersports",
          ],
        },
        {
          user_id: user2.id,
          make: "Can-Am",
          model: "Maverick X3",
          year: 2019,
          price: "18999.00",
          mileage_hours: 350,
          condition: "used",
          status: "available",
          description:
            "High-performance UTV with excellent suspension and handling.",
          image_url: [
            "https://loremflickr.com/800/600/utv",
            "https://loremflickr.com/800/600/offroad",
            "https://loremflickr.com/800/600/canam",
          ],
        },
        {
          user_id: user3.id,
          make: "Kawasaki",
          model: "Ninja 650",
          year: 2021,
          price: "8499.00",
          mileage_hours: 4500,
          condition: "used",
          status: "available",
          description:
            "Sport motorcycle ideal for beginners and experienced riders alike.",
          image_url: [
            "https://loremflickr.com/800/600/motorcycle",
            "https://loremflickr.com/800/600/sportbike",
            "https://loremflickr.com/800/600/kawasaki",
          ],
        },
        {
          user_id: user2.id,
          make: "Harley-Davidson",
          model: "Street Glide",
          year: 2018,
          price: "21999.00",
          mileage_hours: 14000,
          condition: "used",
          status: "available",
          description:
            "Classic touring motorcycle built for long-distance comfort.",
          image_url: [
            "https://loremflickr.com/800/600/harley",
            "https://loremflickr.com/800/600/cruiser",
            "https://loremflickr.com/800/600/motorbike",
          ],
        },
        {
          user_id: user3.id,
          make: "Ski-Doo",
          model: "MXZ X-RS 850",
          year: 2020,
          price: "12999.00",
          mileage_hours: 90,
          condition: "used",
          status: "available",
          description:
            "High-performance snowmobile designed for aggressive trail riding.",
          image_url: [
            "https://loremflickr.com/800/600/snowmobile",
            "https://loremflickr.com/800/600/snow",
            "https://loremflickr.com/800/600/powersport",
          ],
        },
      ])
      .returning({ id: vehicles.id });

    console.log("Inserted vehicles:", insertedVehicles);

    const [v1, v2, v3, v4, v5, v6, v7] = insertedVehicles;
    // ---------------- Listings ----------------
    const now = new Date();

    const insertedListings = await db
      .insert(listings)
      .values([
        {
          vehicle_id: v1.id,
          seller_id: user2.id,
          type: "auction" as const,
          start_price: "7899.00",
          reserve_price: "8500.00",
          buy_now_price: "9200.00",
          current_price: "7899.00",
          start_time: now,
          end_time: secondsFromNow(30), // 30s
          status: "active" as const,
          views_count: 12,
          location: "Calgary, AB",
        },
        {
          vehicle_id: v2.id,
          seller_id: user2.id,
          type: "auction" as const,
          start_price: "9499.00",
          reserve_price: "10300.00",
          buy_now_price: "11200.00",
          current_price: "9499.00",
          start_time: now,
          end_time: secondsFromNow(60), // 1m
          status: "active" as const,
          views_count: 21,
          location: "Edmonton, AB",
        },
        {
          vehicle_id: v3.id,
          seller_id: user3.id,
          type: "fixed" as const,
          start_price: "6999.00",
          reserve_price: "6999.00",
          buy_now_price: "6999.00",
          current_price: "6999.00",
          start_time: now,
          end_time: secondsFromNow(120), // 2m
          status: "active" as const,
          views_count: 9,
          location: "Red Deer, AB",
        },
        {
          vehicle_id: v4.id,
          seller_id: user2.id,
          type: "auction" as const,
          start_price: "18999.00",
          reserve_price: "20500.00",
          buy_now_price: "22500.00",
          current_price: "18999.00",
          start_time: now,
          end_time: secondsFromNow(300), // 5m
          status: "active" as const,
          views_count: 33,
          location: "Vancouver, BC",
        },
        {
          vehicle_id: v5.id,
          seller_id: user3.id,
          type: "auction" as const,
          start_price: "8499.00",
          reserve_price: "9200.00",
          buy_now_price: "10200.00",
          current_price: "8499.00",
          start_time: now,
          end_time: secondsFromNow(600), // 10m
          status: "active" as const,
          views_count: 41,
          location: "Toronto, ON",
        },
        {
          vehicle_id: v6.id,
          seller_id: user2.id,
          type: "fixed" as const,
          start_price: "21999.00",
          reserve_price: "21999.00",
          buy_now_price: "21999.00",
          current_price: "21999.00",
          start_time: now,
          end_time: secondsFromNow(900), // 15m
          status: "active" as const,
          views_count: 18,
          location: "Kelowna, BC",
        },
        {
          vehicle_id: v7.id,
          seller_id: user3.id,
          type: "auction" as const,
          start_price: "12999.00",
          reserve_price: "14000.00",
          buy_now_price: "15500.00",
          current_price: "12999.00",
          start_time: now,
          end_time: secondsFromNow(1200), // 20m
          status: "active" as const,
          views_count: 27,
          location: "Banff, AB",
        },
      ])
      .returning({ id: listings.id });

    console.log("Inserted listings:", insertedListings);
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    process.exit(0);
  }
}

seed();
