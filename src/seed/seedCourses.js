import "dotenv/config";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import { buildCourseDocuments } from "./coursesData.js";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const docs = buildCourseDocuments();

  for (const doc of docs) {
    await Course.findOneAndUpdate({ courseId: doc.courseId }, doc, {
      upsert: true,
      new: true,
    });
  }

  console.log(`Seeded ${docs.length} courses`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
