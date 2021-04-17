import { stringify } from "querystring";
import { Game } from './Game';
import { GameRuleEnforcer } from './GameRuleEnforcer';
import { GameReporter } from './GameReporter';
import { PlayerAI } from './PlayerAI';
import { ParseRowsFromSheet } from "./ParseRowsFromSheet";
import { ValidateRowsOfSheet } from "./ValidateRowsOfSheet";



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