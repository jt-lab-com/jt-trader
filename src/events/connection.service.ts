import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SiteApi } from '../common/api/site-api';
import { AccountService } from '../environment/account/account.service';
import { UserConnections, AuthUserResult, ExchangeTickerSubscribeParams, SocketClient } from './types';
import { UserAuthData } from '../common/api/types';
import { ACCOUNT_DEVELOPER_ACCESS } from '../environment/account/const';
import { WS_AUTH_ERROR_CODE } from '@packages/types';

@Injectable()
export class ConnectionService {
  private readonly _connections: Map<string, UserConnections> = new Map();
  private readonly isStandalone: boolean;
  private readonly accessSecret: string | null;

  constructor(
    @InjectPinoLogger(ConnectionService.name) private readonly logger: PinoLogger,
    private readonly siteApi: SiteApi,
    private readonly accountService: AccountService,
  ) {
    this.isStandalone = process.env.STANDALONE_APP === '1';
    this.accessSecret = process.env.ACCESS_SECRET ?? null;
  }

  async authUser(client: SocketClient, accessToken: string, accessSecret?: string): Promise<AuthUserResult> {
    if (this.accessSecret && accessSecret !== this.accessSecret) {
      return {
        error: true,
        errorCode: WS_AUTH_ERROR_CODE.INVALID_SECRET,
        data: null,
      };
    }

    try {
      const data = await this.siteApi.authUser(accessToken, client.request.headers['host']);
      const auth: UserAuthData = { ...data.auth, id: data.auth.id.toString(), developerAccess: data.developerAccess };
      await this.accountService.updateParamsList(auth.id.toString(), [
        ...data.config,
        {
          key: ACCOUNT_DEVELOPER_ACCESS,
          value: auth.developerAccess ? 'true' : 'false',
        },
      ]);

      const existing = this._connections.get(auth.id);

      if (existing) {
        const existedSocket = existing.socketClients.find(({ id }) => id === client.id);
        if (!existedSocket) existing.socketClients.push(client);
      } else {
        this._connections.set(auth.id, { socketClients: [client], exchangeTickerSubscribes: [] });
      }

      return {
        error: false,
        data: auth,
      };
    } catch (e) {
      // only standalone app
      if (this.isStandalone) {
        const id = '0';
        await this.accountService.updateParamsList(id, [{ key: ACCOUNT_DEVELOPER_ACCESS, value: 'true' }]);
        this._connections.set(id, { socketClients: [client], exchangeTickerSubscribes: [] });
        return { error: false, data: { id, email: 'Incognito', developerAccess: true } };
      }

      this.logger.error({ id: client.id, message: e.message }, 'Auth user error');
    }

    return {
      error: true,
      errorCode: WS_AUTH_ERROR_CODE.INVALID_ACCESS_TOKEN,
      data: null,
    };
  }

  getUserConnections(userId: string) {
    return this._connections.get(userId);
  }

  getAllConnections(): UserConnections[] {
    const result = [];
    this._connections.forEach((connections) => result.push(connections));
    return result;
  }

  addExchangeTickerSubscriber(userId: string, params: ExchangeTickerSubscribeParams) {
    const connection = this._connections.get(userId);
    if (!connection) {
      this.logger.warn({ userId }, 'addExchangeTickerSubscribe: user connection not found');
      return;
    }

    connection.exchangeTickerSubscribes.push(params);
  }

  removeExchangeTickerSubscriber(userId: string, subId: number) {
    const connection = this._connections.get(userId);

    if (!connection) {
      this.logger.warn({ userId }, 'removeExchangeTickerSubscribe: user connection not found');
      return;
    }

    connection.exchangeTickerSubscribes = connection.exchangeTickerSubscribes.filter(
      (sub) => subId !== sub.datafeedSubId,
    );
  }

  removeConnection(socketClientId: string, userId: string) {
    const connections = this._connections.get(userId);

    if (connections.socketClients.length > 1) {
      connections.socketClients = connections.socketClients.filter((client) => client.id !== socketClientId);
      return;
    }

    this._connections.delete(userId);
  }
}
