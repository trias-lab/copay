import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'weiToUnit',
  pure: false
})
export class WeiToUnitPipe implements PipeTransform {
  constructor(
    private decimalPipe: DecimalPipe) { }
  transform(amount: number, coin: string) {
    return (
      this.decimalPipe.transform(amount / 1e18, '1.2-6') +
      ' ' +
      coin.toUpperCase()
    );
  }
}
