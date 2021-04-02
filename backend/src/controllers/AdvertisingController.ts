import {
  BodyParams, Controller, Delete, Get, Inject, PathParams, Post, Put,
} from '@tsed/common';

import { AdFilter, AdvertisingService } from '../application/classes/AdvertisingService';
import { Advertising } from '../domain/Advertising';

@Controller('/ads')
export class AdvertisingController {
  @Inject(AdvertisingService)
  private adService: AdvertisingService;

  @Get('/')
  GetAll() {
    return this.adService.ListAllAds();
  }

  @Get('/:id')
  Get(@PathParams('id') id: string) {
    return this.adService.GetAdById(id);
  }

  @Post('/')
  Post(@BodyParams() ad: Partial<Advertising>) {
    return this.adService.CreateAd(ad);
  }

  @Post('/search')
  PostSearch(@BodyParams() filter: Partial<AdFilter>) {
    return this.adService.ListAdsWith(filter);
  }

  @Put('/:id')
  Put(@PathParams('id') id: string, @BodyParams() ad: Partial<Advertising>) {
    return this.adService.UpdateAd(id, ad);
  }

  @Delete('/:id')
  async Delete(@PathParams('id') id: string) {
    await this.adService.RemoveAd(id);
  }
}