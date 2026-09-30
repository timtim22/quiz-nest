import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(72)
  password: string;
}