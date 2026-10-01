import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../database/connect.js";
import {
  User,
  Subject,
  Package,
  Request,
  Subscription,
} from "../models/index.js";
import { users } from "./data/users.js";
import { subjects } from "./data/subjects.js";
import { packages } from "./data/packages.js";

dotenv.config();

const clearCollections = async () => {
  await Promise.all([
    Subscription.deleteMany({}),
    Request.deleteMany({}),
    Package.deleteMany({}),
    Subject.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log("Cleared existing collections");
};

const seedUsers = async () => {
  const created = await User.create(users);
  console.log(`Seeded ${created.length} users`);
  return created;
};

const seedSubjects = async () => {
  const created = await Subject.create(subjects);
  console.log(`Seeded ${created.length} subjects`);
  return created;
};

const seedPackages = async (createdSubjects) => {
  const subjectByName = new Map(
    createdSubjects.map((subject) => [subject.name, subject._id])
  );

  const packageDocs = packages.map((pkg) => {
    const subjectIds = pkg.subjectNames.map((name) => {
      const id = subjectByName.get(name);
      if (!id) {
        throw new Error(`Subject not found for package: ${name}`);
      }
      return id;
    });

    return {
      name: pkg.name,
      description: pkg.description,
      subjectIds,
      price: pkg.price,
      durationDays: pkg.durationDays,
    };
  });

  const created = await Package.create(packageDocs);
  console.log(`Seeded ${created.length} packages`);
  return created;
};

const seed = async () => {
  try {
    await connectDatabase();
    await clearCollections();

    const createdUsers = await seedUsers();
    const createdSubjects = await seedSubjects();
    const createdPackages = await seedPackages(createdSubjects);

    const admin = createdUsers.find((user) => user.role === "admin");
    const student = createdUsers.find((user) => user.role === "student");

    console.log("\nSeed completed successfully");
    console.log("─".repeat(40));
    console.log(`Admin:   ${admin?.email} / Admin@123`);
    console.log(`Student: ${student?.email} / Student@123`);
    console.log(`Subjects: ${createdSubjects.length}`);
    console.log(`Packages: ${createdPackages.length}`);
    console.log("─".repeat(40));
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
