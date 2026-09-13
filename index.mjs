import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import validator from 'validator';
import { spawn } from 'child_process';
import { createRequire } from 'module';

dotenv.config();
const require = createRequire(import.meta.url); // Needed for .cjs modules

const app = express();
app.use(express.json());

// Logger FIRST
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health
app.get('/health', (req, res) => res.send('OK'));

// Ping
app.post('/ping', (req, res) => {
  const { name } = req.body;
  res.json({ command: "ping", username: name, timestamp: new Date().toISOString() });
});

// MongoDB loader (CJS imports)
const mongodbloader = async () => {
  console.log("[ASYNC BLOCK] async block loaded!");

  try {
    const {
      MainDatabase,
      getAllByClassAndSection,
      getByID
    } = require("./mongodb.mjs"); // now ESM

    const AssignmentsDB = require("./assignments.cjs");

    app.get("/", (req, res) => res.send("Server is running!"));

    app.get("/classes", (req, res) => {
      res.json({ classes: [{ grade: "9", section: "A" }, { grade: "9", section: "B" }] });
    });

    app.post("/teachers/login", async (req, res) => {
      const { SID, password } = req.body;
      const data = await MainDatabase.teacherHandlers.getByID(SID, "teachs");

      if (!data) return res.json({ body: "User does not exist", status: "Fail" });

      if (data.password === password) {
        const innerd = {
          SID: data.SID,
          name: data.name,
          class: data.class,
          subject: data.subject,
          password: "NiceTryChangingBackendButTsWontWork:)"
        };
        return res.json({ body: `Login successful for ${data.name}`, data: innerd, status: "Success" });
      }

      res.json({ body: "Incorrect password", status: "Fail" });
    });

    app.post("/assign", async (req, res) => {
      const { title, assigner, grade, section, questions, options, answers = [], subject } = req.body;

      if (!Array.isArray(questions) || !Array.isArray(options) || !Array.isArray(answers)) {
        return res.json({ body: "Invalid parameters entered!" });
      }

      const assignment = AssignmentsDB.returnNewAssignment(
        title, questions, options, assigner, answers, subject, grade, section
      );

      await AssignmentsDB.createAssignment(assignment);

      res.json({ body: "Assignment created successfully!", assignment });
    });

    app.post("/students/login", async (req, res) => {
      const { SID, password } = req.body;
      const stu = await MainDatabase.studentsHandlers.getByID(SID, "stus");

      if (!stu) return res.json({ body: "User does not exist", status: "Fail" });

      if (stu.password === password) {
        const innerd = {
          SID: stu.SID,
          name: stu.name,
          grade: stu.grade,
          section: stu.section,
          password: "NiceTryChangingBackendButTsWontWork:)"
        };
        return res.json({ body: `Login successful for ${stu.name}`, data: innerd, status: "Success" });
      }

      res.json({ body: "Incorrect password", status: "Fail" });
    });

    app.post("/students/get", async (req, res) => {
      const { SID } = req.body;
      if (!SID) return res.json({ body: "SID required", status: "Fail" });

      const student = await MainDatabase.studentsHandlers.getByID(SID, "stus");
      if (!student) return res.json({ body: "User does not exist", status: "Fail" });

      res.json({ body: "Fetching successful!", data: student, status: "Success" });
    });

    app.post("/students/all", async (req, res) => {
      const { grd, Stc } = req.body;
      const students = await getAllByClassAndSection(grd, Stc);
      res.json({ body: "Fetching all students successful!", data: students, status: "Success" });
    });

    app.post("/assginments", async (req, res) => {
      try {
        const { grade, section, subject } = req.body;

        if (!grade || !section || !subject) {
          return res.json({ body: "Invalid Parameters Entered" });
        }

        const assar = await AssignmentsDB.getAssignments(grade, section, subject);

        return res.json({
          body: "Fetch Success",
          data: assar
        });

      } catch (error) {
        console.error("Error fetching assignments:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    console.log("[ASYNC BLOCK] Finished loading");
  } catch (e) {
    console.log(e);
  }
};

await mongodbloader();

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
