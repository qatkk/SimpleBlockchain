var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const rq = require('request-promise');
const requestPromise = require('request-promise');

const port = process.argv[2];
const nodeAddress = uuid().split('-').join('');
const bitcoin = new Blockchain();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function(req,res){
    res.send(bitcoin);
});

app.post('/transaction', function (req, res) {
     const newTransaction = req.body;
     let blockIndex = -1;
     const isTransactionSaved = bitcoin.pendingTransactions.indexOf(newTransaction) == -1; 
     if (isTransactionSaved)  {
         blockIndex = bitcoin.pushNewTransaction(newTransaction);
    }
     res.json({note : `the transcation will be added to ${blockIndex}.`});
});

app.post('/transaction/broadcast', function(req,res){
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    const blockIndex = bitcoin.pushNewTransaction(newTransaction);
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true    
        };
        requestPromises.push(rq(requestOptions));
    });
    Promise.all(requestPromises)
    .then(data =>{
        res.json({note: 'Broadcasted the transaction to all the nodes.'})
    });

    res.json({note: `The transaction will be added to the block ${blockIndex}`});
});

app.get('/mine', function(req,res){
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentDataBlock = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index']+1 
    }
    bitcoin.pushNewTransaction({
        amount: 12.5,
        sender: '00', 
        recipient: nodeAddress,
        transacionId: uuid().split('-').join('')
    });
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentDataBlock);
    const hashBlock = bitcoin.hashBlock(currentDataBlock, previousBlockHash, nonce);
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash,hashBlock);

    const newBlockPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: {newBlock: newBlock},
            json: true
        };
        newBlockPromises.push(rq(requestOptions));
    });
    Promise.all(newBlockPromises)
    .then(data => {
        const requesOptions = {
            uri: bitcoin.currentNodeUrl + '/broadcast/transaction',
            method: 'POST',
            body: {
                amount: 12.5,
                sender: '00',
                recipient: nodeAddress
            },
            json: true
        };

        return rq(requesOptions);
    })
    .then (data =>{
        res.json({
            note: "New block mined successfully",
            block: newBlock
        });
    })

    res.json ({
        note: "New block successfully created",
        newBlock: newBlock
    });
});

app.post('/receive-new-block', function(req, res){
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash == newBlock.previousBlockHash;
    const correctIndex = lastBlock['index']+1 == newBlock['index'];
    if (correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note: 'new block added to the chain',
            block : newBlock
        });
    }else {
        res.json({
            note: 'new block rejected',
            block : newBlock
        });
    }
});

app.post('/register-and-broadcast-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) bitcoin.networkNodes.push(newNodeUrl);
    const regNodesPromises = [];

    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: {newNodeUrl: newNodeUrl}, 
            json: true
        };
        regNodesPromises.push(rq(requestOptions));
    });

    Promise.all(regNodesPromises)
    .then( data => {
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-nodes-bulk', 
            method: 'POST',
            body: {allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
            json: true
        };
        return rq(bulkRegisterOptions);
    })
    .then(data => {
        res.json({note: 'new node registered to the network successfully.'});
    });
});
app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const notCurrentNode = bitcoin.currentNodeUrl != newNodeUrl;
    const notAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1 ; 
    if (notAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl);
    res.json ({ note: 'new node registered successfully.'});
});

app.post('/register-nodes-bulk', function (req, res) {
    const allNetworkNodes =  req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl =>{
        const notCurrentNode = bitcoin.currentNodeUrl != networkNodeUrl;
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1; 
        if (nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);
    });
    res.json ({note: 'all the nodes have been added.'});
});

app.get ('/consensus', function (req, res) {
    const requestPromises = []; 
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const reqOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        };
        requestPromises.push(rq(reqOptions));
    });
    Promise.all(requestPromises)
    .then(blockchains =>{
        // console.log(blockchains);
        const currentChainLength = bitcoin.chain.length ;
        let maxChainLength = currentChainLength ;
        let newLongestChain = null ; 
        let newPendingTransactions = null ; 

        blockchains.forEach(blockchain =>{
            if (blockchain.chain.length > maxChainLength){
                maxChainLength = blockchain.chain.length; 
                newLongestChain = blockchain.chain ; 
                newPendingTransactions = blockchain.pendingTransactions; 
            };
        });

        if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))){
            res.json({
                note: "chain is not replaced.",
                chain: bitcoin.chain
            });
        }else {
            bitcoin.chain = newLongestChain ; 
            bitcoin.pendingTransactions = newPendingTransactions; 
            res.json({
                note: "chain is replaced.",
                newChain : bitcoin.chain
            });
        }
    });
});

app.get('/block/:blockHash', function(req, res){
    const blockHash = req.params.blockHash;
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        note: "the block is",
        block: correctBlock
    })
});

app.get('/transaction/:transactionId', function(req, res){
    const transactionId = req.params.transactionId;
    const transactionData = bitcoin.getTransaction(transactionId);
    res.json({
        transaction : transactionData.transaction,
        block: transactionData.block
    });
});

app.get ('/address/:address', function(req, res) {
    const address = req.params.address;
    const addressData = bitcoin.getAddressData(address);
    res.json({
        addressData : addressData
    });
});

app.get ('/block-explorer', function(req, res){
    res.sendFile('./block-explorer/index.html', { root : __dirname });
});

app.listen(port, function() {
    console.log(`listening on port ${port} ...`);
});