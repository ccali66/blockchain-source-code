const fs = require('fs');
const crypto = require('crypto');

function hashsha256(input){
    var hash = crypto.createHash('sha256');
    return hash.update(input).digest('hex');
}

function filehash(path) {
    console.log('This is file hash function');
    let file_buffer = fs.readFileSync(path);
    let sum = crypto.createHash('sha256');
    sum.update(file_buffer);
    const hex = sum.digest('hex');
    return hex;
}

module.exports = {hashsha256,filehash,};

//hashvalue = filehash('../uploads/Authentication and Authenticated Key Exchanges.pdf');
//console.log(hashvalue);