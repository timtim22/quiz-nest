import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  // Used to keep response time similar when the email doesn't exist
  private readonly dummyHash = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException("Email is already registered");

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.users.create(dto.email, passwordHash);
      return { id: user.id, email: user.email };
    } catch (err: any) {
      // Postgres unique violation (race between check and insert)
      if (err?.code === "23505") {
        throw new ConflictException("Email is already registered");
      }
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);

    const isValid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? this.dummyHash,
    );

    if (!user || !isValid) {
      // Same message for unknown email and wrong password
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  }
}