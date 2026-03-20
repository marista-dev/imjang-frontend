import api from './index';

export const imageApi = {
  // 이미지 업로드 (multipart/form-data)
  upload: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 매물에 이미지 추가
  addToProperty: (propertyId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 매물 이미지 삭제
  deleteFromProperty: (propertyId, imageId) =>
    api.delete(`/properties/${propertyId}/images/${imageId}`),
};
