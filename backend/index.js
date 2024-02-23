const express = require("express")
require("dotenv").config()
const cors = require("cors");
const app = express()
app.use(cors())
const Port = process.env.PORT || 8000
const connection = require('./Config/db')
const audioRouter = require("./Routers/audioRecordingRoutes")

app.use(express.json())
app.use("/audios",audioRouter)

app.get("/",(req,res)=>{
    res.status(200).send({message:"Welcome to the backend of FSTAC App"})
})


app.listen(Port,async()=>{
    try{
        await connection
        console.log("Server is connected to DB")
        console.log(`App is listening to the port ${Port}`)
    }catch(error){
        console.log(error)
    } 
})