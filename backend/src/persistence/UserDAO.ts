import { Injectable } from '@tsed/di';

import { EntityRepository, FindManyOptions, Repository } from 'typeorm';

import { User } from '../domain/User';

@EntityRepository(User)
class UserRepository extends Repository<User> {}

@Injectable()
export class UserDAO {
  constructor(private readonly repository: UserRepository) {}

  Create(user: Partial<User>) {
    return this.repository.save(user);
  }

  ReadAll(options?: FindManyOptions<User>) {
    return this.repository.find(options);
  }

  Read(id: string) {
    return this.repository.findOneOrFail(id);
  }

  async Delete(id: string) {
    this.repository.delete(id);
  }
}
