/**
 * MessSync Frontend Application Controller
 */

// Application State
const State = {
  currentRole: 'Student', // Active tab on login screen
  user: null,             // Currently logged in user profile
  students: [],           // Warden student list cache
  wardens: [],            // Admin warden list cache
  complaints: [],         // Admin complaints cache
  reviews: [],            // Admin reviews cache
  activeAdminTab: 'analytics',

  // Review Form Active State
  reviewForm: {
    day: 'Monday',
    mealType: 'Breakfast',
    ratings: {
      taste: 4,
      quality: 4,
      cleanliness: 4,
      utensilHygiene: 4,
      seatingCleanliness: 4,
      overall: 4
    },
    issues: new Set(),
    counterIssues: new Set()
  }
};

// UI Helper: Toasts
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✔' : type === 'error' ? '✖' : 'ℹ';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Global modal close on backdrop or ESC
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
  }
});

// View Navigation & Switcher
function switchView(viewName) {
  const views = ['auth-view', 'student-view', 'warden-view', 'admin-view'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) {
      if (v === `${viewName}-view`) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  const headerUserInfo = document.getElementById('header-user-info');
  if (viewName === 'auth') {
    if (headerUserInfo) headerUserInfo.classList.add('hidden');
  } else {
    if (headerUserInfo) headerUserInfo.classList.remove('hidden');
    updateHeader();
  }
}

function updateHeader() {
  const user = API.getUser();
  const roleBadge = document.getElementById('header-role-badge');
  const userIdentifier = document.getElementById('header-user-name');

  if (user && roleBadge && userIdentifier) {
    roleBadge.textContent = user.role;
    roleBadge.className = `role-pill role-${user.role.toLowerCase()}`;
    userIdentifier.textContent = user.name || user.email || `Roll: ${user.roll_no}`;
  }
}

// ==========================================================================
// AUTHENTICATION CONTROLLER
// ==========================================================================

function initAuth() {
  const roleTabBtns = document.querySelectorAll('.role-tab-btn');
  const studentInputs = document.getElementById('auth-student-inputs');
  const staffInputs = document.getElementById('auth-staff-inputs');
  const authForm = document.getElementById('login-form');

  // Switch role login tab
  roleTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roleTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.currentRole = btn.dataset.role;

      if (State.currentRole === 'Student') {
        studentInputs.classList.remove('hidden');
        staffInputs.classList.add('hidden');
        document.getElementById('login-roll').required = true;
        document.getElementById('login-email').required = false;
      } else {
        studentInputs.classList.add('hidden');
        staffInputs.classList.remove('hidden');
        document.getElementById('login-roll').required = false;
        document.getElementById('login-email').required = true;
      }
    });
  });

  // Login form submit
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('login-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      try {
        if (State.currentRole === 'Student') {
          const roll_no = document.getElementById('login-roll').value;
          await API.loginStudent(roll_no, password);
          API.setUser({ role: 'Student', roll_no: Number(roll_no) });
          showToast('Login successful! Welcome Student.', 'success');
          await loadStudentPortal();
        } else if (State.currentRole === 'Warden') {
          const email = document.getElementById('login-email').value;
          await API.loginWarden(email, password);
          API.setUser({ role: 'Warden', email });
          showToast('Login successful! Welcome Warden.', 'success');
          await loadWardenPortal();
        } else if (State.currentRole === 'Admin') {
          const email = document.getElementById('login-email').value;
          await API.loginAdmin(email, password);
          API.setUser({ role: 'Admin', email });
          showToast('Login successful! Welcome Administrator.', 'success');
          await loadAdminPortal();
        }
      } catch (err) {
        showToast(err.message || 'Authentication failed.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  // Quick Demo Buttons
  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const role = chip.dataset.role;
      const targetBtn = document.querySelector(`.role-tab-btn[data-role="${role}"]`);
      if (targetBtn) targetBtn.click();

      if (role === 'Student') {
        document.getElementById('login-roll').value = chip.dataset.roll || '101';
        document.getElementById('login-password').value = chip.dataset.password || 'student123';
      } else {
        document.getElementById('login-email').value = chip.dataset.email || '';
        document.getElementById('login-password').value = chip.dataset.password || '';
      }
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      API.clearSession();
      State.user = null;
      showToast('Logged out successfully.', 'info');
      switchView('auth');
    });
  }
}

// ==========================================================================
// STUDENT PORTAL CONTROLLER
// ==========================================================================

async function loadStudentPortal() {
  switchView('student');
  try {
    const profileRes = await API.getStudentProfile();
    if (profileRes && profileRes.dataFromDb) {
      const student = profileRes.dataFromDb;
      State.user = student;
      API.setUser(student);
      updateHeader();

      // Populate student banner
      document.getElementById('student-name-display').textContent = student.name;
      document.getElementById('student-roll-display').textContent = student.roll_no;
      document.getElementById('student-hostel-display').textContent = `Hostel ${student.hostel_no}`;
      document.getElementById('student-country-display').textContent = student.country;
      document.getElementById('student-avatar-initial').textContent = student.name ? student.name.charAt(0).toUpperCase() : 'S';
    }
  } catch (err) {
    console.error('Failed to load student profile:', err);
    showToast('Failed to fetch profile info.', 'error');
  }

  // Default day to today's day of week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const daySelect = document.getElementById('review-day');
  if (daySelect && [...daySelect.options].some(o => o.value === today)) {
    daySelect.value = today;
    State.reviewForm.day = today;
  }
}

function initStudentFeatures() {
  // Review Day and Meal listeners
  const daySelect = document.getElementById('review-day');
  const mealSelect = document.getElementById('review-meal');

  if (daySelect) {
    daySelect.addEventListener('change', (e) => State.reviewForm.day = e.target.value);
  }
  if (mealSelect) {
    mealSelect.addEventListener('change', (e) => State.reviewForm.mealType = e.target.value);
  }

  // Star Rating Pickers
  document.querySelectorAll('.star-picker').forEach(picker => {
    const dimension = picker.dataset.dimension;
    const stars = picker.querySelectorAll('.star-btn');
    const valDisplay = picker.closest('.rating-item').querySelector('.rating-item-val');

    stars.forEach(star => {
      star.addEventListener('click', () => {
        const ratingVal = parseInt(star.dataset.value, 10);
        State.reviewForm.ratings[dimension] = ratingVal;
        valDisplay.textContent = `${ratingVal} / 5`;

        stars.forEach(s => {
          const val = parseInt(s.dataset.value, 10);
          if (val <= ratingVal) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });

        // Recalculate suggested overall if dimension isn't overall
        if (dimension !== 'overall') {
          const dims = ['taste', 'quality', 'cleanliness', 'utensilHygiene', 'seatingCleanliness'];
          const sum = dims.reduce((acc, d) => acc + State.reviewForm.ratings[d], 0);
          const autoOverall = Math.round(sum / dims.length);
          const overallPicker = document.querySelector('.star-picker[data-dimension="overall"]');
          if (overallPicker) {
            const overallStars = overallPicker.querySelectorAll('.star-btn');
            const overallValDisplay = overallPicker.closest('.rating-item').querySelector('.rating-item-val');
            State.reviewForm.ratings.overall = autoOverall;
            overallValDisplay.textContent = `${autoOverall} / 5`;
            overallStars.forEach(os => {
              os.classList.toggle('active', parseInt(os.dataset.value, 10) <= autoOverall);
            });
          }
        }
      });
    });
  });

  // Issue Chip selectors
  document.querySelectorAll('.issue-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const issue = chip.dataset.issue;
      if (State.reviewForm.issues.has(issue)) {
        State.reviewForm.issues.delete(issue);
        chip.classList.remove('selected');
      } else {
        State.reviewForm.issues.add(issue);
        chip.classList.add('selected');
      }
    });
  });

  // Counter Issue Chip selectors
  document.querySelectorAll('.counter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const issue = chip.dataset.issue;
      if (State.reviewForm.counterIssues.has(issue)) {
        State.reviewForm.counterIssues.delete(issue);
        chip.classList.remove('selected');
      } else {
        State.reviewForm.counterIssues.add(issue);
        chip.classList.add('selected');
      }
    });
  });

  // Food Review Form Submit
  const reviewForm = document.getElementById('food-review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-review-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      const payload = {
        day: State.reviewForm.day,
        mealType: State.reviewForm.mealType,
        ratings: State.reviewForm.ratings,
        issues: Array.from(State.reviewForm.issues),
        counterIssues: Array.from(State.reviewForm.counterIssues)
      };

      try {
        await API.submitFoodReview(payload);
        showToast('Thank you! Food review submitted successfully.', 'success');

        // Reset issue chips
        State.reviewForm.issues.clear();
        State.reviewForm.counterIssues.clear();
        document.querySelectorAll('.issue-chip.selected, .counter-chip.selected').forEach(c => c.classList.remove('selected'));
      } catch (err) {
        showToast(err.message || 'Failed to submit review.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback Review';
      }
    });
  }

  // Complaint Form Submit
  const complaintForm = document.getElementById('complaint-form');
  if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-complaint-btn');
      const meal = document.getElementById('complaint-meal').value;
      const complaintType = document.getElementById('complaint-type').value;
      const description = document.getElementById('complaint-description').value.trim();

      if (!description) {
        showToast('Please provide complaint details.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Filing Complaint...';

      try {
        await API.submitComplaint({ meal, complaintType, description });
        showToast('Complaint lodged successfully. Warden/Admin notified.', 'success');
        document.getElementById('complaint-description').value = '';
      } catch (err) {
        showToast(err.message || 'Failed to file complaint.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Official Complaint';
      }
    });
  }
}

// ==========================================================================
// WARDEN PORTAL CONTROLLER
// ==========================================================================

async function loadWardenPortal() {
  switchView('warden');
  await fetchAndRenderStudents();
}

async function fetchAndRenderStudents() {
  const tbody = document.getElementById('warden-students-tbody');
  const countDisplay = document.getElementById('warden-student-count');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">Loading student records...</td></tr>`;

  try {
    const res = await API.getStudents();
    State.students = (res && res.dataFromDb) || [];

    if (countDisplay) {
      countDisplay.textContent = State.students.length;
    }

    renderStudentsTable(State.students);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--danger); padding: 2rem;">Error: ${err.message}</td></tr>`;
  }
}

function renderStudentsTable(studentsList) {
  const tbody = document.getElementById('warden-students-tbody');
  if (!tbody) return;

  if (studentsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No student records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = studentsList.map(s => {
    const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A';
    return `
      <tr>
        <td><strong>#${s.roll_no}</strong></td>
        <td>${escapeHtml(s.name)}</td>
        <td><span class="badge badge-meal">Hostel ${s.hostel_no}</span></td>
        <td>${escapeHtml(s.country)}</td>
        <td>${dateStr}</td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm edit-student-btn" data-roll="${s.roll_no}">
              ✏ Edit
            </button>
            <button class="btn btn-danger btn-sm delete-student-btn" data-roll="${s.roll_no}" data-name="${escapeHtml(s.name)}">
              🗑 Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach action button listeners
  tbody.querySelectorAll('.edit-student-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const roll = btn.dataset.roll;
      const student = State.students.find(s => s.roll_no == roll);
      if (student) openEditStudentModal(student);
    });
  });

  tbody.querySelectorAll('.delete-student-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const roll = btn.dataset.roll;
      const name = btn.dataset.name;
      openDeleteConfirmModal(roll, name);
    });
  });
}

function openEditStudentModal(student) {
  document.getElementById('edit-student-roll').value = student.roll_no;
  document.getElementById('edit-student-name').value = student.name;
  document.getElementById('edit-student-hostel').value = student.hostel_no;
  document.getElementById('edit-student-country').value = student.country;
  openModal('edit-student-modal');
}

function openDeleteConfirmModal(roll, name) {
  document.getElementById('delete-student-roll-target').value = roll;
  document.getElementById('delete-student-name-display').textContent = `${name} (Roll #${roll})`;
  openModal('delete-student-modal');
}

function initWardenFeatures() {
  // Search input filter
  const searchInput = document.getElementById('warden-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderStudentsTable(State.students);
        return;
      }
      const filtered = State.students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        String(s.roll_no).includes(q) ||
        s.country.toLowerCase().includes(q)
      );
      renderStudentsTable(filtered);
    });
  }

  // Add Student Form
  const createStudentForm = document.getElementById('create-student-form');
  if (createStudentForm) {
    createStudentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('create-student-name').value.trim(),
        roll_no: Number(document.getElementById('create-student-roll').value),
        hostel_no: Number(document.getElementById('create-student-hostel').value),
        country: document.getElementById('create-student-country').value.trim(),
        password: document.getElementById('create-student-password').value,
        role: 'Student'
      };

      try {
        await API.createStudent(payload);
        showToast(`Student ${payload.name} registered successfully!`, 'success');
        closeModal('create-student-modal');
        createStudentForm.reset();
        await fetchAndRenderStudents();
      } catch (err) {
        showToast(err.message || 'Failed to register student.', 'error');
      }
    });
  }

  // Edit Student Form
  const editStudentForm = document.getElementById('edit-student-form');
  if (editStudentForm) {
    editStudentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roll = document.getElementById('edit-student-roll').value;
      const payload = {
        name: document.getElementById('edit-student-name').value.trim(),
        hostel_no: Number(document.getElementById('edit-student-hostel').value),
        country: document.getElementById('edit-student-country').value.trim()
      };

      try {
        await API.updateStudent(roll, payload);
        showToast(`Student #${roll} details updated!`, 'success');
        closeModal('edit-student-modal');
        await fetchAndRenderStudents();
      } catch (err) {
        showToast(err.message || 'Failed to update student.', 'error');
      }
    });
  }

  // Delete Confirm Action
  const confirmDeleteBtn = document.getElementById('confirm-delete-student-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      const roll = document.getElementById('delete-student-roll-target').value;
      try {
        await API.deleteStudent(roll);
        showToast(`Student #${roll} record deleted.`, 'success');
        closeModal('delete-student-modal');
        await fetchAndRenderStudents();
      } catch (err) {
        showToast(err.message || 'Failed to delete student.', 'error');
      }
    });
  }
}

// ==========================================================================
// ADMIN PORTAL CONTROLLER
// ==========================================================================

async function loadAdminPortal() {
  switchView('admin');
  await loadAdminDashboardStats();
  switchAdminSubTab(State.activeAdminTab);
}

async function loadAdminDashboardStats() {
  try {
    const [wardenRes, complaintsRes, reviewsRes, avgRes] = await Promise.allSettled([
      API.getWardens(),
      API.getComplaints(),
      API.getAllReviews(),
      API.getAverageRatingsByDay()
    ]);

    // Set stats
    const totalWardens = wardenRes.status === 'fulfilled' && wardenRes.value.wardens ? wardenRes.value.wardens.length : 0;
    const complaintsList = complaintsRes.status === 'fulfilled' && complaintsRes.value.dataFromdb ? complaintsRes.value.dataFromdb : [];
    const totalReviews = reviewsRes.status === 'fulfilled' && reviewsRes.value.dataFromdb ? reviewsRes.value.dataFromdb.length : 0;

    let avgOverallScore = '4.2';
    if (avgRes.status === 'fulfilled' && Array.isArray(avgRes.value) && avgRes.value.length > 0) {
      const totalScore = avgRes.value.reduce((sum, item) => sum + (item.avgOverall || 0), 0);
      avgOverallScore = (totalScore / avgRes.value.length).toFixed(1);
    }

    document.getElementById('admin-stat-wardens').textContent = totalWardens;
    document.getElementById('admin-stat-reviews').textContent = totalReviews;
    document.getElementById('admin-stat-complaints').textContent = complaintsList.length;
    document.getElementById('admin-stat-score').textContent = `${avgOverallScore} ★`;
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

function switchAdminSubTab(tabName) {
  State.activeAdminTab = tabName;
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  const tabContainers = ['analytics', 'wardens', 'complaints', 'reviews'];
  tabContainers.forEach(t => {
    const el = document.getElementById(`admin-subtab-${t}`);
    if (el) {
      el.classList.toggle('hidden', t !== tabName);
    }
  });

  if (tabName === 'analytics') loadAdminAnalytics();
  else if (tabName === 'wardens') loadAdminWardens();
  else if (tabName === 'complaints') loadAdminComplaints();
  else if (tabName === 'reviews') loadAdminReviews();
}

async function loadAdminAnalytics() {
  const container = document.getElementById('analytics-days-grid');
  const dateMealContainer = document.getElementById('analytics-date-meal-list');
  container.innerHTML = '<div style="padding: 2rem; color: var(--text-muted);">Calculating aggregate quality metrics...</div>';

  try {
    const [dayAvg, dateMealAvg] = await Promise.all([
      API.getAverageRatingsByDay(),
      API.getAverageRatingsByDateMeal()
    ]);

    // Render Day-wise Metrics
    if (!dayAvg || dayAvg.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No aggregated review data available yet.</div></div>';
    } else {
      container.innerHTML = dayAvg.map(item => {
        const dayName = item._id || 'Day';
        const overall = (item.avgOverall || 0).toFixed(1);
        const taste = (item.avgTaste || 0).toFixed(1);
        const quality = (item.avgQuality || 0).toFixed(1);
        const cleanliness = (item.avgCleanliness || 0).toFixed(1);
        const utensils = (item.avgUtensilHygiene || 0).toFixed(1);
        const seating = (item.avgSeatingCleanliness || 0).toFixed(1);

        return `
          <div class="matrix-card">
            <div class="matrix-header">
              <div>
                <span class="badge badge-day">${dayName}</span>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Day Average</div>
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">${overall} <span style="font-size: 1rem; color: hsl(40, 95%, 50%);">★</span></div>
            </div>

            <div class="matrix-metric-row">
              <span class="matrix-metric-label">Taste</span>
              <span class="matrix-metric-score">${taste} / 5</span>
            </div>
            <div class="rating-progress-bar"><div class="rating-progress-fill" style="width: ${(taste/5)*100}%;"></div></div>

            <div class="matrix-metric-row" style="margin-top: 0.65rem;">
              <span class="matrix-metric-label">Quality</span>
              <span class="matrix-metric-score">${quality} / 5</span>
            </div>
            <div class="rating-progress-bar"><div class="rating-progress-fill" style="width: ${(quality/5)*100}%;"></div></div>

            <div class="matrix-metric-row" style="margin-top: 0.65rem;">
              <span class="matrix-metric-label">Cleanliness</span>
              <span class="matrix-metric-score">${cleanliness} / 5</span>
            </div>
            <div class="rating-progress-bar"><div class="rating-progress-fill" style="width: ${(cleanliness/5)*100}%;"></div></div>

            <div class="matrix-metric-row" style="margin-top: 0.65rem;">
              <span class="matrix-metric-label">Utensil & Seating Hygiene</span>
              <span class="matrix-metric-score">${((parseFloat(utensils) + parseFloat(seating)) / 2).toFixed(1)} / 5</span>
            </div>
            <div class="rating-progress-bar"><div class="rating-progress-fill" style="width: ${(((parseFloat(utensils) + parseFloat(seating)) / 10)*100)}%;"></div></div>
          </div>
        `;
      }).join('');
    }

    // Render Date & Meal aggregates
    if (dateMealContainer) {
      if (!dateMealAvg || dateMealAvg.length === 0) {
        dateMealContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.875rem;">No date-specific meal trends recorded.</div>';
      } else {
        dateMealContainer.innerHTML = dateMealAvg.map(entry => {
          const date = entry._id && entry._id.date ? entry._id.date : 'Recent';
          const meal = entry._id && entry._id.mealType ? entry._id.mealType : 'Meal';
          const score = (entry.avgOverall || 0).toFixed(1);

          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem; background: var(--bg-surface);">
              <div>
                <span class="badge badge-meal">${meal}</span>
                <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem;">${date}</span>
              </div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                ${score} <span style="color: hsl(40, 95%, 50%);">★</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Failed to load analytics: ${err.message}</div>`;
  }
}

async function loadAdminWardens() {
  const tbody = document.getElementById('admin-wardens-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading registered wardens...</td></tr>';

  try {
    const res = await API.getWardens();
    State.wardens = (res && res.wardens) || [];

    if (State.wardens.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">No wardens registered yet.</td></tr>';
      return;
    }

    tbody.innerHTML = State.wardens.map(w => `
      <tr>
        <td><strong>${escapeHtml(w.name)}</strong></td>
        <td>${escapeHtml(w.email)}</td>
        <td><span class="badge badge-meal">Hostel ${w.hostel_no}</span></td>
        <td><span class="role-pill role-warden">${w.role}</span></td>
        <td>${w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'N/A'}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--danger); padding: 2rem;">Error: ${err.message}</td></tr>`;
  }
}

async function loadAdminComplaints() {
  const container = document.getElementById('admin-complaints-list');
  container.innerHTML = '<div style="padding: 2rem; color: var(--text-muted);">Loading complaints feed...</div>';

  try {
    const res = await API.getComplaints();
    const list = (res && res.dataFromdb) || [];
    State.complaints = list;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎉</div>
          <div class="empty-state-text">No student complaints logged! All clear.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(c => {
      const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Recent';
      return `
        <div class="card" style="margin-bottom: 1rem; border-left: 4px solid var(--danger);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <span class="badge badge-danger" style="margin-right: 0.5rem;">${escapeHtml(c.complaintType)}</span>
              <span class="badge badge-meal">${escapeHtml(c.meal)}</span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</span>
          </div>
          <div style="font-size: 0.925rem; color: var(--text-primary); line-height: 1.6; margin-top: 0.4rem;">
            ${escapeHtml(c.description)}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Error: ${err.message}</div>`;
  }
}

async function loadAdminReviews() {
  const container = document.getElementById('admin-reviews-list');
  container.innerHTML = '<div style="padding: 2rem; color: var(--text-muted);">Loading reviews...</div>';

  const dayFilter = document.getElementById('admin-review-filter-day')?.value || 'ALL';
  const mealFilter = document.getElementById('admin-review-filter-meal')?.value || 'ALL';

  try {
    let res;
    if (dayFilter !== 'ALL') {
      res = await API.getReviewsByDay(dayFilter);
    } else if (mealFilter !== 'ALL') {
      res = await API.getReviewsByMeal(mealFilter);
    } else {
      res = await API.getAllReviews();
    }

    const reviews = (res && res.dataFromdb) || [];
    State.reviews = reviews;

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🍽</div>
          <div class="empty-state-text">No reviews found matching the selected filter.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(r => {
      const overall = r.ratings?.overall || 4;
      const issues = (r.issues || []).map(i => `<span class="badge badge-danger" style="font-size: 0.75rem;">${escapeHtml(i)}</span>`).join(' ');
      const counterIssues = (r.counterIssues || []).map(ci => `<span class="badge badge-warning" style="font-size: 0.75rem;">${escapeHtml(ci)}</span>`).join(' ');

      return `
        <div class="card" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <span class="badge badge-day" style="margin-right: 0.4rem;">${r.day}</span>
              <span class="badge badge-meal">${r.mealType}</span>
            </div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary);">
              ${overall} <span style="color: hsl(40, 95%, 50%);">★</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem; font-size: 0.8rem; background: var(--bg-subtle); padding: 0.65rem; border-radius: var(--radius-sm); margin-bottom: 0.65rem;">
            <div>Taste: <strong>${r.ratings?.taste || '-'}/5</strong></div>
            <div>Quality: <strong>${r.ratings?.quality || '-'}/5</strong></div>
            <div>Cleanliness: <strong>${r.ratings?.cleanliness || '-'}/5</strong></div>
            <div>Utensils: <strong>${r.ratings?.utensilHygiene || '-'}/5</strong></div>
            <div>Seating: <strong>${r.ratings?.seatingCleanliness || '-'}/5</strong></div>
          </div>

          ${issues || counterIssues ? `
            <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center;">
              <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">Issues Flagged:</span>
              ${issues}
              ${counterIssues}
            </div>
          ` : '<div style="font-size: 0.8rem; color: var(--success); font-weight: 500;">✔ No issues reported</div>'}
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); padding: 1.5rem;">Error: ${err.message}</div>`;
  }
}

function initAdminFeatures() {
  // Admin sub-tab buttons
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAdminSubTab(btn.dataset.tab));
  });

  // Review Filters
  const dayFilter = document.getElementById('admin-review-filter-day');
  const mealFilter = document.getElementById('admin-review-filter-meal');
  if (dayFilter) dayFilter.addEventListener('change', loadAdminReviews);
  if (mealFilter) mealFilter.addEventListener('change', loadAdminReviews);

  // Register Warden Form
  const createWardenForm = document.getElementById('create-warden-form');
  if (createWardenForm) {
    createWardenForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('create-warden-name').value.trim(),
        email: document.getElementById('create-warden-email').value.trim(),
        hostel_no: Number(document.getElementById('create-warden-hostel').value),
        password: document.getElementById('create-warden-password').value,
        role: 'Warden'
      };

      try {
        await API.createWarden(payload);
        showToast(`Warden ${payload.name} created for Hostel ${payload.hostel_no}!`, 'success');
        closeModal('create-warden-modal');
        createWardenForm.reset();
        await loadAdminWardens();
        await loadAdminDashboardStats();
      } catch (err) {
        showToast(err.message || 'Failed to create warden.', 'error');
      }
    });
  }

  // Search Warden by Hostel No Tool
  const wardenSearchBtn = document.getElementById('search-warden-hostel-btn');
  if (wardenSearchBtn) {
    wardenSearchBtn.addEventListener('click', async () => {
      const hostelInput = document.getElementById('search-warden-hostel-input');
      const hostelNo = hostelInput.value.trim();
      if (!hostelNo) {
        await loadAdminWardens();
        return;
      }

      try {
        const res = await API.getWardenByHostel(hostelNo);
        const w = res.dataFromdb;
        const tbody = document.getElementById('admin-wardens-tbody');
        if (w) {
          tbody.innerHTML = `
            <tr>
              <td><strong>${escapeHtml(w.name)}</strong></td>
              <td>${escapeHtml(w.email)}</td>
              <td><span class="badge badge-meal">Hostel ${w.hostel_no}</span></td>
              <td><span class="role-pill role-warden">${w.role}</span></td>
              <td>${w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'N/A'}</td>
            </tr>
          `;
          showToast(`Found Warden for Hostel ${hostelNo}`, 'success');
        } else {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">No warden found for Hostel ${hostelNo}</td></tr>`;
        }
      } catch (err) {
        showToast(err.message || `No warden found for Hostel ${hostelNo}`, 'error');
      }
    });
  }
}

// Utility: HTML Escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// APPLICATION INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  initStudentFeatures();
  initWardenFeatures();
  initAdminFeatures();

  // Check existing session
  const token = API.getToken();
  const user = API.getUser();

  if (token && user) {
    if (user.role === 'Student') {
      await loadStudentPortal();
    } else if (user.role === 'Warden') {
      await loadWardenPortal();
    } else if (user.role === 'Admin') {
      await loadAdminPortal();
    } else {
      switchView('auth');
    }
  } else {
    switchView('auth');
  }
});
