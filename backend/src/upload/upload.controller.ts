import { Controller, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('upload')
export class UploadController {
  @Get('signature')
  getSignature() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new BadRequestException('图片上传服务未配置');
    }
    return { cloudName, uploadPreset };
  }
}
