export function GetDisplayName(name: string) {
    const parts = name.slice(1).split(/(?=[A-Z])/);
    let result = parts[0].toLowerCase();
    for (let i = 1; i < parts.length; i++) {
        result += " " + parts[i].toLowerCase();
    }

    return result;
}