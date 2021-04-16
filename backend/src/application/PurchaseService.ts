import { Inject, Service } from '@tsed/di';
import { Unauthorized } from '@tsed/exceptions';

import { AdvertisingState } from '../domain/Advertising';
import { Feedback, Purchase } from '../domain/Purchase';
import { AdvertisingDAO } from '../persistence/AdvertisingDAO';
import { PurchaseDAO } from '../persistence/PurchaseDAO';
import { UserDAO } from '../persistence/UserDAO';
import { EmailService } from '../services/email/EmailService';
import { AdvertisingService } from './AdvertisingService';
import { UserService } from './UserService';

export type FeedbackBody = {
  userId: string;
  feedback: Feedback;
};

@Service()
export class PurchaseService {
  @Inject(PurchaseDAO)
  private readonly dao: PurchaseDAO;

  @Inject(UserDAO)
  private readonly userDao: UserDAO;

  @Inject(AdvertisingDAO)
  private readonly adDao: AdvertisingDAO;

  @Inject(UserService)
  private readonly userService: UserService;

  @Inject(AdvertisingService)
  private readonly adService: AdvertisingService;

  @Inject(EmailService)
  private readonly emailService: EmailService;

  async GetUserPurchases(userId: string) {
    const [user] = await this.userDao.ReadWith({
      relations: ['purchases'],
      where: { id: userId },
    });

    return user.purchases.map((purchase) => ({ ...purchase }));
  }

  async DoPurchase(adId: string, userId: string) {
    const client = await this.userDao.Read(userId);
    const ad = await this.adDao.Read(adId);

    if (ad.state === AdvertisingState.HIDDEN) {
      throw new Unauthorized(`Anúncio "${ad.title}" não está disponível para vendas`);
    }

    if (ad.quantity === 0) {
      throw new Unauthorized(`Anúncio "${ad.title}" não possui itens disponíveis para venda`);
    }

    const purchase = await this.dao.Create({ client, ad });
    await this.adService.UpdateAd(purchase.ad.id, {
      quantity: purchase.ad.quantity - 1,
      state: purchase.ad.quantity === 1 ? AdvertisingState.HIDDEN : AdvertisingState.VISIBLE,
    });

    // Envia e-mail
    this.emailService.send(ad.owner.email, 'Compraram seu produto', `Realizaram a compra do seu produto ${ad.title}`);

    return {
      ...purchase,
      client: this.userService.GetUserDTO(purchase.client),
      ad: this.adService.GetAdvertisingDTO(purchase.ad),
    };
  }

  async SaveFeedback(id: string, { userId, feedback }: FeedbackBody) {
    const { client, ad } = await this.dao.Read(id);
    const result = await this.adDao.Read(ad.id);

    if (![client.id, result.owner.id].includes(userId)) {
      throw new Unauthorized('Este usuário não está relacionado nesta compra.');
    }

    if (client.id === userId) {
      return this.UpdatePurchase(id, {
        client_feedback: feedback,
      });
    }

    return this.UpdatePurchase(id, {
      owner_feedback: feedback,
    });
  }

  async UpdatePurchase(id: string, json: Partial<Purchase>) {
    await this.dao.Update(id, json);
    const purchase = await this.dao.Read(id);

    return { ...purchase };
  }
}