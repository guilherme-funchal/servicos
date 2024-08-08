const { Router } = require('express');

const upload = require('./middlewares/upload-middleware');
const upload2 = require('./middlewares/upload-middlewareFile');

const ERC20Controller = require('./controller/ERC20Controller');
const ERC721Controller = require('./controller/ERC721Controller');
const BasicController = require('./controller/BasicController');
const TokensController = require('./controller/TokensController');
const ContractsController = require('./controller/ContractsController');
const TransactionsController = require('./controller/TransationsController');
const UsersController = require('./controller/UsersController');
const UploadController = require('./controller/UploadController');
const ERC4337Controller = require('./controller/ERC4337Controller.js');
const IPFSController = require('./controller/IPFSController');

const router = Router();

router.post('/erc20/mint', ERC20Controller.mint);
router.post('/erc20/burn', ERC20Controller.burn);
router.post('/erc20/transfer', ERC20Controller.transfer);
router.post('/erc20/balance', ERC20Controller.balanceOf);
router.post('/erc20/info', ERC20Controller.info);
router.post('/erc20/owner', ERC20Controller.owner);

router.post('/erc721/mint', ERC721Controller.mint);
router.post('/erc721/info', ERC721Controller.info);
router.post('/erc721/owner', ERC20Controller.owner);
router.post('/erc721/burn', ERC721Controller.burn);
router.post('/erc721/view', ERC721Controller.view);

router.post('/erc4337/create', ERC4337Controller.create);
router.post('/erc4337/balanceERC20', ERC4337Controller.balanceERC20);
router.post('/erc4337/mintERC20', ERC4337Controller.mintERC20);
router.post('/erc4337/burnERC20', ERC4337Controller.burnERC20);
router.post('/erc4337/transferERC20', ERC4337Controller.transferERC20);

router.post('/deploy', BasicController.deploy);
router.post('/deployfile', BasicController.deployFile);
router.post('/create', BasicController.createFile);

router.post('/tokens', TokensController.create);
router.put('/tokens/:id', TokensController.update);
router.get('/tokens', TokensController.list);
router.delete('/tokens/:id', TokensController.delete);
router.get('/tokens/:id', TokensController.find);

router.post('/contracts', ContractsController.create);
router.put('/contracts/:id', ContractsController.update);
router.get('/contracts', ContractsController.list);
router.delete('/contracts/:id', ContractsController.delete);
router.get('/contracts/:id', ContractsController.find);

router.post('/transactions', TransactionsController.create);
router.put('/transactions/:hash', TransactionsController.update);
router.get('/transactions', TransactionsController.list);
router.delete('/transactions/:hash', TransactionsController.delete);
router.get('/transactions/:hash', TransactionsController.find);

router.post('/users', UsersController.create);
router.put('/users/:email', UsersController.update);
router.get('/users', UsersController.list);
router.delete('/users/:email', UsersController.delete);
router.get('/users/:email', UsersController.find);

router.get('/files', IPFSController.files);
router.get('/metadata/:hash', IPFSController.metadata);
router.get('/fetch/:hash', IPFSController.fetch);
router.delete('/delete/:hash', IPFSController.deleteFile);
router.delete('/metadado/:filecid', IPFSController.deleteMetada);
router.post('/file', upload2.single('file'), IPFSController.upload);
router.post('/upload-metadata', IPFSController.uploadMetadata);

router.post('/upload', upload.single('file'), UploadController.upload);
router.post('/upload2', upload2.single('file'), UploadController.upload2);

module.exports = router