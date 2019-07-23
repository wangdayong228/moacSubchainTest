#create a vnode_dev docker
docker run --privileged  --name vnode_dev  --net blocknet --ip 172.18.0.10 -itd -p 30000:8545 -p 30001:30033 -p 30002:22 -p 30003:50062 -v /linux_nuwa_109_dev/docker_data/vnode/root:/root -v /linux_nuwa_109_dev/docker_data/vnode/vnode:/vnode  vnode

docker exec -itd vnode_dev /vnode/moac-linux-amd64 --dev  --datadir data  --rpc --rpcaddr 0.0.0.0 --rpcapi "chain3,mc,net,db,personal,debug,vnode,scs,miner,admin,txpool" --rpccorsdomain "*" --verbosity 4
#start vnode_dev docker
docker start vnode_dev

#create scs_dev docker
docker container run -p 31010:8000 -p 31011:22 -itd --name scs1_dev --net blocknet --ip 172.18.0.11 scs:dev
docker container run -p 31020:8000 -p 31021:22 -itd --name scs2_dev --net blocknet --ip 172.18.0.12 scs:dev
docker container run -p 31030:8000 -p 31031:22 -itd --name scs3_dev --net blocknet --ip 172.18.0.13 scs:dev

#run scs_dev docker
docker start scs1_dev
docker start scs2_dev
docker start scs3_dev

#docker scs_monitor
docker container run -p 31040:8000 -p 31041:22 -itd --name scs_monitor_dev --net blocknet --ip 172.18.0.14 scs_monitor:dev
docker start scs_monitor_dev

