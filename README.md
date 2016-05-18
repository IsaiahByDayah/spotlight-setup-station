# spotlight-setup-station

##### Raspberry Pi systems that communicate with [Spotlight Wearables](https://github.com/jordankid93/spotlight-wearable) for tracking user's experiences through a museum

### Description:
A spotlight setup station is a Node.js application you can run on any compatible device such as a laptop, desktop or microcomputer that will act as the beginning pairing station in the Spotlight museum experience. The setup stations queries the backend for users waiting to recieve a wearable device, syncs a new wearable device to that user's profile, and gets the user started on their way.

### Pre-requisites:
- OS
  - [Ubuntu Mate 15.10.3+ for Raspberry Pi](https://ubuntu-mate.org/raspberry-pi/)[Tested]
- Hardware
  - Bluetooth Low-Energy Adapter
  - Internet Connection
- Software
  - Node.js


### Libraries used:
- Noble ([Source](https://github.com/sandeepmistry/noble))
- feather-ble ([Source](https://github.com/jordankid93/feather-ble))
- Underscore ([Source](http://underscorejs.org))

### Usage:
To get up and running with a Spotlight exhibit, clone this repo on the device you want to use and install the required node modules:
```
git clone https://github.com/jordankid93/spotlight-setup-station.git
cd spotlight-setup-station
npm install
```

Once modules have been installed, edit the config.js file so that the setup station is making the appropriate calls with the backend.

Once done, simply run the application via npm or node directly
```
npm start // Via npm
node exhibit.js // Node directly
```

You will be prompted with all users waiting to recieve a device. Place a "fresh" wearable device close to the setup station and enter the user you want to pair with that device. Once paired, the setup station will notify you as well as signal on the device that the pairing process is complete.
