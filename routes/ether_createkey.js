function Create_keypair(){
    var ethers = require('ethers');  
    var crypto = require('crypto');
    var id = crypto.randomBytes(32).toString('hex');
    var privateKey = "0x"+id;
    //console.log("privateKey:", privateKey);

    var wallet = new ethers.Wallet(privateKey);
    //console.log("publicKey: " + wallet.address);
    var publicKey = wallet.address;
    return {privateKey, publicKey};
}

module.exports = {Create_keypair};
