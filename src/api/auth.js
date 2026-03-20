import api from './index';

export const authApi = {
  login: (data) => api.post('/auth/login', data),

  signup: (data) => api.post('/auth/registrations', data),

  verify: (data) => api.post('/auth/verifications', data),

  resendCode: (data) => api.post('/auth/verifications:resend', data),

  logout: () => api.post('/auth/logout'),
};
