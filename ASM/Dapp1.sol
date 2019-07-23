pragma solidity ^0.4.24;
contract Dapp1{
    uint public id =1234; 
    event setingId(uint id);
    function testForCallByContract(uint input)  public {
        require(input>10,'input should be large than 10');
        id=input;
        emit setingId(id);
    }
}