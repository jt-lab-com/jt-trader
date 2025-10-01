import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type ConfigParamType = {
  name: string;
  value: string;
};

type ConfigValueType = 'string' | 'number' | 'boolean' | 'float';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  public async getParamsList(accountId: string): Promise<ConfigParamType[]> {
    return this.prisma.config.findMany({ select: { name: true, value: true }, where: { accountId } });
  }

  public async updateParam(accountId: string, name: string, value: any, type: ConfigValueType): Promise<void> {
    const param = await this.getParam(accountId, name);
    let formattedValue: string;

    if (type === 'boolean' && !value) {
      value = false;
    }

    if (!param) {
      await this.createParam(accountId, name, value, type);
      return;
    }

    switch (param.type) {
      case 'string':
      case 'number':
      case 'boolean':
      default: {
        formattedValue = value.toString();
        break;
      }
    }

    await this.prisma.config.update({ where: { id: param.id }, data: { value: formattedValue } });
  }

  public async updateParamsList(
    accountId: string,
    list: { name: string; value: any; type: ConfigValueType }[],
  ): Promise<void> {
    for (const row of list) {
      const { name, value, type } = row;
      await this.updateParam(accountId, name, value, type);
    }
  }

  public async deleteParam(accountId: string, name: string): Promise<void> {
    const param = await this.getParam(accountId, name);
    await this.prisma.config.delete({ where: { id: param.id } });
  }

  public async getParam(accountId: string, name: string): Promise<{ id: number; type: string } & ConfigParamType> {
    return this.prisma.config.findFirst({ where: { accountId, name } });
  }

  private async createParam(accountId: string, name: string, value: string | number | boolean, type: ConfigValueType) {
    return this.prisma.config.create({
      data: {
        name,
        accountId,
        type,
        value: value.toString(),
      },
    });
  }
}
