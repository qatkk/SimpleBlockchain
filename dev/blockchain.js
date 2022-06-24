const sha256 = require('sha256');
const uuid = require('uuid/v1');

const currentNodeUrl = process.argv[3];
class Blockchain {
    constructor () {
        this.chain = [];
        this.pendingTransactions = [];

        this.currentNodeUrl = currentNodeUrl; 
        this.networkNodes = [];
        
        this.createNewBlock(100, '0', '0');
    }
    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timeStamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash, 
            previousBlockHash: previousBlockHash
        };
        this.chain.push(newBlock);
        this.pendingTransactions = [];
        return newBlock;
    }
    getLastBlock() {
        return this.chain[this.chain.length-1 ];
    }
    createNewTransaction (amount, sender, recipient){
        const newTransaction = {
            amount: amount,
            sender: sender, 
            recipient: recipient,
            transactionId: uuid().split('-').join('')
        }
        return newTransaction;
    }
    pushNewTransaction(transactionObj) {
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1 ;
    }
    hashBlock(blockData, previousBlockHash, nonce){
        const dataToString = previousBlockHash + nonce.toString() + JSON.stringify(blockData);
        const hash = sha256(dataToString);
        return hash ; 
    }
    proofOfWork(previousBlockHash, currentBlockData){
        let nonce = 0 ; 
        let hash = this.hashBlock(currentBlockData, previousBlockHash, nonce);
        while (hash.substring(0,4) != '0000'){
            nonce ++ ; 
            hash = this.hashBlock(currentBlockData, previousBlockHash, nonce);
        }
        return nonce ; 
    }
    chainIsValid(blockchain){
        let validChain = true;
        for (var i = 1; i< blockchain.length; i++) { //part 3om for ro nazadu hanuz JIGAR
            const currentBlock = blockchain[i];
            const prevBlock = blockchain[i - 1];
            const blockHash = this.hashBlock({ transactions: currentBlock['transactions'], index: currentBlock['index']}, prevBlock['hash'], currentBlock['nonce']);
            if (blockHash.substring(0,4) !== '0000') validChain = false; 
            if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false; 
            console.log(currentBlock['transactions'])
        }
        const genesisBlock = blockchain[0];
        const correctNonce = genesisBlock['nonce'] === 100; 
        const correctHash = genesisBlock['hash'] === '0';
        const correctPrevHash = genesisBlock['previousBlockHash'] === '0';
        const correctTransactions = genesisBlock['transactions'].length === 0 ;
        if (!correctHash || !correctNonce || !correctPrevHash || !correctTransactions) validChain = false; 
        return validChain; 
    }
    getBlock(blockHash) {
        let correctBlock = null; 
        this.chain.forEach(block => {
            if (blockHash === block.hash) correctBlock = block ; 
        });
        return correctBlock;
    };
    getTransaction(transactionId) {
        let correctTransaction = null ; 
        let correctBlock = null ; 
        this.chain.forEach(block =>{
            block.transactions.forEach(transaction => {
                if (transaction.transactionId == transactionId ){
                     correctTransaction = transaction ; 
                    correctBlock = block  ;
                }
            });
        });
        return {
            block: correctBlock, 
            transaction: correctTransaction
        };
    };
    getAddressData(address) {
        const addressTransactions = [];
        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.sender == address || transaction.recipient == address) addressTransactions.push(transaction);
            });
        });
        let balance = 0 ; 
        addressTransactions.forEach(transaction => {
            if (transaction.sender == address ) balance -= transaction.amount;
            else if (transaction.recipient == address ) balance += transaction.amount;
        });

        return {
            addressTransaction : addressTransactions,
            addressBalance: balance
        }
    };
}

module.exports  = Blockchain; 