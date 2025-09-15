export function formatTesterSymbol(symbol: string): string {
  symbol = symbol.toUpperCase();
  if (symbol.endsWith(':USDT')) return symbol;
  if (symbol.includes('/USDT')) return `${symbol}:USDT`;
  return `${symbol}/USDT:USDT`;
}
