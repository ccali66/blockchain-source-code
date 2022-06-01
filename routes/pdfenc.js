const crypto = require('crypto');
const fs = require('fs');
const algorithm = 'aes-256-ctr';
let key = 'MySuperSecretKey';
key = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);

const encrypt = (buffer) => {
    // Create an initialization vector
    const iv = crypto.randomBytes(16);
    // Create a new cipher using the algorithm, key, and iv
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // Create the new (encrypted) buffer
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
};

const decrypt = (encrypted) => {
   // Get the iv: the first 16 bytes
   const iv = encrypted.slice(0, 16);
   // Get the rest
   encrypted = encrypted.slice(16);
   // Create a decipher
   const decipher = crypto.createDecipheriv(algorithm, key, iv);
   // Actually decrypt it
   const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
   return result;
};

function enc(filepath){
    console.log('this is enc function');
    console.log(filepath);
    fs.readFile(filepath, (err, file) =>{
        if (err) return console.error('ERROR:'+err.message);
        const encryptedFile = encrypt(file);

        fs.writeFile(filepath, encryptedFile, (err, file) => {
            if (err) return console.error('ERROR:'+err.message);
            if(file){
                console.log('file encrypted successfully');
            }
            console.log('file encrypted end');
        })
    })
}

function dec(filepath){
    fs.readFile(filepath, (err, file) =>{
        if (err) return console.error(err.message);

        if(file){
            const decryptFile = decrypt(file);
            console.log('file decrypted successfully');
            
            fs.writeFile(filepath, decryptFile, (err, file) => {
                if (err) return console.error(err.message);
                if(file){
                    console.log('file decrypted successfully');
                }
            })

        }

    })
}
//enc('../uploads/Multi-authority Attribute Based Encryption.pdf');
//dec('../uploads/blockchain(AAI).pdf');
module.exports = {enc,dec,};