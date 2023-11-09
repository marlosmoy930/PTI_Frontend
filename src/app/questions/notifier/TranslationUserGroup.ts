import { TranslationUserVm } from '@app/shared/models/TranslationUserVm';
import { TranslationUserRole } from '@app/shared/models/TranslationUserRole';
import { UserVmExt } from '@app/users/user-vm-ext';
import { Group } from '@app/shared/utils/array-extensions';

export class TranslationUserGroup {
  roleNames: string;
  userExt: UserVmExt;

  constructor(group: Group<number, TranslationUserVm>) {
    const user = group.elements[0].user;
    this.userExt = UserVmExt.create(user);
    this.userExt.isSelected = true;
    this.roleNames = group.elements
      .map(x => TranslationUserRole[x.role])
      .join(', ');
  }
}
