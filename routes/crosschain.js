const fetch = require("node-fetch");
const Headers = require("node-fetch").Headers;
/*
window.onload = function () {
  console.log("長照單位");

//   var table;
//   var rowCount;
  var stompClient = null;

//   connect();
};
*/
async function launchTx(patientName, hospitalName) {
  console.log("launch tx");
  var data = {
    source: {
      chainName: "dest",
    },
    destination: {
      chainName: "src",
    },
    txType: "Req",
    txContent: "/" + patientName + "/record.pdf",
  };

  console.log(data);

  // 發起跨鏈交易
  try{
    const response = await fetch("http://140.118.9.227:9191/transaction/launch", {
      method: "POST",
      headers: new Headers({
      "Content-Type": "application/json",
      }),
      body: JSON.stringify(data),
    });
    if(response.status == 201){
      console.log('request success');
      var resdata = await response.json();
      console.log(resdata.txContent);
      return resdata.txContent;
    }else{
      console.log(response);
    }
  }catch (error){
    console.log('request error');
    console.log(error);
  }
  
}

async function sub4(){
  try{
    const response = await fetch("http://140.118.9.226:58005/consensus/rest/CrossConsensus", {
      method: "Get",
      headers: new Headers({
      "Content-Type": "application/json",
      }),
    });
    if(response.status == 200){
      console.log('request success');
      var resdata = await response.text();
      console.log(resdata);
      return resdata;
    }else{
      console.log(response);
    }
  }catch(error){
    console.log('request error');
    console.log(error);
  }
}

async function chainrisk(selurl){
  var url = "";
  if(selurl == 225){
    url = "http://140.118.9.226:5000/blockchain/smartcontract/0x418f6c4E1AF4ACb1Dfb79a26FEBAE8DD81A5f52F"
  }else if(selurl == 227){
    url = "http://140.118.9.226:5000/blockchain/smartcontract/0x22C5593339251514dcFaE16d5D1d3db882554145";
  }
  const response = await fetch(url, {
      method: "GET",
      headers: new Headers({
      "Content-Type": "application/json",
      }),
  });

  const r1 = response.clone();
  const results = await Promise.all([response.json(), r1.text()]);
  var res = JSON.stringify(results[0].result);
  console.log('rishvalue:'+res);
  return res;
}

module.exports = {launchTx,sub4,chainrisk,};