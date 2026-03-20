import api from './index';

export const propertyApi = {
  // 매물 생성
  create: (data) => api.post('/properties', data),

  // 최근 매물 조회
  getRecent: (limit = 3) =>
    api.get('/properties/recent', { params: { limit } }),

  // 타임라인 (페이지네이션)
  getTimeline: ({ page = 0, size = 20 }) =>
    api.get('/properties/timeline', { params: { page, size } }),

  // 매물 상세
  getDetail: (id) => api.get(`/properties/${id}/detail`),

  // 매물 수정
  update: (id, data) => api.patch(`/properties/${id}/detail`, data),

  // 매물 삭제
  delete: (id) => api.delete(`/properties/${id}`),

  // 통계 (이번 달 / 전체)
  getStats: () => api.get('/properties/stats'),

  // 위치 프리패치
  prefetchLocation: (data) =>
    api.post('/properties/location/prefetch', data),
};
