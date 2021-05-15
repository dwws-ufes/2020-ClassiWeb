import { Injectable } from '@tsed/di';

import { EntityRepository, FindManyOptions, Repository } from 'typeorm';

import { Advertising, AdvertisingState } from '../domain/Advertising';
import { IBaseDAO } from './BaseDAO';

@EntityRepository(Advertising)
class AdvertisingRepository extends Repository<Advertising> {}

@Injectable()
export class AdvertisingDAO implements Omit<IBaseDAO<Advertising>, 'ReadAll' | 'ReadWith'> {
  constructor(private readonly repository: AdvertisingRepository) {}

  Create(ad: Partial<Advertising>) {
    return this.repository.save(ad);
  }

  ReadAll(page = 1, pageSize = 0) {
    return this.repository.findAndCount({
      relations: ['category', 'address', 'owner', 'images'],
      where: { state: AdvertisingState.VISIBLE },
      take: pageSize,
      skip: (page - 1) * (pageSize ?? 0),
    });
  }

  Read(id: string) {
    return this.repository.findOneOrFail(id, {
      relations: ['category', 'address', 'owner', 'images'],
    });
  }

  ReadWith(options: FindManyOptions<Advertising>, page = 1, pageSize = 0) {
    return this.repository.findAndCount({
      ...options,
      take: pageSize,
      skip: (page - 1) * (pageSize ?? 0),
    });
  }

  async Update(id: string, ad: Partial<Advertising>) {
    await this.repository.update(id, ad);
  }

  async Delete(id: string) {
    await this.repository.delete(id);
  }
}
