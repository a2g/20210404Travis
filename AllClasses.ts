
export interface GameRuleEnforcerCallbacksInterface {
    OnItemVisbilityChange(numberOfObjectWhoseVisibilityChanged: number, newValue: boolean, nameForDebugging: string): void;
};

export enum Colors {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",
    Black = "\x1b[30m",
    Red = "\x1b[31m",
    Green = "\x1b[32m",
    Yellow = "\x1b[33m",
    Blue = "\x1b[34m",
    Magenta = "\x1b[35m",
    Cyan = "\x1b[36m",
    White = "\x1b[37m",

    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m",
}

export class RowOfSheet {
    constructor() {
        this.name = "";
        this.commandToMakeVisible = "";
        this.scriptToRunWhenExamine = "";
        this.scriptToRunWhenMadeVisible = "";
    }
    name: string;
    commandToMakeVisible: string;
    scriptToRunWhenExamine: string;
    scriptToRunWhenMadeVisible: string;
};

export function GetDisplayName(name: string) {
    const parts = name.slice(1).split(/(?=[A-Z])/);
    let result = parts[0].toLowerCase();
    for (let i = 1; i < parts.length; i++) {
        result += " " + parts[i].toLowerCase();
    }

    return result;
}

export function GetThreeStringsFromCommand(command: string) {
    const parts: string[] = command.split(" ");
    const len = parts.length;
    if (len < 2)
        return [];
    const action: string = parts[0].trim();
    const obj1: string = parts[1].trim();
    const obj2: string = len > 2 ? parts[2].trim() : "";
    return [action, obj1, obj2];
}

export class SingleFileData {
    constructor(name: string, isVisible: boolean) {
        this.name = name;
        this.isVisible = isVisible;
        this.tickCount = 0;
    }
    name: string;
    tickCount: number;
    isVisible: boolean;
};

export class TruthTable {
    constructor(colNamesAndInitialVisibilities: Array<[string, boolean]>, rowNamesAndInitialVisibilities: Array<[string, boolean]>) {
        this.ColumnsStartHere = 1000;
        const numberOfColumns = colNamesAndInitialVisibilities.length;
        const numberOfRows = rowNamesAndInitialVisibilities.length;
        this.theActualTicks = new Array<Array<boolean>>();
        for (let x = 0; x < numberOfColumns; x++) {
            this.theActualTicks[x] = new Array<boolean>();
            for (let y = 0; y < numberOfRows; y++) {
                this.theActualTicks[x][y] = false;
            }
        }

        this.rowAndColumnDetailsCombined = new Map<number, SingleFileData>();
        this.numberOfCellsInARow = numberOfRows;
        this.numberOfCellsInAColumn = numberOfColumns;
        this.numberOfVisibleRows = 0;
        this.numberOfVisibleColumns = 0;

        let i = 0;
        rowNamesAndInitialVisibilities.forEach((row) => {
            const name: string = row[0];
            const file = new SingleFileData(name, false)
            this.rowAndColumnDetailsCombined.set(i, file);

            // now after we fave set false, we call SetRowOrColumnVisibility, which keeps track of counts.
            const isVisible: boolean = row[1];
            this.SetRowOrColumnVisibility(i, isVisible);
            i++;
        });

        i = 0;
        colNamesAndInitialVisibilities.forEach((col) => {
            const name: string = col[0];
            const file = new SingleFileData(name, false);
            this.rowAndColumnDetailsCombined.set(i + this.ColumnsStartHere, file);

            // now after we fave set false, we call SetRowOrColumnVisibility, which keeps track of counts.
            const isVisible: boolean = col[1];
            this.SetRowOrColumnVisibility(i + this.ColumnsStartHere, isVisible);
            i++;
        });
    }

    SetColumnRow(x: number, y: number): void {
        if (this.theActualTicks[x][y] === false) {
            this.theActualTicks[x][y] = true;
            this.rowAndColumnDetailsCombined.get(x + this.ColumnsStartHere).tickCount++;
            this.rowAndColumnDetailsCombined.get(y).tickCount++;
        }
    }
    GetNumberOfCellsInARow(): number { return this.numberOfCellsInARow; }
    GetNumberOfCellsInAColumn(): number { return this.numberOfCellsInAColumn; }

    IsRowFullyChecked(row: number): boolean {
        return this.rowAndColumnDetailsCombined[row].tickCount === this.GetNumberOfCellsInARow();
    }

    IsColumnFullyChecked(column: number): boolean {
        return this.rowAndColumnDetailsCombined[column + this.ColumnsStartHere].tickCount === this.GetNumberOfCellsInAColumn();
    }

    GetVisibilitiesForColumnOrRow(file: number): Array<boolean> {
        const array = new Array<boolean>();
        if (file >= this.ColumnsStartHere) {

            for (let row = 0; row < this.GetNumberOfCellsInARow(); row++) {
                array.push(this.rowAndColumnDetailsCombined.get(row).isVisible);
            }
        } else {
            // its actually a row
            for (let col = 0; col < this.GetNumberOfCellsInAColumn(); col++) {
                array.push(this.rowAndColumnDetailsCombined.get(col + this.ColumnsStartHere).isVisible);
            }
        }
        return array;
    }

    GetTickArrayForColumnOrRow(file: number): Array<boolean> {
        const array = new Array<boolean>();
        if (file >= this.ColumnsStartHere) {

            const col = file - this.ColumnsStartHere;
            for (let row = 0; row < this.GetNumberOfCellsInARow(); row++) {

                array.push(this.theActualTicks[col][row]);
            }
        } else {

            // its actually a row
            const row = file;
            for (let col = 0; col < this.GetNumberOfCellsInAColumn(); col++) {
                array.push(this.theActualTicks[col][row]);
            }
        }
        return array;
    }


    GetNextGuess(): [number, number]// an x and a y
    {
        const NotFound: [number, number] = [-1, -1];
        const file = this.FindMostNearlyCompleteRowOrColumnCombined();
        if (file === -1)
            return NotFound;
        //const info: SingleFileData = this.rowAndColumnDetailsCombined.get(file);
        //const ticks = this.GetTickArrayForColumnOrRow(file);
        //const visibs = this.GetVisibilitiesForColumnOrRow(file);

        // check to see if its an encoded column
        if (file >= this.ColumnsStartHere) {

            const column = file - this.ColumnsStartHere;
            for (let row = 0; row < this.GetNumberOfCellsInARow(); row++) {
                if (this.rowAndColumnDetailsCombined.get(row).isVisible === false)
                    continue;// if its not visible
                if (this.theActualTicks[column][row] === true)
                    continue;// if its already checked
                return [column, row];
            }
        } else {

            // its actually a row
            const row = file;
            for (let col = 0; col < this.GetNumberOfCellsInAColumn(); col++) {
                if (this.rowAndColumnDetailsCombined.get(col + this.ColumnsStartHere).isVisible === false)
                    continue;// if its not visible
                if (this.theActualTicks[col][row] === true)
                    continue;// if its already checked
                return [col, row];
            }
        }
        return NotFound;

    }
    GetNumberOfCellsNeededToCompleteFile(pair: [number, SingleFileData]): number {
        const upperLimit: number = (pair[0] < this.ColumnsStartHere) ? this.GetNumberOfVisibleCellsInARow() : this.GetNumberOfVisibleCellsInAColumn();
        return pair[1].tickCount - upperLimit;
    }
    IsColumn(index: number): boolean {
        const IsColumn: boolean = index >= this.ColumnsStartHere;
        return IsColumn;
    }

    FindMostNearlyCompleteRowOrColumnCombined(): number {
        const listOfPairs = Array.from(this.rowAndColumnDetailsCombined.entries());
        for (let i = 0; i < listOfPairs.length; i++) {
            const pair = listOfPairs[i];
            let ticks = 0;
            //count the ticks

            if (this.IsColumn(pair[0])) {
                const actualColumn = pair[0] - this.ColumnsStartHere;
                for (let row = 0; row < this.GetNumberOfCellsInARow(); row++) {
                    if (this.rowAndColumnDetailsCombined.get(row).isVisible) {
                        ticks += this.theActualTicks[actualColumn][row] ? 1 : 0;
                    }
                }
            } else {
                const actualRow = pair[0];
                for (let col = 0; col < this.GetNumberOfCellsInAColumn(); col++) {
                    if (this.rowAndColumnDetailsCombined.get(col + this.ColumnsStartHere).isVisible)
                        ticks += this.theActualTicks[col][actualRow] ? 1 : 0;
                }
            }

            listOfPairs[i][1].tickCount = ticks;
        };

        listOfPairs.sort((pairA, pairB) => {
            return this.GetNumberOfCellsNeededToCompleteFile(pairB) - this.GetNumberOfCellsNeededToCompleteFile(pairA);
        });

        ///...but we don't want files with zero ticks remaining, so 
        ///  return the first one whose tick count hasn't reached the upper limit.
        for (let i = 0; i < listOfPairs.length; i++) {
            const key = listOfPairs[i][0];
            const value = listOfPairs[i][1];

            if (value.isVisible) {
                if (this.IsColumn(key)) {
                    const upperLimit = this.GetNumberOfVisibleCellsInAColumn();
                    if (value.tickCount < upperLimit)
                        return key;
                }
                else {
                    const upperLimit = this.GetNumberOfVisibleCellsInARow();
                    if (value.tickCount < upperLimit)
                        return key;
                }
            }
        };

        return -1;//-e means all are completed
    }

    public SetVisibilityOfRow(number: number, visibility: boolean, nameForDebugging: string): void {
        this.SetRowOrColumnVisibility(number, visibility);
    }


    public SetVisibilityOfColumn(number: number, visibility: boolean, nameForDebugging: string): void {
        this.SetRowOrColumnVisibility(number + this.ColumnsStartHere, visibility);
    }

    private SetRowOrColumnVisibility(index: number, isVisible: boolean) {
        if (this.rowAndColumnDetailsCombined.get(index).isVisible !== isVisible) {
            // we only change it if its actually a change, because we we want to count visibilities below
            this.rowAndColumnDetailsCombined.get(index).isVisible = isVisible;
            if (this.IsColumn(index)) {
                this.numberOfVisibleColumns += isVisible ? 1 : -1;
            }
            else {
                this.numberOfVisibleRows += isVisible ? 1 : -1;
            }
        }
    }

    public GetNumberOfVisibleCellsInARow(): number {
        return this.numberOfVisibleColumns;
    }

    public GetNumberOfVisibleCellsInAColumn(): number {
        return this.numberOfVisibleRows;
    }

    private theActualTicks: Array<Array<boolean>>;// 2-dimensional array
    private rowAndColumnDetailsCombined: Map<number, SingleFileData>;
    private numberOfCellsInARow: number;
    private numberOfCellsInAColumn: number;
    private numberOfVisibleRows: number;
    private numberOfVisibleColumns: number;
    readonly ColumnsStartHere = 1000;
}



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

function LogAndReturnError(isOk: boolean, error: string, isActionose: boolean): string {
    const errorString = (isOk ? "Yes! because it passed " : "No! because it FAILED ") + error;
    if (isActionose || !isOk)
        console.log(errorString);
    return isOk ? "ok" : errorString;
}

function IsOk(result: string): boolean {
    if (result.trim() === "ok")
        return true;
    return false;
}

export function ValidateRowsOfSheet(rows: RowOfSheet[], actionArray: Array<string>, isActionose = false): string {
    const names: Set<string> = new Set<string>();
    rows.forEach((row: RowOfSheet) => {
        names.add(row.name);
    });

    const actions: Set<string> = new Set<string>();
    actionArray.forEach((action: string) => {
        actions.add(action.toLowerCase());
    });

    actions.add("use");// this one is always there.
    actions.add("init");// this means they are like that from the start

    // use jar blah
    for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        // 1. test ** howToMakeVisible **
        const rowObject: string = row.name.trim();
        const command: string = row.commandToMakeVisible.trim();
        if (command.toLowerCase() !== "init") {

            const parts: string[] = GetThreeStringsFromCommand(command);
            const len = parts.length;
            if (len < 2)
                return LogAndReturnError(false, "'" + command + "' not having atleast two parts", isActionose);
            const Action: string = parts[0];
            const obj1: string = parts[1];
            const obj2: string = len > 2 ? parts[2] : "";

            let result = LogAndReturnError(actions.has(Action), "the Actionss containment test with: '" + Action + "'in " + command, isActionose);
            if (IsOk(result)) {
                result = LogAndReturnError(names.has(obj1), "the Object containment test with: '" + obj1 + "' " + command, isActionose);
                if (obj1 === rowObject)
                    result = LogAndReturnError(false, "due to cyclical-dependency with '" + obj1 + "' in " + command, isActionose);
                if (IsOk(result) && obj2 !== "") {
                    result = LogAndReturnError(names.has(obj2), "the Objects containment test with: '" + obj2 + "' in " + command, isActionose);
                    if (Action !== "use")
                        return LogAndReturnError(false, "due to 'use' not being the Action on a two object command: " + command, isActionose);
                    if (obj2 === rowObject)
                        result = LogAndReturnError(false, "due to cyclical-dependency with '" + obj2 + "' in command: " + command, isActionose);
                }
            }
            if (!IsOk(result))
                return result;
        }


        // 2. test ** scriptForExamine ** <-- its just text;

        // 3. now lets validate some javascript
        const scriptToRunWhenMadeVisible: string = row.scriptToRunWhenMadeVisible;
        if (command !== "none") {
            const parts: string[] = command.split(";");
            for (let i = 0; i < parts.length; i++) {
                const trimmed: string = parts[i].trim();
            }
        }
    };

    return "ok";
}

