
export function IsOk(result: string): boolean {
    if (result.trim() === "ok")
        return true;
    return false;
}