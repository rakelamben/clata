import type { DeviceIdentity } from '../../domain/ports/DeviceIdentity';

export const developmentDeviceIdentity: DeviceIdentity = {
  getDeviceId: () => 'development-device',
};
