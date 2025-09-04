import { Exchange } from 'ccxt';
import { MultiCartOrderService } from '../multi-cart-order.service';

export interface ExtendedExchange extends Exchange {
  getMockOrderService: () => MultiCartOrderService;
}
