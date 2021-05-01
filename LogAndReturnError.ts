export function LogAndReturnError(isOk: boolean, error: string, isVerbose: boolean): string {
    const errorString = (isOk ? "    (Yes! because it passed " : "    (shhhh! it FAILED ") + error;
    if (isVerbose || !isOk)
        console.log(errorString);
    return isOk ? "ok" : errorString;
}
