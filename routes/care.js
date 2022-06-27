var fs = require('fs');
var crypto = require('crypto');
var moment = require('moment');
var express = require('express');
var session = require('express-session');
const keylib = require("./ether_createkey.js");
const cross = require("./crosschain.js");
var svgcaptcha = require('svg-captcha');
var getmac = require('getmac');
var router = express.Router();

function callMac(){
    return getmac.default();
}

router.use(session({
    secret: 'secret',
    saveUninitialized: false,
    resave: true, 
    })
);

function hashsha256(input){
    var hash = crypto.createHash('sha256');
    return hash.update(input).digest('hex');
}

/* GET testdb page. */
/*router.get('/', function(req, res, next) {

    var db = req.con;
    var data = "";
    //res.send('respond with a test');

    db.query('SELECT * FROM user', function(err, rows) {
        if (err) {
	    console.log('this is test db error');
            console.log(err);
        }
        var data = rows;

        // use index.ejs
        res.render('testdb', { title: 'Test', data: data});
    });
   
});
*/

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
    res.render('care/c_login', {title: 'Add Test'});
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
                            res.redirect('medcase');
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
    res.render('care/c_register', {title: 'register'});
});

router.get('/medcase',async function(req, res, next){
    var risk = await cross.chainrisk(227);
    res.render('care/medcase', {title: 'medcase', riskv: risk});
});

router.get('/medcase_read',async function(req, res, next){
    var risk = await cross.chainrisk(227);
    res.render('care/medcase_read', {title: 'medcase_read', riskv: risk});
});

router.post('/crosschain',async function(req, res, next){
    var db = req.con;
    var IDnum = req.body.IDnum;
    var name = req.body.name;
    var chainID = req.body.chainID;
    //store in DB response
    var sql = {
        PatientName: name,
        cardNum: IDnum,
        Result: 2,
        dataName: 'record.pdf',
        file: 'wait',
        createTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    };

    console.log('sql:');
    console.log(sql);
    
    var qur = db.query('INSERT INTO Response SET ?', sql, function(err, rows) {
        if (err){
            console.log('sql error');
            console.log(err);
        }
        console.log(qur);
    });
    res.send('<script>alert("正在進行跨鏈請求，請等待數分鐘");   window.location.href = "medcase_response"; </script>');

    //call sub3,4 API
    var resub3 = await cross.launchTx(IDnum,chainID);
    var resub4 = await cross.sub4();
    //store in DB (sub3res, sub4res)
    var sql = {
        file: resub3,
        Result: resub4,
      };
    var qur = db.query('UPDATE Response SET ?,  WHERE cardNum=?', [sql ,IDnum], function(err, rows) {
        if (err) {
            console.log('DB error');
            console.log(err);
        }
        console.log(qur);
      });
    //res.redirect('medcase_response');
});


/*router.get('/medcase_response', function(req, res, next){
    res.render('care/medcase_response', {title: 'medcase_response'});
});
*/
router.get('/medcase_response',async function(req, res, next){
    var db = req.con;
    db.query('SELECT * FROM Response',async function(err, rows) {
        if (err) {
	    console.log('DB error');
        console.log(err);
        }
        var data = rows;
        console.log(data);
        var risk = await cross.chainrisk(227);
        res.render('care/medcase_response', { title: 'medcase_response', data: data, moment: moment, riskv: risk});
    });
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
        res.send('<script>alert("password is different");   window.location.href = "register"; </script>').end();
    }else{
	    console.log('password correct');
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

module.exports = router;
