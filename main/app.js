const Poloniex = require('poloniex-api-node');
const SocksProxyAgent = require('socks-proxy-agent');
const readConfig = require('edit-json-file');
const apiKey = 'E5QCTUGZ-565T4YH8-9JH9N1SX-NGBTXRC2';
const secretKey = 'be4fad792bb3454c0a8251e53aecbdff8cc44621b20cb010f7634cc5328132fe609c47e67cc3767ab59c44b524c4200caa61b54c112b7d60eaddc2bf687c5a1c';

// read write file
const fs = require('fs');

// https://www.socks-proxy.net/
// const proxyServer = 'socks://47.90.?102.176:38111';
// const proxyServer = 'socks://138.68.59.36:22009';
const proxyServer = 'socks://128.68.167.210:9050';
// const proxyServer = 'socks://47.75.16.250:1080';

// let poloniex = new Poloniex(apiKey, secretKey, {agent: new SocksProxyAgent(proxyServer), socketTimeout : 120000});
let poloniex = new Poloniex(apiKey, secretKey, {socketTimeout : 120000});

var prefix = __dirname + '/data/'
var namefile = prefix + Math.round((new Date()).getTime()/1000) + '.txt';

var maxValue = null;
var currentValue = 0;
var minValue = null;
var buyValue = 0;
var buyPercent = 0.0005;
var sellPercent = 0.0005;
var sellBuyPercent = 0.005;
const spaceCanBuy = 0.02;
var money = 45;
var coins = 0;
const fee = 0.03;
const canBuyPercent = 0.012;
var arrValue = [];
const defaultSizeArr = 20;
var orderNumber = null;

var nameCoin = 'ETC';
var channelSubcribe = `USDT_${nameCoin}`;
var flagReset = true;
const stopBuyPercent = buyPercent * 3;
var flagTrade = true;
var watchValue = '';
var flagSellProcess = false;
const countASC = 20;
const countDESC = 20;
var valASC = 0;
var valDESC = 0;
var flagInitArray = false;

process.on("uncaughtException", (err) => {

	flagSellProcess = false;
	flagInitArray = true;
});

Promise.prototype.catch = function(){
        console.log('catch promise');
        flagSellProcess = false;
		flagInitArray = true;
    };

// save file inconfig
var prefixFile = __dirname + '/config/config.json';
var file = readConfig(prefixFile);
const keyFile = 'BuyValue';

// read config
poloniex.on('readConfigVariable', () => {

	// // load value from json
	// if (file.data['buyPercent'] != undefined) {
	// 	buyPercent =  parseFloat(file.data['buyPercent']);
	// } else {
	// 	file.set('buyPercent', buyPercent);
	// 	file.save();
	// }

	// if (file.data['sellPercent'] != undefined) {
	// 	sellPercent =  parseFloat(file.data['sellPercent']);
	// } else {
	// 	file.set('sellPercent', sellPercent);
	// 	file.save();
	// }

	// if (file.data['orderNumber'] != undefined) {
	// 	orderNumber =  parseFloat(file.data['orderNumber']);
	// } else {
	// 	if (orderNumber != null) {
	// 		orderNumber = 0;
	// 		file.set('orderNumber', orderNumber);
	// 		file.save();
	// 	}
	// }

	// if (maxValue == null && file.data['maxValue'] != undefined) {
	// 	maxValue =  parseFloat(file.data['maxValue']);
	// } else {
	// 	file.set('maxValue', maxValue);
	// 	file.save();
	// }

	// if (minValue == null && file.data['minValue'] != undefined) {
	// 	minValue =  parseFloat(file.data['minValue']);
	// } else {
	// 	file.set('minValue', minValue);
	// 	file.save();
	// }

	
});

poloniex.emit('readConfigVariable');

// init event
poloniex.on('readSaveBuyConfig', (value) => {

	if (value == null) {

		// load value from json
		if (file.data[keyFile] != undefined) {
			buyValue =  parseFloat(file.data[keyFile]);
		}
	} else {
		file.set(keyFile, value);
		file.save();
	}
});

// init
poloniex.emit('readSaveBuyConfig', null);


// write balance
setInterval(() => {

	var dateCurrent = new Date();

	if (dateCurrent.getHours() === 23) {
		var filenamesave = prefix + 'log_Balance.txt';
		fs.appendFileSync(filenamesave, 'Date : ' +  new Date().toISOString() + ' === balanceUSDT : ' + balanceUSDT + ' || balanceCoin : ' + balanceCoin + '\r\n', (err) => {
		  		if(err) {
		  			poloniex.unSubscribe(channelSubcribe);
		  			poloniex.closeWebSocket();
		  			throw err;
		  		}
		  		// console.log('Save');
		  	});
	}

	
}, 360000);

// 549$
var balanceUSDT = 0;
var balanceCoin = 0;

poloniex.on('refreshBalance', () => {

	poloniex.returnBalances((err, data) => {
	  if (!err) {

	  	if (minValue == null) {
	  		minValue = 0;
	  		maxValue = 0;
	  	}

	  	// console.log('in returnBalances');
	  	balanceUSDT = data.USDT;
	  	balanceCoin = data[nameCoin];
	  	let valWillBuy = minValue + (minValue * buyPercent);
	  	let calcValSell = maxValue - (maxValue * sellPercent);
	  	console.log('================================');
	  	console.log('balanceUSDT : ' + balanceUSDT);
	  	console.log('balanceCoin : ' + balanceCoin);
	  	console.log('maxValue : ' + maxValue);
	  	console.log('minValue : ' + minValue);
	  	console.log('currentValue : ' + currentValue);
	  	console.log('buyPercent : ' + buyPercent);
	  	console.log('sellPercent : ' + sellPercent);
	  	console.log('buyValue : ' + buyValue);
	  	console.log('value will buy : ' + valWillBuy);
		console.log('value will sell : ' + calcValSell);
	  	console.log('================================');
	  } 
	});
});

poloniex.emit('refreshBalance');

// region reset counter
poloniex.on('refreshCounterBuy', () => {

	// console.log('refreshCounterBuy');
	maxValue = 0;
	minValue = 0;
});

// get trade history
poloniex.on('initArray', () => {
	poloniex.returnTradeHistory(channelSubcribe, null, null, 100, (err, data) => {

		console.log('INIT ARRAY');
		console.log(err);
		data.forEach((item) => {

			let ratePrice = parseFloat(item.rate);
			// check min max
		  	if (maxValue == null) {
		  		maxValue = 0;
		  	}

		  	if (minValue == null) {
		  		minValue = 0;
		  	}

		  	if (currentValue == 0) {
		  		maxValue = ratePrice;
				minValue = ratePrice;
		  	}

		  	currentValue = ratePrice;

		  	// get max value and min value
		  	if (currentValue > maxValue) {
		  		maxValue = currentValue;
		  	}

		  	if (currentValue < minValue) {
		  		minValue = currentValue;
		  	}

		  	calcASCorDESC(currentValue);
		});

		flagInitArray = true;
	});
});

poloniex.emit('initArray');

poloniex.on('open', () => {
  console.log('WebSocket connection is open.');

 //  	setInterval(() => {
	// 	poloniex.emit('refreshBalance');
	// 	poloniex.emit('readConfigVariable');
	// }, 20000);

	setInterval(() => {

		let date = new Date();
		// flagInitArray = false;
		// check minute
		let minute = date.getHours();
		let calMinute = minute/6;
		if (calMinute >= 0 && Math.floor(calMinute) === +calMinute) {
			flagInitArray = false;
			poloniex.emit('refreshCounterBuy');
			poloniex.emit('initArray');
		}
	}, 3600000);
});

// clear interval
poloniex.on('eventClearInterval', () => {
	for (var i = 1; i < 99999; i++)
        window.clearInterval(i);
});

poloniex.on('error', (error) => {
  console.log(error);
  poloniex.emit('eventClearInterval');
});

poloniex.on('close', (error) => {
  console.log('WebSocket close ');
  console.log(error);
  poloniex.emit('eventClearInterval');
});

poloniex.subscribe('ticker');
poloniex.subscribe(channelSubcribe);
poloniex.on('message', (channelName, data) => {

  if (channelName === 'ticker' && data.currencyPair == channelSubcribe && flagInitArray) {

  		if (watchValue == '') {
  			console.log(data);
  		}

  		watchValue = 'watch';

  	//if (balanceUSDT > 1 || balanceCoin > 0.005) {
	  		let highestBid = parseFloat(data.highestBid);
	  		let lowestAsk = parseFloat(data.lowestAsk);
		  // check date write
		  	
		  	//console.log(`lowestAsk : ${lowestAsk}`);
		  	let lastVal = highestBid;

		  	if (balanceUSDT > 5) {
		  		lastVal = lowestAsk;
		  	} else if (balanceCoin > 0.0005) {
		  		lastVal = highestBid;
		  	}

		  	console.log(`LAST VALUE : ${lastVal}`);
		  	
		  	

		  	// reset value when sold

		  	// check min max
		  	if (maxValue == null) {
		  		maxValue = 0;
		  	}

		  	if (minValue == null) {
		  		minValue = 0;
		  	}

		  	if (currentValue == 0) {
		  		maxValue = lastVal;
				minValue = lastVal;
		  	}

		  	currentValue = lastVal;

		  	// get max value and min value
		  	if (currentValue > maxValue) {
		  		maxValue = currentValue;
		  	}

		  	if (currentValue < minValue) {
		  		minValue = currentValue;
		  	}

		  	// check and reset ordernumber
		  	if (balanceCoin >= 0.0005) {
		  		orderNumber = 0;
		  	}

		  	let statusASC = calcASCorDESC(currentValue);
		  	// let valStopBuy = minValue + (minValue * stopBuyPercent);
		  	let valBetween = currentValue - minValue;
		  	// let flagStopBuy = maxValue - minValue >= minValue * stopBuyPercent;
		  	let endBuyValue = valBetween < (minValue * stopBuyPercent);
		  	let startBuyValue = valBetween >= (minValue * buyPercent);
		  	let valSpaceBuy = maxValue - (maxValue * spaceCanBuy);
		  	let flagCanBuy = currentValue <= valSpaceBuy;
		  	console.log('@@@_STATUS ASC_@@@ : ' + statusASC);
		  	console.log(`startBuyValue : ${minValue + (minValue * buyPercent)}`);
		  	console.log(`endBuyValue : ${minValue + (minValue * stopBuyPercent)}`);
		  	// console.log(`arrValue : ${arrValue}`);
		  	// console.log(`flagBuy : ${!flagStopBuy}`);
		  	if (statusASC != null) {

		  		if (statusASC) {
		  			valASC += 1;
		  			valDESC = 0;
		  		} else if (!statusASC) {
		  			valASC = 0;
		  			valDESC += 1;
		  		}

		  		// let flagASCBuy = valASC == countASC;

		  		console.log(`valASC : ${valASC}`);
		  		console.log(`valDESC : ${valDESC}`);

		  		if (startBuyValue) {
		  			console.log(`balanceUSDT > 5 || orderNumber != 0 : ${balanceUSDT > 5 || orderNumber != 0}`);
		  			console.log(`endBuyValue : ${endBuyValue}`);
		  			console.log(`flagSellProcess : ${flagSellProcess}`);
		  			console.log(`valSpaceBuy : ${valSpaceBuy}`);
		  			console.log(`flagCanBuy : ${flagCanBuy}`);
		  			console.log(`flagASCBuy : ${valASC == countASC}`);
		  		}

		  		// check buy
			  	if ((balanceUSDT > 5 || orderNumber != 0) && startBuyValue && endBuyValue
			  										&& !flagSellProcess && flagCanBuy && valASC == countASC) {
			  		// console.log('buy value : ' + currentValue + ' | min value : ' + minValue);
			  		buyValue = currentValue;
			  		flagSellProcess = true;

					poloniex.emit('executeBuy', buyValue);
			  	}

			  	// check sell
			  	// console.log('buyValue : ' + buyValue + ' | currentValue - buyValue : ' + (currentValue - buyValue)
			  	// 											+ " || (buyValue * sellPercent) : " + (buyValue * sellPercent));

			  	//let calcValSell = parseFloat(currentValue) + (parseFloat(currentValue) * parseFloat(sellPercent));
			  	let calcValSell = maxValue - (maxValue * sellPercent);
			  	let calcValBuy = buyValue + (buyValue * sellBuyPercent);
			  	// let flagDESCSell = valDESC == countDESC;
			  	if (buyValue > 0 && balanceCoin >= 0.0005
			  		&& calcValSell >= currentValue && currentValue >= calcValBuy && !flagSellProcess && valDESC == countDESC) {

				  	flagSellProcess = true;

					poloniex.emit('orderSell', currentValue);
			  	}
		  	}
  }
});

// open websocket
poloniex.openWebSocket({ version: 2 });

poloniex.on('callTrade', (method, data, isBuy) => {

	
  	poloniex.emit('refreshBalance');
  	//save buy value
	poloniex.emit('readSaveBuyConfig', buyValue);
	poloniex.emit('refreshBalance');
	poloniex.emit('readConfigVariable');

	if (isBuy) {
		if (data.resultingTrades.length == 0) {
			orderNumber = data.orderNumber;
		} else {
			orderNumber = 0;
		}
	}
  	
  	console.log(method);
  	console.log(data);

});



poloniex.on('executeBuy', (value) => {
	console.log('executeBuy');


	// number coins has bought
	// get coin by when - fee
	//var m = this.balanceUSDT - (this.balanceUSDT * fee);

	let defaultBuyValue = value * 100;
	let incMoney = 0.00009;
	let valBuy = value + (value * incMoney);
	balanceCoin = balanceUSDT/(valBuy + (valBuy * incMoney));

	// order Buy
	if (orderNumber != null && orderNumber != 0) {
		poloniex.moveOrder(orderNumber, defaultBuyValue, balanceCoin, null, null, null, (err, data) => {
			flagSellProcess = false;
		  if (!err) {

		  	poloniex.emit('callTrade', '****MOVE ORDER****', data, true);
		  } 
		  	else throw err;
		});
	} else {
		poloniex.buy('USDT_' + nameCoin, valBuy, balanceCoin, null, null, null, (err, data) => {

			flagSellProcess = false;
		  if (!err) {
		  	poloniex.emit('callTrade', '****BUY ORDER****', data, true);
		  } 
		  	else throw err;
		});
	}
	

	balanceCoin = 0;
	balanceUSDT = 0;
});

poloniex.on('orderSell', (value) => {
	console.log('executeSell');
	// var m = balanceCoin * value;
	// balanceUSDT = m - (m * fee);
	// default sell
	let defaultSell = 1;
	let incMoney = 0.00009;
	let sellVal = value - (value * incMoney);
	// set min value
	//minValue = value;
	console.log(`defaultSell : ${defaultSell}`);
	console.log(`balanceCoin : ${balanceCoin}`);
	// console.log(`flagASCBuy : ${valASC == countASC}`);

	// order Buy
	poloniex.sell('USDT_' + nameCoin, defaultSell, balanceCoin, null, null, null, (err, data) => {
	  if (!err) {
	  	poloniex.emit('callTrade', '****SELL ORDER****', data, false);
	  	minValue = value;
	  } else {
	  	throw err;
	  }

	  flagSellProcess = false;
	});

	balanceCoin = 0;
	balanceUSDT = 0;
});

function calcASCorDESC(val) {

	let lengArr = arrValue.length;

	if (lengArr == defaultSizeArr) {

		// remove first value
		arrValue.shift();

		// add new value
		arrValue.push(val);

		let rightVal = 0;
		let leftVal = 0;
		// calc
		for(var i = 0; i < lengArr; i++) {

			if (i < (lengArr/2)) {
				rightVal += parseFloat(arrValue[i]);
			} else {
				leftVal += parseFloat(arrValue[i]);
			}
		}

		// check ASC or DESC
		// true if ASC, false if DESC
		if (rightVal < leftVal) {
			return true;
		} else if (rightVal > leftVal) {
			return false;
		}
	} else {
		arrValue.push(val);
	}

	return null;
}
