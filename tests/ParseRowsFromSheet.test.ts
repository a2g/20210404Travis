//Typescript Unit test
import assert = require('assert');
import { ParseRowsFromSheet } from "../ParseRowsFromSheet";
import { RowOfSheet } from "../RowOfSheet";

describe("ParseRowsFromSheet", () => {
    it("TestRowsAndColumnsAreParsedOk", () => {
        const t = "\t";
        const blah = "" +
            "oFloatingObject" + t + "none" + t + "none" + t + "\n" +
            "oCowlegL" + t + "none" + t + "none" + t + "\n" +
            "oCowlegR" + t + "none" + t + "none" + t + "\n" +
            "iCowlegL" + t + "grab oCowlegL" + t + "none" + t + "\n" +
            "iCowlegR" + t + "grab oCowlegR" + t + "none" + t + "\n" +
            "iFemurL" + t + "use iFemurL oWater" + t + "hide('iFemurL')" + t + "\n" +
            "iFemurR" + t + "use iFemurR oWater" + t + "none" + t + "\n" +
            "iSkull" + t + "grab oFloatingObject" + t + "none" + t + "\n" +
            "iSkullAndBone" + t + "use iSkull iFemur" + t + "none" + t + "\n" +
            "iMultiBone" + t + "use iSkullAndBone iFemur" + t + "none" + t;

        const rows: RowOfSheet[] = ParseRowsFromSheet(blah);
        assert.equal(10, rows.length);

        const v1 = rows[5].name;
        const v2 = rows[5].commandToMakeVisible;
        const v3 = rows[5].scriptToRunWhenMadeVisible;
        assert.equal("iFemurL", v1);
        assert.equal("use iFemurL oWater", v2);
        assert.equal("hide('iFemurL')", v3);
    });
});

