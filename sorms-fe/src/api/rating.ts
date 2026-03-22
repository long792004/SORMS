import client from './client';
import type { ApiResponse, CreateRatingRequest, RatingDto } from '../types';

export const ratingApi = {
  create: (data: CreateRatingRequest) =>
    client.post<ApiResponse<RatingDto>>('/Rating', data),

  getMyRatings: () =>
    client.get<ApiResponse<RatingDto[]>>('/Rating/my'),

  getAllRatings: () =>
    client.get<ApiResponse<RatingDto[]>>('/Rating'),
};
