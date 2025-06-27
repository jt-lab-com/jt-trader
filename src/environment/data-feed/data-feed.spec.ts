import { DataFeed } from './data-feed';
import { Exchange, Ticker } from 'ccxt';
import { PinoLogger } from 'nestjs-pino';

describe('DataFeed', () => {
  const args: ['watchTicker', string] = ['watchTicker', 'ETH/USDT'];
  const [method, symbol] = args;
  const errorMsg = 'Failed!';

  beforeEach(() => {

  });

  describe('test scenario', () => {
    let tickCounter = 0;

    let sdk: Exchange = {
      [method](s: string, params?: {}) {
        return Promise.resolve({} as Ticker);
      },
    } as unknown as Exchange;
    const logger = {
      info: (obj: any, msg: string) => {},
      error: (obj: any, msg: string) => {},
    } as PinoLogger;
    const subscriber = jest.fn((data: Ticker) => {
      expect(data.symbol).toBe(symbol);
    });

    const errLog = jest.spyOn(logger, 'error').mockImplementation((obj: any, msg: string) => {
      expect(msg).toBe(`Error: ${errorMsg}`);
    });
    const infoLog = jest.spyOn(logger, 'info').mockImplementation((obj: any, msg: string) => {
      expect(msg).toBe('DataFeed retry called');
    });

    jest.spyOn(sdk, method).mockImplementation((s: string, params?: {}) => {
      tickCounter++;
      return new Promise((res, rej) => {
        if (tickCounter % 3 === 0) rej(new Error(errorMsg));
        res({
          symbol: s,
          close: tickCounter + Math.random(),
        } as Ticker);
      });
    });

    it('success / fail / retry', () => {
      const dataFeed: DataFeed<Ticker> = new DataFeed(sdk, args, logger, 'awaiter');
      dataFeed.subscribe(subscriber);

      setImmediate(() => {
        expect(errLog).toBeCalledTimes(1);
        expect(subscriber).toBeCalledTimes(2);
        expect(dataFeed.isStopped).toBe(true);
        dataFeed.retry();
        expect(dataFeed.isStopped).toBe(false);

        setImmediate(() => {
          expect(errLog).toBeCalledTimes(2);
          expect(subscriber).toBeCalledTimes(4);
          expect(infoLog).toBeCalledTimes(1);
          expect(dataFeed.isStopped).toBe(true);
        });
      });
    });
  });
});
