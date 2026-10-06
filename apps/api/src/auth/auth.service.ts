import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";

import { Role } from "../users/role.enum.js";
import { UsersService } from "../users/users.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
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
      // Public registration always creates a STUDENT.
      // Never accept the role from the request body.
      const user = await this.users.create(dto.email, passwordHash, Role.STUDENT);
      return { id: user.id, email: user.email, role: user.role };
    } catch (err: any) {
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
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role, // <-- role is now in the JWT payload
    });

    return { accessToken, role: user.role };
  }
}