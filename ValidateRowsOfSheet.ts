import { RowOfSheet } from "./RowOfSheet";
import { GetThreeStringsFromCommand } from "./GetThreeStringsFromCommand";
import { IsOk } from './IsOk';
import { LogAndReturnError } from './LogAndReturnError'

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

            let result = LogAndReturnError(actions.has(Action), `the Actionss containment test with: '${Action}' in ${command})`, isActionose);
            if (IsOk(result)) {
                result = LogAndReturnError(names.has(obj1), `the Object containment test with: '${obj1}' ${command})`, isActionose);
                if (obj1 === rowObject)
                    result = LogAndReturnError(false, `due to cyclical-dependency with: '${obj1}' ${command})`, isActionose);
                if (IsOk(result) && obj2 !== "") {
                    result = LogAndReturnError(names.has(obj2), `the Objects containment test with: '${obj2}' ${command})`, isActionose);
                    if (Action !== "use")
                        return LogAndReturnError(false, `due to 'use' not being the Action on a two object command: ${command})`, isActionose);
                    if (obj2 === rowObject)
                        result = LogAndReturnError(false, `due to cyclical-dependency with: '${obj2}' ${command})`, isActionose);
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

