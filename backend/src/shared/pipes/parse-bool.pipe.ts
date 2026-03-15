import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseBoolPipe<String> implements PipeTransform {
  transform(value: string): boolean {
    return value?.toLowerCase() === 'true';
  }
}