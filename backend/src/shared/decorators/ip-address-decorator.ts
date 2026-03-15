import { createParamDecorator } from '@nestjs/common';

export const IpAddress = createParamDecorator((data, req) => {
  const { ip, headers } = req;
  return headers['cf-connecting-ip'] || ip;
});