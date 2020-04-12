bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Happy)
})
bluetooth.onBluetoothDisconnected(function () {
    right = 0
    servos.P1.run(right)
    left = 0
    servos.P2.run(left)
    basic.showIcon(IconNames.Asleep)
})
function processCommand() {
    if (cmd == "r" || cmd == "f") {
        value = parseInt(param)
        if (right != value) {
            right = value
            servos.P1.run(right)
        }
    }
    if (cmd == "l" || cmd == "f") {
        value = parseInt(param)
        if (left != value) {
            left = value
            servos.P2.run(0 - left)
        }
    }
    if (cmd == "t") {
        value = parseInt(param)
        servos.P1.run(50)
        servos.P2.run(50)
        basic.pause(value * 6)
        servos.P1.run(0)
        servos.P2.run(0)
        right = 0
        left = 0
    } else if (cmd == "T") {
        value = parseInt(param)
        servos.P1.run(-50)
        servos.P2.run(-50)
        basic.pause(value * 6)
        servos.P1.run(0)
        servos.P2.run(0)
        right = 0
        left = 0
    } else if (cmd == "s") {
        value = parseInt(param)
        servos.P1.run(50)
        servos.P2.run(-50)
        basic.pause(value * 143)
        servos.P1.run(0)
        servos.P2.run(0)
        right = 0
        left = 0
    } else if (cmd == "S") {
        value = parseInt(param)
        servos.P1.run(-50)
        servos.P2.run(50)
        basic.pause(value * 143)
        servos.P1.run(0)
        servos.P2.run(0)
        right = 0
        left = 0
    } else if (cmd == "i") {
        value = parseInt(param)
        if (value == 1) {
            basic.showIcon(IconNames.Heart)
        } else if (value == 2) {
            basic.showIcon(IconNames.EigthNote)
        } else if (value == 3) {
            basic.showIcon(IconNames.No)
        } else if (value == 4) {
            basic.showLeds(`
                . # # # .
                # . . . #
                # . . . #
                # . . . #
                . # # # .
                `)
        } else {
            basic.showIcon(IconNames.Happy)
        }
    }
}
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.Fullstop), function () {
    parseString(bluetooth.uartReadUntil(serial.delimiters(Delimiters.Fullstop)))
    processCommand()
})
function parseString(text: string) {
    cmd = text.charAt(0)
    param = text.substr(1, text.length)
}
let param = ""
let value = 0
let cmd = ""
let left = 0
let right = 0
bluetooth.startAccelerometerService()
bluetooth.startUartService()
basic.showIcon(IconNames.Yes)
