const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

// console.log(bitcoin);
const bcOne =[{"index":1,"timeStamp":1629726159332,"transactions":[],"nonce":100,"hash":"0","previousBlockHash":"0"},{"index":2,"timeStamp":1629726169374,"transactions":[{"amount":12.5,"sender":"00","recipient":"fb961a40041711ec908995bb91004619","transacionId":"016e6120041811ec908995bbasdadasasdsa004619"}],"nonce":21965,"hash":"00000e1bc1014be0876b613ed9637aa93e2409812bd0926b72485c63bb80fa6a","previousBlockHash":"0"},{"index":3,"timeStamp":1629726172818,"transactions":[{"amount":12.5,"sender":"00","recipient":"fb961a40041711ec908995bb91004619","transacionId":"038a3c40041811ec908995bb91004619"}],"nonce":12045,"hash":"000091ee4e8f90d9268b0103d99694e6ea108a4dd764adc07be0698c699d49f5","previousBlockHash":"00000e1bc1014be0876b613ed9637aa93e2409812bd0926b72485c63bb80fa6a"},{"index":4,"timeStamp":1629726188117,"transactions":[{"amount":300,"sender":"wieuqhwisdfsdfkjdhioiqwje","recipient":"asdlas;dwqieuoqwoieuqw","transacionId":"05e25d10041811ec908995bb91004619"},{"amount":310,"sender":"wieuqhwisdfsdfkjdhioiqwje","recipient":"asdlas;dwqieuoqwoieuqw","transacionId":"0a1b24c0041811ec908995bb91004619"},{"amount":12.5,"sender":"00","recipient":"fb961a40041711ec908995bb91004619","transacionId":"0c3ccc40041811ec908995bb91004619"}],"nonce":77059,"hash":"00005ab30998cb3d54ba1de06963b9d976f13557b0b05ef17e19b6eba0714dbf","previousBlockHash":"000091ee4e8f90d9268b0103d99694e6ea108a4dd764adc07be0698c699d49f5"}];
console.log(bitcoin.chainIsValid(bcOne));