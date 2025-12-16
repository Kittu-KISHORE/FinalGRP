// CURRENT ROLE (CHANGE THIS TO TEST)
let currentRole = "ProjectOwner"; // ProjectOwner, ME, MEM, QM, PM, CTO, CFO

let records = [];

// Selected record for modal
let selectedRecordId = null;

// Role access map
const roleAccess = {
  ProjectOwner: ["home", "register", "history"],
  ME: ["home", "remarks", "g1", "g2", "g3", "g4", "g5", "history"],
  MEM: ["home", "remarks", "g1", "g2", "g3", "g4", "g5", "history"],
  QM: ["home", "remarks", "g1", "g2", "g3", "g4", "g5", "history"],
  PM: ["home", "register", "history"],
  CTO: ["home", "remarks", "g1", "g2", "g3", "g4", "g5", "history"],
  CFO: ["home", "remarks", "g4", "history"]
};

// Modal references
const approvalModal = document.getElementById("approvalModal");
const modalBody = document.getElementById("modalBody");

// Load records from localStorage
const STORAGE_KEY = "approval_records";

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function loadRecords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) records = JSON.parse(saved);
}

loadRecords();

// Attach click events to nav buttons
document.querySelectorAll(".nav-links button").forEach(btn => {
  btn.addEventListener("click", () => {
    activatePage(btn.dataset.page);
  });
});

// Function to activate page with role check
function activatePage(pageId) {
  const allowedPages = roleAccess[currentRole] || [];

  if (!allowedPages.includes(pageId)) {
    alert("Access denied for your role!");
    return;
  }

  document.querySelectorAll(".page").forEach(page => page.style.display = "none");
  const activePage = document.getElementById(pageId);
  if (activePage) activePage.style.display = "block";

  if (pageId.startsWith("g")) renderGate(pageId.toUpperCase());
  if (pageId === "history") renderHistory();
}

// Show Home page by default
window.onload = () => activatePage("home");

/* =========================
   REGISTER FORM
========================= */
document.getElementById("registerForm").addEventListener("submit", e => {
  e.preventDefault();

  const partNo = document.getElementById("partno").value;
  const comments = document.getElementById("r_comments").value;
  const finishDate = document.getElementById("rtarget_date").value;

  if (partNo === "default") {
    alert("Please select a Part No");
    return;
  }

  const newRecord = {
    id: Date.now(),
    partNo,
    comments,
    finishDate,
    currentGate: "G1",
    gateHistory: ["G1"], // Track gates this record has passed
    approvals: {
      G1: { ME: "Pending", MEM: "Pending", CTO: "Pending" },
      G2: { ME: "Pending", MEM: "Pending", CTO: "Pending" },
      G3: { ME: "Pending", MEM: "Pending", CTO: "Pending" },
      G4: { ME: "Pending", MEM: "Pending", CTO: "Pending" },
      G5: { ME: "Pending", MEM: "Pending", CTO: "Pending" }
    }
  };

  records.push(newRecord);
  saveRecords();

  alert("Part registered successfully!");
  renderHistory();
  renderGate("G1");
  document.getElementById("registerForm").reset();
});

/* ========================= RENDER HISTORY ========================= */
function renderHistory() {
  const section = document.getElementById("historyData");
  if (!section) return;

  if (records.length === 0) {
    section.innerHTML = "<p>No records yet.</p>";
    return;
  }

  section.innerHTML = `
    <table>
      <tr>
        <th>Sl No</th>
        <th>Part No</th>
        <th>Comments</th>
        <th>Finished Date</th>
        <th>Current Gate</th>
        <th>Gate History</th>
      </tr>
      ${records.map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.partNo}</td>
          <td>${r.comments}</td>
          <td>${r.finishDate}</td>
          <td>${r.currentGate}</td>
          <td>${r.gateHistory.join(", ")}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

/* =========================
   RENDER GATE
========================= */
function renderGate(gate) {
    const section = document.getElementById(gate.toLowerCase());
    if (!section) return;

    section.innerHTML = `<h2>${gate}</h2>`; // Always show heading

    const headers = ["Sl No", "Part No", "Comments", "Finished Date", "ME", "MEM", "CTO", "Action"];
    let table = `<table border="1" style="width:100%; border-collapse: collapse;">
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    // Include all records that have approvals for this gate
    const gateRecords = records.filter(r => r.approvals[gate]);

    if (gateRecords.length === 0) {
        table += `<tr><td colspan="${headers.length}" style="text-align:center;">No records in this gate</td></tr>`;
    } else {
        gateRecords.forEach((r, i) => {
            const meStatus = r.approvals[gate].ME || "Pending";
            const memStatus = r.approvals[gate].MEM || "Pending";
            const ctoStatus = r.approvals[gate].CTO || "Pending";

            const actionBtn = (r.currentGate === gate && r.approvals[gate].hasOwnProperty(currentRole))
                ? `<button onclick="openApprovalModal(${r.id})">Approve</button>`
                : "-";

            table += `<tr>
                        <td>${i + 1}</td>
                        <td>${r.partNo}</td>
                        <td>${r.comments}</td>
                        <td>${r.finishDate}</td>
                        <td class="${meStatus.toLowerCase()}">${meStatus}</td>
                        <td class="${memStatus.toLowerCase()}">${memStatus}</td>
                        <td class="${ctoStatus.toLowerCase()}">${ctoStatus}</td>
                        <td>${actionBtn}</td>
                      </tr>`;
        });
    }

    table += `</table>`;
    section.innerHTML += table;
}


/* =========================
   MODAL
========================= */
const rolePopups = {
ME: `
<h3>ME Approval</h3>
<hr>
<table class="approval-table">
  <tr>
    <th>Part No</th>
    <td><input type="text" id="partNo"></td>
  </tr>
  <tr>
    <th>ME Comments</th>
    <td><input type="text" id="comments"></td>
  </tr>
  <tr>
    <th>Reviewed Date</th>
    <td><input type="date" id="reviewed_date"></td>
  </tr>
  <tr>
    <th>Document</th>
    <td><input type="file" id="upload_docx"></td>
  </tr>
</table>
<br>

<div class="approval-actions">
  <button onclick="approveRecord('Approved')">Approve</button>
  <button onclick="approveRecord('Rejected')">Reject</button>
  <button onclick="closeModal()">Cancel</button>
</div>
`,
MEM: `
<h3>MEM Approval</h3>
<hr>

<h4>ME Review</h4>
<table class="approval-table">
  <tr><th>Part No</th><td><input type="text" id="partNo" readonly></td></tr>
  <tr><th>ME Comments</th><td><input type="text" id="comments" readonly></td></tr>
  <tr><th>Reviewed Date</th><td><input type="date" id="reviewed_date" readonly></td></tr>
  <tr><th>Document</th><td><input type="file" id="upload_docx" readonly></td></tr>
</table>

<h4>MEM Review</h4>
<table class="approval-table">
  <tr><th>MEM Comments</th><td><input type="text" id="mem_comments"></td></tr>
  <tr><th>Reviewed Date</th><td><input type="date" id="memreviewed_date"></td></tr>
  <tr><th>Document</th><td><input type="file" id="memupload_docx"></td></tr>
</table>
<br>

<div class="approval-actions">
  <button onclick="approveRecord('Approved')">Approve</button>
  <button onclick="approveRecord('Rejected')">Reject</button>
  <button onclick="closeModal()">Cancel</button>
</div>
`,
CTO: `
<h3>CTO Approval</h3>
<hr>

<h4>ME Review</h4>
<table class="approval-table">
  <tr><th>Part No</th><td><input type="text" id="partNo" readonly></td></tr>
  <tr><th>ME Comments</th><td><input type="text" id="comments" readonly></td></tr>
  <tr><th>Reviewed Date</th><td><input type="date" id="reviewed_date" readonly></td></tr>
  <tr><th>Document</th><td><input type="file" id="upload_docx" readonly></td></tr>
</table>

<h4>MEM Review</h4>
<table class="approval-table">
  <tr><th>MEM Comments</th><td><input type="text" id="mem_comments" readonly></td></tr>
  <tr><th>Reviewed Date</th><td><input type="date" id="memreviewed_date" readonly></td></tr>
  <tr><th>Document</th><td><input type="file" id="memupload_docx" readonly></td></tr>
</table>

<h4>CTO Review</h4>
<table class="approval-table">
  <tr><th>CTO Comments</th><td><input type="text" id="ctocomments"></td></tr>
  <tr><th>Reviewed Date</th><td><input type="date" id="ctoreviewed_date"></td></tr>
  <tr><th>Document</th><td><input type="file" id="ctoupload_docx"></td></tr>
</table>
<br>
<div class="approval-actions">
  <button onclick="approveRecord('Approved')">Approve</button>
  <button onclick="approveRecord('Rejected')">Reject</button>
  <button onclick="closeModal()">Cancel</button>
</div>
`
};

function openApprovalModal(recordId) {
  const rec = records.find(r => r.id === recordId);
  const gate = rec.currentGate;

  if (!rec.approvals[gate].hasOwnProperty(currentRole)) {
    alert("You cannot approve this record");
    return;
  }

  selectedRecordId = recordId;
  modalBody.innerHTML = rolePopups[currentRole];

  // Prefill data
  if (rec.meData) {
    if (document.getElementById("partNo")) {
      document.getElementById("partNo").value = rec.meData.partNo || "";
      document.getElementById("comments").value = rec.meData.comments || "";
      document.getElementById("reviewed_date").value = rec.meData.reviewed_date || "";
      document.getElementById("upload_docx").value = rec.meData.upload_docx || "";
    }
  }

  if (currentRole === "CTO" && rec.memData) {
    document.getElementById("mem_comments").value = rec.memData.mem_comments || "";
    document.getElementById("memreviewed_date").value = rec.memData.memreviewed_date || "";
    document.getElementById("memupload_docx").value = rec.memData.memupload_docx || "";
  }

  approvalModal.classList.remove("hidden");
}

function closeModal() {
  approvalModal.classList.add("hidden");
}

/* =========================
   APPROVE RECORD
========================= */
function approveRecord(status) {
  const rec = records.find(r => r.id === selectedRecordId);
  const gate = rec.currentGate;

  // Save role data
  if (currentRole === "ME") {
    rec.meData = {
      partNo: document.getElementById("partNo").value,
      comments: document.getElementById("comments").value,
      reviewed_date: document.getElementById("reviewed_date").value,
      upload_docx: document.getElementById("upload_docx").value
    };
  }

  if (currentRole === "MEM") {
    rec.memData = {
      mem_comments: document.getElementById("mem_comments").value,
      memreviewed_date: document.getElementById("memreviewed_date").value,
      memupload_docx: document.getElementById("memupload_docx").value
    };
  }

  if (currentRole === "CTO") {
    rec.ctoData = {
      ctocomments: document.getElementById("ctocomments").value,
      ctoreviewed_date: document.getElementById("ctoreviewed_date").value,
      ctoupload_docx: document.getElementById("ctoupload_docx").value
    };
  }

  // Update approval status
  rec.approvals[gate][currentRole] = status;

  // Check if all approvals done → move to next gate
  const allApproved = Object.values(rec.approvals[gate]).every(v => v === "Approved");
  if (allApproved) {
    const nextGate = getNextGate(gate);
    if (nextGate && !rec.gateHistory.includes(nextGate)) {
      rec.currentGate = nextGate;
      rec.gateHistory.push(nextGate);
    }
  }

  saveRecords();
  closeModal();
  renderGate(gate);
  renderGate(rec.currentGate);
  renderHistory();
}

/* =========================
   GET NEXT GATE
========================= */
function getNextGate(currentGate) {
  const order = ["G1","G2","G3","G4","G5"];
  const index = order.indexOf(currentGate);
  return order[index + 1] || null;
}
