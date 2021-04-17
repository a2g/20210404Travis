
export interface GameRuleEnforcerCallbacksInterface {
    OnItemVisbilityChange(numberOfObjectWhoseVisibilityChanged: number, newValue: boolean, nameForDebugging: string): void;
};