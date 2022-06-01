const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
var fs = require('fs');
var header = '';


function genRandomStr(l) {
	const sourceSet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
	let result = '';
	for (let i = 0; i < l; i++) {
		result += sourceSet[Math.floor(Math.random()*sourceSet.length)];
	}                                                                       
	return result;                                                          
}

function checkattr(id) {
	var f = 1;
	for (let i = 0; i < id.length; i++){
		if(parseInt(id[i])<100){
			console.log(id[i]);
		}else{
			console.log('wrong attr');
			f = 0;
		}
	}
	return f;
}


app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to the API'
  });
});

app.post('/api/posts', verifyToken, (req, res) => {  
  var publicKey = fs.readFileSync('eccpk.pem');
  try{
    jwt.verify(req.token, publicKey, (err, authData) => {
      if(err) {
        res.sendStatus(403);
	console.log(err);
      } else {
        if(authData.iss !='https://blockchain/ch2'){
          res.json({
	    message:'token iss is undefined'
  	  });
        }
        if(authData.exp <= Math.floor(Date.now() / 1000)){
          res.json({
	    message:'token is expired'
	  });
        }
        if(authData.aud != 'https://blockchain/ch1'){
          res.json({
	    message:'token aud is undefined'
          });
        }
        if(checkattr(authData.attr)==0){
          res.json({
            message:'token attr is undefined'
          });
	}
        res.json({
          message: 'Post created...',
          authData
        });
      }
    });
  }catch(err){
    res.sendStatus(404);
    console.log(err);
  }
});

app.post('/api/login', (req, res) => {
  const payload = {};                                              
  var publicKeyclient = fs.readFileSync('eccpk-client.pem');
  pubkey = Buffer.from(publicKeyclient, 'base64').toString('ascii')
  //payload.iss = 'https://blockchain/ch2/testejgawegejasdfasdfawefaweefawefwefawef';
  payload.iss = 'https://blockchain/ch2';
  payload.sub = pubkey;
  payload.iat = Math.floor(Date.now() / 1000);                     
  payload.jti = genRandomStr(10);
  payload.aud = 'https://blockchain/ch1';
  payload.exp = Math.floor(Date.now() / 1000) + (60 * 60); //1 hour
  payload.attr = ['01','02','15'];   

  var privateKey = fs.readFileSync('eccsk.pem'); 
  jwt.sign(payload, privateKey, { algorithm:'ES256'}, (err, token) => {
    fs.writeFileSync('tokenlen.txt', token);
    res.json({
      token
    });
  });
});

// FORMAT OF TOKEN
// Authorization: Bearer <access_token>

// Verify Token
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;
    // Next middleware
    next();
  } else {
    // Forbidden
    res.sendStatus(403);
  }

}

app.listen(5001, () => console.log('Server started on port 5001'));
