import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: "local.env" });
const mc = new MongoClient(
  "mongodb+srv://maqwalnorep_db_user:vkd03ae4EKoMY5MI@quizzez.dkossl4.mongodb.net/?appName=Quizzez",
);
const dbName = "MainDatabase";
let connected = false;

/**
 * Connect to MongoDB and return the assignments collection
 */
async function connect() {
  if (!connected) {
    await mc.connect();
    connected = true;
    console.log("Connected to MongoDB!");
  }
  return mc.db(dbName).collection("assignments");
}
/**
 * Build a new assignment object
 */
function returnNewAssignment(
  name,
  questions,
  options,
  assigner,
  answers = [],
  subject,
  grade,
  section,
  dueDate,
) {
  const q = questions.map((que, index) => ({
    question: que,
    options: options[index],
    answer: answers[index] ?? null, // index of correct option
    answers: [],
  }));
  return { name, assigner, grade, section, subject, questions: q, dueDate };
}

async function editAssignment(
  grade,
  section,
  assigner,
  name,
  qi,
  answerIndex,
  sid,
) {
  const edb = await connect();
  await edb.updateOne(
    {
      grade,
      section,
      assigner,
      name,
      [`questions.${qi}.answers.sid`]: { $ne: sid },
    },
    {
      $push: {
        [`questions.${qi}.answers`]: { sid, answer: answerIndex, status: null },
      },
    },
  );
  await edb.updateOne(
    { grade, section, assigner, name, [`questions.${qi}.answers.sid`]: sid },
    { $set: { [`questions.${qi}.answers.$.answer`]: answerIndex } },
  );
}

async function checkStudentAnswer(grade, section, name, assigner, qi, sid) {
  const edb = await connect();
  const assignment = await edb.findOne({ grade, section, assigner, name });
  const question = assignment.questions[qi];
  const submission = question.answers.find((a) => a.sid === sid);
  const isCorrect = submission.answer === question.answer;
  return {
    isCorrect,
    studentAnswer: submission.answer,
    correctAnswer: question.answer,
  };
}
/**
 * Get assignments by grade, section, and subject
 */
export async function getAssignments(grade, section, subject) {
  const adb = await connect();
  if (subject) {
    const arr = await adb.find({ grade, section }).toArray();
    return arr.map((o) => ({
      ...o,
      _id: "",
      questions: "",
    }));
  }
  const arr = await adb.find({ grade, section, subject }).toArray();
  return arr.map((o) => ({
    ...o,
    _id: "",
    questions: "",
  }));
}

/**
 * Insert a new assignment into DB
 */
async function createAssignment(assignment) {
  const adb = await connect();
  await adb.insertOne(assignment);
  console.log("Assignment created!");
}
// Export for reuse
export const AssignmentsDB = {
  createAssignment,
  getAssignments,
  returnNewAssignment,
};

// ---------------------------------------------------- \\
// await createAssignment(asg)
// console.log(await getAssignments("9","B","Biology"));
// await editAssignment("9","B","suseendha","Artificial Intelligence",0,1,"1834")
// await editAssignment("9","B","suseendha","Artificial Intelligence",1,0,"1834")
// const asgn = await getAssignments("9", "B", "ICT");
// for (const [aIndex, as] of asgn.entries()) {
//   for (const [qIndex, question] of as.questions.entries()) {
//     const result = await checkStudentAnswer(
//       as.grade,
//       as.section,
//       as.name,
//       as.assigner,
//       qIndex,    // question index
//       "1834"     // student ID
//     );
//     console.log(`Assignment ${aIndex}, Question ${qIndex}:`, result);
//   }
// }
// ---------------------------------------------------- \\
