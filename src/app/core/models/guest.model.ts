export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuestSearchParams {
  q?: string;
  page?: number;
  limit?: number;
}

export interface GuestPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  passportNumber?: string;
  branchId?: string;
}
