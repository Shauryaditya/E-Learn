const { PrismaClient } = require("@prisma/client")

const database = new PrismaClient();

async function main(){
    try{
        await database.category.createMany({
            data: [
                {name: "Computer Science"},
                {name: "Physics"},
                {name: "Chemistry"},
                {name: "Mathematics"},
                {name: "Biology"},
                {name: "Worksheet"} 
            ]
        })

        console.log("Success")
    }catch (error){
        console.log("Error seeding the database categories", error);
    } finally{
        await database.$disconnect();
    }
}

main()
