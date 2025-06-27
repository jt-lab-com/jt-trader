import { Controller, Get, Redirect, Req } from '@nestjs/common';
import { Request } from 'express';
import { SiteApi } from '../../common/api/site-api';

@Controller()
export class AccountController {
  constructor(private readonly siteApi: SiteApi) {}
  //
  // @Get('/auth')
  // @Redirect()
  // auth(@Req() req: Request) {
  //   return { url: this.siteApi.redirectAuth(`${req.protocol}://${req.get('Host')}`) };
  // }
}
