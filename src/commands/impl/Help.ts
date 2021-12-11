import { Observable } from 'rxjs';
import { Event } from '../../Event';
import { ArgParser } from '../ArgParser';
import { Command, EventWithResult } from '../command';

export class Help implements Command {
  argument = ArgParser.create('help');

  helpText = 'Print this message.';

  handleMessage(event: Event): Observable<EventWithResult> {
    throw new Error('Method not implemented.');
  }
}
