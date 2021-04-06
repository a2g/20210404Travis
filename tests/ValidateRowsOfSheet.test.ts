//Typescript Unit test
import assert = require('assert');
import { ValidateRowsOfSheet } from "../ValidateRowsOfSheet";
import { RowOfSheet } from "../RowOfSheet";

const actions: Array<string> = ["examine", "grab"];


describe("ValidateRowsOfSheet", () => {
    it("TestInitKeywordIsOk", () => {
        const r1 = new RowOfSheet();
        r1.name = "oWater";
        r1.commandToMakeVisible = "init";
        const rows: Array<RowOfSheet> = [r1];
        assert.equal("ok", ValidateRowsOfSheet(rows, actions));
    });

    it("TestInitKeywordInCapsIsOk", ()=> {
        const r1 = new RowOfSheet();
        r1.name = "oWater";
        r1.commandToMakeVisible = "INIT";
        const rows: Array<RowOfSheet> = [r1];

        assert.equal("ok", ValidateRowsOfSheet(rows, actions));
    });

    it("TestComplicatedDependencyIsOk", ()=> {
        const r1 = new RowOfSheet();
        r1.name = "oObjA";
        r1.commandToMakeVisible = "use oObjB oObjC";


        const r2 = new RowOfSheet();
        r2.name = "oObjB";
        r2.commandToMakeVisible = "use oObjA oObjC";

        const r3 = new RowOfSheet();
        r3.name = "oObjC";
        r3.commandToMakeVisible = "use oObjA oObjB";

        const rows: Array<RowOfSheet> = [r1, r2, r3];
        assert.equal("ok", ValidateRowsOfSheet(rows, actions))
    });

    it("TestTwoObjectCyclicalDependencyIsBad", () => {
        const r1 = new RowOfSheet();
        r1.name = "oObjA";
        r1.commandToMakeVisible = "init";

        const r2 = new RowOfSheet();
        r2.name = "oObjB";
        r2.commandToMakeVisible = "use oObjA oObjB";

        const rows: Array<RowOfSheet> = [r1, r2];
        assert.notEqual("ok", ValidateRowsOfSheet(rows, actions))
    });

    it("TestOneObjectCyclicalDependencyIsBad", () => {
        const r1 = new RowOfSheet();
        r1.name = "oObjA";
        r1.commandToMakeVisible = "grab oObjA";

        const rows: Array<RowOfSheet> = [r1];
        assert.notEqual("ok", ValidateRowsOfSheet(rows, actions))
    });

    it("TestTwoObjectWithUseIsOk", () => {
        const r1 = new RowOfSheet();
        r1.name = "oObjA";
        r1.commandToMakeVisible = "init";

        const r2 = new RowOfSheet();
        r2.name = "oObjB";
        r2.commandToMakeVisible = "init";

        const r3 = new RowOfSheet();
        r3.name = "oObjC";
        r3.commandToMakeVisible = "use oObjA oObjB";

        const rows: Array<RowOfSheet> = [r1, r2, r3];
        assert.equal("ok", ValidateRowsOfSheet(rows, actions))
    });

    it("TestTwoObjectWithoutUseIsBad", () => {
        const r1 = new RowOfSheet();
        r1.name = "oObjA";
        r1.commandToMakeVisible = "init";

        const r2 = new RowOfSheet();
        r2.name = "oObjB";
        r2.commandToMakeVisible = "init";

        const r3 = new RowOfSheet();
        r3.name = "oObjC";
        r3.commandToMakeVisible = "grab oObjA oObjB";

        const rows: Array<RowOfSheet> = [r1, r2, r3];
        assert.notEqual("ok", ValidateRowsOfSheet(rows, actions))
    });
});


