let students = JSON.parse(localStorage.getItem("students")) || [];
let currentStudent = null;
const botToken = "8097728064:AAE_JtxnYG1tfIcgNiIgTyvK8n7kO0B5Mvc";
const updateChatId = "-1002407650992";
const apiUrl = "https://67c8964c0acf98d07087272b.mockapi.io/exams";

async function fetchStudents() {
  console.log("Fetching from API:", apiUrl);

  try {
    const response = await fetch(apiUrl);
    console.log("Response Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Fetch failed with status:",
        response.status,
        "Response:",
        errorText
      );
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    // Merge API data with local scores
    const apiStudents = data.map((student) => ({
      message_id: student.message_id || student.id, // Use API id if no message_id
      name: student.name,
      phone: student.phone,
      telegram: student.telegram,
      id: student.candidateID,
      timestamp: student.timestamp || student.examDate, // Adjust field name if needed
      sc: students.find((s) => s.id === student.id)?.sc || 100,
      og: students.find((s) => s.id === student.id)?.og || 0,
    }));

    students = apiStudents;
    localStorage.setItem("students", JSON.stringify(students));
    console.log("Updated Students:", students);
    renderStudents();
  } catch (error) {
    console.error("Error fetching students:", error.message, error.stack);
    alert("Failed to load students from API. Check console for details.");
  }
}

function renderStudents(filter = "") {
  const list = document.getElementById("studentList");
  list.innerHTML = "";
  console.log(
    "Rendering students with filter:",
    filter,
    "Total students:",
    students.length
  );
  students
    .filter((student) =>
      student.name.toLowerCase().includes(filter.toLowerCase())
    )
    .forEach((student) => {
      const li = document.createElement("li");
      li.className = "student-item";
      li.textContent = student.name;
      li.onclick = () => showModal(student);
      list.appendChild(li);
    });
  if (list.children.length === 0) {
    console.warn("No students rendered. Displaying placeholder.");
    list.innerHTML = "<li>No students found</li>";
  }
}

function searchStudents() {
  const query = document.querySelector(".search-bar").value;
  renderStudents(query);
}

function showModal(student) {
  currentStudent = student;
  document.getElementById("modalName").textContent = student.name;
  document.getElementById("modalId").textContent = student.id;
  document.getElementById("modalDate").textContent = student.timestamp;
  document.getElementById("modalTelegram").textContent = student.telegram;
  document.getElementById("modalSC").textContent = student.sc;
  document.getElementById("modalOG").textContent = student.og;
  document.getElementById("studentModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("studentModal").style.display = "none";
}

function updateScore(change) {
  currentStudent.sc += change;
  if (currentStudent.sc < 0) currentStudent.sc = 0;

  const milestones = [150, 200, 250, 300];
  const newOG = milestones.filter((m) => currentStudent.sc >= m).length;
  currentStudent.og = newOG;

  document.getElementById("modalSC").textContent = currentStudent.sc;
  document.getElementById("modalOG").textContent = currentStudent.og;

  localStorage.setItem("students", JSON.stringify(students));

  const message =
    currentStudent.sc === 0
      ? `User ${currentStudent.name} got 0 SC!!!! 😱`
      : `Student Score Update: 📝\nCandidate Name: #${
          currentStudent.name
        }\nNew SC: ${currentStudent.sc}\nChange: ${
          change > 0 ? "+10 SC" : "-10 SC"
        } 🚀`;
  sendTelegramMessage(message);
}

async function deleteStudent() {
  const message = `Student Removed: 🗑️\nCandidate Name: #${currentStudent.name}\nTelegram: ${currentStudent.telegram}`;
  await sendTelegramMessage(message);

  // Delete from API (assuming it supports DELETE by id)
  try {
    const deleteUrl = `${apiUrl}/${currentStudent.message_id}`;
    const response = await fetch(deleteUrl, {
      method: "DELETE",
    });
    if (!response.ok)
      throw new Error(`Failed to delete from API: ${response.status}`);
    console.log("Student deleted from API:", currentStudent.message_id);
  } catch (error) {
    console.error("Error deleting from API:", error);
  }

  students = students.filter((s) => s.message_id !== currentStudent.message_id);
  localStorage.setItem("students", JSON.stringify(students));
  console.log(
    "Student deleted:",
    currentStudent,
    "Updated students:",
    students
  );

  closeModal();
  renderStudents();
}

async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: updateChatId,
        text: message,
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log("Telegram Send Response:", data);
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    alert("Failed to send Telegram message.");
  }
}

fetchStudents();
renderStudents(); // Initial render from localStorage
