import { MongoClient } from "mongodb";

const MONGODBPWD =
  "mongodb+srv://new-user_3:test123@maindatabase.tll790d.mongodb.net/?appName=MainDatabase";

const mc = new MongoClient(MONGODBPWD);

let conned = false;
const dbName = "MainDB";

function log(msg) {
  console.log(`[📦 MongoDB] ${msg}`);
}

export async function connect(collectionName) {
  if (conned) {
    console.log("[MONGODB] Connected!");
    return mc.db(dbName).collection(collectionName);
  }

  try {
    await mc.connect();
    conned = true;
    log("✅ Connected to MongoDB");
  } catch (e) {
    log(`❌ Connection error: ${e.message}`);
    throw e;
  }

  return mc.db(dbName).collection(collectionName);
}

export async function registerTeacher(
  SID,
  name,
  subject,
  grade,
  section,
  nstus,
  gender,
  password
) {
  const db = await connect("teachs");

  if (await db.findOne({ SID })) {
    console.log("Teacher already registered, CANNOT register duplicates!");
    return;
  }

  if (!(gender === "male" || gender === "female")) {
    return "Please enter a valid gender";
  }

  if (!password) {
    return "Password not given!";
  }

  await db.insertOne({
    name,
    gender,
    subject,
    SID,
    password,
    class: {
      grade,
      section,
      nstus
    }
  });

  console.log(`Registered ${gender === "male" ? "Mr." : "Ms."}${name}!`);
}

export async function registerStudent(SID, name, grade, section, password) {
  const sdb = await connect("stus");

  if (parseInt(grade) > 12) {
    console.log("Grades cannot be greater than 12!");
    return;
  }

  await sdb.insertOne({
    name,
    grade,
    section,
    password,
    SID
  });
}

export async function getByID(SID, dbType) {
  const tdb = await connect(dbType);
  return await tdb.findOne({ SID });
}

export async function editByEID(dbType, SID, utils) {
  const tdb = await connect(dbType);

  if (typeof utils !== "object") {
    return "'utils' variable must be an object!";
  }

  log(`Accessing ID: ${SID}!`);

  const r = await tdb.findOneAndUpdate(
    { SID },
    { $set: utils },
    { returnDocument: "after" }
  );

  return r ?? "[TEACHER-DB] User not found!";
}

export async function deleteByID(SID, dbType) {
  if (!(await getByID(SID, dbType))) {
    console.log("User not found");
    return;
  }

  const tdb = await connect(dbType);
  await tdb.findOneAndDelete({ SID });

  return "Deleted!";
}

export async function getAllByClassAndSection(grade = "9", section = "B") {
  const db = await connect("stus");

  try {
    const sts = await db.find({ grade, section }).toArray();
    return sts;
  } catch (err) {
    console.error("Error fetching students:", err.message);
    throw err;
  }
}

export const MainDatabase = {
  studentsHandlers: {
    registerStudent,
    getByID,
    editByEID,
    deleteByID
  },
  teacherHandlers: {
    registerTeacher,
    getByID,
    editByEID,
    deleteByID
  }
};
