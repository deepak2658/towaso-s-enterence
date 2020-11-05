const express = require('express');
const Socket = require('socket.io')
const http = require('http')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = Socket(server)


app.use(express.static(path.join(__dirname,'public')))

const drivernsp = io.of('/driver')

drivernsp.on('connect',(socket)=>{
    socket.on('withingeofence',(location)=>{
        console.log(location);
        socket.emit('getSummary',location);
    })

    socket.on('driverLocation',location=>{
        socket.emit('drawRoute',location)
    })
})

server.listen(3000,err=>{
    if(err){
        throw err
    }
    console.log("Server started at port 3000")
})