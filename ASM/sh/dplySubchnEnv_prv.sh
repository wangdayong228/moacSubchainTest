#run a vnode_prv docker
docker run --privileged --name vnode_prv -itd -p 10000:8545 -p 10001:30033 -p 10002:22 -p 10003:50062 -v /linux_nuwa_109_prv/docker_data/vnode/root:/root -v /linux_nuwa_109_prv/docker_data/vnode/_logs:/vnode/_logs -v /linux_nuwa_109_prv/docker_data/vnode/data:/vnode/data  vnode ./moac-linux-amd64  --datadir data  --targetgaslimit '9000000'  --rpc --rpcaddr 0.0.0.0 --rpcapi "chain3,mc,net,db,personal,debug,vnode,scs,miner,admin,txpool" --rpccorsdomain "*" --networkid 100 --verbosity 4
#start a exist vnode_prv docker
#docker start vnode_prv

screen_name=$"scs_prv"
#screen -dmS $screen_name

#scs1
cmd=$"cd /linux_nuwa_109_prv/scs1/ && ./scsserver-linux-amd64 --rpc --rpcaddr 0.0.0.0 --rpcport 7001 --rpccorsdomain '*' &\n ";
screen -x $screen_name -X stuff "$cmd"

#scs2
cmd=$"cd /linux_nuwa_109_prv/scs2/ && ./scsserver-linux-amd64 --rpc --rpcaddr 0.0.0.0 --rpcport 7002 --rpccorsdomain '*'\n ";
screen -x $screen_name -X stuff "$cmd"

#scs_monitor
cmd=$"cd /linux_nuwa_109_prv/scs_monitor/ && ./scsserver-linux-amd64 --rpcaddr 0.0.0.0 --rpcport 7004 --rpcdebug --verbosity 4 &\n ";
screen -x $screen_name -X stuff "$cmd" -t scs_monitor

#scs3
docker container run -p 6000:8000 -p 6001:22  -itd --name scs3_prv scs_prv
#docker container start scs3_prv

