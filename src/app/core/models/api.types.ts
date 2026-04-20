export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
  statusCode: number;
}

export interface ApiErrorBody {
  success: false;
  data: null;
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

/** Pagination block returned alongside `data` on list endpoints (e.g. GET /users). */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedListResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message: string;
  statusCode: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface PaginatedListPayload<T> {
  items: T[];
  pagination: PaginationMeta;
}
