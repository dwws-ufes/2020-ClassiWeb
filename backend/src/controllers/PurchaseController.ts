import { Controller, Get, HeaderParams, Inject, PathParams, Post } from '@tsed/common';
import { NotFound } from '@tsed/exceptions';
import { Authorize } from '@tsed/passport';

import { EntityNotFoundError } from 'typeorm';

import { PurchaseService } from '../application/PurchaseService';
import { UserTypes } from '../domain/User';
import { Roles } from '../middlewares/Roles';
import { JwtProtocol } from '../protocols/JwtProtocol';

@Controller('/purchases')
export class PurchaseController {
  @Inject(PurchaseService)
  private purchaseService: PurchaseService;

  @Get('/')
  @Roles([UserTypes.NORMAL])
  @Authorize('jwt')
  Get(@HeaderParams('auth') auth: string) {
    const userId = JwtProtocol.getUserIdFromToken(auth);
    return this.purchaseService.GetUserPurchases(userId);
  }

  @Get('/sales')
  @Roles([UserTypes.NORMAL])
  @Authorize('jwt')
  GetSales(@HeaderParams('auth') auth: string) {
    const userId = JwtProtocol.getUserIdFromToken(auth);
    return this.purchaseService.GetUserSales(userId);
  }

  @Post('/:id/:feedback')
  @Roles([UserTypes.NORMAL])
  @Authorize('jwt')
  PostFeedback(@HeaderParams('auth') auth: string, @PathParams('id') id: string, @PathParams('feedback') feedback: number) {
    if (feedback < 1 || feedback > 5) throw new NotFound('Valor de avaliação fora da escala');
    try {
      const userId = JwtProtocol.getUserIdFromToken(auth);
      return this.purchaseService.SaveFeedback(id, userId, feedback);
    } catch (error) {
      if (error instanceof EntityNotFoundError) throw new NotFound('Compra não encontrada');
    }
  }

  @Post('/:adId')
  @Roles([UserTypes.NORMAL])
  @Authorize('jwt')
  PostPurchase(@HeaderParams('auth') auth: string, @PathParams('adId') adId: string) {
    try {
      const userId = JwtProtocol.getUserIdFromToken(auth);
      return this.purchaseService.DoPurchase(adId, userId);
    } catch (error) {
      if (error instanceof EntityNotFoundError) throw new NotFound('Anúncio não encontrado');
    }
  }
}
