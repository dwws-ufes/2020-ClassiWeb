import { Inject, Service } from '@tsed/di';
import { Unauthorized } from '@tsed/exceptions';

import { Between, FindConditions, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

import { Address } from '../domain/Address';
import { Advertising, AdvertisingState, ProductState } from '../domain/Advertising';
import { AdvertisingDAO } from '../persistence/AdvertisingDAO';
import { CategoryDAO } from '../persistence/CategoryDAO';
import { UserDAO } from '../persistence/UserDAO';
import { EmailService } from '../services/email/EmailService';
import { AddressService } from './AddressService';
import { UserService } from './UserService';
import { WishListService } from './WishListService';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface AdFilter {
  text: string;
  product_state: ProductState;
  min_price: number;
  max_price: number;
  address: Partial<Address>;
  categories: string[];
}

@Service()
export class AdvertisingService {
  @Inject(AdvertisingDAO)
  private readonly dao: AdvertisingDAO;

  @Inject(UserDAO)
  private readonly userDao: UserDAO;

  @Inject(CategoryDAO)
  private readonly categoryDAO: CategoryDAO;

  @Inject(AddressService)
  private readonly addressService: AddressService;

  @Inject(UserService)
  private readonly userService: UserService;

  @Inject(WishListService)
  private readonly wishListService: WishListService;

  @Inject(EmailService)
  private readonly emailService: EmailService;

  async GetAdvertisingDTO(ad: Advertising) {
    return {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      quantity: ad.quantity,
      state: ad.state,
      product_state: ad.product_state,
      images: ad.images?.map(({ filename }) => filename) || [],
      category: ad.category,
      address: ad.address,
      owner: ad.owner && (await this.userService.GetUserDTO(ad.owner)),
    };
  }

  async ListAllAds(page?: number, pageSize?: number) {
    const [ads, total] = await this.dao.ReadAll(page, pageSize);

    const adsDTO = await Promise.all(ads.map((ad) => this.GetAdvertisingDTO(ad)));

    return [adsDTO, total];
  }

  async ListAdsWith(filter: Partial<AdFilter>, page: number, pageSize: number) {
    const whereQuery = {
      state: AdvertisingState.VISIBLE,
    } as FindConditions<Advertising>;

    if (Number.isInteger(filter.product_state)) {
      whereQuery.product_state = filter.product_state;
    }

    if (filter.min_price) {
      if (filter.max_price) {
        whereQuery.price = Between(filter.min_price, filter.max_price);
      } else {
        whereQuery.price = MoreThanOrEqual(filter.min_price);
      }
    } else if (filter.max_price) {
      whereQuery.price = LessThanOrEqual(filter.max_price);
    }

    const [adsDB] = await this.dao.ReadWith(
      {
        relations: ['category', 'address', 'owner', 'images'],
        where:
          filter.categories?.map((category) => ({
            ...whereQuery,
            category: { name: category },
          })) || whereQuery,
      },
      page,
      pageSize,
    );

    const removeAccents = (str = '') => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const regex = new RegExp(removeAccents(filter.text) || '', 'i');

    const testText = (text: string) => regex.test(removeAccents(text));

    const ads = await Promise.all(
      adsDB
        .filter((ad) => testText(ad.title) || testText(ad.description))
        .filter((ad) => {
          /* Se o filtro para endereço está sendo usado */
          if (filter.address?.state) {
            /* Se o estado do anúncio passa no filtro */
            if (ad.address.state === filter.address.state) {
              if (filter.address?.city) {
                /* Verifica se a cidade passa no filtro */
                return ad.address.city === filter.address.city;
              }

              return true; /* Passa no filtro */
            }

            return false; /* Passa no filtro */
          }

          return true; /* Passa no filtro */
        })
        .map((ad) => this.GetAdvertisingDTO(ad)),
    );

    return [ads, ads.length];
  }

  async CreateAd(ad: Partial<Advertising>) {
    const [address, owner, category] = await Promise.all([
      await this.addressService.CreateAddress(ad.address),
      await this.userDao.Read(ad.ownerId),
      await this.categoryDAO.Read(ad.category),
    ]);

    const { id } = await this.dao.Create({
      ...ad,
      description: ad.description || '',
      quantity: +(ad.quantity ?? 1),
      category,
      address,
      owner,
      price: +(ad.price ?? 0),
    });

    return this.GetAdById(id);
  }

  async GetAdById(adId: string) {
    const ad = await this.dao.Read(adId);

    return this.GetAdvertisingDTO(ad);
  }

  async UpdateAd(id: string, adJson: Partial<Advertising>, userId: string) {
    if (adJson.address) {
      adJson.address = await this.addressService.CreateAddress(adJson.address);
    }

    const current_ad = await this.dao.Read(id);

    if (userId !== current_ad.owner.id) {
      throw new Unauthorized('Você não pode alterar um anúncio que não é seu.');
    }

    /* Atualiza o anúncio */
    await this.dao.Update(id, adJson);

    /* Envia a alteração para os interessados */
    const users = await this.wishListService.GetListFromAd(id);
    users.forEach((user) => {
      this.emailService.send(
        user.email,
        'Alteração no produto da sua lista de desejos',
        `Alteraram um produto que estava na sua lista de desejos: ${ad.title}`,
      );
    });

    return this.GetAdById(id);
  }

  async GetAdsByUserId(userID: string) {
    const [{ ads }] = await this.userDao.ReadWith({
      relations: ['ads'],
      where: { id: userID },
    });

    return Promise.all(ads.map((ad) => this.GetAdById(ad.id)));
  }

  async DeleteAd(id: string, userId: string) {
    const current_ad = await this.dao.Read(id);

    if (userId !== current_ad.owner.id) {
      throw new Unauthorized('Você não pode deletar um anúncio que não é seu.');
    }

    return this.dao.Delete(id);
  }
}
