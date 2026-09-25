// --- INITIALIZE COMPLAINTS DATA ---
let complaints = JSON.parse(localStorage.getItem("campus_complaints")) || [];

// --- REAL-TIME DATE/TIME HEADER DISPLAY ---
function initClock() {
    const dateTimeEl = document.getElementById('dateTime');
    if (!dateTimeEl) return;
    
    const updateTime = () => {
        const now = new Date();
        dateTimeEl.innerHTML = `
            <i class="far fa-clock"></i> 
            ${now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} | 
            ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        `;
    };
    
    updateTime();
    setInterval(updateTime, 1000);
}

// --- SESSION LOGIN FLOW ---
function handleLogin() {
    const role = document.getElementById("role").value;
    const usernameInput = document.getElementById("username").value.trim();
    const user = usernameInput || (role === 'admin' ? "System Administrator" : "Authorized Student");
    
    document.getElementById("loginOverlay").classList.add("hidden");
    document.getElementById("mainSidebar").classList.remove("hidden");
    document.getElementById("mainContent").classList.remove("hidden");
    
    const welcomeMsgEl = document.getElementById("welcomeMsg");
    const subMsgEl = document.getElementById("subMsg");
    
    if (role === 'admin') {
        welcomeMsgEl.innerHTML = `<i class="fas fa-user-shield"></i> Access Granted: ${user}`;
        subMsgEl.innerText = "Systems operational. Managing support console.";
        document.getElementById("adminLink").classList.remove("hidden");
        showSection('adminDash');
    } else {
        welcomeMsgEl.innerHTML = `<i class="fas fa-graduation-cap"></i> Portal Active: ${user}`;
        subMsgEl.innerText = "Request campus services and track status online.";
        document.getElementById("adminLink").classList.add("hidden");
        showSection('studentDash');
    }
}

// --- SECTION SWITCHING FLOW ---
function showSection(sectionId) {
    // Hide all main section containers
    document.getElementById("studentDash").classList.add("hidden");
    document.getElementById("adminDash").classList.add("hidden");
    
    // Show target section container
    document.getElementById(sectionId).classList.remove("hidden");
    
    // De-activate all navigation link UI highlights
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Set matching navigation active state
    if (sectionId === 'adminDash') {
        loadAdminTable();
        document.getElementById("adminLink").classList.add('active');
    } else {
        // First sidebar navigation link is Student Request Support
        document.querySelector('.sidebar nav .nav-link').classList.add('active');
    }
}

// --- SUBMIT TICKET HANDLER ---
function setupTicketSubmission() {
    const submitBtn = document.getElementById("submitBtn");
    if (!submitBtn) return;
    
    submitBtn.addEventListener("click", () => {
        const titleEl = document.getElementById("title");
        const descEl = document.getElementById("desc");
        const priorityEl = document.getElementById("priority");
        const imgInput = document.getElementById("image");
        const cidEl = document.getElementById("cid");

        const title = titleEl.value.trim();
        const desc = descEl.value.trim();
        const priority = priorityEl.value;

        if (!title || !desc) {
            alert("Validation Failed: Please provide both the Subject and Description.");
            return;
        }

        const id = "CC-" + Math.floor(100000 + Math.random() * 900000);

        const save = (imgBase64 = "") => {
            const newTicket = { 
                id, 
                title, 
                desc, 
                priority,
                image: imgBase64, 
                status: "Open", 
                date: new Date().toLocaleString() 
            };
            
            complaints.push(newTicket);
            localStorage.setItem("campus_complaints", JSON.stringify(complaints));
            
            // Success display
            cidEl.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); padding: 12px; border-radius: 10px; color: var(--success); font-size: 0.85rem; margin-top: 15px;">
                    <i class="fas fa-check-circle"></i> Ticket Generated Successfully: <strong>${id}</strong>
                </div>
            `;
            
            // Clear inputs
            titleEl.value = "";
            descEl.value = "";
            priorityEl.value = "Medium";
            imgInput.value = "";
            
            // Auto hide success badge after a few seconds
            setTimeout(() => {
                cidEl.innerHTML = "";
            }, 8000);
        };

        if (imgInput.files[0]) {
            const file = imgInput.files[0];
            
            // Basic size check (limit base64 storage to ~2MB to protect LocalStorage quota)
            if (file.size > 2 * 1024 * 1024) {
                alert("File too large! Please choose an image smaller than 2MB.");
                return;
            }
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => save(reader.result);
            reader.onerror = () => {
                alert("Error processing selected image. File will not be saved.");
                save();
            };
        } else {
            save();
        }
    });
}

// --- ADMIN DASHBOARD RENDER ---
function loadAdminTable() {
    const body = document.getElementById("tableBody");
    if (!body) return;
    body.innerHTML = "";
    
    let total = complaints.length;
    let pending = 0;
    let solved = 0;

    complaints.forEach((c, index) => {
        if (c.status === "Open") {
            pending++;
        } else {
            solved++;
        }
        
        body.innerHTML += `
            <tr class="ticket-row" data-search="${c.id} ${c.title}">
                <td style="color: var(--text-dim); font-size: 0.75rem;">${c.date}</td>
                <td><strong style="color: var(--primary)">${c.id}</strong></td>
                <td>
                    ${escapeHtml(c.title)} 
                    <span class="priority-tag" style="color: ${getPriorityColor(c.priority)}; border-color: ${getPriorityColor(c.priority)}">${c.priority}</span>
                </td>
                <td>
                    <span class="status-pill status-${c.status}">
                        <i class="fas ${c.status === 'Open' ? 'fa-spinner fa-spin' : 'fa-check'}"></i>
                        ${c.status}
                    </span>
                </td>
                <td class="action-btns">
                    <select onchange="updateStatus(${index}, this.value)">
                        <option value="Open" ${c.status === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="Solved" ${c.status === 'Solved' ? 'selected' : ''}>Solved</option>
                    </select>
                    <button class="btn-icon" title="View Ticket Details" onclick="viewDetails(${index})">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete Ticket" onclick="deleteTicket(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statPending').innerText = pending;
    document.getElementById('statSolved').innerText = solved;
}

// Helper colors for visual priority
function getPriorityColor(p) {
    if (p === 'High') return 'var(--danger)';
    if (p === 'Medium') return 'var(--warning)';
    return 'var(--success)';
}

// Update Ticket Status
function updateStatus(idx, val) {
    complaints[idx].status = val;
    localStorage.setItem("campus_complaints", JSON.stringify(complaints));
    loadAdminTable();
}

// Delete Ticket Handler
function deleteTicket(idx) {
    if (confirm("Permanently remove this ticket from institutional records?")) {
        complaints.splice(idx, 1);
        localStorage.setItem("campus_complaints", JSON.stringify(complaints));
        loadAdminTable();
    }
}

// Live Filter Search in Admin dashboard
function filterTickets() {
    const query = document.getElementById("adminSearch").value.toLowerCase();
    document.querySelectorAll(".ticket-row").forEach(row => {
        const text = row.getAttribute("data-search").toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
    });
}

// --- STUDENT TRACK COMPLAINT ---
function trackComplaint() {
    const trackIdInput = document.getElementById("trackId");
    const res = document.getElementById("trackResult");
    if (!trackIdInput || !res) return;
    
    const id = trackIdInput.value.trim().toUpperCase();
    if (!id) {
        res.innerHTML = `<span style="color: var(--warning); font-size: 0.8rem;"><i class="fas fa-exclamation-triangle"></i> Please enter a Ticket ID.</span>`;
        return;
    }
    
    const found = complaints.find(c => c.id === id);
    
    if (found) {
        const isSolved = found.status === "Solved";
        res.innerHTML = `
            <div class="card" style="margin: 0; background: rgba(99, 102, 241, 0.08); border: 1px solid var(--primary); animation: scaleUp 0.3s ease;">
                <h4 style="font-size: 0.9rem; margin-bottom: 8px; color: var(--text-main);"><i class="fas fa-info-circle"></i> Ticket Found</h4>
                <p style="font-size: 0.8rem; margin-bottom: 6px; color: var(--text-dim);">Subject: ${escapeHtml(found.title)}</p>
                <p style="font-size: 0.8rem; margin-bottom: 12px; color: var(--text-dim);">Priority: <span style="color: ${getPriorityColor(found.priority)}; font-weight: 600;">${found.priority}</span></p>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <strong style="font-size: 0.8rem;">Status:</strong> 
                    <span class="status-pill status-${found.status}">
                        <i class="fas ${isSolved ? 'fa-check' : 'fa-spinner fa-spin'}"></i>
                        ${found.status}
                    </span>
                </div>
            </div>`;
    } else {
        res.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); padding: 12px; border-radius: 10px; color: var(--danger); font-size: 0.8rem; animation: scaleUp 0.3s ease;">
                <i class="fas fa-times-circle"></i> Reference ID not recognized. Please check and try again.
            </div>`;
    }
}

// --- DETAILS MODAL CONTROLLERS ---
function viewDetails(idx) {
    const c = complaints[idx];
    if (!c) return;
    
    document.getElementById("modalTitle").innerText = c.title;
    document.getElementById("modalDesc").innerText = c.desc;
    document.getElementById("modalMeta").innerHTML = `
        <span><i class="fas fa-fingerprint"></i> ID: <strong>${c.id}</strong></span>
        <span>|</span>
        <span><i class="fas fa-exclamation-circle"></i> Priority: <strong style="color: ${getPriorityColor(c.priority)}">${c.priority}</strong></span>
        <span>|</span>
        <span><i class="fas fa-calendar-alt"></i> Filed: <strong>${c.date}</strong></span>
    `;
    
    const img = document.getElementById("modalImage");
    if (c.image) {
        img.src = c.image;
        img.style.display = "block";
    } else {
        img.style.display = "none";
    }
    
    document.getElementById("descModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("descModal").style.display = "none";
}

// Escape HTML Helper to prevent XSS in ticket listings
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Close Modal when clicking outside the content window
window.onclick = function(event) {
    const modal = document.getElementById("descModal");
    if (event.target === modal) {
        closeModal();
    }
};

// --- INITIALIZE APPLICATION ON LOAD ---
document.addEventListener("DOMContentLoaded", () => {
    initClock();
    setupTicketSubmission();
    
    // Add event listener for Enter key inside student ID login
    const usernameInput = document.getElementById("username");
    if (usernameInput) {
        usernameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                handleLogin();
            }
        });
    }
});
