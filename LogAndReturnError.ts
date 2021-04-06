export function LogAndReturnError(isOk: boolean, error: string, isActionose: boolean): string {
    const errorString = (isOk ? "Yes! because it passed " : "No! because it FAILED ") + error;
    if (isActionose || !isOk)
        console.log(errorString);
    return isOk ? "ok" : errorString;
}
