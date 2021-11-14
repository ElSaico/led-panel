import { range } from "lodash";
import { Ellipse, SVG, Svg } from "@svgdotjs/svg.js";

import { LEDFont, standard } from './fonts';
import { AssertionError } from "assert";

export type LEDColor = { on: string, off: string, background: string };
export type LEDSize = [number, number];

export default class LEDPanel {
    readonly ledOff = '#444444';

    timer?: NodeJS.Timeout;
    font: LEDFont = standard;
    svg: Svg;
    length: number;
    leds: Ellipse[][];
    textMatrix: number[][];
    color: LEDColor;

    constructor(el: string, length: number, color: LEDColor, [ledWidth, ledHeight]: LEDSize) {
        this.svg = SVG(el).clear().size(ledWidth*length*this.charCols, ledHeight*this.charRows).css({ 'background-color': color.background });
        this.length = length;
        this.color = color;
        this.leds = range(this.charRows).map(row =>
            range(this.charCols * length).map(col =>
                this.svg.ellipse(ledWidth, ledHeight).fill(color.off).move(ledWidth*col, ledHeight*row)
            )
        );
    }

    assertBoundaries(idx: number, length: number): asserts idx {
        if (idx < 0 || idx >= length) {
            throw new AssertionError({ message: 'LED index outside boundaries' });
        }
    }

    buildTextMatrix(text: string) {
        const matrix = text.split('').map(char => this.font[char.charCodeAt(0)]!);
        // we need to transpose it
        this.textMatrix = range(this.charCols).map(col => matrix.map(row => row[col]!));
    }

    centerOffset(text: string) {
        return (text.length - this.length) * (this.charCols / 2);
    }

    clearRow(row: number) {
        this.assertBoundaries(row, this.charRows);
        this.leds[row]!.forEach(led => led.fill(this.color.off));
    }

    drawLed(row: number, colPanel: number, colText: number) {
        this.assertBoundaries(row, this.charRows);
        this.assertBoundaries(colPanel, this.charCols*this.length);
        this.assertBoundaries(colText, this.charCols*this.length);
        if ((this.textMatrix[row]![Math.floor(colText/this.charCols)]! >> colText%this.charCols) & 1) {
            this.leds[row]![colPanel]!.fill(this.color.on);
        } else {
            this.leds[row]![colPanel]!.fill(this.color.off);
        }
    }

    drawRow(row: number, offset: number, drawLength: number) {
        for (let col = 0; col < this.length*this.charCols; ++col) {
            let colText = (col + offset) % (drawLength * 8);
            this.drawLed(row, col, colText);
        }
    }

    drawStep(offset: number, drawLength: number) {
        for (let row = 0; row < this.charRows; ++row) {
            this.drawRow(row, offset, drawLength);
        }
    }

    drawLoopable(text: string, interval: number) {
        clearInterval(this.timer!);
        this.buildTextMatrix(text);
        if (text.length > this.length) {
            let offset = 0;
            this.timer = setInterval(() => this.drawStep(offset++, text.length+1), interval);
        } else {
            this.drawStep(this.centerOffset(text), this.length);
        }
    }

    async drawScroll(text: string, interval: number) {
        this.buildTextMatrix(text);
        for (let offset = -this.length*this.charCols; offset <= text.length*this.charCols; ++offset) {
            this.drawStep(offset, text.length+this.length);
            await new Promise(cb => setTimeout(cb, interval));
        }
    }

    async drawAndClearVertical(text: string, interval: number) {
        this.buildTextMatrix(text);
        for (let row = 0; row < this.charRows; ++row) {
            this.drawRow(row, this.centerOffset(text), this.length);
            await new Promise(cb => setTimeout(cb, interval));
        }
        for (let row = 0; row < this.charRows; ++row) {
            await new Promise(cb => setTimeout(cb, interval));
            this.clearRow(row);
        }
    }
}
