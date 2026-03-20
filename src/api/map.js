import api from './index';

export const mapApi = {
  // 지도 마커 목록 (viewport bounds)
  getMarkers: ({ southWestLat, southWestLng, northEastLat, northEastLng, zoomLevel }) =>
    api.get('/properties/map/markers', {
      params: { southWestLat, southWestLng, northEastLat, northEastLng, zoomLevel },
    }),

  // 마커 클릭 시 요약 카드
  getSummary: (id) => api.get(`/properties/${id}/summary`),
};
