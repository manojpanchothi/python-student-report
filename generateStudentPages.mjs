// generateStudentPages.mjs
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

// URLs for the JSON files
const proficiencyUrl =
  'https://manojpanchothi.github.io/proficiency_report/student_proficiency_data.json';

// Helper: Fetch JSON data from a URL
async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

/**
 * Generates the report page HTML for a student.
 * Displays only the student's name and student id.
 * The practice page is linked using the student id.
 */
function generateReportHtml(studentId, studentName, userId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Student Proficiency Report - ${studentId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f9f9f9; text-align: center; }
    .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .title { font-size: 24px; font-weight: bold; color: #007BFF; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center; }
    th, td { border: 1px solid #ddd; padding: 10px; }
    th { background-color: #007BFF; color: white; }
    .green { color: green; font-size: 20px; }
    .red { color: red; font-size: 20px; }
    .neutral { color: #777; font-size: 20px; }
    button { background-color: #007BFF; color: white; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px; }
    button:hover { background-color: #0056b3; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">Python Proficiency Overview</h1>
    <p><strong>Student ID:</strong> <span id="student-id"></span></p>
    <p><strong>Name:</strong> <span id="student-name"></span></p>
    <table>
      <thead>
        <tr>
          <th>Concept Name</th>
          <th>Easy</th>
          <th>Medium</th>
          <th>Hard</th>
        </tr>
      </thead>
      <tbody id="report-body"></tbody>
    </table>
    <br>
    <button onclick="redirectToPractice()">View Recommended Questions</button>
  </div>
  <script>
    // Hardcoded student id for this file
    const studentId = "${studentId}";
    // Fetch proficiency data
    async function fetchProficiencyData() {
      try {
        const response = await fetch('https://manojpanchothi.github.io/proficiency_report/student_proficiency_data.json');
        if (!response.ok) throw new Error("HTTP error " + response.status);
        return await response.json();
      } catch (error) {
        console.error('Error fetching proficiency data:', error);
        alert("Error fetching student data. Please try again later.");
        return [];
      }
    }
    async function loadStudentData() {
      const proficiencyData = await fetchProficiencyData();
      if (!proficiencyData.length) {
        alert("No student data found.");
        return;
      }
      // Filter records by student id (niat_id)
      const studentRecords = proficiencyData.filter(s => s.niat_id === studentId);
      if (!studentRecords.length) {
        alert("Student not found.");
        return;
      }
      // Use first record for display
      const record = studentRecords[0];
      document.getElementById("student-name").innerText = record.student_name;
      document.getElementById("student-id").innerText = record.niat_id;
      
      const orderedTopics = [
        "IO_BASICS", "OPERATORS", "ARITHMETIC_OPERATORS", "ARITHMETIC_OPERATIONS",
        "CONDITIONAL_STATEMENTS_IF_ELSE", "LOOPS_FOR", "NESTED_LOOPS", "PATTERNS",
        "FUNCTIONS", "BUILT_IN_FUNCTIONS", "DATA_TYPE_STRING", "STRING_METHODS",
        "STRING_OPERATIONS", "STRING_MANIPULATION", "DATA_TYPE_LIST", "LISTS",
        "DATA_TYPE_SET", "DATA_TYPE_DICTIONARY"
      ];
      
      const proficiencyMap = {};
      studentRecords.forEach(record => {
        if (!proficiencyMap[record.sub_topic]) {
          proficiencyMap[record.sub_topic] = { easy: "-", medium: "-", hard: "-" };
        }
        // Assume percentage is a fraction (e.g., 0.5 means 50%)
        const rawPercentage = record.percentage_of_questions_solved;
        const percentageSolved = typeof rawPercentage === "number"
          ? rawPercentage
          : parseFloat(String(rawPercentage).replace('%', '')) || 0;
        const status = (percentageSolved * 100) >= 50 ? "✅" : "❌";
        if (record.difficulty === "EASY") proficiencyMap[record.sub_topic].easy = status;
        if (record.difficulty === "MEDIUM") proficiencyMap[record.sub_topic].medium = status;
        if (record.difficulty === "HARD") proficiencyMap[record.sub_topic].hard = status;
      });
      
      const reportBody = document.getElementById("report-body");
      orderedTopics.forEach(concept => {
        if (proficiencyMap[concept]) {
          const row = \`<tr>
            <td>\${concept}</td>
            <td class="\${proficiencyMap[concept].easy === '-' ? 'neutral' : proficiencyMap[concept].easy === '✅' ? 'green' : 'red'}">\${proficiencyMap[concept].easy}</td>
            <td class="\${proficiencyMap[concept].medium === '-' ? 'neutral' : proficiencyMap[concept].medium === '✅' ? 'green' : 'red'}">\${proficiencyMap[concept].medium}</td>
            <td class="\${proficiencyMap[concept].hard === '-' ? 'neutral' : proficiencyMap[concept].hard === '✅' ? 'green' : 'red'}">\${proficiencyMap[concept].hard}</td>
          </tr>\`;
          reportBody.innerHTML += row;
        }
      });
    }
    // Redirect to practice page using the student id in the file name.
    function redirectToPractice() {
      window.location.href = "practice_questions-" + studentId + ".html";
    }
    loadStudentData();
  </script>
</body>
</html>`;
}

/**
 * Generates the practice questions page HTML for a student.
 * The page filters recommended questions using the student's user_id.
 */
function generatePracticeHtml(studentId, userId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Practice Questions - ${studentId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f9f9f9; text-align: center; }
    .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .title { font-size: 26px; font-weight: bold; color: #007BFF; margin-bottom: 20px; }
    .question-category {
      font-size: 22px; font-weight: bold; margin-top: 20px; color: white;
      cursor: pointer; padding: 15px; border-radius: 5px; text-align: left;
      transition: background 0.3s, transform 0.2s;
    }
    .easy-category { background-color: #5a9367; }
    .medium-category { background-color: #d4a60b; }
    .hard-category { background-color: #b64b46; }
    .question-category:hover { filter: brightness(90%); transform: scale(1.02); }
    .question-list {
      display: none; flex-wrap: wrap; justify-content: center; gap: 15px;
      padding: 10px; list-style: none; border: 1px solid #ddd; border-radius: 5px;
      margin-top: 5px; background: #f3f3f3;
    }
    .question-item {
      background: white; padding: 15px; border-radius: 8px;
      box-shadow: 2px 2px 10px rgba(0,0,0,0.1); text-align: center;
      width: 250px; transition: transform 0.2s ease-in-out;
    }
    .question-item:hover { transform: scale(1.05); }
    .easy a { color: #5a9367; font-weight: bold; }
    .medium a { color: #d4a60b; font-weight: bold; }
    .hard a { color: #b64b46; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">Personalized Practice Set</h1>
    <div id="question-container"></div>
  </div>
  <script>
    const userId = "${userId}";
    async function fetchRecommendedQuestions() {
      try {
        const response = await fetch('https://manojpanchothi.github.io/recommendation/data.json');
        if (!response.ok) throw new Error("HTTP error " + response.status);
        return await response.json();
      } catch (error) {
        console.error('Error fetching recommended questions:', error);
        alert("Error fetching practice questions. Please try again later.");
        return [];
      }
    }
    async function loadPracticeQuestions() {
      const questionData = await fetchRecommendedQuestions();
      if (!questionData.length) {
        alert("No questions found.");
        return;
      }
      // Filter questions using the student's user_id.
      const studentQuestions = questionData.filter(q => q.user_id.trim() === userId);
      const questionContainer = document.getElementById("question-container");
      const categories = { EASY: [], MEDIUM: [], HARD: [] };
      studentQuestions.forEach(q => {
        const li = document.createElement("li");
        li.classList.add("question-item", q.difficulty.toLowerCase());
        const a = document.createElement("a");
        a.href = q.LINK;
        a.innerText = q.question_short_text;
        a.target = "_blank";
        li.appendChild(a);
        categories[q.difficulty].push(li);
      });
      Object.keys(categories).forEach(difficulty => {
        if (categories[difficulty].length > 0) {
          const section = document.createElement("div");
          const categoryHeader = document.createElement("div");
          categoryHeader.classList.add("question-category", difficulty.toLowerCase() + "-category");
          categoryHeader.innerText = difficulty + " Questions";
          const ul = document.createElement("ul");
          ul.classList.add("question-list");
          ul.style.display = "none";
          categoryHeader.onclick = () => {
            ul.style.display = (ul.style.display === "none") ? "flex" : "none";
          };
          categories[difficulty].forEach(item => ul.appendChild(item));
          section.appendChild(categoryHeader);
          section.appendChild(ul);
          questionContainer.appendChild(section);
        }
      });
    }
    loadPracticeQuestions();
  </script>
</body>
</html>`;
}

async function main() {
  try {
    // Create the output folder if it doesn't exist.
    const outputDir = 'output';
    await mkdir(outputDir, { recursive: true });
    
    const proficiencyData = await fetchData(proficiencyUrl);
    // Build a map keyed by student id (niat_id) storing studentName and userId.
    const studentMap = new Map();
    proficiencyData.forEach(record => {
      if (record.niat_id) {
        const studentId = record.niat_id.trim();
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            studentName: record.student_name,
            userId: record.user_id.trim()
          });
        }
      }
    });
    // Generate files named using the student id inside the output folder.
    for (const [studentId, { studentName, userId }] of studentMap.entries()) {
      const reportHtml = generateReportHtml(studentId, studentName, userId);
      const practiceHtml = generatePracticeHtml(studentId, userId);
      await writeFile(join(outputDir, `report-${studentId}.html`), reportHtml);
      await writeFile(join(outputDir, `practice_questions-${studentId}.html`), practiceHtml);
      console.log(`Generated pages for student ${studentId}`);
    }
  } catch (error) {
    console.error('Error generating pages:', error);
  }
}

main();
