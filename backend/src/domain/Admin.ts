import {
  Email, Maximum, Minimum, Property, Required,
} from '@tsed/schema';

import bcrypt from 'bcrypt';
import {
  Column, Entity, PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  @Property()
  id: number;

  @Column()
  @Maximum(40)
  @Required()
  name: string;

  @Column({ unique: true })
  @Required()
  registration: string;

  @Column({ unique: true })
  @Email()
  @Required()
  email: string;

  @Column()
  @Maximum(100)
  @Minimum(8)
  @Required()
  password: string;

  static GetEncryptedPassword(password: string) {
    return bcrypt.hashSync(password, 8);
  }

  isValidPassword(unencryptedPassword: string) {
    return bcrypt.compareSync(unencryptedPassword, this.password);
  }
}
