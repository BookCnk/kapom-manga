import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";
import { UserRole } from "@prisma/client";

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "kapom@o.com" },
    });

    if (existingUser) {
      console.log("User kapom@o.com already exists");
      return;
    }

    // Create test user
    const passwordHash = hashPassword("testtest");

    const user = await prisma.user.create({
      data: {
        email: "kapom@o.com",
        name: "Test User",
        passwordHash,
        role: UserRole.USER,
      },
    });

    console.log("Created test user:", {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Create wallet for the user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        totalTopup: 0,
        totalSpent: 0,
      },
    });

    console.log("Created wallet for user");
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
