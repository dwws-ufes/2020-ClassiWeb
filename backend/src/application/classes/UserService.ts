import { Inject, Service } from '@tsed/di';
import { BadRequest } from '@tsed/exceptions';

import { FindManyOptions } from 'typeorm';

import { User } from '../../domain/User';
import { PurchaseDAO } from '../../persistence/PurchaseDAO';
import { UserDAO } from '../../persistence/UserDAO';
import { EmailService } from '../../services/email/EmailService';
import { AddressService } from './AddressService';

@Service()
export class UserService {
  @Inject(UserDAO)
  private readonly dao: UserDAO;

  @Inject(PurchaseDAO)
  private readonly purchaseDao: PurchaseDAO;

  @Inject(AddressService)
  private addressService: AddressService;

  @Inject(EmailService)
  private readonly emailService: EmailService;

  async CreateUser(user: Pick<User, 'name' |'cpf' | 'email' | 'password' | 'address'>) {
    const cpf = user.cpf.replace(/\D/g, '');

    if (cpf.length !== 11) {
      throw new BadRequest('CPF inválido');
    }

    const newUser = await this.dao.Create({
      ...user,
      password: User.GetEncryptedPassword(user.password),
      address: user.address.id
        ? user.address
        : await this.addressService.CreateAddress(user.address),
      cpf,
    });

    this.emailService.send(newUser.email, 'Bem vindo ao ClassiWeb', `Parabéns ${newUser.name} você acabou de criar sua conta!`);

    return newUser;
  }

  async GetUserById(userId: string) {
    const {
      id, name, email, address, cpf,
    } = await this.dao.Read(userId);

    return {
      id,
      name,
      email,
      address,
      cpf: User.GetFormmatedCpf(cpf),
      feedback: await this.GetUserFeedback(userId),
    };
  }

  async GetUserFeedback(userId: string) {
    const purchases = await this.purchaseDao.ReadWith({
      relations: ['client', 'ad'],
      where: [
        {
          client: {
            id: userId,
          },
        },
        {
          ad: {
            owner: {
              id: userId,
            },
          },
        },
      ],
    });

    const feedback = purchases.reduce(({ ranking, votes }, purchase) => {
      if (userId === purchase.client.id) {
        return {
          ranking: ranking + purchase.owner_feedback || 0,
          votes: votes + +!!purchase.owner_feedback,
        };
      }

      return {
        ranking: ranking + purchase.client_feedback || 0,
        votes: votes + +!!purchase.client_feedback,
      };
    }, { ranking: 0, votes: 0 });

    return (feedback.ranking / feedback.votes) || 0;
  }

  async GetUserByEmail(email: string) {
    const [user] = await this.dao.ReadWith({ where: { email } });
    return user;
  }

  async GetFromUser(userId: string, options: FindManyOptions<User>) {
    const [user] = await this.dao.ReadWith({
      ...options,
      where: { id: userId, ...(options.where as any || {}) },
    });

    return { ...user };
  }

  ListAllUsers() {
    return this.dao.ReadAll();
  }

  async UpdateUser(id: string, userJson: Partial<User>) {
    if (userJson.address) {
      userJson.address = await this.addressService.CreateAddress(userJson.address);
    }

    await this.dao.Update(id, userJson);
    const user = await this.GetUserById(id);

    return {
      ...user,
      cpf: User.GetFormmatedCpf(user.cpf),
    };
  }

  async DeleteUser(id: string) {
    await this.dao.Delete(id);
  }
}
