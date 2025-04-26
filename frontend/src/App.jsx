import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ProjectForm from './components/ProjectForm';
import ProjectList from './components/ProjectList';
import Notifications from './components/Notifications';
import MyInvestments from './components/MyInvestments';
import MyProjects from './components/MyProjects';
import contractABI from './contractABI.json';
import LandingPage from './components/LandingPage';
function RegistrationForm({ contract, account, onRegistered }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('investor');
  const [telegram, setTelegram] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // First check if user is already registered
      const [existingName, existingRole, existingTelegram, exists] = await contract.getUserInfo(account);
      
      if (exists) {
        setError('This wallet is already registered. Please use a different wallet or contact support.');
        return;
      }

      const tx = await contract.registerUser(name, role, telegram);
      await tx.wait();
      onRegistered();
    } catch (error) {
      console.error('Error registering user:', error);
      if (error.message.includes("User already registered")) {
        setError('This wallet is already registered. Please use a different wallet or contact support.');
      } else {
        setError('Error registering user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Complete Your Registration</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
            >
              <option value="investor">Investor</option>
              <option value="founder">Founder</option>
            </select>
          </div>
          <div>
            <label className="block text-white mb-2">Telegram Username</label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
              required
              placeholder="@username"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const contractAddress = '0x6ed6FBddB8B2F592F246B4b8881A4D3f44064D9E';
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        setProvider(provider);
        setContract(contract);
      }
    };
    init();
  }, []);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        
        const signer = await provider.getSigner();
        setSigner(signer);
        
        const contractWithSigner = contract.connect(signer);
        setContract(contractWithSigner);

        // Get user info immediately after connecting
        try {
          const [name, role, telegram, exists] = await contractWithSigner.getUserInfo(accounts[0]);
          setUserInfo({ name, role, telegram, exists });
        } catch (error) {
          console.error('Error getting user info:', error);
          // If there's an error, assume user needs to register
          setUserInfo({ exists: false });
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Landing page
  if (!account) {
    return (
      <div className="bg-white/10">
      <div className="flex nav px-[5vw] py-[20px] justify-between  border-b-[1px] border-[#e6e6e6] text-center" >
        <div className="flexCol">
        <h1 className="text-[20px] font-bold text-black">Project Funding Platform</h1>
        </div>
      <button 
        onClick={connectWallet}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
      >
        Connect Wallet
      </button>
      </div>
    <LandingPage/>        
  </div>
    );
  }

  // Show registration form if user is not registered
  if (account && (!userInfo || !userInfo.exists)) {
    return (
      <RegistrationForm 
        contract={contract}
        account={account}
        onRegistered={async () => {
          const [name, role, exists] = await contract.getUserInfo(account);
          setUserInfo({ name, role, exists });
        }}
      />
    );
  }

  // Dashboard layout
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">Project Funding Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
              {userInfo && (
                <span className="text-sm text-gray-600">Welcome, {userInfo.name}</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-white shadow-sm flex-shrink-0 overflow-y-auto">
          <nav className="mt-5 px-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                activeTab === 'home' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">🏠</span>
              Home
            </button>
            
            {userInfo?.role === 'founder' && (
              <button
                onClick={() => setActiveTab('create')}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                  activeTab === 'create' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">➕</span>
                Create Project
              </button>
            )}

            <button
              onClick={() => setActiveTab('browse')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                activeTab === 'browse' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">🔍</span>
              Browse Projects
            </button>

            {userInfo?.role === 'founder' ? (
              <button
                onClick={() => setActiveTab('myProjects')}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                  activeTab === 'myProjects' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">📋</span>
                My Projects
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('myInvestments')}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                  activeTab === 'myInvestments' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">💰</span>
                My Investments
              </button>
            )}

            <button
              onClick={() => setActiveTab('settings')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                activeTab === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">⚙️</span>
              Settings
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {activeTab === 'home' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Welcome to your Dashboard</h2>
                <p className="text-gray-600">Select an option from the sidebar to get started.</p>
              </div>
            )}
            {activeTab === 'create' && userInfo?.role === 'founder' && (
              <ProjectForm 
                contract={contract}
                account={account}
                provider={provider}
                signer={signer}
                userRole={userInfo.role}
              />
            )}
            {activeTab === 'browse' && (
              <ProjectList 
                contract={contract}
                account={account}
                provider={provider}
                signer={signer}
                userRole={userInfo?.role}
              />
            )}
            {activeTab === 'myProjects' && userInfo?.role === 'founder' && (
              <MyProjects 
                contract={contract}
                account={account}
              />
            )}
            {activeTab === 'myInvestments' && userInfo?.role === 'investor' && (
              <MyInvestments 
                contract={contract}
                account={account}
              />
            )}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Settings</h2>
                <p className="text-gray-600">Settings page coming soon...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Notifications (Only for founders) */}
        {userInfo?.role === 'founder' && (
          <div className="w-[400px] bg-white shadow-sm flex-shrink-0 overflow-y-auto p-4">
            <Notifications 
              contract={contract}
              account={account}
              userRole={userInfo?.role}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
