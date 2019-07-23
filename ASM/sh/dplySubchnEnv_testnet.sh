#run a vnode_prv docker
docker run --privileged --name vnode_testnet -itd -p 20000:8545 -p 20001:30033 -p 20002:22 -p 20003:50062 -v /linux_nuwa_109_testnet/docker_data/vnode/root:/root -v /linux_nuwa_109_testnet/docker_data/vnode/vnode:/vnode  vnode 
docker exec -itd vnode_testnet /vnode/moac-linux-amd64 --testnet  --datadir data  --rpc --rpcaddr 0.0.0.0 --rpcapi "chain3,mc,net,db,personal,debug,vnode,scs,miner,admin,txpool" --rpccorsdomain "*" --verbosity 4
#start a exist vnode_prv docker
#docker start vnode_prv

screen_name=$"scs_testnet"
#screen -dmS $screen_name

#scs1
cmd=$"cd /linux_nuwa_109_testnet/scs1/ && ./scsserver-linux-amd64 --rpc --rpcaddr 0.0.0.0 --rpcport 8001 --rpccorsdomain '*' &\n ";
screen -x $screen_name -X stuff "$cmd"

#scs2
cmd=$"cd /linux_nuwa_109_testnet/scs2/ && ./scsserver-linux-amd64 --rpc --rpcaddr 0.0.0.0 --rpcport 8002 --rpccorsdomain '*'\n ";
screen -x $screen_name -X stuff "$cmd"

#scs_monitor
cmd=$"cd /linux_nuwa_109_testnet/scs_monitor/ && ./scsserver-linux-amd64 --rpcaddr 0.0.0.0 --rpcport 8004 --rpcdebug --verbosity 4 &\n ";
screen -x $screen_name -X stuff "$cmd" -t scs_monitor

#scs3
docker container run -p 20010:8000 -p 20011:22  -itd --name scs3_testnet scs
#docker container start scs3_prv

