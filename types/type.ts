export interface ErrorResponse {
  message: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "sales";
}
