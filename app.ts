console.log("Hello world");

function welcomePerson(person:Person){
    console.log(`Hey ${person.firstName} ${person.lastName}`);
}

const james = {
    firstName: "James",
    lastName: "Quick"

}

welcomePerson()

interface Person{
    firstname: string,
    lastName: string
}

console.log()
