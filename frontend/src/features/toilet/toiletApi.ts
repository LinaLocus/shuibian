import api from '../../api/client';

export interface ToiletItem {
  id: string;
  name: string;
  type: string;
  address: string;
  longitude: number;
  latitude: number;
  distance: number;
  phone: string;
}

export async function fetchNearbyToilets(lng: number, lat: number, radius = 3000): Promise<ToiletItem[]> {
  const { data } = await api.get('/toilets/nearby', {
    params: { lng, lat, radius },
  });
  return data.toilets;
}

export interface UserLocation {
  longitude: number;
  latitude: number;
  accuracy: number;
}

export function getCurrentLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('当前设备不支持定位'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: '请允许使用位置信息',
          2: '位置信息不可用',
          3: '定位超时，请重试',
        };
        reject(new Error(messages[err.code] || '定位失败'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export function openInMapApp(toilet: ToiletItem) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  const amapWeb = `https://uri.amap.com/marker?position=${toilet.longitude},${toilet.latitude}&name=${encodeURIComponent(toilet.name)}&src=shuibian&callnative=1`;

  if (isIOS) {
    const amapScheme = `iosamap://viewMap?sourceApplication=shuibian&poiname=${encodeURIComponent(toilet.name)}&lat=${toilet.latitude}&lon=${toilet.longitude}&dev=0`;
    window.location.href = amapScheme;
    setTimeout(() => {
      window.open(amapWeb, '_blank');
    }, 800);
  } else {
    window.open(amapWeb, '_blank');
  }
}
