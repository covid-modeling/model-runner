export enum StatusCodes {
  Ok = 0,
  InvalidArguments = 1,
  UnknownError = 2,
  DockerError = 5,
}

export function convertModelStatusCode(code: number): number {
  return -code
}
