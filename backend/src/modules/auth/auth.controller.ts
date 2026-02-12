import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '@common/decorators/public.decorator';
import type {
  RequestWithUser,
  AuthenticatedUser,
} from '@common/interfaces/authenticated-request.interface';

@ApiTags('Auth')
@Controller('auth')
@ApiTooManyRequestsResponse({
  description: 'Too many requests. Please try again later.',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and obtain JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: { id: string; username: string; role: string } }> {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    return this.authService.login(user);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: RequestWithUser): AuthenticatedUser {
    return req.user;
  }
}
