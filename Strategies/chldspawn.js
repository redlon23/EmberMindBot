const util = require('util');
const fork = util.promisify(require('child_process').fork);
const path = require("path")
const numOfCpus = require("os").cpus().length;
let accountList = [{public: "ND9TyDMuGRE8ltbzfW", secret: "IjiDHU7TZMNNunq86iB5P01eSzl4aSuUobXC"},
    {public: "kkbceTwJmL51V3Gdg2", secret: "O6dVZ8PbDT3KAFNNk5OHMTee2XIWReLfgOKN"}]
let processList = [];

async function main() {
    for(let i = 0; i < 2; i++){
        await (function(i){
            const child =  fork('MarketMaker.js', [`${accountList[i].public}`, `${accountList[i].secret}`], {});
            processList.push(child);
        }(i))
    }
}
main();

