var fs = require('fs');
var crypto = require('crypto');
var moment = require('moment');
var express = require('express');
var session = require('express-session');
const keylib = require("./ether_createkey.js");
var svgcaptcha = require('svg-captcha');
var getmac = require('getmac');
var multer  = require('multer');
var upload = multer({ dest: 'upload/'});
var router = express.Router();
const hash = require("./hashfunc.js");
const aes = require("./pdfenc.js");
const chain = require("./blockchain.js");
const cross = require("./crosschain.js");

router.use(session({
    secret: 'test',
    saveUninitialized: false,
    resave: true, 
    })
);

function hashsha256(input){
    var hash = crypto.createHash('sha256');
    return hash.update(input).digest('hex');
}

router.get('/captcha', function(req, res, next) {
    const captcha = svgcaptcha.createMathExpr({
        //size:4,  
        noise:2,
        color:true,
        mathMin:1,
        mathMax:30,
        mathOperator: '+-',
    });

    req.session.cap = captcha.text;
    //cap = captcha.text;
    console.log('cap:'+req.session.cap);
    res.type('svg');
    res.status(200).send(captcha.data);
});

router.get('/login', function(req, res, next){
    res.render('hospital/h_login', {title: 'Add Test'});
});

router.post('/logining',function(req, res, next){
    var db = req.con;
    var workID = Number(req.body.workID);
    var pw = hashsha256(req.body.password1);
    var webcaptcha = req.body.captcha;
    //console.log(callMac());
    if(webcaptcha!=req.session.cap){
        console.log('captcha error');
        res.send('<script>alert("驗證碼輸入錯誤，麻煩請重新登入");   window.location.href = "login"; </script>').end();
    }else{
        var qur = db.query('Select workID, password, name from user where workID = ?', workID, function(err, rows) {
            if (err){
                console.log('sql error');
                console.log(err);
                res.redirect('back');
            }else{
                if(rows == false){
                console.log('account error');
                res.send('<script>alert("查無此帳號，麻煩請重新登入");   window.location.href = "login"; </script>').end();
                }else{
                    dbpw = rows[0].password;
                    if(dbpw == pw){
                            res.setHeader('Content-Type', 'application/json');
                            res.redirect('upload');
                    }else{
                        console.log('wrong password');
                        res.send('<script>alert("密碼輸入錯誤，麻煩請重新登入");   window.location.href = "login"; </script>').end();
                    }
                }
            }

        });
    }
});

router.get('/register', function(req, res, next){
    res.render('hospital/h_register', {title: 'Add Test'});
});

router.post('/addUser', function(req, res, next) {
    var db = req.con;	
    console.log(moment(new Date()).format('YYYY-MM-DD HH:mm:ss'));
    
    var workID = Number(req.body.workID);
    var resname = req.body.name;
    var name = resname.replace('%20',' ');
    var password = hashsha256(req.body.password1);
    var password2 = hashsha256(req.body.password2);
    var phoneNum = req.body.phoneNum;
    var email = req.body.email;
    var title = req.body.title;
    var stringtitle = JSON.stringify(req.body.title);
    console.log('titletypeof:'+typeof(stringtitle));
    console.log('title:'+stringtitle);
    //var title = "'"+restitle.replace("'",'')+"'";
    //console.log('title:'+title);
    var gender = req.body.gender;
    var years = Number(req.body.years);
    var attr = gender + ',' + years + ',' + title;
    
    
    if (password != password2){
    	console.log('password is different');
        res.send('<script>alert("password is different");   window.location.href = "login"; </script>').end();
    }else{
	    var IDres = 1; //0 error 1 success
        db.query('SELECT workID FROM user WHERE workID =?',workID,async function(err, rows) {
            if(err) {
                console.log('DB error');
                console.log(err);
            }
            var data = rows;
            console.log(data);
            if(!data) IDres == 0;
        });
        if(IDres == 0){
            console.log('acount error');
            res.send('<script>alert("此工作證號已註冊，請登入或重新確認您的工作證號");   window.location.href = "register"; </script>').end();
        }else{
            const keypair = keylib.Create_keypair();
            console.log(keypair.privateKey);
            console.log(keypair.publicKey);
            var hashv = workID+name+password+phoneNum+email+title+gender+years+attr+keypair.publicKey;
            var hashValue = hashsha256(hashv);
            var sql = {
                workID: workID,name: name,
                password: password,phoneNum: phoneNum,
                email: email,title: stringtitle,gender: gender,
                years: years,attr: attr,
                pubKey: keypair.publicKey,
                hashValue: hashValue,
                createTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),modifyTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            console.log('sql:');
            console.log(sql);
            
            var qur = db.query('INSERT INTO user SET ?', sql, function(err, rows) {
            if (err){
                console.log('sql error');
                    console.log(err);
            }
                console.log(qur);
                console.log('私鑰請妥善保存，切勿向他人洩漏'+keypair.privateKey);
                //res.send(keypair.privateKey)
                res.send('<script>alert("註冊成功");   window.location.href = "login"; </script>').end();
                //res.send('<script>alert("私鑰請妥善保存，切勿向他人洩漏"keypair.privateKey);   window.location.href = "login"; </script>').end();
            });
        }
    }
});


router.get('/upload',async function(req, res, next){
    var risk = await cross.chainrisk(225);
    res.render('hospital/upload', {riskv:risk});
});

async function callchain(name, value, position){
    try {
        console.log('This is callchain function');
        const bytecode = fs.readFileSync('routes/chainbycode.txt', 'utf8');
        const abi = JSON.parse(fs.readFileSync('routes/chainabi.txt', 'utf8'));
        const conaddr = await chain.deploySmartContract(name, value, position, bytecode, abi);
        console.log("contractaddr:"+conaddr);
        return conaddr;
    
    } catch (err) {
        console.error('EError:'+err);
    }
}

router.post('/uploadfile', upload.single('myFile') ,function(req, res, next){
    /** When using the "single" data come in "req.file" regardless of the attribute "name". **/
    var tmp_path = req.file.path;
    console.log(req.file.originalname);

    /** The original name of the uploaded file stored in the variable "originalname". **/
    var target_path = '/usr/share/nginx/html/uploads/' + req.file.originalname;

    /** A better way to copy the uploaded file. **/
    var src = fs.createReadStream(tmp_path);
    var dest = fs.createWriteStream(target_path);
    src.pipe(dest);
    src.on('end', function() { return res.render('complete'); });
    src.on('error', function(err) { return res.render('error'); });
    req.session.filename = req.file.originalname;
    console.log('file:'+req.session.filename);

    /** Get attr */
    var cardnum = req.body.NID;
    var name = req.body.cname;
    var CID = req.body.CID;
    console.log('cardnum:'+cardnum);
    console.log('name:'+name);
    console.log('CID:'+CID);
    var attr = req.body.attr;
    var stringattr = JSON.stringify(attr);
    console.log('titletypeof:'+typeof(stringattr));
    console.log('title:'+stringattr);
    req.session.attr = stringattr;
    
    res.redirect('/hospital/deployprocess');
});

router.get('/deployprocess',async function(req, res, next){
  var db = req.con;
  var filename = req.session.filename;
  var target_path = '/usr/share/nginx/html/uploads/'+filename;
  var attr =req.session.attr;
  /** Hash Value*/
  filehashvalue=hash.filehash(target_path);
  console.log('hashvalue:'+filehashvalue);
  /** Encrype data by AES */
  //aes.enc(target_path);
  /** Deploy code in chain*/
  var addr = await callchain(filename, filehashvalue, target_path);
  console.log('chainaddr:'+addr);
  /** Insert file to DB*/
  var sql = {
      dataName: filename,
      attr: attr,
      datapath: target_path,
      createTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      hashValue: filehashvalue,
      contractaddr: addr,
  };
  db.query('INSERT INTO uploadData SET ?', sql, function(err, rows) {
      if (err) {
          console.log('DB error');
          console.log(err);
      }
  });
  res.redirect('/hospital/upload_response');
});

router.get('/upload_response', function(req, res, next){
    var db = req.con;
    db.query('SELECT * FROM uploadData',async function(err, rows) {
        if (err) {
	    console.log('DB error');
        console.log(err);
        }
        var data = rows;
        console.log(data);
        var risk = await cross.chainrisk(225);
        res.render('hospital/upload_response', { title: 'upload_response', data: data, moment: moment,riskv:risk});
    });
});

module.exports = router;
