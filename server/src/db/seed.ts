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

    // Different neighborhoods/areas within Calgary
    const calgaryLocations = [
      { lat: "51.0447", lon: "-114.0719" }, // Downtown
      { lat: "51.1088", lon: "-114.1300" }, // SW Calgary
      { lat: "51.0896", lon: "-113.9900" }, // SE Calgary
      { lat: "51.1500", lon: "-114.1500" }, // NW Calgary
      { lat: "51.1700", lon: "-113.9700" }, // NE Calgary
      { lat: "51.0200", lon: "-114.0500" }, // South Calgary
      { lat: "51.2000", lon: "-114.0200" }, // North Calgary
      { lat: "51.0800", lon: "-114.1100" }, // Midtown
    ];

    // Create active listings based on reserve prices
    const activeListings = await db
      .insert(listings)
      .values(
        insertedVehicles.map((vehicle, index) => {
          const reserve = vehicleData[index].price;
          const start = Math.max(500, Math.round(reserve * 0.8));
          const current = Math.max(start, Math.round(reserve * 0.88));
          const buyNow = Math.round(reserve * 1.12);
          const location = calgaryLocations[index % calgaryLocations.length];

          // Last two listings: 3 days and 7 days
          let endTime;
          if (index === insertedVehicles.length - 2) {
            endTime = secondsFromNow(3 * 24 * 60 * 60); // 3 days
          } else if (index === insertedVehicles.length - 1) {
            endTime = secondsFromNow(7 * 24 * 60 * 60); // 7 days
          } else {
            endTime = secondsFromNow(60 * (index + 1));
          }

          return {
            vehicle_id: vehicle.id,
            seller_id: mainSeller.id,
            type: "auction" as const,
            start_price: start.toFixed(2),
            reserve_price: reserve.toFixed(2),
            buy_now_price: buyNow.toFixed(2),
            current_price: current.toFixed(2),
            start_time: now,
            end_time: endTime,
            status: "active" as const,
            views_count: 12 + index * 7,
            location: "Calgary, AB",
            latitude: location.lat,
            longitude: location.lon,
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
        insertedVehicles
          .slice(0, insertedVehicles.length - 1)
          .map((vehicle, index) => {
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
              start_time: new Date(
                historicStart.getTime() - index * 24 * 60 * 60 * 1000,
              ),
              end_time: new Date(
                historicEnd.getTime() - index * 12 * 60 * 60 * 1000,
              ),
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
            bid_amount: Math.round(reserve * (metReserve ? 1.0 : 0.91)).toFixed(
              2,
            ),
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
