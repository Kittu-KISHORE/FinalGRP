// Show only selected page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    document.getElementById(pageId).classList.remove('hidden');
}

// Add event to all navbar buttons
document.querySelectorAll('.navbar button').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.getAttribute("data-page");
        showPage(page);
    });
});


// -----------------------Role based G1–G5 -------------------------------------------

// Hardcoded role for testing (Project Owner,ME, MEM, CTO)
let userRole = "ME";  

// ===== GATE SUBMISSION TRACKING =====
// Track which roles submitted which gates per part: { [part]: { me_g1: ts, mem_g1: ts, cto_g1: ts, ... } }
function getGateSubmissions() {
    return JSON.parse(localStorage.getItem("gateSubmissions") || "{}");
}

function setGateSubmissions(submissions) {
    localStorage.setItem("gateSubmissions", JSON.stringify(submissions));
}

function markGateSubmission(part, gateNum, role) {
    if (!part) return;
    const submissions = getGateSubmissions();
    submissions[part] = submissions[part] || {};
    submissions[part][`${role}_g${gateNum}`] = Date.now();
    setGateSubmissions(submissions);
}

function wasGateSubmittedByRole(part, gateNum, role) {
    const submissions = getGateSubmissions();
    return submissions[part] && submissions[part][`${role}_g${gateNum}`] !== undefined;
}

function wasGateApprovedByCTO(part, gateNum) {
    // CTO approval = CTO submitted the gate (checkbox marked)
    return wasGateSubmittedByRole(part, gateNum, "cto");
}

// ===== ACCESS CONTROL =====
function canAccessGate(gateNum, lastPart) {
    if (!lastPart) return false; // Block all access if no part registered
    
    // G1: ME can access, but MEM/CTO need ME to have submitted it
    if (gateNum === 1) {
        if (userRole === "ME") return true;
        if (userRole === "MEM") return wasGateSubmittedByRole(lastPart, 1, "me");
        if (userRole === "CTO") return wasGateSubmittedByRole(lastPart, 1, "mem");
        return false;
    }

    // ME: can access gate only if prior gate was CTO-approved
    if (userRole === "ME") {
        return wasGateApprovedByCTO(lastPart, gateNum - 1);
    }
    
    // MEM: can access gate only if same gate was ME-submitted
    if (userRole === "MEM") {
        return wasGateSubmittedByRole(lastPart, gateNum, "me");
    }
    
    // CTO: can access gate only if same gate was MEM-submitted
    if (userRole === "CTO") {
        return wasGateSubmittedByRole(lastPart, gateNum, "mem");
    }
    
    return false;
}

// Get appropriate alert message based on role and gate
function getAccessDeniedMessage(gateNum, role) {
    if (role === "ME") {
        return `Approval pending for Gate ${gateNum - 1} by CTO. Please wait for CTO approval before accessing Gate ${gateNum}.`;
    } else if (role === "MEM") {
        return `Gate ${gateNum} not yet started by ME. Wait for ME to submit Gate ${gateNum}.`;
    } else if (role === "CTO") {
        return `Gate ${gateNum} not yet submitted by MEM. Wait for MEM to submit Gate ${gateNum}.`;
    }
    return "Access denied for this gate.";
}

// Helper function to open gate by role
function openGateByRole(gateNumber){
    const lastPart = localStorage.getItem("lastSelectedPart");
    // Block all gate access if no part is registered
    if (!lastPart) {
        alert("Please register a part first.");
        showPage('register');
        return;
    }
    // Check access control
    if (!canAccessGate(gateNumber, lastPart)) {
        const msg = getAccessDeniedMessage(gateNumber, userRole);
        alert(msg);
        showPage('home');
        return;
    }
    // Hide all pages first
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    const gateId = `g${gateNumber}-${userRole.toLowerCase()}`;
    const gateEl = document.getElementById(gateId);
    if (gateEl) {
    document.querySelectorAll(".page").forEach(p => p.classList.add('hidden'));
    gateEl.classList.remove('hidden');

    // Populate grid from database/localStorage
    generateGateGridFromDB(`${gateId}-grid-container`, gateNumber);
}
}

// G1 button click
document.querySelector('button[data-page="g1"]')?.addEventListener("click", function () {
    openGateByRole(1);
});

// G2 button click
document.querySelector('button[data-page="g2"]')?.addEventListener("click", function () {
    openGateByRole(2);
});

// G3 button click
document.querySelector('button[data-page="g3"]')?.addEventListener("click", function () {
    openGateByRole(3);
});

// G4 button click
document.querySelector('button[data-page="g4"]')?.addEventListener("click", function () {
    openGateByRole(4);
});

// G5 button click
document.querySelector('button[data-page="g5"]')?.addEventListener("click", function () {
    openGateByRole(5);
});



function backupAndSelectiveClear() {
    const keysToKeep = [
        "gateSubmissions",   // ME / MEM / CTO submission history
        "partRecords",       // All comments + finished dates
        "registeredParts",   // Registered part numbers
        "lastSelectedPart"   // Current part
    ];

    // ---- Backup important values ----
    const backup = {};
    keysToKeep.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
            backup[key] = value;
        }
    });

    // Store backup into localStorage
    localStorage.setItem("backup_storage", JSON.stringify(backup));

    // ---- Selectively clear only unwanted keys ----
    Object.keys(localStorage).forEach(key => {
        if (key !== "backup_storage" && !keysToKeep.includes(key)) {
            localStorage.removeItem(key);
        }
    });
}


// ---------- Register + PartNo + Comments propagation ----------
document.addEventListener("DOMContentLoaded", () => {
    // Optional: Uncomment the next line to clear all localStorage on page load for fresh start
    //localStorage.clear();
    backupAndSelectiveClear();


    const registerForm = document.querySelector("#register form");
    const partSelect = document.getElementById("partno");
    const commentInput = document.getElementById("r_comments");

    

    // Target element IDs that should receive the Part No (G1 and G2-G5)
    const partTargetIds = [
        // G1
        "me_partno", "mem_partno", "cto_partno",
        // G2
        "g2me_partno", "g2mem_partno", "g2cto_partno",
        // G3
        "g3me_partno", "g3mem_partno", "g3cto_partno",
        // G4
        "g4me_partno", "g4mem_partno", "g4cto_partno",
        // G5
        "g5me_partno", "g5mem_partno", "g5cto_partno"
    ];

    // Targets for comments propagation (editable fields for current role + readonly cross-role fields)
    const commentTargetIds = [
        // G1
        "me_comments", "mem_comments", "cto_comments", "cto_mem_comments", "mem_me_comment",
        // G2
        "g2me_comments", "g2mem_comments", "g2cto_comments", "g2cto_mem_comments", "g2mem_me_comment",
        // G3
        "g3me_comments", "g3mem_comments", "g3cto_comments", "g3cto_mem_comments", "g3mem_me_comment",
        // G4
        "g4me_comments", "g4mem_comments", "g4cto_comments", "g4cto_mem_comments", "g4mem_me_comment",
        // G5
        "g5me_comments", "g5mem_comments", "g5cto_comments", "g5cto_mem_comments", "g5mem_me_comment"
    ];

    function getRegisteredParts() {
        return JSON.parse(localStorage.getItem("registeredParts") || "[]");
    }

    function setRegisteredParts(parts) {
        localStorage.setItem("registeredParts", JSON.stringify(parts));
    }

    // Records structure per part per gate: { [part]: { g1: {ME: {comment, fdate, ts}, MEM: {...}, CTO: {...}}, g2: {...}, ... } }
    function getRecords() {
        return JSON.parse(localStorage.getItem("partRecords") || "{}");
    }
      

    function setRecords(records) {
        localStorage.setItem("partRecords", JSON.stringify(records));
    }

    function saveRecordForPart(part, gateNum, role, data) {
        if (!part) return;
        const records = getRecords();
        records[part] = records[part] || {};
        records[part][`g${gateNum}`] = records[part][`g${gateNum}`] || {};
        records[part][`g${gateNum}`] [role] = Object.assign({ts:Date.now()}, data || {});
        setRecords(records);
    }                                                                                                                        
    function loadRecordForPart(part, gateNum) {
        if (!part) return null;
        const records = getRecords();
        return records[part]?.[`g${gateNum}`] || null;
    }

    function propagatePartNo(part) {
        // Update inputs/selects for each target id
        partTargetIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            if (el.tagName === "SELECT") {
                // If target is a select, (re)populate options and select the part
                el.innerHTML = ""; // clear
                const defaultOpt = document.createElement("option");
                defaultOpt.value = "";
                defaultOpt.textContent = "Select Part No";
                el.appendChild(defaultOpt);

                const registered = getRegisteredParts();
                registered.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p;
                    opt.textContent = p;
                    el.appendChild(opt);
                });

                // If the passed part exists in the list, set it; otherwise leave default
                if (registered.includes(part)) el.value = part;
            } else {
                // For inputs (text/date/etc.) just set the value
                el.value = part;
            }
        });
        // Keep last selected for reloads / future openings
        localStorage.setItem("lastSelectedPart", part);
    }

    function propagateComments(comment) {
        if (comment == null) return;

        commentTargetIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            // only set value for input/textarea
            if ('value' in el) el.value = comment;
        });

        localStorage.setItem("lastComment", comment);
    }
   
    // Wire register form submit
    if (registerForm && partSelect) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const selectedPart = partSelect.value;
            if(!selectedPart || selectedPart === "default" || selectedPart === ""){
                alert("please select a valid Part No.:");
                return;
            }
            const commentVal = commentInput ? commentInput.value: "";
           
            // Maintain registeredParts list
            const registeredParts = getRegisteredParts();
                if(!registeredParts.includes(selectedPart)){
                    registeredParts.push(selectedPart);
                    setRegisteredParts(registeredParts);
                }
                
            // Persist per-part per-gate record by role
            saveRecordForPart(selectedPart, 1, userRole, { comment: commentVal });

            // Propagate selected part and comments to all target fields
            propagatePartNo(selectedPart);
            propagateComments(commentVal);

            // Mark ME G1 submission (Gate 1 now accessible for MEM)
            markGateSubmission(selectedPart, 1, "me");

            // Navigate to G1 gate page and reset form
            openGateByRole(1);
            registerForm.reset();
        });
    }

    // ===== GATE SUBMIT HANDLERS =====
    // Attach submit handlers to all gate forms to mark role submissions
    for (let gateNum = 1; gateNum <= 5; gateNum++) {
        for (const role of ["me", "mem", "cto"]) {
            const gateId = `g${gateNum}-${role}`;
            const gateSection = document.getElementById(gateId);
            if (!gateSection) continue;

            const submitBtn = gateSection.querySelector(".submit-btn");
            if (!submitBtn) continue;

            submitBtn.addEventListener("click", (e) => {
                e.preventDefault();
                // Find the parent form of the button
                const form = submitBtn.closest('form');
                if (form && !form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                const lastPart = localStorage.getItem("lastSelectedPart");
                if (!lastPart) {
                    alert("No part selected. Please go to Register first.");
                    return;
                }
                // Mark this role's submission for this gate
                markGateSubmission(lastPart, gateNum, role);
                
                // Save the form data for this role in this gate
                const gateRec = {};
                const commentField = gateSection.querySelector(`#g${gateNum !== 1 ? gateNum : ''}${role}_comments, #${role}_comments`);
                if (commentField && commentField.value) {
                    gateRec.comment = commentField.value;
                }
                const fdateField = gateSection.querySelector(`#g${gateNum !== 1 ? gateNum : ''}${role}_fdate, #${role}_fdate`);
                if (fdateField && fdateField.value) {
                    gateRec.fdate = fdateField.value;
                }
                const rdateField = gateSection.querySelector(`#g${gateNum !==1 ? gateNum : ''}${role}_rdate, #${role}_rdate`);
                if(rdateField && rdateField.value){
                    gateRec.rdate = rdateField.value;
                }
                if (Object.keys(gateRec).length > 0) {
                    saveRecordForPart(lastPart, gateNum, role.toUpperCase(), gateRec);
                }
                
                if (role === "me") {
                    alert(`Gate ${gateNum} submitted by ME. MEM can now review.`);
                } else if (role === "mem") {
                    alert(`Gate ${gateNum} submitted by MEM. CTO can now review and approve.`);
                } else if (role === "cto") {
                    const approvalCheckbox = gateSection.querySelector(".g1-approval");
                    if (approvalCheckbox && approvalCheckbox.checked) {
                        const gateNames = {
                            1: "Gate 1",
                            2: "Gate 2",
                            3: "Gate 3",
                            4: "Gate 4",
                            5: "Gate 5"
                        };
                        alert(`${gateNames[gateNum]} Approved`);
                    }
                }
                // Reset the form after submission
                if (form) form.reset();
                // Redirect to home page after submission
                showPage('home');
            });
        }
    }

    // On load: populate select targets and set last selected into inputs + restore last comment
    const lastSelected = localStorage.getItem("lastSelectedPart") || null;
    const lastComment = localStorage.getItem("lastComment") || null;
    const registeredParts = getRegisteredParts();

    partTargetIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        if (el.tagName === "SELECT") {
            // populate select with registered parts
            el.innerHTML = "";
            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            defaultOpt.textContent = "Select Part No";
            el.appendChild(defaultOpt);

            registeredParts.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p;
                opt.textContent = p;
                el.appendChild(opt);
            });

            if (lastSelected && registeredParts.includes(lastSelected)) {
                el.value = lastSelected;
            }
        } else {
            // inputs: put the last selected (if any)
            if (lastSelected) el.value = lastSelected;
        }
    });

// Restore records for the last selected part (populate editable + readonly views per gate)
if (lastSelected) {
    for (let gateNum = 1; gateNum <= 5; gateNum++) {

        const rec = loadRecordForPart(lastSelected, gateNum) || {};
        const gatePrefix = gateNum === 1 ? "" : `g${gateNum}`;

        // ---- ME comment ----
        if (rec.ME && rec.ME.comment) {

            // ME editable field
            const meField = document.getElementById(`${gatePrefix}me_comments`);
            if (meField) meField.value = rec.ME.comment;

            // MEM readonly view of ME
            const memView = document.getElementById(`${gatePrefix}mem_me_comment`);
            if (memView) memView.value = rec.ME.comment;

            // CTO readonly view of ME
            const ctoView = document.getElementById(`${gatePrefix}cto_me_comments`);
            if (ctoView) ctoView.value = rec.ME.comment;
        }

        // ---- MEM comment ----
        if (rec.MEM && rec.MEM.comment) {

            // MEM editable field
            const memField = document.getElementById(`${gatePrefix}mem_comments`);
            if (memField) memField.value = rec.MEM.comment;

            // CTO view of MEM
            const ctoMem = document.getElementById(`${gatePrefix}cto_mem_comments`);
            if (ctoMem) ctoMem.value = rec.MEM.comment;
        }

        // ---- CTO comment ----
        if (rec.CTO && rec.CTO.comment) {
            const ctoField = document.getElementById(`${gatePrefix}cto_comments`);
            if (ctoField) ctoField.value = rec.CTO.comment;
        }
    }
}


});

// ----------------- mobile view media querry ----------------------------
const navLinks = document.querySelector('.nav-links');

function toggleMenu() {
    if (navLinks.style.left === '0px') {
        navLinks.style.left = '-250px'; // hide menu
    } else {
        navLinks.style.left = '0px'; // show menu
    }
}

// Close menu automatically when any button inside the menu is clicked
document.querySelectorAll('.nav-links button').forEach(btn => {
    btn.addEventListener('click', () => {
        navLinks.style.left = '-250px';
    });
});


// grid container for G1 ME
/**
 * Generate a dynamic grid for a gate based on stored records
 * @param {string} containerId - ID of the container
 * @param {number} gateNumber - gate number (1–5)
 */
function generateGateGridFromDB(containerId, gateNumber) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ""; // Clear existing grid

    const records = JSON.parse(localStorage.getItem("partRecords") || "{}");

    // Flatten records into rows
    // Each row corresponds to a part and a gate
    const rowsData = [];
    for (const part in records) {
        const gateRec = records[part][`g${gateNumber}`] || {};
        rowsData.push({
            part,
            ME_comment: gateRec.ME?.comment || "",
            MEM_comment: gateRec.MEM?.comment || "",
            CTO_comment: gateRec.CTO?.comment || "",
            ME_fdate: gateRec.ME?.fdate || "",
            MEM_fdate: gateRec.MEM?.fdate || "",
            CTO_fdate: gateRec.CTO?.fdate || "",
            timestamp: gateRec.ME?.ts || gateRec.MEM?.ts || gateRec.CTO?.ts || ""
        });
    }

    // Create table
    const table = document.createElement("table");
    table.classList.add("gate-grid");

    // Header row (8 columns)
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["Part No", "ME Comment", "ME Finish Date", "MEM Comment", "MEM Finish Date", "CTO Comment", "CTO Finish Date", "Last Updated"];
    headers.forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

   

    // Body rows
    const tbody = document.createElement("tbody");
    rowsData.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.part}</td>
            <td>${row.ME_comment}</td>
            <td>${row.ME_fdate}</td>
            <td>${row.MEM_comment}</td>
            <td>${row.MEM_fdate}</td>
            <td>${row.CTO_comment}</td>
            <td>${row.CTO_fdate}</td>
            <td>${row.timestamp ? new Date(row.timestamp).toLocaleString() : ""}</td>
        `;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

