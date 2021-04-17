import { TruthTable } from './TruthTable';
import { GameRuleEnforcer } from './GameRuleEnforcer';
import {
    GameRuleEnforcerCallbacksInterface
} from './GameRuleEnforcerCallbacksInterface';

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

    GetNextCommand(): string[] {
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
        return [];;
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

