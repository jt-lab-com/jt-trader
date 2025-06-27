import { ChildProcess, fork } from 'child_process';

function bootstrap() {
  // ZRtwQQRW MBv3 | 2e-wRrZD = MBv2 | Ax8et1-8 = MBv1 | RAqWyAg3 = tests
  const [id, symbol, start, end] = ['ZRtwQQRW', 'ETH/USDT', '2022-01', '2022-12'];

  let _args = [];
  const withFloatArg = (name, start, end, step) => {
    const result = [];
    let value = start;
    while (value <= end) {
      result.push([{ name, value }]);
      value += step;
    }

    _args =
      _args.length > 0
        ? _args.reduce((acc, args) => [...acc, ...result.map((argsNew) => [...args, ...argsNew])], [])
        : result;
  };

  [
    ['min_profit', 0.5, 0.5, 1],
    //  ['tp_percent', 1, 1, 0.1],
    // ['param3', 12, 12, 1],
  ].forEach(([name, start, end, step]) => {
    withFloatArg(name, start, end, step);
  });

  for (let [index, set] of _args.entries()) {
    const child: ChildProcess = fork(`./dist/console.js`, [
      '--id',
      id,
      '--symbol',
      symbol,
      '--start',
      start,
      '--end',
      end,
      '--optimizerIteration',
      index + 1,
      ...set.reduce((acc, { name, value }) => [...acc, `--${name}`, value], []),
    ]);

    child.on('error', (error: { code: string; message: string }) => {
      console.error('Process child error', { error, pid: child.pid, id: process.pid });
    });
    child.on('spawn', () => {
      console.log(`Process started`, { pid: child.pid, id: process.pid });
    });
    child.on('close', (k) => {
      console.log(`Process stopped with code ${k}`, { pid: child.pid, id: process.pid });
    });
  }
}

bootstrap();
