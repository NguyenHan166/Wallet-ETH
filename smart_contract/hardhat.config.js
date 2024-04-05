// https://eth-sepolia.g.alchemy.com/v2/jIHGuhg6ILJVQ8eV-OFUQIlxrwTIhQAD

require('@nomiclabs/hardhat-waffle');


module.exports = {
  solidity: '0.8.0',
  networks: {
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/jIHGuhg6ILJVQ8eV-OFUQIlxrwTIhQAD',
      accounts: ['697fe00168116392e5d0b46b9de7fa063fbb20d399a9887aea2d4e259cd36add']
    }
  }
}