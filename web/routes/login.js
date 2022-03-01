var getmac = require('getmac');
var crypto = require('crypto');
var alert = require('alert');
var moment = require('moment');
var express = require('express');
var router = express.Router();

function callMac(){
    return getmac.default();
}

function hashsha256(input){
    var hash = crypto.createHash('sha256');
    return hash.update(input).digest('hex');
}

/* GET testdb page. */
router.get('/', function(req, res, next) {
    // use login.ejs
    res.render('login', { title: 'Login'});
   
});

router.post('/UserLogin', function(req, res, next) {
    var db = req.con;	
    
    console.log(callMac());


    var workID = Number(escape(req.body.account));
    var pw = hashsha256(escape(req.body.password));
    
    var qur = db.query('Select workID, password, name from user where workID = ?', workID, function(err, rows) {
	if (err){
	    console.log('sql error');
            console.log(err);
	    res.redirect('back');
        }else{
            if(rows == false){
                console.log('account error');
		alert('account error');
	        res.redirect('back');
	    }else{
		dbpw = rows[0].password;
		console.log(dbpw);
		console.log(pw);
                if(dbpw == pw){
		    res.setHeader('Content-Type', 'application/json');
                    res.redirect('/testdb');
		}else{
		    console.log('wrong password');
		    alert('wrong password');
	            res.redirect('back');
		}
	    }
	}
    });
});

module.exports = router;
