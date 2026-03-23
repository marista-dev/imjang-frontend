import api from './index';

export const imageApi = {
  // 이미지 업로드 (multipart/form-data)
  upload: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/images/upload', formData, {
      headers: { 'Content-Type': undefined },
    });
  },

  // 매물에 이미지 연결 (tempImageIds: 업로드된 임시 이미지 ID 배열)
  addToProperty: (propertyId, tempImageIds) =>
    api.post(`/properties/${propertyId}/images`, { tempImageIds }),

  // 매물 이미지 삭제
  deleteFromProperty: (propertyId, imageId) =>
    api.delete(`/properties/${propertyId}/images/${imageId}`),
};
