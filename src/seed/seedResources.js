import "dotenv/config";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Resource from "../models/Resource.js";
import { buildAllResourceDocuments } from "./resourcesData.js";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const docs = await buildAllResourceDocuments(Course);

  await Resource.deleteMany({});
  await Resource.insertMany(docs);

  console.log(`Seeded ${docs.length} resources for ${new Set(docs.map((d) => d.courseId)).size} courses`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
