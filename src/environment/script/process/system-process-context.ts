import { ScriptService } from '../script.service';

export class SystemProcessContext {
  constructor(private readonly scriptService: ScriptService) {}
  //
  // createScript = (name: string, strategy: string, args: object): string => {
  //   return this.scriptService.addRuntime(name, strategy, JSON.stringify(args), 'market');
  // };
  //
  // updateScript = (id: string, name: string, strategy: string, args: object): void => {
  //   return this.scriptService.updateRuntime(id, name, strategy, JSON.stringify(args), 'market');
  // };
  //
  // runScript = (id: string) => {
  //   return this.scriptService.run(id);
  // };
}
