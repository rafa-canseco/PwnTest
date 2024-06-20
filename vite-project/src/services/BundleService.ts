import AccountService from "./AccountService";
import { contracts, GAS_LIMIT, tokenInfos } from "../constants";
import { getBundler, getToken } from "./ContractService";
import { ethers } from "ethers";

let isConfirming = false;
const setisConfirming = (value: boolean) => {
    isConfirming = value;
};

export default {
    bundletokens: async (selectedAssets: any []) => {
        setisConfirming(true);
        console.log("Selected Assets:", selectedAssets);

        const { signer } = await AccountService.getAccountData();
        const bundler = await getBundler();

        const assets = selectedAssets.map((asset) => {
            if (asset.type === 'ERC20') {
                return {
                    category: 0,
                    assetAddress: asset.token_address || asset.address,
                    id: 0,
                    amount: ethers.parseUnits(asset.quantity.toString(), 18),
                };
            } else {
                return {
                    category: 1,
                    assetAddress: asset.token_address || asset.address,
                    id: asset.token_id || asset.id,
                    amount: 1,
                };
            }
        });
        console.log("Mapped Assets:", assets);;


        try {
            const tx = await bundler.connect(signer).create(assets, { gasLimit: GAS_LIMIT }); 
            const receipt = await tx.wait();
            setisConfirming(false);
            return receipt.transactionHash;
        } catch (error) {
            setisConfirming(false);
            console.error("Error bundling assets:", error);
            throw error;
        }
    },
    unbundle: async (selectedAssets: any[]) => {
        setisConfirming(true);
        const tokenId = selectedAssets.find((asset) => asset.type !== 'ERC20')?.token_id;
    console.log("Unbundling Token ID:", tokenId);
    if (!tokenId) {
        setisConfirming(false);
        throw new Error("No NFT selected for unbundling.");
      }

        const { signer } = await AccountService.getAccountData();
        const bundler = await getBundler();

        try {
            const tx = await bundler.connect(signer).unwrap(tokenId, { gasLimit: GAS_LIMIT }); 
            const receipt = await tx.wait();
            setisConfirming(false);
            return receipt.transactionHash;
        } catch (error) {
            setisConfirming(false);
            console.error("Error unbundling asset:", error);
            throw error;
        }
    }
};