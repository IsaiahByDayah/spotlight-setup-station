var noble = require('noble');
var _ = require('underscore');
var Feather = require('feather-ble');
var prompt = require('prompt');

var CONSTANTS = require('./constants.js');

var socket = require('socket.io-client')(CONSTANTS.SERVER_ENDPOINT);

//console.log(wearable);

// console.log(Feather);
// console.log(Feather().isFeather);

var currentUser = null;

socket.on('connect', function(){
	console.log("Setup Station connected to socket.");

	// Request to get users waiting to recieve wearable
	socket.emit("RequestWaitingUsers", {});

	// Use testing list of waiting users
	// handleWaitingUsersResponse([
	// 	{
	// 		name: "Isaiah Smith",
	// 		userID: "abc123"
	// 	}
	// ]);
});

// Response for users waiting to get wearable
socket.on('WaitingUsersResponse', function(data){
	handleWaitingUsersResponse(data);
});

socket.on('disconnect', function(){
	// MARK: Not sure what to do in this case
});

noble.on('discover', function(peripheral) {

	if (CONSTANTS.LOG_ALL_FOUND_DEVICES){
		logPeripheral(peripheral);
	}

  	// Check to see if peripheral is a wearable
  	if (new Feather().isFeather(peripheral)) {
	// if (Feather.isFeather(peripheral)) {

		// Temp stop scanning
		noble.stopScanning();

		if (CONSTANTS.LOG_WEARABLE_DEVICES && !CONSTANTS.LOG_ALL_FOUND_DEVICES){
			logPeripheral(peripheral);
		}

		console.log("Feather Found...");

		console.log("RSSI: " + peripheral.rssi);

		// Only connect if within range
		if (peripheral.rssi < CONSTANTS.MINIMUM_RSSI_TO_CONNECT) {
			console.log("Feather To far away from setup station.");
			return;
		}

		console.log("\tCreating new Wearable object from feather...");

		var feather = new Feather({
			peripheral: peripheral
		});

		console.log("\t\tAdding event listeners...");
		feather.on("ready", function(err){

			if (err) {
				console.log("\t\tError on ready: " + err.message);
				return;
			}

			console.log("\t\tFeather ready!");

			sendMessage(feather, "UserID", {
				request: "GET"
			});
		});

		feather.on("message", function(msg){

			if (isJsonString(msg)){
				msg = JSON.parse(msg);
				// console.log("Converted: ", msg);
			}
			else {
				// Message was not acceptable JSON
				// Unable to tell what im returning an error to at this point soooo.... doing nothing for now?
				return;
			}

			switch(msg.msgType){
				case "UserID":
					userIDRecieved(msg);
					break;
				default:
					// Unknown message type
					break;
			}

			function userIDRecieved(message){
				var userID = message.userID;

				console.log("Recieved UserID: " + userID);

				if (userID == "") {
					console.log("Fresh wearable found. Setting up wearable for " + currentUser.name +  "...");
					sendMessage(feather, "UserID", {
						request: "SET",
						userID: currentUser.userID
					});
				}

				else if (userID == currentUser.userID) {
					// All setup!
					socket.emit("UserSetupWithWearable", {
						userID: currentUser.userID
					});
					console.log("Wearable setup for " + currentUser.name + ". Please hand them the wearable...");
					feather.disconnect();
					return;
				}

				else {
					console.log("Wearable setup for another user (userId: " + userID + "). Please place a fresh wearable on the setup station and try again.");
					feather.disconnect();
					return;
				}
			}

			function isJsonString(str) {
				try {
					JSON.parse(str);
				} catch (e) {
					return false;
				}
				return true;
			}
		});

		feather.on("disconnect", function(err){

			if (err) {
				console.log("\t\tError on disconnect: " + err.message);
				return;
			}

			console.log("\t\tWearable disconnected!");
		});

		console.log("\t\tSetting up wearable...");
		feather.setup();
	}
});

function handleWaitingUsersResponse(data) {

	clearConsole();

	_.each(data, function(user, index){
		console.log(index + ") " + user.name);
	});

	console.log("\nPlease select a user to setup...\n");

	prompt.start();

	prompt.get(['userIndex'], function (err, result) {
		//
		// Log the results.
		//
		console.log('Command-line input received:');
		console.log('  userIndex: ' + result.userIndex);

		var userIndex = parseInt(result.userIndex);

		if (0 >= userIndex && userIndex < data.length){
			currentUser = data[userIndex];
		}
		else {
			// User Index Out of bounds
			return;
		}

		// Move this to on recieved users waiting socket response...
		if (noble.state == "poweredOn") {
			console.log("Setup Station starting to scan...");
			noble.startScanning([], true);
		}
		noble.on('stateChange', function(state) {
			console.log("Noble state changed...");
			if (state === 'poweredOn') {
				console.log("Setup Station starting to scan...");
				noble.startScanning([], true);
			} else {
				noble.stopScanning();
				console.log("Setup Station stopped scanning.");
			}
		});
	});
}

function clearConsole(){
	console.log('\033c');
}

function sendMessage(feather, msgType, data){
	var message = JSON.stringify({
		msgType: msgType,
		data: data
	});

	feather.sendMessage(message);
}

function logPeripheral(peripheral){
	console.log('peripheral discovered - ' + peripheral.id +
			  ' with address <' + peripheral.address +  ', ' + peripheral.addressType + '>,' +
			  ' connectable ' + peripheral.connectable + ',' +
			  ' RSSI ' + peripheral.rssi + ':');
	console.log('\thello my local name is:');
	console.log('\t\t' + peripheral.advertisement.localName);
	console.log('\tcan I interest you in any of the following advertised services:');
	console.log('\t\t' + JSON.stringify(peripheral.advertisement.serviceUuids));

	var serviceData = peripheral.advertisement.serviceData;
	if (serviceData && serviceData.length) {
		console.log('\there is my service data:');
		for (var i in serviceData) {
			console.log('\t\t' + JSON.stringify(serviceData[i].uuid) + ': ' + JSON.stringify(serviceData[i].data.toString('hex')));
		}
	}
	if (peripheral.advertisement.manufacturerData) {
		console.log('\there is my manufacturer data:');
		console.log('\t\t' + JSON.stringify(peripheral.advertisement.manufacturerData.toString('hex')));
	}
	if (peripheral.advertisement.txPowerLevel !== undefined) {
		console.log('\tmy TX power level is:');
		console.log('\t\t' + peripheral.advertisement.txPowerLevel);
	}
}


