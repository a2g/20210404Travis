import { GameRuleEnforcerCallbacksInterface, RowOfSheet, GetThreeStringsFromCommand, GetDisplayName, Colors, TruthTable, ValidateRowsOfSheet, ParseRowsFromSheet } from "./AllClasses";

export class GameRuleEnforcer {
    public readonly Examine = 0;
    constructor() { }
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

        let scriptsToRun: string[] = null;
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


export class GameReporter {
    constructor() {
        this.numberOfCommandsExecuted = 0;
    }
    Show(itemName: string) {
        if (itemName.startsWith("i")) {
            console.log("You now have a " + this.Inv(itemName) + " in your possession");
        }
        else if (itemName.startsWith("o")) {
            console.log("A " + this.Obj(itemName) + " reveals itself");
        }
    }

    Say(speech: string) {
        console.log("Main character says " + this.Speech(speech));
    }

    private Prettify(itemName: string): string {
        if (itemName === itemName.toLowerCase()) {
            return this.Act(itemName);
        }
        if (itemName.startsWith("i")) {
            return this.Inv(itemName);
        }
        else if (itemName.startsWith("o")) {
            return this.Obj(itemName);
        }
    }

    private Obj(itemName: string): string {
        return Colors.Cyan + GetDisplayName(itemName) + Colors.Reset;
    }

    private Inv(itemName: string): string {
        return "" + Colors.Magenta + GetDisplayName(itemName) + Colors.Reset;
    }

    private Act(itemName: string): string {
        return "" + Colors.Green + itemName + Colors.Reset;
    }
    private Speech(speech: string): string {
        return "" + Colors.Blue + "\"" + speech + "\"" + Colors.Reset;
    }
    ReportCommand(command: string[]) {
        this.numberOfCommandsExecuted++;

        let prettifiedComand = "";
        if (command.length !== 3)
            prettifiedComand = this.Act("Command length is not 3");
        else if (command[2] !== "")
            prettifiedComand = this.Prettify(command[0]) + " " + this.Prettify(command[1]) + " with " + this.Prettify(command[2]);
        else if (command[1] !== "")
            prettifiedComand = this.Prettify(command[0]) + " " + this.Prettify(command[1]);
        else
            prettifiedComand = this.Prettify(command[0]);

        console.log("\n");
        console.log("> #" + this.numberOfCommandsExecuted + " " + prettifiedComand);
        console.log("\n");
    }

    ReportInventory(inventoryItems: string[]) {
        if (inventoryItems.length === 0)
            return console.log("You aren't carrying anything");

        let inventoryString: string = "You are carrying: " + this.Inv(inventoryItems[0]);
        for (let i = 1; i < inventoryItems.length; i++) {
            inventoryString += ", " + this.Inv(inventoryItems[i]);
        };

        console.log(inventoryString);
    }

    ReportScene(sceneItems: string[]) {
        if (sceneItems.length === 0)
            return console.log("There's nothing around you");

        let sceneString: string = "You can see: " + this.Obj(sceneItems[0]);
        for (let i = 1; i < sceneItems.length; i++) {
            sceneString += ", " + this.Obj(sceneItems[i]);
        };

        console.log(sceneString);
    }

    public static GetInstance(): GameReporter {
        if (!GameReporter.instance) {
            GameReporter.instance = new GameReporter();
        }
        return GameReporter.instance;
    }
    private static instance: GameReporter;

    private numberOfCommandsExecuted: number;
}


export class PlayerAI implements GameRuleEnforcerCallbacksInterface {
    constructor(game: GameRuleEnforcer) {
        this.game = game;
        const actions = game.GetActionsExcludingUse();
        const items = game.GetEntireItemSuite();
        this.itemActionCommmandsTried = new TruthTable(actions, items);
        this.useCommmandsTried = new TruthTable(items, items);
        this.game.SubscribeToCallbacks(this);

        // since use iSpanner with iSpanner is illegal move, we block these out
        for (let i = 0; i < items.length; i++) {
            this.useCommmandsTried.SetColumnRow(i, i);
        }

        // Examine should never be a crucial part of the solution
        // So we can black out all the Examine
        for (let i = 0; i < items.length; i++) {
            this.itemActionCommmandsTried.SetColumnRow(0, i);//0 = examine
        }

        // Examine should never be a crucial part of the solution
        // So we can black out all the Examine
        for (let i = 0; i < items.length; i++) {
            if (items[i][0].startsWith("i"))
                this.itemActionCommmandsTried.SetColumnRow(1, i);//1 = grab
        }

    }

    GetNextCommandOrNull(): string[] {
        const use = this.useCommmandsTried.GetNextGuess();
        if (use[0] !== -1) {
            this.useCommmandsTried.SetColumnRow(use[0], use[1]);
            this.useCommmandsTried.SetColumnRow(use[1], use[0]);
            return ["use", this.game.GetItem(use[0]), this.game.GetItem(use[1])];
        }
        const allOtherActions = this.itemActionCommmandsTried.GetNextGuess();
        if (allOtherActions[0] !== -1) {
            this.itemActionCommmandsTried.SetColumnRow(allOtherActions[0], allOtherActions[1]);
            return [this.game.GetAction(allOtherActions[0]), this.game.GetItem(allOtherActions[1]), ""];
        }
        return null;
    }

    OnItemVisbilityChange(number: number, newValue: boolean, nameForDebugging: string): void {
        this.itemActionCommmandsTried.SetVisibilityOfRow(number, newValue, nameForDebugging);
        this.useCommmandsTried.SetVisibilityOfRow(number, newValue, nameForDebugging);
        this.useCommmandsTried.SetVisibilityOfColumn(number, newValue, nameForDebugging);
    }

    itemActionCommmandsTried: TruthTable;
    useCommmandsTried: TruthTable;
    game: GameRuleEnforcer
}


export class Game {

    public Show(itemName: string) {
        GameRuleEnforcer.GetInstance().ShowOrHide(itemName, true);
        GameReporter.GetInstance().Show(itemName);
        //if its an inventory, then we say 
    }

    public Hide(itemName: string) {
        GameRuleEnforcer.GetInstance().ShowOrHide(itemName, false);
        // could be just an object transformation, so don't say anything.
    }

    public Say(speech: string) {
        // enforcer's don't care about saying stuff som much.
        //this.enforcer.Say(itemName);
        GameReporter.GetInstance().Say(speech);
    }
    public static GetInstance(): Game {
        if (!Game.instance) {
            Game.instance = new Game();
        }
        return Game.instance;
    }
    static instance: Game;
}
const game = Game.GetInstance();
module.exports = game
exports.game = game;


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
    for (let command: string[] = ai.GetNextCommandOrNull(); ; command = ai.GetNextCommandOrNull()) {

        if (command === null) {
            // null command means ai can't find another guess.
            // so lets just see what's going on here
            command = ai.GetNextCommandOrNull();
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