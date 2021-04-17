import { RowOfSheet } from './RowOfSheet';

export function ParseRowsFromSheet(textWithCommas: string): RowOfSheet[] {

    const toReturn: Array<RowOfSheet> = new Array<RowOfSheet>();
    const lines: string[] = textWithCommas.split("\n");
    lines.forEach((line) => {
        const columns: string[] = line.split("\t");
        const row = new RowOfSheet();
        let i = 0;
        columns.forEach((col) => {
            col.trim();
            switch (i) {
                case 0: {
                    row.name = col;
                    break;
                }
                case 1: {
                    row.commandToMakeVisible = col;
                    break;
                }
                case 2: {
                    row.scriptToRunWhenMadeVisible = col;
                    break;
                }
            }
            i++;
        });
        toReturn.push(row);
    });

    return toReturn;
}