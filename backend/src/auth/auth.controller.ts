import { Controller, Post, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrivacySettings } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body('email') email: string) {
    return this.authService.sendVerificationCode(email);
  }

  @Post('register')
  register(@Body() body: RegisterDto & { code: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateProfile(
    @Req() req: any,
    @Body() body: { nickname?: string; privacy?: Partial<PrivacySettings> },
  ) {
    return this.authService.updateProfile(req.user.id, body);
  }
}
