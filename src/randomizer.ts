import {aleaRNGFactory, NumberGenerator} from 'number-generator';

export class Randomizer {
    private readonly _generator: NumberGenerator | null;

    constructor(randomHex?: string) {
        this._generator = randomHex ? aleaRNGFactory(hexToNumber(randomHex)) : null;
    }

    public randomFloat(): number {
        return this._generator ? this._generator.uFloat32() : Math.random();
    }

    public randomIntBetween(min: number, max: number): number {
        return Math.floor(this.randomFloat() * (max - min + 1)) + min;
    }

    public shuffleArray<T>(array: T[]): T[] {
        let workArray = [...array]; // copy
        // based on https://stackoverflow.com/a/2450976
        let currentIndex = workArray.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(this.randomFloat() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [workArray[currentIndex], workArray[randomIndex]] = [
                workArray[randomIndex], workArray[currentIndex]];
        }

        return workArray;
    }

    public randomMemberofArray<T>(n: number, array: T[]): T[] {
        return this.shuffleArray(array).slice(0, n);
    }
}

function hexToNumber(hex: string): number {
    // hex should be limited to 13 characters; almost maximum safe integer in JS
    return parseInt('0x' + hex);
}
