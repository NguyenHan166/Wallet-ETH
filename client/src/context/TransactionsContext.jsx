import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants';

export const TransactionsContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log({
        provider,
        signer,
        transactionContract
    })

    return transactionContract;
}

export const TransactionsProvider = ({ children }) => {

    const [currentAccount, setCurrentAccount] = useState('')
    const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: '' })
    const [isLoading, setIsLoading] = useState(false)
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))
    const [transactions, setTransactions] = useState([])
    const [balance, setBalance] = useState(0)

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }))
    }

    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert('Please install metamask')

            const transactionContract = getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();

            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18) // đổi ra eth phải chia với 10^18
            }))

            console.log('All Transaction: ')
            console.log(structuredTransactions)
            setTransactions(structuredTransactions)
        } catch (error) {
            console.log(error)
        }
    }

    const checkWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert('Please install metamask')

            const accounts = await ethereum.request({ method: 'eth_accounts' })

            // console.log(accounts)

            if (accounts.length) {
                setCurrentAccount(accounts[0])
                const balance = await ethereum.request({
                    method: 'eth_getBalance',
                    params:[
                        accounts[0],
                        "latest"
                    ]
                })

                console.log(parseInt(balance) / (10**18))
                setBalance(parseInt(balance) / (10**18))
                getAllTransactions();
            } else {
                console.log('No accounts found')
            }

            console.log(accounts)
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object.")
        }
    }

    const checkIfTransactionExists = async () => {
        try {
            const transactionContract = getEthereumContract();
            const transactionCount = await transactionContract.getTransactionCount();

            window.localStorage.setItem("transactionCount", transactionCount)
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object.")
        }
    }

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert('Please install metamask')
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
            const balance = await ethereum.request({
                method: 'eth_getBalance',
                params:[
                    accounts[0],
                    null
                ]
            }) 
            console.log(balance)
            setBalance(parseInt(balance) / (10**18))
            console.log(accounts)

            setCurrentAccount(accounts[0])
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object.")
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert('Please install metamask')

            //get the data from form
            const { addressTo, amount, keyword, message } = formData;
            getEthereumContract();
            const transactionContract = getEthereumContract();
            const parseAmount = ethers.utils.parseEther(amount);


            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', // 21000 GWEI,
                    value: parseAmount._hex, // 0.00001
                }]
            });

            const transactionHash = await transactionContract.addToBlockChain(addressTo, parseAmount, message, keyword);

            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);

            await transactionHash.wait();

            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionCount();
            setCurrentAccount(transactionCount.toNumber())

            // location.reload();
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object.")
        }
    }

    useEffect(() => {
        checkWalletIsConnected();
        checkIfTransactionExists();
    }, [])

    return (
        <TransactionsContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction , transactions , balance}}>
            {children}
        </TransactionsContext.Provider>
    )
}

