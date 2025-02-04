'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { 
  useAppKit, 
  useAppKitAccount, 
  useAppKitNetwork,
  useAppKitProvider,
  useWalletInfo,
} from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { useFight } from './services/useFight';
import { useSolana, TokenType } from './services/useSolana';
import { LiveStream } from './liveStream';
import { FightStatus } from './fightStatus';
import SwapInterface from './ui/swap-interface';
import BettingInterface from './ui/betting-interface';
import CashoutInterface from './ui/cashout-interface';
import ChatBox from '../chatbox/chatbox';
import { BalanceDisplay } from './ui/balance-display';
import { useBalanceManager } from './services/balance-manager';

type ActiveTab = 'bet' | 'deposit' | 'swap' | 'cashout' | 'reset';

const BettingDashboard: React.FC = () => {
  // Reown hooks
  const { open, close } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const { walletInfo } = useWalletInfo();

  // Use the balance manager hook
  const balanceManager = useBalanceManager();

  // Add loading state for AppKit initialization
  const [isAppKitReady, setIsAppKitReady] = useState(false);

  // Add these new state variables
  const [depositAmount, setDepositAmount] = useState('');
  const [solVaultData, setSolVaultData] = useState<any>(null);
  const [solDumbsRate, setSolDumbsRate] = useState<number>(1000); // Update with actual rate
  const [solRaprRate, setSolRaprRate] = useState<number>(100);    // Update with actual rate
  const [minSwapAmount, setMinSwapAmount] = useState<number>(0.1);
  const [maxSwapAmount, setMaxSwapAmount] = useState<number>(10);
  const [raprMultiplier, setRaprMultiplier] = useState<number>(2);

  useEffect(() => {
    if (connection && walletProvider && walletInfo) {
      setIsAppKitReady(true);
    }
  }, [connection, walletProvider, walletInfo]);

  const {
    fightState,
    initializeFightForBetting,
    placeBet,
    startFightAfterBetting,
      handleMintDumbsForWin,
  } = useFight();

  const {
    solBalance,
    balances,
    swapAmount,
    setSwapAmount,
    betAmount,
    setBetAmount,
    odds,
    isLoading,
    handleSwap,
    handleCashOut,
    updateBalancesForFight,
    handleDeposit,
  } = useSolana();

  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('bet');

  // Update balance when wallet connects
  useEffect(() => {
    if (isConnected && address && fightState.activeFightId && fightState.activeFightSecureId && balanceManager) {
      updateBalancesForFight(fightState.activeFightId, fightState.activeFightSecureId);
    }
  }, [
    isConnected, 
    address, 
    fightState.activeFightId, 
    fightState.activeFightSecureId, 
    updateBalancesForFight, 
    balanceManager
  ]);

  const handleInitializeFightForBetting = () => {
    console.log('Initializing fight for betting');
    initializeFightForBetting();
  };

  const handlePlaceBet = async (player: 'player1' | 'player2', tokenType: TokenType) => {
    if (fightState.activeFightId) {
      const amount = parseFloat(betAmount);
      if (isNaN(amount)) {
        console.error('Invalid bet amount');
        alert('Please enter a valid bet amount.');
        return;
      }
      try {
        console.log(`Placing bet for ${player} with amount ${amount} and odds ${odds}`);
        await placeBet(player, amount, tokenType);
        await updateBalancesForFight(fightState.activeFightId, fightState.activeFightSecureId);
      } catch (error) {
        console.error('Error placing bet:', error);
        alert('Failed to place bet. Please try again.');
      }
    } else {
      console.error('No active fight to place a bet on');
      alert('No active fight to place a bet on.');
    }
  };

  const handleStartFight = async () => {
    if (fightState.status === 'betting_open') {
      try {
        console.log('Starting fight after betting');
        await startFightAfterBetting();
        await updateBalancesForFight(fightState.activeFightId, fightState.activeFightSecureId);
      } catch (error) {
        console.error('Error starting fight:', error);
        alert('Failed to start fight. Please try again.');
      }
    } else {
      console.error('Cannot start fight. Betting is not open.');
      alert('Cannot start fight. Betting is not open.');
    }
  };

    // Trigger minting when the fight is completed and the user has won
    useEffect(() => {
        if (fightState.status === 'completed' && fightState.winner && fightState.activeFightSecureId) {
             console.log('Checking for minting DUMBS for win')
            
           handleMintDumbsForWin()

        }
    }, [fightState, handleMintDumbsForWin]);

  useEffect(() => {
    if (fightState.winner) {
      updateBalancesForFight(fightState.activeFightId, fightState.activeFightSecureId);
    }
  }, [fightState.winner, updateBalancesForFight, fightState.activeFightId, fightState.activeFightSecureId]);

  useEffect(() => {
    console.log('Fight state updated:', fightState);
  }, [fightState]);

  useEffect(() => {
    console.log('Rendering LiveStream with:', { 
      activeFightId: fightState.activeFightId, 
      streamUrl: fightState.streamUrl 
    });
  }, [fightState.activeFightId, fightState.streamUrl]);

  useEffect(() => {
    if (fightState.status === 'betting_open') {
      setActiveTab('bet');
    }
  }, [fightState.status]);

  useEffect(() => {
    console.log('Balance update:', {
      free: balances.freeDumbs,
      fightId: fightState.activeFightId,
      secureFightId: fightState.activeFightSecureId 
    });
  }, [balances, fightState.activeFightId, fightState.activeFightSecureId]);


  if (!isAppKitReady) {
    return <div className="container-fluid">
      <div className="betting-dashboard min-h-screen bg-base-200 text-base-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Loading...</h1>
          </div>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="container-fluid">
      <div className="betting-dashboard min-h-screen bg-base-200 text-base-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">
              Sell your SOL to mint FreeDUMBS or Swap it for RAPR
            </h1>
            <h2 className="text-xl">
              Gamble on the Machine in Mortal Kombat II and Win in Life
            </h2>
            
            {/* Wallet Connection */}
            {!isConnected && (
              <button 
                onClick={() => open({ view: 'Connect' })}
                className="btn btn-primary mt-4"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {isConnected && (
            /* Your existing grid layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Stream and Fight Status Column */}
              <div className="lg:col-span-8 space-y-4">
                {/* Live Stream - Fixed size container */}
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body p-0">
                    <div className="w-full" style={{ 
                      aspectRatio: '16/9',
                      minHeight: '600px',  // Add minimum height
                      height: 'calc(100vh - 300px)',  // Responsive height based on viewport
                      maxHeight: '800px'  // Maximum height
                    }}>
                      <LiveStream 
                        fightId={fightState.activeFightId} 
                        streamUrl={fightState.streamUrl || null} 
                        fightStatus={fightState.status}
                      />
                    </div>
                  </div>
                </div>

                {/* Fight Status */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <FightStatus 
                      fightState={fightState}
                    />
                  </div>
                </div>
              </div>

              {/* Betting Controls Column - Add fixed height to match video */}
              <div className="lg:col-span-4">
                <div className="card bg-base-100 shadow-xl sticky" style={{
                  top: '1rem',
                  maxHeight: 'calc(100vh - 2rem)',
                  overflowY: 'auto'
                }}>
                  <div className="card-body p-3">
                    <h2 className="card-title text-lg mb-2">Betting Controls</h2>
                    
                    {/* Balance Stats Grid */}
                    <BalanceDisplay 
                      solBalance={solBalance}
                      balances={{
                        freeDumbs: balances.freeDumbs,
                        Rapr: balances.Rapr || 0,
                      }}
                      odds={odds}
                      raprMultiplier={raprMultiplier}
                    />

                    {/* Action Tabs */}
                    <div className="tabs tabs-boxed mb-2">
                      <a 
                        className={`tab ${activeTab === 'bet' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('bet')}
                      >
                        Bet
                      </a>
                      <a 
                        className={`tab ${activeTab === 'deposit' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('deposit')}
                      >
                        Deposit
                      </a>
                      <a 
                        className={`tab ${activeTab === 'swap' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('swap')}
                      >
                        Swap RAPR
                      </a>
                      <a 
                        className={`tab ${activeTab === 'cashout' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('cashout')}
                      >
                        Cashout
                      </a>
                      {fightState.status === 'completed' && (
                        <a 
                          className={`tab ${activeTab === 'reset' ? 'tab-active' : ''}`}
                          onClick={() => setActiveTab('reset')}
                        >
                          Reset
                        </a>
                      )}
                    </div>

                    {/* Interface Container */}
                    <div className="bg-base-200 rounded-lg p-2">
                      {(activeTab === 'deposit' || activeTab === 'swap') && (
                        <SwapInterface
                          solBalance={solBalance}
                          depositAmount={depositAmount}
                          setDepositAmount={setDepositAmount}
                          swapAmount={swapAmount}
                          setSwapAmount={setSwapAmount}
                          onDeposit={handleDeposit}
                          onSwap={handleSwap}
                          isLoading={isLoading}
                          solDumbsRate={solDumbsRate}
                          solRaprRate={solRaprRate}
                          minDepositAmount={solVaultData?.minDepositAmount || 0.1}
                          maxDepositAmount={solVaultData?.maxDepositAmount || 100}
                        />
                      )}
                      
                      {activeTab === 'bet' && fightState.status === 'betting_open' && (
                        <BettingInterface
                          balances={{
                            freeDumbs: balances.freeDumbs,
                            Rapr: balances.Rapr
                          }}
                          betAmount={betAmount}
                          setBetAmount={setBetAmount}
                          onPlaceBet={handlePlaceBet}
                          isLoading={isLoading}
                          maxBetDumbs={fightState.bets.maxBet}
                          minBetDumbs={fightState.bets.minBet}
                          maxBetRapr={fightState.bets.maxBet}
                          minBetRapr={fightState.bets.minBet}
                          raprMultiplier={raprMultiplier}
                        />
                      )}
                      
                      {activeTab === 'cashout' && (
                        <CashoutInterface
                          onCashOut={handleCashOut}
                          isLoading={isLoading}
                          activeFight={fightState}
                          walletAddress={address?.toString()}
                        />
                      )}

                      {activeTab === 'reset' && (
                        <div className="text-center p-4">
                          <h3 className="font-bold mb-4">Start New Fight</h3>
                          <p className="mb-4 text-sm opacity-70">
                            Ready to gamble on the next fight?
                          </p>
                          <button 
                            onClick={() => {
                              handleInitializeFightForBetting();
                              setActiveTab('bet');
                              setBetAmount('');
                            }}
                            className="btn btn-primary"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Initializing...' : 'Initialize New Fight'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-1 mt-2">
                      {fightState.status === 'no_fight' && (
                        <button 
                          onClick={handleInitializeFightForBetting}
                          className="btn btn-primary btn-sm w-full"
                          disabled={isLoading}
                        >
                          Initialize New Fight
                        </button>
                      )}

                      {fightState.status === 'betting_open' && (
                        <button 
                          onClick={handleStartFight}
                          className="btn btn-primary btn-sm w-full"
                          disabled={isLoading}
                        >
                          Start Fight
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setShowChat(!showChat)}
          className="btn btn-circle btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </button>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-base-100 rounded-lg shadow-xl z-40">
          <div className="h-full flex flex-col">
            <div className="p-2 border-b flex justify-between items-center">
              <h3 className="font-bold">Troll Box</h3>
              <button onClick={() => setShowChat(false)} className="btn btn-sm btn-ghost">×</button>
            </div>
            <div className="flex-grow overflow-hidden">
              <ChatBox />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BettingDashboard;