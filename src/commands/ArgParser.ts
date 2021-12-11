import { ArgBuilder } from "./ArgBuilder";

export class ArgParser {
  private constructor(public command: string, private args: string[]) { }

  is(potentialCmd: string) {
    return potentialCmd.startsWith(this.command);
  }

  get help() {
    return `${this.command} ${this.args.join(' ')}`;
  }

  withArg(arg: string, builder?: (arg: ArgBuilder) => ArgBuilder) {
    let argBuilder = ArgBuilder.create(arg);
    if (builder) {
      argBuilder = builder(argBuilder);
    }
    this.args.push(argBuilder.build());
    return this;
  }

  withOptionalArg(arg: string, builder?: (arg: ArgBuilder) => ArgBuilder) {
    let argBuilder = ArgBuilder.create(arg);
    if (builder) {
      argBuilder = builder(argBuilder);
    }
    this.args.push(`[${argBuilder.build}]`);
    return this;
  }

  static create(command: string) {
    return new ArgParser(`/${command}`, []);
  }
}
