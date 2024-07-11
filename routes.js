const { Router } = require('express')

const ERC20Controller = require('./controller/ERC20Controller')
const BasicController = require('./controller/BasicController')


const router = Router()

router.post('/erc20/mint', ERC20Controller.mint)
router.post('/erc20/burn', ERC20Controller.burn)
router.post('/erc20/transfer', ERC20Controller.transfer)
router.post('/erc20/balance', ERC20Controller.balanceOf)

router.post('/deploy', BasicController.deploy)
router.post('/create', BasicController.createFile)

module.exports = router