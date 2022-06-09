const fetch = require("node-fetch");
/*
window.onload = function () {
  console.log("長照單位");

//   var table;
//   var rowCount;
  var stompClient = null;

//   connect();
};
*/
function launchTx(patientName, hospitalName) {
  console.log("launch tx");
  var data = {
    source: {
      chainName: "src",
    },
    destination: {
      chainName: hospitalName,
    },
    txType: "Req",
    txContent: "/" + patientName + "/record.png",
  };

  console.log(data);

  // 發起跨鏈交易
  fetch("http://localhost:8080/transaction/launch", {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.status == 201) {
        return response.json();
      }
    })
    .then((jsonData) => {
      console.log(jsonData);

      var resContent = document.getElementById("res-content");
      resContent.innerHTML = "<p>" + jsonData.txContent + "<p/>";

    })
    .catch((err) => {
      console.log("錯誤:", err);
    });
}

module.exports = {launchTx};