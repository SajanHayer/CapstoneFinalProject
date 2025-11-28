// server/src/db/seed.ts
import { db } from './db'; // unified Drizzle client
import { users, vehicles, listings, transactions, bids } from './schema';

async function seed() {
  try {
    console.log('Seeding database...');

    // ---------------- Users ----------------
    const insertedUsers = await db
      .insert(users)
      .values([
        { name: 'Alice', email: 'alice@example.com', password_hash: 'hashed_password1', role: 'buyer' },
        { name: 'Bob', email: 'bob@example.com', password_hash: 'hashed_password2', role: 'seller' },
        { name: 'Charlie', email: 'charlie@example.com', password_hash: 'hashed_password3', role: 'admin' },
      ])
      .returning({ id: users.id });

    const [user1, user2, user3] = insertedUsers;


    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    process.exit(0);
  }
}

seed();
