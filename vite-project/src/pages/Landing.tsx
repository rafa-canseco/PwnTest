import axios from "axios";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ERC20Assets from "../components/others/ERC20Assets";
import NFTAssets from "../components/others/NFTAssets";
import BundleService from "../services/BundleService"; 

const Landing = ({ walletAddress }) => {
  const [erc20Assets, setErc20Assets] = useState([]);
  const [nftAssets, setNftAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchAssets = async () => {
    try {
      const response = await axios.get("http://localhost:8000/get_assets", {
        params: {
          address: walletAddress,
          blockchain: "sepolia",
        },
      });
      const data = response.data;
      console.log("Fetch Assets Response:", data);
      setErc20Assets(data.erc20_assets);
      setNftAssets(data.nft_assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const manageAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/manage_assets", {
        address: walletAddress,
        blockchains: ["sepolia"],
      });
      const data = response.data;
      console.log("Manage Assets Response:", data);
      setErc20Assets(data.erc20_assets);
      setNftAssets(data.nft_assets);
    } catch (error) {
      console.error("Error managing assets:", error);
    } finally {
      setLoading(false);
      fetchAssets(); 
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchAssets();
    }
  }, [walletAddress]);

  const truncateAddress = (address) => {
    const maxLength = 20;
    return address.length > maxLength
      ? `${address.slice(0, maxLength)}...`
      : address;
  };

  const handleSelectAsset = (asset) => {
    setSelectedAssets((prevSelected) => {
      const isSelected = prevSelected.some((a) => a.token_id === asset.token_id && a.token_address === asset.token_address);
      if (isSelected) {
        return prevSelected.filter((a) => !(a.token_id === asset.token_id && a.token_address === asset.token_address));
      } else {
        if (asset.token_id !== undefined) {
          return [...prevSelected, { ...asset, type: 'NFT' }];
        } else {
          return [...prevSelected, { ...asset, type: 'ERC20' }];
        }
      }
    });
  };

  const handleBundle = async () => {
    setProcessing(true);
    setMessage("Bundling assets, please wait...");
    try {
      const bundleId = await BundleService.bundletokens(selectedAssets);
      console.log("Assets bundled with ID:", bundleId);
    } catch (error) {
      console.error("Error bundling assets:", error);
    } finally {
      setProcessing(false);
      setTimeout(() => {
        setMessage("");
        manageAssets();
      }, 10000);
    }
  };

  const handleUnbundle = async () => {
    setProcessing(true);
    setMessage("Unbundling assets, please wait...");
    try {
      const unbundleId = await BundleService.unbundle(selectedAssets);
      console.log("Assets unbundled with ID:", unbundleId);
      setTimeout(() => {
        setMessage("");
        manageAssets();
      }, 10000); // 10 segundos de retraso
    } catch (error) {
      console.error("Error unbundling assets:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {walletAddress ? (
        <>
          <p className="mt-4">
            Wallet Address: {truncateAddress(walletAddress)}
          </p>
          <Button onClick={manageAssets} disabled={loading}>
            {loading ? "Updating..." : "Update Assets"}
          </Button>
          {loading ? (
            <p className="mt-4">Loading assets...</p>
          ) : (
            <>
              <div className="flex space-x-2 mt-4">
                <Button onClick={handleBundle} disabled={selectedAssets.length === 0 || processing}>
                  Bundle Assets
                </Button>
                <Button onClick={handleUnbundle} disabled={selectedAssets.length === 0 || processing}>
                  Unbundle Assets
                </Button>
              </div>
              {message && <p className="mt-4">{message}</p>}
              <ERC20Assets
                assets={erc20Assets}
                truncateAddress={truncateAddress}
                onSelectAsset={handleSelectAsset}
                selectedAssets={selectedAssets}
                walletAddress={walletAddress}  
              />
              <NFTAssets
                assets={nftAssets}
                truncateAddress={truncateAddress}
                onSelectAsset={handleSelectAsset}
                selectedAssets={selectedAssets}
              />
            </>
          )}
        </>
      ) : (
        <p className="mt-4">Please connect your wallet.</p>
      )}
    </div>
  );
}

export default Landing;
