/**
 * MessSync API Client & Authentication Service
 */

const API = {
  // Session storage keys
  TOKEN_KEY: 'mess_token',
  USER_KEY: 'mess_user',

  getBaseUrl() {
    // If the frontend is opened from Live Server (e.g. port 5500) or file://,
    // route API calls directly to the Express backend running on port 3000.
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000')) {
        return `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.hostname || 'localhost'}:3000`;
      }
    }
    return '';
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  // Base HTTP Request Wrapper with safe response parsing and baseUrl resolution
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const targetUrl = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint}`;

    try {
      const response = await fetch(targetUrl, config);
      const text = await response.text();
      let data = {};

      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          // Response is plain text
          data = { message: text };
        }
      }

      if (!response.ok) {
        // If unauthorized/token expired on authenticated call, handle gracefully
        if (response.status === 401 && endpoint !== '/student/login' && endpoint !== '/warden/login' && endpoint !== '/admin/login') {
          this.clearSession();
          if (typeof switchView === 'function') switchView('auth');
          if (typeof showToast === 'function') showToast('Session expired. Please sign in again.', 'error');
        }

        const errorMsg = (typeof data === 'string' ? data : (data.error || data.message || `Request failed (${response.status})`));
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${targetUrl}]:`, err);
      throw err;
    }
  },

  // ==========================================
  // AUTH API
  // ==========================================
  async loginStudent(roll_no, password) {
    const data = await this.request('/student/login', {
      method: 'POST',
      body: { roll_no: Number(roll_no), password: String(password).trim() }
    });
    if (data && data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async loginWarden(email, password) {
    const data = await this.request('/warden/login', {
      method: 'POST',
      body: { email: String(email).trim().toLowerCase(), password: String(password).trim() }
    });
    if (data && data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async loginAdmin(email, password) {
    const data = await this.request('/admin/login', {
      method: 'POST',
      body: { email: String(email).trim().toLowerCase(), password: String(password).trim() }
    });
    if (data && data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  // ==========================================
  // STUDENT API
  // ==========================================
  async getStudentProfile() {
    return this.request('/student/myInfo');
  },

  async submitFoodReview(reviewData) {
    return this.request('/student/foodReview', {
      method: 'POST',
      body: reviewData
    });
  },

  async submitComplaint(complaintData) {
    return this.request('/student/complaint', {
      method: 'POST',
      body: complaintData
    });
  },

  // ==========================================
  // WARDEN API
  // ==========================================
  async getStudents() {
    return this.request('/warden/get-student');
  },

  async getStudentByRoll(rollNo) {
    return this.request(`/warden/get-student/${rollNo}`);
  },

  async createStudent(studentData) {
    return this.request('/warden/create-student', {
      method: 'POST',
      body: studentData
    });
  },

  async updateStudent(rollNo, studentData) {
    return this.request(`/warden/update-student/${rollNo}`, {
      method: 'PUT',
      body: studentData
    });
  },

  async deleteStudent(rollNo) {
    return this.request(`/warden/delete-student/${rollNo}`, {
      method: 'DELETE'
    });
  },

  // ==========================================
  // ADMIN API
  // ==========================================
  async getWardens() {
    return this.request('/admin/wardens');
  },

  async getWardenByHostel(hostelNo) {
    return this.request(`/admin/get-warden/${hostelNo}`);
  },

  async createWarden(wardenData) {
    return this.request('/admin/create-warden', {
      method: 'POST',
      body: wardenData
    });
  },

  async getAllReviews() {
    return this.request('/admin/foodReview');
  },

  async getReviewsByDay(day) {
    return this.request(`/admin/foodReview/day/${day}`);
  },

  async getReviewsByMeal(mealType) {
    return this.request(`/admin/foodReview/meal/${mealType}`);
  },

  async getAverageRatingsByDay() {
    return this.request('/admin/foodReview/average/meal');
  },

  async getAverageRatingsByDateMeal() {
    return this.request('/admin/foodReview/average/date-meal');
  },

  async getComplaints() {
    return this.request('/admin/complaints');
  }
};
