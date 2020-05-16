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

async function getUserWithValidApis(){
    let userData = await userModel.getAllUsers();
    // Find all the users that have api keys
    return userData.filter((element) => {
        return element.publicAPI.length > 12
    });
}

async function startProcess(user, strategyDetails){
    let settings = {
        quantity: strategyDetails.quantity,
        takeProfit: strategyDetails.takeProfit,
        stopLoss: strategyDetails.stopLoss,
        rsiKlinePeriod: strategyDetails.rsiKlinePeriod,
        rsiOverBought: strategyDetails.rsiOverBought,
        rsiOverSold: strategyDetails.rsiOverSold
    }
    // Settings needs to be string to be passed to a child process.
    settings = JSON.stringify(settings)
    return fork('MarketMaker.js', [`${user.publicAPI}`, `${user.secretAPI}`, settings], {});
}

async function getUserStrategyDetails(user){
    return await userTradingModels.getStrategySetting({
        userId: user._id,
        strategyName: "Market Maker"
    })
}

async function main() {
    setInterval(async()=>{
        let users = await getUserWithValidApis();
        // Span the ones that are not in processList & trading enabled
        for (let i = 0; i < users.length; i++) {
            await (async function (i) {
                let user = users[i];
                let strategyDetails = await getUserStrategyDetails(user)
                if(!processlist[`${user._id}`] && user.tradingEnabled && strategyDetails.strategyIsEquipped){
                    processlist[`${user._id}`] = await startProcess(user, strategyDetails);
                }
            }(i))
        }
        // Kill the ones that are disabled
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            let data = await getUserStrategyDetails(user)
            if(!user.tradingEnabled || !data.strategyIsEquipped){
                let prcs = processlist[`${user._id}`];
                if(prcs){
                    let isDead = prcs.kill();
                    if(isDead){
                        delete processlist[`${user._id}`];
                    }
                }
            }
        }
        console.log("end of loop")
    }, 15000)


}
main();

