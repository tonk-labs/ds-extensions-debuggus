# ds-extensions-debuggus

This repo contains the Downstream extensions for Tonk Attack, the social deduction game built in Downstream.

### Includes

1. Botnet Tower

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Botnet tower is the main building for game coordination. This is where players will create their Tonk and receive updates on the game state.


2. Debug Depot

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Debug depots are where good bots must go to complete their task each round. There will be several of these built around the game.

3. Tonk 

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Players must craft a Tonk item for themselves if they wish to play the game.


### How to Install and Run

#### Install Playmint DS
In a folder above wherever this directory exists run
```git clone https://github.com/playmint/ds ``` 

Follow the instructions to build playmint ds


#### Deploy the contracts
npx ds -n [server] -k [private_key] apply -R -f [root_dir]


#### Running Locally
If you want to play everything on your local computer, you will need to have an instance of DownStream and Tonk Services https://github.com/tonk-gg/tonk-services running locally on your machine.
