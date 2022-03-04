import React, {useEffect, useState} from 'react'
import {ethers} from 'ethers'
import abi from '../../smart_contract/artifacts/contracts/Transactions.sol/Transactions.json'
import {useConnect, useAccount} from 'wagmi'
import Swal from 'sweetalert2'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const TransactionContext = React.createContext()

export const TransactionProvider = ({children})=>{
  const contractAddress = '0xfF030AC5D7535529B15A2F1B2b8B0c6c577B6D2D'
  const contractABI = abi.abi
  const [{data:connectData, error:connectError}, connect] = useConnect()
  const [{data:accountData}, disconnect] = useAccount({
    fetchEns: true,
  })
  const [isLoading, setLoading] = useState(false)
  

  useEffect(()=>{
    if(!accountData){
      connect(connectData.connectors[0])
    }
  }, [])
  
  const getEthereumContract = ()=>{
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer) 
    return transactionContract
  }

  const sendTransaction = async (data)=>{
    try{
      if(!accountData){
        return Swal.fire({
          icon: "error",
          title: "Your Wallet's Not Connected!",
          color: 'white',
          confirmButtonText: 'Please Connect Your Wallet!',
          confirmButtonColor: '#172a42',
          background: '#171c26'
        })
      }
      setLoading(true)
      const {amount, addressTo, message} = data
      const transactionContract = await getEthereumContract()
      
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accountData.address,
          to: addressTo,
          gas: '0x5208', //2100 GWEI
          value: ethers.utils.parseEther(amount)._hex
        }]
      })

      const send = await transactionContract.addToBlockchain(
        addressTo,
        ethers.utils.parseEther(amount),
        message
      )

      await send.wait()

      setLoading(false)

      toast.success(`${`${accountData.address.slice(0, 7)}...${accountData.address.slice(35)}`} sending ${amount} ETH to ${`${addressTo.slice(0, 7)}...${addressTo.slice(35)}`}`)
    } catch(err){
      setLoading(false)
      console.log(err)
    }
  }

  return(
    <TransactionContext.Provider
      value={{
        sendTransaction,
        isLoading
    }}
    >
      {children}
    </TransactionContext.Provider>
  )
}