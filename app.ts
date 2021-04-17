import { Game } from './Game';
//import { GameRuleEnforcer } from './GameRuleEnforcer';
import { GameReporter } from './GameReporter';
import { ParseRowsFromSheet } from "./ParseRowsFromSheet";
import { ValidateRowsOfSheet } from "./ValidateRowsOfSheet";
import { PlayerAI } from './PlayerAI';
import { RowOfSheet } from './RowOfSheet';
import { GetThreeStringsFromCommand } from './GetThreeStringsFromCommand';
import { GameRuleEnforcerCallbacksInterface } from './GameRuleEnforcerCallbacksInterface';


const game = Game.GetInstance();
module.exports = game
exports.game = game;

export class GameRuleEnforcer {
    public readonly Examine = 0;
    constructor() {
        this.listOfItems = new Array<string>();
        this.listOfActions = new Array<string>();
        this.listOfItemVisibilities = new Array<boolean>();
        this.listOfActionVisibilities = new Array<boolean>();
        this.itemVsItemHandlers = new Array<Array<Array<string>>>();
        this.actionVsItemHandlers = new Array<Array<Array<string>>>();
        this.callbacks = new PlayerAI(this);
    }

    Initialize(rows: Array<RowOfSheet>, arrayOfActions: Array<string>) {

        // 1. item visibilities based on rows passed in
        this.listOfItems = new Array<string>();
        this.listOfItemVisibilities = new Array<boolean>();
        rows.forEach((row: RowOfSheet) => {
            this.listOfItems.push(row.name);

            // set the visibility too
            const command: string = row.commandToMakeVisible;
            const isInitiallyVisible: boolean = command === "init" || command === "";
            this.listOfItemVisibilities.push(isInitiallyVisible);
        });

        // 2. actions - 
        this.listOfActions = new Array<string>();
        for (let i = 0; i < arrayOfActions.length; i++) {
            this.listOfActions.push(arrayOfActions[i].toLowerCase());
        }

        // 3. create each handler map - which is a big 2d array, with a vector of methods at each cell
        {
            this.itemVsItemHandlers = new Array<Array<Array<string>>>();
            this.actionVsItemHandlers = new Array<Array<Array<string>>>();

            for (let i = 0; i < this.listOfActions.length; i++) {
                this.actionVsItemHandlers[i] = new Array<Array<string>>();
                for (let j = 0; j < this.listOfItems.length; j++) {
                    this.actionVsItemHandlers[i][j] = new Array<string>();
                }
            }

            for (let i = 0; i < this.listOfItems.length; i++) {
                this.itemVsItemHandlers[i] = new Array<Array<string>>();
                for (let j = 0; j < this.listOfItems.length; j++) {
                    this.itemVsItemHandlers[i][j] = new Array<string>();
                }
            }
        }

        // 4. populate each script handler map - which is a big 2d array, with a vector of methods at each cell
        for (let i = 0; i < rows.length; i++) {
            const row: RowOfSheet = rows[i];

            // first we add handlers for examining - which just say stuff.
            const speech: string = rows[i].scriptToRunWhenExamine;
            this.actionVsItemHandlers[this.Examine][i].push("Say(\"" + speech + ");");

            if (row.commandToMakeVisible !== "init") {
                const parts: string[] = GetThreeStringsFromCommand(row.commandToMakeVisible);
                const len = parts.length;
                if (len < 2 && parts[0])
                    throw new Error("Command should have atleast two parts");
                const indexOfAction: number = this.GetIndexOfAction(parts[0]);
                const indexOfItem1: number = this.GetIndexOfItem(parts[1]);
                const indexOfItem2: number = this.GetIndexOfItem(parts[2]);

                // now we've validated the command then we need to break up the scriptToRunWhenMadeVisible
                // in to individual methods, and then add them to the correct handler
                const individualMethods: string[] = row.scriptToRunWhenMadeVisible.split(";");
                if (indexOfAction < 0 && indexOfItem1 > -1 && indexOfItem2 > -1) {

                    // if its the object V object, we add the lists twice.
                    // if we maintained two different lists, and added some stuff here
                    // then some stuff there - and then combined them - some of the 
                    // things would be out of order.
                    individualMethods.forEach((method) => {
                        this.itemVsItemHandlers[indexOfItem1][indexOfItem2].push(method);
                        this.itemVsItemHandlers[indexOfItem2][indexOfItem1].push(method);
                    });

                    this.itemVsItemHandlers[indexOfItem1][indexOfItem2].push("Show('" + row.name + "');");
                    this.itemVsItemHandlers[indexOfItem2][indexOfItem1].push("Show('" + row.name + "');");
                }
                else if (indexOfAction > -1 && indexOfItem1 > -1) {
                    individualMethods.forEach((method) => {
                        this.actionVsItemHandlers[indexOfAction][indexOfItem1].push(method);
                    });

                    this.actionVsItemHandlers[indexOfAction][indexOfItem1].push("Show('" + row.name + "');");
                }
            }
        }
    }

    ExecuteCommand(command: string[]): void {
        const indexOfAction: number = this.GetIndexOfAction(command[0]);
        const indexOfItem1: number = this.GetIndexOfItem(command[1]);
        const indexOfItem2: number = this.GetIndexOfItem(command[2]);

        let scriptsToRun: string[] = new Array<string>();
        if (indexOfAction > -1 && indexOfItem1 > -1) {
            scriptsToRun = this.actionVsItemHandlers[indexOfAction][indexOfItem1];
        } else if (indexOfItem1 > -1 && indexOfItem2 > -1 && indexOfAction < 0) {
            scriptsToRun = this.itemVsItemHandlers[indexOfItem1][indexOfItem2];
        }

        if (scriptsToRun.length > 0) {
            for (let i = 0; i < scriptsToRun.length; i++) {
                const script = scriptsToRun[i];
                if (script !== "none" && script !== "") {
                    const header = "game.";
                    eval(header + script);
                }
            }
        } else {
            const header = "game.";
            const script = "Say(\"That doesn't work\")";
            eval(header + script);
        }
    }

    GetIndexOfAction(Action: string): number {
        const indexOfAction: number = this.listOfActions.indexOf(Action);
        return indexOfAction;
    }

    GetIndexOfItem(item: string): number {
        const indexOfItem: number = this.listOfItems.indexOf(item);
        return indexOfItem;
    }

    GetAction(i: number): string {
        const name: string = i >= 0 ? this.GetActionsExcludingUse()[i][0] : "use";
        return name;
    }

    GetItem(i: number): string {
        const name: string = i >= 0 ? this.GetEntireItemSuite()[i][0] : "-1 lookup in GetItem";
        return name;
    }

    SubscribeToCallbacks(callbacks: GameRuleEnforcerCallbacksInterface) {
        this.callbacks = callbacks;
    }

    GetActionsExcludingUse(): Array<[string, boolean]> {
        const toReturn = new Array<[string, boolean]>();
        this.listOfActions.forEach(function (Action) {
            toReturn.push([Action, true]);
        });
        return toReturn;
    }

    GetEntireItemSuite(): Array<[string, boolean]> {
        const toReturn = new Array<[string, boolean]>();
        for (let i = 0; i < this.listOfItems.length; i++) {
            toReturn.push([this.listOfItems[i], this.listOfItemVisibilities[i]]);
        }
        return toReturn;
    }

    GetCurrentVisibleInventory(): Array<string> {
        const toReturn = new Array<string>();
        for (let i = 0; i < this.listOfItems.length; i++) {
            if (this.listOfItems[i].toLowerCase().startsWith("i") && this.listOfItemVisibilities[i] === true)
                toReturn.push(this.listOfItems[i]);
        }
        return toReturn;
    }

    GetCurrentVisibleScene(): Array<string> {
        const toReturn = new Array<string>();
        for (let i = 0; i < this.listOfItems.length; i++) {
            if (this.listOfItems[i].toLowerCase().startsWith("o") && this.listOfItemVisibilities[i] === true)
                toReturn.push(this.listOfItems[i]);
        }
        return toReturn;
    }

    ShowOrHide(name: string, newVisibility: boolean) {
        const index: number = this.GetIndexOfItem(name);
        if (index !== -1) {
            // call callback
            this.listOfItemVisibilities[index] = newVisibility;
            this.callbacks.OnItemVisbilityChange(index, newVisibility, name);
        }
    }

    public static GetInstance(): GameRuleEnforcer {
        if (!GameRuleEnforcer.instance) {
            GameRuleEnforcer.instance = new GameRuleEnforcer();
        }
        return GameRuleEnforcer.instance;
    }
    private static instance: GameRuleEnforcer;


    private callbacks: GameRuleEnforcerCallbacksInterface;
    private listOfItems: Array<string>;//array of string boolean tuples
    private listOfActions: Array<string>;//array of string boolean tuples
    private listOfItemVisibilities: Array<boolean>;//array of string boolean tuples
    private listOfActionVisibilities: Array<boolean>;//array of string boolean tuples
    private itemVsItemHandlers: Array<Array<Array<string>>>;// a 2d array where each cell contains a list of strings.
    private actionVsItemHandlers: Array<Array<Array<string>>>;// a 2d array where each cell contains a list of strings.

}




console.log('Hello world');

function sleep(milliseconds:number) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

const t = "\t";

// name, how to make visible, also execute when made visible
const blah = "" +
    "oWater" + t + "init" + t + "none" + t + "\n" +
    "oGiantAmazonianLilypad" + t + "init" + t + "none" + t + "\n" +
    "oFloatingObject" + t + "init" + t + "none" + t + "\n" +
    "oLeftCowLeg" + t + "init" + t + "none" + t + "\n" +
    "oRightCowLeg" + t + "init" + t + "none" + t + "\n" +
    "iLeftCowLeg" + t + "grab oLeftCowLeg" + t + "Hide('oLeftCowLeg')" + t + "\n" +
    "iRightCowLeg" + t + "grab oRightCowLeg" + t + "Hide('oRightCowLeg')" + t + "\n" +
    "iLeftCowFemur" + t + "use iLeftCowLeg oWater" + t + "Hide('iLeftCowLeg')" + t + "\n" +
    "iRightCowFemur" + t + "use iRightCowLeg oWater" + t + "Hide('iRightCowLeg')" + t + "\n" +
    "iSkull" + t + "grab oFloatingObject" + t + "Hide('oFloatingObject')" + t + "\n" +
    "iSkullAndBone1" + t + "use iSkull iLeftCowFemur" + t + "Hide('iSkull');Hide('iLeftCowFemur');" + t + "\n" +
    "iMultiBone1" + t + "use iSkullAndBone1 iRightCowFemur" + t + "Hide('iSkullAndBone1');Hide('iRightCowFemur');" + t + "\n" +
    "iSkullAndBone2" + t + "use iSkull iRightCowFemur" + t + "Hide(iSkull);Hide(iRightCowFemur);" + t + "\n" +
    "iMultiBone2" + t + "use iSkullAndBone2 iLeftCowFemur" + t + "Hide(iSkullAndBone2);Hide(iLeftCowFemur);" + t;


const isactionose = false;
const rowsOfGame = ParseRowsFromSheet(blah);
const actions: Array<string> = ["examine", "grab"];
const result = ValidateRowsOfSheet(rowsOfGame, actions, isactionose);

if (result === "ok") {
    GameRuleEnforcer.GetInstance().Initialize(rowsOfGame, actions);
    const ai: PlayerAI = new PlayerAI(GameRuleEnforcer.GetInstance());
    for (let command: string[] = ai.GetNextCommand(); ; command = ai.GetNextCommand()) {

        if (command.length==0) {
            // null command means ai can't find another guess.
            // so lets just see what's going on here
            command = ai.GetNextCommand();
            break;
        }
        GameReporter.GetInstance().ReportCommand(command);
        GameRuleEnforcer.GetInstance().ExecuteCommand(command);

        const inventory = GameRuleEnforcer.GetInstance().GetCurrentVisibleInventory();
        GameReporter.GetInstance().ReportInventory(inventory);
        const viewables = GameRuleEnforcer.GetInstance().GetCurrentVisibleScene();
        GameReporter.GetInstance().ReportScene(viewables);

        sleep(500);
    }
    console.log("Success");
} else {
    console.log(result);
    console.log("Quitting early");
}