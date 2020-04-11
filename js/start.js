'use strict';

//var vConsole = new VConsole();

const UUID_SERVICE_ACCEL = "e95d0753-251d-470a-a062-fa1922dfa9a8";
const UUID_CHAR_ACCEL = "e95dca4b-251d-470a-a062-fa1922dfa9a8";
const UUID_SERVICE_UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UUID_CHAR_UART_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const UUID_CHAR_UART_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const POWER_MAX = 50;
const CHECK_INTERVAL = 50;

var vue_options = {
    el: "#top",
    data: {
        progress_title: '',

        characteristics : new Map(),
        deviceName: '',
        isConnected : false,
        encoder : new TextEncoder('utf-8'),
        control_pressed : { top: false, down: false, left: false, right: false, a: false, b: false, x: false, y: false },
        power_prev: { right: 0, left: 0 },
        accel_x: 0,
        accel_y: 0,
        accel_z: 0,
    },
    computed: {
    },
    methods: {
        ring_connect: async function(){
            var device = await navigator.bluetooth.requestDevice({
                filters: [{
                   namePrefix: "BBC micro:bit" 
                }],
                optionalServices: [
                    UUID_SERVICE_UART,
                    UUID_SERVICE_ACCEL,
                ]
            });
            console.log("requestDevice OK");
            this.characteristics.clear();
            this.bluetoothDevice = device;
            this.bluetoothDevice.addEventListener('gattserverdisconnected', (event) => {
                this.onDisconnect(event)
            });

            var server = await this.bluetoothDevice.gatt.connect();
            console.log('Execute : getPrimaryService');
            var service = await server.getPrimaryService(UUID_SERVICE_UART);
            console.log('Execute : getCharacteristic');
        
            await this.setCharacteristic(service, UUID_CHAR_UART_TX);
            await this.setCharacteristic(service, UUID_CHAR_UART_RX);
            await this.startNotify(UUID_CHAR_UART_RX);

            var service = await server.getPrimaryService(UUID_SERVICE_ACCEL);
            console.log('Execute : getCharacteristic');
        
            await this.setCharacteristic(service, UUID_CHAR_ACCEL);
            await this.startNotify(UUID_CHAR_ACCEL);

            this.deviceName = this.bluetoothDevice.name;
            this.isConnected = true;

            this.ring_start();
        },
        onDisconnect: function(event){
            console.log('onDisconnect');
            this.isConnected = false;
            this.characteristics.clear();
        },
        startNotify(uuid) {
            if( this.characteristics.get(uuid) === undefined )
                throw "Not Connected";
        
            console.log('Execute : startNotifications');
            return this.characteristics.get(uuid).startNotifications();
        },
        async setCharacteristic(service, characteristicUuid) {
            var characteristic = await service.getCharacteristic(characteristicUuid)
            console.log('setCharacteristic : ' + characteristicUuid);
            this.characteristics.set(characteristicUuid, characteristic);
            var _this_ = this;
            characteristic.addEventListener('characteristicvaluechanged', function(event){ _this_.onDataChanged(event); });
//            characteristic.addEventListener('characteristicvaluechanged', this.onDataChanged);
            return service;
        },
        writeChar(uuid, array_value) {
            if( this.characteristics.get(uuid) === undefined )
                throw "Not Connected";
        
//            console.log('Execute : writeValue');
            let data = Uint8Array.from(array_value);
            return this.characteristics.get(uuid).writeValue(data);
        },
        onDataChanged(event){
            console.log('onDataChanged');
            let characteristic = event.target;
            console.log(characteristic.uuid);
    
            var value = characteristic.value;
            switch(characteristic.uuid){
                case UUID_CHAR_ACCEL: {
                    this.accel_x = value.getInt16(0, true);
                    this.accel_y = value.getInt16(2, true);
                    this.accel_z = value.getInt16(4, true);
                    break;
                }
            }
        },
        ring_start: async function(){
            await this.check_gamepad();
        },
        check_gamepad: async function(){
            var gamepadList = navigator.getGamepads();
            for(var i = 0; i < gamepadList.length; i++){
                var gamepad = gamepadList[i];
                if(gamepad){
                    var power_right = Math.floor(-gamepad.axes[1] * POWER_MAX);
                    if( this.power_prev.right != power_right ){
                        this.power_prev.right = power_right;
                        var cmd = 'r' + power_right + '.';
//                        console.log(cmd);
                        await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode(cmd));
                    }
                    var power_left = Math.floor(-gamepad.axes[3] * POWER_MAX);
                    if( this.power_prev.left != power_left ){
                        this.power_prev.left = power_left;
                        var cmd = 'l' + power_left + '.';
//                        console.log(cmd);
                        await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode(cmd));
                    }

                    if( gamepad.buttons[0].pressed ){
                        if( !this.control_pressed.a ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('i3.'));
                            this.control_pressed.a = true;
                        }
                    }else{
                        if( this.control_pressed.a ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('i0.'));
                            this.control_pressed.a = false;
                        }
                    }
                    if( gamepad.buttons[1].pressed ){
                        if( !this.control_pressed.b ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('i4.'));
                            this.control_pressed.b = true;
                        }
                    }else{
                        if( this.control_pressed.b ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('i0.'));
                            this.control_pressed.b = false;
                        }
                    }
                    if( gamepad.buttons[2].pressed ){
                        if( !this.control_pressed.x ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('i1.'));
                            this.control_pressed.x = true;
                        }
                    }else{
                        if( this.control_pressed.x ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('i0.'));
                            this.control_pressed.x = false;
                        }
                    }
                    if( gamepad.buttons[3].pressed ){
                        if( !this.control_pressed.y ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('i2.'));
                            this.control_pressed.y = true;
                        }
                    }else{
                        if( this.control_pressed.y ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('i0.'));
                            this.control_pressed.y = false;
                        }
                    }
                    if( gamepad.buttons[12].pressed ){
                        if( !this.control_pressed.top ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('s5.'));
                            this.control_pressed.top = true;
                        }
                    }else{
                        this.control_pressed.top = false;
                    }
                    if( gamepad.buttons[13].pressed ){
                        if( !this.control_pressed.down ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('S5.'));
                            this.control_pressed.down = true;
                        }
                    }else{
                        this.control_pressed.down = false;
                    }
                    if( gamepad.buttons[14].pressed ){
                        if( !this.control_pressed.left ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('T90.'));
                            this.control_pressed.left = true;
                        }
                    }else{
                        this.control_pressed.left = false;
                    }
                    if( gamepad.buttons[15].pressed ){
                        if( !this.control_pressed.right ){
                            await this.writeChar(UUID_CHAR_UART_TX, this.encoder.encode('t90.'));
                            this.control_pressed.right = true;
                        }
                    }else{
                        this.control_pressed.right = false;
                    }

                    break;
                }
            }

            setTimeout(this.check_gamepad, CHECK_INTERVAL);
        }
    },
    created: function(){
    },
    mounted: function(){
        proc_load();

        setInterval
    }
};
vue_add_methods(vue_options, methods_utils);
var vue = new Vue( vue_options );
