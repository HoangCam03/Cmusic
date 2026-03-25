export class SuccessResponse<T> {
  public readonly success: boolean = true;
  public readonly message: string;
  public readonly data: T;
  public readonly statusCode: number;

  constructor(message: string, data: T, statusCode: number = 200) {
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }
}
