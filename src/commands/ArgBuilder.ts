
export class ArgBuilder {
  private constructor(private args: string[]) { }

  or(arg: string) {
    this.args.push(arg);
    return this;
  }

  build() {
    return this.args.join(' | ');
  }

  static create(arg: string) {
    return new ArgBuilder([arg]);
  }
}
