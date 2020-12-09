// const express = require('express')
// const app = express()
// const bodyParser = require("body-parser");
// const port = 8080

// // Parse JSON bodies (as sent by API clients)
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
// const { connection } = require('./connector')

// app.get("/totalRecovered", (req, res) => {
//     let count = 0;
//     connection.find().then(post => {
//         post.map(ele => {
//             count += ele.recovered;
//         });
//         res.send({data: {_id: "total", recovered:count}});
//     })
// })

// app.get("/totalActive", (req, res) => {
//     let count = 0;
//     connection.find().then(post => {
//         post.map(ele => {
//             count += (ele.infected - ele.recovered);
//         });
//         res.send({data: {_id: "total", active:count}});
//     })
// });

// app.get("/totalDeath", (req, res) => {
//     let count = 0;
//     connection.find().then(post => {
//         post.map(ele => {
//             count += (ele.death);
//         });
//         res.send({data: {_id: "total", death:count}});
//     })
// });

// app.get("/hotspotStates", (req, res) => {
//     let count = 0;
//     let arr = [];
//     connection.find().then(post => {
//         post.map(ele => {
//             let rate = ((ele.infected - ele.recovered)/ ele.infected).toFixed(5);
//             if( rate > 0.1){
//                 arr = [...arr, {state: ele.state, rate: rate}] 
//             }
//         })
//         return arr;
//     }).then(arr => res.send({data: arr}));
// });

// app.get("/healthyStates", (req, res) => {
//     let count = 0;
//     let arr = [];
//     connection.find().then(post => {
//         post.map(ele => {
//             let rate = ((ele.infected - ele.recovered)/ ele.infected).toFixed(5);
//             if( rate < 0.005){
//                 arr = [...arr, {state: ele.state, rate: rate}] 
//             }
//         })
//         return arr;
//     }).then(arr => res.send({data: arr}));
// });

// app.listen(port, () => console.log(`App listening on port ${port}!`))

// module.exports = app;
const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')



app.get('/totalRecovered',(req,res) => {
    connection.aggregate(([
        {$group:
            {_id: null,
                totalRecovered: { $sum:"$recovered"} 
            }
        }  
            
    ]))
    .then((result,rej)=>{
            
            let response = {
                            "data":
                            {
                                "_id":"total",
                                "recovered" : result[0].totalRecovered
                            }
                        }

            res.json(response);
    })
    .catch((err)=>{
        res.status(404).send(err);
    })

})

app.get('/totalActive',(req,res) => {

    connection.aggregate(([
        {$group:
            {
                _id: null,
                totalActive: {$sum:{$subtract:["$infected","$recovered"]}}}  
            
        }
    ]))
    .then((result,rej)=>{

            let response = {
                            "data":
                            {
                                "_id":"total",
                                "active" : result[0].totalActive
                            }
                        }


            res.json(response);
    })
    .catch((err)=>{
        res.status(404).send(err);
    })


})

app.get('/totalDeath',(req,res) => {
    connection.aggregate(([
        {$group:
            {
                _id:null,
                totalDeath: {$sum : "$death"} }  
            
        }
    ]))
    .then((result,rej)=>{

            // let totalDeath = result.reduce((result,death)=>{
            //     return result + death.total;
            // },0);
            let response = {
                            "data":
                            {
                                "_id":"total",
                                "death" : result[0].totalDeath
                            }
                        }

            res.json(response);
    })
    .catch((err)=>{
        res.status(404).send(err);
    })

})

app.get('/hotspotStates',(req,res) => {

        connection.aggregate(([
            {$project: 
                
                {
                    state : 1,
                    rate: 
                    { $round : 
                        [{ $divide: 
                            [ {$subtract: ["$infected","$recovered"]}, "$infected" ] 
                        },5]
                    }
                }
                
            },
            {
                $match: { rate: {$gt : 0.1} }
            }
        ]))
        .then((result,rej)=>{
                console.log(result);
                let hotspots = result.map((hotspot)=>{
                    return {"state": hotspot.state,"rate": hotspot.rate}
                })
                let response = {
                    "data": hotspots
                }
    
                res.json(response);
        })
        .catch((err)=>{
            res.status(404).send(err);
        })

    })


app.get('/healthyStates',(req,res) => {

    connection.aggregate(([
        {$project: 
            
                {state : 1,
                    mortality: 
                    { $round : 
                        [
                            { $divide:[ "$death","$infected" ] },5
                        ]
                    }
                }
            
        },{
            $match: { mortality: {$lt : 0.005} }
        }
    ]))
    .then((result,rej)=>{
            
            let healthyStates = result.map((healthyState)=>{
                return {"state": healthyState.state,"mortality": healthyState.mortality}
            })
            let response = {
                "data": healthyStates
            }

            res.json(response);
    })
    .catch((err)=>{
        res.status(404).send(err);
    })

})



app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;
