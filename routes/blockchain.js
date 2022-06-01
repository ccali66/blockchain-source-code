const Web3 = require('web3');

const path = require('path');
const fs = require('fs');
const solc = require('solc');

let my_address = "0x078bA65c45cA69A5e6f86A4e1e471eab974972Fd";
let private_key = "ed8dd95aa184241ebaf244810ac20c7ed63a059683776a8422232ed8ba24683f";

let compile_code = null;
let w3 = null;

w3 = new Web3(new Web3.providers.HttpProvider("http://140.118.9.225:23001"));


/* Compile Contract and Fetch ABI, bytecode*/
function compilecode(){
    const solpath = path.resolve(__dirname, '../contract', 'mycontract.sol');
    const source = fs.readFileSync(solpath, 'UTF-8');
    console.log('compiling contract...');
    var input = {
        language: "Solidity",
        sources: {
            "mycontract.sol": {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                "*": {
                "*": ["*"],
                },
            },
        },
    };

    let compiledContract = JSON.parse(solc.compile(JSON.stringify(input)));
    console.log('done');
    for (let contractName in compiledContract.contracts['mycontract.sol']) {
        // code and ABI that are needed by web3
        console.log(contractName + ': ' + compiledContract.contracts['mycontract.sol'][contractName].evm.bytecode.object);
        console.log(contractName + '; ' + JSON.stringify(compiledContract.contracts['mycontract.sol'][contractName].abi));
        var bytecode = compiledContract.contracts['mycontract.sol'][contractName].evm.bytecode.object;
        var abi = compiledContract.contracts['mycontract.sol'][contractName].abi;
    }
    console.log(JSON.stringify(abi, undefined, 2));
    return [bytecode ,abi];
}

function NFT1_smartContract(abi , contractAddr){
    return new w3.eth.Contract(abi, contractAddr);
}

// TODO：save the contractAddress to the database
async function deploySmartContract(name, value, position, bytecode,abi){
    /*let gasEstimate = w3.eth.estimateGas({data: '0x' + bytecode});
    console.log('gasEstimate = ' + gasEstimate);*/
    let myContract = new w3.eth.Contract(abi);
    console.log('deploying contract...');
    
    // encode transactions to ABI
    var deployData = await myContract.deploy({
        data : bytecode,
        arguments:[name, value, position]
    }).encodeABI();

    var tx = {
        gas : 0,
        gasLimit : 6721975,
        data : deployData
    }
    var contractaddr = '';
    await w3.eth.accounts.signTransaction(tx, private_key).then(async(signed) => {
        await w3.eth.sendSignedTransaction(signed.rawTransaction).then((result)=>{
            contractaddr = result.contractAddress;
            console.log("contractAddress is " + contractaddr);
        });
    });
    return contractaddr;
}


async function sendTransaction(abi, conaddr, input){
    let nonce = await w3.eth.getTransactionCount(my_address)
    var contract = new w3.eth.Contract(abi, conaddr);
    
    //let contract = NFT1_smartContract(abi, conaddr);

    // encode transactions to ABI
    let data = await contract.methods.store(input).encodeABI();
    
    var tx = await w3.eth.accounts.signTransaction({
        from: my_address,
        to: contract.options.address,
        gas: '500000',
        gasPrice:'0',
        nonce: nonce,
        value: '0x0',
        data: data
    }, private_key);


    /*await w3.eth.sendSignedTransaction(tx.rawTransaction);
    contract.methods.returnFile().call(null,function(error, result){
        console.log("returnFile data1:"+result);
    });*/

    await w3.eth.sendSignedTransaction(tx.rawTransaction);
    contract.methods.retrieve().call(null,function(error, result){
        console.log("the data:"+result);
    });

};

async function returnfile(abi, conaddr){
    let contract = NFT1_smartContract(abi, conaddr);
    var filedetail;
    contract.methods.returnFile().call(null,function(error, result){
        filedetail = result;
        console.log("returnFile data1:"+filedetail);
    });
    return filedetail;
}

function getOwnerOf(tokenID){
    let contract = NFT1_smartContract("0x3024D80C182066756411af08D07cCe34e5D2526d");
    let owner = contract.methods.ownerOf(tokenID).call({from:my_address});
    return owner;
}

/*
compilereturn = compilecode();
*/

/*
try {
    const abi = JSON.parse(fs.readFileSync('chainabi.txt', 'utf8'));
    console.log(abi);

    conaddr = "0x63F79eA7941aeAa2e70eF11843f7E3398561Eb62";
    console.log("contractaddr:"+conaddr);
    console.log(abi);
    sendTransaction(abi, conaddr, 123);
    returnfile(abi, conaddr);

} catch (err) {
    console.error(err);
}
*/
/*
try {
    const bytecode = fs.readFileSync('chainbycode.txt', 'utf8');
    const abi = JSON.parse(fs.readFileSync('chainabi.txt', 'utf8'));
    var name = 'filename';
    var value = 'hashvalue';
    var position = 'fileposition';
    conaddr = deploySmartContract(name, value, position, bytecode, abi);
    console.log("contractaddr:"+conaddr);

} catch (err) {
    console.error(err);
}
*/
//conaddr = deploySmartContract(compilereturn[0], compilereturn[1]);
/*
conaddr = "0xf79066204b5a08C4c75f62a83B1106E0CcFe6cA0";
console.log("contractaddr:"+conaddr);
console.log(abi);
sendTransaction(abi, conaddr, 123);
returnfile(abi, conaddr);
*/
module.exports = {deploySmartContract};