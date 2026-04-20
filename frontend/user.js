const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

async function loadTasks() {
  const res = await fetch("http://localhost:5001/tasks/mytasks", {
    headers: { "Authorization": token }
  });

  const data = await res.json();

  let html = "";
  data.forEach(t => {
    html += `
      <div class="card">
        <h3>${t.title}</h3>
        <p>${t.description}</p>
        <input id="remark_${t._id}" placeholder="Write remark...">
        <button class="btn" onclick="finishTask('${t._id}')">Submit</button>
      </div>
    `;
  });

  document.getElementById("taskList").innerHTML = html;
}

loadTasks();

async function finishTask(id) {
  const remark = document.getElementById("remark_" + id).value;

  await fetch("http://localhost:5001/tasks/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ taskId: id, remark })
  });

  alert("Task Completed");
  loadTasks();
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
