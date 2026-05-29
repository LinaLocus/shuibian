import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, PrivacySettings, DEFAULT_PRIVACY } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('邮箱已注册');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      nickname: dto.nickname,
    });
    await this.userRepo.save(user);

    return this.buildToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return this.buildToken(user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    const { passwordHash, ...profile } = user;
    return { ...profile, privacy: { ...DEFAULT_PRIVACY, ...(user.privacy || {}) } };
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; privacy?: Partial<PrivacySettings> },
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (data.nickname !== undefined) {
      user.nickname = data.nickname.trim();
    }
    if (data.privacy) {
      user.privacy = {
        ...DEFAULT_PRIVACY,
        ...(user.privacy || {}),
        ...data.privacy,
      };
    }
    await this.userRepo.save(user);
    const { passwordHash, ...profile } = user;
    return { ...profile, privacy: { ...DEFAULT_PRIVACY, ...(user.privacy || {}) } };
  }

  private buildToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    };
  }
}
