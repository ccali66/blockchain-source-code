var multer  = require('multer');
const fs = require('fs');
const UPLOAD_PATH = './uploads'
var upload = multer({ dest: 'upload/'});
var type = upload.single('recfile');

var crypto = require('crypto');
var alert = require('alert');
var moment = require('moment');
var express = require('express');
const session = require('express-session');

var router = express.Router();

const hash = require("./hashfunc.js");
const aes = require("./pdfenc.js");
const chain = require("./blockchain.js");
const { endianness } = require('os');

function hashsha256(input){
    var hash = crypto.createHash('sha256');
    return hash.update(input).digest('hex');
}

router.use(session({
    secret: 'filepath',
    saveUninitialized: false,
    resave: true, 
    })
);

/* GET testdb page. */
router.get('/', function(req, res, next) {
    var db = req.con;

    db.query('SELECT * FROM user', function(err, rows) {
        if (err) {
	    console.log('DB error');
        console.log(err);
        }
        var data = rows;
        //console.log(data);

        // use index.ejs
        res.render('testdb', { title: 'Test', data: data});
    });
   
});

router.get('/pdfopen', function(req, res, next) {
    try{
        const fileName = 'test.pdf'
        const fileURL = 'uploads/test.pdf'
        const stream = fs.createReadStream(fileURL);

        //res.setHeader('Content-Disposition', 'attachment;filename=uploads/test.pdf')
        res.setHeader('Content-disposition', 'inline; filename="' + fileName + '"');
        res.setHeader('Content-type', 'application/pdf');
        stream.pipe(res);
    }catch(e){
        console.log(e);
        res.status(500).end();
    }
});


router.get('/add', function(req, res, next){
    res.render('testAdd', {title: 'Add Test'});
});

router.get('/tdir', function(req, res, next){
    res.render('h/testdir', {title: 'Add Test'});
});

function sleep(delay) {
    var start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {
        continue; 
    }
}

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

router.post('/fileprocess', upload.single('myFile') ,function(req, res, next){
      /** When using the "single" data come in "req.file" regardless of the attribute "name". **/
      var tmp_path = req.file.path;

      /** The original name of the uploaded file stored in the variable "originalname". **/
      var target_path = 'uploads/' + req.file.originalname;

      /** A better way to copy the uploaded file. **/
      var src = fs.createReadStream(tmp_path);
      var dest = fs.createWriteStream(target_path);
      src.pipe(dest);
      src.on('end', function() { return res.render('complete'); });
      src.on('error', function(err) { return res.render('error'); });
      req.session.filename = req.file.originalname;
      
      /** Get attr */
      /*
      var attr = req.body.attr;
      var stringattr = JSON.stringify(attr);
      console.log('titletypeof:'+typeof(stringattr));
      console.log('title:'+stringattr);
      */
      res.redirect('/testdb/encprocess');
});

router.get('/encprocess',async function(req, res, next){
    var db = req.con;
    var filename = req.session.filename;
    var target_path = 'uploads/'+filename;
    var attr ='{1,2,3}';
    /** Hash Value*/
    filehashvalue=hash.filehash(target_path);
    console.log('hashvalue:'+filehashvalue);

    /** Encrype data by AES */
    aes.enc(target_path);
    
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
    console.log('sql:'+JSON.stringify(sql));
    
    db.query('INSERT INTO uploadData SET ?', sql, function(err, rows) {
        if (err) {
            console.log('DB error');
            console.log(err);
        }
    });
    
    res.redirect('/testdb');
  });

router.get('/decprocess',function(req, res, next){
    console.log('dec:'+req.session.filetarget);
    aes.dec(req.session.filetarget);
    res.redirect('/testdb');
  });

router.post('/add/UserAdd', function(req, res, next) {
    var db = req.con;	
    console.log(moment(new Date()).format('YYYY-MM-DD HH:mm:ss'));
    
    var workID = Number(escape(req.body.workID));
    var name = escape(req.body.name);
    var password = hashsha256(escape(req.body.password));
    var password2 = hashsha256(escape(req.body.password2));
    var phoneNum = escape(req.body.phoneNum);
    var email = escape(req.body.email);
    var title = escape(req.body.title);
    var gender = escape(req.body.gender);
    var years = Number(escape(req.body.years));
    var attr = escape(req.body.attr);
    var pubKey = escape(req.body.pubKey);
    var hashValue =  escape(req.body.hashValue);

    if (password != password2){
    	console.log('password is different');
	alert('password is different');
        res.redirect('back');
    }else{
        var sql = {
            workID: workID,
            name: name,
            password: password,
            phoneNum: phoneNum,
	        email: email,
            title: title,
            gender: gender,
            years: years,
            attr: attr,
            pubKey: pubKey,
            hashValue: hashValue,
            createTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            modifyTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        };
        console.log('sql:');
        console.log(sql);
    
        var qur = db.query('INSERT INTO user SET ?', sql, function(err, rows) {
            if (err){
	        console.log('sql error');
                console.log(err);
            }
	        console.log(qur);
            res.setHeader('Content-Type', 'application/json');
            res.redirect('/testdb');
        });
    }
});

module.exports = router;