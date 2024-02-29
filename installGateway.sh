#!/bin/bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
else
    apt update
    apt upgrade -y
    apt install git gcc make wireguard rtl-433 -y

    git clone https://github.com/lorabasics/basicstation
    cd basicstation
    make platform=rpi variant=std ARCH=$(gcc --print-multiarch)
    ./build-rpi-std/bin/station --version
    mkdir -p /opt/ttn-station/bin
    cp ./build-rpi-std/bin/station /opt/ttn-station/bin/station
    export MAC=`cat /sys/class/net/eth0/address`
    export EUI=`echo $MAC | awk -F: '{print $1$2$3 "fffe" $4$5$6}'`
    echo "The Gateway EUI is $EUI"
    echo "Copy the EUI NOW!!!!"
    sleep 1
    echo "Register the gateway now"
    sleep 1
    echo "Create a API key now"
    read  -p "Put the API key here: " APIKEY
    echo "$APIKEY"
    mkdir -p /opt/ttn-station/config
    echo 'wss://eu1.cloud.thethings.network:8887' | sudo tee /opt/ttn-station/config/tc.uri
    export API_KEY="$APIKEY"
    echo "Authorization: Bearer $API_KEY" | perl -p -e 's/\r\n|\n|\r/\r\n/g' | sudo tee -a /opt/ttn-station/config/tc.key
    ln -s /etc/ssl/certs/ca-certificates.crt /opt/ttn-station/config/tc.trust
    echo '
    {
        /* If slave-X.conf present this acts as default settings */
        "SX1301_conf": { /* Actual channel plan is controlled by server */
            "lorawan_public": true, /* is default */
            "clksrc": 1, /* radio_1 provides clock to concentrator */
            /* path to the SPI device, un-comment if not specified on the command line e.g., RADIODEV=/dev/spidev0.0 */
            /*"device": "/dev/spidev0.0",*/
            /* freq/enable provided by LNS - only HW specific settings listed here */
            "radio_0": {
                "type": "SX1257",
                "rssi_offset": -166.0,
                "tx_enable": true,
                "antenna_gain": 0
            },
            "radio_1": {
                "type": "SX1257",
                "rssi_offset": -166.0,
                "tx_enable": false
            }
            /* chan_multiSF_X, chan_Lora_std, chan_FSK provided by LNS */
        },
        "station_conf": {
            "routerid": "'"$EUI"'",
            "log_file": "stderr",
            "log_level": "DEBUG", /* XDEBUG,DEBUG,VERBOSE,INFO,NOTICE,WARNING,ERROR,CRITICAL */
            "log_size": 10000000,
            "log_rotate": 3,
            "CUPS_RESYNC_INTV": "1s"
        }
    }
    ' |  tee /opt/ttn-station/config/station.conf

    echo '#!/bin/bash

    # Reset iC880a PIN
    SX1301_RESET_BCM_PIN=25
    echo "$SX1301_RESET_BCM_PIN"  > /sys/class/gpio/export
    echo "out" > /sys/class/gpio/gpio$SX1301_RESET_BCM_PIN/direction
    echo "0"   > /sys/class/gpio/gpio$SX1301_RESET_BCM_PIN/value
    sleep 0.1
    echo "1"   > /sys/class/gpio/gpio$SX1301_RESET_BCM_PIN/value
    sleep 0.1
    echo "0"   > /sys/class/gpio/gpio$SX1301_RESET_BCM_PIN/value
    sleep 0.1
    echo "$SX1301_RESET_BCM_PIN"  > /sys/class/gpio/unexport

    # Test the connection, wait if needed.
    while [[ $(ping -c1 google.com 2>&1 | grep " 0% packet loss") == "" ]]; do
    echo "[TTN Gateway]: Waiting for internet connection..."
    sleep 30
    done

    # Start station
    /opt/ttn-station/bin/station
    ' |  tee /opt/ttn-station/bin/start.sh

    chmod +x /opt/ttn-station/bin/start.sh
    cd /opt/ttn-station/config
    RADIODEV=/dev/spidev0.0 /opt/ttn-station/bin/start.sh
    echo '
    [Unit]
    Description=The Things Network Gateway

    [Service]
    WorkingDirectory=/opt/ttn-station/config
    ExecStart=/opt/ttn-station/bin/start.sh
    SyslogIdentifier=ttn-station
    Restart=on-failure
    RestartSec=5

    [Install]
    WantedBy=multi-user.target
    ' |  tee /lib/systemd/system/ttn-station.service

    systemctl enable ttn-station
    systemctl start ttn-station

    read -p "Give the user of the mosquitto: " userMosquitto
    read -p "Give the paswword of this user of mosquitto: " passwordMosquitto
    read -p "Give the ip of the of mosquitto server: " ipMosquitto

    echo '
    frequency 868.3MHz
    protocol 172
    output mqtt://$ipMosquitto:1883, user=$userMosquitto, pass=$passwordMosquitto, retain=0,events=weatherStation
    output kv
    report_meta time:unix:utc:tz:iso:usec
    report_meta level
    ' | tee /home/flwsb/rtl_433.config
    chmod 700 /home/flwsb/rtl_433.config

    echo '
    [Unit]
    Description=RTL weather station
    After=network.target
    StartLimitIntervalSec=5

    [Service]
    PrivateTmp=true
    Type=exec
    ExecStart=/usr/bin/rtl_433 -c /home/flwsb/rtl_433.config
    Restart=always
    RestartSec=30s

    [Install]
    WantedBy=multi-user.target
    ' | tee /etc/systemd/system/rtl_433.service
    
    chmod 700 /etc/systemd/system/rtl_433.service

    chown flwsb:flwsb /home/flwsb/rtl_433.config
    chown flwsb:flwsb /etc/systemd/system/rtl_433.service


    read -p "Give the ip address of the server: " ipServer
    read -p "Give the ip for the client in the next range (10.10.10.0/24): " ipClient
    read -p "Wich client are you (give the number): " numberClient
    allowedIps= "10.10.10.0/24"
    private_client_key=$(ssh flwsb@$ipServer "sudo cat /etc/wireguard/private_client$numberClient.key") # path for first gateway, /etc/wireguard/private_client2.key for second gateway
    public_server_key=$(ssh flwsb@$ipServer "sudo cat /etc/wireguard/public_server.key")

    echo "# Example config for the Wireguard client, works fine with the server config
    [Interface]
    PrivateKey = $private_client_key
    Address = $ipClient

    [Peer]
    PublicKey = $public_server_key
    AllowedIPs = $allowedIps
    Endpoint = $ipServer:51820
    PersistentKeepalive = 25" | tee /etc/wireguard/wg0.conf

    wg-quick up wg0

    reboot 
fi
