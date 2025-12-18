import { Liquid } from './Liquid';

export class Water extends Liquid {
    id = 3;
    name = "Water";
    color = 0x2266CC; // Deep Blue
    density = 10;
    dispersion = 8;

    // update is inherited!
}
