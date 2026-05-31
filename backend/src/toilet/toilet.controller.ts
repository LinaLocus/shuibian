import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface AmapPoi {
  id: string;
  name: string;
  type: string;
  address: string;
  location: string;
  distance: string;
  tel: string;
}

interface ToiletResult {
  id: string;
  name: string;
  type: string;
  address: string;
  longitude: number;
  latitude: number;
  distance: number;
  phone: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('toilets')
export class ToiletController {
  private readonly logger = new Logger(ToiletController.name);

  @Get('nearby')
  async nearby(
    @Query('lng') lng: string,
    @Query('lat') lat: string,
    @Query('radius') radius?: string,
  ): Promise<{ toilets: ToiletResult[] }> {
    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    const r = radius ? parseInt(radius, 10) : 3000;

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      throw new BadRequestException('经纬度无效');
    }
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new BadRequestException('经纬度超出范围');
    }

    const apiKey = process.env.AMAP_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('地图服务未配置');
    }

    const url = new URL('https://restapi.amap.com/v3/place/around');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('location', `${longitude},${latitude}`);
    url.searchParams.set('keywords', '公共厕所');
    url.searchParams.set('types', '200300');
    url.searchParams.set('radius', String(r));
    url.searchParams.set('sortrule', 'distance');
    url.searchParams.set('offset', '20');
    url.searchParams.set('page', '1');
    url.searchParams.set('extensions', 'base');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        this.logger.error(`Amap API ${res.status}`);
        throw new InternalServerErrorException('地图服务暂时不可用');
      }
      const data: any = await res.json();
      if (data.status !== '1') {
        this.logger.error(`Amap error: ${data.info} (${data.infocode})`);
        throw new InternalServerErrorException(data.info || '搜索失败');
      }

      const pois: AmapPoi[] = data.pois || [];
      const toilets: ToiletResult[] = pois.map((p) => {
        const [lngStr, latStr] = (p.location || ',').split(',');
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          address: p.address || '',
          longitude: parseFloat(lngStr) || 0,
          latitude: parseFloat(latStr) || 0,
          distance: parseInt(p.distance, 10) || 0,
          phone: typeof p.tel === 'string' ? p.tel : '',
        };
      });

      return { toilets };
    } catch (err: any) {
      if (err instanceof InternalServerErrorException || err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error('Amap fetch failed', err);
      throw new InternalServerErrorException('搜索失败，请稍后重试');
    }
  }
}
