const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000/api';
const AUTH_STORAGE_KEY = 'turtour.admin.session';

function readJson(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}

function getStoredSession() {
  return readJson(localStorage.getItem(AUTH_STORAGE_KEY), null);
}

function saveSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function extractErrorDetails(payload) {
  if (Array.isArray(payload?.errors)) {
    return payload.errors.flatMap((entry) => {
      const fieldLabel = entry?.field ? `${entry.field}: ` : '';
      if (Array.isArray(entry?.messages)) {
        return entry.messages.map((message) => `${fieldLabel}${message}`);
      }

      return [];
    });
  }

  if (payload?.errors && typeof payload.errors === 'object') {
    return Object.entries(payload.errors).flatMap(([field, messages]) => {
      if (!Array.isArray(messages)) {
        return [];
      }

      return messages.map((message) => `${field}: ${message}`);
    });
  }

  return [];
}

function statusFallbackMessage(status) {
  if (status === 401) return 'Bạn cần đăng nhập lại để tiếp tục.';
  if (status === 403) return 'Bạn không có quyền thực hiện hành động này.';
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (status >= 500) return 'Đã xảy ra lỗi phía server. Vui lòng thử lại sau.';
  return `Yêu cầu thất bại (${status}).`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const details = typeof payload === 'string' ? [] : extractErrorDetails(payload);
    const message = (typeof payload === 'string' ? payload : '').trim()
      || details[0]
      || payload?.message
      || payload?.title
      || statusFallbackMessage(response.status);

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    error.details = details;
    throw error;
  }

  return payload;
}

function buildHeaders(customHeaders = {}) {
  const session = getStoredSession();

  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...customHeaders,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  try {
    return await parseResponse(response);
  } catch (error) {
    const isLoginRequest = path === '/auth/login';
    const isOnAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/');

    if (error.status === 401 && !isLoginRequest && !isOnAuthPage) {
      clearSession();
      window.location.href = '/auth/sign-in';
    }

    throw error;
  }
}

async function uploadFile(path, file) {
  const session = getStoredSession();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    body: formData,
  });

  return parseResponse(response);
}

function normalizeTourStatus(status) {
  return typeof status === 'string' ? status.toLowerCase() : 'upcoming';
}

function normalizeTourImage(image) {
  return {
    id: image?.id || '',
    imageUrl: image?.imageUrl || '',
    isThumbnail: Boolean(image?.isthumbnail ?? image?.isThumbnail ?? image?.Isthumbnail),
    displayOrder: Number(image?.displayOrder ?? 0),
    raw: image,
  };
}

function normalizeTour(tour) {
  if (!tour) {
    return null;
  }

  const imageItems = Array.isArray(tour.tourImages)
    ? tour.tourImages.map(normalizeTourImage).filter((image) => image.imageUrl)
    : [];
  const thumbnailImage = imageItems.find((image) => image.isThumbnail) || imageItems[0] || null;

  return {
    id: tour.id,
    code: tour.code || '',
    name: tour.tittle || '',
    title: tour.tittle || '',
    description: tour.decriptions || '',
    location: tour.location || '',
    startDate: tour.startDate,
    endDate: tour.endDate,
    capacity: tour.maxParticipants ?? 0,
    currentParticipants: tour.currentParticipants ?? 0,
    price: Number(tour.fee ?? 0),
    status: normalizeTourStatus(tour.status),
    requirement: tour.requirement || '',
    companyId: tour.companyId || '',
    companyName: tour.company?.name || '',
    company: tour.company || null,
    schedules: tour.tourSchedules || [],
    thumbnail: thumbnailImage?.imageUrl || '',
    images: imageItems.map((image) => image.imageUrl),
    imageItems,
    raw: tour,
  };
}

function mapTourFormToPayload(form) {
  return {
    code: form.code?.trim() || '',
    tittle: form.title?.trim() || '',
    decriptions: form.description?.trim() || '',
    location: form.location?.trim() || '',
    startDate: form.startDate,
    endDate: form.endDate,
    maxParticipants: Number(form.capacity || 0),
    fee: Number(form.price || 0),
    status: form.status || 'Upcoming',
    requirement: form.requirement?.trim() || '',
    thumbnailUrl: form.thumbnail?.trim() || '',
    companyId: form.companyId || null,
    companyName: form.companyName?.trim() || '',
  };
}

function normalizeRegistrationStatus(status) {
  return typeof status === 'string' ? status : 'Pending';
}

function normalizeRegistration(registration) {
  return {
    id: registration.id,
    tourId: registration.tourId,
    studentId: registration.studentId,
    registrationDate: registration.registrationDate,
    status: normalizeRegistrationStatus(registration.status),
    notes: registration.notes || '',
    approvedDate: registration.approvedDate,
    rejectionReason: registration.rejectionReason || '',
    studentName: registration.student?.fullName || registration.student?.name || 'Unknown student',
    studentEmail: registration.student?.email || '',
    tourName: registration.tour?.tittle || '',
    payment: registration.payment || null,
    raw: registration,
  };
}

function normalizePayment(payment) {
  return {
    id: payment.id,
    registrationId: payment.registrationId,
    amount: Number(payment.amount ?? 0),
    paymentMethod: payment.paymentMethod || '',
    paymentStatus: payment.paymentStatus || 'Pending',
    paidAt: payment.paidAt,
    transactionCode: payment.transactionCode || '',
    proofImageUrl: payment.proofImageUrl || '',
    companyName: payment.registration?.tour?.company?.name || '',
    tourName: payment.registration?.tour?.tittle || '',
    raw: payment,
  };
}

export function normalizeNotification(notification) {
  return {
    id: notification.id,
    title: notification.title || '',
    message: notification.content || '',
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt,
    raw: notification,
  };
}

function normalizeCompany(company) {
  return {
    id: company.id,
    name: company.name || '',
    description: company.description || '',
    address: company.address || '',
    website: company.website || '',
    email: company.email || '',
    phone: company.phone || '',
    logoUrl: company.logoUrl || '',
    industry: company.industry || '',
    isActive: Boolean(company.isActive),
    raw: company,
  };
}

function mapCompanyFormToPayload(form) {
  return {
    name: form.name?.trim() || '',
    description: form.description?.trim() || '',
    address: form.address?.trim() || '',
    website: form.website?.trim() || '',
    email: form.email?.trim() || '',
    phone: form.phone?.trim() || '',
    logoUrl: form.logoUrl?.trim() || '',
    industry: form.industry?.trim() || '',
    isActive: Boolean(form.isActive),
  };
}

function normalizeFeedback(feedback) {
  return {
    id: feedback.id,
    tourId: feedback.tourId,
    rating: Number(feedback.rating ?? 0),
    comment: feedback.comment || '',
    createdAt: feedback.createdAt,
    studentName: feedback.student?.fullName || feedback.student?.name || 'Sinh viên',
    raw: feedback,
  };
}

export const apiService = {
  getAuthSession: getStoredSession,
  clearAuthSession: clearSession,

  async login(email, password) {
    const payload = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const session = {
      token: payload.token,
      email: payload.email,
      fullName: payload.fullName,
      roles: payload.roles || [],
    };

    saveSession(session);
    return session;
  },

  async logout() {
    const session = getStoredSession();

    try {
      if (session?.token) {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({}),
        });
      }
    } catch (error) {
      if (error?.status !== 401) {
        throw error;
      }
    } finally {
      clearSession();
    }
  },

  async registerStudent(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async registerCompany(payload) {
    return request('/auth/register-company', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async registerOrganizator(payload) {
    return request('/auth/register-organizator', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getDashboardOverview() {
    return request('/dashboard/overview');
  },

  async getReports() {
    return request('/dashboard/reports');
  },

  async getCompanies() {
    const data = await request('/companies');
    return Array.isArray(data) ? data.map(normalizeCompany) : [];
  },

  async updateCompany(id, form) {
    const data = await request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapCompanyFormToPayload(form)),
    });

    return normalizeCompany(data);
  },

  async deleteCompany(id) {
    return request(`/companies/${id}`, { method: 'DELETE' });
  },

  async getTours(params = {}) {
    const query = new URLSearchParams(params).toString();
    const data = await request(`/tours${query ? `?${query}` : ''}`, { method: 'GET' });
    return Array.isArray(data) ? data.map(normalizeTour) : [];
  },

  async getTourById(id) {
    const data = await request(`/tours/${id}`, { method: 'GET' });
    return normalizeTour(data);
  },

  async createTour(form, schedules) {
    const payload = mapTourFormToPayload(form);
    if (Array.isArray(schedules) && schedules.length > 0) {
      payload.schedules = schedules;
    }

    const data = await request('/tours', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return normalizeTour(data);
  },

  async updateTour(id, form) {
    const data = await request(`/tours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapTourFormToPayload(form)),
    });

    return normalizeTour(data);
  },

  async deleteTour(id) {
    return request(`/tours/${id}`, {
      method: 'DELETE',
    });
  },

  async updateTourStatus(id, status) {
    const data = await request(`/tours/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return normalizeTour(data);
  },

  async getRegistrationsByTour(tourId) {
    const data = await request(`/registrations/tour/${tourId}`, { method: 'GET' });
    return Array.isArray(data) ? data.map(normalizeRegistration) : [];
  },

  async getMyRegistrations() {
    const data = await request('/registrations/my', { method: 'GET' });
    return Array.isArray(data) ? data.map(normalizeRegistration) : [];
  },

  async approveRegistration(id) {
    const data = await request(`/registrations/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    return data?.registration ? normalizeRegistration(data.registration) : normalizeRegistration(data);
  },

  async rejectRegistration(id, reason) {
    const data = await request(`/registrations/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });

    return normalizeRegistration(data);
  },

  async completeRegistration(id) {
    const data = await request(`/registrations/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    return normalizeRegistration(data);
  },

  async getPayments() {
    const data = await request('/payments', { method: 'GET' });
    return Array.isArray(data) ? data.map(normalizePayment) : [];
  },

  async getRevenue() {
    return request('/payments/revenue', { method: 'GET' });
  },

  async getMyNotifications() {
    const data = await request('/notifications/my', { method: 'GET' });
    return Array.isArray(data) ? data.map(normalizeNotification) : [];
  },

  async markNotificationRead(id) {
    const data = await request(`/notifications/${id}/read`, { method: 'PUT' });
    return normalizeNotification(data);
  },

  async confirmPayment(payload) {
    const data = await request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return normalizePayment(data);
  },

  async generateCheckInQr(registrationId) {
    return request(`/check-ins/generate/${registrationId}`, { method: 'POST' });
  },

  async scanCheckIn(qrCode) {
    return request('/check-ins/scan', {
      method: 'POST',
      body: JSON.stringify({ qrCode }),
    });
  },

  async getFeedbacksByTour(tourId) {
    const data = await request(`/feedbacks/tour/${tourId}`, { method: 'GET' });
    return {
      averageRating: Number(data?.averageRating ?? 0),
      total: Number(data?.total ?? 0),
      feedbacks: Array.isArray(data?.feedbacks) ? data.feedbacks.map(normalizeFeedback) : [],
    };
  },

  async uploadImage(file) {
    const data = await uploadFile('/uploads/image', file);
    return data?.url || '';
  },

  request,
};

export default apiService;
