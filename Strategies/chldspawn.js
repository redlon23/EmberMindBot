const util = require('util');
// const fork = util.promisify(require('child_process').fork);
const { fork } = require('child_process')
const path = require("path")
const numOfCpus = require("os").cpus().length;
const userModel = require("../src/userModels"), userTradingModels = require("../src/userTradingModels");
require('dotenv').config()
const db = require('../src/database') //Need this defined -- don't delete it

// let accountList = [{public: "ND9TyDMuGRE8ltbzfW", secret: "IjiDHU7TZMNNunq86iB5P01eSzl4aSuUobXC"},
//     {public: "kkbceTwJmL51V3Gdg2", secret: "O6dVZ8PbDT3KAFNNk5OHMTee2XIWReLfgOKN"}]
let processlist = {};
var numOfProcesses = 0;
async function main() {
    let userData = await userModel.getAllUsers();
    // Find all the users that have api keys
    let filterData = userData.filter((element) => {
        return element.publicAPI.length > 12
    })
    for (let i = 0; i < filterData.length; i++) {
        await (async function (i) {
            // Get user settings for market maker
            let data = await userTradingModels.getStrategySetting({
                userId: filterData[i]._id,
                strategyName: "Market Maker"
            })
            let settings = {
                quantity: data.quantity,
                takeProfit: data.takeProfit,
                stopLoss: data.stopLoss,
                rsiKlinePeriod: data.rsiKlinePeriod,
                rsiOverBought: data.rsiOverBought,
                rsiOverSold: data.rsiOverSold
            }
            // Settings needs to be string to be passed to a child process.
            settings = JSON.stringify(settings)

            if(data.strategyIsEquipped && filterData[i].tradingEnabled){
                const child = fork('MarketMaker.js', [`${filterData[i].publicAPI}`, `${filterData[i].secretAPI}`, settings], {});
                processlist[`${filterData[i]._id}`] = child
            }
        }(i))
    }

    setInterval(async()=>{
        let userData = await userModel.getAllUsers();
        let filterData = userData.filter((element) => {
            return element.publicAPI.length > 12
        })

        for (let i = 0; i < filterData.length; i++) {
            let data = await userTradingModels.getStrategySetting({
                userId: filterData[i]._id,
                strategyName: "Market Maker"
            })

            if(!filterData[i].tradingEnabled || !data.strategyIsEquipped){
                let prcs = processlist[`${filterData[i]._id}`];
                if(prcs){
                    let isDead = prcs.kill();
                    if(isDead){
                        delete processlist[`${filterData[i]._id}`];
                    }
                }
            }
        }
        console.log("end of loop")
    }, 15000)


}
main();

