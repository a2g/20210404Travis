import { Colors } from './Colors';
import { GetDisplayName } from './GetDisplayName';

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
        // shouldn't happen for now
        return "";
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
