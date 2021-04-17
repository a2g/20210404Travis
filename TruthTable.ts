import { SingleFileData } from "./SingleFileData";

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
            const file = new SingleFileData(name, false);
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
            let columnObject = this.rowAndColumnDetailsCombined.get(x + this.ColumnsStartHere);
            let rowObject = this.rowAndColumnDetailsCombined.get(y);
            if (!columnObject)
                throw RangeError("bad column " + x);
            if (!rowObject)
                throw RangeError("bad row " + y);
            columnObject.tickCount++;
            rowObject.tickCount++;
        }
    }
    GetNumberOfCellsInARow(): number { return this.numberOfCellsInARow; }
    GetNumberOfCellsInAColumn(): number { return this.numberOfCellsInAColumn; }

    IsRowFullyChecked(row: number): boolean {
        const rowObject = this.rowAndColumnDetailsCombined.get(row);
        if (!rowObject)
            throw RangeError("" + row);
        return rowObject.tickCount === this.GetNumberOfCellsInARow();
    }

    IsColumnFullyChecked(column: number): boolean {
        const col = this.rowAndColumnDetailsCombined.get(column + this.ColumnsStartHere);
        if (!col)
            throw RangeError("" + column + this.ColumnsStartHere);
        return col.tickCount === this.GetNumberOfCellsInAColumn();
    }

    GetVisibilitiesForColumnOrRow(file: number): Array<boolean> {
        const array = new Array<boolean>();
        if (file >= this.ColumnsStartHere) {

            for (let row = 0; row < this.GetNumberOfCellsInARow(); row++) {
                const rowObject = this.rowAndColumnDetailsCombined.get(row);
                if (!rowObject)
                    throw RangeError("" + row);
                array.push(rowObject.isVisible);
            }
        } else {
            // its actually a row
            for (let col = 0; col < this.GetNumberOfCellsInAColumn(); col++) {
                const columnObject = this.rowAndColumnDetailsCombined.get(col + this.ColumnsStartHere);
                if (!columnObject)
                    throw RangeError("" + col);
                array.push(columnObject.isVisible);
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
                const rowObject = this.rowAndColumnDetailsCombined.get(row);
                if (!rowObject)
                    throw RangeError("" + row);
                if (rowObject.isVisible === false)
                    continue;// if its not visible
                if (this.theActualTicks[column][row] === true)
                    continue;// if its already checked
                return [column, row];
            }
        } else {

            // its actually a row
            const row = file;
            for (let col = 0; col < this.GetNumberOfCellsInAColumn(); col++) {
                const columnObject = this.rowAndColumnDetailsCombined.get(col + this.ColumnsStartHere);
                if (!columnObject)
                    throw RangeError("" + col);
                if (columnObject.isVisible === false)
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
                    const rowObject = this.rowAndColumnDetailsCombined.get(row);
                    if (!rowObject)
                        throw RangeError("" + row);
                    if (rowObject.isVisible) {
                        ticks += this.theActualTicks[actualColumn][row] ? 1 : 0;
                    }
                }
            } else {
                const actualRow = pair[0];
                for (let col = 0; col < this.GetNumberOfCellsInAColumn(); col++) {
                    const columnObject = this.rowAndColumnDetailsCombined.get(col + this.ColumnsStartHere);
                    if (!columnObject)
                        throw RangeError("" + col);
                    if (columnObject.isVisible)
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
        const rowOrColumn = this.rowAndColumnDetailsCombined.get(index);
        if (!rowOrColumn)
            throw RangeError("" + index);
        if (rowOrColumn != null && rowOrColumn.isVisible !== isVisible) {
            // we only change it if its actually a change, because we we want to count visibilities below
            rowOrColumn.isVisible = isVisible;
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


